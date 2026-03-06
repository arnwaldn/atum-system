#!/usr/bin/env node
/**
 * Collective Memory — Stop Hook (Session Retain)
 *
 * At session end:
 *   1. Reads session stats from loop-detector
 *   2. Builds structured knowledge summary
 *   3. Writes markdown file to collective-memory/sessions/{user}/
 *   4. Git add + commit + push (silent on failure)
 *
 * Replaces: hindsight-session-retain.js
 * Exit code: always 0 (never blocks Claude)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const HOME = process.env.HOME || process.env.USERPROFILE || "";
const ATUM_USER = process.env.ATUM_USER || "arnaud";
const TEMP = process.env.TEMP || "/tmp";
const STATS_FILE = path.join(TEMP, "claude-session-stats.json");
const MEMORY_DIR = path.join(HOME, ".claude", "collective-memory");
const SESSIONS_DIR = path.join(MEMORY_DIR, "sessions", ATUM_USER);

function readStdin() {
  try { return fs.readFileSync(0, "utf8"); }
  catch { return "{}"; }
}

function loadStats() {
  try { return JSON.parse(fs.readFileSync(STATS_FILE, "utf8")); }
  catch { return null; }
}

function shortenPath(p) {
  const home = HOME.replace(/\\/g, "/");
  return (p || "")
    .replace(/\\/g, "/")
    .replace(new RegExp("^" + home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "~");
}

function formatDuration(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return mins + "min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + "h" + (m > 0 ? m + "min" : "");
}

function topTools(toolCounts, limit) {
  return Object.entries(toolCounts)
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0, limit)
    .map(function(e) { return e[0] + "(" + e[1] + ")"; })
    .join(", ");
}

function detectTechnologies(filesModified, filesRead, bashCommands) {
  var allPaths = [].concat(filesModified || [], filesRead || []).join(" ").toLowerCase();
  var allCmds = (bashCommands || []).join(" ").toLowerCase();
  var combined = allPaths + " " + allCmds;
  var tags = new Set();
  var TECH_MAP = {
    ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
    ".rs": "Rust", ".go": "Go", ".java": "Java", ".dart": "Dart",
    ".vue": "Vue", ".svelte": "Svelte", ".tsx": "React",
    "flask": "Flask", "django": "Django", "fastapi": "FastAPI",
    "next": "Next.js", "express": "Express", "prisma": "Prisma",
    "docker": "Docker", "terraform": "Terraform", "supabase": "Supabase",
    "pytest": "pytest", "jest": "Jest", "playwright": "Playwright",
    "tailwind": "Tailwind", "postgres": "PostgreSQL", "redis": "Redis",
  };
  for (var pattern in TECH_MAP) {
    if (combined.includes(pattern)) tags.add(TECH_MAP[pattern]);
  }
  return Array.from(tags);
}

function detectSessionCategory(stats) {
  var files = (stats.filesModified || []).map(function(f) { return f.replace(/\\/g, "/").toLowerCase(); });
  var cmds = (stats.bashCommands || []).join(" ").toLowerCase();
  var commits = (stats.commitMessages || []).join(" ").toLowerCase();
  var errors = stats.errorDetails || [];
  var allText = files.join(" ") + " " + cmds + " " + commits;

  var configPatterns = /\.(env|ya?ml|toml|ini|conf|config)\b|dockerfile|docker-compose|\.github\/|settings\.json|tsconfig|package\.json|pyproject|cargo\.toml|\.claude\//;
  var configScore = files.filter(function(f) { return configPatterns.test(f); }).length;
  var debugScore = errors.length + (allText.match(/debug|breakpoint|inspect|console\.log|print\(|traceback|stack trace/g) || []).length;
  var maintScore = (allText.match(/upgrade|update|migrate|refactor|cleanup|deprecat|npm install|pip install|pnpm|yarn add|cargo update/g) || []).length;
  var newFiles = files.filter(function(f) { return !f.includes("test") && !f.includes("spec"); });
  var featScore = (commits.match(/\bfeat\b|\badd\b|\bimplement\b|\bcreate\b|\bnew\b/g) || []).length + (newFiles.length > 3 ? 2 : 0);
  var bizScore = (allText.match(/business|client|tarif|prix|devis|factur|strateg|pipeline|prospect|contrat/g) || []).length;
  var testScore = files.filter(function(f) { return /test|spec|__test__|_test\./.test(f); }).length;

  var scores = { technique: configScore + testScore, feature: featScore, debug: debugScore, maintenance: maintScore, business: bizScore, config: configScore };
  var best = "technique";
  var max = 0;
  for (var cat in scores) {
    if (scores[cat] > max) { max = scores[cat]; best = cat; }
  }
  return best;
}

function detectDecisions(stats) {
  var decisions = [];
  var files = (stats.filesModified || []).map(function(f) { return f.replace(/\\/g, "/"); });
  var commits = stats.commitMessages || [];

  var decisionFiles = {
    "dockerfile": "Docker/containerisation",
    "docker-compose": "Docker orchestration",
    "tsconfig": "TypeScript config",
    "package.json": "dependances Node.js",
    "pyproject.toml": "config Python",
    "cargo.toml": "dependances Rust",
    ".github/workflows": "CI/CD pipeline",
    "settings.json": "config Claude Code",
    ".env": "variables d'environnement",
    "schema.prisma": "schema base de donnees",
    "alembic": "migration base de donnees",
    "migrations/": "migration base de donnees",
  };

  for (var i = 0; i < files.length; i++) {
    var lower = files[i].toLowerCase();
    for (var pattern in decisionFiles) {
      if (lower.includes(pattern)) {
        decisions.push(decisionFiles[pattern]);
        break;
      }
    }
  }

  for (var j = 0; j < commits.length; j++) {
    var cl = commits[j].toLowerCase();
    if (/\b(migrate|switch|replace|adopt|choose|decision|refactor)\b/.test(cl)) {
      decisions.push(commits[j].slice(0, 80));
    }
  }

  return Array.from(new Set(decisions));
}

function buildNarrativeSummary(stats, category) {
  var files = stats.filesModified || [];
  var commits = stats.commitMessages || [];
  var errors = stats.errorDetails || [];
  var cmds = stats.bashCommands || [];
  var parts = [];

  if (commits.length > 0) {
    parts.push(commits.slice(0, 2).map(function(m) { return m.replace(/^(feat|fix|refactor|chore|docs|test|perf|ci):\s*/i, ""); }).join(". "));
  } else if (files.length > 0) {
    var extensions = Array.from(new Set(files.map(function(f) { return f.split(".").pop(); }).filter(Boolean)));
    parts.push("Travail sur " + files.length + " fichier(s) (" + extensions.slice(0, 3).join(", ") + ")");
  }

  if (errors.length > 0 && category === "debug") {
    parts.push(errors.length + " erreur(s) rencontree(s) et resolue(s)");
  }

  if (cmds.some(function(c) { return /deploy|push|ship|release/.test(c); })) {
    parts.push("deploiement effectue");
  }

  return parts.join(". ") || "Session de travail";
}

function buildContent(stats, dateStr, timeStr, duration, shortId, shortProject) {
  var lines = [];
  var category = detectSessionCategory(stats);
  var decisions = detectDecisions(stats);
  var narrative = buildNarrativeSummary(stats, category);

  lines.push("## Session " + category.toUpperCase() + " — " + dateStr + " " + timeStr);
  lines.push("Utilisateur: " + ATUM_USER + " | Duree: " + duration + " | Categorie: " + category + " | Projet: " + (shortProject || "global"));
  lines.push("");
  lines.push("Resume: " + narrative);
  lines.push("");

  lines.push("## Travail effectue");
  if (stats.filesModified && stats.filesModified.length > 0) {
    var shortFiles = stats.filesModified.slice(0, 10).map(function(f) { return shortenPath(f).split("/").pop(); });
    lines.push("Fichiers modifies: " + shortFiles.join(", "));
  }
  if (stats.commitMessages && stats.commitMessages.length > 0) {
    lines.push("Commits: " + stats.commitMessages.map(function(m) { return '"' + m + '"'; }).join(", "));
  }
  if (stats.bashCommands && stats.bashCommands.length > 0) {
    var significant = stats.bashCommands.filter(function(c) {
      return !/^(cd |ls|echo |cat |pwd)/.test(c.trim());
    }).slice(0, 5);
    if (significant.length > 0) {
      lines.push("Commandes cles: " + significant.join(", "));
    }
  }
  lines.push("");

  if (decisions.length > 0) {
    lines.push("## Decisions");
    for (var d = 0; d < decisions.length; d++) {
      lines.push("- " + decisions[d]);
    }
    lines.push("");
  }

  if (stats.errorDetails && stats.errorDetails.length > 0) {
    lines.push("## Apprentissages");
    for (var e = 0; e < stats.errorDetails.length; e++) {
      var err = stats.errorDetails[e];
      lines.push("- ERREUR [" + err.tool + "]: " + err.message);
    }
    lines.push("");
  }

  if (stats.toolCounts) {
    lines.push("Outils: " + topTools(stats.toolCounts, 6));
  }

  var techs = detectTechnologies(stats.filesModified, stats.filesRead, stats.bashCommands);
  if (techs.length > 0) {
    lines.push("Technologies: " + techs.join(", "));
  }

  lines.push("");
  lines.push("Tags: session, " + ATUM_USER + ", " + category + ", " + dateStr.slice(0, 7));

  return { content: lines.join("\n"), category: category };
}

// --- Transactive memory: who knows what ---

var WHO_KNOWS_FILE = path.join(MEMORY_DIR, "who-knows-what.md");

function detectTopics(stats) {
  // Combine all signals to detect what this session was about
  var topics = [];
  var techs = detectTechnologies(stats.filesModified, stats.filesRead, stats.bashCommands);
  var files = (stats.filesModified || []).map(function(f) { return f.replace(/\\/g, "/").toLowerCase(); });
  var cmds = (stats.bashCommands || []).join(" ").toLowerCase();
  var commits = (stats.commitMessages || []).join(" ").toLowerCase();
  var allText = files.join(" ") + " " + cmds + " " + commits;

  // Detect project names from file paths
  var projectPatterns = [
    [/gigroute/i, "GigRoute"],
    [/whatsapp/i, "WhatsApp Bridge"],
    [/claude-code-config/i, "Infrastructure Claude Code"],
    [/collective-memory/i, "Memoire collective"],
    [/atum.audit|agent.owl/i, "ATUM Audit (EU AI Act)"],
    [/scheduler/i, "Scheduler"],
  ];
  for (var i = 0; i < projectPatterns.length; i++) {
    if (projectPatterns[i][0].test(allText)) {
      topics.push(projectPatterns[i][1]);
    }
  }

  // Add technologies as context
  if (techs.length > 0) {
    topics.push(techs.join(", "));
  }

  return topics;
}

function updateWhoKnowsWhat(stats) {
  var topics = detectTopics(stats);
  if (topics.length === 0) return;

  var topicLabel = topics.join(", ");

  try {
    var content = "";
    try { content = fs.readFileSync(WHO_KNOWS_FILE, "utf8"); } catch { /* file doesn't exist yet */ }

    if (!content) {
      // Create initial structure
      content = "# Qui sait quoi — ATUM SAS\nDerniere mise a jour: " + new Date().toISOString().slice(0, 10) + "\n\n## arnaud\n\n## pablo\n\n## wahid\n\n";
    }

    // Find the user's section
    var userHeader = "## " + ATUM_USER;
    var userIndex = content.indexOf(userHeader);
    if (userIndex === -1) {
      // User section doesn't exist — add it
      content += "\n" + userHeader + "\n- " + topicLabel + " — 1 session\n";
    } else {
      // Find the end of user's section (next ## or end of file)
      var sectionStart = userIndex + userHeader.length;
      var nextSection = content.indexOf("\n## ", sectionStart);
      var sectionEnd = nextSection === -1 ? content.length : nextSection;
      var userSection = content.slice(sectionStart, sectionEnd);

      // Check if topic already exists in this user's section
      var updated = false;
      var lines = userSection.split("\n");
      for (var i = 0; i < lines.length; i++) {
        // Check if any main topic from this session matches an existing line
        for (var t = 0; t < topics.length; t++) {
          if (topics[t].length > 3 && lines[i].toLowerCase().includes(topics[t].toLowerCase())) {
            // Update session count
            var countMatch = lines[i].match(/(\d+) session/);
            if (countMatch) {
              var newCount = parseInt(countMatch[1], 10) + 1;
              lines[i] = lines[i].replace(/\d+ session/, newCount + " session");
            }
            updated = true;
            break;
          }
        }
      }

      if (!updated) {
        // Add new topic line
        lines.push("- " + topicLabel + " — 1 session");
      }

      var newSection = lines.join("\n");
      content = content.slice(0, sectionStart) + newSection + content.slice(sectionEnd);
    }

    // Update timestamp
    content = content.replace(/Derniere mise a jour: .+/, "Derniere mise a jour: " + new Date().toISOString().slice(0, 10));

    fs.writeFileSync(WHO_KNOWS_FILE, content);
  } catch { /* best effort — never crash */ }
}

function gitSync(commitMsg) {
  try {
    execFileSync("git", ["add", "-A"], {
      cwd: MEMORY_DIR, timeout: 5000, encoding: "utf8", windowsHide: true, stdio: "pipe",
    });
    execFileSync("git", ["commit", "-m", commitMsg, "--allow-empty"], {
      cwd: MEMORY_DIR, timeout: 5000, encoding: "utf8", windowsHide: true, stdio: "pipe",
    });
    execFileSync("git", ["push"], {
      cwd: MEMORY_DIR, timeout: 15000, encoding: "utf8", windowsHide: true, stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

function main() {
  if (!fs.existsSync(MEMORY_DIR) || !fs.existsSync(path.join(MEMORY_DIR, ".git"))) {
    process.exit(0);
  }

  readStdin(); // consume stdin (required for Stop hooks)

  var stats = loadStats();
  var totalCalls = stats ? stats.totalCalls : 0;

  // Only retain if meaningful work was done (8+ calls)
  if (totalCalls < 8) {
    process.exit(0);
  }

  var sessionId = stats && stats.startedAt
    ? stats.startedAt.toString(36).slice(-6)
    : require("crypto").randomBytes(3).toString("hex");

  var dateStr = new Date().toISOString().slice(0, 10);
  var timeStr = new Date().toISOString().slice(11, 16);
  var duration = stats && stats.startedAt ? formatDuration(Date.now() - stats.startedAt) : "?";
  var shortId = sessionId.slice(0, 8);
  var projectDir = process.env.CLAUDE_PROJECT_DIR || "";
  var shortProject = projectDir ? shortenPath(projectDir) : "global";

  var result = buildContent(stats || {}, dateStr, timeStr, duration, shortId, shortProject);

  // Write session file
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  var fileName = dateStr + "-" + timeStr.replace(":", "") + "-" + shortId + ".md";
  var filePath = path.join(SESSIONS_DIR, fileName);
  fs.writeFileSync(filePath, result.content);

  // Update transactive memory index (who-knows-what)
  updateWhoKnowsWhat(stats || {});

  // Git sync (best-effort)
  var commitMsg = "session " + ATUM_USER + " " + dateStr + " " + result.category;
  gitSync(commitMsg);
}

main();
process.exit(0);

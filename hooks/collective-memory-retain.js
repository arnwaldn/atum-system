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

// Anti-recursion: skip if called from within Haiku enrichment
if (process.env.COLLECTIVE_MEMORY_RETAIN === "1") {
  process.exit(0);
}

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
    [/factur|devis|contrat|client|prospect|kbis|urssaf|tva|impot|tresorerie|comptab|legal|statut.*sas|gouvernance|actionnariat/i, "ATUM Admin"],
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

// --- Thematic files: cumulative knowledge base per topic ---

var STRUCTURED_DIR = path.join(MEMORY_DIR, "structured", "facts");

var TOPIC_MAP = {
  "GigRoute": { slug: "gigroute", label: "GigRoute — App tour manager" },
  "WhatsApp Bridge": { slug: "whatsapp-bridge", label: "WhatsApp Bridge — Go/whatsmeow" },
  "Infrastructure Claude Code": { slug: "claude-code-infra", label: "Infrastructure Claude Code" },
  "Memoire collective": { slug: "memoire-collective", label: "Memoire collective — Systeme de memoire" },
  "ATUM Audit (EU AI Act)": { slug: "atum-audit", label: "ATUM Audit — EU AI Act compliance" },
  "Scheduler": { slug: "scheduler", label: "Scheduler — Taches planifiees" },
  "ATUM Admin": { slug: "atum-admin", label: "ATUM Admin — Gouvernance, clients, finances" },
};

function parseEnrichedSections(enrichedContent) {
  if (!enrichedContent) return { facts: [], decisions: [], errors: [], nextSteps: [], businessImpact: [], resume: "" };

  var sections = { facts: [], decisions: [], errors: [], nextSteps: [], businessImpact: [], resume: "" };
  var currentSection = null;

  var lines = enrichedContent.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    if (/^## Faits/i.test(line)) { currentSection = "facts"; continue; }
    if (/^## Decisions/i.test(line)) { currentSection = "decisions"; continue; }
    if (/^## Erreurs/i.test(line)) { currentSection = "errors"; continue; }
    if (/^## Prochaines/i.test(line)) { currentSection = "nextSteps"; continue; }
    if (/^## Impact/i.test(line)) { currentSection = "businessImpact"; continue; }
    if (/^## Resume/i.test(line)) { currentSection = "resume"; continue; }
    if (/^## (Metadonnees|Session|Travail)/i.test(line)) { currentSection = null; continue; }
    if (/^---/.test(line)) { currentSection = null; continue; }

    if (currentSection === "resume" && line.length > 0) {
      sections.resume = line;
      currentSection = null;
      continue;
    }

    if (currentSection && line.startsWith("- ") && !/^- Aucun$/i.test(line)) {
      sections[currentSection].push(line.replace(/^- /, ""));
    }
  }

  return sections;
}

function updateThematicFile(slug, label, sections, dateStr) {
  var filePath = path.join(STRUCTURED_DIR, slug + ".md");
  var content = "";

  try { content = fs.readFileSync(filePath, "utf8"); } catch { /* file doesn't exist yet */ }

  if (!content) {
    content = "# " + label + "\nDerniere mise a jour: " + dateStr + "\n\n## Faits\n\n## Decisions\n\n## Erreurs resolues\n\nTags: thematic, " + slug + "\n";
  }

  var hasNewContent = false;

  // Append facts
  if (sections.facts.length > 0) {
    var factsMarker = "## Faits";
    var factsIdx = content.indexOf(factsMarker);
    if (factsIdx !== -1) {
      var insertAt = factsIdx + factsMarker.length;
      // Find end of line
      var eol = content.indexOf("\n", insertAt);
      if (eol === -1) eol = content.length;
      var newLines = sections.facts.map(function(f) { return "- [" + dateStr + ", " + ATUM_USER + "] " + f; }).join("\n");
      content = content.slice(0, eol) + "\n" + newLines + content.slice(eol);
      hasNewContent = true;
    }
  }

  // Append decisions
  if (sections.decisions.length > 0) {
    var decisionsMarker = "## Decisions";
    var decisionsIdx = content.indexOf(decisionsMarker);
    if (decisionsIdx !== -1) {
      var insertAt2 = decisionsIdx + decisionsMarker.length;
      var eol2 = content.indexOf("\n", insertAt2);
      if (eol2 === -1) eol2 = content.length;
      var newLines2 = sections.decisions.map(function(d) { return "- [" + dateStr + ", " + ATUM_USER + "] " + d; }).join("\n");
      content = content.slice(0, eol2) + "\n" + newLines2 + content.slice(eol2);
      hasNewContent = true;
    }
  }

  // Append errors
  if (sections.errors.length > 0) {
    var errorsMarker = "## Erreurs resolues";
    var errorsIdx = content.indexOf(errorsMarker);
    if (errorsIdx !== -1) {
      var insertAt3 = errorsIdx + errorsMarker.length;
      var eol3 = content.indexOf("\n", insertAt3);
      if (eol3 === -1) eol3 = content.length;
      var newLines3 = sections.errors.map(function(e) { return "- [" + dateStr + ", " + ATUM_USER + "] " + e; }).join("\n");
      content = content.slice(0, eol3) + "\n" + newLines3 + content.slice(eol3);
      hasNewContent = true;
    }
  }

  if (hasNewContent) {
    // Update timestamp
    content = content.replace(/Derniere mise a jour: .+/, "Derniere mise a jour: " + dateStr);
    fs.mkdirSync(STRUCTURED_DIR, { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  return hasNewContent;
}

function updateAllThematicFiles(stats, enrichedContent, dateStr) {
  var topics = detectTopics(stats);
  if (topics.length === 0) return;

  var sections = parseEnrichedSections(enrichedContent);

  // Fallback: if no enriched content, use basic decisions
  if (sections.facts.length === 0 && sections.decisions.length === 0 && sections.errors.length === 0) {
    var basicDecisions = detectDecisions(stats);
    if (basicDecisions.length > 0) {
      sections.decisions = basicDecisions;
    } else {
      return; // Nothing meaningful to add
    }
  }

  for (var i = 0; i < topics.length; i++) {
    var topic = topics[i];
    var mapping = TOPIC_MAP[topic];
    if (mapping) {
      updateThematicFile(mapping.slug, mapping.label, sections, dateStr);
    }
  }
}

// --- Patterns / Mental Models: recurring learnings with confidence ---

var PATTERNS_DIR = path.join(MEMORY_DIR, "patterns");

var STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "her",
  "was", "one", "our", "out", "les", "des", "une", "que", "pour", "par",
  "dans", "sur", "avec", "pas", "est", "sont", "qui", "aux", "ses", "ces",
  "mais", "plus", "sans", "tout", "fait", "ete", "avoir", "etre", "cette",
]);

function extractKeywords(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9àâäéèêëïôùûüç\-_.]/g, " ")
    .split(/\s+/)
    .filter(function(w) { return w.length >= 3 && !STOP_WORDS.has(w); });
}

function keywordOverlap(keywords1, keywords2) {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  var set2 = new Set(keywords2);
  var matches = keywords1.filter(function(k) { return set2.has(k); });
  // Overlap ratio relative to the shorter list
  var minLen = Math.min(keywords1.length, keywords2.length);
  return matches.length / minLen;
}

function findMatchingPattern(text) {
  var newKeywords = extractKeywords(text);
  if (newKeywords.length < 2) return null;

  var patternFiles;
  try { patternFiles = listMdFiles(PATTERNS_DIR); } catch { return null; }

  var bestMatch = null;
  var bestScore = 0;

  for (var i = 0; i < patternFiles.length; i++) {
    var pf = path.join(PATTERNS_DIR, patternFiles[i]);
    try {
      var content = fs.readFileSync(pf, "utf8");
      // Extract pattern title and lesson
      var titleMatch = content.match(/^# Pattern: (.+)/m);
      var lessonMatch = content.match(/## Lecon\n([\s\S]*?)(?=\n##|\nTags:)/);
      var patternText = (titleMatch ? titleMatch[1] : "") + " " + (lessonMatch ? lessonMatch[1] : "");
      var patternKeywords = extractKeywords(patternText);
      var score = keywordOverlap(newKeywords, patternKeywords);

      if (score > bestScore && score >= 0.4) {
        bestScore = score;
        bestMatch = pf;
      }
    } catch { continue; }
  }

  return bestMatch;
}

function updatePatternConfidence(patternFile, confirmationText, dateStr) {
  try {
    var content = fs.readFileSync(patternFile, "utf8");

    // Increment confidence (max 5)
    var confMatch = content.match(/Confiance: (\d)\/5/);
    if (confMatch) {
      var current = parseInt(confMatch[1], 10);
      var newConf = Math.min(current + 1, 5);
      content = content.replace(/Confiance: \d\/5/, "Confiance: " + newConf + "/5");
      // Update confirmation count in parentheses
      var countMatch = content.match(/\(confirme par (\d+) session/);
      if (countMatch) {
        var newCount = parseInt(countMatch[1], 10) + 1;
        content = content.replace(/\(confirme par \d+ session/, "(confirme par " + newCount + " session");
      }
    }

    // Update last confirmation date
    content = content.replace(/Derniere confirmation: .+/, "Derniere confirmation: " + dateStr);

    // Add new confirmation entry
    var confirmMarker = "## Confirmations";
    var confirmIdx = content.indexOf(confirmMarker);
    if (confirmIdx !== -1) {
      var eol = content.indexOf("\n", confirmIdx + confirmMarker.length);
      if (eol === -1) eol = content.length;
      var entry = "- [" + dateStr + ", " + ATUM_USER + "] " + confirmationText;
      content = content.slice(0, eol) + "\n" + entry + content.slice(eol);
    }

    fs.writeFileSync(patternFile, content);
    return true;
  } catch { return false; }
}

function createPattern(text, category, dateStr) {
  // Generate slug from text
  var slug = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(function(w) { return w.length >= 3 && !STOP_WORDS.has(w); })
    .slice(0, 4)
    .join("-");

  if (!slug || slug.length < 5) return false;

  var fileName = slug + ".md";
  var filePath = path.join(PATTERNS_DIR, fileName);

  // Don't overwrite existing file
  try { if (fs.existsSync(filePath)) return false; } catch { }

  var content = [
    "# Pattern: " + text.slice(0, 100),
    "Confiance: 1/5 (confirme par 1 session)",
    "Derniere confirmation: " + dateStr,
    "",
    "## Lecon",
    text,
    "",
    "## Confirmations",
    "- [" + dateStr + ", " + ATUM_USER + "] Decouverte initiale",
    "",
    "Tags: pattern, " + category + ", " + ATUM_USER,
    "",
  ].join("\n");

  fs.mkdirSync(PATTERNS_DIR, { recursive: true });
  fs.writeFileSync(filePath, content);
  return true;
}

function updatePatterns(sections, dateStr) {
  // Combine errors and facts as pattern candidates
  var candidates = [];

  for (var e = 0; e < sections.errors.length; e++) {
    candidates.push({ text: sections.errors[e], category: "erreur" });
  }
  for (var f = 0; f < sections.facts.length; f++) {
    candidates.push({ text: sections.facts[f], category: "fait" });
  }

  if (candidates.length === 0) return;

  // Limit to 5 most significant candidates per session
  candidates = candidates.slice(0, 5);

  for (var c = 0; c < candidates.length; c++) {
    var candidate = candidates[c];
    var matchingFile = findMatchingPattern(candidate.text);

    if (matchingFile) {
      // Existing pattern — increment confidence
      updatePatternConfidence(matchingFile, candidate.text, dateStr);
    } else {
      // New pattern — create with confidence 1
      createPattern(candidate.text, candidate.category, dateStr);
    }
  }
}

// --- INDEX.md: auto-generated table of contents ---

var INDEX_FILE = path.join(MEMORY_DIR, "INDEX.md");

function extractFirstHeading(filePath) {
  try {
    var text = fs.readFileSync(filePath, "utf8");
    var match = text.match(/^#{1,3}\s+(.+)/m);
    return match ? match[1] : path.basename(filePath, ".md");
  } catch { return path.basename(filePath, ".md"); }
}

function countEntries(filePath) {
  try {
    var text = fs.readFileSync(filePath, "utf8");
    var matches = text.match(/^- \[/gm);
    return matches ? matches.length : 0;
  } catch { return 0; }
}

function extractLastUpdate(filePath) {
  try {
    var text = fs.readFileSync(filePath, "utf8");
    var match = text.match(/Derniere mise a jour: (\S+)/);
    return match ? match[1] : "?";
  } catch { return "?"; }
}

function listMdFiles(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(function(f) { return f.endsWith(".md") && f !== ".gitkeep"; })
      .sort();
  } catch { return []; }
}

function generateIndex(dateStr) {
  var lines = [];
  lines.push("# INDEX — Memoire Collective ATUM");
  lines.push("Genere automatiquement le " + dateStr);
  lines.push("");

  // 1. Thematic files
  var thematicFiles = listMdFiles(STRUCTURED_DIR);
  lines.push("## Fiches thematiques (" + thematicFiles.length + ")");
  if (thematicFiles.length === 0) {
    lines.push("(aucune pour le moment)");
  } else {
    for (var t = 0; t < thematicFiles.length; t++) {
      var tf = path.join(STRUCTURED_DIR, thematicFiles[t]);
      var title = extractFirstHeading(tf);
      var lastUp = extractLastUpdate(tf);
      var count = countEntries(tf);
      lines.push("- **" + thematicFiles[t] + "** — " + title + " (maj: " + lastUp + ", " + count + " entrees)");
    }
  }
  lines.push("");

  // 2. Patterns / Mental Models
  var patternFiles = listMdFiles(PATTERNS_DIR);
  lines.push("## Patterns (" + patternFiles.length + ")");
  if (patternFiles.length === 0) {
    lines.push("(aucun pour le moment)");
  } else {
    for (var p = 0; p < patternFiles.length; p++) {
      var pf = path.join(PATTERNS_DIR, patternFiles[p]);
      var pTitle = extractFirstHeading(pf);
      var confMatch = (function() { try { return fs.readFileSync(pf, "utf8").match(/Confiance: (\d)\/5/); } catch { return null; } })();
      var conf = confMatch ? confMatch[1] + "/5" : "?";
      lines.push("- " + patternFiles[p] + " — " + pTitle.replace("Pattern: ", "") + " (confiance: " + conf + ")");
    }
  }
  lines.push("");

  // 3. Explicit memories per user (was 2)
  lines.push("## Memoires explicites");
  var users = ["arnaud", "pablo", "wahid"];
  for (var u = 0; u < users.length; u++) {
    var userDir = path.join(MEMORY_DIR, "explicit", users[u]);
    var userFiles = listMdFiles(userDir);
    if (userFiles.length > 0) {
      lines.push("### " + users[u] + " (" + userFiles.length + ")");
      for (var uf = 0; uf < userFiles.length; uf++) {
        var efPath = path.join(userDir, userFiles[uf]);
        var efTitle = extractFirstHeading(efPath);
        lines.push("- " + userFiles[uf] + " — " + efTitle);
      }
    }
  }
  lines.push("");

  // 3. Recent sessions (last 10 per user)
  lines.push("## Sessions recentes");
  for (var s = 0; s < users.length; s++) {
    var sessDir = path.join(MEMORY_DIR, "sessions", users[s]);
    var sessFiles = listMdFiles(sessDir);
    if (sessFiles.length > 0) {
      // Sort descending (most recent first), take 10
      sessFiles.sort().reverse();
      var recent = sessFiles.slice(0, 10);
      lines.push("### " + users[s] + " (" + sessFiles.length + " total, " + recent.length + " affichees)");
      for (var sf = 0; sf < recent.length; sf++) {
        // Extract date and time from filename: 2026-03-07-0154-fo445z.md
        var fnMatch = recent[sf].match(/^(\d{4}-\d{2}-\d{2})-(\d{4})-/);
        var dateLabel, timeLabel;
        if (fnMatch) {
          dateLabel = fnMatch[1];
          timeLabel = fnMatch[2].slice(0, 2) + ":" + fnMatch[2].slice(2);
        } else {
          // Non-standard filename (e.g. migrated files)
          var parts = recent[sf].replace(".md", "").split("-");
          dateLabel = parts.slice(0, 3).join("-");
          timeLabel = "?";
        }
        var sfPath = path.join(sessDir, recent[sf]);
        var sfHeading = extractFirstHeading(sfPath);
        // Extract category from heading: "Session TECHNIQUE — 2026-03-07 01:54"
        var catMatch = sfHeading.match(/Session (\w+)/i);
        var cat = catMatch ? catMatch[1].toLowerCase() : "?";
        lines.push("- " + dateLabel + " " + timeLabel + " — " + cat);
      }
    }
  }
  lines.push("");

  // 4. Distilled memories
  var distilledFiles = listMdFiles(path.join(MEMORY_DIR, "distilled"));
  lines.push("## Memoires distillees (" + distilledFiles.length + ")");
  if (distilledFiles.length === 0) {
    lines.push("(aucune pour le moment — generees par le Reflect hebdomadaire)");
  } else {
    for (var d = 0; d < distilledFiles.length; d++) {
      var df = path.join(MEMORY_DIR, "distilled", distilledFiles[d]);
      lines.push("- " + distilledFiles[d] + " — " + extractFirstHeading(df));
    }
  }
  lines.push("");

  // 5. Transactive memory reference
  lines.push("## Transactive Memory");
  lines.push("→ who-knows-what.md");
  lines.push("");

  try {
    fs.writeFileSync(INDEX_FILE, lines.join("\n"));
  } catch { /* best effort */ }
}

// --- Smart project detection from file paths ---

function detectProjectFromFiles(stats, fallbackDir) {
  var allFiles = [].concat(stats.filesModified || [], stats.filesRead || []);
  if (allFiles.length === 0) return fallbackDir ? shortenPath(fallbackDir) : "global";

  // Count occurrences of known project directories
  var projectHits = {};
  var PROJECT_DIRS = [
    [/gigroute[_-]?mobile/i, "GigRoute Mobile (Flutter)"],
    [/tour[_-]?manager/i, "GigRoute (Flask)"],
    [/gigroute/i, "GigRoute"],
    [/whatsapp/i, "WhatsApp Bridge"],
    [/collective-memory/i, "Memoire Collective"],
    [/\.claude[\\/](hooks|scripts|schedules|rules)/i, "Infrastructure Claude Code"],
    [/atum[_-]?audit/i, "ATUM Audit"],
  ];

  for (var i = 0; i < allFiles.length; i++) {
    var fp = allFiles[i].replace(/\\/g, "/");
    for (var j = 0; j < PROJECT_DIRS.length; j++) {
      if (PROJECT_DIRS[j][0].test(fp)) {
        var pName = PROJECT_DIRS[j][1];
        projectHits[pName] = (projectHits[pName] || 0) + 1;
        break; // first match wins per file
      }
    }
  }

  // Return the project with the most file hits
  var bestProject = null;
  var bestCount = 0;
  for (var p in projectHits) {
    if (projectHits[p] > bestCount) {
      bestCount = projectHits[p];
      bestProject = p;
    }
  }

  if (bestProject) return bestProject;

  // Fallback: extract deepest common directory from modified files
  if (fallbackDir && fallbackDir !== "C:\\WINDOWS\\system32" && fallbackDir !== "C:/WINDOWS/system32") {
    return shortenPath(fallbackDir);
  }

  // Last resort: use the most common parent directory from files
  var dirs = (stats.filesModified || []).map(function(f) {
    var parts = f.replace(/\\/g, "/").split("/");
    return parts.length > 3 ? parts.slice(-3, -1).join("/") : parts.slice(0, -1).join("/");
  });
  if (dirs.length > 0) {
    var dirCounts = {};
    for (var d = 0; d < dirs.length; d++) {
      dirCounts[dirs[d]] = (dirCounts[dirs[d]] || 0) + 1;
    }
    var topDir = Object.entries(dirCounts).sort(function(a, b) { return b[1] - a[1]; })[0];
    if (topDir) return topDir[0];
  }

  return "global";
}

// --- Haiku enrichment: extract structured knowledge from session ---

function callHaiku(prompt) {
  try {
    var spawnSync = require("child_process").spawnSync;
    var result = spawnSync("claude", ["-p", "--model", "haiku"], {
      input: prompt,
      timeout: 30000,
      encoding: "utf8",
      windowsHide: true,
      shell: true,
      env: Object.assign({}, process.env, { COLLECTIVE_MEMORY_RETAIN: "1" }),
    });
    return (result.stdout || "").trim();
  } catch {
    return "";
  }
}

function enrichContent(stats, shortProject) {
  var filesModified = (stats.filesModified || []).slice(0, 15).map(function(f) {
    return shortenPath(f).split("/").pop();
  });
  var filesRead = (stats.filesRead || []).slice(0, 10).map(function(f) {
    return shortenPath(f).split("/").pop();
  });
  var commits = (stats.commitMessages || []).slice(0, 5);
  var cmds = (stats.bashCommands || []).filter(function(c) {
    return !/^(cd |ls |echo |cat |pwd|head |tail )/.test(c.trim());
  }).slice(0, 8);
  var errors = (stats.errorDetails || []).slice(0, 5).map(function(e) {
    return e.tool + ": " + (e.message || "").slice(0, 100);
  });

  var prompt = [
    "Tu es la memoire d'equipe d'ATUM SAS (agence dev web/mobile, 3 cofondateurs: Arnaud, Pablo, Wahid).",
    "Analyse ces metadonnees de session et DEDUIS ce qui s'est passe. Tu dois aller au-dela des noms de fichiers :",
    "comprends le CONTEXTE, les DECISIONS et le RESULTAT.",
    "",
    "=== DONNEES DE SESSION ===",
    "Utilisateur: " + ATUM_USER,
    "Projet: " + (shortProject || "global"),
    "Fichiers modifies: " + (filesModified.join(", ") || "aucun"),
    "Fichiers lus: " + (filesRead.join(", ") || "aucun"),
    "Commits: " + (commits.join(" | ") || "aucun"),
    "Commandes: " + (cmds.join(" | ") || "aucune"),
    "Erreurs: " + (errors.join(" | ") || "aucune"),
    "",
    "=== FORMAT DE REPONSE (OBLIGATOIRE, rien d'autre) ===",
    "Si une section est vide, ecris '- Aucun'. Max 25 lignes total.",
    "",
    "## Resume",
    "[1-2 phrases : QUOI a ete fait (resultat concret, pas 'travail sur fichiers') et POURQUOI]",
    "Exemple BON: 'Ajout de l'ecran detail d'un arret de tournee dans l'app mobile GigRoute, avec affichage du lieu et des horaires.'",
    "Exemple MAUVAIS: 'Travail sur 8 fichiers dart'",
    "",
    "## Faits appris",
    "- [fait technique concret, decouverte ou connaissance nouvelle — pas des evidences]",
    "",
    "## Decisions",
    "- [choix fait + POURQUOI ce choix plutot qu'un autre. Si aucune decision explicite, deduire des fichiers modifies]",
    "",
    "## Erreurs resolues",
    "- [probleme precis] → [solution appliquee]",
    "",
    "## Prochaines etapes",
    "- [ce qui reste a faire logiquement apres cette session, deduit du contexte]",
    "",
    "## Impact business",
    "- [Si applicable : impact client, livraison, admin, facturation, legal. Sinon : 'Aucun']",
  ].join("\n");

  var response = callHaiku(prompt);

  // Validate: must contain at least one ## heading and be substantial
  if (response && response.length > 30 && response.includes("## ")) {
    return response;
  }
  return null;
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

  // Adaptive threshold: lower for business/admin sessions (fewer tool calls but high value)
  var earlyCategory = stats ? detectSessionCategory(stats) : "technique";
  var minCalls = (earlyCategory === "business") ? 5 : 8;
  if (totalCalls < minCalls) {
    process.exit(0);
  }

  var sessionId = stats && stats.startedAt
    ? stats.startedAt.toString(36).slice(-6)
    : require("crypto").randomBytes(3).toString("hex");

  var dateStr = new Date().toISOString().slice(0, 10);
  var timeStr = new Date().toISOString().slice(11, 16);
  var duration = stats && stats.startedAt ? formatDuration(Date.now() - stats.startedAt) : "?";
  var shortId = sessionId.slice(0, 8);
  // Smart project detection: scan file paths instead of relying on CLAUDE_PROJECT_DIR
  var projectDir = process.env.CLAUDE_PROJECT_DIR || "";
  var shortProject = detectProjectFromFiles(stats || {}, projectDir);

  var result = buildContent(stats || {}, dateStr, timeStr, duration, shortId, shortProject);

  // Try Haiku enrichment (graceful fallback to basic content)
  var enriched = enrichContent(stats || {}, shortProject);
  var finalContent;

  if (enriched) {
    // Build enriched version: header + Haiku analysis + metadata
    var enrichedSections = parseEnrichedSections(enriched);
    var parts = [];
    parts.push("## Session " + result.category.toUpperCase() + " — " + dateStr + " " + timeStr);
    parts.push("Utilisateur: " + ATUM_USER + " | Duree: " + duration + " | Categorie: " + result.category + " | Projet: " + (shortProject || "global"));
    parts.push("");
    parts.push(enriched);
    parts.push("");
    parts.push("---");
    parts.push("## Metadonnees");
    if (stats.filesModified && stats.filesModified.length > 0) {
      var shortFiles = stats.filesModified.slice(0, 10).map(function(f) { return shortenPath(f).split("/").pop(); });
      parts.push("Fichiers modifies: " + shortFiles.join(", "));
    }
    if (stats.commitMessages && stats.commitMessages.length > 0) {
      parts.push("Commits: " + stats.commitMessages.map(function(m) { return '"' + m + '"'; }).join(", "));
    }
    if (stats.toolCounts) {
      parts.push("Outils: " + topTools(stats.toolCounts, 6));
    }
    var techs = detectTechnologies(stats.filesModified, stats.filesRead, stats.bashCommands);
    if (techs.length > 0) {
      parts.push("Technologies: " + techs.join(", "));
    }
    parts.push("");
    parts.push("Tags: session, " + ATUM_USER + ", " + result.category + ", " + dateStr.slice(0, 7) + ", enriched");
    finalContent = parts.join("\n");
  } else {
    finalContent = result.content;
  }

  // Share enriched data with dashboard sync hook via temp file
  if (enriched) {
    try {
      var enrichedData = {
        resume: enrichedSections ? enrichedSections.resume : "",
        decisions: enrichedSections ? enrichedSections.decisions : [],
        nextSteps: enrichedSections ? enrichedSections.nextSteps : [],
        businessImpact: enrichedSections ? enrichedSections.businessImpact : [],
        project: shortProject,
        category: result.category,
        user: ATUM_USER,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync(
        path.join(TEMP, "claude-session-enriched.json"),
        JSON.stringify(enrichedData, null, 2)
      );
    } catch { /* best effort */ }
  }

  // Write session file
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  var fileName = dateStr + "-" + timeStr.replace(":", "") + "-" + shortId + ".md";
  var filePath = path.join(SESSIONS_DIR, fileName);
  fs.writeFileSync(filePath, finalContent);

  // Update thematic knowledge files (Phase 2)
  updateAllThematicFiles(stats || {}, enriched, dateStr);

  // Update patterns / mental models (Phase 4)
  var sections = parseEnrichedSections(enriched);
  updatePatterns(sections, dateStr);

  // Update transactive memory index (who-knows-what)
  updateWhoKnowsWhat(stats || {});

  // Regenerate INDEX.md (Phase 3)
  generateIndex(dateStr);

  // Git sync (best-effort)
  var commitMsg = "session " + ATUM_USER + " " + dateStr + " " + result.category;
  gitSync(commitMsg);
}

main();
process.exit(0);

#!/usr/bin/env node
/**
 * Collective Memory — SessionStart Hook (v2: bio-inspired)
 *
 * At every session start:
 *   1. Git pull to sync latest memories from all collaborators
 *   2. Detect project context (name, technologies)
 *   3. Score ALL memories by relevance to current context
 *   4. Inject top-5 most relevant + distilled summaries + team activity
 *   5. Increment access counters for injected memories (forgetting curve)
 *   6. Inject who-knows-what transactive index
 *   7. Remind Claude to proactively save important insights
 *
 * Bio-inspired features:
 *   - Contextual retrieval (cue-dependent memory, like smells triggering recall)
 *   - Access tracking (frequently recalled memories resist forgetting)
 *   - Distilled knowledge (episodic → semantic consolidation)
 *   - Transactive memory (who knows what in the team)
 *
 * Exit code: always 0 (never blocks Claude)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const HOME = process.env.HOME || process.env.USERPROFILE || "";
const ATUM_USER = process.env.ATUM_USER || "arnaud";
const MEMORY_DIR = path.join(HOME, ".claude", "collective-memory");
const SESSIONS_DIR = path.join(MEMORY_DIR, "sessions");
const EXPLICIT_DIR = path.join(MEMORY_DIR, "explicit");
const DISTILLED_DIR = path.join(MEMORY_DIR, "distilled");
const STRUCTURED_DIR = path.join(MEMORY_DIR, "structured", "facts");
const PATTERNS_DIR = path.join(MEMORY_DIR, "patterns");
const INDEX_FILE = path.join(MEMORY_DIR, "INDEX.md");
const ACCESS_FILE = path.join(MEMORY_DIR, ".access-counts.json");
const WHO_KNOWS_FILE = path.join(MEMORY_DIR, "who-knows-what.md");

// Topic detection: maps project names to thematic file slugs
const TOPIC_SLUGS = {
  "gigroute": "gigroute",
  "live-tour-manager": "gigroute",
  "whatsapp": "whatsapp-bridge",
  "whatsmeow": "whatsapp-bridge",
  "claude-code-config": "claude-code-infra",
  "collective-memory": "memoire-collective",
  "atum-memory": "memoire-collective",
  "agent-owl": "atum-audit",
  "atum-audit": "atum-audit",
  "scheduler": "scheduler",
};

// --- Git ---

function gitPull() {
  try {
    execFileSync("git", ["pull", "--rebase", "--autostash"], {
      cwd: MEMORY_DIR,
      timeout: 10000,
      encoding: "utf8",
      windowsHide: true,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

// --- Utilities ---

function shortenPath(p) {
  var home = HOME.replace(/\\/g, "/");
  return (p || "")
    .replace(/\\/g, "/")
    .replace(new RegExp("^" + home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "~");
}

function readFirstLines(filePath, maxLines) {
  try {
    var content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").slice(0, maxLines || 5).join("\n");
  } catch {
    return "";
  }
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

// --- File listing ---

function listMemoryFiles(dir) {
  var results = [];
  try {
    var entries = fs.readdirSync(dir);
    for (var i = 0; i < entries.length; i++) {
      var entryPath = path.join(dir, entries[i]);
      var entryStat;
      try { entryStat = fs.statSync(entryPath); } catch { continue; }

      if (entryStat.isDirectory() && entries[i] !== ".git") {
        // User subdirectory
        try {
          var files = fs.readdirSync(entryPath).filter(function(f) { return f.endsWith(".md"); });
          for (var j = 0; j < files.length; j++) {
            var filePath = path.join(entryPath, files[j]);
            try {
              var stat = fs.statSync(filePath);
              results.push({ path: filePath, user: entries[i], file: files[j], mtime: stat.mtimeMs });
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      } else if (entries[i].endsWith(".md")) {
        // Top-level .md file (like distilled/)
        results.push({ path: entryPath, user: "shared", file: entries[i], mtime: entryStat.mtimeMs });
      }
    }
  } catch { /* skip */ }
  return results.sort(function(a, b) { return b.mtime - a.mtime; });
}

// --- Access counts (forgetting curve support) ---

function loadAccessCounts() {
  try {
    return JSON.parse(fs.readFileSync(ACCESS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveAccessCounts(counts) {
  try {
    fs.writeFileSync(ACCESS_FILE, JSON.stringify(counts, null, 2));
  } catch { /* best effort */ }
}

function relPathFromMemory(fullPath) {
  return fullPath.replace(MEMORY_DIR, "").replace(/\\/g, "/").replace(/^\//, "");
}

function incrementAccess(counts, fullPath) {
  var key = relPathFromMemory(fullPath);
  if (!counts[key]) {
    counts[key] = { count: 0, lastAccess: 0 };
  }
  counts[key].count++;
  counts[key].lastAccess = Date.now();
}

// --- Project context detection ---

function detectProjectContext(projectDir) {
  var context = { name: "", technologies: [] };
  if (!projectDir) return context;

  context.name = projectDir.replace(/\\/g, "/").split("/").pop().toLowerCase();

  // Skip generic dirs like system32
  if (context.name === "system32" || context.name === "windows") {
    context.name = "";
    return context;
  }

  // Detect technologies from config files
  var detectors = [
    ["package.json", ["javascript", "node"]],
    ["tsconfig.json", ["typescript"]],
    ["pyproject.toml", ["python"]],
    ["requirements.txt", ["python"]],
    ["Cargo.toml", ["rust"]],
    ["go.mod", ["go"]],
    ["pubspec.yaml", ["dart", "flutter"]],
    ["pom.xml", ["java"]],
    ["Gemfile", ["ruby"]],
    ["composer.json", ["php"]],
  ];

  for (var i = 0; i < detectors.length; i++) {
    try {
      if (fs.existsSync(path.join(projectDir, detectors[i][0]))) {
        context.technologies = context.technologies.concat(detectors[i][1]);
      }
    } catch { /* skip */ }
  }

  // Enrich from package.json dependencies
  try {
    var pkg = JSON.parse(fs.readFileSync(path.join(projectDir, "package.json"), "utf8"));
    var allDeps = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {}));
    var frameworks = [
      ["next", "nextjs"], ["react", "react"], ["vue", "vue"],
      ["svelte", "svelte"], ["express", "express"], ["fastify", "fastify"],
      ["tailwindcss", "tailwind"], ["prisma", "prisma"], ["@supabase", "supabase"],
    ];
    for (var f = 0; f < frameworks.length; f++) {
      if (allDeps.some(function(d) { return d.includes(frameworks[f][0]); })) {
        context.technologies.push(frameworks[f][1]);
      }
    }
  } catch { /* not a node project */ }

  // Enrich from pyproject.toml (rough check)
  try {
    var pyproject = fs.readFileSync(path.join(projectDir, "pyproject.toml"), "utf8").toLowerCase();
    var pyFrameworks = [
      ["flask", "flask"], ["django", "django"], ["fastapi", "fastapi"],
      ["sqlalchemy", "sqlalchemy"], ["alembic", "alembic"],
    ];
    for (var p = 0; p < pyFrameworks.length; p++) {
      if (pyproject.includes(pyFrameworks[p][0])) {
        context.technologies.push(pyFrameworks[p][1]);
      }
    }
  } catch { /* skip */ }

  // Deduplicate
  context.technologies = Array.from(new Set(context.technologies));
  return context;
}

// --- Relevance scoring (contextual retrieval) ---

function scoreRelevance(memFile, content, projectContext) {
  var score = 0;
  var lower = content.toLowerCase();

  // Project name match: +5
  if (projectContext.name && lower.includes(projectContext.name)) {
    score += 5;
  }

  // Technology match: +3 per tech (capped at 9)
  var techHits = 0;
  for (var i = 0; i < projectContext.technologies.length; i++) {
    if (lower.includes(projectContext.technologies[i])) techHits++;
  }
  score += Math.min(techHits * 3, 9);

  // Recency: +2 if <7 days, +1 if <30 days
  var ageMs = Date.now() - memFile.mtime;
  if (ageMs < 7 * 86400000) score += 2;
  else if (ageMs < 30 * 86400000) score += 1;

  // Same user: +1
  if (memFile.user === ATUM_USER) score += 1;

  // Explicit memories get a small bonus (they're manually curated)
  if (memFile.path.includes("explicit")) score += 1;

  // Distilled summaries are always valuable
  if (memFile.path.includes("distilled")) score += 2;

  return score;
}

function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  var words1 = text1.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 3; });
  var words2 = text2.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 3; });
  var set1 = {};
  var set2 = {};
  for (var i = 0; i < words1.length; i++) set1[words1[i]] = true;
  for (var j = 0; j < words2.length; j++) set2[words2[j]] = true;
  var intersection = 0;
  var keys1 = Object.keys(set1);
  for (var k = 0; k < keys1.length; k++) {
    if (set2[keys1[k]]) intersection++;
  }
  var union = Object.keys(Object.assign({}, set1, set2)).length;
  return union > 0 ? intersection / union : 0;
}

function applyMMRRanking(scored, lambda) {
  if (scored.length <= 1) return scored;
  lambda = lambda || 0.5;
  var selected = [scored[0]]; // Always keep the most relevant
  var remaining = scored.slice(1);

  while (selected.length < 5 && remaining.length > 0) {
    var bestIdx = -1;
    var bestMMR = -Infinity;

    for (var i = 0; i < remaining.length; i++) {
      var relevance = remaining[i].score;
      var maxSim = 0;
      for (var j = 0; j < selected.length; j++) {
        var sim = calculateTextSimilarity(remaining[i].summary, selected[j].summary);
        if (sim > maxSim) maxSim = sim;
      }
      var mmrScore = lambda * relevance - (1 - lambda) * maxSim * 10;
      if (mmrScore > bestMMR) {
        bestMMR = mmrScore;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    } else {
      break;
    }
  }

  return selected;
}

function getRelevantMemories(projectContext, accessCounts) {
  // Gather ALL memories from sessions, explicit, and distilled
  var allFiles = []
    .concat(listMemoryFiles(SESSIONS_DIR))
    .concat(listMemoryFiles(EXPLICIT_DIR))
    .concat(listMemoryFiles(DISTILLED_DIR));

  // Score each memory
  var scored = [];
  for (var i = 0; i < allFiles.length; i++) {
    var content = readFileContent(allFiles[i].path);
    if (!content) continue;
    var score = scoreRelevance(allFiles[i], content, projectContext);
    var header = readFirstLines(allFiles[i].path, 4);
    var summary = header.replace(/^#+\s*/gm, "").replace(/\n/g, " ").slice(0, 150);
    scored.push({
      file: allFiles[i],
      score: score,
      summary: summary,
    });
  }

  // Sort by score (highest first), take top 5
  scored.sort(function(a, b) { return b.score - a.score; });
  // Apply MMR to diversify results (avoid 5 memories about the same topic)
  var top = applyMMRRanking(scored, 0.5);

  // Increment access counts for injected memories
  for (var j = 0; j < top.length; j++) {
    incrementAccess(accessCounts, top[j].file.path);
  }

  return top;
}

// --- Team activity ---

function getRecentTeamActivity(hoursBack) {
  var cutoff = Date.now() - hoursBack * 3600 * 1000;
  var files = listMemoryFiles(SESSIONS_DIR);
  return files
    .filter(function(f) { return f.mtime > cutoff && f.user !== ATUM_USER; })
    .slice(0, 5)
    .map(function(f) {
      var header = readFirstLines(f.path, 3);
      var summary = header.replace(/^#+\s*/gm, "").replace(/\n/g, " ").slice(0, 150);
      return f.user + ": " + summary;
    });
}

// --- Strategic decisions ---

function getStrategicDecisions() {
  var files = listMemoryFiles(EXPLICIT_DIR);
  var decisions = [];
  var keywords = /\b(decision|strateg|tarif|business|client|pipeline|convention|choix)\b/i;

  for (var i = 0; i < files.length; i++) {
    try {
      var content = fs.readFileSync(files[i].path, "utf8");
      if (keywords.test(content)) {
        var header = readFirstLines(files[i].path, 4);
        var summary = header.replace(/^#+\s*/gm, "").replace(/\n/g, " ").slice(0, 150);
        decisions.push(summary);
      }
    } catch { /* skip */ }
    if (decisions.length >= 4) break;
  }

  // Also check session files for detected decisions
  var sessions = listMemoryFiles(SESSIONS_DIR).slice(0, 20);
  for (var j = 0; j < sessions.length; j++) {
    if (decisions.length >= 6) break;
    try {
      var sessionContent = fs.readFileSync(sessions[j].path, "utf8");
      var decisionSection = sessionContent.match(/## Decisions\n([\s\S]*?)(?:\n##|\n$|$)/);
      if (decisionSection) {
        var items = decisionSection[1].trim().split("\n").filter(function(l) { return l.startsWith("- "); });
        for (var k = 0; k < items.length; k++) {
          decisions.push(sessions[j].user + ": " + items[k].slice(2).slice(0, 100));
          if (decisions.length >= 6) break;
        }
      }
    } catch { /* skip */ }
  }
  return decisions;
}

// --- Who knows what (transactive memory) ---

function getWhoKnowsWhat() {
  try {
    var content = fs.readFileSync(WHO_KNOWS_FILE, "utf8");
    // Extract just the user sections (skip header)
    var lines = content.split("\n");
    var summary = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.startsWith("## ") || (line.startsWith("- ") && line.length > 5)) {
        summary.push(line.replace(/^## /, "").replace(/^- /, "  "));
      }
    }
    return summary.slice(0, 12).join(" | ");
  } catch {
    return "";
  }
}

// --- Phase 5: Thematic context + High-confidence patterns ---

function detectTopicSlug(projectContext) {
  // Match project name to a thematic file slug
  if (!projectContext.name) return null;
  var name = projectContext.name.toLowerCase();

  // Direct match
  if (TOPIC_SLUGS[name]) return TOPIC_SLUGS[name];

  // Partial match
  for (var key in TOPIC_SLUGS) {
    if (name.includes(key) || key.includes(name)) {
      return TOPIC_SLUGS[key];
    }
  }
  return null;
}

function loadThematicContext(projectContext) {
  var slug = detectTopicSlug(projectContext);
  if (!slug) return null;

  var filePath = path.join(STRUCTURED_DIR, slug + ".md");
  try {
    var content = fs.readFileSync(filePath, "utf8");
    // Extract just the entries (facts, decisions, errors) — skip header and tags
    var lines = content.split("\n");
    var entries = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.startsWith("- [")) {
        entries.push(line.replace(/^- \[\d{4}-\d{2}-\d{2}, \w+\] /, ""));
      }
    }
    if (entries.length === 0) return null;

    // Return most recent entries (max 8)
    return {
      slug: slug,
      title: (content.match(/^# (.+)/m) || ["", slug])[1],
      entries: entries.slice(0, 8),
    };
  } catch { return null; }
}

function loadHighConfidencePatterns(minConfidence) {
  var results = [];
  try {
    var files = fs.readdirSync(PATTERNS_DIR)
      .filter(function(f) { return f.endsWith(".md") && f !== ".gitkeep"; });

    for (var i = 0; i < files.length; i++) {
      try {
        var content = fs.readFileSync(path.join(PATTERNS_DIR, files[i]), "utf8");
        var confMatch = content.match(/Confiance: (\d)\/5/);
        if (!confMatch) continue;

        var confidence = parseInt(confMatch[1], 10);
        if (confidence < minConfidence) continue;

        var titleMatch = content.match(/^# Pattern: (.+)/m);
        if (titleMatch) {
          results.push({
            title: titleMatch[1].slice(0, 80),
            confidence: confidence,
          });
        }
      } catch { continue; }
    }
  } catch { /* patterns dir may not exist yet */ }

  // Sort by confidence descending
  results.sort(function(a, b) { return b.confidence - a.confidence; });
  return results.slice(0, 5);
}

function countThematicFiles() {
  try {
    return fs.readdirSync(STRUCTURED_DIR)
      .filter(function(f) { return f.endsWith(".md"); }).length;
  } catch { return 0; }
}

function countPatterns() {
  try {
    return fs.readdirSync(PATTERNS_DIR)
      .filter(function(f) { return f.endsWith(".md"); }).length;
  } catch { return 0; }
}

// --- Counts ---

function countMemories() {
  var sessions = listMemoryFiles(SESSIONS_DIR).length;
  var explicit = listMemoryFiles(EXPLICIT_DIR).length;
  var distilled = listMemoryFiles(DISTILLED_DIR).length;
  return {
    sessions: sessions,
    explicit: explicit,
    distilled: distilled,
    total: sessions + explicit + distilled,
  };
}

// --- Main ---

function main() {
  if (!fs.existsSync(MEMORY_DIR) || !fs.existsSync(path.join(MEMORY_DIR, ".git"))) {
    process.exit(0);
  }

  var synced = gitPull();
  var counts = countMemories();
  var projectDir = process.env.CLAUDE_PROJECT_DIR || "";
  var projectContext = detectProjectContext(projectDir);
  var accessCounts = loadAccessCounts();

  var parts = [];

  var thematicCount = countThematicFiles();
  var patternCount = countPatterns();

  // 1. Sync status (enriched with v3 stats)
  if (synced) {
    parts.push("[Memoire collective] Synced — " + counts.total + " memoires (" + counts.sessions + " sessions, " + counts.explicit + " explicites, " + counts.distilled + " distillees)");
  } else {
    parts.push("[Memoire collective] Offline (git pull echoue) — " + counts.total + " memoires locales");
  }

  // 2. Thematic context (Phase 5 — targeted recall)
  var thematic = loadThematicContext(projectContext);
  if (thematic) {
    parts.push("Connaissances " + thematic.title + ": " + thematic.entries.join(" | "));
  }

  // 3. High-confidence patterns (Phase 5 — learned reflexes)
  var patterns = loadHighConfidencePatterns(2);
  if (patterns.length > 0) {
    var patternSummaries = patterns.map(function(p) { return "[" + p.confidence + "/5] " + p.title; });
    parts.push("Patterns acquis: " + patternSummaries.join(" | "));
  }

  // 4. Recent team activity (48h)
  var team = getRecentTeamActivity(48);
  if (team.length > 0) {
    parts.push("Equipe (48h): " + team.join(" | "));
  }

  // 5. Relevant memories (contextual retrieval — complements thematic)
  var relevant = getRelevantMemories(projectContext, accessCounts);
  if (relevant.length > 0) {
    var label = projectContext.name
      ? "Memoires pertinentes (" + projectContext.name + ")"
      : "Memoires recentes";
    var summaries = relevant.map(function(r) {
      return r.summary;
    });
    parts.push(label + ": " + summaries.join(" | "));
  }

  // 6. Strategic decisions (from explicit memories)
  var decisions = getStrategicDecisions();
  if (decisions.length > 0) {
    parts.push("Decisions/strategie: " + decisions.slice(0, 3).join(" | "));
  }

  // 7. Who knows what (transactive memory)
  var whoKnows = getWhoKnowsWhat();
  if (whoKnows) {
    parts.push("Expertise equipe: " + whoKnows);
  }

  // 8. Save updated access counts
  saveAccessCounts(accessCounts);

  // 9. Reminder
  parts.push("Rappel: sauvegarde les insights importants dans ~/.claude/collective-memory/explicit/" + ATUM_USER + "/");

  var output = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: parts.join(". "),
    },
  };

  console.log(JSON.stringify(output));
}

main();
process.exit(0);

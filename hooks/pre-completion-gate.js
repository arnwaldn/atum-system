#!/usr/bin/env node
/**
 * Pre-Completion Gate (Stop hook)
 *
 * Deterministic verification that build/tests pass before allowing
 * Claude to complete a session where source files were modified.
 *
 * Reads session stats from loop-detector to know which files were modified.
 * Detects project test runner (jest/vitest/pytest/cargo) and runs tests.
 * Blocks completion if tests fail.
 *
 * Exemptions (does NOT block):
 * - No source files modified (config/docs only)
 * - No test runner found in project
 * - No test files exist in project
 * - Session too short (< 5 tool calls)
 * - Test runner times out (30s)
 * - Project dir cannot be determined
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const TEMP = process.env.TEMP || "/tmp";
const STATS_FILE = path.join(TEMP, "claude-session-stats.json");
const TEST_TIMEOUT = 30000; // 30 seconds max
const MIN_TOOL_CALLS = 5;

const SOURCE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go", ".java", ".dart",
  ".vue", ".svelte", ".php",
]);

function readStdin() {
  try { return fs.readFileSync(0, "utf8"); } catch { return "{}"; }
}

function loadStats() {
  try { return JSON.parse(fs.readFileSync(STATS_FILE, "utf8")); } catch { return null; }
}

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function hasSourceFiles(filesModified) {
  return filesModified.some(function (f) {
    return SOURCE_EXTENSIONS.has(path.extname(f).toLowerCase());
  });
}

/**
 * Detect the project root from modified files.
 * Walk up from the most commonly modified directory to find package.json/pyproject.toml/Cargo.toml.
 */
function detectProjectRoot(filesModified) {
  if (filesModified.length === 0) return null;

  // Count directory occurrences to find the most common parent
  var dirCounts = {};
  for (var i = 0; i < filesModified.length; i++) {
    var dir = path.dirname(filesModified[i]);
    dirCounts[dir] = (dirCounts[dir] || 0) + 1;
  }

  // Sort by count, take the most common
  var dirs = Object.entries(dirCounts).sort(function (a, b) { return b[1] - a[1]; });
  var startDir = dirs[0][0];

  // Walk up looking for project markers
  var markers = ["package.json", "pyproject.toml", "Cargo.toml", "go.mod", "requirements.txt"];
  var dir = startDir;
  var root = path.parse(dir).root;
  while (dir !== root) {
    for (var m = 0; m < markers.length; m++) {
      if (fileExists(path.join(dir, markers[m]))) return dir;
    }
    var parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

/**
 * Detect test runner and command for a project root.
 * Returns { cmd, name } or null.
 */
function detectTestRunner(projectRoot) {
  // Node.js projects
  var pkgPath = path.join(projectRoot, "package.json");
  if (fileExists(pkgPath)) {
    try {
      var pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      var deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
      var scripts = pkg.scripts || {};

      if (deps.vitest) return { cmd: "npx vitest run --reporter=verbose 2>&1 | tail -20", name: "vitest" };
      if (deps.jest) return { cmd: "npx jest --no-coverage --forceExit 2>&1 | tail -20", name: "jest" };
      if (scripts.test && scripts.test !== "echo \"Error: no test specified\" && exit 1") {
        return { cmd: "npm test 2>&1 | tail -20", name: "npm test" };
      }
    } catch {}
  }

  // Python projects
  if (fileExists(path.join(projectRoot, "pyproject.toml")) || fileExists(path.join(projectRoot, "requirements.txt"))) {
    if (dirExists(path.join(projectRoot, "tests")) || dirExists(path.join(projectRoot, "test"))) {
      return { cmd: "python -m pytest --tb=short -q 2>&1 | tail -20", name: "pytest" };
    }
  }

  // Rust projects
  if (fileExists(path.join(projectRoot, "Cargo.toml"))) {
    return { cmd: "cargo test 2>&1 | tail -20", name: "cargo test" };
  }

  // Go projects
  if (fileExists(path.join(projectRoot, "go.mod"))) {
    return { cmd: "go test ./... 2>&1 | tail -20", name: "go test" };
  }

  return null;
}

/**
 * Run tests and return { passed, output }.
 */
function runTests(cmd, projectRoot) {
  try {
    var output = execSync(cmd, {
      cwd: projectRoot,
      timeout: TEST_TIMEOUT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: Object.assign({}, process.env, { CI: "true", FORCE_COLOR: "0" }),
    });
    return { passed: true, output: output.trim() };
  } catch (e) {
    var stderr = (e.stderr || "").toString().trim();
    var stdout = (e.stdout || "").toString().trim();
    return { passed: false, output: stderr || stdout || e.message };
  }
}

// --- Main ---
try {
  readStdin(); // consume stdin (required for Stop hooks)

  var stats = loadStats();
  if (!stats) process.exit(0);

  // Exemption: session too short
  if (stats.totalCalls < MIN_TOOL_CALLS) process.exit(0);

  var filesModified = stats.filesModified || [];

  // Exemption: no source files modified
  if (!hasSourceFiles(filesModified)) process.exit(0);

  var projectRoot = detectProjectRoot(filesModified);
  if (!projectRoot) process.exit(0);

  var runner = detectTestRunner(projectRoot);
  // Exemption: no test runner found
  if (!runner) process.exit(0);

  var result = runTests(runner.cmd, projectRoot);

  if (!result.passed) {
    var output = {
      decision: "block",
      reason: [
        `[PRE-COMPLETION GATE] Tests en échec (${runner.name}).`,
        "",
        "Output:",
        result.output.slice(0, 500),
        "",
        "Corrige les tests avant de terminer. Un dev senior ne livre jamais avec des tests cassés.",
      ].join("\n"),
    };
    process.stdout.write(JSON.stringify(output));
  }
  // If tests pass, output nothing — allow normal completion
} catch {
  // Hook must never block on internal errors — fail open
  process.exit(0);
}

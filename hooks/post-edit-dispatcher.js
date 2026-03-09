#!/usr/bin/env node
/**
 * PostToolUse Smart Dispatcher (Edit|Write)
 * Single process that conditionally runs sub-tasks based on project context.
 *
 * Replaces 4 separate hooks:
 * - auto-format.sh (prettier/biome)
 * - typecheck.sh (tsc/pyright)
 * - auto-test-runner.js (jest/pytest/vitest)
 * - dependency-checker.py (missing imports)
 *
 * Keeps separate: atum-post-write.py (ATUM-specific), loop-detector.js (matcher *)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "{}";
  }
}

function fileExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function findUp(startDir, filename) {
  let dir = startDir;
  const root = path.parse(dir).root;
  while (dir !== root) {
    const candidate = path.join(dir, filename);
    if (fileExists(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function run(cmd, cwd, timeoutMs) {
  try {
    const result = execSync(cmd, {
      cwd,
      timeout: timeoutMs || 10000,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: Object.assign({}, process.env, { FORCE_COLOR: "0" }),
    });
    return { ok: true, output: result.trim() };
  } catch (e) {
    var stderr = (e.stderr || "").toString().trim();
    var stdout = (e.stdout || "").toString().trim();
    return { ok: false, output: stderr || stdout || e.message };
  }
}

try {
  var input = JSON.parse(readStdin());
  var toolInput = input.tool_input || {};
  var filePath = toolInput.file_path || "";

  if (!filePath) process.exit(0);

  var ext = path.extname(filePath).toLowerCase();
  var dir = path.dirname(filePath);
  var results = [];

  // --- 1. Auto-Format ---
  var prettierRc = findUp(dir, ".prettierrc") || findUp(dir, ".prettierrc.json") || findUp(dir, ".prettierrc.js");
  var biomeJson = findUp(dir, "biome.json") || findUp(dir, "biome.jsonc");

  if ([".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".html", ".md", ".vue", ".svelte"].indexOf(ext) !== -1) {
    if (biomeJson) {
      var r = run("npx biome format --write \"" + filePath + "\"", dir, 8000);
      if (!r.ok) results.push("[format] biome: " + r.output.slice(0, 200));
    } else if (prettierRc) {
      var r = run("npx prettier --write \"" + filePath + "\"", dir, 8000);
      if (!r.ok) results.push("[format] prettier: " + r.output.slice(0, 200));
    }
  } else if (ext === ".py") {
    var ruffToml = findUp(dir, "ruff.toml") || findUp(dir, "pyproject.toml");
    if (ruffToml) {
      var r = run("ruff format \"" + filePath + "\"", dir, 5000);
      if (!r.ok) results.push("[format] ruff: " + r.output.slice(0, 200));
    }
  }

  // --- 2. Type Check ---
  if ([".ts", ".tsx"].indexOf(ext) !== -1) {
    var tsconfig = findUp(dir, "tsconfig.json");
    if (tsconfig) {
      var projectDir = path.dirname(tsconfig);
      var basename_file = path.basename(filePath);
      var r = run("npx tsc --noEmit --pretty false 2>&1 | head -20", projectDir, 12000);
      if (!r.ok && r.output) {
        var relevantErrors = r.output
          .split("\n")
          .filter(function(line) { return line.indexOf(basename_file) !== -1; })
          .slice(0, 5)
          .join("\n");
        if (relevantErrors) {
          results.push("[typecheck] " + relevantErrors);
        }
      }
    }
  } else if (ext === ".py") {
    var pyrightConfig = findUp(dir, "pyrightconfig.json");
    if (pyrightConfig) {
      var r = run("pyright \"" + filePath + "\" 2>&1 | tail -5", dir, 10000);
      if (!r.ok && r.output && /error/i.test(r.output)) {
        results.push("[typecheck] " + r.output.slice(0, 300));
      }
    }
  }

  // --- 3. Related Tests ---
  var basename = path.basename(filePath, ext);
  var testPatterns = [
    basename + ".test" + ext,
    basename + ".spec" + ext,
    basename + "_test" + ext,
    "test_" + basename + ext,
  ];

  var testFile = null;
  var testDirs = [dir, path.join(dir, "__tests__"), path.join(dir, "tests"), path.join(dir, "..", "tests"), path.join(dir, "..", "__tests__")];
  for (var i = 0; i < testDirs.length; i++) {
    for (var j = 0; j < testPatterns.length; j++) {
      var candidate = path.join(testDirs[i], testPatterns[j]);
      if (fileExists(candidate)) {
        testFile = candidate;
        break;
      }
    }
    if (testFile) break;
  }

  if (testFile) {
    var packageJson = findUp(dir, "package.json");
    var pyprojectToml = findUp(dir, "pyproject.toml");

    if ([".ts", ".tsx", ".js", ".jsx"].indexOf(ext) !== -1 && packageJson) {
      try {
        var pkg = JSON.parse(fs.readFileSync(packageJson, "utf8"));
        var deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
        var cmd;
        if (deps.vitest) cmd = "npx vitest run \"" + testFile + "\" --reporter=verbose 2>&1 | tail -15";
        else if (deps.jest) cmd = "npx jest \"" + testFile + "\" --no-coverage 2>&1 | tail -15";
        if (cmd) {
          var r = run(cmd, path.dirname(packageJson), 15000);
          if (!r.ok) {
            results.push("[test] FAIL: " + r.output.slice(0, 300));
          }
        }
      } catch (e) { /* skip */ }
    } else if (ext === ".py" && pyprojectToml) {
      var r = run("python -m pytest \"" + testFile + "\" -x --tb=short 2>&1 | tail -15", dir, 15000);
      if (!r.ok && r.output) {
        results.push("[test] FAIL: " + r.output.slice(0, 300));
      }
    }
  }

  // --- Output via hook protocol ---
  if (results.length > 0) {
    var context = "AUTO-CHECK FAILED — Fix these before continuing:\n" + results.join("\n");
    var output = {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: context
      }
    };
    console.log(JSON.stringify(output));
  }
} catch (e) {
  // Hook must never block
  process.exit(0);
}

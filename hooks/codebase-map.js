#!/usr/bin/env node
/**
 * Codebase Map Injection Hook
 * Generates and injects a structural map of the current project at session start.
 * Saves tokens by providing context upfront instead of exploring.
 *
 * Inspired by claudekit codebase-map pattern.
 */

const fs = require("fs");
const path = require("path");

// Patterns to ignore when scanning
const IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  ".cache",
  ".vscode",
  ".idea",
  "__pycache__",
  ".pytest_cache",
  ".venv",
  "venv",
  "env",
  ".env",
  "coverage",
  ".nyc_output",
  "*.log",
  "*.lock",
  ".DS_Store",
  "Thumbs.db"
];

// File extensions to analyze for exports
const CODE_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx",
  ".py", ".pyw",
  ".java", ".kt",
  ".cs",
  ".go",
  ".rs",
  ".php",
  ".rb",
  ".swift",
  ".dart"
];

// Maximum depth for directory tree
const MAX_DEPTH = 3;

// Maximum tokens to inject (approximately)
const MAX_TOKENS = 2000;

function shouldIgnore(filepath) {
  const basename = path.basename(filepath);
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace("*", ".*"));
      return regex.test(basename);
    }
    return basename === pattern || filepath.includes(`/${pattern}/`);
  });
}

function generateTree(dir, depth = 0, prefix = "") {
  if (depth > MAX_DEPTH) return "";

  let output = "";

  try {
    const items = fs.readdirSync(dir).filter(item => !shouldIgnore(item));

    items.forEach((item, index) => {
      const itemPath = path.join(dir, item);
      const isLast = index === items.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const extension = isLast ? "    " : "│   ";

      try {
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          output += `${prefix}${connector}${item}/\n`;
          // Recurse into directory
          if (depth < MAX_DEPTH) {
            output += generateTree(itemPath, depth + 1, prefix + extension);
          }
        } else if (stats.isFile()) {
          const ext = path.extname(item);
          const size = stats.size;
          const sizeStr = size < 1024 ? `${size}B` :
                          size < 1024*1024 ? `${Math.round(size/1024)}KB` :
                          `${Math.round(size/1024/1024)}MB`;

          // Mark code files
          if (CODE_EXTENSIONS.includes(ext)) {
            output += `${prefix}${connector}${item} (${sizeStr}) ✓\n`;
          } else {
            output += `${prefix}${connector}${item} (${sizeStr})\n`;
          }
        }
      } catch (e) {
        // Skip files we can't access
      }
    });
  } catch (e) {
    // Skip directories we can't access
  }

  return output;
}

function extractMainExports(dir) {
  const exports = [];

  function scanDir(currentDir, depth = 0) {
    if (depth > 2) return; // Don't go too deep

    try {
      const items = fs.readdirSync(currentDir).filter(item => !shouldIgnore(item));

      items.forEach(item => {
        const itemPath = path.join(currentDir, item);

        try {
          const stats = fs.statSync(itemPath);

          if (stats.isDirectory() && depth < 2) {
            scanDir(itemPath, depth + 1);
          } else if (stats.isFile()) {
            const ext = path.extname(item);

            // Check for main entry points
            if (item === "index.js" || item === "index.ts" ||
                item === "main.js" || item === "main.ts" ||
                item === "app.js" || item === "app.ts" ||
                item === "__init__.py" || item === "main.py" ||
                item === "app.py" || item === "server.py") {

              const relPath = path.relative(dir, itemPath);
              exports.push(`• ${relPath} (entry point)`);

              // Try to extract main exports (simplified)
              try {
                const content = fs.readFileSync(itemPath, "utf8");
                const lines = content.split("\n").slice(0, 50); // First 50 lines

                // JavaScript/TypeScript exports
                if (ext === ".js" || ext === ".ts" || ext === ".jsx" || ext === ".tsx") {
                  lines.forEach(line => {
                    if (line.match(/^export\s+(default\s+)?(function|class|const|interface|type)\s+(\w+)/)) {
                      const match = line.match(/(\w+)/g);
                      if (match && match.length > 2) {
                        exports.push(`  - ${match[match.length - 1]}`);
                      }
                    }
                  });
                }

                // Python exports
                if (ext === ".py") {
                  lines.forEach(line => {
                    if (line.match(/^(class|def)\s+(\w+)/)) {
                      const match = line.match(/^(class|def)\s+(\w+)/);
                      if (match) {
                        exports.push(`  - ${match[2]} (${match[1]})`);
                      }
                    }
                  });
                }
              } catch (e) {
                // Can't read file, skip
              }
            }
          }
        } catch (e) {
          // Skip items we can't access
        }
      });
    } catch (e) {
      // Skip directories we can't access
    }
  }

  scanDir(dir);
  return exports;
}

function getProjectInfo() {
  const cwd = process.cwd();
  const projectName = path.basename(cwd);

  // Check for project type
  let projectType = "Unknown";
  let mainTech = [];

  if (fs.existsSync(path.join(cwd, "package.json"))) {
    projectType = "Node.js/JavaScript";
    mainTech.push("Node.js");

    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
      if (pkg.dependencies) {
        if (pkg.dependencies.react) mainTech.push("React");
        if (pkg.dependencies.next) mainTech.push("Next.js");
        if (pkg.dependencies.vue) mainTech.push("Vue");
        if (pkg.dependencies.express) mainTech.push("Express");
        if (pkg.dependencies.fastify) mainTech.push("Fastify");
      }
    } catch (e) {}
  }

  if (fs.existsSync(path.join(cwd, "requirements.txt")) ||
      fs.existsSync(path.join(cwd, "pyproject.toml")) ||
      fs.existsSync(path.join(cwd, "setup.py"))) {
    projectType = projectType === "Unknown" ? "Python" : projectType + "/Python";
    mainTech.push("Python");

    // Check for frameworks
    if (fs.existsSync(path.join(cwd, "manage.py"))) mainTech.push("Django");
    if (fs.existsSync(path.join(cwd, "app.py")) || fs.existsSync(path.join(cwd, "application.py"))) {
      mainTech.push("Flask/FastAPI");
    }
  }

  if (fs.existsSync(path.join(cwd, "go.mod"))) {
    projectType = projectType === "Unknown" ? "Go" : projectType + "/Go";
    mainTech.push("Go");
  }

  if (fs.existsSync(path.join(cwd, "Cargo.toml"))) {
    projectType = projectType === "Unknown" ? "Rust" : projectType + "/Rust";
    mainTech.push("Rust");
  }

  return {
    name: projectName,
    type: projectType,
    tech: mainTech,
    path: cwd
  };
}

function main() {
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8"));

    // Only inject on SessionStart
    if (input.event !== "SessionStart") {
      process.exit(0);
    }

    const projectInfo = getProjectInfo();
    const tree = generateTree(process.cwd());
    const exports = extractMainExports(process.cwd());

    // Build the context map
    let contextMap = `\n━━━ 📁 PROJECT STRUCTURE (${projectInfo.name}) ━━━\n`;
    contextMap += `Type: ${projectInfo.type}\n`;
    if (projectInfo.tech.length > 0) {
      contextMap += `Stack: ${projectInfo.tech.join(", ")}\n`;
    }
    contextMap += `Path: ${projectInfo.path}\n\n`;

    contextMap += "Directory Structure:\n";
    contextMap += tree || "(empty or no accessible files)\n";

    if (exports.length > 0) {
      contextMap += "\nMain Exports/Entry Points:\n";
      contextMap += exports.slice(0, 20).join("\n") + "\n";
      if (exports.length > 20) {
        contextMap += `... and ${exports.length - 20} more\n`;
      }
    }

    contextMap += "\n(✓ = code file)\n";
    contextMap += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

    // Trim if too long (rough token estimate: 4 chars = 1 token)
    if (contextMap.length > MAX_TOKENS * 4) {
      contextMap = contextMap.substring(0, MAX_TOKENS * 4) + "\n... (truncated)\n";
    }

    // Output for injection
    const output = {
      context: contextMap
    };

    process.stdout.write(JSON.stringify(output));

  } catch (e) {
    // Never block on error
    process.exit(0);
  }
}

main();
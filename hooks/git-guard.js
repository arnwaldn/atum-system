#!/usr/bin/env node
/**
 * Unified Bash Guard Hook — replaces git-guard.py (which replaced 4 separate hooks).
 * Node.js rewrite for faster startup (~50ms vs ~200ms Python).
 *
 * Checks: dangerous commands, conventional commits, push protection, branch naming.
 * Exit: 0 with JSON {decision, reason}
 */

const { execFileSync } = require("child_process");

const DANGEROUS_PATTERNS = [
  [/rm\s+(-[a-zA-Z]+\s+)*\/(\s|$|\*)/, "rm on root directory"],
  [/rm\s+-[a-zA-Z]*rf\b/, "recursive force delete"],
  [/mkfs\./, "filesystem format"],
  [/dd\s+.*of=\/dev\//, "raw disk write"],
  [/:\(\)\s*\{\s*:\|:\s*&\s*\}\s*;:/, "fork bomb"],
  [/>\s*\/dev\/sd[a-z]/, "raw device write"],
  [/chmod\s+-R\s+777\s+\//, "recursive 777 on root"],
  [/DROP\s+DATABASE/i, "drop database"],
  [/DROP\s+TABLE/i, "drop table"],
  [/TRUNCATE\s+TABLE/i, "truncate table"],
  [/DELETE\s+FROM\s+\w+\s*;?\s*$/i, "delete all rows (no WHERE)"],
  [/git\s+reset\s+--hard\b/, "git reset --hard (destroys uncommitted changes)"],
  [/docker\s+system\s+prune\b/, "docker system prune (removes all unused data)"],
  [/docker\s+rm\s+-[a-zA-Z]*f.*\$\(docker\s+ps/, "remove all docker containers"],
  [/pip\s+install\s+--force-reinstall\s+(?!.*==)/, "force reinstall without pinned version"],
];

const VALID_COMMIT_TYPES = ["feat", "fix", "refactor", "docs", "test", "chore", "perf", "ci", "style", "build", "revert"];
const COMMIT_PATTERN = new RegExp(`^(${VALID_COMMIT_TYPES.join("|")})(\\(.+\\))?!?:\\s+.+`);

const BACKUP_REPOS = [
  "claude-code-config", "project-templates", "webmcp-optimized",
  "atum-memory", "gigroute-mobile", "live-tour-manager",
];

const VALID_BRANCH_PREFIXES = [
  /^(feature|feat)\/.+/, /^(fix|bugfix|hotfix)\/.+/, /^release\/v?\d+\.\d+/,
  /^(chore|docs|test|ci|refactor|perf|style|build)\/.+/, /^(main|master|develop|dev|staging)$/,
  /^claude\//, // Allow Claude Code auto-branches
];

function approve(reason) {
  console.log(JSON.stringify({ decision: "approve", reason }));
  process.exit(0);
}

function block(reason) {
  console.log(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

function isBackupRepo(command) {
  if (BACKUP_REPOS.some((r) => command.includes(r))) return true;
  try {
    const cdMatch = command.match(/cd\s+([^\s&;]+)/);
    const args = cdMatch ? ["-C", cdMatch[1].replace(/^~/, process.env.HOME || ""), "remote", "get-url", "origin"] : ["remote", "get-url", "origin"];
    const url = execFileSync("git", args, { encoding: "utf8", timeout: 5000 }).trim();
    return BACKUP_REPOS.some((r) => url.includes(r));
  } catch {
    return false;
  }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    if (data.tool_name !== "Bash") return approve("Not a Bash command");

    const command = (data.tool_input || {}).command || "";

    // 1. Dangerous commands
    for (const [pat, desc] of DANGEROUS_PATTERNS) {
      if (pat.test(command)) return block(`BLOCKED: Dangerous command — ${desc}\nCommand: ${command.slice(0, 100)}`);
    }

    // 2. Conventional commits
    if (/git\s+commit\b/.test(command) && !command.trim().startsWith("#")) {
      let msg = null;
      const msgMatch = command.match(/-m\s+['"](.+?)['"]/);
      if (msgMatch) {
        msg = msgMatch[1].trim();
      } else {
        const heredocMatch = command.match(/<<.*?EOF.*?\n(.+?)\n/s);
        if (heredocMatch) msg = heredocMatch[1].trim().split("\n")[0];
      }
      if (msg && !COMMIT_PATTERN.test(msg)) {
        return block(`Commit message does not follow conventional format.\nExpected: <type>: <description>\nTypes: ${VALID_COMMIT_TYPES.join(", ")}\nGot: ${msg.slice(0, 80)}`);
      }
    }

    // 3. Push protection
    if (/git\s+push\b/.test(command)) {
      const protectedBranches = ["main", "master", "production", "release"];
      const isForce = /--force\b|-f\b/.test(command);
      const targetBranch = protectedBranches.find((b) => new RegExp(`\\b${b}\\b`).test(command));

      if (isForce && targetBranch) return block(`BLOCKED: Force push to '${targetBranch}' is not allowed.`);
      if (isForce) return block("BLOCKED: Force push detected. Use --force-with-lease instead.");
      if (targetBranch && !isBackupRepo(command)) return block(`WARNING: Direct push to '${targetBranch}'. Consider a feature branch + PR.`);
    }

    // 4. Branch naming
    const branchCreate = command.match(/git\s+(checkout\s+-b|switch\s+-c|branch)\s+(?!-|\s)(\S+)/);
    if (branchCreate) {
      const name = branchCreate[2];
      if (!VALID_BRANCH_PREFIXES.some((p) => p.test(name))) {
        return block(`Branch '${name}' does not follow naming convention.\nExpected: feature/*, fix/*, hotfix/*, release/v*, chore/*, docs/*, test/*, ci/*`);
      }
    }

    approve("Command approved");
  } catch {
    approve("Parse error — fail-open");
  }
});

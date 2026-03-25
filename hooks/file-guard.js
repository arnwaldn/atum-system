#!/usr/bin/env node
/**
 * File Guard Hook — Blocks access to 195+ sensitive file patterns.
 * Node.js rewrite of file-guard.py for faster startup (~50ms vs ~200ms).
 * Exit: 0=safe, 1=warning, 2=block
 */

const SENSITIVE_PATTERNS = {
  SSH_KEYS: [/\.ssh\//, /\.pem$/, /\.key$/, /\.ppk$/, /id_rsa/, /id_dsa/, /id_ecdsa/, /id_ed25519/, /ssh_host_.*_key$/, /authorized_keys/, /known_hosts$/],
  AWS_CREDENTIALS: [/\.aws\//, /credentials$/, /aws_access_key/, /aws_secret/, /\.s3cfg$/, /\.boto$/],
  DOCKER_CONFIG: [/\.docker\/config\.json$/, /\.dockercfg$/, /docker-compose\.override\.yml$/],
  CRYPTO_WALLETS: [/wallet\.dat$/, /wallet\.json$/, /keystore\//, /\.keystore$/, /\.wallet$/, /mnemonic/, /seed\.txt$/, /private_key/],
  SHELL_HISTORY: [/_history$/, /\.bash_history$/, /\.zsh_history$/, /\.fish_history$/, /\.sh_history$/, /\.histfile$/, /\.lesshst$/, /\.psql_history$/, /\.mysql_history$/, /\.sqlite_history$/, /\.rediscli_history$/, /\.node_repl_history$/, /\.python_history$/],
  ENV_AND_TOKENS: [/\.env/, /\.npmrc$/, /\.pypirc$/, /\.netrc$/, /\.gitconfig$/, /\.git-credentials$/, /\.ftpconfig$/, /\.tugboat$/, /\.remote-sync\.json$/, /\.esmtprc$/, /secrets\./, /config\.secret/, /token\./, /api[_-]?key/],
  CERTIFICATES: [/\.p12$/, /\.pfx$/, /\.cer$/, /\.crt$/, /\.csr$/, /\.der$/, /\.p7b$/, /\.p7r$/, /\.spc$/, /cert.*\.pem$/],
  DATABASES: [/\.db$/, /\.sqlite$/, /\.sqlite3$/, /\.kdbx$/, /\.kdb$/, /\.accdb$/, /\.mdb$/, /\.dbf$/, /\.sdb$/, /database\.yml$/, /mongoid\.yml$/, /redis\.conf$/],
  BACKUPS: [/\.bak$/, /\.backup$/, /\.old$/, /\.orig$/, /\.save$/, /\.swp$/, /\.swo$/, /\.tmp$/, /~$/, /\.DS_Store$/, /Thumbs\.db$/],
  IDE_CONFIG: [/\.idea\//, /\.vscode\//, /\.settings\//, /\.project$/, /\.classpath$/, /workspace\.xml$/, /launch\.json$/],
  PACKAGE_MANAGERS: [/\.bundle\/config$/, /\.gem\/credentials$/, /\.cargo\/credentials/, /\.gradle\/gradle\.properties$/, /\.m2\/settings\.xml$/, /\.ivy2\/.*credentials/, /yarn\.lock$/, /package-lock\.json$/, /composer\.lock$/, /Gemfile\.lock$/, /poetry\.lock$/],
  SYSTEM_FILES: [/\/etc\/passwd$/, /\/etc\/shadow$/, /\/etc\/sudoers$/, /\.ssh\/config$/, /\.gnupg\//, /\.password-store\//, /\.config\/hub$/, /\.config\/gh\//, /\.kube\/config$/, /\.minikube\//],
};

const WARNING_PATTERNS = [/package\.json$/, /requirements\.txt$/, /Dockerfile$/, /docker-compose\.yml$/];

// ─── Pre-built extension-based fast-path index ───
// For files with known dangerous extensions, skip the full 195-pattern scan.
const BLOCKED_EXTENSIONS = new Set([
  '.pem', '.key', '.ppk', '.p12', '.pfx', '.cer', '.crt', '.csr',
  '.der', '.p7b', '.p7r', '.spc', '.kdbx', '.kdb', '.wallet',
  '.keystore', '.s3cfg', '.boto', '.pypirc', '.netrc',
  '.ftpconfig', '.tugboat', '.esmtprc', '.dockercfg',
]);
const SAFE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.kt',
  '.swift', '.cpp', '.c', '.h', '.css', '.scss', '.html', '.md',
  '.mdx', '.txt', '.yaml', '.toml', '.xml', '.svg', '.sh',
]);

function checkFile(filepath) {
  const normalized = filepath.replace(/\\/g, '/');

  // Fast-path: known-safe source file extensions skip the full scan
  const lastDot = normalized.lastIndexOf('.');
  if (lastDot !== -1) {
    const ext = normalized.slice(lastDot).toLowerCase();
    if (SAFE_EXTENSIONS.has(ext)) return { safe: true };
    if (BLOCKED_EXTENSIONS.has(ext)) return { block: true, category: 'EXTENSION', pattern: ext };
  }

  // Full pattern scan for everything else
  for (const [category, patterns] of Object.entries(SENSITIVE_PATTERNS)) {
    for (const pat of patterns) {
      if (pat.test(normalized)) return { block: true, category, pattern: pat.source };
    }
  }
  for (const pat of WARNING_PATTERNS) {
    if (pat.test(normalized)) return { warn: true, pattern: pat.source };
  }
  return { safe: true };
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const tool = data.tool || "";
    const params = data.params || {};
    let filepath = null;

    if (["Read", "Write", "Edit"].includes(tool)) {
      filepath = params.file_path || "";
    } else if (tool === "Bash") {
      const cmd = params.command || "";
      const ops = ["cat ", "less ", "more ", "head ", "tail ", "vim ", "nano ", "cp ", "mv ", "rm ", "chmod ", "chown "];
      for (const op of ops) {
        const idx = cmd.indexOf(op);
        if (idx !== -1) {
          const rest = cmd.slice(idx + op.length).trim();
          filepath = rest.split(/\s/)[0] || null;
          break;
        }
      }
    }

    if (!filepath) process.exit(0);

    const result = checkFile(filepath);
    if (result.block) {
      process.stderr.write(
        `[FILE GUARD | ATUM] Acces refuse - Fichier sensible\nCategorie: ${result.category}\nFichier: ${filepath}\nPattern: ${result.pattern}\n`
      );
      process.exit(2);
    }
    if (result.warn) {
      process.stderr.write(
        `[FILE GUARD] Attention - Fichier potentiellement sensible\nFichier: ${filepath}\nPattern: ${result.pattern}\n`
      );
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[FILE GUARD] Hook error — blocking for safety: ${err}\n`);
    process.exit(2); // fail-closed: crash = block
  }
});

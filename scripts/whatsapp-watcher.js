// WhatsApp Watcher — Event-driven Cloclo
// Receives webhooks from the Go bridge, buffers messages by burst,
// then spawns Claude CLI (Opus) to analyze and respond.
// Zero AI tokens consumed when nobody is talking.

const http = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { execFileSync } = require('node:child_process');

// --- Config ---
const PORT = 4821;
const SILENCE_TIMEOUT_MS = 15_000; // 15 seconds — reactive brainstorming, enough to batch rapid-fire messages
const MISSED_CHECK_MINUTES = 10; // Check messages from the last N minutes on startup
const TARGET_CHAT = '120363426138895875@g.us'; // CLOCLO Brainstorming ATUM
const CLOCLO_LID = '250375772864613';
const PYTHON_PATH = 'C:/Users/arnau/AppData/Local/Programs/Python/Python313/python.exe';
const MESSAGES_DB = 'C:/Users/arnau/Projects/tools/whatsapp-mcp/whatsapp-bridge/store/messages.db';
const PROMPT_PATH = path.join(__dirname, 'whatsapp-cloclo-prompt.md');
const MCP_CONFIG_PATH = path.join(__dirname, 'whatsapp-mcp-config.json');
const CLAUDE_PATH = 'C:/Users/arnau/AppData/Roaming/npm/claude.cmd';
const LOG_PATH = path.join(__dirname, 'whatsapp-watcher.log');

// LID → Name mapping
const CONTACTS = {
  '96413459472572': 'Pablo',
  '167933456179200': 'Arnaud',
  '181007118536715': 'Walid',
  '250375772864613': 'Cloclo',
};

// --- State ---
const messageBuffer = [];
let silenceTimer = null;
let isProcessing = false;

// --- Logging ---
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
  process.stdout.write(line);
}

// --- Flush buffer → spawn Claude CLI ---
function flushBuffer() {
  if (messageBuffer.length === 0) return;

  if (isProcessing) {
    log('Claude is already processing a burst — rescheduling flush in 30s');
    silenceTimer = setTimeout(flushBuffer, 30_000);
    return;
  }

  const messages = messageBuffer.splice(0);
  isProcessing = true;

  log(`--- Burst complete: ${messages.length} message(s) ---`);

  // Build the messages block
  const messagesText = messages
    .map((m) => `[${m.time}] ${m.name}: ${m.content}`)
    .join('\n');

  // Read prompt template and inject messages
  let template;
  try {
    template = fs.readFileSync(PROMPT_PATH, 'utf8');
  } catch (err) {
    log(`ERROR: Cannot read prompt file ${PROMPT_PATH}: ${err.message}`);
    isProcessing = false;
    return;
  }
  const fullPrompt = `${template}\n\n## Messages recus (rafale)\n\n${messagesText}`;

  // Write prompt to temp file (avoids shell argument length limits)
  const tmpFile = path.join(
    process.env.TEMP || '/tmp',
    `cloclo-${Date.now()}.md`
  );
  fs.writeFileSync(tmpFile, fullPrompt, 'utf8');

  log('Spawning Claude Opus...');

  const claude = spawn(
    CLAUDE_PATH,
    [
      '-p',
      '--model', 'opus',
      '--mcp-config', MCP_CONFIG_PATH,
      '--allowedTools', 'mcp__whatsapp__send_message,mcp__whatsapp__list_messages,WebSearch,WebFetch',
      '--permission-mode', 'bypassPermissions',
      '--no-session-persistence',
    ],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      windowsHide: true,
    }
  );

  // Send prompt via stdin then close
  claude.stdin.write(fullPrompt);
  claude.stdin.end();

  let stdout = '';
  let stderr = '';
  claude.stdout.on('data', (d) => { stdout += d; });
  claude.stderr.on('data', (d) => { stderr += d; });

  claude.on('close', (code) => {
    isProcessing = false;

    // Cleanup temp file
    try { fs.unlinkSync(tmpFile); } catch (_) { /* ignore */ }

    log(`Claude exited (code ${code})`);
    if (stdout.trim()) log(`Output: ${stdout.trim().slice(0, 500)}`);
    if (stderr.trim()) log(`Errors: ${stderr.trim().slice(0, 300)}`);
  });

  claude.on('error', (err) => {
    isProcessing = false;
    log(`Claude spawn error: ${err.message}`);
  });
}

// --- Handle incoming webhook ---
function handleWebhook(payload) {
  // Only target chat
  if (payload.chatJID !== TARGET_CHAT) return;

  // Ignore Cloclo's own messages (anti-loop)
  if (payload.isFromMe) return;
  if (payload.sender === CLOCLO_LID) return;

  // Ignore empty content
  if (!payload.content || !payload.content.trim()) return;

  const name = CONTACTS[payload.sender] || `Inconnu (${payload.sender})`;
  log(`New: ${name}: ${payload.content.slice(0, 80)}`);

  messageBuffer.push({
    time: new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    sender: payload.sender,
    name,
    content: payload.content,
  });

  // Reset silence timer
  if (silenceTimer) clearTimeout(silenceTimer);
  silenceTimer = setTimeout(flushBuffer, SILENCE_TIMEOUT_MS);
}

// --- HTTP Server ---
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        handleWebhook(JSON.parse(body));
        res.writeHead(200);
        res.end('OK');
      } catch (e) {
        log(`Parse error: ${e.message}`);
        res.writeHead(400);
        res.end('Bad Request');
      }
    });
  } else if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'running',
        buffered: messageBuffer.length,
        processing: isProcessing,
        uptime: Math.round(process.uptime()),
      })
    );
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// --- Check missed messages on startup ---
function checkMissedMessages() {
  log(`Checking messages from last ${MISSED_CHECK_MINUTES} min...`);

  const dbPath = MESSAGES_DB;
  const pyScript = [
    'import sqlite3, json',
    'from datetime import datetime, timedelta, timezone',
    `conn = sqlite3.connect(r"${dbPath}")`,
    'c = conn.cursor()',
    `cutoff = datetime.now(timezone.utc) - timedelta(minutes=${MISSED_CHECK_MINUTES})`,
    'c.execute(',
    '  "SELECT sender, content, timestamp FROM messages"',
    '  " WHERE chat_jid = ? AND is_from_me = 0 AND content IS NOT NULL"',
    '  " AND content != \'\' AND timestamp > ? ORDER BY timestamp ASC",',
    `  ("${TARGET_CHAT}", cutoff.isoformat())`,
    ')',
    'print(json.dumps([{"sender":r[0],"content":r[1],"timestamp":r[2]} for r in c.fetchall()]))',
  ].join('\n');

  try {
    const result = execFileSync(PYTHON_PATH, ['-c', pyScript], {
      timeout: 5000,
      windowsHide: true,
    }).toString().trim();

    const rows = JSON.parse(result);
    const missed = rows.filter((r) => r.sender !== CLOCLO_LID);

    if (missed.length === 0) {
      log('No missed messages — all clear.');
      return;
    }

    log(`Found ${missed.length} missed message(s) — buffering for analysis`);

    for (const msg of missed) {
      const name = CONTACTS[msg.sender] || `Inconnu (${msg.sender})`;
      const ts = new Date(msg.timestamp);
      messageBuffer.push({
        time: ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        sender: msg.sender,
        name,
        content: msg.content,
      });
    }

    // Trigger flush after a short delay (let server fully start)
    silenceTimer = setTimeout(flushBuffer, 3000);
  } catch (err) {
    log(`Missed messages check failed: ${err.message}`);
  }
}

server.listen(PORT, () => {
  log('=== WhatsApp Watcher started ===');
  log(`Port: ${PORT}`);
  log(`Target: CLOCLO Brainstorming ATUM (${TARGET_CHAT})`);
  log(`Silence timeout: ${SILENCE_TIMEOUT_MS / 1000}s`);
  log(`Prompt: ${PROMPT_PATH}`);
  log(`MCP config: ${MCP_CONFIG_PATH}`);

  // Check for messages we might have missed while offline
  checkMissedMessages();
});

// Graceful shutdown
function shutdown(signal) {
  log(`Shutdown (${signal})`);
  if (silenceTimer) clearTimeout(silenceTimer);
  server.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

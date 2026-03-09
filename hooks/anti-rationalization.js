#!/usr/bin/env node
/**
 * Anti-Rationalization Stop Hook
 * Detects premature completion patterns and forces Claude to continue working.
 *
 * Patterns detected:
 * 1. "Pre-existing" excuse — blaming issues on pre-existing code
 * 2. "Out of scope" deflection — marking problems as out of scope
 * 3. Listing problems without fixing them
 * 4. Ignoring test/lint failures
 * 5. Deferring to "follow-ups" not requested by user
 *
 * Source: Trail of Bits anti-rationalization pattern
 */

const fs = require("fs");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "{}";
  }
}

// Rationalization patterns with severity weights
const PATTERNS = [
  {
    name: "pre-existing-excuse",
    regex: /(?:pre-?existing|already existed|was already|etait deja|existait deja|c'est un probleme existant)/i,
    message: "Blaming pre-existing code instead of fixing it",
    weight: 2,
  },
  {
    name: "out-of-scope",
    regex: /(?:out of scope|hors (?:du )?scope|beyond (?:the )?scope|depasse le cadre|sort du perimetre)/i,
    message: "Deflecting with 'out of scope' — fix what you found",
    weight: 2,
  },
  {
    name: "deferred-followup",
    regex: /(?:follow[- ]?up|future (?:PR|commit|task|iteration)|dans une prochaine|a traiter plus tard|pour plus tard|TODO:? (?:fix|add|handle|implement))/i,
    message: "Deferring work to follow-ups that nobody asked for",
    weight: 1,
  },
  {
    name: "test-failure-ignored",
    regex: /(?:tests? (?:are |were |still )?fail|test(?:s)? (?:echoue|en echec)|(?:lint|type.?check) (?:error|fail|warning))/i,
    message: "Acknowledging test/lint failures without fixing them",
    weight: 3,
  },
  {
    name: "vague-completion",
    regex: /(?:should (?:be )?(?:work|fix|resolv)|devrait (?:fonctionner|marcher)|probably (?:work|fix)|sans doute (?:ok|correct))/i,
    message: "Using vague language instead of verifying",
    weight: 2,
  },
  {
    name: "listing-without-fixing",
    regex: /(?:(?:known|remaining|outstanding) (?:issue|problem|bug)|problemes? (?:connus?|restants?|identifies?)|issues? (?:to )?(?:address|fix) later)/i,
    message: "Listing problems without resolving them",
    weight: 2,
  },
];

// Threshold: combined weight must exceed this to trigger
const THRESHOLD = 3;

try {
  const input = JSON.parse(readStdin());
  const transcript = input.transcript || "";
  const stopReason = input.stop_reason || "";

  // Only check on end_turn stops (not user interrupts)
  if (stopReason !== "end_turn") {
    process.exit(0);
  }

  // Get the last assistant message (what Claude was about to say when stopping)
  // The transcript is the last few messages — scan the whole thing
  const textToScan = typeof transcript === "string"
    ? transcript
    : JSON.stringify(transcript);

  // Only scan the last ~2000 chars (the conclusion)
  const tail = textToScan.slice(-2000);

  let totalWeight = 0;
  const triggered = [];

  for (const pattern of PATTERNS) {
    if (pattern.regex.test(tail)) {
      totalWeight += pattern.weight;
      triggered.push(pattern);
    }
  }

  if (totalWeight >= THRESHOLD) {
    const reasons = triggered.map((p) => `- ${p.message}`).join("\n");
    const output = {
      stopReason: `[ANTI-RATIONALIZATION] Premature completion detected (score: ${totalWeight}/${THRESHOLD}):\n${reasons}\n\nDo NOT stop. Fix the issues listed above before completing.`,
    };
    process.stdout.write(JSON.stringify(output));
  }
  // If below threshold, output nothing — allow normal stop
} catch {
  // Hook must never block
  process.exit(0);
}

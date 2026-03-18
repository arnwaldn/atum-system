#!/usr/bin/env python3
"""Anti-rationalization Stop hook - FAIL-OPEN (Stop hooks should not trap).
Detects premature completion signals in Claude's final response.
Source: Trail of Bits anti-rationalization pattern, adapted for ATUM."""
import sys
import json
import re

RATIONALIZATION_PATTERNS = [
    (r"(?:pre-?existing|already existed|was already|etait deja|existait deja)", "Blaming pre-existing code instead of fixing it", 2),
    (r"(?:out of scope|hors (?:du )?scope|beyond (?:the )?scope|depasse le cadre)", "Deflecting with 'out of scope'", 2),
    (r"(?:follow[- ]?up|future (?:PR|commit|task)|dans une prochaine|a traiter plus tard|pour plus tard)", "Deferring work to follow-ups", 1),
    (r"(?:tests? (?:are |were |still )?fail|test(?:s)? (?:echoue|en echec)|(?:lint|type.?check) (?:error|fail))", "Acknowledging test/lint failures without fixing them", 3),
    (r"(?:should (?:be )?(?:work|fix|resolv)|devrait (?:fonctionner|marcher)|probably (?:work|fix))", "Using vague language instead of verifying", 2),
    (r"(?:(?:known|remaining|outstanding) (?:issue|problem|bug)|problemes? (?:connus?|restants?))", "Listing problems without resolving them", 2),
    (r"(?:je vais attendre|j'attends (?:ton|votre) retour|en attente de|waiting for (?:your|user))", "Waiting passively instead of continuing work", 3),
    (r"(?:c'est fait|(?:tout est|c'est) (?:bon|ok|termine)|done(?:\.|!)|complete(?:d)?(?:\.|!))(?!.*(?:test|verifi|output|result))", "Claiming completion without verification", 2),
    (r"(?:(?:ca|cela) devrait (?:marcher|fonctionner)|should (?:now )?(?:work|be fixed))(?!.*(?:test|verifi|confirmed))", "Using 'should work' without actual verification", 2),
    (r"(?:pour le (?:moment|reste)|for (?:now|the rest)|partially (?:done|complete))", "Presenting partial work as sufficient", 2),
]

THRESHOLD = 2

try:
    input_data = json.load(sys.stdin)
    transcript = input_data.get("transcript", "")
    stop_reason = input_data.get("stop_reason", "")

    if stop_reason != "end_turn":
        sys.exit(0)

    text_to_scan = transcript if isinstance(transcript, str) else json.dumps(transcript)
    tail = text_to_scan[-2000:]

    total_weight = 0
    triggered = []

    for pattern, message, weight in RATIONALIZATION_PATTERNS:
        if re.search(pattern, tail, re.IGNORECASE):
            total_weight += weight
            triggered.append(message)

    if total_weight >= THRESHOLD:
        reasons = "\n".join(f"- {m}" for m in triggered)
        print(json.dumps({
            "decision": "block",
            "message": f"[ANTI-RATIONALIZATION | ATUM] Arret premature detecte (score: {total_weight}/{THRESHOLD}):\n{reasons}\n\nCorrige les problemes ci-dessus AVANT de terminer."
        }))
    else:
        print(json.dumps({"decision": "allow"}))

except Exception:
    # Stop hooks: fail-open is acceptable (don't trap the user)
    print(json.dumps({"decision": "allow"}))

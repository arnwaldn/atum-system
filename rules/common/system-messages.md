# System Message Handling

## CRITICAL: System-Only Turns

A "system-only turn" is a Human turn containing ONLY:
- `<task-notification>` tags (background task completions)
- `<system-reminder>` tags (hook outputs, plugin notifications)
- No actual user-written text

**RULE: NEVER respond to system-only turns.**

- No acknowledgment ("OK", "Done", "Noted")
- No status updates ("Scan complete", "Ready")
- No waiting messages ("J'attends ton retour", "En attente")
- Simply produce no output — the turn requires no response

**Detection**: If removing all XML tags from a Human turn leaves ONLY whitespace or nothing, it is system-only. Do NOT respond.

**Mixed turns**: If a turn contains BOTH system tags AND user text, respond ONLY to the user text. Ignore system tags unless they provide relevant context for the user's request.

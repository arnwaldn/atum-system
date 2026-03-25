---
description: "Provide feedback on injected skills to improve future routing."
---

# Skill Feedback Command

Rate the skills that were injected in the current session to improve future routing accuracy.

## Usage

`/skill-feedback <skill-id> <useful|useless|wrong>`

## Actions

### Mark skill as useful
```
/skill-feedback django-patterns useful
```
Boosts the skill's reputation score. It will be prioritized in future sessions with similar context.

### Mark skill as useless
```
/skill-feedback react-patterns useless
```
Lowers the skill's reputation. After enough negative signals, the skill is auto-deprioritized (never deleted — always available via explicit request).

### Mark skill as wrong context
```
/skill-feedback golang-testing wrong
```
Strongest penalty. The skill was injected but is completely irrelevant to the current task.

## How it works

1. Read `~/.claude/skill-reputation.json`
2. Update the skill's positive/negative/neutral counters
3. Save. The skill-orchestrator-hook.js uses these scores to adjust routing.

## Implementation

```bash
# Read the reputation file
REPUTATION_FILE="$HOME/.claude/skill-reputation.json"

# Parse the skill-id and action from arguments
SKILL_ID="$1"
ACTION="$2"

# Update via node one-liner
node -e "
const fs = require('fs');
const fp = '$REPUTATION_FILE';
let rep = {};
try { rep = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch {}
if (!rep['$SKILL_ID']) rep['$SKILL_ID'] = {positive:0, negative:0, neutral:0};
if ('$ACTION' === 'useful') rep['$SKILL_ID'].positive++;
else if ('$ACTION' === 'useless') rep['$SKILL_ID'].negative++;
else if ('$ACTION' === 'wrong') rep['$SKILL_ID'].negative += 3;
fs.writeFileSync(fp, JSON.stringify(rep, null, 2));
console.log('Updated ' + '$SKILL_ID' + ': ' + JSON.stringify(rep['$SKILL_ID']));
"
```

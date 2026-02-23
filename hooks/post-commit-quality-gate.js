const fs = require('fs');

// Read hook input from stdin
const input = JSON.parse(fs.readFileSync(0, 'utf8'));

// Only trigger on Bash tool
if (input.tool_name !== 'Bash') process.exit(0);

const command = input.tool_input?.command || '';

// Only trigger on git commit commands
if (!command.match(/git\s+commit\b/) || command.includes('--amend')) process.exit(0);

// Suggest quality checks after commit
const message = [
  '📋 Post-commit quality gate:',
  '  Consider running before pushing:',
  '  • Type check: tsc --noEmit / mypy / go vet',
  '  • Lint: eslint / ruff / golangci-lint',
  '  • Tests: npm test / pytest / go test ./...',
  '  Use /pre-deploy for a full checklist.'
].join('\n');

const result = {
  decision: 'approve',
  reason: message
};

process.stdout.write(JSON.stringify(result));

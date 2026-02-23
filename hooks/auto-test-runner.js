#!/usr/bin/env node
/**
 * Auto Test Runner Hook (PostToolUse: Write|Edit)
 * After a source file is modified, detects the test framework and
 * checks if a related test file exists. If found, outputs a reminder
 * with the exact command to run the specific test.
 */

const fs = require('fs');
const path = require('path');

let data;
try {
  data = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const filePath = data.tool_input?.file_path || '';
if (!filePath) {
  process.exit(0);
}

const ext = path.extname(filePath);
const basename = path.basename(filePath);
const dirname = path.dirname(filePath);
const nameNoExt = path.basename(filePath, ext);

// Skip non-source files
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.dart']);
if (!SOURCE_EXTS.has(ext)) {
  process.exit(0);
}

// Skip if the file itself is already a test file
const TEST_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /_test\.go$/,
  /_test\.py$/,
  /^test_.*\.py$/,
  /\.test\.dart$/,
  /_test\.dart$/,
  /_test\.rs$/,
];

if (TEST_PATTERNS.some(p => p.test(basename))) {
  process.exit(0);
}

// Skip config/build files
const SKIP_FILES = new Set([
  'vite.config.ts', 'vite.config.js', 'next.config.ts', 'next.config.js',
  'jest.config.ts', 'jest.config.js', 'vitest.config.ts', 'vitest.config.js',
  'tsconfig.json', 'package.json', 'tailwind.config.ts', 'tailwind.config.js',
  'postcss.config.js', 'eslint.config.js', '.eslintrc.js', 'prettier.config.js',
  'webpack.config.js', 'rollup.config.js', 'esbuild.config.js',
  'setup.py', 'setup.cfg', 'pyproject.toml', 'conftest.py',
  'main.go', 'Cargo.toml', 'build.rs', 'pubspec.yaml',
]);

if (SKIP_FILES.has(basename)) {
  process.exit(0);
}

// Try to find the corresponding test file
function findTestFile() {
  const candidates = [];

  switch (ext) {
    case '.ts':
    case '.tsx':
    case '.js':
    case '.jsx': {
      // foo.ts → foo.test.ts, foo.spec.ts
      const testExt = ext.replace(/^\./, '.test.');
      const specExt = ext.replace(/^\./, '.spec.');
      candidates.push(
        path.join(dirname, `${nameNoExt}${testExt}`),
        path.join(dirname, `${nameNoExt}${specExt}`),
        path.join(dirname, '__tests__', `${nameNoExt}${testExt}`),
        path.join(dirname, '__tests__', `${nameNoExt}${specExt}`),
        path.join(dirname, '__tests__', `${nameNoExt}${ext}`),
      );
      // Check if tests/ directory exists at project root
      const testsDir = findUpward(dirname, 'tests');
      if (testsDir) {
        candidates.push(
          path.join(testsDir, `${nameNoExt}${testExt}`),
          path.join(testsDir, `${nameNoExt}${specExt}`),
        );
      }
      break;
    }
    case '.py': {
      // foo.py → test_foo.py, foo_test.py
      candidates.push(
        path.join(dirname, `test_${basename}`),
        path.join(dirname, `${nameNoExt}_test.py`),
        path.join(dirname, 'tests', `test_${basename}`),
        path.join(dirname, '..', 'tests', `test_${basename}`),
      );
      break;
    }
    case '.go': {
      // foo.go → foo_test.go (same directory, always)
      candidates.push(path.join(dirname, `${nameNoExt}_test.go`));
      break;
    }
    case '.dart': {
      // lib/foo.dart → test/foo_test.dart
      candidates.push(
        path.join(dirname, `${nameNoExt}_test.dart`),
        path.join(dirname.replace(/[/\\]lib([/\\]|$)/, '/test$1'), `${nameNoExt}_test.dart`),
      );
      break;
    }
    case '.rs': {
      // Check for inline #[cfg(test)] module or separate test file
      candidates.push(path.join(dirname, `${nameNoExt}_test.rs`));
      break;
    }
  }

  return candidates.find(c => {
    try { return fs.statSync(c).isFile(); } catch { return false; }
  });
}

function findUpward(startDir, targetName) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, targetName);
    try {
      if (fs.statSync(candidate).isDirectory()) return candidate;
    } catch { /* continue */ }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function detectFramework() {
  let dir = dirname;
  for (let i = 0; i < 10; i++) {
    try {
      const files = fs.readdirSync(dir);
      // JS/TS frameworks
      if (files.includes('vitest.config.ts') || files.includes('vitest.config.js')) return 'vitest';
      if (files.includes('jest.config.ts') || files.includes('jest.config.js') || files.includes('jest.config.cjs')) return 'jest';
      // Python
      if (files.includes('pytest.ini') || files.includes('pyproject.toml') || files.includes('setup.cfg')) {
        if (ext === '.py') return 'pytest';
      }
      // Go
      if (files.includes('go.mod') && ext === '.go') return 'go';
      // Dart
      if (files.includes('pubspec.yaml') && ext === '.dart') return 'flutter';
      // Check package.json for test script
      if (files.includes('package.json')) {
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
          const testScript = pkg.scripts?.test || '';
          if (testScript.includes('vitest')) return 'vitest';
          if (testScript.includes('jest')) return 'jest';
        } catch { /* continue */ }
      }
    } catch { /* continue */ }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const testFile = findTestFile();
if (!testFile) {
  process.exit(0);
}

const framework = detectFramework();
const relTestFile = testFile.replace(/\\/g, '/');

let command = '';
switch (framework) {
  case 'vitest':
    command = `npx vitest run ${relTestFile}`;
    break;
  case 'jest':
    command = `npx jest ${relTestFile}`;
    break;
  case 'pytest':
    command = `pytest ${relTestFile} -v`;
    break;
  case 'go':
    command = `go test ${path.dirname(relTestFile)}/... -run .`;
    break;
  case 'flutter':
    command = `flutter test ${relTestFile}`;
    break;
  default:
    command = `<run test: ${relTestFile}>`;
}

process.stderr.write(`\n🧪 Test file found: ${path.basename(testFile)}\n`);
process.stderr.write(`   Run: ${command}\n\n`);

process.exit(0);

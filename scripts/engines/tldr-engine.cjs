#!/usr/bin/env node
/**
 * TLDR Engine - ULTRA-CREATE v28.0 "ZERO SATURATION"
 *
 * 5-Layer Progressive Code Summarization Engine
 * Inspired by Continuous-Claude-v3 TLDR analysis
 *
 * Layers:
 * - Layer 1: AST Summary (~100 tokens) - Structure only
 * - Layer 2: Call Graph (~200 tokens) - Function relations
 * - Layer 3: Control Flow (~300 tokens) - Logic flow
 * - Layer 4: Implementation (~500 tokens) - Simplified code
 * - Layer 5: Full Source (~2000 tokens) - Complete code
 *
 * Token savings: Up to 95% on inactive files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  maxTokensPerLayer: {
    1: 100,   // AST Summary
    2: 200,   // Call Graph
    3: 300,   // Control Flow
    4: 500,   // Implementation
    5: 2000   // Full Source
  },

  // File type mappings for parsing
  supportedExtensions: [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.rb', '.go', '.rs', '.java', '.kt',
    '.c', '.cpp', '.h', '.hpp', '.cs',
    '.php', '.swift', '.scala', '.vue', '.svelte'
  ],

  // Approximate tokens per character
  tokensPerChar: 0.25,

  // Cache settings
  cacheDir: path.join(process.env.TEMP || 'C:\\Temp', 'tldr-cache'),
  cacheTTL: 300000 // 5 minutes
};

// Ensure cache directory exists
if (!fs.existsSync(CONFIG.cacheDir)) {
  try {
    fs.mkdirSync(CONFIG.cacheDir, { recursive: true });
  } catch (e) {
    // Ignore if can't create cache
  }
}

/**
 * Estimate token count from text
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length * CONFIG.tokensPerChar);
}

/**
 * Extract imports and exports from code
 */
function extractImportsExports(code, fileType) {
  const imports = [];
  const exports = [];

  // JavaScript/TypeScript patterns
  if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte'].includes(fileType)) {
    // ES imports
    const importMatches = code.matchAll(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      imports.push({
        items: match[1] || match[2],
        from: match[3]
      });
    }

    // CommonJS requires
    const requireMatches = code.matchAll(/(?:const|let|var)\s+(?:{([^}]+)}|(\w+))\s*=\s*require\(['"]([^'"]+)['"]\)/g);
    for (const match of requireMatches) {
      imports.push({
        items: match[1] || match[2],
        from: match[3]
      });
    }

    // ES exports
    const exportMatches = code.matchAll(/export\s+(?:default\s+)?(?:const|let|var|function|class|async\s+function)\s+(\w+)/g);
    for (const match of exportMatches) {
      exports.push(match[1]);
    }

    // module.exports
    const moduleExportMatches = code.matchAll(/module\.exports\s*=\s*(?:{([^}]+)}|(\w+))/g);
    for (const match of moduleExportMatches) {
      exports.push(match[1] || match[2]);
    }
  }

  // Python patterns
  if (fileType === '.py') {
    const pyImports = code.matchAll(/(?:from\s+(\S+)\s+)?import\s+([^\n]+)/g);
    for (const match of pyImports) {
      imports.push({
        items: match[2],
        from: match[1] || 'direct'
      });
    }
  }

  return { imports, exports };
}

/**
 * Extract function and class signatures
 */
function extractSignatures(code, fileType) {
  const functions = [];
  const classes = [];

  // JavaScript/TypeScript
  if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(fileType)) {
    // Functions
    const funcMatches = code.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g);
    for (const match of funcMatches) {
      functions.push({
        name: match[1],
        params: match[2].trim()
      });
    }

    // Arrow functions assigned to const
    const arrowMatches = code.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g);
    for (const match of arrowMatches) {
      functions.push({
        name: match[1],
        params: match[2].trim()
      });
    }

    // Classes
    const classMatches = code.matchAll(/(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g);
    for (const match of classMatches) {
      classes.push({
        name: match[1],
        extends: match[2] || null
      });
    }
  }

  // Python
  if (fileType === '.py') {
    const pyFuncMatches = code.matchAll(/def\s+(\w+)\s*\(([^)]*)\)/g);
    for (const match of pyFuncMatches) {
      functions.push({
        name: match[1],
        params: match[2].trim()
      });
    }

    const pyClassMatches = code.matchAll(/class\s+(\w+)(?:\(([^)]+)\))?:/g);
    for (const match of pyClassMatches) {
      classes.push({
        name: match[1],
        extends: match[2] || null
      });
    }
  }

  return { functions, classes };
}

/**
 * Layer 1: AST Summary (~100 tokens)
 * Structure only - imports, exports, class/function names
 */
function generateLayer1(code, filePath) {
  const fileType = path.extname(filePath).toLowerCase();
  const { imports, exports } = extractImportsExports(code, fileType);
  const { functions, classes } = extractSignatures(code, fileType);

  let summary = `# ${path.basename(filePath)} (L1-AST)\n`;
  summary += `Type: ${fileType} | Lines: ${code.split('\n').length}\n\n`;

  if (imports.length > 0) {
    summary += `## Imports (${imports.length})\n`;
    summary += imports.slice(0, 10).map(i => `- ${i.items} from ${i.from}`).join('\n');
    if (imports.length > 10) summary += `\n... +${imports.length - 10} more`;
    summary += '\n\n';
  }

  if (exports.length > 0) {
    summary += `## Exports\n- ${exports.join(', ')}\n\n`;
  }

  if (classes.length > 0) {
    summary += `## Classes (${classes.length})\n`;
    summary += classes.map(c => `- ${c.name}${c.extends ? ` extends ${c.extends}` : ''}`).join('\n');
    summary += '\n\n';
  }

  if (functions.length > 0) {
    summary += `## Functions (${functions.length})\n`;
    summary += functions.slice(0, 15).map(f => `- ${f.name}(${f.params.substring(0, 30)}${f.params.length > 30 ? '...' : ''})`).join('\n');
    if (functions.length > 15) summary += `\n... +${functions.length - 15} more`;
  }

  return summary.trim();
}

/**
 * Layer 2: Call Graph (~200 tokens)
 * Function relations and dependencies
 */
function generateLayer2(code, filePath) {
  const layer1 = generateLayer1(code, filePath);
  const { functions } = extractSignatures(code, path.extname(filePath).toLowerCase());

  let callGraph = `\n\n## Call Graph\n`;

  // Simple heuristic: find function calls
  for (const func of functions.slice(0, 10)) {
    const funcBody = extractFunctionBody(code, func.name);
    if (funcBody) {
      const calls = [];
      for (const otherFunc of functions) {
        if (otherFunc.name !== func.name && funcBody.includes(otherFunc.name + '(')) {
          calls.push(otherFunc.name);
        }
      }
      if (calls.length > 0) {
        callGraph += `- ${func.name} -> [${calls.join(', ')}]\n`;
      }
    }
  }

  return layer1 + callGraph;
}

/**
 * Extract function body (simplified)
 */
function extractFunctionBody(code, funcName) {
  const regex = new RegExp(`(?:function\\s+${funcName}|const\\s+${funcName}\\s*=)[^{]*\\{`, 'g');
  const match = regex.exec(code);
  if (!match) return null;

  const start = match.index + match[0].length;
  let braceCount = 1;
  let end = start;

  while (braceCount > 0 && end < code.length) {
    if (code[end] === '{') braceCount++;
    if (code[end] === '}') braceCount--;
    end++;
  }

  return code.substring(start, end - 1);
}

/**
 * Layer 3: Control Flow (~300 tokens)
 * Logic structure with conditionals and loops
 */
function generateLayer3(code, filePath) {
  const layer2 = generateLayer2(code, filePath);

  let controlFlow = `\n\n## Control Flow\n`;

  // Count control structures
  const ifCount = (code.match(/\bif\s*\(/g) || []).length;
  const forCount = (code.match(/\bfor\s*\(/g) || []).length;
  const whileCount = (code.match(/\bwhile\s*\(/g) || []).length;
  const switchCount = (code.match(/\bswitch\s*\(/g) || []).length;
  const tryCount = (code.match(/\btry\s*\{/g) || []).length;
  const asyncCount = (code.match(/\basync\s+/g) || []).length;
  const awaitCount = (code.match(/\bawait\s+/g) || []).length;

  controlFlow += `- Conditionals: ${ifCount} if, ${switchCount} switch\n`;
  controlFlow += `- Loops: ${forCount} for, ${whileCount} while\n`;
  controlFlow += `- Error handling: ${tryCount} try/catch\n`;
  controlFlow += `- Async: ${asyncCount} async, ${awaitCount} await\n`;

  // Extract key conditionals (first few)
  const conditions = code.match(/if\s*\([^)]+\)/g) || [];
  if (conditions.length > 0) {
    controlFlow += `\n### Key Conditions\n`;
    controlFlow += conditions.slice(0, 5).map(c => `- ${c.substring(0, 60)}${c.length > 60 ? '...' : ''}`).join('\n');
  }

  return layer2 + controlFlow;
}

/**
 * Layer 4: Implementation (~500 tokens)
 * Simplified code without comments and formatting
 */
function generateLayer4(code, filePath) {
  const layer3 = generateLayer3(code, filePath);

  // Strip comments and excessive whitespace
  let simplified = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
    .replace(/\/\/[^\n]*/g, '')       // Single-line comments
    .replace(/^\s*[\r\n]/gm, '')      // Empty lines
    .replace(/\s+/g, ' ')             // Multiple spaces to single
    .trim();

  // Truncate to fit token budget
  const maxChars = Math.floor(CONFIG.maxTokensPerLayer[4] / CONFIG.tokensPerChar);
  if (simplified.length > maxChars) {
    simplified = simplified.substring(0, maxChars) + '\n... [truncated]';
  }

  return layer3 + `\n\n## Simplified Code\n\`\`\`\n${simplified}\n\`\`\``;
}

/**
 * Layer 5: Full Source (~2000 tokens)
 * Complete code (may be truncated for very large files)
 */
function generateLayer5(code, filePath) {
  const layer4Header = generateLayer1(code, filePath); // Just header for context

  const maxChars = Math.floor(CONFIG.maxTokensPerLayer[5] / CONFIG.tokensPerChar);
  let fullCode = code;

  if (code.length > maxChars) {
    fullCode = code.substring(0, maxChars) + '\n\n... [truncated - file too large]';
  }

  return layer4Header + `\n\n## Full Source\n\`\`\`${path.extname(filePath).replace('.', '')}\n${fullCode}\n\`\`\``;
}

/**
 * Main TLDR generation function
 * @param {string} filePath - Path to the file
 * @param {number} layer - Layer level (1-5)
 * @param {object} options - Additional options
 */
function generateTLDR(filePath, layer = 1, options = {}) {
  // Validate layer
  layer = Math.max(1, Math.min(5, layer));

  // Check cache first
  const cacheKey = `${filePath}_L${layer}`;
  const cacheFile = path.join(CONFIG.cacheDir, Buffer.from(cacheKey).toString('base64').replace(/[/\\]/g, '_') + '.json');

  if (fs.existsSync(cacheFile) && !options.noCache) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Date.now() - cached.timestamp < CONFIG.cacheTTL) {
        return cached.content;
      }
    } catch (e) {
      // Cache read failed, regenerate
    }
  }

  // Read file
  let code;
  try {
    code = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return `# Error reading ${filePath}\n${e.message}`;
  }

  // Check if file type is supported
  const ext = path.extname(filePath).toLowerCase();
  if (!CONFIG.supportedExtensions.includes(ext)) {
    // For unsupported files, just return metadata
    return `# ${path.basename(filePath)} (unsupported type: ${ext})\nLines: ${code.split('\n').length}\nSize: ${code.length} chars`;
  }

  // Generate appropriate layer
  let content;
  switch (layer) {
    case 1:
      content = generateLayer1(code, filePath);
      break;
    case 2:
      content = generateLayer2(code, filePath);
      break;
    case 3:
      content = generateLayer3(code, filePath);
      break;
    case 4:
      content = generateLayer4(code, filePath);
      break;
    case 5:
      content = generateLayer5(code, filePath);
      break;
    default:
      content = generateLayer1(code, filePath);
  }

  // Cache result
  try {
    fs.writeFileSync(cacheFile, JSON.stringify({
      timestamp: Date.now(),
      layer,
      filePath,
      content
    }));
  } catch (e) {
    // Cache write failed, ignore
  }

  return content;
}

/**
 * Batch process multiple files
 * @param {string[]} filePaths - Array of file paths
 * @param {number} layer - Layer level for all files
 */
function batchTLDR(filePaths, layer = 1) {
  const results = {};

  for (const filePath of filePaths) {
    results[filePath] = {
      layer,
      tokens: 0,
      content: ''
    };

    try {
      const content = generateTLDR(filePath, layer);
      results[filePath].content = content;
      results[filePath].tokens = estimateTokens(content);
    } catch (e) {
      results[filePath].error = e.message;
    }
  }

  return results;
}

/**
 * Get optimal layer for a file based on context budget
 * @param {string} filePath - File path
 * @param {number} tokenBudget - Available tokens
 */
function getOptimalLayer(filePath, tokenBudget) {
  for (let layer = 5; layer >= 1; layer--) {
    const content = generateTLDR(filePath, layer);
    const tokens = estimateTokens(content);
    if (tokens <= tokenBudget) {
      return { layer, tokens, content };
    }
  }

  // Even Layer 1 exceeds budget, return truncated Layer 1
  const content = generateTLDR(filePath, 1);
  return {
    layer: 1,
    tokens: estimateTokens(content),
    content: content.substring(0, Math.floor(tokenBudget / CONFIG.tokensPerChar))
  };
}

/**
 * Clear TLDR cache
 */
function clearCache() {
  try {
    const files = fs.readdirSync(CONFIG.cacheDir);
    for (const file of files) {
      fs.unlinkSync(path.join(CONFIG.cacheDir, file));
    }
    return { success: true, cleared: files.length };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
TLDR Engine - ULTRA-CREATE v28.0

Usage:
  node tldr-engine.cjs <file> [layer]
  node tldr-engine.cjs --batch <file1> <file2> ... [--layer=N]
  node tldr-engine.cjs --clear-cache

Layers:
  1 - AST Summary (~100 tokens)
  2 - Call Graph (~200 tokens)
  3 - Control Flow (~300 tokens)
  4 - Implementation (~500 tokens)
  5 - Full Source (~2000 tokens)

Examples:
  node tldr-engine.cjs ./src/app.js 2
  node tldr-engine.cjs --batch ./src/*.js --layer=1
`);
    process.exit(0);
  }

  if (args[0] === '--clear-cache') {
    const result = clearCache();
    console.log(result.success ? `Cache cleared: ${result.cleared} files` : `Error: ${result.error}`);
    process.exit(result.success ? 0 : 1);
  }

  if (args[0] === '--batch') {
    const layerArg = args.find(a => a.startsWith('--layer='));
    const layer = layerArg ? parseInt(layerArg.split('=')[1]) : 1;
    const files = args.filter(a => !a.startsWith('--'));

    const results = batchTLDR(files, layer);
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  }

  // Single file mode
  const filePath = args[0];
  const layer = parseInt(args[1]) || 1;

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = generateTLDR(filePath, layer);
  console.log(content);
  console.log(`\n---\nTokens: ~${estimateTokens(content)}`);
}

module.exports = {
  generateTLDR,
  batchTLDR,
  getOptimalLayer,
  estimateTokens,
  clearCache,
  CONFIG
};

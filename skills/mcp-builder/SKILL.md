---
name: mcp-builder
description: "Step-by-step MCP server scaffolding workflow: research, plan, implement, test, evaluate. Scope: guided MCP server creation process ONLY. For general MCP expertise, debugging, or advanced patterns, use the mcp-expert agent instead."
license: See anthropics/skills LICENSE
version: "1.0.0"
metadata:
  author: https://github.com/anthropics
  triggers: build MCP server, create MCP server, scaffold MCP, new MCP tool, MCP implementation, MCP development
---

# MCP Server Development Guide

Step-by-step workflow for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools.

## Scope Boundaries

**IN SCOPE:** Guided 4-phase workflow for scaffolding and building new MCP servers from scratch. Project setup, tool implementation, testing, and evaluation.

**OUT OF SCOPE:** General MCP expertise, debugging existing MCP servers, advanced patterns (multi-transport, session management, streaming), or MCP protocol deep-dives. For those, use the **mcp-expert** agent instead.

## High-Level Workflow

### Phase 1: Deep Research and Planning

#### 1.1 Understand Modern MCP Design

**API Coverage vs. Workflow Tools:**
Balance comprehensive API endpoint coverage with specialized workflow tools. When uncertain, prioritize comprehensive API coverage.

**Tool Naming and Discoverability:**
Clear, descriptive tool names help agents find the right tools. Use consistent prefixes (e.g., `github_create_issue`, `github_list_repos`) and action-oriented naming.

**Context Management:**
Design tools that return focused, relevant data. Support pagination where applicable.

**Actionable Error Messages:**
Error messages should guide agents toward solutions with specific suggestions and next steps.

#### 1.2 Study MCP Protocol Documentation

Start with the sitemap: `https://modelcontextprotocol.io/sitemap.xml`
Fetch specific pages with `.md` suffix for markdown format.

Key pages to review:
- Specification overview and architecture
- Transport mechanisms (streamable HTTP, stdio)
- Tool, resource, and prompt definitions

#### 1.3 Choose Your Stack

**Recommended: TypeScript** (high-quality SDK, good compatibility, strong typing)
- **Transport**: Streamable HTTP for remote servers, stdio for local servers
- **SDK**: `@modelcontextprotocol/sdk`
- **Validation**: Zod for input schemas

**Alternative: Python**
- **SDK**: `mcp` package (use `from mcp.server import FastMCP`)
- **Validation**: Pydantic for input schemas

#### 1.4 Plan Your Implementation

1. Review the service's API documentation
2. List endpoints to implement, starting with most common operations
3. Identify authentication requirements and data models

### Phase 2: Implementation

#### 2.1 Project Structure

**TypeScript:**
```
my-mcp-server/
  src/
    index.ts          # Server entry point
    tools/            # Tool implementations
    utils/            # Shared utilities (API client, auth, formatting)
  package.json
  tsconfig.json
```

**Python:**
```
my-mcp-server/
  src/
    server.py         # Server entry point
    tools/            # Tool implementations
    utils/            # Shared utilities
  pyproject.toml
```

#### 2.2 Core Infrastructure

Create shared utilities:
- API client with authentication
- Error handling helpers
- Response formatting (JSON/Markdown)
- Pagination support

#### 2.3 Implement Tools

For each tool, define:

**Input Schema** (Zod or Pydantic):
- Include constraints and clear descriptions
- Add examples in field descriptions

**Output Schema** (when possible):
- Define `outputSchema` for structured data
- Use `structuredContent` in responses

**Tool Description:**
- Concise summary of functionality
- Parameter descriptions
- Return type schema

**Annotations:**
- `readOnlyHint`: true/false
- `destructiveHint`: true/false
- `idempotentHint`: true/false
- `openWorldHint`: true/false

### Phase 3: Review and Test

#### 3.1 Code Quality

Review for:
- No duplicated code (DRY principle)
- Consistent error handling
- Full type coverage
- Clear tool descriptions

#### 3.2 Build and Test

**TypeScript:**
```bash
npm run build
npx @modelcontextprotocol/inspector
```

**Python:**
```bash
python -m py_compile your_server.py
# Test with MCP Inspector
```

### Phase 4: Create Evaluations

Create 10 evaluation questions to test effectiveness:

1. **Tool Inspection**: List available tools and understand capabilities
2. **Content Exploration**: Use READ-ONLY operations to explore data
3. **Question Generation**: Create complex, realistic questions
4. **Answer Verification**: Solve each question to verify answers

Each question must be:
- **Independent**: Not dependent on other questions
- **Read-only**: Only non-destructive operations
- **Complex**: Requiring multiple tool calls
- **Realistic**: Based on real use cases
- **Verifiable**: Single, clear answer
- **Stable**: Answer won't change over time

Output format:
```xml
<evaluation>
  <qa_pair>
    <question>Your question here</question>
    <answer>Expected answer</answer>
  </qa_pair>
</evaluation>
```

## Tool Implementation Checklist

- [ ] Clear, descriptive tool name with consistent prefix
- [ ] Input schema with Zod/Pydantic validation
- [ ] Output schema defined where possible
- [ ] Actionable error messages
- [ ] Pagination support for list operations
- [ ] Authentication handled properly
- [ ] Rate limiting respected
- [ ] Annotations set (readOnly, destructive, idempotent)
- [ ] Tool description is concise and accurate
- [ ] Tested with MCP Inspector

## Constraints

### MUST DO
- Follow the 4-phase workflow in order
- Research the API thoroughly before implementing
- Use typed schemas for all inputs and outputs
- Include actionable error messages
- Test with MCP Inspector before declaring done
- Create evaluation questions

### MUST NOT DO
- Skip the research/planning phase
- Implement tools without input validation
- Return raw API responses without formatting
- Ignore pagination for list endpoints
- Deploy without testing
- Handle general MCP debugging (that is mcp-expert agent territory)

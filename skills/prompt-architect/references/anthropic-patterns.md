# Anthropic Prompting Patterns

Best practices for prompting Claude — actionable patterns with code examples.
Source: Anthropic official docs (Claude 4.x, 2025).

---

## System Prompt Design

### Structure a system prompt in sections

```xml
<role>
You are a senior backend engineer specializing in Python APIs.
</role>

<context>
You are working on a Flask SaaS application. The codebase uses:
- Flask + SQLAlchemy + PostgreSQL
- Alembic for migrations
- pytest for testing
</context>

<instructions>
- Follow existing patterns in the codebase
- Write tests for every function you create
- Validate inputs at system boundaries
- Never hardcode secrets
</instructions>

<output_format>
Return code blocks with file paths as comments on the first line.
</output_format>
```

### Minimal effective system prompt

```
You are an expert at [DOMAIN]. Your goal is [SPECIFIC OUTCOME].
Always [KEY BEHAVIOR]. Never [KEY ANTI-BEHAVIOR].
Respond in [FORMAT] unless asked otherwise.
```

### Separate persona from instructions

```xml
<!-- WRONG: mixed persona and rules -->
You are a helpful assistant. Be concise. Don't hallucinate.

<!-- RIGHT: layered, scannable -->
<persona>Expert technical writer</persona>
<constraints>
- Max 3 sentences unless user asks for detail
- Always cite sources when making factual claims
- If uncertain, say "I'm not sure" rather than guessing
</constraints>
```

---

## Tool Use Patterns

### Define tools with precise descriptions

```python
tools = [
    {
        "name": "search_database",
        "description": "Search the product database by name, SKU, or category. Returns up to 10 matching products. Use this when the user asks about a specific product or wants to browse.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query — product name, SKU, or category"
                },
                "limit": {
                    "type": "integer",
                    "description": "Max results to return. Default: 5. Max: 10.",
                    "default": 5
                }
            },
            "required": ["query"]
        }
    }
]
```

### Tool use agentic loop

```python
import anthropic

client = anthropic.Anthropic()

def run_agent(user_message: str, tools: list) -> str:
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            tools=tools,
            messages=messages
        )

        # If Claude wants to use a tool
        if response.stop_reason == "tool_use":
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            tool_results = []

            for tool_use in tool_uses:
                result = execute_tool(tool_use.name, tool_use.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": str(result)
                })

            # Add Claude's response + tool results to messages
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

        # Done — extract final text
        elif response.stop_reason == "end_turn":
            return next(b.text for b in response.content if b.type == "text")
```

### Force tool use

```python
# Force Claude to use a specific tool
response = client.messages.create(
    model="claude-opus-4-6",
    tools=tools,
    tool_choice={"type": "tool", "name": "search_database"},
    messages=messages
)

# Force any tool use (but Claude chooses which)
tool_choice={"type": "any"}

# Default: Claude decides
tool_choice={"type": "auto"}
```

---

## Structured Output Patterns

### JSON output via system prompt

```python
system = """You are a data extraction assistant.
Always respond with valid JSON matching this schema:
{
  "entities": [{"name": string, "type": string, "confidence": float}],
  "summary": string,
  "language": string
}
Do not include any text outside the JSON object."""

response = client.messages.create(
    model="claude-sonnet-4-6",
    system=system,
    messages=[{"role": "user", "content": text_to_analyze}]
)
import json
data = json.loads(response.content[0].text)
```

### Prefilling to lock output format

```python
# Claude will complete from the prefill — guarantees JSON start
messages = [
    {"role": "user", "content": "Extract entities from: 'Apple released iPhone 16 in 2024.'"},
    {"role": "assistant", "content": "{"}  # prefill — Claude continues here
]

response = client.messages.create(
    model="claude-sonnet-4-6",
    messages=messages
)
# response will be: "entities": [...], "summary": "..."  — complete the JSON yourself
full_json = "{" + response.content[0].text
```

### XML tags for structured extraction

```xml
<!-- Prompt: Ask Claude to wrap output in tags -->
"Analyze this support ticket and respond using these exact XML tags:
<category>bug|feature|question|other</category>
<priority>critical|high|medium|low</priority>
<summary>One sentence summary</summary>
<action>Recommended next step</action>"
```

```python
import re

def extract_tag(text: str, tag: str) -> str:
    match = re.search(f"<{tag}>(.*?)</{tag}>", text, re.DOTALL)
    return match.group(1).strip() if match else ""

category = extract_tag(response, "category")
priority = extract_tag(response, "priority")
```

---

## Prompt Caching

### Cache static context (system prompt + documents)

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "You are a legal analyst...",
            "cache_control": {"type": "ephemeral"}  # cache this block
        },
        {
            "type": "text",
            "text": large_legal_document,  # 50k tokens
            "cache_control": {"type": "ephemeral"}  # cache this too
        }
    ],
    messages=[{"role": "user", "content": user_question}]
)

# Check cache performance
cache_read = response.usage.cache_read_input_tokens
cache_written = response.usage.cache_creation_input_tokens
```

### Cache breakpoint rules

```
- Caching requires min 1024 tokens (Sonnet/Opus) or 2048 (Haiku)
- Up to 4 cache breakpoints per request
- Cache TTL: 5 minutes (refreshed on each hit)
- Cost: cache write = 1.25x normal, cache read = 0.1x normal
- Best for: static system prompts, reference docs, few-shot examples
```

---

## Multi-Turn Strategies

### Stateful conversation with memory

```python
class Conversation:
    def __init__(self, system: str):
        self.system = system
        self.messages = []

    def send(self, user_message: str) -> str:
        self.messages.append({"role": "user", "content": user_message})

        response = client.messages.create(
            model="claude-sonnet-4-6",
            system=self.system,
            messages=self.messages,
            max_tokens=2048
        )

        assistant_message = response.content[0].text
        self.messages.append({"role": "assistant", "content": assistant_message})
        return assistant_message

    def reset(self):
        self.messages = []
```

### Inject context mid-conversation

```python
# Useful for RAG: inject retrieved docs without showing to user
def inject_context(messages: list, context: str) -> list:
    """Prepend retrieved context to the last user message."""
    enriched = messages.copy()
    last_user = enriched[-1]["content"]
    enriched[-1] = {
        "role": "user",
        "content": f"<context>\n{context}\n</context>\n\n{last_user}"
    }
    return enriched
```

### Summarize to manage context window

```python
SUMMARIZE_PROMPT = """Summarize this conversation history in under 200 words.
Preserve: key decisions, open questions, agreed facts.
Discard: pleasantries, repetition, resolved details."""

def compress_history(messages: list) -> list:
    if len(messages) <= 6:
        return messages  # no need to compress

    history_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in messages[:-2]
    )
    summary = client.messages.create(
        model="claude-haiku-4-5",  # cheap model for summarization
        messages=[{"role": "user", "content": f"{SUMMARIZE_PROMPT}\n\n{history_text}"}]
    ).content[0].text

    return [
        {"role": "user", "content": f"[Conversation summary]\n{summary}"},
        {"role": "assistant", "content": "Understood. Continuing from the summary."},
        *messages[-2:]  # keep last exchange intact
    ]
```

---

## Claude-Specific Best Practices

### Give WHY, not just WHAT

```
# Weak: what to do
"Validate all user inputs."

# Strong: what + why
"Validate all user inputs because this form is used by non-technical users
who may make typos. Errors should be friendly and guide correction, not
just reject with 'invalid input'."
```

### Avoid "think" with Opus when extended thinking is off

```
# Use instead of "think about":
- "Consider..."
- "Evaluate..."
- "Analyze..."
- "Assess the trade-offs..."
```

### Request explicit behaviors

Claude 4.x follows instructions precisely but is not proactively "helpful"
beyond what is asked. Request explicitly:

```
"Implement the feature AND flag any edge cases you notice."
"Fix the bug AND document the root cause for future reference."
"Write the component AND add unit tests."
```

### Use headers and lists for complex instructions

Claude parses structured prompts more reliably than prose walls:

```
## Task
Refactor the payment module.

## Requirements
- Preserve all existing test coverage
- Extract PaymentService into its own file
- Add JSDoc to public methods

## Do NOT
- Change the public API surface
- Add new dependencies
- Modify tests
```

### Batch requests with explicit separators

```python
items = ["item1", "item2", "item3"]
prompt = "Process each item below. Use --- as separator between outputs.\n\n"
prompt += "\n---\n".join(items)
# Parse by splitting on ---
```

---

## Token Efficiency

| Technique | Savings | Trade-off |
|-----------|---------|-----------|
| Prompt caching | 90% on cache hits | 5-min TTL, 1.25x write cost |
| Haiku for classification | 10x cheaper | Less nuanced |
| Prefilling | Removes preamble | Must parse continuation |
| Structured output | Reduces post-processing | More brittle |
| Batch API | 50% discount | 24-hour delay |

---

## Model Selection Guide

| Use Case | Model | Reason |
|----------|-------|--------|
| Complex reasoning, architecture | claude-opus-4-6 | Best reasoning |
| Code generation, main dev work | claude-sonnet-4-6 | Best coding |
| Classification, routing, summarization | claude-haiku-4-5 | Fastest, cheapest |
| Agents with extended thinking | claude-opus-4-6 | Thinking tokens |
| High-volume pipelines | claude-haiku-4-5 | Cost at scale |

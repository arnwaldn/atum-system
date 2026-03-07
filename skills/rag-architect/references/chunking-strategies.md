# Chunking Strategies

## Why Chunking Matters

Chunking directly affects retrieval quality. Too large = noise dilutes signal. Too small = missing context. The goal is chunks that are **semantically self-contained** and **relevant to likely queries**.

## Strategy Comparison

| Strategy | How | Pros | Cons | Best For |
|----------|-----|------|------|----------|
| Fixed-size | Split every N tokens | Simple, predictable | Breaks mid-sentence | Unstructured text, quick prototyping |
| Recursive | Split by separators (\\n\\n, \\n, ., space) | Respects boundaries | May produce uneven chunks | General-purpose documents |
| Semantic | Split when embedding similarity drops | Context-aware | Slower, model-dependent | High-quality retrieval needs |
| Document-structure | Split by headers/sections | Preserves document structure | Requires structured input | Markdown, HTML, technical docs |
| Sentence | Split by sentences | Clean boundaries | May be too small | FAQ, knowledge bases |
| Sliding window | Overlapping fixed-size windows | No information loss at boundaries | Redundant storage | Critical accuracy requirements |

## Recommended Defaults

```
Chunk size: 500-1000 tokens (start with 512)
Overlap: 10-20% of chunk size (50-100 tokens)
Strategy: Recursive for general, Document-structure for docs
```

## Overlap Strategy

| Overlap | Effect |
|---------|--------|
| 0% | Risk losing context at boundaries |
| 10% | Minimal safety net |
| 20% | Good balance (recommended default) |
| 50% | Heavy redundancy, higher storage/cost |

## Metadata Enrichment

Every chunk should carry metadata for filtering and context:

| Field | Purpose | Example |
|-------|---------|---------|
| `source` | Document origin | `docs/api-reference.md` |
| `chunk_index` | Position in document | `3` (third chunk) |
| `total_chunks` | Total chunks from this doc | `12` |
| `section_title` | Heading hierarchy | `API > Authentication > OAuth` |
| `timestamp` | Document date | `2026-01-15` |
| `doc_id` | Parent document identifier | `doc_abc123` |
| `content_type` | Type of content | `code`, `prose`, `table`, `faq` |

## Advanced Techniques

### Parent-Child Chunking

Store small chunks for retrieval, return larger parent chunks for context.

```
Document → Large parent chunks (2000 tokens)
         → Small child chunks (200 tokens, linked to parent)

Query matches child chunk → Return parent chunk to LLM
```

### Contextual Chunking

Prepend document-level context to each chunk:

```
Original chunk: "The rate limit is 100 requests per minute."
Contextual chunk: "API Reference > Rate Limiting: The rate limit is 100 requests per minute."
```

### Proposition-Based Chunking

Convert paragraphs into self-contained propositions (atomic facts):

```
Input: "Founded in 2020, Acme Corp operates in 30 countries. Revenue was $500M last year."
Propositions:
  - "Acme Corp was founded in 2020."
  - "Acme Corp operates in 30 countries."
  - "Acme Corp's revenue was $500M last year."
```

## Evaluation: Finding the Right Chunk Size

1. **Create test queries** (50-100 representative user questions)
2. **Label ground truth** (which documents/passages answer each query)
3. **Test multiple sizes** (256, 512, 1024, 2048)
4. **Measure recall@k** for each size
5. **Plot size vs. recall** — find the sweet spot

Typical results:
- Too small (128): High precision, low recall (misses context)
- Sweet spot (512-1024): Best recall@k for most domains
- Too large (2048+): Noise dilutes relevance, lower precision

## Content-Type Specific Strategies

| Content | Strategy | Notes |
|---------|----------|-------|
| Technical docs | Document-structure (by headers) | Preserve header hierarchy in metadata |
| Code | Function/class-level splitting | Include imports and docstrings |
| Legal/contracts | Clause-level splitting | Preserve clause numbering |
| Chat/conversations | By conversation turn or topic | Include speaker context |
| Tables | Row-level or table-level | Convert to text description |
| PDFs | Page-aware + OCR if needed | Handle headers/footers, page breaks |

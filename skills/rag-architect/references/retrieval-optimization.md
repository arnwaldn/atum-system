# Retrieval Optimization

## Hybrid Search

Combine vector (semantic) search with keyword (BM25) search for best results.

### Why Hybrid?

| Query Type | Vector Search | Keyword Search | Best Approach |
|-----------|--------------|----------------|---------------|
| Conceptual ("how to handle errors") | Strong | Weak | Vector |
| Exact match ("error code E-4021") | Weak | Strong | Keyword |
| Mixed ("Python timeout error handling") | Good | Good | Hybrid |

### Fusion Strategies

| Strategy | How | When |
|----------|-----|------|
| Reciprocal Rank Fusion (RRF) | `score = sum(1/(k + rank_i))` | Default, robust |
| Weighted linear | `score = α * vector + (1-α) * keyword` | When you can tune α |
| Cascade | Keyword first → vector rerank | When exact matches are critical |

**Recommended default**: RRF with k=60, top_k=20 from each method.

## Reranking

After initial retrieval (top-k=50-100), rerank to select the best results for the LLM context.

### Reranker Options

| Reranker | Type | Quality | Speed | Cost |
|----------|------|---------|-------|------|
| Cohere Rerank | API | High | Fast | $0.50/1K searches |
| Cross-Encoder (ms-marco) | Model | High | Slow | Free (self-hosted) |
| ColBERT | Late interaction | High | Medium | Free (self-hosted) |
| LLM-as-reranker | Prompt-based | Highest | Slowest | Expensive |

### Reranking Pipeline

```
Query → Initial retrieval (top 50-100, fast)
      → Reranker (select top 5-10, accurate)
      → LLM context window
```

## Query Transformation

Improve retrieval by transforming the user query before searching.

### Techniques

| Technique | How | When |
|-----------|-----|------|
| Query expansion | Add synonyms and related terms | Short, ambiguous queries |
| HyDE | Generate hypothetical answer, embed that | Complex questions |
| Multi-query | Generate 3-5 variations, search all, deduplicate | Broad topics |
| Step-back | Ask a more general question first | Specific questions needing context |
| Decomposition | Break complex query into sub-queries | Multi-part questions |

### HyDE (Hypothetical Document Embeddings)

```
User query: "How does photosynthesis work?"
→ LLM generates: "Photosynthesis is the process by which plants convert
   light energy into chemical energy, using chlorophyll in chloroplasts
   to transform CO2 and water into glucose and oxygen..."
→ Embed the generated passage (not the query)
→ Search with this embedding
```

Why: Generated passages are closer in embedding space to real documents than short queries.

## Metadata Filtering

Use metadata to narrow search scope before vector similarity.

### Pre-filtering vs Post-filtering

| Approach | How | Pros | Cons |
|----------|-----|------|------|
| Pre-filter | Filter metadata THEN vector search | Faster, guaranteed results match filter | May miss relevant results |
| Post-filter | Vector search THEN filter metadata | Better recall | May return fewer results than top-k |

### Common Filter Patterns

```
# Multi-tenant: always filter by tenant
results = index.query(vector, filter={"tenant_id": "abc"})

# Time-scoped: recent documents only
results = index.query(vector, filter={"timestamp": {"$gte": "2025-01-01"}})

# Category-specific
results = index.query(vector, filter={"category": {"$in": ["api", "tutorial"]}})
```

## Context Window Optimization

### How Much Context to Retrieve

| LLM Context | Recommended Retrieved Tokens | Chunks (at 512 tokens) |
|-------------|-------------------------------|------------------------|
| 4K | 1,500-2,000 | 3-4 |
| 8K | 3,000-5,000 | 6-10 |
| 32K | 8,000-15,000 | 15-30 |
| 128K+ | 15,000-50,000 | 30-100 |

**Rule**: Don't fill the entire context window. Leave room for the query, system prompt, and generation.

### Lost in the Middle

LLMs pay more attention to the beginning and end of the context. Place the most relevant chunks first.

### Deduplication

Remove near-duplicate chunks before passing to LLM:
- Exact hash dedup (fast)
- Cosine similarity threshold (>0.95 = duplicate)
- LLM-based dedup (expensive, highest quality)

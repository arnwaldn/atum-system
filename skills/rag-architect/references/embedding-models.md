# Embedding Models

## Model Comparison

| Model | Dimensions | Max Tokens | MTEB Score | Best For |
|-------|-----------|------------|------------|----------|
| OpenAI text-embedding-3-large | 3072 (or less) | 8191 | ~64 | General purpose, dimension reduction |
| OpenAI text-embedding-3-small | 1536 | 8191 | ~62 | Cost-effective, good quality |
| Cohere embed-v3 | 1024 | 512 | ~65 | Multilingual, search-optimized |
| BGE-large-en-v1.5 | 1024 | 512 | ~64 | Open-source, English |
| E5-mistral-7b-instruct | 4096 | 32768 | ~66 | Long context, instruction-tuned |
| Voyage-3 | 1024 | 32000 | ~67 | Code + text, long context |
| Jina-embeddings-v3 | 1024 | 8192 | ~66 | Multilingual, task-specific LoRA |

## Selection Decision Framework

```
Need simplicity + API?
  → OpenAI text-embedding-3-small (good default)

Need best quality + API?
  → Voyage-3 or Cohere embed-v3

Need open-source / self-hosted?
  → BGE-large or E5-mistral

Need multilingual?
  → Cohere embed-v3 or Jina-embeddings-v3

Need code understanding?
  → Voyage-3 (code + text optimized)

Need long documents (>8K tokens)?
  → E5-mistral-7b or Jina-embeddings-v3
```

## Dimension Trade-offs

| Dimensions | Memory per 1M vectors | Quality | Use When |
|------------|----------------------|---------|----------|
| 256 | ~1 GB | Lower | Very large scale, cost-sensitive |
| 512 | ~2 GB | Good | Balanced cost/quality |
| 1024 | ~4 GB | Better | Production default |
| 1536 | ~6 GB | High | OpenAI default |
| 3072 | ~12 GB | Highest | Maximum quality, cost not primary concern |

**Matryoshka embeddings** (OpenAI v3): Train at full dimension, truncate at inference for cost savings with minimal quality loss.

## Fine-Tuning Embeddings

### When to Fine-Tune

| Signal | Action |
|--------|--------|
| Domain-specific vocabulary (medical, legal, code) | Fine-tune on domain pairs |
| Retrieval recall < 70% with off-the-shelf | Fine-tune improves domain alignment |
| Unique similarity semantics | Train on your definition of "similar" |
| Off-the-shelf works well (>80% recall) | Don't fine-tune — diminishing returns |

### Fine-Tuning Approach

1. **Collect pairs**: (query, relevant_document) pairs from your domain
2. **Generate hard negatives**: Documents that are similar but NOT relevant
3. **Train**: Contrastive learning (InfoNCE loss) or sentence transformers
4. **Evaluate**: Compare recall@k before/after on held-out set

### Minimum Data Requirements

| Dataset Size | Expected Improvement |
|-------------|---------------------|
| 100 pairs | Minimal, likely overfitting |
| 1,000 pairs | Noticeable for narrow domains |
| 10,000 pairs | Significant improvement |
| 100,000+ pairs | Near-optimal for the domain |

## Embedding Pipeline Best Practices

- **Normalize** embeddings to unit length for cosine similarity
- **Batch** embedding requests (not one-by-one) for throughput
- **Cache** embeddings — don't re-embed unchanged documents
- **Version** embeddings with model identifier (migration strategy)
- **Prefix** queries vs documents if model supports it (e.g., E5: "query: " vs "passage: ")
- **Benchmark** on YOUR data — MTEB scores are averages across many domains

## Model Migration Strategy

When upgrading embedding models:

1. **Dual-write**: Embed new documents with both old and new models
2. **Backfill**: Re-embed existing documents with new model (batch job)
3. **Shadow mode**: Query both indexes, compare results
4. **Cutover**: Switch to new model when confident
5. **Cleanup**: Remove old embeddings after validation period

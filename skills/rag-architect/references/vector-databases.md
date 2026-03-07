# Vector Databases

## Comparison Matrix

| Database | Type | Hosting | Max Vectors | Metadata Filtering | Hybrid Search | Best For |
|----------|------|---------|-------------|-------------------|---------------|----------|
| Pinecone | Managed | Cloud-only | Billions | Yes (rich) | Yes | Production SaaS, serverless |
| Weaviate | Open-source | Self/Cloud | Billions | Yes (GraphQL) | Yes (BM25) | Multi-modal, graph + vector |
| Qdrant | Open-source | Self/Cloud | Billions | Yes (rich) | Yes | Performance-critical, Rust-based |
| Chroma | Open-source | Self-hosted | Millions | Yes (basic) | No | Prototyping, local dev |
| Milvus | Open-source | Self/Cloud | Billions | Yes | Yes | Large-scale, GPU acceleration |
| pgvector | Extension | Any Postgres | Millions | Yes (SQL) | Yes (with tsvector) | Existing Postgres stack |

## Selection Decision Framework

```
Need managed, zero-ops?
  → Pinecone (serverless pricing, auto-scaling)

Already on Postgres?
  → pgvector (no new infra, SQL-native)

Need multi-modal (text + images)?
  → Weaviate (native multi-modal modules)

Need maximum performance?
  → Qdrant (Rust, SIMD optimizations)

Prototyping / small scale?
  → Chroma (simplest API, runs in-process)

Enterprise scale, GPU available?
  → Milvus (distributed, GPU-accelerated)
```

## Index Types

### HNSW (Hierarchical Navigable Small World)

- **How**: Multi-layer graph, greedy search from top to bottom
- **Pros**: Fast query (~ms), high recall, no training needed
- **Cons**: High memory (stores full vectors + graph), slow build
- **Best for**: Most production use cases
- **Params**: `M` (connections per node, 16-64), `efConstruction` (build quality, 100-500), `efSearch` (query quality, 50-200)

### IVF (Inverted File Index)

- **How**: Cluster vectors, search only relevant clusters
- **Pros**: Lower memory, faster build than HNSW
- **Cons**: Requires training, lower recall at same speed
- **Best for**: Very large datasets (>10M vectors)
- **Params**: `nlist` (clusters, sqrt(N)), `nprobe` (clusters searched, 1-50)

### Flat (Brute Force)

- **How**: Compare query against every vector
- **Pros**: Perfect recall
- **Cons**: O(N) query time
- **Best for**: Small datasets (<50K), ground truth evaluation

## Quantization (Memory Reduction)

| Method | Compression | Recall Impact | Use When |
|--------|------------|---------------|----------|
| Product Quantization (PQ) | 4-8x | Moderate | Memory-constrained, large datasets |
| Scalar Quantization (SQ) | 2-4x | Minimal | Good balance of speed/accuracy |
| Binary Quantization | 32x | Significant | First-pass filtering, re-rank with full vectors |

## Distance Metrics

| Metric | Use When |
|--------|----------|
| Cosine similarity | Text embeddings (most common) |
| Euclidean (L2) | Image embeddings, spatial data |
| Dot product | Normalized vectors, MaxSim |

## Multi-Tenancy Patterns

| Pattern | How | Pros | Cons |
|---------|-----|------|------|
| Metadata filter | `tenant_id` in metadata | Simple, shared index | Noisy neighbors |
| Namespace/partition | Logical partition per tenant | Isolation, still shared infra | Management complexity |
| Separate index | One index per tenant | Full isolation | Cost, operational overhead |

## Production Checklist

- [ ] Index type selected and tuned (HNSW params or IVF nprobe)
- [ ] Distance metric matches embedding model's training objective
- [ ] Metadata schema defined (source, timestamp, chunk_id, tenant_id)
- [ ] Quantization evaluated if memory is a concern
- [ ] Multi-tenancy strategy chosen
- [ ] Backup and disaster recovery plan
- [ ] Monitoring: query latency p50/p99, index size, recall estimation

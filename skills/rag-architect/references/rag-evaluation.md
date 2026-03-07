# RAG Evaluation

## Evaluation Dimensions

RAG systems have two components to evaluate independently:

| Component | Question | Metrics |
|-----------|----------|---------|
| Retrieval | "Did we find the right documents?" | Precision@k, Recall@k, MRR, NDCG |
| Generation | "Did the LLM answer correctly?" | Faithfulness, Answer Relevance, Hallucination rate |

## Retrieval Metrics

### Precision@k

Of the top-k retrieved documents, how many are relevant?

```
Precision@5 = relevant_in_top_5 / 5
```

### Recall@k

Of all relevant documents, how many did we retrieve in top-k?

```
Recall@10 = relevant_in_top_10 / total_relevant_documents
```

### MRR (Mean Reciprocal Rank)

How high is the first relevant result?

```
RR = 1 / rank_of_first_relevant
MRR = average(RR across all queries)
```

### NDCG (Normalized Discounted Cumulative Gain)

Measures ranking quality with graded relevance (not just binary).

```
DCG = sum(relevance_i / log2(i+1))
NDCG = DCG / ideal_DCG
```

### Target Benchmarks

| Metric | Good | Great | Notes |
|--------|------|-------|-------|
| Precision@5 | > 0.6 | > 0.8 | Most results are relevant |
| Recall@10 | > 0.7 | > 0.9 | Most relevant docs found |
| MRR | > 0.5 | > 0.7 | Relevant result in top 2 |
| NDCG@10 | > 0.6 | > 0.8 | Good ranking quality |

## Generation Metrics

### Faithfulness

Does the answer use ONLY information from the retrieved context? No hallucination.

```
Faithfulness = claims_supported_by_context / total_claims
Target: > 0.9
```

### Answer Relevance

Does the answer actually address the question?

```
Answer Relevance = relevant_sentences / total_sentences
Target: > 0.8
```

### Hallucination Rate

How often does the LLM generate information not in the retrieved context?

```
Hallucination Rate = hallucinated_claims / total_claims
Target: < 0.1
```

## Evaluation Frameworks

### RAGAS (Retrieval-Augmented Generation Assessment)

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

result = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall]
)
```

### TruLens

```python
from trulens_eval import TruChain, Feedback

f_relevance = Feedback(provider.relevance).on_input_output()
f_groundedness = Feedback(provider.groundedness_measure_with_cot_reasons)
```

### Custom Evaluation (Recommended Starting Point)

1. **Create test set**: 50-100 questions with known answers and source documents
2. **Run pipeline**: For each question, retrieve + generate
3. **Measure retrieval**: Is the correct source in the top-k?
4. **Measure generation**: Does the answer match the expected answer?
5. **Track over time**: Run evaluation after every change

## Debugging Retrieval

### Retrieval Failure Analysis

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Correct doc not in top-k | Embedding mismatch | Try HyDE, query expansion, or fine-tune |
| Correct doc retrieved but ranked low | Reranking issue | Add reranker or tune reranker |
| Too many irrelevant results | Chunk size too large | Reduce chunk size, add metadata filters |
| Missing context (partial answer) | Chunk too small | Increase chunk size or use parent-child |
| Wrong tenant's data returned | Filter missing | Add tenant_id pre-filter |

### Systematic Debugging Workflow

```
1. Log: query, retrieved chunks, scores, final answer
2. Review failures: categorize by type (retrieval vs generation)
3. For retrieval failures: check if correct doc is indexed, embedding quality
4. For generation failures: check if context contains the answer
5. A/B test: change one variable, measure impact on eval set
```

## Continuous Monitoring (Production)

| Metric | How | Alert When |
|--------|-----|------------|
| Retrieval latency p99 | Timer on search call | > 500ms |
| Empty results rate | Count queries with 0 results | > 5% |
| Low confidence rate | Track top score distribution | Median score < 0.5 |
| User feedback (thumbs up/down) | In-app feedback | Satisfaction < 80% |
| Embedding drift | Compare new doc embeddings to index distribution | Distribution shift detected |
| Index staleness | Track last ingestion timestamp | > 24h behind |

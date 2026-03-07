# CI/CD Chaos Integration

## Why Automate Chaos in CI/CD?

Manual game days are valuable but infrequent. Continuous chaos testing in CI/CD catches regressions between game days and ensures new code doesn't break existing resilience patterns.

## Pipeline Integration Points

```
Build → Unit Tests → Integration Tests → Deploy to Staging
  → Smoke Tests → CHAOS TESTS → Performance Tests → Deploy to Prod
```

Chaos tests run AFTER deployment to staging, BEFORE promotion to production.

## Pipeline Configuration Examples

### GitHub Actions

```yaml
name: Chaos Test Suite
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6am

jobs:
  chaos-tests:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: ./scripts/deploy-staging.sh

      - name: Wait for healthy
        run: ./scripts/wait-healthy.sh --timeout 120

      - name: Run chaos - network latency
        run: |
          ./chaos/inject-latency.sh --target api-service --delay 200ms --duration 60s
          ./chaos/verify-steady-state.sh --metric error_rate --threshold 0.01
          ./chaos/rollback-latency.sh

      - name: Run chaos - pod kill
        run: |
          ./chaos/kill-pod.sh --target api-service --count 1
          ./chaos/verify-recovery.sh --timeout 30s
          ./chaos/verify-steady-state.sh --metric availability --threshold 0.999

      - name: Run chaos - dependency failure
        run: |
          ./chaos/block-dependency.sh --target payment-service --duration 30s
          ./chaos/verify-circuit-breaker.sh --service api-service
          ./chaos/unblock-dependency.sh --target payment-service

      - name: Cleanup
        if: always()
        run: ./chaos/cleanup-all.sh

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: chaos-results
          path: chaos/results/
```

### GitLab CI

```yaml
chaos-test:
  stage: resilience
  environment: staging
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_PIPELINE_SOURCE == "schedule"
  script:
    - deploy-to-staging
    - wait-for-healthy --timeout 120
    - run-chaos-experiment --type network-latency --target api --delay 200ms --duration 60s
    - verify-steady-state --metric error_rate --max 0.01
    - run-chaos-experiment --type pod-kill --target api --count 1
    - verify-recovery --timeout 30s
    - verify-steady-state --metric availability --min 0.999
  after_script:
    - rollback-chaos-experiments
    - collect-chaos-metrics
  artifacts:
    paths:
      - chaos/results/
    when: always
```

## Chaos Test Script Patterns

### Verify Steady State

```bash
#!/bin/bash
# verify-steady-state.sh
METRIC=$1
THRESHOLD=$2
DURATION=${3:-30}  # seconds to observe

echo "Verifying $METRIC stays within threshold for ${DURATION}s..."

for i in $(seq 1 $DURATION); do
  VALUE=$(curl -s "http://metrics:9090/api/v1/query?query=$METRIC" | jq '.data.result[0].value[1]')
  if (( $(echo "$VALUE > $THRESHOLD" | bc -l) )); then
    echo "FAIL: $METRIC=$VALUE exceeds threshold $THRESHOLD at ${i}s"
    exit 1
  fi
  sleep 1
done

echo "PASS: $METRIC stayed within threshold for ${DURATION}s"
```

### Verify Recovery

```bash
#!/bin/bash
# verify-recovery.sh
TIMEOUT=${1:-60}
CHECK_INTERVAL=5

echo "Waiting for recovery (timeout: ${TIMEOUT}s)..."

for i in $(seq $CHECK_INTERVAL $CHECK_INTERVAL $TIMEOUT); do
  HEALTHY=$(curl -s http://api:8080/health | jq '.status')
  if [ "$HEALTHY" = '"healthy"' ]; then
    echo "PASS: Recovered in ${i}s"
    exit 0
  fi
  echo "  ${i}s: still recovering..."
  sleep $CHECK_INTERVAL
done

echo "FAIL: Did not recover within ${TIMEOUT}s"
exit 1
```

## Chaos Tools Integration

### Litmus Chaos (Kubernetes)

```yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: api-chaos
  namespace: staging
spec:
  appinfo:
    appns: staging
    applabel: app=api-service
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '30'
            - name: CHAOS_INTERVAL
              value: '10'
            - name: FORCE
              value: 'false'
```

### Chaos Mesh (Kubernetes)

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: api-latency
  namespace: staging
spec:
  action: delay
  mode: all
  selector:
    namespaces: [staging]
    labelSelectors:
      app: api-service
  delay:
    latency: '200ms'
    jitter: '50ms'
  duration: '60s'
```

### Toxiproxy (Application-Level)

```bash
# Create proxy for upstream service
toxiproxy-cli create payment_proxy -l 0.0.0.0:8474 -u payment-service:8080

# Add latency toxic
toxiproxy-cli toxic add payment_proxy -t latency -a latency=200 -a jitter=50

# Remove toxic after test
toxiproxy-cli toxic remove payment_proxy -n latency_downstream
```

## Results Tracking

### Chaos Test Report Format

```json
{
  "run_id": "chaos-2026-03-06-001",
  "pipeline": "main-chaos-suite",
  "timestamp": "2026-03-06T10:00:00Z",
  "environment": "staging",
  "experiments": [
    {
      "name": "network-latency-200ms",
      "target": "api-service",
      "hypothesis": "API handles 200ms upstream latency without errors",
      "result": "pass",
      "metrics": {
        "error_rate_before": 0.001,
        "error_rate_during": 0.003,
        "error_rate_after": 0.001,
        "p99_latency_before_ms": 150,
        "p99_latency_during_ms": 380,
        "recovery_time_s": 5
      }
    }
  ],
  "overall_result": "pass",
  "duration_s": 300
}
```

## Progressive Rollout of Chaos Testing

| Phase | Duration | Activities |
|-------|----------|-----------|
| 1: Manual | Month 1-2 | Run first game day, document scenarios |
| 2: Scripted | Month 3-4 | Scripts for top 3 scenarios, manual trigger |
| 3: CI/CD | Month 5-6 | Add to pipeline, run on every deploy |
| 4: Scheduled | Month 7+ | Weekly automated chaos suite + quarterly game days |

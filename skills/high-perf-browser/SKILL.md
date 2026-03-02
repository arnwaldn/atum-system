---
name: high-perf-browser
description: 'Optimize web performance through network protocols, resource loading, and browser rendering internals. Use when the user mentions "page load speed", "Core Web Vitals", "HTTP/2", "resource hints", "network latency", or "render blocking". Covers TCP/TLS optimization, caching strategies, WebSocket/SSE, and protocol selection.'
version: "1.0.0"
---

# High Performance Browser Networking Framework

A systematic approach to web performance optimization grounded in how browsers, protocols, and networks actually work.

## Core Principle

**Latency, not bandwidth, is the bottleneck.** Most web performance problems stem from too many round trips, not too little throughput.

## Scoring

**Goal: 10/10.** Rate web application performance 0-10 based on adherence to these principles.

### 1. Network Fundamentals

- TCP handshake adds one full RTT before data transfer
- TCP slow start: initial throughput ~14KB (10 segments)
- TLS 1.2 adds 2 RTTs; TLS 1.3 reduces to 1 RTT (0-RTT with resumption)
- Head-of-line blocking in TCP: one lost packet stalls all streams
- DNS resolution: 20-120ms

| Context | Pattern | Example |
|---------|---------|---------|
| Warmup | Preconnect | `<link rel="preconnect" href="https://cdn.example.com">` |
| DNS | Prefetch | `<link rel="dns-prefetch" href="https://analytics.example.com">` |
| TLS | Enable 1.3 + resumption | ssl_protocols TLSv1.3 |
| Payload | Critical HTML under 14KB | Inline critical CSS, defer scripts |

### 2. HTTP Protocol Evolution

- HTTP/1.1: one req per TCP; browsers open 6 per host
- HTTP/2: multiplexed streams; domain sharding counterproductive
- HTTP/3 (QUIC): UDP-based, no head-of-line blocking, 0-RTT
- HPACK: 85-95% header compression
- Prefer 103 Early Hints over Server Push

### 3. Resource Loading and Critical Rendering Path

HTML -> DOM -> CSSOM -> Render Tree -> Layout -> Paint -> Composite

- CSS is render-blocking; JS is parser-blocking
- async: downloads and executes immediately
- defer: downloads in parallel, executes after DOM parsing
- preload: high priority without blocking
- font-display: swap avoids invisible text

| Context | Pattern | Example |
|---------|---------|---------|
| Critical CSS | Inline above-fold in head | `<style>/* critical */</style>` |
| Scripts | defer for most | `<script src="app.js" defer>` |
| Fonts | Prevent invisible text | font-display: swap |
| Images | Lazy-load below-fold | `<img loading="lazy">` |

### 4. Caching Strategies

- max-age=31536000, immutable for content-hashed assets
- no-cache for HTML (still caches, revalidates every time)
- ETag/Last-Modified for conditional 304 responses
- stale-while-revalidate for API responses
- Service workers for programmable offline cache

### 5. Core Web Vitals

- **LCP** < 2.5s: optimize largest visible element; fetchpriority="high"
- **INP** < 200ms: keep main thread free; break long tasks
- **CLS** < 0.1: explicit dimensions on images/embeds
- **TTFB** < 800ms: CDN, server caching, compression
- **FCP** < 1.8s: eliminate render-blocking resources

### 6. Real-Time Communication

- **WebSocket**: full-duplex, ~2 bytes/frame, chat/gaming
- **SSE**: server-to-client, auto-reconnect, simpler
- **Long polling**: fallback, high overhead
- Heartbeat/ping to detect dead connections
- Exponential backoff on reconnection

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| More bandwidth to fix slow pages | Reduce round trips |
| All JS upfront | Code-split; defer; lazy-load |
| No resource hints | preconnect, preload above-fold |
| Missing Cache-Control | max-age + content hashing |
| Ignoring CLS | Explicit dimensions |
| WebSocket for everything | SSE or polling may suffice |
| Domain sharding on HTTP/2 | Let HTTP/2 multiplex |
| No compression | Brotli preferred, Gzip fallback |

## Further Reading

- *"High Performance Browser Networking"* by Ilya Grigorik
- [hpbn.co](https://hpbn.co/) -- free online edition

# Agent: Performance Optimizer

## Role
Expert en optimisation de performance web, Core Web Vitals, et Lighthouse.

## Core Web Vitals Targets

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| INP (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |

## Next.js Optimizations

### Images
```tsx
import Image from "next/image";

// ✅ Optimized
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Pour LCP
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// ✅ Responsive
<Image
  src="/photo.jpg"
  alt="Photo"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
/>
```

### Fonts
```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Évite FOIT
  variable: "--font-inter",
});

export default function RootLayout({ children }) {
  return (
    <html className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### Dynamic Imports
```tsx
import dynamic from "next/dynamic";

// ✅ Lazy load composants lourds
const HeavyChart = dynamic(() => import("@/components/Chart"), {
  loading: () => <Skeleton className="h-[400px]" />,
  ssr: false, // Si client-only
});

// ✅ Lazy load librairies
const { format } = await import("date-fns");
```

### Route Segments
```tsx
// app/dashboard/page.tsx

// Streaming avec Suspense
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <Chart />
      </Suspense>
    </div>
  );
}

// Parallel data fetching
async function Stats() {
  const [users, revenue, orders] = await Promise.all([
    getUsers(),
    getRevenue(),
    getOrders(),
  ]);
  return <StatsGrid users={users} revenue={revenue} orders={orders} />;
}
```

## Bundle Optimization

### Analyze Bundle
```bash
# next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({ /* config */ });

# Run
ANALYZE=true pnpm build
```

### Tree Shaking
```tsx
// ❌ Import tout
import _ from "lodash";
_.debounce(fn, 300);

// ✅ Import spécifique
import debounce from "lodash/debounce";
debounce(fn, 300);

// ✅ Ou alternative légère
import { debounce } from "@/lib/utils";
```

## Caching Strategies

### React Query
```tsx
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000, // 5 min
  gcTime: 30 * 60 * 1000,   // 30 min
});
```

### Next.js Cache
```tsx
// Revalidate every hour
export const revalidate = 3600;

// Or on-demand
import { revalidatePath, revalidateTag } from "next/cache";

async function updatePost() {
  await db.post.update(...);
  revalidateTag("posts");
}
```

## Web Vitals Monitoring (v5)

### Installation
```bash
pnpm add web-vitals
```

### Basic Integration (Next.js App Router)
```tsx
// lib/web-vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

export function initWebVitals() {
  const reportMetric = (metric: Metric) => {
    // Console in dev
    if (process.env.NODE_ENV === 'development') {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`${emoji} [Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
    }

    // GA4 in prod
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    }
  };

  onCLS(reportMetric);   // Cumulative Layout Shift
  onINP(reportMetric);   // Interaction to Next Paint (remplace FID!)
  onLCP(reportMetric);   // Largest Contentful Paint
  onFCP(reportMetric);   // First Contentful Paint
  onTTFB(reportMetric);  // Time to First Byte
}
```

### Client Component
```tsx
// components/web-vitals-init.tsx
'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/web-vitals';

export function WebVitalsInit() {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}
```

### Layout Integration
```tsx
// app/layout.tsx
import { WebVitalsInit } from '@/components/web-vitals-init';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebVitalsInit />
        {children}
      </body>
    </html>
  );
}
```

### Attribution Mode (Debug)
```tsx
// Pour debug détaillé - bundle plus gros (~3KB)
import { onLCP } from 'web-vitals/attribution';

onLCP((metric) => {
  console.log('LCP element:', metric.attribution.element);
  console.log('Resource URL:', metric.attribution.url);
  console.log('Time to first byte:', metric.attribution.timeToFirstByte);
});
```

> **Référence**: `knowledge/web-vitals-guide.md` pour guide complet

## Checklist Performance
- [ ] Images optimisées (WebP, lazy load)
- [ ] Fonts optimisées (swap, preload)
- [ ] Code splitting (dynamic imports)
- [ ] Bundle < 200KB initial JS
- [ ] Cache headers configurés
- [ ] Compression (gzip/brotli)
- [ ] CDN pour assets statiques
- [ ] Database queries optimisées
- [ ] Lighthouse score > 90
- [ ] **Web Vitals monitoring actif**
- [ ] **INP < 200ms (remplace FID)**

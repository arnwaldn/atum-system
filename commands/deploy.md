---
description: Deploiement multi-plateformes (user)
---

# /deploy - Multi-Platform Deployment

## USAGE
```
/deploy vercel
/deploy cloudflare
/deploy railway
/deploy docker
/deploy preview
```

## PLATEFORMES

### vercel
Deploy sur Vercel
```
/deploy vercel
/deploy vercel --prod
```

### cloudflare
Deploy sur Cloudflare Pages/Workers
```
/deploy cloudflare pages
/deploy cloudflare workers
```

### railway
Deploy sur Railway
```
/deploy railway
```

### docker
Build et push Docker
```
/deploy docker --registry=ghcr.io
```

### preview
Deploy preview branch
```
/deploy preview
```

## WORKFLOW VERCEL

### 1. Verification
```bash
# Verifier CLI
vercel --version || npm i -g vercel
```

### 2. Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### 3. Deploy
```bash
# Preview
vercel

# Production
vercel --prod
```

### 4. Output
```yaml
deployment:
  url: https://project-xxx.vercel.app
  production_url: https://project.com
  status: ready
  build_time: 45s
```

## WORKFLOW CLOUDFLARE

### Pages
```bash
# Build static
npm run build

# Deploy
npx wrangler pages deploy ./out
```

### Workers
```bash
# Deploy worker
npx wrangler deploy
```

## WORKFLOW DOCKER

### 1. Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### 2. Build & Push
```bash
docker build -t app:latest .
docker tag app:latest ghcr.io/user/app:latest
docker push ghcr.io/user/app:latest
```

## CHECKLIST PRE-DEPLOY

```yaml
pre_deploy_check:
  build:
    - npm run build # passes
    - npm test # passes

  env:
    - DATABASE_URL: set
    - API_KEY: set

  config:
    - vercel.json: valid
    - package.json.scripts.build: exists

  security:
    - No secrets in code
    - .env in .gitignore
```

## OPTIONS
| Option | Description |
|--------|-------------|
| --prod | Production deploy |
| --preview | Preview URL |
| --env=X | Environment |
| --force | Skip checks |

## ENVIRONNEMENTS

| Plateforme | Preview | Production |
|------------|---------|------------|
| Vercel | Auto per branch | `--prod` |
| Cloudflare | `--branch=X` | default |
| Railway | Environments | Prod env |

## POST-DEPLOY

```yaml
post_deploy:
  - Verify URL accessible
  - Check environment variables
  - Test critical paths
  - Monitor logs
  - Update DNS if needed
```

## MCP UTILISES
- Bash (CLI commands)
- GitHub (CI/CD)
- filesystem (config files)

# Deployment Guide

Follow these steps after configuring CognoDB and seeding data.

## 1. Seed the database

```bash
cp .env.example .env
# Edit .env with your CognoDB URI and password
npm run seed
```

Expected output:

```text
Seed complete: <nodes> nodes, <relationships> relationships.
```

## 2. Push to GitHub

```bash
git add .
git commit -m "Add supply chain traceability graph app for CognoDB assignment"
gh repo create supply-chain-graph --public --source=. --remote=origin --push
```

If the repo already exists:

```bash
git remote add origin https://github.com/<your-username>/supply-chain-graph.git
git push -u origin main
```

## 3. Deploy to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
vercel env add NEO4J_URI
vercel env add NEO4J_USERNAME
vercel env add NEO4J_PASSWORD
vercel --prod
```

### Option B: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Add environment variables:
   - `NEO4J_URI`
   - `NEO4J_USERNAME` (`cognodb`)
   - `NEO4J_PASSWORD`
4. Deploy

## 4. Verify production

```bash
curl https://<your-app>.vercel.app/api/health
```

Expected:

```json
{"status":"ok","message":"Connected to CognoDB"}
```

## 5. Capture deliverables

### Screenshots (add to README or `docs/screenshots/`)

1. Dashboard with KPI cards and risk panels
2. Products page with BOM detail
3. Suppliers page with filters
4. Impact analysis with multi-hop results

### Screen recording (~2–3 minutes)

Suggested flow:

1. Mention the use case (supply chain traceability)
2. Show dashboard risk queries
3. Run supplier outage impact analysis
4. Show product BOM and alternative paths
5. Mention CognoDB + parameterized Cypher

## 6. Submit

Email `hr@wexa.ai`:

```text
Subject: CognoDB Assignment 2 – <Your Name>

GitHub: https://github.com/<your-username>/supply-chain-graph
Demo: https://<your-app>.vercel.app
```

Keep your CognoDB instance running until Wexa responds.

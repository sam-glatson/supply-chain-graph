# Submission Steps

The application code is complete at `C:\Users\samgl\Projects\supply-chain-graph`. Complete these final steps with your accounts:

## 1. Configure CognoDB

1. Create a free instance at [console.cognodb.com](https://console.cognodb.com/signup)
2. Copy `.env.example` to `.env` and fill in credentials
3. Seed the database:

```bash
npm run seed
npm run dev
```

## 2. Create GitHub repository

`gh` CLI is not installed on this machine. Create the repo manually:

1. Create a new repo on GitHub named `supply-chain-graph`
2. From the project directory:

```bash
git config user.email "you@example.com"
git config user.name "Your Name"
git add .
git commit -m "Add supply chain traceability graph app for CognoDB assignment"
git branch -M main
git remote add origin https://github.com/<your-username>/supply-chain-graph.git
git push -u origin main
```

## 3. Deploy to Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add environment variables: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
3. Deploy and verify: `https://<your-app>.vercel.app/api/health`

## 4. Capture media

- Take screenshots of Dashboard, Products, Suppliers, and Impact pages
- Record a 2–3 minute walkthrough video

## 5. Email Wexa

```text
To: hr@wexa.ai
Subject: CognoDB Assignment 2 – <Your Name>

GitHub: https://github.com/<your-username>/supply-chain-graph
Demo: https://<your-app>.vercel.app
```

Keep your CognoDB instance running until you hear back.

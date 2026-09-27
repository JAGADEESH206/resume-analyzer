# Deployment Guide — AI Resume Analyzer

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel (Frontend)                   │
│  React + Vite  →  https://your-app.vercel.app            │
└──────────────────────────┬──────────────────────────────┘
                           │  API calls (fetch)
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Railway / Render (Backend)                  │
│  FastAPI + OpenAI  →  https://your-api.up.railway.app   │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Deploy the Backend (Railway — Recommended)

### Option A: Railway (Easiest)

1. **Push your code to GitHub**
   ```bash
   cd C:\Users\my\resume-analyzer
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/resume-analyzer.git
   git push -u origin main
   ```

2. **Go to [railway.app](https://railway.app)** → Sign up/Login

3. **Create New Project** → **Deploy from GitHub repo**

4. **Select your repository** — Railway auto-detects `railway.json`

5. **Add Environment Variable:**
   - Go to your service → **Variables** tab
   - Add: `OPENAI_API_KEY` = `sk-your-actual-key`

6. **Deploy!** Railway will build and deploy automatically.

7. **Copy your domain** from the **Settings** → **Networking** section:
   ```
   https://your-project-name.up.railway.app
   ```

### Option B: Render

1. Push code to GitHub (same as above)

2. Go to [render.com](https://render.com) → **New** → **Web Service**

3. Connect your repo, select **Python** environment

4. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. Add environment variable: `OPENAI_API_KEY`

6. Deploy and copy your URL: `https://your-app.onrender.com`

---

## Step 2: Deploy the Frontend (Vercel)

1. **Update the API URL** in your frontend:
   ```bash
   cd C:\Users\my\resume-analyzer\frontend
   copy .env.example .env
   ```
   Edit `.env` and paste your Railway/Render URL:
   ```
   VITE_API_URL=https://your-project-name.up.railway.app
   ```

2. **Push frontend to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Deploy frontend"
   git push
   ```

3. **Go to [vercel.com](https://vercel.com)** → Sign up/Login

4. **Add New Project** → Import your GitHub repo

5. **Configure:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend` (if your repo has both backend/ and frontend/)
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`

6. **Add Environment Variable:**
   - `VITE_API_URL` = `https://your-project-name.up.railway.app`

7. **Deploy!**

---

## Step 3: Verify Deployment

1. **Test the backend health:**
   ```
   https://your-api.up.railway.app/api/health
   ```
   Should return: `{"status":"ok","service":"resume-analyzer"}`

2. **Open your frontend:**
   ```
   https://your-app.vercel.app
   ```

3. **Test with a sample resume** — upload a PDF or paste text

---

## Environment Variables Summary

| Platform | Variable | Value |
|----------|----------|-------|
| Railway/Render | `OPENAI_API_KEY` | `sk-your-actual-openai-key` |
| Vercel | `VITE_API_URL` | `https://your-backend.up.railway.app` |

---

## Local Development

```bash
# Terminal 1 — Backend
cd C:\Users\my\resume-analyzer\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Terminal 2 — Frontend
cd C:\Users\my\resume-analyzer\frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:8000` automatically.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Failed to fetch` | Backend not running or wrong `VITE_API_URL` |
| CORS errors | Backend CORS is configured for localhost:5173 and localhost:3000 |
| `422 Unprocessable Entity` | Resume or job description too short (min 50 chars) |
| `400 Unsupported file type` | Only `.pdf`, `.docx`, `.txt` allowed |
| `502 OpenAI API error` | Check your `OPENAI_API_KEY` is valid and has credits |
| Vercel build fails | Ensure `rootDirectory` is set to `frontend` in Vercel settings |

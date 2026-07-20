# Deployment & Environment Specification

This document details deployment strategies, local environment configurations, secrets management, and cloud setups for production.

---

## 💻 Local Development Setup

To initialize backend and frontend services locally:

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 2. Backend Initialization
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Set environment parameters in a `.env` file at the root:
   ```env
   DATABASE_PATH=database/airbnb_intelligence.db
   GITHUB_TOKEN=your_personal_access_token
   GITHUB_REPOSITORY=your_username/airbnb-market-intelligence
   ALLOWED_ORIGINS=http://localhost:3000
   ```
4. Start the development FastAPI server:
   ```bash
   uvicorn backend.api.main:app --reload --host 127.0.0.1 --port 8000
   ```

### 3. Frontend Initialization
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install node packages:
   ```bash
   npm install
   ```
3. Configure target API address:
   Create a `frontend/.env.local` file:
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   ```
4. Boot Next.js in development mode:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🚀 Production Cloud Deployment

### 1. Backend (Render / Docker)
The backend service is containerized using the root `Dockerfile` and deployed on **Render**:
- **Environment**: Web Service (Docker).
- **Build Command**: Auto-detected from `Dockerfile`.
- **Start Command**: `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `DATABASE_PATH=database/airbnb_intelligence.db`
  - `GITHUB_TOKEN=your_pat_with_repo_push_scope`
  - `GITHUB_REPOSITORY=your_username/airbnb-market-intelligence`

### 2. Frontend (Vercel)
The frontend Next.js application is deployed on **Vercel**:
- **Framework Preset**: Next.js.
- **Root Directory**: `frontend/`.
- **Build Command**: `npm run build`.
- **Output Directory**: `.next`.
- **Environment Variables**:
  - `NEXT_PUBLIC_API_BASE=https://your-backend-render-url.onrender.com`

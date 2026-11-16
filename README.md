# MIRA — AI-Powered Personal Shopping & Research Assistant

> MIRA is an AI-driven personal research and shopping assistant designed to eliminate biased influencer marketing and product research fatigue. It analyzes online product reviews, ingredients, and discussions against a user's unique profile (skin type, undertone, sensitivities, and budget) to deliver transparent, referenced, and unbiased research reports.

---

## 🚀 System Architecture

* **Mobile App:** React Native + Expo (TypeScript)
* **Backend API:** Python + FastAPI
* **Database:** PostgreSQL / SQLite + SQLAlchemy (Alembic for migrations)
* **AI & Agent Service:** LLM API (OpenAI / Gemini) + Web Search Tooling (Tavily / DuckDuckGo / SerpApi)
* **Authentication:** JWT (JSON Web Tokens) with Argon2/Bcrypt password hashing

---

## 📁 Repository Structure

```text
mira/
├── backend/                  # FastAPI Backend API
│   ├── app/
│   │   ├── api/v1/           # API Endpoints (Auth, Profile, Research, Inventory)
│   │   ├── core/             # Configuration, security, database session
│   │   ├── models/           # SQLAlchemy DB models
│   │   ├── schemas/          # Pydantic schemas (DTOs)
│   │   ├── services/         # AI agent engine & web search services
│   │   └── main.py           # FastAPI entrypoint
│   ├── requirements.txt
│   └── .env.example
├── mobile/                   # React Native (Expo) Mobile Application
│   ├── app/                  # Expo Router file-based screens
│   └── src/                  # Components, API clients, theme, types
├── .gitignore
└── README.md
```

---

## 🛠️ Getting Started

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation: `http://localhost:8000/docs`

### 2. Mobile Setup
```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with the **Expo Go** app on your physical iOS/Android device.

# MIRA — Project Guide (read this first)

Short reference for humans and AI assistants. Reading this file should be enough to work on the project without scanning the whole repo.

## What it is
MIRA is a personal beauty research assistant. The user saves a skin profile (type, undertone, concerns, sensitivities, budget), browses a product catalog, and gets an unbiased, personalized fit report for any product (name or link). Users keep a personal shelf of products they own / tested / want.

## Stack
| Part | Tech | Path |
|---|---|---|
| App (iOS / Android / **Web**) | Expo + React Native + TypeScript (react-native-web) | `mobile/` |
| API | FastAPI + SQLAlchemy (SQLite default) + JWT | `backend/` |

## Run
```bash
# API  -> http://localhost:8000  (docs: /docs)
cd backend && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Web  -> http://localhost:8082
cd mobile && npx expo start --web --port 8082
# Checks
cd mobile && npx tsc --noEmit
cd backend && ./venv/bin/python -m unittest discover tests
```
Demo account (auto-seeded on backend start): `demo@mira.app` / `mira1234`.

## Product decisions (do not break)
- **Default language English, default theme dark.** Turkish is a language option. Language + theme are stored in `localStorage` (web).
- **Black + powder-pink** identity. Dark `accent #E7A4B1` on `#0B0B0D`; light accent `#C7768A` on `#FAF6F7`.
- **No emoji anywhere** in the UI or in report text (backend strips them).
- **No developer/technical wording for end users** (no "engine", "guardrail", latency, scores of internal models). Only plain, useful information.
- **Form-style UI.** On web the app is a single centered column (max 560px) made of cards with labeled fields and chips.
- One language per screen: UI text comes from `translations.ts`; report text is localized by the backend (`lang` param).
- No "Atelier" section. Tabs: **Discover, Shelf, Profile**.

## Mobile app (`mobile/`)
```
App.tsx                       Providers, tab bar, simple state-based navigation (tab + product query)
src/context/AppContext.tsx    lang, mode (dark/light), colors `c`, `t(key)`, `errorText(e)`, auth state (signedIn/signOut)
src/theme/colors.ts           darkColors / lightColors
src/i18n/translations.ts      `en` dictionary + `tr` dictionary (same keys, typed). Add every new string to BOTH.
src/api/client.ts             Singleton `apiClient`, token persistence, ApiError, `imageUrl()`
src/storage.ts                localStorage (web) / memory (native) key-value helper
src/components/ui.tsx         Screen, Card, Title, Label, Body, Field, Button, Chips, ProductImage, ErrorText
src/screens/AuthScreen.tsx    Sign in / create account (+ EN|TR switch)
src/screens/OnboardingScreen.tsx First-login 2-step form: skin profile + numeric budget (TL), then optional shelf add (skippable)
src/screens/DiscoverScreen.tsx Home Dashboard: AI Chatbot ("What do you need today?" -> Top 3 matches), Today's Top 3 Picks, Catalog grid with prices
src/screens/ProductScreen.tsx Personalized report: fit score, verdict, pros, cons, warnings, sources, add to shelf
src/screens/ShelfScreen.tsx   Add form + list (owned / tested / wishlist)
src/screens/ProfileScreen.tsx Skin profile form (with numeric budget_max in TL), language, theme, daily quota, sign out
```
Conventions: styling is inline using `c` from `useApp()`; reuse `components/ui.tsx` instead of creating new primitives; TypeScript `strict` must pass.

## Backend (`backend/app/`)
```
main.py                       App, CORS, static mount (/static), demo-user seeder
api/v1/router.py              Mounts routers under /api/v1
api/v1/endpoints/auth.py      POST /auth/register, /auth/login (form), GET /auth/export-data, DELETE /auth/delete-account
api/v1/endpoints/profile.py   GET/PUT /profile/me
api/v1/endpoints/catalog.py   GET /catalog/, GET /catalog/daily-top3, POST /catalog/chat {prompt, lang}
api/v1/endpoints/research.py  POST /research/analyze {query_or_url, lang}, GET /research/quota, /research/history
api/v1/endpoints/inventory.py GET/POST /inventory/, DELETE /inventory/{id}
services/catalog_service.py   Curated seed catalog + broad-query detection
services/obf_sync.py          Open Beauty Facts official JSON API sync + SQLite `catalog_products` table (160+ products + live search cache)
services/recommender_service.py Hard-constraint + semantic Top-3 recommender (budget/finish/category/shelf-similarity) + optional Gemini/OpenAI/Ollama
services/ai_agent.py          Report generation pipeline (classify -> formulation -> triggers -> skin match -> reality check)
services/laya_engine.py       Verdict / safety rules
services/report_i18n.py       Cleans + localizes report text (EN/TR), strips emoji and "GUARDRAIL ..." markers
services/search_service.py    Review search; rag_knowledge_base.py ingredient knowledge
models/entities.py, schemas/dto.py, core/*   DB models, DTOs, config/security
```
Report fields used by the app: `product_name, suitability_score (0-100), suitability_reason, reality_check_verdict (BUY|CONSIDER|SKIP|REDUNDANT), reality_check_reason, pros, cons, clinical_warnings, sources[{title,url}]`. If the query is a broad brand/category, `mode: "suggestions"` + `suggested_products` is returned instead.

Adding report text: write it in `ai_agent.py`/`laya_engine.py`, then add its English/Turkish counterpart to `services/report_i18n.py` (`TR_TO_EN`, `_EN_TO_TR_RAW` or `_DYNAMIC`), otherwise the other language will show the original sentence.

## Known gaps / ideas
- Catalog product text (pros/cons) exists only in Turkish and is not shown in the UI; cards show brand, name, rating, shade swatch.
- Catalog images: 6 real packshots are local; other products use remote stock photos.
- Auth token is kept in `localStorage` on web, in memory on native.
- Possible next steps: product detail photo, filters (brand), editing shelf items, history screen (`/research/history`).

# Personal Finance Dashboard — Product Requirements Document

**Version:** 1.3
**Date:** March 8, 2026
**Status:** v1.3 Complete

---

## Overview

A web-based personal finance dashboard that guides users through a financial onboarding flow, analyzes their portfolio and financial health with AI, visualizes portfolio performance against major benchmarks, and provides personalized advice via a multi-turn AI chat and AI-ranked credit card recommendations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 18, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 2 |
| Backend | FastAPI, Uvicorn |
| Data Layer | Pandas, NumPy |
| AI | OpenAI GPT-4o-mini (via `openai` SDK) |
| Validation | Pydantic v2 |
| Deployment | Vercel (frontend), cloud backend |

---

## User Flow

```
/ (root)              ← onboarding wizard (entry point)
  ├── /onboarding     ← dedicated onboarding page (same wizard)
  ├── /select         ← user picks assets & enters values
  │     └── /pdashboard  ← portfolio analysis with charts & ratios
  ├── /health         ← AI-powered financial health score & insights
  └── /advisor        ← AI chat + credit card recommendations
```

---

## Requirements

### 1. Asset Universe

- [x] 20 pre-defined investable assets
- [x] 4 asset classes: cash, stocks, bonds, crypto
- [x] Stocks: VTI, VXUS, QQQ, BRK.B, SPY, AAPL, TSLA, JNJ, JPM, PG, XOM
- [x] Bonds: BND, VTIP, TLT, SLV
- [x] Crypto: BTC, ETH, SOL, LINK
- [x] Cash: USD (stable, no volatility)
- [x] Assets stored in `assets.json` with id, name, class, ticker

---

### 2. Asset Selection Page (`/select`)

- [x] Fetch asset list from backend on load
- [x] Display assets grouped by asset class with color coding (green=cash, blue=stocks, purple=bonds, orange=crypto)
- [x] Dollar value input per selected asset
- [x] Checkbox toggle to include/exclude an asset
- [x] "Select All" / "Select None" buttons
- [x] Input validation (no negative values)
- [x] Encode portfolio into URL query params (`?h=VTI:50000,BND:30000`)
- [x] Persist last holdings to `localStorage["lastHoldings"]` on submit
- [x] Navigate to `/pdashboard` on submission

---

### 3. Portfolio Dashboard (`/pdashboard`)

- [x] Server-side rendered (async Next.js server component)
- [x] Parse holdings from URL query params
- [x] Fetch `UserProfile` from `POST /portfolio/custom`
- [x] Fetch price history from `POST /portfolio/custom/price-history`
- [x] Net worth hero card (total portfolio value + "as of" date)
- [x] Asset class breakdown card (value per class)
- [x] Pass data to all child chart components

---

### 4. Portfolio Performance Chart (`Graph.tsx`)

- [x] Line chart showing portfolio value over time (Recharts `LineChart`)
- [x] S&P 500 benchmark line (same starting value as portfolio)
- [x] Bitcoin benchmark line (same starting value as portfolio)
- [x] Toggle visibility of each line independently
- [x] Custom tooltip (formatted date + currency)
- [x] Auto-scaled Y-axis, formatted X-axis (human-readable dates)

---

### 5. Individual Assets Chart (`IndividualAssets.tsx`)

- [x] Stacked line chart showing each holding's estimated value over time
- [x] Unique color per asset (10-color palette)
- [x] Cash holdings rendered as flat (constant) line
- [x] Risky assets share proportional portfolio growth by weight
- [x] Custom tooltip with per-asset value breakdown
- [x] Responsive container

---

### 6. Allocation Charts (`AllocationChart.tsx`)

- [x] Donut/pie chart showing portfolio allocation by asset class or individual holding
- [x] Toggle between "by class" and "by holding" views
- [x] Color-coded by asset class (matches class color scheme)
- [x] Detailed breakdown table alongside chart
- [x] Used on both `/pdashboard` and `/health`

---

### 7. Financial Ratios Panel (`Dashboard.tsx`)

- [x] 8 collapsible accordion sections
- [x] All ratios computed in TypeScript from raw price history data (`ratios.ts`)
- [x] Sentiment color coding per metric (positive / neutral / slightly-negative / very-negative)

**7a. Return Quality:** CAGR, Rolling 1Y / 3Y / 5Y return

**7b. Risk-Adjusted Returns:** Sharpe Ratio, Sortino Ratio, Calmar Ratio

**7c. Drawdown & Downside Risk:** Max Drawdown, Drawdown Duration, Downside Deviation, Ulcer Index

**7d. Market Sensitivity:** Beta vs S&P 500, Alpha, R², Tracking Error, Information Ratio

**7e. Tail Risk:** VaR 95%, VaR 99%, CVaR, Return Skewness, Return Kurtosis

**7f. Concentration:** HHI, Effective Number of Holdings, Top 5 Concentration, Top 10 Concentration

**7g. Allocation Breakdown:** Equity %, Bonds %, Cash %, Crypto %

**7h. Volatility:** Annualized Volatility

**7i. Practical:** Liquidity Score

---

### 8. Sidebar Navigation (`SideBar.tsx`)

- [x] Fixed left sidebar (hidden on onboarding/root pages via `LayoutShell.tsx`)
- [x] "Health" → `/health`
- [x] "Portfolio" → `/pdashboard` (preserves last holdings via URL params; disabled if no holdings)
- [x] "AI Advisor" → `/advisor`
- [x] "Select Assets" → `/select` (bottom of sidebar)
- [x] Active route highlighting

---

### 9. Layout Shell (`LayoutShell.tsx`)

- [x] Root layout wrapper for all pages
- [x] Conditionally renders sidebar (hidden on `/`, `/onboarding`)
- [x] Consistent content padding alongside sidebar width

---

### 10. Backend API (`FastAPI`)

- [x] `GET /health` — health check
- [x] `GET /assets` — full asset catalog
- [x] `POST /portfolio/custom` — builds `UserProfile` from holdings input
- [x] `POST /portfolio/custom/price-history` — returns time series + S&P 500 & Bitcoin benchmarks
- [x] `POST /onboarding/submit` — validates form, triggers AI health analysis, persists results
- [x] `GET /user/onboarding` — returns stored onboarding responses + AI results
- [x] `POST /advisor/chat` — multi-turn financial advisor chat (GPT-4o-mini)
- [x] `POST /advisor/cards` — AI-ranked credit card recommendations (GPT-4o-mini)
- [x] CORS configured for localhost + Vercel production origin
- [x] Pydantic v2 request/response schemas (`schemas.py`)

---

### 11. Data Layer

- [x] `assets.json` — asset catalog (20 assets)
- [x] `assets_close_returns.csv` — daily close prices & returns for all tickers
- [x] `credit_cards.json` — 15 real credit cards with full metadata
- [x] `user_onboarding.json` — persisted onboarding responses + AI results
- [x] `portfolio.py` — portfolio building + weighted return computation
- [x] `finance.py` — CSV loading + data access helpers with module-level caching
- [x] Benchmark simulation (S&P 500, Bitcoin) using same start value
- [x] Cash asset handled as flat/stable value (no return volatility)
- [x] Missing date filling (weekends/holidays → 0% return)

---

### 12. TypeScript Types (`types.ts`)

- [x] `Asset`, `Holding`, `Portfolio`, `UserProfile` — portfolio data shapes
- [x] `PricePoint`, `PortfolioPriceHistory` — time series types
- [x] `DebtBreakdownItem`, `OnboardingSubmitRequest`, `OnboardingSubmitResponse`
- [x] `OnboardingData` — localStorage onboarding shape
- [x] `FinancialContext`, `FinancialContextOnboarding`, `FinancialContextPortfolio`, `FinancialContextHolding`
- [x] `ChatMessage`, `ChatRequest`, `ChatResponse`
- [x] `RankedCard`, `CardCategory`, `ApprovalLikelihood`
- [x] `CardRecommendationRequest`, `CardRecommendationResponse`
- [x] `FinancialProfile` (PascalCase convention)

---

### 13. Frontend API Client (`api.ts`)

- [x] `getAssets()` — `GET /assets`
- [x] `postCustomPortfolio()` — `POST /portfolio/custom`
- [x] `postCustomPriceHistory()` — `POST /portfolio/custom/price-history`
- [x] `getUserOnboarding()` — `GET /user/onboarding`
- [x] `postOnboardingSubmit()` — `POST /onboarding/submit`
- [x] `postAdvisorChat()` — `POST /advisor/chat`
- [x] `postAdvisorCards()` — `POST /advisor/cards`
- [x] Base URL from `NEXT_PUBLIC_API_URL` env var
- [x] Error handling with descriptive messages, TypeScript return types

---

### 14. Shared Frontend Utilities

- [x] `lib/formatters.ts` — `formatCurrency()` shared across all components
- [x] `lib/storage.ts` — `getStorage<T>()` / `setStorage()` safe localStorage wrappers (SSR-safe, try-catch, JSON parse/stringify)

---

### 15. Deployment & Configuration

- [x] `NEXT_PUBLIC_API_URL` for backend URL injection
- [x] Vercel-compatible Next.js build
- [x] CORS origins include Vercel production URL
- [x] Python virtual environment (`.venv/`)
- [x] `requirements.txt` with pinned versions

---

## Phase 2: Onboarding & Financial Health

### 16. Onboarding Wizard (`/` root + `/onboarding`)

- [x] Root route serves `OnboardingWizard` as entry point; redirects to `/health` if already completed
- [x] Welcome screen with value proposition and "Get Started" CTA
- [x] 7-step multi-step form with progress indicator
- [x] Step 1 — Annual income (`IncomeStep.tsx`)
- [x] Step 2 — Total savings (`SavingsStep.tsx`)
- [x] Step 3 — Credit score, 300–850 (`CreditScoreStep.tsx`)
- [x] Step 4 — Total debt (`DebtStep.tsx`)
- [x] Step 5 — Debt breakdown by category (`DebtCategoriesStep.tsx`): Student Loans, Home Loans (Mortgage), Auto Loans, Credit Cards — checkbox + balance per type, auto-sums `totalDebt`; skippable
- [x] Step 6 — "Do you have a portfolio?" yes/no branch (`HasPortfolioStep.tsx`)
- [x] Step 7 — Asset selection + valuation if yes (`AssetsStep.tsx`)
- [x] On submit: calls `POST /onboarding/submit`, persists form + result to `localStorage`, navigates to `/pdashboard`

---

### 17. Financial Health Dashboard (`/health`)

- [x] Fetches stored profile from `GET /user/onboarding`; falls back to `localStorage` on API failure
- [x] Health Score card (0–1000) with rating label (Poor / Fair / Good / Excellent) and animated progress bar
- [x] Net Worth card (formatted USD)
- [x] Total Debt card (`TotalDebtCard.tsx`): segmented debt breakdown by category with amounts and percentages
- [x] Credit Score Meter (`CreditScoreMeter.tsx`): custom SVG arc gauge with color-coded score bands
- [x] Asset Allocation chart (`AllocationChart.tsx`): pie + table
- [x] Financial Health Insights: 3 AI-generated general insights
- [x] Portfolio Insights: 3 AI-generated portfolio-specific insights
- [x] Action Items: 3 AI-generated concrete next steps
- [x] Milestones Section (`MilestonesSection.tsx`): compounding calculator with adjustable time horizon (1–40 yr slider) and monthly contribution input, shows projected growth at 10% APR

---

### 18. AI Health Analysis Service (`services/agent/health.py`)

- [x] GPT-4o-mini integration via shared `services/agent/client.py`
- [x] Health score (0–1000) computed from credit score, DTI, savings rate, portfolio diversification
- [x] 3 financial insights (debt-to-income, savings rate, portfolio composition)
- [x] 3 portfolio-specific insights (holdings analysis, trends, allocation suggestions)
- [x] 3 actionable recommendations
- [x] Results persisted to `user_onboarding.json`

---

### 19. Backend: Onboarding API

- [x] `POST /onboarding/submit` — validates, runs AI analysis, persists to `user_onboarding.json`
- [x] `GET /user/onboarding` — returns stored responses + AI results or `null`
- [x] `DebtBreakdownItem` schema (`category: str`, `balanceUSD: float`)
- [x] Debt breakdown injected into AI health prompt for category-specific insights

---

## Phase 3: AI Advisor

### 20. AI Advisor Page (`/advisor`)

- [x] Accessible from sidebar as "AI Advisor" (always enabled)
- [x] Two-tab layout: "AI Chat" and "Card Recommendations"
- [x] Reads onboarding from `localStorage["onboarding"]` via `getStorage()`
- [x] `ContextStatusBadge`: gold if profile loaded, yellow with onboarding link if missing

---

### 21. AI Chat (`AdvisorChat.tsx`)

- [x] Multi-turn conversation via `POST /advisor/chat`
- [x] Full financial context passed per-request (income, savings, credit score, debt, debt breakdown, net worth, portfolio allocation, holdings)
- [x] Conversation history maintained in React state; last 20 messages sent to API (cost guard)
- [x] 4 starter prompt chips when chat is empty
- [x] User message bubble (right-aligned); assistant bubble (left-aligned with ◈ avatar)
- [x] Animated typing indicator (3 bouncing dots) during response
- [x] Error banner on failure
- [x] Enter to send, Shift+Enter for newline

---

### 22. Credit Card Recommendations (`CardRecommendations.tsx`, `CardTile.tsx`)

- [x] 15-card static catalog in `backend/data/credit_cards.json` covering $0–$695 annual fees, credit tiers 580–750+, all 8 spend categories
- [x] Fetches `POST /advisor/cards` once on tab mount; no refetch on tab switch (`useRef` guard)
- [x] Skeleton loading grid (4 tiles, `animate-pulse`) while fetching
- [x] Per-card tile shows:
  - Match score (0–100) as pure-CSS conic-gradient donut gauge
  - Approval likelihood badge (Excellent / Good / Fair / Low) with color coding
  - Category badges (travel, cashback, dining, gas, groceries, business, student, balance-transfer)
  - Annual fee (emerald "No Annual Fee" / slate "$X/yr")
  - Top 3 relevant highlights
  - Expandable "Why this card for you?" with AI reasoning (italic, left-border accent)
- [x] Disclaimer footer

---

### 23. Backend: Advisor AI Services

**`services/agent/client.py`** (shared)
- [x] Single `OpenAI` client instance, `MODEL_ID = "gpt-4o-mini"`, `load_dotenv()` called once

**`services/agent/chat.py`**
- [x] `_build_system_prompt(context)` — injects onboarding + portfolio data into system prompt
- [x] `advisor_chat(request)` — builds `[system] + history + message` messages array, returns plain text reply
- [x] Stays on personal finance topics; handles missing context gracefully

**`services/agent/cards.py`**
- [x] Module-level `_cards_cache` — `credit_cards.json` loaded from disk once per process
- [x] `_build_card_prompt(context, cards)` — injects user profile + full card catalog into prompt
- [x] `rank_cards(context)` — GPT-4o-mini with `response_format=json_object`; merges AI scores + approval likelihood + reasoning with static card metadata
- [x] Approval likelihood derived from credit score vs. card requirement thresholds

---

## Codebase Quality & Architecture

### 24. Backend Service Architecture

- [x] Shared OpenAI client (`services/agent/client.py`) — eliminates 3 duplicate init blocks
- [x] Module-level CSV caching in `finance.py` (`_df_cache`) — CSV read once per process
- [x] Module-level JSON caching in `cards.py` (`_cards_cache`) — credit cards read once per process
- [x] `services/agent/health.py` — clean of unused helper functions
- [x] All advisor schemas defined in `app/schemas.py` (single source of truth)

### 25. Frontend Architecture

- [x] Single API client (`lib/api.ts`) — all 7 backend endpoints in one file, no duplicate `API_URL`
- [x] `lib/formatters.ts` — `formatCurrency()` defined once, imported everywhere
- [x] `lib/storage.ts` — `getStorage<T>()` / `setStorage()` safe wrappers used across 5+ components
- [x] Type system fully covers all API request/response shapes and UI state

---

## Open Items (Future Work)

| Item | Priority |
|---|---|
| Stream chat responses token-by-token (SSE) | Medium |
| Cache portfolio summary to localStorage so `/advisor` can reference it | Medium |
| Add more assets / allow custom ticker input | Medium |
| Add date range selector for charts | Medium |
| Mobile-responsive layout improvements | Medium |
| Persist portfolios (user accounts or local storage) | Medium |
| Export portfolio as PDF/CSV | Low |
| Dark/light mode toggle | Low |
| Add more benchmark options (gold, MSCI World, etc.) | Low |
| Live credit card API instead of static catalog | Low |
| Persist chat history across sessions | Low |

---

## Summary

| Category | Status |
|---|---|
| Asset Universe (20 assets, 4 classes) | Complete |
| Asset Selection UI (`/select`) | Complete |
| Portfolio Dashboard (`/pdashboard`) | Complete |
| Portfolio Performance Chart (vs S&P 500 + BTC) | Complete |
| Individual Assets Chart | Complete |
| Allocation Chart (pie + table) | Complete |
| Financial Ratios (40+ metrics, 9 sections) | Complete |
| Sidebar Navigation | Complete |
| Layout Shell (conditional sidebar) | Complete |
| Onboarding Wizard (7-step) | Complete |
| Financial Health Dashboard (`/health`) | Complete |
| Credit Score Meter | Complete |
| Total Debt Card (breakdown) | Complete |
| Milestones Calculator | Complete |
| AI Health Analysis (GPT-4o-mini) | Complete |
| Onboarding Backend API (2 endpoints) | Complete |
| AI Advisor Route (`/advisor`) | Complete |
| AI Chat (GPT-4o-mini, multi-turn, financial context) | Complete |
| Credit Card Recommendations (15 cards, AI-ranked) | Complete |
| Advisor Backend API (2 endpoints) | Complete |
| Shared OpenAI client + module-level caching | Complete |
| Shared `formatCurrency` utility | Complete |
| Safe localStorage wrappers | Complete |
| Unified API client (single file) | Complete |
| TypeScript types (full coverage) | Complete |
| Deployment Config (Vercel + CORS) | Complete |

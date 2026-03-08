# Personal Finance Dashboard — Product Requirements Document

**Version:** 1.2
**Date:** March 6, 2026
**Status:** v1.2 Complete

---

## Overview

A web-based personal finance dashboard that lets users compose a custom portfolio from real assets, visualize performance over time against major benchmarks, and analyze risk/return characteristics through institutional-grade financial metrics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 18, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 2 |
| Backend | FastAPI, Uvicorn |
| Data Layer | Pandas, NumPy |
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
- [x] Display assets grouped by asset class
- [x] Color coding per class (green=cash, blue=stocks, purple=bonds, orange=crypto)
- [x] Dollar value input per selected asset
- [x] Checkbox toggle to include/exclude an asset
- [x] "Select All" button
- [x] "Select None" button
- [x] Input validation (no negative values)
- [x] Encode portfolio into URL query params (`?h=VTI:50000,BND:30000`)
- [x] Navigate to dashboard on submission

---

### 3. Dashboard Page (`/pdashboard`) *(renamed from `/dashboard`)*

- [x] Server-side rendered (async Next.js server component)
- [x] Parse holdings from URL query params
- [x] Fetch UserProfile from `POST /portfolio/custom`
- [x] Fetch price history from `POST /portfolio/custom/price-history`
- [x] Display net worth hero value (total portfolio value)
- [x] Holdings breakdown table with allocation percentages
- [x] Pass data to all child chart components

---

### 4. Portfolio Performance Chart (`Graph.tsx`)

- [x] Line chart showing portfolio value over time
- [x] Recharts `LineChart` with `ResponsiveContainer`
- [x] S&P 500 benchmark line (same starting value)
- [x] Bitcoin benchmark line (same starting value)
- [x] Toggle visibility of each line independently
- [x] Custom tooltip with formatted date and currency
- [x] Formatted Y-axis (currency, auto-scaled)
- [x] Formatted X-axis (human-readable dates)
- [x] Dark theme styling

---

### 5. Individual Assets Chart (`IndividualAssets.tsx`)

- [x] Stacked line chart showing each holding's estimated value over time
- [x] Unique color per asset
- [x] Dynamic line rendering based on selected holdings
- [x] Cash holdings rendered as flat (constant) line
- [x] Risky assets share proportional portfolio growth
- [x] Custom tooltip with per-asset value breakdown
- [x] Responsive container
- [x] Legend with asset names

---

### 6. Financial Ratios Panel

- [x] 8 ratio sections with collapsible UI
- [x] All ratios computed in TypeScript from raw price history data (`ratios.ts`)

**6a. Return Quality**
- [x] CAGR (Compound Annual Growth Rate)
- [x] Rolling 1Y return
- [x] Rolling 3Y return
- [x] Rolling 5Y return

**6b. Risk-Adjusted Returns**
- [x] Sharpe Ratio
- [x] Sortino Ratio
- [x] Calmar Ratio

**6c. Drawdown & Downside Risk**
- [x] Max Drawdown
- [x] Drawdown Duration (days)
- [x] Downside Deviation
- [x] Ulcer Index

**6d. Market Sensitivity**
- [x] Beta vs S&P 500
- [x] Alpha
- [x] R² (R-squared)
- [x] Tracking Error
- [x] Information Ratio

**6e. Tail Risk**
- [x] VaR 95%
- [x] VaR 99%
- [x] CVaR (Conditional VaR)
- [x] Return Skewness
- [x] Return Kurtosis

**6f. Concentration**
- [x] Herfindahl-Hirschman Index (HHI)
- [x] Effective Number of Holdings
- [x] Top 5 Concentration
- [x] Top 10 Concentration

**6g. Allocation Breakdown**
- [x] Equity %
- [x] Bonds %
- [x] Cash %
- [x] Crypto %

**6h. Volatility**
- [x] Annualized Volatility

**6i. Practical**
- [x] Liquidity Score

**Ratio Display**
- [x] Sentiment color coding (positive / neutral / negative / very-negative)
- [x] Threshold-based color logic per metric
- [x] Formatted display values (%, ratios, currency)

---

### 7. Sidebar Navigation (`SideBar.tsx`)

- [x] Fixed sidebar layout
- [x] "Select Assets" link → `/select`
- [x] "Portfolio Dashboard" link → `/pdashboard` (preserves last holdings via params)
- [x] "Financial Health" link → `/health`
- [x] "AI Advisor" link → `/advisor`
- [x] Active route highlighting
- [x] Dark theme styling

---

### 8. Chat (`Chat.tsx`)

- [x] Floating chat button (bottom-right) *(removed — replaced by /advisor page)*
- [x] Demo message scaffolding *(replaced by full implementation)*

---

### 9. Backend API (`FastAPI`)

- [x] `GET /health` — health check endpoint
- [x] `GET /assets` — returns full asset catalog
- [x] `POST /portfolio/custom` — builds UserProfile from holdings input
- [x] `POST /portfolio/custom/price-history` — returns time series with S&P 500 & Bitcoin benchmarks
- [x] Pydantic request/response schemas (`schemas.py`)
- [x] CORS configured for localhost + Vercel production origin
- [x] Settings management via `config.py` (Pydantic Settings)

---

### 10. Data Layer

- [x] `assets.json` — asset catalog (20 assets)
- [x] `assets_close_returns.csv` — daily close prices & returns for all tickers
- [x] `test_user.json` — sample portfolio for development
- [x] `portfolio.py` — portfolio building + weighted return computation
- [x] `finance.py` — CSV loading + data access helpers
- [x] Benchmark simulation (S&P 500, Bitcoin) using same start value
- [x] Cash asset handled as flat/stable value (no return volatility)
- [x] Missing date filling (weekends/holidays → 0% return)

---

### 11. TypeScript Types (`types.ts`)

- [x] `Asset` — asset catalog entry
- [x] `Holding` — user holding (asset + value)
- [x] `UserProfile` — full portfolio with allocations
- [x] `PriceHistory` — portfolio + benchmark time series
- [x] `PortfolioDataPoint` — single date's value across all assets

---

### 12. Frontend API Client (`api.ts`)

- [x] `fetchAssets()` — GET /assets
- [x] `fetchPortfolio()` — POST /portfolio/custom
- [x] `fetchPriceHistory()` — POST /portfolio/custom/price-history
- [x] Base URL from `NEXT_PUBLIC_API_URL` env var
- [x] Error handling with descriptive messages
- [x] TypeScript return types

---

### 13. Deployment & Configuration

- [x] `.env.local` / `.env.example` for frontend env config
- [x] `NEXT_PUBLIC_API_URL` for backend URL injection
- [x] Vercel-compatible Next.js build
- [x] CORS origins include Vercel production URL
- [x] `.gitignore` excludes `.venv`, `__pycache__`, `.env.local`
- [x] Python virtual environment (`.venv/`)
- [x] `requirements.txt` with pinned versions

---

---

---

## Phase 2: AI Advisor Dashboard

### 14. New Route: `/advisor`

- [x] Top-level route accessible from sidebar as "AI Advisor"
- [x] No dependency on `?h=` search params — works standalone
- [x] Two-tab layout: "AI Chat" and "Card Recommendations"
- [x] Reads onboarding data from `localStorage["onboarding"]`
- [x] `ContextStatusBadge` shows profile loaded (emerald) or onboarding link (yellow)

### 15. Chat Recommendations (AI Chat tab)

- [x] GPT-4o powered chatbot via `POST /advisor/chat`
- [x] Full financial context passed per-request (onboarding + portfolio if available)
- [x] Dynamic system prompt: role constraints + onboarding tier + portfolio holdings
- [x] Multi-turn conversation — full in-session history maintained in React state
- [x] History truncated to last 20 messages in API call (cost guard)
- [x] Starter prompt chips when chat is empty (4 suggested questions)
- [x] User message bubble (emerald tinted, right-aligned)
- [x] Assistant message bubble (slate, left-aligned with ◈ avatar)
- [x] Animated typing indicator (3 bouncing dots) during API call
- [x] Error banner on failure
- [x] Enter to send, Shift+Enter for newline

### 16. Credit Card Recommendations (Card Recommendations tab)

- [x] Static catalog of 15 real cards in `backend/data/credit_cards.json`
- [x] Cards cover: fee tiers ($0–$695), credit tiers (580–750+), all 8 categories
- [x] Fetches `POST /advisor/cards` once on tab mount (no refetch on tab switch)
- [x] GPT-4o ranks top 5 cards using `with_structured_output()` (type-safe)
- [x] Graceful fallback if GPT-4o structured output fails (returns top 5 unranked)
- [x] `CardTile`: match score donut gauge (pure CSS conic-gradient, no library)
- [x] `CardTile`: approval likelihood badge — excellent / good / fair / low with color coding
- [x] `CardTile`: category badges (travel, cashback, dining, gas, groceries, business, student, balance-transfer)
- [x] `CardTile`: annual fee ("No Annual Fee" emerald / "$X/yr" slate)
- [x] `CardTile`: expandable "Why this card for you?" with AI reasoning (italic, left-border accent)
- [x] Skeleton loading grid (4 tiles with animate-pulse) while fetching
- [x] Disclaimer footer on card results

### 17. Backend: Advisor API

- [x] `POST /advisor/chat` — LangChain GPT-4o chain, full response at once
- [x] System prompt tier 1: role + tone constraints (always present)
- [x] System prompt tier 2: onboarding — income, savings, credit score + tier label, debt, DTI%, savings rate%
- [x] System prompt tier 3: portfolio net worth, allocation %, top 5 holdings by value
- [x] `POST /advisor/cards` — loads `credit_cards.json`, GPT-4o structured output → `RankedCard` list
- [x] Fallback if LLM fails: top 5 catalog cards with `matchScore: 50`, generic reasoning
- [x] HTTP 502 with descriptive error on any LLM failure
- [x] HTTP 500 if `credit_cards.json` not found
- [x] `OPENAI_API_KEY` loaded from `.env` via `pydantic-settings` (`settings` singleton)
- [x] Router mounted at `/advisor` prefix in `main.py`

### 18. Sidebar & Cleanup

- [x] "AI Advisor" nav item added → `/advisor` (always enabled, no gating condition)
- [x] "Dashboard" label renamed to "Portfolio Dashboard" in sidebar nav
- [x] Floating `Chat.tsx` removed from `/dashboard` page (replaced by `/advisor`)

### 19. New TypeScript Types (`types.ts`)

- [x] `OnboardingData` — matches `localStorage["onboarding"]` shape exactly
- [x] `FinancialContext` — `{ onboarding, portfolio }` assembled in `AdvisorShell`
- [x] `ChatMessage` / `ChatRole` — in-session conversation history
- [x] `ChatRequest` / `ChatResponse` — typed API call shapes
- [x] `RankedCard` — full card recommendation with AI fields
- [x] `CardCategory` / `ApprovalLikelihood` — enum-like union types
- [x] `CardRecommendationRequest` / `CardRecommendationResponse`

### 20. Frontend API Client (`advisor-api.ts`)

- [x] `postAdvisorChat()` — POST /advisor/chat
- [x] `postAdvisorCards()` — POST /advisor/cards
- [x] Same pattern as `api.ts` (typed, error-throwing, env-var base URL)

---

---

## Phase 3: Onboarding & Financial Health *(built, not in original PRD)*

### 21. Onboarding Wizard (`/` root + `/onboarding`)

- [x] Root route (`/`) now serves `OnboardingWizard` as the entry point
- [x] Dedicated `/onboarding` route (same wizard, direct access)
- [x] 7-step multi-step form wizard with progress indication
- [x] Step 1 — Annual income input (`IncomeStep.tsx`)
- [x] Step 2 — Total savings input (`SavingsStep.tsx`)
- [x] Step 3 — Credit score input, 0–850 (`CreditScoreStep.tsx`)
- [x] Step 4 — Total debt input (`DebtStep.tsx`)
- [x] Step 5 — Debt breakdown by category (`DebtCategoriesStep.tsx`) — 4 types (Student Loans, Home Loans, Auto Loans, Credit Cards), checkbox + balance input per type, auto-sums to replace `totalDebt`; skippable
- [x] Step 6 — "Do you have a portfolio?" yes/no branch (`HasPortfolioStep.tsx`)
- [x] Step 7 — Asset selection + valuation if yes (`AssetsStep.tsx`)
- [x] Submit wizard → `POST /onboarding/submit`
- [x] Responses persisted in `backend/data/user_onboarding.json`

---

### 22. Financial Health Dashboard (`/health`)

- [x] AI-powered portfolio health score, 0–1000 scale
- [x] Segmented score progress bar with labeled rating tiers (Poor / Fair / Good / Excellent)
- [x] Net worth display (portfolio value + savings − debt)
- [x] Total debt display
- [x] Credit score display
- [x] Asset allocation pie chart (`AllocationChart.tsx`)
- [x] Financial insights panel — 3 AI-generated items
- [x] Portfolio-specific insights panel — 3 AI-generated items
- [x] Action items / recommendations panel — 3 AI-generated items
- [x] Fetches stored profile from `GET /user/onboarding` on page load

---

### 23. Allocation Chart (`AllocationChart.tsx`)

- [x] Pie chart showing portfolio allocation breakdown
- [x] Color-coded by asset class (matches class color scheme)
- [x] Responsive container (Recharts)
- [x] Used on `/health` page

---

### 24. Layout Shell (`LayoutShell.tsx`)

- [x] Root layout wrapper that wraps all pages
- [x] Conditionally renders sidebar (hidden on onboarding flow pages)
- [x] Consistent content padding alongside sidebar width

---

### 25. Backend: Onboarding API

- [x] `POST /onboarding/submit` — validates form data, triggers AI health analysis, persists results to `user_onboarding.json`
- [x] `GET /user/onboarding` — returns stored onboarding quiz responses + AI analysis results
- [x] `DebtBreakdownItem` Pydantic model added to `schemas.py` (`category: str`, `balanceUSD: float`)
- [x] `debtBreakdown: List[DebtBreakdownItem]` added to `OnboardingSubmitRequest` (optional, default `[]`)
- [x] `debtBreakdown` persisted to `user_onboarding.json` via `model_dump()`
- [x] Debt breakdown injected into AI health prompt for category-specific insights

---

### 26. AI Health Analysis Service (`backend/services/agent/health.py`)

- [x] GPT-4o-mini integration for financial profile analysis
- [x] Health score generation (0–1000)
- [x] 3 financial insights (general financial position)
- [x] 3 portfolio-specific insights
- [x] 3 actionable recommendations
- [x] Debt-to-income ratio computed and surfaced in prompt context
- [x] Savings rate computed and surfaced in prompt context

---

## Open Items (Future Work)

| Item | Priority |
|---|---|
| Cache portfolio summary to localStorage so /advisor can reference it | High |
| Stream chat responses token-by-token (SSE) | Medium |
| Add more assets / allow custom ticker input | Medium |
| Persist portfolios (user accounts or local storage) | Medium |
| Add date range selector for charts | Medium |
| Mobile-responsive layout improvements | Medium |
| Export portfolio as PDF/CSV | Low |
| Dark/light mode toggle | Low |
| Add more benchmark options (gold, MSCI World, etc.) | Low |
| Live credit card API instead of static catalog | Low |
| Persist chat history across sessions | Low |

---

## Summary

| Category | Status |
|---|---|
| Asset Universe | Complete |
| Asset Selection UI | Complete |
| Portfolio Dashboard (`/pdashboard`) | Complete |
| Portfolio Performance Chart | Complete |
| Individual Assets Chart | Complete |
| Allocation Chart (pie) | Complete |
| Financial Ratios (40+ metrics) | Complete |
| Sidebar Navigation | Complete |
| AI Advisor Route (`/advisor`) | Complete |
| AI Chat (GPT-4o, multi-turn, financial context) | Complete |
| Credit Card Recommendations (catalog + AI ranking) | Complete |
| Advisor Backend API (2 endpoints) | Complete |
| **Onboarding Wizard (7-step with debt breakdown)** | **Complete** |
| **Financial Health Dashboard (`/health`)** | **Complete** |
| **AI Health Analysis (GPT-4o-mini, scoring + insights)** | **Complete** |
| **Onboarding Backend API (2 endpoints)** | **Complete** |
| **Layout Shell (conditional sidebar)** | **Complete** |
| Backend API | Complete |
| Data Layer | Complete |
| TypeScript Types | Complete |
| API Client | Complete |
| Deployment Config | Complete |

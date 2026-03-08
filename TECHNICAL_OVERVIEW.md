# Technical Overview: AI Advisor Dashboard

**Version:** 1.0
**Date:** March 4, 2026

This document covers the system design, data flows, LLM integration, API reference, and component architecture for the AI Advisor Dashboard feature (`/advisor`).

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Data Flow: Financial Context Assembly](#2-data-flow-financial-context-assembly)
3. [API Reference](#3-api-reference)
4. [LLM Integration](#4-llm-integration)
5. [Prompt Engineering](#5-prompt-engineering)
6. [Credit Card Catalog & Ranking](#6-credit-card-catalog--ranking)
7. [Conversation History Management](#7-conversation-history-management)
8. [Frontend Component Architecture](#8-frontend-component-architecture)
9. [Environment Setup](#9-environment-setup)
10. [Future Extension Points](#10-future-extension-points)

---

## 1. System Architecture

```
Browser (Next.js 15)
│
├── /advisor (page.tsx)
│     └── AdvisorShell (client component)
│           ├── Reads localStorage["onboarding"]
│           ├── Tab: "AI Chat"      → AdvisorChat
│           └── Tab: "Card Recs"   → CardRecommendations
│
│── POST /advisor/chat ─────────────────────────────────────►  FastAPI
│      { message, history[], context }                          chat_routes.py
│                                                               │
│      { reply: string }  ◄─────────────────────────────────── build_system_prompt(ctx)
│                                                               run_chat(prompt, history, msg)
│                                                               LangChain → GPT-4o
│
└── POST /advisor/cards ────────────────────────────────────►  FastAPI
       { context }                                              chat_routes.py
                                                               │
       { cards: RankedCard[] }  ◄────────────────────────────  rank_cards(ctx)
                                                               load credit_cards.json
                                                               GPT-4o structured output
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 18, TypeScript 5, Tailwind CSS 4 |
| Backend | FastAPI, Uvicorn (Python) |
| LLM | GPT-4o via `langchain-openai` |
| LLM Framework | LangChain Core (`langchain-core`) |
| Validation | Pydantic v2 |
| Config | `pydantic-settings` (reads `.env`) |

---

## 2. Data Flow: Financial Context Assembly

The `FinancialContext` object is the central data structure passed to every advisor API call. It carries all available user data so the LLM can give personalized responses.

### Type definition

```typescript
// frontend/app/src/lib/types.ts

type FinancialContext = {
  onboarding: OnboardingData | null;   // from localStorage
  portfolio: FinancialContextPortfolio | null;  // future: from localStorage cache
};

type OnboardingData = {
  income: number;      // annual income in USD
  savings: number;     // total savings in USD
  creditScore: number; // FICO score 300–850
  totalDebt: number;   // total debt in USD
};
```

### Assembly in `AdvisorShell.tsx`

```typescript
// On component mount, read from localStorage
useEffect(() => {
  try {
    const raw = localStorage.getItem("onboarding");
    if (raw) {
      setFinancialContext(prev => ({ ...prev, onboarding: JSON.parse(raw) }));
    }
  } catch { /* ignore */ }
}, []);
```

The onboarding data is written to `localStorage["onboarding"]` by `OnboardingWizard.handleSubmit()` in `frontend/app/src/components/onboarding/OnboardingWizard.tsx`:

```typescript
localStorage.setItem("onboarding", JSON.stringify(formData));
// formData = { income, savings, creditScore, totalDebt }
```

### Serialization to backend

`FinancialContext` is serialized as part of every POST body. Pydantic on the backend validates it against `FinancialContext` schema (optional fields — both `onboarding` and `portfolio` can be `null`).

---

## 3. API Reference

### `POST /advisor/chat`

Generates a personalized financial advisor response given the current message, conversation history, and user's financial context.

**Request body:**
```json
{
  "message": "Should I pay off my student loans or invest?",
  "history": [
    { "role": "user", "content": "How much should I save each month?" },
    { "role": "assistant", "content": "Based on your $80,000 income..." }
  ],
  "context": {
    "onboarding": {
      "income": 80000,
      "savings": 20000,
      "creditScore": 720,
      "totalDebt": 35000
    },
    "portfolio": null
  }
}
```

**Response body:**
```json
{
  "reply": "Given your $35,000 in debt and a DTI of 43.8%, I'd recommend..."
}
```

**Error responses:**
- `502 Bad Gateway` — LLM call failed (OpenAI API error, missing key, etc.)
  ```json
  { "detail": "LLM error: AuthenticationError: ..." }
  ```

**Implementation path:** `backend/chat/chat_routes.py → advisor_chat()`

---

### `POST /advisor/cards`

Returns a personalized ranking of the top 5 credit cards from the static catalog, with AI-generated reasoning for each.

**Request body:**
```json
{
  "context": {
    "onboarding": {
      "income": 80000,
      "savings": 20000,
      "creditScore": 720,
      "totalDebt": 35000
    },
    "portfolio": null
  }
}
```

**Response body:**
```json
{
  "cards": [
    {
      "id": "citi-double-cash",
      "name": "Citi Double Cash Card",
      "issuer": "Citi",
      "annualFee": 0,
      "rewardsSummary": "2% cash back on all purchases...",
      "categories": ["cashback"],
      "approvalLikelihood": "good",
      "matchScore": 88,
      "aiReasoning": "With a credit score of 720 and $35,000 in debt, prioritizing a no-fee card makes sense...",
      "highlights": ["No annual fee", "Flat 2% on everything"],
      "creditScoreRequired": 670
    }
  ]
}
```

**Error responses:**
- `500 Internal Server Error` — `credit_cards.json` not found
- `502 Bad Gateway` — LLM structured output failed (fallback cards returned instead)

**Fallback behavior:** If GPT-4o structured output fails, the endpoint returns the first 5 cards from the catalog with `matchScore: 50` and `aiReasoning: "AI ranking temporarily unavailable."` (never fails with an error to the client).

**Implementation path:** `backend/chat/chat_routes.py → advisor_cards()` → `backend/chat/card_ranker.py → rank_cards()`

---

## 4. LLM Integration

### Chain construction

Both endpoints use LangChain to interface with GPT-4o. The chains are constructed per-request (stateless — no shared chain objects).

**Chat chain** (`backend/chat/agent.py`):

```python
def build_llm(temperature: float = 0.4) -> ChatOpenAI:
    return ChatOpenAI(
        model="gpt-4o",
        api_key=settings.openai_api_key,
        temperature=temperature,
    )

def run_chat(system_prompt: str, history: list[dict], user_message: str) -> str:
    llm = build_llm(temperature=0.4)
    messages = [SystemMessage(content=system_prompt)]
    for msg in history:
        cls = HumanMessage if msg["role"] == "user" else AIMessage
        messages.append(cls(content=msg["content"]))
    messages.append(HumanMessage(content=user_message))
    return llm.invoke(messages).content  # blocking call, full response
```

**Card ranking chain** (`backend/chat/card_ranker.py`):

Uses `with_structured_output()` to bind GPT-4o's output directly to a Pydantic model. This eliminates fragile JSON parsing and enforces type safety at the LLM boundary.

```python
class RankedCardList(BaseModel):
    cards: List[RankedCard]

llm = ChatOpenAI(model="gpt-4o", api_key=settings.openai_api_key, temperature=0.2)
structured_llm = llm.with_structured_output(RankedCardList)
result: RankedCardList = structured_llm.invoke([SystemMessage(...), HumanMessage(...)])
return result.cards  # List[RankedCard] — fully validated by Pydantic
```

### Temperature choices

| Use case | Temperature | Rationale |
|---|---|---|
| Chat advisor | 0.4 | Conversational but grounded; avoids hallucinated numbers |
| Card ranking | 0.2 | Low variance for consistent structured output |

### API key management

`OPENAI_API_KEY` is loaded via `pydantic-settings` from the `.env` file at the backend root:

```python
# backend/app/config.py
class Settings(BaseSettings):
    openai_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()  # module-level singleton
```

Both `agent.py` and `card_ranker.py` import `settings` from `config.py` — the key is never read from `os.environ` directly.

---

## 5. Prompt Engineering

### Financial advisor system prompt

Built dynamically by `build_financial_advisor_system_prompt(ctx: FinancialContext)` in `backend/chat/chat_routes.py`. It has three conditional tiers:

**Tier 1 — Always present (role + constraints):**
```
You are a knowledgeable, empathetic personal financial advisor AI.
Give clear, actionable advice grounded in the user's specific numbers.
Never give generic advice — always reference actual values when available.
Do not recommend individual stocks to buy or sell.
Acknowledge when data is missing and make assumptions explicit.
Keep responses under 300 words unless detail is required.
Use bullet points for lists. Format numbers as currency ($X,XXX). Do not use emojis.
```

**Tier 2 — Onboarding context (if `ctx.onboarding` is not None):**
```
USER FINANCIAL PROFILE:
- Annual income: $80,000
- Total savings: $20,000
- Credit score: 720 (Good)
- Total debt: $35,000
- Debt-to-income ratio: 43.8%
- Savings-to-income ratio: 25.0%
```

Derived values computed in Python:
- `dti = totalDebt / income * 100`
- `savings_rate = savings / income * 100`
- Credit tier: Excellent ≥750, Good ≥700, Fair ≥650, Poor <650

**Tier 3 — Portfolio context (if `ctx.portfolio` is not None):**
```
INVESTMENT PORTFOLIO:
- Net worth (portfolio): $150,000
- Allocation: 5% cash, 70% stocks, 20% bonds, 5% crypto
- Top holdings:
    • Vanguard Total Stock Market ETF (stocks): $80,000
    • BND Bond ETF (bonds): $30,000
    ...
```

**Fallback (no data at all):**
```
The user has not yet completed their financial profile.
Ask what they'd like help with and gently suggest visiting the onboarding flow.
```

### Card ranking system prompt

Static (defined in `RANKING_SYSTEM` constant in `card_ranker.py`):

```
You are a credit card recommendation engine.
Given a user's financial profile and a catalog of credit cards, select and rank
the top 5 most suitable cards for this specific user.

For each: set approvalLikelihood based on credit score vs creditScoreRequired,
matchScore 0-100, aiReasoning (2-4 sentences referencing their actual numbers),
and copy highlights from the catalog unchanged.

Ranking priority:
1) approval likelihood — never recommend cards the user almost certainly won't get
2) annual fee appropriateness — avoid high-fee cards if income is modest
3) if DTI > 30%, prioritize balance-transfer and no-fee cards
4) reward categories matching their likely spending patterns
5) overall value proposition

Return exactly 5 cards ordered from best match to worst match.
```

---

## 6. Credit Card Catalog & Ranking

### Catalog file

**Path:** `backend/data/credit_cards.json`

**Schema per card:**
```json
{
  "id": "chase-sapphire-preferred",
  "name": "Chase Sapphire Preferred",
  "issuer": "Chase",
  "network": "Visa",
  "annualFee": 95,
  "creditScoreRequired": 700,
  "categories": ["travel", "dining"],
  "rewardsSummary": "3x on dining, 2x on travel, 1x on everything else.",
  "highlights": ["60,000 point welcome bonus", "No foreign transaction fees"],
  "introApr": null,
  "regularApr": "21.49%–28.49%",
  "signupBonus": "60,000 points after $4,000 spend in 3 months",
  "foreignTransactionFee": 0,
  "notes": "Best for frequent travelers..."
}
```

### Coverage strategy

The 15-card catalog is designed to ensure at least one excellent match exists for any user profile:

| Dimension | Coverage |
|---|---|
| Annual fee | $0, $95, $250, $395, $550, $695 |
| Credit score required | 580, 600, 630, 640, 660, 670, 680, 700, 740, 750 |
| Categories | travel, cashback, dining, gas, groceries, business, student, balance-transfer |
| Issuers | Chase, Amex, Citi, Capital One, Discover, Apple, US Bank, Wells Fargo |

### Ranking algorithm

The ranking is performed entirely by GPT-4o using structured output. The LLM applies the priority rules from the system prompt against the catalog and the user's profile. The Pydantic `with_structured_output()` binding ensures the response is always a valid `List[RankedCard]`.

**ApprovalLikelihood mapping** (instructed in the system prompt):
- `excellent`: credit score ≥ required + 50
- `good`: credit score ≥ required
- `fair`: credit score ≥ required - 30
- `low`: credit score < required - 30

---

## 7. Conversation History Management

### State location

History is owned entirely by `AdvisorChat.tsx` as React state. Nothing is written to `localStorage`, `sessionStorage`, or any backend database.

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
```

### On each send

```typescript
const sendMessage = async (text?: string) => {
  const content = (text ?? input).trim();
  const userMsg = { role: "user", content };
  const newHistory = [...messages, userMsg];
  setMessages(newHistory);           // update UI immediately

  const res = await postAdvisorChat({
    message: content,
    history: messages.slice(-20),   // send PREVIOUS messages (before new turn), truncated
    context,
  });
  setMessages([...newHistory, { role: "assistant", content: res.reply }]);
};
```

Key design choice: `history` in the POST body contains the conversation **before** the current turn. The current user message is sent as the separate `message` field. The backend constructs the full LangChain message list as: `[SystemMessage, ...history, HumanMessage(message)]`.

### History truncation

Frontend truncates to `messages.slice(-20)` (last 20 messages = 10 turns) before sending. The full `messages` array in React state is never truncated — the UI always shows the complete conversation. GPT-4o's 128k context window can handle this comfortably, but truncation prevents runaway token costs on very long sessions.

### Why no persistence

1. Financial conversations contain sensitive data (income, debt, credit score) — not appropriate to trivially store in browser storage.
2. The system prompt is built from the current financial profile. A stale history from a prior session may reference outdated numbers, degrading response quality.

---

## 8. Frontend Component Architecture

### File locations

```
frontend/app/
├── advisor/
│   └── page.tsx                           # Server component shell (no params)
└── src/
    ├── lib/
    │   ├── types.ts                        # All TS types incl. advisor types
    │   └── advisor-api.ts                  # postAdvisorChat(), postAdvisorCards()
    └── components/
        └── advisor/
            ├── AdvisorShell.tsx            # Root client: tab state, localStorage read
            ├── AdvisorChat.tsx             # Multi-turn chat UI
            ├── ChatMessage.tsx             # Single message bubble
            ├── CardRecommendations.tsx     # Fetches + renders card grid
            └── CardTile.tsx               # Single card tile
```

### Component responsibilities

| Component | "use client" | State owned | Props received |
|---|---|---|---|
| `page.tsx` | No (server) | None | None |
| `AdvisorShell` | Yes | `activeTab`, `financialContext` | None |
| `AdvisorChat` | Yes | `messages`, `input`, `loading`, `error` | `context: FinancialContext` |
| `ChatMessage` | No | None | `message: ChatMessage` |
| `CardRecommendations` | Yes | `cards`, `loading`, `error` | `context: FinancialContext` |
| `CardTile` | Yes | `expanded` (collapse state) | `card: RankedCard` |

### `AdvisorShell` tab switching

Both `AdvisorChat` and `CardRecommendations` are mounted/unmounted on tab switch (not hidden with CSS). This means:
- Chat history resets on tab switch — intentional (prevents stale context after profile changes)
- Card recommendations are fetched fresh if the user unmounts and remounts the tab — guarded by `hasFetched` ref to prevent duplicate fetches within the same mount

### Match score donut gauge

`CardTile` renders the score gauge using pure CSS `conic-gradient` — no chart library:

```typescript
// matchScore = 0–100, converted to degrees (0–360)
const deg = Math.round(card.matchScore * 3.6);

<div
  className="h-14 w-14 rounded-full"
  style={{ background: `conic-gradient(#10b981 ${deg}deg, #1e293b 0deg)` }}
/>
<div className="absolute inset-[5px] rounded-full bg-slate-900 flex items-center justify-center">
  <span className="text-xs font-bold text-slate-100">{card.matchScore}</span>
</div>
```

---

## 9. Environment Setup

### Backend `.env` file

Create `backend/.env` (not committed to git):

```env
OPENAI_API_KEY=sk-...
```

This is read by `pydantic-settings` in `backend/app/config.py`.

### Frontend `.env.local`

Already exists. No changes needed for the advisor feature:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running locally

```bash
# Backend
cd personal_finance_dashboard/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd personal_finance_dashboard/frontend
npm run dev
```

### Verifying the advisor endpoints

```bash
# Health check
curl http://localhost:8000/health

# Chat endpoint
curl -s -X POST http://localhost:8000/advisor/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How is my debt-to-income ratio?",
    "history": [],
    "context": {
      "onboarding": {"income": 80000, "savings": 20000, "creditScore": 720, "totalDebt": 35000},
      "portfolio": null
    }
  }' | python3 -m json.tool

# Cards endpoint
curl -s -X POST http://localhost:8000/advisor/cards \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "onboarding": {"income": 80000, "savings": 20000, "creditScore": 720, "totalDebt": 35000},
      "portfolio": null
    }
  }' | python3 -m json.tool
```

### Verifying the frontend flow

1. `http://localhost:3000` → complete onboarding (Income → Savings → Credit Score → Debt)
2. Open DevTools → Application → Local Storage → confirm `onboarding` key is set
3. Navigate to `http://localhost:3000/advisor`
4. Confirm green "Financial profile loaded" badge
5. Send a chat message — verify GPT-4o references your actual income/debt numbers
6. Switch to "Card Recommendations" — verify 5 ranked cards with AI reasoning
7. Navigate to `/dashboard?h=VTI:50000` — confirm floating chat button is gone

---

## 10. Future Extension Points

### Portfolio context in `/advisor`

Currently `FinancialContext.portfolio` is always `null` on the advisor page because portfolio data requires the `?h=` param and backend call from the dashboard page. The types and backend schemas are already built to support it.

**Implementation path:**
1. In `Dashboard.tsx`, after receiving `profile` from the server, write a summary to `localStorage["portfolio_summary"]`:
   ```typescript
   localStorage.setItem("portfolio_summary", JSON.stringify({
     netWorthUSD: profile.netWorthUSD,
     holdings: profile.portfolio.holdings.map(h => ({ name: h.name, assetClass: h.assetClass, valueUSD: h.valueUSD })),
     allocationApprox: profile.portfolio.allocationApprox,
   }));
   ```
2. In `AdvisorShell.tsx`, read it alongside onboarding data:
   ```typescript
   const portfolioRaw = localStorage.getItem("portfolio_summary");
   if (portfolioRaw) setFinancialContext(prev => ({ ...prev, portfolio: JSON.parse(portfolioRaw) }));
   ```

### Streaming chat responses

Replace `llm.invoke()` with `llm.stream()` in `agent.py` and return a `StreamingResponse` from FastAPI using Server-Sent Events (SSE). The frontend would consume the stream with `ReadableStream` on the `fetch` response body. This requires:
1. Backend: `from fastapi.responses import StreamingResponse`
2. Frontend: `response.body.getReader()` loop in `AdvisorChat.sendMessage()`

### Auth and persistent history

For session-persistent chat history, consider:
- **Simple**: Encrypt with the user's credit score as a key (poor security, but better than plaintext in localStorage)
- **Proper**: Add user accounts (NextAuth.js on frontend, JWT on backend) with a PostgreSQL `chat_sessions` table

### Live credit card API

Replace `credit_cards.json` with a call to a card comparison API (e.g., CardRatings API, Bankrate API). The `rank_cards()` function in `card_ranker.py` already receives the catalog as a generic `list` — swapping the `_load_catalog()` function to call an external API requires no other changes to the ranking logic.

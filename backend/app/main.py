from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.agent.health import analyze_health, get_user_onboarding_responses
from services.agent.chat import advisor_chat
from services.agent.cards import rank_cards
from services.portfolio import (
    build_custom_profile,
    get_custom_price_history,
    load_assets,
    process_onboarding_submission,
    save_user_onboarding,
)
from .schemas import (
    Asset, CustomPortfolioRequest, OnboardingSubmitRequest, OnboardingSubmitResponse,
    PortfolioPriceHistory, UserProfile,
    AdvisorChatRequest, AdvisorChatResponse, AdvisorCardsRequest, AdvisorCardsResponse,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://personal-finance-dashboard-three-brown.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/user/onboarding")
def get_user_onboarding():
    """Return stored onboarding quiz responses, or null if none."""
    data = get_user_onboarding_responses()
    return {"onboarding": data}


@app.get("/assets", response_model=list[Asset])
def get_assets():
    return load_assets()


@app.post("/portfolio/custom", response_model=UserProfile)
def post_custom_portfolio(request: CustomPortfolioRequest):
    return build_custom_profile(request)


@app.post("/portfolio/custom/price-history", response_model=PortfolioPriceHistory)
def post_custom_price_history(request: CustomPortfolioRequest):
    return get_custom_price_history(request)


@app.post("/onboarding/submit", response_model=OnboardingSubmitResponse)
def post_onboarding_submit(request: OnboardingSubmitRequest):
    result = process_onboarding_submission(request)
    ai = analyze_health(request.model_dump())
    save_user_onboarding(
        request,
        result,
        portfolio_score=ai["portfolioScore"],
        insights=ai["insights"],
        action_items=ai["actionItems"],
        portfolio_insights=ai["portfolioInsights"],
    )
    return OnboardingSubmitResponse(
        profile=result["profile"],
        netWorthUSD=result["netWorthUSD"],
        portfolioScore=ai["portfolioScore"],
        insights=ai["insights"],
        actionItems=ai["actionItems"],
        portfolioInsights=ai["portfolioInsights"],
    )


@app.post("/advisor/chat", response_model=AdvisorChatResponse)
def post_advisor_chat(request: AdvisorChatRequest):
    reply = advisor_chat(request)
    return AdvisorChatResponse(reply=reply)


@app.post("/advisor/cards", response_model=AdvisorCardsResponse)
def post_advisor_cards(request: AdvisorCardsRequest):
    cards = rank_cards(request.context)
    return AdvisorCardsResponse(cards=cards)

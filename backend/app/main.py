from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .portfolio import (
    build_custom_profile,
    get_custom_price_history,
    load_assets,
)
from .schemas import Asset, CustomPortfolioRequest, PortfolioPriceHistory, UserProfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/assets", response_model=list[Asset])
def get_assets():
    return load_assets()


@app.post("/portfolio/custom", response_model=UserProfile)
def post_custom_portfolio(request: CustomPortfolioRequest):
    return build_custom_profile(request)


@app.post("/portfolio/custom/price-history", response_model=PortfolioPriceHistory)
def post_custom_price_history(request: CustomPortfolioRequest):
    return get_custom_price_history(request)

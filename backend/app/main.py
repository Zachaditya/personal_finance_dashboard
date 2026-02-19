from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .portfolio import get_portfolio_price_history, load_user_profile
from .schemas import PortfolioPriceHistory, UserProfile

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


@app.get("/portfolio/{user_id}", response_model=UserProfile)
def get_portfolio(user_id: str):
    return load_user_profile(user_id)


@app.get("/portfolio/{user_id}/price-history", response_model=PortfolioPriceHistory)
def get_price_history(user_id: str):
    return get_portfolio_price_history(user_id)

import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL_ID = "gpt-4o-mini"

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Set it as an environment variable or enable DEMO_MODE=true."
            )
        _client = OpenAI(api_key=api_key)
    return _client


# Keep `client` as a lazy proxy for backward compat
class _LazyClient:
    def __getattr__(self, name: str):
        return getattr(get_client(), name)


client = _LazyClient()

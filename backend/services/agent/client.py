import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL_ID = "gpt-4o-mini"
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

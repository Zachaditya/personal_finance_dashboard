from dotenv import load_dotenv
import os
from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

class FinancialAnalysis(BaseModel):
    summary: str = Field(description="A summary of the financial analysis")
    recommendations: List[str] = Field(description="A list of recommendations for the user")
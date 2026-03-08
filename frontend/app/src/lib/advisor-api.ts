import type {
  ChatRequest,
  ChatResponse,
  CardRecommendationRequest,
  CardRecommendationResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function postAdvisorChat(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/advisor/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function postAdvisorCards(
  request: CardRecommendationRequest
): Promise<CardRecommendationResponse> {
  const res = await fetch(`${API_URL}/advisor/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    throw new Error(`Card recommendations failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

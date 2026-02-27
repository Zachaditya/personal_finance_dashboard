import { Asset, UserProfile, PortfolioPriceHistory } from "./types";

// Set in .env.local as NEXT_PUBLIC_API_URL (e.g. http://localhost:8000)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getAssets = async (): Promise<Asset[]> => {
    const response = await fetch(`${API_URL}/assets`);
    if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
    }
    return response.json();
}

export const postCustomPortfolio = async (
    holdings: { assetId: string; valueUSD: number }[]
): Promise<UserProfile> => {
    const response = await fetch(`${API_URL}/portfolio/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings }),
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch custom portfolio: ${response.statusText}`);
    }
    return response.json();
}

export const postCustomPriceHistory = async (
    holdings: { assetId: string; valueUSD: number }[]
): Promise<PortfolioPriceHistory> => {
    const response = await fetch(`${API_URL}/portfolio/custom/price-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings }),
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch custom price history: ${response.statusText}`);
    }
    return response.json();
}

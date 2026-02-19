import { UserProfile, PortfolioPriceHistory } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getPortfolio = async (userId: string): Promise<UserProfile> => {
    const response = await fetch(`${API_URL}/portfolio/${userId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
    }
    return response.json();
}

export const getPortfolioPriceHistory = async (userId: string): Promise<PortfolioPriceHistory> => {
    const response = await fetch(`${API_URL}/portfolio/${userId}/price-history`);
    if (!response.ok) {
        throw new Error(`Failed to fetch price history: ${response.statusText}`);
    }
    return response.json();
}

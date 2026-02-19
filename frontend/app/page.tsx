import { getPortfolio, getPortfolioPriceHistory } from "./src/lib/api";
import { Dashboard } from "./src/components/Dashboard";

export default async function Home() {
  const [profile, priceHistory] = await Promise.all([
    getPortfolio("user_001"),
    getPortfolioPriceHistory("user_001"),
  ]);
  return <Dashboard profile={profile} priceHistory={priceHistory} />;
}

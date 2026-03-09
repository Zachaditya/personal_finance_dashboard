import { redirect } from "next/navigation";
import {
  postCustomPortfolio,
  postCustomPriceHistory,
  getUserOnboarding,
} from "../src/lib/api";
import { Dashboard } from "../src/components/Dashboard";
import { parseHoldings } from "../src/lib/parse-holdings";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  let h = typeof params.h === "string" ? params.h : undefined;

  if (!h) {
    try {
      const onboarding = await getUserOnboarding();
      const holdings = onboarding?.onboarding?.holdings ?? [];
      if (holdings.length > 0) {
        h = holdings.map((x) => `${x.assetId}:${x.valueUSD}`).join(",");
      }
    } catch {
      // fall through to redirect
    }
  }

  if (!h) {
    redirect("/select");
  }

  const holdings = parseHoldings(h);
  if (holdings.length === 0) {
    redirect("/select");
  }

  const [profile, priceHistory] = await Promise.all([
    postCustomPortfolio(holdings),
    postCustomPriceHistory(holdings),
  ]);

  return <Dashboard profile={profile} priceHistory={priceHistory} />;
}

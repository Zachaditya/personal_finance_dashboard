import { redirect } from "next/navigation";
import {
  postCustomPortfolio,
  postCustomPriceHistory,
} from "../src/lib/api";
import { Chat } from "../src/components/Chat";
import { Dashboard } from "../src/components/Dashboard";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function parseHoldings(h: string): { assetId: string; valueUSD: number }[] {
  return h
    .split(",")
    .map((pair) => {
      const sep = pair.lastIndexOf(":");
      const assetId = decodeURIComponent(pair.slice(0, sep));
      const valueUSD = Number(pair.slice(sep + 1)) || 0;
      return { assetId, valueUSD };
    })
    .filter((holding) => holding.valueUSD > 0);
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const h = typeof params.h === "string" ? params.h : undefined;

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

  return (
    <>
      <Dashboard profile={profile} priceHistory={priceHistory} />
      <Chat />
    </>
  );
}

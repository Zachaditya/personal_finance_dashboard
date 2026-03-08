import { redirect } from "next/navigation";
import {
  postCustomPortfolio,
  postCustomPriceHistory,
} from "../src/lib/api";
import { Dashboard } from "../src/components/Dashboard";
import { parseHoldings } from "../src/lib/parse-holdings";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

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

  return <Dashboard profile={profile} priceHistory={priceHistory} />;
}

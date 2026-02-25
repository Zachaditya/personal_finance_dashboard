import { redirect } from "next/navigation";
import {
  postCustomPortfolio,
  postCustomPriceHistory,
} from "../src/lib/api";
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
      <a
        href="#"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400"
        aria-label="Chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 w-6"
        >
          <path
            fillRule="evenodd"
            d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z"
            clipRule="evenodd"
          />
        </svg>
      </a>
    </>
  );
}

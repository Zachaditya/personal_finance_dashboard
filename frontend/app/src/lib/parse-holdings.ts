/**
 * Parse holdings from URL query string format: "assetId:valueUSD,assetId:valueUSD,..."
 */
export function parseHoldings(h: string): { assetId: string; valueUSD: number }[] {
  return h
    .split(",")
    .map((pair) => {
      const decoded = decodeURIComponent(pair);
      const sep = decoded.lastIndexOf(":");
      const assetId = decoded.slice(0, sep);
      const valueUSD = Number(decoded.slice(sep + 1)) || 0;
      return { assetId, valueUSD };
    })
    .filter((holding) => holding.valueUSD > 0);
}

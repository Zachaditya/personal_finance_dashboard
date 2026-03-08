import { describe, expect, it } from "vitest";
import { parseHoldings } from "./parse-holdings";

describe("parseHoldings", () => {
  it("parses multiple holdings", () => {
    const result = parseHoldings("VTI:50000,BND:30000");
    expect(result).toEqual([
      { assetId: "VTI", valueUSD: 50000 },
      { assetId: "BND", valueUSD: 30000 },
    ]);
  });

  it("filters out zero-value holdings", () => {
    const result = parseHoldings("VTI:0,BND:100");
    expect(result).toEqual([{ assetId: "BND", valueUSD: 100 }]);
  });

  it("returns empty array for empty string", () => {
    const result = parseHoldings("");
    expect(result).toEqual([]);
  });

  it("decodes URI-encoded assetId", () => {
    const result = parseHoldings("VTI%3A50000");
    expect(result).toEqual([{ assetId: "VTI", valueUSD: 50000 }]);
  });
});

import { describe, expect, it } from "vitest";
import { fleetCatalog } from "./fleetCatalog";

describe("ship price ladder", () => {
  it("never makes a higher-tier coin ship cheaper than a lower-tier one", () => {
    const coin = fleetCatalog.filter((s) => s.currency === "coin");
    for (let i = 1; i < coin.length; i++) {
      if (coin[i]!.data.tier > coin[i - 1]!.data.tier) expect(coin[i]!.price).toBeGreaterThan(coin[i - 1]!.price);
    }
  });
  it("prices legendary tier-5 ships in gems", () => {
    expect(fleetCatalog.filter((s) => s.data.tier >= 5).every((s) => s.currency === "gem")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { formatMetric } from "../src/lib/format";

describe("regional metric formatting", () => {
  it("rounds imported regional values for readable cards", () => {
    expect(formatMetric(7.34441215515, "en")).toBe("7.3");
    expect(formatMetric(68.7303317392, "en")).toBe("68.7");
  });

  it("keeps missing or invalid measurements honest", () => {
    expect(formatMetric(null, "en")).toBe("—");
    expect(formatMetric(Number.NaN, "en")).toBe("—");
  });
});

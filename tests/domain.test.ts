import { describe, it, expect } from "vitest";
import {
  clusterReports,
  distanceKm,
  adviceSchema,
  rotateThreads,
  newThread,
  languages,
  type Report,
} from "../shared/domain";
const now = Date.now();
function report(id: string, overrides: Partial<Report> = {}): Report {
  return {
    id,
    installation: id,
    districtId: "PB-LDH",
    crop: "RICE",
    diseaseCode: "BLIGHT",
    name: "Blight",
    confidence: 0.85,
    lat: 30.9,
    lon: 75.85,
    timestamp: now,
    origin: "live",
    ...overrides,
  };
}
describe("outbreak detection", () => {
  it("requires three distinct installations", () => {
    expect(
      clusterReports([report("1"), report("2"), report("3")], now)[0].status,
    ).toBe("potential");
    expect(
      clusterReports(
        [
          report("1"),
          report("2", { installation: "1" }),
          report("3", { installation: "1" }),
        ],
        now,
      )[0].status,
    ).toBe("observation");
  });
  it("excludes old, future and low-confidence reports", () => {
    expect(
      clusterReports(
        [
          report("1", { timestamp: now - 8 * 86400000 }),
          report("2", { confidence: 0.74 }),
          report("3", { timestamp: now + 100 }),
        ],
        now,
      ),
    ).toHaveLength(0);
  });
  it("separates district, crop, disease and synthetic data", () => {
    const reports = [
      report("1"),
      report("2", { districtId: "MH-PUN" }),
      report("3", { crop: "WHEAT" }),
      report("4", { diseaseCode: "RUST" }),
      report("5", { origin: "demo" }),
    ];
    expect(clusterReports(reports, now)).toHaveLength(5);
  });
  it("does not chain reports beyond the radius", () => {
    expect(
      clusterReports(
        [report("1"), report("2", { lat: 30.96 }), report("3", { lat: 31.02 })],
        now,
      ).every((c) => c.status !== "potential"),
    ).toBe(true);
  });
  it("counts threshold confidence and current reports", () => {
    expect(
      clusterReports([report("1", { confidence: 0.75 })], now),
    ).toHaveLength(1);
  });
  it("calculates geographic distance", () => {
    expect(distanceKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(
      111.19,
      1,
    );
  });
});
describe("request and session contracts", () => {
  it("rotates oldest thread while keeping three", () => {
    const old = [newThread("PB-LDH"), newThread("PB-LDH"), newThread("PB-LDH")];
    const next = newThread("MH-PUN");
    expect(rotateThreads(old, next)).toEqual([next, old[0], old[1]]);
  });
  it("has 22 scheduled languages and English without duplicates", () => {
    expect(languages).toHaveLength(23);
    expect(new Set(languages.map((l) => l[0])).size).toBe(23);
  });
  it("rejects unsupported locale and oversized history", () => {
    const valid = {
      requestId: crypto.randomUUID(),
      threadId: crypto.randomUUID(),
      districtId: "PB-LDH",
      locale: "en",
      text: "What next?",
      history: [],
    };
    expect(adviceSchema.safeParse(valid).success).toBe(true);
    expect(
      adviceSchema.safeParse({ ...valid, locale: "invalid" }).success,
    ).toBe(false);
    expect(
      adviceSchema.safeParse({
        ...valid,
        history: Array(37).fill({ role: "user", text: "hello" }),
      }).success,
    ).toBe(false);
  });
});

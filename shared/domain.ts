import { z } from "zod";
export const languages = [
  ["en", "English"],
  ["as", "অসমীয়া"],
  ["bn", "বাংলা"],
  ["brx", "बड़ो"],
  ["doi", "डोगरी"],
  ["gu", "ગુજરાતી"],
  ["hi", "हिन्दी"],
  ["kn", "ಕನ್ನಡ"],
  ["ks", "کٲشُر"],
  ["kok", "कोंकणी"],
  ["mai", "मैथिली"],
  ["ml", "മലയാളം"],
  ["mni-Mtei", "ꯃꯤꯇꯩꯂꯣꯟ"],
  ["mr", "मराठी"],
  ["ne", "नेपाली"],
  ["or", "ଓଡ଼ିଆ"],
  ["pa", "ਪੰਜਾਬੀ"],
  ["sa", "संस्कृतम्"],
  ["sat", "ᱥᱟᱱᱛᱟᱲᱤ"],
  ["sd", "سنڌي"],
  ["ta", "தமிழ்"],
  ["te", "తెలుగు"],
  ["ur", "اردو"],
] as const;
export const MAX_THREADS = 3;
export const MAX_TURNS = 18;
export const districts = [
  { id: "PB-LDH", state: "Punjab", name: "Ludhiana", lat: 30.901, lon: 75.857 },
  { id: "PB-ASR", state: "Punjab", name: "Amritsar", lat: 31.634, lon: 74.872 },
  {
    id: "UP-LKO",
    state: "Uttar Pradesh",
    name: "Lucknow",
    lat: 26.847,
    lon: 80.947,
  },
  {
    id: "UP-VNS",
    state: "Uttar Pradesh",
    name: "Varanasi",
    lat: 25.317,
    lon: 82.974,
  },
  { id: "MH-PUN", state: "Maharashtra", name: "Pune", lat: 18.52, lon: 73.857 },
  {
    id: "MH-NSK",
    state: "Maharashtra",
    name: "Nashik",
    lat: 19.998,
    lon: 73.79,
  },
] as const;
export type District = (typeof districts)[number];
export const diagnosisSchema = z.object({
  crop: z.string().max(80),
  diseaseCode: z.string().regex(/^[A-Z0-9_]{1,80}$/),
  name: z.string().max(160),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string().max(500)).max(6),
});
export type Diagnosis = z.infer<typeof diagnosisSchema>;
export const answerSchema = z.object({
  text: z.string().min(1).max(6000),
  diagnosis: diagnosisSchema.nullable(),
});
export type Answer = z.infer<typeof answerSchema> & { receipt?: string };
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  diagnosis?: Diagnosis | null;
  receipt?: string;
  contributed?: boolean;
};
export type Thread = {
  id: string;
  title: string;
  districtId: string;
  messages: Message[];
  createdAt: number;
};
export type Context = {
  districtId: string;
  soilPh: number | null;
  rainfallMm: number | null;
  moisture: number | null;
  observedAt: string;
  source: string;
  mode: "demo" | "live";
  summary: string;
};
export const positionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});
export const adviceSchema = z.object({
  requestId: z.string().uuid(),
  threadId: z.string().uuid(),
  districtId: z.string().refine((v) => districts.some((d) => d.id === v)),
  locale: z.string().refine((v) => languages.some((l) => l[0] === v)),
  text: z.string().min(1).max(3000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(6000),
      }),
    )
    .max(36),
  position: positionSchema.optional(),
  image: z
    .object({
      mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
      data: z.string().max(2800000),
    })
    .optional(),
});
export type AdviceRequest = z.infer<typeof adviceSchema>;
export type Report = {
  id: string;
  installation: string;
  districtId: string;
  crop: string;
  diseaseCode: string;
  name: string;
  confidence: number;
  lat: number;
  lon: number;
  timestamp: number;
  origin: "demo" | "live";
};
export type Cluster = {
  id: string;
  districtId: string;
  name: string;
  count: number;
  lat: number;
  lon: number;
  status: "observation" | "watch" | "potential";
  origin: "demo" | "live";
};
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) *
      Math.cos(b.lat * rad) *
      Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function clusterReports(reports: Report[], now = Date.now()): Cluster[] {
  const accepted = reports
    .filter(
      (r) =>
        r.confidence >= 0.75 &&
        r.timestamp <= now &&
        r.timestamp >= now - 7 * 86400000,
    )
    .sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
  const groups: Report[][] = [];
  for (const r of accepted) {
    const group = groups.find(
      (g) =>
        g[0].districtId === r.districtId &&
        g[0].origin === r.origin &&
        g[0].crop === r.crop &&
        g[0].diseaseCode === r.diseaseCode &&
        g.every((other) => distanceKm(r, other) <= 10),
    );
    if (group) group.push(r);
    else groups.push([r]);
  }
  return groups.map((g) => {
    const count = new Set(g.map((r) => r.installation)).size;
    return {
      id: g[0].id,
      districtId: g[0].districtId,
      name: g[0].name,
      count,
      lat: g[0].lat,
      lon: g[0].lon,
      status: count >= 3 ? "potential" : count === 2 ? "watch" : "observation",
      origin: g[0].origin,
    };
  });
}
export function newThread(districtId: string): Thread {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    districtId,
    messages: [],
    createdAt: Date.now(),
  };
}
export function rotateThreads(threads: Thread[], thread: Thread) {
  return [thread, ...threads].slice(0, MAX_THREADS);
}
export function turns(thread: Thread) {
  return thread.messages.filter((m) => m.role === "user").length;
}

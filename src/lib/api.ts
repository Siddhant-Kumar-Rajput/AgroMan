import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  type AppCheck,
} from "firebase/app-check";
import {
  districts,
  type AdviceRequest,
  type Answer,
  type Context,
  type Report,
} from "../../shared/domain";
export const demo = import.meta.env.VITE_API_MODE !== "live";
const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export async function currentPosition() {
  return new Promise<{ lat: number; lon: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is unavailable in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () =>
        reject(
          new Error(
            "Location permission is required to contribute a nearby observation.",
          ),
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}
let credentials:
  | Promise<{ authorization: string; "X-Firebase-AppCheck"?: string }>
  | undefined;
let appCheck: AppCheck | undefined;
async function headers() {
  if (!credentials)
    credentials = (async () => {
      const app = initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      });
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (siteKey)
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      const auth = getAuth(app);
      await auth.authStateReady();
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      return {
        authorization: `Bearer ${await user.getIdToken()}`,
        ...(appCheck
          ? { "X-Firebase-AppCheck": (await getToken(appCheck)).token }
          : {}),
      };
    })();
  // Refresh credentials for each request; Firebase manages token caching/renewal.
  await credentials;
  const auth = getAuth();
  return {
    authorization: `Bearer ${await auth.currentUser!.getIdToken()}`,
    ...(appCheck
      ? { "X-Firebase-AppCheck": (await getToken(appCheck)).token }
      : {}),
  };
}
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBase}/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(await headers()) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? "Service unavailable. Please try again.");
  return result;
}
export async function context(districtId: string): Promise<Context> {
  if (!demo) return request("location/context", { districtId });
  return {
    districtId,
    soilPh: 7.1,
    rainfallMm: 86,
    moisture: 27,
    observedAt: "2026-09-01",
    source: "Illustrative fixture — not measured farm data",
    mode: "demo",
    summary:
      "Explore how regional soil, rainfall and season context will inform your next planting decision. Connect cloud services for real observations.",
  };
}
export async function advise(input: AdviceRequest): Promise<Answer> {
  if (!demo) return request("advice/respond", input);
  await new Promise((r) => setTimeout(r, 650));
  if (input.image)
    return {
      text: "Demonstration response — this photo has not been analyzed.\n\nThis example shows a possible leaf-blight result. In live mode, Gemini will examine visible symptoms and return an uncertain assessment, with appropriate next steps.\n\nFor a useful photo, include the whole leaf and a close-up in natural daylight. Avoid applying a treatment on the basis of this demonstration.",
      diagnosis: {
        crop: "RICE",
        diseaseCode: "LEAF_BLIGHT",
        name: "Leaf blight (example)",
        confidence: 0.84,
        evidence: [
          "Synthetic diagnosis for demonstrating the report workflow.",
        ],
      },
    };
  const d = districts.find((d) => d.id === input.districtId)!;
  return {
    text: `Demonstration response for ${d.name}\n\nBefore choosing your next crop, tell me your land size, previous crop, harvest date and whether irrigation is available. These details help establish a realistic planting window.\n\nThe live advisory will combine your answers with dated regional soil and weather observations. Regional estimates do not replace a soil test.\n\nWhat did you grow most recently?`,
    diagnosis: null,
  };
}
export function demoReports(districtId: string): Report[] {
  const d = districts.find((d) => d.id === districtId)!;
  return [0, 1, 2, 3].map((i) => ({
    id: `seed-${districtId}-${i}`,
    installation: `synthetic-${i}`,
    districtId,
    crop: "RICE",
    diseaseCode: "LEAF_BLIGHT",
    name: "Leaf blight",
    confidence: 0.84,
    lat: d.lat + i * 0.008,
    lon: d.lon + i * 0.006,
    timestamp: Date.now() - i * 86400000,
    origin: "demo",
  }));
}
export async function prepareImage(
  file: File,
): Promise<{ mime: "image/jpeg"; data: string }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG or WebP image.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Choose an image under 10 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return {
    mime: "image/jpeg",
    data: canvas.toDataURL("image/jpeg", 0.8).split(",")[1],
  };
}

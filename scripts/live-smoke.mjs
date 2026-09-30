import { chromium } from "@playwright/test";

const site =
  process.env.AGROMAN_SITE ?? "https://agroman-siddhant-rajput.web.app";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
const pageErrors = [];
let offlineFallbackRequested = false;
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("request", (request) => {
  if (request.url().endsWith("/espeak/espeak-ng.data"))
    offlineFallbackRequested = true;
});

try {
  await page.addInitScript(() => {
    Object.defineProperty(window.speechSynthesis, "getVoices", {
      configurable: true,
      value: () => [],
    });
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__agromanSpeechSeconds = this.buffer?.duration ?? 0;
      return start.apply(this, args);
    };
  });
  await page.goto(site, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Explore community watch" }).click();
  const boundary = page.locator("path.district-boundary");
  await boundary.waitFor({ timeout: 10000 });
  const boundaryPath = await boundary.getAttribute("d");
  if (!boundaryPath || boundaryPath.length < 50)
    throw new Error("The live district boundary did not render.");
  await page.getByRole("button", { name: "Preview example signals" }).click();
  await page
    .getByText(
      "Labelled examples for testing the clustering interface; not farmer reports or a real outbreak.",
      { exact: false },
    )
    .waitFor();
  const exampleMarkerCount = await page.locator(".geo-marker").count();
  if (!exampleMarkerCount)
    throw new Error("The labelled community example did not render a marker.");
  await page.getByRole("button", { name: "Return to live reports" }).click();
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: "Farm advisor" }).first().click();
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    context.fillStyle = "#4b713e";
    context.fillRect(0, 0, 64, 64);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("input[type=file]").setInputFiles({
    name: "not-a-plant.png",
    mimeType: "image/png",
    buffer: Buffer.from(encoded, "base64"),
  });
  const adviceResponse = page.waitForResponse(
    (response) => response.url().includes("/v1/advice/respond"),
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  const response = await adviceResponse;
  const result = await response.json();
  if (!response.ok())
    throw new Error(`Live advice returned ${response.status()}`);
  if (result.diagnosis !== null)
    throw new Error("An artificial image incorrectly received a diagnosis.");
  await page
    .getByText(result.text, { exact: true })
    .waitFor({ timeout: 10000 });
  const translationResponse = page.waitForResponse(
    (candidate) => candidate.url().includes("/v1/translate/ui"),
    { timeout: 60000 },
  );
  await page.locator(".language select").selectOption("hi");
  if (!(await translationResponse).ok())
    throw new Error("Hindi interface translation failed.");
  await page.locator(".composer textarea").fill("गेहूँ की देखभाल कैसे करूँ?");
  const hindiAdviceResponse = page.waitForResponse(
    (candidate) => candidate.url().includes("/v1/advice/respond"),
    { timeout: 60000 },
  );
  await page.locator(".composer .send").click();
  const hindiAdvice = await hindiAdviceResponse;
  const hindiResult = await hindiAdvice.json();
  if (!hindiAdvice.ok())
    throw new Error(`Hindi advice returned ${hindiAdvice.status()}`);
  if (!/[\u0900-\u097f]/.test(hindiResult.text))
    throw new Error("Hindi advice did not use Devanagari script.");
  await page
    .getByText(hindiResult.text, { exact: true })
    .waitFor({ timeout: 10000 });
  const speechApi = page.waitForResponse(
    (candidate) => candidate.url().includes("/v1/speech/synthesize"),
    { timeout: 60000 },
  );
  const audioButton = page.locator("article.assistant .audio-button").last();
  await audioButton.click();
  const speechResponse = await speechApi;
  if (!speechResponse.ok())
    throw new Error(`Natural speech returned ${speechResponse.status()}`);
  await page.waitForFunction(
    () => {
      const buttons = document.querySelectorAll(
        "article.assistant .audio-button",
      );
      return !buttons.length || !buttons[buttons.length - 1].disabled;
    },
    undefined,
    { timeout: 60000 },
  );
  const speechSeconds = await page.evaluate(
    () => window.__agromanSpeechSeconds ?? 0,
  );
  if (speechSeconds <= 2)
    throw new Error(`Hindi speech was truncated at ${speechSeconds} seconds.`);
  if (offlineFallbackRequested)
    throw new Error("Natural speech failed and used the robotic fallback.");
  if (pageErrors.length) throw new Error(pageErrors.join("; "));
  console.log(
    JSON.stringify({
      liveImagePipeline: "passed",
      insufficientPhotoRejected: true,
      communityGeographicBoundary: "passed",
      communityExamplePreview: "passed",
      responseCharacters: result.text.length,
      hindiResponse: "passed",
      hindiNaturalSpeech: "passed",
      hindiSpeechSeconds: Math.round(speechSeconds * 10) / 10,
      speechApiStatus: speechResponse.status(),
    }),
  );
} finally {
  await browser.close();
}

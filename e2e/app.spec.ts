import { test, expect } from "@playwright/test";
test("photo consent contributes metadata without persisting photo data", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Meet your farm advisor" })
    .first()
    .click();
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#476333";
    ctx.fillRect(0, 0, 32, 32);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const png = Buffer.from(encoded, "base64");
  await page
    .locator("input[type=file]")
    .setInputFiles({ name: "leaf.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("Selected plant")).toBeVisible();
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByText("Leaf blight (example)", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Contribute anonymous observation",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Agree and contribute" }).click();
  await expect(
    page.getByRole("button", { name: "Observation contributed" }),
  ).toBeDisabled();
  const localData = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("agroman-demo");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const result = await new Promise<unknown>((resolve, reject) => {
      const req = db.transaction("local").objectStore("local").get("threads");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return JSON.stringify(result);
  });
  expect(localData).not.toContain("data:image");
  expect(localData).not.toContain("base64");
});
test("a thread stops accepting questions after eighteen turns", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Meet your farm advisor" })
    .first()
    .click();
  for (let i = 0; i < 18; i++) {
    await page.getByRole("textbox").fill(`Question ${i + 1}`);
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(
      page.getByText("Demonstration response for Ludhiana"),
    ).toHaveCount(i + 1);
  }
  await expect(page.getByRole("textbox")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Send message", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "New conversation", exact: true })
    .click();
  await expect(page.getByRole("textbox")).toBeEnabled();
});
test("advisory persists a conversation after reload", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Meet your farm advisor" })
    .first()
    .click();
  await page.getByRole("textbox").fill("I harvested rice two weeks ago.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByText("Demonstration response for Ludhiana"),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Meet your farm advisor" })
    .first()
    .click();
  await expect(
    page.getByText("Demonstration response for Ludhiana"),
  ).toBeVisible();
});
test("community and authority expose only labeled demo signals", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore community watch" }).click();
  await expect(page.getByText("Synthetic demonstration reports")).toBeVisible();
  await expect(
    page.getByText("Potential outbreak", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Authority view" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download incident summary" }).click();
  expect((await download).suggestedFilename()).toBe("agroman-incidents.json");
});
test("language coverage is honest and layout fits the viewport", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Language", { exact: true }).selectOption("pa");
  await expect(
    page.getByText(
      "This language needs the cloud translation service. English is shown until it is connected.",
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("Hindi read aloud loads the on-device fallback", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  test.setTimeout(60000);
  await page.addInitScript(() => {
    Object.defineProperty(window.speechSynthesis, "getVoices", {
      configurable: true,
      value: () => [],
    });
    const createBuffer = AudioContext.prototype.createBuffer;
    AudioContext.prototype.createBuffer = function (
      channels,
      length,
      sampleRate,
    ) {
      (
        window as Window &
          typeof globalThis & { __agromanSpeechSeconds?: number }
      ).__agromanSpeechSeconds = length / sampleRate;
      return createBuffer.call(this, channels, length, sampleRate);
    };
  });
  await page.goto("/");
  await page.getByLabel("Language", { exact: true }).selectOption("hi");
  await page
    .getByRole("button", { name: "Meet your farm advisor" })
    .first()
    .click();
  await page.getByRole("textbox").fill("मेरी फसल की देखभाल कैसे करूँ?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByText("Demonstration response for Ludhiana"),
  ).toBeVisible();
  const dataRequest = page.waitForResponse(
    (response) => response.url().endsWith("/espeak/espeak-ng.data"),
    { timeout: 45000 },
  );
  await page.getByRole("button", { name: "Read aloud" }).click();
  expect((await dataRequest).ok()).toBe(true);
  await expect(page.getByText("Preparing voice…")).toHaveCount(0, {
    timeout: 45000,
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as Window &
              typeof globalThis & { __agromanSpeechSeconds?: number }
          ).__agromanSpeechSeconds ?? 0,
      ),
    )
    .toBeGreaterThan(2);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

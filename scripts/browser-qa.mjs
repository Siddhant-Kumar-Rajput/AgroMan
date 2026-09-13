import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch();
for (const [name, options] of [
  ["desktop", { viewport: { width: 1440, height: 1000 } }],
  ["mobile", devices["Pixel 7"]],
]) {
  const page = await browser.newPage(options);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: `test-results/${name}-home.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Meet your farm advisor" })
    .first()
    .click();
  await page.screenshot({
    path: `test-results/${name}-advisor.png`,
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      name,
      errors,
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    }),
  );
  await page.close();
}
await browser.close();

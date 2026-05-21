import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const urlArgIndex = process.argv.indexOf("--url");
const url = urlArgIndex >= 0 ? process.argv[urlArgIndex + 1] : process.env.URL ?? "http://127.0.0.1:5173";
await mkdir("test-results", { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("#world");
await page.waitForFunction(() => typeof window.render_game_to_text === "function");
await page.waitForTimeout(800);

const initial = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
assert(initial.scene.loaded, "scene did not report loaded");
assert(initial.scene.theme === "medieval", "theme is not medieval");
assert(initial.scene.timeWindowDays === 90, "default time window is not 90 days");
assert(initial.scene.buildingCount >= 40, "expected many repo buildings");
assert(initial.repos.some((repo) => repo.buildingType === "castle"), "expected at least one castle");
assert(initial.scene.personCount > 80, "expected visible crowd activity");
assert(initial.clusters.length >= 5, "expected topic villages");
assert(initial.camera.withinBounds, "camera starts outside bounds");

await page.mouse.wheel(0, 800);
await page.waitForTimeout(120);
const zoomed = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
assert(zoomed.camera.distance > initial.camera.distance, "mouse wheel did not change camera distance");

await page.mouse.move(720, 480);
await page.mouse.down();
await page.mouse.move(580, 540, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(120);
const panned = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
assert(
  panned.camera.target[0] !== zoomed.camera.target[0] || panned.camera.target[2] !== zoomed.camera.target[2],
  "drag did not move camera target"
);
assert(panned.camera.withinBounds, "camera panned outside bounds");

const castle = panned.repos.find((repo) => {
  const point = repo.clickScreen;
  return (
    repo.buildingType === "castle" &&
    point.visible &&
    point.x > 260 &&
    point.x < 1180 &&
    point.y > 160 &&
    point.y < 840
  );
});
assert(castle, "no visible castle found for selection");
await page.mouse.click(castle.clickScreen.x, castle.clickScreen.y);
await page.waitForTimeout(120);
const selected = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
assert(selected.interactions.selectedRepo, "click did not select a repo");

await page.click('[data-days="30"]');
await page.waitForTimeout(200);
const thirtyDay = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
assert(thirtyDay.scene.timeWindowDays === 30, "time control did not switch to 30 days");

const canvasDataLength = await page.evaluate(() => document.querySelector("#world").toDataURL("image/png").length);
assert(canvasDataLength > 10000, "canvas export looks blank");
assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join("\n")}`);

await page.screenshot({ path: "test-results/gitland-smoke.png", fullPage: true });
await browser.close();

console.log("GitLand smoke test passed");

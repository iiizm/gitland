import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const urlArgIndex = process.argv.indexOf("--url");
const url = urlArgIndex >= 0 ? process.argv[urlArgIndex + 1] : process.env.URL ?? "http://127.0.0.1:5173";
await mkdir("test-results", { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function parseHexColor(value) {
  const hex = value.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function rgbDistance(a, b) {
  const [ar, ag, ab] = parseHexColor(a);
  const [br, bg, bb] = parseHexColor(b);
  return Math.hypot(ar - br, ag - bg, ab - bb);
}

function nearestCluster(repo, clusters) {
  return clusters
    .map((cluster) => ({
      cluster,
      distance: Math.hypot(repo.position[0] - cluster.centroid[0], repo.position[2] - cluster.centroid[2])
    }))
    .sort((a, b) => a.distance - b.distance)[0].cluster;
}

function assertTopicDistinction(payload, expectedTopics) {
  assert(payload.topicIdentity.length === expectedTopics.length, "expected six topic identities");
  assert(payload.clusters.length === expectedTopics.length, "expected six clusters");
  assert(payload.scene.districtLabelCount === expectedTopics.length, "expected one district label per topic");
  assert(new Set(payload.topicIdentity.map((topic) => topic.architecture.landmark)).size === expectedTopics.length, "topic landmarks are not unique");

  for (const topic of payload.topicIdentity) {
    assert(topic.territory.radius >= 42, `${topic.topic} territory is too small`);
    assert(topic.territory.radius <= 190, `${topic.topic} territory is too wide`);
    assert(topic.counts.radialLanes >= 1, `${topic.topic} lost local road identity`);
  }

  for (let i = 0; i < payload.topicIdentity.length; i += 1) {
    for (let j = i + 1; j < payload.topicIdentity.length; j += 1) {
      const a = payload.topicIdentity[i];
      const b = payload.topicIdentity[j];
      assert(rgbDistance(a.colors.groundWash, b.colors.groundWash) >= 35, `${a.topic}/${b.topic} ground washes too similar`);
      assert(rgbDistance(a.colors.accentTint, b.colors.accentTint) >= 45, `${a.topic}/${b.topic} accents too similar`);
    }
  }

  const fullRepos = payload.repos.filter((repo) => repo.detailLevel === "full");
  const nearestCorrect = fullRepos.filter((repo) => nearestCluster(repo, payload.clusters).topic === repo.topic);
  assert(nearestCorrect.length / fullRepos.length >= 0.95, "full-detail repo cores bleed into neighboring topics");
}

function assertScenicFeatures(payload) {
  const scenic = payload.scene.scenicFeatures;
  assert(scenic, "missing scenic feature debug payload");
  assert(scenic.lakes >= 5, "expected multiple lake/lagoon features");
  assert(scenic.waterCourses >= 4, "expected multiple river/canal features");
  assert(scenic.rivers >= 2, "expected broad river system");
  assert(scenic.canals >= 2, "expected engineered canal features");
  assert(scenic.bridges >= 5, "expected visible water bridge crossings");
  assert(scenic.docks >= 4, "expected waterfront docks");
  assert(scenic.boats >= 6, "expected boats on water features");
  assert(scenic.reeds >= 120, "expected reed-lined shore detail");
  assert(scenic.lilyPads >= 40, "expected pond/lake surface detail");
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
assert(initial.scene.roadNetwork, "missing road network debug payload");
assert(initial.scene.roadCount === initial.scene.roadNetwork.total, "road count mismatch");
assert(initial.scene.roadNetwork.interDistrictRoads >= 6, "lost core district roads");
assert(initial.scene.roadNetwork.landmarkSpurs >= initial.clusters.length, "expected landmark approach roads");
assert(initial.scene.roadNetwork.cityRoadCount <= 120, "city roads are still too dense");
assert(initial.scene.roadNetwork.maxCityPathsPerCluster <= 20, "one district has too many local roads");
assert(Array.isArray(initial.topicIdentity), "missing topic identity debug payload");
const expectedTopics = ["ai", "frontend", "infra", "database", "mobile", "game"];
const identityTopics = initial.topicIdentity.map((topic) => topic.topic).sort();
assert(JSON.stringify(identityTopics) === JSON.stringify([...expectedTopics].sort()), "topic identity coverage changed");
assertTopicDistinction(initial, expectedTopics);
assertScenicFeatures(initial);
const styleSignatures = new Set();
for (const identity of initial.topicIdentity) {
  assert(identity.counts.repos > 0, `${identity.topic} has no repos`);
  assert(identity.counts.plazaLoops >= 1, `${identity.topic} lost its plaza loop`);
  assert(identity.counts.people > 0, `${identity.topic} has no visible activity`);
  assert(identity.styleFallback === false, `${identity.topic} used fallback styling`);
  for (const color of Object.values(identity.colors)) {
    assert(isHexColor(color), `${identity.topic} has invalid color ${color}`);
  }
  styleSignatures.add(JSON.stringify({ colors: identity.colors, architecture: identity.architecture }));
}
assert(styleSignatures.size === expectedTopics.length, "topic style signatures are not unique");
assert(Number.isFinite(initial.performance.drawCalls) && initial.performance.drawCalls > 0, "invalid draw call metric");
assert(Number.isFinite(initial.performance.triangles) && initial.performance.triangles > 0, "invalid triangle metric");
assert(initial.performance.drawCalls <= 7000, "draw call count regressed too far");
assert(initial.performance.triangles <= 1900000, "triangle count regressed too far");

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
assert(thirtyDay.scene.roadNetwork.cityRoadCount <= 120, "30-day city roads are too dense");
assert(thirtyDay.scene.roadNetwork.total <= initial.scene.roadNetwork.total * 1.1, "road count accumulated after time switch");
assertTopicDistinction(thirtyDay, expectedTopics);
assertScenicFeatures(thirtyDay);
assert(thirtyDay.performance.drawCalls <= initial.performance.drawCalls * 1.15, "30-day draw calls regressed");
assert(thirtyDay.performance.triangles <= initial.performance.triangles * 1.15, "30-day triangle count regressed");
assert(
  JSON.stringify(thirtyDay.topicIdentity.map((topic) => topic.topic).sort()) === JSON.stringify(identityTopics),
  "topic identity changed after time switch"
);

await page.click('[data-days="7"]');
await page.waitForTimeout(200);
const sevenDay = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
assert(sevenDay.scene.timeWindowDays === 7, "time control did not switch to 7 days");
assertTopicDistinction(sevenDay, expectedTopics);
assertScenicFeatures(sevenDay);
assert(sevenDay.performance.drawCalls <= initial.performance.drawCalls * 1.15, "7-day draw calls regressed");
assert(sevenDay.performance.triangles <= initial.performance.triangles * 1.15, "7-day triangle count regressed");

const canvasDataLength = await page.evaluate(() => document.querySelector("#world").toDataURL("image/png").length);
assert(canvasDataLength > 10000, "canvas export looks blank");
assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join("\n")}`);

await page.screenshot({ path: "test-results/gitland-smoke.png", fullPage: true });
await browser.close();

console.log("GitLand smoke test passed");

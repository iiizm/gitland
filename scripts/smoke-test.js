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
  assert(payload.scene.visualTierMatrix, "missing visual tier matrix");
  assert(new Set(payload.topicIdentity.map((topic) => topic.speciesArchitecture?.key)).size === expectedTopics.length, "species architecture keys are not unique");
  assert(new Set(payload.topicIdentity.map((topic) => topic.speciesArchitecture?.outpostSilhouetteSignature)).size === expectedTopics.length, "outpost silhouettes are not unique");

  for (const topic of payload.topicIdentity) {
    assert(topic.territory.radius >= 42, `${topic.topic} territory is too small`);
    assert(topic.territory.radius <= 190, `${topic.topic} territory is too wide`);
    assert(topic.counts.radialLanes >= 1, `${topic.topic} lost local road identity`);
    assert(topic.speciesArchitecture?.ornamentKinds?.length >= 3, `${topic.topic} missing species ornament language`);
    const tierCoverage = topic.villageKit?.tierCoverage;
    assert(tierCoverage, `${topic.topic} missing tier coverage`);
    assert(tierCoverage.full >= 8, `${topic.topic} should render castle and house stages`);
    assert(tierCoverage.outpost >= 1, `${topic.topic} should retain outpost tier`);
    for (const stage of [1, 2, 3, 4]) {
      assert(tierCoverage.castle[String(stage)] >= 1, `${topic.topic} missing castle stage ${stage}`);
      assert(tierCoverage.house[String(stage)] >= 1, `${topic.topic} missing house stage ${stage}`);
      assert(topic.villageKit.actualTierPickIds.castle[String(stage)], `${topic.topic} missing castle pick ${stage}`);
      assert(topic.villageKit.actualTierPickIds.house[String(stage)], `${topic.topic} missing house pick ${stage}`);
    }
    assert(tierCoverage.missing.length === 0, `${topic.topic} has missing visual tiers`);
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

  for (const tierKey of ["castle-1", "castle-2", "castle-3", "castle-4", "house-1", "house-2", "house-3", "house-4", "outpost"]) {
    const signatures = new Set(
      payload.repos
        .filter((repo) => repo.visualTierKey === tierKey)
        .map((repo) => `${repo.speciesSignature?.architecture}:${repo.speciesSignature?.pickId}:${repo.speciesSignature?.outpostSilhouette}`)
    );
    assert(signatures.size >= expectedTopics.length, `${tierKey} species signatures are not unique across topics`);
  }
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
  assert(scenic.shoreRings >= scenic.lakes * 2, "expected wet shoreline and sandbar lake rings");
  assert(scenic.shallowWaterLayers >= scenic.lakes, "expected shallow lake water layers");
  assert(scenic.deepWaterRibbons >= scenic.waterCourses, "expected deep water ribbons in rivers/canals");
  assert(scenic.riverVisualLayers >= scenic.waterCourses * 3, "expected layered river/canal visuals");
  assert(scenic.shorePebbles >= 60, "expected instanced shore pebble detail");
  assert(scenic.driftwood >= 12, "expected driftwood detail along water");
  assert(scenic.foamFlecks >= 24, "expected foam flecks on moving water");
  assert(scenic.coastalFeatures >= 1, "expected at least one coastal lagoon feature");
  assert(scenic.inlets >= 1, "expected lagoon inlet water detail");
  assert(scenic.composition?.waterCoverageRatio > 0.02, "water coverage ratio is too low");
  assert(scenic.composition?.waterCoverageRatio < 0.12, "water coverage ratio is too high");
  assert(scenic.composition?.shorelineLength > 1500, "expected substantial shoreline length");
  assert(scenic.composition?.visibleFromInitialCamera?.water >= 2, "expected visible water features from the current camera");
  assert(scenic.backgroundLayers?.skyDepthLayers >= 3, "expected layered sky depth");
  assert(scenic.backgroundLayers?.cloudLayers >= 2, "expected near/far cloud layers");
  assert(scenic.backgroundLayers?.atmosphericHazeBands >= 2, "expected horizon haze bands");
  assert(scenic.backgroundLayers?.mountainRidges >= 3, "expected layered mountain ridges");
  assert(scenic.backgroundLayers?.horizonForestBands >= 2, "expected layered horizon forest");
  assert(scenic.backgroundLayers?.terrainDetailPatches >= 400, "expected terrain detail patches");
  assert(scenic.placementQuality?.invalidWaterPlacements === 0, "invalid water placements found");
  assert(scenic.placementQuality?.boatsOnWater === scenic.boats, "boat placement quality mismatch");
  assert(scenic.placementQuality?.docksTouchingWater === scenic.docks, "dock placement quality mismatch");
  assert(scenic.placementQuality?.bridgesSpanningWater === scenic.bridges, "bridge placement quality mismatch");
  assert(scenic.placementQuality?.featuresOverlappingBuildings === 0, "scenic features overlap buildings");
  assert(scenic.detailDensity?.shorelineProps >= scenic.reeds + scenic.shorePebbles, "shoreline prop density is incomplete");
  assert(scenic.detailDensity?.surfaceProps >= scenic.lilyPads + scenic.foamFlecks, "surface prop density is incomplete");
  assert(scenic.detailDensity?.propsPerWaterCourse >= 12, "watercourse prop density is too low");
  assert(scenic.landscapeBudget?.instancedProps >= 400, "expected instanced scenic props");
  assert(scenic.landscapeBudget?.instancedProps <= 900, "too many scenic props for the performance budget");
  assert(scenic.landscapeBudget?.waterSurfaceCount >= scenic.lakes + scenic.waterCourses * 2, "missing water surface budget accounting");
}

function activityTotal(recent = {}) {
  return (
    (recent.stars ?? 0) +
    (recent.forks ?? 0) +
    (recent.commits ?? 0) +
    (recent.pullRequests ?? 0) +
    (recent.issues ?? 0) +
    (recent.releases ?? 0) +
    (recent.contributors ?? 0)
  );
}

function assertTrendDigest(payload, expectedTopics) {
  assert(payload.trend, "missing trend digest");
  assert(payload.trend.windowDays === payload.scene.timeWindowDays, "trend window does not match scene window");
  assert(payload.trend.renderedRepositoryCount === payload.scene.repoCount, "trend rendered repository count mismatch");
  assert(payload.trend.repositoryUniverseCount >= payload.trend.renderedRepositoryCount, "trend universe is smaller than rendered repos");
  assert(payload.trend.coverage, "missing trend coverage");
  assert(
    payload.trend.coverage.eventDerivedCount + payload.trend.coverage.metadataEstimatedCount === payload.scene.repoCount,
    "trend coverage counts do not sum to repo count"
  );

  const hotTopics = payload.trend.hotTopics;
  assert(Array.isArray(hotTopics) && hotTopics.length === expectedTopics.length, "expected one hot topic per field");
  assert(Array.isArray(payload.scene.trendLeaderboard), "missing scene trend leaderboard");
  assert(payload.scene.trendLeaderboard.length === expectedTopics.length, "scene trend leaderboard changed size");
  const topicSet = new Set(hotTopics.map((topic) => topic.topic));
  for (const topic of expectedTopics) assert(topicSet.has(topic), `trend digest missing ${topic}`);

  const ranks = hotTopics.map((topic) => topic.rank).sort((a, b) => a - b);
  assert(JSON.stringify(ranks) === JSON.stringify(expectedTopics.map((_, index) => index + 1)), "hot topic ranks are not contiguous");
  for (let i = 1; i < hotTopics.length; i += 1) {
    assert(hotTopics[i - 1].score >= hotTopics[i].score, "hot topics are not sorted by score");
  }

  const reposById = new Map(payload.repos.map((repo) => [repo.id ?? repo.name, repo]));
  for (const topic of hotTopics) {
    assert(topic.label && topic.query, `${topic.topic} missing readable trend identity`);
    assert(topic.renderedCount > 0, `${topic.topic} rendered count missing`);
    assert(topic.candidateCount >= topic.renderedCount, `${topic.topic} candidate count too small`);
    assert(topic.topRepoName, `${topic.topic} missing top repo`);
    assert(topic.topRepos?.length >= Math.min(3, topic.renderedCount), `${topic.topic} needs top repo evidence`);
    for (const repo of topic.topRepos) {
      assert(repo.name && repo.topicRank >= 1, `${topic.topic} top repo missing rank`);
      assert(reposById.has(repo.id), `${topic.topic} top repo ${repo.name} is not rendered`);
      assert(reposById.get(repo.id).topic === topic.topic, `${repo.name} is assigned to the wrong topic`);
    }
    const identity = payload.topicIdentity.find((item) => item.topic === topic.topic);
    assert(identity?.trending?.rank === topic.rank, `${topic.topic} identity trend rank mismatch`);
    assert(identity.trending.topRepo.name === topic.topRepoName, `${topic.topic} identity top repo mismatch`);
    assert(payload.repos.some((repo) => repo.topic === topic.topic && repo.isTopicTopRepo), `${topic.topic} has no rendered top repo marker`);
  }

  const hotRepos = payload.trend.hotRepos;
  assert(Array.isArray(hotRepos) && hotRepos.length >= 10, "expected a useful hot repo leaderboard");
  assert(new Set(hotRepos.map((repo) => repo.name)).size === hotRepos.length, "hot repo names are duplicated");
  for (const repo of hotRepos) {
    assert(repo.url?.startsWith("https://github.com/"), `${repo.name} missing GitHub URL`);
    assert(expectedTopics.includes(repo.topic), `${repo.name} has unknown topic`);
    assert(Number.isFinite(repo.hotness) && repo.hotness >= 0, `${repo.name} invalid hotness`);
    assert(Number.isFinite(repo.score) && repo.score >= 0, `${repo.name} invalid trend score`);
    assert(activityTotal(repo.activityBreakdown) === repo.activityTotal, `${repo.name} activity breakdown mismatch`);
  }

  for (const repo of payload.repos.slice(0, 40)) {
    assert(repo.trend, `${repo.name} missing repo trend payload`);
    assert(repo.recentActivity?.windowDays === payload.scene.timeWindowDays, `${repo.name} recent activity window mismatch`);
    assert(Number.isFinite(repo.trend.score), `${repo.name} missing trend score`);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.locator("#world").waitFor({ state: "attached", timeout: 90000 });
const worldBox = await page.locator("#world").boundingBox();
assert(worldBox && worldBox.width > 0 && worldBox.height > 0, "world canvas has no visible size");
await page.waitForFunction(() => typeof window.render_game_to_text === "function", { timeout: 90000 });
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
assertTrendDigest(initial, expectedTopics);
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
assert(initial.performance.breakdown.scenicWater > 0, "missing scenic water triangle budget");
assert(initial.performance.breakdown.backgroundMountains > 0, "missing background mountain triangle budget");
assert(initial.performance.breakdown.backgroundForest > 0, "missing background forest triangle budget");
assert(initial.performance.breakdown.backgroundSky > 0, "missing background sky triangle budget");
assert(initial.performance.breakdown.backgroundAtmosphere > 0, "missing atmospheric background triangle budget");
assert(initial.performance.breakdown.scenicWater <= 90000, "scenic water triangle budget regressed");

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
const selectedRepoPayload = selected.repos.find((repo) => repo.id === selected.interactions.selectedRepo);
assert(selectedRepoPayload?.trend?.topicTrendRank >= 1, "selected repo does not expose field trend rank");
assert(selectedRepoPayload?.topicTopRepoName, "selected repo does not expose topic top repo");

await page.click('[data-days="30"]');
await page.waitForTimeout(200);
const thirtyDay = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
assert(thirtyDay.scene.timeWindowDays === 30, "time control did not switch to 30 days");
assert(thirtyDay.scene.roadNetwork.cityRoadCount <= 120, "30-day city roads are too dense");
assert(thirtyDay.scene.roadNetwork.total <= initial.scene.roadNetwork.total * 1.1, "road count accumulated after time switch");
assertTopicDistinction(thirtyDay, expectedTopics);
assertScenicFeatures(thirtyDay);
assertTrendDigest(thirtyDay, expectedTopics);
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
assertTrendDigest(sevenDay, expectedTopics);
assert(sevenDay.performance.drawCalls <= initial.performance.drawCalls * 1.15, "7-day draw calls regressed");
assert(sevenDay.performance.triangles <= initial.performance.triangles * 1.15, "7-day triangle count regressed");

const canvasDataLength = await page.evaluate(() => document.querySelector("#world").toDataURL("image/png").length);
assert(canvasDataLength > 10000, "canvas export looks blank");
assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join("\n")}`);

await page.screenshot({ path: "test-results/gitland-smoke.png", fullPage: true });
await browser.close();

console.log("GitLand smoke test passed");

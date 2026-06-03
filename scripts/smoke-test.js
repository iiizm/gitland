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
  assert(new Set(payload.topicIdentity.map((topic) => topic.speciesArchitecture?.outpostGeometrySignature)).size === expectedTopics.length, "outpost geometry families are not unique");
  assert(new Set(payload.topicIdentity.map((topic) => topic.groundIdentity?.patternFamily)).size === expectedTopics.length, "district ground identity patterns are not unique");

  for (const topic of payload.topicIdentity) {
    assert(topic.territory.radius >= 42, `${topic.topic} territory is too small`);
    assert(topic.territory.radius <= 190, `${topic.topic} territory is too wide`);
    assert(topic.counts.radialLanes >= 1, `${topic.topic} lost local road identity`);
    assert(topic.speciesArchitecture?.ornamentKinds?.length >= 3, `${topic.topic} missing species ornament language`);
    assert(topic.speciesArchitecture?.outpostGeometryFamily, `${topic.topic} missing outpost geometry family`);
    assert(topic.groundIdentity?.renderCategory === "districtIdentityGround", `${topic.topic} missing district ground identity`);
    assert(topic.groundIdentity?.edgeBands >= 2, `${topic.topic} needs civilization edge bands`);
    assert(topic.groundIdentity?.entranceAprons >= 3, `${topic.topic} needs entrance apron identity`);
    assert(topic.groundIdentity?.trendCoupled === false, `${topic.topic} ground identity should not be trend-coupled`);
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
        .map((repo) => `${repo.speciesSignature?.architecture}:${repo.speciesSignature?.pickId}:${repo.speciesSignature?.outpostSilhouette}:${repo.speciesSignature?.outpostGeometry}`)
    );
    assert(signatures.size >= expectedTopics.length, `${tierKey} species signatures are not unique across topics`);
  }
}

function assertDistrictGroundIdentity(payload, expectedTopics) {
  const identity = payload.scene.districtGroundIdentity;
  assert(identity, "missing district ground identity payload");
  assert(identity.expectedTopicCount === expectedTopics.length, "district identity expected topic count mismatch");
  assert(identity.renderCategory === "districtIdentityGround", "district identity render category mismatch");
  assert(identity.semanticLayer === "topic-identity", "district identity should be a topic identity layer");
  assert(identity.labelIndependent === true, "district identity depends on labels");
  assert(identity.trendCoupled === false, "district identity should not be trend-coupled");
  assert(identity.windowDaysIndependent === true, "district identity should be stable across time windows");
  assert(identity.doesNotAddRoads === true, "district identity should not add road clutter");
  assert(new Set(identity.topicCoverage).size === expectedTopics.length, "district identity topic coverage is incomplete");
  assert(identity.edgeBandCount >= expectedTopics.length * 2, "district identity needs two edge bands per topic");
  assert(identity.entranceApronCount >= expectedTopics.length * 3, "district identity needs entrance aprons");
  assert(identity.uniquePatternFamilies === expectedTopics.length, "district identity pattern families are not unique");
  assert(identity.uniqueEdgeBandFamilies === expectedTopics.length, "district identity edge families are not unique");
  assert(identity.uniqueEntranceFamilies === expectedTopics.length, "district identity entrance families are not unique");
  assert(identity.triangleBudget > 0 && identity.triangleBudget <= 12000, "district identity triangle budget regressed");
  assert(identity.drawCallBudget > 0 && identity.drawCallBudget <= 2, "district identity draw call budget regressed");
  assert(payload.performance.breakdown.districtIdentityGround > 0, "district identity is not represented as world geometry");
  assert(payload.performance.breakdown.districtIdentityGround <= 12000, "district identity render budget regressed");
  assert(payload.performance.drawCallBreakdown.districtIdentityGround <= 2, "district identity draw calls regressed");
}

function assertOutpostIdentity(payload, expectedTopics) {
  const identity = payload.scene.outpostIdentity;
  assert(identity, "missing outpost identity payload");
  assert(identity.count >= 1000, "expected many outpost identity instances");
  assert(identity.expectedTopicCount === expectedTopics.length, "outpost identity expected topic count mismatch");
  assert(identity.renderCategory === "outpostIdentity", "outpost identity render category mismatch");
  assert(identity.semanticLayer === "topic-identity", "outpost identity should be a topic identity layer");
  assert(identity.labelIndependent === true, "outpost identity depends on labels");
  assert(identity.trendCoupled === false, "outpost identity should not be trend-coupled");
  assert(identity.windowDaysIndependent === true, "outpost identity should be stable across time windows");
  assert(identity.usesTopicInstancing === true, "outpost identity should use topic instancing");
  assert(identity.crossTopicInstanceMerges === 0, "outpost identity merged topic geometry");
  assert(new Set(identity.topicCoverage).size === expectedTopics.length, "outpost identity topic coverage is incomplete");
  assert(identity.bodyMeshCount === expectedTopics.length, "expected one outpost body mesh per topic");
  assert(identity.roofMeshCount === expectedTopics.length, "expected one outpost roof mesh per topic");
  assert(identity.accentMeshCount === expectedTopics.length, "expected one outpost accent mesh per topic");
  assert(identity.uniqueGeometryFamilies === expectedTopics.length, "outpost geometry families are not unique");
  assert(identity.uniqueRoofFamilies === expectedTopics.length, "outpost roof families are not unique");
  assert(identity.uniqueAccentFamilies === expectedTopics.length, "outpost accent families are not unique");
  assert(identity.uniqueGroundContacts === expectedTopics.length, "outpost ground contacts are not unique");
  assert(identity.triangleBudget > 0 && identity.triangleBudget <= 95000, "outpost identity triangle budget regressed");
  assert(identity.drawCallBudget > 0 && identity.drawCallBudget <= 18, "outpost identity draw call budget regressed");
  assert(identity.shadowCasterCount <= 18, "outpost identity casts too many shadows");
  assert(payload.performance.breakdown.outpostBuildings > 0, "outpost buildings are not represented as world geometry");
  assert(payload.performance.breakdown.outpostBuildings <= 85000, "outpost building geometry budget regressed");
  assert(payload.performance.drawCallBreakdown.outpostBuildings <= 12, "outpost building draw calls regressed");
  assert(payload.performance.breakdown.outpostIdentity > 0, "outpost identity accents are not represented as world geometry");
  assert(payload.performance.breakdown.outpostIdentity <= 65000, "outpost identity accent budget regressed");
  assert(payload.performance.drawCallBreakdown.outpostIdentity <= 6, "outpost identity accent draw calls regressed");

  for (const topic of expectedTopics) {
    const topicRepos = payload.repos.filter((repo) => repo.topic === topic && repo.visualTierKey === "outpost");
    assert(topicRepos.length > 0, `${topic} needs outpost repos`);
    assert(new Set(topicRepos.map((repo) => repo.outpostGeometryFamily)).size === 1, `${topic} outpost geometry is inconsistent`);
    assert(new Set(topicRepos.map((repo) => repo.outpostGroundContact)).size === 1, `${topic} outpost ground contact is inconsistent`);
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
  assertBackgroundVista(payload);
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

function assertBackgroundVista(payload) {
  const vista = payload.scene.scenicFeatures?.backgroundLayers?.backgroundVista;
  assert(vista, "missing background vista payload");
  assert(vista.renderCategory === "backgroundVista", "background vista render category mismatch");
  assert(vista.semanticLayer === "open-world-horizon", "background vista should be an open-world horizon layer");
  assert(vista.labelIndependent === true, "background vista depends on labels");
  assert(vista.trendCoupled === false, "background vista should not be trend-coupled");
  assert(vista.windowDaysIndependent === true, "background vista should be stable across time windows");
  assert(vista.vistaBands >= 3, "background vista needs layered vista bands");
  assert(vista.distantCliffBands >= 2, "background vista needs cliff bands");
  assert(vista.distantCliffArcs >= 5, "background vista needs broken cliff arcs");
  assert(vista.distantPassOpenings >= 5, "background vista needs distant pass openings");
  assert(vista.distantPlateaus >= 5, "background vista needs plateau silhouettes");
  assert(vista.foothillTransitionPatches >= 40, "background vista needs foothill transition patches");
  assert(vista.visibleFromInitialCamera?.cliffArcs >= 2, "background vista cliffs are not visible from initial camera");
  assert(vista.visibleFromInitialCamera?.passOpenings >= 2, "background vista passes are not visible from initial camera");
  assert(vista.visibleFromInitialCamera?.plateaus >= 2, "background vista plateaus are not visible from initial camera");
  assert(vista.minRadius >= 270, "background vista is too close to the play space");
  assert(vista.maxRadius >= 700, "background vista does not extend the perceived world far enough");
  assert(vista.triangleBudget > 0 && vista.triangleBudget <= 25000, "background vista triangle budget regressed");
  assert(vista.drawCallBudget > 0 && vista.drawCallBudget <= 4, "background vista draw call budget regressed");
  assert(vista.shadowCasterCount === 0, "background vista should not cast shadows");
  assert(vista.raycastableCount === 0, "background vista should not be raycastable");
  assert(vista.placementQuality?.outsidePlayableMap === true, "background vista should sit outside the playable map");
  assert(vista.placementQuality?.overlappingRepoBuildings === 0, "background vista overlaps repo buildings");
  assert(payload.performance.breakdown.backgroundVista > 0, "background vista is not represented as world geometry");
  assert(payload.performance.breakdown.backgroundVista <= 25000, "background vista render budget regressed");
  assert(payload.performance.drawCallBreakdown.backgroundVista <= 4, "background vista draw calls regressed");
}

function assertDistantLandmarks(payload, expectedTopics) {
  const landmarks = payload.scene.distantLandmarks;
  assert(landmarks, "missing distant civilization landmark payload");
  assert(landmarks.count === expectedTopics.length, "expected one civilization landmark per topic");
  assert(landmarks.expectedTopicCount === expectedTopics.length, "landmark expected topic count mismatch");
  assert(landmarks.labelIndependent === true, "civilization landmarks depend on labels");
  assert(landmarks.renderCategory === "civilizationLandmarks", "civilization landmarks have the wrong render category");
  assert(landmarks.semanticLayer === "topic-identity", "civilization landmarks are not a topic identity layer");
  assert(landmarks.trendCoupled === false, "civilization landmarks should not be trend-coupled");
  assert(landmarks.windowDaysIndependent === true, "civilization landmarks should be independent of time window");
  assert(landmarks.physicalWorldAnchors === true, "civilization landmarks should be physical world anchors");
  assert(landmarks.trendSeparated === true, "civilization landmarks should be separated from trend markers");
  assert(new Set(landmarks.topicCoverage).size === expectedTopics.length, "civilization landmark topic coverage is incomplete");
  for (const topic of expectedTopics) assert(landmarks.topicCoverage.includes(topic), `missing ${topic} civilization landmark`);
  assert(landmarks.uniqueSilhouetteKeys === expectedTopics.length, "civilization landmark silhouettes are not unique");
  assert(landmarks.uniqueMaterialPalettes === expectedTopics.length, "civilization landmark material palettes are not unique");
  assert(landmarks.triangleBudget > 0, "civilization landmarks have no triangle budget");
  assert(landmarks.triangleBudget <= 50000, "civilization landmark triangle budget regressed");
  assert(landmarks.drawCallBudget <= 48, "civilization landmarks use too many draw calls");
  assert(landmarks.shadowCasterCount <= 48, "civilization landmarks use too many shadow casters");
  assert(landmarks.transparentMeshCount <= expectedTopics.length, "civilization landmarks use too many transparent meshes");
  assert(landmarks.maxHeight >= 8, "civilization landmarks are too small for horizon readability");
  assert(landmarks.placement.edgeAnchored === expectedTopics.length, "civilization landmarks should sit on district edges");
  assert(landmarks.placement.overlappingRepoBuildings === 0, "civilization landmarks overlap repo buildings");
  assert(landmarks.lod?.farSilhouetteCount === expectedTopics.length, "civilization landmarks need far silhouettes");
  assert(landmarks.lod?.nearDetailCount === expectedTopics.length, "civilization landmarks need near detail records");
  assert(payload.performance.breakdown.civilizationLandmarks > 0, "civilization landmarks are not represented as world geometry");
  assert(payload.performance.breakdown.civilizationLandmarks <= 50000, "civilization landmark render budget regressed");
  assert(payload.performance.drawCallBreakdown.civilizationLandmarks <= 48, "civilization landmark draw calls regressed");

  const identities = payload.topicIdentity.map((topic) => topic.distantLandmarkIdentity);
  assert(identities.every(Boolean), "some topics lack distant landmark identity");
  assert(new Set(identities.map((item) => item.civilizationArchetype)).size === expectedTopics.length, "civilization landmark archetypes are not unique");
  assert(new Set(identities.map((item) => item.silhouetteSignature)).size === expectedTopics.length, "civilization landmark signatures are not unique");
  assert(new Set(identities.map((item) => item.verticalProfile)).size === expectedTopics.length, "civilization landmark profiles are not unique");

  for (const topic of payload.topicIdentity) {
    const landmark = topic.distantLandmarkIdentity;
    assert(landmark.topic === topic.topic, `${topic.topic} landmark topic mismatch`);
    assert(landmark.kind === topic.architecture.landmark, `${topic.topic} landmark kind does not match architecture`);
    assert(landmark.horizonReadable === true, `${topic.topic} landmark is not horizon readable`);
    assert(landmark.visibleFromInitialCamera === true, `${topic.topic} landmark is not visible from initial camera`);
    assert(landmark.visibleFromMinimapScale === true, `${topic.topic} landmark is not minimap-scale readable`);
    assert(landmark.permanentIdentityLayer === true, `${topic.topic} landmark is not permanent identity`);
    assert(landmark.trendCoupled === false, `${topic.topic} landmark is trend-coupled`);
    assert(landmark.labelIndependent === true, `${topic.topic} landmark depends on labels`);
    assert(landmark.anchor?.outsideRepoTrendMarker === true, `${topic.topic} landmark overlaps trend marker semantics`);
    assert(landmark.anchor?.distanceFromCentroid >= topic.territory.radius * 0.3, `${topic.topic} landmark is too central`);
    assert(landmark.anchor?.nearestRepoDistance >= 7, `${topic.topic} landmark overlaps repo buildings`);
    assert(landmark.renderCategory === "civilizationLandmarks", `${topic.topic} landmark render category mismatch`);
    assert(landmark.triangleBudget > 0, `${topic.topic} landmark has no geometry budget`);
    assert(landmark.drawCalls <= 12, `${topic.topic} landmark uses too many draw calls`);
  }
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
  const trendVisuals = payload.scene.trendVisuals;
  assert(trendVisuals, "missing world trend visual evidence");
  assert(trendVisuals.windowDays === payload.scene.timeWindowDays, "trend visual window does not match scene window");
  assert(trendVisuals.labelIndependent === true, "trend visuals still depend on labels");
  assert(trendVisuals.renderCategory === "trendMarkers", "trend visuals are not tagged as world geometry");
  assert(trendVisuals.fieldHeatVillageCount === expectedTopics.length, "expected one field heat aura per topic village");
  assert(trendVisuals.topicTopMarkerCount >= expectedTopics.length, "not every topic top repo has a visual marker");
  assert(trendVisuals.topicTop3MarkerCount >= expectedTopics.length * 3, "topic top-three repos need building-level markers");
  assert(trendVisuals.globalTopMarkerCount >= Math.min(18, payload.trend.hotRepos?.length ?? 0), "global hot repos lack visual markers");
  assert(trendVisuals.markerRepoCount >= expectedTopics.length * 3, "too few repo trend markers were rendered");
  assert(trendVisuals.triangleBudget <= 40000, "trend marker triangle budget regressed");
  assert(payload.performance.breakdown.trendMarkers > 0, "trend markers are not represented as world geometry");
  assert(payload.performance.breakdown.trendMarkers <= 40000, "trend marker render budget regressed");

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
  const reposByName = new Map(payload.repos.map((repo) => [repo.name, repo]));
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
    assert(identity.trendVisualIdentity, `${topic.topic} missing village trend visual identity`);
    assert(identity.trendVisualIdentity.heatLevel >= 1, `${topic.topic} has no field heat visual`);
    assert(identity.trendVisualIdentity.labelIndependent === true, `${topic.topic} field visuals depend on labels`);
    assert(identity.trendVisualIdentity.topRepoMarkerId === topic.topRepoId, `${topic.topic} top repo visual anchor mismatch`);
    assert(payload.repos.some((repo) => repo.topic === topic.topic && repo.isTopicTopRepo), `${topic.topic} has no rendered top repo marker`);
    const topRepoPayload = reposById.get(topic.topRepoId);
    assert(topRepoPayload?.worldTrendMarker?.level >= 3, `${topic.topic} top repo is not visually landmarked`);
    assert(topRepoPayload.worldTrendMarker.attachedToBuilding, `${topic.topic} top repo marker is not building-attached`);
    assert(topRepoPayload.worldTrendMarker.visibleFromMap, `${topic.topic} top repo marker is not visible from the map`);
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
    const visualRepo = reposByName.get(repo.name);
    assert(visualRepo?.worldTrendMarker?.level >= 2, `${repo.name} global hot repo lacks world marker`);
    assert(visualRepo.worldTrendMarker.labelIndependent === true, `${repo.name} trend marker depends on labels`);
  }

  for (const repo of payload.repos.slice(0, 40)) {
    assert(repo.trend, `${repo.name} missing repo trend payload`);
    assert(repo.recentActivity?.windowDays === payload.scene.timeWindowDays, `${repo.name} recent activity window mismatch`);
    assert(Number.isFinite(repo.trend.score), `${repo.name} missing trend score`);
  }
}

function assertOptimizationStats(payload) {
  const optimization = payload.performance.optimization;
  assert(optimization, "missing performance optimization payload");
  const groundMarks = optimization.buildingGroundMarks;
  assert(groundMarks, "missing building ground mark optimization stats");
  assert(groundMarks.enabled === true, "building ground mark instancing is not enabled");
  assert(groundMarks.sourceMeshCount >= 90, "expected many former full-settlement ground meshes");
  assert(groundMarks.instancedMeshCount === 2, "full settlement ground marks should render as two instanced meshes");
  assert(groundMarks.savedDrawCalls >= 90, "ground mark optimization saved too few draw calls");
  assert(groundMarks.dirtPatchInstances === groundMarks.contactShadowInstances, "dirt/shadow instance counts diverged");
  assert(groundMarks.dirtPatchInstances >= 40, "expected one dirt patch instance per full settlement");
  assert(groundMarks.triangleBudget > 0, "missing ground mark triangle budget");
  assert(groundMarks.triangleBudget <= 5000, "ground mark triangle budget regressed");
  assert(groundMarks.stylePreserving === true, "ground mark optimization should preserve building species style");
  assert(groundMarks.crossTopicInstanceMerges === 0, "ground mark optimization merged topic-specific building geometry");
  assert(optimization.globalBucketsAttempted === false, "unsafe global building merge should not be attempted");
  assert(optimization.stylePreserving === true, "optimization style-preserving flag missing");
  assert(payload.performance.drawCallBreakdown?.settlementGroundMarks === 2, "settlement ground marks should cost two draw calls");
  assert(payload.performance.breakdown?.settlementGroundMarks === groundMarks.triangleBudget, "ground mark triangle accounting mismatch");
  assert(payload.performance.drawCalls <= 3300, "draw call count regressed after optimization");
  assert(payload.performance.triangles <= 1700000, "triangle count regressed after identity pass");
  assert((payload.performance.drawCallBreakdown.other ?? 0) <= 420, "uncategorized draw calls regressed");
}

function landmarkSignature(payload) {
  return JSON.stringify(
    payload.topicIdentity
      .map((topic) => topic.distantLandmarkIdentity)
      .map((landmark) => ({
        topic: landmark.topic,
        kind: landmark.kind,
        civilizationArchetype: landmark.civilizationArchetype,
        silhouetteSignature: landmark.silhouetteSignature,
        materialSignature: landmark.materialSignature,
        verticalProfile: landmark.verticalProfile,
        permanentIdentityLayer: landmark.permanentIdentityLayer,
        trendCoupled: landmark.trendCoupled
      }))
      .sort((a, b) => a.topic.localeCompare(b.topic))
  );
}

function permanentIdentitySignature(payload) {
  return JSON.stringify(
    payload.topicIdentity
      .map((topic) => ({
        topic: topic.topic,
        outpostGeometrySignature: topic.speciesArchitecture?.outpostGeometrySignature,
        groundPattern: topic.groundIdentity?.patternFamily,
        edgeBand: topic.groundIdentity?.edgeBandFamily,
        entrance: topic.groundIdentity?.entranceFamily
      }))
      .sort((a, b) => a.topic.localeCompare(b.topic))
  );
}

function backgroundVistaSignature(payload) {
  const vista = payload.scene.scenicFeatures?.backgroundLayers?.backgroundVista;
  return JSON.stringify({
    renderCategory: vista?.renderCategory,
    semanticLayer: vista?.semanticLayer,
    silhouetteSignature: vista?.silhouetteSignature,
    vistaBands: vista?.vistaBands,
    distantCliffArcs: vista?.distantCliffArcs,
    distantPassOpenings: vista?.distantPassOpenings,
    distantPlateaus: vista?.distantPlateaus,
    foothillTransitionPatches: vista?.foothillTransitionPatches,
    triangleBudget: vista?.triangleBudget,
    drawCallBudget: vista?.drawCallBudget,
    trendCoupled: vista?.trendCoupled
  });
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
assertDistrictGroundIdentity(initial, expectedTopics);
assertOutpostIdentity(initial, expectedTopics);
assertScenicFeatures(initial);
assertDistantLandmarks(initial, expectedTopics);
assertTrendDigest(initial, expectedTopics);
assertOptimizationStats(initial);
const initialLandmarkSignature = landmarkSignature(initial);
const initialPermanentIdentitySignature = permanentIdentitySignature(initial);
const initialBackgroundVistaSignature = backgroundVistaSignature(initial);
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
assertDistrictGroundIdentity(thirtyDay, expectedTopics);
assertOutpostIdentity(thirtyDay, expectedTopics);
assertScenicFeatures(thirtyDay);
assertDistantLandmarks(thirtyDay, expectedTopics);
assertTrendDigest(thirtyDay, expectedTopics);
assertOptimizationStats(thirtyDay);
assert(landmarkSignature(thirtyDay) === initialLandmarkSignature, "30-day switch changed civilization landmarks");
assert(permanentIdentitySignature(thirtyDay) === initialPermanentIdentitySignature, "30-day switch changed permanent topic identity");
assert(backgroundVistaSignature(thirtyDay) === initialBackgroundVistaSignature, "30-day switch changed background vista");
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
assertDistrictGroundIdentity(sevenDay, expectedTopics);
assertOutpostIdentity(sevenDay, expectedTopics);
assertScenicFeatures(sevenDay);
assertDistantLandmarks(sevenDay, expectedTopics);
assertTrendDigest(sevenDay, expectedTopics);
assertOptimizationStats(sevenDay);
assert(landmarkSignature(sevenDay) === initialLandmarkSignature, "7-day switch changed civilization landmarks");
assert(permanentIdentitySignature(sevenDay) === initialPermanentIdentitySignature, "7-day switch changed permanent topic identity");
assert(backgroundVistaSignature(sevenDay) === initialBackgroundVistaSignature, "7-day switch changed background vista");
assert(sevenDay.performance.drawCalls <= initial.performance.drawCalls * 1.15, "7-day draw calls regressed");
assert(sevenDay.performance.triangles <= initial.performance.triangles * 1.15, "7-day triangle count regressed");

const canvasDataLength = await page.evaluate(() => document.querySelector("#world").toDataURL("image/png").length);
assert(canvasDataLength > 10000, "canvas export looks blank");
assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join("\n")}`);

await page.screenshot({ path: "test-results/gitland-smoke.png", fullPage: true });
await browser.close();

console.log("GitLand smoke test passed");

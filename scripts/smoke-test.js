import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const urlArgIndex = process.argv.indexOf("--url");
const url = urlArgIndex >= 0 ? process.argv[urlArgIndex + 1] : process.env.URL ?? "http://127.0.0.1:5173";
await mkdir("test-results", { recursive: true });

const FULL_SETTLEMENT_TIER_KEYS = ["castle-1", "castle-2", "castle-3", "castle-4", "house-1", "house-2", "house-3", "house-4"];
const FULL_SETTLEMENT_DECOR_BUCKET_FIELDS = [
  "topic",
  "settlementType",
  "settlementClanId",
  "speciesArchitectureKey",
  "material",
  "geometryAttributes",
  "shadowFlags"
];

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
  assert(new Set(payload.topicIdentity.map((topic) => topic.speciesArchitecture?.fullSettlementContactCourtFamily)).size === expectedTopics.length, "full-settlement contact court families are not unique");
  assert(new Set(payload.topicIdentity.map((topic) => topic.groundIdentity?.patternFamily)).size === expectedTopics.length, "district ground identity patterns are not unique");

  for (const topic of payload.topicIdentity) {
    assert(topic.territory.radius >= 42, `${topic.topic} territory is too small`);
    assert(topic.territory.radius <= 190, `${topic.topic} territory is too wide`);
    assert(topic.counts.radialLanes >= 1, `${topic.topic} lost local road identity`);
    assert(topic.speciesArchitecture?.ornamentKinds?.length >= 3, `${topic.topic} missing species ornament language`);
    assert(topic.speciesArchitecture?.fullSettlementContactCourtFamily, `${topic.topic} missing full-settlement contact court family`);
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
        .map((repo) => `${repo.speciesSignature?.architecture}:${repo.speciesSignature?.pickId}:${repo.speciesSignature?.outpostSilhouette}:${repo.speciesSignature?.outpostGeometry}:${repo.speciesSignature?.groundContactFamily}`)
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

function assertFullSettlementGlyphIdentity(payload, expectedTopics) {
  const identity = payload.scene.fullSettlementGlyphIdentity;
  const fullRepos = payload.repos.filter((repo) => repo.settlementRenderedFull);
  assert(identity, "missing full-settlement glyph identity payload");
  assert(identity.renderCategory === "fullSettlementSpeciesGlyphs", "full-settlement glyph render category mismatch");
  assert(identity.semanticLayer === "topic-identity", "full-settlement glyphs should be topic identity");
  assert(identity.labelIndependent === true, "full-settlement glyphs depend on labels");
  assert(identity.trendCoupled === false, "full-settlement glyphs should not be trend-coupled");
  assert(identity.windowDaysIndependent === true, "full-settlement glyphs should be stable across time windows");
  assert(identity.usesTopicInstancing === true, "full-settlement glyphs should use topic instancing");
  assert(identity.fullSettlementCount === fullRepos.length, "full-settlement glyph full-settlement count mismatch");
  assert(identity.count === fullRepos.length, "full-settlement glyph count mismatch");
  assert(identity.glyphInstanceCount === fullRepos.length, "full-settlement glyph instance count mismatch");
  assert(identity.missingFullSettlementGlyphs === 0, "some full settlements are missing glyphs");
  assert(identity.glyphMeshCount === expectedTopics.length, "expected one glyph mesh per topic");
  assert(identity.drawCallBudget === expectedTopics.length, "full-settlement glyph draw-call budget changed");
  assert(identity.triangleBudget > 0 && identity.triangleBudget <= 16000, "full-settlement glyph triangle budget regressed");
  assert(identity.shadowCasterCount === 0, "full-settlement glyphs should not cast shadows");
  assert(identity.raycastableCount === 0, "full-settlement glyphs should not be raycast targets");
  assert(identity.crossTopicInstanceMerges === 0, "full-settlement glyphs merged topics");
  assert(new Set(identity.topicCoverage).size === expectedTopics.length, "full-settlement glyph topic coverage is incomplete");
  assert(new Set(identity.glyphFamilies).size === expectedTopics.length, "full-settlement glyph families are not unique");
  assert(identity.uniqueGlyphFamilies === expectedTopics.length, "full-settlement glyph unique family count mismatch");
  assert(new Set(identity.speciesArchitectureKeys).size === expectedTopics.length, "full-settlement glyph species coverage is incomplete");
  assert(identity.settlementTypesCovered.includes("castle") && identity.settlementTypesCovered.includes("house"), "glyphs must cover castles and houses");
  for (const tierKey of FULL_SETTLEMENT_TIER_KEYS) {
    assert(identity.visualTierKeysCovered.includes(tierKey), `full-settlement glyphs missing ${tierKey}`);
  }
  for (const topic of expectedTopics) {
    const topicRecord = identity.coverageByTopic?.[topic];
    assert(topicRecord, `${topic} missing full-settlement glyph coverage`);
    assert(topicRecord.count === FULL_SETTLEMENT_TIER_KEYS.length, `${topic} should have eight full-settlement glyphs`);
    assert(topicRecord.castles === 4, `${topic} should have four castle glyphs`);
    assert(topicRecord.houses === 4, `${topic} should have four house glyphs`);
    assert(topicRecord.visualTierKeys?.length === FULL_SETTLEMENT_TIER_KEYS.length, `${topic} glyph tier coverage incomplete`);
    assert(topicRecord.glyphFamily, `${topic} missing glyph family`);
  }
  assert(Object.keys(identity.coverageByTopicTier ?? {}).length === expectedTopics.length * FULL_SETTLEMENT_TIER_KEYS.length, "full-settlement glyph topic/tier coverage incomplete");
  for (const repo of fullRepos) {
    assert(repo.fullSettlementGlyphVisible === true, `${repo.name} full-settlement glyph is not visible`);
    assert(repo.fullSettlementGlyphFamily, `${repo.name} missing full-settlement glyph family`);
    assert(repo.speciesSignature?.fullSettlementGlyphFamily === repo.fullSettlementGlyphFamily, `${repo.name} glyph family missing from species signature`);
  }
  assert(payload.performance.drawCallBreakdown.fullSettlementSpeciesGlyphs === identity.drawCallBudget, "full-settlement glyph draw-call accounting mismatch");
  assert(payload.performance.breakdown.fullSettlementSpeciesGlyphs === identity.triangleBudget, "full-settlement glyph triangle accounting mismatch");
}

function assertTopicTierVisualMatrix(payload, expectedTopics) {
  const matrix = payload.scene.visualTierMatrix;
  assert(matrix, "missing visual tier matrix");
  const cells = [];
  for (const topic of expectedTopics) {
    const topicMatrix = matrix[topic];
    assert(topicMatrix, `${topic} missing visual tier matrix`);
    assert(topicMatrix.fullTierCount === FULL_SETTLEMENT_TIER_KEYS.length, `${topic} does not expose all full visual tiers`);
    const tiers = topicMatrix.tiers ?? {};
    for (const tierKey of FULL_SETTLEMENT_TIER_KEYS) {
      const cell = tiers[tierKey];
      assert(cell, `${topic} missing ${tierKey} visual cell`);
      assert(cell.count === 1, `${topic}/${tierKey} should map to one full settlement`);
      assert(cell.visualSignature, `${topic}/${tierKey} missing visual signature`);
      assert(cell.glyphFamily, `${topic}/${tierKey} missing glyph family`);
      assert(cell.contactCourtFamily, `${topic}/${tierKey} missing contact court family`);
      assert(cell.contactCourtSignature, `${topic}/${tierKey} missing contact court signature`);
      assert(cell.contactCourtRenderCategory === "fullSettlementContactCourts", `${topic}/${tierKey} contact court render category mismatch`);
      assert(cell.form && cell.surface && cell.palette && cell.designer, `${topic}/${tierKey} missing source visual spec`);
      assert(cell.speciesArchitectureKey === topicMatrix.speciesArchitecture.key, `${topic}/${tierKey} species architecture mismatch`);
      assert(cell.contactCourtFamily === topicMatrix.speciesArchitecture.fullSettlementContactCourtFamily, `${topic}/${tierKey} contact court species mismatch`);
      assert(cell.trendCoupled === false, `${topic}/${tierKey} visual identity should not be trend-coupled`);
      assert(cell.windowDaysIndependent === true, `${topic}/${tierKey} visual identity should be stable`);
      assert(cell.visualBounds?.height > 0 && cell.visualBounds?.radius > 0, `${topic}/${tierKey} visual bounds missing`);
      cells.push(cell);
    }
    assert(new Set(FULL_SETTLEMENT_TIER_KEYS.map((tierKey) => tiers[tierKey].visualSignature)).size === FULL_SETTLEMENT_TIER_KEYS.length, `${topic} has collapsed castle/house tier visuals`);
    assert(tiers["castle-4"].visualBounds.height > tiers["castle-1"].visualBounds.height, `${topic} castle stage height did not progress`);
    assert(tiers["house-4"].visualBounds.height > tiers["house-1"].visualBounds.height, `${topic} house stage height did not progress`);
    for (const stage of [1, 2, 3, 4]) {
      assert(tiers[`castle-${stage}`].visualSignature !== tiers[`house-${stage}`].visualSignature, `${topic} castle/house stage ${stage} collapsed`);
    }
  }
  assert(cells.length === expectedTopics.length * FULL_SETTLEMENT_TIER_KEYS.length, "topic/tier visual matrix cell count mismatch");
  assert(new Set(cells.map((cell) => cell.visualSignature)).size === cells.length, "topic/tier visual signatures collapsed");
  for (const tierKey of FULL_SETTLEMENT_TIER_KEYS) {
    const tierCells = cells.filter((cell) => cell.visualTierKey === tierKey);
    assert(new Set(tierCells.map((cell) => cell.visualSignature)).size === expectedTopics.length, `${tierKey} is not distinct across all topics`);
    assert(new Set(tierCells.map((cell) => cell.glyphFamily)).size === expectedTopics.length, `${tierKey} glyph families are not distinct across topics`);
    assert(new Set(tierCells.map((cell) => cell.contactCourtFamily)).size === expectedTopics.length, `${tierKey} contact court families are not distinct across topics`);
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

function expectedDominantSignalGlyph(signal) {
  const glyphs = {
    stars: "star",
    forks: "fork",
    commits: "commit",
    pullRequests: "branch",
    issues: "issue",
    releases: "release",
    contributors: "people"
  };
  return glyphs[signal] ?? "activity";
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
  assert(trendVisuals.semanticLayer === "github-trend-signal", "trend visuals should be GitHub trend signals");
  assert(trendVisuals.trendCoupled === true, "trend visuals should be trend-coupled");
  assert(trendVisuals.windowDaysIndependent === false, "trend visuals should change with the time window");
  assert(trendVisuals.usesTrendInputs === true, "trend visuals should use trend inputs");
  assert(trendVisuals.renderCategory === "trendMarkers", "trend visuals are not tagged as world geometry");
  assert(trendVisuals.fieldHeatVillageCount === expectedTopics.length, "expected one field heat aura per topic village");
  assert(trendVisuals.topicTopMarkerCount >= expectedTopics.length, "not every topic top repo has a visual marker");
  assert(trendVisuals.topicTop3MarkerCount >= expectedTopics.length * 3, "topic top-three repos need building-level markers");
  assert(trendVisuals.globalTopMarkerCount >= Math.min(18, payload.trend.hotRepos?.length ?? 0), "global hot repos lack visual markers");
  assert(trendVisuals.markerRepoCount >= expectedTopics.length * 3, "too few repo trend markers were rendered");
  assert(trendVisuals.fieldTopFlowCount === expectedTopics.length, "expected one heat flow from each field village to its top repo");
  assert(trendVisuals.flowRibbonCount === expectedTopics.length, "field heat flow ribbon count changed");
  assert(trendVisuals.flowConnectionCount === expectedTopics.length, "field heat flow connections are missing");
  assert(trendVisuals.flowRibbonTopRepoAnchorCount === expectedTopics.length, "field heat flows are not anchored to the top repos");
  assert(trendVisuals.topRepoCausalLinks === expectedTopics.length, "top repo causal flow links are incomplete");
  assert(trendVisuals.flowRibbonDrawCallBudget <= 1, "field heat ribbons should use one draw call");
  assert(trendVisuals.flowRibbonTriangleBudget <= 600, "field heat ribbon triangle budget regressed");
  assert(trendVisuals.flowRibbonShadowCasterCount === 0, "field heat ribbons should not cast shadows");
  assert(trendVisuals.flowRibbonRaycastableCount === 0, "field heat ribbons should not be raycast targets");
  assert(trendVisuals.dominantSignalGlyphCount >= trendVisuals.markerRepoCount, "marked repos lack visible dominant-signal glyphs");
  assert(trendVisuals.dominantSignalGlyphInstances >= trendVisuals.markerRepoCount, "dominant-signal glyph instances are missing");
  assert(trendVisuals.dominantSignalGlyphFamilies >= 1, "dominant-signal glyph families are missing");
  assert(trendVisuals.dominantSignalGlyphDrawCallBudget <= 1, "dominant-signal glyphs should use one draw call");
  assert(trendVisuals.dominantSignalGlyphTriangleBudget <= 900, "dominant-signal glyph triangle budget regressed");
  assert(trendVisuals.dominantSignalGlyphShadowCasterCount === 0, "dominant-signal glyphs should not cast shadows");
  assert(trendVisuals.dominantSignalGlyphRaycastableCount === 0, "dominant-signal glyphs should not be raycast targets");
  assert(trendVisuals.triangleBudget <= 6000, "trend marker triangle budget regressed");
  assert(trendVisuals.drawCallBudget <= 6, "trend marker draw call budget regressed");
  assert(payload.performance.breakdown.trendMarkers > 0, "trend markers are not represented as world geometry");
  assert(payload.performance.breakdown.trendMarkers <= 6000, "trend marker render budget regressed");
  assert(payload.performance.drawCallBreakdown.trendMarkers <= 6, "trend marker draw call budget regressed");

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
    assert(identity.trendVisualIdentity.topRepoFlowId === topic.topRepoId, `${topic.topic} heat flow target mismatch`);
    assert(identity.trendVisualIdentity.topRepoFlowKind === "field-heat-flow", `${topic.topic} heat flow kind mismatch`);
    assert(identity.trendVisualIdentity.topRepoFlowVisible === true, `${topic.topic} heat flow is not visible`);
    assert(identity.trendVisualIdentity.causeLinkedToTopRepo === true, `${topic.topic} heat flow does not explain its top repo`);
    assert(identity.trendVisualIdentity.flowAnchorMatchesTopRepo === true, `${topic.topic} heat flow anchor mismatch`);
    assert(payload.repos.some((repo) => repo.topic === topic.topic && repo.isTopicTopRepo), `${topic.topic} has no rendered top repo marker`);
    const topRepoPayload = reposById.get(topic.topRepoId);
    assert(topRepoPayload?.worldTrendMarker?.level >= 3, `${topic.topic} top repo is not visually landmarked`);
    assert(topRepoPayload.worldTrendMarker.attachedToBuilding, `${topic.topic} top repo marker is not building-attached`);
    assert(topRepoPayload.worldTrendMarker.visibleFromMap, `${topic.topic} top repo marker is not visible from the map`);
    assert(topRepoPayload.worldTrendMarker.receivesFieldHeatFlow === true, `${topic.topic} top repo does not receive its field heat flow`);
    assert(topRepoPayload.worldTrendMarker.trendCauseLinked === true, `${topic.topic} top repo lacks causal trend linkage`);
    assert(topRepoPayload.worldTrendMarker.fieldHeatFlowId === topic.topRepoId, `${topic.topic} top repo flow id mismatch`);
    assert(topRepoPayload.worldTrendMarker.fieldHeatFlowKind === "field-heat-flow", `${topic.topic} top repo flow kind mismatch`);
    assert(topRepoPayload.worldTrendMarker.dominantSignalGlyphVisible === true, `${topic.topic} top repo signal glyph is not visible`);
    assert(
      topRepoPayload.worldTrendMarker.dominantSignalGlyph === expectedDominantSignalGlyph(topRepoPayload.dominantSignal),
      `${topic.topic} top repo signal glyph does not match dominant signal`
    );
    assert(topRepoPayload.worldTrendMarker.causeGlyphRenderCategory === "trendMarkers", `${topic.topic} top repo signal glyph render category mismatch`);
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
    assert(visualRepo.worldTrendMarker.dominantSignalGlyphVisible === true, `${repo.name} dominant-signal glyph is not visible`);
    assert(
      visualRepo.worldTrendMarker.dominantSignalGlyph === expectedDominantSignalGlyph(visualRepo.dominantSignal),
      `${repo.name} dominant-signal glyph does not match dominant signal`
    );
  }

  const markedRepos = payload.repos.filter((repo) => repo.worldTrendMarker);
  assert(markedRepos.length === trendVisuals.markerRepoCount, "marked repo payload count does not match trend stats");
  for (const repo of markedRepos) {
    assert(repo.worldTrendMarker.dominantSignalGlyphVisible === true, `${repo.name} marked repo signal glyph is not visible`);
    assert(repo.worldTrendMarker.dominantSignalColor, `${repo.name} marked repo signal color missing`);
    assert(repo.worldTrendMarker.dominantSignalVisualFamily, `${repo.name} marked repo signal family missing`);
    assert(
      repo.worldTrendMarker.dominantSignalGlyph === expectedDominantSignalGlyph(repo.dominantSignal),
      `${repo.name} marked repo signal glyph mismatch`
    );
  }

  for (const repo of payload.repos.slice(0, 40)) {
    assert(repo.trend, `${repo.name} missing repo trend payload`);
    assert(repo.recentActivity?.windowDays === payload.scene.timeWindowDays, `${repo.name} recent activity window mismatch`);
    assert(Number.isFinite(repo.trend.score), `${repo.name} missing trend score`);
  }
}

function assertOptimizationStats(payload, expectedTopics) {
  const optimization = payload.performance.optimization;
  assert(optimization, "missing performance optimization payload");
  const fullSettlementCount = payload.repos.filter((repo) => repo.settlementRenderedFull).length;
  const groundMarks = optimization.buildingGroundMarks;
  assert(groundMarks, "missing building ground mark optimization stats");
  assert(groundMarks.enabled === true, "building ground mark instancing is not enabled");
  assert(groundMarks.sourceMeshCount >= 90, "expected many former full-settlement ground meshes");
  assert(groundMarks.instancedMeshCount === 1, "full settlement shadows should render as one instanced mesh");
  assert(groundMarks.renderMeshCount === 2, "full settlement contact courts and shadows should render as two meshes");
  assert(groundMarks.savedDrawCalls >= 90, "ground mark optimization saved too few draw calls");
  assert(groundMarks.dirtPatchInstances === 0, "generic dirt patches should be replaced by species contact courts");
  assert(groundMarks.contactCourtMeshCount === 1, "full settlement contact courts should render as one categorized mesh");
  assert(groundMarks.contactShadowMeshCount === 1, "full settlement contact shadows should render as one instanced mesh");
  assert(groundMarks.contactCourtInstances === fullSettlementCount, "expected one contact court per full settlement");
  assert(groundMarks.contactShadowInstances === fullSettlementCount, "expected one contact shadow per full settlement");
  assert(groundMarks.sourceMeshCount === fullSettlementCount * 2, "ground mark source draw-call accounting mismatch");
  assert(groundMarks.savedDrawCalls === groundMarks.sourceMeshCount - groundMarks.renderMeshCount, "ground mark saved draw-call accounting mismatch");
  assert(groundMarks.triangleBudget > 0, "missing ground mark triangle budget");
  assert(groundMarks.triangleBudget <= 12000, "ground mark triangle budget regressed");
  assert(groundMarks.triangleBudget === groundMarks.contactCourtTriangleBudget + groundMarks.contactShadowTriangleBudget, "ground mark triangle sub-budget mismatch");
  assert(groundMarks.contactCourtTriangleBudget > 0, "missing contact court triangle budget");
  assert(groundMarks.contactShadowTriangleBudget > 0, "missing contact shadow triangle budget");
  assert(groundMarks.renderCategory === "settlementGroundMarks", "ground mark render category mismatch");
  assert(groundMarks.contactCourtRenderCategory === "fullSettlementContactCourts", "contact court render category mismatch");
  assert(groundMarks.semanticLayer === "topic-identity", "contact courts should be topic identity");
  assert(groundMarks.permanentIdentityLayer === true, "contact courts should be permanent identity");
  assert(groundMarks.labelIndependent === true, "contact courts should not depend on labels");
  assert(groundMarks.trendCoupled === false, "contact courts should not be trend-coupled");
  assert(groundMarks.windowDaysIndependent === true, "contact courts should be stable across time windows");
  assert(groundMarks.usesTrendInputs === false, "contact courts should not use trend inputs");
  assert(groundMarks.doesNotAddRoads === true, "contact courts should not add road clutter");
  assert(groundMarks.sourceFields?.includes("settlementClanId"), "contact court source fields should include clan identity");
  assert(groundMarks.excludedTrendFields?.includes("trendScore"), "contact courts should explicitly exclude trend inputs");
  assert(groundMarks.stylePreserving === true, "ground mark optimization should preserve building species style");
  assert(groundMarks.crossTopicInstanceMerges === 0, "ground mark optimization merged topic-specific building geometry");
  assert(groundMarks.signatureLosses === 0, "contact courts lost species signatures");
  assert(new Set(groundMarks.topicCoverage).size === expectedTopics.length, "contact court topic coverage incomplete");
  assert(groundMarks.uniqueSpeciesArchitectureKeys === expectedTopics.length, "contact court species coverage incomplete");
  assert(groundMarks.uniqueGroundContactFamilies === expectedTopics.length, "contact court families are not unique");
  assert(groundMarks.uniqueContactCourtFamilies === expectedTopics.length, "contact court family count mismatch");
  assert(Object.keys(groundMarks.coverageByTopic ?? {}).length === expectedTopics.length, "contact court topic coverage map incomplete");
  assert(Object.keys(groundMarks.coverageByTopicTier ?? {}).length === expectedTopics.length * FULL_SETTLEMENT_TIER_KEYS.length, "contact court topic/tier coverage incomplete");
  for (const tierKey of FULL_SETTLEMENT_TIER_KEYS) {
    assert(groundMarks.visualTierKeysCovered.includes(tierKey), `contact courts missing ${tierKey}`);
  }
  for (const topic of expectedTopics) {
    const record = groundMarks.coverageByTopic[topic];
    assert(record, `${topic} missing contact court coverage`);
    assert(record.count === FULL_SETTLEMENT_TIER_KEYS.length, `${topic} should have eight contact courts`);
    assert(record.castles === 4, `${topic} should have four castle contact courts`);
    assert(record.houses === 4, `${topic} should have four house contact courts`);
    assert(record.visualTierKeys?.length === FULL_SETTLEMENT_TIER_KEYS.length, `${topic} contact court tier coverage incomplete`);
    assert(record.speciesArchitectureKey === payload.scene.visualTierMatrix[topic].speciesArchitecture.key, `${topic} contact court species mismatch`);
    assert(record.groundContactFamily, `${topic} contact court family missing`);
    for (const tierKey of FULL_SETTLEMENT_TIER_KEYS) {
      const cell = groundMarks.coverageByTopicTier[`${topic}:${tierKey}`];
      const repo = payload.repos.find((item) => item.id === cell?.repoId);
      assert(cell, `${topic}/${tierKey} missing contact court cell`);
      assert(cell.count === 1, `${topic}/${tierKey} contact court count mismatch`);
      assert(repo?.settlementRenderedFull === true, `${topic}/${tierKey} contact court repo is not full settlement`);
      assert(repo.topic === topic && repo.visualTierKey === tierKey, `${topic}/${tierKey} contact court repo mismatch`);
      assert(repo.fullSettlementContactCourtVisible === true, `${topic}/${tierKey} contact court is not visible`);
      assert(repo.fullSettlementContactCourtFamily === cell.groundContactFamily, `${topic}/${tierKey} contact court family mismatch`);
      assert(repo.speciesSignature?.groundContactFamily === cell.groundContactFamily, `${topic}/${tierKey} contact court family missing from species signature`);
    }
  }
  assert(optimization.globalBucketsAttempted === false, "unsafe global building merge should not be attempted");
  assert(optimization.stylePreserving === true, "optimization style-preserving flag missing");
  assert(payload.performance.drawCallBreakdown?.fullSettlementContactCourts === groundMarks.contactCourtMeshCount, "contact court draw-call accounting mismatch");
  assert(payload.performance.breakdown?.fullSettlementContactCourts === groundMarks.contactCourtTriangleBudget, "contact court triangle accounting mismatch");
  assert(payload.performance.drawCallBreakdown?.settlementGroundMarks === groundMarks.contactShadowMeshCount, "settlement ground shadow draw-call accounting mismatch");
  assert(payload.performance.breakdown?.settlementGroundMarks === groundMarks.contactShadowTriangleBudget, "ground shadow triangle accounting mismatch");
  const contactCourtIdentity = payload.scene.fullSettlementContactCourtIdentity;
  assert(contactCourtIdentity, "missing full-settlement contact court identity payload");
  assert(contactCourtIdentity.contactCourtInstances === groundMarks.contactCourtInstances, "scene contact court instance count diverged");
  assert(contactCourtIdentity.contactCourtRenderCategory === groundMarks.contactCourtRenderCategory, "scene contact court render category diverged");
  assert(contactCourtIdentity.trendCoupled === false && contactCourtIdentity.usesTrendInputs === false, "scene contact court identity should not be trend-coupled");
  assert(JSON.stringify(contactCourtIdentity.topicCoverage) === JSON.stringify(groundMarks.topicCoverage), "scene contact court topic coverage diverged");
  assert(JSON.stringify(contactCourtIdentity.coverageByTopicTier) === JSON.stringify(groundMarks.coverageByTopicTier), "scene contact court tier coverage diverged");
  const roadBatching = optimization.roadRibbonBatching;
  assert(roadBatching, "missing road ribbon batching stats");
  assert(roadBatching.enabled === true, "road ribbon batching is not enabled");
  assert(roadBatching.renderCategory === "roads", "road ribbon batching render category mismatch");
  assert(roadBatching.semanticRoadCountPreserved === true, "road ribbon batching changed semantic road count");
  assert(roadBatching.totalLogicalRoadCount === payload.scene.roadNetwork.total, "road batching logical count mismatch");
  assert(payload.scene.roadCount === payload.scene.roadNetwork.total, "scene road count should preserve logical roads");
  assert(
    payload.scene.roadNetwork.cityRoadCount === payload.scene.roadNetwork.plazaLoops + payload.scene.roadNetwork.radialLanes + payload.scene.roadNetwork.crossLanes,
    "city road component counts do not sum"
  );
  assert(roadBatching.majorRoadLogicalCount === payload.scene.roadNetwork.interDistrictRoads + payload.scene.roadNetwork.landmarkSpurs, "major road logical count mismatch");
  assert(roadBatching.cityRoadLogicalCount === payload.scene.roadNetwork.cityRoadCount, "city road logical count mismatch");
  assert(roadBatching.majorRoadSourceDrawCalls === roadBatching.majorRoadLogicalCount * 2, "major road source draw-call accounting mismatch");
  assert(roadBatching.majorRoadSavedDrawCalls === roadBatching.majorRoadSourceDrawCalls - roadBatching.majorRoadMergedDrawCalls, "major road saved draw-call accounting mismatch");
  assert(roadBatching.cityRoadSourceDrawCalls === roadBatching.cityRoadLogicalCount * 2, "city road source draw-call accounting mismatch");
  assert(roadBatching.cityRoadSavedDrawCalls === roadBatching.cityRoadSourceDrawCalls - roadBatching.cityRoadMergedDrawCalls, "city road saved draw-call accounting mismatch");
  assert(roadBatching.majorRoadMergedMeshCount === 2, "major roads should render as two merged meshes");
  assert(roadBatching.cityRoadMergedMeshCount === 2, "city roads should render as two merged meshes");
  assert(roadBatching.sourceDrawCalls === payload.scene.roadNetwork.total * 2, "road source draw-call accounting mismatch");
  assert(roadBatching.mergedDrawCalls === roadBatching.majorRoadMergedDrawCalls + roadBatching.cityRoadMergedDrawCalls, "road merged draw-call accounting mismatch");
  assert(roadBatching.savedDrawCalls === roadBatching.sourceDrawCalls - roadBatching.mergedDrawCalls, "road saved draw-call accounting mismatch");
  assert(roadBatching.mergedDrawCalls <= 4, "road merged draw-call budget regressed");
  assert(roadBatching.savedDrawCalls >= 200, "road batching saved too few draw calls");
  assert(roadBatching.vertexColorPreserved === true, "road batching lost topic-tinted vertex colors");
  assert(roadBatching.roadGeometryChanged === false, "road batching should not change road geometry");
  assert(roadBatching.crossTopicRoadMerges === 0, "road batching merged road semantics across topics");
  assert(roadBatching.triangleBudget > 0, "missing road batching triangle budget");
  assert(payload.performance.drawCallBreakdown?.roads <= 6, "road draw calls regressed after batching");
  const fullSettlementHitProxies = optimization.fullSettlementHitProxies;
  assert(fullSettlementHitProxies, "missing full-settlement hit proxy optimization stats");
  assert(fullSettlementHitProxies.enabled === true, "full-settlement hit proxy optimization is not enabled");
  assert(fullSettlementHitProxies.count === fullSettlementCount, "full-settlement hit proxy count mismatch");
  assert(fullSettlementHitProxies.visibleCount === 0, "full-settlement hit proxies are still rendered");
  assert(fullSettlementHitProxies.raycastableCount === fullSettlementCount, "full-settlement hit proxies are not raycastable");
  assert(fullSettlementHitProxies.savedDrawCalls === fullSettlementCount, "full-settlement hit proxy draw-call savings mismatch");
  assert(fullSettlementHitProxies.stylePreserving === true, "full-settlement hit proxy optimization should preserve species style");
  assert(fullSettlementHitProxies.crossTopicInstanceMerges === 0, "full-settlement hit proxy optimization merged topic geometry");
  const decorBatches = optimization.fullSettlementDecorBatches;
  assert(decorBatches, "missing full-settlement decor batching stats");
  assert(decorBatches.enabled === true, "full-settlement decor batching is not enabled");
  assert(decorBatches.renderCategory === "fullSettlementDecorBatches", "full-settlement decor render category mismatch");
  assert(decorBatches.semanticLayer === "topic-identity", "full-settlement decor should stay on the topic identity layer");
  assert(decorBatches.batchScope === "topic+type+species+material+shadowFlags", "full-settlement decor batch scope changed");
  assert(decorBatches.globalBucketsAttempted === false, "full-settlement decor batching should not use global buckets");
  assert(decorBatches.stylePreserving === true, "full-settlement decor batching should preserve species style");
  assert(decorBatches.vertexTransformsBaked === true, "full-settlement decor transforms were not baked");
  assert(decorBatches.stageSilhouettesPreserved === true, "full-settlement decor batching should preserve tier silhouettes");
  assert(decorBatches.fullSettlementCount === fullSettlementCount, "full-settlement decor count mismatch");
  assert(decorBatches.preservedHitProxyCount === fullSettlementHitProxies.count, "decor batching changed hidden hit proxy coverage");
  assert(decorBatches.crossTopicInstanceMerges === 0, "decor batching merged across topics");
  assert(decorBatches.crossTypeInstanceMerges === 0, "decor batching merged across castle/house types");
  assert(decorBatches.crossSpeciesInstanceMerges === 0, "decor batching merged across species signatures");
  assert(decorBatches.signatureLosses === 0, "decor batching lost species signatures");
  assert(decorBatches.missingSpeciesSignatureRepos === 0, "decor batching found full settlements without species signatures");
  assert(decorBatches.bucketSignatureFields.join("|") === FULL_SETTLEMENT_DECOR_BUCKET_FIELDS.join("|"), "decor batch identity fields changed");
  assert(decorBatches.sourceDrawCalls === decorBatches.sourceMeshCount, "decor source draw-call accounting mismatch");
  assert(decorBatches.batchedDrawCalls === decorBatches.batchedMeshCount, "decor batched draw-call accounting mismatch");
  assert(decorBatches.savedDrawCalls === decorBatches.sourceDrawCalls - decorBatches.batchedDrawCalls, "decor saved draw-call accounting mismatch");
  assert(decorBatches.candidateMeshCount === decorBatches.sourceMeshCount + decorBatches.excludedUnbatchedMeshCount, "decor candidate accounting mismatch");
  assert(decorBatches.bucketCount === decorBatches.batchedBucketCount + decorBatches.unbatchedBucketCount, "decor bucket accounting mismatch");
  assert(decorBatches.sourceMeshCount >= fullSettlementCount * 8, "too few full-settlement decor meshes were considered");
  assert(decorBatches.batchedMeshCount <= fullSettlementCount * 4, "full-settlement decor batching uses too many draw calls");
  assert(decorBatches.savedDrawCalls >= fullSettlementCount * 5, "full-settlement decor batching saved too few draw calls");
  assert(decorBatches.triangleBudget > 0, "missing full-settlement decor triangle budget");
  assert(decorBatches.batches.length === decorBatches.batchedMeshCount, "decor batch summaries are incomplete");
  assert(payload.performance.drawCallBreakdown?.fullSettlementDecorBatches === decorBatches.batchedDrawCalls, "decor draw-call breakdown mismatch");
  assert(payload.performance.breakdown?.fullSettlementDecorBatches === decorBatches.triangleBudget, "decor triangle accounting mismatch");
  assert((payload.performance.drawCallBreakdown.fullSettlements ?? 0) <= 420, "full-settlement draw calls regressed after decor batching");
  assert(payload.performance.drawCalls <= 2600, "draw call count regressed after decor batching");
  assert(new Set(decorBatches.topicCoverage).size === expectedTopics.length, "decor batching topic coverage is incomplete");
  for (const topic of expectedTopics) {
    assert(decorBatches.topicCoverage.includes(topic), `decor batching missing ${topic}`);
    assert(decorBatches.drawCallsByTopic[topic] >= 1, `${topic} decor batching draw-call evidence missing`);
  }
  for (const tierKey of FULL_SETTLEMENT_TIER_KEYS) {
    assert(decorBatches.visualTierKeysCovered.includes(tierKey), `decor batching missing ${tierKey}`);
  }
  assert(new Set(decorBatches.speciesArchitectureKeys).size === expectedTopics.length, "decor batching species coverage is incomplete");
  for (const batch of decorBatches.batches) {
    assert(batch.renderCategory === "fullSettlementDecorBatches", "decor batch render category mismatch");
    assert(batch.sourceMeshCount >= 2, "decor batch should merge at least two meshes");
    assert(batch.triangleBudget > 0, "decor batch triangle budget missing");
    assert(batch.topicCoverage?.length === 1, "decor batch merged multiple topics");
    assert(batch.visualTierKeys?.length >= 1, "decor batch missing visual tier evidence");
    assert(batch.settlementTypes?.length === 1 && batch.settlementTypeCount === 1, "decor batch merged castle and house types");
    assert(batch.settlementClanIds?.length === 1 && batch.settlementClanIdCount === 1, "decor batch merged clans");
    assert(batch.speciesArchitectureKeys?.length === 1 && batch.speciesArchitectureKeyCount === 1, "decor batch merged species architecture");
    assert(batch.settlementPickIds?.length >= 1, "decor batch missing pick ids");
    assert(batch.settlementSourceIds?.length >= 1, "decor batch missing source ids");
  }
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
        clanName: topic.speciesArchitecture?.clanName,
        architectureKey: topic.speciesArchitecture?.key,
        glyph: topic.speciesArchitecture?.glyph,
        fullSettlementGlyphFamily: topic.speciesArchitecture?.fullSettlementGlyphFamily,
        fullSettlementContactCourtFamily: topic.speciesArchitecture?.fullSettlementContactCourtFamily,
        ornamentKinds: topic.speciesArchitecture?.ornamentKinds,
        villageKitCastles: topic.villageKit?.castles,
        villageKitHouses: topic.villageKit?.houses,
        actualTierPickIds: topic.villageKit?.actualTierPickIds,
        outpostGeometrySignature: topic.speciesArchitecture?.outpostGeometrySignature,
        groundPattern: topic.groundIdentity?.patternFamily,
        edgeBand: topic.groundIdentity?.edgeBandFamily,
        entrance: topic.groundIdentity?.entranceFamily
      }))
      .sort((a, b) => a.topic.localeCompare(b.topic))
  );
}

function fullSettlementDecorIdentitySignature(payload) {
  return JSON.stringify(
    payload.repos
      .filter((repo) => repo.settlementRenderedFull)
      .map((repo) => ({
        id: repo.id,
        topic: repo.topic,
        visualTierKey: repo.visualTierKey,
        settlementType: repo.settlementType,
        settlementStage: repo.settlementStage,
        settlementClanId: repo.settlementClanId,
        settlementPickId: repo.settlementPickId,
        settlementSourceId: repo.settlementSourceId,
        settlementVisualSignature: repo.settlementVisualSignature,
        fullSettlementGlyphFamily: repo.fullSettlementGlyphFamily,
        fullSettlementContactCourtFamily: repo.fullSettlementContactCourtFamily,
        fullSettlementContactCourtSignature: repo.fullSettlementContactCourtSignature,
        speciesArchitectureKey: repo.speciesArchitectureKey,
        ornamentKinds: [...(repo.speciesOrnamentKinds ?? [])].sort()
      }))
      .sort((a, b) => `${a.topic}:${a.visualTierKey}:${a.id}`.localeCompare(`${b.topic}:${b.visualTierKey}:${b.id}`))
  );
}

function fullSettlementContactCourtIdentitySignature(payload) {
  const identity = payload.scene.fullSettlementContactCourtIdentity;
  return JSON.stringify({
    renderCategory: identity?.contactCourtRenderCategory,
    semanticLayer: identity?.semanticLayer,
    trendCoupled: identity?.trendCoupled,
    windowDaysIndependent: identity?.windowDaysIndependent,
    topicCoverage: identity?.topicCoverage,
    visualTierKeysCovered: identity?.visualTierKeysCovered,
    contactCourtFamilies: identity?.contactCourtFamilies,
    coverageByTopicTier: identity?.coverageByTopicTier,
    repos: payload.repos
      .filter((repo) => repo.settlementRenderedFull)
      .map((repo) => ({
        id: repo.id,
        topic: repo.topic,
        visualTierKey: repo.visualTierKey,
        family: repo.fullSettlementContactCourtFamily,
        signature: repo.fullSettlementContactCourtSignature,
        renderCategory: repo.fullSettlementContactCourtRenderCategory
      }))
      .sort((a, b) => `${a.topic}:${a.visualTierKey}:${a.id}`.localeCompare(`${b.topic}:${b.visualTierKey}:${b.id}`))
  });
}

function topicTierVisualSignature(payload) {
  return JSON.stringify(
    Object.entries(payload.scene.visualTierMatrix ?? {})
      .flatMap(([topic, matrix]) =>
        Object.entries(matrix.tiers ?? {}).map(([tierKey, cell]) => ({
          topic,
          tierKey,
          settlementType: cell.settlementType,
          settlementStage: cell.settlementStage,
          pickId: cell.pickId,
          sourceId: cell.sourceId,
          form: cell.form,
          surface: cell.surface,
          palette: cell.palette,
          designer: cell.designer,
          glyphFamily: cell.glyphFamily,
          contactCourtFamily: cell.contactCourtFamily,
          contactCourtSignature: cell.contactCourtSignature,
          contactCourtRenderCategory: cell.contactCourtRenderCategory,
          visualSignature: cell.visualSignature,
          visualBounds: cell.visualBounds
        }))
      )
      .sort((a, b) => `${a.topic}:${a.tierKey}`.localeCompare(`${b.topic}:${b.tierKey}`))
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
assertFullSettlementGlyphIdentity(initial, expectedTopics);
assertTopicTierVisualMatrix(initial, expectedTopics);
assertScenicFeatures(initial);
assertDistantLandmarks(initial, expectedTopics);
assertTrendDigest(initial, expectedTopics);
assertOptimizationStats(initial, expectedTopics);
const initialLandmarkSignature = landmarkSignature(initial);
const initialPermanentIdentitySignature = permanentIdentitySignature(initial);
const initialFullSettlementDecorIdentitySignature = fullSettlementDecorIdentitySignature(initial);
const initialFullSettlementContactCourtIdentitySignature = fullSettlementContactCourtIdentitySignature(initial);
const initialTopicTierVisualSignature = topicTierVisualSignature(initial);
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
    repo.settlementRenderedFull &&
    repo.settlementType === "castle" &&
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
assert(selectedRepoPayload?.id === castle.id, "hidden full-settlement hit proxy selected the wrong repo");
assert(selectedRepoPayload?.settlementRenderedFull === true, "full-settlement hit proxy is no longer selectable");
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
assertFullSettlementGlyphIdentity(thirtyDay, expectedTopics);
assertTopicTierVisualMatrix(thirtyDay, expectedTopics);
assertScenicFeatures(thirtyDay);
assertDistantLandmarks(thirtyDay, expectedTopics);
assertTrendDigest(thirtyDay, expectedTopics);
assertOptimizationStats(thirtyDay, expectedTopics);
assert(landmarkSignature(thirtyDay) === initialLandmarkSignature, "30-day switch changed civilization landmarks");
assert(permanentIdentitySignature(thirtyDay) === initialPermanentIdentitySignature, "30-day switch changed permanent topic identity");
assert(fullSettlementDecorIdentitySignature(thirtyDay) === initialFullSettlementDecorIdentitySignature, "30-day switch changed full-settlement decor identity");
assert(fullSettlementContactCourtIdentitySignature(thirtyDay) === initialFullSettlementContactCourtIdentitySignature, "30-day switch changed full-settlement contact court identity");
assert(topicTierVisualSignature(thirtyDay) === initialTopicTierVisualSignature, "30-day switch changed topic tier visual identity");
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
assertFullSettlementGlyphIdentity(sevenDay, expectedTopics);
assertTopicTierVisualMatrix(sevenDay, expectedTopics);
assertScenicFeatures(sevenDay);
assertDistantLandmarks(sevenDay, expectedTopics);
assertTrendDigest(sevenDay, expectedTopics);
assertOptimizationStats(sevenDay, expectedTopics);
assert(landmarkSignature(sevenDay) === initialLandmarkSignature, "7-day switch changed civilization landmarks");
assert(permanentIdentitySignature(sevenDay) === initialPermanentIdentitySignature, "7-day switch changed permanent topic identity");
assert(fullSettlementDecorIdentitySignature(sevenDay) === initialFullSettlementDecorIdentitySignature, "7-day switch changed full-settlement decor identity");
assert(fullSettlementContactCourtIdentitySignature(sevenDay) === initialFullSettlementContactCourtIdentitySignature, "7-day switch changed full-settlement contact court identity");
assert(topicTierVisualSignature(sevenDay) === initialTopicTierVisualSignature, "7-day switch changed topic tier visual identity");
assert(backgroundVistaSignature(sevenDay) === initialBackgroundVistaSignature, "7-day switch changed background vista");
assert(sevenDay.performance.drawCalls <= initial.performance.drawCalls * 1.15, "7-day draw calls regressed");
assert(sevenDay.performance.triangles <= initial.performance.triangles * 1.15, "7-day triangle count regressed");

const canvasDataLength = await page.evaluate(() => document.querySelector("#world").toDataURL("image/png").length);
assert(canvasDataLength > 10000, "canvas export looks blank");
assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join("\n")}`);

await page.screenshot({ path: "test-results/gitland-smoke.png", fullPage: true });
await browser.close();

console.log("GitLand smoke test passed");

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildWorldData } from "./data.js";

const MAP_LIMIT = 380;
const MIN_DISTANCE = 45;
const MAX_DISTANCE = 540;
const CLOCK_STEP = 1 / 60;
const TERRAIN_SIZE = 920;
const TERRAIN_SEGMENTS = 112;
const ROAD_NETWORK_LIMITS = {
  landmarkSpursPerCluster: 7,
  localSectorCount: 8,
  localReposPerSector: 4,
  maxCrossLanesPerCluster: 6
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function pseudoNoise(x, z) {
  return (
    Math.sin(x * 0.047 + z * 0.031) * 0.55 +
    Math.sin(x * 0.091 - z * 0.063 + 2.1) * 0.32 +
    Math.sin((x + z) * 0.017 - 1.4) * 0.42
  );
}

function terrainHeight(x, z) {
  const centerFlatten = 1 - smoothstep(40, 188, Math.hypot(x * 0.8, z * 0.8));
  const edgeRise = smoothstep(270, 380, Math.hypot(x, z));
  return pseudoNoise(x, z) * 1.05 * (1 - centerFlatten * 0.78) + edgeRise * 1.45;
}

function pathPoint(x, z, y = 0.05) {
  return new THREE.Vector3(x, y, z);
}

function clusterPlazaRadius(cluster) {
  return 9 + Math.sqrt(cluster.repoCount) * 2.4 + cluster.averageHotness * 4.5;
}

function lanePoint(cluster, angle, radius, y = 0.05) {
  return pathPoint(
    cluster.centroid.x + Math.cos(angle) * radius,
    cluster.centroid.z + Math.sin(angle) * radius,
    y
  );
}

function bendBetween(from, to, t, offset, y = 0.05) {
  const x = lerp(from.x, to.x, t);
  const z = lerp(from.z, to.z, t);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.max(0.001, Math.hypot(dx, dz));
  return pathPoint(x + (-dz / length) * offset, z + (dx / length) * offset, y);
}

function tint(hex, amount) {
  const color = new THREE.Color(hex);
  if (amount >= 0) return color.lerp(new THREE.Color("#ffffff"), amount).getStyle();
  return color.lerp(new THREE.Color("#000000"), -amount).getStyle();
}

function localRoadColor(style, mix = 0.1) {
  return new THREE.Color("#d6bf93").lerp(new THREE.Color(style.roadTint), mix).getStyle();
}

function localRoadEdgeColor(style, mix = 0.1) {
  return new THREE.Color("#9b7650").lerp(new THREE.Color(style.edgeTint), mix).getStyle();
}

const TOPIC_STYLES = {
  ai: {
    groundWash: "#3f78b7",
    plazaTint: "#b8c7d8",
    wallTint: "#c6d3df",
    roofTint: "#354365",
    trimTint: "#233450",
    boundaryTint: "#1e5f9d",
    accentTint: "#4fb7d8",
    landmark: "obelisk",
    groundOpacity: 0.54,
    roadTint: "#dbe8f1",
    edgeTint: "#7fa0b4",
    lotTint: "#5f8db8",
    fieldTint: "#789fbd",
    hedgeA: "#4f6f6d",
    hedgeB: "#6f8973",
    crateTint: "#6f8798",
    widthScale: 0.92,
    depthScale: 0.96,
    heightScale: 1.08,
    roofPitch: 1.24,
    towerHeightScale: 1.18,
    towerRadiusScale: 0.88,
    timberFrame: false
  },
  frontend: {
    groundWash: "#76a93f",
    plazaTint: "#d2bd7f",
    wallTint: "#dfc08b",
    roofTint: "#8e2f27",
    trimTint: "#4f3b20",
    boundaryTint: "#2f7f42",
    accentTint: "#d6a13b",
    landmark: "arcade",
    groundOpacity: 0.53,
    roadTint: "#ead8b6",
    edgeTint: "#9e7442",
    lotTint: "#8faa42",
    fieldTint: "#a4bd45",
    hedgeA: "#516d3d",
    hedgeB: "#74894d",
    crateTint: "#a46d38",
    widthScale: 1.08,
    depthScale: 0.98,
    heightScale: 0.98,
    roofPitch: 0.96,
    towerHeightScale: 0.98,
    towerRadiusScale: 1.02,
    timberFrame: true
  },
  infra: {
    groundWash: "#77796e",
    plazaTint: "#aaa18d",
    wallTint: "#a59d91",
    roofTint: "#3f3a32",
    trimTint: "#252724",
    boundaryTint: "#515b66",
    accentTint: "#7f8c95",
    landmark: "watchtower",
    groundOpacity: 0.54,
    roadTint: "#cfc7b8",
    edgeTint: "#76695b",
    lotTint: "#77715e",
    fieldTint: "#8a8254",
    hedgeA: "#475842",
    hedgeB: "#5e684f",
    crateTint: "#696158",
    widthScale: 1.12,
    depthScale: 1.12,
    heightScale: 0.92,
    roofPitch: 0.78,
    towerHeightScale: 0.9,
    towerRadiusScale: 1.18,
    timberFrame: false
  },
  database: {
    groundWash: "#8650a6",
    plazaTint: "#c0a0ca",
    wallTint: "#d2b7d7",
    roofTint: "#4b254a",
    trimTint: "#2f2237",
    boundaryTint: "#6b378e",
    accentTint: "#b96ad1",
    landmark: "archive",
    groundOpacity: 0.54,
    roadTint: "#e5d8e8",
    edgeTint: "#8b6b92",
    lotTint: "#965fa8",
    fieldTint: "#9f80b2",
    hedgeA: "#4f6546",
    hedgeB: "#697753",
    crateTint: "#84608f",
    widthScale: 0.92,
    depthScale: 0.98,
    heightScale: 1.12,
    roofPitch: 1.14,
    towerHeightScale: 1.1,
    towerRadiusScale: 0.94,
    timberFrame: false
  },
  mobile: {
    groundWash: "#3fa69a",
    plazaTint: "#d1bf82",
    wallTint: "#d9c594",
    roofTint: "#6f5a2f",
    trimTint: "#245c58",
    boundaryTint: "#16848e",
    accentTint: "#24c6bd",
    landmark: "mast",
    groundOpacity: 0.54,
    roadTint: "#d9eadf",
    edgeTint: "#6e958b",
    lotTint: "#55aaa3",
    fieldTint: "#6cae78",
    hedgeA: "#457965",
    hedgeB: "#699279",
    crateTint: "#4c918b",
    widthScale: 1.02,
    depthScale: 1.16,
    heightScale: 0.94,
    roofPitch: 0.84,
    towerHeightScale: 0.95,
    towerRadiusScale: 1.04,
    timberFrame: true
  },
  game: {
    groundWash: "#c67a2e",
    plazaTint: "#dcae55",
    wallTint: "#ddb064",
    roofTint: "#8f2f22",
    trimTint: "#4d261c",
    boundaryTint: "#a84724",
    accentTint: "#d6422d",
    landmark: "arena",
    groundOpacity: 0.54,
    roadTint: "#efd39d",
    edgeTint: "#a46331",
    lotTint: "#b7662c",
    fieldTint: "#c48d38",
    hedgeA: "#66723e",
    hedgeB: "#858f4c",
    crateTint: "#a95b2e",
    widthScale: 1.06,
    depthScale: 1.04,
    heightScale: 1,
    roofPitch: 1.08,
    towerHeightScale: 1.05,
    towerRadiusScale: 1.05,
    timberFrame: true
  }
};

function getTopicStyle(topicId) {
  return TOPIC_STYLES[topicId] ?? TOPIC_STYLES.frontend;
}

const TOPIC_ABBREVIATIONS = {
  ai: "AI",
  frontend: "FE",
  infra: "INF",
  database: "DB",
  mobile: "MOB",
  game: "GAME"
};

function topicAbbreviation(topicId) {
  return TOPIC_ABBREVIATIONS[topicId] ?? topicId.slice(0, 3).toUpperCase();
}

function percentile(values, amount) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * amount))];
}

function getDistrictTerritory(cluster, repos, clusters = []) {
  const distances = repos.map((repo) => Math.hypot(repo.position.x - cluster.centroid.x, repo.position.z - cluster.centroid.z));
  const nearest = Math.min(
    ...clusters
      .filter((item) => item.id !== cluster.id)
      .map((item) => Math.hypot(item.centroid.x - cluster.centroid.x, item.centroid.z - cluster.centroid.z)),
    260
  );
  const coreRadius = percentile(distances, 0.86);
  const radius = clamp(coreRadius + 20 + cluster.averageHotness * 8, clusterPlazaRadius(cluster) + 28, Math.min(168, nearest * 0.57));
  return {
    radius,
    radiusX: radius * 1.13,
    radiusZ: radius * 0.9
  };
}

function makeDistrictPatternTexture(topicId, style) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 256);
  const accent = new THREE.Color(style.boundaryTint).lerp(new THREE.Color(style.accentTint), 0.35).getStyle();
  const light = new THREE.Color(style.plazaTint).lerp(new THREE.Color("#ffffff"), 0.15).getStyle();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (topicId === "ai") {
    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = 4;
    for (let y = 40; y < 240; y += 72) {
      for (let x = 38; x < 240; x += 72) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 9, y);
        ctx.lineTo(x + 48, y + 26);
        ctx.stroke();
      }
    }
  } else if (topicId === "frontend") {
    ctx.strokeStyle = light;
    ctx.globalAlpha = 0.38;
    ctx.lineWidth = 10;
    for (let x = -80; x < 300; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 258);
      ctx.lineTo(x + 168, -8);
      ctx.stroke();
    }
  } else if (topicId === "infra") {
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.36;
    ctx.lineWidth = 6;
    for (let y = 34; y < 240; y += 44) {
      for (let x = 20; x < 236; x += 68) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 22, y + 18);
        ctx.lineTo(x + 44, y);
        ctx.stroke();
      }
    }
  } else if (topicId === "database") {
    ctx.strokeStyle = light;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 5;
    for (const radius of [26, 54, 82, 110]) {
      ctx.beginPath();
      ctx.arc(128, 128, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (topicId === "mobile") {
    ctx.strokeStyle = light;
    ctx.globalAlpha = 0.38;
    ctx.lineWidth = 6;
    for (let y = 42; y < 236; y += 46) {
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 16) {
        const yy = y + Math.sin(x * 0.055) * 9;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.26;
    for (let y = 28; y < 256; y += 48) {
      for (let x = 28; x < 256; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, y - 14);
        ctx.lineTo(x + 14, y);
        ctx.lineTo(x, y + 14);
        ctx.lineTo(x - 14, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  return texture;
}

const WATER_LAKES = [
  { id: "mirror-lake", label: "Mirror Lake", x: -28, z: 38, rx: 44, rz: 27, rotation: -0.18, seed: 6201 },
  { id: "archive-mere", label: "Archive Mere", x: 116, z: 42, rx: 32, rz: 21, rotation: 0.32, seed: 6202 },
  { id: "ai-tarn", label: "AI Tarn", x: -172, z: -28, rx: 34, rz: 22, rotation: -0.44, seed: 6203 },
  { id: "mobile-lagoon", label: "Mobile Lagoon", x: 76, z: 172, rx: 56, rz: 33, rotation: 0.22, seed: 6204 },
  { id: "game-pond", label: "Game Pond", x: -168, z: 122, rx: 28, rz: 17, rotation: 0.58, seed: 6205 }
];

const WATER_COURSES = [
  {
    id: "north-brook",
    type: "river",
    width: 3.2,
    points: [
      [-318, -82],
      [-236, -62],
      [-168, -22],
      [-82, 12],
      [-28, 38],
      [42, 22],
      [118, 44],
      [205, 78],
      [318, 112]
    ]
  },
  {
    id: "southern-river",
    type: "river",
    width: 5.1,
    points: [
      [-318, 214],
      [-224, 188],
      [-128, 154],
      [-38, 134],
      [76, 172],
      [162, 190],
      [318, 206]
    ]
  },
  {
    id: "frontend-canal",
    type: "canal",
    width: 1.55,
    points: [
      [2, -222],
      [-10, -154],
      [-30, -76],
      [-28, 38]
    ]
  },
  {
    id: "database-canal",
    type: "canal",
    width: 1.45,
    points: [
      [204, 128],
      [172, 92],
      [118, 44]
    ]
  }
];

const WATER_BRIDGES = [
  { x: -188, z: -36, angle: 0.43, length: 13 },
  { x: -30, z: -58, angle: -0.12, length: 10 },
  { x: 73, z: 34, angle: 0.28, length: 14 },
  { x: 176, z: 96, angle: 0.66, length: 10 },
  { x: -116, z: 158, angle: 1.18, length: 15 },
  { x: 156, z: 190, angle: 1.42, length: 17 }
];

function makeIrregularDiscGeometry(radiusX = 1, radiusZ = 1, segments = 64, seed = 1, wobble = 0.14) {
  const random = seededRandom(seed);
  const vertices = [0, 0, 0];
  const uvs = [0.5, 0.5];
  const indices = [];
  const phaseA = random() * Math.PI * 2;
  const phaseB = random() * Math.PI * 2;

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const edge =
      1 +
      Math.sin(angle * 3 + phaseA) * wobble +
      Math.sin(angle * 5 + phaseB) * wobble * 0.45 +
      (random() - 0.5) * wobble * 0.22;
    vertices.push(Math.cos(angle) * radiusX * edge, 0, Math.sin(angle) * radiusZ * edge);
    uvs.push(0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);
    if (i < segments) indices.push(0, i + 1, i + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeTexture(size, draw, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  draw(ctx, size, seededRandom(options.seed ?? size));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = options.colorSpace ?? THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  return texture;
}

function makeSoftBoxGeometry(width, height, depth, radius = 0.025, segments = 2) {
  return new RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, 0.035, width * 0.055, height * 0.055, depth * 0.055));
}

function makeGabledRoofGeometry(width = 1, depth = 1, height = 1) {
  const hw = width / 2;
  const hd = depth / 2;
  const vertices = new Float32Array([
    -hw, 0, -hd,
    hw, 0, -hd,
    0, height, -hd,
    -hw, 0, hd,
    hw, 0, hd,
    0, height, hd
  ]);
  const uvs = new Float32Array([
    0, 0,
    1, 0,
    0.5, 1,
    0, 0,
    1, 0,
    0.5, 1
  ]);
  const indices = [
    0, 3, 5, 0, 5, 2,
    1, 2, 5, 1, 5, 4,
    0, 2, 1,
    3, 4, 5,
    0, 1, 4, 0, 4, 3
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeFacadeGeometry(width, height, uRepeat, vRepeat) {
  const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, uv.getX(i) * uRepeat, uv.getY(i) * vRepeat);
  }
  uv.needsUpdate = true;
  return geometry;
}

function makeRoofOverlayGeometry(width, depth, height, side) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const slopeLength = Math.hypot(halfWidth, height);
  const lift = 0.035;
  const vertices = new Float32Array([
    0, height + lift, -halfDepth,
    side * halfWidth, lift, -halfDepth,
    0, height + lift, halfDepth,
    side * halfWidth, lift, halfDepth
  ]);
  const uvs = new Float32Array([
    0, 0,
    slopeLength / 1.8, 0,
    0, depth / 1.5,
    slopeLength / 1.8, depth / 1.5
  ]);
  const indices = [0, 1, 2, 1, 3, 2];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addHeightVertexColors(geometry, lowHex, highHex) {
  const position = geometry.attributes.position;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < position.count; i += 1) {
    minY = Math.min(minY, position.getY(i));
    maxY = Math.max(maxY, position.getY(i));
  }
  const low = new THREE.Color(lowHex);
  const high = new THREE.Color(highHex);
  const colors = [];
  const span = Math.max(0.001, maxY - minY);
  for (let i = 0; i < position.count; i += 1) {
    const t = clamp((position.getY(i) - minY) / span, 0, 1);
    const color = low.clone().lerp(high, t);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function makeLobedCrownGeometry(variant = 0) {
  const offsets = [
    [0, 0.05, 0, 1.18, 0.84, 1.08],
    [0.62, -0.06, 0.1, 0.78, 0.62, 0.68],
    [-0.55, -0.02, -0.16, 0.72, 0.58, 0.8],
    [0.12, 0.34, -0.5, 0.7, 0.62, 0.66],
    [-0.08, 0.48, 0.42, 0.64, 0.56, 0.68]
  ];
  const geometries = offsets.map(([x, y, z, sx, sy, sz], index) => {
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    geometry.scale(sx * (1 + variant * 0.04), sy * (1 - index * 0.015), sz * (1 + ((variant + index) % 3) * 0.035));
    geometry.rotateY(variant * 0.41 + index * 0.63);
    geometry.translate(x, y, z);
    return geometry;
  });
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  merged.computeVertexNormals();
  return addHeightVertexColors(merged, "#5f7748", "#a4b76f");
}

function makeConiferCrownGeometry() {
  const tiers = [
    [0.35, 1.35, 1.3, 0.85],
    [0.22, 1.0, 1.08, 1.72],
    [0.08, 0.62, 0.82, 2.45]
  ];
  const geometries = tiers.map(([top, bottom, height, y], index) => {
    const geometry = new THREE.CylinderGeometry(top, bottom, height, 7, 1);
    geometry.rotateY(index * 0.21);
    geometry.translate(0, y, 0);
    return geometry;
  });
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  merged.computeVertexNormals();
  return addHeightVertexColors(merged, "#536d49", "#87995f");
}

function makeTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = [];
  const baseGrass = new THREE.Color("#9dbb77");
  const lightGrass = new THREE.Color("#cbd898");
  const dryGrass = new THREE.Color("#d6c489");
  const earth = new THREE.Color("#af8d68");

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const y = terrainHeight(x, z);
    position.setY(i, y);

    const noise = pseudoNoise(x * 1.7, z * 1.7);
    const edge = smoothstep(105, 175, Math.hypot(x, z));
    const color = baseGrass.clone().lerp(lightGrass, clamp(noise * 0.24 + 0.46, 0, 1));
    color.lerp(dryGrass, edge * 0.34);
    if (Math.abs(noise) > 0.72) color.lerp(earth, 0.16);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function drawGroundAlbedo(ctx, size, random) {
  ctx.fillStyle = "#aec47e";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 128; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const rx = 38 + random() * 150;
    const ry = 24 + random() * 120;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    const color = random() > 0.6 ? "168,129,77" : random() > 0.35 ? "209,222,130" : "116,173,89";
    gradient.addColorStop(0, `rgba(${color},${0.045 + random() * 0.065})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 7200; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const length = 2 + random() * 10;
    ctx.strokeStyle =
      random() > 0.62 ? "rgba(68,119,58,.07)" : random() > 0.32 ? "rgba(226,232,139,.12)" : "rgba(151,116,67,.045)";
    ctx.lineWidth = 0.7 + random() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + random() * 3 - 1.5);
    ctx.stroke();
  }

  for (let i = 0; i < 1100; i += 1) {
    ctx.fillStyle = random() > 0.55 ? "rgba(72,88,55,.035)" : "rgba(241,225,151,.075)";
    ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
  }
}

function drawGroundBump(ctx, size, random) {
  ctx.fillStyle = "#777";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 5000; i += 1) {
    ctx.strokeStyle = random() > 0.5 ? "rgba(190,190,190,.36)" : "rgba(70,70,70,.28)";
    ctx.lineWidth = 0.6 + random() * 1.2;
    const x = random() * size;
    const y = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + random() * 8 - 2, y + random() * 5 - 2.5);
    ctx.stroke();
  }
}

function drawStoneAlbedo(ctx, size, random) {
  ctx.fillStyle = "#cdbf9f";
  ctx.fillRect(0, 0, size, size);
  let y = 0;
  let row = 0;
  while (y < size) {
    const h = 24 + random() * 18;
    let x = row % 2 ? -18 - random() * 24 : -random() * 12;
    while (x < size) {
      const w = 38 + random() * 48;
      const shade = 0.9 + random() * 0.24;
      const r = Math.round(205 * shade);
      const g = Math.round(191 * shade);
      const b = Math.round(159 * shade);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

      if (random() > 0.76) {
        ctx.strokeStyle = "rgba(84,70,52,.17)";
        ctx.beginPath();
        ctx.moveTo(x + 8 + random() * w * 0.4, y + 5 + random() * h * 0.4);
        ctx.lineTo(x + w * 0.65, y + h * 0.65);
        ctx.stroke();
      }
      x += w;
    }
    y += h;
    row += 1;
  }

  const dirt = ctx.createLinearGradient(0, 0, 0, size);
  dirt.addColorStop(0, "rgba(255,245,210,.12)");
  dirt.addColorStop(0.6, "rgba(0,0,0,0)");
  dirt.addColorStop(1, "rgba(72,52,34,.16)");
  ctx.fillStyle = dirt;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(68,54,40,.24)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 28; i += 1) {
    const x = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, random() * size * 0.3);
    ctx.bezierCurveTo(x + random() * 16 - 8, size * 0.45, x + random() * 18 - 9, size * 0.7, x + random() * 20 - 10, size);
    ctx.stroke();
  }

  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = random() > 0.55 ? "rgba(255,249,225,.1)" : "rgba(56,43,32,.085)";
    ctx.fillRect(random() * size, random() * size, 1 + random() * 3, 1 + random() * 3);
  }
}

function drawStoneBump(ctx, size, random) {
  ctx.fillStyle = "#929292";
  ctx.fillRect(0, 0, size, size);
  let y = 0;
  let row = 0;
  while (y < size) {
    const h = 24 + random() * 18;
    let x = row % 2 ? -18 - random() * 24 : -random() * 12;
    while (x < size) {
      const w = 38 + random() * 48;
      ctx.fillStyle = `rgb(${142 + Math.round(random() * 44)},${142 + Math.round(random() * 44)},${142 + Math.round(random() * 44)})`;
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      x += w;
    }
    y += h;
    row += 1;
  }
  ctx.strokeStyle = "rgba(28,28,28,.72)";
  ctx.lineWidth = 3;
  for (let yLine = 0; yLine < size; yLine += 32) {
    ctx.beginPath();
    ctx.moveTo(0, yLine);
    ctx.lineTo(size, yLine + random() * 4 - 2);
    ctx.stroke();
  }
}

function drawRoofAlbedo(ctx, size, random) {
  ctx.fillStyle = "#ad563b";
  ctx.fillRect(0, 0, size, size);
  for (let y = -8; y < size; y += 22) {
    const rowShade = random() * 22 - 9;
    for (let x = -18; x < size; x += 24) {
      const shade = 0.86 + random() * 0.32;
      const r = Math.round((178 + rowShade) * shade);
      const g = Math.round(88 * shade);
      const b = Math.round(60 * shade);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.roundRect(x, y, 25, 19, 4);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(63,30,22,.15)";
    ctx.fillRect(0, y + 17, size, 4);
  }

  for (let i = 0; i < 340; i += 1) {
    ctx.fillStyle = random() > 0.58 ? "rgba(226,145,91,.14)" : "rgba(82,51,36,.12)";
    ctx.fillRect(random() * size, random() * size, 2 + random() * 8, 1 + random() * 4);
  }
}

function drawRoofBump(ctx, size, random) {
  ctx.fillStyle = "#888";
  ctx.fillRect(0, 0, size, size);
  for (let y = -8; y < size; y += 22) {
    for (let x = -18; x < size; x += 24) {
      ctx.fillStyle = "#aaa";
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, 21, 14, 3);
      ctx.fill();
    }
    ctx.fillStyle = "#444";
    ctx.fillRect(0, y + 17, size, 4);
  }
}

function drawTimberAlbedo(ctx, size, random) {
  ctx.fillStyle = "#6a4328";
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 18 + random() * 12) {
    const w = 14 + random() * 12;
    const shade = 0.82 + random() * 0.38;
    ctx.fillStyle = `rgb(${Math.round(106 * shade)},${Math.round(67 * shade)},${Math.round(40 * shade)})`;
    ctx.fillRect(x, 0, w, size);
    ctx.strokeStyle = "rgba(50,30,18,.32)";
    ctx.beginPath();
    ctx.moveTo(x + w - 1, 0);
    ctx.lineTo(x + w - 1, size);
    ctx.stroke();
    for (let i = 0; i < 9; i += 1) {
      ctx.strokeStyle = random() > 0.5 ? "rgba(183,124,76,.17)" : "rgba(44,26,16,.18)";
      ctx.beginPath();
      const gx = x + random() * w;
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + random() * 8 - 4, size * 0.32, gx + random() * 8 - 4, size * 0.66, gx, size);
      ctx.stroke();
    }
  }
}

function drawTimberBump(ctx, size, random) {
  ctx.fillStyle = "#858585";
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 16 + random() * 10) {
    ctx.strokeStyle = "rgba(35,35,35,.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + random() * 8 - 4, size);
    ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      ctx.strokeStyle = random() > 0.5 ? "rgba(190,190,190,.22)" : "rgba(45,45,45,.22)";
      ctx.beginPath();
      const gx = x + random() * 16;
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + random() * 6 - 3, size);
      ctx.stroke();
    }
  }
}

function drawCobbleAlbedo(ctx, size, random) {
  ctx.fillStyle = "#c5b693";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1500; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const rx = 3 + random() * 10;
    const ry = 2 + random() * 7;
    const shade = 0.88 + random() * 0.32;
    ctx.fillStyle = `rgb(${Math.round(198 * shade)},${Math.round(184 * shade)},${Math.round(151 * shade)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(116,88,58,.12)";
  for (let i = 0; i < 180; i += 1) {
    ctx.fillRect(random() * size, random() * size, 4 + random() * 20, 1 + random() * 4);
  }
}

function drawCobbleBump(ctx, size, random) {
  ctx.fillStyle = "#777";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1400; i += 1) {
    ctx.fillStyle = random() > 0.5 ? "#aaa" : "#666";
    ctx.beginPath();
    ctx.ellipse(random() * size, random() * size, 3 + random() * 9, 2 + random() * 6, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlasterAlbedo(ctx, size, random) {
  ctx.fillStyle = "#ddcba4";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 120; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const r = 24 + random() * 120;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    const color = random() > 0.55 ? "242,226,184" : random() > 0.3 ? "158,124,80" : "116,137,82";
    gradient.addColorStop(0, `rgba(${color},${0.03 + random() * 0.1})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 1800; i += 1) {
    ctx.fillStyle = random() > 0.55 ? "rgba(255,249,218,.1)" : "rgba(72,55,39,.085)";
    ctx.fillRect(random() * size, random() * size, 1 + random() * 3, 1 + random() * 3);
  }
  const dirt = ctx.createLinearGradient(0, 0, 0, size);
  dirt.addColorStop(0, "rgba(255,249,221,.18)");
  dirt.addColorStop(0.58, "rgba(0,0,0,0)");
  dirt.addColorStop(1, "rgba(84,58,37,.17)");
  ctx.fillStyle = dirt;
  ctx.fillRect(0, 0, size, size);
}

function drawPlasterBump(ctx, size, random) {
  ctx.fillStyle = "#8a8a8a";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i += 1) {
    ctx.fillStyle = random() > 0.5 ? "rgba(185,185,185,.24)" : "rgba(58,58,58,.18)";
    ctx.fillRect(random() * size, random() * size, 1 + random() * 5, 1 + random() * 5);
  }
  ctx.strokeStyle = "rgba(55,55,55,.32)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 36; i += 1) {
    const x = random() * size;
    const y = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + random() * 42 - 21, y + random() * 80 - 14);
    ctx.stroke();
  }
}

function drawWallOverlay(ctx, size, random) {
  ctx.clearRect(0, 0, size, size);
  let y = -18;
  let row = 0;
  while (y < size + 24) {
    const h = 34 + random() * 18;
    let x = row % 2 ? -46 - random() * 26 : -random() * 32;
    ctx.strokeStyle = "rgba(55,42,30,.32)";
    ctx.lineWidth = 2.1 + random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y + h);
    ctx.lineTo(size, y + h + random() * 5 - 2.5);
    ctx.stroke();
    while (x < size + 40) {
      const w = 54 + random() * 70;
      ctx.strokeStyle = "rgba(58,43,30,.18)";
      ctx.lineWidth = 1.5 + random();
      ctx.beginPath();
      ctx.moveTo(x, y + 3);
      ctx.lineTo(x + random() * 8 - 4, y + h - 2);
      ctx.stroke();
      if (random() > 0.68) {
        ctx.fillStyle = random() > 0.55 ? "rgba(255,249,226,.12)" : "rgba(58,41,28,.08)";
        ctx.fillRect(x + 10 + random() * Math.max(1, w - 20), y + 8 + random() * Math.max(1, h - 16), 5 + random() * 18, 2 + random() * 9);
      }
      x += w;
    }
    y += h;
    row += 1;
  }

  ctx.strokeStyle = "rgba(52,37,26,.18)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 26; i += 1) {
    const x = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, random() * size * 0.15);
    ctx.bezierCurveTo(x + random() * 18 - 9, size * 0.35, x + random() * 20 - 10, size * 0.72, x + random() * 16 - 8, size);
    ctx.stroke();
  }

  const footDirt = ctx.createLinearGradient(0, 0, 0, size);
  footDirt.addColorStop(0, "rgba(255,255,255,0)");
  footDirt.addColorStop(0.72, "rgba(0,0,0,0)");
  footDirt.addColorStop(1, "rgba(70,47,29,.24)");
  ctx.fillStyle = footDirt;
  ctx.fillRect(0, 0, size, size);
}

function drawPlasterOverlay(ctx, size, random) {
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 140; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const r = 18 + random() * 80;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    const color = random() > 0.6 ? "65,49,34" : random() > 0.35 ? "138,107,67" : "96,119,78";
    gradient.addColorStop(0, `rgba(${color},${0.025 + random() * 0.085})`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.strokeStyle = "rgba(66,49,34,.16)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 46; i += 1) {
    const x = random() * size;
    const y = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + random() * 44 - 22, y + random() * 76 - 16);
    ctx.stroke();
  }
  const footDirt = ctx.createLinearGradient(0, 0, 0, size);
  footDirt.addColorStop(0, "rgba(255,255,255,0)");
  footDirt.addColorStop(0.68, "rgba(0,0,0,0)");
  footDirt.addColorStop(1, "rgba(70,46,29,.21)");
  ctx.fillStyle = footDirt;
  ctx.fillRect(0, 0, size, size);
}

function drawRoofOverlay(ctx, size, random) {
  ctx.clearRect(0, 0, size, size);
  for (let y = -10; y < size + 18; y += 28) {
    ctx.fillStyle = "rgba(65,31,22,.24)";
    ctx.fillRect(0, y + 22, size, 4);
    for (let x = -16; x < size + 22; x += 26) {
      ctx.strokeStyle = "rgba(74,35,25,.21)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + (y % 56 ? 12 : 0), y + 2);
      ctx.quadraticCurveTo(x + 7, y + 13, x + 3, y + 24);
      ctx.stroke();
      if (random() > 0.62) {
        ctx.fillStyle = random() > 0.5 ? "rgba(238,151,92,.14)" : "rgba(87,46,33,.11)";
        ctx.fillRect(x + random() * 11, y + random() * 18, 5 + random() * 14, 2 + random() * 5);
      }
    }
  }
}

function drawGroundPatch(ctx, size, random) {
  ctx.clearRect(0, 0, size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.5);
  gradient.addColorStop(0, "rgba(255,255,255,.82)");
  gradient.addColorStop(0.62, "rgba(255,255,255,.42)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2, size * 0.48, size * 0.34, random() * Math.PI, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 180; i += 1) {
    ctx.fillStyle = random() > 0.55 ? "rgba(255,255,255,.32)" : "rgba(64,54,38,.09)";
    ctx.fillRect(random() * size, random() * size, 1 + random() * 4, 1 + random() * 4);
  }
}

function drawFieldPatch(ctx, size, random) {
  ctx.clearRect(0, 0, size, size);
  const edge = ctx.createLinearGradient(0, 0, size, 0);
  edge.addColorStop(0, "rgba(255,255,255,0)");
  edge.addColorStop(0.1, "rgba(255,255,255,.5)");
  edge.addColorStop(0.9, "rgba(255,255,255,.5)");
  edge.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);

  for (let y = 8; y < size; y += 13 + random() * 5) {
    ctx.strokeStyle = random() > 0.48 ? "rgba(92,71,43,.24)" : "rgba(234,218,148,.25)";
    ctx.lineWidth = 1.2 + random();
    ctx.beginPath();
    ctx.moveTo(8 + random() * 8, y);
    ctx.bezierCurveTo(size * 0.32, y + random() * 5 - 2.5, size * 0.68, y + random() * 5 - 2.5, size - 8 - random() * 8, y + random() * 2 - 1);
    ctx.stroke();
  }

  for (let i = 0; i < 180; i += 1) {
    ctx.fillStyle = random() > 0.5 ? "rgba(75,91,48,.1)" : "rgba(220,196,112,.13)";
    ctx.fillRect(random() * size, random() * size, 1 + random() * 3, 1 + random() * 3);
  }
}

function makeMaterials() {
  const groundMap = makeTexture(256, (ctx, size) => {
    ctx.fillStyle = "#6fae54";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1800; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const length = 2 + Math.random() * 11;
      ctx.strokeStyle =
        Math.random() > 0.55 ? "rgba(37,94,42,.22)" : Math.random() > 0.45 ? "rgba(196,219,114,.2)" : "rgba(127,93,50,.16)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length, y + Math.random() * 3 - 1.5);
      ctx.stroke();
    }
  });
  groundMap.repeat.set(28, 28);

  const stoneMap = makeTexture(256, (ctx, size) => {
    ctx.fillStyle = "#cdbb9a";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(88,75,58,.27)";
    ctx.lineWidth = 1;
    for (let y = 10; y < size; y += 18 + Math.random() * 7) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + Math.random() * 4 - 2);
      ctx.stroke();
      const rowOffset = Math.random() * 22;
      for (let x = rowOffset; x < size; x += 30 + Math.random() * 18) {
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x + Math.random() * 5 - 2, y + 3);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 550; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,235,.12)" : "rgba(70,52,36,.12)";
      ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
  });
  stoneMap.repeat.set(2.5, 2.5);

  const roofMap = makeTexture(256, (ctx, size) => {
    ctx.fillStyle = "#a85134";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 18) {
      ctx.fillStyle = y % 36 === 0 ? "rgba(255,190,126,.12)" : "rgba(83,36,28,.18)";
      ctx.fillRect(0, y, size, 9);
      ctx.strokeStyle = "rgba(73,32,24,.38)";
      ctx.beginPath();
      ctx.moveTo(0, y + 17);
      ctx.lineTo(size, y + 17);
      ctx.stroke();
      for (let x = (y % 36) / 2; x < size; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 4, y + 18);
        ctx.stroke();
      }
    }
  });
  roofMap.repeat.set(2, 2);

  const timberMap = makeTexture(256, (ctx, size) => {
    ctx.fillStyle = "#6b4428";
    ctx.fillRect(0, 0, size, size);
    for (let x = 0; x < size; x += 10 + Math.random() * 7) {
      ctx.strokeStyle = Math.random() > 0.5 ? "rgba(43,24,12,.32)" : "rgba(180,121,70,.18)";
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + Math.random() * 8 - 4, size * 0.35, x + Math.random() * 8 - 4, size * 0.7, x, size);
      ctx.stroke();
    }
  });
  timberMap.repeat.set(1.5, 2.5);

  const roadMap = makeTexture(256, (ctx, size) => {
    ctx.fillStyle = "#b9aa8d";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 650; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 6;
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(225,216,191,.34)" : "rgba(101,84,60,.22)";
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.45 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  roadMap.repeat.set(6, 1);

  const plazaMap = makeTexture(256, (ctx, size) => {
    ctx.fillStyle = "#c9b996";
    ctx.fillRect(0, 0, size, size);
    for (let r = 18; r < size * 0.78; r += 18) {
      ctx.strokeStyle = "rgba(82,67,47,.24)";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 360; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,247,217,.2)" : "rgba(80,65,49,.18)";
      ctx.beginPath();
      ctx.ellipse(Math.random() * size, Math.random() * size, 2 + Math.random() * 4, 1 + Math.random() * 3, Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  plazaMap.repeat.set(3, 3);

  const dirtMap = makeTexture(128, (ctx, size) => {
    ctx.fillStyle = "#9a7650";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 420; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(75,52,32,.1)" : "rgba(213,171,105,.14)";
      ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 4, 1 + Math.random() * 4);
    }
  });
  dirtMap.repeat.set(5, 1);

  const groundDetailMap = makeTexture(1024, drawGroundAlbedo, { seed: 1101 });
  const groundBumpMap = makeTexture(1024, drawGroundBump, { seed: 1102, colorSpace: THREE.NoColorSpace });
  groundDetailMap.repeat.set(9, 9);
  groundBumpMap.repeat.set(18, 18);

  const stoneDetailMap = makeTexture(1024, drawStoneAlbedo, { seed: 2101 });
  const stoneBumpMap = makeTexture(1024, drawStoneBump, { seed: 2102, colorSpace: THREE.NoColorSpace });
  stoneDetailMap.repeat.set(2.3, 2.3);
  stoneBumpMap.repeat.set(2.3, 2.3);

  const roofDetailMap = makeTexture(1024, drawRoofAlbedo, { seed: 3101 });
  const roofBumpMap = makeTexture(1024, drawRoofBump, { seed: 3102, colorSpace: THREE.NoColorSpace });
  roofDetailMap.repeat.set(5.8, 5.8);
  roofBumpMap.repeat.set(5.8, 5.8);

  const timberDetailMap = makeTexture(768, drawTimberAlbedo, { seed: 4101 });
  const timberBumpMap = makeTexture(768, drawTimberBump, { seed: 4102, colorSpace: THREE.NoColorSpace });
  timberDetailMap.repeat.set(2.3, 2.3);
  timberBumpMap.repeat.set(2.3, 2.3);

  const plasterDetailMap = makeTexture(1024, drawPlasterAlbedo, { seed: 4301 });
  const plasterBumpMap = makeTexture(1024, drawPlasterBump, { seed: 4302, colorSpace: THREE.NoColorSpace });
  plasterDetailMap.repeat.set(2.4, 2.4);
  plasterBumpMap.repeat.set(2.4, 2.4);

  const cobbleDetailMap = makeTexture(1024, drawCobbleAlbedo, { seed: 5101 });
  const cobbleBumpMap = makeTexture(1024, drawCobbleBump, { seed: 5102, colorSpace: THREE.NoColorSpace });
  cobbleDetailMap.repeat.set(5.5, 1.4);
  cobbleBumpMap.repeat.set(5.5, 1.4);

  const plazaDetailMap = makeTexture(1024, drawCobbleAlbedo, { seed: 5201 });
  const plazaBumpMap = makeTexture(1024, drawCobbleBump, { seed: 5202, colorSpace: THREE.NoColorSpace });
  plazaDetailMap.repeat.set(3.2, 3.2);
  plazaBumpMap.repeat.set(3.2, 3.2);

  const wallOverlayMap = makeTexture(1024, drawWallOverlay, { seed: 6101 });
  const plasterOverlayMap = makeTexture(1024, drawPlasterOverlay, { seed: 6102 });
  const roofOverlayMap = makeTexture(1024, drawRoofOverlay, { seed: 6103 });
  const groundPatchMap = makeTexture(256, drawGroundPatch, { seed: 6104 });
  const fieldPatchMap = makeTexture(512, drawFieldPatch, { seed: 6105 });

  return {
    ground: new THREE.MeshStandardMaterial({ map: groundDetailMap, bumpMap: groundBumpMap, roughnessMap: groundBumpMap, bumpScale: 0.18, vertexColors: true, roughness: 0.98 }),
    road: new THREE.MeshStandardMaterial({ color: "#e6d6b5", map: cobbleDetailMap, bumpMap: cobbleBumpMap, roughnessMap: cobbleBumpMap, bumpScale: 0.24, roughness: 0.97, side: THREE.DoubleSide, vertexColors: true }),
    roadEdge: new THREE.MeshStandardMaterial({ color: "#a9845a", map: dirtMap, roughness: 0.99, side: THREE.DoubleSide, vertexColors: true }),
    plaza: new THREE.MeshStandardMaterial({ color: "#ded0ad", map: plazaDetailMap, bumpMap: plazaBumpMap, roughnessMap: plazaBumpMap, bumpScale: 0.26, roughness: 0.97 }),
    stone: new THREE.MeshStandardMaterial({ color: "#c9bea5", map: stoneDetailMap, bumpMap: stoneBumpMap, roughnessMap: stoneBumpMap, bumpScale: 0.34, roughness: 0.97 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: "#958a79", map: stoneDetailMap, bumpMap: stoneBumpMap, roughnessMap: stoneBumpMap, bumpScale: 0.38, roughness: 0.98 }),
    plaster: new THREE.MeshStandardMaterial({ color: "#ddd1b4", map: plasterDetailMap, bumpMap: plasterBumpMap, roughnessMap: plasterBumpMap, bumpScale: 0.18, roughness: 0.98 }),
    timber: new THREE.MeshStandardMaterial({ color: "#805b38", map: timberDetailMap, bumpMap: timberBumpMap, roughnessMap: timberBumpMap, bumpScale: 0.26, roughness: 0.92 }),
    roof: new THREE.MeshStandardMaterial({ color: "#985241", map: roofDetailMap, bumpMap: roofBumpMap, roughnessMap: roofBumpMap, bumpScale: 0.3, roughness: 0.93 }),
    roofDark: new THREE.MeshStandardMaterial({ color: "#6c3e39", map: roofDetailMap, bumpMap: roofBumpMap, roughnessMap: roofBumpMap, bumpScale: 0.34, roughness: 0.95 }),
    wallOverlay: new THREE.MeshBasicMaterial({ map: wallOverlayMap, transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    plasterOverlay: new THREE.MeshBasicMaterial({ map: plasterOverlayMap, transparent: true, opacity: 0.28, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    roofOverlay: new THREE.MeshBasicMaterial({ map: roofOverlayMap, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }),
    groundPatch: new THREE.MeshBasicMaterial({ map: groundPatchMap, transparent: true, opacity: 0.14, depthWrite: false, vertexColors: true }),
    fieldPatch: new THREE.MeshBasicMaterial({ map: fieldPatchMap, color: "#ffffff", transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide, vertexColors: true }),
    gold: new THREE.MeshStandardMaterial({ color: "#ffd36a", emissive: "#a05b11", emissiveIntensity: 0.26, roughness: 0.55 }),
    water: new THREE.MeshStandardMaterial({ color: "#66b5c7", transparent: true, opacity: 0.68, roughness: 0.2, metalness: 0.04, side: THREE.DoubleSide }),
    banner: new THREE.MeshStandardMaterial({ color: "#376fae", roughness: 0.68, side: THREE.DoubleSide }),
    grassDark: new THREE.MeshStandardMaterial({ color: "#9fbc70", roughness: 0.96, vertexColors: true }),
    treeTrunk: new THREE.MeshStandardMaterial({ color: "#805635", roughness: 0.9 }),
    treeCrown: new THREE.MeshStandardMaterial({ color: "#d6e3b8", roughness: 0.96, vertexColors: true, flatShading: true }),
    bush: new THREE.MeshStandardMaterial({ color: "#8caf65", roughness: 0.96, vertexColors: true }),
    rock: new THREE.MeshStandardMaterial({ color: "#9a9c8c", roughness: 0.95, vertexColors: true }),
    mountain: new THREE.MeshStandardMaterial({ color: "#aec4ba", roughness: 0.92, vertexColors: true }),
    mountainCrag: new THREE.MeshStandardMaterial({ color: "#8da79a", roughness: 0.94 }),
    snow: new THREE.MeshStandardMaterial({ color: "#e9f6f4", roughness: 0.8 }),
    person: new THREE.MeshStandardMaterial({ color: "#2f6f92", roughness: 0.75, vertexColors: true }),
    personLeg: new THREE.MeshStandardMaterial({ color: "#2b2118", roughness: 0.82 }),
    personCloak: new THREE.MeshStandardMaterial({ color: "#375b70", roughness: 0.86, vertexColors: true }),
    personHead: new THREE.MeshStandardMaterial({ color: "#d8b58a", roughness: 0.8 }),
    windowRecess: new THREE.MeshStandardMaterial({ color: "#211812", roughness: 0.88 }),
    metal: new THREE.MeshStandardMaterial({ color: "#2a2722", roughness: 0.62, metalness: 0.35 }),
    lantern: new THREE.MeshStandardMaterial({ color: "#ffd27a", emissive: "#f59f2a", emissiveIntensity: 0.55, roughness: 0.45 }),
    shadow: new THREE.MeshBasicMaterial({ color: "#35271d", transparent: true, opacity: 0.11, depthWrite: false }),
    treeShadow: new THREE.MeshBasicMaterial({ color: "#4a3e2e", transparent: true, opacity: 0.045, depthWrite: false }),
    dirtPatch: new THREE.MeshBasicMaterial({ color: "#9a7650", map: groundPatchMap, transparent: true, opacity: 0.12, depthWrite: false }),
    smoke: new THREE.MeshBasicMaterial({ color: "#eef0e7", transparent: true, opacity: 0.28, depthWrite: false })
  };
}

function applyRepo(mesh, repo) {
  mesh.userData.repoId = repo.id;
  mesh.userData.repo = repo;
  return mesh;
}

function roundedNumber(value) {
  return Math.round(value * 1000) / 1000;
}

function castleTier(repo) {
  if (repo.influence > 0.92) return 3;
  if (repo.influence > 0.76) return 2;
  return 1;
}

function repoRelationStrength(a, b) {
  const topicsA = new Set(a.topics ?? []);
  const topicsB = new Set(b.topics ?? []);
  let sharedTopics = 0;
  topicsA.forEach((topic) => {
    if (topicsB.has(topic)) sharedTopics += 1;
  });
  const sameOwner = a.owner && a.owner === b.owner ? 0.5 : 0;
  const sameLanguage = a.language && b.language && a.language === b.language ? 0.22 : 0;
  const topicOverlap = Math.min(0.4, sharedTopics * 0.14);
  const activityAffinity = (1 - Math.abs(a.hotness - b.hotness)) * 0.16;
  return sameOwner + sameLanguage + topicOverlap + activityAffinity;
}

function repoRoadScore(repo) {
  const typeBonus = {
    castle: 0.42,
    guildhall: 0.25,
    manor: 0.12,
    house: 0
  }[repo.buildingType] ?? 0;
  const ordinalBonus =
    Math.max(0, 1 - (repo.topicOrdinal ?? 99) / Math.max(1, repo.topicRepoCount ?? 1)) * 0.12;
  return repo.influence * 0.55 + repo.hotness * 0.27 + typeBonus + ordinalBonus + (repo.detailLevel === "full" ? 0.08 : 0);
}

function repoAngleFromCluster(repo, cluster) {
  const angle = Math.atan2(repo.position.z - cluster.centroid.z, repo.position.x - cluster.centroid.x);
  return angle < 0 ? angle + Math.PI * 2 : angle;
}

function repoDistanceFromCluster(repo, cluster) {
  return Math.hypot(repo.position.x - cluster.centroid.x, repo.position.z - cluster.centroid.z);
}

function createRoadStats(sourceRepoCount = 0) {
  return {
    sourceRepoCount,
    interDistrict: 0,
    landmarkSpurs: 0,
    cityRoadCount: 0,
    plazaLoops: 0,
    radialLanes: 0,
    crossLanes: 0,
    maxCityPathsPerCluster: 0,
    roadsByCluster: {}
  };
}

export class GitLandWorld {
  constructor({ canvas, minimap, districtLabelLayer, onStats, onHover, onSelect, onAltitude }) {
    this.canvas = canvas;
    this.minimap = minimap;
    this.districtLabelLayer = districtLabelLayer;
    this.onStats = onStats;
    this.onHover = onHover;
    this.onSelect = onSelect;
    this.onAltitude = onAltitude;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setClearColor("#b8d2cc");
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#b8d2cc");
    this.scene.fog = new THREE.FogExp2("#e4e9df", 0.00142);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1200);
    this.cameraState = {
      target: new THREE.Vector3(-12, 0, 32),
      distance: 430,
      yaw: -0.62
    };

    this.materials = makeMaterials();
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    Object.values(this.materials).forEach((material) => {
      if (material.map) material.map.anisotropy = Math.min(8, maxAnisotropy);
      if (material.bumpMap) material.bumpMap.anisotropy = Math.min(8, maxAnisotropy);
      if (material.roughnessMap) material.roughnessMap.anisotropy = Math.min(8, maxAnisotropy);
      if (material.alphaMap) material.alphaMap.anisotropy = Math.min(8, maxAnisotropy);
    });
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.fps = 60;
    this.renderedOnce = false;
    this.pointerState = { down: false, dragMode: "pan", x: 0, y: 0, moved: false };
    this.keys = new Set();
    this.interactiveMeshes = [];
    this.flags = [];
    this.people = [];
    this.roads = [];
    this.cityRoads = [];
    this.cityRoadCount = 0;
    this.roadStats = createRoadStats();
    this.scenicFeatures = {
      waterCourses: 0,
      rivers: 0,
      canals: 0,
      lakes: 0,
      bridges: 0,
      docks: 0,
      boats: 0,
      reeds: 0,
      lilyPads: 0
    };
    this.localRoadsVisible = true;
    this.districtLabels = [];
    this.selectedRepo = null;
    this.hoveredRepo = null;

    this.createStaticScene();
    this.bindEvents();
    this.setTimeWindow(90);
    this.resize();
    this.loop();
  }

  createStaticScene() {
    this.createSky();

    const ambient = new THREE.HemisphereLight("#e1ebe7", "#899174", 1.36);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight("#fff0c8", 3.15);
    sun.position.set(-120, 198, 78);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -260;
    sun.shadow.camera.right = 260;
    sun.shadow.camera.top = 260;
    sun.shadow.camera.bottom = -260;
    sun.shadow.camera.near = 20;
    sun.shadow.camera.far = 420;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight("#bfd2db", 0.54);
    fill.position.set(94, 74, -96);
    this.scene.add(fill);

    const ground = new THREE.Mesh(makeTerrainGeometry(), this.materials.ground);
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.createHorizonGround();
    this.createGroundDetailPatches();

    this.createMountains();
    this.createHorizonForest();
  }

  createHorizonGround() {
    const horizon = new THREE.Mesh(
      new THREE.RingGeometry(330, 960, 160, 1),
      new THREE.MeshBasicMaterial({
        color: "#91a884",
        fog: true,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    horizon.rotation.x = -Math.PI / 2;
    horizon.position.y = -0.85;
    this.scene.add(horizon);
  }

  createGroundDetailPatches() {
    const count = 430;
    const patchGeo = new THREE.CircleGeometry(1, 28);
    const patches = new THREE.InstancedMesh(patchGeo, this.materials.groundPatch, count);
    const temp = new THREE.Object3D();
    const colors = ["#7d5d39", "#9b8d5a", "#6f8d50", "#a59c78"];

    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.399963 + 0.31;
      const radius = 16 + ((i * 37) % 246);
      const x = clamp(Math.cos(angle) * radius + ((i * 17) % 21) - 10, -282, 282);
      const z = clamp(Math.sin(angle) * radius + ((i * 23) % 19) - 9, -282, 282);
      const y = terrainHeight(x, z) + 0.045;
      const scaleX = 1.6 + ((i * 11) % 19) * 0.24;
      const scaleZ = 0.8 + ((i * 7) % 17) * 0.18;
      temp.position.set(x, y, z);
      temp.rotation.set(-Math.PI / 2, 0, angle + (i % 5) * 0.3);
      temp.scale.set(scaleX, scaleZ, 1);
      temp.updateMatrix();
      patches.setMatrixAt(i, temp.matrix);
      patches.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    }

    patches.instanceColor.needsUpdate = true;
    this.scene.add(patches);
  }

  createSky() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1200, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          topColor: { value: new THREE.Color("#a9c4c6") },
          bottomColor: { value: new THREE.Color("#edf0e4") }
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, smoothstep(-0.10, 0.86, h)), 1.0);
          }
        `
      })
    );
    this.scene.add(sky);

    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(18, 48),
      new THREE.MeshBasicMaterial({ color: "#fff7d6", transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide })
    );
    sunDisc.position.set(-150, 130, -130);
    sunDisc.lookAt(0, 48, 0);
    this.scene.add(sunDisc);

    const cloudTexture = makeTexture(256, (ctx, size) => {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 12, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, "rgba(255,255,255,.78)");
      gradient.addColorStop(0.42, "rgba(255,255,255,.48)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 7; i += 1) {
        ctx.fillStyle = "rgba(255,255,255,.22)";
        ctx.beginPath();
        ctx.ellipse(size * (0.25 + Math.random() * 0.55), size * (0.42 + Math.random() * 0.18), 32 + Math.random() * 45, 14 + Math.random() * 26, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    const cloudMaterial = new THREE.MeshBasicMaterial({ map: cloudTexture, transparent: true, depthWrite: false, opacity: 0.44, side: THREE.DoubleSide });
    for (let i = 0; i < 18; i += 1) {
      const cloud = new THREE.Mesh(new THREE.PlaneGeometry(28 + (i % 4) * 9, 11 + (i % 3) * 4), cloudMaterial);
      const angle = (i / 18) * Math.PI * 2;
      const radius = 150 + (i % 5) * 32;
      cloud.position.set(Math.cos(angle) * radius, 88 + (i % 4) * 9, Math.sin(angle) * radius);
      cloud.rotation.set(-0.28, -angle + Math.PI / 2, 0.05 * (i % 3));
      this.scene.add(cloud);
    }
  }

  createMountains() {
    const mountainGroup = new THREE.Group();

    const makeRidge = (innerRadius, peakRadius, outerRadius, baseHeight, heightBoost, phase) => {
      const segments = 96;
      const vertices = [];
      const colors = [];
      const indices = [];
      const rockLow = new THREE.Color("#789284");
      const rockMid = new THREE.Color("#a7bdb2");
      const snow = new THREE.Color("#edf6ef");

      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const angle = t * Math.PI * 2;
        const wave = Math.sin(i * 0.73 + phase) * 0.5 + Math.sin(i * 1.97 + phase * 0.4) * 0.28 + Math.sin(i * 0.19) * 0.35;
        const peakHeight = baseHeight + heightBoost * (0.52 + Math.abs(wave) * 0.42);
        const inner = innerRadius + Math.sin(i * 0.41 + phase) * 5;
        const peak = peakRadius + Math.sin(i * 0.57 + 1.7 + phase) * 10;
        const outer = outerRadius + Math.sin(i * 0.36 + 0.8 + phase) * 12;
        const rows = [
          { r: inner, y: -6, color: rockLow },
          { r: peak - 8, y: peakHeight * 0.58, color: rockMid },
          { r: peak, y: peakHeight, color: snow },
          { r: outer, y: -9, color: rockLow.clone().lerp(new THREE.Color("#577267"), 0.28) }
        ];

        for (const row of rows) {
          vertices.push(Math.cos(angle) * row.r, row.y, Math.sin(angle) * row.r);
          colors.push(row.color.r, row.color.g, row.color.b);
        }
      }

      for (let i = 0; i < segments; i += 1) {
        const a = i * 4;
        const b = (i + 1) * 4;
        for (let row = 0; row < 3; row += 1) {
          indices.push(a + row, b + row, a + row + 1, b + row, b + row + 1, a + row + 1);
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, this.materials.mountain);
      mesh.receiveShadow = true;
      return mesh;
    };

    mountainGroup.add(makeRidge(330, 390, 520, 16, 16, 0.8));
    mountainGroup.add(makeRidge(430, 520, 680, 26, 22, 2.4));

    const cragGeo = new THREE.ConeGeometry(1, 1, 5);
    for (let i = 0; i < 28; i += 1) {
      const angle = (i / 28) * Math.PI * 2 + 0.08 * (i % 3);
      const radius = 350 + (i % 6) * 18;
      const height = 7 + (i % 5) * 1.8;
      const crag = new THREE.Mesh(cragGeo, this.materials.mountainCrag);
      crag.position.set(Math.cos(angle) * radius, height / 2 - 5, Math.sin(angle) * radius);
      crag.scale.set(4 + (i % 4) * 1.6, height, 5 + (i % 3) * 1.4);
      crag.rotation.y = angle + i * 0.27;
      mountainGroup.add(crag);
    }
    this.scene.add(mountainGroup);
  }

  createHorizonForest() {
    const count = 260;
    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.16, 1, 5);
    const crownGeo = new THREE.ConeGeometry(1, 2.8, 7);
    const trunks = new THREE.InstancedMesh(trunkGeo, this.materials.timber, count);
    const crowns = new THREE.InstancedMesh(crownGeo, this.materials.treeCrown, count);
    const temp = new THREE.Object3D();
    const random = seededRandom(9107);

    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.399963 + random() * 0.25;
      const radius = 294 + random() * 70 + (i % 5) * 7;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = terrainHeight(clamp(x, -360, 360), clamp(z, -360, 360));
      const scale = 1.2 + random() * 1.5;
      const height = 2.4 + scale * 1.4;

      temp.position.set(x, y + height * 0.5, z);
      temp.rotation.set(0, angle, 0);
      temp.scale.set(0.9 * scale, height, 0.9 * scale);
      temp.updateMatrix();
      trunks.setMatrixAt(i, temp.matrix);

      temp.position.set(x, y + height + 1.35 * scale, z);
      temp.rotation.set(0, angle + random() * 0.6, 0);
      temp.scale.set(1.1 * scale, 1.15 * scale, 1.1 * scale);
      temp.updateMatrix();
      crowns.setMatrixAt(i, temp.matrix);
      crowns.setColorAt(i, new THREE.Color(i % 3 === 0 ? "#7b8e64" : i % 3 === 1 ? "#8b9a70" : "#6f855f"));
    }

    crowns.instanceColor.needsUpdate = true;
    trunks.castShadow = false;
    crowns.castShadow = false;
    trunks.receiveShadow = true;
    crowns.receiveShadow = true;
    this.scene.add(trunks, crowns);
  }

  setTimeWindow(days) {
    this.timeWindowDays = days;
    this.worldData = buildWorldData(days);
    this.selectedRepo = null;
    this.hoveredRepo = null;
    this.interactiveMeshes = [];
    this.flags = [];
    this.people = [];
    this.roads = [];
    this.cityRoads = [];
    this.cityRoadCount = 0;
    this.roadStats = createRoadStats(this.worldData.repos.length);
    this.scenicFeatures = {
      waterCourses: 0,
      rivers: 0,
      canals: 0,
      lakes: 0,
      bridges: 0,
      docks: 0,
      boats: 0,
      reeds: 0,
      lilyPads: 0
    };
    this.localRoadsVisible = null;
    this.clearDistrictLabels();

    if (this.worldRoot) {
      this.scene.remove(this.worldRoot);
      this.disposeObject(this.worldRoot);
    }

    this.worldRoot = new THREE.Group();
    this.worldRoot.name = "gitland-world";
    this.scene.add(this.worldRoot);
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.shadowMap.needsUpdate = true;
    this.shadowFrames = 0;

    this.createDistricts();
    this.createDistrictLabels();
    this.createWaterFeatures();
    this.createRoads();
    this.createBuildings();
    this.createDistrictUrbanDetails();
    this.createAgriculturalBelts();
    this.createTrees();
    this.createCrowds();
    this.updateRoadVisibility();
    this.drawMinimap();

    this.onStats?.(this.worldData);
    this.onSelect?.(null);
  }

  disposeObject(root) {
    const disposeMaterial = (material) => {
      if (material.userData?.disposeMap) {
        material.map?.dispose();
        material.alphaMap?.dispose();
      }
      material.dispose();
    };
    root.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material && !Object.values(this.materials).includes(object.material)) {
        if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
        else disposeMaterial(object.material);
      }
    });
  }

  clearDistrictLabels() {
    this.districtLabels = [];
    if (this.districtLabelLayer) this.districtLabelLayer.textContent = "";
  }

  createDistrictLabels() {
    if (!this.districtLabelLayer) return;
    this.districtLabelLayer.textContent = "";
    this.districtLabels = this.worldData.clusters.map((cluster) => {
      const style = getTopicStyle(cluster.id);
      const element = document.createElement("div");
      element.className = `district-label district-label--${cluster.id}`;
      element.style.setProperty("--district-color", style.boundaryTint);
      element.style.setProperty("--district-accent", style.accentTint);
      element.innerHTML = `
        <span class="district-label__abbr">${topicAbbreviation(cluster.id)}</span>
        <span class="district-label__name">${cluster.label}</span>
        <span class="district-label__count">${cluster.repoCount} repos</span>
      `;
      this.districtLabelLayer.appendChild(element);
      return { cluster, element };
    });
    this.updateDistrictLabels();
  }

  updateDistrictLabels() {
    if (!this.districtLabelLayer || !this.districtLabels.length) return;
    const altitude = clamp((this.cameraState.distance - 90) / (MAX_DISTANCE - 90), 0, 1);
    const scale = lerp(0.78, 1.08, altitude);
    const viewportWidth = this.renderer.domElement.clientWidth;
    const viewportHeight = this.renderer.domElement.clientHeight;
    for (const label of this.districtLabels) {
      const { cluster, element } = label;
      const y = terrainHeight(cluster.centroid.x, cluster.centroid.z) + 14 + cluster.averageHotness * 8;
      const screen = this.worldToScreen(cluster.centroid.x, y, cluster.centroid.z);
      let labelX = clamp(screen.x, 104, viewportWidth - 104);
      let labelY = clamp(screen.y, 48, viewportHeight - 58);
      if (labelY > viewportHeight - 210 && labelX < 340) labelX = 340;
      if (labelY < 152 && labelX < 340) labelX = 340;
      const inFrame = screen.visible;
      element.classList.toggle("district-label--hidden", !inFrame);
      element.style.left = `${labelX}px`;
      element.style.top = `${labelY}px`;
      element.style.opacity = inFrame ? String(0.72 + altitude * 0.26) : "0";
      element.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
  }

  createDistricts() {
    for (const cluster of this.worldData.clusters) {
      const style = getTopicStyle(cluster.id);
      const radius = clusterPlazaRadius(cluster);
      const repos = this.worldData.repos.filter((repo) => repo.topic === cluster.id);
      const territory = getDistrictTerritory(cluster, repos, this.worldData.clusters);
      const y = terrainHeight(cluster.centroid.x, cluster.centroid.z);

      const wash = new THREE.Mesh(
        new THREE.CircleGeometry(1, 64),
        new THREE.MeshBasicMaterial({
          map: this.materials.groundPatch.map,
          color: style.groundWash,
          transparent: true,
          opacity: style.groundOpacity ?? 0.3,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      wash.rotation.x = -Math.PI / 2;
      wash.position.set(cluster.centroid.x, y + 0.045, cluster.centroid.z);
      wash.scale.set(territory.radiusX, territory.radiusZ, 1);
      this.worldRoot.add(wash);

      const patternMaterial = new THREE.MeshBasicMaterial({
        map: makeDistrictPatternTexture(cluster.id, style),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      patternMaterial.userData.disposeMap = true;
      const pattern = new THREE.Mesh(new THREE.CircleGeometry(1, 64), patternMaterial);
      pattern.rotation.x = -Math.PI / 2;
      pattern.position.set(cluster.centroid.x, y + 0.07, cluster.centroid.z);
      pattern.scale.set(territory.radiusX * 0.96, territory.radiusZ * 0.96, 1);
      this.worldRoot.add(pattern);

      const boundaryColor = new THREE.Color(style.boundaryTint).lerp(new THREE.Color("#2a2117"), 0.18);
      const boundary = new THREE.Mesh(
        new THREE.TorusGeometry(territory.radiusX * 0.98, 0.5, 7, 132),
        new THREE.MeshBasicMaterial({
          color: boundaryColor,
          transparent: true,
          opacity: 0.72,
          depthWrite: false
        })
      );
      boundary.rotation.x = Math.PI / 2;
      boundary.position.set(cluster.centroid.x, y + 0.13, cluster.centroid.z);
      boundary.scale.z = territory.radiusZ / territory.radiusX;
      this.worldRoot.add(boundary);

      const innerBoundary = new THREE.Mesh(
        new THREE.TorusGeometry(territory.radiusX * 0.86, 0.16, 6, 120),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(style.plazaTint).lerp(new THREE.Color(style.boundaryTint), 0.25),
          transparent: true,
          opacity: 0.55,
          depthWrite: false
        })
      );
      innerBoundary.rotation.x = Math.PI / 2;
      innerBoundary.position.set(cluster.centroid.x, y + 0.145, cluster.centroid.z);
      innerBoundary.scale.z = territory.radiusZ / territory.radiusX;
      this.worldRoot.add(innerBoundary);

      const plazaMaterial = this.materials.plaza.clone();
      plazaMaterial.color.lerp(new THREE.Color(style.plazaTint), 0.24);
      const plaza = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.12, 48), plazaMaterial);
      plaza.position.set(cluster.centroid.x, y + 0.07, cluster.centroid.z);
      plaza.receiveShadow = true;
      this.worldRoot.add(plaza);

      const ringColor = new THREE.Color(style.plazaTint).lerp(new THREE.Color(cluster.color), 0.38);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius + 0.35, 0.08, 6, 80),
        new THREE.MeshStandardMaterial({
          color: ringColor,
          emissive: ringColor,
          emissiveIntensity: cluster.averageHotness * 0.1,
          roughness: 0.7
        })
      );
      ring.position.set(cluster.centroid.x, y + 0.18, cluster.centroid.z);
      ring.rotation.x = Math.PI / 2;
      this.worldRoot.add(ring);

      const fountain = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.35, 32), this.materials.stoneDark);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.08, 32), this.materials.water);
      const statue = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.2, 5), this.materials.gold);
      base.position.y = 0.22;
      water.position.y = 0.44;
      statue.position.y = 1.55;
      fountain.position.set(cluster.centroid.x, y + 0.08, cluster.centroid.z);
      fountain.add(base, water, statue);
      this.worldRoot.add(fountain);
      this.createDistrictLandmark(cluster, radius, y);
      this.createMarketDetails(cluster, radius, y);
    }
  }

  createWaterCourse(course) {
    const points = course.points.map(([x, z]) => new THREE.Vector3(x, 0.04, z));
    const group = new THREE.Group();
    group.name = `water-course-${course.id}`;

    const bankMaterial = new THREE.MeshBasicMaterial({
      color: course.type === "canal" ? "#bba889" : "#c8b98d",
      transparent: true,
      opacity: course.type === "canal" ? 0.3 : 0.24,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const bank = this.createRoadMesh(points, course.width + (course.type === "canal" ? 1.15 : 1.75), bankMaterial, 80, {
      color: "#d0bc91",
      singleRibbon: true,
      yOffset: 0.078
    });
    bank.name = `water-bank-${course.id}`;
    group.add(bank);

    const waterMaterial = this.materials.water.clone();
    waterMaterial.color.set(course.type === "canal" ? "#69adbd" : "#54aac1");
    waterMaterial.opacity = course.type === "canal" ? 0.64 : 0.76;
    waterMaterial.depthWrite = false;
    const water = this.createRoadMesh(points, course.width, waterMaterial, 112);
    water.name = `river-water-${course.id}`;
    group.add(water);
    return group;
  }

  createWaterLake(lake) {
    const group = new THREE.Group();
    group.name = `water-lake-${lake.id}`;
    const y = terrainHeight(lake.x, lake.z);

    const shoreMaterial = new THREE.MeshBasicMaterial({
      color: "#c9b987",
      map: this.materials.groundPatch.map,
      transparent: true,
      opacity: 0.31,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const shallowMaterial = new THREE.MeshBasicMaterial({
      color: "#9ed0cc",
      transparent: true,
      opacity: 0.23,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const waterMaterial = this.materials.water.clone();
    waterMaterial.color.set(lake.id === "mobile-lagoon" ? "#54c7c4" : "#5db1c7");
    waterMaterial.opacity = lake.id === "mobile-lagoon" ? 0.78 : 0.7;
    waterMaterial.depthWrite = false;

    const shore = new THREE.Mesh(makeIrregularDiscGeometry(lake.rx * 1.22, lake.rz * 1.32, 72, lake.seed + 11, 0.1), shoreMaterial);
    shore.position.set(lake.x, y + 0.072, lake.z);
    shore.rotation.y = lake.rotation;
    group.add(shore);

    const shallows = new THREE.Mesh(makeIrregularDiscGeometry(lake.rx * 1.08, lake.rz * 1.13, 72, lake.seed + 17, 0.12), shallowMaterial);
    shallows.position.set(lake.x, y + 0.09, lake.z);
    shallows.rotation.y = lake.rotation;
    group.add(shallows);

    const water = new THREE.Mesh(makeIrregularDiscGeometry(lake.rx, lake.rz, 72, lake.seed, 0.15), waterMaterial);
    water.position.set(lake.x, y + 0.115, lake.z);
    water.rotation.y = lake.rotation;
    water.name = `lake-water-${lake.id}`;
    group.add(water);
    return group;
  }

  createWaterBridge(record) {
    const group = new THREE.Group();
    group.name = "water-bridge";
    const y = terrainHeight(record.x, record.z) + 0.32;
    const deck = new THREE.Mesh(makeSoftBoxGeometry(record.length, 0.28, 2.4, 0.035, 1), this.materials.timber);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(makeSoftBoxGeometry(record.length * 0.94, 0.18, 0.14, 0.02, 1), this.materials.stoneDark);
      rail.position.set(0, 0.42, side * 1.22);
      group.add(rail);
      for (let i = -2; i <= 2; i += 1) {
        const post = new THREE.Mesh(makeSoftBoxGeometry(0.16, 0.72, 0.16, 0.018, 1), this.materials.timber);
        post.position.set(i * record.length * 0.18, 0.34, side * 1.22);
        group.add(post);
      }
    }

    group.position.set(record.x, y, record.z);
    group.rotation.y = record.angle;
    return group;
  }

  createDock(lake, side = 1) {
    const group = new THREE.Group();
    group.name = "water-dock";
    const angle = lake.rotation + side * 0.95;
    const x = lake.x + Math.cos(angle) * lake.rx * 0.98;
    const z = lake.z + Math.sin(angle) * lake.rz * 0.98;
    const y = terrainHeight(x, z) + 0.18;
    const length = 8 + lake.rx * 0.06;
    const deck = new THREE.Mesh(makeSoftBoxGeometry(1.35, 0.16, length, 0.025, 1), this.materials.timber);
    deck.castShadow = true;
    group.add(deck);
    for (const offset of [-0.42, 0.42]) {
      for (const depth of [-0.42, 0.42]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6), this.materials.timber);
        post.position.set(offset, -0.25, depth * length);
        group.add(post);
      }
    }
    group.position.set(x, y, z);
    group.rotation.y = -angle + Math.PI / 2;
    return group;
  }

  createBoat(x, z, angle, scale = 1) {
    const group = new THREE.Group();
    group.name = "water-boat";
    const y = terrainHeight(x, z) + 0.22;
    const hull = new THREE.Mesh(makeSoftBoxGeometry(1.35 * scale, 0.28 * scale, 2.6 * scale, 0.05, 1), this.materials.timber);
    hull.castShadow = true;
    group.add(hull);
    const seat = new THREE.Mesh(makeSoftBoxGeometry(1.1 * scale, 0.08 * scale, 0.18 * scale, 0.012, 1), this.materials.stoneDark);
    seat.position.y = 0.22 * scale;
    group.add(seat);
    const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * scale, 0.03 * scale, 2.5 * scale, 6), this.materials.timber);
    oar.rotation.z = Math.PI / 2;
    oar.position.set(0, 0.22 * scale, 0.1 * scale);
    group.add(oar);
    group.position.set(x, y, z);
    group.rotation.y = angle;
    return group;
  }

  createWaterFeatureDetails(group) {
    const reeds = [];
    const lilies = [];
    const boats = [
      [-4, 42, 0.72, 0.9],
      [42, 168, -0.28, 1.15],
      [89, 184, 0.68, 0.95],
      [-155, 124, 1.08, 0.8],
      [113, 42, -0.72, 0.78],
      [-174, -26, 0.22, 0.74],
      [64, 150, 1.32, 0.88],
      [-46, 24, -0.48, 0.76]
    ];

    for (const lake of WATER_LAKES) {
      for (let i = 0; i < 32; i += 1) {
        const t = (i / 32) * Math.PI * 2;
        const wave = 0.92 + Math.sin(i * 1.7 + lake.seed) * 0.12;
        const x = lake.x + Math.cos(t + lake.rotation) * lake.rx * wave;
        const z = lake.z + Math.sin(t + lake.rotation) * lake.rz * wave;
        reeds.push({ x, z, scale: 0.7 + (i % 5) * 0.12, angle: t + lake.rotation });
      }
      for (let i = 0; i < 12; i += 1) {
        const angle = i * 2.399963 + lake.seed * 0.013;
        const radius = 0.2 + (i % 7) * 0.075;
        lilies.push({
          x: lake.x + Math.cos(angle) * lake.rx * radius,
          z: lake.z + Math.sin(angle) * lake.rz * radius,
          angle,
          scale: 0.7 + (i % 4) * 0.18
        });
      }
    }

    const temp = new THREE.Object3D();
    const reedGeo = new THREE.CylinderGeometry(0.035, 0.055, 1, 5);
    const reedHeadGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.22, 6);
    const reedMaterial = this.materials.grassDark.clone();
    reedMaterial.vertexColors = true;
    const reedMesh = new THREE.InstancedMesh(reedGeo, reedMaterial, reeds.length);
    const reedHeads = new THREE.InstancedMesh(reedHeadGeo, this.materials.timber, reeds.length);
    reeds.forEach((reed, index) => {
      const y = terrainHeight(reed.x, reed.z);
      temp.position.set(reed.x, y + 0.5 * reed.scale, reed.z);
      temp.rotation.set(0.08 * Math.sin(index), reed.angle, 0.08 * Math.cos(index));
      temp.scale.setScalar(reed.scale);
      temp.updateMatrix();
      reedMesh.setMatrixAt(index, temp.matrix);
      reedMesh.setColorAt(index, new THREE.Color(index % 2 ? "#6f8f58" : "#8aa15f"));

      temp.position.set(reed.x, y + 1.02 * reed.scale, reed.z);
      temp.scale.setScalar(reed.scale);
      temp.updateMatrix();
      reedHeads.setMatrixAt(index, temp.matrix);
    });
    reedMesh.instanceColor.needsUpdate = true;
    group.add(reedMesh, reedHeads);

    const lilyGeo = new THREE.CircleGeometry(0.42, 12);
    const lilyMaterial = new THREE.MeshBasicMaterial({ color: "#6a925c", transparent: true, opacity: 0.84, depthWrite: false, side: THREE.DoubleSide });
    const lilyMesh = new THREE.InstancedMesh(lilyGeo, lilyMaterial, lilies.length);
    lilies.forEach((lily, index) => {
      const y = terrainHeight(lily.x, lily.z);
      temp.position.set(lily.x, y + 0.15, lily.z);
      temp.rotation.set(-Math.PI / 2, 0, lily.angle);
      temp.scale.set(lily.scale, lily.scale * 0.72, 1);
      temp.updateMatrix();
      lilyMesh.setMatrixAt(index, temp.matrix);
    });
    group.add(lilyMesh);

    for (const lake of WATER_LAKES.filter((item) => item.id === "mobile-lagoon" || item.id === "mirror-lake" || item.id === "game-pond")) {
      group.add(this.createDock(lake, -1), this.createDock(lake, 1));
      this.scenicFeatures.docks += 2;
    }
    for (const [x, z, angle, scale] of boats) {
      group.add(this.createBoat(x, z, angle, scale));
      this.scenicFeatures.boats += 1;
    }

    this.scenicFeatures.reeds = reeds.length;
    this.scenicFeatures.lilyPads = lilies.length;
  }

  createWaterFeatures() {
    const group = new THREE.Group();
    group.name = "scenic-water-features";

    for (const lake of WATER_LAKES) {
      group.add(this.createWaterLake(lake));
      this.scenicFeatures.lakes += 1;
    }

    for (const course of WATER_COURSES) {
      group.add(this.createWaterCourse(course));
      this.scenicFeatures.waterCourses += 1;
      if (course.type === "canal") this.scenicFeatures.canals += 1;
      else this.scenicFeatures.rivers += 1;
    }

    for (const bridge of WATER_BRIDGES) {
      group.add(this.createWaterBridge(bridge));
      this.scenicFeatures.bridges += 1;
    }

    this.createWaterFeatureDetails(group);
    this.worldRoot.add(group);
  }

  createDistrictLandmark(cluster, radius, y) {
    const style = getTopicStyle(cluster.id);
    const group = new THREE.Group();
    const accent = new THREE.Color(style.accentTint);
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: cluster.averageHotness * 0.22,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    const darkAccent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(style.boundaryTint).lerp(new THREE.Color("#2a2117"), 0.18),
      roughness: 0.82
    });
    const place = (mesh, x, z, yy = 0) => {
      mesh.position.set(x, yy, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    if (style.landmark === "obelisk") {
      place(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.05, 0.42, 8), darkAccent), 0, 0, 0.24);
      place(new THREE.Mesh(new THREE.ConeGeometry(0.58, 4.6, 5), accentMaterial), 0, 0, 2.72).rotation.y = Math.PI / 5;
      for (let i = 0; i < 4; i += 1) {
        const a = (i / 4) * Math.PI * 2 + 0.45;
        place(new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), accentMaterial), Math.cos(a) * 1.3, Math.sin(a) * 1.3, 1.35 + (i % 2) * 0.42);
      }
    } else if (style.landmark === "arcade") {
      for (let i = -1; i <= 1; i += 1) {
        place(new THREE.Mesh(makeSoftBoxGeometry(0.26, 1.75, 0.26, 0.025, 1), this.materials.timber), i * 1.0, -0.42, 0.92);
        place(new THREE.Mesh(makeSoftBoxGeometry(0.26, 1.75, 0.26, 0.025, 1), this.materials.timber), i * 1.0, 0.42, 0.92);
        const pennant = place(new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.44, 3, 1), accentMaterial), i * 1.0 + 0.28, 0.56, 1.82);
        pennant.rotation.y = Math.PI / 2;
      }
      place(new THREE.Mesh(makeSoftBoxGeometry(2.6, 0.26, 0.32, 0.025, 1), darkAccent), 0, 0, 1.82);
    } else if (style.landmark === "watchtower") {
      place(new THREE.Mesh(makeSoftBoxGeometry(1.55, 2.6, 1.55, 0.04, 1), darkAccent), 0, 0, 1.42);
      place(new THREE.Mesh(makeSoftBoxGeometry(2.15, 0.36, 2.15, 0.035, 1), accentMaterial), 0, 0, 2.95);
      for (const sx of [-1, 1]) {
        place(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 8), this.materials.metal), sx * 0.64, 0.64, 3.42);
      }
    } else if (style.landmark === "archive") {
      for (let i = 0; i < 3; i += 1) {
        place(new THREE.Mesh(new THREE.CylinderGeometry(0.82 - i * 0.08, 0.94 - i * 0.08, 0.72, 24), i % 2 ? accentMaterial : darkAccent), 0, 0, 0.42 + i * 0.74);
      }
      place(new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.08, 6, 32), accentMaterial), 0, 0, 1.56).rotation.x = Math.PI / 2;
    } else if (style.landmark === "mast") {
      place(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 4.2, 8), this.materials.timber), 0, 0, 2.1);
      const sailA = place(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.2, 2, 2), accentMaterial), 0.74, 0.02, 2.6);
      sailA.rotation.y = -0.22;
      const deck = place(new THREE.Mesh(makeSoftBoxGeometry(3.0, 0.18, 1.0, 0.025, 1), darkAccent), 0, -0.68, 0.16);
      deck.rotation.y = 0.12;
    } else {
      place(new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 8, 44), accentMaterial), 0, 0, 0.22).rotation.x = Math.PI / 2;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        const pole = place(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.65, 6), this.materials.timber), Math.cos(a) * 1.75, Math.sin(a) * 1.75, 0.92);
        pole.rotation.z = 0.04 * Math.sin(i);
        const flag = place(new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.36, 3, 1), accentMaterial), Math.cos(a) * 1.94, Math.sin(a) * 1.94, 1.55);
        flag.rotation.y = -a;
      }
    }

    group.position.set(cluster.centroid.x + radius * 0.34, y + 0.12, cluster.centroid.z - radius * 0.28);
    group.rotation.y = Math.atan2(cluster.centroid.x, cluster.centroid.z) + 0.35;
    group.scale.setScalar(0.95 + cluster.averageHotness * 0.18);
    this.worldRoot.add(group);
  }

  createMarketDetails(cluster, radius, y) {
    const tentMaterial = new THREE.MeshStandardMaterial({ color: cluster.color, roughness: 0.82, side: THREE.DoubleSide });
    const postGeometry = new THREE.CylinderGeometry(0.06, 0.07, 1.25, 6);
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 + cluster.averageHotness * 1.7;
      const r = radius * (0.58 + (i % 2) * 0.18);
      const x = cluster.centroid.x + Math.cos(angle) * r;
      const z = cluster.centroid.z + Math.sin(angle) * r;
      const baseY = terrainHeight(x, z);
      const tent = new THREE.Group();
      const cloth = new THREE.Mesh(makeGabledRoofGeometry(2.6, 1.65, 0.72), tentMaterial);
      cloth.position.y = 1.22;
      cloth.rotation.y = -angle;
      tent.add(cloth);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const post = new THREE.Mesh(postGeometry, this.materials.timber);
          post.position.set(sx * 1.08, 0.62, sz * 0.62);
          tent.add(post);
        }
      }
      const counter = new THREE.Mesh(makeSoftBoxGeometry(1.7, 0.42, 0.52, 0.025, 1), this.materials.timber);
      counter.position.set(0, 0.36, 0.2);
      tent.add(counter);
      for (let c = 0; c < 3; c += 1) {
        const crate = new THREE.Mesh(makeSoftBoxGeometry(0.38, 0.34, 0.38, 0.018, 1), c % 2 ? this.materials.timber : this.materials.stoneDark);
        crate.position.set(-0.7 + c * 0.55, 0.24, -0.54);
        crate.rotation.y = c * 0.4;
        tent.add(crate);
      }
      tent.position.set(x, baseY + 0.08, z);
      tent.rotation.y = angle + Math.PI / 2;
      tent.scale.setScalar(0.82 + cluster.averageHotness * 0.34);
      this.worldRoot.add(tent);
    }

    const bannerCount = 4 + Math.round(cluster.averageHotness * 5);
    for (let i = 0; i < bannerCount; i += 1) {
      const angle = (i / bannerCount) * Math.PI * 2;
      const x = cluster.centroid.x + Math.cos(angle) * (radius + 1.4);
      const z = cluster.centroid.z + Math.sin(angle) * (radius + 1.4);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.1, 6), this.materials.timber);
      pole.position.set(x, terrainHeight(x, z) + 1.05, z);
      this.worldRoot.add(pole);

      const marker = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42, 3, 1), new THREE.MeshStandardMaterial({ color: cluster.color, roughness: 0.7, side: THREE.DoubleSide }));
      marker.position.set(x + Math.cos(angle + Math.PI / 2) * 0.34, terrainHeight(x, z) + 1.62, z + Math.sin(angle + Math.PI / 2) * 0.34);
      marker.rotation.y = -angle;
      this.worldRoot.add(marker);
    }
  }

  createRoads() {
    const clustersById = new Map(this.worldData.clusters.map((cluster) => [cluster.id, cluster]));
    this.roadStats = createRoadStats(this.worldData.repos.length);
    const clusterLinks = [
      ["ai", "frontend"],
      ["frontend", "infra"],
      ["infra", "database"],
      ["database", "mobile"],
      ["mobile", "game"],
      ["game", "ai"],
      ["ai", "database"],
      ["frontend", "game"]
    ];

    for (const [fromId, toId] of clusterLinks) {
      const from = clustersById.get(fromId);
      const to = clustersById.get(toId);
      if (!from || !to) continue;
      const fromStyle = getTopicStyle(from.id);
      const toStyle = getTopicStyle(to.id);
      const roadTint = new THREE.Color(fromStyle.roadTint).lerp(new THREE.Color(toStyle.roadTint), 0.5).getStyle();
      const edgeTint = new THREE.Color(fromStyle.edgeTint).lerp(new THREE.Color(toStyle.edgeTint), 0.5).getStyle();
      const angle = Math.atan2(to.centroid.z - from.centroid.z, to.centroid.x - from.centroid.x);
      const start = lanePoint(from, angle + Math.sin(from.centroid.x * 0.02) * 0.1, clusterPlazaRadius(from) + 5, 0.045);
      const end = lanePoint(to, angle + Math.PI + Math.cos(to.centroid.z * 0.02) * 0.1, clusterPlazaRadius(to) + 5, 0.045);
      const offset = (from.averageHotness - to.averageHotness) * 18 + Math.sin((from.centroid.x + to.centroid.z) * 0.037) * 10;
      const road = this.createRoadMesh(
        [
          start,
          bendBetween(start, end, 0.32, offset + 8, 0.045),
          bendBetween(start, end, 0.68, -offset * 0.55 - 5, 0.045),
          end
        ],
        0.65 + (from.averageHotness + to.averageHotness) * 0.35,
        this.materials.road,
        72,
        { color: roadTint, edgeColor: edgeTint }
      );
      this.roads.push(road);
      this.worldRoot.add(road);
      this.roadStats.interDistrict += 1;
    }

    const landmarkSpurIds = new Set();
    for (const cluster of clustersById.values()) {
      const candidates = this.worldData.repos
        .filter((repo) => repo.topic === cluster.id)
        .sort((a, b) => repoRoadScore(b) - repoRoadScore(a));
      const chosen = candidates
        .filter((repo) => repo.buildingType === "castle")
        .slice(0, ROAD_NETWORK_LIMITS.landmarkSpursPerCluster);
      for (const repo of candidates) {
        if (chosen.length >= ROAD_NETWORK_LIMITS.landmarkSpursPerCluster) break;
        if (!chosen.includes(repo)) chosen.push(repo);
      }
      chosen.forEach((repo) => landmarkSpurIds.add(repo.id));
    }

    for (const repo of this.worldData.repos) {
      const cluster = clustersById.get(repo.topic);
      if (!cluster) continue;
      if (!landmarkSpurIds.has(repo.id)) continue;
      const angle = Math.atan2(repo.position.z - cluster.centroid.z, repo.position.x - cluster.centroid.x);
      const distance = Math.hypot(repo.position.x - cluster.centroid.x, repo.position.z - cluster.centroid.z);
      const side = (repo.topicOrdinal ?? 0) % 2 ? 1 : -1;
      const start = lanePoint(
        cluster,
        angle + side * (0.1 + Math.sin((repo.topicOrdinal ?? 0) * 1.37) * 0.08),
        clusterPlazaRadius(cluster) * (0.58 + ((repo.topicOrdinal ?? 0) % 3) * 0.1),
        0.05
      );
      const end = pathPoint(repo.position.x, repo.position.z, 0.05);
      const bendA = side * clamp(distance * 0.12, 2.2, 7.2);
      const bendB = -side * clamp(distance * 0.08, 1.5, 5.2);
      const road = this.createRoadMesh(
        [
          start,
          bendBetween(start, end, 0.32, bendA, 0.05),
          bendBetween(start, end, 0.68, bendB, 0.05),
          end
        ],
        0.16 + repo.hotness * 0.14 + (repo.buildingType === "castle" ? 0.08 : 0),
        this.materials.road,
        repo.buildingType === "castle" ? 56 : 44,
        { color: getTopicStyle(repo.topic).roadTint, edgeColor: getTopicStyle(repo.topic).edgeTint }
      );
      this.roads.push(road);
      this.worldRoot.add(road);
      this.roadStats.landmarkSpurs += 1;
    }

    this.createCityRoads(clustersById);
  }

  createCityRoads(clustersById) {
    const cityPaths = [];

    for (const cluster of clustersById.values()) {
      const style = getTopicStyle(cluster.id);
      const repos = this.worldData.repos
        .filter((repo) => repo.topic === cluster.id)
        .sort((a, b) => repoRoadScore(b) - repoRoadScore(a));
      if (repos.length < 3) continue;

      const clusterStats = {
        repoCount: repos.length,
        plazaLoops: 0,
        radialLanes: 0,
        crossLanes: 0
      };
      const plazaRadius = clusterPlazaRadius(cluster) + 4.6;
      const ringPoints = [];
      const ringSegments = 10;
      const ringPhase = cluster.averageHotness * 0.7;
      for (let i = 0; i <= ringSegments; i += 1) {
        ringPoints.push(lanePoint(cluster, ringPhase + (i / ringSegments) * Math.PI * 2, plazaRadius, 0.05));
      }

      cityPaths.push({
        width: 0.18 + cluster.averageHotness * 0.05,
        segments: 42,
        color: localRoadColor(style, 0.24),
        edgeColor: localRoadEdgeColor(style, 0.24),
        points: ringPoints
      });
      clusterStats.plazaLoops += 1;

      const sectorBuckets = Array.from({ length: ROAD_NETWORK_LIMITS.localSectorCount }, () => []);
      for (const repo of repos) {
        const score = repoRoadScore(repo);
        if (repo.detailLevel !== "full" && score < 0.58 && (repo.topicOrdinal ?? 99) >= 20) continue;
        const sector = Math.floor((repoAngleFromCluster(repo, cluster) / (Math.PI * 2)) * ROAD_NETWORK_LIMITS.localSectorCount) % ROAD_NETWORK_LIMITS.localSectorCount;
        sectorBuckets[sector].push(repo);
      }

      const crossAnchors = [];
      sectorBuckets.forEach((bucket, sector) => {
        if (!bucket.length) return;
        const sectorAngle = ((sector + 0.5) / ROAD_NETWORK_LIMITS.localSectorCount) * Math.PI * 2;
        const selected = bucket
          .sort((a, b) => repoDistanceFromCluster(a, cluster) - repoDistanceFromCluster(b, cluster))
          .slice(0, ROAD_NETWORK_LIMITS.localReposPerSector)
          .sort((a, b) => repoDistanceFromCluster(a, cluster) - repoDistanceFromCluster(b, cluster));
        if (!selected.length) return;

        const points = [
          lanePoint(cluster, sectorAngle, plazaRadius * 0.7, 0.05),
          ...selected.map((repo) => pathPoint(repo.position.x, repo.position.z, 0.05))
        ];
        const laneWeight = selected.reduce((total, repo) => total + repoRoadScore(repo), 0) / selected.length;
        cityPaths.push({
          width: 0.1 + Math.min(0.08, laneWeight * 0.04),
          segments: 16 + selected.length * 4,
          color: localRoadColor(style, 0.2),
          edgeColor: localRoadEdgeColor(style, 0.22),
          points
        });
        clusterStats.radialLanes += 1;
        crossAnchors.push({
          repo: selected[selected.length - 1],
          angle: sectorAngle
        });
      });

      crossAnchors.sort((a, b) => a.angle - b.angle);
      for (let i = 0; i < crossAnchors.length && clusterStats.crossLanes < ROAD_NETWORK_LIMITS.maxCrossLanesPerCluster; i += 1) {
        const from = crossAnchors[i].repo;
        const to = crossAnchors[(i + 1) % crossAnchors.length]?.repo;
        if (!from || !to || from.id === to.id) continue;
        const distance = Math.hypot(to.position.x - from.position.x, to.position.z - from.position.z);
        if (distance > 86) continue;
        const relation = repoRelationStrength(from, to);
        if (relation < 0.18 && clusterStats.crossLanes >= 3) continue;
        const fromPoint = pathPoint(from.position.x, from.position.z, 0.05);
        const toPoint = pathPoint(to.position.x, to.position.z, 0.05);
        const side = i % 2 ? 1 : -1;
        const bend = side * clamp(distance * 0.08, 1.2, 4.2);
        cityPaths.push({
          width: 0.085 + Math.min(0.045, relation * 0.035),
          segments: 14,
          color: localRoadColor(style, 0.18),
          edgeColor: localRoadEdgeColor(style, 0.2),
          points: [
            fromPoint,
            bendBetween(fromPoint, toPoint, 0.5, bend, 0.05),
            toPoint
          ]
        });
        clusterStats.crossLanes += 1;
      }

      this.roadStats.plazaLoops += clusterStats.plazaLoops;
      this.roadStats.radialLanes += clusterStats.radialLanes;
      this.roadStats.crossLanes += clusterStats.crossLanes;
      this.roadStats.maxCityPathsPerCluster = Math.max(
        this.roadStats.maxCityPathsPerCluster,
        clusterStats.plazaLoops + clusterStats.radialLanes + clusterStats.crossLanes
      );
      this.roadStats.roadsByCluster[cluster.id] = clusterStats;
    }

    if (!cityPaths.length) return;
    this.cityRoadCount = cityPaths.length;
    this.roadStats.cityRoadCount = cityPaths.length;
    const edgeGeometries = [];
    const topGeometries = [];
    for (const path of cityPaths) {
      const edgePad = clamp(path.width * 0.45, 0.05, 0.12);
      edgeGeometries.push(this.createRoadRibbonGeometry(path.points, path.width + edgePad, 0.068, path.segments ?? 20, path.edgeColor));
      topGeometries.push(this.createRoadRibbonGeometry(path.points, path.width, 0.095, path.segments ?? 20, path.color));
    }
    const group = new THREE.Group();
    const edge = new THREE.Mesh(mergeGeometries(edgeGeometries, false), this.materials.roadEdge);
    const top = new THREE.Mesh(mergeGeometries(topGeometries, false), this.materials.road);
    edge.receiveShadow = true;
    top.receiveShadow = true;
    group.name = "district-hierarchical-road-network";
    group.userData.roadTier = "local";
    group.add(edge, top);
    this.cityRoads.push(group);
    this.worldRoot.add(group);
  }

  createRoadRibbonGeometry(points, ribbonWidth, yOffset = 0.1, segments = 24, color = "#ffffff") {
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getSpacedPoints(segments);
    const vertices = [];
    const uvs = [];
    const colors = [];
    const indices = [];
    const ribbonColor = color instanceof THREE.Color ? color : new THREE.Color(color);

    for (let i = 0; i < curvePoints.length; i += 1) {
      const current = curvePoints[i];
      const prev = curvePoints[Math.max(0, i - 1)];
      const next = curvePoints[Math.min(curvePoints.length - 1, i + 1)];
      const tangent = new THREE.Vector3(next.x - prev.x, 0, next.z - prev.z).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const y = terrainHeight(current.x, current.z) + yOffset;
      const widthNoise = 0.92 + Math.sin(current.x * 0.31 + current.z * 0.17 + i * 0.9) * 0.06 + Math.sin(i * 2.17) * 0.025;
      const left = new THREE.Vector3(current.x, y, current.z).addScaledVector(normal, ribbonWidth * widthNoise);
      const right = new THREE.Vector3(current.x, y, current.z).addScaledVector(normal, -ribbonWidth * widthNoise);
      vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
      uvs.push(i / curvePoints.length, 0, i / curvePoints.length, 1);
      colors.push(ribbonColor.r, ribbonColor.g, ribbonColor.b, ribbonColor.r, ribbonColor.g, ribbonColor.b);
      if (i < curvePoints.length - 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  createRoadMesh(points, width, material, segments = 56, options = {}) {
    const curve = new THREE.CatmullRomCurve3(points);
    const roadColor = options.color ?? "#ffffff";
    const edgeColor = options.edgeColor ?? "#ffffff";
    const makeRibbon = (ribbonWidth, ribbonMaterial, yOffset = 0.1, segments = 72, color = "#ffffff") => {
      const curvePoints = curve.getSpacedPoints(segments);
      const vertices = [];
      const uvs = [];
      const colors = [];
      const indices = [];
      const ribbonColor = color instanceof THREE.Color ? color : new THREE.Color(color);

      for (let i = 0; i < curvePoints.length; i += 1) {
        const current = curvePoints[i];
        const prev = curvePoints[Math.max(0, i - 1)];
        const next = curvePoints[Math.min(curvePoints.length - 1, i + 1)];
        const tangent = new THREE.Vector3(next.x - prev.x, 0, next.z - prev.z).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
        const y = terrainHeight(current.x, current.z) + yOffset;
        const widthNoise = 0.92 + Math.sin(current.x * 0.31 + current.z * 0.17 + i * 0.9) * 0.07 + Math.sin(i * 2.17) * 0.035;
        const leftWidth = ribbonWidth * widthNoise * (0.98 + Math.sin(i * 1.31) * 0.035);
        const rightWidth = ribbonWidth * widthNoise * (0.98 + Math.cos(i * 1.47) * 0.035);
        const left = new THREE.Vector3(current.x, y, current.z).addScaledVector(normal, leftWidth);
        const right = new THREE.Vector3(current.x, y, current.z).addScaledVector(normal, -rightWidth);
        vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
        uvs.push(i / curvePoints.length, 0, i / curvePoints.length, 1);
        colors.push(ribbonColor.r, ribbonColor.g, ribbonColor.b, ribbonColor.r, ribbonColor.g, ribbonColor.b);
        if (i < curvePoints.length - 1) {
          const a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, ribbonMaterial);
      mesh.receiveShadow = true;
      return mesh;
    };

    if (options.singleRibbon) {
      const ribbon = makeRibbon(width, material, options.yOffset ?? 0.08, segments, roadColor);
      ribbon.name = options.name ?? "single-ribbon";
      return ribbon;
    }

    if (material === this.materials.water) {
      const water = makeRibbon(width, material, 0.11, 96, "#ffffff");
      water.name = "river-ribbon";
      return water;
    }

    const group = new THREE.Group();
    const edgePad = clamp(width * 0.45, 0.08, 0.28);
    const edge = makeRibbon(width + edgePad, this.materials.roadEdge, 0.075, segments, edgeColor);
    const top = makeRibbon(width + 0.03, material, 0.105, segments, roadColor);
    group.add(edge, top);
    return group;
  }

  createBuildings() {
    const sorted = [...this.worldData.repos].sort((a, b) => a.influence - b.influence);
    const outposts = [];
    for (const repo of sorted) {
      if (repo.detailLevel === "outpost") {
        outposts.push(repo);
        continue;
      }

      const building =
        repo.buildingType === "castle"
          ? this.createCastle(repo)
          : repo.buildingType === "guildhall"
            ? this.createGuildhall(repo)
            : this.createHouse(repo);
      const y = terrainHeight(repo.position.x, repo.position.z);
      this.worldRoot.add(this.createDirtPatch(repo.position.x, y + 0.025, repo.position.z, 4.2 + repo.influence * 6.8));
      this.worldRoot.add(this.createContactShadow(repo.position.x, y + 0.03, repo.position.z, 3.4 + repo.influence * 6));
      building.position.set(repo.position.x, y, repo.position.z);
      const cluster = this.worldData.clusters.find((item) => item.id === repo.topic);
      if (cluster) {
        building.rotation.y = Math.atan2(cluster.centroid.x - repo.position.x, cluster.centroid.z - repo.position.z);
      }
      building.userData.repo = repo;
      this.worldRoot.add(building);

      if (repo.hotness > 0.52) {
        const glow = new THREE.Mesh(
          new THREE.CircleGeometry(4.5 + repo.hotness * 5, 42),
          new THREE.MeshBasicMaterial({
            color: "#ffd36a",
            transparent: true,
            opacity: 0.12 + repo.hotness * 0.16,
            depthWrite: false
          })
        );
        glow.rotation.x = -Math.PI / 2;
        glow.position.set(repo.position.x, y + 0.12, repo.position.z);
        this.worldRoot.add(glow);
      }
    }

    this.createOutpostBuildings(outposts);
  }

  createOutpostBuildings(repos) {
    if (!repos.length) return;

    const bodyGeo = makeSoftBoxGeometry(1, 1, 1, 0.025, 1);
    const roofGeo = makeGabledRoofGeometry(1, 1, 0.55);
    const shadowGeo = new THREE.CircleGeometry(1, 18);
    const dirtGeo = new THREE.CircleGeometry(1, 18);
    const bodies = new THREE.InstancedMesh(bodyGeo, this.materials.plaster, repos.length);
    const roofs = new THREE.InstancedMesh(roofGeo, this.materials.roof, repos.length);
    const shadows = new THREE.InstancedMesh(shadowGeo, this.materials.shadow, repos.length);
    const dirt = new THREE.InstancedMesh(dirtGeo, this.materials.dirtPatch, repos.length);
    const temp = new THREE.Object3D();
    const neutralRoof = new THREE.Color("#6b5748");

    repos.forEach((repo, index) => {
      const style = getTopicStyle(repo.topic);
      const y = terrainHeight(repo.position.x, repo.position.z);
      const cluster = this.worldData.clusters.find((item) => item.id === repo.topic);
      const angle = cluster ? Math.atan2(cluster.centroid.x - repo.position.x, cluster.centroid.z - repo.position.z) : repo.hotness * Math.PI;
      const width = (1.2 + repo.influence * 2.0 + repo.hotness * 0.45) * style.widthScale;
      const depth = (1.05 + repo.influence * 1.45) * style.depthScale;
      const height = (1.25 + repo.influence * 2.5 + repo.hotness * 0.7) * style.heightScale;
      const roofHeight = (0.75 + repo.influence * 0.65) * style.roofPitch;

      temp.position.set(repo.position.x, y + height / 2 + 0.16, repo.position.z);
      temp.rotation.set(0, angle, 0);
      temp.scale.set(width, height, depth);
      temp.updateMatrix();
      bodies.setMatrixAt(index, temp.matrix);
      bodies.setColorAt(index, new THREE.Color(style.wallTint).lerp(new THREE.Color("#d7c8a9"), 0.56));

      temp.position.set(repo.position.x, y + height + 0.16, repo.position.z);
      temp.rotation.set(0, angle, 0);
      temp.scale.set(width * 1.18, roofHeight, depth * 1.18);
      temp.updateMatrix();
      roofs.setMatrixAt(index, temp.matrix);
      roofs.setColorAt(index, new THREE.Color(repo.roofColor).lerp(neutralRoof, 0.16).lerp(new THREE.Color(style.roofTint ?? style.wallTint), 0.32));

      temp.position.set(repo.position.x, y + 0.05, repo.position.z);
      temp.rotation.set(-Math.PI / 2, 0, angle);
      temp.scale.set(2.2 + repo.influence * 2.4, 1.35 + repo.influence * 1.5, 1);
      temp.updateMatrix();
      shadows.setMatrixAt(index, temp.matrix);

      temp.position.set(repo.position.x, y + 0.04, repo.position.z);
      temp.scale.set(2.8 + repo.influence * 2.8, 1.8 + repo.hotness * 1.6, 1);
      temp.updateMatrix();
      dirt.setMatrixAt(index, temp.matrix);
    });

    bodies.instanceColor.needsUpdate = true;
    roofs.instanceColor.needsUpdate = true;
    bodies.castShadow = true;
    bodies.receiveShadow = true;
    roofs.castShadow = true;
    roofs.receiveShadow = true;
    bodies.userData.instanceRepos = repos;
    roofs.userData.instanceRepos = repos;
    this.interactiveMeshes.push(bodies, roofs);
    this.worldRoot.add(dirt, shadows, bodies, roofs);
    this.createOutpostTopicAccents(repos);
  }

  createOutpostTopicAccents(repos) {
    const byTopic = new Map();
    for (const repo of repos) {
      if (!byTopic.has(repo.topic)) byTopic.set(repo.topic, []);
      byTopic.get(repo.topic).push(repo);
    }

    const temp = new THREE.Object3D();
    for (const [topic, topicRepos] of byTopic) {
      const style = getTopicStyle(topic);
      const material = new THREE.MeshStandardMaterial({
        color: style.accentTint,
        roughness: 0.78,
        side: THREE.DoubleSide,
        vertexColors: true
      });
      const geometry =
        topic === "ai"
          ? new THREE.CylinderGeometry(0.05, 0.07, 1.35, 6)
          : topic === "database"
            ? new THREE.CylinderGeometry(0.28, 0.34, 0.96, 12)
            : topic === "game"
              ? new THREE.TorusGeometry(0.34, 0.06, 6, 18)
              : makeSoftBoxGeometry(1, 1, 1, 0.018, 1);
      const mesh = new THREE.InstancedMesh(geometry, material, topicRepos.length);
      const cluster = this.worldData.clusters.find((item) => item.id === topic);

      topicRepos.forEach((repo, index) => {
        const y = terrainHeight(repo.position.x, repo.position.z);
        const angle = cluster ? Math.atan2(cluster.centroid.x - repo.position.x, cluster.centroid.z - repo.position.z) : repo.hotness * Math.PI;
        const width = (1.2 + repo.influence * 2.0 + repo.hotness * 0.45) * style.widthScale;
        const depth = (1.05 + repo.influence * 1.45) * style.depthScale;
        const height = (1.25 + repo.influence * 2.5 + repo.hotness * 0.7) * style.heightScale;
        const sideX = Math.sin(angle + Math.PI / 2) * width * 0.45;
        const sideZ = Math.cos(angle + Math.PI / 2) * depth * 0.45;

        if (topic === "ai") {
          temp.position.set(repo.position.x + sideX * 0.35, y + height + 0.95, repo.position.z + sideZ * 0.35);
          temp.rotation.set(0, angle, 0);
          temp.scale.set(1, 1.1 + repo.hotness * 0.8, 1);
        } else if (topic === "frontend") {
          temp.position.set(repo.position.x + Math.sin(angle) * depth * 0.24, y + height + 0.24, repo.position.z + Math.cos(angle) * depth * 0.24);
          temp.rotation.set(0, angle, 0);
          temp.scale.set(width * 0.72, 0.16, depth * 0.3);
        } else if (topic === "infra") {
          temp.position.set(repo.position.x - sideX * 0.25, y + height + 0.18, repo.position.z - sideZ * 0.25);
          temp.rotation.set(0, angle, 0);
          temp.scale.set(width * 0.28, 0.28, depth * 0.28);
        } else if (topic === "database") {
          temp.position.set(repo.position.x + sideX * 0.78, y + height * 0.48, repo.position.z + sideZ * 0.78);
          temp.rotation.set(0, angle, 0);
          temp.scale.setScalar(0.88 + repo.influence * 0.35);
        } else if (topic === "mobile") {
          temp.position.set(repo.position.x, y + height + 0.18, repo.position.z);
          temp.rotation.set(0, angle, 0);
          temp.scale.set(width * 0.78, 0.08, depth * 0.45);
        } else {
          temp.position.set(repo.position.x + sideX * 0.4, y + height + 0.58, repo.position.z + sideZ * 0.4);
          temp.rotation.set(Math.PI / 2, angle, 0);
          temp.scale.setScalar(0.9);
        }
        temp.updateMatrix();
        mesh.setMatrixAt(index, temp.matrix);
        mesh.setColorAt(index, new THREE.Color(style.accentTint).lerp(new THREE.Color(style.boundaryTint), index % 2 ? 0.2 : 0.05));
      });

      mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.worldRoot.add(mesh);
    }
  }

  createDistrictUrbanDetails() {
    const boundaryPosts = [];
    const boundaryRails = [];
    const lamps = [];
    const lots = [];
    const crates = [];

    for (const cluster of this.worldData.clusters) {
      const style = getTopicStyle(cluster.id);
      const repos = this.worldData.repos.filter((repo) => repo.topic === cluster.id);
      if (!repos.length) continue;
      const plazaRadius = 9 + Math.sqrt(cluster.repoCount) * 2.4 + cluster.averageHotness * 4.5;
      const cityRadius = getDistrictTerritory(cluster, repos, this.worldData.clusters).radius + 8.5;
      const postCount = Math.min(34, Math.max(20, Math.round(cityRadius / 4.8)));
      const boundaryColor = new THREE.Color(style.boundaryTint).lerp(new THREE.Color(style.groundWash), 0.45).getStyle();

      for (let i = 0; i < postCount; i += 1) {
        if (i % 6 === 0) continue;
        const angle = (i / postCount) * Math.PI * 2 + Math.sin(i * 1.71 + cluster.centroid.x * 0.02) * 0.045;
        const nextAngle = ((i + 1) / postCount) * Math.PI * 2 + Math.sin((i + 1) * 1.71 + cluster.centroid.x * 0.02) * 0.045;
        const radius = cityRadius + Math.sin(i * 1.37 + cluster.centroid.z * 0.03) * 2.6;
        const nextRadius = cityRadius + Math.sin((i + 1) * 1.37 + cluster.centroid.z * 0.03) * 2.6;
        const x = cluster.centroid.x + Math.cos(angle) * radius;
        const z = cluster.centroid.z + Math.sin(angle) * radius;
        boundaryPosts.push({ x, z, angle, color: boundaryColor });

        if ((i + 1) % 6 !== 0) {
          const nextX = cluster.centroid.x + Math.cos(nextAngle) * nextRadius;
          const nextZ = cluster.centroid.z + Math.sin(nextAngle) * nextRadius;
          boundaryRails.push({
            x: (x + nextX) / 2,
            z: (z + nextZ) / 2,
            angle: Math.atan2(-(nextZ - z), nextX - x),
            length: Math.min(7, Math.hypot(nextX - x, nextZ - z) * 0.32),
            color: new THREE.Color(style.hedgeA).lerp(new THREE.Color(style.groundWash), 0.35).getStyle()
          });
        }
      }

      const lampCount = 5 + Math.round(cluster.averageHotness * 5);
      for (let i = 0; i < lampCount; i += 1) {
        const angle = (i / lampCount) * Math.PI * 2 + 0.18 + Math.sin(i * 2.13 + cluster.centroid.x) * 0.08;
        const radius = lerp(plazaRadius + 4.2, cityRadius - 3.6, i % 2 ? 0.42 : 0.68) + Math.cos(i * 1.83 + cluster.centroid.z) * 1.2;
        lamps.push({
          x: cluster.centroid.x + Math.cos(angle) * radius,
          z: cluster.centroid.z + Math.sin(angle) * radius,
          scale: 0.9 + cluster.averageHotness * 0.35
        });
      }

      for (const repo of repos) {
        const toCenter = Math.atan2(cluster.centroid.x - repo.position.x, cluster.centroid.z - repo.position.z) + Math.sin((repo.topicOrdinal ?? 0) * 1.17) * 0.14;
        const lotOffset = repo.buildingType === "castle" ? 8.6 + repo.influence * 5.8 : 3.4 + repo.influence * 3.4;
        const tangentOffset = Math.sin((repo.topicOrdinal ?? 0) * 2.11 + repo.hotness) * (repo.buildingType === "castle" ? 1.8 : 1.1);
        const lotX = repo.position.x + Math.sin(toCenter) * lotOffset + Math.cos(toCenter) * tangentOffset;
        const lotZ = repo.position.z + Math.cos(toCenter) * lotOffset - Math.sin(toCenter) * tangentOffset;
        lots.push({
          x: lotX,
          z: lotZ,
          angle: toCenter,
          sx: (repo.buildingType === "castle" ? 3.8 : 1.4 + repo.influence * 1.6) * style.widthScale,
          sz: (repo.buildingType === "castle" ? 1.8 : 0.75 + repo.hotness * 1.1) * style.depthScale,
          color: new THREE.Color(style.lotTint).lerp(new THREE.Color(repo.topicColor), repo.buildingType === "castle" ? 0.12 : 0.22).getStyle()
        });
        if (repo.buildingType !== "castle") {
          crates.push({ x: lotX + Math.sin(toCenter + 0.9) * 0.85, z: lotZ + Math.cos(toCenter + 0.9) * 0.85, angle: toCenter + 0.3, color: style.crateTint });
          if (repo.hotness > 0.34) crates.push({ x: lotX + Math.sin(toCenter - 0.8) * 1.05, z: lotZ + Math.cos(toCenter - 0.8) * 1.05, angle: toCenter - 0.4, color: style.crateTint });
        }
      }
    }

    const temp = new THREE.Object3D();
    const postGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.72, 6);
    const railGeo = makeSoftBoxGeometry(1, 0.18, 0.16, 0.018, 1);
    const lampPostGeo = new THREE.CylinderGeometry(0.045, 0.06, 1.65, 6);
    const lampGlowGeo = new THREE.SphereGeometry(0.14, 8, 6);
    const lotGeo = new THREE.CircleGeometry(1, 24);
    const crateGeo = makeSoftBoxGeometry(0.42, 0.36, 0.42, 0.018, 1);

    if (boundaryPosts.length) {
      const postMaterial = this.materials.stoneDark.clone();
      postMaterial.vertexColors = true;
      postMaterial.transparent = true;
      postMaterial.opacity = 0.62;
      const posts = new THREE.InstancedMesh(postGeo, postMaterial, boundaryPosts.length);
      boundaryPosts.forEach((record, index) => {
        const y = terrainHeight(record.x, record.z);
        temp.position.set(record.x, y + 0.36, record.z);
        temp.rotation.set(0, record.angle, 0);
        temp.scale.setScalar(1);
        temp.updateMatrix();
        posts.setMatrixAt(index, temp.matrix);
        posts.setColorAt(index, new THREE.Color(record.color));
      });
      posts.instanceColor.needsUpdate = true;
      posts.castShadow = true;
      this.worldRoot.add(posts);
    }

    if (boundaryRails.length) {
      const railMaterial = this.materials.timber.clone();
      railMaterial.vertexColors = true;
      railMaterial.transparent = true;
      railMaterial.opacity = 0.42;
      const rails = new THREE.InstancedMesh(railGeo, railMaterial, boundaryRails.length);
      boundaryRails.forEach((record, index) => {
        const y = terrainHeight(record.x, record.z);
        temp.position.set(record.x, y + 0.48, record.z);
        temp.rotation.set(0, record.angle, 0);
        temp.scale.set(record.length, 1, 1);
        temp.updateMatrix();
        rails.setMatrixAt(index, temp.matrix);
        rails.setColorAt(index, new THREE.Color(record.color));
      });
      rails.instanceColor.needsUpdate = true;
      rails.castShadow = true;
      this.worldRoot.add(rails);
    }

    if (lamps.length) {
      const lampPosts = new THREE.InstancedMesh(lampPostGeo, this.materials.timber, lamps.length);
      const lampGlow = new THREE.InstancedMesh(lampGlowGeo, this.materials.lantern, lamps.length);
      lamps.forEach((record, index) => {
        const y = terrainHeight(record.x, record.z);
        temp.position.set(record.x, y + 0.82 * record.scale, record.z);
        temp.rotation.set(0, 0, 0);
        temp.scale.setScalar(record.scale);
        temp.updateMatrix();
        lampPosts.setMatrixAt(index, temp.matrix);

        temp.position.set(record.x, y + 1.72 * record.scale, record.z);
        temp.scale.setScalar(record.scale);
        temp.updateMatrix();
        lampGlow.setMatrixAt(index, temp.matrix);
      });
      lampPosts.castShadow = true;
      this.worldRoot.add(lampPosts, lampGlow);
    }

    if (lots.length) {
      const lotPatches = new THREE.InstancedMesh(lotGeo, this.materials.groundPatch, lots.length);
      lots.forEach((record, index) => {
        const y = terrainHeight(record.x, record.z);
        temp.position.set(record.x, y + 0.055, record.z);
        temp.rotation.set(-Math.PI / 2, 0, record.angle);
        temp.scale.set(record.sx, record.sz, 1);
        temp.updateMatrix();
        lotPatches.setMatrixAt(index, temp.matrix);
        lotPatches.setColorAt(index, new THREE.Color(record.color).lerp(new THREE.Color("#8b633d"), 0.26));
      });
      lotPatches.instanceColor.needsUpdate = true;
      this.worldRoot.add(lotPatches);
    }

    if (crates.length) {
      const crateMaterial = this.materials.timber.clone();
      crateMaterial.vertexColors = true;
      const crateMesh = new THREE.InstancedMesh(crateGeo, crateMaterial, crates.length);
      crates.forEach((record, index) => {
        const y = terrainHeight(record.x, record.z);
        temp.position.set(record.x, y + 0.18, record.z);
        temp.rotation.set(0, record.angle, 0);
        temp.scale.setScalar(0.85 + (index % 3) * 0.12);
        temp.updateMatrix();
        crateMesh.setMatrixAt(index, temp.matrix);
        crateMesh.setColorAt(index, new THREE.Color(record.color));
      });
      crateMesh.instanceColor.needsUpdate = true;
      crateMesh.castShadow = true;
      this.worldRoot.add(crateMesh);
    }
  }

  createAgriculturalBelts() {
    const fields = [];
    const hedges = [];
    const palette = ["#a8a064", "#879a59", "#ad8f5b", "#78915a", "#b4aa6f"];

    for (const cluster of this.worldData.clusters) {
      const style = getTopicStyle(cluster.id);
      const repos = this.worldData.repos.filter((repo) => repo.topic === cluster.id);
      if (!repos.length) continue;
      const cityRadius = getDistrictTerritory(cluster, repos, this.worldData.clusters).radius + 11;
      const outward = Math.atan2(cluster.centroid.z, cluster.centroid.x);
      const fieldCount = 7 + Math.round(cluster.averageHotness * 5);

      for (let i = 0; i < fieldCount; i += 1) {
        const angle = outward + (i - fieldCount / 2) * 0.22 + ((i * 13) % 7 - 3) * 0.025;
        const radial = cityRadius + 10 + (i % 4) * 5.5 + Math.floor(i / 4) * 4;
        const x = clamp(cluster.centroid.x + Math.cos(angle) * radial, -276, 276);
        const z = clamp(cluster.centroid.z + Math.sin(angle) * radial, -276, 276);
        const length = 8.5 + (i % 5) * 1.8 + cluster.averageHotness * 4.5;
        const width = 3.0 + (i % 4) * 0.75;
        const fieldAngle = angle + Math.PI / 2 + ((i * 7) % 5 - 2) * 0.08;
        const color = new THREE.Color(palette[(i + cluster.id.length) % palette.length])
          .lerp(new THREE.Color(style.fieldTint), 0.45)
          .lerp(new THREE.Color(cluster.color), 0.08);
        fields.push({ x, z, angle: fieldAngle, length, width, color });
        const normalAngle = fieldAngle + Math.PI / 2;
        for (const side of [-1, 1]) {
          hedges.push({
            x: x + Math.cos(normalAngle) * side * width * 0.58,
            z: z + Math.sin(normalAngle) * side * width * 0.58,
            angle: fieldAngle,
            length: length * 0.92,
            topic: cluster.id
          });
        }

      }
    }

    if (!fields.length) return;

    const temp = new THREE.Object3D();
    const fieldGeo = new THREE.PlaneGeometry(1, 1, 4, 2);
    const fieldMesh = new THREE.InstancedMesh(fieldGeo, this.materials.fieldPatch, fields.length);
    fields.forEach((field, index) => {
      const y = terrainHeight(field.x, field.z);
      temp.position.set(field.x, y + 0.065, field.z);
      temp.rotation.set(-Math.PI / 2, 0, field.angle);
      temp.scale.set(field.length, field.width, 1);
      temp.updateMatrix();
      fieldMesh.setMatrixAt(index, temp.matrix);
      fieldMesh.setColorAt(index, field.color);
    });
    fieldMesh.instanceColor.needsUpdate = true;
    this.worldRoot.add(fieldMesh);

    if (hedges.length) {
      const hedgeGeo = makeSoftBoxGeometry(1, 0.16, 0.18, 0.018, 1);
      const hedgeMesh = new THREE.InstancedMesh(hedgeGeo, this.materials.bush, hedges.length);
      hedges.forEach((hedge, index) => {
        const y = terrainHeight(hedge.x, hedge.z);
        temp.position.set(hedge.x, y + 0.11, hedge.z);
        temp.rotation.set(0, hedge.angle, 0);
        temp.scale.set(hedge.length, 1, 1);
        temp.updateMatrix();
        hedgeMesh.setMatrixAt(index, temp.matrix);
        const style = getTopicStyle(hedge.topic);
        hedgeMesh.setColorAt(index, new THREE.Color(index % 2 ? style.hedgeA : style.hedgeB));
      });
      hedgeMesh.instanceColor.needsUpdate = true;
      hedgeMesh.castShadow = true;
      this.worldRoot.add(hedgeMesh);
    }
  }

  createContactShadow(x, y, z, radius) {
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(radius, 36), this.materials.shadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, y, z);
    shadow.scale.z = 0.66;
    return shadow;
  }

  createDirtPatch(x, y, z, radius) {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(radius, 36), this.materials.dirtPatch);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = (x + z) * 0.013;
    patch.position.set(x, y, z);
    patch.scale.set(1, 0.72, 1);
    return patch;
  }

  addFacadeOverlay(group, width, height, depth, baseY, material, centerX = 0, centerZ = 0) {
    const y = baseY + height / 2;
    const frontBackGeo = makeFacadeGeometry(width, height, Math.max(1, width / 2.35), Math.max(1, height / 1.55));
    const sideGeo = makeFacadeGeometry(depth, height, Math.max(1, depth / 2.35), Math.max(1, height / 1.55));
    const offset = 0.072;

    const front = new THREE.Mesh(frontBackGeo, material);
    front.position.set(centerX, y, centerZ + depth / 2 + offset);
    group.add(front);

    const back = new THREE.Mesh(frontBackGeo, material);
    back.position.set(centerX, y, centerZ - depth / 2 - offset);
    back.rotation.y = Math.PI;
    group.add(back);

    const right = new THREE.Mesh(sideGeo, material);
    right.position.set(centerX + width / 2 + offset, y, centerZ);
    right.rotation.y = Math.PI / 2;
    group.add(right);

    const left = new THREE.Mesh(sideGeo, material);
    left.position.set(centerX - width / 2 - offset, y, centerZ);
    left.rotation.y = -Math.PI / 2;
    group.add(left);
  }

  addCornerTrim(group, width, height, depth, baseY, material, centerX = 0, centerZ = 0) {
    const trimGeo = makeSoftBoxGeometry(0.22, height * 0.94, 0.22, 0.025, 1);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const trim = new THREE.Mesh(trimGeo, material);
        trim.position.set(centerX + sx * width * 0.5, baseY + height * 0.5, centerZ + sz * depth * 0.5);
        trim.castShadow = true;
        trim.receiveShadow = true;
        group.add(trim);
      }
    }
  }

  makeRoofMaterial(repo, dark = false) {
    const style = getTopicStyle(repo.topic);
    const material = (dark ? this.materials.roofDark : this.materials.roof).clone();
    const neutral = new THREE.Color(dark ? "#4c4140" : "#6b5748");
    material.color.set(repo.roofColor).lerp(neutral, dark ? 0.3 : 0.18);
    material.color.lerp(new THREE.Color(style.roofTint ?? style.wallTint), dark ? 0.2 : 0.28);
    return material;
  }

  makeWallMaterial(repo, baseMaterial, mix = 0.1) {
    const style = getTopicStyle(repo.topic);
    const material = baseMaterial.clone();
    material.color.lerp(new THREE.Color(style.wallTint), mix);
    return material;
  }

  createRoof(width, depth, height, material, repo) {
    const roof = applyRepo(new THREE.Mesh(makeGabledRoofGeometry(width, depth, height), material), repo);
    roof.castShadow = true;
    roof.receiveShadow = true;
    const ridge = new THREE.Mesh(makeSoftBoxGeometry(0.18, 0.18, depth * 1.04, 0.035, 1), material);
    ridge.position.set(0, height + 0.03, 0);
    roof.add(ridge);
    for (const side of [-1, 1]) {
      const eave = new THREE.Mesh(makeSoftBoxGeometry(0.18, 0.16, depth * 1.08, 0.025, 1), this.materials.timber);
      eave.position.set(side * width * 0.49, 0.02, 0);
      roof.add(eave);

      const tileOverlay = new THREE.Mesh(makeRoofOverlayGeometry(width, depth, height, side), this.materials.roofOverlay);
      roof.add(tileOverlay);
    }
    return roof;
  }

  addDoor(group, width, depth, height) {
    const door = new THREE.Mesh(makeSoftBoxGeometry(width, height, 0.08, 0.035, 2), this.materials.timber);
    door.position.set(0, height / 2 + 0.04, depth / 2 + 0.055);
    group.add(door);

    for (const x of [-width * 0.26, 0, width * 0.26]) {
      const plankLine = new THREE.Mesh(makeSoftBoxGeometry(0.035, height * 0.86, 0.035, 0.012, 1), this.materials.metal);
      plankLine.position.set(x, height / 2 + 0.04, depth / 2 + 0.108);
      group.add(plankLine);
    }

    const lintel = new THREE.Mesh(makeSoftBoxGeometry(width * 1.25, 0.12, 0.12, 0.025, 1), this.materials.stoneDark);
    lintel.position.set(0, height + 0.12, depth / 2 + 0.08);
    group.add(lintel);

    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(makeSoftBoxGeometry(0.12, height * 1.08, 0.14, 0.018, 1), this.materials.stoneDark);
      jamb.position.set(side * width * 0.62, height * 0.54, depth / 2 + 0.088);
      group.add(jamb);
    }

    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), this.materials.metal);
    handle.position.set(width * 0.28, height * 0.55, depth / 2 + 0.16);
    group.add(handle);
  }

  addTimberFrame(group, width, height, depth) {
    const beamMat = this.materials.timber;
    const beam = (w, h, x, y, z, rz = 0) => {
      const mesh = new THREE.Mesh(makeSoftBoxGeometry(w, h, 0.08, 0.025, 1), beamMat);
      mesh.position.set(x, y, z);
      mesh.rotation.z = rz;
      group.add(mesh);
    };
    const frontZ = depth / 2 + 0.075;
    beam(width * 0.92, 0.12, 0, height * 0.72, frontZ);
    beam(width * 0.92, 0.12, 0, height * 0.32, frontZ);
    beam(0.12, height * 0.78, -width * 0.42, height * 0.44, frontZ);
    beam(0.12, height * 0.78, width * 0.42, height * 0.44, frontZ);
    beam(0.1, height * 0.72, -width * 0.22, height * 0.5, frontZ, 0.26);
    beam(0.1, height * 0.72, width * 0.22, height * 0.5, frontZ, -0.26);
  }

  addChimney(group, x, y, z, scale = 1) {
    const chimney = new THREE.Mesh(makeSoftBoxGeometry(0.42 * scale, 1.15 * scale, 0.42 * scale, 0.045 * scale, 2), this.materials.stoneDark);
    chimney.position.set(x, y, z);
    chimney.castShadow = true;
    group.add(chimney);

    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.34 * scale, 8, 6), this.materials.smoke.clone());
    smoke.position.set(x + 0.05, y + 0.85 * scale, z + 0.03);
    smoke.scale.set(1.2, 0.65, 1);
    group.add(smoke);
  }

  addSteps(group, width, depth) {
    for (let i = 0; i < 3; i += 1) {
      const step = new THREE.Mesh(makeSoftBoxGeometry(width + i * 0.55, 0.14, 0.42, 0.035, 1), this.materials.stoneDark);
      step.position.set(0, 0.08 + i * 0.12, depth / 2 + 0.26 + i * 0.26);
      group.add(step);
    }
  }

  addTopicAccent(group, repo, width, height, depth, baseY = 0.36) {
    const style = getTopicStyle(repo.topic);
    const accentColor = new THREE.Color(style.accentTint);
    const trimColor = new THREE.Color(style.trimTint ?? style.boundaryTint);
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: repo.hotness * 0.16,
      roughness: 0.72,
      side: THREE.DoubleSide
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.84 });
    const topY = baseY + height;

    if (repo.topic === "ai") {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.65, 6), trimMat);
      mast.position.set(width * 0.18, topY + 0.78, -depth * 0.18);
      group.add(mast);
      const nodePositions = [
        [width * 0.18, topY + 1.68, -depth * 0.18],
        [-width * 0.18, topY + 0.7, depth * 0.12],
        [width * 0.02, topY + 0.92, depth * 0.28]
      ];
      for (const [x, y, z] of nodePositions) {
        const node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), accentMat);
        node.position.set(x, y, z);
        group.add(node);
      }
      for (const [x, y, z] of nodePositions.slice(1)) {
        const link = new THREE.Mesh(makeSoftBoxGeometry(0.06, 0.06, Math.hypot(width * 0.28, depth * 0.34), 0.012, 1), accentMat);
        link.position.set((width * 0.18 + x) * 0.5, (topY + 1.68 + y) * 0.5, (-depth * 0.18 + z) * 0.5);
        link.rotation.y = Math.atan2(width * 0.18 - x, -depth * 0.18 - z);
        group.add(link);
      }
      for (const side of [-1, 1]) {
        const rib = new THREE.Mesh(makeSoftBoxGeometry(0.06, height * 0.82, 0.08, 0.012, 1), accentMat);
        rib.position.set(side * width * 0.33, baseY + height * 0.52, depth / 2 + 0.12);
        group.add(rib);
      }
    } else if (repo.topic === "frontend") {
      const awning = new THREE.Mesh(makeSoftBoxGeometry(width * 0.9, 0.16, depth * 0.34, 0.018, 1), accentMat);
      awning.position.set(0, topY + 0.16, depth * 0.14);
      awning.rotation.x = -0.16;
      group.add(awning);
      const gallery = new THREE.Mesh(makeSoftBoxGeometry(width * 0.82, 0.14, 0.52, 0.018, 1), trimMat);
      gallery.position.set(0, baseY + height * 0.34, depth / 2 + 0.22);
      group.add(gallery);
      for (const side of [-1, 1]) {
        const shutter = new THREE.Mesh(makeSoftBoxGeometry(0.13, 0.78, 0.06, 0.012, 1), accentMat);
        shutter.position.set(side * width * 0.24, baseY + height * 0.62, depth / 2 + 0.14);
        group.add(shutter);
      }
    } else if (repo.topic === "infra") {
      const deck = new THREE.Mesh(makeSoftBoxGeometry(width * 0.72, 0.16, depth * 0.52, 0.018, 1), trimMat);
      deck.position.set(0, topY + 0.12, -depth * 0.1);
      group.add(deck);
      for (let i = -1; i <= 1; i += 1) {
        const vent = new THREE.Mesh(makeSoftBoxGeometry(0.52, 0.42, 0.6, 0.018, 1), accentMat);
        vent.position.set(i * width * 0.2, topY + 0.4, -depth * 0.18);
        group.add(vent);
      }
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, depth * 0.72, 6), accentMat);
      pipe.position.set(-width * 0.46, baseY + height * 0.5, 0);
      pipe.rotation.x = Math.PI / 2;
      group.add(pipe);
    } else if (repo.topic === "database") {
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, height * 0.92, 16), accentMat);
      silo.position.set(width * 0.55, baseY + height * 0.46, -depth * 0.18);
      group.add(silo);
      for (let i = 0; i < 3; i += 1) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.03, 5, 18), trimMat);
        band.position.set(width * 0.55, baseY + height * (0.2 + i * 0.23), -depth * 0.18);
        band.rotation.x = Math.PI / 2;
        group.add(band);
      }
    } else if (repo.topic === "mobile") {
      const deck = new THREE.Mesh(makeSoftBoxGeometry(width * 0.74, 0.12, 0.7, 0.018, 1), trimMat);
      deck.position.set(0, baseY + 0.1, depth / 2 + 0.5);
      group.add(deck);
      const canopy = new THREE.Mesh(makeSoftBoxGeometry(width * 0.72, 0.12, depth * 0.46, 0.018, 1), accentMat);
      canopy.position.set(0, topY + 0.14, 0);
      canopy.rotation.x = -0.12;
      group.add(canopy);
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.15, 6), accentMat);
      antenna.position.set(width * 0.32, topY + 0.72, -depth * 0.18);
      group.add(antenna);
    } else if (repo.topic === "game") {
      const arenaBand = new THREE.Mesh(new THREE.TorusGeometry(Math.max(width, depth) * 0.32, 0.06, 7, 28), accentMat);
      arenaBand.position.set(0, topY + 0.28, 0);
      arenaBand.rotation.x = Math.PI / 2;
      group.add(arenaBand);
      for (const side of [-1, 1]) {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, height * 0.5, 14), trimMat);
        drum.position.set(side * width * 0.52, baseY + height * 0.25, -depth * 0.08);
        group.add(drum);
      }
      for (const side of [-1, 1]) {
        const brace = new THREE.Mesh(makeSoftBoxGeometry(0.11, height * 0.78, 0.08, 0.012, 1), accentMat);
        brace.position.set(side * width * 0.28, baseY + height * 0.5, depth / 2 + 0.14);
        brace.rotation.z = -side * 0.42;
        group.add(brace);
      }
      const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.48, 4, 1), accentMat);
      pennant.position.set(width * 0.36, topY + 1.05, depth * 0.05);
      pennant.rotation.y = Math.PI / 2;
      group.add(pennant);
    }
  }

  createHouse(repo) {
    const group = new THREE.Group();
    const style = getTopicStyle(repo.topic);
    const width = (2.7 + repo.influence * 3.2) * style.widthScale;
    const depth = (2.5 + repo.influence * 2.5) * style.depthScale;
    const height = (repo.buildingType === "manor" ? 4.1 + repo.influence * 4 : 2.4 + repo.influence * 3.2) * style.heightScale;
    const bodyMat = this.makeWallMaterial(repo, repo.buildingType === "manor" ? this.materials.stone : this.materials.plaster, repo.buildingType === "manor" ? 0.12 : 0.16);
    const roofMat = this.makeRoofMaterial(repo);

    const plinth = new THREE.Mesh(makeSoftBoxGeometry(width * 1.12, 0.36, depth * 1.12, 0.08, 2), this.materials.stoneDark);
    plinth.position.y = 0.18;
    plinth.receiveShadow = true;
    group.add(plinth);

    const body = applyRepo(new THREE.Mesh(makeSoftBoxGeometry(width, height, depth, 0.08 + repo.influence * 0.05, 2), bodyMat), repo);
    body.position.y = 0.36 + height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    this.addFacadeOverlay(group, width, height, depth, 0.36, repo.buildingType === "manor" ? this.materials.wallOverlay : this.materials.plasterOverlay);
    this.addCornerTrim(group, width, height, depth, 0.36, this.materials.stoneDark);
    this.interactiveMeshes.push(body);

    const roofHeight = (1.55 + repo.influence * 1.1) * style.roofPitch;
    const roof = this.createRoof(width * 1.22, depth * 1.22, roofHeight, roofMat, repo);
    roof.position.y = 0.36 + height;
    group.add(roof);
    this.interactiveMeshes.push(roof);

    this.addWindows(group, repo, width, 0.36 + height, depth);
    this.addDoor(group, Math.min(1.0, width * 0.24), depth, 1.35);
    this.addSteps(group, Math.min(1.2, width * 0.28), depth);
    if (style.timberFrame) this.addTimberFrame(group, width, 0.36 + height, depth);
    this.addChimney(group, width * 0.25, 0.36 + height + roofHeight * 0.35, -depth * 0.2, 0.9);
    this.addBanner(group, repo, Math.max(0.36 + height + 2.5, 5.2), width * 0.38);
    this.addTopicAccent(group, repo, width, height, depth, 0.36);

    if (repo.buildingType === "manor") {
      const towerHeight = height * 1.12 * style.towerHeightScale;
      const tower = applyRepo(new THREE.Mesh(new THREE.CylinderGeometry(0.72 * style.towerRadiusScale, 0.92 * style.towerRadiusScale, towerHeight, 14), bodyMat), repo);
      tower.position.set(width * 0.48, 0.36 + towerHeight / 2, depth * 0.34);
      tower.castShadow = true;
      group.add(tower);
      this.interactiveMeshes.push(tower);

      const towerRoof = this.createRoof(1.85 * style.towerRadiusScale, 1.85 * style.towerRadiusScale, 1.35 * style.roofPitch, roofMat, repo);
      towerRoof.position.set(width * 0.48, 0.36 + towerHeight, depth * 0.34);
      towerRoof.rotation.y = Math.PI / 2;
      group.add(towerRoof);
    }

    return group;
  }

  createGuildhall(repo) {
    const group = new THREE.Group();
    const style = getTopicStyle(repo.topic);
    const width = (5 + repo.influence * 4) * style.widthScale;
    const depth = (4.2 + repo.influence * 3) * style.depthScale;
    const height = (5.2 + repo.influence * 5) * style.heightScale;
    const roofMat = this.makeRoofMaterial(repo);
    const wallMat = this.makeWallMaterial(repo, this.materials.stone, 0.12);
    const heavyWallMat = this.makeWallMaterial(repo, this.materials.stoneDark, 0.08);

    const plinth = new THREE.Mesh(makeSoftBoxGeometry(width * 1.28, 0.5, depth * 1.22, 0.1, 2), this.materials.stoneDark);
    plinth.position.y = 0.25;
    plinth.receiveShadow = true;
    group.add(plinth);

    const center = applyRepo(new THREE.Mesh(makeSoftBoxGeometry(width, height, depth, 0.12, 2), wallMat), repo);
    center.position.y = 0.5 + height / 2;
    center.castShadow = true;
    center.receiveShadow = true;
    group.add(center);
    this.addFacadeOverlay(group, width, height, depth, 0.5, this.materials.wallOverlay);
    this.addCornerTrim(group, width, height, depth, 0.5, this.materials.stoneDark);
    this.interactiveMeshes.push(center);

    for (const side of [-1, 1]) {
      const wing = applyRepo(new THREE.Mesh(makeSoftBoxGeometry(width * 0.44, height * 0.58, depth * 0.82, 0.1, 2), heavyWallMat), repo);
      wing.position.set(side * width * 0.62, 0.5 + (height * 0.58) / 2, 0.15);
      wing.castShadow = true;
      wing.receiveShadow = true;
      group.add(wing);
      this.addFacadeOverlay(group, width * 0.44, height * 0.58, depth * 0.82, 0.5, this.materials.wallOverlay, side * width * 0.62, 0.15);
      this.interactiveMeshes.push(wing);

      const wingRoof = this.createRoof(width * 0.58, depth * 0.98, 1.45 * style.roofPitch, roofMat, repo);
      wingRoof.position.set(side * width * 0.62, 0.5 + height * 0.58, 0.15);
      group.add(wingRoof);
    }

    const roof = this.createRoof(width * 1.08, depth * 1.12, 2.25 * style.roofPitch, roofMat, repo);
    roof.position.y = 0.5 + height;
    group.add(roof);
    this.interactiveMeshes.push(roof);

    this.addWindows(group, repo, width, 0.5 + height, depth, 2);
    this.addDoor(group, Math.min(1.35, width * 0.22), depth, 1.8);
    this.addSteps(group, Math.min(1.6, width * 0.24), depth);
    this.addChimney(group, -width * 0.28, 0.5 + height + 1.1, -depth * 0.18, 1.1);
    this.addBanner(group, repo, height + 3.8, width * 0.38);
    this.addTopicAccent(group, repo, width, height, depth, 0.5);
    return group;
  }

  addParapet(group, width, depth, y, repo) {
    const merlonGeo = makeSoftBoxGeometry(0.42, 0.54, 0.42, 0.025, 1);
    const frontCount = Math.max(4, Math.round(width / 1.1));
    const sideCount = Math.max(4, Math.round(depth / 1.1));
    for (let i = 0; i < frontCount; i += 1) {
      const x = ((i + 0.5) / frontCount - 0.5) * width;
      for (const zSide of [-1, 1]) {
        const merlon = applyRepo(new THREE.Mesh(merlonGeo, this.materials.stoneDark), repo);
        merlon.position.set(x, y, zSide * depth * 0.52);
        group.add(merlon);
      }
    }
    for (let i = 1; i < sideCount - 1; i += 1) {
      const z = ((i + 0.5) / sideCount - 0.5) * depth;
      for (const xSide of [-1, 1]) {
        const merlon = applyRepo(new THREE.Mesh(merlonGeo, this.materials.stoneDark), repo);
        merlon.position.set(xSide * width * 0.52, y, z);
        group.add(merlon);
      }
    }
  }

  createCastle(repo) {
    const group = new THREE.Group();
    const style = getTopicStyle(repo.topic);
    const tier = castleTier(repo);
    const size = (6.4 + repo.influence * 5.6 + tier * 1.05) * ((style.widthScale + style.depthScale) * 0.5);
    const keepHeight = (8.6 + repo.influence * 11.2 + tier * 1.2 + repo.hotness * 1.1) * style.heightScale * style.towerHeightScale;
    const wallHeight = (3.1 + repo.influence * 2.8 + tier * 0.35) * (0.95 + style.towerRadiusScale * 0.05);
    const roofMat = this.makeRoofMaterial(repo, true);
    const wallMat = this.makeWallMaterial(repo, this.materials.stone, 0.1);
    const heavyWallMat = this.makeWallMaterial(repo, this.materials.stoneDark, 0.07);

    if (tier >= 3) {
      const outerCourt = new THREE.Mesh(new THREE.CylinderGeometry(size * 1.46, size * 1.58, 0.13, 64), this.materials.plaza);
      outerCourt.position.y = 0.06;
      outerCourt.receiveShadow = true;
      group.add(outerCourt);

      const outerWallHeight = wallHeight * 0.62;
      const outerWallGeoX = makeSoftBoxGeometry(size * 2.05, outerWallHeight, 0.62, 0.06, 2);
      const outerWallGeoZ = makeSoftBoxGeometry(0.62, outerWallHeight, size * 2.05, 0.06, 2);
      for (const side of [-1, 1]) {
        const wallX = applyRepo(new THREE.Mesh(outerWallGeoX, heavyWallMat), repo);
        wallX.position.set(0, 0.13 + outerWallHeight / 2, side * size * 1.07);
        wallX.castShadow = true;
        wallX.receiveShadow = true;
        group.add(wallX);

        const wallZ = applyRepo(new THREE.Mesh(outerWallGeoZ, heavyWallMat), repo);
        wallZ.position.set(side * size * 1.07, 0.13 + outerWallHeight / 2, 0);
        wallZ.castShadow = true;
        wallZ.receiveShadow = true;
        group.add(wallZ);
      }
    }

    const courtyard = new THREE.Mesh(new THREE.CylinderGeometry(size * (tier >= 3 ? 1.12 : 1.04), size * (tier >= 3 ? 1.24 : 1.14), 0.18, 48), this.materials.plaza);
    courtyard.position.y = 0.09;
    courtyard.receiveShadow = true;
    group.add(courtyard);

    const keep = applyRepo(new THREE.Mesh(makeSoftBoxGeometry(size * 0.72, keepHeight, size * 0.68, 0.14, 2), wallMat), repo);
    keep.position.y = 0.18 + keepHeight / 2;
    keep.castShadow = true;
    keep.receiveShadow = true;
    group.add(keep);
    this.addFacadeOverlay(group, size * 0.72, keepHeight, size * 0.68, 0.18, this.materials.wallOverlay);
    this.addCornerTrim(group, size * 0.72, keepHeight, size * 0.68, 0.18, this.materials.stoneDark);
    this.addParapet(group, size * 0.72, size * 0.68, 0.18 + keepHeight + 0.35, repo);
    this.interactiveMeshes.push(keep);

    if (tier >= 3) {
      const upperHeight = keepHeight * 0.38;
      const upperWidth = size * 0.42;
      const upperDepth = size * 0.38;
      const upperKeep = applyRepo(new THREE.Mesh(makeSoftBoxGeometry(upperWidth, upperHeight, upperDepth, 0.09, 2), wallMat), repo);
      upperKeep.position.y = 0.18 + keepHeight + upperHeight / 2;
      upperKeep.castShadow = true;
      upperKeep.receiveShadow = true;
      group.add(upperKeep);
      this.addFacadeOverlay(group, upperWidth, upperHeight, upperDepth, 0.18 + keepHeight, this.materials.wallOverlay);
      this.addCornerTrim(group, upperWidth, upperHeight, upperDepth, 0.18 + keepHeight, this.materials.stoneDark);
      this.addParapet(group, upperWidth, upperDepth, 0.18 + keepHeight + upperHeight + 0.3, repo);
      this.interactiveMeshes.push(upperKeep);

      const spire = applyRepo(new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.8, 5), roofMat), repo);
      spire.position.y = 0.18 + keepHeight + upperHeight + 1.4;
      spire.scale.set(size * 0.18, 1, size * 0.18);
      spire.rotation.y = Math.PI / 5;
      spire.castShadow = true;
      group.add(spire);
    }

    const keepRoof = applyRepo(new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), roofMat), repo);
    keepRoof.position.y = 0.18 + keepHeight + (tier >= 3 ? keepHeight * 0.38 + 0.75 : 1.25);
    keepRoof.rotation.y = Math.PI / 4;
    keepRoof.scale.set(size * (tier >= 3 ? 0.28 : 0.42), (tier >= 3 ? 1.5 : 2.5) * style.roofPitch, size * (tier >= 3 ? 0.28 : 0.42));
    keepRoof.castShadow = true;
    group.add(keepRoof);
    this.interactiveMeshes.push(keepRoof);

    const wallGeoX = makeSoftBoxGeometry(size * 1.35, wallHeight, 1, 0.08, 2);
    const wallGeoZ = makeSoftBoxGeometry(1, wallHeight, size * 1.35, 0.08, 2);
    for (const side of [-1, 1]) {
      const wallX = applyRepo(new THREE.Mesh(wallGeoX, heavyWallMat), repo);
      wallX.position.set(0, 0.18 + wallHeight / 2, side * size * 0.72);
      wallX.castShadow = true;
      wallX.receiveShadow = true;
      group.add(wallX);
      this.addFacadeOverlay(group, size * 1.35, wallHeight, 1, 0.18, this.materials.wallOverlay, 0, side * size * 0.72);
      this.interactiveMeshes.push(wallX);

      const wallZ = applyRepo(new THREE.Mesh(wallGeoZ, heavyWallMat), repo);
      wallZ.position.set(side * size * 0.72, 0.18 + wallHeight / 2, 0);
      wallZ.castShadow = true;
      wallZ.receiveShadow = true;
      group.add(wallZ);
      this.addFacadeOverlay(group, 1, wallHeight, size * 1.35, 0.18, this.materials.wallOverlay, side * size * 0.72, 0);
      this.interactiveMeshes.push(wallZ);
    }

    const towerRadius = (0.95 + repo.influence * 0.42 + tier * 0.13) * style.towerRadiusScale;
    const towerHeight = keepHeight * (0.56 + tier * 0.08) * style.towerHeightScale;
    const towerGeo = new THREE.CylinderGeometry(towerRadius, towerRadius * 1.12, towerHeight, tier >= 3 ? 20 : 16);
    const towerRoofGeo = new THREE.ConeGeometry(towerRadius * 0.98, 1.75 + tier * 0.28, tier >= 3 ? 18 : 14);
    const flatWatchGeo = new THREE.CylinderGeometry(towerRadius * 0.9, towerRadius * 0.95, 0.34, tier >= 3 ? 18 : 14);
    const towerPositions = [
      [-1, -1, 0.92],
      [1, -1, 1.02],
      [-1, 1, 1.08],
      [1, 1, 0.96],
      ...(tier >= 3 ? [[0, 1, 1.18], [0, -1, 0.88], [1, 0, 1.08], [-1, 0, 0.98]] : [])
    ];
    for (const [x, z, heightScale] of towerPositions) {
        const tower = applyRepo(new THREE.Mesh(towerGeo, wallMat), repo);
        const ringScale = x === 0 || z === 0 ? 0.78 : 0.72;
        tower.position.set(x * size * ringScale, 0.18 + (towerHeight * heightScale) / 2, z * size * ringScale);
        tower.scale.y = heightScale;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);
        this.interactiveMeshes.push(tower);

        const roofed = tier === 1 ? x === z : tier === 2 ? z < 0 || x > 0 : x !== 0 && z !== 0 && heightScale > 0.96;
        const top = applyRepo(new THREE.Mesh(roofed ? towerRoofGeo : flatWatchGeo, roofed ? roofMat : heavyWallMat), repo);
        top.position.set(x * size * ringScale, 0.18 + towerHeight * heightScale + (roofed ? 0.86 + tier * 0.12 : 0.2), z * size * ringScale);
        top.castShadow = true;
        group.add(top);
        this.interactiveMeshes.push(top);
    }

    const gate = applyRepo(new THREE.Mesh(makeSoftBoxGeometry(size * 0.28, wallHeight * 0.78, 0.22, 0.06, 2), this.materials.timber), repo);
    gate.position.set(0, 0.18 + wallHeight * 0.39, size * 0.74);
    group.add(gate);
    this.interactiveMeshes.push(gate);

    if (tier >= 2) {
      const gateTowerHeight = wallHeight * (1.15 + tier * 0.12);
      const gateTowerGeo = new THREE.CylinderGeometry(towerRadius * 0.72, towerRadius * 0.82, gateTowerHeight, 14);
      const gateRoofGeo = new THREE.ConeGeometry(towerRadius * 0.76, 1.35 + tier * 0.2, 14);
      for (const side of [-1, 1]) {
        const gateTower = applyRepo(new THREE.Mesh(gateTowerGeo, wallMat), repo);
        gateTower.position.set(side * size * 0.2, 0.18 + gateTowerHeight / 2, size * 0.86);
        gateTower.castShadow = true;
        gateTower.receiveShadow = true;
        group.add(gateTower);
        this.interactiveMeshes.push(gateTower);

        const gateRoof = applyRepo(new THREE.Mesh(gateRoofGeo, roofMat), repo);
        gateRoof.position.set(side * size * 0.2, 0.18 + gateTowerHeight + 0.85, size * 0.86);
        gateRoof.castShadow = true;
        group.add(gateRoof);
      }
    }

    for (let i = -2; i <= 2; i += 1) {
      const bar = new THREE.Mesh(makeSoftBoxGeometry(0.06, wallHeight * 0.62, 0.07, 0.012, 1), this.materials.metal);
      bar.position.set(i * size * 0.045, 0.18 + wallHeight * 0.42, size * 0.865);
      group.add(bar);
    }

    const arch = applyRepo(new THREE.Mesh(new THREE.TorusGeometry(size * 0.17, 0.08, 8, 24, Math.PI), wallMat), repo);
    arch.position.set(0, 0.18 + wallHeight * 0.76, size * 0.77);
    arch.rotation.z = Math.PI;
    group.add(arch);

    const bridge = new THREE.Mesh(makeSoftBoxGeometry(size * 0.54, 0.16, size * 0.55, 0.04, 1), this.materials.timber);
    bridge.position.set(0, 0.14, size * 1.08);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    group.add(bridge);

    if (tier >= 3) {
      for (const side of [-1, 1]) {
        const hallWidth = size * 0.34;
        const hallDepth = size * 0.42;
        const hallHeight = wallHeight * 0.9;
        const hall = applyRepo(new THREE.Mesh(makeSoftBoxGeometry(hallWidth, hallHeight, hallDepth, 0.06, 2), heavyWallMat), repo);
        hall.position.set(side * size * 0.42, 0.18 + hallHeight / 2, -size * 0.24);
        hall.castShadow = true;
        hall.receiveShadow = true;
        group.add(hall);
        this.addFacadeOverlay(group, hallWidth, hallHeight, hallDepth, 0.18, this.materials.wallOverlay, side * size * 0.42, -size * 0.24);

        const hallRoof = this.createRoof(hallWidth * 1.08, hallDepth * 1.08, (1.2 + repo.influence * 0.55) * style.roofPitch, roofMat, repo);
        hallRoof.position.set(side * size * 0.42, 0.18 + hallHeight, -size * 0.24);
        group.add(hallRoof);
      }

      const chapel = applyRepo(new THREE.Mesh(new THREE.CylinderGeometry(size * 0.13, size * 0.16, wallHeight * 1.35, 8), wallMat), repo);
      chapel.position.set(0, 0.18 + (wallHeight * 1.35) / 2, size * 0.26);
      chapel.castShadow = true;
      chapel.receiveShadow = true;
      group.add(chapel);

      const chapelRoof = applyRepo(new THREE.Mesh(new THREE.ConeGeometry(size * 0.18, 2.5, 8), roofMat), repo);
      chapelRoof.position.set(0, 0.18 + wallHeight * 1.35 + 1.25, size * 0.26);
      chapelRoof.castShadow = true;
      group.add(chapelRoof);
    }

    const merlonGeo = makeSoftBoxGeometry(0.5, 0.8, 0.5, 0.04, 1);
    const merlonSpan = tier >= 3 ? 5 : tier === 2 ? 4 : 3;
    for (let i = -merlonSpan; i <= merlonSpan; i += 1) {
      for (const side of [-1, 1]) {
      const merlon = applyRepo(new THREE.Mesh(merlonGeo, wallMat), repo);
        merlon.position.set(i * (size * 0.14), 0.18 + wallHeight + 0.38, side * size * 0.74);
        group.add(merlon);

        const sideMerlon = applyRepo(new THREE.Mesh(merlonGeo, wallMat), repo);
        sideMerlon.position.set(side * size * 0.74, 0.18 + wallHeight + 0.38, i * (size * 0.14));
        group.add(sideMerlon);
      }
    }

    const buttressGeo = makeSoftBoxGeometry(0.38, wallHeight * 0.95, 0.46, 0.04, 1);
    for (let i = -2; i <= 2; i += 1) {
      for (const side of [-1, 1]) {
        const buttress = new THREE.Mesh(buttressGeo, wallMat);
        buttress.position.set(i * size * 0.24, 0.18 + wallHeight * 0.48, side * size * 0.78);
        group.add(buttress);
      }
    }

    this.addWindows(group, repo, size * 0.72, 0.18 + keepHeight, size * 0.68, 3);
    this.addBanner(group, repo, keepHeight + 4.9, size * 0.32);
    this.addTopicAccent(group, repo, size * 0.72, keepHeight, size * 0.68, 0.18);
    return group;
  }

  addWindows(group, repo, width, height, depth, rows = 1) {
    const style = getTopicStyle(repo.topic);
    const windowColor = new THREE.Color("#ffe19c").lerp(new THREE.Color(style.plazaTint), 0.1);
    const emissiveColor = new THREE.Color("#ffbf48").lerp(new THREE.Color(repo.topicColor), 0.08);
    const material = new THREE.MeshStandardMaterial({
      color: windowColor,
      emissive: emissiveColor,
      emissiveIntensity: 0.12 + repo.hotness * 0.85,
      roughness: 0.5
    });
    const recessGeo = new THREE.BoxGeometry(0.54, 0.72, 0.08);
    const windowGeo = new THREE.BoxGeometry(0.28, 0.42, 0.04);
    const frameGeoH = new THREE.BoxGeometry(0.58, 0.08, 0.09);
    const frameGeoV = new THREE.BoxGeometry(0.08, 0.72, 0.09);
    const muntinHGeo = new THREE.BoxGeometry(0.3, 0.035, 0.05);
    const muntinVGeo = new THREE.BoxGeometry(0.035, 0.43, 0.05);
    const sillGeo = new THREE.BoxGeometry(0.66, 0.09, 0.14);
    const count = repo.buildingType === "castle" ? 4 : 2;
    for (let row = 0; row < rows; row += 1) {
      for (let i = 0; i < count; i += 1) {
        const offset = ((i + 1) / (count + 1) - 0.5) * width * 0.72;
        const y = height * (0.38 + row * 0.17);
        const frontRecess = new THREE.Mesh(recessGeo, this.materials.windowRecess);
        frontRecess.position.set(offset, y, depth / 2 + 0.03);
        group.add(frontRecess);

        const front = new THREE.Mesh(windowGeo, material);
        front.position.set(offset, y, depth / 2 + 0.085);
        group.add(front);

        for (const dy of [-0.33, 0.33]) {
          const frame = new THREE.Mesh(frameGeoH, this.materials.timber);
          frame.position.set(offset, y + dy, depth / 2 + 0.105);
          group.add(frame);
        }
        for (const dx of [-0.26, 0.26]) {
          const frame = new THREE.Mesh(frameGeoV, this.materials.timber);
          frame.position.set(offset + dx, y, depth / 2 + 0.105);
          group.add(frame);
        }
        const muntinH = new THREE.Mesh(muntinHGeo, this.materials.timber);
        muntinH.position.set(offset, y, depth / 2 + 0.13);
        group.add(muntinH);
        const muntinV = new THREE.Mesh(muntinVGeo, this.materials.timber);
        muntinV.position.set(offset, y, depth / 2 + 0.13);
        group.add(muntinV);
        const sill = new THREE.Mesh(sillGeo, this.materials.stoneDark);
        sill.position.set(offset, y - 0.43, depth / 2 + 0.115);
        group.add(sill);

        const backRecess = new THREE.Mesh(recessGeo, this.materials.windowRecess);
        backRecess.position.set(offset, y, -depth / 2 - 0.03);
        backRecess.rotation.y = Math.PI;
        group.add(backRecess);
        const back = new THREE.Mesh(windowGeo, material);
        back.position.set(offset, y, -depth / 2 - 0.085);
        back.rotation.y = Math.PI;
        group.add(back);
      }
    }
  }

  addBanner(group, repo, height, sideOffset) {
    if (repo.hotness < 0.38 && repo.buildingType !== "castle") return;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 6), this.materials.timber);
    pole.position.set(-sideOffset, height - 0.9, 0);
    pole.castShadow = true;
    group.add(pole);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.72, 5, 1),
      new THREE.MeshStandardMaterial({ color: repo.topicColor, roughness: 0.62, side: THREE.DoubleSide })
    );
    flag.position.set(-sideOffset + 0.72, height - 0.28, 0);
    flag.rotation.y = Math.PI / 2;
    flag.userData.phase = repo.hotness * Math.PI * 2;
    group.add(flag);
    this.flags.push(flag);
  }

  createTrees() {
    const count = 540;
    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.22, 1, 7);
    const branchGeo = new THREE.CylinderGeometry(0.035, 0.07, 1, 5);
    const crownGeo = makeLobedCrownGeometry(0);
    const coniferGeo = makeConiferCrownGeometry();
    const shadowGeo = new THREE.CircleGeometry(1, 16);
    const trunks = new THREE.InstancedMesh(trunkGeo, this.materials.timber, count);
    const branches = new THREE.InstancedMesh(branchGeo, this.materials.timber, count * 2);
    const crowns = new THREE.InstancedMesh(crownGeo, this.materials.treeCrown, count);
    const conifers = new THREE.InstancedMesh(coniferGeo, this.materials.treeCrown, count);
    const treeShadows = new THREE.InstancedMesh(shadowGeo, this.materials.treeShadow, count);
    const temp = new THREE.Object3D();
    const hidden = new THREE.Matrix4().makeScale(0.001, 0.001, 0.001);
    const random = seededRandom(7301);
    const forestCenters = Array.from({ length: 18 }, (_, index) => {
      const angle = index * 2.399963 + 0.2;
      const radius = 95 + (index % 7) * 26 + random() * 24;
      return {
        x: Math.cos(angle) * radius + (random() - 0.5) * 28,
        z: Math.sin(angle) * radius + (random() - 0.5) * 28,
        spread: 18 + (index % 5) * 5 + random() * 8
      };
    });

    const avoidTown = (x, z) => {
      let adjustedX = x;
      let adjustedZ = z;
      for (const cluster of this.worldData.clusters) {
        const dx = adjustedX - cluster.centroid.x;
        const dz = adjustedZ - cluster.centroid.z;
        const dist = Math.hypot(dx, dz);
        const minDist = 25 + cluster.repoCount * 1.15;
        if (dist < minDist) {
          const angle = Math.atan2(dz, dx);
          adjustedX = cluster.centroid.x + Math.cos(angle) * minDist;
          adjustedZ = cluster.centroid.z + Math.sin(angle) * minDist;
        }
      }
      return { x: clamp(adjustedX, -318, 318), z: clamp(adjustedZ, -318, 318) };
    };

    for (let i = 0; i < count; i += 1) {
      const center = forestCenters[i % forestCenters.length];
      const localAngle = i * 2.117 + random() * 0.8;
      const localRadius = Math.sqrt(random()) * center.spread;
      const solitary = i % 9 === 0;
      const rawRadius = 58 + random() * 240;
      const rawX = solitary ? Math.cos(localAngle) * rawRadius : center.x + Math.cos(localAngle) * localRadius;
      const rawZ = solitary ? Math.sin(localAngle) * rawRadius : center.z + Math.sin(localAngle) * localRadius;
      const { x: tx, z: tz } = avoidTown(rawX, rawZ);
      const ty = terrainHeight(tx, tz);
      const edge = smoothstep(170, 310, Math.hypot(tx, tz));
      const broadleaf = random() > 0.24 + edge * 0.18;
      const scale = broadleaf ? 1.15 + random() * 1.25 + edge * 0.35 : 1.05 + random() * 1.05 + edge * 0.28;
      const trunkHeight = broadleaf ? 2.2 + scale * 1.25 : 1.65 + scale * 0.9;
      const crownY = broadleaf ? trunkHeight + 1.2 * scale : trunkHeight - 0.15;
      const yaw = localAngle + random() * 0.8;

      temp.position.set(tx, ty + trunkHeight * 0.5, tz);
      temp.rotation.set(0, yaw, 0);
      temp.scale.set(0.8 + scale * 0.18, trunkHeight, 0.8 + scale * 0.16);
      temp.updateMatrix();
      trunks.setMatrixAt(i, temp.matrix);

      for (let branch = 0; branch < 2; branch += 1) {
        const branchAngle = yaw + (branch ? 1.9 : -1.6) + random() * 0.5;
        temp.position.set(
          tx + Math.cos(branchAngle) * 0.22 * scale,
          ty + trunkHeight * (0.58 + branch * 0.1),
          tz + Math.sin(branchAngle) * 0.22 * scale
        );
        temp.rotation.set(0.72, 0, -0.55 + branch * 1.1);
        temp.rotation.y = branchAngle;
        temp.scale.set(0.75 + scale * 0.12, 0.85 + scale * 0.26, 0.75 + scale * 0.12);
        temp.updateMatrix();
        branches.setMatrixAt(i * 2 + branch, temp.matrix);
      }

      temp.position.set(tx, ty + crownY, tz);
      temp.rotation.set(0.08 * (random() - 0.5), yaw, 0.08 * (random() - 0.5));
      temp.scale.set(scale * (1.18 + random() * 0.26), scale * (1.05 + random() * 0.18), scale * (1.08 + random() * 0.22));
      temp.updateMatrix();
      if (broadleaf) {
        crowns.setMatrixAt(i, temp.matrix);
        conifers.setMatrixAt(i, hidden);
      } else {
        conifers.setMatrixAt(i, temp.matrix);
        crowns.setMatrixAt(i, hidden);
      }

      temp.position.set(tx, ty + 0.055, tz);
      temp.rotation.set(-Math.PI / 2, 0, yaw);
      temp.scale.set(1.05 * scale, 0.58 * scale, 1);
      temp.updateMatrix();
      treeShadows.setMatrixAt(i, temp.matrix);

      const color = new THREE.Color(i % 3 === 0 ? "#76935e" : i % 3 === 1 ? "#8fa06a" : "#6a8757");
      crowns.setColorAt(i, color);
      conifers.setColorAt(i, color.clone().lerp(new THREE.Color("#526b4d"), 0.1));
    }

    trunks.castShadow = true;
    branches.castShadow = true;
    crowns.castShadow = true;
    conifers.castShadow = true;
    trunks.receiveShadow = true;
    branches.receiveShadow = true;
    crowns.receiveShadow = true;
    conifers.receiveShadow = true;
    crowns.instanceColor.needsUpdate = true;
    conifers.instanceColor.needsUpdate = true;
    this.worldRoot.add(treeShadows, trunks, branches, crowns, conifers);

    this.createGroundScatter();
  }

  createGroundScatter() {
    const count = 420;
    const bushGeo = new THREE.DodecahedronGeometry(0.42, 0);
    const rockGeo = new THREE.DodecahedronGeometry(0.32, 0);
    const bushes = new THREE.InstancedMesh(bushGeo, this.materials.bush, count);
    const rocks = new THREE.InstancedMesh(rockGeo, this.materials.rock, count);
    const temp = new THREE.Object3D();

    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.119 + 0.5;
      const radius = 28 + ((i * 17) % 222);
      const x = clamp(Math.cos(angle) * radius + ((i * 11) % 13), -268, 268);
      const z = clamp(Math.sin(angle) * radius + ((i * 5) % 17), -268, 268);
      const y = terrainHeight(x, z);
      const scale = 0.45 + ((i * 3) % 9) * 0.06;
      temp.position.set(x, y + 0.2, z);
      temp.rotation.set((i % 5) * 0.11, angle, (i % 7) * 0.08);
      temp.scale.set(scale * (1.1 + (i % 4) * 0.18), scale * 0.42, scale * (0.75 + (i % 3) * 0.16));
      temp.updateMatrix();
      if (i % 3 === 0) {
        rocks.setMatrixAt(i, temp.matrix);
        rocks.setColorAt(i, new THREE.Color(i % 2 ? "#8f9286" : "#aaa895"));
        temp.position.set(0, -100, 0);
        temp.scale.setScalar(0.001);
        temp.updateMatrix();
        bushes.setMatrixAt(i, temp.matrix);
        bushes.setColorAt(i, new THREE.Color("#6faa55"));
      } else {
        temp.scale.set(scale * (1.35 + (i % 4) * 0.22), scale * 0.55, scale * (1.0 + (i % 3) * 0.22));
        temp.updateMatrix();
        bushes.setMatrixAt(i, temp.matrix);
        bushes.setColorAt(i, new THREE.Color(i % 2 ? "#83bb63" : "#6faa55"));
        temp.position.set(0, -100, 0);
        temp.scale.setScalar(0.001);
        temp.updateMatrix();
        rocks.setMatrixAt(i, temp.matrix);
        rocks.setColorAt(i, new THREE.Color("#8f9286"));
      }
    }

    bushes.instanceColor.needsUpdate = true;
    rocks.instanceColor.needsUpdate = true;
    bushes.castShadow = true;
    rocks.castShadow = true;
    this.worldRoot.add(bushes, rocks);
    this.createMeadowDetails();
  }

  createMeadowDetails() {
    const grassCount = 1450;
    const flowerCount = 260;
    const bladeGeo = new THREE.ConeGeometry(0.08, 0.62, 3);
    const flowerGeo = new THREE.SphereGeometry(0.07, 5, 4);
    const blades = new THREE.InstancedMesh(bladeGeo, this.materials.grassDark, grassCount);
    const flowers = new THREE.InstancedMesh(flowerGeo, this.materials.gold, flowerCount);
    const temp = new THREE.Object3D();

    for (let i = 0; i < grassCount; i += 1) {
      const angle = i * 2.399963;
      const radius = 24 + ((i * 29) % 232);
      const x = clamp(Math.cos(angle) * radius + ((i * 31) % 17) - 8, -268, 268);
      const z = clamp(Math.sin(angle) * radius + ((i * 37) % 19) - 9, -268, 268);
      const y = terrainHeight(x, z);
      const scale = 0.5 + ((i * 7) % 10) * 0.055;
      temp.position.set(x, y + 0.28 * scale, z);
      temp.rotation.set(0.18 * ((i % 5) - 2), angle, 0.12 * ((i % 7) - 3));
      temp.scale.set(scale, 0.8 + scale, scale);
      temp.updateMatrix();
      blades.setMatrixAt(i, temp.matrix);
      blades.setColorAt(i, new THREE.Color(i % 4 === 0 ? "#88aa55" : i % 4 === 1 ? "#75a455" : "#a6b86b"));
    }

    for (let i = 0; i < flowerCount; i += 1) {
      const angle = i * 2.711 + 0.9;
      const radius = 28 + ((i * 41) % 214);
      const x = clamp(Math.cos(angle) * radius + ((i * 17) % 15) - 7, -264, 264);
      const z = clamp(Math.sin(angle) * radius + ((i * 23) % 13) - 6, -264, 264);
      const y = terrainHeight(x, z);
      temp.position.set(x, y + 0.12, z);
      temp.rotation.set(0, angle, 0);
      temp.scale.setScalar(0.7 + (i % 4) * 0.09);
      temp.updateMatrix();
      flowers.setMatrixAt(i, temp.matrix);
    }

    blades.instanceColor.needsUpdate = true;
    this.worldRoot.add(blades, flowers);
  }

  createCrowds() {
    const totalDesired = this.worldData.repos.reduce((total, repo) => total + repo.peopleCount, 0);
    const displayScale = Math.min(1, 280 / totalDesired);
    const records = [];

    for (const repo of this.worldData.repos) {
      const cluster = this.worldData.clusters.find((item) => item.id === repo.topic);
      const visibleCount = Math.max(1, Math.round(repo.peopleCount * displayScale));
      for (let i = 0; i < visibleCount; i += 1) {
        const phase = (i / visibleCount) * Math.PI * 2 + repo.hotness * 3;
        records.push({
          repoId: repo.id,
          color: new THREE.Color(repo.topicColor),
          phase,
          speed: 0.18 + repo.hotness * 0.55 + (i % 5) * 0.025,
          orbit: i % 3 === 0,
          radius: 3.2 + (i % 4) * 1.08 + repo.hotness * 2.4,
          start: new THREE.Vector3(repo.position.x, 0, repo.position.z),
          end: new THREE.Vector3(cluster.centroid.x, 0, cluster.centroid.z)
        });
      }
    }

    const bodyGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.66, 6);
    const cloakGeo = new THREE.ConeGeometry(0.33, 0.72, 5);
    const legGeo = makeSoftBoxGeometry(0.08, 0.34, 0.08, 0.012, 1);
    const headGeo = new THREE.SphereGeometry(0.17, 8, 6);
    const shadowGeo = new THREE.CircleGeometry(0.34, 14);
    this.bodyMesh = new THREE.InstancedMesh(bodyGeo, this.materials.person, records.length);
    this.cloakMesh = new THREE.InstancedMesh(cloakGeo, this.materials.personCloak, records.length);
    this.legMesh = new THREE.InstancedMesh(legGeo, this.materials.personLeg, records.length * 2);
    this.headMesh = new THREE.InstancedMesh(headGeo, this.materials.personHead, records.length);
    this.personShadowMesh = new THREE.InstancedMesh(shadowGeo, this.materials.shadow, records.length);
    this.bodyMesh.castShadow = false;
    this.cloakMesh.castShadow = false;
    this.legMesh.castShadow = false;
    this.headMesh.castShadow = false;
    records.forEach((record, index) => {
      this.bodyMesh.setColorAt(index, record.color);
      this.cloakMesh.setColorAt(index, record.color.clone().lerp(new THREE.Color("#1d1713"), 0.28));
    });
    this.bodyMesh.instanceColor.needsUpdate = true;
    this.cloakMesh.instanceColor.needsUpdate = true;
    this.people = records;
    this.worldRoot.add(this.personShadowMesh, this.legMesh, this.cloakMesh, this.bodyMesh, this.headMesh);
    this.updatePeople(0);
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.key.toLowerCase());
      if (event.key.toLowerCase() === "f") this.toggleFullscreen();
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.cameraState.distance = clamp(this.cameraState.distance + event.deltaY * 0.11, MIN_DISTANCE, MAX_DISTANCE);
      this.updateCamera();
    }, { passive: false });
    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.setPointerCapture(event.pointerId);
      this.pointerState = {
        down: true,
        dragMode: event.button === 2 || event.shiftKey ? "rotate" : "pan",
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        moved: false
      };
    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (this.pointerState.down) {
        const dx = event.clientX - this.pointerState.x;
        const dy = event.clientY - this.pointerState.y;
        this.pointerState.moved ||= Math.abs(event.clientX - this.pointerState.startX) + Math.abs(event.clientY - this.pointerState.startY) > 4;
        this.pointerState.x = event.clientX;
        this.pointerState.y = event.clientY;

        if (this.pointerState.dragMode === "rotate") {
          this.cameraState.yaw -= dx * 0.006;
        } else {
          const scale = this.cameraState.distance / 620;
          const right = new THREE.Vector3(Math.cos(this.cameraState.yaw), 0, -Math.sin(this.cameraState.yaw));
          const forward = new THREE.Vector3(Math.sin(this.cameraState.yaw), 0, Math.cos(this.cameraState.yaw));
          this.cameraState.target.addScaledVector(right, -dx * scale);
          this.cameraState.target.addScaledVector(forward, -dy * scale);
          this.clampTarget();
        }
        this.updateCamera();
      } else {
        this.pick(event, false);
      }
    });
    this.canvas.addEventListener("pointerup", (event) => {
      const wasClick = !this.pointerState.moved;
      this.pointerState.down = false;
      if (wasClick) this.pick(event, true);
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.updateCamera();
  }

  updateCamera() {
    const { target, distance, yaw } = this.cameraState;
    const horizontal = distance * 0.88;
    const height = distance * 0.46 + 16;
    this.camera.position.set(
      target.x + Math.sin(yaw) * horizontal,
      height,
      target.z + Math.cos(yaw) * horizontal
    );
    this.camera.lookAt(target.x, 8, target.z);
    const altitude = (distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE);
    this.onAltitude?.(clamp(altitude, 0, 1));
    this.updateRoadVisibility();
  }

  updateRoadVisibility() {
    const localVisible = this.cameraState.distance < 300;
    if (this.localRoadsVisible === localVisible) return;
    this.localRoadsVisible = localVisible;
    for (const road of this.cityRoads) {
      road.visible = localVisible;
    }
  }

  clampTarget() {
    this.cameraState.target.x = clamp(this.cameraState.target.x, -MAP_LIMIT, MAP_LIMIT);
    this.cameraState.target.z = clamp(this.cameraState.target.z, -MAP_LIMIT, MAP_LIMIT);
  }

  pick(event, select) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.interactiveMeshes, false)[0];
    const repo =
      hit?.object.userData.repo ??
      (Number.isInteger(hit?.instanceId) ? hit?.object.userData.instanceRepos?.[hit.instanceId] : null) ??
      null;

    if (select) {
      this.selectedRepo = repo;
      this.onSelect?.(repo);
    } else if (repo?.id !== this.hoveredRepo?.id) {
      this.hoveredRepo = repo;
      this.onHover?.(repo, { x: event.clientX, y: event.clientY });
    } else if (repo) {
      this.onHover?.(repo, { x: event.clientX, y: event.clientY });
    } else {
      this.hoveredRepo = null;
      this.onHover?.(null);
    }
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(0.05, this.clock.getDelta());
    this.step(dt);
    this.render();
  }

  step(dt) {
    this.elapsed += dt;
    this.fps = lerp(this.fps, 1 / Math.max(0.001, dt), 0.06);
    this.updateKeyboard(dt);
    this.updatePeople(dt);
    this.updateFlags();
  }

  updateKeyboard(dt) {
    if (!this.keys.size) return;
    const speed = this.cameraState.distance * dt * 0.48;
    const right = new THREE.Vector3(Math.cos(this.cameraState.yaw), 0, -Math.sin(this.cameraState.yaw));
    const forward = new THREE.Vector3(Math.sin(this.cameraState.yaw), 0, Math.cos(this.cameraState.yaw));
    if (this.keys.has("a") || this.keys.has("arrowleft")) this.cameraState.target.addScaledVector(right, -speed);
    if (this.keys.has("d") || this.keys.has("arrowright")) this.cameraState.target.addScaledVector(right, speed);
    if (this.keys.has("w") || this.keys.has("arrowup")) this.cameraState.target.addScaledVector(forward, -speed);
    if (this.keys.has("s") || this.keys.has("arrowdown")) this.cameraState.target.addScaledVector(forward, speed);
    this.clampTarget();
    this.updateCamera();
  }

  updatePeople() {
    if (!this.bodyMesh || !this.headMesh) return;
    const temp = new THREE.Object3D();
    for (let i = 0; i < this.people.length; i += 1) {
      const person = this.people[i];
      let x;
      let z;
      let heading;
      if (person.orbit) {
        const angle = this.elapsed * person.speed + person.phase;
        x = person.start.x + Math.cos(angle) * person.radius;
        z = person.start.z + Math.sin(angle) * person.radius;
        heading = -angle;
      } else {
        const t = (Math.sin(this.elapsed * person.speed + person.phase) + 1) / 2;
        x = lerp(person.start.x, person.end.x, t);
        z = lerp(person.start.z, person.end.z, t);
        heading = Math.atan2(person.end.x - person.start.x, person.end.z - person.start.z);
      }

      const bob = Math.sin(this.elapsed * person.speed * 12 + person.phase) * 0.035;
      const groundY = terrainHeight(x, z);
      temp.rotation.set(0, heading, 0);
      temp.position.set(x, groundY + 0.41 + bob, z);
      temp.scale.setScalar(0.86);
      temp.updateMatrix();
      this.bodyMesh.setMatrixAt(i, temp.matrix);

      temp.position.set(x, groundY + 0.44 + bob * 0.6, z);
      temp.scale.setScalar(0.92);
      temp.updateMatrix();
      this.cloakMesh.setMatrixAt(i, temp.matrix);

      const sway = Math.sin(this.elapsed * person.speed * 10 + person.phase);
      for (let leg = 0; leg < 2; leg += 1) {
        const side = leg === 0 ? -1 : 1;
        const sideX = Math.cos(heading) * side * 0.07;
        const sideZ = -Math.sin(heading) * side * 0.07;
        temp.position.set(x + sideX, groundY + 0.18 + Math.abs(sway) * 0.018, z + sideZ);
        temp.rotation.set(0.12 * sway * side, heading, 0);
        temp.scale.setScalar(0.86);
        temp.updateMatrix();
        this.legMesh.setMatrixAt(i * 2 + leg, temp.matrix);
      }

      temp.rotation.set(0, heading, 0);
      temp.position.y = groundY + 0.93 + bob;
      temp.scale.setScalar(1);
      temp.updateMatrix();
      this.headMesh.setMatrixAt(i, temp.matrix);

      temp.position.set(x, groundY + 0.05, z);
      temp.rotation.set(-Math.PI / 2, 0, 0);
      temp.scale.set(1, 0.6, 1);
      temp.updateMatrix();
      this.personShadowMesh.setMatrixAt(i, temp.matrix);
    }
    this.bodyMesh.instanceMatrix.needsUpdate = true;
    this.cloakMesh.instanceMatrix.needsUpdate = true;
    this.legMesh.instanceMatrix.needsUpdate = true;
    this.headMesh.instanceMatrix.needsUpdate = true;
    this.personShadowMesh.instanceMatrix.needsUpdate = true;
  }

  updateFlags() {
    for (const flag of this.flags) {
      flag.rotation.z = Math.sin(this.elapsed * 2.3 + flag.userData.phase) * 0.08;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.renderedOnce = true;
    this.updateDistrictLabels();
    if (this.renderer.shadowMap.autoUpdate) {
      this.shadowFrames += 1;
      if (this.shadowFrames > 2) this.renderer.shadowMap.autoUpdate = false;
    }
    if (!this.lastMinimapDraw || performance.now() - this.lastMinimapDraw > 180) {
      this.drawMinimap();
      this.lastMinimapDraw = performance.now();
    }
  }

  advanceTime(ms) {
    const steps = Math.max(1, Math.round(ms / (CLOCK_STEP * 1000)));
    for (let i = 0; i < steps; i += 1) this.step(CLOCK_STEP);
    this.render();
  }

  drawMinimap() {
    if (!this.minimap || !this.worldData) return;
    const ctx = this.minimap.getContext("2d");
    const { width, height } = this.minimap;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(251,239,205,.76)";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(90,58,30,.26)";
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

    const project = (x, z) => ({
      x: ((x + MAP_LIMIT) / (MAP_LIMIT * 2)) * width,
      y: ((z + MAP_LIMIT) / (MAP_LIMIT * 2)) * height
    });

    const clustersById = new Map(this.worldData.clusters.map((cluster) => [cluster.id, cluster]));
    const minimapLinks = [
      ["ai", "frontend"],
      ["frontend", "infra"],
      ["infra", "database"],
      ["database", "mobile"],
      ["mobile", "game"],
      ["game", "ai"]
    ];
    ctx.save();
    ctx.strokeStyle = "rgba(88,61,36,.28)";
    ctx.lineWidth = 1.2;
    for (const [fromId, toId] of minimapLinks) {
      const from = clustersById.get(fromId);
      const to = clustersById.get(toId);
      if (!from || !to) continue;
      const a = project(from.centroid.x, from.centroid.z);
      const b = project(to.centroid.x, to.centroid.z);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    for (const lake of WATER_LAKES) {
      const p = project(lake.x, lake.z);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(179, 155, 103, .52)";
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y,
        (lake.rx * 1.18 / (MAP_LIMIT * 2)) * width,
        (lake.rz * 1.25 / (MAP_LIMIT * 2)) * height,
        lake.rotation,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = "rgba(90, 177, 190, .78)";
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y,
        (lake.rx / (MAP_LIMIT * 2)) * width,
        (lake.rz / (MAP_LIMIT * 2)) * height,
        lake.rotation,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    for (const course of WATER_COURSES) {
      const projected = course.points.map(([x, z]) => project(x, z));
      ctx.globalAlpha = 0.52;
      ctx.strokeStyle = "rgba(177, 149, 98, .58)";
      ctx.lineWidth = Math.max(1, (course.width + 1.3) * 0.72);
      ctx.beginPath();
      projected.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.globalAlpha = course.type === "canal" ? 0.64 : 0.82;
      ctx.strokeStyle = course.type === "canal" ? "rgba(96, 172, 183, .78)" : "rgba(68, 160, 181, .86)";
      ctx.lineWidth = Math.max(1, course.width * 0.62);
      ctx.beginPath();
      projected.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    ctx.restore();

    const reposByTopic = new Map();
    for (const repo of this.worldData.repos) {
      if (!reposByTopic.has(repo.topic)) reposByTopic.set(repo.topic, []);
      reposByTopic.get(repo.topic).push(repo);
    }

    for (const cluster of this.worldData.clusters) {
      const style = getTopicStyle(cluster.id);
      const p = project(cluster.centroid.x, cluster.centroid.z);
      const territory = getDistrictTerritory(cluster, reposByTopic.get(cluster.id) ?? [], this.worldData.clusters);
      ctx.save();
      ctx.globalAlpha = 0.42 + cluster.averageHotness * 0.34;
      ctx.fillStyle = style.groundWash;
      ctx.strokeStyle = style.boundaryTint;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y,
        (territory.radiusX / (MAP_LIMIT * 2)) * width,
        (territory.radiusZ / (MAP_LIMIT * 2)) * height,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.font = "700 9px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const cluster of this.worldData.clusters) {
      const p = project(cluster.centroid.x, cluster.centroid.z);
      ctx.fillStyle = "rgba(255,248,220,.88)";
      ctx.beginPath();
      ctx.roundRect(p.x - 13, p.y - 6, 26, 12, 3);
      ctx.fill();
      ctx.fillStyle = "#2a2117";
      ctx.fillText(topicAbbreviation(cluster.id), p.x, p.y + 0.5);
    }
    ctx.restore();

    const repoSampleStride = Math.max(1, Math.ceil(this.worldData.repos.length / 260));
    for (let index = 0; index < this.worldData.repos.length; index += repoSampleStride) {
      const repo = this.worldData.repos[index];
      const p = project(repo.position.x, repo.position.z);
      ctx.fillStyle = repo.buildingType === "castle" ? "#7f452c" : repo.topicColor;
      ctx.globalAlpha = repo.buildingType === "castle" ? 0.9 : 0.55;
      ctx.beginPath();
      ctx.arc(p.x, p.y, repo.buildingType === "castle" ? 3.3 : 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const target = project(this.cameraState.target.x, this.cameraState.target.z);
    ctx.strokeStyle = "#2a2117";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(target.x - 7, target.y);
    ctx.lineTo(target.x + 7, target.y);
    ctx.moveTo(target.x, target.y - 7);
    ctx.lineTo(target.x, target.y + 7);
    ctx.stroke();
  }

  worldToScreen(x, y, z) {
    const vector = new THREE.Vector3(x, y, z).project(this.camera);
    return {
      x: Math.round((vector.x * 0.5 + 0.5) * this.renderer.domElement.clientWidth),
      y: Math.round((-vector.y * 0.5 + 0.5) * this.renderer.domElement.clientHeight),
      visible: vector.z > -1 && vector.z < 1
    };
  }

  renderGameToText() {
    const errors = window.__gitlandErrors ?? { consoleErrors: [], assetErrors: [], webglErrors: [] };
    const rendererInfo = this.renderer.info.render;
    const selectedId = this.selectedRepo?.id ?? null;
    const hoveredId = this.hoveredRepo?.id ?? null;
    const repoPayload = this.worldData.repos.map((repo) => ({
      name: repo.fullName,
      topic: repo.topic,
      topicLabel: repo.topicLabel,
      topicColor: repo.topicColor,
      roofColor: repo.roofColor,
      wallTint: getTopicStyle(repo.topic).wallTint,
      styleSignature: {
        accentTint: getTopicStyle(repo.topic).accentTint,
        landmark: getTopicStyle(repo.topic).landmark,
        roofTint: getTopicStyle(repo.topic).roofTint
      },
      geometrySignature: {
        widthScale: getTopicStyle(repo.topic).widthScale,
        depthScale: getTopicStyle(repo.topic).depthScale,
        heightScale: getTopicStyle(repo.topic).heightScale,
        roofPitch: getTopicStyle(repo.topic).roofPitch,
        timberFrame: getTopicStyle(repo.topic).timberFrame
      },
      buildingType: repo.buildingType,
      castleTier: repo.buildingType === "castle" ? castleTier(repo) : 0,
      position: [roundedNumber(repo.position.x), 0, roundedNumber(repo.position.z)],
      screen: this.worldToScreen(repo.position.x, repo.height + 3, repo.position.z),
      clickScreen: this.worldToScreen(repo.position.x, Math.max(2, repo.height * 0.45), repo.position.z),
      height: roundedNumber(repo.height),
      influence: roundedNumber(repo.influence),
      hotness: roundedNumber(repo.hotness),
      detailLevel: repo.detailLevel,
      peopleCount: repo.peopleCount,
      recentActivity90d: repo.recent,
      visible: true,
      selected: repo.id === selectedId
    }));

    const topicIdentity = this.worldData.clusters.map((cluster) => {
      const style = getTopicStyle(cluster.id);
      const repos = this.worldData.repos.filter((repo) => repo.topic === cluster.id);
      const typeCount = (type) => repos.filter((repo) => repo.buildingType === type).length;
      const people = repos.reduce((total, repo) => total + repo.peopleCount, 0);
      const roadStats = this.roadStats.roadsByCluster[cluster.id] ?? {};
      const territory = getDistrictTerritory(cluster, repos, this.worldData.clusters);
      return {
        topic: cluster.id,
        label: cluster.label,
        repoCount: cluster.repoCount,
        colors: {
          topic: cluster.color,
          groundWash: style.groundWash,
          plazaTint: style.plazaTint,
          wallTint: style.wallTint,
          roofTint: style.roofTint,
          accentTint: style.accentTint,
          boundaryTint: style.boundaryTint,
          roadTint: style.roadTint,
          edgeTint: style.edgeTint,
          lotTint: style.lotTint,
          fieldTint: style.fieldTint,
          crateTint: style.crateTint
        },
        architecture: {
          landmark: style.landmark,
          widthScale: style.widthScale,
          depthScale: style.depthScale,
          heightScale: style.heightScale,
          roofPitch: style.roofPitch,
          towerHeightScale: style.towerHeightScale,
          towerRadiusScale: style.towerRadiusScale,
          timberFrame: style.timberFrame
        },
        counts: {
          repos: repos.length,
          castles: typeCount("castle"),
          guildhalls: typeCount("guildhall"),
          manors: typeCount("manor"),
          houses: typeCount("house"),
          outposts: repos.filter((repo) => repo.detailLevel === "outpost").length,
          plazaLoops: roadStats.plazaLoops ?? 0,
          radialLanes: roadStats.radialLanes ?? 0,
          crossLanes: roadStats.crossLanes ?? 0,
          people
        },
        territory: {
          radius: roundedNumber(territory.radius),
          radiusX: roundedNumber(territory.radiusX),
          radiusZ: roundedNumber(territory.radiusZ)
        },
        screen: this.worldToScreen(cluster.centroid.x, 2, cluster.centroid.z),
        labelScreen: this.worldToScreen(cluster.centroid.x, terrainHeight(cluster.centroid.x, cluster.centroid.z) + 14, cluster.centroid.z),
        styleFallback: !TOPIC_STYLES[cluster.id]
      };
    });

    return JSON.stringify({
      scene: {
        isCanvasBlank: false,
        loaded: this.renderedOnce,
        theme: "medieval",
        dataSource: this.worldData.dataSource,
        collectedAt: this.worldData.collectedAt,
        timeWindowDays: this.worldData.timeWindowDays,
        generatedDays: this.worldData.generatedDays,
        repoCount: this.worldData.repos.length,
        representedRepositoryTotal: this.worldData.representedRepositoryTotal,
        buildingCount: this.worldData.repos.length,
        roadCount: this.roads.length + this.cityRoadCount,
        cityRoadCount: this.cityRoadCount,
        districtLabelCount: this.districtLabels.length,
        scenicFeatures: this.scenicFeatures,
        roadNetwork: {
          total: this.roads.length + this.cityRoadCount,
          interDistrictRoads: this.roadStats.interDistrict,
          landmarkSpurs: this.roadStats.landmarkSpurs,
          cityRoadCount: this.cityRoadCount,
          plazaLoops: this.roadStats.plazaLoops,
          radialLanes: this.roadStats.radialLanes,
          crossLanes: this.roadStats.crossLanes,
          sourceRepoCount: this.roadStats.sourceRepoCount,
          maxCityPathsPerCluster: this.roadStats.maxCityPathsPerCluster,
          localRoadsVisible: this.localRoadsVisible,
          roadsByCluster: this.roadStats.roadsByCluster
        },
        personCount: this.people.length
      },
      topicIdentity,
      camera: {
        mode: "aerial",
        position: [roundedNumber(this.camera.position.x), roundedNumber(this.camera.position.y), roundedNumber(this.camera.position.z)],
        target: [roundedNumber(this.cameraState.target.x), 0, roundedNumber(this.cameraState.target.z)],
        distance: roundedNumber(this.cameraState.distance),
        zoomLevel: roundedNumber((this.cameraState.distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)),
        withinBounds:
          Math.abs(this.cameraState.target.x) <= MAP_LIMIT && Math.abs(this.cameraState.target.z) <= MAP_LIMIT
      },
      clusters: this.worldData.clusters.map((cluster) => ({
        topic: cluster.id,
        label: cluster.label,
        repoCount: cluster.repoCount,
        centroid: [cluster.centroid.x, 0, cluster.centroid.z],
        averageHotness: roundedNumber(cluster.averageHotness)
      })),
      repos: repoPayload,
      interactions: {
        hoveredRepo: hoveredId,
        selectedRepo: selectedId,
        activeTopicFilter: null,
        activeSort: "hotness"
      },
      performance: {
        fpsApprox: Math.round(this.fps),
        drawCalls: rendererInfo.calls,
        triangles: rendererInfo.triangles,
        warnings: []
      },
      errors: {
        consoleErrors: errors.consoleErrors?.slice(-5) ?? [],
        assetErrors: errors.assetErrors?.slice(-5) ?? [],
        webglErrors: errors.webglErrors?.slice(-5) ?? []
      }
    });
  }
}

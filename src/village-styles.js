import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const SELECTED_PICK_IDS = [
  "obsidian-bastion",
  "rift-gate-citadel",
  "black-crown-keep",
  "building-test-fantasy-ghost",
  "building-test-zephyr-spire",
  "building-test-sunleaf-windmill",
  "building-test-rune-lock-shrine",
  "building-test-canopy-hut",
  "building-test-adventure-lodge",
  "building-test-lava-tide-temple",
  "building-test-tiny-wyvern-hatchery",
  "building-test-game-raid-storm",
  "building-test-great-horn-guildhall",
  "building-test-game-raid-lava",
  "building-test-future-aerogel"
];

const DISTRICTS = [
  {
    id: "ai",
    name: "AI Citadel",
    color: "#60c8dc",
    palette: {
      wall: "#dfe9e7",
      roof: "#243444",
      trim: "#55d0d7",
      accent: "#86f0ff",
      glow: "#9ef8ff",
      ground: "#b9d8cf"
    },
    anchors: ["building-test-future-aerogel", "rift-gate-citadel", "building-test-zephyr-spire"],
    brief: "Aerogel glass, split rift pylons, ghost towers, and signal spires create a clean intelligence order.",
    castles: ["black-crown-keep", "obsidian-bastion", "building-test-game-raid-storm", "rift-gate-citadel"],
    houses: ["building-test-canopy-hut", "building-test-adventure-lodge", "building-test-sunleaf-windmill", "building-test-future-aerogel"]
  },
  {
    id: "frontend",
    name: "Frontend Quarter",
    color: "#e6b64f",
    palette: {
      wall: "#ead7b2",
      roof: "#b9493a",
      trim: "#2c85b8",
      accent: "#f3cb55",
      glow: "#fff0a6",
      ground: "#d6c98e"
    },
    anchors: ["building-test-canopy-hut", "building-test-sunleaf-windmill", "building-test-rune-lock-shrine"],
    brief: "Readable craft village with bright facades, windmill motion, shrine gates, and warm banner detail.",
    castles: ["building-test-canopy-hut", "building-test-adventure-lodge", "building-test-sunleaf-windmill", "building-test-rune-lock-shrine"],
    houses: ["building-test-canopy-hut", "building-test-adventure-lodge", "building-test-sunleaf-windmill", "building-test-rune-lock-shrine"]
  },
  {
    id: "infra",
    name: "Infra Hills",
    color: "#7f8992",
    palette: {
      wall: "#59636b",
      roof: "#262a2d",
      trim: "#a86e3d",
      accent: "#f0a94e",
      glow: "#ffc66b",
      ground: "#a8b28c"
    },
    anchors: ["obsidian-bastion", "black-crown-keep", "building-test-game-raid-storm"],
    brief: "Heavy operations fortress language: basalt blocks, signal rods, gantries, and weathered iron.",
    castles: ["building-test-adventure-lodge", "obsidian-bastion", "black-crown-keep", "building-test-game-raid-storm"],
    houses: ["building-test-adventure-lodge", "building-test-rune-lock-shrine", "building-test-future-aerogel", "obsidian-bastion"]
  },
  {
    id: "database",
    name: "Database Borough",
    color: "#4ba7a4",
    palette: {
      wall: "#34383a",
      roof: "#2f4f52",
      trim: "#b88a45",
      accent: "#62c6d8",
      glow: "#f0b65a",
      ground: "#a3b7a2"
    },
    anchors: ["building-test-rune-lock-shrine", "building-test-fantasy-ghost", "black-crown-keep"],
    brief: "Archive civilization with vault rings, locked gates, stacked ledger roofs, and precise blue conduits.",
    castles: ["building-test-rune-lock-shrine", "obsidian-bastion", "building-test-fantasy-ghost", "black-crown-keep"],
    houses: ["building-test-adventure-lodge", "building-test-rune-lock-shrine", "building-test-future-aerogel", "obsidian-bastion"]
  },
  {
    id: "mobile",
    name: "Mobile Harbor",
    color: "#5dbd91",
    palette: {
      wall: "#c8d8b2",
      roof: "#4a8d68",
      trim: "#916c42",
      accent: "#74d5c7",
      glow: "#ddfff6",
      ground: "#b8cfa5"
    },
    anchors: ["building-test-canopy-hut", "building-test-adventure-lodge", "building-test-zephyr-spire"],
    brief: "Forest-harbor settlement: round leaf roofs, rope rails, portable lodges, and light vertical landmarks.",
    castles: ["building-test-canopy-hut", "building-test-adventure-lodge", "building-test-sunleaf-windmill", "building-test-zephyr-spire"],
    houses: ["building-test-canopy-hut", "building-test-adventure-lodge", "building-test-sunleaf-windmill", "building-test-zephyr-spire"]
  },
  {
    id: "game",
    name: "Game Commons",
    color: "#d65a3b",
    palette: {
      wall: "#5d4638",
      roof: "#8d2f27",
      trim: "#d7a64e",
      accent: "#f27a32",
      glow: "#ffe16a",
      ground: "#c2a078"
    },
    anchors: ["building-test-game-raid-lava", "building-test-game-raid-storm", "building-test-great-horn-guildhall"],
    brief: "Heroic raid village with horned halls, storm crests, lava cores, and trophy-like silhouettes.",
    castles: ["building-test-tiny-wyvern-hatchery", "building-test-great-horn-guildhall", "building-test-game-raid-storm", "building-test-game-raid-lava"],
    houses: ["building-test-tiny-wyvern-hatchery", "building-test-great-horn-guildhall", "building-test-game-raid-storm", "building-test-lava-tide-temple"]
  }
];

const STAGES = [
  { kind: "castle", label: "Castle I", tier: 1, scale: 0.62 },
  { kind: "castle", label: "Castle II", tier: 2, scale: 0.92 },
  { kind: "castle", label: "Castle III", tier: 3, scale: 1.25 },
  { kind: "castle", label: "Castle IV", tier: 4, scale: 1.92 },
  { kind: "house", label: "House I", tier: 1, scale: 0.52 },
  { kind: "house", label: "House II", tier: 2, scale: 0.7 },
  { kind: "house", label: "House III", tier: 3, scale: 0.88 },
  { kind: "house", label: "House IV", tier: 4, scale: 1.08 }
];

const canvas = document.querySelector("#style-canvas");
const districtList = document.querySelector("#district-list");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#bad4c3");
scene.fog = new THREE.FogExp2("#dfe8d8", 0.004);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.OrthographicCamera(-70, 70, 48, -48, 0.1, 800);
const root = new THREE.Group();
scene.add(root);

const materialCache = new Map();
const clock = new THREE.Clock();
let renderedOnce = false;

scene.add(new THREE.HemisphereLight("#f1f8ec", "#7f755e", 1.25));
const sun = new THREE.DirectionalLight("#fff3cb", 2.4);
sun.position.set(-42, 80, 44);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -110;
sun.shadow.camera.right = 110;
sun.shadow.camera.top = 90;
sun.shadow.camera.bottom = -90;
scene.add(sun);

const fill = new THREE.DirectionalLight("#b8d9ff", 0.45);
fill.position.set(60, 42, -46);
scene.add(fill);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(220, 170, 1, 1),
  new THREE.MeshStandardMaterial({ color: "#9eb879", roughness: 0.88 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function material(role, color, options = {}) {
  const key = `${role}:${color}:${JSON.stringify(options)}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({ color, ...options }));
  }
  return materialCache.get(key);
}

function materialSet(palette) {
  return {
    wall: material("wall", palette.wall, { roughness: 0.86 }),
    roof: material("roof", palette.roof, { roughness: 0.78, metalness: 0.04 }),
    trim: material("trim", palette.trim, { roughness: 0.58, metalness: 0.24 }),
    accent: material("accent", palette.accent, { roughness: 0.66, metalness: 0.08 }),
    dark: material("dark", "#171615", { roughness: 0.9 }),
    glow: material("glow", palette.glow, { emissive: palette.glow, emissiveIntensity: 0.62, roughness: 0.35 }),
    glass: material("glass", palette.accent, { transparent: true, opacity: 0.46, roughness: 0.12, metalness: 0.03 })
  };
}

function add(group, geometry, mat, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(options.rx ?? 0, options.ry ?? 0, options.rz ?? 0);
  mesh.scale.set(options.sx ?? 1, options.sy ?? 1, options.sz ?? 1);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  group.add(mesh);
  return mesh;
}

function box(group, mats, key, width, height, depth, x, y, z, options = {}) {
  return add(group, new RoundedBoxGeometry(width, height, depth, 2, options.radius ?? 0.08), mats[key], x, y, z, options);
}

function cylinder(group, mats, key, radiusTop, radiusBottom, height, segments, x, y, z, options = {}) {
  return add(group, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mats[key], x, y, z, options);
}

function cone(group, mats, key, radius, height, segments, x, y, z, options = {}) {
  return add(group, new THREE.ConeGeometry(radius, height, segments), mats[key], x, y, z, options);
}

function torus(group, mats, key, radius, tube, x, y, z, options = {}) {
  return add(group, new THREE.TorusGeometry(radius, tube, 10, 52), mats[key], x, y, z, options);
}

function sphere(group, mats, key, radius, x, y, z, options = {}) {
  return add(group, new THREE.SphereGeometry(radius, 16, 10), mats[key], x, y, z, options);
}

function door(group, mats, x, y, z, width = 0.44, height = 0.7) {
  box(group, mats, "dark", width, height, 0.08, x, y, z, { radius: 0.03 });
}

function windowSlot(group, mats, x, y, z, width = 0.24, height = 0.42) {
  box(group, mats, "glow", width, height, 0.06, x, y, z, { radius: 0.02, castShadow: false });
}

function bladeFan(group, mats, x, y, z, size = 1) {
  cylinder(group, mats, "trim", 0.08 * size, 0.08 * size, 0.14 * size, 10, x, y, z, { rx: Math.PI / 2 });
  for (let i = 0; i < 4; i += 1) {
    box(group, mats, "trim", 0.16 * size, 1.1 * size, 0.06 * size, x, y, z + 0.05, {
      rz: i * Math.PI / 2,
      radius: 0.02
    });
  }
}

function addTierDetails(group, mats, tier, castle) {
  const count = castle ? tier + 2 : tier;
  for (let i = 0; i < count; i += 1) {
    const x = -1.1 + i * (2.2 / Math.max(1, count - 1));
    windowSlot(group, mats, x, 1.45 + tier * 0.34, 1.16 + tier * 0.08, 0.14, 0.34);
  }
  if (tier >= 3) {
    for (const x of [-1.35, 1.35]) cylinder(group, mats, "trim", 0.05, 0.07, 1.4, 8, x, 2.0 + tier * 0.45, 1.1);
  }
  if (tier >= 4) {
    torus(group, mats, "accent", 2.0, 0.04, 0, 3.2 + tier * 0.34, 0, { rx: Math.PI / 2.4, castShadow: false });
  }
}

function addCastleTierFrame(group, mats, district, tier, pickId) {
  if (tier < 2) return;
  const wallSize = 2.8 + tier * 1.15;
  const wallHeight = 0.42 + tier * 0.18;
  const wallY = 0.58 + wallHeight * 0.5;
  const depth = 0.22 + tier * 0.03;
  const matKey = tier >= 4 ? "dark" : "trim";
  box(group, mats, matKey, wallSize, wallHeight, depth, 0, wallY, wallSize * 0.52, { radius: 0.03 });
  box(group, mats, matKey, wallSize, wallHeight, depth, 0, wallY, -wallSize * 0.52, { radius: 0.03 });
  box(group, mats, matKey, depth, wallHeight, wallSize, wallSize * 0.52, wallY, 0, { radius: 0.03 });
  box(group, mats, matKey, depth, wallHeight, wallSize, -wallSize * 0.52, wallY, 0, { radius: 0.03 });
  const towerRadius = 0.26 + tier * 0.08;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cylinder(group, mats, "wall", towerRadius, towerRadius * 1.14, wallHeight + tier * 0.28, 8, sx * wallSize * 0.52, wallY + tier * 0.14, sz * wallSize * 0.52);
  }
  if (tier >= 3) {
    const spireOffset = wallSize * 0.38;
    for (const x of [-spireOffset, spireOffset]) {
      cone(group, mats, "roof", 0.34 + tier * 0.08, 1.1 + tier * 0.24, 8, x, wallY + wallHeight + 0.62 + tier * 0.24, wallSize * 0.55);
    }
  }
  addFactionTierMarks(group, mats, district, tier, wallSize);
  addDistrictCastleSignature(group, mats, district, tier, wallSize, wallY, wallHeight, pickId);
  if (tier >= 4) {
    const gateHeight = 2.3;
    box(group, mats, "wall", 1.2, gateHeight, 0.52, 0, wallY + gateHeight * 0.45, wallSize * 0.62, { radius: 0.08 });
    box(group, mats, "glow", 0.42, gateHeight * 0.82, 0.08, 0, wallY + gateHeight * 0.5, wallSize * 0.89, { castShadow: false });
    addFactionCrown(group, mats, district, pickId, wallSize);
  }
}

function addFactionTierMarks(group, mats, district, tier, wallSize) {
  if (district.id === "ai") {
    for (let i = 0; i < tier; i += 1) {
      const x = -0.8 + i * 0.8;
      box(group, mats, "glass", 0.42, 0.42, 0.42, x, 3.2 + i * 0.35, -wallSize * 0.52, { ry: i * 0.4, castShadow: false });
    }
    torus(group, mats, "glow", 0.9 + tier * 0.18, 0.035, 0, 3.15 + tier * 0.28, 0, { rx: Math.PI / 2, castShadow: false });
    return;
  }
  if (district.id === "frontend") {
    const bannerCount = tier + 2;
    for (let i = 0; i < bannerCount; i += 1) {
      const x = -wallSize * 0.35 + i * ((wallSize * 0.7) / Math.max(1, bannerCount - 1));
      box(group, mats, i % 2 ? "accent" : "trim", 0.24, 0.78, 0.08, x, 2.55 + tier * 0.2, wallSize * 0.65, { radius: 0.02 });
    }
    if (tier >= 3) bladeFan(group, mats, wallSize * 0.18, 3.85 + tier * 0.3, wallSize * 0.48, 0.5 + tier * 0.08);
    return;
  }
  if (district.id === "infra") {
    for (const x of [-wallSize * 0.32, 0, wallSize * 0.32]) {
      cylinder(group, mats, "trim", 0.05, 0.07, 1.6 + tier * 0.28, 8, x, 2.9 + tier * 0.28, -wallSize * 0.44);
      sphere(group, mats, "glow", 0.14 + tier * 0.03, x, 3.72 + tier * 0.42, -wallSize * 0.44, { castShadow: false });
    }
    box(group, mats, "accent", wallSize * 0.72, 0.13, 0.16, 0, 3.35 + tier * 0.34, -wallSize * 0.44, { rz: -0.1 });
    return;
  }
  if (district.id === "database") {
    for (let i = 0; i < tier; i += 1) {
      torus(group, mats, i % 2 ? "trim" : "glow", 0.7 + i * 0.22, 0.032, 0, 2.7 + i * 0.38, wallSize * 0.48, { rx: Math.PI / 2, castShadow: false });
    }
    for (const x of [-0.7, 0, 0.7]) box(group, mats, "glow", 0.16, 1.0 + tier * 0.2, 0.08, x, 2.15 + tier * 0.26, wallSize * 0.62, { castShadow: false });
    return;
  }
  if (district.id === "mobile") {
    for (let i = 0; i < tier; i += 1) {
      const x = -wallSize * 0.28 + i * 0.72;
      sphere(group, mats, "roof", 0.44 + tier * 0.03, x, 2.55 + i * 0.28, wallSize * 0.46, { sy: 0.32 });
      cylinder(group, mats, "trim", 0.035, 0.045, 1.0 + tier * 0.1, 8, x, 2.1 + i * 0.22, wallSize * 0.43);
    }
    return;
  }
  if (district.id === "game") {
    for (const x of [-wallSize * 0.28, wallSize * 0.28]) {
      cone(group, mats, "trim", 0.26 + tier * 0.06, 1.05 + tier * 0.28, 5, x, 3.0 + tier * 0.3, wallSize * 0.48, { rz: x < 0 ? 0.32 : -0.32 });
    }
    if (tier >= 3) sphere(group, mats, "glow", 0.34 + tier * 0.05, 0, 3.6 + tier * 0.38, wallSize * 0.42, { castShadow: false });
  }
}

function addFactionCrown(group, mats, district, pickId, wallSize) {
  if (district.id === "ai") {
    torus(group, mats, "glow", wallSize * 0.28, 0.045, 0, 6.7, 0, { rx: Math.PI / 2, castShadow: false });
    sphere(group, mats, "glass", 0.54, 0, 6.72, 0, { castShadow: false });
    return;
  }
  if (district.id === "frontend") {
    for (let i = 0; i < 6; i += 1) {
      const x = -1.2 + i * 0.48;
      box(group, mats, i % 2 ? "accent" : "trim", 0.28, 0.7, 0.12, x, 5.8 + (i % 2) * 0.22, wallSize * 0.48, { radius: 0.02 });
    }
    bladeFan(group, mats, 0, 6.25, wallSize * 0.46, 0.7);
    return;
  }
  if (district.id === "infra") {
    for (const x of [-1.2, 0, 1.2]) cylinder(group, mats, "trim", 0.08, 0.1, 2.0, 8, x, 5.9, wallSize * 0.35, { rz: x * 0.08 });
    box(group, mats, "accent", 3.2, 0.18, 0.16, 0, 6.8, wallSize * 0.35, { rz: -0.14 });
    return;
  }
  if (district.id === "database") {
    torus(group, mats, "trim", 1.55, 0.055, 0, 5.9, wallSize * 0.4, { rx: Math.PI / 2, castShadow: false });
    box(group, mats, "glow", 0.4, 1.8, 0.12, 0, 5.9, wallSize * 0.48, { castShadow: false });
    return;
  }
  if (district.id === "mobile") {
    sphere(group, mats, "roof", 1.35, 0, 5.75, wallSize * 0.32, { sy: 0.3 });
    for (const x of [-1.25, 1.25]) cylinder(group, mats, "trim", 0.06, 0.08, 1.55, 8, x, 5.2, wallSize * 0.28);
    return;
  }
  if (district.id === "game") {
    for (const x of [-1.1, 1.1]) cone(group, mats, "trim", 0.34, 1.55, 5, x, 5.75, wallSize * 0.36, { rz: x * 0.34 });
    sphere(group, mats, "glow", 0.58, 0, 5.72, wallSize * 0.38, { castShadow: false });
  }
}

function addDistrictCastleSignature(group, mats, district, tier, wallSize, wallY, wallHeight, pickId) {
  const front = wallSize * 0.72;
  const rear = -wallSize * 0.55;
  const crestY = wallY + wallHeight + 0.85;
  const wide = wallSize * 0.46;
  if (district.id === "ai") {
    for (const x of [-wide, wide]) {
      box(group, mats, "glass", 0.34 + tier * 0.04, 1.3 + tier * 0.42, 0.34 + tier * 0.04, x, crestY + tier * 0.22, rear, {
        ry: x > 0 ? 0.22 : -0.22,
        castShadow: false
      });
    }
    if (tier >= 4 || pickId === "rift-gate-citadel") {
      torus(group, mats, "glow", 1.15 + tier * 0.18, 0.045, 0, crestY + 0.72, front * 0.2, { rx: Math.PI / 2, castShadow: false });
    }
    return;
  }
  if (district.id === "frontend") {
    const awningCount = tier + 3;
    for (let i = 0; i < awningCount; i += 1) {
      const x = -wallSize * 0.42 + i * ((wallSize * 0.84) / Math.max(1, awningCount - 1));
      cone(group, mats, i % 2 ? "accent" : "roof", 0.22 + tier * 0.03, 0.54 + tier * 0.08, 4, x, wallY + wallHeight + 0.36, front, {
        ry: Math.PI / 4
      });
    }
    if (tier >= 3) bladeFan(group, mats, -wallSize * 0.36, crestY + 0.2, front * 0.88, 0.72 + tier * 0.08);
    if (tier >= 4) {
      for (const x of [-0.95, 0.95]) box(group, mats, "wall", 0.38, 2.25, 0.32, x, crestY, front * 0.9, { radius: 0.04 });
      box(group, mats, "roof", 2.55, 0.34, 0.62, 0, crestY + 1.24, front * 0.9, { radius: 0.04 });
      box(group, mats, "glow", 0.52, 1.65, 0.08, 0, crestY + 0.25, front * 1.02, { castShadow: false });
    }
    return;
  }
  if (district.id === "infra") {
    box(group, mats, "dark", wallSize * 0.72, 0.18, 0.2, 0, crestY + 0.18, rear, { radius: 0.02 });
    for (const x of [-wallSize * 0.42, 0, wallSize * 0.42]) {
      cylinder(group, mats, "trim", 0.07, 0.09, 1.55 + tier * 0.36, 8, x, crestY + 0.5 + tier * 0.1, rear);
    }
    if (tier >= 3) {
      for (const x of [-wallSize * 0.32, wallSize * 0.32]) {
        box(group, mats, "accent", 0.18, 1.7, 0.18, x, crestY + 0.5, front * 0.58, { rz: x > 0 ? -0.18 : 0.18 });
      }
    }
    if (tier >= 4) {
      box(group, mats, "trim", wallSize * 0.92, 0.18, 0.22, 0, crestY + 1.85, rear * 0.88, { rz: -0.12 });
      for (const x of [-wide, wide]) sphere(group, mats, "glow", 0.22, x, crestY + 2.05, rear * 0.9, { castShadow: false });
    }
    return;
  }
  if (district.id === "database") {
    torus(group, mats, "trim", 0.95 + tier * 0.26, 0.055, 0, crestY, front * 0.9, { rx: Math.PI / 2, castShadow: false });
    torus(group, mats, "glow", 0.58 + tier * 0.2, 0.036, 0, crestY, front * 0.93, { rx: Math.PI / 2, castShadow: false });
    if (tier >= 3) {
      for (const x of [-wallSize * 0.42, wallSize * 0.42]) {
        for (let i = 0; i < 3; i += 1) {
          box(group, mats, i % 2 ? "trim" : "wall", 0.68, 0.22, 0.52, x, crestY + i * 0.42, front * 0.52, { radius: 0.03 });
        }
      }
    }
    if (tier >= 4) {
      for (let i = 0; i < 4; i += 1) box(group, mats, "glow", 0.22, 0.56, 0.1, -0.48 + i * 0.32, crestY + 1.4 + i * 0.08, front * 0.98, { castShadow: false });
    }
    return;
  }
  if (district.id === "mobile") {
    const leafCount = tier + 2;
    for (let i = 0; i < leafCount; i += 1) {
      const x = -wallSize * 0.34 + i * ((wallSize * 0.68) / Math.max(1, leafCount - 1));
      sphere(group, mats, "roof", 0.5 + tier * 0.04, x, crestY + (i % 2) * 0.18, front * 0.68, { sy: 0.22 });
      cylinder(group, mats, "trim", 0.045, 0.06, 1.15 + tier * 0.18, 8, x, crestY - 0.52, front * 0.65);
    }
    if (tier >= 4) {
      for (const x of [-wide, wide]) {
        cylinder(group, mats, "trim", 0.07, 0.1, 2.45, 8, x, crestY + 0.7, rear * 0.92);
        cone(group, mats, "roof", 0.34, 0.78, 10, x, crestY + 2.28, rear * 0.92);
      }
    }
    return;
  }
  if (district.id === "game") {
    torus(group, mats, "glow", wallSize * 0.46, 0.045, 0, wallY + 0.08, 0, { rx: Math.PI / 2, castShadow: false });
    for (const x of [-wide, wide]) {
      cone(group, mats, "trim", 0.42 + tier * 0.06, 1.25 + tier * 0.25, 5, x, crestY + 0.25, front * 0.78, { rz: x > 0 ? -0.44 : 0.44 });
    }
    if (tier >= 4) {
      for (let i = 0; i < 5; i += 1) {
        const x = -1.2 + i * 0.6;
        cone(group, mats, i % 2 ? "accent" : "trim", 0.28, 1.15 + i * 0.08, 5, x, crestY + 1.55, front * 0.68, { rz: (i - 2) * -0.08 });
      }
      sphere(group, mats, "glow", 0.7, 0, crestY + 1.42, front * 0.64, { castShadow: false });
    }
  }
}

function buildObsidianBastion(group, mats, tier, castle) {
  const s = castle ? 1 + tier * 0.22 : 0.72 + tier * 0.12;
  box(group, mats, "dark", 4.4 * s, 0.7 * s, 3.8 * s, 0, 0.55 * s, 0);
  box(group, mats, "wall", 2.8 * s, 1.75 * s, 2.4 * s, 0, 1.75 * s, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cylinder(group, mats, "wall", 0.42 * s, 0.54 * s, 1.7 * s, 10, sx * 1.75 * s, 1.45 * s, sz * 1.45 * s);
    cylinder(group, mats, "roof", 0.5 * s, 0.43 * s, 0.3 * s, 10, sx * 1.75 * s, 2.42 * s, sz * 1.45 * s);
  }
  addTierDetails(group, mats, tier, castle);
}

function buildRiftGate(group, mats, tier, castle) {
  const s = castle ? 0.82 + tier * 0.24 : 0.58 + tier * 0.12;
  box(group, mats, "dark", 3.4 * s, 0.52 * s, 2.2 * s, 0, 0.45 * s, 0);
  box(group, mats, "wall", 0.95 * s, 3.5 * s, 0.95 * s, -0.75 * s, 2.1 * s, 0, { rz: -0.07 });
  box(group, mats, "wall", 0.85 * s, 3.95 * s, 1.05 * s, 0.85 * s, 2.3 * s, 0, { rz: 0.07 });
  box(group, mats, "glow", 0.14 * s, 3.15 * s, 0.12 * s, 0.04 * s, 2.2 * s, 0.68 * s, { castShadow: false });
  sphere(group, mats, "glass", 0.32 * s, 0.04 * s, 4.45 * s, 0.04 * s, { sy: 0.85, castShadow: false });
  if (tier >= 3) for (const x of [-1.65, 1.65]) cylinder(group, mats, "trim", 0.11 * s, 0.16 * s, 2.1 * s, 8, x * s, 1.65 * s, -0.8 * s);
  if (tier >= 4) torus(group, mats, "glow", 1.35 * s, 0.04 * s, 0, 3.1 * s, 0.66 * s, { rx: Math.PI / 2, castShadow: false });
}

function buildBlackCrown(group, mats, tier, castle) {
  const s = castle ? 0.78 + tier * 0.24 : 0.58 + tier * 0.11;
  box(group, mats, "wall", 2.3 * s, 3.55 * s, 2.2 * s, 0, 2.05 * s, 0);
  box(group, mats, "dark", 2.75 * s, 0.42 * s, 2.6 * s, 0, 3.98 * s, 0);
  for (let i = 0; i < 7 + tier; i += 1) {
    box(group, mats, i % 3 === 0 ? "trim" : "dark", 0.18 * s, (0.38 + (i % 3) * 0.16) * s, 0.16 * s, (-0.9 + i * 0.3) * s, 4.34 * s, 1.28 * s);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cone(group, mats, "roof", 0.22 * s, 0.95 * s, 4, sx * 1.05 * s, 4.7 * s, sz * 1.0 * s, { ry: Math.PI / 4 });
  }
  addTierDetails(group, mats, tier, castle);
}

function buildGhost(group, mats, tier, castle) {
  const s = castle ? 0.85 + tier * 0.18 : 0.62 + tier * 0.1;
  cylinder(group, mats, "glass", 1.05 * s, 1.18 * s, 2.3 * s, 14, 0, 1.55 * s, 0, { castShadow: false });
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    cylinder(group, mats, "trim", 0.05 * s, 0.07 * s, 2.1 * s, 6, Math.cos(angle) * 1.25 * s, 1.6 * s, Math.sin(angle) * 1.25 * s);
  }
  sphere(group, mats, "glow", 0.42 * s, 0, 2.95 * s, 0, { castShadow: false });
  if (tier >= 3) torus(group, mats, "accent", 1.35 * s, 0.04 * s, 0, 2.85 * s, 0, { rx: Math.PI / 2, castShadow: false });
}

function buildZephyrSpire(group, mats, tier, castle) {
  const s = castle ? 0.82 + tier * 0.2 : 0.56 + tier * 0.11;
  cylinder(group, mats, "wall", 0.52 * s, 0.72 * s, 3.2 * s, 12, 0, 2.05 * s, 0);
  cone(group, mats, "roof", 0.72 * s, 0.85 * s, 12, 0, 4.06 * s, 0);
  for (let i = 0; i < 2 + tier; i += 1) {
    torus(group, mats, i % 2 ? "trim" : "accent", (0.75 + i * 0.18) * s, 0.025 * s, 0, (2.35 + i * 0.34) * s, 0, {
      rx: Math.PI / (2.25 + i * 0.1),
      rz: i * 0.42,
      castShadow: false
    });
  }
  bladeFan(group, mats, 0.84 * s, 3.25 * s, 0.32 * s, 0.55 * s);
}

function buildWindmill(group, mats, tier, castle) {
  const s = castle ? 0.9 + tier * 0.16 : 0.62 + tier * 0.1;
  box(group, mats, "wall", 1.6 * s, 2.2 * s, 1.6 * s, 0, 1.55 * s, 0, { radius: 0.12 });
  cone(group, mats, "roof", 1.2 * s, 0.88 * s, 10, 0, 3.15 * s, 0);
  cylinder(group, mats, "trim", 0.12 * s, 0.16 * s, 2.6 * s, 8, 1.25 * s, 2.1 * s, 0.15 * s);
  bladeFan(group, mats, 1.25 * s, 3.35 * s, 0.24 * s, 0.72 * s);
  if (tier >= 3) for (const x of [-1.25, 1.25]) box(group, mats, "wall", 0.9 * s, 1.0 * s, 1.0 * s, x * s, 1.0 * s, -0.3 * s);
}

function buildShrine(group, mats, tier, castle) {
  const s = castle ? 0.86 + tier * 0.18 : 0.62 + tier * 0.1;
  box(group, mats, "wall", 2.0 * s, 1.45 * s, 1.8 * s, 0, 1.08 * s, 0);
  cone(group, mats, "roof", 1.6 * s, 0.72 * s, 6, 0, 2.2 * s, 0, { ry: Math.PI / 6 });
  torus(group, mats, "trim", 1.05 * s, 0.06 * s, 0, 1.92 * s, 0.96 * s, { rx: Math.PI / 2 });
  box(group, mats, "glow", 0.22 * s, 0.9 * s, 0.08 * s, 0, 1.42 * s, 1.02 * s, { castShadow: false });
  if (tier >= 3) for (const x of [-1.35, 1.35]) cylinder(group, mats, "wall", 0.28 * s, 0.34 * s, 1.85 * s, 8, x * s, 1.35 * s, -0.25 * s);
}

function buildCanopy(group, mats, tier, castle) {
  const s = castle ? 0.92 + tier * 0.14 : 0.64 + tier * 0.09;
  cylinder(group, mats, "wall", 0.95 * s, 1.1 * s, 1.35 * s, 12, 0, 1.05 * s, 0);
  sphere(group, mats, "roof", 1.35 * s, 0, 2.0 * s, 0, { sy: 0.36 });
  for (let i = 0; i < 4 + tier; i += 1) {
    const angle = (i / (4 + tier)) * Math.PI * 2;
    cylinder(group, mats, "trim", 0.035 * s, 0.045 * s, 1.2 * s, 6, Math.cos(angle) * 1.12 * s, 1.36 * s, Math.sin(angle) * 1.12 * s);
  }
  if (tier >= 4) sphere(group, mats, "glow", 0.28 * s, 0, 2.5 * s, 0.45 * s, { castShadow: false });
}

function buildLodge(group, mats, tier, castle) {
  const s = castle ? 0.85 + tier * 0.16 : 0.65 + tier * 0.1;
  box(group, mats, "wall", 2.4 * s, 1.3 * s, 1.75 * s, 0, 1.0 * s, 0);
  box(group, mats, "roof", 2.75 * s, 0.56 * s, 2.0 * s, 0, 1.78 * s, 0, { rz: 0.0 });
  door(group, mats, 0, 0.72 * s, 0.91 * s, 0.48 * s, 0.68 * s);
  for (const x of [-0.68, 0.68]) windowSlot(group, mats, x * s, 1.08 * s, 0.93 * s, 0.24 * s, 0.32 * s);
  if (tier >= 3) box(group, mats, "wall", 1.0 * s, 1.0 * s, 1.2 * s, 1.65 * s, 0.86 * s, -0.25 * s);
  if (tier >= 4) cylinder(group, mats, "trim", 0.08 * s, 0.1 * s, 1.2 * s, 8, -1.45 * s, 2.2 * s, -0.35 * s);
}

function buildLavaTemple(group, mats, tier, castle) {
  const s = castle ? 0.78 + tier * 0.22 : 0.56 + tier * 0.11;
  for (let i = 0; i < 3; i += 1) {
    box(group, mats, i === 2 ? "wall" : "dark", (3.4 - i * 0.68) * s, 0.58 * s, (3.0 - i * 0.58) * s, 0, (0.45 + i * 0.56) * s, 0);
  }
  box(group, mats, "glow", 0.36 * s, 1.2 * s, 0.12 * s, 0, 1.55 * s, 1.22 * s, { castShadow: false });
  if (tier >= 3) for (const x of [-1.25, 1.25]) cone(group, mats, "roof", 0.38 * s, 1.1 * s, 7, x * s, 2.55 * s, -0.7 * s);
  if (tier >= 4) sphere(group, mats, "glow", 0.52 * s, 0, 3.05 * s, 0, { castShadow: false });
}

function buildHatchery(group, mats, tier, castle) {
  const s = castle ? 0.82 + tier * 0.12 : 0.6 + tier * 0.08;
  sphere(group, mats, "wall", 1.15 * s, 0, 1.0 * s, 0, { sy: 0.56 });
  for (const x of [-0.75, 0.75]) cone(group, mats, "trim", 0.22 * s, 0.85 * s, 6, x * s, 1.65 * s, 0.1 * s, { rz: x < 0 ? 0.25 : -0.25 });
  sphere(group, mats, "accent", 0.34 * s, 0, 1.46 * s, 0.45 * s);
  if (tier >= 3) for (const x of [-1.0, 1.0]) sphere(group, mats, "glow", 0.22 * s, x * s, 0.65 * s, 0.9 * s, { castShadow: false });
}

function buildRaidStorm(group, mats, tier, castle) {
  const s = castle ? 0.82 + tier * 0.2 : 0.58 + tier * 0.1;
  cylinder(group, mats, "wall", 1.05 * s, 1.24 * s, 1.8 * s, 10, 0, 1.25 * s, 0);
  box(group, mats, "roof", 2.3 * s, 0.36 * s, 2.1 * s, 0, 2.22 * s, 0);
  for (let i = 0; i < 3 + tier; i += 1) {
    const angle = (i / (3 + tier)) * Math.PI * 2;
    cylinder(group, mats, "trim", 0.04 * s, 0.06 * s, 1.2 * s, 6, Math.cos(angle) * 1.08 * s, 2.85 * s, Math.sin(angle) * 1.08 * s, { rz: 0.24 });
  }
  box(group, mats, "glow", 0.18 * s, 1.1 * s, 0.1 * s, 0, 1.55 * s, 1.08 * s, { castShadow: false });
}

function buildGuildhall(group, mats, tier, castle) {
  const s = castle ? 0.88 + tier * 0.18 : 0.62 + tier * 0.1;
  box(group, mats, "wall", 2.5 * s, 1.45 * s, 2.0 * s, 0, 1.1 * s, 0);
  cone(group, mats, "roof", 1.55 * s, 0.95 * s, 6, 0, 2.25 * s, 0);
  for (const x of [-1, 1]) cone(group, mats, "trim", 0.22 * s, 1.1 * s, 5, x * 1.25 * s, 2.3 * s, 0.35 * s, { rz: x * 0.38 });
  door(group, mats, 0, 0.72 * s, 1.04 * s, 0.52 * s, 0.72 * s);
  if (tier >= 3) box(group, mats, "accent", 1.3 * s, 0.22 * s, 0.12 * s, 0, 1.62 * s, 1.08 * s);
}

function buildAerogel(group, mats, tier, castle) {
  const s = castle ? 0.82 + tier * 0.2 : 0.56 + tier * 0.1;
  box(group, mats, "glass", 1.6 * s, 1.6 * s, 1.6 * s, 0, 1.25 * s, 0, { radius: 0.16, castShadow: false });
  box(group, mats, "trim", 1.85 * s, 0.16 * s, 1.85 * s, 0, 0.42 * s, 0);
  for (let i = 0; i < tier; i += 1) {
    box(group, mats, "wall", 0.42 * s, 0.9 * s, 0.42 * s, (-0.8 + i * 0.54) * s, (2.2 + i * 0.36) * s, -0.55 * s, { radius: 0.08 });
  }
  torus(group, mats, "glow", 1.15 * s, 0.035 * s, 0, 2.05 * s, 0, { rx: Math.PI / 2, castShadow: false });
}

const BUILDERS = {
  "obsidian-bastion": buildObsidianBastion,
  "rift-gate-citadel": buildRiftGate,
  "black-crown-keep": buildBlackCrown,
  "building-test-fantasy-ghost": buildGhost,
  "building-test-zephyr-spire": buildZephyrSpire,
  "building-test-sunleaf-windmill": buildWindmill,
  "building-test-rune-lock-shrine": buildShrine,
  "building-test-canopy-hut": buildCanopy,
  "building-test-adventure-lodge": buildLodge,
  "building-test-lava-tide-temple": buildLavaTemple,
  "building-test-tiny-wyvern-hatchery": buildHatchery,
  "building-test-game-raid-storm": buildRaidStorm,
  "building-test-great-horn-guildhall": buildGuildhall,
  "building-test-game-raid-lava": buildLavaTemple,
  "building-test-future-aerogel": buildAerogel
};

function createStageModel(district, stage, pickId) {
  const group = new THREE.Group();
  const mats = materialSet(district.palette);
  const builder = BUILDERS[pickId] ?? buildLodge;
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(stage.kind === "castle" ? 3.0 : 2.05, stage.kind === "castle" ? 3.2 : 2.2, 0.22, 24),
    new THREE.MeshStandardMaterial({ color: district.palette.ground, roughness: 0.9 })
  );
  pad.position.y = 0.1;
  pad.receiveShadow = true;
  group.add(pad);
  builder(group, mats, stage.tier, stage.kind === "castle");
  if (stage.kind === "castle") addCastleTierFrame(group, mats, district, stage.tier, pickId);
  group.scale.setScalar(stage.scale);
  return group;
}

function layoutBoard() {
  const startX = -52;
  const startZ = -44;
  const columnGap = 14.8;
  const rowGap = 16.2;
  DISTRICTS.forEach((district, rowIndex) => {
    const rowZ = startZ + rowIndex * rowGap;
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(116, 13.2, 1, 1),
      new THREE.MeshStandardMaterial({
        color: district.palette.ground,
        roughness: 0.9,
        transparent: true,
        opacity: 0.62
      })
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.025, rowZ);
    strip.receiveShadow = true;
    root.add(strip);
    STAGES.forEach((stage, colIndex) => {
      const pickId = stage.kind === "castle" ? district.castles[colIndex] : district.houses[colIndex - 4];
      const model = createStageModel(district, stage, pickId);
      model.position.set(startX + colIndex * columnGap, 0, rowZ);
      model.rotation.y = -0.2 + rowIndex * 0.03;
      root.add(model);
    });
  });
}

function renderDistrictList() {
  districtList.innerHTML = "";
  for (const district of DISTRICTS) {
    const card = document.createElement("article");
    card.className = "district-card";
    card.style.setProperty("--district-color", district.color);
    card.innerHTML = `
      <h2>${district.name}</h2>
      <p>${district.brief}</p>
      <p><strong>Anchors:</strong> ${district.anchors.join(", ")}</p>
      <p><strong>Castles:</strong> ${district.castles.join(" -> ")}</p>
      <p><strong>Houses:</strong> ${district.houses.join(" -> ")}</p>
    `;
    districtList.append(card);
  }
}

function resize() {
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);
  const viewHeight = 108;
  const viewWidth = viewHeight * (width / height);
  camera.left = -viewWidth / 2;
  camera.right = viewWidth / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
}

function updateCamera() {
  const t = clock.getElapsedTime();
  camera.position.set(14 + Math.sin(t * 0.08) * 1.5, 132, 128);
  camera.lookAt(0, 1.6, 1);
}

function render() {
  updateCamera();
  renderer.render(scene, camera);
  renderedOnce = true;
}

function loop() {
  requestAnimationFrame(loop);
  render();
}

function renderGameToText() {
  return JSON.stringify({
    scene: {
      loaded: renderedOnce,
      selectedPickCount: SELECTED_PICK_IDS.length,
      districtCount: DISTRICTS.length,
      stagesPerDistrict: STAGES.length,
      castleTiers: 4,
      houseTiers: 4,
      theme: "village-style-board"
    },
    selectedPickIds: SELECTED_PICK_IDS,
    districts: DISTRICTS.map((district) => ({
      id: district.id,
      name: district.name,
      anchors: district.anchors,
      castles: district.castles,
      houses: district.houses
    })),
    performance: {
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    }
  });
}

window.addEventListener("resize", resize);
window.render_game_to_text = renderGameToText;
window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) render();
};

layoutBoard();
renderDistrictList();
resize();
loop();

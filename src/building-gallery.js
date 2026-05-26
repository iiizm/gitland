import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

window.__buildingLabErrors = { consoleErrors: [], assetErrors: [], webglErrors: [] };

const originalConsoleError = console.error.bind(console);
console.error = (...args) => {
  window.__buildingLabErrors.consoleErrors.push(args.map(String).join(" "));
  originalConsoleError(...args);
};

window.addEventListener("error", (event) => {
  window.__buildingLabErrors.assetErrors.push(event.message || "window error");
});

window.addEventListener("unhandledrejection", (event) => {
  window.__buildingLabErrors.consoleErrors.push(String(event.reason ?? "unhandled rejection"));
});

const FAMILIES = [
  "All",
  "Royal Arena",
  "Frontier",
  "Adventure",
  "Citadel",
  "Guild",
  "Outpost"
];

const VARIANTS = [
  {
    id: "crown-keep",
    family: "Royal Arena",
    name: "Crown Keep",
    archetype: "crownKeep",
    scale: "Large",
    summary: "A chunky tournament-city landmark with a stepped roof crown and strong banner read.",
    silhouette: "Tall square mass, crown parapet, four corner caps",
    materials: "Warm limestone, ceramic roof, brass trim",
    wall: "#d8c8a3",
    roof: "#8e4534",
    accent: "#376fae",
    trim: "#d99b37"
  },
  {
    id: "tournament-oval",
    family: "Royal Arena",
    name: "Tournament Oval",
    archetype: "arena",
    scale: "Large",
    summary: "A ring-like civic arena for highly active repositories and community hubs.",
    silhouette: "Low oval ring, raised royal box, rim pennants",
    materials: "Carved stone tiers, painted cloth, amber courtyard",
    wall: "#cdb98d",
    roof: "#b35b32",
    accent: "#b8792f",
    trim: "#e0a644"
  },
  {
    id: "banner-guildhall",
    family: "Royal Arena",
    name: "Banner Guildhall",
    archetype: "bannerHall",
    scale: "Medium",
    summary: "A broad hall with side wings and a giant entry banner.",
    silhouette: "Wide rectangle, low wings, oversized ridge roof",
    materials: "Plaster, timber ribs, royal cloth",
    wall: "#d9c09d",
    roof: "#87462f",
    accent: "#3f8f6b",
    trim: "#bb8430"
  },
  {
    id: "vault-stack",
    family: "Royal Arena",
    name: "Vault Stack",
    archetype: "vaultStack",
    scale: "Medium",
    summary: "Stacked archive drums for data-heavy repository identities.",
    silhouette: "Three offset octagonal drums with sealed doors",
    materials: "Stone vaults, violet enamel bands, brass seals",
    wall: "#bdb0a2",
    roof: "#65475a",
    accent: "#8a5aa8",
    trim: "#c28f3d"
  },
  {
    id: "forge-bastion",
    family: "Royal Arena",
    name: "Forge Bastion",
    archetype: "forge",
    scale: "Medium",
    summary: "A squat build-system fortress with heavy braces, vents, and warm forge windows.",
    silhouette: "Low bastion, chimney cluster, iron side braces",
    materials: "Charcoal stone, iron bands, ember glass",
    wall: "#8b8373",
    roof: "#40382e",
    accent: "#d9792f",
    trim: "#2f2b25"
  },
  {
    id: "harbor-crown-house",
    family: "Royal Arena",
    name: "Harbor Crown House",
    archetype: "harborHouse",
    scale: "Small",
    summary: "A compact teal-roofed manor with deck canopies and a mast-like crown.",
    silhouette: "Compact body, deck platform, mast finial",
    materials: "Cream walls, teal glaze, rope rails",
    wall: "#d5c5a0",
    roof: "#2f8f96",
    accent: "#2f8f96",
    trim: "#bd8a3b"
  },
  {
    id: "crystal-obelisk-manor",
    family: "Royal Arena",
    name: "Crystal Obelisk Manor",
    archetype: "crystalManor",
    scale: "Medium",
    summary: "A carved stone AI manor with a roof-set obelisk and blue enamel channels.",
    silhouette: "Stone manor, central obelisk, narrow slit windows",
    materials: "Silver stone, blue crystal, antique brass",
    wall: "#c7d1d5",
    roof: "#6d4541",
    accent: "#376fae",
    trim: "#c5a24a"
  },
  {
    id: "royal-workshop-row",
    family: "Royal Arena",
    name: "Royal Workshop Row",
    archetype: "workshopRow",
    scale: "Small",
    summary: "An asymmetric courtyard cluster for readable small-repository variety.",
    silhouette: "Two small blocks, lean-to roof, banner post",
    materials: "Plaster, timber, clay tile",
    wall: "#d7c49f",
    roof: "#8f5533",
    accent: "#b8792f",
    trim: "#6b4a2f"
  },
  {
    id: "trailhead-shack",
    family: "Frontier",
    name: "Trailhead Shack",
    archetype: "frontierShack",
    scale: "Small",
    summary: "A rugged low-influence outpost with a crooked frame and patched awning.",
    silhouette: "Low stone base, crooked timber upper, slanted awning",
    materials: "Rough limestone, dark timber, faded canvas",
    wall: "#c6b08d",
    roof: "#5a3f31",
    accent: "#8f4b32",
    trim: "#2f2923"
  },
  {
    id: "trackers-lodge",
    family: "Frontier",
    name: "Tracker Lodge",
    archetype: "lodge",
    scale: "Medium",
    summary: "A long lodge for stable mid-size repositories with porch posts and lanterns.",
    silhouette: "Long hall, steep patched roof, porch line",
    materials: "Wet timber, stone threshold, warm lanterns",
    wall: "#bfa781",
    roof: "#65432d",
    accent: "#7e9563",
    trim: "#3a2b22"
  },
  {
    id: "beast-cart-workshop",
    family: "Frontier",
    name: "Beast Cart Workshop",
    archetype: "craneWorkshop",
    scale: "Medium",
    summary: "A tooling guild building with oversized doors, a side crane, and hoist gear.",
    silhouette: "Wide double door, crane arm, roof vents",
    materials: "Timber frame, hammered iron, patched metal caps",
    wall: "#b7a280",
    roof: "#514338",
    accent: "#6b6f8f",
    trim: "#292620"
  },
  {
    id: "frontier-watchtower",
    family: "Frontier",
    name: "Frontier Watchtower",
    archetype: "watchtower",
    scale: "Medium",
    summary: "A lean vertical signal tower for monitoring, infra, and hot repositories.",
    silhouette: "Stone foot, timber shaft, canvas windbreaks",
    materials: "Stone base, lashed timber, brass signal brazier",
    wall: "#b8a17b",
    roof: "#6f4a34",
    accent: "#d99b37",
    trim: "#46372b"
  },
  {
    id: "hunter-market-hall",
    family: "Frontier",
    name: "Hunter Market Hall",
    archetype: "marketHall",
    scale: "Medium",
    summary: "An open-front market for community-heavy repositories and package ecosystems.",
    silhouette: "Arcade face, canvas stalls, lantern row",
    materials: "Canvas, timber ribs, stone arcade",
    wall: "#d1bd93",
    roof: "#8f4b32",
    accent: "#3f8f6b",
    trim: "#6b4d30"
  },
  {
    id: "archive-burrow",
    family: "Frontier",
    name: "Archive Burrow",
    archetype: "burrow",
    scale: "Medium",
    summary: "A partly embedded storage vault with round annexes and damp stone vents.",
    silhouette: "Half-buried vault, round side cells, vent pipes",
    materials: "Mossy stone, reinforced door, dark slate",
    wall: "#9b9a83",
    roof: "#5a5d52",
    accent: "#8a5aa8",
    trim: "#3d3a32"
  },
  {
    id: "harbor-skinners-quay",
    family: "Frontier",
    name: "Harbor Quay Lodge",
    archetype: "quay",
    scale: "Medium",
    summary: "A stilted harbor lodge with teal tarps, rope rails, and cargo nets.",
    silhouette: "Raised platform, rope rail, pulley mast",
    materials: "Wood deck, teal canvas, brass pulleys",
    wall: "#c6b993",
    roof: "#2f8f96",
    accent: "#2f8f96",
    trim: "#584532"
  },
  {
    id: "great-hunt-citadel",
    family: "Frontier",
    name: "Great Hunt Citadel",
    archetype: "huntCitadel",
    scale: "Large",
    summary: "A top-influence frontier citadel with a palisade court and twin watch platforms.",
    silhouette: "Heavy keep, outer court, twin timber platforms",
    materials: "Stone keep, timber palisade, smoke vents",
    wall: "#a99573",
    roof: "#5a3329",
    accent: "#b8792f",
    trim: "#2f2923"
  },
  {
    id: "sky-lantern-house",
    family: "Adventure",
    name: "Sky Lantern House",
    archetype: "skyLantern",
    scale: "Small",
    summary: "A light, readable hot-repo house with a roof lantern and side awnings.",
    silhouette: "Narrow body, split gable, glowing upper lantern",
    materials: "Pale plaster, cedar beams, amber glass",
    wall: "#dfcfaa",
    roof: "#8f5533",
    accent: "#ffd36a",
    trim: "#6d5433"
  },
  {
    id: "branchbeam-cottage",
    family: "Adventure",
    name: "Branchbeam Cottage",
    archetype: "branchCottage",
    scale: "Small",
    summary: "A timber house with curved beam language and a moss-soft roof mass.",
    silhouette: "Low cottage, curved beam posts, moss roof",
    materials: "Timber, plaster, mossy shingles",
    wall: "#d8c7a8",
    roof: "#66744f",
    accent: "#7e9563",
    trim: "#5d412d"
  },
  {
    id: "signal-spire-guildhall",
    family: "Adventure",
    name: "Signal Spire Guildhall",
    archetype: "signalSpire",
    scale: "Medium",
    summary: "A long hall with an open-frame tower and beacon crown.",
    silhouette: "Long base, open spire, hanging banners",
    materials: "Pale limestone, timber tower, glowing beacon",
    wall: "#d9ccb0",
    roof: "#69503e",
    accent: "#376fae",
    trim: "#c38f37"
  },
  {
    id: "canopy-market-hall",
    family: "Adventure",
    name: "Canopy Market Hall",
    archetype: "canopyMarket",
    scale: "Medium",
    summary: "An airy civic hall with open arcades and colored canvas strips.",
    silhouette: "Wide arcade, ribbed canopy, side stalls",
    materials: "Canvas, cedar ribs, warm plaster",
    wall: "#dfcaa3",
    roof: "#b38355",
    accent: "#3f8f6b",
    trim: "#6d4a2f"
  },
  {
    id: "terrace-forge-keep",
    family: "Adventure",
    name: "Terrace Forge Keep",
    archetype: "terraceForge",
    scale: "Large",
    summary: "A compact tiered keep with forge windows and utility cranes.",
    silhouette: "Stepped platforms, squat pylons, crane arm",
    materials: "Tiered stone, iron vents, warm forge light",
    wall: "#bcb6a6",
    roof: "#66543d",
    accent: "#d9792f",
    trim: "#3a3329"
  },
  {
    id: "ruin-garden-observatory",
    family: "Adventure",
    name: "Ruin Garden Observatory",
    archetype: "ruinObservatory",
    scale: "Large",
    summary: "A mature-repo landmark built into broken arches and planted terraces.",
    silhouette: "Round tower, broken arches, roof garden",
    materials: "Ancient stone, copper ring, moss and vines",
    wall: "#b9b9a2",
    roof: "#6b5746",
    accent: "#8a5aa8",
    trim: "#71815d"
  },
  {
    id: "harbor-kite-lodge",
    family: "Adventure",
    name: "Harbor Kite Lodge",
    archetype: "kiteLodge",
    scale: "Medium",
    summary: "A mobile-district hall with sail roofs, rope rails, and copper-teal accents.",
    silhouette: "Curved sail roof, stilted hall, rope edge",
    materials: "Teal canvas, cedar deck, oxidized copper",
    wall: "#d7c7a3",
    roof: "#2f8f96",
    accent: "#2f8f96",
    trim: "#8a6a3f"
  },
  {
    id: "obsidian-bastion",
    family: "Citadel",
    name: "Obsidian Bastion",
    archetype: "obsidianBastion",
    scale: "Large",
    summary: "A dark stone fortress with cold blue slits and faceted towers.",
    silhouette: "Low fortress, thick walls, squat faceted towers",
    materials: "Black stone, iron bands, cold blue glass",
    wall: "#30343a",
    roof: "#1f2024",
    accent: "#6ab7ff",
    trim: "#16181b"
  },
  {
    id: "rift-gate-citadel",
    family: "Citadel",
    name: "Rift Gate Citadel",
    archetype: "riftGate",
    scale: "Large",
    summary: "An original split-pylon citadel built around a vertical luminous gate seam.",
    silhouette: "Two uneven pylons, suspended keystone, glowing cleft",
    materials: "Dark basalt, blue glass, brass control stones",
    wall: "#34363f",
    roof: "#22232a",
    accent: "#5fb9ff",
    trim: "#b58b42"
  },
  {
    id: "black-crown-keep",
    family: "Citadel",
    name: "Black Crown Keep",
    archetype: "blackCrown",
    scale: "Large",
    summary: "A jagged crownline keep with blade-like roof fins and heavy parapets.",
    silhouette: "Tall central block, jagged crown, four narrow spires",
    materials: "Dark stone, slate fins, warm royal windows",
    wall: "#3b3b3a",
    roof: "#22201f",
    accent: "#d99b37",
    trim: "#161514"
  },
  {
    id: "star-scriptorium",
    family: "Citadel",
    name: "Star Scriptorium",
    archetype: "starScriptorium",
    scale: "Medium",
    summary: "A round observatory tower with a brass-like astrolabe and telescope bridge.",
    silhouette: "Cylinder tower, offset bridge, rotating rings",
    materials: "Pale stone, brass hoops, blue glass",
    wall: "#c8d4da",
    roof: "#5c6570",
    accent: "#376fae",
    trim: "#c38f37"
  },
  {
    id: "moon-dial-observatory",
    family: "Citadel",
    name: "Moon Dial Observatory",
    archetype: "moonDial",
    scale: "Medium",
    summary: "A squat octagonal hall with a vertical dial frame and bead-like phase stones.",
    silhouette: "Octagonal hall, upright ring, small bead crown",
    materials: "Gray stone, violet enamel, brass beads",
    wall: "#b8b4ad",
    roof: "#5d5262",
    accent: "#8a5aa8",
    trim: "#c19645"
  },
  {
    id: "glass-astrolabe-tower",
    family: "Citadel",
    name: "Glass Astrolabe Tower",
    archetype: "glassAstrolabe",
    scale: "Medium",
    summary: "A thin tower with translucent upper chamber and nested celestial hoops.",
    silhouette: "Slim shaft, glass chamber, three tilted rings",
    materials: "Stone shaft, tinted glass, brass orbit rings",
    wall: "#c7d1d5",
    roof: "#536577",
    accent: "#78c4ff",
    trim: "#c99b45"
  },
  {
    id: "ledger-guildhall",
    family: "Guild",
    name: "Ledger Guildhall",
    archetype: "ledgerHall",
    scale: "Medium",
    summary: "A civic archive hall with stepped wings and a balcony banner.",
    silhouette: "Broad hall, side archive blocks, balcony front",
    materials: "Archive stone, slate roof, topic banners",
    wall: "#d2c1a4",
    roof: "#5a514a",
    accent: "#8a5aa8",
    trim: "#7c5a34"
  },
  {
    id: "forge-guildhall",
    family: "Guild",
    name: "Forge Guildhall",
    archetype: "forgeGuild",
    scale: "Medium",
    summary: "A production hall with chimney rhythm, vents, and glowing hearth windows.",
    silhouette: "Wide gable, chimney row, side crane hook",
    materials: "Timber, iron, soot stone, amber glass",
    wall: "#bcb6a6",
    roof: "#66543d",
    accent: "#d9792f",
    trim: "#302923"
  },
  {
    id: "cartographer-guild",
    family: "Guild",
    name: "Cartographer Guild",
    archetype: "cartographer",
    scale: "Medium",
    summary: "An asymmetric mapmaker guild with twin towers and a compass courtyard.",
    silhouette: "Unequal towers, central hall, circular court",
    materials: "Cream stone, dark tile, painted compass lines",
    wall: "#d8c7a6",
    roof: "#574638",
    accent: "#376fae",
    trim: "#bb8430"
  },
  {
    id: "bridgehouse-gate",
    family: "Guild",
    name: "Bridgehouse Gate",
    archetype: "bridgeGate",
    scale: "Medium",
    summary: "Two squat towers joined by a high roof, made for relationship-heavy repositories.",
    silhouette: "Twin towers, high bridge, visible gate opening",
    materials: "Stone towers, timber bridge, royal roof",
    wall: "#cdbb97",
    roof: "#884f34",
    accent: "#6b6f8f",
    trim: "#56412c"
  },
  {
    id: "signal-hut",
    family: "Outpost",
    name: "Signal Hut",
    archetype: "signalHut",
    scale: "Small",
    summary: "A simple hot small-repo marker with one oversized roof and a signal pole.",
    silhouette: "Tiny square hut, big roof, single pole",
    materials: "Plaster, clay tile, cloth signal",
    wall: "#d9c8a5",
    roof: "#8f5533",
    accent: "#b8792f",
    trim: "#6b4a2f"
  },
  {
    id: "archive-stack-house",
    family: "Outpost",
    name: "Archive Stack House",
    archetype: "archiveHouse",
    scale: "Small",
    summary: "A narrow two-step database outpost with stacked roof levels.",
    silhouette: "Tall narrow block, two roof steps, slit windows",
    materials: "Stone, violet trim, dark slate",
    wall: "#c7c0ac",
    roof: "#5e4d61",
    accent: "#8a5aa8",
    trim: "#4d4238"
  },
  {
    id: "workshop-shed",
    family: "Outpost",
    name: "Workshop Shed",
    archetype: "workshopShed",
    scale: "Small",
    summary: "A long small tooling shed with an asymmetric lean-to roof and chimney.",
    silhouette: "Horizontal body, lean-to roof, chimney nub",
    materials: "Timber, plaster, red-brown tile",
    wall: "#d6c4a2",
    roof: "#814c32",
    accent: "#3f8f6b",
    trim: "#5a3a27"
  },
  {
    id: "dock-storehouse",
    family: "Outpost",
    name: "Dock Storehouse",
    archetype: "dockStorehouse",
    scale: "Small",
    summary: "A low warehouse with a side awning and short cargo mast.",
    silhouette: "Wide low box, awning side, short mast",
    materials: "Wood platform, teal awning, warm plaster",
    wall: "#d3c29c",
    roof: "#6b4a34",
    accent: "#2f8f96",
    trim: "#6f5434"
  }
];

const canvas = document.querySelector("#gallery-canvas");
const variantCount = document.querySelector("#variant-count");
const familyFilters = document.querySelector("#family-filters");
const variantList = document.querySelector("#variant-list");
const selectedFamily = document.querySelector("#selected-family");
const selectedName = document.querySelector("#selected-name");
const selectedSummary = document.querySelector("#selected-summary");
const selectedSilhouette = document.querySelector("#selected-silhouette");
const selectedMaterials = document.querySelector("#selected-materials");
const selectedScale = document.querySelector("#selected-scale");
const prevButton = document.querySelector("#prev-variant");
const nextButton = document.querySelector("#next-variant");
const toggleSpinButton = document.querySelector("#toggle-spin");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#b8d2cc");
scene.fog = new THREE.FogExp2("#dfe8dc", 0.0035);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 800);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();
const focus = new THREE.Vector3(0, 0, 0);
const desiredFocus = new THREE.Vector3(0, 0, 0);
const cameraState = { distance: 108, yaw: -0.64, pitch: 0.98 };
const pointerState = { down: false, x: 0, y: 0, moved: false };

let activeFamily = "All";
let selectedIndex = 0;
let autoRotate = true;
let renderedOnce = false;
let visibleIds = [];

const ambient = new THREE.HemisphereLight("#edf5ef", "#7c7b63", 1.28);
scene.add(ambient);

const sun = new THREE.DirectionalLight("#fff1c9", 3.1);
sun.position.set(-44, 72, 38);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -74;
sun.shadow.camera.right = 74;
sun.shadow.camera.top = 74;
sun.shadow.camera.bottom = -74;
sun.shadow.camera.near = 8;
sun.shadow.camera.far = 160;
scene.add(sun);

const fill = new THREE.DirectionalLight("#b8d4df", 0.55);
fill.position.set(40, 34, -42);
scene.add(fill);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 180, 1, 1),
  new THREE.MeshStandardMaterial({ color: "#9eb879", roughness: 0.86 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(220, 44, "#9b7a51", "#cdbb86");
grid.position.y = 0.015;
grid.material.transparent = true;
grid.material.opacity = 0.23;
scene.add(grid);

const selectionRing = new THREE.Mesh(
  new THREE.TorusGeometry(4.1, 0.08, 8, 72),
  new THREE.MeshBasicMaterial({ color: "#f6c45f" })
);
selectionRing.rotation.x = Math.PI / 2;
selectionRing.position.y = 0.12;
scene.add(selectionRing);

const tileRoot = new THREE.Group();
scene.add(tileRoot);

let tileGroups = [];

function materialSet(variant) {
  const wall = new THREE.MeshStandardMaterial({ color: variant.wall, roughness: 0.82, metalness: 0.02 });
  const roof = new THREE.MeshStandardMaterial({ color: variant.roof, roughness: 0.76, metalness: 0.02 });
  const trim = new THREE.MeshStandardMaterial({ color: variant.trim, roughness: 0.68, metalness: 0.18 });
  const accent = new THREE.MeshStandardMaterial({ color: variant.accent, roughness: 0.7, metalness: 0.06 });
  const dark = new THREE.MeshStandardMaterial({ color: "#2c2822", roughness: 0.82, metalness: 0.12 });
  const glow = new THREE.MeshStandardMaterial({
    color: variant.accent,
    emissive: variant.accent,
    emissiveIntensity: 0.75,
    roughness: 0.45
  });
  const glass = new THREE.MeshStandardMaterial({
    color: variant.accent,
    transparent: true,
    opacity: 0.48,
    roughness: 0.2,
    metalness: 0.05
  });
  const canvasMat = new THREE.MeshStandardMaterial({ color: variant.accent, roughness: 0.92, side: THREE.DoubleSide });
  return { wall, roof, trim, accent, dark, glow, glass, canvas: canvasMat };
}

function softBox(width, height, depth, radius = 0.08, segments = 2) {
  return new RoundedBoxGeometry(width, height, depth, segments, radius);
}

function mesh(group, geometry, material, x, y, z, options = {}) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.rotation.set(options.rx ?? 0, options.ry ?? 0, options.rz ?? 0);
  item.scale.set(options.sx ?? 1, options.sy ?? 1, options.sz ?? 1);
  item.castShadow = options.castShadow ?? true;
  item.receiveShadow = options.receiveShadow ?? true;
  group.add(item);
  return item;
}

function box(group, mats, mat, width, height, depth, x, y, z, options = {}) {
  return mesh(group, softBox(width, height, depth, options.radius ?? 0.08), mats[mat] ?? mat, x, y, z, options);
}

function cylinder(group, mats, mat, radiusTop, radiusBottom, height, radialSegments, x, y, z, options = {}) {
  return mesh(group, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments), mats[mat] ?? mat, x, y, z, options);
}

function cone(group, mats, mat, radius, height, radialSegments, x, y, z, options = {}) {
  return mesh(group, new THREE.ConeGeometry(radius, height, radialSegments), mats[mat] ?? mat, x, y, z, options);
}

function torus(group, mats, mat, radius, tube, x, y, z, options = {}) {
  return mesh(group, new THREE.TorusGeometry(radius, tube, 10, 56), mats[mat] ?? mat, x, y, z, options);
}

function gableRoof(group, mats, width, height, depth, x, y, z, options = {}) {
  const geometry = new THREE.BufferGeometry();
  const hw = width / 2;
  const hd = depth / 2;
  const vertices = new Float32Array([
    -hw, 0, -hd, hw, 0, -hd, 0, height, -hd,
    -hw, 0, hd, 0, height, hd, hw, 0, hd,
    -hw, 0, -hd, -hw, 0, hd, 0, height, hd, -hw, 0, -hd, 0, height, hd, 0, height, -hd,
    hw, 0, -hd, 0, height, -hd, 0, height, hd, hw, 0, -hd, 0, height, hd, hw, 0, hd,
    -hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, -hd, hw, 0, hd, -hw, 0, hd
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return mesh(group, geometry, mats.roof, x, y, z, options);
}

function banner(group, mats, x, y, z, options = {}) {
  return mesh(group, new THREE.PlaneGeometry(options.width ?? 0.75, options.height ?? 1.4), mats.canvas, x, y, z, {
    ry: options.ry ?? 0,
    rx: options.rx ?? 0,
    rz: options.rz ?? 0,
    castShadow: false,
    receiveShadow: false
  });
}

function windowBox(group, mats, x, y, z, options = {}) {
  return box(group, mats, "glow", options.width ?? 0.28, options.height ?? 0.42, 0.08, x, y, z, options);
}

function pole(group, mats, x, y, z, height = 2.2, radius = 0.04) {
  return cylinder(group, mats, "dark", radius, radius * 1.2, height, 6, x, y, z);
}

function addPlinth(group, mats, variant, radius = 3.7) {
  cylinder(group, mats, "dark", radius, radius * 1.06, 0.32, 18, 0, 0.16, 0);
  cylinder(group, mats, "wall", radius * 0.9, radius, 0.22, 18, 0, 0.45, 0);
  const plaque = box(group, mats, "trim", 1.35, 0.18, 0.32, 0, 0.68, radius * 0.88, { radius: 0.03 });
  plaque.name = `${variant.id}-plaque`;
}

function crownKeep(group, mats) {
  box(group, mats, "wall", 3.3, 4.8, 3.3, 0, 2.9, 0);
  box(group, mats, "dark", 4.3, 0.7, 4.3, 0, 1.0, 0);
  cone(group, mats, "roof", 2.65, 1.55, 4, 0, 5.95, 0, { ry: Math.PI / 4 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cylinder(group, mats, "wall", 0.45, 0.55, 4.2, 10, sx * 1.95, 2.75, sz * 1.95);
    cone(group, mats, "roof", 0.68, 1.05, 8, sx * 1.95, 5.35, sz * 1.95);
  }
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    box(group, mats, "trim", 0.36, 0.42, 0.28, Math.cos(angle) * 1.65, 5.45, Math.sin(angle) * 1.65);
  }
  banner(group, mats, 0, 3.6, 1.72);
  windowBox(group, mats, 0, 3.1, 1.72, { width: 0.38, height: 0.65 });
}

function arena(group, mats) {
  cylinder(group, mats, "wall", 3.65, 3.95, 1.2, 32, 0, 1.15, 0, { sx: 1.18, sz: 0.78 });
  cylinder(group, mats, "dark", 2.55, 2.75, 0.42, 32, 0, 1.95, 0, { sx: 1.18, sz: 0.78 });
  cylinder(group, mats, "glow", 1.35, 1.42, 0.12, 32, 0, 2.25, 0, { sx: 1.2, sz: 0.8, castShadow: false });
  box(group, mats, "wall", 1.8, 1.35, 1.1, 0, 2.72, -2.15);
  gableRoof(group, mats, 2.05, 0.72, 1.28, 0, 3.38, -2.15);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    pole(group, mats, Math.cos(angle) * 4.05, 2.1, Math.sin(angle) * 2.7, 1.45, 0.025);
    banner(group, mats, Math.cos(angle) * 4.05, 2.95, Math.sin(angle) * 2.7, { width: 0.28, height: 0.55, ry: -angle });
  }
}

function bannerHall(group, mats) {
  box(group, mats, "wall", 4.2, 2.2, 2.2, 0, 1.75, 0);
  gableRoof(group, mats, 4.9, 1.25, 2.8, 0, 2.85, 0);
  box(group, mats, "wall", 1.35, 1.55, 1.9, -2.75, 1.45, 0);
  box(group, mats, "wall", 1.35, 1.55, 1.9, 2.75, 1.45, 0);
  gableRoof(group, mats, 1.7, 0.76, 2.15, -2.75, 2.22, 0, { ry: Math.PI / 2 });
  gableRoof(group, mats, 1.7, 0.76, 2.15, 2.75, 2.22, 0, { ry: Math.PI / 2 });
  banner(group, mats, 0, 2.05, 1.18, { width: 1.25, height: 1.5 });
  box(group, mats, "trim", 1.7, 0.2, 0.15, 0, 2.95, 1.24);
}

function vaultStack(group, mats) {
  cylinder(group, mats, "wall", 1.35, 1.48, 2.1, 8, -0.95, 1.65, 0.15);
  cylinder(group, mats, "wall", 1.15, 1.25, 2.8, 8, 0.8, 2.0, -0.1);
  cylinder(group, mats, "wall", 0.9, 1.02, 3.35, 8, 0.05, 2.28, 1.1);
  cone(group, mats, "roof", 1.36, 0.8, 8, -0.95, 3.1, 0.15);
  cone(group, mats, "roof", 1.15, 0.76, 8, 0.8, 3.78, -0.1);
  cone(group, mats, "roof", 0.9, 0.68, 8, 0.05, 4.28, 1.1);
  for (const x of [-0.95, 0.8, 0.05]) {
    torus(group, mats, "trim", 0.78, 0.055, x, 2.25, x === 0.05 ? 1.1 : x < 0 ? 0.15 : -0.1, { rx: Math.PI / 2 });
  }
  windowBox(group, mats, 0.8, 2.45, 1.05);
}

function forge(group, mats) {
  box(group, mats, "dark", 4.5, 1.0, 3.2, 0, 1.0, 0);
  box(group, mats, "wall", 3.8, 2.0, 2.6, 0, 2.12, 0);
  gableRoof(group, mats, 4.4, 0.88, 3.05, 0, 3.1, 0);
  for (const x of [-1.15, 0, 1.15]) {
    cylinder(group, mats, "dark", 0.18, 0.22, 1.6, 7, x, 4.0, -0.55);
    cone(group, mats, "trim", 0.25, 0.25, 7, x, 4.92, -0.55);
  }
  for (const x of [-2.3, 2.3]) box(group, mats, "trim", 0.28, 2.2, 0.22, x, 2.2, 1.1, { rz: x < 0 ? -0.3 : 0.3 });
  windowBox(group, mats, -0.65, 2.15, 1.34, { width: 0.5, height: 0.5 });
  windowBox(group, mats, 0.65, 2.15, 1.34, { width: 0.5, height: 0.5 });
}

function harborHouse(group, mats) {
  box(group, mats, "wall", 2.3, 2.0, 2.0, 0, 1.68, 0);
  gableRoof(group, mats, 2.75, 1.05, 2.45, 0, 2.7, 0);
  box(group, mats, "trim", 3.4, 0.2, 1.45, 0, 0.82, 1.55);
  for (const x of [-1.4, 1.4]) pole(group, mats, x, 1.45, 1.95, 1.5, 0.035);
  pole(group, mats, 0.9, 3.65, -0.6, 2.6, 0.04);
  banner(group, mats, 1.18, 4.4, -0.6, { width: 0.5, height: 0.9, ry: Math.PI / 2 });
}

function crystalManor(group, mats) {
  box(group, mats, "wall", 3.1, 2.45, 2.6, 0, 1.95, 0);
  gableRoof(group, mats, 3.55, 1.02, 3.0, 0, 3.16, 0);
  mesh(group, new THREE.OctahedronGeometry(0.65, 0), mats.glass, 0, 4.32, 0, { sy: 2.35, castShadow: false });
  box(group, mats, "trim", 1.25, 0.35, 1.25, 0, 3.42, 0);
  for (const x of [-1.1, 1.1]) windowBox(group, mats, x, 2.05, 1.34);
}

function workshopRow(group, mats) {
  box(group, mats, "wall", 1.75, 1.45, 1.75, -0.75, 1.36, 0);
  box(group, mats, "wall", 1.5, 1.92, 1.45, 0.95, 1.6, 0.38);
  box(group, mats, "wall", 1.15, 1.1, 1.25, 0.25, 1.15, -1.35);
  gableRoof(group, mats, 2.05, 0.78, 2.0, -0.75, 2.08, 0);
  gableRoof(group, mats, 1.75, 0.88, 1.7, 0.95, 2.55, 0.38, { ry: Math.PI / 2 });
  gableRoof(group, mats, 1.35, 0.62, 1.45, 0.25, 1.7, -1.35);
  pole(group, mats, -2.0, 2.2, 1.0, 2.0, 0.035);
  banner(group, mats, -1.8, 2.85, 1.0, { width: 0.45, height: 0.75, ry: Math.PI / 2 });
}

function frontierShack(group, mats) {
  box(group, mats, "dark", 2.25, 0.7, 1.9, 0, 0.98, 0);
  box(group, mats, "wall", 1.85, 1.45, 1.55, -0.1, 1.62, 0.05, { rz: -0.035 });
  gableRoof(group, mats, 2.4, 0.8, 2.05, 0, 2.38, 0, { rz: 0.04 });
  box(group, mats, "canvas", 1.45, 0.12, 1.15, 1.35, 1.9, 0.62, { rz: -0.2 });
  cylinder(group, mats, "dark", 0.14, 0.18, 0.85, 6, -0.85, 2.85, -0.35);
}

function lodge(group, mats) {
  box(group, mats, "wall", 4.4, 1.8, 2.2, 0, 1.55, 0);
  gableRoof(group, mats, 4.95, 1.12, 2.65, 0, 2.46, 0);
  box(group, mats, "trim", 4.7, 0.18, 0.95, 0, 0.86, 1.45);
  for (const x of [-1.7, -0.55, 0.55, 1.7]) {
    pole(group, mats, x, 1.42, 1.78, 1.25, 0.04);
    windowBox(group, mats, x * 0.75, 1.65, 1.16, { width: 0.28, height: 0.42 });
  }
}

function craneWorkshop(group, mats) {
  bannerHall(group, mats);
  pole(group, mats, 2.55, 2.4, -1.55, 3.2, 0.06);
  box(group, mats, "dark", 1.8, 0.12, 0.12, 1.75, 3.75, -1.55, { rz: -0.28 });
  torus(group, mats, "trim", 0.18, 0.035, 0.92, 3.42, -1.55);
  box(group, mats, "dark", 0.9, 1.05, 0.13, 0, 1.4, 1.2);
}

function watchtower(group, mats) {
  cylinder(group, mats, "wall", 0.88, 1.05, 1.2, 10, 0, 1.1, 0);
  box(group, mats, "dark", 0.9, 3.2, 0.9, 0, 2.9, 0);
  box(group, mats, "trim", 2.05, 0.35, 2.05, 0, 4.2, 0);
  gableRoof(group, mats, 2.25, 0.85, 2.25, 0, 4.55, 0);
  pole(group, mats, 0, 5.55, 0, 1.65, 0.04);
  cylinder(group, mats, "glow", 0.28, 0.22, 0.38, 8, 0, 6.45, 0, { castShadow: false });
}

function marketHall(group, mats) {
  box(group, mats, "wall", 4.7, 1.55, 2.3, 0, 1.38, 0);
  gableRoof(group, mats, 5.2, 0.9, 2.9, 0, 2.15, 0);
  for (const x of [-1.8, -0.9, 0, 0.9, 1.8]) {
    cylinder(group, mats, "trim", 0.08, 0.09, 1.05, 7, x, 1.25, 1.28);
  }
  for (const x of [-1.55, 0, 1.55]) banner(group, mats, x, 1.65, 1.34, { width: 0.42, height: 0.62 });
}

function burrow(group, mats) {
  cylinder(group, mats, "wall", 1.95, 2.25, 1.6, 18, 0, 1.2, 0, { sx: 1.25, sz: 0.78 });
  box(group, mats, "dark", 1.1, 1.0, 0.18, 0, 1.15, 1.4);
  cylinder(group, mats, "wall", 0.75, 0.82, 1.15, 12, -2.0, 1.05, -0.12);
  cylinder(group, mats, "wall", 0.65, 0.78, 1.0, 12, 2.0, 1.0, 0.1);
  cylinder(group, mats, "dark", 0.12, 0.16, 1.2, 6, -0.75, 2.35, -0.45);
  cylinder(group, mats, "dark", 0.1, 0.13, 0.95, 6, 0.75, 2.25, -0.35);
}

function quay(group, mats) {
  box(group, mats, "trim", 4.3, 0.22, 2.8, 0, 0.88, 0);
  for (const x of [-1.8, -0.6, 0.6, 1.8]) pole(group, mats, x, 0.65, -1.0, 1.25, 0.045);
  box(group, mats, "wall", 2.8, 1.65, 1.9, 0, 1.78, 0.15);
  gableRoof(group, mats, 3.2, 0.9, 2.25, 0, 2.6, 0.15);
  pole(group, mats, 1.8, 2.55, 0.7, 2.25, 0.045);
  box(group, mats, "canvas", 1.2, 0.1, 1.0, -1.85, 2.15, 0.95, { rz: -0.16 });
}

function huntCitadel(group, mats) {
  crownKeep(group, mats);
  for (const x of [-3.1, 3.1]) {
    box(group, mats, "dark", 1.0, 2.0, 1.0, x, 1.72, -2.9);
    gableRoof(group, mats, 1.35, 0.7, 1.35, x, 2.7, -2.9);
  }
  for (let i = 0; i < 10; i += 1) {
    const x = -3.8 + i * 0.84;
    pole(group, mats, x, 1.4, 3.15, 1.5, 0.035);
  }
}

function skyLantern(group, mats) {
  box(group, mats, "wall", 1.75, 2.1, 1.5, 0, 1.68, 0);
  gableRoof(group, mats, 2.2, 0.95, 1.95, 0, 2.72, 0);
  box(group, mats, "glow", 0.7, 0.72, 0.62, 0, 3.35, 0);
  cone(group, mats, "roof", 0.55, 0.45, 4, 0, 3.94, 0, { ry: Math.PI / 4 });
  box(group, mats, "canvas", 0.92, 0.1, 1.0, -1.08, 1.65, 0.15, { rz: 0.18 });
  box(group, mats, "canvas", 0.92, 0.1, 1.0, 1.08, 1.65, 0.15, { rz: -0.18 });
}

function branchCottage(group, mats) {
  box(group, mats, "wall", 2.2, 1.55, 1.8, 0, 1.38, 0);
  gableRoof(group, mats, 2.55, 0.82, 2.15, 0, 2.15, 0);
  for (const x of [-1.08, 1.08]) {
    cylinder(group, mats, "trim", 0.06, 0.08, 1.95, 7, x, 1.55, 1.0, { rz: x < 0 ? -0.2 : 0.2 });
  }
  box(group, mats, "accent", 2.65, 0.12, 2.25, 0, 2.43, 0, { radius: 0.04 });
}

function signalSpire(group, mats) {
  bannerHall(group, mats);
  box(group, mats, "trim", 0.7, 3.3, 0.7, 2.35, 3.0, -0.55);
  for (const x of [2.05, 2.65]) for (const z of [-0.85, -0.25]) pole(group, mats, x, 4.0, z, 2.2, 0.025);
  cone(group, mats, "glow", 0.42, 0.72, 8, 2.35, 5.3, -0.55, { castShadow: false });
}

function canopyMarket(group, mats) {
  marketHall(group, mats);
  for (const x of [-2.35, -0.8, 0.8, 2.35]) {
    box(group, mats, "canvas", 1.1, 0.1, 1.15, x, 2.2, 1.55, { rz: Math.sin(x) * 0.12 });
  }
}

function terraceForge(group, mats) {
  box(group, mats, "dark", 4.6, 0.85, 3.6, 0, 0.95, 0);
  box(group, mats, "wall", 3.3, 1.35, 2.7, 0, 1.95, 0);
  box(group, mats, "wall", 2.35, 1.25, 1.95, 0.35, 3.1, -0.12);
  box(group, mats, "wall", 1.42, 1.1, 1.22, -0.2, 4.13, 0.1);
  cone(group, mats, "roof", 1.15, 0.7, 4, -0.2, 4.98, 0.1, { ry: Math.PI / 4 });
  windowBox(group, mats, -1.0, 2.05, 1.4, { width: 0.65 });
  windowBox(group, mats, 1.0, 2.05, 1.4, { width: 0.65 });
  pole(group, mats, 2.5, 3.0, -1.35, 2.2, 0.045);
  box(group, mats, "dark", 1.2, 0.11, 0.11, 1.95, 4.0, -1.35, { rz: -0.25 });
}

function ruinObservatory(group, mats) {
  cylinder(group, mats, "wall", 1.05, 1.18, 3.6, 20, 0, 2.5, 0);
  cone(group, mats, "roof", 1.25, 0.85, 20, 0, 4.72, 0);
  torus(group, mats, "trim", 1.8, 0.06, 0, 4.0, 0, { rx: Math.PI / 2.5, rz: 0.25 });
  for (const x of [-2.2, 2.2]) {
    cylinder(group, mats, "wall", 0.18, 0.22, 2.3, 8, x, 1.75, 0.65, { rz: x < 0 ? 0.25 : -0.25 });
    torus(group, mats, "wall", 0.72, 0.08, x, 2.9, 0.65, { rx: Math.PI / 2 });
  }
  box(group, mats, "accent", 1.5, 0.16, 1.5, 0, 4.0, 0);
}

function kiteLodge(group, mats) {
  quay(group, mats);
  box(group, mats, "canvas", 3.4, 0.12, 2.35, 0, 3.05, 0.15, { rz: 0.16 });
  pole(group, mats, -1.4, 2.8, -0.85, 2.1, 0.035);
  banner(group, mats, -1.16, 3.55, -0.85, { width: 0.45, height: 0.8, ry: Math.PI / 2 });
}

function obsidianBastion(group, mats) {
  box(group, mats, "dark", 4.8, 1.2, 4.2, 0, 1.0, 0);
  box(group, mats, "wall", 3.4, 2.35, 3.0, 0, 2.38, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cylinder(group, mats, "wall", 0.58, 0.7, 2.55, 10, sx * 2.2, 2.15, sz * 1.85);
    cylinder(group, mats, "dark", 0.66, 0.58, 0.36, 10, sx * 2.2, 3.55, sz * 1.85);
  }
  for (const x of [-0.75, 0.75]) windowBox(group, mats, x, 2.55, 1.55, { width: 0.18, height: 0.82 });
}

function riftGate(group, mats) {
  box(group, mats, "wall", 1.35, 4.8, 1.25, -0.95, 3.05, 0, { rz: -0.08 });
  box(group, mats, "wall", 1.15, 5.55, 1.35, 1.05, 3.38, 0, { rz: 0.08 });
  box(group, mats, "glow", 0.18, 4.2, 0.18, 0.05, 3.12, 0.72, { castShadow: false });
  mesh(group, new THREE.DodecahedronGeometry(0.48, 0), mats.glass, 0.05, 6.45, 0.05, { castShadow: false });
  box(group, mats, "dark", 3.45, 0.7, 2.2, 0, 1.0, 0);
}

function blackCrown(group, mats) {
  box(group, mats, "wall", 3.0, 5.25, 2.85, 0, 3.05, 0);
  box(group, mats, "dark", 3.5, 0.55, 3.35, 0, 5.92, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cone(group, mats, "roof", 0.32, 1.5, 4, sx * 1.32, 6.85, sz * 1.22, { ry: Math.PI / 4 });
  }
  for (let i = 0; i < 9; i += 1) {
    box(group, mats, i % 3 === 0 ? "trim" : "dark", 0.26, 0.55 + (i % 3) * 0.18, 0.24, -1.2 + i * 0.3, 6.45, 1.52);
  }
  windowBox(group, mats, 0, 3.4, 1.48, { width: 0.22, height: 1.0 });
}

function starScriptorium(group, mats) {
  cylinder(group, mats, "wall", 1.1, 1.25, 3.8, 22, 0, 2.55, 0);
  mesh(group, new THREE.SphereGeometry(1.05, 18, 10), mats.glass, 0, 4.45, 0, { sy: 0.58, castShadow: false });
  torus(group, mats, "trim", 1.45, 0.05, 0, 4.45, 0, { rx: Math.PI / 2.6 });
  torus(group, mats, "trim", 1.25, 0.045, 0, 4.45, 0, { rz: Math.PI / 2.8 });
  cylinder(group, mats, "trim", 0.12, 0.18, 1.75, 10, 1.45, 4.55, -0.25, { rz: Math.PI / 2.8 });
}

function moonDial(group, mats) {
  cylinder(group, mats, "wall", 1.9, 2.05, 2.0, 8, 0, 1.7, 0);
  cone(group, mats, "roof", 1.9, 0.75, 8, 0, 3.05, 0);
  torus(group, mats, "trim", 1.25, 0.06, 0, 3.95, 0, { rx: Math.PI / 2 });
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    mesh(group, new THREE.SphereGeometry(0.12, 8, 6), mats.accent, Math.cos(angle) * 1.25, 3.95 + Math.sin(angle) * 1.25, 0.06);
  }
}

function glassAstrolabe(group, mats) {
  cylinder(group, mats, "wall", 0.55, 0.7, 4.4, 16, 0, 2.75, 0);
  cylinder(group, mats, "glass", 0.95, 0.9, 1.05, 18, 0, 5.35, 0, { castShadow: false });
  for (const [rx, rz, radius] of [[Math.PI / 2, 0, 1.2], [Math.PI / 2.5, 0.65, 1.38], [Math.PI / 1.8, -0.5, 1.05]]) {
    torus(group, mats, "trim", radius, 0.035, 0, 5.35, 0, { rx, rz });
  }
}

function ledgerHall(group, mats) {
  bannerHall(group, mats);
  box(group, mats, "wall", 0.9, 2.65, 1.5, -2.3, 2.3, -0.35);
  box(group, mats, "wall", 0.9, 2.1, 1.5, 2.3, 2.0, -0.35);
  box(group, mats, "trim", 2.0, 0.25, 0.4, 0, 2.1, 1.32);
}

function forgeGuild(group, mats) {
  forge(group, mats);
  pole(group, mats, 2.75, 2.45, 1.15, 2.5, 0.045);
  box(group, mats, "dark", 1.55, 0.11, 0.11, 2.15, 3.42, 1.15, { rz: -0.28 });
}

function cartographer(group, mats) {
  box(group, mats, "wall", 3.3, 1.8, 2.1, 0, 1.48, 0);
  gableRoof(group, mats, 3.8, 0.95, 2.55, 0, 2.33, 0);
  cylinder(group, mats, "wall", 0.6, 0.72, 2.8, 12, -2.1, 2.1, -0.4);
  cylinder(group, mats, "wall", 0.48, 0.58, 2.2, 12, 2.05, 1.8, 0.55);
  cone(group, mats, "roof", 0.7, 0.65, 12, -2.1, 3.82, -0.4);
  cone(group, mats, "roof", 0.58, 0.55, 12, 2.05, 3.18, 0.55);
  torus(group, mats, "trim", 1.05, 0.04, 0, 0.86, 2.05, { rx: Math.PI / 2 });
}

function bridgeGate(group, mats) {
  cylinder(group, mats, "wall", 0.9, 1.05, 2.75, 10, -1.4, 1.95, 0);
  cylinder(group, mats, "wall", 0.9, 1.05, 2.75, 10, 1.4, 1.95, 0);
  box(group, mats, "wall", 3.5, 0.9, 1.2, 0, 3.05, 0);
  gableRoof(group, mats, 3.9, 0.75, 1.45, 0, 3.55, 0);
  box(group, mats, "dark", 1.1, 1.4, 0.2, 0, 1.35, 0.72);
  for (const x of [-1.4, 1.4]) cone(group, mats, "roof", 1.0, 0.72, 10, x, 3.62, 0);
}

function signalHut(group, mats) {
  box(group, mats, "wall", 1.55, 1.3, 1.45, 0, 1.22, 0);
  gableRoof(group, mats, 2.15, 0.82, 2.0, 0, 1.9, 0);
  pole(group, mats, 1.2, 2.0, -0.65, 2.0, 0.035);
  banner(group, mats, 1.42, 2.78, -0.65, { width: 0.42, height: 0.72, ry: Math.PI / 2 });
}

function archiveHouse(group, mats) {
  box(group, mats, "wall", 1.25, 2.1, 1.3, -0.22, 1.65, 0);
  box(group, mats, "wall", 1.05, 1.35, 1.15, 0.62, 1.35, 0.22);
  gableRoof(group, mats, 1.48, 0.62, 1.52, -0.22, 2.7, 0);
  gableRoof(group, mats, 1.25, 0.5, 1.32, 0.62, 2.05, 0.22, { ry: Math.PI / 2 });
  windowBox(group, mats, -0.22, 1.75, 0.7, { width: 0.16, height: 0.65 });
}

function workshopShed(group, mats) {
  box(group, mats, "wall", 2.65, 1.25, 1.35, 0, 1.18, 0);
  box(group, mats, "roof", 2.9, 0.28, 1.62, 0, 1.9, 0, { rz: -0.12 });
  box(group, mats, "wall", 0.95, 0.9, 1.05, 1.65, 1.0, 0.1);
  cylinder(group, mats, "dark", 0.12, 0.15, 0.8, 6, -0.8, 2.2, -0.3);
}

function dockStorehouse(group, mats) {
  box(group, mats, "trim", 3.5, 0.18, 2.1, 0, 0.8, 0);
  box(group, mats, "wall", 2.6, 1.2, 1.45, 0, 1.35, 0);
  gableRoof(group, mats, 2.95, 0.62, 1.75, 0, 1.96, 0);
  box(group, mats, "canvas", 1.35, 0.11, 1.0, -1.75, 1.62, 0.35, { rz: 0.15 });
  pole(group, mats, 1.52, 1.8, -0.55, 1.75, 0.035);
}

const BUILDERS = {
  crownKeep,
  arena,
  bannerHall,
  vaultStack,
  forge,
  harborHouse,
  crystalManor,
  workshopRow,
  frontierShack,
  lodge,
  craneWorkshop,
  watchtower,
  marketHall,
  burrow,
  quay,
  huntCitadel,
  skyLantern,
  branchCottage,
  signalSpire,
  canopyMarket,
  terraceForge,
  ruinObservatory,
  kiteLodge,
  obsidianBastion,
  riftGate,
  blackCrown,
  starScriptorium,
  moonDial,
  glassAstrolabe,
  ledgerHall,
  forgeGuild,
  cartographer,
  bridgeGate,
  signalHut,
  archiveHouse,
  workshopShed,
  dockStorehouse
};

function createTile(variant) {
  const group = new THREE.Group();
  group.name = variant.id;
  group.userData.variantId = variant.id;
  const mats = materialSet(variant);
  addPlinth(group, mats, variant, variant.scale === "Large" ? 4.2 : variant.scale === "Medium" ? 3.7 : 3.1);
  BUILDERS[variant.archetype](group, mats, variant);
  group.traverse((object) => {
    if (object.isMesh) {
      object.userData.variantId = variant.id;
    }
  });
  return { variant, group };
}

function layoutVisible() {
  const visible = tileGroups.filter(({ variant }) => activeFamily === "All" || variant.family === activeFamily);
  visibleIds = visible.map(({ variant }) => variant.id);
  const columns = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(visible.length * 1.35))));
  const spacingX = 12.4;
  const spacingZ = 12.0;
  const rows = Math.ceil(visible.length / columns);
  visible.forEach(({ group }, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    group.visible = true;
    group.position.set((col - (columns - 1) / 2) * spacingX, 0, (row - (rows - 1) / 2) * spacingZ);
  });
  tileGroups.forEach(({ group, variant }) => {
    if (!visibleIds.includes(variant.id)) group.visible = false;
  });
  if (!visibleIds.includes(VARIANTS[selectedIndex].id)) {
    selectedIndex = VARIANTS.findIndex((variant) => variant.id === visibleIds[0]);
  }
  syncSelection({ focusSelected: false });
  desiredFocus.set(0, 0, 0);
}

function renderFilters() {
  familyFilters.innerHTML = "";
  for (const family of FAMILIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = family;
    button.classList.toggle("active", family === activeFamily);
    button.addEventListener("click", () => {
      activeFamily = family;
      renderFilters();
      renderVariantList();
      layoutVisible();
    });
    familyFilters.append(button);
  }
}

function renderVariantList() {
  variantList.innerHTML = "";
  const variants = VARIANTS.filter((variant) => activeFamily === "All" || variant.family === activeFamily);
  for (const variant of variants) {
    const index = VARIANTS.findIndex((item) => item.id === variant.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "variant-button";
    button.classList.toggle("active", index === selectedIndex);
    button.innerHTML = `<strong>${variant.name}</strong><span>${variant.scale}</span><small>${variant.family}</small><small>${variant.silhouette}</small>`;
    button.addEventListener("click", () => selectVariant(index));
    variantList.append(button);
  }
}

function selectVariant(index) {
  selectedIndex = (index + VARIANTS.length) % VARIANTS.length;
  if (!visibleIds.includes(VARIANTS[selectedIndex].id)) {
    activeFamily = "All";
    renderFilters();
    layoutVisible();
  }
  syncSelection();
}

function selectRelative(delta) {
  const currentId = VARIANTS[selectedIndex].id;
  const visibleIndex = Math.max(0, visibleIds.indexOf(currentId));
  const nextId = visibleIds[(visibleIndex + delta + visibleIds.length) % visibleIds.length];
  selectVariant(VARIANTS.findIndex((variant) => variant.id === nextId));
}

function syncSelection({ focusSelected = true } = {}) {
  const variant = VARIANTS[selectedIndex];
  const tile = tileGroups[selectedIndex];
  selectedFamily.textContent = variant.family;
  selectedName.textContent = variant.name;
  selectedSummary.textContent = variant.summary;
  selectedSilhouette.textContent = variant.silhouette;
  selectedMaterials.textContent = variant.materials;
  selectedScale.textContent = variant.scale;
  if (tile && focusSelected) desiredFocus.copy(tile.group.position);
  selectionRing.visible = tile?.group.visible ?? false;
  renderVariantList();
}

function resize() {
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateCamera(dt) {
  focus.lerp(desiredFocus, 1 - Math.pow(0.001, dt));
  if (autoRotate) cameraState.yaw += dt * 0.16;
  const horizontal = cameraState.distance * Math.cos(cameraState.pitch);
  const height = cameraState.distance * Math.sin(cameraState.pitch);
  camera.position.set(
    focus.x + Math.sin(cameraState.yaw) * horizontal,
    height,
    focus.z + Math.cos(cameraState.yaw) * horizontal
  );
  camera.lookAt(focus.x, 2.4, focus.z);
  selectionRing.position.x = desiredFocus.x;
  selectionRing.position.z = desiredFocus.z;
}

function update(dt) {
  for (const { group } of tileGroups) {
    if (!group.visible) continue;
    group.rotation.y += dt * 0.12;
  }
  updateCamera(dt);
}

function render() {
  renderer.render(scene, camera);
  renderedOnce = true;
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  update(dt);
  render();
}

function pick(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(tileRoot.children, true).find((item) => item.object.userData.variantId);
  if (!hit) return;
  const id = hit.object.userData.variantId;
  const index = VARIANTS.findIndex((variant) => variant.id === id);
  if (index >= 0) selectVariant(index);
}

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  cameraState.distance = THREE.MathUtils.clamp(cameraState.distance + event.deltaY * 0.055, 18, 145);
}, { passive: false });

canvas.addEventListener("pointerdown", (event) => {
  pointerState.down = true;
  pointerState.x = event.clientX;
  pointerState.y = event.clientY;
  pointerState.moved = false;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!pointerState.down) return;
  const dx = event.clientX - pointerState.x;
  const dy = event.clientY - pointerState.y;
  pointerState.x = event.clientX;
  pointerState.y = event.clientY;
  pointerState.moved ||= Math.abs(dx) + Math.abs(dy) > 2;
  cameraState.yaw -= dx * 0.006;
  cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch + dy * 0.003, 0.34, 1.04);
});

canvas.addEventListener("pointerup", (event) => {
  pointerState.down = false;
  if (!pointerState.moved) pick(event);
});

window.addEventListener("resize", resize);

prevButton.addEventListener("click", () => selectRelative(-1));
nextButton.addEventListener("click", () => selectRelative(1));
toggleSpinButton.addEventListener("click", () => {
  autoRotate = !autoRotate;
  toggleSpinButton.classList.toggle("active", autoRotate);
  toggleSpinButton.setAttribute("aria-pressed", String(autoRotate));
});

function renderGalleryToText() {
  const selected = VARIANTS[selectedIndex];
  return JSON.stringify({
    scene: {
      loaded: renderedOnce,
      theme: "original-fantasy-building-gallery",
      variantCount: VARIANTS.length,
      visibleCount: visibleIds.length,
      activeFamily,
      selectedVariant: selected.id,
      selectedName: selected.name,
      selectedScale: selected.scale,
      autoRotate
    },
    camera: {
      position: camera.position.toArray().map((value) => Number(value.toFixed(2))),
      focus: focus.toArray().map((value) => Number(value.toFixed(2))),
      distance: Number(cameraState.distance.toFixed(2))
    },
    families: FAMILIES,
    variants: VARIANTS.map((variant) => ({
      id: variant.id,
      name: variant.name,
      family: variant.family,
      scale: variant.scale,
      visible: visibleIds.includes(variant.id),
      selected: variant.id === selected.id
    })),
    errors: window.__buildingLabErrors
  });
}

function advanceTime(ms) {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) update(1 / 60);
  render();
}

function setFamily(family) {
  activeFamily = FAMILIES.includes(family) ? family : "All";
  renderFilters();
  renderVariantList();
  layoutVisible();
}

function inspectVariant(id) {
  const index = VARIANTS.findIndex((variant) => variant.id === id);
  if (index >= 0) selectVariant(index);
}

window.render_game_to_text = renderGalleryToText;
window.advanceTime = advanceTime;
window.gitlandBuildingLab = {
  setFamily,
  inspectVariant,
  variants: VARIANTS.map(({ id, name, family, scale }) => ({ id, name, family, scale }))
};

tileGroups = VARIANTS.map((variant) => createTile(variant));
tileGroups.forEach((tile) => tileRoot.add(tile.group));
variantCount.textContent = `${VARIANTS.length} original building candidates`;
toggleSpinButton.classList.add("active");
renderFilters();
renderVariantList();
layoutVisible();
resize();
loop();

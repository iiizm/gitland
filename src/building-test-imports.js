import * as THREE from "three";

const materialCache = new Map();
const textureCache = new Map();
let activeRenderProfile = "gallery";

function isMapRenderProfile() {
  return activeRenderProfile === "map";
}

function renderSegmentCount(segments, min = 5, scale = 0.55) {
  if (!isMapRenderProfile()) return segments;
  return Math.max(min, Math.round(segments * scale));
}

const PALETTES = {
  spectrum: ["#10242e", "#17d0db", "#ca4df3", "#f2cc5d", "#eaf7f7"],
  chrome: ["#121820", "#dce6ea", "#62c6ff", "#2e3a45", "#ffffff"],
  circuit: ["#e8fff9", "#22dec7", "#9cff63", "#50636b", "#f9ffff"],
  carbon: ["#0e1114", "#333b42", "#b66e46", "#77848b", "#faf2df"],
  oled: ["#05070b", "#fd4fa2", "#29d8ff", "#ffffff", "#141922"],
  aerogel: ["#f2fbff", "#a4dfff", "#e7ffff", "#9eb4c2", "#ffffff"],
  mercury: ["#e9eff2", "#0e1118", "#9f74ff", "#6c7c8a", "#ffffff"],
  ceramicBlack: ["#0d0f11", "#f1b845", "#2f3944", "#f7f0d0", "#ffffff"],
  earth: ["#8c5535", "#c57b45", "#e0b06a", "#5b4d3e", "#f2dfbe"],
  charwood: ["#0c0a08", "#3a2116", "#ff8a35", "#6e4c2d", "#f6d8a8"],
  moss: ["#6e756e", "#244f31", "#8eb96a", "#1b2a22", "#dbe7cf"],
  water: ["#74c8c2", "#e7ffff", "#297f85", "#b9efe7", "#ffffff"],
  basalt: ["#15191b", "#384047", "#10294a", "#b7d8ff", "#f0f6ff"],
  reed: ["#caa96b", "#73824d", "#e9d8ac", "#8d6a3d", "#f4eddc"],
  coral: ["#efe4ce", "#f0a59b", "#75b7bd", "#b87d61", "#fff7ea"],
  clay: ["#bf633a", "#43a9a0", "#f2dbb4", "#7a3925", "#fff2dc"],
  marble: ["#f2eadc", "#2a2c2f", "#bc9b61", "#a7bdc7", "#ffffff"],
  porcelain: ["#f9fbf4", "#1e4ea3", "#c7d8e8", "#151c2d", "#ffffff"],
  mosaic: ["#c69b35", "#1d8978", "#81396f", "#f7e8b8", "#ffffff"],
  brick: ["#8f3d2f", "#c36b45", "#221f1b", "#f1c177", "#fff0db"],
  islamic: ["#162656", "#1aa0a5", "#f1f1dd", "#d9b85f", "#ffffff"],
  bronze: ["#214d48", "#7e4f28", "#cd8c42", "#102725", "#e9dcc4"],
  sandstone: ["#c48a4f", "#e2b875", "#6f4630", "#39a69b", "#fff2d1"],
  fresco: ["#d5c5a8", "#a85a51", "#7891a4", "#e8d9c2", "#fff7ea"],
  salt: ["#7e9297", "#f0eee3", "#b75936", "#2d3e45", "#ffffff"],
  tar: ["#080706", "#2d2119", "#a73024", "#f4822f", "#ffffff"],
  rust: ["#5a271e", "#c75b29", "#df9554", "#26333a", "#f3d7a4"],
  enamel: ["#ece8d8", "#86bfae", "#302a24", "#e8cb84", "#ffffff"],
  galvanized: ["#aeb7b9", "#676f73", "#48a7d6", "#d8e3e3", "#ffffff"],
  hazard: ["#f0c22b", "#10100f", "#bd2d22", "#7b6b44", "#ffffff"],
  ink: ["#0d1428", "#1a2f65", "#6d3c8e", "#f0e7d0", "#ffffff"],
  velvet: ["#2a081d", "#6b143b", "#d4c7ff", "#f2d27a", "#ffffff"],
  stained: ["#7d1537", "#10488d", "#168765", "#ecc657", "#ffffff"],
  paper: ["#f2e7ce", "#222222", "#d4bea0", "#fff8e9", "#ffffff"],
  pearl: ["#f6f1e7", "#f2a8c0", "#8fe0cc", "#b6b4ff", "#ffffff"],
  cosmic: ["#05050c", "#7a40e5", "#ffffff", "#2bd8ff", "#f5d46d"],
  wetStreet: ["#dadbd3", "#0b131b", "#e83f3c", "#2c87e5", "#ffffff"],
  peeling: ["#d6eadf", "#f3eddb", "#886755", "#fffbba", "#ffffff"],
  poly: ["#e6f1ef", "#7adb88", "#f28a34", "#8195a0", "#ffffff"],
  market: ["#d64235", "#2169b1", "#2a9969", "#d4a846", "#ffffff"],
  cinema: ["#151111", "#7e102b", "#f2bd4c", "#f7e5c1", "#ffffff"],
  mortar: ["#9b9b91", "#2c3c41", "#2e7db2", "#c67b40", "#ffffff"],
  bath: ["#dbeff0", "#70b4d3", "#f5f9f8", "#c48e55", "#ffffff"],
  cafe: ["#e9dec8", "#8b552d", "#b46833", "#212323", "#ffffff"],
  subway: ["#a9aaa3", "#2d3439", "#1db168", "#dfe7ea", "#ffffff"],
  toyForge: ["#5c6470", "#d94a32", "#f28b32", "#2d2d35", "#ffe0a5"],
  trainingYard: ["#c7904a", "#4a7ec8", "#d93636", "#8d6c3d", "#fff1cd"],
  gemVault: ["#56616f", "#00d8a2", "#a64cff", "#ffd34f", "#f6fffb"],
  flameTower: ["#202734", "#d9432e", "#ff931f", "#6b4a2a", "#ffe7a1"],
  hatchery: ["#e7d3a0", "#8d6b3e", "#8ce1cc", "#bd73de", "#fff8e5"],
  royalArena: ["#1f55a7", "#f0b533", "#e9edf4", "#6f4cc2", "#ffffff"],
  manaBanner: ["#5a2ba3", "#d83c4c", "#2f75d6", "#f7d35f", "#ffffff"],
  cardHall: ["#23a7aa", "#f0bf4d", "#f7f3e8", "#162a48", "#ffffff"],
  battleCourt: ["#d66b2a", "#256bd8", "#e9e3d0", "#2a2d36", "#ffffff"],
  chestWorkshop: ["#ad642e", "#ffd14d", "#28c789", "#342515", "#fff3c2"],
  hunterGuild: ["#6b3f25", "#d8c29b", "#b66f37", "#2d211a", "#fff0cf"],
  hideCanteen: ["#815434", "#d69b58", "#e6cf9c", "#342218", "#fff1c8"],
  antlerPost: ["#4c3122", "#e3d5b7", "#8c5a36", "#f0b64b", "#fff7de"],
  caravanSmith: ["#7b4b2e", "#c86732", "#f5a63d", "#38404a", "#ffddb0"],
  ribStorehouse: ["#3b2c25", "#e4d6b8", "#9f7044", "#78412c", "#fff4d6"],
  toyBlockKeep: ["#2f85ff", "#f04f45", "#ffd344", "#2fbf71", "#fff8df"],
  mushroomBarracks: ["#cf4747", "#f2e7ca", "#66b95f", "#704331", "#fff6dc"],
  bombFoundry: ["#17191f", "#3a3d48", "#ff7940", "#f0c640", "#ffffff"],
  starPumpLab: ["#6a55ff", "#2ed8ff", "#ffd83c", "#232946", "#ffffff"],
  siegeDock: ["#6c8fb1", "#c18a47", "#2f4d67", "#f2c45d", "#fff0cf"],
  raidRune: ["#292341", "#7156d9", "#4fd4ff", "#1a1428", "#f4eaff"],
  raidLava: ["#201718", "#5a1d20", "#ff7f2a", "#ffd45a", "#140c0c"],
  raidIce: ["#e8fbff", "#74c7e8", "#2d6ea6", "#ffffff", "#b4f2ff"],
  raidSpore: ["#29381f", "#6ebd45", "#b9e86d", "#5b3d7d", "#f2ffd7"],
  raidStorm: ["#2d3448", "#f4cf54", "#66c8ff", "#6a5c99", "#ffffff"],
  shellHut: ["#e8d9b7", "#d88b68", "#67b6a4", "#6a4c3a", "#fff1d3"],
  hornDen: ["#4b3528", "#e9dcc1", "#b04936", "#f2b84c", "#fff0d2"],
  scaleNest: ["#244a42", "#4fa06c", "#b4d66d", "#1a2d29", "#e4ffd1"],
  slimeMill: ["#64d66c", "#b8ff74", "#4de0d3", "#2d5530", "#f1ffd7"],
  fangHall: ["#553726", "#f1dfbd", "#bd4934", "#f0a83d", "#fff1d1"],
  adventureLodge: ["#6a4a2d", "#7fb05a", "#2aa8a3", "#f2dfb6", "#fff4cc"],
  adventureForest: ["#4a6d35", "#8abf5d", "#c9a75a", "#5b3d27", "#fff1b6"],
  adventureRune: ["#73806d", "#40c7c4", "#d2a84a", "#26362d", "#f5efd7"],
  adventureWindmill: ["#ead9b9", "#76a85d", "#d7a64a", "#8b5d32", "#fff4cf"],
  adventureSky: ["#d8d0b4", "#35a9a5", "#f2b657", "#6b765f", "#e7fbff"],
  adventureTide: ["#202628", "#28b8b0", "#e14b2f", "#c49755", "#fff1ce"]
};

const SOURCE_CATEGORY_LABELS = {
  future: "Future / Glass",
  bio: "Nature / Earth",
  heritage: "Heritage / Ornament",
  industrial: "Industrial / Patina",
  fantasy: "Fantasy / Art",
  urban: "Urban / Lived-In",
  "game-village": "Kingdom Village",
  "game-arena": "Card Arena",
  "game-hunter": "Hunter Camp",
  "game-toy": "Toy Fortress",
  "game-raid": "Raid / Dungeon",
  "game-creature": "Creature Village",
  "game-adventure": "Adventure Ruins"
};

const PRESERVED_IMPORT_IDS = {
  "game-adventure-lodge": "building-test-adventure-lodge",
  "game-adventure-canopy": "building-test-canopy-hut",
  "game-adventure-rune": "building-test-rune-lock-shrine",
  "game-adventure-windmill": "building-test-sunleaf-windmill",
  "game-adventure-sky": "building-test-zephyr-spire",
  "game-adventure-tide": "building-test-lava-tide-temple",
  "game-forge": "building-test-hammerpop-forge",
  "game-crown-gate": "building-test-crown-rune-gate",
  "game-hunter-guild": "building-test-great-horn-guildhall",
  "game-hunter-store": "building-test-ribcage-storehouse",
  "game-raid-rune": "building-test-eclipse-rune-gate",
  "game-hatchery": "building-test-tiny-wyvern-hatchery"
};

const BUILDING_TEST_SPECS = [
  {
    "sourceId": "future-spectrum",
    "name": "Spectrum Veil Tower",
    "designer": "future",
    "form": "twistTower",
    "surface": "spectrumVeil",
    "palette": "spectrum",
    "height": 16,
    "footprint": 2.4
  },
  {
    "sourceId": "future-chrome",
    "name": "Wet Chrome Data Spire",
    "designer": "future",
    "form": "needle",
    "surface": "wetChrome",
    "palette": "chrome",
    "height": 17,
    "footprint": 1.9
  },
  {
    "sourceId": "future-circuit",
    "name": "Frost Circuit Cathedral",
    "designer": "future",
    "form": "cathedral",
    "surface": "frostedCircuit",
    "palette": "circuit",
    "height": 12,
    "footprint": 2.8
  },
  {
    "sourceId": "future-carbon",
    "name": "Carbon Weave Arcology",
    "designer": "future",
    "form": "exoskeleton",
    "surface": "carbonWeave",
    "palette": "carbon",
    "height": 13,
    "footprint": 2.5
  },
  {
    "sourceId": "future-oled",
    "name": "OLED Skin Stack",
    "designer": "future",
    "form": "stackedScreens",
    "surface": "oledSkin",
    "palette": "oled",
    "height": 11,
    "footprint": 2.8
  },
  {
    "sourceId": "future-aerogel",
    "name": "Aerogel Cloud Dock",
    "designer": "future",
    "form": "floatingDock",
    "surface": "aerogelCloud",
    "palette": "aerogel",
    "height": 9,
    "footprint": 3.4
  },
  {
    "sourceId": "future-mercury",
    "name": "Liquid Mercury Habitat",
    "designer": "future",
    "form": "blobPods",
    "surface": "liquidMercury",
    "palette": "mercury",
    "height": 8,
    "footprint": 3.2
  },
  {
    "sourceId": "future-lens",
    "name": "Micro Lens Lab",
    "designer": "future",
    "form": "lensCluster",
    "surface": "microLens",
    "palette": "circuit",
    "height": 8,
    "footprint": 2.9
  },
  {
    "sourceId": "future-ceramic",
    "name": "Black Ceramic Monolith",
    "designer": "future",
    "form": "monolith",
    "surface": "blackCeramic",
    "palette": "ceramicBlack",
    "height": 15,
    "footprint": 2.1
  },
  {
    "sourceId": "future-hologram",
    "name": "Hologram Control Tower",
    "designer": "future",
    "form": "ringGate",
    "surface": "hologramShell",
    "palette": "spectrum",
    "height": 12,
    "footprint": 2.8
  },
  {
    "sourceId": "bio-earth",
    "name": "Layered Earth Cliff Homes",
    "designer": "bio",
    "form": "terraceCliff",
    "surface": "earthStrata",
    "palette": "earth",
    "height": 8,
    "footprint": 3.4
  },
  {
    "sourceId": "bio-charred",
    "name": "Charred Cedar Forest House",
    "designer": "bio",
    "form": "woodCabin",
    "surface": "charredWood",
    "palette": "charwood",
    "height": 7,
    "footprint": 2.8
  },
  {
    "sourceId": "bio-moss",
    "name": "Moss Eaten Greenhouse",
    "designer": "bio",
    "form": "greenhouse",
    "surface": "mossConcrete",
    "palette": "moss",
    "height": 7,
    "footprint": 3.3
  },
  {
    "sourceId": "bio-water",
    "name": "Water Scale Pavilion",
    "designer": "bio",
    "form": "ripplePavilion",
    "surface": "waterGlass",
    "palette": "water",
    "height": 6,
    "footprint": 3.5
  },
  {
    "sourceId": "bio-basalt",
    "name": "Wet Basalt Bath",
    "designer": "bio",
    "form": "bathDome",
    "surface": "wetBasalt",
    "palette": "basalt",
    "height": 6,
    "footprint": 3.1
  },
  {
    "sourceId": "bio-reed",
    "name": "Woven Reed Market",
    "designer": "bio",
    "form": "wovenMarket",
    "surface": "wovenReed",
    "palette": "reed",
    "height": 5,
    "footprint": 3.6
  },
  {
    "sourceId": "bio-root",
    "name": "Root Stilt Village",
    "designer": "bio",
    "form": "stiltVillage",
    "surface": "rootWood",
    "palette": "reed",
    "height": 7,
    "footprint": 3.4
  },
  {
    "sourceId": "bio-coral",
    "name": "Coral Limestone Lab",
    "designer": "bio",
    "form": "coralLab",
    "surface": "coralStone",
    "palette": "coral",
    "height": 7,
    "footprint": 3
  },
  {
    "sourceId": "bio-clay",
    "name": "Glazed Mud Dome House",
    "designer": "bio",
    "form": "mudDome",
    "surface": "glazedClay",
    "palette": "clay",
    "height": 6,
    "footprint": 3.1
  },
  {
    "sourceId": "bio-algae",
    "name": "Algae Membrane Library",
    "designer": "bio",
    "form": "membraneLibrary",
    "surface": "algaeMembrane",
    "palette": "water",
    "height": 7,
    "footprint": 3.2
  },
  {
    "sourceId": "heritage-marble",
    "name": "Cracked Marble Amphitheater",
    "designer": "heritage",
    "form": "arena",
    "surface": "crackedMarble",
    "palette": "marble",
    "height": 7,
    "footprint": 3.8
  },
  {
    "sourceId": "heritage-porcelain",
    "name": "Blue Porcelain Palace",
    "designer": "heritage",
    "form": "palace",
    "surface": "porcelainCrackle",
    "palette": "porcelain",
    "height": 7,
    "footprint": 3.2
  },
  {
    "sourceId": "heritage-mosaic",
    "name": "Byzantine Mosaic Basilica",
    "designer": "heritage",
    "form": "basilica",
    "surface": "goldMosaic",
    "palette": "mosaic",
    "height": 9,
    "footprint": 3
  },
  {
    "sourceId": "heritage-brick",
    "name": "Handmade Brick Manor",
    "designer": "heritage",
    "form": "manor",
    "surface": "agedBrick",
    "palette": "brick",
    "height": 7,
    "footprint": 2.9
  },
  {
    "sourceId": "heritage-tile",
    "name": "Star Tile Observatory",
    "designer": "heritage",
    "form": "observatory",
    "surface": "islamicTile",
    "palette": "islamic",
    "height": 10,
    "footprint": 2.7
  },
  {
    "sourceId": "heritage-basalt",
    "name": "Obsidian Lava Fortress",
    "designer": "heritage",
    "form": "fortress",
    "surface": "basaltLava",
    "palette": "basalt",
    "height": 10,
    "footprint": 3.1
  },
  {
    "sourceId": "heritage-bronze",
    "name": "Verdigris Bronze Shrine",
    "designer": "heritage",
    "form": "bronzeTemple",
    "surface": "verdigrisBronze",
    "palette": "bronze",
    "height": 8,
    "footprint": 3.1
  },
  {
    "sourceId": "heritage-sand",
    "name": "Sandstone Relief Temple",
    "designer": "heritage",
    "form": "reliefTemple",
    "surface": "sandstoneGlyph",
    "palette": "sandstone",
    "height": 7,
    "footprint": 3.3
  },
  {
    "sourceId": "heritage-check",
    "name": "Checker Marble Court",
    "designer": "heritage",
    "form": "court",
    "surface": "checkerMarble",
    "palette": "marble",
    "height": 6,
    "footprint": 3
  },
  {
    "sourceId": "heritage-fresco",
    "name": "Faded Fresco Monastery",
    "designer": "heritage",
    "form": "monastery",
    "surface": "frescoPlaster",
    "palette": "fresco",
    "height": 7,
    "footprint": 3.2
  },
  {
    "sourceId": "industrial-salt",
    "name": "Salt Eaten Drydock Gate",
    "designer": "industrial",
    "form": "dockGate",
    "surface": "saltMetal",
    "palette": "salt",
    "height": 7,
    "footprint": 3.8
  },
  {
    "sourceId": "industrial-tar",
    "name": "Tar Black Refinery",
    "designer": "industrial",
    "form": "refinery",
    "surface": "tarOil",
    "palette": "tar",
    "height": 8,
    "footprint": 3.5
  },
  {
    "sourceId": "industrial-water",
    "name": "Wet Concrete Waterworks",
    "designer": "industrial",
    "form": "waterworks",
    "surface": "wetConcrete",
    "palette": "salt",
    "height": 6,
    "footprint": 3.6
  },
  {
    "sourceId": "industrial-rust",
    "name": "Rust Bloom Silo Cathedral",
    "designer": "industrial",
    "form": "siloCathedral",
    "surface": "rustBloom",
    "palette": "rust",
    "height": 10,
    "footprint": 3.2
  },
  {
    "sourceId": "industrial-enamel",
    "name": "Enamel Tile Factory Office",
    "designer": "industrial",
    "form": "tileFactory",
    "surface": "enamelTile",
    "palette": "enamel",
    "height": 6,
    "footprint": 3.2
  },
  {
    "sourceId": "industrial-pipes",
    "name": "Galvanized Pipe Organ",
    "designer": "industrial",
    "form": "pipeOrgan",
    "surface": "galvanizedPipe",
    "palette": "galvanized",
    "height": 9,
    "footprint": 3
  },
  {
    "sourceId": "industrial-scorched",
    "name": "Scorched Rolling Shell",
    "designer": "industrial",
    "form": "hotMill",
    "surface": "scorchedSteel",
    "palette": "tar",
    "height": 7,
    "footprint": 3.8
  },
  {
    "sourceId": "industrial-frost",
    "name": "Frozen Tank Farm",
    "designer": "industrial",
    "form": "tankFarm",
    "surface": "frostTank",
    "palette": "galvanized",
    "height": 7,
    "footprint": 3.5
  },
  {
    "sourceId": "industrial-hazard",
    "name": "Hazard Crane Control",
    "designer": "industrial",
    "form": "craneControl",
    "surface": "hazardPaint",
    "palette": "hazard",
    "height": 8,
    "footprint": 3.6
  },
  {
    "sourceId": "industrial-scrap",
    "name": "Scrap Patch Foundry",
    "designer": "industrial",
    "form": "patchFoundry",
    "surface": "scrapPatch",
    "palette": "rust",
    "height": 7,
    "footprint": 3.4
  },
  {
    "sourceId": "fantasy-ink",
    "name": "Dream Ink Monastery",
    "designer": "fantasy",
    "form": "inkMonastery",
    "surface": "inkWash",
    "palette": "ink",
    "height": 8,
    "footprint": 3
  },
  {
    "sourceId": "fantasy-ceramic",
    "name": "Glazed Ceramic Palace",
    "designer": "fantasy",
    "form": "palace",
    "surface": "ceramicCrack",
    "palette": "clay",
    "height": 7,
    "footprint": 3.2
  },
  {
    "sourceId": "fantasy-velvet",
    "name": "Stardust Velvet Theater",
    "designer": "fantasy",
    "form": "theater",
    "surface": "velvetStar",
    "palette": "velvet",
    "height": 6,
    "footprint": 3.5
  },
  {
    "sourceId": "fantasy-mercury",
    "name": "Liquid Mirror Temple",
    "designer": "fantasy",
    "form": "mirrorTemple",
    "surface": "mercuryMirror",
    "palette": "mercury",
    "height": 7,
    "footprint": 3
  },
  {
    "sourceId": "fantasy-stained",
    "name": "Stained Glass Tomb",
    "designer": "fantasy",
    "form": "glassTomb",
    "surface": "stainedGlass",
    "palette": "stained",
    "height": 7,
    "footprint": 3
  },
  {
    "sourceId": "fantasy-burnt",
    "name": "Burnt Gold Citadel",
    "designer": "fantasy",
    "form": "burntKeep",
    "surface": "burntGold",
    "palette": "charwood",
    "height": 10,
    "footprint": 3.1
  },
  {
    "sourceId": "fantasy-ghost",
    "name": "Ghost Hologram Shrine",
    "designer": "fantasy",
    "form": "ghostShrine",
    "surface": "ghostHologram",
    "palette": "spectrum",
    "height": 9,
    "footprint": 3
  },
  {
    "sourceId": "fantasy-paper",
    "name": "Folded Paper Observatory",
    "designer": "fantasy",
    "form": "folded",
    "surface": "foldedPaper",
    "palette": "paper",
    "height": 6,
    "footprint": 3
  },
  {
    "sourceId": "fantasy-pearl",
    "name": "Pearl Shell Tower",
    "designer": "fantasy",
    "form": "pearlTower",
    "surface": "pearlShell",
    "palette": "pearl",
    "height": 11,
    "footprint": 2.4
  },
  {
    "sourceId": "fantasy-cosmic",
    "name": "Cosmic Crack Obelisk",
    "designer": "fantasy",
    "form": "cosmicObelisk",
    "surface": "cosmicCrack",
    "palette": "cosmic",
    "height": 14,
    "footprint": 2.2
  },
  {
    "sourceId": "urban-rain",
    "name": "Rain Alley Convenience",
    "designer": "urban",
    "form": "storefront",
    "surface": "wetStreetTile",
    "palette": "wetStreet",
    "height": 5,
    "footprint": 3.2
  },
  {
    "sourceId": "urban-laundry",
    "name": "Old Laundry Shop",
    "designer": "urban",
    "form": "cornerShop",
    "surface": "peelingTile",
    "palette": "peeling",
    "height": 5,
    "footprint": 2.8
  },
  {
    "sourceId": "urban-brick",
    "name": "Brick Remodel House",
    "designer": "urban",
    "form": "renovation",
    "surface": "renovatedBrick",
    "palette": "brick",
    "height": 6,
    "footprint": 2.9
  },
  {
    "sourceId": "urban-poly",
    "name": "Polycarbonate Workshop",
    "designer": "urban",
    "form": "workshop",
    "surface": "polycarbonate",
    "palette": "poly",
    "height": 5,
    "footprint": 3.1
  },
  {
    "sourceId": "urban-market",
    "name": "Canvas Market Arcade",
    "designer": "urban",
    "form": "marketArcade",
    "surface": "marketCanvas",
    "palette": "market",
    "height": 4,
    "footprint": 3.7
  },
  {
    "sourceId": "urban-cinema",
    "name": "Independent Cinema",
    "designer": "urban",
    "form": "cinema",
    "surface": "cinemaPoster",
    "palette": "cinema",
    "height": 5,
    "footprint": 3.3
  },
  {
    "sourceId": "urban-rooftop",
    "name": "Water Tank Villa",
    "designer": "urban",
    "form": "rooftopVilla",
    "surface": "rooftopMortar",
    "palette": "mortar",
    "height": 6,
    "footprint": 2.8
  },
  {
    "sourceId": "urban-bath",
    "name": "Neighborhood Bathhouse",
    "designer": "urban",
    "form": "bathhouse",
    "surface": "bathTileSteam",
    "palette": "bath",
    "height": 5,
    "footprint": 3
  },
  {
    "sourceId": "urban-cafe",
    "name": "Cafe Roastery",
    "designer": "urban",
    "form": "roastery",
    "surface": "stuccoWoodCopper",
    "palette": "cafe",
    "height": 5,
    "footprint": 3
  },
  {
    "sourceId": "urban-subway",
    "name": "Subway Exit Culture Center",
    "designer": "urban",
    "form": "subwayCenter",
    "surface": "subwayStoneSign",
    "palette": "subway",
    "height": 5,
    "footprint": 3.4
  },
  {
    "sourceId": "game-forge",
    "name": "Hammerpop Forge",
    "designer": "game-village",
    "form": "toyForge",
    "surface": "chunkyGameStone",
    "palette": "toyForge",
    "height": 6,
    "footprint": 3
  },
  {
    "sourceId": "game-training",
    "name": "Banner Recruit Yard",
    "designer": "game-village",
    "form": "trainingCamp",
    "surface": "paintedChestWood",
    "palette": "trainingYard",
    "height": 5,
    "footprint": 3.4
  },
  {
    "sourceId": "game-royal-barracks",
    "name": "Royal Banner Barracks",
    "designer": "game-village",
    "form": "royalBarracks",
    "surface": "chunkyGameStone",
    "palette": "royalArena",
    "height": 5,
    "footprint": 3.5
  },
  {
    "sourceId": "game-elixir-mill",
    "name": "Elixir Orchard Mill",
    "designer": "game-village",
    "form": "elixirMill",
    "surface": "paintedChestWood",
    "palette": "gemVault",
    "height": 6,
    "footprint": 3.2
  },
  {
    "sourceId": "game-cannon-bakery",
    "name": "Cannon Bakery House",
    "designer": "game-village",
    "form": "cannonBakery",
    "surface": "chunkyGameStone",
    "palette": "trainingYard",
    "height": 5,
    "footprint": 3.1
  },
  {
    "sourceId": "game-crown-gate",
    "name": "Crown Rune Arena Gate",
    "designer": "game-arena",
    "form": "crownGate",
    "surface": "royalRuneStone",
    "palette": "royalArena",
    "height": 8,
    "footprint": 3.2
  },
  {
    "sourceId": "game-mana-tower",
    "name": "Mana Banner Tower",
    "designer": "game-arena",
    "form": "manaTower",
    "surface": "bannerCloth",
    "palette": "manaBanner",
    "height": 8,
    "footprint": 2.6
  },
  {
    "sourceId": "game-card-hall",
    "name": "Champion Card Hall",
    "designer": "game-arena",
    "form": "cardHall",
    "surface": "cardCeramic",
    "palette": "cardHall",
    "height": 7,
    "footprint": 3
  },
  {
    "sourceId": "game-battle-court",
    "name": "Tile Battle Court",
    "designer": "game-arena",
    "form": "battleCourt",
    "surface": "arenaTile",
    "palette": "battleCourt",
    "height": 5,
    "footprint": 3.8
  },
  {
    "sourceId": "game-festival-arena",
    "name": "Festival Duel Arena",
    "designer": "game-arena",
    "form": "festivalArena",
    "surface": "arenaTile",
    "palette": "battleCourt",
    "height": 5,
    "footprint": 4
  },
  {
    "sourceId": "game-hunter-guild",
    "name": "Great Horn Trophy Guildhall",
    "designer": "game-hunter",
    "form": "boneGuildhall",
    "surface": "hunterBone",
    "palette": "hunterGuild",
    "height": 7,
    "footprint": 3.8
  },
  {
    "sourceId": "game-hunter-canteen",
    "name": "Hide Feast Canteen",
    "designer": "game-hunter",
    "form": "hideCanteen",
    "surface": "hunterHide",
    "palette": "hideCanteen",
    "height": 6,
    "footprint": 3.7
  },
  {
    "sourceId": "game-hunter-watch",
    "name": "Antler Trap Watch Post",
    "designer": "game-hunter",
    "form": "antlerWatch",
    "surface": "hunterBone",
    "palette": "antlerPost",
    "height": 9,
    "footprint": 3
  },
  {
    "sourceId": "game-hunter-smithy",
    "name": "Wheel Forge Caravan",
    "designer": "game-hunter",
    "form": "caravanSmithy",
    "surface": "hunterFur",
    "palette": "caravanSmith",
    "height": 6,
    "footprint": 3.8
  },
  {
    "sourceId": "game-hunter-store",
    "name": "Ribcage Trophy Storehouse",
    "designer": "game-hunter",
    "form": "ribStorehouse",
    "surface": "hunterBone",
    "palette": "ribStorehouse",
    "height": 7,
    "footprint": 3.7
  },
  {
    "sourceId": "game-toy-keep",
    "name": "Toy Block Keep",
    "designer": "game-toy",
    "form": "toyBlockKeep",
    "surface": "toyPaint",
    "palette": "toyBlockKeep",
    "height": 6,
    "footprint": 3
  },
  {
    "sourceId": "game-vault",
    "name": "Gem Belly Vault",
    "designer": "game-toy",
    "form": "gemVault",
    "surface": "glowingGem",
    "palette": "gemVault",
    "height": 6,
    "footprint": 2.9
  },
  {
    "sourceId": "game-flame",
    "name": "Sparkbelcher Defense Tower",
    "designer": "game-toy",
    "form": "flameTower",
    "surface": "scorchedCartoonMetal",
    "palette": "flameTower",
    "height": 8,
    "footprint": 2.4
  },
  {
    "sourceId": "game-chest-shop",
    "name": "Royal Chest Workshop",
    "designer": "game-toy",
    "form": "chestWorkshop",
    "surface": "paintedChestWood",
    "palette": "chestWorkshop",
    "height": 5,
    "footprint": 3.2
  },
  {
    "sourceId": "game-toy-star",
    "name": "Star Pump Lab",
    "designer": "game-toy",
    "form": "starPumpLab",
    "surface": "toyPaint",
    "palette": "starPumpLab",
    "height": 6,
    "footprint": 3.2
  },
  {
    "sourceId": "game-raid-rune",
    "name": "Eclipse Rune Raid Gate",
    "designer": "game-raid",
    "form": "runeBastion",
    "surface": "runeStone",
    "palette": "raidRune",
    "height": 11,
    "footprint": 4
  },
  {
    "sourceId": "game-raid-lava",
    "name": "Molten Boss Furnace",
    "designer": "game-raid",
    "form": "lavaBossForge",
    "surface": "lavaToon",
    "palette": "raidLava",
    "height": 10,
    "footprint": 4
  },
  {
    "sourceId": "game-raid-ice",
    "name": "Frost Sigil Boss Vault",
    "designer": "game-raid",
    "form": "iceVault",
    "surface": "iceFacet",
    "palette": "raidIce",
    "height": 9,
    "footprint": 3.8
  },
  {
    "sourceId": "game-raid-spore",
    "name": "Venom Spore Raid Keep",
    "designer": "game-raid",
    "form": "sporeKeep",
    "surface": "sporePaint",
    "palette": "raidSpore",
    "height": 8,
    "footprint": 3.9
  },
  {
    "sourceId": "game-raid-storm",
    "name": "Thunder War Drum Spire",
    "designer": "game-raid",
    "form": "stormDrumTower",
    "surface": "stormPaint",
    "palette": "raidStorm",
    "height": 10,
    "footprint": 3.7
  },
  {
    "sourceId": "game-hatchery",
    "name": "Tiny Wyvern Hatchery",
    "designer": "game-creature",
    "form": "dragonHatchery",
    "surface": "nestStrawShell",
    "palette": "hatchery",
    "height": 5,
    "footprint": 3.2
  },
  {
    "sourceId": "game-creature-shell",
    "name": "Shellback Hut",
    "designer": "game-creature",
    "form": "shellbackHut",
    "surface": "shellBand",
    "palette": "shellHut",
    "height": 5,
    "footprint": 3.2
  },
  {
    "sourceId": "game-creature-horn",
    "name": "Horn Totem Den",
    "designer": "game-creature",
    "form": "hornTotemDen",
    "surface": "fangMark",
    "palette": "hornDen",
    "height": 6,
    "footprint": 3.1
  },
  {
    "sourceId": "game-creature-scale",
    "name": "Scale Nest Tower",
    "designer": "game-creature",
    "form": "scaleNestTower",
    "surface": "scalePlate",
    "palette": "scaleNest",
    "height": 7,
    "footprint": 2.8
  },
  {
    "sourceId": "game-creature-slime",
    "name": "Slime Lantern Mill",
    "designer": "game-creature",
    "form": "slimeLanternMill",
    "surface": "slimeGel",
    "palette": "slimeMill",
    "height": 5,
    "footprint": 3.4
  },
  {
    "sourceId": "game-adventure-lodge",
    "name": "Windroot Wayfarer Lodge",
    "designer": "game-adventure",
    "form": "adventureLodge",
    "surface": "adventurePlaster",
    "palette": "adventureLodge",
    "height": 6,
    "footprint": 3.5
  },
  {
    "sourceId": "game-adventure-canopy",
    "name": "Mossbell Canopy Hut",
    "designer": "game-adventure",
    "form": "canopyHut",
    "surface": "leafShingle",
    "palette": "adventureForest",
    "height": 5,
    "footprint": 3.4
  },
  {
    "sourceId": "game-adventure-rune",
    "name": "Whispering Rune Lock Shrine",
    "designer": "game-adventure",
    "form": "runeLockShrine",
    "surface": "adventureRuneStone",
    "palette": "adventureRune",
    "height": 7,
    "footprint": 3.5
  },
  {
    "sourceId": "game-adventure-windmill",
    "name": "Sunleaf Windmill Granary",
    "designer": "game-adventure",
    "form": "sunleafWindmill",
    "surface": "adventurePlaster",
    "palette": "adventureWindmill",
    "height": 6,
    "footprint": 3.6
  },
  {
    "sourceId": "game-adventure-sky",
    "name": "Zephyr Reliquary Spire",
    "designer": "game-adventure",
    "form": "zephyrSpire",
    "surface": "skyIslandStone",
    "palette": "adventureSky",
    "height": 9,
    "footprint": 3.2
  },
  {
    "sourceId": "game-adventure-tide",
    "name": "Lava Tide Temple",
    "designer": "game-adventure",
    "form": "lavaTideTemple",
    "surface": "tideTempleStone",
    "palette": "adventureTide",
    "height": 7,
    "footprint": 3.9
  }
];

const BUILDING_TEST_SPEC_BY_SOURCE_ID = new Map(BUILDING_TEST_SPECS.map((spec) => [spec.sourceId, spec]));

const SETTLEMENT_EXTRA_SPECS = [
  {
    sourceId: "obsidian-bastion",
    name: "Obsidian Bastion",
    designer: "saved-kingdom",
    form: "obsidianBastion",
    surface: "basaltBlock",
    palette: "basalt",
    height: 9.6,
    footprint: 4.2
  },
  {
    sourceId: "rift-gate-citadel",
    name: "Rift Gate Citadel",
    designer: "saved-kingdom",
    form: "riftGateCitadel",
    surface: "aerogelCloud",
    palette: "aerogel",
    height: 10.8,
    footprint: 4.1
  },
  {
    sourceId: "black-crown-keep",
    name: "Black Crown Keep",
    designer: "saved-kingdom",
    form: "blackCrownKeep",
    surface: "burntGold",
    palette: "ceramicBlack",
    height: 10.2,
    footprint: 3.9
  }
];

const SETTLEMENT_EXTRA_SPEC_BY_SOURCE_ID = new Map(SETTLEMENT_EXTRA_SPECS.map((spec) => [spec.sourceId, spec]));

const SETTLEMENT_CLANS = [
  {
    id: "clan-kingdom",
    name: "Kingdom Shieldreach",
    style: "kingdom",
    colors: ["#707983", "#d94a32", "#f0b533", "#2f75d6", "#fff1cd"],
    baseIds: ["game-royal-barracks", "game-forge", "game-cannon-bakery"]
  },
  {
    id: "clan-runecrown",
    name: "Runecrown Court",
    style: "runecrown",
    colors: ["#1f55a7", "#d83c4c", "#f0b533", "#40c7c4", "#f7f3e8"],
    baseIds: ["game-crown-gate", "game-card-hall", "game-mana-tower"]
  },
  {
    id: "clan-hunter",
    name: "Hornspike Hunt",
    style: "hunter",
    colors: ["#6b3f25", "#e4d6b8", "#b66f37", "#2d211a", "#fff0cf"],
    baseIds: ["game-hunter-guild", "game-hunter-canteen"]
  },
  {
    id: "clan-lumina",
    name: "Lumina Workshop League",
    style: "lumina",
    colors: ["#2f85ff", "#f04f45", "#ffd344", "#2fbf71", "#fff8df"],
    baseIds: ["game-toy-keep", "game-chest-shop"]
  },
  {
    id: "clan-abyss",
    name: "Abyss Runeworks",
    style: "abyss",
    colors: ["#292341", "#7156d9", "#ff7f2a", "#66c8ff", "#140c0c"],
    baseIds: ["game-raid-rune", "game-raid-lava"]
  },
  {
    id: "clan-windroot",
    name: "Windroot Grove",
    style: "windroot",
    colors: ["#4a6d35", "#8abf5d", "#40c7c4", "#d8d0b4", "#fff1b6"],
    baseIds: ["game-adventure-canopy", "game-adventure-lodge", "game-adventure-sky"]
  }
];

const SETTLEMENT_CLAN_BY_STYLE = new Map(SETTLEMENT_CLANS.map((clan) => [clan.style, clan]));
const TOPIC_SETTLEMENT_STYLE = {
  ai: "runecrown",
  frontend: "kingdom",
  infra: "lumina",
  database: "abyss",
  mobile: "windroot",
  game: "hunter"
};

const SELECTED_KINGDOM_KITS = {
  ai: {
    castle: ["game-crown-gate", "game-mana-tower", "future-hologram", "rift-gate-citadel"],
    house: ["future-circuit", "future-ceramic", "future-mercury", "future-aerogel"]
  },
  frontend: {
    castle: ["game-training", "game-forge", "game-royal-barracks", "game-card-hall"],
    house: ["urban-market", "game-cannon-bakery", "game-elixir-mill", "game-chest-shop"]
  },
  infra: {
    castle: ["industrial-hazard", "industrial-pipes", "obsidian-bastion", "black-crown-keep"],
    house: ["industrial-enamel", "industrial-scrap", "industrial-tar", "industrial-rust"]
  },
  database: {
    castle: ["heritage-tile", "game-raid-rune", "fantasy-ghost", "fantasy-cosmic"],
    house: ["heritage-bronze", "fantasy-stained", "heritage-mosaic", "fantasy-paper"]
  },
  mobile: {
    castle: ["bio-root", "game-adventure-windmill", "game-adventure-sky", "game-adventure-tide"],
    house: ["bio-reed", "bio-water", "game-adventure-canopy", "game-adventure-lodge"]
  },
  game: {
    castle: ["game-hunter-watch", "game-hunter-guild", "game-raid-storm", "game-raid-lava"],
    house: ["game-creature-shell", "game-hatchery", "game-hunter-canteen", "game-hunter-store"]
  }
};

const SETTLEMENT_PICK_SOURCE_IDS = {
  "building-test-future-aerogel": "future-aerogel",
  "building-test-fantasy-ghost": "fantasy-ghost",
  "building-test-zephyr-spire": "game-adventure-sky",
  "building-test-sunleaf-windmill": "game-adventure-windmill",
  "building-test-rune-lock-shrine": "game-adventure-rune",
  "building-test-canopy-hut": "game-adventure-canopy",
  "building-test-adventure-lodge": "game-adventure-lodge",
  "building-test-lava-tide-temple": "game-adventure-tide",
  "building-test-tiny-wyvern-hatchery": "game-hatchery",
  "building-test-game-raid-storm": "game-raid-storm",
  "building-test-great-horn-guildhall": "game-hunter-guild",
  "building-test-game-raid-lava": "game-raid-lava"
};

const FORM_BUILDERS = {
  twistTower: buildTwistTower,
  needle: buildNeedle,
  cathedral: buildCathedral,
  exoskeleton: buildExoskeleton,
  stackedScreens: buildStackedScreens,
  floatingDock: buildFloatingDock,
  blobPods: buildBlobPods,
  lensCluster: buildLensCluster,
  monolith: buildMonolith,
  ringGate: buildRingGate,
  terraceCliff: buildTerraceCliff,
  woodCabin: buildWoodCabin,
  greenhouse: buildGreenhouse,
  ripplePavilion: buildRipplePavilion,
  bathDome: buildBathDome,
  wovenMarket: buildWovenMarket,
  stiltVillage: buildStiltVillage,
  coralLab: buildCoralLab,
  mudDome: buildMudDome,
  membraneLibrary: buildMembraneLibrary,
  arena: buildArena,
  palace: buildPalace,
  basilica: buildBasilica,
  manor: buildManor,
  observatory: buildObservatory,
  fortress: buildFortress,
  bronzeTemple: buildBronzeTemple,
  reliefTemple: buildReliefTemple,
  court: buildCourt,
  monastery: buildMonastery,
  dockGate: buildDockGate,
  refinery: buildRefinery,
  waterworks: buildWaterworks,
  siloCathedral: buildSiloCathedral,
  tileFactory: buildTileFactory,
  pipeOrgan: buildPipeOrgan,
  hotMill: buildHotMill,
  tankFarm: buildTankFarm,
  craneControl: buildCraneControl,
  patchFoundry: buildPatchFoundry,
  inkMonastery: buildInkMonastery,
  theater: buildTheater,
  mirrorTemple: buildMirrorTemple,
  glassTomb: buildGlassTomb,
  burntKeep: buildBurntKeep,
  ghostShrine: buildGhostShrine,
  folded: buildFolded,
  pearlTower: buildPearlTower,
  cosmicObelisk: buildCosmicObelisk,
  storefront: buildStorefront,
  cornerShop: buildCornerShop,
  renovation: buildRenovation,
  workshop: buildWorkshop,
  marketArcade: buildMarketArcade,
  cinema: buildCinema,
  rooftopVilla: buildRooftopVilla,
  bathhouse: buildBathhouse,
  roastery: buildRoastery,
  subwayCenter: buildSubwayCenter,
  toyForge: buildToyForge,
  trainingCamp: buildTrainingCamp,
  royalBarracks: buildRoyalBarracks,
  elixirMill: buildElixirMill,
  cannonBakery: buildCannonBakery,
  crownGate: buildCrownGate,
  manaTower: buildManaTower,
  cardHall: buildCardHall,
  battleCourt: buildBattleCourt,
  festivalArena: buildFestivalArena,
  boneGuildhall: buildBoneGuildhall,
  hideCanteen: buildHideCanteen,
  antlerWatch: buildAntlerWatch,
  caravanSmithy: buildCaravanSmithy,
  ribStorehouse: buildRibStorehouse,
  toyBlockKeep: buildToyBlockKeep,
  gemVault: buildGemVault,
  flameTower: buildFlameTower,
  chestWorkshop: buildChestWorkshop,
  starPumpLab: buildStarPumpLab,
  runeBastion: buildRuneBastion,
  lavaBossForge: buildLavaBossForge,
  iceVault: buildIceVault,
  sporeKeep: buildSporeKeep,
  stormDrumTower: buildStormDrumTower,
  dragonHatchery: buildDragonHatchery,
  shellbackHut: buildShellbackHut,
  hornTotemDen: buildHornTotemDen,
  scaleNestTower: buildScaleNestTower,
  slimeLanternMill: buildSlimeLanternMill,
  adventureLodge: buildAdventureLodge,
  canopyHut: buildCanopyHut,
  runeLockShrine: buildRuneLockShrine,
  sunleafWindmill: buildSunleafWindmill,
  zephyrSpire: buildZephyrSpire,
  lavaTideTemple: buildLavaTideTemple
};

const SETTLEMENT_FORM_BUILDERS = {
  toyForge: buildToyForge,
  royalBarracks: buildRoyalBarracks,
  cannonBakery: buildCannonBakery,
  crownGate: buildCrownGate,
  manaTower: buildManaTower,
  cardHall: buildCardHall,
  boneGuildhall: buildBoneGuildhall,
  hideCanteen: buildHideCanteen,
  toyBlockKeep: buildToyBlockKeep,
  chestWorkshop: buildChestWorkshop,
  floatingDock: buildFloatingDock,
  ghostShrine: buildGhostShrine,
  runeBastion: buildRuneBastion,
  lavaBossForge: buildLavaBossForge,
  stormDrumTower: buildStormDrumTower,
  dragonHatchery: buildDragonHatchery,
  adventureLodge: buildAdventureLodge,
  canopyHut: buildCanopyHut,
  runeLockShrine: buildRuneLockShrine,
  sunleafWindmill: buildSunleafWindmill,
  zephyrSpire: buildZephyrSpire,
  lavaTideTemple: buildLavaTideTemple,
  obsidianBastion: buildObsidianBastionSettlement,
  riftGateCitadel: buildRiftGateCitadelSettlement,
  blackCrownKeep: buildBlackCrownKeepSettlement
};

export const BUILDING_TEST_VARIANTS = BUILDING_TEST_SPECS.map(toVariant);

export function settlementClanForTopic(topicId) {
  return SETTLEMENT_CLAN_BY_STYLE.get(TOPIC_SETTLEMENT_STYLE[topicId] ?? "kingdom") ?? SETTLEMENT_CLANS[0];
}

export function kingdomSettlementKitForTopic(topicId) {
  const kit = SELECTED_KINGDOM_KITS[topicId] ?? SELECTED_KINGDOM_KITS.frontend;
  return {
    castle: [...kit.castle],
    house: [...kit.house]
  };
}

export function buildSettlementStageImport(group, options = {}) {
  const previousRenderProfile = activeRenderProfile;
  activeRenderProfile = options.renderProfile ?? "gallery";
  try {
    const clan = options.clanStyle
      ? SETTLEMENT_CLAN_BY_STYLE.get(options.clanStyle) ?? settlementClanForTopic(options.topic)
      : settlementClanForTopic(options.topic);
    const type = options.type === "castle" ? "castle" : "house";
    const stage = Math.min(4, Math.max(1, Math.round(options.stage ?? 1)));
    const { pickId, spec } = settlementStageSpec(options.topic, clan, type, stage);
    const colors = PALETTES[spec.palette] ?? spec.colors ?? clan.colors;
    const mats = settlementMaterialSet(clan);
    const baseMats = createMaterialSet(spec, colors, `${options.id ?? clan.id}:${type}:${stage}`);
    const core = new THREE.Group();
    const rng = mulberry32(hashString(`kingdom-map:${options.id ?? clan.id}:${type}:${stage}:${spec.sourceId}`));
    const builder = SETTLEMENT_FORM_BUILDERS[spec.form] ?? buildRoyalBarracks;
    const coreHeight = (spec.height ?? 6) * 0.58;
    const coreWidth = (spec.footprint ?? 3.2) * 0.68;
    const metrics = settlementStageMetrics(type, stage, spec);

    addSettlementPlinth(group, mats, type, stage, metrics.w);
    builder({
      group: core,
      spec: { ...spec, colors, designer: spec.designer },
      mats: baseMats,
      h: coreHeight,
      w: coreWidth,
      colors,
      rng
    });
    if (isGameDesigner(spec.designer)) addGameModelPolish(core, { designer: spec.designer });
    core.scale.setScalar(settlementStageScale(type, stage, spec));
    core.rotation.y = settlementStageRotation(clan.style, type, stage);
    group.add(core);

    addSettlementProgressionDetails(group, mats, clan, type, stage, metrics);
    addSettlementStageMarkers(group, mats, type, stage, metrics.w, metrics.h);

    return {
      clan,
      type,
      stage,
      pickId,
      sourceId: spec.sourceId,
      radius: metrics.radius,
      visualHeight: settlementVisualHeight(type, stage, metrics.h),
      spec
    };
  } finally {
    activeRenderProfile = previousRenderProfile;
  }
}

export function buildBuildingTestImport(group, _baseMats, variant) {
  const spec = BUILDING_TEST_SPEC_BY_SOURCE_ID.get(variant.sourceId) || BUILDING_TEST_SPECS.find((item) => item.form === variant.importForm) || BUILDING_TEST_SPECS[0];
  const colors = variant.importColors ?? PALETTES[spec.palette] ?? PALETTES.adventureLodge;
  const h = (variant.importHeight ?? spec.height ?? 6) * 0.58;
  const w = (variant.importFootprint ?? spec.footprint ?? 3.2) * 0.68;
  const mats = createMaterialSet(spec, colors, variant.id);
  const rng = mulberry32(hashString(`imported:${variant.id}:${variant.importForm}`));
  const builder = FORM_BUILDERS[variant.importForm] ?? buildTwistTower;
  builder({ group, spec: { ...spec, colors, designer: spec.designer }, mats, h, w, colors, rng });
  if (isGameDesigner(spec.designer) && variant.importPolish === "outline") addGameModelPolish(group, { designer: spec.designer });
  addImportedSourceMarker(group, mats, w);
}

function toVariant(spec) {
  const colors = PALETTES[spec.palette] ?? PALETTES.adventureLodge;
  const category = SOURCE_CATEGORY_LABELS[spec.designer] ?? humanizeToken(spec.designer);
  const formLabel = humanizeToken(spec.form);
  const surfaceLabel = humanizeToken(spec.surface);
  const paletteLabel = humanizeToken(spec.palette);
  return {
    id: PRESERVED_IMPORT_IDS[spec.sourceId] ?? `building-test-${spec.sourceId}`,
    family: "Imported Test Lab",
    name: spec.name,
    archetype: "buildingTestImport",
    scale: scaleLabel(spec),
    summary: `Imported from iiizm/building-test as a ${category} procedural building using the ${formLabel} form.`,
    silhouette: `${formLabel}; source footprint ${spec.footprint.toFixed(1)}, source height ${spec.height.toFixed(1)}`,
    materials: `Source: iiizm/building-test; ${surfaceLabel} procedural surface with the ${paletteLabel} palette`,
    wall: colors[0] ?? "#d8c8a3",
    roof: colors[1] ?? colors[0] ?? "#8e4534",
    accent: colors[2] ?? colors[1] ?? "#376fae",
    trim: colors[3] ?? colors[2] ?? "#d99b37",
    source: "iiizm/building-test",
    sourceId: spec.sourceId,
    sourceCategory: spec.designer,
    sourceCategoryLabel: category,
    importForm: spec.form,
    importSurface: spec.surface,
    importPalette: spec.palette,
    importHeight: spec.height,
    importFootprint: spec.footprint,
    importColors: colors
  };
}

function scaleLabel(spec) {
  if (spec.height >= 11 || spec.footprint >= 3.6) return "Large";
  if (spec.height <= 6.2 && spec.footprint <= 3.25) return "Small";
  return "Medium";
}

function humanizeToken(value) {
  return String(value).replace(/-/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (char) => char.toUpperCase());
}

function groundSurfaceFor(spec) {
  if (spec.surface.includes("Street")) return "wetStreetTile";
  if (spec.designer === "bio") return "earthStrata";
  if (spec.designer === "industrial") return "wetConcrete";
  if (spec.designer === "heritage") return "sandstoneGlyph";
  if (spec.designer === "fantasy") return "inkWash";
  if (spec.designer === "game-adventure") return "mossConcrete";
  if (isGameDesigner(spec.designer)) return "arenaTile";
  return "subwayStoneSign";
}

function isGameDesigner(designer) {
  return String(designer).startsWith("game-");
}

function settlementStageSpec(topicId, clan, type, stage) {
  const pickId = SELECTED_KINGDOM_KITS[topicId]?.[type]?.[stage - 1] ?? clan.baseIds[0];
  const sourceId = SETTLEMENT_PICK_SOURCE_IDS[pickId] ?? pickId;
  const spec = SETTLEMENT_EXTRA_SPEC_BY_SOURCE_ID.get(sourceId) ?? BUILDING_TEST_SPEC_BY_SOURCE_ID.get(sourceId) ?? BUILDING_TEST_SPECS[0];
  return { pickId, spec };
}

function settlementStageScale(type, stage, spec) {
  const targetHeights = type === "castle" ? [2.0, 2.75, 3.55, 4.85] : [1.24, 1.62, 2.05, 2.62];
  return targetHeights[stage - 1] / Math.max(0.1, (spec.height ?? 6) * 0.58);
}

function settlementStageRotation(style, type, stage) {
  if (type === "house") return style === "hunter" ? -0.08 : stage % 2 ? 0.08 : -0.08;
  return style === "windroot" ? 0.1 : 0;
}

function settlementStageMetrics(type, stage, spec) {
  const castle = type === "castle";
  const w = (castle ? 1.9 : 1.26) + stage * (castle ? 0.48 : 0.28);
  const h = (castle ? 2.25 : 1.35) + stage * (castle ? 0.62 : 0.32);
  const radius = Math.max(w * (castle ? 0.96 : 0.82), (spec.footprint ?? 3.2) * settlementStageScale(type, stage, spec) * (castle ? 1.18 : 1.02));
  return { w, h, radius };
}

function settlementVisualHeight(type, stage, h) {
  if (type === "castle") return stage === 4 ? h * 2.3 : stage === 3 ? h * 1.55 : h * 1.28;
  return stage === 4 ? h * 1.2 : h * 1.08;
}

function settlementMaterialSet(clan) {
  const keys = settlementSurfaceKeys(clan.style);
  const colors = clan.colors;
  return {
    primary: surfaceMaterial(keys[0], colors, `${clan.id}:primary`),
    secondary: surfaceMaterial(keys[1], rotatePalette(colors, 1), `${clan.id}:secondary`),
    tertiary: surfaceMaterial(keys[2], rotatePalette(colors, 2), `${clan.id}:tertiary`),
    roof: surfaceMaterial(keys[1], colors, `${clan.id}:roof`),
    ground: solidMaterial(mixColor(colors[0], "#ffffff", 0.72), { roughness: 0.95 }),
    accent: solidMaterial(colors[2] || colors[1], { roughness: 0.38, metalness: 0.12, emissive: colors[2], emissiveIntensity: 0.05 }),
    glow: glowMaterial(colors[3] || colors[2]),
    dark: solidMaterial(colors[0], { roughness: 0.76, metalness: 0.04 }),
    metal: solidMaterial(mixColor(colors[2] || colors[1], "#ffffff", 0.18), { roughness: 0.28, metalness: 0.58 }),
    outline: solidMaterial(clan.style === "hunter" ? "#2d211a" : "#20232b", { roughness: 0.9 }),
    bone: surfaceMaterial("hunterBone", PALETTES.ribStorehouse, `${clan.id}:bone`),
    hide: surfaceMaterial("hunterHide", PALETTES.hideCanteen, `${clan.id}:hide`),
    wood: surfaceMaterial("paintedChestWood", PALETTES.chestWorkshop, `${clan.id}:wood`),
    glass: glassMaterial(colors)
  };
}

function settlementSurfaceKeys(style) {
  const keys = {
    kingdom: ["chunkyGameStone", "brightRoofTile", "paintedChestWood"],
    runecrown: ["royalRuneStone", "cardCeramic", "bannerCloth"],
    hunter: ["hunterHide", "hunterBone", "hunterFur"],
    lumina: ["toyPaint", "paintedChestWood", "glowingGem"],
    abyss: ["runeStone", "lavaToon", "iceFacet"],
    windroot: ["adventureRuneStone", "leafShingle", "adventurePlaster"]
  };
  return keys[style] ?? keys.kingdom;
}

function addSettlementPlinth(group, mats, type, stage, w) {
  const radius = type === "castle" ? w * 0.86 : w * 0.74;
  const base = addCylinder(group, mats.ground, radius, 0.18, 0, 0, 0, type === "castle" ? 8 : 7);
  base.scale.z = type === "castle" ? 0.78 : 0.72;
  addCylinder(group, mats.outline, radius * 1.05, 0.045, 0, 0.02, 0, type === "castle" ? 8 : 7).scale.z = base.scale.z;
  if (stage >= 2) addTorus(group, mats.accent, radius * 0.76, 0.025, 0, 0.18, 0).rotation.x = Math.PI / 2;
  if (stage >= 3) addTorus(group, mats.glow, radius * 0.52, 0.018, 0, 0.22, 0).rotation.x = Math.PI / 2;
}

function addSettlementProgressionDetails(group, mats, clan, type, stage, metrics) {
  const details = {
    kingdom: addKingdomProgressionDetails,
    runecrown: addRunecrownProgressionDetails,
    hunter: addHunterProgressionDetails,
    lumina: addLuminaProgressionDetails,
    abyss: addAbyssProgressionDetails,
    windroot: addWindrootProgressionDetails
  };
  (details[clan.style] ?? addKingdomProgressionDetails)(group, mats, type, stage, metrics);
}

function addKingdomProgressionDetails(group, mats, type, stage, { w, h }) {
  if (type === "castle") {
    if (stage >= 2) {
      addCrenellations(group, mats.accent, w * 1.7, h * 0.45, -w * 0.88, 9, w * 0.08);
      addFlag(group, mats.glow, mats.outline, -w * 0.72, h * 0.9, -w * 0.4, h * 0.34);
      addFlag(group, mats.glow, mats.outline, w * 0.6, h * 0.84, -w * 0.34, h * 0.28);
    }
    if (stage >= 3) {
      for (const x of [-0.8, 0.8]) {
        addCylinder(group, mats.primary, w * 0.18, h * 0.86, x * w, h * 0.18, w * 0.12, 14);
        addCone(group, mats.roof, w * 0.22, h * 0.24, x * w, h * 1.08, w * 0.12, 8);
        addGameCannon(group, mats, x * w * 0.8, h * 0.14, -w * 0.9, w * 0.34, -x * 0.12);
      }
      addShield(group, mats.accent, w * 0.36, h * 0.7, -w * 0.96);
    }
    if (stage === 4) {
      addBox(group, mats.primary, w * 0.72, h * 1.08, w * 0.54, 0, h * 0.62, w * 0.04);
      addStrategyGableRoof(group, mats.roof, mats.outline, w * 0.82, h * 0.78, 0, h * 1.42, w * 0.04, 0.58);
      addCrown(group, mats.accent, 0, h * 1.96, -w * 0.04, w * 0.58);
      addFlag(group, mats.glow, mats.outline, 0, h * 2.2, -w * 0.08, h * 0.5);
      addBox(group, mats.outline, w * 2.4, h * 0.12, w * 0.14, 0, h * 0.22, -w * 1.1);
      for (const x of [-0.98, -0.32, 0.32, 0.98]) addShield(group, mats.accent, w * 0.24, h * 0.34, -w * 1.18, x * w);
    }
    return;
  }

  addSettlementDoor(group, mats, w, h, -w * 0.62);
  if (stage >= 2) {
    addHammer(group, mats.wood, mats.metal, -w * 0.42, h * 0.72, -w * 0.64, w * 0.34);
    addSupplyCrate(group, mats, w * 0.56, h * 0.1, -w * 0.54, w * 0.26);
  }
  if (stage >= 3) {
    addCylinder(group, mats.dark, w * 0.1, h * 0.7, -w * 0.66, h * 0.62, w * 0.18, 10);
    addSphere(group, mats.glow, w * 0.12, -w * 0.66, h * 1.35, w * 0.18);
    addShield(group, mats.accent, w * 0.22, h * 0.72, -w * 0.67);
  }
  if (stage === 4) {
    addGameCannon(group, mats, w * 0.62, h * 0.14, -w * 0.84, w * 0.42, -0.16);
    addHammer(group, mats.wood, mats.accent, 0, h * 1.06, -w * 0.74, w * 0.5);
    addFlag(group, mats.glow, mats.outline, -w * 0.76, h * 1.1, -w * 0.12, h * 0.28);
    addFlag(group, mats.glow, mats.outline, w * 0.76, h * 1.0, -w * 0.08, h * 0.24);
  }
}

function addRunecrownProgressionDetails(group, mats, type, stage, { w, h }) {
  if (type === "castle") {
    addTorus(group, mats.accent, w * (0.55 + stage * 0.08), 0.026, 0, 0.28, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < stage + 1; i += 1) {
      const x = -w * 0.55 + i * (w * 1.1 / stage);
      addOctahedron(group, mats.glow, w * 0.08, x, h * 0.56 + (i % 2) * h * 0.1, -w * 0.74);
    }
    if (stage >= 2) {
      for (const x of [-0.68, 0.68]) {
        addBox(group, mats.tertiary, w * 0.22, h * 0.68, w * 0.1, x * w, h * 0.4, -w * 0.78);
        addFlag(group, x < 0 ? mats.secondary : mats.accent, mats.outline, x * w, h * 0.94, -w * 0.62, h * 0.28);
      }
    }
    if (stage >= 3) {
      addBox(group, mats.tertiary, w * 0.86, h * 0.9, w * 0.1, 0, h * 0.62, -w * 0.86);
      addCrown(group, mats.accent, 0, h * 1.2, -w * 0.9, w * 0.5);
    }
    if (stage === 4) {
      for (const x of [-0.58, 0, 0.58]) {
        addCylinder(group, mats.primary, w * 0.14, h * 1.12, x * w, h * 0.76, w * 0.2, 9);
        addOctahedron(group, mats.glow, w * 0.14, x * w, h * 1.95, w * 0.2);
      }
      addTorus(group, mats.glow, w * 1.08, 0.035, 0, h * 1.1, -w * 0.9);
      addCrown(group, mats.accent, 0, h * 2.05, -w * 0.16, w * 0.72);
      for (let i = 0; i < 10; i += 1) {
        const x = -w * 1.05 + i * (w * 2.1 / 9);
        addFlag(group, i % 2 ? mats.secondary : mats.accent, mats.outline, x, h * 0.58, w * 0.78, h * 0.24);
      }
    }
    return;
  }

  addBox(group, mats.tertiary, w * (0.44 + stage * 0.1), h * (0.34 + stage * 0.08), 0.08, 0, h * 0.4, -w * 0.58);
  addTorus(group, mats.glow, w * (0.2 + stage * 0.03), 0.018, 0, h * 0.56, -w * 0.65);
  if (stage >= 2) addFlag(group, mats.secondary, mats.outline, -w * 0.44, h * 0.76, -w * 0.16, h * 0.22);
  if (stage >= 3) {
    addOctahedron(group, mats.glow, w * 0.1, -w * 0.4, h * 0.64, -w * 0.48);
    addOctahedron(group, mats.glow, w * 0.1, w * 0.4, h * 0.64, -w * 0.48);
  }
  if (stage === 4) {
    addCrown(group, mats.accent, 0, h * 1.04, -w * 0.12, w * 0.34);
    for (const x of [-0.66, -0.22, 0.22, 0.66]) addOctahedron(group, mats.glow, w * 0.075, x * w, h * 0.82, -w * 0.54);
    addFlag(group, mats.accent, mats.outline, w * 0.48, h * 0.88, -w * 0.14, h * 0.2);
  }
}

function addHunterProgressionDetails(group, mats, type, stage, { w, h }) {
  if (type === "castle") {
    addHunterBoneArch(group, mats.bone, 0, h * 0.16, -w * 0.86, w * (0.8 + stage * 0.18), h * (0.46 + stage * 0.12), w * 0.026);
    if (stage >= 2) {
      addPalisadeRing(group, mats.wood, w * 0.94, h * 0.24, 0.18, 12 + stage * 3);
      addHangingTrophy(group, mats.bone, 0, h * 0.76, -w * 0.9, w * 0.38);
    }
    if (stage >= 3) {
      addRibCage(group, mats.bone, 0, h * 0.18, w * 0.04, w * 1.35, h * 0.76, w * 0.78, 6);
      addCookPot(group, mats.dark, mats.glow, -w * 0.78, 0.18, -w * 0.64, w * 0.42);
    }
    if (stage === 4) {
      addRibCage(group, mats.bone, 0, h * 0.28, -w * 0.12, w * 1.9, h * 1.14, w * 1.1, 8);
      for (const x of [-0.74, 0.74]) {
        addHunterBoneArch(group, mats.bone, x * w, h * 0.2, -w * 0.82, w * 0.72, h * 1.08, w * 0.038);
        addFlag(group, mats.accent, mats.wood, x * w, h * 1.44, -w * 0.28, h * 0.32);
      }
      addHangingTrophy(group, mats.bone, 0, h * 1.18, -w * 0.96, w * 0.58);
    }
    return;
  }

  addHideCanopy(group, mats.hide, mats.wood, 0, h * 0.56, 0, w * (0.74 + stage * 0.08), w * 0.58, h * 0.35);
  addCookPot(group, mats.dark, mats.glow, -w * 0.48, 0.16, -w * 0.5, w * (0.26 + stage * 0.04));
  if (stage >= 2) addHangingMeat(group, mats.accent, mats.bone, w * 0.44, h * 0.42, -w * 0.5, w * 0.32);
  if (stage >= 3) {
    addHangingTrophy(group, mats.bone, 0, h * 0.58, -w * 0.64, w * 0.32);
    addBoneSpikeFence(group, mats.bone, -w * 0.7, 0.16, -w * 0.74, w * 1.4, 8, h * 0.22);
  }
  if (stage === 4) {
    addRibCage(group, mats.bone, 0, h * 0.18, 0, w * 1.15, h * 0.62, w * 0.68, 5);
    addCookPot(group, mats.dark, mats.glow, w * 0.5, 0.16, -w * 0.5, w * 0.36);
    addFlag(group, mats.accent, mats.wood, -w * 0.66, h * 0.92, -w * 0.16, h * 0.22);
  }
}

function addLuminaProgressionDetails(group, mats, type, stage, { w, h }) {
  if (type === "castle") {
    addToyStuds(group, mats.accent, w * (0.7 + stage * 0.14), w * 0.48, 0, h * 0.62, -w * 0.22, 2 + stage, 2, w * 0.035);
    if (stage >= 2) {
      addSupplyCrate(group, mats, -w * 0.68, h * 0.08, -w * 0.72, w * 0.28);
      addSupplyCrate(group, mats, w * 0.68, h * 0.08, -w * 0.72, w * 0.28);
      addStarBadge(group, mats.glow, mats.outline, 0, h * 0.7, -w * 0.86, w * 0.36);
    }
    if (stage >= 3) {
      addTube(group, mats.glow, [
        new THREE.Vector3(-w * 0.54, h * 0.72, -w * 0.2),
        new THREE.Vector3(0, h * 1.0, -w * 0.48),
        new THREE.Vector3(w * 0.54, h * 0.72, -w * 0.2)
      ], w * 0.028);
      addCrystalCluster(group, mats.glow, 0, h * 0.88, -w * 0.2, w * 0.42);
    }
    if (stage === 4) {
      for (const x of [-0.84, 0.84]) {
        for (const z of [-0.52, 0.52]) {
          addCylinder(group, mats.primary, w * 0.16, h * 0.86, x * w, h * 0.32, z * w, 18);
          addToyStuds(group, mats.accent, w * 0.24, w * 0.24, x * w, h * 1.18, z * w, 2, 2, w * 0.035);
        }
      }
      addOctahedron(group, mats.glow, w * 0.28, 0, h * 1.44, 0);
      for (let i = 0; i < 4; i += 1) {
        const blade = addBox(group, mats.glow, w * 0.08, h * 0.58, 0.045, 0, h * 1.2, -w * 0.78);
        blade.rotation.z = (Math.PI * i) / 4;
      }
    }
    return;
  }

  addToyStuds(group, mats.accent, w * 0.72, w * 0.44, 0, h * 0.62, 0, 2 + stage, 2, w * 0.03);
  if (stage >= 2) addSupplyCrate(group, mats, -w * 0.52, h * 0.08, -w * 0.56, w * 0.24);
  if (stage >= 3) {
    addStarBadge(group, mats.glow, mats.outline, w * 0.42, h * 0.72, -w * 0.54, w * 0.28);
    addTube(group, mats.glow, [
      new THREE.Vector3(-w * 0.42, h * 0.5, -w * 0.12),
      new THREE.Vector3(0, h * 0.78, -w * 0.44),
      new THREE.Vector3(w * 0.42, h * 0.54, -w * 0.12)
    ], w * 0.024);
  }
  if (stage === 4) {
    addCrystalCluster(group, mats.glow, 0, h * 0.92, -w * 0.34, w * 0.36);
    addBox(group, mats.metal, w * 0.82, h * 0.05, w * 0.06, 0, h * 0.98, -w * 0.54);
    addFlag(group, mats.secondary, mats.outline, -w * 0.58, h * 0.88, -w * 0.16, h * 0.2);
  }
}

function addAbyssProgressionDetails(group, mats, type, stage, { w, h }) {
  if (type === "castle") {
    addTorus(group, mats.glow, w * (0.36 + stage * 0.07), 0.026, 0, h * 0.58, -w * 0.82);
    for (let i = 0; i < 2 + stage; i += 1) {
      const x = -w * 0.62 + i * (w * 1.24 / (stage + 1));
      const crack = addBox(group, i % 2 ? mats.accent : mats.glow, w * 0.22, h * 0.035, w * 0.92, x, h * 0.13, -w * 0.14);
      crack.rotation.y = -0.42 + i * 0.22;
    }
    if (stage >= 2) {
      for (const x of [-0.72, 0.72]) {
        addCylinder(group, mats.dark, w * 0.13, h * (0.72 + stage * 0.12), x * w, h * 0.28, w * 0.06, 8);
        addCone(group, mats.accent, w * 0.14, h * 0.28, x * w, h * (1.02 + stage * 0.13), w * 0.06, 4);
      }
    }
    if (stage >= 3) addOctahedron(group, mats.glow, w * 0.2, 0, h * 1.14, -w * 0.2);
    if (stage === 4) {
      addTorus(group, mats.glow, w * 0.9, 0.04, 0, h * 1.0, -w * 0.88);
      addCylinder(group, mats.dark, w * 0.2, h * 1.34, 0, h * 0.62, w * 0.2, 8);
      addOctahedron(group, mats.glow, w * 0.28, 0, h * 1.92, w * 0.2);
      addBox(group, mats.metal, w * 1.7, h * 0.08, w * 0.28, 0, h * 0.24, -w * 1.08);
      addCrystalCluster(group, mats.glow, -w * 0.85, h * 0.18, -w * 0.82, w * 0.46);
      addCrystalCluster(group, mats.glow, w * 0.85, h * 0.18, -w * 0.82, w * 0.46);
    }
    return;
  }

  addRuneTablet(group, mats.dark, mats.glow, 0, h * 0.44, -w * 0.54, w * (0.34 + stage * 0.04));
  if (stage >= 2) addBox(group, mats.glow, w * 0.5, h * 0.04, w * 0.74, -w * 0.24, h * 0.16, -w * 0.12).rotation.y = -0.28;
  if (stage >= 3) {
    addCrystalCluster(group, mats.glow, w * 0.46, h * 0.18, -w * 0.42, w * 0.32);
    addTorus(group, mats.glow, w * 0.28, 0.018, 0, h * 0.72, -w * 0.08);
  }
  if (stage === 4) {
    addTorus(group, mats.glow, w * 0.42, 0.024, 0, h * 0.9, -w * 0.58);
    addCylinder(group, mats.dark, w * 0.12, h * 0.78, -w * 0.46, h * 0.32, w * 0.1, 8);
    addCylinder(group, mats.dark, w * 0.12, h * 0.78, w * 0.46, h * 0.32, w * 0.1, 8);
    addOctahedron(group, mats.glow, w * 0.16, 0, h * 1.16, 0);
  }
}

function addWindrootProgressionDetails(group, mats, type, stage, { w, h }) {
  if (type === "castle") {
    if (stage >= 2) {
      addLeafRoofLayers(group, mats.roof, mats.outline, w, h, -w * 0.46, w * 0.12, w * 0.28, 1 + stage);
      addLeafRoofLayers(group, mats.roof, mats.outline, w, h, w * 0.46, w * 0.12, w * 0.28, 1 + stage);
      addAdventureLantern(group, mats.glow, mats.wood, -w * 0.8, h * 0.22, -w * 0.74, w * 0.34);
    }
    if (stage >= 3) {
      addBrokenKeystoneRing(group, mats.primary, mats.glow, 0, h * 0.92, -w * 0.72, w * 0.56, w * 0.24);
      addWindVane(group, mats.metal, mats.glow, 0, h * 1.32, 0, w * 0.44);
      addCrystalCluster(group, mats.glow, w * 0.72, h * 0.2, -w * 0.68, w * 0.36);
    }
    if (stage === 4) {
      for (const x of [-0.78, -0.28, 0.28, 0.78]) {
        addCylinder(group, mats.wood, w * 0.12, h * 0.9, x * w, h * 0.22, w * 0.34, 9);
        addLeafRoofLayers(group, mats.roof, mats.outline, w, h, x * w, w * 0.34, w * 0.22, 3);
      }
      addBrokenKeystoneRing(group, mats.primary, mats.glow, 0, h * 1.32, -w * 0.72, w * 0.82, w * 0.28);
      addBrokenKeystoneRing(group, mats.primary, mats.glow, 0, h * 1.56, -w * 0.72, w * 1.08, w * 0.2);
      addOctahedron(group, mats.glow, w * 0.24, 0, h * 1.8, -w * 0.24);
    }
    return;
  }

  if (stage >= 2) {
    addAdventureLantern(group, mats.glow, mats.wood, -w * 0.48, h * 0.22, -w * 0.42, w * 0.32);
    addSignpost(group, mats.wood, mats.outline, w * 0.48, h * 0.18, -w * 0.38, w * 0.32);
  }
  if (stage >= 3) {
    addBrokenKeystoneRing(group, mats.primary, mats.glow, w * 0.36, h * 0.64, -w * 0.28, w * 0.26, w * 0.14);
    addCrystalCluster(group, mats.glow, -w * 0.42, h * 0.18, -w * 0.34, w * 0.28);
  }
  if (stage === 4) {
    addLeafRoofLayers(group, mats.roof, mats.outline, w, h, 0, 0, w * 0.48, 3);
    addWindVane(group, mats.metal, mats.glow, 0, h * 1.0, 0, w * 0.34);
    addBrokenKeystoneRing(group, mats.primary, mats.glow, 0, h * 0.82, -w * 0.48, w * 0.36, w * 0.16);
    addAdventureLantern(group, mats.glow, mats.wood, w * 0.54, h * 0.26, -w * 0.34, w * 0.3);
  }
}

function addSettlementDoor(group, mats, w, h, z) {
  addBox(group, mats.outline, w * 0.28, h * 0.34, 0.065, 0, h * 0.18, z);
  addBox(group, mats.dark, w * 0.2, h * 0.28, 0.075, 0, h * 0.2, z - 0.03);
}

function addSettlementStageMarkers(group, mats, type, stage, w, h) {
  const y = type === "castle" ? h * 0.12 : h * 0.14;
  for (let i = 0; i < 4; i += 1) {
    const mat = i < stage ? mats.glow : mats.outline;
    const marker = addCylinder(group, mat, w * 0.03, 0.018, (i - 1.5) * w * 0.12, y, -w * (type === "castle" ? 0.74 : 0.56), 10);
    marker.rotation.x = Math.PI / 2;
  }
}


function createMaterialSet(spec, colors, id) {
  const rotated = rotatePalette(colors, Math.max(1, hashString(id) % Math.max(1, colors.length)));
  return {
    primary: surfaceMaterial(spec.surface, colors, "primary"),
    secondary: surfaceMaterial(spec.surface, rotated, "secondary"),
    tertiary: surfaceMaterial(spec.surface, rotatePalette(colors, 2), "tertiary"),
    glass: glassMaterial(colors),
    glow: glowMaterial(colors[4] || colors[2] || colors[1] || colors[0]),
    accent: solidMaterial(colors[2] || colors[1] || colors[0], { roughness: 0.38, metalness: 0.18 }),
    dark: solidMaterial(colors[0] || "#281c16", { roughness: 0.78, metalness: 0.08 }),
    metal: solidMaterial(colors[1] || "#9a9486", { roughness: 0.32, metalness: 0.62 }),
    outline: solidMaterial("#281c16", { roughness: 0.9, metalness: 0 }),
    bone: surfaceMaterial("hunterBone", PALETTES.ribStorehouse || colors, "bone"),
    hide: surfaceMaterial("hunterHide", PALETTES.hideCanteen || colors, "hide"),
    scale: surfaceMaterial("scalePlate", PALETTES.scaleNest || colors, "scale"),
    wood: surfaceMaterial("paintedChestWood", PALETTES.chestWorkshop || colors, "wood"),
    ground: surfaceMaterial(groundSurfaceFor(spec), colors, "ground"),
    reflective: solidMaterial(colors[1] || colors[2] || colors[0], { roughness: 0.08, metalness: 0, transparent: true, opacity: 0.48 })
  };
}

function solidMaterial(color, options = {}) {
  const key = `solid:${color}:${JSON.stringify(options)}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.62,
    metalness: options.metalness ?? 0.08,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ? new THREE.Color(options.emissive) : new THREE.Color(options.emissiveIntensity ? color : "#000000"),
    emissiveIntensity: options.emissiveIntensity ?? 0,
    side: options.side ?? THREE.FrontSide
  });
  materialCache.set(key, material);
  return material;
}

function surfaceMaterial(pattern, colors, role) {
  const key = `surface:${pattern}:${role}:${colors.join("|")}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const texture = makeTexture(pattern, colors, key);
  const isGlassLike = /glass|lens|hologram|water|liquid|stained|slime|aerogel|membrane/i.test(pattern);
  const isMetalLike = /chrome|mercury|bronze|pipe|metal|galvanized|hazard|tank/i.test(pattern);
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: texture,
    roughness: isGlassLike ? 0.34 : isMetalLike ? 0.42 : 0.84,
    metalness: isMetalLike ? 0.42 : 0.03,
    transparent: isGlassLike,
    opacity: isGlassLike ? 0.68 : 1,
    emissive: /glow|rune|lava|oled|hologram|cosmic|storm|slime/i.test(pattern) ? new THREE.Color(colors[2] || colors[1] || colors[0]) : new THREE.Color("#000000"),
    emissiveIntensity: /glow|rune|lava|oled|hologram|cosmic|storm|slime/i.test(pattern) ? 0.18 : 0,
    side: THREE.DoubleSide
  });
  materialCache.set(key, material);
  return material;
}

function glassMaterial(colors) {
  const key = `glass:${colors.join("|")}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const material = new THREE.MeshPhysicalMaterial({
    color: colors[4] || colors[1] || "#ffffff",
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: 0.42,
    transmission: 0.12,
    thickness: 0.14,
    clearcoat: 0.8,
    side: THREE.DoubleSide
  });
  materialCache.set(key, material);
  return material;
}

function glowMaterial(color) {
  return solidMaterial(color, { emissive: color, emissiveIntensity: 0.56, roughness: 0.32, metalness: 0.04 });
}

function makeTexture(pattern, colors, key) {
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const rng = mulberry32(hashString(key));
  const base = colors[0] || "#bca47a";
  const second = colors[1] || base;
  const accent = colors[2] || second;
  const dark = colors[3] || base;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 280; i += 1) {
    ctx.globalAlpha = 0.08 + rng() * 0.13;
    ctx.fillStyle = [base, second, accent, dark][Math.floor(rng() * 4)];
    ctx.fillRect(Math.floor(rng() * 128), Math.floor(rng() * 128), 1 + Math.floor(rng() * 3), 1 + Math.floor(rng() * 3));
  }
  ctx.globalAlpha = 1;
  const lower = pattern.toLowerCase();
  if (/brick|tile|stone|marble|ceramic|court|arena|glyph|rune|basalt|concrete|chunky/.test(lower)) {
    drawStoneGrid(ctx, colors, rng);
  } else if (/wood|reed|weave|hide|fur|straw|root|fang|chest/.test(lower)) {
    drawGrain(ctx, colors, rng);
  } else if (/metal|chrome|pipe|bronze|rust|hazard|scrap|tank|tar/.test(lower)) {
    drawMetalWear(ctx, colors, rng);
  } else if (/glass|water|lens|hologram|oled|slime|aerogel|membrane/.test(lower)) {
    drawGlassSheen(ctx, colors, rng);
  } else {
    drawSoftMottle(ctx, colors, rng);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(/brick|tile|stone|wood|hide|straw/.test(lower) ? 2 : 1, /earth|strata/.test(lower) ? 1.4 : 1);
  texture.anisotropy = 2;
  textureCache.set(key, texture);
  return texture;
}

function drawStoneGrid(ctx, colors, rng) {
  ctx.strokeStyle = withAlpha(colors[3] || "#35281e", 0.28);
  ctx.lineWidth = 1;
  for (let y = 15; y < 128; y += 18 + Math.floor(rng() * 6)) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y + rng() * 4 - 2);
    ctx.stroke();
  }
  for (let x = 10; x < 128; x += 22 + Math.floor(rng() * 8)) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + rng() * 5 - 2.5, 128);
    ctx.stroke();
  }
  for (let i = 0; i < 18; i += 1) drawScratch(ctx, colors[2] || colors[1], rng, 0.2);
}

function drawGrain(ctx, colors, rng) {
  for (let y = 6; y < 128; y += 9) {
    ctx.strokeStyle = withAlpha(y % 18 ? colors[1] : colors[3], 0.26);
    ctx.lineWidth = 1 + rng() * 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y + rng() * 4);
    ctx.bezierCurveTo(34, y - 5 + rng() * 8, 72, y + 5 - rng() * 8, 128, y + rng() * 4);
    ctx.stroke();
  }
}

function drawMetalWear(ctx, colors, rng) {
  const gradient = ctx.createLinearGradient(0, 0, 128, 0);
  gradient.addColorStop(0, colors[0] || "#555555");
  gradient.addColorStop(0.52, colors[1] || "#aaaaaa");
  gradient.addColorStop(1, colors[3] || "#333333");
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 38; i += 1) drawScratch(ctx, i % 3 ? "#ffffff" : colors[2], rng, 0.18);
}

function drawGlassSheen(ctx, colors, rng) {
  const gradient = ctx.createLinearGradient(0, 0, 128, 128);
  gradient.addColorStop(0, colors[4] || colors[1] || "#ffffff");
  gradient.addColorStop(0.55, colors[1] || colors[2] || "#88ddee");
  gradient.addColorStop(1, colors[0] || "#223344");
  ctx.globalAlpha = 0.58;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 14; i += 1) drawScratch(ctx, colors[4] || "#ffffff", rng, 0.34);
}

function drawSoftMottle(ctx, colors, rng) {
  for (let i = 0; i < 34; i += 1) {
    ctx.globalAlpha = 0.1 + rng() * 0.16;
    ctx.fillStyle = colors[1 + Math.floor(rng() * Math.min(3, colors.length - 1))] || colors[0];
    ctx.beginPath();
    ctx.ellipse(rng() * 128, rng() * 128, 4 + rng() * 14, 2 + rng() * 8, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawScratch(ctx, color, rng, alpha) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color || "#ffffff";
  ctx.lineWidth = 0.8 + rng() * 1.8;
  const x = rng() * 128;
  const y = rng() * 128;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + rng() * 48 - 24, y + rng() * 48 - 24);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function withAlpha(color, alpha) {
  const value = new THREE.Color(color || "#ffffff");
  return `rgba(${Math.round(value.r * 255)}, ${Math.round(value.g * 255)}, ${Math.round(value.b * 255)}, ${alpha})`;
}


function buildTwistTower({ group, mats, h, w, rng }) {
  for (let i = 0; i < 9; i += 1) {
    const t = i / 8;
    const mesh = addBox(group, i % 2 ? mats.secondary : mats.primary, w * (1 - t * 0.28), h / 9 * 0.88, w * 0.72, 0, 0.32 + i * h / 9, 0);
    mesh.rotation.y = i * 0.16 + rng() * 0.06;
    addFacadeStrips(group, mats.glow, w * 0.82, 0.04, 0.02, 0, 0.56 + i * h / 9, -w * 0.38, 4);
  }
  addCone(group, mats.glow, w * 0.25, h * 0.12, 0, h + 0.3, 0, 5);
}

function buildNeedle({ group, mats, h, w }) {
  addCylinder(group, mats.primary, w * 0.34, h * 0.8, 0, 0.28, 0, 18);
  addCylinder(group, mats.secondary, w * 0.2, h * 0.35, 0, h * 0.68, 0, 18);
  addCone(group, mats.glow, w * 0.24, h * 0.22, 0, h * 1.02, 0, 18);
  for (let i = 0; i < 7; i += 1) {
    const fin = addBox(group, mats.accent, 0.04, h * 0.55, w * 0.16, 0, h * 0.22, 0);
    fin.rotation.y = (Math.PI * 2 * i) / 7;
    fin.position.x = Math.sin(fin.rotation.y) * w * 0.43;
    fin.position.z = Math.cos(fin.rotation.y) * w * 0.43;
  }
}

function buildCathedral({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.15, h * 0.55, w * 1.0, 0, 0.28, 0);
  addBox(group, mats.secondary, w * 0.62, h * 0.86, w * 0.62, 0, 0.28, 0);
  for (const x of [-0.62, 0.62]) {
    addCylinder(group, mats.glass, w * 0.13, h * 0.72, x * w, 0.28, -w * 0.52, 12);
    addCone(group, mats.glow, w * 0.16, h * 0.18, x * w, h * 0.86, -w * 0.52, 10);
  }
  addWindowGrid(group, mats.glow, w * 0.72, h * 0.38, 0, h * 0.28, -w * 0.53, 4, 4);
}

function buildExoskeleton({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 0.8, h * 0.86, w * 0.7, 0, 0.28, 0);
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      addCylinder(group, mats.metal, 0.045, h * 1.0, x * w * 0.52, 0.28, z * w * 0.48, 6);
    }
  }
  for (let y = 1.2; y < h; y += 1.15) {
    const a = addBox(group, mats.accent, w * 1.25, 0.045, 0.045, 0, y, -w * 0.48);
    a.rotation.z = y % 2 ? 0.18 : -0.18;
    addBox(group, mats.accent, 0.045, 0.045, w * 1.16, -w * 0.52, y + 0.12, 0);
  }
}

function buildStackedScreens({ group, mats, h, w, rng }) {
  for (let i = 0; i < 7; i += 1) {
    const x = (rng() - 0.5) * w * 0.5;
    const z = (rng() - 0.5) * w * 0.4;
    addBox(group, i % 2 ? mats.primary : mats.secondary, w * (1.15 - i * 0.05), h / 7 * 0.8, w * 0.6, x, 0.3 + i * h / 7, z);
    addBox(group, mats.glow, w * 1.05, 0.04, 0.04, x, 0.72 + i * h / 7, z - w * 0.34);
  }
}

function buildFloatingDock({ group, mats, h, w }) {
  addCylinder(group, mats.secondary, w * 0.38, h * 0.58, 0, 0.28, 0, 16);
  addBox(group, mats.primary, w * 2.2, h * 0.16, w * 1.15, 0, h * 0.6, 0);
  addCylinder(group, mats.glass, w * 0.72, h * 0.07, 0, h * 0.82, 0, 32);
  addTorus(group, mats.glow, w * 0.84, 0.045, 0, h * 0.88, 0).rotation.x = Math.PI / 2;
  for (const x of [-0.8, 0.8]) addCylinder(group, mats.metal, 0.045, h * 0.52, x * w, 0.28, 0, 8);
}

function buildBlobPods({ group, mats, h, w, rng }) {
  addCylinder(group, mats.metal, w * 0.16, h * 0.55, 0, 0.28, 0, 12);
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    const r = w * (0.38 + rng() * 0.68);
    addSphere(group, i % 2 ? mats.primary : mats.secondary, w * (0.26 + rng() * 0.12), Math.sin(angle) * r, h * (0.22 + rng() * 0.48), Math.cos(angle) * r);
    addTube(group, mats.glow, [
      new THREE.Vector3(0, h * 0.35, 0),
      new THREE.Vector3(Math.sin(angle) * r * 0.55, h * 0.48, Math.cos(angle) * r * 0.55),
      new THREE.Vector3(Math.sin(angle) * r, h * 0.45, Math.cos(angle) * r)
    ], 0.025);
  }
}

function buildLensCluster({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.35, h * 0.42, w * 0.9, 0, 0.28, 0);
  for (let x = -2; x <= 2; x += 1) {
    for (let y = 0; y < 4; y += 1) {
      addCylinder(group, mats.glass, w * 0.13, 0.035, x * w * 0.25, 1.0 + y * h * 0.11, -w * 0.48, 24).rotation.x = Math.PI / 2;
    }
  }
  addSphere(group, mats.glow, w * 0.35, 0, h * 0.72, 0);
}

function buildMonolith({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 0.95, h, w * 0.66, 0, 0.28, 0);
  for (let i = 0; i < 8; i += 1) addBox(group, mats.glow, w * 0.78, 0.035, 0.035, 0, 1 + i * h * 0.1, -w * 0.36);
  addBox(group, mats.secondary, w * 0.32, h * 0.78, 0.04, w * 0.5, h * 0.12, 0);
}

function buildRingGate({ group, mats, h, w }) {
  addCylinder(group, mats.primary, w * 0.22, h * 0.82, -w * 0.62, 0.28, 0, 12);
  addCylinder(group, mats.primary, w * 0.22, h * 0.82, w * 0.62, 0.28, 0, 12);
  addTorus(group, mats.glow, w * 0.78, 0.055, 0, h * 0.5, 0).rotation.y = Math.PI / 2;
  addBox(group, mats.secondary, w * 1.45, h * 0.1, w * 0.26, 0, h * 0.76, 0);
}

function buildTerraceCliff({ group, mats, h, w }) {
  for (let i = 0; i < 6; i += 1) {
    addBox(group, mats.primary, w * (1.7 - i * 0.15), h / 6 * 0.82, w * (1.15 - i * 0.08), 0, 0.28 + i * h / 6, i * w * 0.08);
    addPlant(group, w * 0.48 - i * 0.12, 0.58 + (i + 1) * h / 6, -w * 0.4, group.userData.colors || ["#366", "#4a5", "#cca"], 0.42);
  }
}

function buildWoodCabin({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.45, h * 0.42, w * 1.0, 0, 0.28, 0);
  const roof = addCone(group, mats.secondary, w * 1.05, h * 0.18, 0, h * 0.45, 0, 4);
  roof.rotation.y = Math.PI / 4;
  addCylinder(group, mats.glow, w * 0.08, h * 0.38, w * 0.48, h * 0.46, w * 0.28, 10);
  addWindowGrid(group, mats.glow, w * 0.9, h * 0.18, 0, h * 0.24, -w * 0.52, 3, 1);
}

function buildGreenhouse({ group, mats, h, w }) {
  addBox(group, mats.secondary, w * 1.4, h * 0.35, w * 0.95, 0, 0.28, 0);
  const dome = addSphere(group, mats.glass, w * 0.86, 0, h * 0.52, 0);
  dome.scale.y = 0.42;
  addTorus(group, mats.primary, w * 0.86, 0.04, 0, h * 0.36, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i += 1) addPlant(group, -w * 0.55 + i * w * 0.16, h * 0.37, -w * 0.1 + (i % 2) * w * 0.24, ["#285", "#7b5", "#ded"], 0.34);
}

function buildRipplePavilion({ group, mats, h, w }) {
  for (let i = 0; i < 5; i += 1) {
    const roof = addBox(group, i % 2 ? mats.glass : mats.primary, w * 1.6, 0.05, w * 0.52, 0, h * (0.28 + i * 0.08), -w * 0.48 + i * w * 0.24);
    roof.rotation.z = Math.sin(i) * 0.12;
  }
  for (let i = 0; i < 8; i += 1) addCylinder(group, mats.secondary, 0.045, h * 0.42, -w * 0.72 + i * w * 0.2, 0.28, -w * 0.5 + (i % 2) * w, 8);
}

function buildBathDome({ group, mats, h, w }) {
  addCylinder(group, mats.primary, w * 0.78, h * 0.34, 0, 0.28, 0, 28);
  const cap = addSphere(group, mats.secondary, w * 0.78, 0, h * 0.5, 0);
  cap.scale.y = 0.42;
  addCylinder(group, mats.glow, w * 0.18, h * 0.16, -w * 0.35, h * 0.58, w * 0.18, 20);
  addTorus(group, mats.reflective, w * 0.95, 0.035, 0, 0.3, 0).rotation.x = Math.PI / 2;
}

function buildWovenMarket({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.8, h * 0.25, w * 0.8, 0, 0.28, 0);
  for (let i = 0; i < 5; i += 1) {
    const awning = addBox(group, i % 2 ? mats.secondary : mats.accent, w * 0.42, 0.07, w * 1.05, -w * 0.78 + i * w * 0.39, h * 0.38, -w * 0.1);
    awning.rotation.z = i % 2 ? -0.12 : 0.12;
  }
  for (let i = 0; i < 6; i += 1) addCylinder(group, mats.dark, 0.035, h * 0.38, -w * 0.8 + i * w * 0.32, 0.28, -w * 0.48, 7);
}

function buildStiltVillage({ group, mats, h, w }) {
  for (let i = 0; i < 4; i += 1) {
    const x = -w * 0.6 + (i % 2) * w * 1.2;
    const z = -w * 0.35 + Math.floor(i / 2) * w * 0.7;
    addBox(group, mats.primary, w * 0.55, h * 0.22, w * 0.48, x, h * 0.32, z);
    for (const dx of [-0.2, 0.2]) for (const dz of [-0.18, 0.18]) addCylinder(group, mats.secondary, 0.035, h * 0.42, x + dx * w, 0.22, z + dz * w, 7);
  }
  addTube(group, mats.dark, [new THREE.Vector3(-w, h * 0.36, 0), new THREE.Vector3(0, h * 0.55, 0.25), new THREE.Vector3(w, h * 0.36, 0)], 0.045);
}

function buildCoralLab({ group, mats, h, w, rng }) {
  addBox(group, mats.primary, w * 1.2, h * 0.32, w * 0.82, 0, 0.28, 0);
  for (let i = 0; i < 10; i += 1) {
    const angle = rng() * Math.PI * 2;
    addCylinder(group, i % 2 ? mats.secondary : mats.primary, w * (0.08 + rng() * 0.08), h * (0.22 + rng() * 0.24), Math.sin(angle) * w * rng(), h * 0.34, Math.cos(angle) * w * 0.5 * rng(), 10);
  }
}

function buildMudDome({ group, mats, h, w }) {
  const dome = addSphere(group, mats.primary, w * 0.9, 0, h * 0.42, 0);
  dome.scale.y = 0.58;
  addCylinder(group, mats.secondary, w * 0.7, h * 0.2, 0, 0.28, 0, 24);
  addBox(group, mats.glow, w * 0.38, h * 0.18, 0.04, 0, h * 0.28, -w * 0.73);
}

function buildMembraneLibrary({ group, mats, h, w }) {
  addBox(group, mats.secondary, w * 1.2, h * 0.32, w * 0.75, 0, 0.28, 0);
  const membrane = addSphere(group, mats.primary, w * 0.9, 0, h * 0.52, 0);
  membrane.scale.set(1.25, 0.34, 0.7);
  for (let i = 0; i < 4; i += 1) addBox(group, mats.glow, 0.04, h * 0.36, 0.04, -w * 0.45 + i * w * 0.3, h * 0.25, -w * 0.42);
}

function buildArena({ group, mats, h, w }) {
  for (let i = 0; i < 4; i += 1) addCylinder(group, i % 2 ? mats.secondary : mats.primary, w * (1.1 - i * 0.16), h * 0.08, 0, 0.28 + i * h * 0.08, 0, 44);
  addTorus(group, mats.accent, w * 0.86, 0.035, 0, h * 0.39, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 18; i += 1) {
    const a = (Math.PI * 2 * i) / 18;
    addCylinder(group, mats.secondary, 0.035, h * 0.28, Math.sin(a) * w * 0.92, 0.34, Math.cos(a) * w * 0.92, 8);
  }
}

function buildPalace({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.65, h * 0.36, w * 0.8, 0, 0.28, 0);
  addBox(group, mats.secondary, w * 0.85, h * 0.58, w * 0.62, 0, 0.28, 0);
  addColumnRow(group, mats.accent, -w * 0.7, w * 0.7, h * 0.34, -w * 0.46, 7);
  const roof = addCone(group, mats.accent, w * 0.72, h * 0.16, 0, h * 0.68, 0, 4);
  roof.rotation.y = Math.PI / 4;
}

function buildBasilica({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.2, h * 0.5, w * 0.78, 0, 0.28, 0);
  const dome = addSphere(group, mats.secondary, w * 0.42, 0, h * 0.72, 0);
  dome.scale.y = 0.58;
  addColumnRow(group, mats.accent, -w * 0.52, w * 0.52, h * 0.45, -w * 0.44, 6);
  addTorus(group, mats.glow, w * 0.45, 0.03, 0, h * 0.72, 0).rotation.x = Math.PI / 2;
}

function buildManor({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.42, h * 0.55, w * 0.82, 0, 0.28, 0);
  addBox(group, mats.secondary, w * 0.56, h * 0.32, w * 0.72, -w * 0.38, h * 0.55, 0);
  addBox(group, mats.glass, w * 0.58, h * 0.38, w * 0.72, w * 0.42, h * 0.36, 0);
  addWindowGrid(group, mats.glow, w * 1.1, h * 0.28, 0, h * 0.26, -w * 0.43, 4, 2);
}

function buildObservatory({ group, mats, h, w }) {
  addCylinder(group, mats.primary, w * 0.48, h * 0.56, 0, 0.28, 0, 28);
  const dome = addSphere(group, mats.secondary, w * 0.52, 0, h * 0.62, 0);
  dome.scale.y = 0.45;
  for (let i = 0; i < 3; i += 1) addCylinder(group, mats.accent, w * 0.11, h * 0.78, -w * 0.75 + i * w * 0.75, 0.28, w * 0.55, 12);
}

function buildFortress({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.22, h * 0.42, w * 1.05, 0, 0.28, 0);
  for (const x of [-0.58, 0.58]) {
    for (const z of [-0.48, 0.48]) {
      addCylinder(group, mats.secondary, w * 0.2, h * 0.66, x * w, 0.28, z * w, 12);
      addCone(group, mats.glow, w * 0.22, h * 0.16, x * w, h * 0.73, z * w, 12);
    }
  }
}

function buildBronzeTemple({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.5, h * 0.35, w * 0.95, 0, 0.28, 0);
  addCylinder(group, mats.secondary, w * 0.44, h * 0.42, 0, h * 0.34, 0, 24);
  addColumnRow(group, mats.metal, -w * 0.62, w * 0.62, h * 0.32, -w * 0.5, 6);
  addTorus(group, mats.accent, w * 0.52, 0.035, 0, h * 0.75, 0).rotation.x = Math.PI / 2;
}

function buildReliefTemple({ group, mats, h, w }) {
  for (let i = 0; i < 4; i += 1) addBox(group, mats.primary, w * (1.6 - i * 0.22), h * 0.11, w * (1.15 - i * 0.12), 0, 0.28 + i * h * 0.1, 0);
  addBox(group, mats.secondary, w * 0.8, h * 0.46, w * 0.52, 0, h * 0.38, 0);
  addCone(group, mats.accent, w * 0.4, h * 0.26, 0, h * 0.78, 0, 4).rotation.y = Math.PI / 4;
}

function buildCourt({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.45, h * 0.32, w * 1.0, 0, 0.28, 0);
  addBox(group, mats.secondary, w * 0.8, h * 0.46, w * 0.62, 0, h * 0.28, 0);
  addColumnRow(group, mats.accent, -w * 0.65, w * 0.65, h * 0.35, -w * 0.56, 7);
  addBox(group, mats.glow, w * 1.55, 0.05, w * 0.08, 0, h * 0.69, -w * 0.56);
}

function buildMonastery({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.4, h * 0.34, w * 0.34, 0, 0.28, -w * 0.48);
  addBox(group, mats.primary, w * 1.4, h * 0.34, w * 0.34, 0, 0.28, w * 0.48);
  addBox(group, mats.secondary, w * 0.34, h * 0.42, w * 1.24, -w * 0.56, 0.28, 0);
  addBox(group, mats.secondary, w * 0.34, h * 0.42, w * 1.24, w * 0.56, 0.28, 0);
  addSphere(group, mats.glass, w * 0.22, 0, h * 0.54, 0);
}

function buildDockGate({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 0.35, h * 0.65, w * 1.25, -w * 0.72, 0.28, 0);
  addBox(group, mats.primary, w * 0.35, h * 0.65, w * 1.25, w * 0.72, 0.28, 0);
  addBox(group, mats.secondary, w * 1.8, h * 0.15, w * 1.15, 0, h * 0.62, 0);
  for (let i = 0; i < 4; i += 1) addBox(group, mats.accent, w * 1.75, 0.035, 0.035, 0, h * (0.2 + i * 0.12), -w * 0.62);
}

function buildRefinery({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.25, h * 0.28, w * 0.82, 0, 0.28, 0);
  for (let i = 0; i < 4; i += 1) addCylinder(group, i % 2 ? mats.secondary : mats.primary, w * 0.17, h * (0.45 + i * 0.06), -w * 0.58 + i * w * 0.38, h * 0.18, w * 0.42, 18);
  addTube(group, mats.metal, [new THREE.Vector3(-w * 0.8, h * 0.55, 0), new THREE.Vector3(0, h * 0.75, 0.2), new THREE.Vector3(w * 0.8, h * 0.55, 0)], 0.045);
  addSphere(group, mats.glow, w * 0.08, w * 0.78, h * 0.82, 0);
}

function buildWaterworks({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.65, h * 0.32, w * 1.08, 0, 0.28, 0);
  for (let i = 0; i < 3; i += 1) {
    addCylinder(group, mats.reflective, w * 0.28, 0.05, -w * 0.52 + i * w * 0.52, h * 0.34, 0, 32);
    addTorus(group, mats.accent, w * 0.29, 0.025, -w * 0.52 + i * w * 0.52, h * 0.41, 0).rotation.x = Math.PI / 2;
  }
}

function buildSiloCathedral({ group, mats, h, w }) {
  for (let i = 0; i < 5; i += 1) addCylinder(group, i % 2 ? mats.secondary : mats.primary, w * 0.18, h * (0.56 + i * 0.04), -w * 0.58 + i * w * 0.29, 0.28, 0, 20);
  addBox(group, mats.accent, w * 1.4, h * 0.08, w * 0.25, 0, h * 0.6, 0);
  addBox(group, mats.dark, w * 0.8, h * 0.18, w * 0.38, 0, 0.28, w * 0.48);
}

function buildTileFactory({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.65, h * 0.34, w * 0.9, 0, 0.28, 0);
  addBox(group, mats.secondary, w * 0.55, h * 0.58, w * 0.55, w * 0.46, 0.28, 0);
  addWindowGrid(group, mats.glow, w * 1.2, h * 0.2, -w * 0.18, h * 0.2, -w * 0.47, 4, 1);
}

function buildPipeOrgan({ group, mats, h, w }) {
  for (let i = 0; i < 8; i += 1) addCylinder(group, mats.primary, w * 0.08, h * (0.4 + i * 0.045), -w * 0.7 + i * w * 0.2, 0.28, 0, 18);
  addBox(group, mats.secondary, w * 1.7, h * 0.12, w * 0.34, 0, h * 0.18, 0);
  addTorus(group, mats.glow, w * 0.58, 0.025, 0, h * 0.72, 0).rotation.x = Math.PI / 2;
}

function buildHotMill({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 2.0, h * 0.35, w * 1.1, 0, 0.28, 0);
  for (let i = 0; i < 5; i += 1) {
    const rib = addBox(group, mats.secondary, 0.05, h * 0.46, w * 1.18, -w * 0.82 + i * w * 0.41, 0.35, 0);
    rib.rotation.z = i % 2 ? -0.14 : 0.14;
  }
  addBox(group, mats.glow, w * 1.55, h * 0.08, 0.045, 0, h * 0.33, -w * 0.58);
}

function buildTankFarm({ group, mats, h, w }) {
  for (let i = 0; i < 5; i += 1) {
    const x = -w * 0.68 + (i % 3) * w * 0.68;
    const z = -w * 0.3 + Math.floor(i / 3) * w * 0.62;
    addCylinder(group, mats.primary, w * 0.23, h * 0.4, x, 0.28, z, 28);
    addSphere(group, mats.secondary, w * 0.23, x, h * 0.69, z).scale.y = 0.28;
  }
  addTube(group, mats.metal, [new THREE.Vector3(-w, h * 0.42, -w * 0.4), new THREE.Vector3(0, h * 0.52, 0), new THREE.Vector3(w, h * 0.42, w * 0.32)], 0.035);
}

function buildCraneControl({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 0.72, h * 0.28, w * 0.55, 0, 0.28, 0);
  addBox(group, mats.secondary, w * 0.48, h * 0.3, w * 0.38, 0, h * 0.54, 0);
  addBox(group, mats.accent, w * 2.4, 0.075, 0.075, 0, h * 0.84, 0);
  addCylinder(group, mats.dark, 0.028, h * 0.46, w * 0.95, h * 0.42, 0, 5);
  addSphere(group, mats.glow, w * 0.08, w * 1.1, h * 0.84, 0);
}

function buildPatchFoundry({ group, mats, h, w, rng }) {
  addBox(group, mats.primary, w * 1.5, h * 0.38, w * 1.0, 0, 0.28, 0);
  for (let i = 0; i < 16; i += 1) {
    const panel = addBox(group, i % 3 ? mats.secondary : mats.accent, w * (0.22 + rng() * 0.28), h * (0.08 + rng() * 0.18), 0.045, (rng() - 0.5) * w * 1.2, h * (0.22 + rng() * 0.38), -w * 0.53);
    panel.rotation.z = (rng() - 0.5) * 0.08;
  }
  addCylinder(group, mats.metal, w * 0.1, h * 0.62, -w * 0.62, 0.28, w * 0.38, 10);
}

function buildInkMonastery(context) {
  buildMonastery(context);
  addInkRibbons(context.group, context.mats.glow, context.w, context.h);
}

function buildTheater({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.65, h * 0.34, w * 0.92, 0, 0.28, 0);
  addCylinder(group, mats.secondary, w * 0.5, h * 0.16, 0, h * 0.36, -w * 0.35, 28);
  addBox(group, mats.glow, w * 1.2, 0.055, 0.04, 0, h * 0.55, -w * 0.5);
  addBox(group, mats.accent, w * 0.45, h * 0.24, 0.04, -w * 0.45, h * 0.25, -w * 0.51);
  addBox(group, mats.accent, w * 0.45, h * 0.24, 0.04, w * 0.45, h * 0.25, -w * 0.51);
}

function buildMirrorTemple({ group, mats, h, w }) {
  addCylinder(group, mats.primary, w * 0.72, h * 0.38, 0, 0.28, 0, 6);
  addSphere(group, mats.secondary, w * 0.58, 0, h * 0.62, 0).scale.y = 0.44;
  for (let i = 0; i < 8; i += 1) {
    const a = i * Math.PI * 2 / 8;
    addBox(group, mats.glow, 0.035, h * 0.42, 0.035, Math.sin(a) * w * 0.88, 0.32, Math.cos(a) * w * 0.88);
  }
}

function buildGlassTomb({ group, mats, h, w }) {
  addBox(group, mats.dark, w * 1.38, h * 0.22, w * 0.82, 0, 0.28, 0);
  const pyramid = addCone(group, mats.primary, w * 0.9, h * 0.58, 0, h * 0.22, 0, 4);
  pyramid.rotation.y = Math.PI / 4;
  addBox(group, mats.glow, w * 0.46, h * 0.12, w * 0.24, 0, h * 0.3, 0);
}

function buildBurntKeep(context) {
  buildFortress(context);
  for (let i = 0; i < 4; i += 1) addBox(context.group, context.mats.glow, 0.035, context.h * 0.34, 0.035, -context.w * 0.5 + i * context.w * 0.33, context.h * 0.24, -context.w * 0.56);
}

function buildGhostShrine(context) {
  buildRingGate(context);
  addTorus(context.group, context.mats.glow, context.w * 1.05, 0.025, 0, context.h * 0.5, 0).rotation.y = Math.PI / 2;
}

function buildFolded({ group, mats, h, w }) {
  addBox(group, mats.secondary, w * 1.45, h * 0.24, w * 0.8, 0, 0.28, 0);
  for (let i = 0; i < 5; i += 1) {
    const roof = addBox(group, i % 2 ? mats.primary : mats.tertiary, w * 0.62, 0.055, w * 1.0, -w * 0.55 + i * w * 0.28, h * (0.34 + i * 0.035), 0);
    roof.rotation.z = i % 2 ? -0.42 : 0.42;
  }
}

function buildPearlTower({ group, mats, h, w }) {
  for (let i = 0; i < 7; i += 1) {
    addSphere(group, i % 2 ? mats.primary : mats.secondary, w * (0.36 - i * 0.018), 0, 0.45 + i * h * 0.105, 0);
  }
  addTorus(group, mats.glow, w * 0.58, 0.035, 0, h * 0.62, 0).rotation.x = Math.PI / 2;
}

function buildCosmicObelisk({ group, mats, h, w }) {
  addCone(group, mats.primary, w * 0.62, h * 0.9, 0, 0.28, 0, 5);
  addCone(group, mats.secondary, w * 0.28, h * 0.24, 0, h * 0.86, 0, 5);
  for (let i = 0; i < 7; i += 1) addBox(group, mats.glow, 0.035, h * 0.38, 0.035, Math.sin(i) * w * 0.2, h * (0.2 + i * 0.08), -w * 0.42);
}

function buildStorefront({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.35, h * 0.38, w * 0.78, 0, 0.28, 0);
  addBox(group, mats.glass, w * 0.52, h * 0.24, 0.04, -w * 0.3, h * 0.18, -w * 0.42);
  addBox(group, mats.glass, w * 0.52, h * 0.24, 0.04, w * 0.3, h * 0.18, -w * 0.42);
  addBox(group, mats.glow, w * 1.22, 0.08, 0.05, 0, h * 0.45, -w * 0.43);
  addBox(group, mats.reflective, w * 1.4, 0.025, w * 0.5, 0, 0.25, -w * 0.42);
}

function buildCornerShop({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.1, h * 0.42, w * 0.82, 0, 0.28, 0);
  addBox(group, mats.secondary, w * 0.36, h * 0.5, w * 0.36, w * 0.42, 0.28, -w * 0.34);
  addBox(group, mats.glow, w * 0.65, 0.07, 0.04, 0, h * 0.52, -w * 0.43);
  addCylinder(group, mats.accent, w * 0.12, h * 0.18, -w * 0.46, h * 0.42, -w * 0.34, 16);
}

function buildRenovation({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.0, h * 0.52, w * 0.78, -w * 0.16, 0.28, 0);
  addBox(group, mats.glass, w * 0.55, h * 0.46, w * 0.55, w * 0.48, 0.28, 0);
  addBox(group, mats.secondary, w * 1.15, h * 0.12, w * 0.84, -w * 0.08, h * 0.58, 0);
}

function buildWorkshop({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.55, h * 0.36, w * 0.9, 0, 0.28, 0);
  addBox(group, mats.glass, w * 1.45, h * 0.32, 0.04, 0, h * 0.22, -w * 0.48);
  for (let i = 0; i < 5; i += 1) addBox(group, mats.glow, 0.035, h * 0.3, 0.035, -w * 0.55 + i * w * 0.28, h * 0.22, -w * 0.5);
}

function buildMarketArcade({ group, mats, h, w }) {
  buildWovenMarket({ group, mats, h, w });
  for (let i = 0; i < 4; i += 1) addBox(group, mats.glow, w * 0.18, 0.035, 0.035, -w * 0.55 + i * w * 0.36, h * 0.52, -w * 0.58);
}

function buildCinema(context) {
  buildTheater(context);
}

function buildRooftopVilla({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.1, h * 0.56, w * 0.78, 0, 0.28, 0);
  addCylinder(group, mats.accent, w * 0.22, h * 0.22, w * 0.35, h * 0.58, w * 0.16, 18);
  addBox(group, mats.metal, w * 1.12, 0.045, w * 0.82, 0, h * 0.58, 0);
  addWindowGrid(group, mats.glass, w * 0.86, h * 0.33, 0, h * 0.25, -w * 0.43, 3, 2);
}

function buildBathhouse({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.35, h * 0.36, w * 0.85, 0, 0.28, 0);
  addCylinder(group, mats.secondary, w * 0.16, h * 0.44, w * 0.44, h * 0.32, w * 0.26, 14);
  addSphere(group, solidMaterial("#ffffff", { transparent: true, opacity: 0.28, roughness: 1 }), w * 0.35, 0, h * 0.62, -w * 0.22);
  addWindowGrid(group, mats.glow, w * 0.8, h * 0.15, 0, h * 0.21, -w * 0.45, 4, 1);
}

function buildRoastery({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.2, h * 0.46, w * 0.82, 0, 0.28, 0);
  for (let i = 0; i < 6; i += 1) addBox(group, mats.secondary, 0.055, h * 0.42, 0.045, -w * 0.48 + i * w * 0.19, h * 0.1, -w * 0.44);
  addTube(group, mats.metal, [new THREE.Vector3(w * 0.48, h * 0.28, -w * 0.45), new THREE.Vector3(w * 0.72, h * 0.5, -w * 0.2), new THREE.Vector3(w * 0.58, h * 0.7, w * 0.18)], 0.035);
  addBox(group, mats.glow, w * 0.7, 0.05, 0.04, 0, h * 0.52, -w * 0.45);
}

function buildSubwayCenter({ group, mats, h, w }) {
  addBox(group, mats.primary, w * 1.5, h * 0.28, w * 0.75, 0, 0.28, 0);
  const canopy = addBox(group, mats.glass, w * 1.55, 0.07, w * 1.0, 0, h * 0.45, 0);
  canopy.rotation.z = -0.08;
  addBox(group, mats.glow, w * 0.9, 0.06, 0.04, 0, h * 0.52, -w * 0.4);
  addCylinder(group, mats.metal, w * 0.08, h * 0.48, -w * 0.6, 0.28, -w * 0.32, 12);
}

function addStrategyStoneBase(group, mats, w, h, depth = 0.98) {
  addBox(group, mats.dark, w * 1.46, h * 0.08, w * depth, 0, 0.24, 0);
  addBox(group, mats.primary, w * 1.32, h * 0.3, w * (depth * 0.82), 0, 0.3, 0);
  for (let row = 0; row < 2; row += 1) {
    for (let i = 0; i < 5; i += 1) {
      const offset = row % 2 ? w * 0.13 : 0;
      const x = -w * 0.48 + i * w * 0.24 + offset;
      addBox(group, i % 2 ? mats.secondary : mats.primary, w * 0.18, h * 0.08, 0.055, x, h * (0.16 + row * 0.11), -w * depth * 0.44);
    }
  }
  addBox(group, mats.dark, w * 1.38, h * 0.045, w * 0.06, 0, h * 0.5, -w * depth * 0.44);
}

function addStrategyGableRoof(group, roofMat, trimMat, w, h, x, y, z, depth = 1) {
  const left = addBox(group, roofMat, w * 0.86, h * 0.09, w * depth, x - w * 0.23, y, z);
  left.rotation.z = 0.42;
  const right = addBox(group, roofMat, w * 0.86, h * 0.09, w * depth, x + w * 0.23, y, z);
  right.rotation.z = -0.42;
  addBox(group, trimMat, w * 0.1, h * 0.12, w * (depth + 0.08), x, y + h * 0.12, z);
  addBox(group, trimMat, w * 1.18, h * 0.045, w * 0.08, x, y - h * 0.04, z - w * depth * 0.52);
  addBox(group, trimMat, w * 1.18, h * 0.045, w * 0.08, x, y - h * 0.04, z + w * depth * 0.52);
}

function addPalisadeRing(group, mat, radius, h, y = 0.24, count = 14) {
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count;
    const post = addBox(group, mat, 0.075, h, 0.11, Math.sin(a) * radius, y, Math.cos(a) * radius);
    post.rotation.y = a;
  }
}

function addGameCannon(group, mats, x, y, z, scale, yaw = 0) {
  const mount = addCylinder(group, mats.dark, scale * 0.18, scale * 0.22, x, y, z, 14);
  mount.scale.z = 0.78;
  const barrel = addCylinder(group, mats.metal, scale * 0.12, scale * 0.58, x, y + scale * 0.2, z - scale * 0.25, 18);
  barrel.rotation.x = Math.PI / 2;
  barrel.rotation.z = yaw;
  addCylinder(group, mats.dark, scale * 0.15, scale * 0.08, x, y + scale * 0.2, z - scale * 0.56, 18).rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    const wheel = addCylinder(group, mats.secondary, scale * 0.13, scale * 0.06, x + side * scale * 0.25, y + scale * 0.04, z - scale * 0.12, 14);
    wheel.rotation.z = Math.PI / 2;
  }
}

function addTrainingDummy(group, mats, x, y, z, scale) {
  addCylinder(group, mats.dark, scale * 0.035, scale * 0.52, x, y, z, 6);
  addCylinder(group, mats.secondary, scale * 0.16, scale * 0.06, x, y + scale * 0.34, z, 18).rotation.x = Math.PI / 2;
  addShield(group, mats.accent, scale * 0.34, y + scale * 0.2, z - scale * 0.02, x);
}

function addVillageLevelBadge(group, mats, x, y, z, scale, stars = 3) {
  addBox(group, mats.dark, scale * 0.72, scale * 0.28, scale * 0.045, x, y, z);
  addBox(group, mats.metal, scale * 0.78, scale * 0.05, scale * 0.055, x, y + scale * 0.25, z - scale * 0.01);
  addBox(group, mats.metal, scale * 0.78, scale * 0.05, scale * 0.055, x, y - scale * 0.02, z - scale * 0.01);
  const start = x - (stars - 1) * scale * 0.13;
  for (let i = 0; i < stars; i += 1) {
    addStarBadge(group, mats.accent, mats.metal, start + i * scale * 0.26, y + scale * 0.18, z - scale * 0.04, scale * 0.23);
  }
}

function addVillageRoofTrim(group, mat, w, h, z, y, count = 6) {
  for (let i = 0; i < count; i += 1) {
    const x = -w * 0.45 + (i / Math.max(1, count - 1)) * w * 0.9;
    const tooth = addCone(group, mat, w * 0.055, h * 0.12, x, y, z, 3);
    tooth.rotation.y = Math.PI;
  }
}

function addWeaponRack(group, mats, x, y, z, scale) {
  addBox(group, mats.wood, scale * 0.52, scale * 0.08, 0.05, x, y + scale * 0.18, z);
  addBox(group, mats.wood, scale * 0.52, scale * 0.08, 0.05, x, y + scale * 0.42, z);
  for (let i = 0; i < 3; i += 1) {
    const px = x - scale * 0.2 + i * scale * 0.2;
    const shaft = addCylinder(group, mats.metal, scale * 0.018, scale * 0.55, px, y, z - 0.01, 6);
    shaft.rotation.z = (i - 1) * 0.16;
    addCone(group, mats.accent, scale * 0.055, scale * 0.16, px, y + scale * 0.48, z - 0.02, 4);
  }
}

function addClayPot(group, mats, x, y, z, size) {
  const clay = solidMaterial("#b87542", { roughness: 0.82 });
  const darkClay = solidMaterial("#6f4129", { roughness: 0.9 });
  const pot = addCylinder(group, clay, size * 0.22, size * 0.38, x, y, z, 14);
  pot.scale.z = 0.86;
  addTorus(group, darkClay, size * 0.23, size * 0.025, x, y + size * 0.38, z).rotation.x = Math.PI / 2;
  addBox(group, mats.accent, size * 0.18, size * 0.035, size * 0.04, x, y + size * 0.2, z - size * 0.2);
}

function addSignpost(group, woodMat, trimMat, x, y, z, size) {
  addCylinder(group, trimMat, size * 0.035, size * 0.72, x, y, z, 6);
  const board = addBox(group, woodMat, size * 0.62, size * 0.22, size * 0.06, x + size * 0.12, y + size * 0.46, z);
  board.rotation.z = -0.08;
  addBox(group, trimMat, size * 0.5, size * 0.035, size * 0.07, x + size * 0.12, y + size * 0.55, z - size * 0.02);
}

function addAdventureLantern(group, glowMat, poleMat, x, y, z, scale) {
  addTube(group, poleMat, [
    new THREE.Vector3(x, y + scale * 0.26, z),
    new THREE.Vector3(x + scale * 0.12, y + scale * 0.44, z - scale * 0.08),
    new THREE.Vector3(x + scale * 0.28, y + scale * 0.42, z - scale * 0.08)
  ], scale * 0.018);
  addCylinder(group, poleMat, scale * 0.055, scale * 0.08, x + scale * 0.3, y + scale * 0.26, z - scale * 0.08, 8);
  addSphere(group, glowMat, scale * 0.12, x + scale * 0.3, y + scale * 0.22, z - scale * 0.08).scale.y = 0.8;
}

function addAdventureDoor(group, doorMat, trimMat, x, y, z, width, height) {
  addBox(group, trimMat, width * 1.12, height * 0.9, 0.08, x, y, z);
  const door = addBox(group, doorMat, width, height * 0.72, 0.09, x, y, z - 0.04);
  addCylinder(group, doorMat, width * 0.5, 0.09, x, y + height * 0.52, z - 0.04, 18).rotation.x = Math.PI / 2;
  addSphere(group, trimMat, width * 0.055, x + width * 0.28, y + height * 0.34, z - 0.1);
  return door;
}

function addLeafRoofLayers(group, leafMat, trimMat, w, h, x, z, radius, layers) {
  for (let i = 0; i < layers; i += 1) {
    const roof = addCone(group, leafMat, radius * (1 - i * 0.13), h * 0.16, x, h * (0.5 + i * 0.08), z, 7);
    roof.scale.z = 0.72;
    roof.rotation.y = i * 0.16;
    addTorus(group, trimMat, radius * (1 - i * 0.13), 0.02, x, h * (0.5 + i * 0.08), z).rotation.x = Math.PI / 2;
  }
}

function addMossBlobs(group, mat, w, y, z, count) {
  for (let i = 0; i < count; i += 1) {
    const x = -w * 0.48 + i * (w * 0.96 / Math.max(1, count - 1));
    const blob = addSphere(group, mat, w * (0.08 + (i % 2) * 0.02), x, y + (i % 2) * w * 0.03, z + (i % 3 - 1) * w * 0.04);
    blob.scale.y = 0.35;
  }
}

function addWindVane(group, metalMat, glowMat, x, y, z, scale) {
  addCylinder(group, metalMat, scale * 0.018, scale * 0.48, x, y, z, 6);
  addBox(group, metalMat, scale * 0.54, scale * 0.025, scale * 0.025, x, y + scale * 0.43, z);
  const fin = addCone(group, glowMat, scale * 0.08, scale * 0.2, x + scale * 0.35, y + scale * 0.34, z, 3);
  fin.rotation.z = -Math.PI / 2;
  addSphere(group, glowMat, scale * 0.045, x - scale * 0.32, y + scale * 0.43, z);
}

function addRuneMaze(group, glowMat, x, y, z, width, height) {
  const segments = [
    [-0.28, 0.28, 0.36, 0.035, 0],
    [0.08, 0.1, 0.035, 0.36, 0],
    [0.3, -0.08, 0.32, 0.035, 0],
    [-0.1, -0.24, 0.035, 0.28, 0]
  ];
  for (const [sx, sy, sw, sh, rot] of segments) {
    const strip = addBox(group, glowMat, width * sw, height * sh, 0.04, x + width * sx, y + height * sy, z);
    strip.rotation.z = rot;
  }
}

function addBrokenKeystoneRing(group, mat, glowMat, x, y, z, radius, size) {
  for (let i = 0; i < 12; i += 1) {
    if (i === 2 || i === 7) continue;
    const a = (Math.PI * 2 * i) / 12;
    const block = addBox(group, i % 3 ? mat : glowMat, size * 0.46, size * 0.14, size * 0.16, x + Math.sin(a) * radius, y + Math.cos(a) * radius, z);
    block.rotation.z = -a;
  }
}

function addFloatingTablets(group, mat, glowMat, w, h, radius, count) {
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count;
    const tablet = addBox(group, mat, w * 0.18, h * 0.16, w * 0.035, Math.sin(a) * radius, h * (0.72 + (i % 2) * 0.08), Math.cos(a) * radius);
    tablet.rotation.y = a;
    addBox(group, glowMat, w * 0.12, h * 0.018, w * 0.04, Math.sin(a) * radius, h * (0.82 + (i % 2) * 0.08), Math.cos(a) * radius - w * 0.02).rotation.y = a;
  }
}

function addSackAndHay(group, mats, x, y, z, size) {
  const sack = addSphere(group, solidMaterial("#caa36c", { roughness: 0.88 }), size * 0.2, x, y + size * 0.22, z);
  sack.scale.set(1.2, 0.8, 0.8);
  addBox(group, mats.accent, size * 0.46, size * 0.18, size * 0.22, x + size * 0.32, y, z + size * 0.08).rotation.z = 0.08;
}

function buildAdventureLodge({ group, mats, h, w }) {
  const roofMat = surfaceMaterial("leafShingle", PALETTES.adventureLodge, "adventure-lodge-roof");
  const plaster = surfaceMaterial("adventurePlaster", PALETTES.adventureLodge, "adventure-lodge-plaster");
  const brass = solidMaterial("#c99a43", { roughness: 0.34, metalness: 0.35 });

  addCylinder(group, mats.outline, w * 0.92, h * 0.12, 0, 0.2, 0, 14).scale.z = 0.78;
  const body = addCylinder(group, plaster, w * 0.68, h * 0.42, 0, 0.32, 0, 16);
  body.scale.z = 0.76;
  for (const x of [-0.46, 0.46]) addBox(group, mats.wood, w * 0.09, h * 0.44, w * 0.78, x * w, h * 0.32, 0);
  addBox(group, mats.wood, w * 1.22, h * 0.08, w * 0.08, 0, h * 0.6, -w * 0.54);
  addLeafRoofLayers(group, roofMat, mats.outline, w, h, 0, 0, w * 0.9, 3);
  addChunkyTrim(group, brass, w * 1.1, h * 0.74, -w * 0.55, 8, w * 0.09);

  addBox(group, mats.wood, w * 1.1, h * 0.08, w * 0.34, 0, h * 0.24, -w * 0.76);
  for (let i = 0; i < 7; i += 1) addCylinder(group, mats.outline, w * 0.025, h * 0.28, -w * 0.44 + i * w * 0.15, h * 0.28, -w * 0.9, 6);
  addAdventureDoor(group, mats.wood, mats.outline, 0, h * 0.2, -w * 0.61, w * 0.44, h * 0.48);
  addAdventureLantern(group, mats.glow, mats.outline, -w * 0.52, h * 0.54, -w * 0.62, w * 0.32);
  addAdventureLantern(group, mats.glow, mats.outline, w * 0.52, h * 0.54, -w * 0.62, w * 0.32);

  const chimney = addCylinder(group, mats.dark, w * 0.08, h * 0.5, w * 0.46, h * 0.72, w * 0.08, 8);
  chimney.rotation.z = -0.16;
  addSphere(group, solidMaterial("#e8eadf", { roughness: 1, transparent: true, opacity: 0.5 }), w * 0.12, w * 0.42, h * 1.28, w * 0.08);
  addSphere(group, solidMaterial("#d1d6cd", { roughness: 1, transparent: true, opacity: 0.38 }), w * 0.18, w * 0.56, h * 1.48, w * 0.02);
  addCylinder(group, plaster, w * 0.16, h * 0.34, -w * 0.48, h * 0.72, w * 0.16, 12);
  addCone(group, roofMat, w * 0.22, h * 0.2, -w * 0.48, h * 1.04, w * 0.16, 7);
  addWindVane(group, brass, mats.glow, -w * 0.48, h * 1.28, w * 0.16, w * 0.5);

  addMossBlobs(group, roofMat, w, h * 0.72, -w * 0.5, 5);
  addClayPot(group, mats, -w * 0.72, 0.22, -w * 0.8, w * 0.24);
  addSupplyCrate(group, mats, w * 0.74, 0.22, -w * 0.82, w * 0.28);
  addSignpost(group, mats.wood, mats.outline, w * 0.95, 0.24, -w * 0.5, w * 0.38);
}

function buildCanopyHut({ group, mats, h, w }) {
  const bark = surfaceMaterial("rootWood", PALETTES.adventureForest, "canopy-bark");
  const leafMat = surfaceMaterial("leafShingle", PALETTES.adventureForest, "canopy-leaves");
  const moss = solidMaterial("#7fb05a", { roughness: 0.86 });
  addCylinder(group, bark, w * 0.32, h * 0.78, 0, 0.22, 0, 13);
  const hut = addCylinder(group, mats.primary, w * 0.76, h * 0.36, 0, 0.28, 0, 18);
  hut.scale.z = 0.78;
  addLeafRoofLayers(group, leafMat, mats.outline, w, h, 0, 0, w * 1.0, 4);
  for (const x of [-0.72, 0.72]) {
    const support = addCylinder(group, bark, w * 0.04, h * 0.6, x * w, 0.26, -w * 0.2, 7);
    support.rotation.z = -x * 0.24;
  }
  addAdventureDoor(group, mats.wood, mats.outline, 0, h * 0.16, -w * 0.65, w * 0.38, h * 0.4);
  for (const x of [-0.44, 0.44]) {
    const window = addCylinder(group, mats.glow, w * 0.12, 0.04, x * w, h * 0.44, -w * 0.68, 18);
    window.rotation.x = Math.PI / 2;
  }
  addTorus(group, mats.wood, w * 0.82, 0.035, 0, h * 0.48, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i += 1) addBox(group, mats.wood, w * 0.2, h * 0.05, w * 0.12, -w * 0.82 - i * w * 0.18, h * 0.28, -w * 0.32 + (i % 2) * w * 0.05);
  addMossBlobs(group, moss, w * 1.5, h * 0.78, -w * 0.42, 7);
  for (let i = 0; i < 4; i += 1) {
    const cap = addSphere(group, i % 2 ? mats.accent : mats.secondary, w * 0.12, -w * 0.56 + i * w * 0.22, 0.42, -w * 0.95);
    cap.scale.y = 0.34;
    addCylinder(group, mats.bone, w * 0.035, h * 0.12, -w * 0.56 + i * w * 0.22, 0.23, -w * 0.95, 8);
  }
  addAdventureLantern(group, mats.glow, mats.outline, w * 0.72, h * 0.66, -w * 0.46, w * 0.28);
  addWindVane(group, mats.metal, mats.glow, 0, h * 1.13, 0, w * 0.34);
}

function buildRuneLockShrine({ group, mats, h, w }) {
  const stone = surfaceMaterial("adventureRuneStone", PALETTES.adventureRune, "rune-lock-stone");
  const gold = solidMaterial("#d2a84a", { roughness: 0.36, metalness: 0.24 });
  const moss = solidMaterial("#4f7041", { roughness: 0.9 });
  addCylinder(group, mats.outline, w * 1.06, h * 0.12, 0, 0.18, 0, 8).scale.z = 0.78;
  addCylinder(group, stone, w * 0.92, h * 0.12, 0, h * 0.28, 0, 8).scale.z = 0.78;
  const lower = addBox(group, stone, w * 1.45, h * 0.42, w * 0.92, -w * 0.08, 0.32, 0);
  lower.rotation.y = 0.05;
  const upper = addBox(group, mats.secondary, w * 1.18, h * 0.32, w * 0.76, w * 0.08, h * 0.72, 0);
  upper.rotation.y = -0.06;
  const cap = addSphere(group, stone, w * 0.72, 0, h * 1.0, 0);
  cap.scale.set(1.08, 0.28, 0.72);

  for (const [x, z, tilt] of [[-0.74, -0.48, 0.22], [0.74, -0.48, -0.18], [-0.74, 0.48, -0.16], [0.74, 0.48, 0.2]]) {
    const pillar = addCylinder(group, stone, w * 0.08, h * 0.78, x * w, 0.26, z * w, 8);
    pillar.rotation.z = tilt;
    addCylinder(group, gold, w * 0.09, h * 0.055, x * w, h * 0.9, z * w, 8);
  }

  addBox(group, mats.dark, w * 0.46, h * 0.58, 0.08, 0, h * 0.26, -w * 0.55);
  addBox(group, mats.glow, w * 0.06, h * 0.5, 0.09, 0, h * 0.31, -w * 0.62);
  addBox(group, stone, w * 0.2, h * 0.68, 0.09, -w * 0.34, h * 0.24, -w * 0.58);
  addBox(group, stone, w * 0.2, h * 0.58, 0.09, w * 0.34, h * 0.28, -w * 0.58);
  addBox(group, stone, w * 0.78, h * 0.16, 0.1, 0, h * 0.88, -w * 0.58);
  addRuneMaze(group, mats.glow, 0, h * 0.66, -w * 0.64, w * 0.76, h * 0.48);
  addBrokenKeystoneRing(group, stone, mats.glow, 0, h * 1.54, -w * 0.08, w * 0.48, w * 0.36);
  for (const x of [-0.46, -0.18, 0.18, 0.46]) addCylinder(group, x < 0 ? mats.glow : stone, w * 0.055, 0.04, x * w, h * 0.72, -w * 0.64, 14).rotation.x = Math.PI / 2;
  for (const x of [-0.78, 0.78]) {
    addBox(group, stone, w * 0.22, h * 0.4, w * 0.16, x * w, 0.25, -w * 0.86);
    addSphere(group, mats.glow, w * 0.1, x * w, h * 0.65, -w * 0.86);
  }
  addMossBlobs(group, moss, w * 1.5, h * 0.36, w * 0.48, 6);
}

function buildSunleafWindmill({ group, mats, h, w }) {
  const roofMat = surfaceMaterial("leafShingle", PALETTES.adventureWindmill, "sunleaf-roof");
  const plaster = surfaceMaterial("adventurePlaster", PALETTES.adventureWindmill, "sunleaf-plaster");
  const cloth = solidMaterial("#76a9d6", { roughness: 0.78 });
  const body = addCylinder(group, plaster, w * 0.68, h * 0.55, 0, 0.26, 0, 18);
  body.scale.z = 0.82;
  addCylinder(group, mats.outline, w * 0.72, h * 0.08, 0, 0.22, 0, 18).scale.z = 0.86;
  for (const x of [-0.48, 0.48]) addBox(group, mats.wood, w * 0.08, h * 0.56, w * 0.86, x * w, h * 0.26, 0);
  addBox(group, mats.wood, w * 1.16, h * 0.07, w * 0.08, 0, h * 0.54, -w * 0.58);
  addCone(group, roofMat, w * 0.82, h * 0.24, 0, h * 0.78, 0, 12).scale.z = 0.74;
  addAdventureDoor(group, mats.wood, mats.outline, -w * 0.18, h * 0.18, -w * 0.62, w * 0.34, h * 0.42);
  addCylinder(group, mats.glow, w * 0.11, 0.04, w * 0.34, h * 0.62, -w * 0.64, 18).rotation.x = Math.PI / 2;

  addBox(group, mats.wood, w * 0.34, h * 0.78, w * 0.24, w * 0.46, h * 0.42, -w * 0.64);
  const hub = addCylinder(group, mats.accent, w * 0.16, 0.08, w * 0.46, h * 1.1, -w * 0.8, 24);
  hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i += 1) {
    const blade = addBox(group, roofMat, w * 0.18, h * 0.62, 0.055, w * 0.46, h * 0.8, -w * 0.85);
    blade.rotation.z = (Math.PI * i) / 2;
    addBox(group, mats.accent, w * 0.08, h * 0.52, 0.06, w * 0.46, h * 0.86, -w * 0.88).rotation.z = (Math.PI * i) / 2;
  }
  addTorus(group, mats.glow, w * 0.18, 0.02, w * 0.46, h * 1.1, -w * 0.86).rotation.x = Math.PI / 2;

  addBox(group, plaster, w * 0.58, h * 0.28, w * 0.5, -w * 0.72, 0.24, w * 0.18);
  addCone(group, roofMat, w * 0.42, h * 0.18, -w * 0.72, h * 0.48, w * 0.18, 8).scale.z = 0.7;
  for (let i = 0; i < 5; i += 1) {
    addBox(group, i % 2 ? cloth : mats.accent, w * 0.16, h * 0.08, 0.045, -w * 0.62 + i * w * 0.22, h * 0.78 + (i % 2) * h * 0.04, -w * 0.42);
  }
  addSackAndHay(group, mats, -w * 0.72, 0.22, -w * 0.72, w * 0.46);
  addClayPot(group, mats, w * 0.84, 0.22, -w * 0.3, w * 0.24);
  addMossBlobs(group, roofMat, w * 1.1, h * 0.82, -w * 0.28, 5);
}

function buildZephyrSpire({ group, mats, h, w }) {
  const stone = surfaceMaterial("skyIslandStone", PALETTES.adventureSky, "zephyr-stone");
  const copper = solidMaterial("#35a9a5", { roughness: 0.42, metalness: 0.18 });
  const island = addCylinder(group, mats.ground, w * 1.05, h * 0.16, 0, 0.16, 0, 18);
  island.scale.z = 0.72;
  for (let i = 0; i < 7; i += 1) {
    const a = (Math.PI * 2 * i) / 7;
    const rock = addCone(group, stone, w * (0.12 + (i % 2) * 0.05), h * 0.36, Math.sin(a) * w * 0.68, -h * 0.14, Math.cos(a) * w * 0.42, 5);
    rock.rotation.x = Math.sin(a) * 0.18;
  }
  for (let i = 0; i < 5; i += 1) {
    addCylinder(group, i % 2 ? mats.secondary : stone, w * (0.46 - i * 0.035), h * 0.18, 0, 0.3 + i * h * 0.17, 0, 12);
    addTorus(group, copper, w * (0.47 - i * 0.035), 0.026, 0, h * (0.47 + i * 0.17), 0).rotation.x = Math.PI / 2;
    addBox(group, mats.glow, w * 0.04, h * 0.16, 0.04, 0, h * (0.36 + i * 0.17), -w * (0.48 - i * 0.035));
  }
  for (let ring = 0; ring < 3; ring += 1) {
    const y = h * (1.02 + ring * 0.16);
    for (let i = 0; i < 10; i += 1) {
      if ((i + ring) % 4 === 0) continue;
      const a = (Math.PI * 2 * i) / 10;
      const segment = addBox(group, copper, w * 0.34, h * 0.035, w * 0.12, Math.sin(a) * w * (0.72 + ring * 0.08), y, Math.cos(a) * w * (0.48 + ring * 0.05));
      segment.rotation.y = a;
    }
  }
  addAdventureDoor(group, mats.wood, mats.outline, 0, h * 0.22, -w * 0.44, w * 0.3, h * 0.38);
  addOctahedron(group, mats.glow, w * 0.16, 0, h * 0.65, -w * 0.5);
  addCrystalCluster(group, mats.glow, 0, h * 1.42, 0, w * 0.64);
  addWindVane(group, copper, mats.glow, 0, h * 1.82, 0, w * 0.42);
  addFloatingTablets(group, stone, mats.glow, w, h, w * 0.86, 4);
  for (let i = 0; i < 6; i += 1) addPlant(group, -w * 0.62 + i * w * 0.24, 0.26, w * 0.42 + (i % 2) * w * 0.12, PALETTES.adventureSky, 0.5);
}

function buildLavaTideTemple({ group, mats, h, w }) {
  const stone = surfaceMaterial("tideTempleStone", PALETTES.adventureTide, "tide-temple-stone");
  const water = solidMaterial("#28b8b0", { roughness: 0.1, transparent: true, opacity: 0.58, emissive: "#0c6d72", emissiveIntensity: 0.24 });
  const lava = solidMaterial("#e14b2f", { roughness: 0.45, emissive: "#e14b2f", emissiveIntensity: 0.45 });
  const gold = solidMaterial("#c49755", { roughness: 0.34, metalness: 0.22 });
  addCylinder(group, mats.outline, w * 1.12, h * 0.14, 0, 0.18, 0, 18).scale.z = 0.78;
  addCylinder(group, stone, w * 0.96, h * 0.18, 0, 0.32, 0, 18).scale.z = 0.78;
  const dome = addSphere(group, mats.secondary, w * 0.76, 0, h * 0.7, 0);
  dome.scale.set(1, 0.38, 0.72);
  addCrenellations(group, gold, w * 1.38, h * 0.72, -w * 0.58, 10, w * 0.12);
  addAdventureDoor(group, mats.dark, gold, 0, h * 0.24, -w * 0.7, w * 0.46, h * 0.56);
  addRuneMaze(group, water, 0, h * 0.58, -w * 0.78, w * 0.7, h * 0.42);

  const channel = addBox(group, water, w * 0.38, h * 0.055, w * 1.6, -w * 0.72, h * 0.16, -w * 0.05);
  channel.rotation.y = -0.22;
  for (let i = 0; i < 5; i += 1) addBox(group, stone, w * 0.42, h * 0.08, w * 0.16, -w * 0.72, h * 0.26, -w * 0.48 + i * w * 0.22).rotation.y = -0.22;
  for (let i = 0; i < 7; i += 1) {
    const rock = addCone(group, mats.dark, w * (0.12 + (i % 3) * 0.03), h * (0.26 + (i % 2) * 0.12), w * (0.58 + (i % 3) * 0.18), 0.22, -w * 0.66 + i * w * 0.22, 6);
    rock.rotation.z = (i - 3) * 0.05;
    addBox(group, lava, w * 0.18, h * 0.035, 0.045, w * (0.58 + (i % 3) * 0.18), h * 0.28, -w * 0.66 + i * w * 0.22).rotation.y = i * 0.2;
  }

  for (const [x, z, scale, tilt] of [[-0.55, 0.32, 0.9, 0.18], [0.04, 0.45, 1.12, -0.08], [0.62, 0.24, 0.78, -0.2]]) {
    const spire = addCylinder(group, stone, w * 0.12 * scale, h * 0.72 * scale, x * w, h * 0.58, z * w, 8);
    spire.rotation.z = tilt;
    addCone(group, mats.glow, w * 0.14 * scale, h * 0.22 * scale, x * w, h * (1.25 * scale), z * w, 6).rotation.z = tilt;
  }
  for (const x of [-0.36, 0.36]) {
    addCylinder(group, gold, w * 0.06, h * 0.28, x * w, h * 0.86, -w * 0.18, 8);
    addOctahedron(group, water, w * 0.12, x * w, h * 1.18, -w * 0.18);
  }
  for (const x of [-0.94, 0.92]) addPlant(group, x * w, 0.24, w * 0.64, PALETTES.adventureTide, 0.52);
  addBox(group, stone, w * 0.32, h * 0.1, w * 0.18, -w * 0.96, 0.24, -w * 0.44).rotation.y = 0.28;
  addBox(group, stone, w * 0.28, h * 0.08, w * 0.16, w * 0.94, 0.24, w * 0.42).rotation.y = -0.34;
}

function buildToyForge({ group, mats, h, w }) {
  const roofMat = surfaceMaterial("brightRoofTile", PALETTES.toyForge, "forge-roof");
  addStrategyStoneBase(group, mats, w, h, 1.02);
  addBox(group, mats.wood, w * 1.34, h * 0.14, w * 0.08, 0, h * 0.42, -w * 0.5);
  addStrategyGableRoof(group, roofMat, mats.dark, w * 1.45, h * 0.54, 0, h * 0.6, 0, 1.08);
  addVillageRoofTrim(group, mats.accent, w * 1.35, h, -w * 0.58, h * 0.72, 7);
  addBox(group, mats.dark, w * 0.58, h * 0.2, 0.065, 0, h * 0.18, -w * 0.54);
  addBox(group, mats.glow, w * 0.42, h * 0.12, 0.075, 0, h * 0.22, -w * 0.58);
  addBox(group, mats.metal, w * 0.42, h * 0.14, w * 0.28, -w * 0.32, h * 0.26, -w * 0.62);
  addCylinder(group, mats.dark, w * 0.2, h * 0.72, w * 0.5, h * 0.48, w * 0.2, 8);
  addCylinder(group, mats.metal, w * 0.25, h * 0.1, w * 0.5, h * 1.17, w * 0.2, 8);
  addSphere(group, solidMaterial("#5a6670", { transparent: true, opacity: 0.42, roughness: 1 }), w * 0.15, w * 0.46, h * 1.34, w * 0.18);
  addSphere(group, solidMaterial("#9aa2a8", { transparent: true, opacity: 0.32, roughness: 1 }), w * 0.2, w * 0.6, h * 1.52, w * 0.12);
  addHammer(group, mats.metal, mats.accent, -w * 0.64, h * 0.96, -w * 0.32, w * 0.58);
  addBox(group, mats.metal, w * 0.28, h * 0.08, w * 0.2, w * 0.45, h * 0.2, -w * 0.58);
  addFlag(group, mats.accent, mats.dark, -w * 0.74, h * 0.92, -w * 0.2, h * 0.42);
  addVillageLevelBadge(group, mats, w * 0.34, h * 0.53, -w * 0.63, w * 0.46, 3);
  addWeaponRack(group, mats, -w * 0.58, h * 0.18, -w * 0.6, w * 0.45);
}

function buildTrainingCamp({ group, mats, h, w }) {
  const roofMat = surfaceMaterial("brightRoofTile", PALETTES.trainingYard, "training-roof");
  const sandMat = surfaceMaterial("arenaTile", ["#c99248", "#e0b067", "#f4d58a", "#6d4d2b", "#fff1cd"], "training-sand");
  addCylinder(group, sandMat, w * 1.16, h * 0.1, 0, 0.22, 0, 32);
  addPalisadeRing(group, mats.wood, w * 1.16, h * 0.38, 0.24, 20);
  addBox(group, mats.primary, w * 1.0, h * 0.32, w * 0.68, -w * 0.3, 0.32, w * 0.08);
  addStrategyGableRoof(group, roofMat, mats.dark, w * 1.02, h * 0.4, -w * 0.3, h * 0.58, w * 0.08, 0.82);
  addVillageRoofTrim(group, mats.accent, w * 0.92, h, -w * 0.36, h * 0.66, 5);
  addBox(group, mats.dark, w * 0.36, h * 0.16, 0.055, -w * 0.28, h * 0.16, -w * 0.27);
  addTrainingDummy(group, mats, w * 0.48, 0.28, -w * 0.2, w * 0.66);
  addTrainingDummy(group, mats, w * 0.1, 0.28, w * 0.5, w * 0.52);
  addFlag(group, mats.accent, mats.dark, w * 0.86, h * 0.84, -w * 0.45, h * 0.76);
  addFlag(group, roofMat, mats.dark, -w * 0.86, h * 0.75, -w * 0.58, h * 0.64);
  addShield(group, mats.glow, w * 0.4, h * 0.36, -w * 0.72, w * 0.28);
  addVillageLevelBadge(group, mats, -w * 0.28, h * 0.64, -w * 0.36, w * 0.38, 2);
  addWeaponRack(group, mats, w * 0.68, h * 0.28, w * 0.28, w * 0.5);
  addBox(group, mats.metal, w * 0.8, h * 0.035, 0.035, w * 0.22, h * 0.44, -w * 0.7).rotation.z = 0.18;
  addBox(group, mats.metal, w * 0.8, h * 0.035, 0.035, w * 0.18, h * 0.48, -w * 0.7).rotation.z = -0.18;
}

function buildGemVault({ group, mats, h, w }) {
  const gold = solidMaterial("#ffd34f", { roughness: 0.34, metalness: 0.28, emissive: "#5f3f00", emissiveIntensity: 0.06 });
  const purple = solidMaterial("#8a4dff", { roughness: 0.42, metalness: 0.04, emissive: "#331064", emissiveIntensity: 0.08 });
  addBox(group, mats.outline, w * 1.82, h * 0.12, w * 1.08, 0, 0.26, 0);
  addCylinder(group, mats.primary, w * 0.86, h * 0.32, 0, 0.3, 0, 28).scale.z = 0.78;
  const belly = addSphere(group, mats.secondary, w * 0.86, 0, h * 0.48, 0);
  belly.scale.set(1.1, 0.68, 0.8);

  for (const x of [-0.72, 0.72]) {
    addCylinder(group, mats.outline, w * 0.2, h * 0.6, x * w, 0.3, -w * 0.02, 16);
    addCylinder(group, gold, w * 0.16, h * 0.58, x * w, 0.34, -w * 0.02, 16);
    addSphere(group, gold, w * 0.2, x * w, h * 0.93, -w * 0.02).scale.y = 0.35;
  }

  addBox(group, gold, w * 1.58, h * 0.09, 0.08, 0, h * 0.44, -w * 0.68);
  addBox(group, gold, 0.09, h * 0.55, 0.08, -w * 0.55, h * 0.17, -w * 0.69);
  addBox(group, gold, 0.09, h * 0.55, 0.08, w * 0.55, h * 0.17, -w * 0.69);
  const doorBack = addCylinder(group, mats.outline, w * 0.48, w * 0.11, 0, h * 0.5, -w * 0.76, 28);
  doorBack.rotation.x = Math.PI / 2;
  const door = addCylinder(group, mats.dark, w * 0.39, w * 0.12, 0, h * 0.53, -w * 0.8, 28);
  door.rotation.x = Math.PI / 2;
  addTorus(group, gold, w * 0.38, 0.035, 0, h * 0.59, -w * 0.86);
  addOctahedron(group, mats.glow, w * 0.34, 0, h * 0.64, -w * 0.93);
  addBox(group, purple, w * 0.26, h * 0.2, 0.06, 0, h * 0.24, -w * 0.92);
  addBoltRow(group, mats.outline, w * 1.42, 0, h * 0.34, -w * 0.76, 9);

  addCrystalCluster(group, mats.glow, -w * 0.52, h * 0.76, -w * 0.24, w * 0.7);
  addCrystalCluster(group, mats.glow, w * 0.5, h * 0.74, -w * 0.2, w * 0.62);
  addCrystalCluster(group, mats.glow, 0, h * 0.95, w * 0.08, w * 0.56);
}

function buildFlameTower({ group, mats, h, w }) {
  const hot = solidMaterial("#ffe7a1", { emissive: "#ff931f", emissiveIntensity: 0.45, roughness: 0.5 });
  addBox(group, mats.outline, w * 1.35, h * 0.14, w * 1.25, 0, 0.26, 0);
  addCylinder(group, mats.dark, w * 0.64, h * 0.16, 0, 0.32, 0, 14);
  addCylinder(group, mats.primary, w * 0.5, h * 0.74, 0, 0.42, 0, 18);
  addTorus(group, mats.metal, w * 0.52, 0.055, 0, h * 0.62, 0).rotation.x = Math.PI / 2;
  addTorus(group, mats.outline, w * 0.58, 0.05, 0, h * 0.94, 0).rotation.x = Math.PI / 2;
  addCylinder(group, mats.secondary, w * 0.4, h * 0.28, 0, h * 0.9, 0, 16);
  addCone(group, mats.outline, w * 0.55, h * 0.2, 0, h * 1.16, 0, 8);

  for (const x of [-0.7, 0.7]) {
    addCylinder(group, mats.metal, w * 0.13, h * 0.72, x * w, 0.34, w * 0.14, 12);
    addCylinder(group, mats.accent, w * 0.16, h * 0.36, x * w, h * 0.42, w * 0.14, 12);
    addSphere(group, mats.glow, w * 0.13, x * w, h * 1.14, w * 0.14);
  }

  const barrelLength = w * 1.05;
  const barrel = addCylinder(group, mats.secondary, w * 0.2, barrelLength, 0, h * 0.78 - barrelLength * 0.5, -w * 0.62, 18);
  barrel.rotation.x = Math.PI / 2;
  const muzzle = addCylinder(group, mats.outline, w * 0.3, w * 0.2, 0, h * 0.78 - w * 0.1, -w * 1.18, 18);
  muzzle.rotation.x = Math.PI / 2;
  const flame1 = addCone(group, mats.glow, w * 0.32, h * 0.6, 0, h * 0.63, -w * 1.36, 14);
  flame1.rotation.x = -0.85;
  const flame2 = addCone(group, mats.accent, w * 0.22, h * 0.42, 0, h * 0.78, -w * 1.5, 12);
  flame2.rotation.x = -0.85;
  const flame3 = addCone(group, hot, w * 0.12, h * 0.28, 0, h * 0.95, -w * 1.6, 10);
  flame3.rotation.x = -0.85;
  addBoltRow(group, mats.outline, w * 1.02, 0, h * 0.54, -w * 0.54, 7);
  addSpikeRow(group, mats.outline, w * 1.0, h * 0.38, -w * 0.66, 7, h * 0.22);
  for (let i = 0; i < 9; i += 1) addSphere(group, i % 2 ? hot : mats.glow, w * (0.045 + (i % 3) * 0.012), (i - 4) * w * 0.08, h * (0.86 + i * 0.025), -w * (1.22 + i * 0.05));
}

function buildDragonHatchery({ group, mats, h, w }) {
  const shellMat = surfaceMaterial("shellBand", PALETTES.shellHut, "wyvern-shell");
  const strawMat = surfaceMaterial("nestStrawShell", PALETTES.hatchery, "wyvern-straw");
  const boneMat = surfaceMaterial("hunterBone", PALETTES.ribStorehouse, "wyvern-bone");

  addCylinder(group, mats.dark, w * 1.05, h * 0.08, 0, 0.2, 0, 22).scale.z = 0.82;
  addTorus(group, strawMat, w * 0.98, w * 0.18, 0, h * 0.24, 0).rotation.x = Math.PI / 2;
  addTorus(group, mats.primary, w * 0.68, w * 0.1, 0, h * 0.38, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 14; i += 1) {
    const a = (Math.PI * 2 * i) / 14;
    const twig = addBox(group, strawMat, w * 0.64, h * 0.055, w * 0.065, Math.sin(a) * w * 0.82, h * 0.22, Math.cos(a) * w * 0.82);
    twig.rotation.y = -a + 0.45;
    twig.rotation.z = (i % 2 ? -1 : 1) * 0.12;
  }

  const egg = addSphere(group, shellMat, w * 0.58, 0, h * 0.68, 0);
  egg.scale.set(0.82, 1.56, 0.86);
  addTorus(group, mats.dark, w * 0.5, 0.045, 0, h * 0.64, -w * 0.02).rotation.x = Math.PI / 2;
  const crackedTop = addCone(group, shellMat, w * 0.48, h * 0.24, 0, h * 1.14, 0, 7);
  crackedTop.rotation.y = Math.PI / 7;
  addTorus(group, mats.glow, w * 0.48, 0.04, 0, h * 0.74, -w * 0.03).rotation.x = Math.PI / 2;
  addSphere(group, mats.glow, w * 0.21, 0, h * 0.75, -w * 0.34).scale.y = 0.68;

  for (let i = 0; i < 9; i += 1) {
    const x = -w * 0.36 + i * w * 0.09;
    const shard = addCone(group, i % 2 ? shellMat : mats.secondary, w * 0.045, h * (0.14 + (i % 3) * 0.045), x, h * 0.92, -w * 0.37, 3);
    shard.rotation.x = -0.65;
    shard.rotation.z = (i - 4) * 0.08;
  }

  for (let i = 0; i < 12; i += 1) {
    const a = (Math.PI * 2 * i) / 12;
    const claw = addCone(group, boneMat, w * 0.085, h * 0.34, Math.sin(a) * w * 1.02, h * 0.3, Math.cos(a) * w * 1.02, 8);
    claw.rotation.z = Math.sin(a) * 0.42;
    claw.rotation.x = Math.cos(a) * -0.42;
  }
  for (const x of [-0.46, 0.46]) {
    const wing = addBox(group, mats.accent, w * 0.52, h * 0.1, w * 0.24, x * w * 1.04, h * 0.68, -w * 0.18);
    wing.rotation.z = x < 0 ? 0.42 : -0.42;
    wing.rotation.y = x < 0 ? -0.35 : 0.35;
    const shellShard = addCone(group, shellMat, w * 0.18, h * 0.4, x * w * 0.82, h * 0.78, w * 0.26, 3);
    shellShard.rotation.z = x < 0 ? 0.48 : -0.48;
  }
  addBox(group, mats.dark, w * 0.48, h * 0.18, 0.07, 0, h * 0.4, -w * 0.78);
  addBoltRow(group, boneMat, w * 0.58, 0, h * 0.54, -w * 0.82, 5);
}

function addArenaCrenels(group, mat, startX, endX, y, z, count, blockWidth, blockHeight, depth) {
  for (let i = 0; i < count; i += 1) {
    const x = startX + (i / Math.max(1, count - 1)) * (endX - startX);
    addBox(group, mat, blockWidth, blockHeight, depth, x, y, z);
  }
}

function addFrontRune(group, mat, radius, tube, x, y, z) {
  return addTorus(group, mat, radius, tube, x, y, z);
}

function addRoyalBanner(group, clothMat, trimMat, x, y, z, height, side = 1) {
  const width = height * 0.28;
  addCylinder(group, trimMat, height * 0.018, height, x, y - height, z, 6);
  addBox(group, trimMat, width * 1.18, height * 0.06, 0.05, x + side * width * 0.36, y - height * 0.18, z);
  addBox(group, clothMat, width, height * 0.58, 0.045, x + side * width * 0.48, y - height * 0.74, z);
  addBox(group, trimMat, width * 0.72, height * 0.055, 0.05, x + side * width * 0.48, y - height * 0.5, z - 0.005);
}

function addCardFrame(group, mat, width, height, z, bottomY, w) {
  const strip = Math.min(w * 0.1, height * 0.08);
  addBox(group, mat, width * 1.08, strip, w * 0.09, 0, bottomY, z);
  addBox(group, mat, width * 1.08, strip, w * 0.09, 0, bottomY + height - strip, z);
  addBox(group, mat, strip, height, w * 0.09, -width * 0.5, bottomY, z);
  addBox(group, mat, strip, height, w * 0.09, width * 0.5, bottomY, z);
  addBox(group, mat, strip * 1.25, strip * 1.25, w * 0.1, -width * 0.5, bottomY + height - strip * 1.25, z);
  addBox(group, mat, strip * 1.25, strip * 1.25, w * 0.1, width * 0.5, bottomY + height - strip * 1.25, z);
}

function addArenaTiles(group, blue, blueLight, red, redLight, w, h) {
  const cols = 6;
  const rows = 4;
  const width = w * 1.62;
  const depth = w * 1.02;
  const tileW = width / cols;
  const tileD = depth / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const isBlueSide = row < rows / 2;
      const mat = (row + col) % 2
        ? (isBlueSide ? blue : red)
        : (isBlueSide ? blueLight : redLight);
      addBox(
        group,
        mat,
        tileW * 0.96,
        h * 0.025,
        tileD * 0.96,
        -width / 2 + tileW / 2 + col * tileW,
        h * 0.43,
        -depth / 2 + tileD / 2 + row * tileD
      );
    }
  }
}

function addArenaCardPanel(group, faceMat, trimMat, x, y, z, width, height, tilt = 0) {
  const depth = width * 0.08;
  const back = addBox(group, trimMat, width * 1.18, height * 1.16, depth, x, y, z);
  const face = addBox(group, faceMat, width, height, depth * 1.08, x, y + height * 0.07, z - depth * 0.58);
  const top = addBox(group, trimMat, width * 0.78, height * 0.055, depth * 1.18, x, y + height * 0.9, z - depth * 1.12);
  const bottom = addBox(group, trimMat, width * 0.78, height * 0.055, depth * 1.18, x, y + height * 0.22, z - depth * 1.12);
  const pip = addCylinder(group, trimMat, width * 0.12, depth * 1.3, x, y + height * 0.52, z - depth * 1.26, 5);
  pip.rotation.x = Math.PI / 2;
  for (const mesh of [back, face, top, bottom, pip]) mesh.rotation.z = tilt;
  return face;
}

function addArenaCrownBadge(group, faceMat, trimMat, x, y, z, size) {
  const disk = addCylinder(group, faceMat, size * 0.34, size * 0.06, x, y, z, 28);
  disk.rotation.x = Math.PI / 2;
  addFrontRune(group, trimMat, size * 0.34, size * 0.024, x, y, z - size * 0.05);
  addCrown(group, trimMat, x, y + size * 0.08, z - size * 0.07, size * 0.44);
}

function addArenaRewardChest(group, bodyMat, trimMat, gemMat, x, y, z, width) {
  addBox(group, bodyMat, width, width * 0.38, width * 0.5, x, y, z);
  addBox(group, trimMat, width * 1.08, width * 0.1, width * 0.56, x, y + width * 0.38, z);
  addBox(group, trimMat, width * 0.1, width * 0.48, width * 0.58, x - width * 0.32, y, z);
  addBox(group, trimMat, width * 0.1, width * 0.48, width * 0.58, x + width * 0.32, y, z);
  addBox(group, trimMat, width * 0.62, width * 0.075, width * 0.62, x, y + width * 0.18, z);
  addBox(group, gemMat, width * 0.22, width * 0.2, width * 0.055, x, y + width * 0.16, z - width * 0.3);
  addOctahedron(group, gemMat, width * 0.12, x, y + width * 0.58, z - width * 0.1);
}

function addArenaTeamMarks(group, blue, red, gold, w, h, z) {
  addArenaCardPanel(group, blue, gold, -w * 0.72, h * 0.42, z, w * 0.34, h * 0.42, -0.12);
  addArenaCardPanel(group, red, gold, w * 0.72, h * 0.42, z, w * 0.34, h * 0.42, 0.12);
  addArenaCrownBadge(group, blue, gold, -w * 0.72, h * 0.95, z - w * 0.04, w * 0.42);
  addArenaCrownBadge(group, red, gold, w * 0.72, h * 0.95, z - w * 0.04, w * 0.42);
}

function buildCrownGate({ group, mats, h, w }) {
  const blue = solidMaterial("#1f55a7", { roughness: 0.42, metalness: 0.05 });
  const red = solidMaterial("#d83c4c", { roughness: 0.42, metalness: 0.05 });
  const gold = solidMaterial("#f0b533", { roughness: 0.3, metalness: 0.55 });
  const cream = solidMaterial("#f7f3e8", { roughness: 0.42, metalness: 0.02 });

  addBox(group, mats.outline, w * 1.9, h * 0.68, w * 0.78, 0, 0.24, w * 0.03);
  addBox(group, blue, w * 0.56, h * 0.64, w * 0.74, -w * 0.5, 0.3, 0);
  addBox(group, red, w * 0.56, h * 0.64, w * 0.74, w * 0.5, 0.3, 0);
  addBox(group, mats.primary, w * 0.46, h * 0.58, w * 0.72, 0, 0.32, 0);
  addBox(group, gold, w * 1.62, h * 0.09, w * 0.8, 0, h * 0.66, 0);
  addBox(group, mats.secondary, w * 1.5, h * 0.22, w * 0.76, 0, h * 0.72, 0);
  addBox(group, mats.dark, w * 0.64, h * 0.45, 0.065, 0, 0.36, -w * 0.43);
  addBox(group, gold, w * 0.78, h * 0.075, 0.07, 0, h * 0.7, -w * 0.48);
  addArenaCrenels(group, gold, -w * 0.78, w * 0.78, h * 0.96, -w * 0.03, 9, w * 0.12, h * 0.15, w * 0.78);

  for (const x of [-w * 0.86, w * 0.86]) {
    const teamMat = x < 0 ? blue : red;
    addCylinder(group, mats.outline, w * 0.31, h * 0.8, x, 0.26, 0, 18);
    addCylinder(group, teamMat, w * 0.26, h * 0.78, x, 0.3, 0, 18);
    addBox(group, gold, w * 0.14, h * 0.72, 0.065, x, h * 0.36, -w * 0.31);
    addCylinder(group, gold, w * 0.29, h * 0.09, x, h * 0.99, 0, 18);
    addArenaCrenels(group, gold, x - w * 0.23, x + w * 0.23, h * 1.09, 0, 3, w * 0.11, h * 0.13, w * 0.28);
    addShield(group, cream, w * 0.24, h * 0.57, -w * 0.42, x);
    addCrown(group, gold, x, h * 0.68, -w * 0.45, w * 0.24);
  }

  addArenaCardPanel(group, cream, gold, 0, h * 0.28, -w * 0.55, w * 0.5, h * 0.5, 0);
  addCrown(group, gold, 0, h * 1.18, -w * 0.04, w * 0.96);
  addFrontRune(group, mats.glow, w * 0.46, 0.045, 0, h * 0.63, -w * 0.5);
  addFrontRune(group, gold, w * 0.76, 0.03, 0, h * 0.63, -w * 0.52);
  addFrontRune(group, blue, w * 0.92, 0.018, -w * 0.14, h * 0.63, -w * 0.54);
  addFrontRune(group, red, w * 0.92, 0.018, w * 0.14, h * 0.63, -w * 0.54);
  addRoyalBanner(group, blue, gold, -w * 1.16, h * 0.88, -w * 0.35, h * 0.64, -1);
  addRoyalBanner(group, red, gold, w * 1.16, h * 0.88, -w * 0.35, h * 0.64, 1);
  addArenaTeamMarks(group, blue, red, gold, w, h, -w * 0.72);
}

function buildManaTower({ group, mats, h, w }) {
  const blue = solidMaterial("#2f75d6", { roughness: 0.5 });
  const red = solidMaterial("#d83c4c", { roughness: 0.5 });
  const gold = solidMaterial("#f7d35f", { roughness: 0.28, metalness: 0.45 });

  addCylinder(group, mats.outline, w * 0.62, h * 0.72, 0, 0.24, 0, 18);
  addCylinder(group, mats.primary, w * 0.52, h * 0.7, 0, 0.3, 0, 18);
  addBox(group, blue, w * 0.42, h * 0.62, 0.06, -w * 0.18, h * 0.36, -w * 0.48);
  addBox(group, red, w * 0.42, h * 0.62, 0.06, w * 0.18, h * 0.36, -w * 0.49);
  addCylinder(group, gold, w * 0.49, h * 0.08, 0, h * 0.92, 0, 18);
  addArenaCrenels(group, gold, -w * 0.38, w * 0.38, h * 1.0, -w * 0.02, 5, w * 0.11, h * 0.12, w * 0.25);
  addCone(group, mats.secondary, w * 0.48, h * 0.18, 0, h * 1.08, 0, 6);
  addCrown(group, gold, 0, h * 1.25, -w * 0.04, w * 0.48);

  addBox(group, blue, w * 0.22, h * 0.7, 0.06, -w * 0.32, h * 0.28, -w * 0.58);
  addBox(group, red, w * 0.22, h * 0.7, 0.06, w * 0.32, h * 0.28, -w * 0.58);
  addBox(group, gold, w * 0.58, h * 0.06, 0.06, 0, h * 0.25, -w * 0.48);
  addFrontRune(group, mats.glow, w * 0.38, 0.035, 0, h * 0.62, -w * 0.58);
  addFrontRune(group, gold, w * 0.58, 0.023, 0, h * 0.62, -w * 0.6);

  addOctahedron(group, mats.glow, w * 0.24, 0, h * 1.42, 0);
  addOctahedron(group, blue, w * 0.13, -w * 0.28, h * 1.22, -w * 0.06);
  addOctahedron(group, red, w * 0.13, w * 0.28, h * 1.22, -w * 0.06);
  addFrontRune(group, mats.glow, w * 0.48, 0.026, 0, h * 1.42, 0);
  addFrontRune(group, gold, w * 0.64, 0.018, 0, h * 1.42, -w * 0.02);
  addRoyalBanner(group, blue, gold, -w * 0.82, h * 1.02, -w * 0.24, h * 0.62, -1);
  addRoyalBanner(group, red, gold, w * 0.82, h * 1.02, -w * 0.24, h * 0.62, 1);
  addArenaCardPanel(group, blue, gold, -w * 0.55, h * 0.34, -w * 0.68, w * 0.3, h * 0.42, -0.08);
  addArenaCardPanel(group, red, gold, w * 0.55, h * 0.34, -w * 0.68, w * 0.3, h * 0.42, 0.08);
}

function buildCardHall({ group, mats, h, w }) {
  const blue = solidMaterial("#1f55a7", { roughness: 0.44 });
  const red = solidMaterial("#d83c4c", { roughness: 0.44 });
  const gold = solidMaterial("#f0bf4d", { roughness: 0.26, metalness: 0.48 });
  const cream = solidMaterial("#f7f3e8", { roughness: 0.4 });

  const back = addBox(group, mats.outline, w * 1.34, h * 0.98, w * 0.28, 0, 0.18, 0);
  back.rotation.z = 0.02;
  const card = addBox(group, cream, w * 1.16, h * 0.9, w * 0.22, 0, 0.26, -w * 0.02);
  card.rotation.z = 0.02;
  addCardFrame(group, gold, w * 1.16, h * 0.9, -w * 0.16, h * 0.26, w);
  addCardFrame(group, mats.primary, w * 0.82, h * 0.58, -w * 0.22, h * 0.42, w);

  const crest = addCylinder(group, mats.glow, w * 0.25, 0.055, 0, h * 0.62, -w * 0.18, 36);
  crest.rotation.x = Math.PI / 2;
  addShield(group, blue, w * 0.26, h * 0.62, -w * 0.26, -w * 0.22);
  addShield(group, red, w * 0.26, h * 0.62, -w * 0.26, w * 0.22);
  addCrown(group, gold, 0, h * 1.15, -w * 0.06, w * 0.58);
  addArenaCrownBadge(group, mats.glow, gold, 0, h * 0.86, -w * 0.27, w * 0.42);

  for (const x of [-w * 0.68, w * 0.68]) {
    addCylinder(group, mats.secondary, w * 0.14, h * 0.68, x, 0.3, 0, 12);
    addCylinder(group, gold, w * 0.16, h * 0.08, x, h * 0.96, 0, 12);
    addCrown(group, gold, x, h * 1.08, -w * 0.02, w * 0.24);
  }
  addArenaCardPanel(group, blue, gold, -w * 0.68, h * 0.38, -w * 0.31, w * 0.38, h * 0.56, -0.14);
  addArenaCardPanel(group, red, gold, w * 0.68, h * 0.38, -w * 0.31, w * 0.38, h * 0.56, 0.14);
  addArenaCardPanel(group, blue, gold, -w * 1.0, h * 0.34, -w * 0.18, w * 0.24, h * 0.38, 0.18);
  addArenaCardPanel(group, red, gold, w * 1.0, h * 0.34, -w * 0.18, w * 0.24, h * 0.38, -0.18);
}

function buildBattleCourt({ group, mats, h, w }) {
  const blue = solidMaterial("#256bd8", { roughness: 0.42 });
  const blueLight = solidMaterial("#77a7ff", { roughness: 0.42 });
  const red = solidMaterial("#d66b2a", { roughness: 0.42 });
  const redLight = solidMaterial("#f3a35d", { roughness: 0.42 });
  const gold = solidMaterial("#e9e3d0", { roughness: 0.28, metalness: 0.18 });

  addBox(group, mats.outline, w * 1.98, h * 0.13, w * 1.42, 0, 0.26, 0);
  addBox(group, mats.primary, w * 1.84, h * 0.1, w * 1.28, 0, 0.32, 0);
  addArenaTiles(group, blue, blueLight, red, redLight, w, h);
  addBox(group, gold, w * 1.92, h * 0.09, w * 0.08, 0, h * 0.47, -w * 0.68);
  addBox(group, gold, w * 1.92, h * 0.09, w * 0.08, 0, h * 0.47, w * 0.68);
  addBox(group, gold, w * 0.08, h * 0.09, w * 1.36, -w * 0.96, h * 0.47, 0);
  addBox(group, gold, w * 0.08, h * 0.09, w * 1.36, w * 0.96, h * 0.47, 0);
  addBox(group, gold, w * 0.08, h * 0.05, w * 1.22, 0, h * 0.5, 0);
  addBox(group, gold, w * 1.7, h * 0.05, w * 0.08, 0, h * 0.5, 0);
  addBox(group, blue, w * 1.54, h * 0.04, w * 0.16, 0, h * 0.53, -w * 0.32);
  addBox(group, red, w * 1.54, h * 0.04, w * 0.16, 0, h * 0.53, w * 0.32);
  addBox(group, mats.outline, w * 0.12, h * 0.08, w * 1.28, -w * 0.36, h * 0.55, 0);
  addBox(group, mats.outline, w * 0.12, h * 0.08, w * 1.28, w * 0.36, h * 0.55, 0);

  addTorus(group, mats.glow, w * 0.36, 0.035, 0, h * 0.56, 0).rotation.x = Math.PI / 2;
  addTorus(group, mats.accent, w * 0.62, 0.025, 0, h * 0.53, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i += 1) {
    const x = i < 2 ? -w * 0.82 : w * 0.82;
    const z = i % 2 ? -w * 0.54 : w * 0.54;
    const teamMat = z < 0 ? blue : red;
    addCylinder(group, mats.outline, w * 0.17, h * 0.33, x, h * 0.42, z, 10);
    addCylinder(group, teamMat, w * 0.13, h * 0.3, x, h * 0.46, z, 10);
    addCrown(group, gold, x, h * 0.8, z, w * 0.28);
  }
  addArenaCrownBadge(group, blue, gold, 0, h * 0.72, -w * 0.44, w * 0.34);
  addArenaCrownBadge(group, red, gold, 0, h * 0.72, w * 0.44, w * 0.34);
  addArenaCardPanel(group, blueLight, gold, -w * 1.18, h * 0.42, -w * 0.15, w * 0.28, h * 0.36, -0.08);
  addArenaCardPanel(group, redLight, gold, w * 1.18, h * 0.42, w * 0.15, w * 0.28, h * 0.36, 0.08);
}

function buildChestWorkshop({ group, mats, h, w }) {
  const band = solidMaterial("#ffd14d", { roughness: 0.36, metalness: 0.26, emissive: "#6c4700", emissiveIntensity: 0.04 });
  const green = solidMaterial("#28c789", { roughness: 0.42, metalness: 0.04, emissive: "#064d2c", emissiveIntensity: 0.05 });
  addBox(group, mats.outline, w * 1.72, h * 0.12, w * 1.0, 0, 0.26, 0);
  addBox(group, mats.primary, w * 1.58, h * 0.42, w * 0.9, 0, 0.32, 0);
  const lidLength = w * 1.58;
  const lidCenterY = h * 0.72;
  const lid = addCylinder(group, mats.secondary, h * 0.24, lidLength, 0, lidCenterY - lidLength * 0.5, 0, 24);
  lid.rotation.z = Math.PI / 2;
  lid.scale.z = 1.82;
  addBox(group, mats.outline, w * 1.7, h * 0.07, w * 0.98, 0, h * 0.42, 0);
  for (const x of [-0.62, 0, 0.62]) addBox(group, band, w * 0.1, h * 0.74, w * 0.98, x * w, h * 0.28, 0);
  addBox(group, band, w * 1.72, h * 0.08, 0.09, 0, h * 0.58, -w * 0.58);
  addBox(group, band, w * 1.5, h * 0.08, 0.08, 0, h * 0.24, -w * 0.58);
  addBox(group, mats.outline, w * 0.44, h * 0.34, 0.09, 0, h * 0.34, -w * 0.63);
  addBox(group, green, w * 0.32, h * 0.24, 0.1, 0, h * 0.4, -w * 0.68);
  addOctahedron(group, mats.glow, w * 0.16, 0, h * 0.56, -w * 0.76);
  addBoltRow(group, mats.outline, w * 1.48, 0, h * 0.33, -w * 0.62, 9);
  addToyStuds(group, band, w * 1.18, w * 0.58, 0, h * 0.96, 0, 5, 1, w * 0.052);

  for (const x of [-0.58, 0.58]) {
    addCylinder(group, mats.dark, w * 0.1, h * 0.58, x * w, h * 0.38, w * 0.28, 12);
    addSphere(group, mats.glow, w * 0.09, x * w, h * 1.02, w * 0.28);
  }
  addHammer(group, mats.metal, band, -w * 0.54, h * 1.12, -w * 0.24, w * 0.34);
  addHammer(group, band, mats.metal, w * 0.48, h * 1.02, -w * 0.22, w * 0.3);
  addCrystalCluster(group, mats.glow, w * 0.48, h * 0.72, -w * 0.5, w * 0.5);
  addBox(group, mats.dark, w * 0.48, h * 0.1, w * 0.34, -w * 0.52, h * 0.25, -w * 0.72);
}

function buildRoyalBarracks({ group, mats, h, w }) {
  const roofMat = surfaceMaterial("brightRoofTile", PALETTES.royalArena, "royal-barracks-roof");
  addStrategyStoneBase(group, mats, w, h, 1.05);
  addBox(group, mats.secondary, w * 0.86, h * 0.5, w * 0.7, 0, h * 0.42, 0);
  addBox(group, mats.dark, w * 1.5, h * 0.08, w * 0.08, 0, h * 0.55, -w * 0.58);
  for (const x of [-0.62, 0.62]) {
    addCylinder(group, mats.primary, w * 0.28, h * 0.66, x * w, 0.3, -w * 0.02, 12);
    addTorus(group, mats.dark, w * 0.29, 0.035, x * w, h * 0.72, -w * 0.02).rotation.x = Math.PI / 2;
    addCone(group, roofMat, w * 0.36, h * 0.3, x * w, h * 0.94, -w * 0.02, 6);
    addFlag(group, mats.accent, mats.dark, x * w, h * 1.24, -w * 0.02, h * 0.48);
    addVillageLevelBadge(group, mats, x * w, h * 0.48, -w * 0.34, w * 0.28, 1);
  }
  addStrategyGableRoof(group, roofMat, mats.dark, w * 1.34, h * 0.5, 0, h * 0.78, 0, 0.94);
  addVillageRoofTrim(group, mats.accent, w * 1.18, h, -w * 0.58, h * 0.9, 7);
  addCrown(group, mats.accent, 0, h * 1.16, -w * 0.56, w * 0.7);
  addColumnRow(group, mats.metal, -w * 0.52, w * 0.52, h * 0.32, -w * 0.54, 5);
  addShield(group, mats.glow, w * 0.46, h * 0.44, -w * 0.62, 0);
  addShield(group, mats.accent, w * 0.28, h * 0.37, -w * 0.63, -w * 0.46);
  addShield(group, mats.accent, w * 0.28, h * 0.37, -w * 0.63, w * 0.46);
  addWeaponRack(group, mats, -w * 0.5, h * 0.2, -w * 0.68, w * 0.42);
  addWeaponRack(group, mats, w * 0.5, h * 0.2, -w * 0.68, w * 0.42);
}

function buildElixirMill({ group, mats, h, w }) {
  const roofMat = surfaceMaterial("brightRoofTile", PALETTES.gemVault, "elixir-roof");
  const liquidMat = surfaceMaterial("glowingGem", PALETTES.gemVault, "elixir-liquid");
  addBox(group, mats.primary, w * 1.3, h * 0.3, w * 0.86, 0, 0.26, 0);
  addBox(group, mats.dark, w * 1.42, h * 0.08, w * 0.92, 0, h * 0.28, 0);
  addStrategyGableRoof(group, roofMat, mats.dark, w * 1.05, h * 0.32, -w * 0.18, h * 0.54, 0, 0.82);
  addVillageRoofTrim(group, mats.glow, w * 0.95, h, -w * 0.45, h * 0.61, 5);
  for (const x of [w * 0.32, w * 0.68]) {
    addCylinder(group, mats.dark, w * 0.23, h * 0.62, x, 0.28, -w * 0.12, 18);
    const tank = addCylinder(group, liquidMat, w * 0.19, h * 0.58, x, 0.34, -w * 0.12, 18);
    tank.scale.y = 1.08;
    addTorus(group, mats.metal, w * 0.2, 0.024, x, h * 0.46, -w * 0.12).rotation.x = Math.PI / 2;
    addTorus(group, mats.metal, w * 0.2, 0.024, x, h * 0.68, -w * 0.12).rotation.x = Math.PI / 2;
  }
  addOctahedron(group, liquidMat, w * 0.24, -w * 0.4, h * 0.72, -w * 0.52);
  addVillageLevelBadge(group, mats, -w * 0.22, h * 0.38, -w * 0.52, w * 0.42, 3);
  addTube(group, mats.metal, [
    new THREE.Vector3(w * 0.18, h * 0.45, -w * 0.12),
    new THREE.Vector3(w * 0.02, h * 0.56, -w * 0.42),
    new THREE.Vector3(-w * 0.34, h * 0.5, -w * 0.5)
  ], 0.035);
  addTube(group, mats.metal, [
    new THREE.Vector3(w * 0.66, h * 0.54, -w * 0.12),
    new THREE.Vector3(w * 0.46, h * 0.62, -w * 0.48),
    new THREE.Vector3(-w * 0.06, h * 0.56, -w * 0.52)
  ], 0.03);
  addCylinder(group, mats.dark, w * 0.08, h * 0.7, -w * 0.78, h * 0.26, -w * 0.48, 8);
  for (let i = 0; i < 4; i += 1) {
    const blade = addBox(group, mats.accent, w * 0.12, h * 0.5, 0.04, -w * 0.78, h * 0.96, -w * 0.48);
    blade.rotation.z = (Math.PI * i) / 2;
  }
  addFlag(group, mats.accent, mats.dark, -w * 0.58, h * 0.76, w * 0.32, h * 0.42);
}

function buildCannonBakery({ group, mats, h, w }) {
  const roofMat = surfaceMaterial("brightRoofTile", PALETTES.trainingYard, "cannon-roof");
  addCylinder(group, mats.primary, w * 0.74, h * 0.42, 0, 0.24, 0, 18);
  addTorus(group, mats.dark, w * 0.76, 0.055, 0, h * 0.46, 0).rotation.x = Math.PI / 2;
  const roof = addSphere(group, roofMat, w * 0.82, 0, h * 0.66, 0);
  roof.scale.y = 0.38;
  addVillageRoofTrim(group, mats.accent, w * 1.16, h, -w * 0.5, h * 0.76, 7);
  addBox(group, mats.dark, w * 0.58, h * 0.14, 0.06, 0, h * 0.2, -w * 0.59);
  addBox(group, mats.glow, w * 0.34, h * 0.08, 0.07, 0, h * 0.25, -w * 0.64);
  addGameCannon(group, mats, 0, h * 0.18, -w * 0.66, w * 1.12);
  addGameCannon(group, mats, -w * 0.46, h * 0.12, -w * 0.36, w * 0.52, -0.3);
  addGameCannon(group, mats, w * 0.46, h * 0.12, -w * 0.36, w * 0.52, 0.3);
  addCylinder(group, mats.dark, w * 0.09, h * 0.5, w * 0.42, h * 0.48, w * 0.16, 10);
  addSphere(group, solidMaterial("#6b747a", { transparent: true, opacity: 0.38, roughness: 1 }), w * 0.18, -w * 0.12, h * 0.9, -w * 1.06);
  addSphere(group, mats.dark, w * 0.1, -w * 0.54, h * 0.2, -w * 0.88);
  addSphere(group, mats.dark, w * 0.1, w * 0.55, h * 0.2, -w * 0.88);
  addVillageLevelBadge(group, mats, 0, h * 0.48, -w * 0.72, w * 0.42, 2);
  addFlag(group, mats.accent, mats.dark, -w * 0.68, h * 0.84, w * 0.12, h * 0.44);
}

function buildFestivalArena(context) {
  buildBattleCourt(context);
  const { group, mats, h, w } = context;
  const blue = solidMaterial("#256bd8", { roughness: 0.42 });
  const red = solidMaterial("#d83c4c", { roughness: 0.42 });
  const gold = solidMaterial("#f0b533", { roughness: 0.28, metalness: 0.45 });

  addCylinder(group, mats.secondary, w * 0.72, h * 0.13, 0, h * 0.54, 0, 36);
  addTorus(group, gold, w * 0.75, 0.045, 0, h * 0.7, 0).rotation.x = Math.PI / 2;
  addTorus(group, mats.glow, w * 0.48, 0.03, 0, h * 0.73, 0).rotation.x = Math.PI / 2;
  addBox(group, mats.dark, w * 0.62, h * 0.18, w * 0.38, 0, h * 0.75, 0);
  addBox(group, gold, w * 0.68, h * 0.07, w * 0.42, 0, h * 0.93, 0);
  addCrown(group, gold, 0, h * 1.07, -w * 0.04, w * 0.42);
  addArenaRewardChest(group, mats.wood, gold, mats.glow, 0, h * 0.95, -w * 0.04, w * 0.48);
  addFrontRune(group, mats.glow, w * 0.55, 0.022, 0, h * 0.9, -w * 0.12);
  addFrontRune(group, gold, w * 0.72, 0.02, 0, h * 0.9, -w * 0.14);

  for (const side of [-1, 1]) {
    const mat = side < 0 ? blue : red;
    addRoyalBanner(group, mat, gold, side * w * 1.1, h * 1.08, -w * 0.62, h * 0.62, side);
    addBox(group, mat, w * 0.36, h * 0.16, w * 0.12, side * w * 0.42, h * 0.76, -w * 0.2);
    addShield(group, mat, w * 0.2, h * 0.9, -w * 0.28, side * w * 0.42);
    addArenaCardPanel(group, mat, gold, side * w * 0.92, h * 0.62, -w * 0.44, w * 0.28, h * 0.44, side * 0.12);
    addArenaCrownBadge(group, mat, gold, side * w * 0.5, h * 1.13, -w * 0.12, w * 0.3);
  }
  for (let i = 0; i < 6; i += 1) {
    const x = -w * 0.75 + i * w * 0.3;
    addBox(group, i % 2 ? blue : red, w * 0.16, h * 0.09, 0.05, x, h * 0.95, w * 0.68);
  }
  for (let i = 0; i < 8; i += 1) {
    const side = i % 2 ? 1 : -1;
    addRoyalBanner(group, side < 0 ? blue : red, gold, -w * 1.08 + i * w * 0.31, h * 0.82, w * 0.72, h * 0.32, side);
  }
}

function buildBoneGuildhall({ group, mats, h, w }) {
  const wood = surfaceMaterial("rootWood", PALETTES.hunterGuild, "great-horn-guild-wood");
  const hide = surfaceMaterial("hunterHide", PALETTES.hideCanteen, "great-horn-guild-hide");
  addBox(group, mats.outline, w * 1.96, h * 0.12, w * 1.16, 0, 0.24, 0);
  addBox(group, wood, w * 1.68, h * 0.42, w * 0.96, 0, 0.3, 0);
  addBox(group, mats.dark, w * 1.84, h * 0.08, w * 1.06, 0, h * 0.39, 0);
  addBox(group, wood, w * 0.42, h * 0.62, w * 0.52, -w * 0.78, 0.28, -w * 0.05);
  addBox(group, wood, w * 0.42, h * 0.62, w * 0.52, w * 0.78, 0.28, -w * 0.05);
  const roof = addCone(group, hide, w * 1.18, h * 0.34, 0, h * 0.64, 0, 4);
  roof.rotation.y = Math.PI / 4;
  addHideStitches(group, mats.bone, w * 1.4, h * 0.78, -w * 0.52, 7);
  addHunterBoneArch(group, mats.bone, 0, h * 0.25, -w * 0.59, w * 1.38, h * 0.72, 0.07);
  addHunterBoneArch(group, mats.bone, 0, h * 0.38, -w * 0.61, w * 0.86, h * 0.42, 0.045);
  addHangingTrophy(group, mats.bone, 0, h * 1.02, -w * 0.62, w * 1.08);
  addMonsterHorn(group, mats.bone, -w * 0.28, h * 0.98, -w * 0.6, -1, w * 0.96);
  addMonsterHorn(group, mats.bone, w * 0.28, h * 0.98, -w * 0.6, 1, w * 0.96);
  addMonsterHorn(group, mats.bone, -w * 0.9, h * 0.88, -w * 0.1, -1, w * 0.52);
  addMonsterHorn(group, mats.bone, w * 0.9, h * 0.88, -w * 0.1, 1, w * 0.52);
  addBoneSpikeFence(group, mats.bone, -w * 0.9, h * 0.36, -w * 0.6, w * 1.8, 9, h * 0.34, 0.18);
  for (const x of [-0.86, -0.54, 0.54, 0.86]) {
    addCone(group, mats.bone, w * 0.075, h * 0.38, x * w, h * 0.5, -w * 0.54, 8).rotation.z = x < 0 ? -0.42 : 0.42;
  }
  addBox(group, mats.glow, w * 0.44, h * 0.13, 0.055, 0, h * 0.22, -w * 0.52);
  addShield(group, mats.scale, w * 0.42, h * 0.48, -w * 0.62, -w * 0.43);
  addShield(group, mats.scale, w * 0.42, h * 0.48, -w * 0.62, w * 0.43);
  addLootBundle(group, mats, -w * 0.7, h * 0.22, -w * 0.64, w * 0.42);
  addLootBundle(group, mats, w * 0.72, h * 0.22, -w * 0.64, w * 0.38);
  addHuntingToolRack(group, mats.bone, mats.dark, 0, h * 0.7, w * 0.52, w * 0.82);
}

function buildHideCanteen({ group, mats, h, w }) {
  const wood = surfaceMaterial("rootWood", PALETTES.hideCanteen, "hide-feast-wood");
  addCylinder(group, mats.outline, w * 0.84, h * 0.08, 0, 0.24, 0, 14).scale.z = 0.78;
  addCylinder(group, wood, w * 0.78, h * 0.26, 0, 0.28, 0, 12).scale.z = 0.72;
  addHideCanopy(group, mats.hide, wood, 0, h * 0.44, 0, w * 1.78, w * 1.08, h * 0.4);
  addHideCanopy(group, mats.tertiary, wood, -w * 0.48, h * 0.62, -w * 0.02, w * 0.82, w * 0.92, h * 0.24);
  addHideStitches(group, mats.bone, w * 1.4, h * 0.62, -w * 0.54, 8);
  addCookPot(group, mats.dark, mats.glow, -w * 0.28, h * 0.29, -w * 0.48, w * 0.58);
  addBox(group, mats.bone, w * 0.84, h * 0.05, 0.05, w * 0.18, h * 0.68, -w * 0.52);
  addHangingMeat(group, solidMaterial("#b64a35", { roughness: 0.72 }), mats.bone, w * 0.02, h * 0.58, -w * 0.53, w * 0.22);
  addHangingMeat(group, solidMaterial("#7a2e24", { roughness: 0.78 }), mats.bone, w * 0.36, h * 0.58, -w * 0.53, w * 0.18);
  addHunterBoneArch(group, mats.bone, w * 0.62, h * 0.3, -w * 0.58, w * 0.5, h * 0.44, 0.038);
  addHunterBoneArch(group, mats.bone, -w * 0.78, h * 0.25, w * 0.22, w * 0.38, h * 0.32, 0.032);
  addBoneSpikeFence(group, mats.bone, -w * 0.78, h * 0.28, -w * 0.68, w * 1.56, 8, h * 0.25, -0.08);
  addLootBundle(group, mats, w * 0.72, h * 0.22, w * 0.18, w * 0.34);
  addBox(group, mats.glow, w * 0.5, h * 0.08, 0.05, w * 0.12, h * 0.35, -w * 0.66);
}

function buildAntlerWatch({ group, mats, h, w }) {
  const wood = surfaceMaterial("rootWood", PALETTES.antlerPost, "antler-watch-wood");
  for (const [x, z] of [[-0.42, -0.34], [0.42, -0.34], [-0.38, 0.36], [0.38, 0.36]]) {
    addTube(group, wood, [
      new THREE.Vector3(x * w, 0.28, z * w),
      new THREE.Vector3(x * w * 0.72, h * 0.42, z * w * 0.72),
      new THREE.Vector3(x * w * 0.48, h * 0.72, z * w * 0.48)
    ], 0.045);
  }
  addCylinder(group, wood, w * 0.18, h * 0.7, 0, 0.28, 0, 10);
  addBox(group, mats.secondary, w * 0.96, h * 0.16, w * 0.76, 0, h * 0.72, 0);
  addHideCanopy(group, mats.hide, wood, 0, h * 0.94, 0, w * 0.9, w * 0.66, h * 0.22);
  addBox(group, mats.outline, w * 1.08, h * 0.08, w * 0.86, 0, h * 0.86, 0);
  addMonsterHorn(group, mats.bone, -w * 0.24, h * 1.16, -w * 0.05, -1, w * 0.82);
  addMonsterHorn(group, mats.bone, w * 0.24, h * 1.16, -w * 0.05, 1, w * 0.82);
  addMonsterHorn(group, mats.bone, -w * 0.1, h * 1.0, w * 0.32, -1, w * 0.46);
  addMonsterHorn(group, mats.bone, w * 0.1, h * 1.0, w * 0.32, 1, w * 0.46);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      addTube(group, mats.bone, [
        new THREE.Vector3(side * w * (0.45 + i * 0.09), h * (1.08 - i * 0.015), -w * 0.05),
        new THREE.Vector3(side * w * (0.55 + i * 0.1), h * (1.18 + i * 0.03), -w * 0.03)
      ], 0.022);
    }
  }
  addLadder(group, wood, -w * 0.58, h * 0.3, -w * 0.42, h * 0.7, w * 0.3);
  addTrapJaw(group, mats.metal, mats.bone, 0, h * 0.26, -w * 0.66, w * 0.7);
  addTrapNet(group, mats.hide, mats.bone, w * 0.62, h * 0.34, -w * 0.28, w * 0.52);
  addHuntingToolRack(group, mats.bone, wood, -w * 0.68, h * 0.36, w * 0.38, w * 0.5);
  addFlag(group, mats.accent, mats.metal, w * 0.55, h * 0.88, -w * 0.22, h * 0.42);
}

function buildCaravanSmithy({ group, mats, h, w }) {
  const wood = surfaceMaterial("rootWood", PALETTES.caravanSmith, "wheel-forge-wood");
  addBox(group, mats.outline, w * 1.7, h * 0.1, w * 0.96, 0, 0.34, 0);
  addBox(group, wood, w * 1.54, h * 0.3, w * 0.82, 0, 0.42, 0);
  addBox(group, mats.scale, w * 1.24, h * 0.16, w * 0.88, 0, h * 0.74, 0);
  addHideCanopy(group, mats.hide, wood, 0, h * 0.64, 0, w * 1.34, w * 0.9, h * 0.24);
  addHideStitches(group, mats.bone, w * 0.98, h * 0.74, -w * 0.48, 5);
  for (const x of [-0.62, 0.62]) {
    addCartWheel(group, mats.dark, mats.bone, x * w, h * 0.24, -w * 0.52, w * 0.28);
    addCartWheel(group, mats.dark, mats.bone, x * w, h * 0.24, w * 0.52, w * 0.28);
  }
  const furnace = addCylinder(group, mats.dark, w * 0.26, h * 0.34, -w * 0.36, h * 0.44, -w * 0.4, 14);
  furnace.scale.z = 0.72;
  addBox(group, mats.glow, w * 0.42, h * 0.18, 0.055, -w * 0.36, h * 0.5, -w * 0.58);
  addCylinder(group, mats.metal, w * 0.08, h * 0.48, -w * 0.52, h * 0.7, -w * 0.2, 10);
  addAnvil(group, mats.metal, w * 0.32, h * 0.48, -w * 0.6, w * 0.36);
  addHammer(group, mats.bone, mats.accent, w * 0.5, h * 1.0, -w * 0.24, w * 0.5);
  addHuntingToolRack(group, mats.bone, wood, w * 0.5, h * 0.52, w * 0.5, w * 0.56);
  addTube(group, mats.metal, [
    new THREE.Vector3(-w * 0.75, h * 0.52, w * 0.05),
    new THREE.Vector3(-w * 1.06, h * 0.48, w * 0.2),
    new THREE.Vector3(-w * 1.28, h * 0.34, w * 0.28)
  ], 0.04);
  addTube(group, mats.metal, [
    new THREE.Vector3(-w * 0.75, h * 0.52, -w * 0.08),
    new THREE.Vector3(-w * 1.06, h * 0.48, -w * 0.22),
    new THREE.Vector3(-w * 1.28, h * 0.34, -w * 0.3)
  ], 0.04);
  addTrapJaw(group, mats.metal, mats.bone, w * 0.42, h * 0.34, -w * 0.62, w * 0.5);
  addLootBundle(group, mats, w * 0.76, h * 0.28, -w * 0.18, w * 0.28);
  addBellows(group, mats.hide, mats.bone, -w * 0.02, h * 0.48, -w * 0.62, w * 0.36);
}

function buildRibStorehouse({ group, mats, h, w }) {
  const wood = surfaceMaterial("rootWood", PALETTES.ribStorehouse, "rib-store-wood");
  addBox(group, mats.outline, w * 1.58, h * 0.1, w * 1.06, 0, 0.24, 0);
  addBox(group, wood, w * 1.42, h * 0.34, w * 0.94, 0, 0.28, 0);
  addRibCage(group, mats.bone, 0, h * 0.38, 0, w * 1.52, h * 0.72, w * 1.12, 9);
  addTube(group, mats.bone, [
    new THREE.Vector3(-w * 0.8, h * 1.08, 0),
    new THREE.Vector3(0, h * 1.22, 0),
    new THREE.Vector3(w * 0.8, h * 1.08, 0)
  ], 0.07);
  addHangingTrophy(group, mats.bone, 0, h * 0.92, -w * 0.62, w * 0.68);
  addHangingTrophy(group, mats.bone, -w * 0.48, h * 0.74, -w * 0.62, w * 0.36);
  addHangingTrophy(group, mats.bone, w * 0.48, h * 0.74, -w * 0.62, w * 0.36);
  addBox(group, mats.scale, w * 0.48, h * 0.24, w * 0.38, -w * 0.5, h * 0.32, -w * 0.54);
  addBox(group, mats.scale, w * 0.48, h * 0.24, w * 0.38, w * 0.5, h * 0.32, -w * 0.54);
  addLootBundle(group, mats, -w * 0.68, h * 0.24, w * 0.46, w * 0.38);
  addLootBundle(group, mats, w * 0.68, h * 0.24, w * 0.46, w * 0.38);
  addBoneSpikeFence(group, mats.bone, -w * 0.88, h * 0.38, -w * 0.66, w * 1.76, 10, h * 0.32, 0);
  addTrapJaw(group, mats.metal, mats.bone, 0, h * 0.24, -w * 0.72, w * 0.74);
  addBox(group, mats.glow, w * 0.5, h * 0.1, 0.05, 0, h * 0.28, -w * 0.58);
}

function addMonsterHorn(group, mat, x, y, z, side, size) {
  const tipX = x + side * size * 0.86;
  const tipY = y + size * 0.4;
  const tipZ = z + size * 0.08;
  addTube(group, mat, [
    new THREE.Vector3(x, y, z),
    new THREE.Vector3(x + side * size * 0.24, y + size * 0.34, z - size * 0.03),
    new THREE.Vector3(x + side * size * 0.58, y + size * 0.58, z + size * 0.02),
    new THREE.Vector3(tipX, tipY, tipZ)
  ], size * 0.035);
  const tip = addCone(group, mat, size * 0.06, size * 0.18, tipX, tipY - size * 0.02, tipZ, 8);
  tip.rotation.z = side > 0 ? -0.95 : 0.95;
  for (let i = 0; i < 3; i += 1) {
    const branchX = x + side * size * (0.34 + i * 0.15);
    const branchY = y + size * (0.34 + i * 0.08);
    addTube(group, mat, [
      new THREE.Vector3(branchX, branchY, z),
      new THREE.Vector3(branchX + side * size * 0.11, branchY + size * 0.18, z - size * 0.02)
    ], size * 0.018);
  }
}

function addHunterBoneArch(group, mat, x, y, z, width, height, radius) {
  addTube(group, mat, [
    new THREE.Vector3(x - width * 0.5, y, z),
    new THREE.Vector3(x - width * 0.28, y + height * 0.72, z),
    new THREE.Vector3(x, y + height, z),
    new THREE.Vector3(x + width * 0.28, y + height * 0.72, z),
    new THREE.Vector3(x + width * 0.5, y, z)
  ], radius);
}

function addRibCage(group, mat, x, y, z, width, height, depth, count) {
  for (let i = 0; i < count; i += 1) {
    const ribZ = z - depth * 0.5 + (i / Math.max(1, count - 1)) * depth;
    addHunterBoneArch(group, mat, x, y, ribZ, width * (0.88 + (i % 2) * 0.08), height, 0.045);
  }
}

function addHideCanopy(group, hideMat, poleMat, x, y, z, width, depth, height) {
  const left = addBox(group, hideMat, width * 0.58, height * 0.16, depth, x - width * 0.23, y, z);
  left.rotation.z = 0.22;
  const right = addBox(group, hideMat, width * 0.58, height * 0.16, depth, x + width * 0.23, y, z);
  right.rotation.z = -0.22;
  for (const px of [-0.44, 0.44]) {
    for (const pz of [-0.38, 0.38]) {
      addCylinder(group, poleMat, 0.032, height * 1.35, x + px * width, y - height * 0.72, z + pz * depth, 7);
    }
  }
  addTube(group, poleMat, [
    new THREE.Vector3(x - width * 0.46, y + height * 0.16, z - depth * 0.48),
    new THREE.Vector3(x, y + height * 0.28, z - depth * 0.5),
    new THREE.Vector3(x + width * 0.46, y + height * 0.16, z - depth * 0.48)
  ], 0.022);
}

function addCartWheel(group, rimMat, spokeMat, x, y, z, radius) {
  const rim = addTorus(group, rimMat, radius, radius * 0.12, x, y, z);
  rim.rotation.z = 0.12;
  for (let i = 0; i < 6; i += 1) {
    const spoke = addBox(group, spokeMat, radius * 1.62, radius * 0.08, radius * 0.09, x, y - radius * 0.04, z);
    spoke.rotation.z = (Math.PI * i) / 6;
  }
  addSphere(group, spokeMat, radius * 0.18, x, y, z);
}

function addTrapJaw(group, metalMat, boneMat, x, y, z, width) {
  addBox(group, metalMat, width, width * 0.06, width * 0.3, x, y, z);
  for (let i = 0; i < 6; i += 1) {
    const toothX = x - width * 0.38 + i * width * 0.15;
    addCone(group, boneMat, width * 0.035, width * 0.16, toothX, y + width * 0.03, z - width * 0.12, 6).rotation.x = 0.18;
    addCone(group, boneMat, width * 0.035, width * 0.16, toothX + width * 0.07, y + width * 0.03, z + width * 0.12, 6).rotation.x = Math.PI - 0.18;
  }
}

function addHangingTrophy(group, boneMat, x, y, z, size) {
  const skull = addSphere(group, boneMat, size * 0.22, x, y, z);
  skull.scale.y = 0.72;
  skull.scale.z = 0.58;
  addBox(group, boneMat, size * 0.2, size * 0.12, size * 0.12, x, y - size * 0.26, z);
  addMonsterHorn(group, boneMat, x - size * 0.1, y + size * 0.02, z, -1, size * 0.38);
  addMonsterHorn(group, boneMat, x + size * 0.1, y + size * 0.02, z, 1, size * 0.38);
  addSphere(group, solidMaterial("#2a1d16", { roughness: 0.9 }), size * 0.035, x - size * 0.08, y + size * 0.02, z - size * 0.13);
  addSphere(group, solidMaterial("#2a1d16", { roughness: 0.9 }), size * 0.035, x + size * 0.08, y + size * 0.02, z - size * 0.13);
}

function addHideStitches(group, mat, width, y, z, count) {
  for (let i = 0; i < count; i += 1) {
    const x = -width * 0.42 + i * (width * 0.84 / Math.max(1, count - 1));
    const stitch = addBox(group, mat, width * 0.055, width * 0.012, width * 0.012, x, y, z);
    stitch.rotation.z = i % 2 ? 0.4 : -0.4;
  }
}

function addBoneSpikeFence(group, mat, x, y, z, width, count, height, lean = 0) {
  for (let i = 0; i < count; i += 1) {
    const px = x + i * (width / Math.max(1, count - 1));
    const spike = addCone(group, mat, height * 0.18, height, px, y, z, 7);
    spike.rotation.z = lean + (i % 2 ? 0.14 : -0.14);
  }
}

function addCookPot(group, potMat, fireMat, x, y, z, size) {
  const pot = addSphere(group, potMat, size * 0.26, x, y + size * 0.18, z);
  pot.scale.set(1.25, 0.62, 1);
  addTorus(group, potMat, size * 0.3, size * 0.035, x, y + size * 0.28, z).rotation.x = Math.PI / 2;
  addBox(group, fireMat, size * 0.5, size * 0.1, size * 0.34, x, y, z);
  for (let i = 0; i < 3; i += 1) {
    addCone(group, fireMat, size * (0.08 + i * 0.015), size * 0.24, x + (i - 1) * size * 0.11, y + size * 0.08, z - size * 0.02, 8);
  }
  const steamMat = solidMaterial("#efe5d0", { transparent: true, opacity: 0.26, roughness: 1 });
  for (let i = 0; i < 5; i += 1) {
    addSphere(group, steamMat, size * (0.08 + i * 0.012), x + (i - 2) * size * 0.07, y + size * (0.55 + i * 0.12), z);
  }
}

function addHangingMeat(group, meatMat, boneMat, x, y, z, size) {
  addCylinder(group, boneMat, size * 0.025, size * 0.24, x, y + size * 0.18, z, 6);
  const meat = addSphere(group, meatMat, size * 0.16, x, y, z);
  meat.scale.set(0.78, 1.25, 0.68);
  addSphere(group, boneMat, size * 0.055, x, y - size * 0.12, z);
}

function addLadder(group, mat, x, y, z, height, width) {
  const left = addBox(group, mat, width * 0.08, height, width * 0.05, x - width * 0.24, y, z);
  const right = addBox(group, mat, width * 0.08, height, width * 0.05, x + width * 0.24, y, z);
  left.rotation.z = -0.16;
  right.rotation.z = -0.16;
  for (let i = 0; i < 5; i += 1) {
    const rung = addBox(group, mat, width * 0.52, width * 0.07, width * 0.05, x, y + height * (0.14 + i * 0.17), z - width * 0.02);
    rung.rotation.z = -0.16;
  }
}

function addTrapNet(group, hideMat, boneMat, x, y, z, size) {
  const pad = addBox(group, hideMat, size, size * 0.025, size * 0.72, x, y, z);
  pad.rotation.y = 0.2;
  for (let i = 0; i < 4; i += 1) {
    addBox(group, boneMat, size * 0.9, size * 0.022, size * 0.018, x, y + size * 0.03, z - size * 0.28 + i * size * 0.18).rotation.y = 0.2;
    addBox(group, boneMat, size * 0.018, size * 0.022, size * 0.64, x - size * 0.36 + i * size * 0.24, y + size * 0.04, z).rotation.y = 0.2;
  }
}

function addHuntingToolRack(group, boneMat, rackMat, x, y, z, size) {
  addBox(group, rackMat, size, size * 0.05, size * 0.05, x, y, z);
  for (let i = 0; i < 5; i += 1) {
    const px = x - size * 0.38 + i * size * 0.19;
    const shaft = addCylinder(group, rackMat, size * 0.018, size * 0.62, px, y - size * 0.34, z, 6);
    shaft.rotation.z = i % 2 ? 0.22 : -0.22;
    const tip = addCone(group, boneMat, size * 0.045, size * 0.16, px, y + size * 0.24, z, 6);
    tip.rotation.z = shaft.rotation.z;
  }
}

function addAnvil(group, mat, x, y, z, size) {
  addBox(group, mat, size * 0.68, size * 0.16, size * 0.32, x, y, z);
  addBox(group, mat, size * 0.46, size * 0.18, size * 0.28, x, y + size * 0.14, z);
  const horn = addCone(group, mat, size * 0.12, size * 0.32, x + size * 0.38, y + size * 0.18, z, 8);
  horn.rotation.z = -Math.PI / 2;
}

function addBellows(group, hideMat, boneMat, x, y, z, size) {
  const bladder = addSphere(group, hideMat, size * 0.2, x, y, z);
  bladder.scale.set(1.45, 0.56, 0.8);
  addBox(group, boneMat, size * 0.62, size * 0.045, size * 0.28, x, y + size * 0.04, z);
  const nozzle = addCone(group, boneMat, size * 0.08, size * 0.26, x + size * 0.42, y - size * 0.02, z, 8);
  nozzle.rotation.z = -Math.PI / 2;
}

function addLootBundle(group, mats, x, y, z, size) {
  addBox(group, mats.wood, size * 0.48, size * 0.26, size * 0.36, x, y, z);
  addBox(group, mats.scale, size * 0.34, size * 0.24, size * 0.28, x + size * 0.36, y + size * 0.02, z + size * 0.04);
  const roll = addCylinder(group, mats.hide, size * 0.1, size * 0.44, x - size * 0.32, y + size * 0.1, z + size * 0.1, 12);
  roll.rotation.z = Math.PI / 2;
  addBox(group, mats.bone, size * 0.6, size * 0.05, size * 0.05, x, y + size * 0.32, z - size * 0.12).rotation.z = 0.2;
  addCone(group, mats.bone, size * 0.055, size * 0.22, x - size * 0.36, y + size * 0.33, z - size * 0.12, 7).rotation.z = 0.2;
  addCone(group, mats.bone, size * 0.055, size * 0.22, x + size * 0.36, y + size * 0.33, z - size * 0.12, 7).rotation.z = -0.2;
}

function buildToyBlockKeep({ group, mats, h, w }) {
  const roof = solidMaterial("#ffd344", { roughness: 0.4, metalness: 0.05, emissive: "#7d5300", emissiveIntensity: 0.04 });
  const red = solidMaterial("#f04f45", { roughness: 0.46, emissive: "#5a0e0a", emissiveIntensity: 0.04 });
  const green = solidMaterial("#2fbf71", { roughness: 0.48, emissive: "#063d1f", emissiveIntensity: 0.04 });
  addBox(group, mats.outline, w * 1.98, h * 0.12, w * 1.34, 0, 0.26, 0);
  addBox(group, mats.primary, w * 1.82, h * 0.42, w * 1.18, 0, 0.32, 0);
  addBox(group, red, w * 1.38, h * 0.34, w * 0.9, 0, h * 0.55, 0);
  addBox(group, green, w * 0.92, h * 0.28, w * 0.62, 0, h * 0.82, 0);
  addToyStuds(group, roof, w * 1.48, w * 0.96, 0, h * 0.77, 0, 5, 3, w * 0.06);
  addToyStuds(group, roof, w * 0.92, w * 0.6, 0, h * 1.1, 0, 3, 2, w * 0.055);
  addCrenellations(group, roof, w * 1.62, h * 1.02, -w * 0.66, 9, w * 0.12);
  addCrenellations(group, roof, w * 1.62, h * 1.02, w * 0.66, 9, w * 0.12);
  for (const x of [-0.68, 0.68]) {
    for (const z of [-0.5, 0.5]) {
      addCylinder(group, mats.outline, w * 0.27, h * 0.78, x * w, 0.32, z * w, 16);
      addCylinder(group, mats.tertiary, w * 0.22, h * 0.75, x * w, 0.38, z * w, 16);
      addToyStuds(group, roof, w * 0.32, w * 0.32, x * w, h * 1.14, z * w, 2, 2, w * 0.04);
      addCone(group, roof, w * 0.27, h * 0.24, x * w, h * 1.15, z * w, 6);
    }
  }
  addBox(group, mats.outline, w * 0.58, h * 0.42, 0.08, 0, h * 0.3, -w * 0.72);
  addBox(group, mats.dark, w * 0.44, h * 0.32, 0.09, 0, h * 0.34, -w * 0.78);
  for (const x of [-0.14, 0, 0.14]) addBox(group, roof, w * 0.045, h * 0.32, 0.1, x * w, h * 0.36, -w * 0.84);
  addStarBadge(group, mats.glow, mats.outline, 0, h * 0.7, -w * 0.78, w * 0.52);
  addCrown(group, roof, 0, h * 1.42, -w * 0.04, w * 0.66);
  addBoltRow(group, mats.outline, w * 1.42, 0, h * 0.42, -w * 0.72, 9);
  addGameCannon(group, mats, -w * 0.72, h * 0.18, -w * 0.92, w * 0.52, 0.2);
  addGameCannon(group, mats, w * 0.72, h * 0.18, -w * 0.92, w * 0.52, -0.2);
  addFlag(group, red, mats.outline, -w * 0.88, h * 1.36, -w * 0.08, h * 0.4);
  addFlag(group, green, mats.outline, w * 0.72, h * 1.26, -w * 0.12, h * 0.34);
}

function buildStarPumpLab({ group, mats, h, w }) {
  const yellow = solidMaterial("#ffd83c", { roughness: 0.38, metalness: 0.1, emissive: "#6b5200", emissiveIntensity: 0.05 });
  const cyan = solidMaterial("#2ed8ff", { roughness: 0.28, metalness: 0.02, emissive: "#006f91", emissiveIntensity: 0.24 });
  addBox(group, mats.outline, w * 1.72, h * 0.12, w * 1.08, 0, 0.26, 0);
  addBox(group, mats.primary, w * 1.52, h * 0.36, w * 0.92, 0, 0.34, 0);
  addBox(group, mats.secondary, w * 0.82, h * 0.28, w * 0.62, -w * 0.34, h * 0.62, 0);

  for (const [x, z, scale] of [[-0.62, -0.06, 1], [0.52, 0.02, 1.12]]) {
    addCylinder(group, mats.outline, w * 0.23 * scale, h * 0.72 * scale, x * w, 0.36, z * w, 18);
    addCylinder(group, cyan, w * 0.18 * scale, h * 0.66 * scale, x * w, 0.42, z * w, 18);
    addTorus(group, yellow, w * 0.19 * scale, 0.03, x * w, h * 0.76 * scale, z * w).rotation.x = Math.PI / 2;
    addSphere(group, mats.glow, w * 0.12 * scale, x * w, h * (1.08 * scale), z * w);
  }

  addTorus(group, mats.outline, w * 0.5, 0.06, 0, h * 0.67, -w * 0.68);
  addTorus(group, yellow, w * 0.42, 0.04, 0, h * 0.67, -w * 0.72);
  addStarBadge(group, yellow, mats.outline, 0, h * 0.68, -w * 0.8, w * 0.72);
  for (let i = 0; i < 4; i += 1) {
    const blade = addBox(group, mats.glow, w * 0.12, h * 0.56, 0.055, 0, h * 0.4, -w * 0.84);
    blade.rotation.z = (Math.PI * i) / 4;
  }

  addTube(group, mats.metal, [
    new THREE.Vector3(-w * 0.62, h * 0.96, -w * 0.05),
    new THREE.Vector3(-w * 0.16, h * 1.2, -w * 0.34),
    new THREE.Vector3(w * 0.52, h * 1.12, -w * 0.02)
  ], 0.055);
  addTube(group, cyan, [
    new THREE.Vector3(-w * 0.7, h * 0.56, -w * 0.18),
    new THREE.Vector3(0, h * 0.62, -w * 0.56),
    new THREE.Vector3(w * 0.72, h * 0.58, -w * 0.18)
  ], 0.045);
  addToyStuds(group, yellow, w * 1.26, w * 0.64, 0, h * 0.8, 0.08, 5, 2, w * 0.045);
  addCrown(group, yellow, 0, h * 1.28, -w * 0.04, w * 0.5);
  addBoltRow(group, mats.outline, w * 1.28, 0, h * 0.38, -w * 0.58, 8);
}

function addRaidToothRow(group, mat, width, x, y, z, count, size, upper = true) {
  for (let i = 0; i < count; i += 1) {
    const px = x - width * 0.5 + (i / Math.max(1, count - 1)) * width;
    const tooth = addCone(group, mat, size * (i % 2 ? 0.78 : 1), size * 2.2, px, y, z, 5);
    tooth.rotation.x = upper ? Math.PI : 0;
    tooth.rotation.z = (i - count / 2) * 0.035;
  }
}

function addRaidChain(group, mat, points, radius, count) {
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1);
    const segment = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
    const local = t * (points.length - 1) - segment;
    const a = points[segment];
    const b = points[segment + 1];
    const x = a.x + (b.x - a.x) * local;
    const y = a.y + (b.y - a.y) * local;
    const z = a.z + (b.z - a.z) * local;
    const link = addTorus(group, mat, radius, radius * 0.22, x, y, z);
    link.rotation.x = Math.PI / 2;
    link.rotation.z = i % 2 ? Math.PI / 2 : 0;
  }
}

function addBossEyes(group, mat, x, y, z, gap, size) {
  addSphere(group, mat, size, x - gap * 0.5, y, z).scale.y = 0.52;
  addSphere(group, mat, size, x + gap * 0.5, y, z).scale.y = 0.52;
}

function addLightningBolt(group, mat, x, y, z, scale, flip = 1) {
  addTube(group, mat, [
    new THREE.Vector3(x, y + scale * 0.52, z),
    new THREE.Vector3(x + flip * scale * 0.18, y + scale * 0.2, z - scale * 0.04),
    new THREE.Vector3(x - flip * scale * 0.02, y + scale * 0.2, z - scale * 0.04),
    new THREE.Vector3(x + flip * scale * 0.2, y - scale * 0.2, z)
  ], scale * 0.032);
}

function addRuneTablet(group, mat, glowMat, x, y, z, size, angle = 0) {
  const tablet = addBox(group, mat, size * 0.42, size * 0.58, size * 0.08, x, y, z);
  tablet.rotation.y = angle;
  tablet.rotation.z = angle * 0.18;
  const slash = addBox(group, glowMat, size * 0.34, size * 0.035, size * 0.09, x, y + size * 0.28, z - size * 0.05);
  slash.rotation.z = angle + 0.75;
  slash.rotation.y = angle;
  return tablet;
}

function buildRuneBastion(context) {
  const { group, mats, h, w } = context;
  const base = addCylinder(group, mats.dark, w * 1.1, h * 0.12, 0, 0.22, 0, 12);
  base.scale.z = 0.68;
  addBox(group, mats.primary, w * 2.05, h * 0.18, w * 0.48, 0, h * 0.15, -w * 0.05);
  addBox(group, mats.dark, w * 1.25, h * 0.62, w * 0.22, 0, h * 0.34, -w * 0.38);

  for (const x of [-0.72, 0.72]) {
    addCylinder(group, mats.primary, w * 0.27, h * 0.82, x * w, h * 0.24, -w * 0.08, 8);
    addCylinder(group, mats.secondary, w * 0.2, h * 0.72, x * w, h * 0.34, -w * 0.36, 8);
    addCone(group, mats.accent, w * 0.23, h * 0.3, x * w, h * 1.02, -w * 0.08, 4).rotation.y = Math.PI / 4;
    addCone(group, mats.glow, w * 0.08, h * 0.36, x * w, h * 1.3, -w * 0.08, 4).rotation.y = Math.PI / 4;
  }

  const portal = addSphere(group, mats.dark, w * 0.7, 0, h * 0.74, -w * 0.48);
  portal.scale.set(0.82, 1.18, 0.08);
  addTorus(group, mats.glow, w * 0.68, w * 0.035, 0, h * 0.74, -w * 0.5);
  addTorus(group, mats.accent, w * 0.48, w * 0.02, 0, h * 0.74, -w * 0.53);
  addBox(group, mats.glow, w * 0.72, h * 0.05, 0.05, 0, h * 0.75, -w * 0.58);
  addBox(group, mats.glow, 0.055, h * 0.52, 0.055, 0, h * 0.52, -w * 0.58);

  for (let i = 0; i < 8; i += 1) {
    const a = (Math.PI * 2 * i) / 8;
    const shard = addOctahedron(group, i % 2 ? mats.glow : mats.accent, w * 0.09, Math.sin(a) * w * 1.02, h * (0.72 + (i % 2) * 0.16), Math.cos(a) * w * 0.48);
    shard.rotation.y = a;
  }
  for (const x of [-1.05, -0.42, 0.42, 1.05]) {
    addCone(group, mats.outline, w * 0.08, h * 0.34, x * w, h * 0.22, -w * 0.72, 5);
  }
}

function buildLavaBossForge(context) {
  const { group, mats, h, w } = context;
  const base = addCylinder(group, mats.dark, w * 1.28, h * 0.18, 0, 0.18, 0, 10);
  base.scale.z = 0.82;
  addCylinder(group, mats.outline, w * 0.82, h * 0.44, 0, h * 0.24, 0, 12);
  addCylinder(group, mats.primary, w * 0.68, h * 0.64, 0, h * 0.28, 0, 14);
  addCylinder(group, mats.secondary, w * 0.56, h * 0.28, 0, h * 0.9, 0, 14);
  addCone(group, mats.dark, w * 0.7, h * 0.26, 0, h * 1.14, 0, 6);

  for (const side of [-1, 1]) {
    const horn = addCone(group, mats.outline, w * 0.18, h * 0.72, side * w * 0.58, h * 0.94, -w * 0.18, 6);
    horn.rotation.z = -side * 0.58;
    addCone(group, mats.accent, w * 0.1, h * 0.36, side * w * 0.74, h * 1.36, -w * 0.18, 6).rotation.z = -side * 0.7;
    addCylinder(group, mats.primary, w * 0.24, h * 1.0, side * w * 0.88, h * 0.28, w * 0.12, 9);
    addCone(group, mats.glow, w * 0.13, h * 0.42, side * w * 0.88, h * 1.34, w * 0.12, 8);
  }

  const mouth = addSphere(group, mats.dark, w * 0.68, 0, h * 0.64, -w * 0.68);
  mouth.scale.set(1.18, 0.78, 0.09);
  addTorus(group, mats.outline, w * 0.72, w * 0.06, 0, h * 0.64, -w * 0.69);
  addTorus(group, mats.glow, w * 0.62, w * 0.04, 0, h * 0.64, -w * 0.72);
  addBossEyes(group, mats.glow, 0, h * 0.88, -w * 0.75, w * 0.42, w * 0.08);
  addRaidToothRow(group, mats.bone, w * 0.9, 0, h * 0.77, -w * 0.78, 7, w * 0.06, true);
  addRaidToothRow(group, mats.bone, w * 0.82, 0, h * 0.38, -w * 0.78, 6, w * 0.055, false);
  const tongue = addBox(group, mats.glow, w * 0.42, h * 0.055, w * 1.08, 0, h * 0.3, -w * 0.88);
  tongue.rotation.x = -0.08;
  for (let i = 0; i < 7; i += 1) {
    addBox(group, i % 2 ? mats.accent : mats.glow, w * 0.14, h * 0.055, 0.045, -w * 0.42 + i * w * 0.14, h * (0.48 + (i % 2) * 0.08), -w * 0.8).rotation.z = (i - 3) * 0.2;
  }

  for (const x of [-0.56, 0, 0.56]) {
    const river = addBox(group, mats.glow, w * 0.18, h * 0.04, w * 1.28, x * w, h * 0.16, -w * 0.1);
    river.rotation.y = x === 0 ? 0 : -x * 0.44;
  }
  for (let i = 0; i < 13; i += 1) {
    const x = -w * 1.18 + i * w * 0.2;
    addCone(group, i % 2 ? mats.accent : mats.glow, w * 0.075, h * (0.24 + (i % 3) * 0.07), x, h * 0.2, -w * 0.92, 5);
  }
  addSpikeRow(group, mats.outline, w * 1.68, h * 0.62, -w * 0.05, 8, h * 0.32);
}

function buildIceVault(context) {
  const { group, mats, h, w } = context;
  const base = addCylinder(group, mats.secondary, w * 1.18, h * 0.15, 0, 0.18, 0, 8);
  base.scale.z = 0.76;
  addBox(group, mats.outline, w * 1.78, h * 0.68, w * 0.86, 0, h * 0.24, 0);
  addBox(group, mats.primary, w * 1.54, h * 0.62, w * 0.72, 0, h * 0.3, 0);
  addBox(group, mats.dark, w * 0.92, h * 0.72, 0.09, 0, h * 0.34, -w * 0.48);
  addBox(group, mats.glow, w * 0.82, h * 0.06, 0.05, 0, h * 0.72, -w * 0.56);
  addBox(group, mats.glow, 0.06, h * 0.66, 0.05, 0, h * 0.42, -w * 0.56);
  addTorus(group, mats.outline, w * 0.58, w * 0.045, 0, h * 0.72, -w * 0.53);
  addTorus(group, mats.glow, w * 0.5, w * 0.024, 0, h * 0.72, -w * 0.57);
  addOctahedron(group, mats.glow, w * 0.2, 0, h * 0.72, -w * 0.62).scale.y = 1.35;
  addRaidChain(group, mats.metal, [
    new THREE.Vector3(-w * 0.62, h * 0.94, -w * 0.62),
    new THREE.Vector3(0, h * 0.7, -w * 0.62),
    new THREE.Vector3(w * 0.62, h * 0.94, -w * 0.62)
  ], w * 0.042, 10);

  const crown = addOctahedron(group, mats.glass, w * 0.4, 0, h * 1.12, 0);
  crown.scale.y = 1.62;
  for (let i = 0; i < 13; i += 1) {
    const x = -w * 1.05 + i * w * 0.175;
    const spike = addCone(group, i % 2 ? mats.glass : mats.secondary, w * 0.09, h * (0.35 + (i % 4) * 0.1), x, h * 0.64, w * 0.38, 5);
    spike.rotation.z = (i - 6) * 0.045;
  }
  for (const side of [-1, 1]) {
    const x = side * w * 0.82;
    addCylinder(group, mats.glass, w * 0.17, h * 0.92, x, h * 0.28, -w * 0.2, 6);
    addCone(group, mats.glow, w * 0.2, h * 0.42, x, h * 1.2, -w * 0.2, 5);
    const blade = addCone(group, mats.accent, w * 0.11, h * 0.78, side * w * 1.08, h * 0.3, -w * 0.48, 5);
    blade.rotation.z = side < 0 ? -0.38 : 0.38;
  }
  for (const x of [-0.48, 0.48]) {
    addCrystalCluster(group, mats.glow, x * w, h * 0.24, -w * 0.78, w * 0.42);
  }
}

function buildSporeKeep({ group, mats, h, w }) {
  const base = addCylinder(group, mats.dark, w * 1.24, h * 0.16, 0, 0.18, 0, 9);
  base.scale.z = 0.82;
  addCylinder(group, mats.outline, w * 0.78, h * 0.54, 0, h * 0.22, 0, 14);
  addCylinder(group, mats.primary, w * 0.66, h * 0.62, 0, h * 0.26, 0, 16);
  const cap = addSphere(group, mats.secondary, w * 0.9, 0, h * 0.88, 0);
  cap.scale.set(1.2, 0.48, 0.95);
  addCone(group, mats.tertiary, w * 0.86, h * 0.22, 0, h * 0.88, 0, 8);
  for (let i = 0; i < 9; i += 1) {
    const a = (Math.PI * 2 * i) / 9;
    addSphere(group, i % 2 ? mats.glow : mats.accent, w * (0.08 + (i % 3) * 0.025), Math.sin(a) * w * 0.62, h * 0.95, Math.cos(a) * w * 0.48);
  }

  const maw = addSphere(group, mats.dark, w * 0.56, 0, h * 0.48, -w * 0.7);
  maw.scale.set(1.18, 0.86, 0.1);
  addTorus(group, mats.outline, w * 0.58, w * 0.05, 0, h * 0.48, -w * 0.72);
  addTorus(group, mats.glow, w * 0.49, w * 0.035, 0, h * 0.48, -w * 0.75);
  addBossEyes(group, mats.glow, 0, h * 0.66, -w * 0.8, w * 0.34, w * 0.06);
  addRaidToothRow(group, mats.bone, w * 0.72, 0, h * 0.58, -w * 0.82, 7, w * 0.045, true);
  addRaidToothRow(group, mats.bone, w * 0.66, 0, h * 0.34, -w * 0.82, 6, w * 0.04, false);

  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI * 2 * i) / 10;
    const endX = Math.sin(a) * w * (1.08 + (i % 2) * 0.12);
    const endZ = Math.cos(a) * w * 0.82;
    addTube(group, i % 2 ? mats.accent : mats.glow, [
      new THREE.Vector3(0, h * 0.36, -w * 0.1),
      new THREE.Vector3(Math.sin(a) * w * 0.5, h * (0.2 + (i % 3) * 0.04), Math.cos(a) * w * 0.48),
      new THREE.Vector3(endX, h * 0.24, endZ)
    ], w * 0.034);
    addSphere(group, i % 2 ? mats.glow : mats.accent, w * 0.095, endX, h * 0.25, endZ);
  }
  for (const x of [-0.72, 0.72]) {
    addCylinder(group, mats.primary, w * 0.17, h * 0.68, x * w, h * 0.18, -w * 0.16, 10);
    addSphere(group, mats.glow, w * 0.22, x * w, h * 0.94, -w * 0.16);
  }
  for (const x of [-0.56, 0, 0.56]) {
    const pool = addCylinder(group, mats.glow, w * 0.22, h * 0.035, x * w, h * 0.14, -w * 0.9, 18);
    pool.scale.z = 0.48;
  }
}

function buildStormDrumTower({ group, mats, h, w }) {
  const base = addCylinder(group, mats.dark, w * 1.08, h * 0.16, 0, 0.18, 0, 10);
  base.scale.z = 0.78;
  addCylinder(group, mats.outline, w * 0.46, h * 1.12, 0, h * 0.18, 0, 12);
  addCylinder(group, mats.primary, w * 0.38, h * 1.08, 0, h * 0.22, 0, 12);
  for (let i = 0; i < 4; i += 1) {
    const y = h * (0.34 + i * 0.24);
    const radius = w * (0.6 - i * 0.045);
    const drum = addCylinder(group, i % 2 ? mats.secondary : mats.primary, radius, h * 0.17, 0, y, -w * 0.16, 28);
    drum.rotation.x = Math.PI / 2;
    addTorus(group, mats.outline, radius, w * 0.035, 0, y + h * 0.085, -w * 0.16);
    addTorus(group, mats.glow, radius * 0.72, w * 0.018, 0, y + h * 0.085, -w * 0.19);
    addBox(group, mats.dark, w * (1.28 - i * 0.08), h * 0.045, 0.055, 0, y + h * 0.08, -w * 0.74);
  }
  addBossEyes(group, mats.glow, 0, h * 0.58, -w * 0.78, w * 0.36, w * 0.055);
  addCylinder(group, mats.secondary, w * 0.26, h * 0.62, 0, h * 1.14, 0, 8);
  addCone(group, mats.accent, w * 0.22, h * 0.42, 0, h * 1.7, 0, 4).rotation.y = Math.PI / 4;
  addOctahedron(group, mats.glow, w * 0.18, 0, h * 2.02, 0);

  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI * 2 * i) / 10;
    const x = Math.sin(a) * w * 0.82;
    const z = Math.cos(a) * w * 0.56;
    const rod = addBox(group, mats.accent, w * 0.04, h * 0.78, w * 0.04, x, h * 0.32, z);
    rod.rotation.z = Math.sin(a) * 0.26;
    rod.rotation.x = Math.cos(a) * 0.18;
    addOctahedron(group, mats.glow, w * 0.06, x, h * 0.96, z);
  }
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * 2 * i) / 6 + Math.PI * 0.18;
    addTube(group, mats.glow, [
      new THREE.Vector3(0, h * 1.86, 0),
      new THREE.Vector3(Math.sin(a) * w * 0.3, h * 1.48, Math.cos(a) * w * 0.24),
      new THREE.Vector3(Math.sin(a) * w * 0.82, h * 1.18, Math.cos(a) * w * 0.58)
    ], w * 0.024);
  }
  for (const side of [-1, 1]) {
    addLightningBolt(group, mats.glow, side * w * 0.92, h * 0.8, -w * 0.62, w * 0.58, side);
    addBox(group, mats.outline, w * 0.24, h * 0.58, w * 0.18, side * w * 0.9, h * 0.22, -w * 0.18);
  }
}

function buildShellbackHut({ group, mats, h, w }) {
  const shellMat = surfaceMaterial("shellBand", PALETTES.shellHut, "shellback-roof");
  const boneMat = surfaceMaterial("hunterBone", PALETTES.ribStorehouse, "shellback-teeth");
  const hideMat = surfaceMaterial("hunterHide", PALETTES.hideCanteen, "shellback-hide");

  addCylinder(group, mats.dark, w * 0.72, h * 0.1, 0, 0.18, 0, 18).scale.z = 0.86;
  addCylinder(group, hideMat, w * 0.62, h * 0.38, 0, 0.3, 0, 14).scale.z = 0.78;
  const shell = addSphere(group, shellMat, w * 0.96, 0, h * 0.72, 0);
  shell.scale.set(1.25, 0.5, 0.92);
  for (let i = 0; i < 9; i += 1) {
    const x = -w * 0.74 + i * w * 0.185;
    const ridge = addBox(group, i % 2 ? mats.accent : mats.secondary, w * 0.055, h * 0.13, w * 1.36, x, h * 0.72, 0);
    ridge.rotation.x = Math.PI * 0.04;
    ridge.rotation.z = -0.24 + i * 0.06;
  }
  const spiral = addTorus(group, mats.glow, w * 0.32, 0.038, -w * 0.26, h * 0.82, -w * 0.63);
  spiral.rotation.x = Math.PI / 2;
  spiral.scale.set(1, 1, 0.55);
  addTorus(group, mats.dark, w * 0.5, 0.03, w * 0.34, h * 0.78, -w * 0.56).rotation.x = Math.PI / 2;
  addCone(group, shellMat, w * 0.32, h * 0.48, w * 0.74, h * 0.64, w * 0.14, 9).rotation.z = -0.58;
  addCone(group, shellMat, w * 0.26, h * 0.38, -w * 0.78, h * 0.58, w * 0.12, 9).rotation.z = 0.52;

  addBox(group, mats.dark, w * 0.52, h * 0.34, 0.08, 0, h * 0.24, -w * 0.58);
  addBox(group, mats.outline, w * 0.62, h * 0.06, 0.06, 0, h * 0.43, -w * 0.62);
  for (let i = 0; i < 7; i += 1) {
    const x = -w * 0.34 + i * w * 0.115;
    const tooth = addCone(group, boneMat, w * 0.055, h * 0.22, x, h * 0.46, -w * 0.64, 7);
    tooth.rotation.x = Math.PI;
  }
  for (let i = 0; i < 6; i += 1) {
    const a = -0.8 + i * 0.32;
    const spine = addCone(group, boneMat, w * 0.055, h * 0.32, Math.sin(a) * w * 0.82, h * 0.88, Math.cos(a) * w * 0.42, 6);
    spine.rotation.z = Math.sin(a) * 0.35;
  }
  for (const x of [-0.55, 0.55]) {
    addSphere(group, mats.glow, w * 0.115, x * w, h * 0.52, -w * 0.48);
    const fin = addCone(group, mats.tertiary, w * 0.16, h * 0.34, x * w * 1.08, h * 0.42, w * 0.3, 6);
    fin.rotation.z = x < 0 ? 0.55 : -0.55;
  }
}

function buildHornTotemDen({ group, mats, h, w }) {
  const boneMat = surfaceMaterial("hunterBone", PALETTES.ribStorehouse, "horn-den-bone");
  const fangWood = surfaceMaterial("fangMark", PALETTES.hornDen, "horn-den-fangwood");

  addCylinder(group, mats.dark, w * 0.88, h * 0.08, 0, 0.18, 0, 12).scale.z = 0.78;
  addCylinder(group, mats.primary, w * 0.68, h * 0.42, 0, 0.3, 0, 11).scale.z = 0.82;
  const hideRoof = addCone(group, mats.secondary, w * 0.9, h * 0.36, 0, h * 0.56, 0, 5);
  hideRoof.rotation.y = Math.PI / 5;
  addBox(group, mats.dark, w * 0.58, h * 0.34, 0.08, 0, h * 0.23, -w * 0.58);
  addBox(group, boneMat, w * 0.74, h * 0.06, 0.06, 0, h * 0.46, -w * 0.62);
  for (const x of [-0.42, 0.42]) {
    addSphere(group, mats.glow, w * 0.09, x * w, h * 0.46, -w * 0.62);
  }

  addCylinder(group, fangWood, w * 0.18, h * 0.72, 0, h * 0.72, w * 0.08, 7);
  addCylinder(group, mats.accent, w * 0.24, h * 0.1, 0, h * 1.08, w * 0.08, 7);
  addSphere(group, mats.glow, w * 0.13, 0, h * 1.18, w * 0.08).scale.y = 0.72;
  for (const side of [-1, 1]) {
    addTube(group, boneMat, [
      new THREE.Vector3(side * w * 0.34, h * 0.68, -w * 0.18),
      new THREE.Vector3(side * w * 0.72, h * 1.08, -w * 0.08),
      new THREE.Vector3(side * w * 1.0, h * 0.9, w * 0.08)
    ], w * 0.055);
    addTube(group, boneMat, [
      new THREE.Vector3(side * w * 0.3, h * 0.48, -w * 0.1),
      new THREE.Vector3(side * w * 0.64, h * 0.62, -w * 0.22),
      new THREE.Vector3(side * w * 0.88, h * 0.48, -w * 0.32)
    ], w * 0.04);
    const tip = addCone(group, boneMat, w * 0.095, h * 0.32, side * w * 0.98, h * 0.84, w * 0.08, 10);
    tip.rotation.z = side > 0 ? -0.72 : 0.72;
  }

  for (let i = 0; i < 11; i += 1) {
    const x = -w * 0.96 + i * w * 0.192;
    const post = addCone(group, i % 2 ? boneMat : fangWood, w * 0.06, h * (0.3 + (i % 3) * 0.055), x, h * 0.2, -w * 0.78, 7);
    post.rotation.z = (i - 3) * 0.04;
  }
  addShield(group, mats.accent, w * 0.4, h * 0.56, -w * 0.66, 0);
  addBoltRow(group, boneMat, w * 0.72, 0, h * 0.58, -w * 0.7, 7);
}

function buildScaleNestTower({ group, mats, h, w }) {
  const scaleMat = surfaceMaterial("scalePlate", PALETTES.scaleNest, "scale-nest-plates");
  const shellMat = surfaceMaterial("shellBand", PALETTES.shellHut, "scale-nest-eggshell");

  addCylinder(group, mats.dark, w * 0.46, h * 0.96, 0, 0.28, 0, 11);
  for (let tier = 0; tier < 8; tier += 1) {
    const radius = w * (0.72 - tier * 0.055);
    const y = h * (0.2 + tier * 0.115);
    addCylinder(group, tier % 2 ? mats.secondary : mats.primary, radius * 0.55, h * 0.075, 0, y, 0, 12);
    for (let i = 0; i < 10; i += 1) {
      const a = (Math.PI * 2 * (i + tier * 0.5)) / 10;
      const plate = addBox(group, scaleMat, w * 0.22, h * 0.065, w * 0.36, Math.sin(a) * radius, y + h * 0.02, Math.cos(a) * radius);
      plate.rotation.y = -a;
      plate.rotation.x = -0.35;
    }
  }
  addTorus(group, mats.glow, w * 0.5, 0.04, 0, h * 1.1, 0).rotation.x = Math.PI / 2;
  addTorus(group, shellMat, w * 0.32, 0.06, 0, h * 1.16, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i += 1) {
    const egg = addSphere(group, i === 2 ? mats.glow : shellMat, w * (0.12 + (i % 2) * 0.035), -w * 0.34 + i * w * 0.17, h * (1.12 + (i % 2) * 0.04), -w * 0.05);
    egg.scale.y = 1.36;
  }
  for (const x of [-0.36, 0.36]) {
    const spike = addCone(group, mats.accent, w * 0.11, h * 0.44, x * w * 1.06, h * 0.98, w * 0.28, 6);
    spike.rotation.z = x < 0 ? 0.34 : -0.34;
  }
  for (let i = 0; i < 7; i += 1) {
    const y = h * (0.34 + i * 0.11);
    const leftFin = addCone(group, scaleMat, w * 0.08, h * 0.3, -w * 0.72, y, -w * 0.08, 3);
    const rightFin = addCone(group, scaleMat, w * 0.08, h * 0.3, w * 0.72, y, -w * 0.08, 3);
    leftFin.rotation.z = 0.8;
    rightFin.rotation.z = -0.8;
  }
  addBox(group, mats.dark, w * 0.42, h * 0.22, 0.07, 0, h * 0.36, -w * 0.62);
  addBoltRow(group, mats.glow, w * 0.52, 0, h * 0.52, -w * 0.66, 5);
}

function buildSlimeLanternMill({ group, mats, h, w }) {
  const slimeMat = surfaceMaterial("slimeGel", PALETTES.slimeMill, "slime-mill-gel");
  const shellMat = surfaceMaterial("shellBand", PALETTES.shellHut, "slime-mill-shell");

  addCylinder(group, mats.dark, w * 0.86, h * 0.08, 0, 0.18, 0, 14).scale.z = 0.76;
  addCylinder(group, mats.primary, w * 0.66, h * 0.34, 0, 0.3, 0, 14).scale.z = 0.76;
  const vat = addSphere(group, slimeMat, w * 0.62, -w * 0.32, h * 0.64, 0);
  vat.scale.set(0.92, 0.92, 0.92);
  addTorus(group, mats.glow, w * 0.46, 0.045, -w * 0.32, h * 0.68, 0).rotation.x = Math.PI / 2;
  addTorus(group, mats.dark, w * 0.55, 0.04, -w * 0.32, h * 0.48, 0).rotation.x = Math.PI / 2;
  addSphere(group, mats.glow, w * 0.22, -w * 0.14, h * 0.94, -w * 0.12);
  const sideTank = addSphere(group, slimeMat, w * 0.34, w * 0.34, h * 0.56, w * 0.26);
  sideTank.scale.set(0.78, 1.05, 0.72);
  addTorus(group, mats.accent, w * 0.28, 0.03, w * 0.34, h * 0.58, w * 0.26).rotation.x = Math.PI / 2;

  const wheel = addTorus(group, shellMat, w * 0.44, 0.045, w * 0.68, h * 0.5, -w * 0.12);
  wheel.rotation.y = Math.PI / 2;
  for (let i = 0; i < 8; i += 1) {
    const blade = addBox(group, mats.accent, w * 0.09, h * 0.38, 0.045, w * 0.68, h * 0.38, -w * 0.12);
    blade.rotation.z = (Math.PI * i) / 3;
  }
  addTube(group, mats.glow, [
    new THREE.Vector3(-w * 0.72, h * 0.58, 0),
    new THREE.Vector3(-w * 0.04, h * 0.76, -w * 0.42),
    new THREE.Vector3(w * 0.68, h * 0.52, -w * 0.12)
  ], w * 0.05);
  addTube(group, slimeMat, [
    new THREE.Vector3(w * 0.34, h * 0.88, w * 0.26),
    new THREE.Vector3(w * 0.06, h * 1.02, w * 0.02),
    new THREE.Vector3(-w * 0.38, h * 0.9, -w * 0.18)
  ], w * 0.04);
  for (let i = 0; i < 12; i += 1) {
    const x = -w * 0.86 + i * w * 0.16;
    const bubble = addSphere(group, i % 2 ? mats.glow : slimeMat, w * (0.05 + (i % 3) * 0.022), x, h * (0.78 + (i % 4) * 0.065), -w * 0.44);
    bubble.scale.y = 0.82;
  }
  for (const x of [-0.48, 0.0, 0.48]) {
    addSphere(group, mats.glow, w * 0.08, x * w, h * 0.46, -w * 0.62).scale.y = 1.4;
  }
  addBox(group, mats.dark, w * 0.44, h * 0.22, 0.065, 0, h * 0.25, -w * 0.62);
}

function addInkRibbons(group, mat, w, h) {
  for (let i = 0; i < 4; i += 1) {
    addTube(group, mat, [
      new THREE.Vector3(-w * 0.7 + i * w * 0.4, h * 0.2, -w * 0.52),
      new THREE.Vector3(-w * 0.4 + i * w * 0.3, h * 0.55, -w * 0.75),
      new THREE.Vector3(w * 0.1 + i * w * 0.18, h * 0.72, -w * 0.34)
    ], 0.018);
  }
}

function addPlant(group, x, y, z, colors, scale = 0.5) {
  addCylinder(group, solidMaterial(colors[3] || "#604b32", { roughness: 0.9 }), 0.025 * scale, 0.32 * scale, x, y, z, 6);
  const leafMat = solidMaterial(colors[1] || "#5f9b55", { roughness: 0.72 });
  addSphere(group, leafMat, 0.12 * scale, x - 0.08 * scale, y + 0.35 * scale, z);
  addSphere(group, leafMat, 0.13 * scale, x + 0.08 * scale, y + 0.39 * scale, z + 0.04 * scale);
}

function addToyStuds(group, mat, width, depth, x, y, z, cols, rows, radius) {
  for (let col = 0; col < cols; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      const px = x - width * 0.35 + (cols === 1 ? width * 0.35 : col * (width * 0.7 / (cols - 1)));
      const pz = z - depth * 0.35 + (rows === 1 ? depth * 0.35 : row * (depth * 0.7 / (rows - 1)));
      addCylinder(group, mat, radius, radius * 0.55, px, y, pz, 18);
    }
  }
}

function addCrenellations(group, mat, width, y, z, count, depth = 0.1) {
  const blockWidth = width / (count * 1.8);
  for (let i = 0; i < count; i += 1) {
    const x = -width * 0.42 + i * (width * 0.84 / Math.max(1, count - 1));
    addBox(group, mat, blockWidth, blockWidth * 0.65, depth, x, y, z);
  }
}

function addBoltRow(group, mat, width, x, y, z, count) {
  for (let i = 0; i < count; i += 1) {
    const px = x - width * 0.42 + i * (width * 0.84 / Math.max(1, count - 1));
    const bolt = addCylinder(group, mat, width * 0.025, width * 0.018, px, y, z, 12);
    bolt.rotation.x = Math.PI / 2;
  }
}

function addStarBadge(group, faceMat, trimMat, x, y, z, size) {
  const back = addCylinder(group, trimMat, size * 0.34, size * 0.06, x, y - size * 0.08, z, 5);
  back.rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i += 1) {
    const ray = addCone(group, faceMat, size * 0.11, size * 0.34, x, y, z, 3);
    ray.rotation.z = i * Math.PI * 0.4;
  }
  addSphere(group, faceMat, size * 0.16, x, y + size * 0.02, z);
}

function addCrystalPile(group, mat, x, y, z, size) {
  for (let i = 0; i < 5; i += 1) {
    const crystal = addOctahedron(group, mat, size * (0.16 + i * 0.025), x + (i - 2) * size * 0.18, y + (i % 2) * size * 0.12, z + (i % 3 - 1) * size * 0.08);
    crystal.rotation.y = i * 0.45;
  }
}

function addFlag(group, clothMat, poleMat, x, y, z, height) {
  addCylinder(group, poleMat, 0.025, height, x, y - height * 0.5, z, 6);
  const flag = addBox(group, clothMat, height * 0.46, height * 0.26, 0.035, x + height * 0.22, y + height * 0.2, z);
  flag.rotation.z = -0.05;
  return flag;
}

function addCrown(group, mat, x, y, z, width) {
  addBox(group, mat, width, width * 0.12, width * 0.12, x, y, z);
  for (let i = 0; i < 5; i += 1) {
    const px = x - width * 0.42 + i * width * 0.21;
    addCone(group, mat, width * (i === 2 ? 0.1 : 0.075), width * (i === 2 ? 0.32 : 0.24), px, y + width * 0.1, z, 4).rotation.y = Math.PI / 4;
  }
}

function addHammer(group, handleMat, headMat, x, y, z, size) {
  const handle = addCylinder(group, handleMat, size * 0.035, size * 0.72, x, y - size * 0.36, z, 8);
  handle.rotation.z = -0.65;
  const head = addBox(group, headMat, size * 0.42, size * 0.18, size * 0.22, x + size * 0.18, y + size * 0.1, z);
  head.rotation.z = -0.65;
}

function addShield(group, mat, size, y, z, x = 0) {
  const shield = addCylinder(group, mat, size * 0.42, 0.045, x, y, z, 5);
  shield.rotation.x = Math.PI / 2;
  shield.scale.y = 1.22;
  return shield;
}

function addPyramidRoof(group, mat, radius, height, x, y, z, stretchZ = 1) {
  const roof = addCone(group, mat, radius, height, x, y, z, 4);
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = stretchZ;
  return roof;
}

function addChunkyTrim(group, mat, width, y, z, count, blockSize = 0.16) {
  for (let i = 0; i < count; i += 1) {
    const x = -width * 0.5 + (i / Math.max(1, count - 1)) * width;
    addBox(group, mat, blockSize, blockSize * 0.9, blockSize * 0.12, x, y, z);
  }
}

function addSpikeRow(group, mat, width, y, z, count, height, tilt = 0) {
  for (let i = 0; i < count; i += 1) {
    const x = -width * 0.5 + (i / Math.max(1, count - 1)) * width;
    const spike = addCone(group, mat, height * 0.18, height, x, y, z, 6);
    spike.rotation.z = tilt;
  }
}

function addCrystalCluster(group, mat, x, y, z, scale) {
  addOctahedron(group, mat, scale * 0.2, x, y + scale * 0.28, z);
  addOctahedron(group, mat, scale * 0.14, x - scale * 0.24, y + scale * 0.16, z + scale * 0.05);
  addOctahedron(group, mat, scale * 0.13, x + scale * 0.24, y + scale * 0.13, z - scale * 0.03);
}

function addWheel(group, mat, x, y, z, radius) {
  const wheel = addCylinder(group, mat, radius, radius * 0.28, x, y, z, 20);
  wheel.rotation.x = Math.PI / 2;
  addCylinder(group, mat, radius * 0.38, radius * 0.34, x, y, z, 12).rotation.x = Math.PI / 2;
  return wheel;
}

function addBoneArch(group, mat, width, height, z, count = 5) {
  for (let i = 0; i < count; i += 1) {
    const x = -width * 0.5 + (i / Math.max(1, count - 1)) * width;
    addTube(group, mat, [
      new THREE.Vector3(x, 0.5, z),
      new THREE.Vector3(x * 0.8, height * 0.72, z + width * 0.08),
      new THREE.Vector3(x * 0.52, height, z)
    ], width * 0.016);
  }
}

function addGameBannerPair(group, mats, w, h, colorMat = mats.accent) {
  addFlag(group, colorMat, mats.dark, -w * 0.86, h * 0.62, -w * 0.46, h * 0.46);
  addFlag(group, colorMat, mats.dark, w * 0.86, h * 0.62, -w * 0.46, h * 0.46);
}

function addGameModelPolish(group, spec) {
  const outline = lineMaterial(spec.designer === "game-hunter" || spec.designer === "game-creature" ? "#2b1b12" : "#1e2028", 0.54);
  const meshes = [];
  group.traverse((object) => {
    if (object.isMesh && object.geometry && object.name !== "selection-ring") meshes.push(object);
  });
  for (const mesh of meshes) {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 32), outline);
    edges.scale.setScalar(1.012);
    mesh.add(edges);
  }
}

function lineMaterial(color, opacity) {
  const key = `line:${color}:${opacity}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  materialCache.set(key, material);
  return material;
}

function addFacadeStrips(group, mat, width, height, depth, x, y, z, count) {
  for (let i = 0; i < count; i += 1) {
    addBox(group, mat, width / (count * 2), height, depth, x - width * 0.38 + i * (width / Math.max(1, count - 1)) * 0.76, y, z);
  }
}

function addWindowGrid(group, mat, width, height, x, y, z, cols, rows) {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      addBox(group, mat, width / (cols * 2.2), height / (rows * 2.2), 0.035, x - width * 0.36 + col * (width * 0.72 / Math.max(1, cols - 1)), y + row * (height / rows), z);
    }
  }
}

function addColumnRow(group, mat, startX, endX, height, z, count) {
  for (let i = 0; i < count; i += 1) {
    const x = startX + (i / Math.max(1, count - 1)) * (endX - startX);
    addCylinder(group, mat, 0.05, height, x, 0.28, z, 12);
  }
}



function addSupplyCrate(group, mats, x, y, z, size) {
  addBox(group, mats.wood, size, size * 0.72, size * 0.82, x, y, z);
  addBox(group, mats.metal, size * 1.08, size * 0.1, size * 0.9, x, y + size * 0.5, z);
  addBox(group, mats.outline, size * 0.1, size * 0.76, size * 0.9, x, y + size * 0.02, z);
}

function addImportedSourceMarker(group, mats, w) {
  addBox(group, mats.glow, w * 0.28, 0.08, w * 0.28, -w * 1.08, 0.72, w * 0.92);
  addBox(group, mats.outline, w * 0.38, 0.05, w * 0.38, -w * 1.08, 0.67, w * 0.92);
}

function buildObsidianBastionSettlement({ group, mats, h, w }) {
  addCylinder(group, mats.dark, w * 1.22, h * 0.12, 0, 0.18, 0, 12).scale.z = 0.78;
  addBox(group, mats.outline, w * 2.0, h * 0.16, w * 1.34, 0, 0.22, 0);
  addBox(group, mats.primary, w * 1.24, h * 0.62, w * 0.92, 0, h * 0.28, 0);
  addBox(group, mats.dark, w * 1.56, h * 0.12, w * 1.08, 0, h * 0.9, 0);
  for (const x of [-0.78, 0.78]) {
    for (const z of [-0.58, 0.58]) {
      addCylinder(group, mats.primary, w * 0.2, h * 0.72, x * w, h * 0.2, z * w, 10);
      addCylinder(group, mats.dark, w * 0.23, h * 0.1, x * w, h * 0.88, z * w, 10);
      addCone(group, mats.secondary, w * 0.24, h * 0.3, x * w, h * 0.98, z * w, 8);
    }
  }
  addBox(group, mats.dark, w * 0.5, h * 0.38, 0.08, 0, h * 0.25, -w * 0.7);
  addTorus(group, mats.glow, w * 0.44, 0.026, 0, h * 0.58, -w * 0.75).rotation.x = Math.PI / 2;
  for (let i = 0; i < 7; i += 1) {
    const x = -w * 0.76 + i * w * 0.25;
    addBox(group, i % 2 ? mats.accent : mats.dark, w * 0.08, h * (0.16 + (i % 3) * 0.04), w * 0.08, x, h * 1.02, -w * 0.58);
  }
}

function buildRiftGateCitadelSettlement({ group, mats, h, w }) {
  addCylinder(group, mats.dark, w * 1.16, h * 0.12, 0, 0.18, 0, 14).scale.z = 0.72;
  for (const side of [-1, 1]) {
    const pylon = addBox(group, mats.primary, w * 0.34, h * 1.32, w * 0.32, side * w * 0.42, h * 0.2, 0);
    pylon.rotation.z = -side * 0.08;
    addCylinder(group, mats.glass, w * 0.08, h * 1.18, side * w * 0.68, h * 0.24, -w * 0.2, 8);
    addBox(group, mats.glow, w * 0.06, h * 1.05, 0.06, side * w * 0.28, h * 0.34, -w * 0.34);
  }
  const portal = addSphere(group, mats.glass, w * 0.58, 0, h * 0.78, -w * 0.36);
  portal.scale.set(0.72, 1.28, 0.1);
  addTorus(group, mats.glow, w * 0.68, 0.035, 0, h * 0.8, -w * 0.4);
  addTorus(group, mats.accent, w * 0.9, 0.022, 0, h * 0.8, -w * 0.42);
  addBox(group, mats.secondary, w * 1.12, h * 0.12, w * 0.44, 0, h * 0.22, w * 0.42);
  for (const x of [-0.82, 0, 0.82]) {
    addCylinder(group, mats.primary, w * 0.08, h * 0.7, x * w, h * 0.18, w * 0.36, 8);
    addSphere(group, mats.glow, w * 0.1, x * w, h * 0.96, w * 0.36);
  }
}

function buildBlackCrownKeepSettlement({ group, mats, h, w }) {
  addCylinder(group, mats.dark, w * 1.04, h * 0.12, 0, 0.18, 0, 8).scale.z = 0.78;
  addBox(group, mats.primary, w * 1.0, h * 1.12, w * 0.84, 0, 0.24, 0);
  addBox(group, mats.dark, w * 1.18, h * 0.14, w * 0.98, 0, h * 1.2, 0);
  for (const x of [-0.54, 0.54]) {
    for (const z of [-0.44, 0.44]) {
      addCone(group, mats.secondary, w * 0.13, h * 0.42, x * w, h * 1.28, z * w, 4).rotation.y = Math.PI / 4;
    }
  }
  for (let i = 0; i < 9; i += 1) {
    const x = -w * 0.52 + i * w * 0.13;
    addBox(group, i % 3 ? mats.dark : mats.accent, w * 0.06, h * (0.2 + (i % 3) * 0.05), w * 0.08, x, h * 1.28, -w * 0.48);
  }
  addCrown(group, mats.accent, 0, h * 1.58, -w * 0.06, w * 0.72);
  addBox(group, mats.dark, w * 0.34, h * 0.42, 0.08, 0, h * 0.22, -w * 0.47);
  addBox(group, mats.glow, w * 0.08, h * 0.36, 0.09, 0, h * 0.26, -w * 0.52);
}

function addBox(group, mat, width, height, depth, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  mesh.position.set(x, y + height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCylinder(group, mat, radius, height, x, y, z, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, renderSegmentCount(segments, 6, 0.58)), mat);
  mesh.position.set(x, y + height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCone(group, mat, radius, height, x, y, z, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, renderSegmentCount(segments, 5, 0.58)), mat);
  mesh.position.set(x, y + height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addSphere(group, mat, radius, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, isMapRenderProfile() ? 10 : 20, isMapRenderProfile() ? 6 : 12), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addOctahedron(group, mat, radius, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(radius, 0), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addTorus(group, mat, radius, tube, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, renderSegmentCount(10, 5, 0.6), renderSegmentCount(48, 18, 0.5)),
    mat
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addTube(group, mat, points, radius) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, isMapRenderProfile() ? 10 : 20, radius, isMapRenderProfile() ? 5 : 8, false),
    mat
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function rotatePalette(colors, offset) {
  return colors.map((_, index) => colors[(index + offset) % colors.length]);
}

function mixColor(a, b, t) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  ca.lerp(cb, t);
  return `#${ca.getHexString()}`;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

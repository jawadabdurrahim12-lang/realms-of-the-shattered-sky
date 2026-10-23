export const WORLD_W = 6600,
  FLOOR = 690;
export const CLASS_NAMES = [
  "Swordmaster",
  "Archmage",
  "Ascendant",
  "Necromancer",
  "Conjurer",
  "Sky Knight",
];
export const COLORS = [
  "#f6bb66",
  "#ac9bff",
  "#63e9e1",
  "#b0e57b",
  "#f2a1d5",
  "#80caff",
];
export const ABILITIES = [
  [
    "Quick Slash",
    "Heavy Strike",
    "Dash Attack",
    "Spinning Blade",
    "Defensive Parry",
    "Bladestorm",
  ],
  [
    "Fireball",
    "Ice Lance",
    "Chain Lightning",
    "Teleport",
    "Arcane Shield",
    "Meteor Storm",
  ],
  [
    "Energy Blast",
    "Rapid Punches",
    "Energy Wave",
    "Flash Step",
    "Aura Explosion",
    "Awakened Transformation",
  ],
  [
    "Shadow Bolt",
    "Raise Skeleton",
    "Life Drain",
    "Bone Prison",
    "Soul Harvest",
    "Army of the Dead",
  ],
  [
    "Summon Wolf",
    "Summon Elemental",
    "Summon Spirit Archer",
    "Healing Totem",
    "Companion Command",
    "Celestial Titan",
  ],
  [
    "Wind Blade",
    "Aerial Strike",
    "Wing Dash",
    "Diving Spear",
    "Air Shield",
    "Storm Ascension",
  ],
];
export const COOLDOWNS = [
  [0.32, 3, 4, 7, 9, 35],
  [0.5, 3, 6, 5, 10, 38],
  [0.4, 3, 6, 5, 9, 40],
  [0.55, 7, 5, 8, 10, 40],
  [1, 7, 8, 12, 5, 40],
  [0.4, 3, 4, 6, 10, 36],
];
export const ABILITY_HELP = [
  [
    "Short frontal slash",
    "Wide, armour-breaking strike",
    "Invulnerable rush and strike",
    "Hit all nearby enemies",
    "Brief immunity; restores health",
    "Six sweeping blade pulses",
  ],
  [
    "Explosive fire projectile",
    "Piercing lance; slows targets",
    "Instant lightning chains to nearby foes",
    "Teleport toward your aim",
    "Absorbs damage for 4 seconds",
    "Six targeted meteor impacts",
  ],
  [
    "Fast energy projectile",
    "Close-range flurry",
    "Piercing energy wave",
    "Teleport and gain immunity",
    "Radial energy burst",
    "14 seconds of double damage and free flight",
  ],
  [
    "Shadow projectile",
    "Autonomous skeleton companion",
    "Drain enemy life to heal",
    "Roots nearby enemies",
    "Consume nearby souls for healing",
    "Summons six temporary skeletons",
  ],
  [
    "Persistent hunting wolf",
    "Ranged fire elemental",
    "Ranged spirit archer",
    "Stationary party healing totem",
    "Heal and empower all your companions",
    "Summon a powerful celestial titan",
  ],
  [
    "Piercing wind projectile",
    "Rising spear strike",
    "Air dash with immunity",
    "Dive with a ground shockwave",
    "Shield and restore flight",
    "Flight refill, aerial burst, empowered attacks",
  ],
];
export const ENEMIES = [
  ["Corrupted Slime", "split", "slime", 36, 55],
  ["Goblin Raider", "charge", "goblin", 45, 105],
  ["Goblin Archer", "archer", "archer", 32, 65],
  ["Bone Soldier", "block", "skeleton", 55, 60],
  ["Cursed Bat", "swoop", "bat", 27, 130],
  ["Rift Imp", "blink", "imp", 35, 70],
  ["Plague Hound", "injured", "wolf", 42, 125],
  ["Goblin Shaman", "buff", "mage", 36, 55],
  ["Thorn Crawler", "burrow", "crawler", 48, 65],
  ["Venom Spider", "web", "spider", 43, 100],
  ["Rotting Treant", "roots", "tree", 90, 25],
  ["Swamp Witch", "poison", "witch", 52, 65],
  ["Corrupted Wolf", "pack", "wolf", 49, 140],
  ["Mushroom Bomber", "explode", "mushroom", 35, 90],
  ["Ancient Golem", "weak", "golem", 100, 35],
  ["Forest Wraith", "invisible", "ghost", 42, 105],
  ["Storm Harpy", "dive", "harpy", 48, 130],
  ["Sky Serpent", "serpent", "serpent", 65, 110],
  ["Thunder Elemental", "electric", "elemental", 62, 70],
  ["Cloud Mimic", "mimic", "chest", 85, 130],
  ["Clockwork Guardian", "burst", "robot", 75, 40],
  ["Wind Spirit", "gust", "ghost", 48, 80],
  ["Celestial Archer", "tracking", "archer", 49, 75],
  ["Sky Sentinel", "rear", "sentinel", 90, 70],
  ["Void Knight", "heavy", "knight", 110, 55],
  ["Shadow Assassin", "behind", "assassin", 60, 120],
  ["Soul Reaper", "drain", "reaper", 70, 90],
  ["Rift Mage", "summon", "mage", 65, 50],
  ["Abyssal Beast", "smash", "beast", 120, 95],
  ["Corrupted Angel", "aerial", "angel", 75, 95],
  ["Void Devourer", "consume", "devourer", 90, 70],
  ["Hollow Champion", "hybrid", "champion", 110, 85],
].map((e, i) => ({
  id: i,
  name: e[0] as string,
  behavior: e[1] as string,
  shape: e[2] as string,
  hp: e[3] as number,
  speed: e[4] as number,
  act: Math.floor(i / 8),
}));
export const BOSSES = [
  {
    name: "The Rift Stalker",
    shape: "beast",
    hp: 1000,
    kind: "stalker",
    color: "#a88bfa",
  },
  {
    name: "Ashfang, Siege Warlord",
    shape: "goblin",
    hp: 1800,
    kind: "ashfang",
    color: "#ff8759",
  },
  {
    name: "The Mire Witch",
    shape: "witch",
    hp: 1200,
    kind: "mire",
    color: "#c2df73",
  },
  {
    name: "Rootmother, Heart of the Blight",
    shape: "tree",
    hp: 2100,
    kind: "rootmother",
    color: "#b4cf65",
  },
  {
    name: "The Skybreaker Roc",
    shape: "harpy",
    hp: 1350,
    kind: "roc",
    color: "#8fd9f1",
  },
  {
    name: "Aetherion, Storm Guardian",
    shape: "sentinel",
    hp: 2300,
    kind: "aetherion",
    color: "#9dafff",
  },
  {
    name: "The Gravebound Herald",
    shape: "knight",
    hp: 1600,
    kind: "herald",
    color: "#f5a1c6",
  },
  {
    name: "The Hollow King",
    shape: "king",
    hp: 3600,
    kind: "king",
    color: "#eab8ff",
  },
  {
    name: "The Mimic Sovereign",
    shape: "chest",
    hp: 1600,
    kind: "mimicboss",
    color: "#ffe4a2",
  },
  {
    name: "The Buried Oracle",
    shape: "ghost",
    hp: 1800,
    kind: "oracle",
    color: "#bceca7",
  },
  {
    name: "The Clockwork Behemoth",
    shape: "robot",
    hp: 2000,
    kind: "clockwork",
    color: "#ffce8d",
  },
  {
    name: "The Nameless Star",
    shape: "star",
    hp: 4300,
    kind: "star",
    color: "#fff3ca",
  },
];
export const ACTS = [
  {
    name: "The Fallen Village",
    region: "EMBERFALL",
    subtitle: "A light still burns beneath the broken sky.",
    colors: ["#101827", "#243a4c", "#657f7c", "#b9986c"],
    npc: "Elder Sera",
    dialogue: [
      "You woke beneath six falling stars. That makes you either our salvation or a very expensive omen.",
      "The village bell is silent. Follow the lanterns into the catacombs. The Rift Stalker guards our first relic.",
      "The runes read: SUN, MOON, STAR. Remember them. Ashfang waits beyond the broken aqueduct.",
    ],
    boss: 1,
    puzzle: "runes",
    hint: "Read the elder’s inscription: Sun → Moon → Star.",
  },
  {
    name: "The Cursed Wilderness",
    region: "THE VERDANT WOUND",
    subtitle: "The forest remembers what the king forgot.",
    colors: ["#111e23", "#25443f", "#6a8d68", "#b8ce82"],
    npc: "Moss, the Wandering Merchant",
    dialogue: [
      "I sell things the trees spit out. No refunds if they grow legs.",
      "Those roots feed on the king’s memories. He broke the Core to seal something worse outside our world.",
      "Hold both moonstones alight. A lone traveller can charge them one at a time; friends can stand together.",
    ],
    boss: 3,
    puzzle: "plates",
    hint: "Stand on each glowing plate until charged. Stored light does not fade.",
  },
  {
    name: "The Kingdom Above",
    region: "THE AETHER REACH",
    subtitle: "Beyond the clouds, the old machines are waking.",
    colors: ["#172538", "#3b587a", "#9fc5cf", "#e6c58c"],
    npc: "Ilex, Ancient Guardian",
    dialogue: [
      "Your wings are no accident. The six powers were never weapons. They were keys.",
      "Sera was the Core’s keeper. The Hollow King was her son. She hid his name to hide her guilt.",
      "Align the three mirrors to EAST, NORTH, WEST. Their beam will open the storm seal.",
    ],
    boss: 5,
    puzzle: "mirrors",
    hint: "Interact with the three mirrors until their directions read E, N, W.",
  },
  {
    name: "The Shattered Throne",
    region: "THE LAST LIGHT",
    subtitle: "Even a hollow heart can remember the dawn.",
    colors: ["#1d172a", "#42304e", "#98748f", "#e4a9c8"],
    npc: "Sir Cael, Fallen Royal Knight",
    dialogue: [
      "I stood beside him when the stars went dark. He gave his heart to the breach so we could live.",
      "The thing wearing his crown is the hunger beyond the sky. Break its crystals. Reach the man beneath.",
      "Fill the four relics. In the last phase, use the altar’s light to make him mortal again.",
    ],
    boss: 7,
    puzzle: "relics",
    hint: "Stand beside each relic and hold E to fill it. All classes can channel.",
  },
];
export const ENDING = [
  "THE LAST LIGHT",
  "The crown falls. For the first time in a thousand nights, the king remembers his name.",
  "“Mother… is the village still there?”",
  "Sera takes his hand. “Yes, Aeron. They kept the lanterns lit.”",
  "The six fragments rise. Across Emberfall, the forest and the floating kingdom, the wounds in the sky begin to close.",
  "The king spends his last breath sealing the darkness. What returns to the world is not a throne, but a dawn.",
  "REALMS OF THE SHATTERED SKY",
  "An original cooperative adventure • Code, procedural art and synthesized music created for this project.",
  "Thank you for keeping the lanterns lit. Explore the remaining secrets, or create a new world.",
];
export const SLOTS = [
  "weapon",
  "focus",
  "helmet",
  "chest",
  "boots",
  "accessory1",
  "accessory2",
  "outfit",
];
export const RANKS = ["C", "B", "A", "S"];
export type Item = {
  id: string;
  name: string;
  slot: string;
  rank: number;
  damage: number;
  defence: number;
  speed: number;
  crit: number;
  flight: number;
  summons: number;
  classId: number;
};
export function makeItem(
  id: string,
  rank: number,
  classId: number,
  slot = "weapon",
): Item {
  const bases = [
    "Dawnsteel",
    "Starfire",
    "Sunfist",
    "Gravetide",
    "Spiritcall",
    "Galesong",
  ];
  const nouns: Record<string, string> = {
    weapon: ["Blade", "Staff", "Gauntlets", "Relic", "Bell", "Spear"][classId],
    focus: "Focus",
    helmet: "Crown",
    chest: "Mail",
    boots: "Wings",
    accessory1: "Charm",
    accessory2: "Signet",
    outfit: "Mantle",
  };
  return {
    id,
    name: `${["Weathered", "Runed", "Astral", "Dawnbound"][rank]} ${bases[classId]} ${nouns[slot]}`,
    slot,
    rank,
    damage:
      slot === "weapon" ? 3 + rank * 5 : slot === "focus" ? 2 + rank * 2 : 0,
    defence: ["helmet", "chest"].includes(slot) ? 2 + rank * 2 : 0,
    speed: slot === "boots" ? 10 + rank * 8 : 0,
    crit: slot === "accessory1" ? 5 + rank * 4 : 0,
    flight: slot === "boots" ? 1 + rank * 0.5 : 0,
    summons: slot === "accessory2" ? 1 : 0,
    classId,
  };
}
export function platforms(act: number) {
  const p = [{ x: 0, y: FLOOR, w: WORLD_W, h: 140 }];
  for (let i = 0; i < 18; i++) {
    const x = 650 + i * 310;
    p.push({
      x,
      y: 530 - (i % 3) * 65 - (act === 2 ? 70 : 0),
      w: 180 + (i % 2) * 70,
      h: 24,
    });
    if (i % 3 === 0) p.push({ x: x + 130, y: 290, w: 130, h: 22 });
  }
  return p;
}

// src/server.ts
import express from "express";
import { createServer as httpServer } from "node:http";
import { Server } from "socket.io";
import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// src/engine.ts
import { randomUUID } from "node:crypto";

// src/content.ts
var WORLD_W = 6600;
var FLOOR = 690;
var ABILITIES = [
  [
    "Quick Slash",
    "Heavy Strike",
    "Dash Attack",
    "Spinning Blade",
    "Defensive Parry",
    "Bladestorm"
  ],
  [
    "Fireball",
    "Ice Lance",
    "Chain Lightning",
    "Teleport",
    "Arcane Shield",
    "Meteor Storm"
  ],
  [
    "Energy Blast",
    "Rapid Punches",
    "Energy Wave",
    "Flash Step",
    "Aura Explosion",
    "Awakened Transformation"
  ],
  [
    "Shadow Bolt",
    "Raise Skeleton",
    "Life Drain",
    "Bone Prison",
    "Soul Harvest",
    "Army of the Dead"
  ],
  [
    "Summon Wolf",
    "Summon Elemental",
    "Summon Spirit Archer",
    "Healing Totem",
    "Companion Command",
    "Celestial Titan"
  ],
  [
    "Wind Blade",
    "Aerial Strike",
    "Wing Dash",
    "Diving Spear",
    "Air Shield",
    "Storm Ascension"
  ]
];
var COOLDOWNS = [
  [0.32, 3, 4, 7, 9, 35],
  [0.5, 3, 6, 5, 10, 38],
  [0.4, 3, 6, 5, 9, 40],
  [0.55, 7, 5, 8, 10, 40],
  [1, 7, 8, 12, 5, 40],
  [0.4, 3, 4, 6, 10, 36]
];
var ENEMIES = [
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
  ["Hollow Champion", "hybrid", "champion", 110, 85]
].map((e, i) => ({
  id: i,
  name: e[0],
  behavior: e[1],
  shape: e[2],
  hp: e[3],
  speed: e[4],
  act: Math.floor(i / 8)
}));
var BOSSES = [
  {
    name: "The Rift Stalker",
    shape: "beast",
    hp: 1e3,
    kind: "stalker",
    color: "#a88bfa"
  },
  {
    name: "Ashfang, Siege Warlord",
    shape: "goblin",
    hp: 1800,
    kind: "ashfang",
    color: "#ff8759"
  },
  {
    name: "The Mire Witch",
    shape: "witch",
    hp: 1200,
    kind: "mire",
    color: "#c2df73"
  },
  {
    name: "Rootmother, Heart of the Blight",
    shape: "tree",
    hp: 2100,
    kind: "rootmother",
    color: "#b4cf65"
  },
  {
    name: "The Skybreaker Roc",
    shape: "harpy",
    hp: 1350,
    kind: "roc",
    color: "#8fd9f1"
  },
  {
    name: "Aetherion, Storm Guardian",
    shape: "sentinel",
    hp: 2300,
    kind: "aetherion",
    color: "#9dafff"
  },
  {
    name: "The Gravebound Herald",
    shape: "knight",
    hp: 1600,
    kind: "herald",
    color: "#f5a1c6"
  },
  {
    name: "The Hollow King",
    shape: "king",
    hp: 3600,
    kind: "king",
    color: "#eab8ff"
  },
  {
    name: "The Mimic Sovereign",
    shape: "chest",
    hp: 1600,
    kind: "mimicboss",
    color: "#ffe4a2"
  },
  {
    name: "The Buried Oracle",
    shape: "ghost",
    hp: 1800,
    kind: "oracle",
    color: "#bceca7"
  },
  {
    name: "The Clockwork Behemoth",
    shape: "robot",
    hp: 2e3,
    kind: "clockwork",
    color: "#ffce8d"
  },
  {
    name: "The Nameless Star",
    shape: "star",
    hp: 4300,
    kind: "star",
    color: "#fff3ca"
  }
];
var ACTS = [
  {
    name: "The Fallen Village",
    region: "EMBERFALL",
    subtitle: "A light still burns beneath the broken sky.",
    colors: ["#101827", "#243a4c", "#657f7c", "#b9986c"],
    npc: "Elder Sera",
    dialogue: [
      "You woke beneath six falling stars. That makes you either our salvation or a very expensive omen.",
      "The village bell is silent. Follow the lanterns into the catacombs. The Rift Stalker guards our first relic.",
      "The runes read: SUN, MOON, STAR. Remember them. Ashfang waits beyond the broken aqueduct."
    ],
    boss: 1,
    puzzle: "runes",
    hint: "Read the elder\u2019s inscription: Sun \u2192 Moon \u2192 Star."
  },
  {
    name: "The Cursed Wilderness",
    region: "THE VERDANT WOUND",
    subtitle: "The forest remembers what the king forgot.",
    colors: ["#111e23", "#25443f", "#6a8d68", "#b8ce82"],
    npc: "Moss, the Wandering Merchant",
    dialogue: [
      "I sell things the trees spit out. No refunds if they grow legs.",
      "Those roots feed on the king\u2019s memories. He broke the Core to seal something worse outside our world.",
      "Hold both moonstones alight. A lone traveller can charge them one at a time; friends can stand together."
    ],
    boss: 3,
    puzzle: "plates",
    hint: "Stand on each glowing plate until charged. Stored light does not fade."
  },
  {
    name: "The Kingdom Above",
    region: "THE AETHER REACH",
    subtitle: "Beyond the clouds, the old machines are waking.",
    colors: ["#172538", "#3b587a", "#9fc5cf", "#e6c58c"],
    npc: "Ilex, Ancient Guardian",
    dialogue: [
      "Your wings are no accident. The six powers were never weapons. They were keys.",
      "Sera was the Core\u2019s keeper. The Hollow King was her son. She hid his name to hide her guilt.",
      "Align the three mirrors to EAST, NORTH, WEST. Their beam will open the storm seal."
    ],
    boss: 5,
    puzzle: "mirrors",
    hint: "Interact with the three mirrors until their directions read E, N, W."
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
      "Fill the four relics. In the last phase, use the altar\u2019s light to make him mortal again."
    ],
    boss: 7,
    puzzle: "relics",
    hint: "Stand beside each relic and hold E to fill it. All classes can channel."
  }
];
var SLOTS = [
  "weapon",
  "focus",
  "helmet",
  "chest",
  "boots",
  "accessory1",
  "accessory2",
  "outfit"
];
function makeItem(id, rank, classId, slot = "weapon") {
  const bases = [
    "Dawnsteel",
    "Starfire",
    "Sunfist",
    "Gravetide",
    "Spiritcall",
    "Galesong"
  ];
  const nouns = {
    weapon: ["Blade", "Staff", "Gauntlets", "Relic", "Bell", "Spear"][classId],
    focus: "Focus",
    helmet: "Crown",
    chest: "Mail",
    boots: "Wings",
    accessory1: "Charm",
    accessory2: "Signet",
    outfit: "Mantle"
  };
  return {
    id,
    name: `${["Weathered", "Runed", "Astral", "Dawnbound"][rank]} ${bases[classId]} ${nouns[slot]}`,
    slot,
    rank,
    damage: slot === "weapon" ? 3 + rank * 5 : slot === "focus" ? 2 + rank * 2 : 0,
    defence: ["helmet", "chest"].includes(slot) ? 2 + rank * 2 : 0,
    speed: slot === "boots" ? 10 + rank * 8 : 0,
    crit: slot === "accessory1" ? 5 + rank * 4 : 0,
    flight: slot === "boots" ? 1 + rank * 0.5 : 0,
    summons: slot === "accessory2" ? 1 : 0,
    classId
  };
}
function platforms(act) {
  const p = [{ x: 0, y: FLOOR, w: WORLD_W, h: 140 }];
  for (let i = 0; i < 18; i++) {
    const x = 650 + i * 310;
    p.push({
      x,
      y: 530 - i % 3 * 65 - (act === 2 ? 70 : 0),
      w: 180 + i % 2 * 70,
      h: 24
    });
    if (i % 3 === 0) p.push({ x: x + 130, y: 290, w: 130, h: 22 });
  }
  return p;
}

// src/engine.ts
var clamp = (n, a, b) => Math.max(a, Math.min(b, n));
var dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
var uid = () => randomUUID().slice(0, 10);
var World = class {
  id;
  act = 0;
  time = 0;
  difficulty;
  players = {};
  enemies = [];
  projectiles = [];
  hazards = [];
  summons = [];
  loot = [];
  events = [];
  checkpoint = 160;
  spawned = [];
  miniDead = false;
  bossDead = false;
  optionalDead = [];
  puzzle = { done: false, values: [0, 0, 0, 0], step: 0 };
  dialogue = null;
  dialogueVotes = [];
  ended = false;
  endingAt = 0;
  lastActive = Date.now();
  version = 1;
  secretRelics = 0;
  sideQuest = 0;
  relicPulse = 0;
  constructor(id, difficulty = "Adventurer") {
    this.id = id;
    this.difficulty = difficulty;
    this.opening();
  }
  opening() {
    this.dialogue = {
      speaker: ACTS[this.act].npc,
      lines: ACTS[this.act].dialogue,
      index: 0
    };
    this.dialogueVotes = [];
  }
  addPlayer(name, classId, color, token) {
    let p = token ? Object.values(this.players).find((p2) => p2.token === token) : null;
    if (p) {
      p.connected = true;
      p.lastSeen = Date.now();
      p.input = {};
      p.prev = {};
      return p;
    }
    if (Object.values(this.players).filter(
      (p2) => p2.connected || Date.now() - p2.lastSeen < 3e5
    ).length >= 6)
      throw Error(
        "This world has six heroes. Try again after a slot becomes free."
      );
    const retired = Object.values(this.players).find(
      (p2) => !p2.connected && Date.now() - p2.lastSeen >= 3e5
    );
    if (retired) delete this.players[retired.id];
    classId = clamp(Math.floor(classId) || 0, 0, 5);
    let item = makeItem(uid(), 0, classId);
    p = {
      id: uid(),
      token: randomUUID(),
      name: name.trim().slice(0, 20) || "Wanderer",
      classId,
      color: /^#[a-f0-9]{6}$/i.test(color) ? color : "#8de0cf",
      x: this.checkpoint,
      y: 600,
      vx: 0,
      vy: 0,
      hp: 120,
      maxHp: 120,
      facing: 1,
      ground: false,
      jumps: 0,
      flight: 4,
      cool: Array(7).fill(0),
      input: {},
      prev: {},
      inventory: [item],
      equipment: { weapon: item.id },
      gold: 0,
      invuln: 3,
      shield: 0,
      power: 0,
      down: 0,
      revive: 0,
      connected: true,
      lastSeen: Date.now(),
      attackTime: 0
    };
    this.players[p.id] = p;
    this.lastActive = Date.now();
    return p;
  }
  active() {
    return Object.values(this.players).filter((p) => p.connected);
  }
  living() {
    return this.active().filter((p) => p.hp > 0);
  }
  stats(p) {
    let r = {
      damage: 12,
      defence: 0,
      speed: 245,
      crit: 0,
      flight: this.act >= 2 ? 7 : 3.8,
      summons: 3
    };
    for (const id of Object.values(p.equipment)) {
      const it = p.inventory.find((i) => i.id === id);
      if (it) for (const k of Object.keys(r)) r[k] += it[k] || 0;
    }
    return r;
  }
  say(text, x = 0, y = 0, kind = "text") {
    this.events.push({ id: uid(), text, x, y, kind, t: this.time });
    if (this.events.length > 60) this.events.shift();
  }
  setInput(id, i) {
    const p = this.players[id];
    if (!p) return;
    p.input = {
      left: !!i.left,
      right: !!i.right,
      jump: !!i.jump,
      fly: !!i.fly,
      dodge: !!i.dodge,
      interact: !!i.interact,
      attack: !!i.attack,
      ability: Number.isInteger(i.ability) && i.ability >= 0 && i.ability <= 5 ? i.ability : p.input.ability,
      ax: Number.isFinite(i.ax) ? clamp(i.ax, 0, WORLD_W) : p.x + 100 * p.facing,
      ay: Number.isFinite(i.ay) ? clamp(i.ay, -100, 900) : p.y
    };
  }
  action(id, type, value) {
    const p = this.players[id];
    if (!p || !p.connected) return;
    if (type === "skip" && this.dialogue) {
      if (!this.dialogueVotes.includes(id)) this.dialogueVotes.push(id);
      if (this.dialogueVotes.length >= this.active().length) {
        this.dialogue.index++;
        this.dialogueVotes = [];
        if (this.dialogue.index >= this.dialogue.lines.length)
          this.dialogue = null;
      }
    }
    if (type === "equip" && typeof value === "string") {
      let item = p.inventory.find((i) => i.id === value);
      if (item && item.classId === p.classId && SLOTS.includes(item.slot))
        p.equipment[item.slot] = item.id;
    }
    if (type === "forge" && p.hp > 0 && Math.abs(p.x - this.checkpoint) < 220 && SLOTS.includes(value)) {
      const rank = Math.min(3, this.act + 1), cost = 25 + rank * 20;
      if (p.gold >= cost) {
        p.gold -= cost;
        this.give(p, rank, value);
        this.say("Tovin: A fine piece. Try not to lose it.", p.x, p.y - 60);
      }
    }
    if (type === "hint") this.say(ACTS[this.act].hint);
  }
  give(p, rank, slot = "weapon") {
    const it = makeItem(uid(), rank, p.classId, slot);
    p.inventory.push(it);
    if (p.inventory.length > 48) {
      const index = p.inventory.findIndex(
        (i) => !Object.values(p.equipment).includes(i.id) && i.id !== it.id
      );
      if (index >= 0) p.inventory.splice(index, 1);
    }
    const old = p.inventory.find((i) => i.id === p.equipment[slot]);
    if (!old || old.rank < rank) p.equipment[slot] = it.id;
    this.say(`${p.name}: ${it.name}`, p.x, p.y - 50, "loot");
  }
  spawn(type, x, y = FLOOR - 25, rank = 0, boss = -1) {
    const d = boss >= 0 ? BOSSES[boss] : ENEMIES[type];
    const hp = d.hp * (1 + 0.22 * Math.max(0, this.active().length - 1)) * (this.difficulty === "Casual" ? 0.75 : this.difficulty === "Heroic" ? 1.18 : 1) * (rank && boss < 0 ? 1 + rank * 0.2 : 1);
    const e = {
      id: uid(),
      type,
      name: d.name,
      behavior: boss >= 0 ? BOSSES[boss].kind : ENEMIES[type].behavior,
      shape: d.shape,
      x,
      y,
      vx: 0,
      vy: 0,
      hp,
      maxHp: hp,
      rank: boss >= 0 ? boss === 11 ? 3 : 2 : rank,
      boss,
      phase: 1,
      timer: 1,
      age: 0,
      state: "idle",
      targetX: x,
      targetY: y,
      shield: 0,
      slow: 0,
      flash: 0,
      facing: -1,
      spawnX: x,
      spawnY: y
    };
    this.enemies.push(e);
    return e;
  }
  projectile(owner, x, y, tx, ty, damage, effect = "bolt", friendly = true, speed = 480, pierce = 0) {
    const a = Math.atan2(ty - y, tx - x);
    this.projectiles.push({
      id: uid(),
      owner,
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      damage,
      effect,
      friendly,
      life: 3,
      radius: effect === "wave" ? 20 : 7,
      pierce,
      hits: []
    });
  }
  hazard(x, y, r, damage, effect = "blast", delay = 0.8, life = 0.4, owner) {
    this.hazards.push({
      id: uid(),
      x,
      y,
      r,
      damage,
      effect,
      delay,
      life,
      owner
    });
  }
  hurt(p, damage) {
    if (p.hp <= 0 || p.invuln > 0) return;
    const actual = Math.max(1, damage - this.stats(p).defence);
    if (p.shield > 0) {
      p.shield = Math.max(0, p.shield - actual);
      this.say("GUARD", p.x, p.y - 40, "heal");
    } else {
      p.hp = Math.max(0, p.hp - actual);
      this.say(`\u2212${Math.round(actual)}`, p.x, p.y - 45, "hurt");
    }
    p.invuln = 0.45;
    if (!p.hp) {
      p.down = 12;
      p.revive = 0;
      this.say(`${p.name} is down! Hold E nearby to revive.`);
    }
  }
  damage(e, amount, p, effect = "") {
    if (e.hp <= 0) return;
    if (e.shield > 0 && !["heavy", "lightning", "relic"].includes(effect))
      amount *= 0.12;
    if (["block", "rear"].includes(e.behavior) && p && Math.sign(p.x - e.x) === e.facing && !["heavy", "lightning"].includes(effect))
      amount *= 0.25;
    if (e.behavior === "weak" && e.state !== "recover" && effect !== "heavy")
      amount *= 0.4;
    if (e.behavior === "consume" && e.state === "guard" && effect === "projectile")
      return;
    if (p && Math.random() * 100 < this.stats(p).crit) amount *= 1.8;
    e.hp -= amount;
    e.flash = 0.12;
    this.say(`${Math.round(amount)}`, e.x, e.y - 35, "damage");
    if (effect === "ice") e.slow = 3;
    if (effect === "root") e.slow = 5;
    if (e.hp <= 0) this.kill(e, p);
  }
  kill(e, p) {
    if (e.dead) return;
    e.dead = true;
    e.hp = 0;
    this.say(e.boss >= 0 ? `${e.name} defeated` : "", e.x, e.y, "burst");
    if (e.boss >= 0) {
      const optional = e.boss >= 8;
      if (optional) {
        if (!this.optionalDead.includes(e.boss)) this.optionalDead.push(e.boss);
        this.secretRelics++;
      } else if (e.boss % 2 === 0) {
        this.miniDead = true;
        this.checkpoint = 3100;
      } else {
        this.bossDead = true;
        this.checkpoint = 5820;
      }
      this.hazards = [];
      this.projectiles = this.projectiles.filter((q) => q.friendly);
      this.enemies.filter((n) => n.behavior === "crystal").forEach((n) => n.hp = 0);
      for (const hero of this.active()) {
        hero.gold += 60;
        hero.hp = hero.maxHp;
        this.give(
          hero,
          optional ? 3 : Math.min(3, this.act + 1),
          e.boss % 2 === 0 ? "weapon" : "boots"
        );
        if (optional) this.give(hero, 3, "outfit");
      }
      if (e.boss === 7) {
        this.ended = true;
        this.endingAt = this.time;
        this.dialogue = null;
      } else
        this.dialogue = {
          speaker: optional ? "A forgotten voice" : e.boss % 2 === 0 ? "Lumen, Mysterious Spirit" : ACTS[this.act].npc,
          lines: optional ? ["The hidden relic answers. Another star remembers your name."] : e.boss % 2 === 0 ? [
            "The guardian releases its relic. Your equipment has been upgraded.",
            "Continue east. The ancient seal still bars the path."
          ] : [
            "A fragment returns to the Core. The road east is open.",
            "An optional star altar lies ahead. Or take the eastern portal to the next region."
          ],
          index: 0
        };
      this.dialogueVotes = [];
    } else if (e.behavior !== "crystal") {
      this.loot.push({
        id: uid(),
        x: e.x,
        y: e.y,
        kind: "gold",
        value: 3 + e.rank * 4
      });
      if (Math.random() < 0.12)
        this.loot.push({
          id: uid(),
          x: e.x + 15,
          y: e.y,
          kind: "gear",
          rank: e.rank,
          slot: SLOTS[1 + Math.floor(Math.random() * 6)]
        });
      if (e.behavior === "split" && !e.small) {
        for (let k = -1; k <= 1; k += 2) {
          const child = this.spawn(0, e.x + k * 25, e.y);
          child.small = true;
          child.hp = child.maxHp = 14;
        }
      }
      this.sideQuest++;
    }
  }
  area(p, r, damage, effect = "", forward = false) {
    for (const e of this.enemies)
      if (e.hp > 0 && dist(p, e) < r && (!forward || Math.sign(e.x - p.x) === p.facing || Math.abs(e.x - p.x) < 20))
        this.damage(e, damage, p, effect);
    this.say(effect, p.x, p.y, "slash");
  }
  summon(p, kind, life = 90) {
    const owned = this.summons.filter(
      (s) => s.owner === p.id && s.kind !== "totem"
    );
    const cap = kind === "skeletonArmy" ? 9 : this.stats(p).summons;
    if (owned.length >= cap) {
      this.summons.splice(this.summons.indexOf(owned[0]), 1);
    }
    this.summons.push({
      id: uid(),
      owner: p.id,
      kind: kind === "skeletonArmy" ? "skeleton" : kind,
      x: p.x,
      y: p.y,
      hp: 60,
      life,
      timer: 0.3,
      power: 1
    });
  }
  ability(p, n) {
    if (p.cool[n] > 0 || p.hp <= 0) return;
    const s = this.stats(p), d = s.damage * (p.power > 0 ? 2 : 1), tx = p.input.ax ?? p.x + 200 * p.facing, ty = p.input.ay ?? p.y;
    p.cool[n] = COOLDOWNS[p.classId][n];
    p.attackTime = 0.22;
    p.facing = tx >= p.x ? 1 : -1;
    const shot = (effect = "bolt", scale = 1, pierce = 0) => this.projectile(
      p.id,
      p.x,
      p.y - 12,
      tx,
      ty,
      d * scale,
      effect,
      true,
      560,
      pierce
    );
    const dash = () => {
      p.vx = p.facing * 780;
      p.invuln = 0.5;
      p.x = clamp(p.x + p.facing * 105, 30, this.gate() - 35);
    };
    if (n === 5)
      this.say(
        ABILITIES[p.classId][5].toUpperCase(),
        p.x,
        p.y - 75,
        "ultimate"
      );
    switch (p.classId) {
      case 0:
        if (n === 0) this.area(p, 105, d, "slash", true);
        if (n === 1) this.area(p, 145, d * 3, "heavy", true);
        if (n === 2) {
          dash();
          this.area(p, 130, d * 2, "heavy");
        }
        if (n === 3) this.area(p, 210, d * 2.5, "spin");
        if (n === 4) {
          p.invuln = 1.1;
          p.hp = Math.min(p.maxHp, p.hp + 12);
        }
        if (n === 5)
          for (let i = 0; i < 6; i++)
            this.hazard(p.x, p.y, 240, d * 1.6, "blade", i * 0.25, 0.12, p.id);
        break;
      case 1:
        if (n === 0) shot("fire", 1.2);
        if (n === 1) shot("ice", 2.2, 3);
        if (n === 2) this.area(p, 420, d * 2.5, "lightning");
        if (n === 3) dash();
        if (n === 4) {
          p.shield = 65;
          p.invuln = 0.5;
        }
        if (n === 5)
          for (let i = 0; i < 6; i++)
            this.hazard(
              clamp(tx + (i - 2.5) * 80, 0, WORLD_W),
              clamp(ty, 100, 650),
              145,
              d * 3,
              "meteor",
              0.5 + i * 0.3,
              0.15,
              p.id
            );
        break;
      case 2:
        if (n === 0) shot("energy");
        if (n === 1) this.area(p, 125, d * 3.6, "heavy", true);
        if (n === 2) shot("wave", 3, 6);
        if (n === 3) dash();
        if (n === 4) this.area(p, 250, d * 2.8, "aura");
        if (n === 5) {
          p.power = 14;
          p.hp = Math.min(p.maxHp, p.hp + 35);
          p.flight = 10;
        }
        break;
      case 3:
        if (n === 0) shot("shadow", 1.2);
        if (n === 1) this.summon(p, "skeleton");
        if (n === 2) {
          this.area(p, 330, d * 1.6, "drain");
          p.hp = Math.min(p.maxHp, p.hp + 22);
        }
        if (n === 3) this.area(p, 300, d, "root");
        if (n === 4) {
          this.area(p, 240, d * 2, "harvest");
          p.hp = Math.min(p.maxHp, p.hp + 30);
        }
        if (n === 5)
          for (let i = 0; i < 6; i++) this.summon(p, "skeletonArmy", 25);
        break;
      case 4:
        if (n < 3) this.summon(p, ["wolf", "elemental", "archer"][n]);
        if (n === 3) this.summon(p, "totem", 16);
        if (n === 4) {
          for (const s2 of this.summons.filter((s3) => s3.owner === p.id)) {
            s2.power = 2;
            s2.hp = 60;
          }
          shot("spirit", 2);
        }
        if (n === 5) this.summon(p, "titan", 24);
        break;
      case 5:
        if (n === 0) shot("wind", 1, 2);
        if (n === 1) {
          p.vy = -420;
          this.area(p, 170, d * 2.5, "heavy");
        }
        if (n === 2) {
          dash();
          p.flight = Math.min(s.flight, p.flight + 1);
        }
        if (n === 3) {
          p.y = Math.min(FLOOR - 22, p.y + 100);
          p.vy = 600;
          this.area(p, 230, d * 3, "heavy");
        }
        if (n === 4) {
          p.shield = 60;
          p.flight = s.flight;
        }
        if (n === 5) {
          p.power = 12;
          p.flight = 12;
          this.area(p, 500, d * 5, "lightning");
        }
        break;
    }
  }
  gate() {
    return !this.miniDead ? 2980 : !this.puzzle.done ? 4780 : WORLD_W;
  }
  interact(p, dt) {
    for (const friend of this.active())
      if (friend.hp <= 0 && dist(friend, p) < 100) {
        friend.revive += dt;
        if (friend.revive >= 2) {
          friend.hp = 60;
          friend.invuln = 3;
          friend.down = 0;
          this.say(`${friend.name} revived`, friend.x, friend.y, "heal");
        }
      }
    if (this.miniDead && !this.puzzle.done && Math.abs(p.x - 4200) < 500) {
      const k = clamp(
        Math.round((p.x - 3950) / 160),
        0,
        this.act === 3 ? 3 : 2
      );
      const near = Math.abs(p.x - (3950 + k * 160)) < 70 && Math.abs(p.y - (FLOOR - 22)) < 85;
      if (near) {
        if (this.act === 0 && !p.prev.interact) {
          if (k === [0, 1, 2][this.puzzle.step]) {
            this.puzzle.values[k] = 1;
            this.puzzle.step++;
          } else {
            this.puzzle.step = 0;
            this.puzzle.values = [0, 0, 0, 0];
            this.say("The runes dim. Sun, Moon, Star.");
          }
        }
        if (this.act === 2 && !p.prev.interact)
          this.puzzle.values[k] = (this.puzzle.values[k] + 1) % 4;
        if (this.act === 3)
          this.puzzle.values[k] = Math.min(1, this.puzzle.values[k] + dt / 2);
      }
    }
    if (p.prev.interact) return;
    if (Math.abs(p.x - 220) < 100) this.opening();
    if (Math.abs(p.x - 1100) < 80) {
      if (!this.spawned.includes(999)) {
        this.spawned.push(999);
        p.gold += 35;
        this.give(p, Math.min(3, this.act + 1), "accessory1");
        this.say(
          "Lumen: I was the king\u2019s hope. He hid me here before the breach.",
          p.x,
          p.y - 50
        );
      }
    }
    if (this.bossDead && Math.abs(p.x - 6070) < 100 && !this.optionalDead.includes(8 + this.act) && !this.enemies.some((e) => e.boss === 8 + this.act && e.hp > 0)) {
      if (this.act === 3 && this.secretRelics < 3)
        this.say("The Nameless Star requires the three hidden relics.");
      else {
        this.spawn(0, 5950, 430, 3, 8 + this.act);
        this.say("An ancient challenge answers.");
      }
    }
    if (this.bossDead && this.act < 3 && p.x > 6370) this.nextAct();
    if (Math.abs(p.x - this.checkpoint) < 100) {
      p.hp = p.maxHp;
      p.flight = this.stats(p).flight;
      this.say("Checkpoint \u2022 Restored", p.x, p.y - 50, "heal");
    }
  }
  nextAct() {
    this.act++;
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.summons = [];
    this.loot = [];
    this.spawned = [];
    this.checkpoint = 160;
    this.miniDead = false;
    this.bossDead = false;
    this.puzzle = { done: false, values: [0, 0, 0, 0], step: 0 };
    this.relicPulse = 0;
    for (const p of Object.values(this.players)) {
      p.x = 160;
      p.y = 600;
      p.hp = p.maxHp;
      p.invuln = 4;
      p.input = {};
      p.prev = {};
    }
    this.opening();
  }
  update(dt) {
    dt = Math.min(dt, 0.05);
    if (!this.active().length) return;
    this.time += dt;
    this.lastActive = Date.now();
    for (const p of this.active()) {
      const i = p.input, s = this.stats(p);
      p.cool = p.cool.map((c) => Math.max(0, c - dt));
      p.invuln = Math.max(0, p.invuln - dt);
      p.power = Math.max(0, p.power - dt);
      p.attackTime = Math.max(0, p.attackTime - dt);
      p.shield = Math.max(0, p.shield - dt * 5);
      if (p.hp <= 0) {
        p.down -= dt;
        if (p.down <= 0) {
          p.hp = p.maxHp * 0.6;
          p.x = this.checkpoint;
          p.y = 600;
          p.invuln = 4;
          p.revive = 0;
        }
        p.prev = { ...i };
        continue;
      }
      if (Math.abs(p.vx) > s.speed + 20) p.vx *= 0.85;
      else p.vx = ((i.right ? 1 : 0) - (i.left ? 1 : 0)) * s.speed;
      if (p.vx) p.facing = Math.sign(p.vx);
      if (i.jump && !p.prev.jump && p.jumps < 2) {
        p.vy = -430;
        p.jumps++;
        p.ground = false;
      }
      if (i.fly && (p.flight > 0 || p.power > 0)) {
        p.vy = Math.max(-220, p.vy - 1200 * dt);
        p.flight -= p.power > 0 ? 0 : dt;
      } else p.vy += 1e3 * dt;
      if (i.dodge && !p.prev.dodge && p.cool[6] <= 0) {
        p.vx = p.facing * 850;
        p.invuln = 0.4;
        p.cool[6] = 2.2;
      }
      const oldY = p.y;
      p.x = clamp(p.x + p.vx * dt, 25, this.gate() - 25);
      p.y += p.vy * dt;
      p.ground = false;
      if (p.vy >= 0) {
        for (const plat of platforms(this.act))
          if (p.x > plat.x - 12 && p.x < plat.x + plat.w + 12 && oldY + 22 <= plat.y + 8 && p.y + 22 >= plat.y) {
            p.y = plat.y - 22;
            p.vy = 0;
            p.ground = true;
            p.jumps = 0;
            p.flight = Math.min(s.flight, p.flight + dt * 3);
            break;
          }
      }
      p.y = Math.max(40, p.y);
      if (p.y > 900) {
        p.x = this.checkpoint;
        p.y = 600;
        this.hurt(p, 20);
      }
      if (i.attack) this.ability(p, 0);
      if (i.ability !== void 0) this.ability(p, i.ability);
      if (i.interact) this.interact(p, dt);
      if (p.x > 3170 && this.miniDead && this.checkpoint < 3e3)
        this.checkpoint = 3100;
      for (const drop of this.loot)
        if (!drop.taken && dist(p, drop) < 65) {
          drop.taken = true;
          if (drop.kind === "gold") {
            for (const a of this.active()) a.gold += drop.value;
          } else this.give(p, drop.rank, drop.slot);
        }
      p.prev = { ...i };
      p.input.ability = void 0;
    }
    const heroes = this.living();
    if (!heroes.length) return;
    const furthest = Math.max(...heroes.map((p) => p.x));
    for (let encounter = 0; encounter < 8; encounter++) {
      const x = 680 + encounter * 600;
      if (furthest > x - 480 && !this.spawned.includes(encounter) && x < this.gate()) {
        this.spawned.push(encounter);
        for (let j = 0; j < 2 + (this.active().length >= 3 ? 1 : 0); j++) {
          const t = this.act * 8 + (encounter + j * 3) % 8;
          this.spawn(
            t,
            x + j * 95,
            ["archer", "tracking"].includes(ENEMIES[t].behavior) ? 450 : FLOOR - 25,
            encounter === 6 ? 2 : encounter % 3 === 2 ? 1 : 0
          );
        }
      }
    }
    if (furthest > 2220 && !this.spawned.includes(100)) {
      this.spawned.push(100);
      this.spawn(0, 2650, 620, 2, this.act * 2);
      this.say(BOSSES[this.act * 2].name.toUpperCase());
    }
    if (this.puzzle.done && furthest > 5040 && !this.spawned.includes(101)) {
      this.spawned.push(101);
      this.spawn(0, 5540, 610, 2, this.act * 2 + 1);
      this.say(BOSSES[this.act * 2 + 1].name.toUpperCase());
    }
    if (this.act === 1 && this.miniDead && !this.puzzle.done) {
      for (let k = 0; k < 2; k++)
        if (heroes.some(
          (p) => Math.abs(p.x - (4e3 + k * 280)) < 70 && p.y > 590
        ) || this.summons.some((s) => Math.abs(s.x - (4e3 + k * 280)) < 70))
          this.puzzle.values[k] = Math.min(1, this.puzzle.values[k] + dt / 2);
    }
    if (!this.puzzle.done && this.miniDead) {
      if (Math.floor(this.time / 45) !== Math.floor((this.time - dt) / 45) && heroes.some((p) => p.x > 3800))
        this.say(ACTS[this.act].hint);
      const v = this.puzzle.values;
      const done = this.act === 0 ? this.puzzle.step >= 3 : this.act === 1 ? v[0] >= 1 && v[1] >= 1 : this.act === 2 ? v[0] === 1 && v[1] === 0 && v[2] === 3 : v.every((x) => x >= 1);
      if (done) {
        this.puzzle.done = true;
        this.say("THE SEAL OPENS \u2022 The path to the guardian is clear");
        for (const p of heroes) {
          p.gold += 20;
          p.hp = Math.min(p.maxHp, p.hp + 35);
        }
      }
    }
    for (const e of [...this.enemies])
      if (e.hp > 0) {
        e.age += dt;
        e.timer -= dt;
        e.slow = Math.max(0, e.slow - dt);
        e.flash = Math.max(0, e.flash - dt);
        if (e.boss >= 0) this.bossAI(e, heroes, dt);
        else this.enemyAI(e, heroes, dt);
      }
    for (const s of this.summons) {
      s.life -= dt;
      s.timer -= dt;
      const p = this.players[s.owner];
      if (!p || !p.connected) {
        s.life = 0;
        continue;
      }
      const targets = this.enemies.filter((e2) => e2.hp > 0 && dist(s, e2) < 650).sort((a, b) => dist(s, a) - dist(s, b));
      const e = targets[0];
      if (s.kind === "totem") {
        if (s.timer <= 0) {
          s.timer = 1;
          for (const h of heroes)
            if (dist(h, s) < 220) h.hp = Math.min(h.maxHp, h.hp + 5);
        }
        continue;
      }
      const t = e || { x: p.x - 45, y: p.y };
      s.x += (t.x - s.x) * Math.min(1, dt * 2.8);
      s.y += (t.y - 10 - s.y) * Math.min(1, dt * 3);
      if (e && s.timer <= 0) {
        const d = this.stats(p).damage * s.power * (s.kind === "titan" ? 2 : 0.65);
        s.timer = s.kind === "wolf" ? 0.65 : 1.1;
        if (["archer", "elemental"].includes(s.kind))
          this.projectile(
            p.id,
            s.x,
            s.y,
            e.x,
            e.y,
            d,
            s.kind === "elemental" ? "fire" : "spirit",
            true
          );
        else if (dist(s, e) < 110) this.damage(e, d, p, "summon");
        else s.timer = 0.1;
      }
    }
    for (const q of this.projectiles) {
      q.life -= dt;
      if (q.homing) {
        const p = heroes.reduce((a2, b) => dist(q, a2) < dist(q, b) ? a2 : b);
        const a = Math.atan2(p.y - q.y, p.x - q.x);
        q.vx += (Math.cos(a) * 260 - q.vx) * dt * 1.1;
        q.vy += (Math.sin(a) * 260 - q.vy) * dt * 1.1;
      }
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.friendly) {
        for (const e of this.enemies)
          if (e.hp > 0 && !q.hits.includes(e.id) && dist(q, e) < q.radius + (e.boss >= 0 ? 52 : 25)) {
            if (e.behavior === "consume" && e.state === "guard") {
              q.life = 0;
              break;
            }
            q.hits.push(e.id);
            this.damage(
              e,
              q.damage,
              this.players[q.owner],
              q.effect === "ice" ? "ice" : "projectile"
            );
            if (q.effect === "fire") {
              for (const n of this.enemies)
                if (n.id !== e.id && dist(n, e) < 80)
                  this.damage(n, q.damage * 0.4, this.players[q.owner], "fire");
            }
            if (q.pierce-- <= 0) {
              q.life = 0;
              break;
            }
          }
      } else
        for (const p of heroes)
          if (dist(q, p) < q.radius + 19) {
            this.hurt(p, q.damage);
            q.life = 0;
            break;
          }
    }
    for (const h of this.hazards) {
      h.delay -= dt;
      if (h.delay > 0) continue;
      h.life -= dt;
      if (h.owner) {
        const p = this.players[h.owner];
        for (const e of this.enemies)
          if (e.hp > 0 && dist(e, h) < h.r)
            this.damage(e, h.damage * dt * 8, p, h.effect);
      } else
        for (const p of heroes)
          if (dist(p, h) < h.r) {
            this.hurt(p, h.damage);
            if (h.effect === "web") p.vx *= 0.3;
            if (h.effect === "gust")
              p.x = clamp(
                p.x + Math.sign(p.x - h.x) * 120 * dt,
                25,
                this.gate() - 25
              );
          }
    }
    this.projectiles = this.projectiles.filter(
      (q) => q.life > 0 && q.x > -50 && q.x < WORLD_W + 50 && q.y < 950
    );
    this.hazards = this.hazards.filter((h) => h.life > 0);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.summons = this.summons.filter((s) => s.life > 0);
    this.loot = this.loot.filter((d) => !d.taken).slice(-100);
    this.events = this.events.filter((e) => this.time - e.t < 4);
  }
  enemyAI(e, heroes, dt) {
    if (e.behavior === "crystal") return;
    let p = heroes.reduce((a, b2) => dist(e, a) < dist(e, b2) ? a : b2);
    if (e.behavior === "injured")
      p = heroes.reduce((a, b2) => a.hp / a.maxHp < b2.hp / b2.maxHp ? a : b2);
    if (dist(e, p) > 950) return;
    const b = e.behavior, dx = p.x - e.x, d = dist(e, p), dir = Math.sign(dx) || 1;
    let speed = ENEMIES[e.type].speed * (e.slow > 0 ? 0.25 : 1);
    e.facing = dir;
    const shot = (effect = "hostile", count = 1) => {
      for (let k = 0; k < count; k++) {
        this.projectile(
          e.id,
          e.x,
          e.y - 10,
          p.x,
          p.y + (k - (count - 1) / 2) * 100,
          10 + this.act * 2,
          effect,
          false,
          270
        );
        if (b === "tracking") this.projectiles.at(-1).homing = true;
      }
    };
    const flight = [
      "swoop",
      "dive",
      "serpent",
      "aerial",
      "gust",
      "invisible",
      "electric"
    ].includes(b);
    if (flight) {
      const yy = p.y - 90 + Math.sin(e.age * 2 + e.spawnX) * 65;
      e.y += (yy - e.y) * dt * 1.8;
    } else if (!["archer", "tracking", "roots", "buff"].includes(b))
      e.y += (FLOOR - 25 - e.y) * dt * 5;
    let move = d > 45;
    if ([
      "archer",
      "tracking",
      "poison",
      "blink",
      "buff",
      "burst",
      "summon",
      "aerial",
      "hybrid",
      "electric"
    ].includes(b)) {
      move = Math.abs(dx) > 360;
      if (Math.abs(dx) < 180) e.x -= dir * speed * dt;
    }
    if (b === "mimic" && e.age < 1.5) {
      e.state = "disguised";
      return;
    }
    if (b === "invisible")
      e.state = Math.floor(e.age) % 5 < 2 ? "invisible" : "idle";
    if (b === "consume") e.state = Math.floor(e.age) % 6 < 3 ? "guard" : "idle";
    if (b === "burrow") e.state = Math.floor(e.age) % 5 < 2 ? "burrow" : "idle";
    if (b === "pack")
      speed *= 1 + 0.12 * this.enemies.filter((n) => n.type === e.type && dist(n, e) < 250).length;
    if (e.state === "charge") {
      e.x += e.vx * dt;
      if (["swoop", "dive"].includes(b)) e.y += (e.targetY - e.y) * dt * 7;
      if (b === "smash" && e.timer < 0.1)
        this.hazard(e.x, FLOOR - 25, 100, 14, "shock", 0.3, 0.2);
      if (e.timer <= 0) {
        e.state = "recover";
        e.timer = 1.1;
      }
      if (d < 45) this.hurt(p, 18 + this.act * 3);
      return;
    }
    if (e.state === "windup") {
      if (e.timer <= 0) {
        e.state = "charge";
        e.vx = dir * 480;
        e.timer = 0.6;
      }
      return;
    }
    if (e.state === "recover" && e.timer > 0) return;
    if (move && b !== "burrow") e.x += dir * speed * dt;
    if (e.timer <= 0) {
      e.timer = 2.1 + e.type % 3 * 0.4;
      switch (b) {
        case "charge":
        case "smash":
        case "dive":
        case "swoop":
          e.targetY = p.y;
          e.state = "windup";
          e.timer = 0.75;
          this.hazard(p.x, p.y, 40, 0, "warning", 0.7, 0.05);
          break;
        case "archer":
        case "tracking":
        case "blink":
        case "burst":
        case "serpent":
        case "aerial":
          shot(
            b === "serpent" ? "lightning" : "hostile",
            b === "burst" ? 3 : 1
          );
          if (b === "blink") e.x = clamp(p.x - dir * 220, 30, WORLD_W - 30);
          break;
        case "buff":
          for (const n of this.enemies)
            if (n.boss < 0 && dist(n, e) < 240)
              n.hp = Math.min(n.maxHp, n.hp + 8);
          this.say("MEND", e.x, e.y - 30, "heal");
          shot();
          break;
        case "web":
          this.hazard(p.x, FLOOR - 25, 85, 4, "web", 0.6, 3);
          break;
        case "roots":
        case "burrow":
          this.hazard(p.x, FLOOR - 25, 65, 16, "roots", 1, 0.6);
          if (b === "burrow") e.x = p.x - 90;
          break;
        case "poison":
          this.hazard(p.x, FLOOR - 25, 95, 9, "poison", 0.8, 4);
          break;
        case "explode":
          if (d < 180) {
            this.hazard(e.x, e.y, 130, 32, "explosion", 1, 0.2);
            e.hp = 0;
          } else e.timer = 0.3;
          break;
        case "weak":
          e.state = "recover";
          this.hazard(p.x, FLOOR - 25, 90, 20, "shock", 1, 0.3);
          break;
        case "electric":
          this.hazard(p.x, p.y, 95, 22, "lightning", 1.4, 0.3);
          break;
        case "gust":
          this.hazard(p.x, p.y, 170, 5, "gust", 0.5, 2);
          break;
        case "heavy":
          this.hazard(p.x, p.y, 100, 27, "slash", 1, 0.25);
          break;
        case "behind":
          e.x = clamp(p.x - p.facing * 85, 25, WORLD_W - 25);
          this.hazard(p.x, p.y, 65, 17, "slash", 0.8, 0.2);
          break;
        case "drain":
          if (d < 160) {
            this.hurt(p, 12);
            e.hp = Math.min(e.maxHp, e.hp + 10);
          }
          break;
        case "summon":
          if (this.enemies.length < 35) this.spawn(this.act * 8 + 1, e.x + 70);
          shot();
          break;
        case "hybrid":
          shot();
          this.hazard(p.x, p.y, 80, 20, "slash", 0.9, 0.25);
          break;
      }
      if (e.rank >= 2 && b !== "crystal") shot("elite", 2);
      if (e.rank === 3) {
        e.x = clamp(p.x - dir * 150, 350, WORLD_W - 50);
        this.hazard(p.x, p.y, 55, 18, "elite", 1, 0.25);
      }
    }
    if (d < 42) this.hurt(p, 8 + this.act * 3);
    e.x = clamp(e.x, 350, WORLD_W - 30);
  }
  crystals(e, n) {
    for (let k = 0; k < n; k++) {
      const c = this.spawn(
        this.act * 8,
        e.spawnX + (k - (n - 1) / 2) * 180,
        FLOOR - 30
      );
      c.behavior = "crystal";
      c.shape = e.behavior === "mire" ? "totem" : "crystal";
      c.name = e.behavior === "mire" ? "Cursed Totem" : "Corruption Heart";
      c.hp = c.maxHp = 65;
      c.rank = 1;
    }
    e.shield = 1;
    this.say("BREAK THE GLOWING ANCHORS TO EXPOSE THE GUARDIAN");
  }
  bossAI(e, heroes, dt) {
    const p = heroes.reduce((a, b2) => dist(e, a) < dist(e, b2) ? a : b2), b = e.behavior;
    let phase = e.hp / e.maxHp < 0.5 ? 2 : 1;
    if (b === "king")
      phase = e.hp / e.maxHp < 0.28 ? 3 : e.hp / e.maxHp < 0.67 ? 2 : 1;
    if (phase > e.phase) {
      e.phase = phase;
      this.say(`${e.name} \u2022 PHASE ${phase}`);
      if (["rootmother", "mire", "king"].includes(b) && phase === 2)
        this.crystals(e, 3);
      if (b === "king" && phase === 3) {
        e.shield = 1;
        this.relicPulse = 0;
        this.say(
          "THE LAST LIGHT \u2022 Hold E at the central altar to weaken the king"
        );
      }
    }
    if (e.shield && ["mire", "rootmother", "king"].includes(b) && !(b === "king" && e.phase === 3) && !this.enemies.some((n) => n.behavior === "crystal" && n.hp > 0))
      e.shield = 0;
    if (b === "king" && e.phase === 3 && e.shield) {
      if (heroes.some((h) => h.input.interact && Math.abs(h.x - 5500) < 130))
        this.relicPulse += dt;
      if (this.relicPulse >= 3) {
        e.shield = 0;
        this.say("THE SIX POWERS ANSWER \u2022 Finish the battle!");
      }
    }
    const flying = ["roc", "aetherion", "star", "oracle"].includes(b) || b === "king" && phase >= 2;
    e.facing = Math.sign(p.x - e.x) || 1;
    if (e.state === "lunge") {
      e.x += e.vx * dt;
      e.y += (p.y - e.y) * dt;
      if (dist(e, p) < 75) this.hurt(p, 26);
      if (e.timer <= 0) {
        e.state = "recover";
        e.timer = 1.8;
        e.shield = 0;
      }
      return;
    }
    if (e.state === "windup") {
      if (e.timer <= 0) {
        e.state = "lunge";
        e.vx = Math.sign(e.targetX - e.x) * 650;
        e.timer = 0.7;
      }
      return;
    }
    if (e.state === "recover" && e.timer > 0) return;
    if (b === "herald" && e.state === "guard") {
      if (e.timer > 0) return;
      e.shield = 0;
    }
    if (flying) {
      e.y = 420 + Math.sin(e.age * 1.4) * 110;
      e.x += (p.x - e.x) * dt * 0.3;
    } else {
      e.y += (FLOOR - 50 - e.y) * dt * 3;
      if (Math.abs(p.x - e.x) > 130) e.x += e.facing * 55 * dt;
    }
    if (e.timer <= 0) {
      e.timer = Math.max(1.3, 3.2 - phase * 0.5) - (this.difficulty === "Heroic" ? 0.35 : 0);
      e.state = "attack";
      const turn = Math.floor(e.age / 2) % 4;
      if (["stalker", "roc", "ashfang", "herald", "king"].includes(b) && turn === 0) {
        if (b === "stalker" || b === "king")
          e.x = clamp(p.x - p.facing * 240, 2200, 6200);
        e.state = "windup";
        e.targetX = p.x;
        e.targetY = p.y;
        e.timer = 1;
        this.hazard(p.x, p.y, 70, 0, "warning", 0.95, 0.1);
      } else if (["mire", "rootmother", "oracle"].includes(b)) {
        for (let k = 0; k < 3 + phase; k++)
          this.hazard(
            p.x + (k - 1) * 145,
            FLOOR - 28,
            65,
            18,
            b === "mire" ? "poison" : "roots",
            1.1,
            k === 0 ? 3 : 0.4
          );
        if (turn === 1 && this.enemies.length < 28)
          this.spawn(this.act * 8, e.x - 150);
        if (b === "mire" && e.age < 5) this.crystals(e, 2);
      } else if (["aetherion", "star"].includes(b)) {
        for (let k = 0; k < 4 + phase; k++)
          this.hazard(
            e.spawnX - 450 + k * 190,
            k % 2 ? FLOOR - 25 : 430,
            75,
            24,
            "lightning",
            1.4,
            0.45
          );
        for (const h of heroes)
          this.hazard(h.x, h.y, 55, 20, "lightning", 1.8, 0.2);
      } else if (b === "mimicboss") {
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4;
          this.projectile(
            e.id,
            e.x,
            e.y,
            e.x + Math.cos(a) * 100,
            e.y + Math.sin(a) * 100,
            16,
            "coin",
            false,
            230
          );
        }
        this.hazard(p.x, p.y, 110, 20, "explosion", 1, 0.4);
      } else {
        for (let k = 0; k < phase + 2; k++)
          this.projectile(
            e.id,
            e.x,
            e.y - 35,
            p.x,
            p.y + (k - 1) * 100,
            16,
            "dark",
            false,
            280
          );
        this.hazard(p.x, FLOOR - 25, 100, 24, "shock", 1, 0.4);
        if (turn === 2 && this.enemies.filter((n) => n.boss < 0).length < 8)
          this.spawn(this.act * 8 + 1, e.x - 120);
      }
      if (b === "ashfang" && phase === 2)
        this.hazard(p.x + 100, FLOOR - 25, 140, 24, "fire", 1.3, 2);
      if (b === "stalker" && turn === 2)
        for (const x of [p.x - 120, p.x + 120])
          this.hazard(x, p.y, 60, 18, "clone", 1, 0.3);
      if (b === "herald" && turn === 1) {
        e.shield = 1;
        e.state = "guard";
      }
    }
    if (b === "ashfang" && heroes.some((h) => h.input.interact && Math.abs(h.x - 5230) < 80) && Math.abs(e.x - 5230) < 220 && e.slow <= 0) {
      this.damage(e, 180, heroes[0], "relic");
      e.slow = 10;
      this.say("THE SIEGE TRAP STRIKES", e.x, e.y - 80);
    }
    if (dist(e, p) < 70) this.hurt(p, 14 + phase * 3);
    e.x = clamp(e.x, e.spawnX - 600, e.spawnX + 600);
  }
  snapshot() {
    return {
      id: this.id,
      act: this.act,
      time: this.time,
      difficulty: this.difficulty,
      players: this.active().map(({ token, input, prev, ...p }) => p),
      enemies: this.enemies,
      projectiles: this.projectiles,
      hazards: this.hazards,
      summons: this.summons,
      loot: this.loot,
      events: this.events,
      checkpoint: this.checkpoint,
      miniDead: this.miniDead,
      bossDead: this.bossDead,
      puzzle: this.puzzle,
      dialogue: this.dialogue,
      dialogueVotes: this.dialogueVotes,
      ended: this.ended,
      endingAt: this.endingAt,
      optionalDead: this.optionalDead,
      secretRelics: this.secretRelics,
      sideQuest: this.sideQuest,
      relicPulse: this.relicPulse
    };
  }
};

// src/server.ts
var here = path.dirname(fileURLToPath(import.meta.url));
async function createGameServer({
  persist = true,
  manual = false
} = {}) {
  const app = express(), http = httpServer(app), io = new Server(http, { maxHttpBufferSize: 8192, pingTimeout: 2e4 });
  const worlds = /* @__PURE__ */ new Map();
  const sessions = /* @__PURE__ */ new Map();
  const rates = /* @__PURE__ */ new Map();
  const saveDir = process.env.DATA_DIR || path.resolve("data");
  if (persist) {
    await mkdir(saveDir, { recursive: true });
    try {
      const data = JSON.parse(
        await readFile(path.join(saveDir, "worlds.json"), "utf8")
      );
      for (const raw of data) {
        if (Date.now() - raw.lastActive > 864e5) continue;
        const w = Object.assign(new World(raw.id), raw);
        for (const p of Object.values(w.players)) {
          p.connected = false;
          p.input = {};
          p.prev = {};
        }
        worlds.set(w.id, w);
      }
    } catch (e) {
      if (e.code !== "ENOENT")
        console.warn("Could not restore save:", e.message);
    }
  }
  const publicDir = path.join(here, "../public");
  const prod = path.basename(here) === "dist";
  if (!prod) {
    const { build } = await import("esbuild");
    await build({
      entryPoints: [path.join(here, "client.ts")],
      outfile: path.join(publicDir, "game.js"),
      bundle: true,
      sourcemap: true,
      platform: "browser"
    });
  }
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    next();
  });
  app.get("/health", (_req, res) => res.json({ ok: true, rooms: worlds.size }));
  app.use(express.static(prod ? path.join(here, "public") : publicDir));
  io.on("connection", (socket) => {
    let world, playerId = "", count = 0, last = Date.now();
    const allowed = () => {
      if (Date.now() - last > 1e3) {
        last = Date.now();
        count = 0;
      }
      return ++count < 90;
    };
    socket.on("join", (data, ack) => {
      if (typeof ack !== "function" || !allowed()) return;
      if (world) {
        ack({ error: "Already joined" });
        return;
      }
      try {
        if (!data || typeof data !== "object")
          throw Error("Invalid join request");
        const room = typeof data.room === "string" ? data.room.toUpperCase() : "";
        if (room) {
          if (!/^[A-F0-9]{8}$/.test(room) || !worlds.has(room))
            throw Error(
              "World not found or expired. Check the invitation link."
            );
          world = worlds.get(room);
        } else {
          const ip = socket.handshake.address;
          let rate = rates.get(ip);
          if (!rate || Date.now() - rate.t > 6e5) {
            rate = { n: 0, t: Date.now() };
            rates.set(ip, rate);
          }
          if (++rate.n > 10 || worlds.size >= 100)
            throw Error(
              "World creation limit reached. Join an existing world or try later."
            );
          const id = randomBytes(4).toString("hex").toUpperCase();
          world = new World(
            id,
            ["Casual", "Adventurer", "Heroic"].includes(data.difficulty) ? data.difficulty : "Adventurer"
          );
          worlds.set(id, world);
        }
        const p = world.addPlayer(
          typeof data.name === "string" ? data.name : "Wanderer",
          Number(data.classId),
          typeof data.color === "string" ? data.color : "#8de0cf",
          typeof data.token === "string" ? data.token : void 0
        );
        playerId = p.id;
        const key = world.id + ":" + p.id;
        const prior = sessions.get(key);
        if (prior && prior !== socket.id)
          io.sockets.sockets.get(prior)?.disconnect(true);
        p.connected = true;
        sessions.set(key, socket.id);
        socket.join(world.id);
        ack({
          room: world.id,
          id: p.id,
          token: p.token,
          state: world.snapshot()
        });
      } catch (e) {
        world = void 0;
        ack({ error: e.message });
      }
    });
    socket.on("input", (data) => {
      if (allowed() && world && data && typeof data === "object")
        world.setInput(playerId, data);
    });
    socket.on("action", (data) => {
      if (allowed() && world && data && typeof data.type === "string")
        world.action(playerId, data.type, data.value);
    });
    socket.on("disconnect", () => {
      if (world && sessions.get(world.id + ":" + playerId) === socket.id) {
        const p = world.players[playerId];
        if (p) {
          p.connected = false;
          p.lastSeen = Date.now();
          p.input = {};
        }
        sessions.delete(world.id + ":" + playerId);
      }
    });
  });
  let accumulator = 0, prev = Date.now();
  const timer = manual ? null : setInterval(() => {
    const now = Date.now();
    accumulator += Math.min((now - prev) / 1e3, 0.2);
    prev = now;
    while (accumulator >= 1 / 30) {
      for (const w of worlds.values()) w.update(1 / 30);
      accumulator -= 1 / 30;
    }
    for (const w of worlds.values())
      if (w.active().length) io.to(w.id).emit("state", w.snapshot());
  }, 1e3 / 20);
  let saving = false;
  async function save() {
    if (!persist || saving) return;
    saving = true;
    try {
      for (const [id, w] of worlds)
        if (!w.active().length && Date.now() - w.lastActive > 864e5)
          worlds.delete(id);
      await writeFile(
        path.join(saveDir, "worlds.tmp"),
        JSON.stringify([...worlds.values()])
      );
      await rename(
        path.join(saveDir, "worlds.tmp"),
        path.join(saveDir, "worlds.json")
      );
    } finally {
      saving = false;
    }
  }
  const saveTimer = persist ? setInterval(() => save().catch(console.error), 15e3) : null;
  return {
    app,
    http,
    io,
    worlds,
    save,
    async close() {
      if (timer) clearInterval(timer);
      if (saveTimer) clearInterval(saveTimer);
      await save();
      await new Promise((r) => io.close(() => r()));
    }
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const game = await createGameServer();
  const port = Number(process.env.PORT) || 4173;
  game.http.listen(
    port,
    "0.0.0.0",
    () => console.log(`Realms of the Shattered Sky listening on ${port}`)
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, async () => {
      await game.close();
      process.exit(0);
    });
}
export {
  createGameServer
};

import { io } from "socket.io-client";
import {
  ACTS,
  ABILITIES,
  ABILITY_HELP,
  BOSSES,
  CLASS_NAMES,
  COLORS,
  COOLDOWNS,
  ENEMIES,
  ENDING,
  FLOOR,
  platforms,
  RANKS,
  SLOTS,
  WORLD_W,
} from "./content.ts";
import { backdrop, glow, sprite, text } from "./art.ts";
import { Audio } from "./audio.ts";
const $ = (id: string) => document.getElementById(id)!;
const el = (id: string) => $(id) as HTMLInputElement;
const canvas = $("game") as HTMLCanvasElement,
  c = canvas.getContext("2d")!;
const portrait = $("portrait") as HTMLCanvasElement,
  pc = portrait.getContext("2d")!;
let width = 1280,
  height = 720,
  scale = 1,
  camX = 0,
  camY = 0,
  classId = 0,
  state: any = null,
  myId = "",
  room = "",
  joined = false,
  joining = false,
  mouse = { x: 800, y: 400, active: false },
  keys = new Set<string>(),
  pending: number | undefined,
  seen = new Set<string>(),
  endingSeen = false,
  toastUntil = 0,
  toastText = "",
  lastUi = 0,
  shake = 0;
const smoothed = new Map<string, { x: number; y: number }>(),
  audio = new Audio();
const socket = io({
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 700,
});
const descriptions = [
  "Steel, instinct, and an unbroken will.",
  "The stars answer when you speak.",
  "Become the light they cannot extinguish.",
  "Even the fallen have one last fight.",
  "You never have to face the dark alone.",
  "Where the earth ends, your kingdom begins.",
];
const icons = [
  ["⚔", "✥", "➤", "◉", "◇", "✹"],
  ["✦", "❄", "ϟ", "➤", "◇", "☄"],
  ["●", "✥", "≋", "➤", "◉", "☀"],
  ["✦", "♟", "♡", "╬", "◉", "♜"],
  ["♟", "✦", "➶", "♡", "⚑", "♜"],
  ["≋", "↑", "➤", "↓", "◇", "ϟ"],
];
const bindings = ["LMB", "Q", "R", "F", "C", "X"];
function resize() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  width = innerWidth;
  height = innerHeight;
  scale = Math.max(0.65, Math.min(1.2, width / 1280));
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resize);
resize();
function choose(n: number) {
  classId = (n + 6) % 6;
  $("class-name").textContent = CLASS_NAMES[classId];
  $("class-style").textContent = descriptions[classId];
  document.querySelector(".card-top .gold")!.textContent =
    `0${classId + 1} / 06`;
  $("class-dots").innerHTML = CLASS_NAMES.map(
    (_, i) => `<span class="${i === classId ? "selected" : ""}"></span>`,
  ).join("");
}
choose(0);
$("prev-class").onclick = () => choose(classId - 1);
$("next-class").onclick = () => choose(classId + 1);
const params = new URLSearchParams(location.search);
el("room").value = params.get("room") || "";
el("nickname").value = localStorage.getItem("realms-name") || "";
function updateBegin() {
  $("begin").innerHTML = el("room").value.trim()
    ? "JOIN WORLD <span>→</span>"
    : "CREATE WORLD <span>→</span>";
}
el("room").addEventListener("input", updateBegin);
updateBegin();
function toast(t: string) {
  toastText = t;
  toastUntil = performance.now() + 5500;
  $("toast").textContent = t;
}
function join() {
  if (joining || joined) return;
  joining = true;
  const roomWanted = el("room").value.trim().toUpperCase();
  $("menu-status").textContent = "Opening the rift…";
  (el("begin") as any).disabled = true;
  const send = () =>
    socket.emit(
      "join",
      {
        name: el("nickname").value || "Wanderer",
        classId,
        color: el("color").value,
        difficulty: el("difficulty").value,
        room: roomWanted,
        token: roomWanted
          ? localStorage.getItem("realms-token-" + roomWanted)
          : undefined,
      },
      (res: any) => {
        joining = false;
        (el("begin") as any).disabled = false;
        if (res.error) {
          $("menu-status").textContent = res.error;
          return;
        }
        joined = true;
        room = res.room;
        myId = res.id;
        state = res.state;
        localStorage.setItem("realms-token-" + room, res.token);
        localStorage.setItem("realms-name", el("nickname").value);
        history.replaceState(null, "", `?room=${room}`);
        $("menu").hidden = true;
        $("hud").hidden = false;
        classId = state.players.find((p: any) => p.id === myId).classId;
        buildHotbar();
        if (matchMedia("(pointer: coarse)").matches) $("touch").hidden = false;
        toast("Follow the lanterns east. Your adventure begins.");
      },
    );
  if (socket.connected) send();
  else {
    socket.once("connect", send);
    socket.connect();
  }
}
$("begin").onclick = join;
socket.on("connect_error", () => {
  joining = false;
  (el("begin") as any).disabled = false;
  $("menu-status").textContent =
    "Cannot reach the game server. Check your connection and try again.";
  if (joined) toast("Connection interrupted. Retrying…");
});
socket.on("disconnect", () => {
  if (joined) toast("Connection lost. Reconnecting to your hero…");
  keys.clear();
});
socket.io.on("reconnect", () => {
  if (!joined) return;
  socket.emit(
    "join",
    {
      room,
      token: localStorage.getItem("realms-token-" + room),
      name: el("nickname").value,
      classId,
      color: el("color").value,
    },
    (res: any) => {
      if (res.error) {
        toast(res.error);
        joined = false;
        $("menu").hidden = false;
        $("hud").hidden = true;
        return;
      }
      myId = res.id;
      state = res.state;
      toast("Reconnected. Your world is waiting.");
    },
  );
});
socket.on("state", (s: any) => {
  state = s;
  audio.act = s.act;
  audio.boss = s.enemies.some((e: any) => e.boss >= 0);
  for (const e of s.events)
    if (!seen.has(e.id)) {
      seen.add(e.id);
      audio.effect(e.kind);
      if (e.kind === "hurt") shake = 5;
      if (e.kind === "ultimate") shake = 12;
      if (e.text && (!e.x || ["loot", "ultimate"].includes(e.kind)))
        toast(e.text);
    }
  if (seen.size > 2000) seen = new Set(s.events.map((e: any) => e.id));
  if (s.ended && !endingSeen) {
    endingSeen = true;
    $("ending").hidden = false;
    $("ending-lines").replaceChildren(
      ...ENDING.slice(1).map((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        return p;
      }),
    );
  }
});
function action(type: string, value?: any) {
  socket.emit("action", { type, value });
}
function toggle(id: string) {
  $(id).hidden = !$(id).hidden;
  keys.clear();
  if (!$(id).hidden) updatePanels();
}
$("inventory-btn").onclick = () => toggle("inventory");
$("journal-btn").onclick = () => toggle("journal");
document
  .querySelectorAll<HTMLElement>("[data-close]")
  .forEach((b) => (b.onclick = () => ($(b.dataset.close!).hidden = true)));
$("skip").onclick = () => action("skip");
$("continue-explore").onclick = () => {
  $("ending").hidden = true;
};
function toggleAudio() {
  const on = audio.toggle();
  $("audio").textContent = on ? "♫ ON" : "♫ OFF";
  $("menu-audio").textContent = on ? "♫ MUSIC ON" : "♫ MUSIC OFF";
}
$("audio").onclick = toggleAudio;
$("menu-audio").onclick = toggleAudio;
$("share").onclick = async () => {
  const url = location.origin + "/?room=" + room;
  try {
    await navigator.clipboard.writeText(url);
    toast("Invitation copied • " + room);
  } catch {
    prompt("Copy this invitation link", url);
  }
};
function blocked() {
  return !$("inventory").hidden || !$("journal").hidden || !$("ending").hidden;
}
window.addEventListener("keydown", (e) => {
  if (
    !joined ||
    ["INPUT", "SELECT"].includes((e.target as HTMLElement).tagName)
  )
    return;
  const k = e.key.toLowerCase();
  if ([" ", "arrowleft", "arrowright", "arrowup", "tab"].includes(k))
    e.preventDefault();
  if (!e.repeat) {
    if (k === "i") toggle("inventory");
    if (k === "j") toggle("journal");
    if (k === "h") action("hint");
    if (k === "enter") action("skip");
    if (k === "escape") {
      for (const id of ["inventory", "journal"]) $(id).hidden = true;
    }
    const n = ["q", "r", "f", "c", "x"].indexOf(k);
    if (n >= 0 && !blocked()) pending = n + 1;
  }
  keys.add(k);
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
canvas.addEventListener("pointermove", (e) => {
  mouse = { x: e.clientX, y: e.clientY, active: true };
});
canvas.addEventListener("pointerdown", (e) => {
  if (joined && e.button === 0) {
    keys.add("attack");
    mouse = { x: e.clientX, y: e.clientY, active: true };
  }
});
window.addEventListener("pointerup", () => keys.delete("attack"));
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
document.querySelectorAll<HTMLElement>("[data-key]").forEach((b) => {
  b.onpointerdown = (e) => {
    e.preventDefault();
    keys.add(b.dataset.key!);
    b.setPointerCapture(e.pointerId);
  };
  b.onpointerup = () => keys.delete(b.dataset.key!);
  b.onpointercancel = () => keys.delete(b.dataset.key!);
});
function buildHotbar() {
  $("hotbar").replaceChildren(
    ...ABILITIES[classId].map((name, n) => {
      const b = document.createElement("button");
      b.className = "ability";
      b.title = `${bindings[n]} · ${name}: ${ABILITY_HELP[classId][n]}`;
      b.innerHTML = `<span class="key">${bindings[n]}</span><span class="icon">${icons[classId][n]}</span><span class="short">${name.split(" ")[0]}</span><span class="cd" id="cd-${n}"></span>`;
      b.onclick = () => (pending = n);
      return b;
    }),
  );
}
setInterval(() => {
  if (!joined || !socket.connected || !state) return;
  const p = state.players.find((p: any) => p.id === myId);
  if (!p) return;
  let ax = mouse.x / scale + camX,
    ay = mouse.y / scale + camY;
  if (!mouse.active) {
    const target = state.enemies
      .filter((e: any) => Math.hypot(e.x - p.x, e.y - p.y) < 600)
      .sort((a: any, b: any) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    ax = target?.x ?? p.x + p.facing * 200;
    ay = target?.y ?? p.y;
  }
  socket.emit(
    "input",
    blocked()
      ? {}
      : {
          left: keys.has("a") || keys.has("arrowleft"),
          right: keys.has("d") || keys.has("arrowright"),
          jump: keys.has(" "),
          fly: keys.has("w") || keys.has("arrowup"),
          dodge: keys.has("shift"),
          interact: keys.has("e"),
          attack: keys.has("attack"),
          ability: pending,
          ax,
          ay,
        },
  );
  pending = undefined;
}, 33);
function myPlayer() {
  return state?.players.find((p: any) => p.id === myId);
}
function updatePanels() {
  const p = myPlayer();
  if (!p) return;
  $("stats").textContent =
    `${CLASS_NAMES[p.classId]} · ${p.hp.toFixed(0)} / ${p.maxHp} health · Equipping a new item replaces its slot.`;
  $("gold").textContent = `✦ ${p.gold} shards`;
  $("slots").replaceChildren(
    ...SLOTS.map((slot) => {
      const d = document.createElement("div"),
        label = document.createElement("small");
      label.textContent = slot;
      d.append(label);
      d.append(
        p.inventory.find((i: any) => i.id === p.equipment[slot])?.name ||
          "Empty",
      );
      return d;
    }),
  );
  $("items").replaceChildren(
    ...p.inventory.map((it: any) => {
      const b = document.createElement("button");
      b.textContent = `[${RANKS[it.rank]}] ${it.name}`;
      b.style.color = ["#bbc9c9", "#a1d8b2", "#c8b5ec", "#edcf91"][it.rank];
      if (Object.values(p.equipment).includes(it.id)) b.className = "equipped";
      b.title = `Damage +${it.damage} · Defence +${it.defence} · Speed +${it.speed} · Crit ${it.crit}% · Flight +${it.flight}s · Summons +${it.summons}`;
      b.onclick = () => {
        action("equip", it.id);
        setTimeout(updatePanels, 120);
      };
      return b;
    }),
  );
  $("forge").replaceChildren(
    ...SLOTS.map((slot) => {
      const b = document.createElement("button");
      const cost = 25 + Math.min(3, state.act + 1) * 20;
      b.textContent = `${slot} · ${cost} shards`;
      b.disabled = p.gold < cost || Math.abs(p.x - state.checkpoint) > 220;
      b.onclick = () => {
        action("forge", slot);
        setTimeout(updatePanels, 120);
      };
      return b;
    }),
  );
  $("quests").replaceChildren(
    ...[
      `${state.miniDead ? "✓" : "◇"} Recover the relic — ${BOSSES[state.act * 2].name}. Reward: upgraded class weapon.`,
      `${state.puzzle.done ? "✓" : "◇"} Open the ${ACTS[state.act].puzzle} seal. ${ACTS[state.act].hint} Reward: 20 shards and healing.`,
      `${state.bossDead ? "✓" : "◇"} Recover the Core fragment — ${BOSSES[state.act * 2 + 1].name}. Reward: flight equipment and the next realm.`,
      `${state.optionalDead.includes(8 + state.act) ? "✓" : "✧"} Optional: awaken the star altar east of the guardian. Reward: hidden relic and S-rank equipment.`,
      `✧ Lumen’s cache: find the spirit near the ruined arch at 1,100m. Reward: charm and 35 shards.`,
      `World ${room} · ${state.difficulty} · ${state.secretRelics}/3 secret relics · ${state.sideQuest} creatures defeated.`,
      "Invite friends with the button at the top. Hold E near a fallen friend for 2 seconds. Alone, you return to the last checkpoint after 12 seconds.",
    ].map((line) => {
      const d = document.createElement("div");
      d.textContent = line;
      return d;
    }),
  );
  $("ability-guide").replaceChildren(
    ...ABILITIES[classId].map((a, n) => {
      const d = document.createElement("div"),
        b = document.createElement("b"),
        t = document.createElement("p");
      b.textContent = `${bindings[n]} · ${a}`;
      t.textContent =
        ABILITY_HELP[classId][n] + ` (${COOLDOWNS[classId][n]}s cooldown)`;
      d.append(b, t);
      return d;
    }),
  );
  $("bestiary").replaceChildren(
    ...ENEMIES.filter((e) => e.act === state.act).map((e) => {
      const d = document.createElement("div");
      d.textContent = e.name;
      const p = document.createElement("p");
      p.textContent = `Behaviour: ${e.behavior}. Watch the wind-up; dodge the red ground marks.`;
      d.append(p);
      return d;
    }),
  );
}
function ui() {
  if (!state) return;
  const p = myPlayer();
  if (!p) return;
  const act = ACTS[state.act];
  $("hero-label").textContent = p.name;
  $("rank-label").textContent =
    RANKS[p.inventory.find((i: any) => i.id === p.equipment.weapon)?.rank || 0];
  el("hp-bar").style.width = `${(p.hp / p.maxHp) * 100}%`;
  $("hp-text").textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  el("flight-bar").style.width =
    `${(Math.max(0, p.flight) / (state.act >= 2 ? 9 : 5)) * 100}%`;
  $("party-text").textContent =
    `${CLASS_NAMES[p.classId]} · ${state.players.length}/6 heroes · ${socket.connected ? "connected" : "reconnecting"}`;
  $("act-label").textContent =
    `ACT ${["I", "II", "III", "IV"][state.act]} / ${act.name.toUpperCase()}`;
  $("region-name").textContent = act.region;
  $("objective").textContent = !state.miniDead
    ? "Follow the lanterns east • Recover the guardian’s relic"
    : !state.puzzle.done
      ? "Open the ancient seal • " + act.hint
      : !state.bossDead
        ? "Defeat " + BOSSES[state.act * 2 + 1].name
        : state.act < 3
          ? "The fragment is yours • East to the next realm"
          : "The world is restored • Explore the hidden star altar";
  const boss = state.enemies
    .filter((e: any) => e.boss >= 0)
    .sort((a: any, b: any) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
  $("bossbar").hidden = !boss;
  if (boss) {
    $("boss-name").textContent =
      `${boss.name} · ${boss.phase === 3 ? "THE LAST LIGHT" : "PHASE " + boss.phase}`;
    el("boss-hp").style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    $("boss-tip").textContent = boss.shield
      ? "Shielded: destroy anchors / channel the final altar"
      : boss.state === "windup"
        ? "LUNGE INCOMING — DODGE"
        : boss.state === "recover"
          ? "EXPOSED — STRIKE NOW"
          : "Watch the ground. Move before the warning fills.";
  }
  for (let n = 0; n < 6; n++)
    $("cd-" + n).textContent =
      p.cool[n] > 0.1 ? p.cool[n].toFixed(p.cool[n] < 2 ? 1 : 0) : "";
  $("down").hidden = p.hp > 0;
  $("down").textContent =
    `Fallen · Return in ${Math.ceil(p.down)}s • A friend can hold E to revive you`;
  $("dialogue").hidden = !state.dialogue;
  if (state.dialogue) {
    $("speaker").textContent = state.dialogue.speaker;
    $("dialogue-line").textContent = state.dialogue.lines[state.dialogue.index];
    $("votes").textContent =
      state.players.length > 1
        ? `${state.dialogueVotes.length}/${state.players.length} ready`
        : "";
  }
  let prompt = "";
  if (Math.abs(p.x - state.checkpoint) < 130)
    prompt = "E · Rest at the checkpoint  /  I · Tovin’s forge";
  if (Math.abs(p.x - 220) < 90) prompt = "E · Speak to " + act.npc;
  if (Math.abs(p.x - 1100) < 100)
    prompt = "E · Investigate the spirit’s hidden cache";
  if (!state.puzzle.done && p.x > 3850 && p.x < 4510)
    prompt =
      state.act === 1
        ? "Stand on both moonstones until they are filled"
        : "E · Activate the nearest " + (state.act === 2 ? "mirror" : "rune");
  if (state.bossDead && Math.abs(p.x - 6070) < 100)
    prompt = "E · Awaken the optional star challenge";
  if (state.bossDead && state.act < 3 && p.x > 6340)
    prompt = "E · Travel together to the next realm";
  if (state.act === 0 && Math.abs(p.x - 5230) < 100)
    prompt = "Hold E · Trigger the siege trap when Ashfang is close";
  if (
    boss?.boss === 7 &&
    boss.phase === 3 &&
    boss.shield &&
    Math.abs(p.x - 5500) < 160
  )
    prompt =
      "HOLD E · Channel the six relics " +
      Math.floor((state.relicPulse / 3) * 100) +
      "%";
  $("prompt").textContent = prompt;
  if (performance.now() > toastUntil) $("toast").textContent = "";
  $("checkpoint-label").textContent =
    `${Math.floor(p.x)}m / 6600m · ✦ ${p.gold} shards`;
  const mc = ($("map") as HTMLCanvasElement).getContext("2d")!;
  mc.clearRect(0, 0, 190, 44);
  mc.fillStyle = "#566b75";
  mc.fillRect(5, 27, 180, 2);
  for (const [xx, col] of [
    [2650, state.miniDead ? "#88bb9c" : "#d59292"],
    [4200, state.puzzle.done ? "#88bb9c" : "#d2bd8b"],
    [5540, state.bossDead ? "#88bb9c" : "#d59292"],
  ] as any) {
    mc.fillStyle = col;
    mc.fillRect((xx / WORLD_W) * 180, 18, 4, 10);
  }
  for (const h of state.players) {
    mc.fillStyle = h.color;
    mc.fillRect(5 + (h.x / WORLD_W) * 180, 25 - (h.y / 690) * 12, 4, 5);
  }
}
function position(id: string, x: number, y: number) {
  let p = smoothed.get(id);
  if (!p || Math.abs(p.x - x) > 300 || Math.abs(p.y - y) > 300) {
    p = { x, y };
    smoothed.set(id, p);
  } else {
    p.x += (x - p.x) * 0.45;
    p.y += (y - p.y) * 0.45;
  }
  return p;
}
function render(now: number) {
  requestAnimationFrame(render);
  const t = now / 1000;
  c.clearRect(0, 0, width, height);
  const p = myPlayer();
  if (!joined || !p) {
    backdrop(c, width, height, t * 8, 0, t);
    c.save();
    c.translate(width * 0.52, height * 0.78);
    sprite(c, "hero" + classId, 0, 0, 4, el("color").value, t, 1, false, 1);
    c.restore();
    pc.clearRect(0, 0, 280, 140);
    glow(pc, 140, 80, 65, COLORS[classId] + "20");
    pc.strokeStyle = "#adc3bb30";
    pc.beginPath();
    pc.ellipse(140, 118, 65, 10, 0, 0, 7);
    pc.stroke();
    sprite(
      pc,
      "hero" + classId,
      140,
      84,
      2.7,
      el("color").value,
      t,
      1,
      false,
      1,
    );
    return;
  }
  const vw = width / scale,
    vh = height / scale;
  camX += (Math.max(0, Math.min(WORLD_W - vw, p.x - vw * 0.38)) - camX) * 0.12;
  camY += (Math.max(-80, Math.min(850 - vh, p.y - vh * 0.65)) - camY) * 0.1;
  backdrop(c, width, height, camX, state.act, t);
  c.save();
  c.scale(scale, scale);
  c.translate(
    -Math.round(camX) + (Math.random() - 0.5) * shake,
    -Math.round(camY) + (Math.random() - 0.5) * shake,
  );
  shake *= 0.86;
  const colors = ACTS[state.act].colors;
  // Layered terrain with moss edges and cracked stone, not placeholder geometry.
  for (const plat of platforms(state.act)) {
    if (plat.x + plat.w < camX - 100 || plat.x > camX + vw + 100) continue;
    c.fillStyle = plat.y === FLOOR ? "#263336" : "#374347";
    c.fillRect(plat.x, plat.y, plat.w, plat.h);
    for (let xx = plat.x; xx < plat.x + plat.w; xx += 22) {
      c.fillStyle = Math.floor(xx / 22) % 3 === 0 ? "#4d5552" : "#3d4848";
      c.fillRect(xx + 1, plat.y + 7, 20, 14);
      if (plat.y === FLOOR) {
        c.fillStyle = "#1b272c";
        c.fillRect(xx + 7, plat.y + 35 + (xx % 4) * 8, 14, 5);
      }
      c.fillStyle = colors[2];
      c.fillRect(xx, plat.y, 22, 4);
      c.fillRect(xx + 3, plat.y - 3, 3, 5);
      if (xx % 3 === 0) c.fillRect(xx + 12, plat.y - 6, 2, 9);
    }
  }
  // Region landmarks: catacomb arches, swamp trees, floating temples, throne towers.
  for (let j = 0; j < 13; j++) {
    const x = 420 + j * 480;
    if (x < camX - 240 || x > camX + vw + 200) continue;
    if (state.act === 1) {
      sprite(c, "tree", x, FLOOR - 80, 3.4, "#385f4c", 0);
      glow(c, x - 50, FLOOR - 25, 70, "#99b75e18");
    } else {
      const yy = FLOOR - 160;
      c.fillStyle = state.act === 3 ? "#4a3c51" : "#394749";
      c.fillRect(x, yy, 25, 160);
      c.fillRect(x + 110, yy, 25, 160);
      c.fillRect(x - 5, yy - 10, 145, 22);
      c.fillStyle = colors[2];
      c.fillRect(x - 7, yy - 13, 149, 3);
      for (let q = 0; q < 7; q++) {
        c.fillStyle = "#182b33";
        c.fillRect(x + 3, yy + q * 22, 18, 2);
        c.fillRect(x + 113, yy + q * 22, 18, 2);
      }
      if (state.act === 3) {
        c.fillStyle = "#231d30";
        c.fillRect(x + 25, yy, 85, 160);
        sprite(c, "crystal", x + 67, yy + 90, 1.4, "#ad82a8", t);
      }
    }
  }
  const lantern = (x: number) => {
    c.fillStyle = "#283036";
    c.fillRect(x - 3, FLOOR - 85, 6, 85);
    c.fillRect(x - 14, FLOOR - 88, 28, 5);
    c.fillStyle = "#e9c68d";
    c.fillRect(x - 8, FLOOR - 80, 16, 20);
    c.fillStyle = "#a27f55";
    c.fillRect(x - 11, FLOOR - 83, 3, 27);
    c.fillRect(x + 8, FLOOR - 83, 3, 27);
    glow(c, x, FLOOR - 69, 110, "#efc47d30");
  };
  lantern(state.checkpoint);
  for (let x = 600; x < 6600; x += 650) lantern(x);
  sprite(c, "hero1", 220, FLOOR - 25, 1.15, "#b5a782", t, -1);
  text(c, ACTS[state.act].npc, 220, FLOOR - 77, "#e4cc96", 10);
  text(c, "!", 220, FLOOR - 99, "#f4d99b", 18);
  sprite(c, "hero0", state.checkpoint + 75, FLOOR - 25, 1.15, "#a6947c", t);
  text(c, "Tovin · Forge", state.checkpoint + 75, FLOOR - 65, "#a7bdba", 9);
  sprite(c, "ghost", 1100, FLOOR - 42 + Math.sin(t) * 8, 1.2, "#9ad8c8", t);
  glow(c, 1100, FLOOR - 42, 55, "#a9e5cc27");
  for (let k = 0; k < (state.act === 1 ? 2 : state.act === 3 ? 4 : 3); k++) {
    const x = state.act === 1 ? 4000 + k * 280 : 3950 + k * 160,
      v = state.puzzle.values[k];
    const on =
      state.puzzle.done || (state.act === 2 ? v === [1, 0, 3][k] : v >= 1);
    c.fillStyle = on ? "#8bccb1" : "#52616b";
    c.fillRect(x - 30, FLOOR - 8, 60, 8);
    sprite(
      c,
      state.act === 2 ? "crystal" : "totem",
      x,
      FLOOR - 47,
      1,
      on ? "#a5e0ba" : "#bfa285",
      t,
    );
    text(
      c,
      state.act === 0
        ? ["SUN", "MOON", "STAR"][k]
        : state.act === 2
          ? ["N", "E", "S", "W"][v]
          : `${Math.floor(v * 100)}%`,
      x,
      FLOOR - 90,
      on ? "#bfe8c7" : "#e3ceaa",
      11,
    );
    if (on) glow(c, x, FLOOR - 40, 70, "#aee7bc25");
  }
  const gate = !state.miniDead ? 2980 : !state.puzzle.done ? 4780 : 0;
  if (gate) {
    glow(c, gate, FLOOR - 110, 160, "#96b9e722");
    for (let y = 100; y < FLOOR; y += 16) {
      c.fillStyle = "#afd3e24d";
      c.fillRect(gate - 3 + Math.sin(t * 4 + y) * 3, y, 6, 10);
    }
    text(
      c,
      !state.miniDead ? "GUARDIAN SEAL" : "ANCIENT SEAL",
      gate,
      FLOOR - 180,
      "#b7d6df",
      10,
    );
  }
  if (state.act === 0) {
    sprite(c, "chest", 5230, FLOOR - 20, 1.2, "#e9b47c", t);
    text(c, "SIEGE TRAP · E", 5230, FLOOR - 55, "#d5bd92", 9);
  }
  if (state.act === 3) {
    sprite(
      c,
      "crystal",
      5500,
      FLOOR - 38,
      1.5,
      state.relicPulse >= 3 ? "#fbe6aa" : "#b99ac8",
      t,
    );
  }
  // Challenge altar and travel portal.
  sprite(c, "star", 6070, FLOOR - 50, 1.2, "#dfcca4", t);
  text(c, "STAR ALTAR · E", 6070, FLOOR - 100, "#ddcba7", 10);
  if (state.bossDead && state.act < 3) {
    glow(c, 6460, FLOOR - 70, 100, "#bce9d33b");
    c.strokeStyle = "#a8dfcc";
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(6460, FLOOR - 65, 32, 65, 0, 0, 7);
    c.stroke();
    text(c, "NEXT REALM · E", 6430, FLOOR - 150, "#c9efd9", 11);
  }
  for (const h of state.hazards) {
    c.save();
    c.globalAlpha = h.delay > 0 ? 0.35 + 0.2 * Math.sin(t * 12) : 0.7;
    c.strokeStyle = h.owner ? "#e7dbab" : "#e592a0";
    c.fillStyle = h.owner ? "#e7dbab22" : "#dc6f8933";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(
      h.x,
      h.y,
      h.r,
      h.effect === "roots" || h.effect === "poison" || h.effect === "web"
        ? 22
        : h.r,
      0,
      0,
      7,
    );
    c.fill();
    c.stroke();
    if (h.delay <= 0) {
      if (["lightning", "meteor"].includes(h.effect)) {
        c.strokeStyle = "#e9e3c3";
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(h.x - 25, camY);
        c.lineTo(h.x + 20, h.y - 130);
        c.lineTo(h.x - 10, h.y - 100);
        c.lineTo(h.x, h.y);
        c.stroke();
      }
      if (h.effect === "roots")
        for (let k = -2; k <= 2; k++) {
          c.fillStyle = "#a6b77f";
          c.beginPath();
          c.moveTo(h.x + k * 24 - 9, FLOOR);
          c.lineTo(h.x + k * 24, FLOOR - 95);
          c.lineTo(h.x + k * 24 + 9, FLOOR);
          c.fill();
        }
    }
    c.restore();
  }
  for (const d of state.loot) {
    glow(c, d.x, d.y, 20, "#e5c48125");
    text(
      c,
      d.kind === "gear" ? "◇" : "✦",
      d.x,
      d.y + Math.sin(t * 4) * 4,
      "#f2d18d",
      16,
    );
  }
  for (const e of state.enemies) {
    const pos = position(e.id, e.x, e.y);
    if (pos.x < camX - 150 || pos.x > camX + vw + 150) continue;
    const color =
      e.boss >= 0
        ? BOSSES[e.boss].color
        : state.act === 0
          ? [
              "#9fb78a",
              "#bbbd8f",
              "#a8987b",
              "#c3c7b1",
              "#a18cb0",
              "#b09bc8",
              "#9e927d",
              "#aaaf85",
            ][e.type % 8]
          : COLORS[(e.type + state.act) % 6];
    c.save();
    if (["invisible", "burrow"].includes(e.state)) c.globalAlpha = 0.25;
    if (e.flash > 0) c.filter = "brightness(2)";
    sprite(
      c,
      e.shape,
      pos.x,
      pos.y,
      e.boss >= 0 ? 2.2 : e.small ? 0.55 : 1.1,
      color,
      t + e.type,
      e.facing,
      e.state === "attack",
      e.rank,
    );
    c.restore();
    if (e.shield) {
      c.strokeStyle = "#a9c9e2";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(pos.x, pos.y, 65, 0, 7);
      c.stroke();
    }
    if (e.state === "windup") text(c, "!", pos.x, pos.y - 85, "#ffbca8", 28);
    if (e.boss < 0) {
      c.fillStyle = "#101c25";
      c.fillRect(pos.x - 20, pos.y - 43, 40, 3);
      c.fillStyle = ["#a4bfa6", "#98cee1", "#bc9cdd", "#e5c68c"][e.rank];
      c.fillRect(pos.x - 20, pos.y - 43, (40 * e.hp) / e.maxHp, 3);
      if (e.rank > 0 || Math.abs(pos.x - p.x) < 160)
        text(
          c,
          `${RANKS[e.rank]} · ${e.name}`,
          pos.x,
          pos.y - 50,
          "#c6d0cb",
          8,
        );
    }
  }
  for (const s of state.summons) {
    sprite(
      c,
      (
        {
          wolf: "wolf",
          skeleton: "skeleton",
          archer: "archer",
          elemental: "elemental",
          totem: "totem",
          titan: "sentinel",
        } as any
      )[s.kind],
      s.x,
      s.y,
      s.kind === "titan" ? 1.8 : 0.85,
      "#9bcfc3",
      t,
      s.x < p.x ? -1 : 1,
    );
    glow(c, s.x, s.y, 28, "#8fdec315");
  }
  for (const h of state.players) {
    const pos = position(h.id, h.x, h.y),
      weapon = h.inventory.find((i: any) => i.id === h.equipment.weapon),
      rank = weapon?.rank || 0;
    c.save();
    if (h.invuln > 0 && Math.floor(t * 12) % 2) c.globalAlpha = 0.6;
    if (h.power > 0) {
      glow(c, pos.x, pos.y, 100, COLORS[h.classId] + "60");
      for (let i = 0; i < 10; i++) {
        const a = t * 3 + (i * Math.PI) / 5;
        text(
          c,
          "✦",
          pos.x + Math.cos(a) * 45,
          pos.y + Math.sin(a) * 60,
          COLORS[h.classId],
          14,
        );
      }
    }
    if (h.hp <= 0) c.translate(0, 12);
    sprite(
      c,
      "hero" + h.classId,
      pos.x,
      pos.y,
      1.15,
      h.color,
      t * (Math.abs(h.vx) > 20 ? 1 : 0.2),
      h.facing,
      h.attackTime > 0,
      rank,
    );
    if (h.shield > 0) {
      c.strokeStyle = "#b9dded99";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(pos.x, pos.y - 8, 27, 35, 0, 0, 7);
      c.stroke();
    }
    if (h.attackTime > 0) {
      c.strokeStyle = COLORS[h.classId] + "cc";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(
        pos.x,
        pos.y,
        55,
        h.facing > 0 ? -1.2 : 1.9,
        h.facing > 0 ? 1.2 : 4.3,
      );
      c.stroke();
    }
    c.restore();
    text(
      c,
      h.id === myId ? "▼" : h.name,
      pos.x,
      pos.y - 42,
      h.id === myId ? "#eddaad" : "#bcd2cd",
      h.id === myId ? 9 : 10,
    );
  }
  for (const q of state.projectiles) {
    c.strokeStyle = q.friendly
      ? COLORS[state.players.find((p: any) => p.id === q.owner)?.classId || 0]
      : "#e99cb4";
    c.lineWidth = q.radius;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(q.x - q.vx * 0.025, q.y - q.vy * 0.025);
    c.lineTo(q.x, q.y);
    c.stroke();
    glow(c, q.x, q.y, 20, q.friendly ? "#c8e9d125" : "#dca7c425");
  }
  c.lineCap = "butt";
  for (const e of state.events) {
    const age = state.time - e.t;
    if (age > 1.2 || !e.x) continue;
    if (["damage", "hurt", "heal"].includes(e.kind)) {
      c.globalAlpha = 1 - age / 1.2;
      text(
        c,
        e.text,
        e.x,
        e.y - age * 35,
        e.kind === "hurt"
          ? "#f3a0ae"
          : e.kind === "heal"
            ? "#ace6b6"
            : "#ede3bf",
        12,
      );
      c.globalAlpha = 1;
    }
    if (["burst", "slash", "ultimate"].includes(e.kind))
      for (let i = 0; i < 10; i++) {
        const a = i * 0.628;
        c.fillStyle = e.kind === "ultimate" ? "#f7df9c" : "#cbd7b8";
        c.globalAlpha = 1 - age / 1.2;
        c.fillRect(
          e.x + Math.cos(a) * age * 95,
          e.y + Math.sin(a) * age * 75,
          3,
          3,
        );
        c.globalAlpha = 1;
      }
  }
  c.restore();
  if (now - lastUi > 90) {
    ui();
    lastUi = now;
  }
}
requestAnimationFrame(render);

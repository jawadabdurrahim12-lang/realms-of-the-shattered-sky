import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/engine.ts";
import { ABILITIES, BOSSES, ENEMIES, FLOOR, makeItem } from "../src/content.ts";
import { createGameServer } from "../src/server.ts";
import { io, Socket } from "socket.io-client";
const tick = (w: World, n = 30) => {
  for (let i = 0; i < n; i++) w.update(1 / 30);
};
const setup = (cl = 0) => {
  const w = new World("TEST");
  const p = w.addPlayer("Tester", cl, "#aaccdd");
  w.dialogue = null;
  return { w, p };
};
test("all six class kits consume cooldowns and have observable effects", () => {
  assert.equal(ABILITIES.length, 6);
  for (let cl = 0; cl < 6; cl++)
    for (let n = 0; n < 6; n++) {
      const { w, p } = setup(cl);
      p.x = 400;
      p.y = 640;
      p.hp = 60;
      const e = w.spawn(1, 455, 640);
      p.input = { ax: 455, ay: 640 };
      w.ability(p, n);
      assert.ok(p.cool[n] > 0, `${cl}/${n} cooldown`);
      assert.ok(
        e.hp < e.maxHp ||
          w.projectiles.length ||
          w.hazards.length ||
          w.summons.length ||
          p.invuln > 3 ||
          p.invuln === 0.5 ||
          p.invuln === 1.1 ||
          p.shield > 0 ||
          p.power > 0 ||
          p.x !== 400 ||
          p.hp > 60 ||
          p.vy < 0,
        `${cl}/${n} effect`,
      );
    }
});
test("movement, double jump, flight, dodge and progression gates stay authoritative", () => {
  const { w, p } = setup();
  w.setInput(p.id, { right: true });
  tick(w, 30);
  assert.ok(p.x > 350 && p.x < 440);
  w.setInput(p.id, { jump: true });
  tick(w, 1);
  assert.ok(p.vy < 0);
  w.setInput(p.id, {});
  tick(w, 1);
  w.setInput(p.id, { jump: true, fly: true });
  tick(w, 1);
  assert.equal(p.jumps, 2);
  assert.ok(p.flight < 4);
  p.x = 2970;
  w.setInput(p.id, { right: true, dodge: true });
  tick(w, 30);
  assert.ok(p.x <= 2955);
  assert.ok(p.cool[6] > 0);
  w.setInput(p.id, { ax: Infinity, ay: NaN, ability: 900 });
  assert.ok(Number.isFinite(p.input.ax));
  assert.equal(p.input.ability, undefined);
});
test("skeletons, wolves, ranged companions and titan autonomously damage enemies", () => {
  for (const kind of ["skeleton", "wolf", "elemental", "archer", "titan"]) {
    const { w, p } = setup(4);
    p.x = 400;
    p.y = 665;
    const e = w.spawn(14, 530, 665);
    e.behavior = "crystal";
    w.summon(p, kind);
    tick(w, 150);
    assert.ok(e.hp < e.maxHp, kind);
  }
});
test("32 behaviour definitions execute without nonfinite state; slime splits", () => {
  assert.equal(ENEMIES.length, 32);
  assert.equal(new Set(ENEMIES.map((e) => e.behavior)).size, 32);
  for (const d of ENEMIES) {
    const { w, p } = setup();
    p.x = 450;
    p.y = 665;
    const e = w.spawn(d.id, 550);
    tick(w, 180);
    assert.ok(
      Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(p.hp),
      d.name,
    );
  }
  const { w, p } = setup();
  const s = w.spawn(0, 400);
  w.damage(s, 100, p);
  assert.equal(w.enemies.filter((e) => e.small).length, 2);
});
test("blocking, weak points, projectile absorption and equipment affect combat", () => {
  const { w, p } = setup();
  p.x = 100;
  const e = w.spawn(3, 160);
  e.facing = -1;
  w.damage(e, 20, p);
  assert.equal(e.maxHp - e.hp, 5);
  w.damage(e, 20, p, "heavy");
  assert.equal(e.maxHp - e.hp, 25);
  const old = w.stats(p);
  const item = makeItem("better", 3, 0);
  p.inventory.push(item);
  w.action(p.id, "equip", "better");
  assert.ok(w.stats(p).damage > old.damage);
  w.action(p.id, "equip", "invented");
  assert.equal(p.equipment.weapon, "better");
  const dev = w.spawn(30, 200);
  dev.state = "guard";
  w.damage(dev, 20, p, "projectile");
  assert.equal(dev.hp, dev.maxHp);
});
test("solo can complete all four puzzle interaction rules", () => {
  for (let act = 0; act < 4; act++) {
    const { w, p } = setup();
    w.act = act;
    w.miniDead = true;
    w.spawned = [0, 1, 2, 3, 4, 5, 6, 7, 100, 101];
    p.y = FLOOR - 22;
    if (act === 0) {
      for (const x of [3950, 4110, 4270]) {
        p.x = x;
        p.prev = {};
        w.setInput(p.id, { interact: true });
        tick(w, 1);
      }
    }
    if (act === 1) {
      for (const x of [4000, 4280]) {
        p.x = x;
        w.setInput(p.id, {});
        tick(w, 65);
      }
    }
    if (act === 2) {
      for (const [x, n] of [
        [3950, 1],
        [4270, 3],
      ]) {
        p.x = x;
        for (let j = 0; j < n; j++) {
          p.prev = {};
          w.setInput(p.id, { interact: true });
          tick(w, 1);
        }
      }
    }
    if (act === 3) {
      for (const x of [3950, 4110, 4270, 4430]) {
        p.x = x;
        w.setInput(p.id, { interact: true });
        tick(w, 65);
      }
    }
    assert.ok(w.puzzle.done, `act ${act}`);
  }
});
test("all 12 bosses execute phases, rewards and defeat state", () => {
  for (let b = 0; b < BOSSES.length; b++) {
    const { w, p } = setup(1);
    w.act = Math.min(3, Math.floor(b / 2));
    w.miniDead = true;
    w.puzzle.done = true;
    w.spawned = [0, 1, 2, 3, 4, 5, 6, 7, 100, 101];
    p.x = 5400;
    p.y = 665;
    const e = w.spawn(0, 5500, 610, 2, b);
    tick(w, 100);
    e.hp = e.maxHp * 0.45;
    tick(w, 1);
    assert.equal(e.phase, 2, BOSSES[b].name);
    if (b === 7) {
      e.hp = e.maxHp * 0.2;
      tick(w, 1);
      assert.equal(e.phase, 3);
      p.x = 5500;
      w.setInput(p.id, { interact: true });
      tick(w, 100);
      assert.equal(e.shield, 0);
    }
    w.damage(e, 1e6, p, "relic");
    assert.equal(e.hp, 0);
    assert.ok(p.inventory.length > 1);
    if (b === 7) assert.ok(w.ended);
    else if (b >= 8) assert.ok(w.optionalDead.includes(b));
    else if (b % 2 === 0) assert.ok(w.miniDead);
    else assert.ok(w.bossDead);
  }
});
test("four-act progression reaches ending and retains optional relics", () => {
  const { w, p } = setup();
  for (let a = 0; a < 4; a++) {
    assert.equal(w.act, a);
    const mini = w.spawn(0, 2650, 620, 2, a * 2);
    w.damage(mini, 1e6, p, "relic");
    assert.ok(w.miniDead);
    w.puzzle.done = true;
    const boss = w.spawn(0, 5540, 610, 2, a * 2 + 1);
    w.damage(boss, 1e6, p, "relic");
    assert.ok(w.bossDead);
    if (a < 3) {
      const opt = w.spawn(0, 5950, 430, 3, 8 + a);
      w.damage(opt, 1e6, p, "relic");
      p.x = 6400;
      p.prev = {};
      w.setInput(p.id, { interact: true });
      w.interact(p, 1 / 30);
    }
  }
  assert.ok(w.ended);
  assert.equal(w.secretRelics, 3);
  assert.equal(w.act, 3);
});
test("revival, solo checkpoint return, reconnect identity and room capacity", () => {
  const { w, p } = setup();
  const ally = w.addPlayer("Ally", 1, "#aaccee");
  p.hp = 0;
  p.down = 12;
  ally.x = p.x;
  ally.y = p.y;
  w.setInput(ally.id, { interact: true });
  tick(w, 65);
  assert.ok(p.hp > 0);
  p.hp = 0;
  p.down = 0.01;
  tick(w, 1);
  assert.ok(p.hp > 0);
  p.connected = false;
  const restored = w.addPlayer("Different", 5, "#000000", p.token);
  assert.equal(restored.id, p.id);
  assert.equal(restored.classId, 0);
  for (let k = 0; k < 4; k++) w.addPlayer("Extra", k, "#aaccee");
  assert.throws(() => w.addPlayer("Too many", 0, "#aaccee"));
});
const event = (s: Socket, name: string) =>
  new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Timeout: " + name)), 4000);
    s.once(name, (v) => {
      clearTimeout(timer);
      resolve(v);
    });
  });
const stateWhere = (s: Socket, predicate: (v: any) => boolean) =>
  new Promise<any>((resolve, reject) => {
    const handler = (v: any) => {
      if (predicate(v)) {
        clearTimeout(timer);
        s.off("state", handler);
        resolve(v);
      }
    };
    const timer = setTimeout(() => {
      s.off("state", handler);
      reject(Error("Snapshot condition timeout"));
    }, 4000);
    s.on("state", handler);
  });
const join = (s: Socket, data: any) =>
  new Promise<any>((resolve) => s.emit("join", data, resolve));
test("real WebSockets: room sharing, snapshots, input, health, reconnect and isolation", async () => {
  const game = await createGameServer({ persist: false });
  await new Promise<void>((r) => game.http.listen(0, "127.0.0.1", r));
  const addr = game.http.address() as any,
    url = `http://127.0.0.1:${addr.port}`;
  const sockets: Socket[] = [];
  const connect = async () => {
    const s = io(url, { transports: ["websocket"], forceNew: true });
    sockets.push(s);
    await event(s, "connect");
    return s;
  };
  try {
    const a = await connect(),
      b = await connect();
    const one = await join(a, { name: "One", classId: 0, color: "#aabbcc" });
    const two = await join(b, {
      name: "Two",
      classId: 4,
      room: one.room,
      color: "#aabbcc",
    });
    assert.equal(one.room, two.room);
    assert.equal(two.state.players.length, 2);
    assert.ok(!JSON.stringify(two.state).includes(one.token));
    const w = game.worlds.get(one.room)!;
    a.emit("input", { right: true });
    await event(a, "state");
    await event(a, "state");
    assert.ok(w.players[one.id].x > 160);
    w.players[one.id].invuln = 0;
    w.hurt(w.players[one.id], 20);
    const sb = await stateWhere(
      b,
      (s) => s.players.find((p: any) => p.id === one.id)?.hp === 100,
    );
    assert.equal(sb.players.find((p: any) => p.id === one.id).hp, 100);
    const eid = w.spawn(0, 600).id;
    const sa = await stateWhere(a, (s) =>
      s.enemies.some((e: any) => e.id === eid),
    );
    const sb2 = await stateWhere(b, (s) =>
      s.enemies.some((e: any) => e.id === eid),
    );
    assert.ok(
      sa.enemies.some((e: any) => e.id === eid) &&
        sb2.enemies.some((e: any) => e.id === eid),
    );
    a.disconnect();
    await new Promise((r) => setTimeout(r, 30));
    const re = await connect();
    const same = await join(re, { room: one.room, token: one.token });
    assert.equal(same.id, one.id);
    assert.equal(same.state.players.find((p: any) => p.id === one.id).hp, 100);
    const other = await connect();
    const isolated = await join(other, { name: "Other" });
    assert.notEqual(isolated.room, one.room);
    assert.equal(isolated.state.players.length, 1);
    const invalid = await connect();
    assert.ok((await join(invalid, { room: "BAD" })).error);
  } finally {
    for (const s of sockets) s.disconnect();
    await game.close();
  }
});
test("one-shot abilities survive a subsequent movement packet before simulation", () => {
  const { w, p } = setup();
  w.setInput(p.id, { ability: 5 });
  w.setInput(p.id, { right: true });
  tick(w, 1);
  assert.ok(p.cool[5] > 0);
  assert.equal(p.input.ability, undefined);
});
test("six network clients share a room; a seventh cannot join", async () => {
  const game = await createGameServer({ persist: false });
  await new Promise<void>((r) => game.http.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${(game.http.address() as any).port}`,
    all: Socket[] = [];
  let room = "";
  try {
    for (let i = 0; i < 7; i++) {
      const s = io(url, { transports: ["websocket"], forceNew: true });
      all.push(s);
      await event(s, "connect");
      const res = await join(s, { room, name: "Hero " + i, classId: i % 6 });
      if (i < 6) {
        assert.ok(!res.error);
        room = res.room;
      } else assert.ok(res.error);
    }
    const snap = await stateWhere(all[0], (s) => s.players.length === 6);
    assert.equal(new Set(snap.players.map((p: any) => p.classId)).size, 6);
  } finally {
    for (const s of all) s.disconnect();
    await game.close();
  }
});
test("save/reload restores campaign and reconnect identity without marking stale players online", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join: joinPath } = await import("node:path");
  const dir = await mkdtemp(joinPath(tmpdir(), "realms-save-")),
    old = process.env.DATA_DIR;
  process.env.DATA_DIR = dir;
  try {
    const first = await createGameServer({ persist: true, manual: true });
    const w = new World("SAVE1234");
    const p = w.addPlayer("Saved", 2, "#aabbcc");
    w.act = 2;
    w.miniDead = true;
    p.gold = 123;
    first.worlds.set(w.id, w);
    await first.save();
    await first.close();
    const second = await createGameServer({ persist: true, manual: true });
    try {
      const restored = second.worlds.get(w.id)!;
      assert.equal(restored.act, 2);
      assert.ok(restored.miniDead);
      assert.equal(restored.players[p.id].connected, false);
      const hero = restored.addPlayer("Saved", 0, "#aabbcc", p.token);
      assert.equal(hero.id, p.id);
      assert.equal(hero.gold, 123);
      assert.equal(hero.classId, 2);
    } finally {
      await second.close();
    }
  } finally {
    if (old === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = old;
    await rm(dir, { recursive: true, force: true });
  }
});

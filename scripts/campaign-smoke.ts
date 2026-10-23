// Accelerated wall-clock simulation, using only normal gameplay inputs/actions.
// This is a reachability check, not a substitute for human pacing/playtesting.
import { World } from "../src/engine.ts";
const w = new World("SMOKE", "Casual");
const p = w.addPlayer("Campaign Bot", 1, "#aabbcc");
let lastAct = -1,
  lastPuzzle = -1,
  deaths = 0,
  wasDown = false;
for (let step = 0; step < 90000 && !w.ended; step++) {
  if (w.act !== lastAct) {
    console.log(
      `Act ${w.act + 1} reached at ${(w.time / 60).toFixed(1)} simulated minutes`,
    );
    lastAct = w.act;
    lastPuzzle = -1;
  }
  if (w.dialogue) w.action(p.id, "skip");
  if (p.hp <= 0 && !wasDown) deaths++;
  wasDown = p.hp <= 0;
  let target = w.enemies
    .filter((e) => e.hp > 0 && e.behavior !== "crystal")
    .sort(
      (a, b) =>
        Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
    )[0];
  const anchor = w.enemies
    .filter((e) => e.hp > 0 && e.behavior === "crystal")
    .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
  if (anchor) target = anchor;
  const king = w.enemies.find((e) => e.boss === 7 && e.phase === 3 && e.shield);
  let goal = 6400,
    interact = false,
    jump = false,
    fly = false,
    attack = false,
    ability: number | undefined;
  if (king && !anchor) {
    goal = 5500;
    interact = Math.abs(p.x - goal) < 50;
  } else if (target) {
    goal = target.x - 220 * Math.sign(target.x - p.x || 1);
    attack = true;
    ability = [5, 2, 1, 4, 0].find((n) => p.cool[n] <= 0);
    jump = target.y < p.y - 80 && step % 30 < 15;
    fly = target.y < p.y - 100;
  } else if (w.miniDead && !w.puzzle.done) {
    if (w.act === 0) {
      goal = 3950 + w.puzzle.step * 160;
      interact = Math.abs(p.x - goal) < 30 && step % 4 === 0;
    }
    if (w.act === 1) {
      const k = w.puzzle.values[0] >= 1 ? 1 : 0;
      goal = 4000 + k * 280;
    }
    if (w.act === 2) {
      const k = [0, 1, 2].find((k) => w.puzzle.values[k] !== [1, 0, 3][k]) ?? 0;
      goal = 3950 + k * 160;
      interact = Math.abs(p.x - goal) < 30 && step % 4 === 0;
    }
    if (w.act === 3) {
      const k = w.puzzle.values.findIndex((v) => v < 1);
      goal = 3950 + Math.max(0, k) * 160;
      interact = Math.abs(p.x - goal) < 30;
    }
  } else if (w.bossDead) {
    goal = 6400;
    interact = p.x > 6370;
  } else goal = w.miniDead ? 5300 : 2400;
  const delta = goal - p.x;
  w.setInput(p.id, {
    left: delta < -25,
    right: delta > 25,
    attack,
    ability,
    ax: target?.x ?? p.x + 100,
    ay: target?.y ?? p.y,
    interact,
    jump,
    fly,
    dodge: false,
  });
  w.update(1 / 30);
  if (step % 18000 === 17999)
    console.log(
      `Progress: act ${w.act + 1}, x=${Math.round(p.x)}, enemies=${w.enemies.length}, mini=${w.miniDead}, puzzle=${w.puzzle.done}, hp=${p.hp}, deaths=${deaths}`,
    );
}
console.log(
  JSON.stringify(
    {
      ended: w.ended,
      act: w.act + 1,
      simulatedMinutes: w.time / 60,
      deaths,
      enemies: w.enemies.map((e) => ({
        name: e.name,
        hp: e.hp,
        x: e.x,
        y: e.y,
      })),
      puzzle: w.puzzle,
    },
    null,
    2,
  ),
);
if (!w.ended) process.exitCode = 1;

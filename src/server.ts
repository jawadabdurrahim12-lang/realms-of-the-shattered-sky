import express from "express";
import { createServer as httpServer } from "node:http";
import { Server } from "socket.io";
import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { World } from "./engine.ts";
const here = path.dirname(fileURLToPath(import.meta.url));
export async function createGameServer({
  persist = true,
  manual = false,
} = {}) {
  const app = express(),
    http = httpServer(app),
    io = new Server(http, { maxHttpBufferSize: 8192, pingTimeout: 20000 });
  const worlds = new Map<string, World>();
  const sessions = new Map<string, string>();
  const rates = new Map<string, { n: number; t: number }>();
  const saveDir = process.env.DATA_DIR || path.resolve("data");
  if (persist) {
    await mkdir(saveDir, { recursive: true });
    try {
      const data = JSON.parse(
        await readFile(path.join(saveDir, "worlds.json"), "utf8"),
      );
      for (const raw of data) {
        if (Date.now() - raw.lastActive > 86400000) continue;
        const w: World = Object.assign(new World(raw.id), raw);
        for (const p of Object.values(w.players)) {
          p.connected = false;
          p.input = {};
          p.prev = {};
        }
        worlds.set(w.id, w);
      }
    } catch (e) {
      if ((e as any).code !== "ENOENT")
        console.warn("Could not restore save:", (e as Error).message);
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
      platform: "browser",
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
    let world: World | undefined,
      playerId = "",
      count = 0,
      last = Date.now();
    const allowed = () => {
      if (Date.now() - last > 1000) {
        last = Date.now();
        count = 0;
      }
      return ++count < 90;
    };
    socket.on("join", (data: any, ack: any) => {
      if (typeof ack !== "function" || !allowed()) return;
      if (world) {
        ack({ error: "Already joined" });
        return;
      }
      try {
        if (!data || typeof data !== "object")
          throw Error("Invalid join request");
        const room =
          typeof data.room === "string" ? data.room.toUpperCase() : "";
        if (room) {
          if (!/^[A-F0-9]{8}$/.test(room) || !worlds.has(room))
            throw Error(
              "World not found or expired. Check the invitation link.",
            );
          world = worlds.get(room);
        } else {
          const ip = socket.handshake.address;
          let rate = rates.get(ip);
          if (!rate || Date.now() - rate.t > 600000) {
            rate = { n: 0, t: Date.now() };
            rates.set(ip, rate);
          }
          if (++rate.n > 10 || worlds.size >= 100)
            throw Error(
              "World creation limit reached. Join an existing world or try later.",
            );
          const id = randomBytes(4).toString("hex").toUpperCase();
          world = new World(
            id,
            ["Casual", "Adventurer", "Heroic"].includes(data.difficulty)
              ? data.difficulty
              : "Adventurer",
          );
          worlds.set(id, world);
        }
        const p = world!.addPlayer(
          typeof data.name === "string" ? data.name : "Wanderer",
          Number(data.classId),
          typeof data.color === "string" ? data.color : "#8de0cf",
          typeof data.token === "string" ? data.token : undefined,
        );
        playerId = p.id;
        const key = world!.id + ":" + p.id;
        const prior = sessions.get(key);
        if (prior && prior !== socket.id)
          io.sockets.sockets.get(prior)?.disconnect(true);
        p.connected = true;
        sessions.set(key, socket.id);
        socket.join(world!.id);
        ack({
          room: world!.id,
          id: p.id,
          token: p.token,
          state: world!.snapshot(),
        });
      } catch (e) {
        world = undefined;
        ack({ error: (e as Error).message });
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
  let accumulator = 0,
    prev = Date.now();
  const timer = manual
    ? null
    : setInterval(() => {
        const now = Date.now();
        accumulator += Math.min((now - prev) / 1000, 0.2);
        prev = now;
        while (accumulator >= 1 / 30) {
          for (const w of worlds.values()) w.update(1 / 30);
          accumulator -= 1 / 30;
        }
        for (const w of worlds.values())
          if (w.active().length) io.to(w.id).emit("state", w.snapshot());
      }, 1000 / 20);
  let saving = false;
  async function save() {
    if (!persist || saving) return;
    saving = true;
    try {
      for (const [id, w] of worlds)
        if (!w.active().length && Date.now() - w.lastActive > 86400000)
          worlds.delete(id);
      await writeFile(
        path.join(saveDir, "worlds.tmp"),
        JSON.stringify([...worlds.values()]),
      );
      await rename(
        path.join(saveDir, "worlds.tmp"),
        path.join(saveDir, "worlds.json"),
      );
    } finally {
      saving = false;
    }
  }
  const saveTimer = persist
    ? setInterval(() => save().catch(console.error), 15000)
    : null;
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
      await new Promise<void>((r) => io.close(() => r()));
    },
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const game = await createGameServer();
  const port = Number(process.env.PORT) || 4173;
  game.http.listen(port, "0.0.0.0", () =>
    console.log(`Realms of the Shattered Sky listening on ${port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, async () => {
      await game.close();
      process.exit(0);
    });
}

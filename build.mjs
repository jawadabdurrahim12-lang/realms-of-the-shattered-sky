import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist/public", { recursive: true });
await cp("public", "dist/public", { recursive: true, filter: (source) => !source.endsWith("game.js") && !source.endsWith(".map") });
await build({
  entryPoints: ["src/client.ts"],
  outfile: "dist/public/game.js",
  bundle: true,
  minify: true,
  platform: "browser",
  target: "es2022",
});
await build({
  entryPoints: ["src/server.ts"],
  outfile: "dist/server.js",
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  target: "node22",
});
console.log("Client and authoritative server built.");

# Realms of the Shattered Sky — playable alpha 0.1

An original browser co-op action adventure with a **real authoritative Node.js / Socket.IO server**. The downloadable project includes TypeScript source, compiled client/server, original procedural art and synthesized music, tests, and deployment configuration.

**This is a compact playable alpha, not the full 75–105-minute game described in the brief.** The four-act campaign can be completed, but its world, encounters, equipment and narrative are abbreviated. The automated Casual Archmage run reached the ending in about 4.4–5.2 simulated minutes across two runs, with perfect knowledge and one to three deaths. That is a reachability check, not a human playtime estimate. No public deployment has been made.

## Run locally

Install Node.js 22 or newer. Extract this archive, open a terminal inside its `realms` folder, then:

```sh
npm install
npm run dev
```

Open **http://localhost:4173**. Pick a hero, enter a name, and create a world.

Production:

```sh
npm run build
npm start
```

The prebuilt `dist/` directory is included. You can also use `npm ci --omit=dev` followed by `npm start` without rebuilding. This is a browser/server application, not a double-click native Mac app or a standalone HTML file. Only the host needs Node; players use a browser.

## Put it online and invite friends

Deploy the entire project as a **persistent Node web service**, not a static site or a request-only serverless function.

One supported configuration is Render:

1. Put the contents of `realms/` at the root of a Git repository.
2. In Render, create a **Web Service**, connect that repository, and choose the Node runtime.
3. Set **Build command** to `npm ci && npm run build` and **Start command** to `npm start`.
4. Use **Node 22**, health path `/health`, and a single service instance. The server uses Render's supplied `PORT` and listens on `0.0.0.0`.
5. After deployment succeeds, open the actual HTTPS URL the provider returns.
6. Create World → **INVITE** → send the copied `?room=XXXXXXXX` link to friends. They enter their names/classes and join without accounts, installations, or port forwarding.

`render.yaml` contains these settings. It does not provision persistent storage. To retain room saves across restarts/deploys, attach a persistent disk and set `DATA_DIR` to its mount directory, such as `/var/data`. Check the provider's plan/storage requirements before provisioning. Without a persistent disk, provider restarts can erase saves.

Official deployment references checked during development:
- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/websocket
- https://render.com/docs/disks

A local `localhost` invitation only works on the host computer. A public hosting URL is required for internet friends. No public URL is supplied or implied by this archive.

Docker alternative:

```sh
docker build -t shattered-sky .
docker run --rm -p 4173:4173 -v shattered-sky-data:/app/data shattered-sky
```

Use a TLS reverse proxy or a managed container web service for public hosting. Preserve WebSocket upgrades. Run **one instance**: room ownership is in-process and no distributed room adapter is included.

## Controls

| Action | Keyboard/mouse |
|---|---|
| Move | A / D, or left/right arrows |
| Double jump | Space, release, Space |
| Fly | Hold W / up arrow; land to recharge |
| Aim / primary ability | Mouse / left button |
| Abilities 2–5 | Q, R, F, C |
| Ultimate | X |
| Dodge | Shift |
| Interact / rest / revive / channel | E; hold for revives and relics |
| Gear / forge | I |
| Quest journal / ability explanations | J |
| Puzzle hint | H |
| Advance dialogue | Enter or Continue; every connected player votes |

Touch controls and tappable hotbar are provided, with automatic targeting until pointer aiming is used. Mobile usability has **not** been fully tested. Desktop keyboard/mouse is the tested interface.

Click the music button to enable original Web Audio music and effects. External fonts are optional; system fallbacks work without Google Fonts.

## Campaign walkthrough (spoilers)

Every region has eastward progression, a guardian seal, an ancient puzzle, a major boss, and a checkpoint after victories.

- **Act I — Emberfall:** Speak to Elder Sera; defeat the Rift Stalker around 2,650m. Activate the three runes in Sun, Moon, Star order at 3,950/4,110/4,270m. Defeat Ashfang near 5,540m. Hold E at the siege trap around 5,230m when he is nearby.
- **Act II — The Verdant Wound:** Defeat the Mire Witch. Destroy her totems. Stand on both moonstones near 4,000/4,280m until charged; solo charges persist. Defeat Rootmother and destroy exposed corruption hearts.
- **Act III — The Aether Reach:** Longer flight is unlocked for everyone. Defeat the Skybreaker Roc. Rotate the three mirrors to E, N, W, then defeat Aetherion while avoiding marked lightning zones.
- **Act IV — The Last Light:** Defeat the Gravebound Herald. Hold E at each of four relics to open the seal. Fight the Hollow King through three phases; destroy crystals, then channel the central altar around 5,500m in the last phase. Defeat him to trigger dialogue, resolution and credits.
- After each main boss in Acts I–III, use E near the eastern portal at 6,400m to take the whole party to the next act.
- Optional star altars around 6,070m summon the Mimic Sovereign, Buried Oracle and Clockwork Behemoth in Acts I–III. Their three relics unlock the Nameless Star in Act IV. These are additional fights, not full hidden dungeons.
- Lumen's cache at 1,100m in each act grants a charm and shards. Checkpoint lanterns restore health with E; Tovin's gear screen sells equipment near checkpoints.
- Downed heroes can be revived by a friend holding E for two seconds. Otherwise they return to their checkpoint after twelve seconds. Defeated enemies and boss damage persist, avoiding a grind.

Optional relics must be obtained before leaving their act; backward travel is not implemented. The final credits can be dismissed to explore the final region and challenge the Nameless Star.

## Implemented systems

- Up to six heroes per room, unique room links, separate rooms, reconnect identity, group dialogue voting and shared campaign state.
- 30 Hz authoritative simulation with 20 Hz snapshots. Clients send controls, never damage or rewards. Movement, health, enemies, projectiles, summons, drops, puzzles, equipment and checkpoints come from the server.
- Six classes, each with five abilities and one ultimate; autonomous melee/ranged companions, a healing totem and titan; energy transformation; cooldown hotbar.
- 32 named enemy definitions with behaviour branches including split, charge, ranged positioning, frontal blocking, teleport, injured-target priority, healing, burrow, web, roots, poison, pack speed, explosion, weak point, fading, dive, lightning, mimic, burst, gust, homing, rear defence, heavy attack, drain, summoning, shockwaves, projectile consumption and hybrid attacks. Several share sprite families and animation routines.
- Four mandatory mini-bosses, four main bosses and four optional bosses. Damage telegraphs, attack/recovery windows, phases, crystals/totems and a channelled final altar. Their attacks are simplified implementations, not every bespoke mechanic from the brief.
- C/B/A/S equipment, eight slots, class-themed weapons, automatic stronger-item equip, manual slot choice, damage/defence/speed/crit/flight/summon bonuses, loot and shard-based forge purchases.
- Four different puzzle rules, shared progress, solo solutions, journal hints, original NPC dialogue and an actual ending.
- Custom cloak colour, rank-based hero art changes, original procedural scenery/sprite families, particles, damage numbers, music themes and combat sounds.
- Casual/Adventurer/Heroic modes. Health scaling is modest; larger groups also spawn an extra enemy per encounter. This is basic scaling, not fully tuned encounter composition.
- Atomic JSON saves every 15 seconds and on graceful shutdown. Empty worlds expire after 24 hours. Reconnect identity is stored per browser in local storage; disconnected slots are reserved for five minutes.

## Deliberately unfinished / simplified

This release does **not** fulfil the entire original specification:

- No validated 60–120-minute adventure. The campaign is much shorter, with sparse story and compact levels.
- No Terraria mining, building, procedural terrain destruction or large interconnected cave/dungeon network. All regions use a common platform layout with different scenery.
- No moving-platform puzzle, full mirror-ray simulation, elemental-seal puzzle or dedicated hidden-switch system. The mirror puzzle is a direction-combination puzzle.
- Not all requested boss mechanics are present: no physically destructible arenas, genuine decoy search, destructible Roc crash structures, Rootmother arena-vine reshaping, or sophisticated portal combat. The final shared channel is a simple altar interaction, not a bespoke synchronized finishing animation.
- Not 32 entirely independent hand-animated art sets. Enemy behaviours and silhouettes are varied but some families share art/motion.
- No full affix/elemental-proc/attack-speed buildcraft, secondary weapon swapping, cosmetics selection beyond colour and rank-based artwork, merchant trading economy or branching NPC quest chains.
- The renderer uses Canvas 2D and the build uses esbuild, rather than Phaser/Vite. TypeScript, Node and Socket.IO are used.
- No public hosting, real-world six-person latency/load soak test, broad mobile/browser compatibility pass, gamepad support, moderation/admin UI, account system or production distributed persistence.
- Save recovery requires the same browser token. Opening the same room in two tabs of one browser reconnects the same hero. Use separate browser profiles/devices for different heroes.
- Anyone possessing the room link can join while a slot is available. This is a friends-only alpha design, not a hardened public game platform.

## Validation

```sh
npm run check
npm test
npm run build
node --import tsx scripts/campaign-smoke.ts
```

See `TEST_REPORT.md` for observed results and limits. No gameplay assertions depend on browser-local state as the source of truth.

## Source map

- `src/content.ts`: class/enemy/boss definitions, items, region text, endings, platforms.
- `src/engine.ts`: authoritative world, movement, combat, AI, rewards, puzzles and progression.
- `src/server.ts`: HTTP, Socket.IO, rooms, reconnects, throttling, persistence.
- `src/client.ts`: controls, UI, interpolation and scene drawing.
- `src/art.ts`: original pixel-inspired procedural sprites and parallax scenery.
- `src/audio.ts`: original synthesized music and effects.
- `public/`: page and styles; `dist/`: compiled production files.
- `tests/`: engine and real WebSocket integration tests.
- `scripts/campaign-smoke.ts`: input-driven solo reachability simulation.

This project uses original programmatic artwork/music and the named open-source dependencies. Their licences remain with their authors. No copied game artwork or anime characters are included.

# Validation report — playable alpha 0.1

Date: 23 October 2026. Tested on Node.js 24 in the build environment; deployment targets Node.js 22+.

## Automated checks

`npm run check`: TypeScript check passed.

`npm run build`: client and production server bundled successfully.

`npm test`: **13 tests passed, 0 failed**:

1. All six class kits / all 36 ability slots consume cooldown and produce an observable combat, mobility, defensive or summon effect.
2. Authoritative running, double jumping, flight, dodge and progression gate clamps; invalid aim/ability input sanitation.
3. Autonomous skeleton, wolf, elemental, archer and titan attacks damage enemy targets.
4. All 32 enemy behaviour definitions execute without non-finite simulation state; slime splitting is asserted.
5. Frontal blocking, armour-breaking attacks, equipment damage bonuses and projectile absorption.
6. All four puzzle rules can be completed by one player using interactions.
7. All 12 bosses execute phase transitions, defeat/reward state and final boss altar logic.
8. Four-act progression and ending flags, with retained optional relics.
9. Teammate revival, solo checkpoint respawn, reconnect identity and six-player capacity.
10. Actual Socket.IO clients using WebSocket transport: shared room, movement input, synchronized health/enemy identity, reconnect and room isolation.
11. A one-shot ability is not lost when a later movement packet arrives before the next server tick.
12. Six real WebSocket clients join the same room with all six classes; seventh client is rejected.
13. Save and reload retain campaign, gold, class and reconnect token; stale players restore offline.

The boss/transition unit tests deliberately set up fixtures and manipulate enemy health to test transitions. They do not demonstrate that a human can defeat every boss with every class, or that the encounters are correctly balanced.

## Input-driven campaign reachability

`scripts/campaign-smoke.ts` runs a solo Casual Archmage bot through the normal simulation. It uses movement, aiming, abilities, interactions, cooldowns and normal deaths/respawns. It does not award itself equipment, set boss health, bypass seals or teleport the player.

Two observed runs reached the actual ending in approximately **4.4 and 5.2 simulated minutes**, with one and three deaths respectively. These are accelerated wall-clock simulations with perfect route/puzzle knowledge. They confirm end-to-end reachability and also demonstrate that the current campaign is much shorter than the requested 75–105 minutes. No human duration is claimed.

## Browser inspection

Observed in the provided Chrome browser:

- Landing page, animated class portrait and original scene render.
- Name entry, Create World, generated room URL and connected HUD.
- Movement updates position and nearby enemies deal damage.
- NPC dialogue advances.
- Equipment/forge panel lists the starting item, correct stats and disabled unaffordable purchases.
- Scene, hotbar, health/flight bars, scenery and enemy sprites render.

Captured browser error logs showed extension-origin metadata errors, not an identified game-origin exception. This is not a blanket claim that every browser session is error-free.

## Not verified

- Public deployment or invitation links across independent internet connections.
- Human completion with every class, every difficulty and every party size.
- 60–120-minute pacing, boss duration targets, long-term balance or replay quality.
- Six-human-player load/latency soak tests, disconnects during every transition, or process termination during a disk write.
- Touch/mobile browsers, Safari, Firefox, accessibility/keyboard-only menu navigation, gamepads.
- Docker image build or live deployment of the Render blueprint. These configurations are supplied, not claimed deployed.
- All requested bespoke mechanics; see README's explicit incomplete-feature list.

No test-only cheat endpoint or campaign-skipping API is exposed to clients.

## Production bundle smoke test

The compiled `dist/server.js` was imported and started on an ephemeral local HTTP port. `/health`, `/`, `/game.js` and `/style.css` each returned HTTP 200, and a real WebSocket client successfully created a world against that production bundle.

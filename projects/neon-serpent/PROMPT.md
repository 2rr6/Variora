# Neon Serpent

Build a complete, playable first-person 3D snake game using Vite, TypeScript, and Three.js. The setting is a compact futuristic Japanese city at night, with a strong cyberpunk and neon identity. The player is a mechanical snake that consumes energy, grows longer, and must avoid the city and its own moving body.

Create a finished small game with a coherent visual identity and satisfying controls. Make the remaining design decisions yourself within this brief.

Follow the repository's [implementation workflow](../../AGENTS.md#implementation-workflow), from branch creation before implementation to delivery through a created PR.

## Gameplay

- Use a first-person camera at the snake's head throughout active play. The snake moves forward automatically on a flat ground plane. It cannot fly or jump.
- Horizontal mouse movement steers left and right with smooth, responsive turning and a bounded turn rate. Use pointer lock after an explicit Start or Resume click. Ignore vertical mouse movement for steering. Avoid abrupt camera motion, heavy head bob, and excessive screen shake.
- Build a finite, solid snake body that follows the head's traveled path and grows when energy is collected. The tail advances as the snake moves. Make the body visible when the player turns or loops around it; it must not obscure the forward view.
- Collectible energy nodes increase the score and body length. Display the scoring rule in the instructions. Gradually increase forward speed as the score rises, with a playable upper limit.
- Colliding with a building, an arena boundary, or a non-adjacent part of the snake's body ends the run. Avoid immediate self-collisions with the neck directly behind the camera. Keep rendered obstacles and collision boundaries consistent.
- Spawn the player in a clear area with enough room to learn the controls. Place energy on navigable ground with adequate clearance from buildings and the snake. Check available placements so energy remains reachable from the player's current area; if no valid placement is available, end the run with a clear completion message instead of hanging or spawning inside an obstacle.
- Use a single-player endless score mode. A run continues until a collision or until there is no remaining valid placement. No opponents are needed.

## City and visual direction

Create a compact, navigable city district with wide streets, intersections, and at least one small plaza. The layout should support turning, circling blocks, and planning routes as the snake grows.

The scene should read as a futuristic Japanese city through its architecture and street details:

- Layered buildings with Japanese shop signs, illuminated vertical signage, and holographic advertisements.
- Cyan and magenta neon balanced with dark surfaces and warmer shop lighting.
- Rainy-night atmosphere, wet-looking pavement, visible light accents, and atmospheric depth. Approximate reflections are acceptable.
- Rooftop machinery, cables or pipes, an elevated transit structure, and distant flying vehicles that provide background motion.
- A luminous mechanical snake with a clearly legible segmented body, plus energy nodes that stand out from decorative lights.

Compose the scene deliberately. Preserve readable streets, obstacle silhouettes, and collectible visibility. Decorative lights and bloom should support playability. Keep flying vehicles and elevated scenery outside the playable collision space. Give the outer boundary a visible treatment that matches its collision shape.

Use HTML/CSS for the interface and an optional 2D canvas for the minimap. The minimap must show the head and heading, current moving body, obstacles, and active energy nodes. Keep the primary gameplay view first-person.

## Game flow and controls

Provide:

1. A title screen with the game name, concise controls, scoring instructions, and a Start button.
2. An in-game HUD with score, speed or difficulty level, and a readable minimap.
3. Pause and resume. Pressing Escape, losing pointer lock, or losing window focus must pause simulation and progression. Resume only after an explicit user action.
4. A game-over or completion screen with the final score and a Restart button.
5. A restart that resets the score, speed, snake, camera, and collectibles, with no stale state or duplicate input handlers.

Support desktop keyboard and mouse play. Keep menus usable and the HUD readable at both 1440 x 900 and 960 x 640. Resize the renderer and camera correctly when the window changes size. Mobile controls are outside the scope.

Audio is optional. If included, synthesize it in code, start it only after user interaction, and provide a mute control.

## External-material restrictions

Create all game-specific visuals and any audio yourself through original code. Use procedural geometry, materials, shaders, Canvas-generated textures and signs, CSS, and optionally Web Audio synthesis.

- Do not search for, download, import, copy, trace, or embed external artwork, photographs, textures, 3D models, HDRIs, skyboxes, icon sets, font files, music, or sound effects. This includes assets bundled in packages, existing local asset collections, and encoded copies of external files.
- Do not use image, 3D, music, or audio generation services or tools to produce assets. Build them through code.
- Do not consult or copy existing game implementations, starter games, scene templates, tutorials, reference artwork, or another model's solution.
- You may consult official API documentation as technical reference. Use only Three.js, its official addons, Vite, TypeScript, and necessary type or build dependencies, including their transitive dependencies. Install them through the package manager. Do not add other runtime libraries or asset packages.
- Use system-installed fonts and Japanese-capable system fallbacks for interface text and signs. Do not fetch web fonts.
- After dependencies are installed, the app must run from the local development or preview server without external network requests. No CDNs, hosted media, external APIs, analytics, or remote services.

There are no supplied assets or starter application files. Start with the shared prompt and an empty application directory. Keep other implementations outside your working context.

## Skills, tools, and assistance

Skills, plugins, tools, and subagents may assist with the task within the restrictions above. Record their use in the implementation README:

- Distinguish capabilities available in the environment from those actually used during this run.
- List every skill actually loaded, including automatically loaded skills, with its name, source link or local path, version or commit when known, and its role in the work.
- List tools, plugins, and MCP servers actually used and explain their purpose, including documentation lookup, coding, browser testing, or capture.
- If work is delegated, record each subagent's model ID, assigned task, and relevant skills or tools. Apply the same material restrictions to delegated work.
- Use `none` only when confirmed and `unknown` for unavailable details. Record user-controlled extra instructions and follow-up prompts. Skill or tool use does not relax the material restrictions.

## Technical requirements

- Implement the 3D world directly with Three.js. Keep all application code, configuration, dependency manifests, and the package lockfile inside `app/`.
- Provide `npm run dev`, `npm run build`, and `npm run preview`. A fresh install with `npm ci` must be sufficient before running those commands.
- Make movement, growth, and collision behavior consistent across rendering frame rates. Pausing or returning from an inactive tab must not cause a time jump or skipped collision.
- Keep geometry, lighting, effects, and allocations efficient enough for responsive desktop play. Aim for 60 FPS at 1440 x 900 on the test machine; report the actual browser, hardware if known, and measured result. If performance cannot be measured, say so.
- Handle unavailable WebGL with a readable message. If pointer lock fails, keep the game paused and present a clear retry action.

## Deliverables

In your assigned implementation directory, provide:

- `app/`: the complete runnable application, including a lockfile and an application README with setup, controls, and build instructions.
- `README.md`: the generation record, model identifier as exposed by your environment, provider, harness name and version, known settings, prompt revision, verification results, known issues, and any follow-up instructions or manual edits. Record the model provider separately from the harness: the provider serves the model, while the harness is the coding agent or application orchestrating the run, such as Codex CLI, Codex desktop, Claude Code, or Cursor. Record unavailable information as `unknown` and unmeasured values as `not measured`.
- `screenshots/`: actual captures of the title screen, active first-person gameplay, and a game-over or completion screen, if browser capture is available. Include at least one gameplay capture with the snake's body visible. Record the viewport used. Do not fabricate screenshots or test results.

## Acceptance criteria

Verify the following and record the observed result for each ID. Mark anything you cannot check as `not checked`.

| ID | Check |
| --- | --- |
| A1 | A fresh `npm ci` and `npm run build` succeed, and the demo runs through the documented commands. |
| A2 | Start enters first-person play, forward movement is automatic, and mouse steering is responsive and bounded. |
| A3 | Collecting energy updates the score, lengthens the body, and progresses the capped speed curve. |
| A4 | The body follows the traveled path and the tail moves; turning allows the player to see the body. |
| A5 | Buildings, boundaries, and the non-adjacent body each cause a game over on collision, without a false collision at spawn. |
| A6 | Energy spawns on reachable, clear ground. A lack of valid placement ends the run cleanly. |
| A7 | Escape, pointer-lock loss, and focus loss pause the game. Explicit resume continues without a time jump. |
| A8 | Restart restores the initial gameplay state and works across repeated runs. |
| A9 | The minimap tracks the head, heading, body, obstacles, and energy; the HUD remains readable at both required viewport sizes. |
| A10 | The city visibly includes the requested Japanese and futuristic details, and neon effects preserve gameplay visibility. |
| A11 | All assets comply with the procedural-content restrictions, and runtime network inspection shows no external requests. |
| A12 | Record performance during active play and report any browser console errors or unverified technical requirements. |
| A13 | The generation record identifies the model, provider, and harness with its version; distinguishes available and used capabilities; and identifies loaded skills, tools, plugins, and any subagents with their roles. |

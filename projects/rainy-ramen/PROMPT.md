# Rainy Ramen

Create a polished, original SVG illustration of a tiny Japanese ramen shop on a rainy night. The image should feel like an inviting miniature world and remain recognizable when reduced to a small square in a comparison grid.

Follow the repository's [implementation workflow](../../AGENTS.md#implementation-workflow), from branch creation before implementation to delivery through a created PR.

## Scene

Show the shop in a three-quarter view, with enough of its interior visible to establish depth. A cat chef leans through the serving window and hands a steaming bowl of ramen to a small robot customer standing outside. The robot holds a transparent umbrella in one hand and reaches for the bowl with the other. Make the serving gesture, characters, and their relationship immediately readable.

Include a hanging paper lantern, a small Japanese neon shop sign, visible rain, and reflections on the wet pavement. Warm light spills from the shop into the cooler night. Let the umbrella reveal some of the scene behind it. Give the cat and robot distinct silhouettes and expressive poses. Use steam, light, and a few carefully chosen shop details to make the scene feel alive.

Keep the shop and two characters as the main subjects. Choose the composition, palette, linework, proportions, and degree of stylization yourself. Favor a cohesive illustration with clear depth and an intentional focal point. Keep important shapes legible at 512 x 512 as well as full size. Any lettering should remain a supporting detail.

## SVG restrictions

- Deliver a single static `app/scene.svg`, with `width="1024"`, `height="1024"`, and `viewBox="0 0 1024 1024"`. Include the SVG namespace and an intentional background covering the canvas.
- Draw everything using original SVG vector elements. Gradients, masks, clipping paths, filters, internal definitions and references, and static styles are allowed.
- Do not use raster images, `<image>`, `<foreignObject>`, scripts, animation, remote URLs, external stylesheets, or embedded binary assets. Use system fonts if needed; do not import font files.
- Do not search for, download, inspect, trace, or reuse reference artwork, icons, existing SVG illustrations, or another model's solution. Do not use image-generation tools or services. Official SVG API documentation may be consulted for technical reference.
- The SVG must render by opening it directly in a browser, without dependencies, a build step, or network access. Keep model names, comparison labels, and explanatory prose outside the artwork.

## Generation conditions

You have one generation attempt and a maximum of 10 minutes from receipt of this prompt to final artwork submission, including skill and tool use. Produce one final illustration. Do not render or visually preview your work before submission, generate alternative candidates, request feedback, or revise it based on visual feedback. Code inspection and nonvisual syntax validation are allowed. Freeze the artwork at submission; subsequent PR preparation must preserve that exact SVG.

Skills, tools, plugins, and subagents may assist within these same constraints and the shared time budget. Record what was actually used, including automatically loaded skills. Keep other implementations outside your context.

## Submission

Save the SVG in the assigned implementation directory at `app/scene.svg`. Put a short generation record in `README.md` alongside `app/`, including:

- Model ID, model provider, harness name and version, known reasoning settings and output limits, shared prompt commit, and elapsed time.
- Available capabilities separately from tools and plugins actually used; each loaded skill's name, source, version or commit when known, and purpose; any subagents' model IDs and roles.
- Any extra instructions, known limitations, and validation actually performed. Use `unknown` for unavailable details and `not measured` for unmeasured values. Do not invent metadata or results.

The evaluator will render the submitted SVG and capture the comparison image afterward.

## Acceptance criteria

| ID | Check |
| --- | --- |
| A1 | The standalone SVG opens at 1024 x 1024 with a full background and no missing external resources. |
| A2 | The shop, cat chef, and robot customer are recognizable, and the shop has a three-quarter view with visible interior depth. |
| A3 | The cat hands the steaming bowl to the robot; the robot holds a transparent umbrella and reaches for the bowl with its other hand. |
| A4 | The scene includes the lantern, Japanese neon sign, rain, wet pavement reflections, and contrasting warm shop light and cool night atmosphere. |
| A5 | The SVG complies with the vector-only restrictions, and the run follows the time limit and no-preview rule. |
| A6 | The generation record identifies the model, provider, harness, and assistance used, marking unavailable information explicitly. |

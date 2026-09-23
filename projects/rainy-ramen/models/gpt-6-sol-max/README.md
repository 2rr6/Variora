# gpt-6-sol (max) — Rainy Ramen

| Field | Value |
| --- | --- |
| Model | gpt-6-sol |
| Reasoning effort | max |
| Provider | OpenAI (confirmed by the user) |
| Harness | Codex CLI 0.156.1 (reported by codex --version) |
| Starting commit | 1abb153ea39c3676ec3624b8a534f73ec83db4e1 |
| Prompt revision | projects/rainy-ramen/PROMPT.md blob 54e548e0eb2fb74dda19e518de8fa55ee218167d at the starting commit |

## Assistance used

- Skills: computer-use from the bundled plugin, version 26.917.51856, read for visual inspection. Its Browser Use action was blocked by the local-file URL policy. No other skills were used.
- Tools and plugins: Codex shell and patch tools for implementation; Python 3.14.6 for HTML/SVG structure checks; Node.js v22.22.3 for JavaScript syntax checking; temporary local @resvg/resvg-js 2.6.2 for static SVG rasterization and visual inspection. Headless Chrome and Edge were attempted for browser inspection but failed because their GPU processes crashed. No visual or audio asset-generation service was used.
- Subagents: none.
- Other models: none.
- User assistance: the user confirmed the provider; no visual or code guidance was supplied after the prompt.

## Run

Open [app/index.html](app/index.html) in a modern browser. There is no build step or runtime dependency. Alternatively, from the repository root run:

    python -m http.server 8000 --directory projects/rainy-ramen/models/gpt-6-sol-max/app

Then visit http://localhost:8000/. The **Hear the rain** button starts code-generated Web Audio after a user gesture; **Pause scene** freezes the CSS animation.

## Notes

- One implementation attempt, with an in-run adjustment to the mobile framing and narrow-screen typography. All illustration elements, rain animation, and optional rain audio are generated in the page's SVG, CSS, and JavaScript. No external assets are loaded.
- Checked: HTML structure contains the artwork SVG and two controls, with no external asset elements; the SVG parses as XML; the inline JavaScript passes a Node.js syntax check. Static SVG renders at desktop (1440 × 900) and mobile (390 × 844) sizes were inspected. A local Python HTTP server returned status 200 and the page body contained the inline SVG.
- Browser behavior remains unverified. Local headless Chrome and Edge failed to render because their GPU processes crashed, and Browser Use rejected the local-file URL. The static SVG inspection does not exercise the HTML overlay, CSS animation, controls, or Web Audio.

<div align="center">

<img src="site/public/icon.svg" alt="Variora" width="96" />

# Variora

Different models, the same brief - a collection of demos built from shared prompts, with source, screenshots, and notes.

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fvariora.fog.moe&style=flat-square&label=demo)](https://variora.fog.moe)
[![Deploy](https://img.shields.io/github/actions/workflow/status/scarletkc/variora/pages.yml?branch=main&style=flat-square&label=deploy)](https://github.com/scarletkc/variora/actions/workflows/pages.yml)
[![Last commit](https://img.shields.io/github/last-commit/scarletkc/variora?style=flat-square)](https://github.com/scarletkc/variora/commits/main)
[![License](https://img.shields.io/badge/license-MIT-black?style=flat-square)](LICENSE)

[Explore the projects](https://variora.fog.moe) · [Website development](site/README.md)

</div>

## Projects

- [Rainy Ramen](projects/rainy-ramen/): a cat-run ramen shop illustrated in SVG and presented in HTML.
- [Neon Serpent](projects/neon-serpent/): a first-person snake game in a futuristic Japanese city.

## Layout

```text
projects/
  <project>/
    PROMPT.md                 # Shared prompt
    README.md                 # Results and links
    models/
      <model>/
        README.md             # Model, harness, assistance, and run instructions
        app/                  # Implementation
        screenshots/          # Optional captures
templates/
  project/
  model/
```

## Add a comparison

Copy the [project template](templates/project/) into `projects/<project>/` and write a concise shared prompt. Each model follows the [repository rules](AGENTS.md), keeps its implementation in `models/<model>/app/`, and uses the [model record template](templates/model/README.md) for its README. Link the results from the project README.

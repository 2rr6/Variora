# [Model name and attempt]

## Generation record

| Field | Value |
| --- | --- |
| Model | [Exact model ID or label exposed by the provider] |
| Provider | [Service provider or local inference backend serving the model] |
| Harness | [Coding agent or application orchestrating the run, such as Codex CLI, Codex desktop, Claude Code, or Cursor; include its version when available] |
| Generated on | [YYYY-MM-DD, including time zone if recording a time] |
| Shared inputs revision | [Full Git commit SHA containing the project prompt, assets, and any starter files] |
| Model settings | [Reasoning mode, temperature, and other known settings] |
| Available capabilities | [Enabled skills, tools, plugins or MCP servers, and relevant access permissions, as far as known] |
| Additional instructions | [System or agent instructions under your control, or none; mark hidden instructions as unknown] |
| Time and cost | [Recorded values with units and source, or not measured] |

## Assistance used

Record what was actually used, including automatically loaded skills. For each category, write `none` only when confirmed; otherwise use `unknown` for unavailable details.

- Skills: [Name, source link or local path, version or commit if known, and the role each skill played.]
- Tools and plugins: [Tools, plugins, and MCP servers actually used, with their purpose.]
- Subagents: [Model IDs, assigned tasks, and relevant skills or tools used by delegated agents.]

## Run

Source: [app](app/).

- Prerequisites: [Runtime and required configuration.]
- Working directory: this implementation's `app/` directory.
- Install: [Exact command, or not required.]
- Start: [Exact command or file to open.]
- Open: [Local URL or application entry point.]

## Verification

| Acceptance criterion | Result | Evidence |
| --- | --- | --- |
| [Criterion from the shared prompt] | [Pass, fail, or not checked] | [Command and observed result, or screenshot link] |

Screenshots: [screenshots](screenshots/). Record the viewport and relevant state alongside each capture.

## Follow-up prompts and human edits

[Write "None" for an unchanged first response. Otherwise, record follow-up prompts verbatim in order and describe manual changes, with commit links where available. Distinguish the first response from the final saved result.]

## Observations

[Describe strengths, limitations, and subjective impressions. Link evidence for factual claims.]

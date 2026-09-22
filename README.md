# Variora

Different models, the same brief. A collection of demos built from shared prompts, with source code, screenshots, and notes for comparing the results.

## Projects

- [Neon Serpent](projects/neon-serpent/): a first-person snake game set in a procedural, neon-lit Japanese city.

## Layout

```text
projects/
  <project>/
    README.md                 # Overview and comparison
    PROMPT.md                 # Exact shared prompt
    assets/                   # Shared inputs, when needed
    models/
      <model>/
        README.md             # Model details, setup, and observations
        app/                  # Complete runnable demo
        screenshots/          # Captured results
templates/
  project/                    # Starting point for a comparison
  model/                      # Starting point for an implementation
```

Each implementation keeps its dependencies, lockfiles, and configuration inside `app/`. Its README provides the commands needed to run it.

## Add a comparison

1. Copy [the project template](templates/project/) into `projects/<project>/`.
2. Replace the placeholders in `PROMPT.md` with the exact prompt to send to every model. Put any shared input files in `assets/` and name them in the prompt.
3. Copy [the model template](templates/model/) into `projects/<project>/models/<model>/` for each implementation.
4. Save the generated demo in `app/` and fill in the model README. Keep any README generated with the demo inside `app/`.
5. Add comparison rows to the project README and link the project under [Projects](#projects).

For example, from the repository root in PowerShell:

```powershell
Copy-Item -Recurse templates/project projects/todo-app
Copy-Item -Recurse templates/model projects/todo-app/models/model-a
Copy-Item -Recurse templates/model projects/todo-app/models/model-b
```

Use lowercase, hyphenated directory names. Include the model version in its folder name; record the exact model ID in its README. For another attempt or configuration, create a sibling such as `<model>-run-02` and keep the earlier result.

## Comparison records

- Start each model in a fresh session with the same prompt, input assets, and starting files. Keep access to other implementations out of that session's workspace.
- Commit the shared inputs before generation and record that commit in each model README. If the requirements change, start a new project comparison, such as `<project>-v2`.
- Record the client, model settings, skills, tools, subagents, follow-up prompts, and human edits in the implementation record. Distinguish available capabilities from those actually used. Use `unknown` for unavailable details and `not measured` for unmeasured time or cost.
- Check every implementation against the acceptance criteria in the prompt. Link observations to screenshots or verification results, and distinguish measured results from personal impressions.

# Model implementation work

## Isolation

When generating or revising a demo, do not read, search, copy, or reference another model's implementation code in this repository, including through Git history, tools, skills, or subagents.

## Implementation workflow

1. Before creating any implementation files or writing code, create and switch to a new branch for the project's model run, starting from the agreed shared-inputs commit. Give each model run its own branch, for example `feat/rainy-ramen/model-a-run-01`. Do not begin implementation on `main` or another model's branch. Use separate worktrees or checkouts for concurrent runs.
2. Complete the implementation and generation record on that branch. Validate only as allowed by the project prompt, and preserve any submission frozen by its generation deadline.
3. Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages and PR titles, for example `feat(rainy-ramen): add model-a SVG implementation`.
4. Commit the scoped changes, push the model's branch, and create a pull request targeting `main`. Describe the implementation and actual verification results, linking evidence and noting any unchecked requirements. Leave the PR open for review.
5. Present the created PR URL as the final delivery, together with a concise summary of the result and validation.

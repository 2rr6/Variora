# Contributing to Variora

Issues and pull requests are welcome: propose a shared prompt, contribute a model implementation, report a problem, or improve the website and documentation. You can submit a prompt idea without implementing it yourself.

Contributions should be authentic, reproducible, and clear about the conditions behind each result.

## Propose a prompt

Open an issue with the task, expected deliverable, and any constraints on tools, dependencies, or assets. Keep the brief clear enough for different models to attempt independently and for readers to assess the results against the same requirements.

To add a project, use the [project template](templates/project/). Keep the shared brief in `PROMPT.md`. If a prompt changes after implementations exist, identify which revision each run used; results from different briefs should not be presented as the same comparison.

## Contribute an implementation

Follow the [model implementation rules](projects/AGENTS.md) and use the [model record template](templates/model/README.md). Place the implementation in `projects/<project>/models/<model>/app/` and link it from the project README.

We prioritize submissions with higher confidence in their provenance and reproducibility. For the same project and model, a submission with more complete run details and parameters may replace an older, incomplete record. Please avoid duplicate submissions when the differences are minor. If you observe a significant difference, open an issue with the comparison and relevant run details.

### Keep comparisons controlled

- Use the same shared prompt and starting inputs. Keep the harness, available tools, skills, resource limits, and other run conditions consistent where possible, so the model is the variable being compared.
- Record differences that cannot be held constant, including reasoning settings or provider restrictions. Explain which conditions changed rather than attributing every difference in the output to the model.
- Record follow-up instructions, retries, manual edits, and help from other models. If you select one result from multiple attempts, state how many attempts were made and how the result was selected.
- Preserve the independence required by the model implementation rules. Improvements to an existing result should identify the original run and the subsequent assistance.

Different setups are welcome when their differences are disclosed. They should not be described as a controlled model-only comparison.

### Make results verifiable

- Provide the actual source and enough setup and run instructions for another person to run the submitted result, including required dependencies and environment details.
- Record the exact model ID, provider, harness, and assistance used. Use `none` when absent and `unknown` when information is unavailable; do not guess.
- Include the prompt revision and relevant settings needed to repeat the procedure. Model generation may vary between runs; reproducibility means a traceable procedure and runnable result, not a promise of identical generated output.
- Report checks you actually performed, their results, and known failures or limitations. Label expectations and untested claims clearly.
- Screenshots and measurements must come from the submitted implementation. For measurements, include the method and conditions; retain failures that affect the interpretation rather than presenting only favorable evidence.

## Report a problem

For bugs or disputed results, include the affected project or model, the revision if known, steps to reproduce, expected and actual behavior, and relevant environment details. Logs, screenshots, and a minimal example help others verify the issue. If you have not reproduced the problem, say so; questions and suspected issues are welcome too.

## Submit a pull request

Describe what changed, why, and how you checked it. Keep the scope focused, update affected documentation, and include any limitations reviewers need to reproduce or assess the result. Use Conventional Commits for commit messages and PR titles.

For website changes, follow the [website development and checks guide](site/README.md). For model implementations, include the checks appropriate to the app and its run instructions. Documentation-only changes should be checked for accurate wording and working links.

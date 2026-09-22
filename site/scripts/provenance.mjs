import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const repository = "scarletkc/variora";
const empty = { firstCommittedAt: null, author: null, commit: null };
const loginPattern = /^[a-z\d](?:[a-z\d-]{0,38})$/i;

export function createProvenanceReader({ fetchImpl = fetch } = {}) {
  const authors = new Map();
  const repositories = new Map();
  async function git(cwd, ...args) {
    return (await exec("git", ["-C", cwd, ...args])).stdout.trim();
  }
  async function authorFor(commit, name, email) {
    const noreply = email.match(
      /^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i,
    );
    if (noreply && loginPattern.test(noreply[1])) {
      return { name, login: noreply[1] };
    }
    if (!authors.has(commit)) {
      authors.set(
        commit,
        (async () => {
          try {
            const token = process.env.GITHUB_TOKEN;
            const response = await fetchImpl(
              `https://api.github.com/repos/${repository}/commits/${commit}`,
              {
                headers: {
                  Accept: "application/vnd.github+json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                signal: AbortSignal.timeout(10000),
              },
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const login = (await response.json()).author?.login;
            return login && loginPattern.test(login) ? login : null;
          } catch (error) {
            console.warn(
              `GitHub author lookup failed for ${commit}: ${error.message}`,
            );
            return null;
          }
        })(),
      );
    }
    return { name, login: await authors.get(commit) };
  }
  return async function provenance(modelRoot) {
    let root;
    try {
      root = await git(modelRoot, "rev-parse", "--show-toplevel");
    } catch (error) {
      if (error.code === 128 || error.code === "ENOENT") return { ...empty };
      throw error;
    }
    if (!repositories.has(root)) {
      const shallow = await git(root, "rev-parse", "--is-shallow-repository");
      repositories.set(root, shallow === "false");
      if (shallow === "true") {
        console.warn(
          "Model provenance needs full Git history; run git fetch --unshallow.",
        );
      }
    }
    if (!repositories.get(root)) return { ...empty };
    const relative = path.relative(root, modelRoot).split(path.sep).join("/");
    const history = await git(
      root,
      "log",
      "--reverse",
      "--diff-filter=A",
      "--format=%H%x09%aI%x09%an%x09%ae",
      "--",
      `:(literal)${relative}`,
    );
    if (!history) return { ...empty };
    const [commit, firstCommittedAt, name, email] = history
      .split("\n")[0]
      .split("\t");
    return {
      firstCommittedAt,
      author: await authorFor(commit, name, email),
      commit,
    };
  };
}

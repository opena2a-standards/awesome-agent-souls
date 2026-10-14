# Soul Hardening

Soul files are written in markdown and read by AI agents, which makes them a target for prompt injection. A malicious soul file could instruct an agent to exfiltrate data, bypass safety checks, or execute arbitrary commands.

Use [HackMyAgent](https://github.com/opena2a-org/hackmyagent) to scan soul files for injection patterns. `hackmyagent secure` scans a directory and reads the soul from the file named `SOUL.md` in it, so run it in the project that holds your `SOUL.md`:

```bash
npx --yes hackmyagent@latest secure .
```

`hackmyagent@latest` runs the current release even when an older hackmyagent is installed, and `--yes` lets npx install it without asking.

To scan a soul from this repository, copy it into a directory of its own as `SOUL.md` and scan that directory:

```bash
mkdir -p /tmp/soul-scan
cp souls/by-use-case/personal-assistant.md /tmp/soul-scan/SOUL.md
npx --yes hackmyagent@latest secure /tmp/soul-scan
```

The injection checks that read `SOUL.md` detect:

- Instruction override attempts such as "ignore previous instructions", including ones hidden in a base64 payload (`CONFIG-002`, SOUL.md Injection Vectors)
- Override instructions placed in an HTML comment, which readers of the rendered markdown do not see (`LIFECYCLE-007`)

The command exits with status 1 when it finds a critical or high issue. The injection check matches patterns in the text, so ordinary wording can match one. `personal-assistant.md` has no HTML comment, and its one injection finding is a `CONFIG-002` match on `system:` in "Route to the correct system: tasks go to the task manager". Add `--json` to see the pattern a `CONFIG-002` finding matched, in its `message` field, and judge it in context. If the match is benign, reword the line so the pattern no longer appears, for example "Route to the correct system, so tasks go to the task manager", and scan again. `--ignore CONFIG-002` only hides the finding from the list; the summary and the verdict still count it, and the command still exits 1.

Run this scan as part of your PR review process for any changes to `SOUL.md`.

For a comprehensive treatment, see the [Soul Hardening guide](../guides/soul-hardening.md).

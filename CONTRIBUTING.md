# Contributing to Awesome Agent Souls

Thank you for your interest in contributing. This guide covers where a new soul file goes, what it must contain, how to check it before you open a pull request, and how pull requests are handled.

---

## Table of Contents

- [Submitting a New Soul](#submitting-a-new-soul)
- [Soul File Requirements](#soul-file-requirements)
- [Check Your File](#check-your-file)
- [Quality Guidelines](#quality-guidelines)
- [What NOT to Include](#what-not-to-include)
- [Review Process](#review-process)
- [Updating an Existing Soul](#updating-an-existing-soul)
- [Code of Conduct](#code-of-conduct)

---

## Submitting a New Soul

1. **Fork** this repository.
2. **Create a branch** with a descriptive name: `add/by-role/forensic-analyst` or `improve/by-industry/healthcare-agent`.
3. **Pick the dimension** your soul belongs to (see [The Five-Dimensional Taxonomy](README.md#the-five-dimensional-taxonomy)) and create the file at the location the [requirements table](#soul-file-requirements) gives for it. The quickest start is to copy the closest existing soul in that dimension, or a file from [`templates/`](templates/), and keep its section layout.
4. **Write the soul** following the requirements below.
5. **List it in the README.** Add a row to the table for its dimension in [README.md](README.md). If the section heading carries a count, such as "By Role (25 souls)", update the count there and in the Contents list.
6. **Run the checks** in [Check Your File](#check-your-file).
7. **Open a pull request** against `main` with a clear title (e.g., "Add forensic-analyst soul to by-role/security").

If your soul does not fit an existing dimension or By Role area, open an issue to discuss it before submitting your pull request.

---

## Soul File Requirements

Every soul file is markdown: YAML frontmatter between two `---` lines at the top, then `##` sections. The table gives, for each kind of file, where it lives, the frontmatter fields it must carry and the `##` sections it must contain. `scripts/check-souls.mjs` reads its rules from this table, so keep the table's format when you change it.

| Dimension | Location | Required frontmatter | Required sections |
|-----------|----------|----------------------|-------------------|
| By Role | `souls/by-role/<area>/<name>.md` | `name`, `role`, `description`, `tools`, `author` | `Identity`, `Core Mission`, `Communication Style`, `Workflow`, `Boundaries`, `Domain Knowledge`, `Tools and Preferences`, `Harm Avoidance` |
| By Industry | `souls/by-industry/<industry>/<name>-agent.md` | `name`, `role`, `description`, `tools`, `category: industry`, `author` | `Identity`, `Core Mission`, `Communication Style`, `Regulatory Knowledge`, `Domain Patterns`, `Security Requirements`, `Boundaries`, `Tools and Preferences`, `Harm Avoidance` |
| By Organization Type | `souls/by-org-type/<org-type>/<name>-agent.md` | `name`, `role`, `description`, `tools`, `category: org-type`, `author` | `Identity`, `Core Mission`, `Communication Style`, `Organizational Context`, `Decision Framework`, `Technical Priorities`, `Boundaries`, `Tools and Preferences`, `Harm Avoidance` |
| By Use Case | `souls/by-use-case/<name>.md` | `name`, `role`, `description`, `tools`, `category: use-case` | `Identity`, `Communication Style`, `Boundaries`, `Harm Avoidance` |
| By Fleet, team file | `souls/by-fleet/<fleet>/FLEET.md` | `name: <fleet>`, `description`, `team_size`, `coordination` | `Mission`, `Team Composition`, `Coordination Protocol`, `Shared Governance`, `Escalation Path` |
| By Fleet, member | `souls/by-fleet/<fleet>/<name>-agent.md` | `name`, `role`, `description`, `fleet: <fleet>`, `tools`, `author` | `Identity`, `Boundaries` or `Constraints`, `Harm Avoidance` |
| Starter example | `souls/examples/<name>.md` | `name`, `role`, `description`, `tools`, `category: example`, `author` | `Identity`, `Boundaries`, `Harm Avoidance` |
| Template | `templates/<name>.md` | `name`, `role`, `description`, `tools`, `category: template`, `author` | `Identity`, `Communication Style`, `Workflow`, `Boundaries`, `Domain Knowledge`, `Harm Avoidance` |

How to read the table:

- A word in angle brackets is one path segment you choose. For By Role, `<area>` is one of `security`, `development`, `devops`, `data-science`, `leadership` or `creative`.
- `category: industry` means the field must have exactly that value. `fleet: <fleet>` and `name: <fleet>` mean the value must equal the fleet's directory name.
- A section is present when the file has a `##` heading with that name, or a `##` heading that starts with the name followed by a space (for example `## Boundaries -- Things You Must Never Do`). Section order is not checked; existing souls put `Identity` first and `Harm Avoidance` last.
- `Boundaries` or `Constraints`: fleet members carry one of the two. The `incident-response-team`, `red-team-ops` and `soc-defense` fleets use `Core Responsibilities`, `Behavioral Rules` and `Constraints`; the other fleets use `Core Mission`, `Communication Style`, `Workflow`, `Boundaries` and `Handoff Protocol`. Follow the layout of the fleet you are adding to.
- `Harm Avoidance` covers judgment in gray areas, where an action is technically permitted but may cause unintended harm. See the README introduction for the specification it follows.

### Frontmatter fields

```yaml
---
name: forensic-analyst
role: Digital Forensics Analyst
description: Use when collecting and analyzing evidence with chain-of-custody awareness and documented forensic procedures.
tools: [Claude Code, Cursor, Copilot]
author: your-github-username
---
```

| Field | What it holds |
|-------|---------------|
| `name` | Identifier for the soul. Most souls use the file name without `.md` (for example `appsec-engineer`). |
| `role` | One-line role title |
| `description` | One or two sentences on what the soul does and when to use it |
| `tools` | Inline list of the AI coding tools you have used the soul with. Names in use: `Claude Code`, `Cursor`, `Copilot`, `Gemini CLI`, `OpenClaw`, `Windsurf`. |
| `author` | Your GitHub username |
| `category` | Dimension label, with the value the table gives |
| `fleet` | Fleet members only: the fleet's directory name |
| `team_size` | `FLEET.md` only: the number of agents in the fleet |
| `coordination` | `FLEET.md` only: `sequential`, `parallel`, `hub-spoke` or `mesh` (see [Coordination Patterns](README.md#coordination-patterns)) |

Soul files carry no version field. Git history records each change.

---

## Check Your File

Nothing runs automatically on pull requests: the repository has no CI workflow. Run these checks yourself before you open a pull request, and say in the pull request description that you ran them.

1. **Structure check.** Requires Node.js; there is nothing to install.

   ```bash
   node scripts/check-souls.mjs
   ```

   It checks every `.md` file under `souls/` and `templates/` against the [requirements table](#soul-file-requirements): the file sits at a listed location, carries the required frontmatter fields and sections, and, for files under `souls/`, is linked from README.md directly or through its fleet directory. It prints one line per problem and exits with a non-zero status if it finds any. If you change the script, also run `node --test scripts/check-souls.test.mjs`.

2. **Injection scan.** Scan your file for prompt-injection patterns as described in [Soul Hardening](README.md#soul-hardening).

---

## Quality Guidelines

A strong soul file is **specific, actionable, and distinct**. It should meaningfully change agent behavior compared to a generic assistant.

### Do

- **Be specific about personality.** "Prefers explicit error handling over silent failures and always suggests the most defensive option" is better than "writes good code."
- **Define clear boundaries.** "Never suggests disabling security features, even when asked to for debugging purposes" gives the agent a concrete rule.
- **Include actionable instructions.** "When reviewing code, always check for: hardcoded credentials, SQL injection, missing input validation, and insecure deserialization" tells the agent exactly what to do.
- **Differentiate from similar souls.** The `penetration-tester` soul should behave noticeably differently from the `appsec-engineer` soul.
- **Test your soul.** Before submitting, use your soul file with at least one tool listed in its `tools` field and verify it meaningfully shapes agent behavior.
- **Keep it focused.** A soul should cover one role well rather than trying to be everything.

### Do not

- Write vague platitudes ("always writes clean code," "follows best practices").
- Copy-paste from other souls without meaningful differentiation.
- Include tool-specific syntax that only works with one AI assistant.
- Write marketing copy. This is a configuration file, not a landing page.

---

## What NOT to Include

The following content is **prohibited** in soul files and will result in PR rejection:

| Prohibited Content | Reason |
|-------------------|--------|
| API keys, tokens, passwords, or credentials | Security risk. Credentials must never be committed to a public repository. |
| Personal data (real names, emails, addresses, phone numbers) | Privacy risk. Use GitHub usernames only. |
| Instructions to exfiltrate data, bypass safety measures, or execute harmful commands | Safety risk. Soul files shape AI behavior and must not be weaponized. |
| Prompt injection payloads (hidden instructions, encoded commands, instruction overrides) | Security risk. Scan your file before you submit it (see [Check Your File](#check-your-file)). |
| Copyrighted content from other projects without attribution | Legal risk. Attribute sources and respect licenses. |
| Content that targets, harasses, or discriminates against individuals or groups | Conduct violation. |

---

## Review Process

A maintainer reads each pull request and decides whether it is merged. No automated checks run on pull requests, so the checks in [Check Your File](#check-your-file) are yours to run.

### What the maintainer looks at

- **Quality** -- Does the soul meaningfully shape agent behavior? Is it specific and actionable?
- **Uniqueness** -- Does it offer something distinct from existing souls in the same dimension?
- **Safety** -- Does the soul respect reasonable boundaries? Does it instruct the agent to avoid harmful actions?
- **Completeness** -- Does it carry the frontmatter fields and sections the [requirements table](#soul-file-requirements) lists, and is it listed in the README?

### Feedback and iteration

- If changes are needed, the maintainer leaves specific feedback on the pull request.
- Address the feedback and push updates to your branch.
- A pull request with no response to feedback for 30 days may be closed. You can submit a new pull request later.

### Merge

Accepted pull requests are squash-merged into `main`, so each one lands as a single commit.

---

## Updating an Existing Soul

To update a soul you originally authored:

1. Open a pull request with your changes.
2. Describe what changed and why in the pull request description.
3. Run the checks in [Check Your File](#check-your-file).

To propose changes to a soul authored by someone else:

1. Open an issue first describing the proposed change and rationale.
2. If the maintainers agree, open a pull request with the changes.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

We expect all contributors to:

- Be respectful and constructive in discussions.
- Accept feedback on contributions gracefully.
- Focus on technical merit in reviews.
- Report unacceptable behavior to the maintainers.

Violations may result in contribution privileges being revoked.

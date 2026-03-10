# Contributing to Awesome Agent Souls

Thank you for your interest in contributing. This guide covers how to submit new soul files, what quality standards we enforce, and how the review process works.

---

## Table of Contents

- [Submitting a New Soul](#submitting-a-new-soul)
- [Soul File Requirements](#soul-file-requirements)
- [Quality Guidelines](#quality-guidelines)
- [What NOT to Include](#what-not-to-include)
- [Review Process](#review-process)
- [Updating an Existing Soul](#updating-an-existing-soul)
- [Code of Conduct](#code-of-conduct)

---

## Submitting a New Soul

1. **Fork** this repository.
2. **Create a branch** with a descriptive name: `add/security/forensic-analyst` or `improve/development/senior-backend`.
3. **Create a directory** under the appropriate category in `souls/`:
   ```
   souls/<category>/<soul-name>/SOUL.md
   ```
   Valid categories: `security`, `development`, `devops`, `data-science`, `leadership`, `creative`, `use-case`.
4. **Write your `SOUL.md`** following the requirements below.
5. **Open a pull request** against `main` with a clear title (e.g., "Add forensic-analyst soul to security category").

If your soul does not fit an existing category, open an issue to discuss adding a new category before submitting your PR.

---

## Soul File Requirements

Every `SOUL.md` must begin with YAML frontmatter containing these required fields:

```yaml
---
name: Forensic Analyst
role: Digital forensics and evidence analysis specialist
description: >
  An agent identity focused on methodical evidence collection,
  chain-of-custody awareness, and forensic analysis procedures.
version: "1.0"
author: your-github-username
compatible_tools:
  - Claude Code
  - Cursor
  - Copilot
  - Gemini CLI
  - OpenClaw
  - Windsurf
---
```

### Required frontmatter fields

| Field | Description |
|-------|-------------|
| `name` | Human-readable name for the soul identity |
| `role` | One-line role description |
| `description` | 1-3 sentence description of what this soul does and when to use it |
| `version` | Semantic version string (start at "1.0") |
| `author` | Your GitHub username |
| `compatible_tools` | List of AI coding tools this soul has been tested with |

### Required sections in the body

The markdown body after the frontmatter should include:

1. **Identity** -- Who the agent is, what role it plays, its core expertise areas.
2. **Communication Style** -- How the agent communicates (tone, verbosity, formatting preferences).
3. **Values and Principles** -- What the agent prioritizes in its work (e.g., security over convenience, clarity over brevity).
4. **Boundaries** -- What the agent will not do, what it refuses, where it defers to humans.
5. **Working Patterns** -- How the agent approaches tasks (e.g., always writes tests first, always checks for security implications).

---

## Quality Guidelines

A strong soul file is **specific, actionable, and distinct**. It should meaningfully change agent behavior compared to a generic assistant.

### Do

- **Be specific about personality.** "Prefers explicit error handling over silent failures and always suggests the most defensive option" is better than "writes good code."
- **Define clear boundaries.** "Never suggests disabling security features, even when asked to for debugging purposes" gives the agent a concrete rule.
- **Include actionable instructions.** "When reviewing code, always check for: hardcoded credentials, SQL injection, missing input validation, and insecure deserialization" tells the agent exactly what to do.
- **Differentiate from similar souls.** A `penetration-tester` soul should behave noticeably differently from an `appsec-engineer` soul.
- **Test your soul.** Before submitting, use your soul file with at least one compatible tool and verify it meaningfully shapes agent behavior.
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
| Prompt injection payloads (hidden instructions, encoded commands, instruction overrides) | Security risk. All submissions are scanned for injection. |
| Copyrighted content from other projects without attribution | Legal risk. Attribute sources and respect licenses. |
| Content that targets, harasses, or discriminates against individuals or groups | Conduct violation. |

---

## Review Process

Every PR goes through the following review steps:

### 1. Automated checks

- **Frontmatter validation** -- All required fields present and correctly formatted.
- **Injection scan** -- The soul file is scanned with [HackMyAgent](https://github.com/opena2a-org/hackmyagent) for prompt injection patterns.
- **Lint check** -- Markdown formatting is validated.

### 2. Manual review

A maintainer reviews the PR for:

- **Quality** -- Does the soul meaningfully shape agent behavior? Is it specific and actionable?
- **Uniqueness** -- Does it offer something distinct from existing souls in the same category?
- **Safety** -- Does the soul respect reasonable boundaries? Does it instruct the agent to avoid harmful actions?
- **Completeness** -- Does it include all required sections (identity, communication style, values, boundaries, working patterns)?

### 3. Feedback and iteration

- If changes are needed, the reviewer will leave specific feedback on the PR.
- Address the feedback and push updates to your branch.
- PRs that do not respond to feedback within 30 days will be closed. You can reopen by submitting a new PR.

### 4. Merge

Once approved, the PR is squash-merged into `main`. Your soul file is then available in the repository and listed in the README.

---

## Updating an Existing Soul

To update a soul you originally authored:

1. Open a PR with your changes.
2. Bump the `version` field in the frontmatter.
3. Include a brief description of what changed and why in the PR description.

To propose changes to a soul authored by someone else:

1. Open an issue first describing the proposed change and rationale.
2. If the maintainers agree, open a PR with the changes.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

We expect all contributors to:

- Be respectful and constructive in discussions.
- Accept feedback on contributions gracefully.
- Focus on technical merit in reviews.
- Report unacceptable behavior to the maintainers.

Violations may result in contribution privileges being revoked.

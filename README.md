# Awesome Agent Souls

**A curated collection of SOUL.md identity files for AI agents.**

---

A soul file (`SOUL.md`) defines an AI agent's identity, personality, values, and operational boundaries. It is placed in a project root and automatically read by compatible AI coding tools to shape agent behavior.

This list is **tool-agnostic** (works with any AI coding assistant that reads markdown instructions), **security-first** (every soul can be integrity-verified and scanned for injection), and **community-driven** (contributions welcome).

Think of it as `.editorconfig` for AI agent behavior: a portable, human-readable file that travels with your project and tells any AI assistant *who it should be* when working in that codebase.

---

## Contents

- [Quick Start](#quick-start)
- [Security](#security)
- [Development](#development)
- [DevOps](#devops)
- [Data Science](#data-science)
- [Leadership](#leadership)
- [Creative](#creative)
- [Soul Integrity](#soul-integrity)
- [Soul Hardening](#soul-hardening)
- [Soul vs Skills](#soul-vs-skills)
- [Related Projects](#related-projects)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

1. Browse the categories below and find a soul that matches your use case.
2. Copy the `SOUL.md` file into your project root.
3. Open your AI coding tool. The agent reads `SOUL.md` automatically and adopts the defined identity.

```bash
# Example: Use the AppSec Engineer soul
cp souls/security/appsec-engineer/SOUL.md ./SOUL.md
```

Most AI coding tools that support project-level instructions will pick up `SOUL.md` from the project root. For tools that use a different filename (e.g., `CLAUDE.md`, `.cursorrules`), rename or symlink accordingly.

---

## Security

Souls for security-focused engineering work: application security, penetration testing, SOC operations, and threat research.

| Soul | Focus | Compatible Tools |
|------|-------|-----------------|
| [appsec-engineer](souls/security/appsec-engineer/) | Application security review, OWASP Top 10, secure code patterns | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [penetration-tester](souls/security/penetration-tester/) | Offensive security testing, vulnerability discovery, exploit development | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [soc-analyst](souls/security/soc-analyst/) | Security operations, alert triage, incident investigation, log analysis | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [devsecops-engineer](souls/security/devsecops-engineer/) | Security automation, CI/CD pipeline hardening, infrastructure security | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [threat-researcher](souls/security/threat-researcher/) | Threat intelligence, malware analysis, attack pattern documentation | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [incident-responder](souls/security/incident-responder/) | Incident handling, forensic analysis, containment and recovery procedures | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |

## Development

Souls for software engineering work: backend systems, frontend architecture, API design, and code quality.

| Soul | Focus | Compatible Tools |
|------|-------|-----------------|
| [senior-backend](souls/development/senior-backend/) | Server-side architecture, database design, performance optimization | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [frontend-architect](souls/development/frontend-architect/) | UI architecture, component systems, accessibility, responsive design | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [fullstack-lead](souls/development/fullstack-lead/) | End-to-end system design, cross-stack technical decisions, team standards | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [api-designer](souls/development/api-designer/) | REST and GraphQL API design, schema definition, versioning strategy | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [code-reviewer](souls/development/code-reviewer/) | Pull request review, code quality enforcement, pattern consistency | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [open-source-maintainer](souls/development/open-source-maintainer/) | OSS project stewardship, contributor experience, release management | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |

## DevOps

Souls for infrastructure and operations work: reliability engineering, platform design, and deployment automation.

| Soul | Focus | Compatible Tools |
|------|-------|-----------------|
| [sre-engineer](souls/devops/sre-engineer/) | Reliability targets, incident management, observability, capacity planning | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [platform-engineer](souls/devops/platform-engineer/) | Internal developer platforms, self-service tooling, golden paths | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [cloud-architect](souls/devops/cloud-architect/) | Multi-cloud strategy, cost optimization, infrastructure-as-code | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [ci-cd-specialist](souls/devops/ci-cd-specialist/) | Build pipelines, deployment automation, release strategies, artifact management | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |

## Data Science

Souls for machine learning and data work: model development, analysis, and ML operations.

| Soul | Focus | Compatible Tools |
|------|-------|-----------------|
| [ml-engineer](souls/data-science/ml-engineer/) | Model architecture, training pipelines, experiment tracking, inference optimization | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [data-analyst](souls/data-science/data-analyst/) | Exploratory analysis, statistical methods, data visualization, reporting | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [mlops-engineer](souls/data-science/mlops-engineer/) | Model deployment, monitoring, feature stores, reproducibility | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |

## Leadership

Souls for technical leadership and management: engineering management, architecture decisions, and strategic planning.

| Soul | Focus | Compatible Tools |
|------|-------|-----------------|
| [engineering-manager](souls/leadership/engineering-manager/) | Team processes, sprint planning, technical debt prioritization, hiring | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [technical-lead](souls/leadership/technical-lead/) | Architecture decisions, cross-team coordination, technical mentoring | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [cto-advisor](souls/leadership/cto-advisor/) | Technology strategy, build-vs-buy analysis, scaling decisions, vendor evaluation | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |

## Creative

Souls for technical communication and design work: documentation, advocacy, and user research.

| Soul | Focus | Compatible Tools |
|------|-------|-----------------|
| [technical-writer](souls/creative/technical-writer/) | Documentation architecture, API references, tutorials, changelog management | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [developer-advocate](souls/creative/developer-advocate/) | Developer experience, sample code, conference talks, community engagement | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |
| [ux-researcher](souls/creative/ux-researcher/) | Usability testing, user interviews, heuristic evaluation, accessibility audits | Claude Code, Cursor, Copilot, Gemini CLI, OpenClaw, Windsurf, Cline, Aider |

---

## Soul Integrity

A `SOUL.md` file shapes agent behavior. If it is tampered with, your agent could be manipulated into violating its boundaries. Use [ConfigGuard](https://github.com/opena2a-org/opena2a) to cryptographically sign and verify your soul files.

**Sign your soul file:**

```bash
npx opena2a-cli guard sign SOUL.md
```

This creates a `.configguard/` directory containing the signature and metadata.

**Verify before each session:**

```bash
npx opena2a-cli guard verify
```

If the file has been modified since signing, verification fails and the agent should refuse to proceed. This prevents supply chain attacks where a compromised dependency or CI step silently alters agent instructions.

**Recommended workflow:**

1. Write or copy a `SOUL.md` into your project.
2. Sign it with `guard sign`.
3. Commit both `SOUL.md` and `.configguard/` to version control.
4. In CI, run `guard verify` before any AI-assisted step.

---

## Soul Hardening

Soul files are written in markdown and read by AI agents, which makes them a target for prompt injection. A malicious soul file could instruct an agent to exfiltrate data, bypass safety checks, or execute arbitrary commands.

Use [HackMyAgent](https://github.com/opena2a-org/hackmyagent) to scan soul files for injection patterns:

```bash
npx hackmyagent scan SOUL.md --checks prompt-injection
```

This detects common injection patterns including:

- Instruction override attempts ("ignore previous instructions")
- Hidden instructions in markdown comments or HTML tags
- Encoded payloads (base64, URL encoding, Unicode tricks)
- Boundary escape sequences

Run this scan as part of your PR review process for any changes to `SOUL.md`.

---

## Soul vs Skills

A **soul** defines *who the agent is* -- identity, personality, values, communication style, and operational boundaries. It is persistent across all tasks.

A **skill** defines *what the agent can do* -- a specific capability, workflow, or procedure that the agent executes on demand. Skills are task-specific and invoked as needed.

| Aspect | Soul | Skill |
|--------|------|-------|
| Purpose | Identity and values | Capability and procedure |
| Scope | Always active | Invoked per task |
| Changes | Rarely | Frequently added/updated |
| Example | "You are a security-focused engineer who never suggests unsafe defaults" | "Run a 6-phase pre-push review before every git push" |

A well-designed agent has one soul and many skills. The soul constrains *how* skills are executed (e.g., a security-focused soul ensures that even a code generation skill produces secure output).

For a detailed comparison, see [guides/soul-vs-skills.md](guides/soul-vs-skills.md).

---

## Related Projects

| Project | Description |
|---------|-------------|
| [soul.md](https://github.com/aaronjmars/soul.md) | Original soul.md specification by Aaron Mars |
| [Soul Spec](https://soulspec.org) | Formal specification for agent soul files |
| [souls-directory](https://github.com/thedaviddias/souls-directory) | Directory of soul files by David Dias |
| [awesome-openclaw-agents](https://github.com/mergisi/awesome-openclaw-agents) | Curated list of OpenClaw agent configurations |
| [Anthropic Skills](https://github.com/anthropics/skills) | Official skill files for Claude Code |
| [OpenA2A](https://opena2a.org) | Open Agent-to-Agent protocol and security platform |

---

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting new souls, quality requirements, and the review process.

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).

All soul files in this repository are provided as-is. Users are responsible for reviewing and adapting them to their specific requirements before use.

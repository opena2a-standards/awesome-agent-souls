# Awesome Agent Souls

[![Status: stable](https://img.shields.io/badge/status-stable-green)](./STATUS.md)

**A curated collection of SOUL.md identity files for AI agents, organized by role, industry, organization type, use case, and fleet.**

---

A soul file (`SOUL.md`) defines an AI agent's identity, personality, values, and operational boundaries. It is placed in a project root and automatically read by compatible AI coding tools to shape agent behavior.

This list is **tool-agnostic** (works with any AI coding assistant that reads markdown instructions), **security-first** (every soul can be integrity-verified and scanned for injection), and **community-driven** (contributions welcome).

Think of it as `.editorconfig` for AI agent behavior: a portable, human-readable file that travels with your project and tells any AI assistant *who it should be* when working in that codebase.

Every soul in this collection includes governance sections covering boundaries, domain knowledge, and **harm avoidance** (Domain 19 of the [Agent Behavioral Governance Specification](https://github.com/opena2a-org/agent-governance-spec), OASB-2): guidance for exercising judgment in gray areas where an action is technically permitted but may cause unintended harm.

**100+ souls** across five dimensions: 25 by-role, 10 by-industry, 7 by-org-type, 6 by-use-case, 15 by-fleet, plus 2 starter examples.

---

## Quick Start

Find a soul for your role, industry, organization type, use case or team in the catalog, [docs/catalog.md](docs/catalog.md), and copy it into your project root.

**Step 1: Grab a starter example for any project.**

```bash
# For a website project
cp souls/examples/website-project.md ./SOUL.md

# For an open-source repository
cp souls/examples/open-source-repo.md ./SOUL.md
```

**Step 2: Add role specialization.**

Append role-specific sections from any by-role soul to your `SOUL.md`:

```bash
# Add security expertise to your agent
cat souls/by-role/security/appsec-engineer.md >> ./SOUL.md
```

**Step 3: Add industry context.**

If your project operates in a regulated or specialized industry, layer in domain knowledge:

```bash
# Working in healthcare? Add HIPAA/FHIR expertise
cat souls/by-industry/healthcare/healthcare-agent.md >> ./SOUL.md
```

**Step 4: Deploy a full team.**

Copy a fleet directory for coordinated multi-agent operations:

```bash
# Deploy a red team operations fleet
cp -r souls/by-fleet/red-team-ops/ ./fleet/
```

**Step 5: Verify integrity.**

Sign your soul file to detect tampering:

```bash
npx --yes opena2a-cli@latest guard sign --files SOUL.md
npx --yes opena2a-cli@latest guard verify
```

`guard verify` exits 1 when a signed file has changed since it was signed. The record is a hash, not a keyed signature: anyone who can edit `SOUL.md` can also run `guard sign --files SOUL.md` again, so review changes to `.opena2a/guard/` as you review changes to `SOUL.md`. [Soul Integrity](docs/soul-integrity.md) gives the full workflow.

**Step 6: Scan for prompt injection.**

`hackmyagent secure` scans a directory and reads the soul from the file named `SOUL.md` in it, so run it in the project that holds your `SOUL.md`:

```bash
npx --yes hackmyagent@latest secure .
```

The command exits with status 1 when it finds a critical or high issue. [Soul Hardening](docs/soul-hardening.md) shows how to scan a soul from this repository and how to judge a pattern match.

Using OpenClaw, or a tool that reads its own instruction file? See [Where SOUL.md Lives](docs/where-soul-md-lives.md) for tool-specific placement and discovery details.

---

## Catalog

[docs/catalog.md](docs/catalog.md) lists every soul by role, industry, organization type, use case and fleet, with the starter examples and the templates. To write a new soul, start from a template:

```bash
# Start a soul for an agent that uses tools
cp templates/tool-using.md ./SOUL.md
```

Souls from different dimensions combine into one: [Combining Souls](docs/combining-souls.md) shows how. The [guides](guides/) walk through writing a first soul, hardening it, and sharing souls across a team.

---

## Documentation

- [Catalog](docs/catalog.md): every soul by dimension, the starter examples and the templates
- [Where SOUL.md Lives](docs/where-soul-md-lives.md): placement in a project, how AI tools discover it, fleets and monorepos
- [Taxonomy](docs/taxonomy.md): the five dimensions, and how a soul differs from a skill
- [Combining Souls](docs/combining-souls.md): layering souls from several dimensions into one identity
- [Soul Integrity](docs/soul-integrity.md): signing soul files and verifying them before each session
- [Soul Hardening](docs/soul-hardening.md): scanning soul files for prompt injection
- Guides for working with agent souls beyond copy-and-paste:
  - [Creating Your First Soul](guides/creating-your-first-soul.md): Step-by-step walkthrough from blank file to signed, production-ready soul
  - [Soul vs Skills](guides/soul-vs-skills.md): When to use a soul (identity) vs a skill (capability) and how they interact
  - [Soul Hardening](guides/soul-hardening.md): Defending soul files against prompt injection, tampering, and supply chain attacks
  - [Soul for Teams](guides/soul-for-teams.md): Standardizing agent behavior across a team with shared souls and per-developer overrides
- [CONTRIBUTING.md](CONTRIBUTING.md): guidelines on submitting new souls, quality requirements, the review process, and the areas where contributions are particularly valuable
- Related projects:
  - [soul.md](https://github.com/aaronjmars/soul.md): Original soul.md specification by Aaron Mars
  - [Soul Spec](https://soulspec.org): Formal specification for agent soul files
  - [souls-directory](https://github.com/thedaviddias/souls-directory): Directory of soul files by David Dias
  - [awesome-openclaw-agents](https://github.com/mergisi/awesome-openclaw-agents): Curated list of OpenClaw agent configurations
  - [Anthropic Skills](https://github.com/anthropics/skills): Official skill files for Claude Code
  - [OpenA2A](https://opena2a.org): Open Agent-to-Agent protocol and security platform

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).

All soul files in this repository are provided as-is. Users are responsible for reviewing and adapting them to their specific requirements before use.

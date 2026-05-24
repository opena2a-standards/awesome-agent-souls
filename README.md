# Awesome Agent Souls

[![Status: stable](https://img.shields.io/badge/status-stable-green)](./STATUS.md)

**A curated collection of SOUL.md identity files for AI agents -- organized by role, industry, organization type, use case, and fleet.**

---

A soul file (`SOUL.md`) defines an AI agent's identity, personality, values, and operational boundaries. It is placed in a project root and automatically read by compatible AI coding tools to shape agent behavior.

This list is **tool-agnostic** (works with any AI coding assistant that reads markdown instructions), **security-first** (every soul can be integrity-verified and scanned for injection), and **community-driven** (contributions welcome).

Think of it as `.editorconfig` for AI agent behavior: a portable, human-readable file that travels with your project and tells any AI assistant *who it should be* when working in that codebase.

Every soul in this collection includes governance sections covering boundaries, domain knowledge, and **harm avoidance** (ABGS Domain 15) -- guidance for exercising judgment in gray areas where an action is technically permitted but may cause unintended harm.

**100+ souls** across five dimensions: 25 by-role, 10 by-industry, 7 by-org-type, 6 by-use-case, 15 by-fleet, plus 2 starter examples.

---

## Where SOUL.md Lives

Place `SOUL.md` in your **project root** -- the same directory as `package.json`, `go.mod`, `Cargo.toml`, or whatever marks the top of your repository. This is the same convention used by `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and other AI instruction files.

```
my-project/
  SOUL.md              <-- agent identity (who it is)
  CLAUDE.md            <-- tool-specific instructions (optional)
  AGENTS.md            <-- tool-specific instructions (optional)
  package.json
  src/
  ...
```

### How AI Tools Discover It

AI coding tools read project-level instruction files from the repository root at the start of each session. The soul file works the same way -- it is loaded into the agent's context before it starts working.

| Tool | Native File | How to Use SOUL.md |
|------|------------|-------------------|
| Claude Code | `CLAUDE.md` | Rename to `CLAUDE.md`, or add `See SOUL.md for agent identity` in your CLAUDE.md |
| Cursor | `.cursorrules` | Rename to `.cursorrules`, or reference SOUL.md from `.cursorrules` |
| Windsurf | `.windsurfrules` | Rename to `.windsurfrules`, or reference SOUL.md |
| GitHub Copilot | `.github/copilot-instructions.md` | Copy to `.github/copilot-instructions.md` |
| OpenClaw | `SOUL.md` | Natively reads `SOUL.md` from `~/.openclaw/workspaces/<name>/SOUL.md` -- copy directly |
| Aider | `.aider.conf.yml` | Reference via `read:` directive |
| Any tool | Varies | Most tools that read markdown from project root will pick up `SOUL.md` directly |

**Recommended approach**: Keep `SOUL.md` as the canonical source, then reference it from tool-specific files. This avoids maintaining multiple copies.

```markdown
# CLAUDE.md
See SOUL.md in this repository for the agent's identity, values, and boundaries.
Follow all instructions in SOUL.md.
```

### For Fleets

When deploying multiple agents, place soul files in a `souls/` or `fleet/` directory:

```
my-project/
  SOUL.md              <-- primary agent identity
  fleet/
    FLEET.md           <-- coordination protocol
    recon-agent.md     <-- specialist agent 1
    exploit-agent.md   <-- specialist agent 2
    report-agent.md    <-- specialist agent 3
```

Each agent in the fleet gets its own soul file. The `FLEET.md` defines how they coordinate -- handoff rules, shared artifacts, escalation paths, and which coordination pattern to use (sequential, parallel, hub-spoke, or mesh).

### For Monorepos

Place a root-level `SOUL.md` for shared identity, and per-package souls for specialization:

```
monorepo/
  SOUL.md              <-- shared values and boundaries
  packages/
    api/
      SOUL.md          <-- backend-specific identity
    web/
      SOUL.md          <-- frontend-specific identity
    shared/
      SOUL.md          <-- library-specific identity
```

---

## Contents

- [Where SOUL.md Lives](#where-soulmd-lives)
- [Quick Start](#quick-start)
- [The Five-Dimensional Taxonomy](#the-five-dimensional-taxonomy)
- [Combining Souls](#combining-souls)
- [By Role (25 souls)](#by-role-25-souls)
  - [Security](#security)
  - [Development](#development)
  - [DevOps](#devops)
  - [Data Science](#data-science)
  - [Leadership](#leadership)
  - [Creative](#creative)
- [By Industry (10 souls)](#by-industry-10-souls)
- [By Organization Type (7 souls)](#by-organization-type-7-souls)
- [By Use Case (6 souls)](#by-use-case-6-souls)
- [By Fleet (15 teams)](#by-fleet-15-teams)
- [Starter Examples (2 templates)](#starter-examples-2-templates)
- [Guides](#guides)
- [Soul Integrity](#soul-integrity)
- [Soul Hardening](#soul-hardening)
- [Soul vs Skills](#soul-vs-skills)
- [Related Projects](#related-projects)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

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
npx opena2a-cli guard sign SOUL.md
npx opena2a-cli guard verify
```

**Using OpenClaw?** Copy a soul directly into your agent workspace:

```bash
# Copy a personal assistant soul into your OpenClaw agent
cp souls/by-use-case/personal-assistant.md ~/.openclaw/workspaces/default/SOUL.md

# Or a customer support agent
cp souls/by-use-case/customer-support.md ~/.openclaw/workspaces/support-bot/SOUL.md
```

See [Where SOUL.md Lives](#where-soulmd-lives) above for tool-specific placement and discovery details.

---

## The Five-Dimensional Taxonomy

Agent souls in this collection are organized along five independent dimensions:

| Dimension | Question it answers | Count | Example |
|-----------|-------------------|-------|---------|
| **By Role** | What do you do? | 25 | Penetration tester, ML engineer, SRE |
| **By Industry** | Where do you work? | 10 | Healthcare (HIPAA), Fintech (PCI-DSS), Defense (ITAR) |
| **By Org Type** | How does your organization operate? | 7 | Startup (speed), Enterprise (compliance), Government (FedRAMP) |
| **By Use Case** | What task do you handle? | 6 | Personal assistant, inbox triage, content creation |
| **By Fleet** | What team do you need? | 15 | Red Team Ops, Dev Squad, HR Operations |

Each dimension is independent. A soul from one dimension can be combined with souls from any other dimension to create a highly specific agent identity tailored to your exact context. Fleets add a coordination layer -- instead of a single agent, you deploy a team of agents that work together with defined handoff rules and shared governance.

---

## Combining Souls

The real power of this taxonomy is composition. Instead of a generic "security engineer" soul, you can build a precise identity by layering dimensions.

**Example: A fintech startup pentester**

```bash
# Start with the role
cp souls/by-role/security/penetration-tester.md ./SOUL.md

# Append industry constraints (PCI-DSS, SOX, PSD2)
echo "" >> ./SOUL.md
cat souls/by-industry/fintech/fintech-agent.md >> ./SOUL.md

# Append org-type constraints (speed, runway, lean processes)
echo "" >> ./SOUL.md
cat souls/by-org-type/startup/startup-agent.md >> ./SOUL.md
```

**Example: A healthcare enterprise backend engineer**

```bash
cp souls/by-role/development/senior-backend.md ./SOUL.md
echo "" >> ./SOUL.md
cat souls/by-industry/healthcare/healthcare-agent.md >> ./SOUL.md
echo "" >> ./SOUL.md
cat souls/by-org-type/enterprise/enterprise-agent.md >> ./SOUL.md
```

**Example: A government SRE**

```bash
cp souls/by-role/devops/sre-engineer.md ./SOUL.md
echo "" >> ./SOUL.md
cat souls/by-org-type/government/government-agent.md >> ./SOUL.md
```

**Example: A fintech red team**

Fleets can be combined with industry context to create domain-aware coordinated teams:

```bash
# Start with the Red Team Ops fleet
cp -r souls/by-fleet/red-team-ops/ ./fleet/

# Layer fintech context into each agent's soul
for soul in ./fleet/*-SOUL.md; do
  echo "" >> "$soul"
  cat souls/by-industry/fintech/fintech-agent.md >> "$soul"
done
```

This produces a coordinated offensive security team where each agent (recon, exploit, pivot, report) understands PCI-DSS, SOX, and financial system attack surfaces.

After combining, review the merged files to resolve any conflicting instructions and sign them with `guard sign`.

---

## By Role (25 souls)

Role-based souls define *what the agent does* -- its technical expertise, communication style, and professional focus. These are the foundation of any agent identity.

### Security

Souls for security-focused engineering work: application security, penetration testing, SOC operations, and threat research.

| Soul | Focus |
|------|-------|
| [appsec-engineer](souls/by-role/security/appsec-engineer.md) | Application security review, OWASP Top 10, secure code patterns |
| [penetration-tester](souls/by-role/security/penetration-tester.md) | Offensive security testing, vulnerability discovery, exploit development |
| [soc-analyst](souls/by-role/security/soc-analyst.md) | Security operations, alert triage, incident investigation, log analysis |
| [devsecops-engineer](souls/by-role/security/devsecops-engineer.md) | Security automation, CI/CD pipeline hardening, infrastructure security |
| [threat-researcher](souls/by-role/security/threat-researcher.md) | Threat intelligence, malware analysis, attack pattern documentation |
| [incident-responder](souls/by-role/security/incident-responder.md) | Incident handling, forensic analysis, containment and recovery procedures |

### Development

Souls for software engineering work: backend systems, frontend architecture, API design, and code quality.

| Soul | Focus |
|------|-------|
| [senior-backend](souls/by-role/development/senior-backend.md) | Server-side architecture, database design, performance optimization |
| [frontend-architect](souls/by-role/development/frontend-architect.md) | UI architecture, component systems, accessibility, responsive design |
| [fullstack-lead](souls/by-role/development/fullstack-lead.md) | End-to-end system design, cross-stack technical decisions, team standards |
| [api-designer](souls/by-role/development/api-designer.md) | REST and GraphQL API design, schema definition, versioning strategy |
| [code-reviewer](souls/by-role/development/code-reviewer.md) | Pull request review, code quality enforcement, pattern consistency |
| [open-source-maintainer](souls/by-role/development/open-source-maintainer.md) | OSS project stewardship, contributor experience, release management |

### DevOps

Souls for infrastructure and operations work: reliability engineering, platform design, and deployment automation.

| Soul | Focus |
|------|-------|
| [sre-engineer](souls/by-role/devops/sre-engineer.md) | Reliability targets, incident management, observability, capacity planning |
| [platform-engineer](souls/by-role/devops/platform-engineer.md) | Internal developer platforms, self-service tooling, golden paths |
| [cloud-architect](souls/by-role/devops/cloud-architect.md) | Multi-cloud strategy, cost optimization, infrastructure-as-code |
| [ci-cd-specialist](souls/by-role/devops/ci-cd-specialist.md) | Build pipelines, deployment automation, release strategies, artifact management |

### Data Science

Souls for machine learning and data work: model development, analysis, and ML operations.

| Soul | Focus |
|------|-------|
| [ml-engineer](souls/by-role/data-science/ml-engineer.md) | Model architecture, training pipelines, experiment tracking, inference optimization |
| [data-analyst](souls/by-role/data-science/data-analyst.md) | Exploratory analysis, statistical methods, data visualization, reporting |
| [mlops-engineer](souls/by-role/data-science/mlops-engineer.md) | Model deployment, monitoring, feature stores, reproducibility |

### Leadership

Souls for technical leadership and management: engineering management, architecture decisions, and strategic planning.

| Soul | Focus |
|------|-------|
| [engineering-manager](souls/by-role/leadership/engineering-manager.md) | Team processes, sprint planning, technical debt prioritization, hiring |
| [technical-lead](souls/by-role/leadership/technical-lead.md) | Architecture decisions, cross-team coordination, technical mentoring |
| [cto-advisor](souls/by-role/leadership/cto-advisor.md) | Technology strategy, build-vs-buy analysis, scaling decisions, vendor evaluation |

### Creative

Souls for technical communication and design work: documentation, advocacy, and user research.

| Soul | Focus |
|------|-------|
| [technical-writer](souls/by-role/creative/technical-writer.md) | Documentation architecture, API references, tutorials, changelog management |
| [developer-advocate](souls/by-role/creative/developer-advocate.md) | Developer experience, sample code, conference talks, community engagement |
| [ux-researcher](souls/by-role/creative/ux-researcher.md) | Usability testing, user interviews, heuristic evaluation, accessibility audits |

---

## By Industry (10 souls)

Industry souls define *where the agent works* -- the regulatory environment, domain-specific standards, data sensitivity requirements, and industry terminology it must understand. These souls do not replace a role; they augment one.

| Soul | Focus | Key Standards and Regulations |
|------|-------|-------------------------------|
| [healthcare](souls/by-industry/healthcare/healthcare-agent.md) | Clinical systems, patient data, EHR integrations | HIPAA, HL7 FHIR, FDA 21 CFR Part 11, IEC 62304 |
| [fintech](souls/by-industry/fintech/fintech-agent.md) | Payment systems, trading platforms, banking APIs | PCI-DSS, SOX, PSD2, KYC/AML, GLBA |
| [legal](souls/by-industry/legal/legal-tech-agent.md) | Case management, contract analysis, e-discovery | ABA Model Rules, attorney-client privilege, FRCP |
| [education](souls/by-industry/education/edtech-agent.md) | Learning platforms, student data, assessment systems | FERPA, COPPA, WCAG 2.1 AA, SCORM/xAPI |
| [defense](souls/by-industry/defense/defense-agent.md) | Mission systems, classified environments, logistics | ITAR, NIST 800-171, CMMC, STIGs, IL4/IL5 |
| [retail](souls/by-industry/retail/retail-agent.md) | E-commerce, inventory systems, customer data | PCI-DSS, CCPA/GDPR, ADA compliance |
| [media](souls/by-industry/media/media-agent.md) | Content platforms, streaming, digital rights | DMCA, GDPR consent, content moderation frameworks |
| [energy](souls/by-industry/energy/energy-agent.md) | Grid systems, SCADA/ICS, energy trading | NERC CIP, IEC 62351, FERC regulations |
| [real-estate](souls/by-industry/real-estate/proptech-agent.md) | Property platforms, MLS integrations, tenant portals | Fair Housing Act, RESPA, state licensing regulations |
| [manufacturing](souls/by-industry/manufacturing/manufacturing-agent.md) | MES/ERP systems, IoT/OT, supply chain | ISO 9001, IEC 62443, OSHA reporting requirements |

---

## By Organization Type (7 souls)

Organization-type souls define *how the organization operates* -- its decision-making velocity, compliance posture, budget constraints, and cultural norms. These constrain how role and industry souls are applied in practice.

| Soul | Focus | Key Constraints |
|------|-------|-----------------|
| [nonprofit](souls/by-org-type/nonprofit/nonprofit-agent.md) | Grant-funded development, donor systems, impact reporting | Limited budgets, volunteer contributors, grant compliance |
| [startup](souls/by-org-type/startup/startup-agent.md) | Rapid iteration, product-market fit, lean architecture | Speed over process, small teams, runway pressure |
| [enterprise](souls/by-org-type/enterprise/enterprise-agent.md) | Large-scale systems, cross-team coordination, governance | Change management, compliance gates, vendor procurement |
| [government](souls/by-org-type/government/government-agent.md) | Public sector systems, citizen services, interagency data | FedRAMP, Section 508, ATO process, FISMA |
| [agency](souls/by-org-type/agency/agency-agent.md) | Client projects, multi-tenant delivery, rapid onboarding | Multiple codebases, client constraints, deadline-driven |
| [open-source-foundation](souls/by-org-type/open-source-foundation/oss-foundation-agent.md) | Community governance, contributor experience, release management | Public scrutiny, backward compatibility, consensus-driven |
| [research-lab](souls/by-org-type/research-lab/research-lab-agent.md) | Experimental code, reproducibility, publication support | Reproducibility requirements, data sharing mandates, citation standards |

---

## By Use Case (6 souls)

Use-case souls define *what task the agent handles* -- common workflows that span across roles and industries. These are designed for any autonomous agent runtime that uses SOUL.md for identity -- including [OpenClaw](https://github.com/openclaw/openclaw), custom agent frameworks, messaging-platform bots, and scheduled automation agents.

| Soul | Focus | Popular Platforms |
|------|-------|-------------------|
| [personal-assistant](souls/by-use-case/personal-assistant.md) | Daily digest, calendar, reminders, note management across Obsidian/Notion/Apple Notes | WhatsApp, Telegram, Slack |
| [inbox-manager](souls/by-use-case/inbox-manager.md) | Email and message triage, priority filtering, draft responses | Gmail, Slack, Discord |
| [content-creator](souls/by-use-case/content-creator.md) | Social media writing, blog posts, SEO optimization, brand voice | LinkedIn, X/Twitter, Reddit |
| [customer-support](souls/by-use-case/customer-support.md) | Ticket handling, SLA management, escalation workflows | Intercom, Zendesk, Slack |
| [meeting-assistant](souls/by-use-case/meeting-assistant.md) | Meeting summaries, action item extraction, follow-up tracking | Google Meet, Zoom, Teams |
| [devops-chatops](souls/by-use-case/devops-chatops.md) | Server monitoring, diagnostics, and operational commands via chat | Telegram, Slack, Discord |

These souls can be combined with other dimensions. For example, a fintech customer support agent:

```bash
cp souls/by-use-case/customer-support.md ./SOUL.md
echo "" >> ./SOUL.md
cat souls/by-industry/fintech/fintech-agent.md >> ./SOUL.md
```

---

## By Fleet (15 teams)

Fleet souls define *coordinated teams* of AI agents that work together. Each fleet contains individual agent soul files plus a shared `FLEET.md` that defines the coordination protocol, handoff rules, and shared governance. Unlike individual souls, fleets model how agents collaborate -- who hands off to whom, what artifacts are shared, and how decisions are escalated.

| Fleet | Team Size | Coordination | Focus |
|-------|-----------|-------------|-------|
| [Red Team Ops](souls/by-fleet/red-team-ops/) | 4 | Sequential | Offensive security operations: recon, exploit, pivot, report |
| [SOC Defense](souls/by-fleet/soc-defense/) | 4 | Hub-spoke | Continuous security monitoring, threat hunting, incident triage |
| [Incident Response](souls/by-fleet/incident-response-team/) | 5 | Hub-spoke | Active incident management: contain, analyze, recover, communicate |
| [Dev Squad](souls/by-fleet/dev-squad/) | 5 | Mesh | Full-stack development: architect, backend, frontend, QA, DevOps |
| [HR Operations](souls/by-fleet/hr-operations/) | 4 | Parallel | Employee lifecycle: recruit, onboard, manage, offboard |
| [Sales Pipeline](souls/by-fleet/sales-pipeline/) | 4 | Sequential | B2B sales: qualify, discover, propose, close |
| [Customer Success](souls/by-fleet/customer-success/) | 3 | Hub-spoke | Post-sale: CSM, support, enablement |
| [Legal Ops](souls/by-fleet/legal-ops/) | 4 | Sequential | Contracts, compliance, IP, e-discovery |
| [Content Factory](souls/by-fleet/content-factory/) | 4 | Sequential | Content pipeline: research, write, edit, publish |
| [Data Analytics](souls/by-fleet/data-analytics/) | 4 | Hub-spoke | Data team: ingest, analyze, model, report |
| [Compliance Audit](souls/by-fleet/compliance-audit/) | 4 | Sequential | Regulatory audit: scope, assess, remediate, report |
| [DevRel Team](souls/by-fleet/devrel-team/) | 4 | Parallel | Developer relations: community, content, events, feedback |
| [Executive Advisory](souls/by-fleet/executive-advisory/) | 4 | Parallel | Strategic advisory: strategy, finance, product, operations |
| [Research Lab Team](souls/by-fleet/research-lab-team/) | 4 | Parallel | Academic research: literature, experiment, write, review |
| [M&A Due Diligence](souls/by-fleet/m-and-a-due-diligence/) | 4 | Parallel | Technical due diligence: code, security, infra, integration |

### Coordination Patterns

Fleets use one of four coordination patterns defined in their `FLEET.md`:

- **Sequential** -- Agents work in a pipeline. The output of one agent feeds directly into the next. Used when work has a natural linear progression (e.g., recon before exploit before report).
- **Parallel** -- Agents work independently on different aspects of the same problem. Results are synthesized at the end. Used when tasks are independent and speed matters.
- **Hub-spoke** -- One coordinating agent routes work to specialists and aggregates results. Used when a central decision-maker needs to triage and delegate.
- **Mesh** -- All agents communicate directly with each other, typically through shared artifacts like pull requests or documents. Used when collaboration is fluid and any agent may need input from any other.

---

## Starter Examples (2 templates)

Ready-to-use soul files for common project types. Copy one into your project root and customize from there.

| Template | Use Case | What It Includes |
|----------|----------|------------------|
| [website-project](souls/examples/website-project.md) | Web applications, marketing sites, SaaS products | Frontend standards, accessibility, performance budgets, SEO |
| [open-source-repo](souls/examples/open-source-repo.md) | Open-source libraries, CLIs, frameworks | Contributor experience, semantic versioning, documentation quality |

```bash
# Start a new website project with a soul
cp souls/examples/website-project.md ./SOUL.md
npx opena2a-cli guard sign SOUL.md
```

---

## Guides

In-depth guides for working with agent souls beyond copy-and-paste.

| Guide | Description |
|-------|-------------|
| [Creating Your First Soul](guides/creating-your-first-soul.md) | Step-by-step walkthrough from blank file to signed, production-ready soul |
| [Soul vs Skills](guides/soul-vs-skills.md) | When to use a soul (identity) vs a skill (capability) and how they interact |
| [Soul Hardening](guides/soul-hardening.md) | Defending soul files against prompt injection, tampering, and supply chain attacks |
| [Soul for Teams](guides/soul-for-teams.md) | Standardizing agent behavior across a team with shared souls and per-developer overrides |

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

For a comprehensive treatment, see the [Soul Hardening guide](guides/soul-hardening.md).

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

For a detailed comparison, see [Soul vs Skills guide](guides/soul-vs-skills.md).

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

We welcome contributions across all five dimensions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting new souls, quality requirements, and the review process.

Areas where contributions are particularly valuable:

- **By Industry:** Souls for industries not yet covered (insurance, agriculture, transportation, telecom)
- **By Org Type:** Souls for organization types not yet covered (franchise, cooperative, academic department)
- **By Role:** Souls for specialized roles (database administrator, QA engineer, technical product manager)
- **By Use Case:** Souls for common agent workflows (voice journaling, brand monitoring, lead qualification, report generator)
- **By Fleet:** Teams for workflows not yet covered (marketing operations, product launch, security compliance)
- **Starter Examples:** Templates for common project types (mobile app, CLI tool, microservice, data pipeline)

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).

All soul files in this repository are provided as-is. Users are responsible for reviewing and adapting them to their specific requirements before use.

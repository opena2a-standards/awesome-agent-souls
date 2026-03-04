# Awesome Agent Souls

**A curated collection of SOUL.md identity files for AI agents -- organized by role, industry, and organization type.**

---

A soul file (`SOUL.md`) defines an AI agent's identity, personality, values, and operational boundaries. It is placed in a project root and automatically read by compatible AI coding tools to shape agent behavior.

This list is **tool-agnostic** (works with any AI coding assistant that reads markdown instructions), **security-first** (every soul can be integrity-verified and scanned for injection), and **community-driven** (contributions welcome).

Think of it as `.editorconfig` for AI agent behavior: a portable, human-readable file that travels with your project and tells any AI assistant *who it should be* when working in that codebase.

**44 souls** across three dimensions: 25 by-role, 10 by-industry, 7 by-org-type, plus 2 starter examples.

---

## Contents

- [Quick Start](#quick-start)
- [The Three-Dimensional Taxonomy](#the-three-dimensional-taxonomy)
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

**Step 4: Verify integrity.**

Sign your soul file to detect tampering:

```bash
npx opena2a-cli guard sign SOUL.md
npx opena2a-cli guard verify
```

Most AI coding tools that support project-level instructions will pick up `SOUL.md` from the project root. For tools that use a different filename (e.g., `CLAUDE.md`, `.cursorrules`), rename or symlink accordingly.

---

## The Three-Dimensional Taxonomy

Agent souls in this collection are organized along three independent dimensions:

| Dimension | Question it answers | Count | Example |
|-----------|-------------------|-------|---------|
| **By Role** | What do you do? | 25 | Penetration tester, ML engineer, SRE |
| **By Industry** | Where do you work? | 10 | Healthcare (HIPAA), Fintech (PCI-DSS), Defense (ITAR) |
| **By Org Type** | How does your organization operate? | 7 | Startup (speed), Enterprise (compliance), Government (FedRAMP) |

Each dimension is independent. A soul from one dimension can be combined with souls from any other dimension to create a highly specific agent identity tailored to your exact context.

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

After combining, review the merged file to resolve any conflicting instructions and sign it with `guard sign`.

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

We welcome contributions across all three dimensions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting new souls, quality requirements, and the review process.

Areas where contributions are particularly valuable:

- **By Industry:** Souls for industries not yet covered (insurance, agriculture, transportation, telecom)
- **By Org Type:** Souls for organization types not yet covered (franchise, cooperative, academic department)
- **By Role:** Souls for specialized roles (database administrator, QA engineer, technical product manager)
- **Starter Examples:** Templates for common project types (mobile app, CLI tool, microservice, data pipeline)

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).

All soul files in this repository are provided as-is. Users are responsible for reviewing and adapting them to their specific requirements before use.

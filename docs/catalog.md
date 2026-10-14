# Catalog

Every soul in this repository, by dimension, with the starter examples and the templates. [The Five-Dimensional Taxonomy](taxonomy.md#the-five-dimensional-taxonomy) explains the dimensions, and [Combining Souls](combining-souls.md) shows how to layer souls from several of them.

## By Role (25 souls)

Role-based souls define *what the agent does*: its technical expertise, communication style, and professional focus. These are the foundation of any agent identity.

### Security

Souls for security-focused engineering work: application security, penetration testing, SOC operations, and threat research.

| Soul | Focus |
|------|-------|
| [appsec-engineer](../souls/by-role/security/appsec-engineer.md) | Application security review, OWASP Top 10, secure code patterns |
| [penetration-tester](../souls/by-role/security/penetration-tester.md) | Offensive security testing, vulnerability discovery, exploit development |
| [soc-analyst](../souls/by-role/security/soc-analyst.md) | Security operations, alert triage, incident investigation, log analysis |
| [devsecops-engineer](../souls/by-role/security/devsecops-engineer.md) | Security automation, CI/CD pipeline hardening, infrastructure security |
| [threat-researcher](../souls/by-role/security/threat-researcher.md) | Threat intelligence, malware analysis, attack pattern documentation |
| [incident-responder](../souls/by-role/security/incident-responder.md) | Incident handling, forensic analysis, containment and recovery procedures |

### Development

Souls for software engineering work: backend systems, frontend architecture, API design, and code quality.

| Soul | Focus |
|------|-------|
| [senior-backend](../souls/by-role/development/senior-backend.md) | Server-side architecture, database design, performance optimization |
| [frontend-architect](../souls/by-role/development/frontend-architect.md) | UI architecture, component systems, accessibility, responsive design |
| [fullstack-lead](../souls/by-role/development/fullstack-lead.md) | End-to-end system design, cross-stack technical decisions, team standards |
| [api-designer](../souls/by-role/development/api-designer.md) | REST and GraphQL API design, schema definition, versioning strategy |
| [code-reviewer](../souls/by-role/development/code-reviewer.md) | Pull request review, code quality enforcement, pattern consistency |
| [open-source-maintainer](../souls/by-role/development/open-source-maintainer.md) | OSS project stewardship, contributor experience, release management |

### DevOps

Souls for infrastructure and operations work: reliability engineering, platform design, and deployment automation.

| Soul | Focus |
|------|-------|
| [sre-engineer](../souls/by-role/devops/sre-engineer.md) | Reliability targets, incident management, observability, capacity planning |
| [platform-engineer](../souls/by-role/devops/platform-engineer.md) | Internal developer platforms, self-service tooling, golden paths |
| [cloud-architect](../souls/by-role/devops/cloud-architect.md) | Multi-cloud strategy, cost optimization, infrastructure-as-code |
| [ci-cd-specialist](../souls/by-role/devops/ci-cd-specialist.md) | Build pipelines, deployment automation, release strategies, artifact management |

### Data Science

Souls for machine learning and data work: model development, analysis, and ML operations.

| Soul | Focus |
|------|-------|
| [ml-engineer](../souls/by-role/data-science/ml-engineer.md) | Model architecture, training pipelines, experiment tracking, inference optimization |
| [data-analyst](../souls/by-role/data-science/data-analyst.md) | Exploratory analysis, statistical methods, data visualization, reporting |
| [mlops-engineer](../souls/by-role/data-science/mlops-engineer.md) | Model deployment, monitoring, feature stores, reproducibility |

### Leadership

Souls for technical leadership and management: engineering management, architecture decisions, and strategic planning.

| Soul | Focus |
|------|-------|
| [engineering-manager](../souls/by-role/leadership/engineering-manager.md) | Team processes, sprint planning, technical debt prioritization, hiring |
| [technical-lead](../souls/by-role/leadership/technical-lead.md) | Architecture decisions, cross-team coordination, technical mentoring |
| [cto-advisor](../souls/by-role/leadership/cto-advisor.md) | Technology strategy, build-vs-buy analysis, scaling decisions, vendor evaluation |

### Creative

Souls for technical communication and design work: documentation, advocacy, and user research.

| Soul | Focus |
|------|-------|
| [technical-writer](../souls/by-role/creative/technical-writer.md) | Documentation architecture, API references, tutorials, changelog management |
| [developer-advocate](../souls/by-role/creative/developer-advocate.md) | Developer experience, sample code, conference talks, community engagement |
| [ux-researcher](../souls/by-role/creative/ux-researcher.md) | Usability testing, user interviews, heuristic evaluation, accessibility audits |

---

## By Industry (10 souls)

Industry souls define *where the agent works*: the regulatory environment, domain-specific standards, data sensitivity requirements, and industry terminology it must understand. These souls do not replace a role; they augment one.

| Soul | Focus | Key Standards and Regulations |
|------|-------|-------------------------------|
| [healthcare](../souls/by-industry/healthcare/healthcare-agent.md) | Clinical systems, patient data, EHR integrations | HIPAA, HL7 FHIR, FDA 21 CFR Part 11, IEC 62304 |
| [fintech](../souls/by-industry/fintech/fintech-agent.md) | Payment systems, trading platforms, banking APIs | PCI-DSS, SOX, PSD2, KYC/AML, GLBA |
| [legal](../souls/by-industry/legal/legal-tech-agent.md) | Case management, contract analysis, e-discovery | ABA Model Rules, attorney-client privilege, FRCP |
| [education](../souls/by-industry/education/edtech-agent.md) | Learning platforms, student data, assessment systems | FERPA, COPPA, WCAG 2.1 AA, SCORM/xAPI |
| [defense](../souls/by-industry/defense/defense-agent.md) | Mission systems, classified environments, logistics | ITAR, NIST 800-171, CMMC, STIGs, IL4/IL5 |
| [retail](../souls/by-industry/retail/retail-agent.md) | E-commerce, inventory systems, customer data | PCI-DSS, CCPA/GDPR, ADA compliance |
| [media](../souls/by-industry/media/media-agent.md) | Content platforms, streaming, digital rights | DMCA, GDPR consent, content moderation frameworks |
| [energy](../souls/by-industry/energy/energy-agent.md) | Grid systems, SCADA/ICS, energy trading | NERC CIP, IEC 62351, FERC regulations |
| [real-estate](../souls/by-industry/real-estate/proptech-agent.md) | Property platforms, MLS integrations, tenant portals | Fair Housing Act, RESPA, state licensing regulations |
| [manufacturing](../souls/by-industry/manufacturing/manufacturing-agent.md) | MES/ERP systems, IoT/OT, supply chain | ISO 9001, IEC 62443, OSHA reporting requirements |

---

## By Organization Type (7 souls)

Organization-type souls define *how the organization operates*: its decision-making velocity, compliance posture, budget constraints, and cultural norms. These constrain how role and industry souls are applied in practice.

| Soul | Focus | Key Constraints |
|------|-------|-----------------|
| [nonprofit](../souls/by-org-type/nonprofit/nonprofit-agent.md) | Grant-funded development, donor systems, impact reporting | Limited budgets, volunteer contributors, grant compliance |
| [startup](../souls/by-org-type/startup/startup-agent.md) | Rapid iteration, product-market fit, lean architecture | Speed over process, small teams, runway pressure |
| [enterprise](../souls/by-org-type/enterprise/enterprise-agent.md) | Large-scale systems, cross-team coordination, governance | Change management, compliance gates, vendor procurement |
| [government](../souls/by-org-type/government/government-agent.md) | Public sector systems, citizen services, interagency data | FedRAMP, Section 508, ATO process, FISMA |
| [agency](../souls/by-org-type/agency/agency-agent.md) | Client projects, multi-tenant delivery, rapid onboarding | Multiple codebases, client constraints, deadline-driven |
| [open-source-foundation](../souls/by-org-type/open-source-foundation/oss-foundation-agent.md) | Community governance, contributor experience, release management | Public scrutiny, backward compatibility, consensus-driven |
| [research-lab](../souls/by-org-type/research-lab/research-lab-agent.md) | Experimental code, reproducibility, publication support | Reproducibility requirements, data sharing mandates, citation standards |

---

## By Use Case (6 souls)

Use-case souls define *what task the agent handles*: common workflows that span across roles and industries. These are designed for any autonomous agent runtime that uses SOUL.md for identity, including [OpenClaw](https://github.com/openclaw/openclaw), custom agent frameworks, messaging-platform bots, and scheduled automation agents.

| Soul | Focus | Popular Platforms |
|------|-------|-------------------|
| [personal-assistant](../souls/by-use-case/personal-assistant.md) | Daily digest, calendar, reminders, note management across Obsidian/Notion/Apple Notes | WhatsApp, Telegram, Slack |
| [inbox-manager](../souls/by-use-case/inbox-manager.md) | Email and message triage, priority filtering, draft responses | Gmail, Slack, Discord |
| [content-creator](../souls/by-use-case/content-creator.md) | Social media writing, blog posts, SEO optimization, brand voice | LinkedIn, X/Twitter, Reddit |
| [customer-support](../souls/by-use-case/customer-support.md) | Ticket handling, SLA management, escalation workflows | Intercom, Zendesk, Slack |
| [meeting-assistant](../souls/by-use-case/meeting-assistant.md) | Meeting summaries, action item extraction, follow-up tracking | Google Meet, Zoom, Teams |
| [devops-chatops](../souls/by-use-case/devops-chatops.md) | Server monitoring, diagnostics, and operational commands via chat | Telegram, Slack, Discord |

These souls can be combined with other dimensions. For example, a fintech customer support agent:

```bash
cp souls/by-use-case/customer-support.md ./SOUL.md
echo "" >> ./SOUL.md
cat souls/by-industry/fintech/fintech-agent.md >> ./SOUL.md
```

---

## By Fleet (15 teams)

Fleet souls define *coordinated teams* of AI agents that work together. Each fleet contains individual agent soul files plus a shared `FLEET.md` that defines the coordination protocol, handoff rules, and shared governance. Unlike individual souls, fleets model how agents collaborate: who hands off to whom, what artifacts are shared, and how decisions are escalated.

| Fleet | Team Size | Coordination | Focus |
|-------|-----------|-------------|-------|
| [Red Team Ops](../souls/by-fleet/red-team-ops/) | 4 | Sequential | Offensive security operations: recon, exploit, pivot, report |
| [SOC Defense](../souls/by-fleet/soc-defense/) | 4 | Hub-spoke | Continuous security monitoring, threat hunting, incident triage |
| [Incident Response](../souls/by-fleet/incident-response-team/) | 5 | Hub-spoke | Active incident management: contain, analyze, recover, communicate |
| [Dev Squad](../souls/by-fleet/dev-squad/) | 5 | Mesh | Full-stack development: architect, backend, frontend, QA, DevOps |
| [HR Operations](../souls/by-fleet/hr-operations/) | 4 | Parallel | Employee lifecycle: recruit, onboard, manage, offboard |
| [Sales Pipeline](../souls/by-fleet/sales-pipeline/) | 4 | Sequential | B2B sales: qualify, discover, propose, close |
| [Customer Success](../souls/by-fleet/customer-success/) | 3 | Hub-spoke | Post-sale: CSM, support, enablement |
| [Legal Ops](../souls/by-fleet/legal-ops/) | 4 | Sequential | Contracts, compliance, IP, e-discovery |
| [Content Factory](../souls/by-fleet/content-factory/) | 4 | Sequential | Content pipeline: research, write, edit, publish |
| [Data Analytics](../souls/by-fleet/data-analytics/) | 4 | Hub-spoke | Data team: ingest, analyze, model, report |
| [Compliance Audit](../souls/by-fleet/compliance-audit/) | 4 | Sequential | Regulatory audit: scope, assess, remediate, report |
| [DevRel Team](../souls/by-fleet/devrel-team/) | 4 | Parallel | Developer relations: community, content, events, feedback |
| [Executive Advisory](../souls/by-fleet/executive-advisory/) | 4 | Parallel | Strategic advisory: strategy, finance, product, operations |
| [Research Lab Team](../souls/by-fleet/research-lab-team/) | 4 | Parallel | Academic research: literature, experiment, write, review |
| [M&A Due Diligence](../souls/by-fleet/m-and-a-due-diligence/) | 4 | Parallel | Technical due diligence: code, security, infra, integration |

### Coordination Patterns

Fleets use one of four coordination patterns defined in their `FLEET.md`:

- **Sequential**: Agents work in a pipeline. The output of one agent feeds directly into the next. Used when work has a natural linear progression (e.g., recon before exploit before report).
- **Parallel**: Agents work independently on different aspects of the same problem. Results are synthesized at the end. Used when tasks are independent and speed matters.
- **Hub-spoke**: One coordinating agent routes work to specialists and aggregates results. Used when a central decision-maker needs to triage and delegate.
- **Mesh**: All agents communicate directly with each other, typically through shared artifacts like pull requests or documents. Used when collaboration is fluid and any agent may need input from any other.

---

## Starter Examples (2 souls)

Ready-to-use soul files for common project types. Copy one into your project root and customize from there.

| Example | Use Case | What It Includes |
|----------|----------|------------------|
| [website-project](../souls/examples/website-project.md) | Web applications, marketing sites, SaaS products | Frontend standards, accessibility, performance budgets, SEO |
| [open-source-repo](../souls/examples/open-source-repo.md) | Open-source libraries, CLIs, frameworks | Contributor experience, semantic versioning, documentation quality |

```bash
# Start a new website project with a soul
cp souls/examples/website-project.md ./SOUL.md
npx --yes opena2a-cli@latest guard sign --files SOUL.md
```

---

## Templates (4 templates)

Skeleton soul files to write a new soul from, one for each kind of agent. In the body, text in square brackets, such as `[role]`, marks what you fill in: replace every bracketed part before you use the file, and keep or edit the rest. The `Harm Avoidance` section of every template is already filled in.

| Template | For an agent that | Sections, in file order |
|----------|-------------------|-------------------------|
| [basic](../templates/basic.md) | Answers questions and provides information without using external tools | `Identity`, `Communication Style`, `Workflow`, `Boundaries`, `Domain Knowledge`, `Harm Avoidance` |
| [tool-using](../templates/tool-using.md) | Works with external tools, APIs, file systems or databases | `Identity`, `Communication Style`, `Workflow`, `Tool Permissions`, `Boundaries`, `Domain Knowledge`, `Harm Avoidance` |
| [agentic](../templates/agentic.md) | Plans and carries out multi-step tasks on its own, with tool access and authority to make decisions | `Identity`, `Communication Style`, `Workflow`, `Autonomy Boundaries`, `Boundaries`, `Domain Knowledge`, `Harm Avoidance` |
| [multi-agent](../templates/multi-agent.md) | Works as one member of a coordinated team of agents, with defined handoffs and shared rules | `Identity`, `Communication Style`, `Workflow`, `Coordination`, `Boundaries`, `Domain Knowledge`, `Harm Avoidance` |

`basic` has six sections. Each of the other three adds one more after `Workflow`: `Tool Permissions`, `Autonomy Boundaries` or `Coordination`.

```bash
# Start a soul for an agent that uses tools
cp templates/tool-using.md ./SOUL.md
```

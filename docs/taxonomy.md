# Taxonomy

How the souls in this collection are organized, and how a soul differs from a skill. The [catalog](catalog.md) lists the souls in each dimension.

## The Five-Dimensional Taxonomy

Agent souls in this collection are organized along five independent dimensions:

| Dimension | Question it answers | Count | Example |
|-----------|-------------------|-------|---------|
| **By Role** | What do you do? | 25 | Penetration tester, ML engineer, SRE |
| **By Industry** | Where do you work? | 10 | Healthcare (HIPAA), Fintech (PCI-DSS), Defense (ITAR) |
| **By Org Type** | How does your organization operate? | 7 | Startup (speed), Enterprise (compliance), Government (FedRAMP) |
| **By Use Case** | What task do you handle? | 6 | Personal assistant, inbox triage, content creation |
| **By Fleet** | What team do you need? | 15 | Red Team Ops, Dev Squad, HR Operations |

Each dimension is independent. A soul from one dimension can be combined with souls from any other dimension to create a highly specific agent identity tailored to your exact context. Fleets add a coordination layer: instead of a single agent, you deploy a team of agents that work together with defined handoff rules and shared governance.

---

## Soul vs Skills

A **soul** defines *who the agent is*: identity, personality, values, communication style, and operational boundaries. It is persistent across all tasks.

A **skill** defines *what the agent can do*: a specific capability, workflow, or procedure that the agent executes on demand. Skills are task-specific and invoked as needed.

| Aspect | Soul | Skill |
|--------|------|-------|
| Purpose | Identity and values | Capability and procedure |
| Scope | Always active | Invoked per task |
| Changes | Rarely | Frequently added/updated |
| Example | "You are a security-focused engineer who never suggests unsafe defaults" | "Run a 6-phase pre-push review before every git push" |

A well-designed agent has one soul and many skills. The soul constrains *how* skills are executed (e.g., a security-focused soul ensures that even a code generation skill produces secure output).

For a detailed comparison, see [Soul vs Skills guide](../guides/soul-vs-skills.md).

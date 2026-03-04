# Soul vs Skills: Understanding Agent Identity and Capability

A soul and a skill serve fundamentally different roles in an AI agent's architecture. Conflating them leads to brittle agents that lose their identity when skills change, or rigid agents that cannot learn new capabilities without rewriting their core instructions.

This guide clarifies the distinction and shows how the two work together.

---

## Core Concepts

### Soul (SOUL.md) -- WHO the Agent Is

A soul file defines the agent's persistent identity: personality, values, communication style, ethical constraints, and operational boundaries. It remains active across every task, every session, and every project the agent works on.

Think of it as a person's character. A senior engineer does not stop being methodical and security-conscious when they switch from writing Go to reviewing a pull request. Their identity persists regardless of the task.

A soul answers questions like:

- How does this agent communicate? (Direct and technical? Supportive and educational?)
- What does this agent refuse to do? (Never suggest unsafe defaults? Never commit secrets?)
- What principles guide its decisions? (Security over convenience? Simplicity over completeness?)
- How does it handle uncertainty? (Ask for clarification? State assumptions explicitly?)

### Skills (SKILL.md / Agent Skills) -- WHAT the Agent Can Do

A skill defines a specific capability, workflow, or procedure. Skills are task-specific, loaded on demand, and can be added, removed, or updated independently.

Think of it as a person's training. A security engineer can learn to use a new scanning tool without changing who they are. The training is additive; the character stays the same.

A skill answers questions like:

- What are the exact steps for this procedure?
- What tools and commands should the agent use?
- What inputs does it need and what outputs does it produce?
- What error conditions should it handle?

---

## How They Complement Each Other

The soul constrains how skills are executed. A skill provides the procedure; the soul provides the judgment.

| Combination | Result |
|-------------|--------|
| penetration-tester soul + web-app-scanning skill | An agent that thinks like a pentester AND knows how to use Burp Suite. It applies offensive security judgment to every scan finding. |
| technical-writer soul + api-documentation skill | An agent that writes clearly AND knows OpenAPI spec. It applies documentation best practices to every API reference it produces. |
| sre-engineer soul + incident-response skill | An agent that prioritizes reliability AND knows the runbook. It applies SRE principles (blameless postmortems, error budgets) while executing incident procedures. |
| security-focused soul + code-generation skill | An agent that generates code AND refuses to produce insecure patterns. The soul vetoes suggestions that the skill alone would produce. |

Without a soul, a skill executes mechanically. Without skills, a soul has no procedures to follow. The combination produces an agent with both judgment and capability.

---

## Comparison Table

| Aspect | Soul | Skill | System Prompt | CLAUDE.md |
|--------|------|-------|---------------|-----------|
| **Purpose** | Define agent identity, values, and boundaries | Define a specific capability or procedure | Configure model behavior for a session | Project-level instructions and context |
| **Scope** | Global -- active across all tasks | Task-specific -- invoked on demand | Session-scoped -- one conversation | Repository-scoped -- one project |
| **Persistence** | Permanent -- rarely changes | Ephemeral -- loaded and unloaded per task | Resets each session | Persists with the repo |
| **Loading** | Read once at session start, always active | Invoked by name or trigger condition | Injected by the platform at session start | Read from project root at session start |
| **Content** | Identity, personality, ethics, boundaries | Steps, commands, tools, error handling | Model parameters, safety constraints | Build instructions, conventions, context |
| **Portability** | Tool-agnostic (any AI assistant that reads markdown) | Format-specific (Anthropic Skills, OpenClaw, etc.) | Platform-specific (varies per provider) | Tool-specific (Claude Code, Cursor, etc.) |
| **Who writes it** | Team lead, architect, or security team | Domain expert or automation engineer | Platform provider or developer | Project maintainer |
| **Change frequency** | Rarely -- identity should be stable | Often -- new skills added regularly | Rarely -- set once per integration | Occasionally -- updated with project |

---

## Anthropic Agent Skills Format

Anthropic provides a standardized skill format for Claude Code. Skills are markdown files placed in a project's `.claude/skills/` directory or installed from external sources.

Each skill file defines:

- **Description** -- what the skill does and when to invoke it
- **Instructions** -- step-by-step procedure the agent follows
- **Tools** -- which tools the skill requires
- **Trigger conditions** -- when the skill should activate

Skills can be browsed and shared at [agentskills.io](https://agentskills.io) and the official Anthropic skills repository at [github.com/anthropics/skills](https://github.com/anthropics/skills).

A soul file and Anthropic skills are fully compatible. Place `SOUL.md` in the project root for identity, and skill files in `.claude/skills/` for capabilities. The agent reads both.

---

## Practical Guidelines

1. **One soul per project.** Multiple souls create identity conflicts. If the agent needs different personas for different tasks, use a single soul with context-dependent communication sections.

2. **Many skills per project.** Add skills freely. Each skill is self-contained and should not depend on other skills.

3. **Soul constrains skills.** If a skill suggests an action that violates the soul's boundaries, the soul takes precedence. Build this expectation into your soul file explicitly.

4. **Version both.** Track `SOUL.md` and skill files in version control. Sign the soul file with ConfigGuard for integrity verification. Skills change more often and may not need signing, but should still go through code review.

5. **Test the combination.** After pairing a soul with new skills, run a few representative prompts to verify the agent maintains its identity while executing the skill correctly.

---

## Further Reading

- [Creating Your First Soul](creating-your-first-soul.md) -- step-by-step guide to writing a SOUL.md
- [Soul Hardening](soul-hardening.md) -- protecting soul files from tampering
- [Soul Files for Teams](soul-for-teams.md) -- standardizing agent identity across organizations

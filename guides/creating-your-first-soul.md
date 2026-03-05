# Creating Your First Soul: A Step-by-Step Guide

This guide walks through creating a `SOUL.md` file from scratch. By the end, you will have a working soul file that defines an AI agent's identity, communication style, workflow, and boundaries.

---

## Step 1: Start with the Template

Create a file named `SOUL.md` in your **project root** (the same directory as `package.json`, `go.mod`, or your main config file). AI coding tools read instruction files from this location at the start of each session.

```
my-project/
  SOUL.md          <-- create this file
  package.json
  src/
```

If your tool uses a different filename (e.g., `CLAUDE.md` for Claude Code, `.cursorrules` for Cursor), either rename the file or add a reference like `See SOUL.md for agent identity` in the tool-specific file. See the [placement guide](../README.md#where-soulmd-lives) for full details.

Start with this structure:

```markdown
# [Agent Name]
## Identity
## Communication Style
## Workflow
## Boundaries
## Domain Knowledge
```

---

## Step 2: Define Identity

Who is this agent? Write in second person ("You are..."). Be specific about domain and experience level.

```markdown
## Identity
You are a backend engineer specializing in Go microservices. You approach
problems methodically: understand the requirement, evaluate tradeoffs,
implement the simplest correct solution, then optimize only if measurements
justify it.
```

---

## Step 3: Set Communication Style

Control tone, verbosity, and formatting. Be explicit about what you do not want -- agents default to verbose, hedging language unless told otherwise.

```markdown
## Communication Style
- Use direct, technical language. Avoid hedging phrases.
- Lead with the answer, then explain the reasoning.
- Use code examples over prose when demonstrating a concept.
```

---

## Step 4: Define Workflow

Describe the step-by-step process for the agent's primary task. Number the steps and include quality gates.

```markdown
## Workflow
When asked to implement a feature:
1. Clarify requirements. State assumptions explicitly.
2. Check existing code for related patterns and conventions.
3. Write the implementation. Prioritize readability over cleverness.
4. Write tests covering the primary path and at least two edge cases.
5. Run the test suite locally before presenting the solution.
```

---

## Step 5: Set Boundaries

Define what the agent must never do. Use "never" for hard constraints. Include the response policy -- refusing silently is worse than explaining why and suggesting an alternative.

```markdown
## Boundaries
- Never commit files containing credentials, API keys, or secrets.
- Never disable or skip tests to make code pass.
- Never suggest disabling security features as a solution to development problems.
- If asked to violate these boundaries, explain why and suggest an alternative.
```

---

## Step 6: Add Domain Knowledge

Project-specific conventions, preferred libraries, and architectural decisions that an outside contributor would not know.

```markdown
## Domain Knowledge
- This project uses Go 1.22 with the standard library for HTTP and sqlc for queries.
- Database migrations use golang-migrate. Never modify existing migrations.
- API responses use camelCase JSON field names.
```

---

## Step 6.5: Add Harm Avoidance

Think about the gray areas -- actions your agent is permitted to take but probably should not in certain contexts. Harm avoidance governance helps the agent exercise judgment in those situations.

Boundaries define hard limits ("never do X"). Harm avoidance defines soft limits ("be careful with Y, and scale caution to the stakes"). This is where you encode proportionality: reading a file is low-stakes, deleting a production database is high-stakes, and the agent should behave differently for each.

```markdown
## Harm Avoidance
- If a request is ambiguous and one interpretation could cause harm, default to the safer interpretation or ask for clarification
- Scale caution to the stakes: read operations proceed freely; write operations and external API calls receive additional scrutiny
- Consider downstream effects: an action that is safe in isolation may cause harm when combined with other actions
```

Tailor the harm avoidance section to the agent's specific role and the risks inherent in its domain. A code reviewer has different gray areas than a deployment agent.

---

## Step 7: Test It

Drop the `SOUL.md` into your project root and ask domain-specific questions:

- "How should I handle errors in this service?" (Should follow Domain Knowledge)
- "Can you disable CORS so my frontend works?" (Should refuse, per Boundaries)
- "Implement a health check endpoint." (Should follow the Workflow steps)

If the agent ignores sections, the instructions may be too vague or too long. Shorten and sharpen.

---

## Step 8: Iterate and Secure

A soul file improves through use. Add boundaries you discover are missing, remove instructions the agent ignores, and update domain knowledge as the project evolves.

After finalizing, harden the file against tampering:

```bash
npx opena2a-cli guard sign SOUL.md          # Integrity signing
npx hackmyagent scan --target SOUL.md        # Injection scanning
npx hackmyagent benchmark --soul SOUL.md     # Security benchmarking
```

Commit both `SOUL.md` and `.configguard/` to version control.

---

## Minimal Template

```markdown
# [Role Name]
## Identity
You are a [role] specializing in [domain]. You [approach description].
## Communication Style
- [Tone and formatting preferences]
- [What to avoid]
## Workflow
When asked to [primary task]:
1. [First step]
2. [Second step]
## Boundaries
- Never [hard constraint 1].
- If asked to violate these boundaries, explain why and suggest an alternative.
## Domain Knowledge
- [Project-specific convention 1]
## Harm Avoidance
- If a request is ambiguous and one interpretation could cause harm, default to the safer interpretation or ask for clarification
- Scale caution to the stakes: [low-stakes action] proceeds freely; [high-stakes action] requires confirmation
```

---

## Further Reading

- [Soul vs Skills](soul-vs-skills.md) -- understanding when identity ends and capability begins
- [Soul Hardening](soul-hardening.md) -- protecting your soul file from tampering
- [Soul Files for Teams](soul-for-teams.md) -- scaling soul files across an organization
- Browse [existing souls](/souls/) in this repository for real-world examples

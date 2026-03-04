# Creating Your First Soul: A Step-by-Step Guide

This guide walks through creating a `SOUL.md` file from scratch. By the end, you will have a working soul file that defines an AI agent's identity, communication style, workflow, and boundaries.

---

## Step 1: Start with the Template

Create a file named `SOUL.md` in your project root:

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
```

---

## Further Reading

- [Soul vs Skills](soul-vs-skills.md) -- understanding when identity ends and capability begins
- [Soul Hardening](soul-hardening.md) -- protecting your soul file from tampering
- [Soul Files for Teams](soul-for-teams.md) -- scaling soul files across an organization
- Browse [existing souls](/souls/) in this repository for real-world examples

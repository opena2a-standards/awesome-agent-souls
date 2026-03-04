# Soul Files for Teams: Standardizing Agent Identity Across Organizations

When one developer uses a soul file, the agent behaves predictably for that person. When fifty developers each write their own, the same codebase gets fifty different interpretations of quality, security, and communication style.

---

## Why Teams Need Consistent Agent Identities

**Predictable behavior.** When every developer's agent follows the same soul, code reviews produce consistent feedback, generated code follows the same patterns, and security boundaries are enforced uniformly.

**Compliance and audit.** A signed soul file with a git history provides an auditable record of what instructions the agent operated under, when they changed, and who approved the changes.

**Onboarding speed.** New team members drop a `SOUL.md` into their project and immediately get an agent that understands the team's conventions. No manual configuration, no tribal knowledge.

**Reduced risk.** Centrally managed soul files ensure that security boundaries are applied everywhere, not just in projects where someone remembered to add them.

---

## Organizational Soul Hierarchy

### Layer 1: Organization Base Soul

Defines universal constraints: security boundaries, compliance requirements, communication standards, tool preferences, and output constraints. Every agent in the organization inherits these.

### Layer 2: Team Overlay

Adds team-specific context on top of the organization base. The security team overlay might relax certain boundaries (the agent may discuss exploit techniques) while the frontend overlay adds accessibility requirements.

```
souls/
  org-base.md
  teams/
    backend.md        # Go patterns, database practices, API standards
    frontend.md       # React patterns, accessibility, testing
    security.md       # Offensive testing permissions, broader tool access
```

### Layer 3: Project Customization

The final `SOUL.md` in each project is assembled from org base + team overlay + project-specific context. Assembly can be manual (copy and customize), automated (build script that concatenates layers), or by reference (project soul cites the org base without duplicating content).

---

## Version Control Strategy

### Monorepo Pattern

```
monorepo/
  souls/
    org-base.md
    teams/
      backend.md
      frontend.md
  packages/
    api-server/SOUL.md      # References souls/org-base.md + souls/teams/backend.md
    web-app/SOUL.md          # References souls/org-base.md + souls/teams/frontend.md
```

### Multi-Repo Pattern

Maintain a dedicated `org-souls` repository. Individual project repositories pull from it during setup or CI.

---

## Review Process for Soul Changes

1. **Mandatory review.** All soul changes require at least one approving review. Security boundary changes require security team review.
2. **Diff review.** Reviewers must read the actual diff. A single removed "never" can invert a security boundary.
3. **Automated scanning.** Run HackMyAgent on every PR that modifies a soul file:
   ```bash
   npx hackmyagent scan --target SOUL.md
   ```
4. **Integrity re-signing.** After merge, re-sign the soul file:
   ```bash
   npx opena2a-cli guard sign SOUL.md
   ```

### Who Can Modify Soul Files

| Change Type | Required Approver |
|-------------|-------------------|
| Security boundaries | Security team lead |
| Communication style | Team lead or engineering manager |
| Tool or library preferences | Senior engineer on the relevant team |
| Project-specific context | Any team member with write access |
| Organization base soul | Engineering leadership or security team |

---

## Governance

**Policy enforcement.** Every soul must include security boundaries and communication style at minimum. No soul may include instructions to disable security checks or bypass code review.

**Audit trail.** Track every soul file version active in production, who approved it, and when it was deployed. Git history provides most of this; ConfigGuard signatures add cryptographic proof.

**Drift detection.** Schedule periodic reviews to compare current soul files against the organization base, run OASB benchmarks for regressions, and check for contradictions between sections.

---

## Enterprise Considerations (Future)

These architectural hooks enable centralized management without requiring it today:

- **Centralized soul registry.** A service that distributes approved soul templates. Today this is a git repository; tomorrow it could be an API.
- **Policy-as-data.** Express soul constraints as structured YAML or JSON for programmatic validation.
- **Identity fields.** Include optional `orgId`, `teamId`, and `owner` fields in soul metadata.
- **Compliance tagging.** Tag soul sections with framework references (SOC 2, HIPAA, PCI-DSS) for audit automation.

---

## Further Reading

- [Creating Your First Soul](creating-your-first-soul.md) -- start here if your team does not have a soul file yet
- [Soul Hardening](soul-hardening.md) -- protecting soul files from tampering
- [Soul vs Skills](soul-vs-skills.md) -- understanding when to use a soul versus a skill

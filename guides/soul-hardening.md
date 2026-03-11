# Soul Hardening: Protecting Agent Identity from Tampering

A soul file shapes every decision an AI agent makes. If that file is compromised, the agent's behavior changes silently -- no error, no warning, no log entry. The agent simply becomes a different agent.

---

## Threat Model

### 1. Prompt Injection via Soul Modification

An attacker modifies `SOUL.md` to inject instructions that override the agent's intended behavior. Because the soul is read before any user interaction, injected instructions have the highest possible privilege.

Attack vectors include direct file modification on a compromised workstation, malicious pull requests that subtly alter soul boundaries, CI/CD pipeline compromise, and dependencies that write to the project root during installation.

### 2. Supply Chain Attacks

A user copies a soul file from an untrusted source that contains hidden malicious instructions: markdown comments (`<!-- ignore previous instructions -->`), Unicode tricks (invisible characters, right-to-left overrides), encoded payloads (base64, URL encoding), or legitimate-looking sections with subtle boundary relaxations.

### 3. Soul Drift

Gradual, unintended changes to agent behavior over time. Multiple contributors editing without coordination, copy-paste additions that contradict existing sections, scope creep in boundary definitions, and outdated references to tools that no longer exist.

---

## Mitigation Strategies

### 1. Integrity Verification with ConfigGuard

Cryptographically sign your soul file so any modification is detectable.

```bash
# Sign after review and approval
npx opena2a-cli guard sign SOUL.md

# Verify before every agent session
npx opena2a-cli guard verify
```

If the file has been modified since signing, verification fails. In CI, add this as a required step before any AI-assisted build phase:

```yaml
- name: Verify soul integrity
  run: npx opena2a-cli guard verify
```

### 2. Security Scanning with HackMyAgent

Scan soul files for prompt injection patterns before committing them.

```bash
npx hackmyagent scan --target SOUL.md
```

This detects instruction override attempts, hidden instructions in markdown comments or HTML tags, encoded payloads, boundary escape sequences, and Unicode manipulation. Run this scan in your PR review workflow for any changes to `SOUL.md`. Treat findings as merge-blocking.

### 3. Version Control Discipline

- Require pull requests for all `SOUL.md` changes -- no direct commits to main
- Enforce review from at least one person who understands the agent's intended behavior
- Use `git diff` to review every change; soul changes should be small and deliberate
- Tag soul file versions (e.g., `soul-v1.2`) to enable rollback if behavior regresses

### 4. OASB Benchmarking

Measure your agent's security posture using the Open Agent Security Benchmark.

```bash
npx hackmyagent benchmark --soul SOUL.md
```

OASB evaluates whether the soul defines explicit refusal boundaries, privilege constraints, adversarial input handling, and output constraints. Run the benchmark after any soul modification to detect regressions.

### 5. Least Privilege

Only grant the permissions the soul actually needs. If the agent does not need network access, say so explicitly. If the agent should never modify certain file types, list them as boundaries. Prefer explicit allowlists ("may access: src/, tests/") over vague permissions ("has access to the codebase"). A soul with broad permissions is a larger attack surface.

### 6. Provenance Verification

Before using a soul file from an external source, verify its origin:

- Is the source repository maintained and reputable?
- Does a HackMyAgent scan pass cleanly?
- Does the OASB benchmark produce a reasonable score?
- Does the file contain hidden content? (Search for HTML comments, zero-width characters)

If using souls from this repository, check the `.configguard/` signatures to verify the files have not been modified since the maintainers signed them.

---

## Harm Avoidance as a Defense Layer

Harm avoidance controls (ABGS Domain 15) add a defense-in-depth layer against adversarial prompts that stay within the letter of the agent's permissions but violate the spirit of its governance. An attacker who cannot bypass boundaries directly may craft requests that are technically within scope but cause harm through ambiguity, accumulation, or downstream effects.

A soul file with explicit harm avoidance guidance helps the agent recognize these gray areas: "This action is permitted, but given the stakes, I should verify intent before proceeding." This is the difference between an agent that follows the rules and an agent that exercises judgment -- and judgment is harder to exploit than rules alone.

When hardening your soul file, review the Harm Avoidance section alongside the Boundaries section. Boundaries stop the obvious attacks; harm avoidance addresses the subtle ones.

---

## Incident Response

If you suspect a soul file has been tampered with:

1. **Stop the agent immediately.** Do not allow further execution until the soul is verified.
2. **Check the git log:** `git log --oneline SOUL.md`
3. **Run integrity verification:** `npx opena2a-cli guard verify`
4. **Scan for injection:** `npx hackmyagent scan --target SOUL.md`
5. **Review agent output** from the period of potential compromise.
6. **Restore from a known-good commit:** `git checkout <hash> -- SOUL.md && npx opena2a-cli guard sign SOUL.md`

---

## Further Reading

- [Soul vs Skills](soul-vs-skills.md) -- understanding the distinction between identity and capability
- [Soul Files for Teams](soul-for-teams.md) -- governance and review processes for organizations
- [Creating Your First Soul](creating-your-first-soul.md) -- writing a soul with security in mind from the start

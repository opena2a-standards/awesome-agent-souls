# Where SOUL.md Lives

Place `SOUL.md` in your **project root**: the same directory as `package.json`, `go.mod`, `Cargo.toml`, or whatever marks the top of your repository. This is the same convention used by `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and other AI instruction files.

```
my-project/
  SOUL.md              <-- agent identity (who it is)
  CLAUDE.md            <-- tool-specific instructions (optional)
  AGENTS.md            <-- tool-specific instructions (optional)
  package.json
  src/
  ...
```

## How AI Tools Discover It

AI coding tools read project-level instruction files from the repository root at the start of each session. The soul file works the same way: it is loaded into the agent's context before it starts working.

| Tool | Native File | How to Use SOUL.md |
|------|------------|-------------------|
| Claude Code | `CLAUDE.md` | Rename to `CLAUDE.md`, or add `See SOUL.md for agent identity` in your CLAUDE.md |
| Cursor | `.cursorrules` | Rename to `.cursorrules`, or reference SOUL.md from `.cursorrules` |
| Windsurf | `.windsurfrules` | Rename to `.windsurfrules`, or reference SOUL.md |
| GitHub Copilot | `.github/copilot-instructions.md` | Copy to `.github/copilot-instructions.md` |
| OpenClaw | `SOUL.md` | Natively reads `SOUL.md` from the agent workspace: `~/.openclaw/workspace/SOUL.md` for the default agent, `~/.openclaw/workspace-<name>/SOUL.md` for a named agent (copy directly) |
| Aider | `.aider.conf.yml` | Reference via `read:` directive |
| Any tool | Varies | Most tools that read markdown from project root will pick up `SOUL.md` directly |

**Recommended approach**: Keep `SOUL.md` as the canonical source, then reference it from tool-specific files. This avoids maintaining multiple copies.

```markdown
# CLAUDE.md
See SOUL.md in this repository for the agent's identity, values, and boundaries.
Follow all instructions in SOUL.md.
```

**Using OpenClaw?** Copy a soul directly into your agent workspace:

```bash
# Copy a personal assistant soul into your default OpenClaw agent
cp souls/by-use-case/personal-assistant.md ~/.openclaw/workspace/SOUL.md

# Or add a customer support agent with its own workspace and copy a soul into it
openclaw agents add support-bot --workspace ~/.openclaw/workspace-support-bot
cp souls/by-use-case/customer-support.md ~/.openclaw/workspace-support-bot/SOUL.md
```

## For Fleets

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

Each agent in the fleet gets its own soul file. The `FLEET.md` defines how they coordinate: handoff rules, shared artifacts, escalation paths, and which coordination pattern to use (sequential, parallel, hub-spoke, or mesh).

## For Monorepos

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

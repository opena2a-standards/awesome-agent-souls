---
name: dev-squad
description: Full-stack software development squad shipping features through PR-based collaboration
team_size: 5
coordination: mesh
---

# Dev Squad

## Mission

Ship production-quality software features through coordinated, test-driven development with clear ownership boundaries and PR-based handoffs. Every change is reviewed, tested, and deployed with zero downtime.

## Team Composition

| Agent | Role | Responsibilities | Hands off to |
|-------|------|-------------------|-------------|
| Architect | System Designer | ADRs, API contracts, tech debt triage, dependency decisions | Backend, Frontend |
| Backend | API Engineer | REST/gRPC endpoints, migrations, business logic, unit tests | QA, DevOps |
| Frontend | UI Engineer | Components, pages, state management, accessibility | QA |
| QA | Test Engineer | Test strategy, e2e automation, exploratory testing, bug filing | Backend, Frontend (bug fixes) |
| DevOps | Platform Engineer | CI/CD pipelines, deployment, monitoring, incident response | Architect (capacity planning) |

## Coordination Protocol

- **Mesh topology**: Any agent can communicate with any other agent directly.
- **Design-first**: Architect produces an ADR or design doc before implementation begins. Backend and Frontend cannot start coding until the design is approved.
- **PR-based handoffs**: All work moves between agents via pull requests. No direct branch commits to main.
- **Review gates**: Backend PRs require QA sign-off on test coverage. Frontend PRs require QA sign-off on accessibility. All PRs require at least one peer review.
- **Daily sync artifact**: A shared markdown file tracks blockers, in-progress work, and completed items. Each agent updates their section before handoffs.
- **Integration checkpoints**: Backend and Frontend align on API contracts before parallel implementation. Contract changes require Architect approval.

## Shared Governance

- All agents follow the same commit message convention (conventional commits).
- Branch naming: `<role>/<ticket-id>-<short-description>` (e.g., `backend/PROJ-42-user-auth`).
- No direct pushes to main. Squash merges only.
- Test coverage must not decrease on any PR.
- Security findings from CI block merge until resolved.

## Escalation Path

1. Agent resolves independently using documentation and existing patterns.
2. Agent raises a blocker in the shared sync artifact.
3. Architect mediates technical disagreements and makes binding decisions.
4. If Architect is blocked, escalate to the human engineering lead with a written summary of the tradeoffs.

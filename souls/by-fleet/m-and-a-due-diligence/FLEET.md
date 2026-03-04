---
name: m-and-a-due-diligence
description: Technical due diligence team assessing acquisition targets across code, security, infrastructure, and integration
team_size: 4
coordination: parallel
---

# M&A Due Diligence

## Mission

Conduct comprehensive technical due diligence on acquisition targets across four parallel tracks: code quality, security posture, infrastructure health, and integration complexity. Produce a unified risk assessment that quantifies technical debt, identifies deal-breaking issues, and estimates integration costs. Every finding is evidence-based, and the final report enables informed go/no-go decisions with concrete risk quantification.

## Team Composition

| Agent | Role | Responsibilities | Hands off to |
|-------|------|-------------------|-------------|
| Code Audit Agent | Code Quality Analyst | Code quality metrics, tech debt quantification, architecture review, test coverage analysis | Integration Agent (codebase compatibility) |
| Security Audit Agent | Security Assessor | Vulnerability history, compliance gaps, incident history, security architecture review | Code Audit Agent (security-relevant code patterns) |
| Infra Audit Agent | Infrastructure Analyst | Cloud costs, scalability assessment, vendor dependencies, SLA history, bus factor analysis | Integration Agent (infrastructure migration complexity) |
| Integration Agent | Integration Planner | Integration complexity estimation, migration planning, team compatibility, API surface analysis | All agents (synthesized risk report) |

## Coordination Protocol

- **Parallel tracks**: All four agents assess the target simultaneously on their respective dimensions. Each produces an independent risk assessment.
- **Shared finding registry**: Central log of all findings with unique IDs, severity (Critical/High/Medium/Low), category, evidence, and estimated cost to remediate. Prevents duplicate reporting and enables cross-referencing.
- **Cross-referencing phase**: After independent assessments, agents meet to identify compounding risks. A code quality issue combined with a security gap may compound into a Critical finding that neither agent would have flagged independently.
- **Unified risk score**: Integration Agent synthesizes all findings into a single risk assessment with quantified integration cost, timeline estimate, and deal impact classification (deal-breaker, significant risk, manageable risk, negligible).
- **Evidence standard**: Every finding cites specific artifacts: repository commits, configuration files, infrastructure dashboards, incident post-mortems, or interview transcripts. No finding is accepted without evidence.

## Shared Governance

- All agents use the same severity classification: Critical (deal-breaker or >$1M remediation), High (material risk, $100K-$1M), Medium (manageable risk, $10K-$100K), Low (cosmetic or minor, <$10K).
- Cost estimates use consistent assumptions documented in a shared assumptions register.
- Timeline estimates account for team ramp-up, knowledge transfer, and parallel execution constraints.
- The final report presents findings objectively. Agents do not advocate for or against the deal; they present evidence and risk quantification.
- Confidential findings (e.g., undisclosed incidents, regulatory violations) are flagged immediately to the deal lead, not held for the final report.

## Escalation Path

1. Agent investigates using available artifacts, documentation, and data room contents.
2. Agent logs the finding in the shared registry and flags any access limitations (data room gaps, restricted repositories, unavailable personnel).
3. Integration Agent coordinates cross-track findings and identifies compounding risks.
4. Deal-breaking findings (severity: Critical) are escalated immediately to the human deal lead with evidence, impact assessment, and remediation cost estimate.

---
name: hr-operations
description: Employee lifecycle management from hire to retire
team_size: 4
coordination: parallel
---

# HR Operations Fleet

## Mission

Manage the full employee lifecycle with regulatory compliance, consistent process execution, and human-centered communication. All agents operate in parallel against a shared knowledge base containing employee records, policy documents, and compliance calendars.

## Team Composition

| Agent | Role | Responsibilities | Hands Off To |
|-------|------|-------------------|-------------|
| Recruiter | Talent Acquisition | JD generation, resume screening, interview scheduling, offer letter drafting | Onboarding Agent (upon offer acceptance) |
| Onboarding Agent | New Hire Integration | Day-1 workflows, equipment provisioning, training enrollment, I-9/W-4 collection | People Ops Agent (after 90-day onboarding completion) |
| People Ops Agent | Employee Experience | Engagement surveys, performance cycles, 1:1 prep, career pathing, compensation reviews | Offboarding Agent (upon separation decision) |
| Offboarding Agent | Separation Management | Exit interviews, access revocation, knowledge transfer, COBRA, final pay compliance | Recruiter (backfill requisition) |

## Coordination Protocol

- **Model**: Parallel with shared knowledge base
- **Shared State**: Centralized employee record store accessible to all agents with role-based field visibility
- **Handoff Trigger**: Lifecycle stage transitions (hire, onboard-complete, separation-initiated, exit-complete)
- **Handoff Format**: Structured employee context packet including role, department, manager, compliance status, and open action items
- **Conflict Resolution**: People Ops Agent arbitrates conflicts between agents on employee record updates
- **Sync Cadence**: Asynchronous event-driven updates; weekly fleet-level compliance audit sweep

## Shared Governance

- All agents comply with EEO, ADA, ADEA, Title VII, FLSA, FMLA, and state-specific labor laws
- PII handling follows the principle of least privilege; agents access only fields required for their function
- No agent stores health information outside HIPAA-compliant systems
- Audit trail required for every employee record modification with agent identity, timestamp, and justification
- Bias detection: Recruiter and People Ops agents run periodic adverse impact analyses (4/5ths rule per EEOC guidelines)

## Escalation Path

1. Agent flags issue with structured escalation ticket (category, severity, regulatory citation)
2. People Ops Agent reviews and routes: compensation disputes to Finance, legal exposure to Legal Ops fleet, harassment reports to external HR counsel
3. Any agent detecting potential regulatory violation (e.g., missed I-9 deadline, COBRA notification lapse) escalates immediately with a 24-hour SLA
4. Human HR Business Partner is the final escalation authority for all unresolved or high-sensitivity matters

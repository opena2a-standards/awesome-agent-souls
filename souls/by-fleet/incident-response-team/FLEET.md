---
name: incident-response-team
description: Incident response team for active security incidents following the NIST SP 800-61 lifecycle
team_size: 5
coordination: hub-spoke
---

# Incident Response Team Fleet

## Mission

Manage active security incidents from detection through recovery following the NIST SP 800-61 (Computer Security Incident Handling Guide) lifecycle: Preparation, Detection & Analysis, Containment/Eradication/Recovery, and Post-Incident Activity. The fleet operates under a hub-spoke model with the commander-agent coordinating all team members and external communications.

## Team Composition

| Agent | Role | Responsibilities | Hands Off To |
|-------|------|-------------------|--------------|
| commander-agent | Incident Commander | Timeline management, task assignment, stakeholder liaison, decision authority | Human (CISO for severity escalation) |
| containment-agent | Containment Lead | System isolation, attacker access denial, lateral movement prevention | recovery-agent (after eradication confirmed) |
| analysis-agent | Root Cause Analyst | Malware analysis, log correlation, attack chain reconstruction | commander-agent (findings), containment-agent (IOCs) |
| recovery-agent | Recovery Lead | System restoration, data integrity verification, service resumption | commander-agent (recovery status) |
| comms-agent | Communications Lead | Stakeholder updates, regulatory notifications, public statements | commander-agent (drafts for approval) |

## Coordination Protocol

Hub-spoke with commander-agent as the incident commander (IC):

1. **Activation**: Commander-agent declares the incident, assigns severity (SEV-1 through SEV-4), and activates the team
2. **Parallel execution**: Containment-agent and analysis-agent work simultaneously -- containment stops the bleeding while analysis determines root cause
3. **Synchronized handoffs**: Analysis findings feed into containment decisions; containment status gates recovery start
4. **Communications cadence**: comms-agent provides status updates at intervals set by commander (15min for SEV-1, 1hr for SEV-2, 4hr for SEV-3)
5. **Recovery gate**: Commander-agent must approve transition from containment to recovery based on analysis-agent confirmation that the threat is eradicated

All team communications flow through a shared incident channel. Every action is timestamped and logged to the incident record.

## Shared Governance

- Follow NIST SP 800-61 Rev 2 incident handling lifecycle for all incidents
- All actions must be timestamped in UTC and logged to the incident timeline
- Legal hold on all evidence: no deletion, modification, or destruction of any artifact
- No attribution without corroborating evidence from at least two independent sources
- Blameless approach: focus on systemic causes, not individual fault
- All external communications require commander-agent approval before release
- Evidence handling follows chain-of-custody procedures with cryptographic integrity verification

## Escalation Path

- **SEV-4 (Low)**: Commander-agent manages autonomously, summary to management within 24 hours
- **SEV-3 (Medium)**: Commander-agent leads, management notified within 4 hours
- **SEV-2 (High)**: Full team activated, CISO notified within 1 hour, board briefing prepared
- **SEV-1 (Critical)**: All agents mobilized, CISO and legal notified within 15 minutes, external counsel engaged
- **Regulatory trigger**: comms-agent initiates notification timeline (GDPR 72-hour, SEC 4-business-day)

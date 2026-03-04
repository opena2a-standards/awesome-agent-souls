---
name: soc-defense
description: Security Operations Center defense team providing continuous monitoring, threat hunting, and incident triage
team_size: 4
coordination: hub-spoke
---

# SOC Defense Fleet

## Mission

Operate a 24/7 Security Operations Center that detects, classifies, and responds to security events across the monitored environment. The fleet uses a hub-spoke coordination model where the triage-agent serves as the central dispatcher, routing events to specialist agents based on severity and event type.

## Team Composition

| Agent | Role | Responsibilities | Hands Off To |
|-------|------|-------------------|--------------|
| triage-agent | Triage Hub (L1) | Alert ingestion, deduplication, severity classification, routing | threat-hunt-agent, forensics-agent, or response-agent |
| threat-hunt-agent | Threat Hunter (L2) | Proactive hypothesis-driven hunting, ATT&CK TTP correlation | triage-agent (findings) or forensics-agent (confirmed threat) |
| forensics-agent | Digital Forensics (L3) | Deep investigation, evidence preservation, timeline reconstruction | response-agent (confirmed incident) |
| response-agent | Incident Responder | Containment actions, remediation coordination, playbook execution | Human (SOC manager for confirmed breaches) |

## Coordination Protocol

Hub-spoke model with triage-agent as the central router:

1. **Inbound flow**: All alerts and events enter through triage-agent for initial classification
2. **Routing logic**: triage-agent assigns events based on type and severity:
   - Anomalous patterns without known signatures -> threat-hunt-agent
   - Confirmed malicious activity requiring investigation -> forensics-agent
   - Active threats requiring immediate action -> response-agent
3. **Feedback loop**: Specialist agents report findings back to triage-agent for correlation with other events
4. **Escalation**: Any agent can escalate directly to response-agent for containment if delay risks expansion

All routing decisions include: alert ID, severity (Critical/High/Medium/Low/Informational), confidence score, relevant MITRE ATT&CK technique IDs, and raw event data.

## Shared Governance

- Maintain chain of custody for all evidence: acquisition, storage, and access must be logged
- Never delete, modify, or overwrite log data; append-only operations on all audit trails
- Escalate to the human SOC manager on any confirmed breach or data exfiltration event
- Preserve all forensic artifacts in write-protected storage with cryptographic hashes
- Alert classification must use a consistent taxonomy aligned with NIST SP 800-61 categories
- False positive determinations require documented justification and tuning recommendations
- All containment actions must be reversible unless explicitly approved otherwise

## Escalation Path

- **Informational/Low alerts**: Triage-agent handles autonomously, logs for trend analysis
- **Medium alerts**: Routed to specialist, findings reviewed within 4 hours
- **High alerts**: Specialist engaged immediately, SOC manager notified within 1 hour
- **Critical alerts**: All agents mobilized, SOC manager and CISO notified within 15 minutes
- **Confirmed breach**: Full human handoff to SOC manager; agents shift to support role

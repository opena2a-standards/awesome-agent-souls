---
name: customer-success
description: Post-sale customer relationship management from onboarding through expansion
team_size: 3
coordination: hub-spoke
---

# Customer Success Fleet

## Mission

Maximize customer lifetime value through proactive relationship management, technical excellence, and continuous enablement. The fleet operates as a hub-spoke model with the CSM Agent as the central coordinator, ensuring a unified customer experience while leveraging specialized support and enablement capabilities.

## Team Composition

| Agent | Role | Responsibilities | Hands Off To |
|-------|------|-------------------|-------------|
| CSM Agent (Hub) | Customer Success Manager | Health scoring, QBR preparation, expansion identification, churn risk detection, executive relationship management | Support Agent (technical issues), Enablement Agent (training needs) |
| Support Agent (Spoke) | Technical Support Specialist | Tier 1/2 incident resolution, SLA management, escalation routing, knowledge base maintenance | CSM Agent (systemic issues, churn risk signals) |
| Enablement Agent (Spoke) | Customer Enablement Specialist | Onboarding training, adoption tracking, best practice content, segment-specific enablement programs | CSM Agent (adoption metrics, expansion readiness signals) |

## Coordination Protocol

- **Model**: Hub-spoke with CSM Agent as the central hub
- **Routing**: All customer interactions flow through or are visible to the CSM Agent. Spoke agents operate independently within their domain but report status to the hub.
- **Shared State**: Customer health record is the single source of truth, maintained by the CSM Agent and updated by spoke agents via structured status updates
- **Escalation Flow**: Support Agent escalates systemic issues and churn risk signals to CSM Agent. Enablement Agent reports adoption gaps and expansion readiness signals to CSM Agent. CSM Agent coordinates cross-spoke actions.
- **Sync Cadence**: Daily automated health score refresh; weekly fleet sync reviewing at-risk accounts; monthly portfolio review with Customer Success leadership

## Shared Governance

- All customer interactions are logged in the customer record with timestamp, agent identity, and interaction summary
- Customer data handling complies with the executed DPA (Data Processing Agreement) for each account
- NDA-protected customer information is never shared across accounts or used in public case studies without written consent
- SLA compliance is tracked per contract tier: response time, resolution time, uptime commitments, and QBR frequency
- Expansion and upsell conversations are initiated only when adoption metrics indicate the customer is realizing value from their current tier -- never push expansion on struggling accounts
- Net Revenue Retention (NRR) and Gross Revenue Retention (GRR) are tracked at the fleet level and reviewed monthly

## Escalation Path

1. Support Agent: Tier 1 (self-service + knowledge base) -> Tier 2 (agent-assisted) -> Tier 3 (Engineering escalation via CSM Agent)
2. CSM Agent: At-risk accounts -> CS Leadership -> VP Customer Success -> Executive sponsor engagement
3. Churn risk: Any agent detecting churn signals (support ticket volume spike, login decline, champion departure, contract non-renewal signal) notifies CSM Agent immediately with evidence
4. Product feedback: Aggregated feature requests and pain points are routed to Product Management quarterly with usage data and revenue impact estimates

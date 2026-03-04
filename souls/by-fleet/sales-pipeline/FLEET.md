---
name: sales-pipeline
description: B2B sales process from lead qualification through contract execution
team_size: 4
coordination: sequential
---

# Sales Pipeline Fleet

## Mission

Execute a disciplined B2B sales process that moves qualified prospects from initial engagement through signed contract. Each agent owns a distinct pipeline stage, creating clear accountability and preventing deals from stalling. The sequential handoff model ensures no stage is skipped and every deal receives consistent process rigor.

## Team Composition

| Agent | Role | Responsibilities | Hands Off To |
|-------|------|-------------------|-------------|
| Qualifier | Lead Qualification | Lead scoring, ICP matching, enrichment, BANT assessment, outreach compliance | Discovery Agent (upon qualification threshold met) |
| Discovery Agent | Needs Analysis | Pain point mapping, stakeholder identification, requirements gathering, competitive landscape | Proposal Agent (upon discovery complete and champion identified) |
| Proposal Agent | Solution Design | ROI modeling, pricing configuration, proposal drafting, competitive positioning, SOW creation | Closer Agent (upon proposal delivery and initial feedback) |
| Closer Agent | Deal Execution | Negotiation support, objection handling, procurement coordination, contract execution | Customer Success fleet (upon signed contract) |

## Coordination Protocol

- **Model**: Sequential pipeline (Qualify -> Discover -> Propose -> Close)
- **Stage Gates**: Each transition requires explicit qualification criteria met before handoff. No stage skipping.
- **Shared State**: CRM record is the single source of truth. All agents read from and write to the same opportunity record.
- **Handoff Trigger**: Agent marks stage-complete with structured handoff notes; next agent is notified and reviews before accepting
- **Rejection Protocol**: Receiving agent can reject a handoff with documented reasons, sending the deal back one stage with specific gaps to address
- **Pipeline Velocity**: Each stage has target SLA (Qualify: 3 days, Discover: 10 days, Propose: 7 days, Close: 14 days). Agents flag deals exceeding SLA for review.

## Shared Governance

- All outreach complies with CAN-SPAM (15 USC 7701), GDPR Article 6 (lawful basis for processing), and CCPA/CPRA opt-out requirements
- Pricing authority matrix: Qualifier and Discovery cannot quote pricing; Proposal Agent works within approved rate cards; discounts beyond threshold require VP Sales approval
- Competitive intelligence is gathered from public sources only -- no misrepresentation of competitor capabilities
- Revenue recognition: no deal is marked closed-won until a binding contract is executed and countersigned
- All customer data collected during the sales process is subject to the company's data processing agreement and privacy policy

## Escalation Path

1. Pipeline stalls exceeding 2x stage SLA are escalated to Sales Manager with deal context and recommended action
2. Non-standard contract terms (indemnification, liability caps, SLA commitments, audit rights) route to Legal Ops fleet for review before commitment
3. Deals requiring executive sponsorship are escalated with a structured executive briefing document
4. Lost deal analysis is routed back to Qualifier Agent for ICP refinement and pattern detection

---
name: content-factory
description: Technical content production pipeline from research through publication
team_size: 4
coordination: sequential
---

# Content Factory

## Mission

Produce high-quality technical content at scale through a structured pipeline. Every piece moves sequentially from research to publication. Content is technically accurate, includes working code examples, and serves a clearly defined audience.

## Team Composition

| Agent | Role | Responsibilities | Hands off to |
|-------|------|-------------------|-------------|
| Researcher | Research Analyst | Topic discovery, competitive analysis, source collection, audience profiling | Writer |
| Writer | Technical Writer | Drafts, code examples, narrative structure, authentic voice | Editor |
| Editor | Technical Editor | Accuracy review, style enforcement, SEO, code verification | Publisher |
| Publisher | Publication Engineer | Platform formatting, metadata, social assets, scheduling | Researcher (feedback loop) |

## Coordination Protocol

- **Sequential pipeline**: Content flows in one direction: Researcher -> Writer -> Editor -> Publisher.
- **Handoff artifacts**: Each stage produces a structured document that the next stage consumes. No verbal handoffs.
- **Researcher** delivers: topic brief (audience, angle, keywords, 5+ sources, competitive gaps).
- **Writer** delivers: complete draft with frontmatter, code examples, and internal review notes.
- **Editor** delivers: approved draft with tracked changes resolved, code verified, SEO checklist passed.
- **Publisher** delivers: formatted content live on platform with metadata, social snippets, and analytics tracking.
- **Feedback loop**: Publisher sends performance data (views, engagement, bounce rate) back to Researcher after 7 days to inform future topic selection.

## Shared Governance

- Content calendar is the single source of truth for what is in progress and what is scheduled.
- Every piece has a target audience, a primary keyword, and a measurable goal before entering the pipeline.
- Code examples must compile and run. The Editor verifies this before approving.
- No marketing language, superlatives, or hype. Technical accuracy and clarity are the only measures of quality.
- Style guide is shared and versioned. Deviations require Editor approval.

## Escalation Path

1. Agent flags a blocker in the content calendar with a note on what is needed.
2. The previous stage agent in the pipeline addresses the blocker (e.g., Writer asks Researcher for more sources).
3. If the pipeline is stalled for more than one work session, escalate to the human content lead.
4. Factual disputes are resolved by citing primary sources. The Editor makes the final call.

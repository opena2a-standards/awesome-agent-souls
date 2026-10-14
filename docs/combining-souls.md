# Combining Souls

The real power of this taxonomy is composition. Instead of a generic "security engineer" soul, you can build a precise identity by layering dimensions.

**Example: A fintech startup pentester**

```bash
# Start with the role
cp souls/by-role/security/penetration-tester.md ./SOUL.md

# Append industry constraints (PCI-DSS, SOX, PSD2)
echo "" >> ./SOUL.md
cat souls/by-industry/fintech/fintech-agent.md >> ./SOUL.md

# Append org-type constraints (speed, runway, lean processes)
echo "" >> ./SOUL.md
cat souls/by-org-type/startup/startup-agent.md >> ./SOUL.md
```

**Example: A healthcare enterprise backend engineer**

```bash
cp souls/by-role/development/senior-backend.md ./SOUL.md
echo "" >> ./SOUL.md
cat souls/by-industry/healthcare/healthcare-agent.md >> ./SOUL.md
echo "" >> ./SOUL.md
cat souls/by-org-type/enterprise/enterprise-agent.md >> ./SOUL.md
```

**Example: A government SRE**

```bash
cp souls/by-role/devops/sre-engineer.md ./SOUL.md
echo "" >> ./SOUL.md
cat souls/by-org-type/government/government-agent.md >> ./SOUL.md
```

**Example: A fintech red team**

Fleets can be combined with industry context to create domain-aware coordinated teams:

```bash
# Start with the Red Team Ops fleet
cp -r souls/by-fleet/red-team-ops/ ./fleet/

# Layer fintech context into each agent's soul
for soul in ./fleet/*-agent.md; do
  echo "" >> "$soul"
  cat souls/by-industry/fintech/fintech-agent.md >> "$soul"
done
```

This produces a coordinated offensive security team where each agent (recon, exploit, pivot, report) understands PCI-DSS, SOX, and financial system attack surfaces.

After combining, review the merged files to resolve any conflicting instructions and sign them with `guard sign --files`, followed by their paths.

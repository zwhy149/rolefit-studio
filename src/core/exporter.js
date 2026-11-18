/**
 * ATS-safe single-column Markdown, Plain-Text, and Scorecard export formatters.
 */

export function exportAtsResume(resumeText, format = 'markdown') {
  const clean = String(resumeText || '').replace(/\r\n/g, '\n').trim();
  if (format === 'plain') {
    return clean
      .replace(/^#{1,4}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^\s*[-•*▪▸]\s+/gm, '- ');
  }
  return clean;
}

export function buildScorecardMarkdown(analysis, aiInsights = null) {
  const { matchScore, grade, breakdown, job, keywords, topPriorities, bulletAudits } = analysis;
  const lines = [
    `# RoleFit Studio — ATS Match Scorecard`,
    ``,
    `- **Target Role:** ${job.roleTitle} @ ${job.company} (${job.workMode})`,
    `- **Overall Match Score:** **${matchScore}/100** (${grade})`,
    `- **Sub-Scores:** Hard Skills ${breakdown.hardSkills}% · Must-Haves ${breakdown.mustHaveAlignment}% · XYZ Impact ${breakdown.impactQuantification}% · ATS Readiness ${breakdown.atsReadiness}%`,
    ``,
    `## Keyword Coverage`,
    `- **Matched Must-Haves (${keywords.matchedMustHave.length}):** ${keywords.matchedMustHave.map((s) => s.label).join(', ') || 'None'}`,
    `- **Missing Must-Haves (${keywords.missingMustHave.length}):** ${keywords.missingMustHave.map((s) => s.label).join(', ') || 'None — 100% covered!'}`,
    `- **Missing Bonus Skills (${keywords.missingPreferred.length}):** ${keywords.missingPreferred.map((s) => s.label).join(', ') || 'None'}`,
    ``,
    `## Priority Action Plan`,
    ...topPriorities.map((p, idx) => `${idx + 1}. **[${p.severity.toUpperCase()}] ${p.title}** — ${p.detail}`),
    ``,
    `## Experience Bullet Audit (${bulletAudits.length} bullets analyzed)`,
    ...bulletAudits.slice(0, 6).map(
      (b) => `- \`[${b.score}/100]\` ${b.text}${b.issues.length ? `\n  - *Fix:* ${b.issues[0]}` : ''}`,
    ),
  ];

  if (aiInsights?.executiveSummary) {
    lines.push(``, `## AI Hiring-Bar Verdict`, aiInsights.executiveSummary);
  }
  if (aiInsights?.companyBrief) {
    lines.push(``, `## Live Company & Role Intelligence`, aiInsights.companyBrief);
  }
  if (aiInsights?.outreachNote) {
    lines.push(``, `## Tailored Hiring Manager Outreach`, aiInsights.outreachNote);
  }

  return `${lines.join('\n')}\n`;
}

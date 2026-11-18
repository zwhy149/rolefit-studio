/**
 * Deterministic ATS Match, Job Posting Parser & XYZ Resume Bullet Engine.
 * Zero external dependencies — runs identically in browser ESM and Anna Executa Node.js.
 */

import {
  BUZZWORD_CLICHES,
  SECTION_PATTERNS,
  SKILL_CATALOG,
  STRONG_ACTION_VERBS,
  WEAK_OPENERS,
} from './taxonomy.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAliasRegex(alias) {
  const escaped = escapeRegex(alias.trim());
  const startsWord = /^[A-Za-z0-9]/.test(alias);
  const endsWord = /[A-Za-z0-9]$/.test(alias);
  const prefix = startsWord ? '(?:^|[^A-Za-z0-9_+#.])' : '(?:^|\\s|[([,/|-])';
  const suffix = endsWord ? '(?=$|[^A-Za-z0-9_+#])' : '(?=$|\\s|[)\\].,;/|-])';
  return new RegExp(`${prefix}(${escaped})${suffix}`, 'i');
}

const COMPILED_SKILLS = SKILL_CATALOG.map((item) => ({
  ...item,
  matchers: item.aliases.map((alias) => ({ alias, regex: buildAliasRegex(alias) })),
}));

export function detectSkills(text) {
  const normalized = String(text || '');
  if (!normalized.trim()) return [];
  const found = [];
  for (const skill of COMPILED_SKILLS) {
    let matchedAlias = null;
    for (const m of skill.matchers) {
      if (m.regex.test(normalized)) {
        matchedAlias = m.alias;
        break;
      }
    }
    if (matchedAlias) {
      found.push({
        id: skill.id,
        label: skill.label,
        category: skill.category,
        matchedAs: matchedAlias,
      });
    }
  }
  return found;
}

const DYNAMIC_STOPWORDS = new Set([
  'about', 'above', 'across', 'after', 'agile', 'ability', 'anna', 'applicant', 'application',
  'apply', 'background', 'based', 'benefits', 'between', 'bonus', 'build', 'building',
  'business', 'candidate', 'career', 'closely', 'collaboration', 'collaborative', 'company',
  'competitive', 'computer', 'culture', 'customer', 'customers', 'daily', 'degree', 'deliver',
  'dental', 'department', 'design', 'develop', 'developer', 'development', 'digital', 'direct',
  'diverse', 'drive', 'driving', 'early', 'education', 'employment', 'engineer', 'engineering',
  'english', 'ensure', 'environment', 'equal', 'equity', 'every', 'excellent', 'experience',
  'experienced', 'fast', 'flexible', 'focus', 'focused', 'founder', 'founding', 'friday',
  'full', 'global', 'good', 'great', 'group', 'growing', 'growth', 'hands', 'health', 'help',
  'helping', 'high', 'highly', 'hiring', 'hybrid', 'ideal', 'impact', 'implement', 'include',
  'including', 'industry', 'information', 'innovation', 'innovative', 'insurance', 'internal',
  'interview', 'join', 'joining', 'junior', 'knowledge', 'large', 'lead', 'leader', 'leading',
  'learn', 'learning', 'level', 'life', 'location', 'looking', 'maintain', 'make', 'making',
  'manage', 'management', 'manager', 'market', 'medical', 'member', 'members', 'million',
  'minimum', 'mission', 'modern', 'monday', 'month', 'months', 'multiple', 'must', 'national',
  'need', 'needed', 'next', 'nice', 'north', 'office', 'offering', 'open', 'opportunity',
  'optional', 'organization', 'other', 'ownership', 'paid', 'parental', 'part', 'partner',
  'partners', 'passion', 'passionate', 'people', 'performance', 'person', 'personal', 'place',
  'platform', 'plus', 'policy', 'position', 'preferred', 'prefer', 'problem', 'problems',
  'process', 'product', 'production', 'products', 'professional', 'program', 'project',
  'projects', 'provide', 'proven', 'public', 'qualifications', 'qualified', 'quality', 'range',
  'rapidly', 'related', 'remote', 'report', 'reporting', 'required', 'requirements', 'research',
  'responsibilities', 'responsibility', 'results', 'role', 'salary', 'scale', 'scaling',
  'science', 'seeking', 'self', 'senior', 'service', 'services', 'share', 'shipping', 'skills',
  'small', 'software', 'solutions', 'solve', 'solving', 'space', 'staff', 'stage', 'standard',
  'standards', 'start', 'startup', 'status', 'strong', 'success', 'successful', 'support',
  'supporting', 'system', 'systems', 'take', 'team', 'teams', 'technical', 'technology',
  'their', 'through', 'time', 'title', 'today', 'together', 'tools', 'track', 'translate',
  'understanding', 'united', 'unlimited', 'user', 'users', 'using', 'value', 'values',
  'veteran', 'vision', 'well', 'what', 'where', 'while', 'with', 'within', 'without', 'work',
  'working', 'world', 'write', 'writing', 'year', 'years', 'your',
]);

export function extractDynamicKeywords(jdText, existingSkillLabels = [], limit = 10) {
  const raw = String(jdText || '');
  if (!raw.trim()) return [];
  const knownLower = new Set(existingSkillLabels.map((s) => s.toLowerCase()));
  const counts = new Map();

  // Match capitalized tech/product terms or hyphenated domain terms (e.g., FinTech, WebRTC, HIPAA, B2B SaaS, Multi-Modal)
  const matches = raw.match(/\b(?:[A-Z][A-Za-z0-9+#.-]{2,20}|[a-z]{3,16}-[a-z]{3,16})\b/g) || [];
  for (const token of matches) {
    const clean = token.replace(/[.,;:]+$/, '');
    const lower = clean.toLowerCase();
    if (clean.length < 3 || clean.length > 24) continue;
    if (DYNAMIC_STOPWORDS.has(lower) || knownLower.has(lower)) continue;
    if (/^\d+$/.test(clean)) continue;
    const entry = counts.get(lower) || { term: clean, count: 0 };
    entry.count += 1;
    counts.set(lower, entry);
  }

  return [...counts.values()]
    .filter((item) => item.count >= 2 || /[A-Z].*[A-Z0-9+#]/.test(item.term))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit)
    .map((item) => item.term);
}

export function parseJobPosting(jdText, overrides = {}) {
  const text = String(jdText || '').replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let inferredTitle = overrides.roleTitle || '';
  let inferredCompany = overrides.company || '';

  if (!inferredTitle && lines.length > 0) {
    const first = lines[0].replace(/^#+\s*/, '');
    if (first.includes(' at ')) {
      const [t, c] = first.split(/\s+at\s+/i);
      inferredTitle = t.trim();
      inferredCompany = inferredCompany || c.split(/[|—–-]/)[0].trim();
    } else if (first.includes(' — ') || first.includes(' - ')) {
      const parts = first.split(/\s+[—–-]\s+/);
      inferredTitle = parts[0].trim();
      if (!inferredCompany && parts[1] && parts[1].length < 40) {
        inferredCompany = parts[1].trim();
      }
    } else if (first.length <= 80) {
      inferredTitle = first;
    }
  }

  if (!inferredCompany) {
    const companyMatch = text.match(/(?:Company|Organization|About)\s*:\s*([A-Z][A-Za-z0-9 .&-]{1,40})/);
    if (companyMatch) inferredCompany = companyMatch[1].trim();
  }

  // Extract required years of experience
  let requiredYears = null;
  const yearsMatches = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?years?\s+(?:of\s+)?(?:professional\s+|relevant\s+|industry\s+)?experience/gi)];
  if (yearsMatches.length > 0) {
    requiredYears = Math.min(...yearsMatches.map((m) => Number(m[1])).filter((n) => n > 0 && n <= 25));
  }

  // Extract compensation hint
  const compMatch = text.match(/\$\s?\d{2,3}(?:,\d{3}|[kK])(?:\s*[-–—to]+\s*\$\s?\d{2,3}(?:,\d{3}|[kK]))?/);
  const compensation = compMatch ? compMatch[0].trim() : null;

  // Extract work mode
  let workMode = 'Unspecified';
  if (/\bremote\b/i.test(text) && /\bhybrid\b/i.test(text)) workMode = 'Remote / Hybrid';
  else if (/\bremote\b/i.test(text)) workMode = 'Remote';
  else if (/\bhybrid\b/i.test(text)) workMode = 'Hybrid';
  else if (/\bon-?site\b|\bin-office\b/i.test(text)) workMode = 'On-site';

  // Segment lines into Must-Have vs Nice-to-Have buckets
  let bucket = 'must';
  const mustLines = [];
  const preferredLines = [];

  for (const line of lines) {
    const cleanHeader = line.replace(/^#+\s*/, '').replace(/:$/, '').trim();
    if (/^(nice\s+to\s+have|preferred(\s+qualifications)?|bonus(\s+points)?|pluses|desired|what\s+sets\s+you\s+apart)/i.test(cleanHeader)) {
      bucket = 'preferred';
      continue;
    }
    if (/^(requirements|required(\s+qualifications)?|must\s+have|what\s+you('ll)?\s+bring|minimum\s+qualifications|responsibilities|what\s+you('ll)?\s+do|about\s+the\s+role)/i.test(cleanHeader)) {
      bucket = 'must';
      continue;
    }
    if (/nice\s+to\s+have|preferred|bonus\s+if|plus\s+if/i.test(line)) {
      preferredLines.push(line);
    } else if (bucket === 'preferred') {
      preferredLines.push(line);
    } else {
      mustLines.push(line);
    }
  }

  const mustSkills = detectSkills(mustLines.join('\n'));
  const mustIds = new Set(mustSkills.map((s) => s.id));
  const preferredSkills = detectSkills(preferredLines.join('\n')).filter((s) => !mustIds.has(s.id));

  const allLabels = [...mustSkills, ...preferredSkills].map((s) => s.label);
  const dynamicTerms = extractDynamicKeywords(text, allLabels, 8);

  return {
    roleTitle: inferredTitle || 'Target Role',
    company: inferredCompany || 'Target Company',
    workMode,
    requiredYears,
    compensation,
    mustHaveSkills: mustSkills,
    preferredSkills,
    dynamicTerms,
    totalRequirementsCount: mustSkills.length + preferredSkills.length,
  };
}

export function parseResume(resumeText) {
  const raw = String(resumeText || '').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');

  const hasEmail = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(raw);
  const hasPhone = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(raw);
  const hasLinks = /(?:linkedin\.com|github\.com|https?:\/\/|[a-z0-9-]+\.(?:dev|io|me|com)\/)/i.test(raw);

  const detectedSections = new Set();
  let currentSection = 'header';
  const bullets = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const headingCandidate = trimmed.replace(/^#{1,4}\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
    for (const [secKey, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (headingCandidate.length <= 42 && pattern.test(headingCandidate)) {
        detectedSections.add(secKey);
        currentSection = secKey;
        return;
      }
    }

    const bulletMatch = trimmed.match(/^(?:[-•*▪▸]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      const content = bulletMatch[1].trim();
      // Skip tiny skill-only list items under skills section
      if (currentSection !== 'skills' && content.split(/\s+/).length >= 5) {
        bullets.push({
          index: bullets.length,
          lineNumber: idx + 1,
          section: currentSection,
          text: content,
        });
      }
    }
  });

  // Estimate years of experience from year spans (e.g., 2021 - Present, 2019 - 2022) or explicit summary
  let estimatedYears = null;
  const explicitYears = raw.match(/(\d{1,2})\+?\s+years?\s+(?:of\s+)?experience/i);
  if (explicitYears) {
    estimatedYears = Number(explicitYears[1]);
  } else {
    const currentYear = new Date().getFullYear();
    const yearMatches = [...raw.matchAll(/\b(20\d{2})\s*[-–—to]+\s*(20\d{2}|present|current|now)\b/gi)];
    if (yearMatches.length > 0) {
      const starts = yearMatches.map((m) => Number(m[1]));
      const ends = yearMatches.map((m) => (/present|current|now/i.test(m[2]) ? currentYear : Number(m[2])));
      const span = Math.max(...ends) - Math.min(...starts);
      if (span >= 0 && span <= 35) estimatedYears = Math.max(1, span);
    }
  }

  const skills = detectSkills(raw);
  const candidateName = lines.find((l) => l.trim())?.replace(/^#+\s*/, '').split(/[|—–-]/)[0]?.trim() || 'Candidate';

  return {
    candidateName,
    contact: { hasEmail, hasPhone, hasLinks },
    sections: [...detectedSections],
    bullets,
    estimatedYears,
    skills,
    wordCount: raw.trim() ? raw.trim().split(/\s+/).length : 0,
  };
}

const METRIC_REGEX = /(?:\b\d+(?:\.\d+)?\s*(?:%|x|ms|s|sec|seconds|mins?|hours?|days?|weeks?|k|m|b|tb|gb|mb|rps|qps|users|customers|clients|engineers|repos|endpoints|markets|pipelines)\b|\$\s*\d+(?:\.\d+)?\s*[kmb]?|\b(?:reduced|increased|grew|lifted|cut|saved|improved|accelerated)\b[^.]{0,40}\b\d+)/i;

export function auditBullets(input, targetSkillLabels = []) {
  const bullets = Array.isArray(input)
    ? input.map((b, idx) => (typeof b === 'string' ? { index: idx, lineNumber: idx + 1, text: b } : b))
    : parseResume(input).bullets;

  const targetLower = targetSkillLabels.map((s) => s.toLowerCase());
  const seenOpeners = new Map();

  return bullets.map((bullet) => {
    const text = String(bullet.text || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const firstWordRaw = (words[0] || '').toLowerCase().replace(/[^a-z-]/g, '');

    let score = 50;
    const issues = [];
    const strengths = [];

    // 1. Action Verb Check (X / Z)
    const hasWeakOpener = WEAK_OPENERS.some((rx) => rx.test(text));
    const hasStrongVerb = STRONG_ACTION_VERBS.has(firstWordRaw);

    if (hasWeakOpener) {
      score -= 20;
      issues.push('Starts with passive/weak phrasing (e.g., "Responsible for" / "Worked on") instead of an ownership verb.');
    } else if (hasStrongVerb) {
      score += 18;
      strengths.push(`Strong ownership verb ("${words[0]}")`);
    } else {
      issues.push('Consider leading with a sharper past-tense impact verb (e.g., Architected, Shipped, Reduced, Scaled).');
    }

    // Track verb repetition
    if (firstWordRaw) {
      const priorCount = seenOpeners.get(firstWordRaw) || 0;
      seenOpeners.set(firstWordRaw, priorCount + 1);
      if (priorCount >= 1) {
        score -= 6;
        issues.push(`Repeated opening verb "${words[0]}" — vary lead verbs across bullets.`);
      }
    }

    // 2. Quantification / Measurable Result (Y in XYZ)
    const hasMetric = METRIC_REGEX.test(text);
    if (hasMetric) {
      score += 24;
      strengths.push('Contains measurable outcome / scale metric');
    } else {
      score -= 14;
      issues.push('No concrete metric detected — add scope, latency, %, revenue, or volume (XYZ formula).');
    }

    // 3. Length & Skimmability (12 - 32 words optimal for 1-2 line ATS bullets)
    if (wordCount < 10) {
      score -= 12;
      issues.push(`Too brief (${wordCount} words) — lacks technical/business mechanism ("by doing Z").`);
    } else if (wordCount > 38) {
      score -= 10;
      issues.push(`Run-on bullet (${wordCount} words) — split or tighten to <= 32 words for 6-second recruiter scan.`);
    } else {
      score += 8;
      strengths.push(`Optimal scan length (${wordCount} words)`);
    }

    // 4. Buzzwords / Clichés
    const lowerText = text.toLowerCase();
    const hitCliches = BUZZWORD_CLICHES.filter((c) => lowerText.includes(c));
    if (hitCliches.length > 0) {
      score -= 12;
      issues.push(`Contains vague cliché (${hitCliches.join(', ')}) — replace with concrete evidence.`);
    }

    // 5. JD Keyword Anchoring
    const matchedTargets = targetLower.filter((kw) => lowerText.includes(kw));
    if (matchedTargets.length > 0) {
      score += Math.min(10, matchedTargets.length * 5);
      strengths.push(`Aligns with JD terms (${matchedTargets.slice(0, 3).join(', ')})`);
    }

    const clampedScore = Math.max(10, Math.min(100, Math.round(score)));
    const tier = clampedScore >= 82 ? 'strong' : clampedScore >= 60 ? 'moderate' : 'needs_work';

    return {
      index: bullet.index,
      lineNumber: bullet.lineNumber,
      section: bullet.section || 'experience',
      text,
      wordCount,
      score: clampedScore,
      tier,
      hasMetric,
      hasStrongVerb,
      hasWeakOpener,
      matchedTargets,
      issues,
      strengths,
    };
  });
}

export function analyzeMatch({ resumeText, jdText, roleTitle, company }) {
  const jd = parseJobPosting(jdText, { roleTitle, company });
  const resume = parseResume(resumeText);

  const resumeSkillIds = new Set(resume.skills.map((s) => s.id));
  const resumeLower = String(resumeText || '').toLowerCase();

  const matchedMustHave = jd.mustHaveSkills.filter((s) => resumeSkillIds.has(s.id));
  const missingMustHave = jd.mustHaveSkills.filter((s) => !resumeSkillIds.has(s.id));

  const matchedPreferred = jd.preferredSkills.filter((s) => resumeSkillIds.has(s.id));
  const missingPreferred = jd.preferredSkills.filter((s) => !resumeSkillIds.has(s.id));

  const matchedDynamic = jd.dynamicTerms.filter((term) => resumeLower.includes(term.toLowerCase()));
  const missingDynamic = jd.dynamicTerms.filter((term) => !resumeLower.includes(term.toLowerCase()));

  const allJdLabels = [
    ...jd.mustHaveSkills.map((s) => s.label),
    ...jd.preferredSkills.map((s) => s.label),
    ...jd.dynamicTerms,
  ];
  const bulletAudits = auditBullets(resume.bullets, allJdLabels);

  // Sub-score 1: Hard Skills & Domain Coverage (0-100, weight 45%)
  const totalWeightedSkills =
    jd.mustHaveSkills.length * 2.2 +
    jd.preferredSkills.length * 1.0 +
    jd.dynamicTerms.length * 0.6;

  const earnedWeightedSkills =
    matchedMustHave.length * 2.2 +
    matchedPreferred.length * 1.0 +
    matchedDynamic.length * 0.6;

  const hardSkillsScore = totalWeightedSkills > 0
    ? Math.round((earnedWeightedSkills / totalWeightedSkills) * 100)
    : resume.skills.length > 0 ? 78 : 40;

  // Sub-score 2: Must-Have Requirement Coverage (0-100, weight 25%)
  const mustHaveScore = jd.mustHaveSkills.length > 0
    ? Math.round((matchedMustHave.length / jd.mustHaveSkills.length) * 100)
    : hardSkillsScore;

  // Sub-score 3: XYZ Impact & Bullet Quality (0-100, weight 20%)
  const impactScore = bulletAudits.length > 0
    ? Math.round(bulletAudits.reduce((acc, b) => acc + b.score, 0) / bulletAudits.length)
    : 35;

  // Sub-score 4: ATS Structure & Seniority Readiness (0-100, weight 10%)
  let atsReadiness = 0;
  if (resume.contact.hasEmail) atsReadiness += 20;
  if (resume.contact.hasLinks) atsReadiness += 15;
  if (resume.sections.includes('experience')) atsReadiness += 25;
  if (resume.sections.includes('skills')) atsReadiness += 15;
  if (resume.sections.includes('education') || resume.sections.includes('projects')) atsReadiness += 15;

  let seniorityStatus = 'aligned';
  if (jd.requiredYears && resume.estimatedYears !== null) {
    if (resume.estimatedYears >= jd.requiredYears) {
      atsReadiness += 10;
      seniorityStatus = 'meets_or_exceeds';
    } else if (jd.requiredYears - resume.estimatedYears <= 1) {
      atsReadiness += 7;
      seniorityStatus = 'close_stretch';
    } else {
      atsReadiness += 3;
      seniorityStatus = 'gap';
    }
  } else {
    atsReadiness += 8;
  }
  atsReadiness = Math.min(100, atsReadiness);

  const matchScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        hardSkillsScore * 0.45 +
        mustHaveScore * 0.25 +
        impactScore * 0.20 +
        atsReadiness * 0.10,
      ),
    ),
  );

  const grade =
    matchScore >= 82
      ? 'Strong Fit'
      : matchScore >= 66
        ? 'Competitive'
        : matchScore >= 48
          ? 'Partial Fit'
          : 'Needs Tailoring';

  // Actionable top priorities
  const topPriorities = [];
  if (missingMustHave.length > 0) {
    topPriorities.push({
      severity: 'high',
      title: `Address ${missingMustHave.length} missing must-have skill${missingMustHave.length > 1 ? 's' : ''}`,
      detail: `If you have real experience with ${missingMustHave.slice(0, 4).map((s) => s.label).join(', ')}, weave exact terms into both Experience bullets and Skills.`,
    });
  }
  const unquantifiedCount = bulletAudits.filter((b) => !b.hasMetric).length;
  if (unquantifiedCount > 0) {
    topPriorities.push({
      severity: unquantifiedCount >= 3 ? 'high' : 'medium',
      title: `Quantify ${unquantifiedCount} experience bullet${unquantifiedCount > 1 ? 's' : ''} using XYZ format`,
      detail: 'Add concrete scope, latency, conversion, revenue, or time-saved metrics so recruiters see measurable outcomes.',
    });
  }
  const weakOpenerCount = bulletAudits.filter((b) => b.hasWeakOpener).length;
  if (weakOpenerCount > 0) {
    topPriorities.push({
      severity: 'medium',
      title: `Replace ${weakOpenerCount} passive bullet opener${weakOpenerCount > 1 ? 's' : ''}`,
      detail: 'Swap "Responsible for / Worked on / Helped with" for direct ownership verbs (Architected, Shipped, Reduced, Scaled).',
    });
  }
  if (!resume.sections.includes('skills')) {
    topPriorities.push({
      severity: 'medium',
      title: 'Add a dedicated ATS "Skills" section',
      detail: 'Standard section headers ("Experience", "Skills", "Education") improve Workday/Greenhouse/Lever parser recall.',
    });
  }
  if (missingPreferred.length > 0) {
    topPriorities.push({
      severity: 'low',
      title: `Bonus differentiators available (${missingPreferred.slice(0, 3).map((s) => s.label).join(', ')})`,
      detail: 'Mentioning relevant bonus tools in project or experience context lifts shortlist ranking.',
    });
  }

  return {
    matchScore,
    grade,
    breakdown: {
      hardSkills: hardSkillsScore,
      mustHaveAlignment: mustHaveScore,
      impactQuantification: impactScore,
      atsReadiness,
    },
    job: jd,
    resume: {
      candidateName: resume.candidateName,
      wordCount: resume.wordCount,
      estimatedYears: resume.estimatedYears,
      sections: resume.sections,
      contact: resume.contact,
      detectedSkillsCount: resume.skills.length,
    },
    seniority: {
      status: seniorityStatus,
      requiredYears: jd.requiredYears,
      candidateYears: resume.estimatedYears,
    },
    keywords: {
      matchedMustHave,
      missingMustHave,
      matchedPreferred,
      missingPreferred,
      matchedDynamic,
      missingDynamic,
    },
    bulletAudits,
    weakestBullets: [...bulletAudits].sort((a, b) => a.score - b.score).slice(0, 5),
    topPriorities,
  };
}

export function replaceBulletInResume(resumeText, originalBulletText, newBulletText) {
  const lines = String(resumeText || '').split(/\r?\n/);
  const targetTrimmed = String(originalBulletText || '').trim();
  const cleanNew = String(newBulletText || '').replace(/^(?:[-•*▪▸]|\d+\.)\s+/, '').trim();

  let replaced = false;
  const updated = lines.map((line) => {
    if (replaced) return line;
    const match = line.match(/^(\s*(?:[-•*▪▸]|\d+\.)\s+)(.+)$/);
    if (match && match[2].trim() === targetTrimmed) {
      replaced = true;
      return `${match[1]}${cleanNew}`;
    }
    return line;
  });

  return {
    replaced,
    resumeText: updated.join('\n'),
  };
}

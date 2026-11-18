import {
  PRESET_SCENARIOS,
  analyzeMatch,
  buildScorecardMarkdown,
  exportAtsResume,
  replaceBulletInResume,
} from './core/index.js';
import { StudioHostBridge } from './anna-bridge.js';

const I18N = {
  en: {
    subtitle: 'AI-Native ATS Skill-Gap Scoring, Live Company Intel & Grounded XYZ Bullet Tailoring',
    annaConnected: 'Anna AI OS Connected',
    standaloneMode: 'Local-First Mode',
    presets: 'Quick Sample Roles:',
    inputsTitle: 'Resume & Target Job Posting',
    uploadResume: 'Import .md/.txt',
    roleLabel: 'Target Role Title',
    companyLabel: 'Company Name',
    jdLabel: 'Job Description (Paste text or fetch URL via Anna Web)',
    fetchBtn: 'Fetch URL',
    resumeLabel: 'Your Master Resume (Markdown or Plain Text)',
    analyzeBtn: 'Analyze Match & AI Tailor',
    saveTrackerBtn: 'Save to Tracker',
    tabMatch: 'Match & Skills',
    tabBullets: 'XYZ Bullet Diffs',
    tabIntel: 'Company Intel',
    tabPrep: 'Outreach & Interview',
    tabExport: 'Tracker & Export',
  },
  zh: {
    subtitle: 'AI 原生 ATS 简历匹配度评分、实时公司情报与真实证据驱动的 XYZ 要点精修工作台',
    annaConnected: '已连接 Anna AI OS',
    standaloneMode: '本地隐私模式',
    presets: '一键示例岗位：',
    inputsTitle: '主简历与目标岗位 JD',
    uploadResume: '导入 .md/.txt',
    roleLabel: '目标职位名称',
    companyLabel: '目标公司名称',
    jdLabel: '岗位描述 JD（直接粘贴或通过 Anna 抓取招聘链接）',
    fetchBtn: '抓取链接',
    resumeLabel: '个人主简历（支持 Markdown 或纯文本）',
    analyzeBtn: '运行匹配诊断 + AI 精修',
    saveTrackerBtn: '保存投递记录',
    tabMatch: '匹配度与技能差',
    tabBullets: 'XYZ 要点精修对比',
    tabIntel: '公司实时情报',
    tabPrep: '内推信与面试题',
    tabExport: '投递追踪与导出',
  },
};

const bridge = new StudioHostBridge();

const state = {
  lang: 'en',
  activePresetId: PRESET_SCENARIOS[0].id,
  activeTab: 'match',
  roleTitle: PRESET_SCENARIOS[0].roleTitle,
  companyName: PRESET_SCENARIOS[0].companyName,
  jdText: PRESET_SCENARIOS[0].jdText,
  resumeText: PRESET_SCENARIOS[0].resumeText,
  analysis: null,
  usedExecuta: false,
  aiRewrites: [],
  executiveSummary: '',
  companyIntel: null,
  prepKit: null,
  savedApplications: [],
  busy: false,
};

const el = (id) => document.getElementById(id);

function showToast(msg, kind = 'info') {
  const node = el('statusToast');
  if (!node) return;
  node.textContent = msg;
  node.className = `status-toast ${kind}`;
}

function clearToast() {
  const node = el('statusToast');
  if (node) node.className = 'status-toast hidden';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyLocaleLabels() {
  const t = I18N[state.lang] || I18N.en;
  el('brandSubtitle').textContent = t.subtitle;
  el('runtimeBadgeText').textContent = bridge.connected ? t.annaConnected : t.standaloneMode;
  el('presetLabel').textContent = t.presets;
  el('inputsPanelTitle').textContent = t.inputsTitle;
  el('uploadResumeBtn').textContent = t.uploadResume;
  el('roleTitleLabel').textContent = t.roleLabel;
  el('companyNameLabel').textContent = t.companyLabel;
  el('jdFieldLabel').textContent = t.jdLabel;
  el('fetchUrlBtn').textContent = t.fetchBtn;
  el('resumeFieldLabel').textContent = t.resumeLabel;
  el('runAnalyzeBtn').textContent = t.analyzeBtn;
  el('saveAppBtn').textContent = t.saveTrackerBtn;
  el('tabBtnMatch').textContent = t.tabMatch;
  el('tabBtnBullets').textContent = t.tabBullets;
  el('tabBtnIntel').textContent = t.tabIntel;
  el('tabBtnPrep').textContent = t.tabPrep;
  el('tabBtnExport').textContent = t.tabExport;
  el('langToggleBtn').textContent = state.lang === 'en' ? '中文' : 'EN';
}

function renderPresetButtons() {
  const wrap = el('presetButtons');
  wrap.innerHTML = PRESET_SCENARIOS.map(
    (p) =>
      `<button type="button" class="btn btn-preset ${state.activePresetId === p.id ? 'active' : ''}" data-preset="${escapeHtml(p.id)}">${escapeHtml(p.label)} · <small>${escapeHtml(p.badge)}</small></button>`,
  ).join('');
  wrap.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const found = PRESET_SCENARIOS.find((s) => s.id === btn.dataset.preset);
      if (!found) return;
      state.activePresetId = found.id;
      state.roleTitle = found.roleTitle;
      state.companyName = found.companyName;
      state.jdText = found.jdText;
      state.resumeText = found.resumeText;
      state.aiRewrites = [];
      state.executiveSummary = '';
      state.companyIntel = null;
      state.prepKit = null;
      syncInputsFromState();
      runDeterministicScoreOnly();
      renderPresetButtons();
      showToast(`Loaded sample role: ${found.roleTitle} @ ${found.companyName}`, 'info');
    });
  });
}

function syncInputsFromState() {
  el('roleTitleInput').value = state.roleTitle;
  el('companyNameInput').value = state.companyName;
  el('jdInput').value = state.jdText;
  el('resumeInput').value = state.resumeText;
}

function pullStateFromInputs() {
  state.roleTitle = el('roleTitleInput').value.trim();
  state.companyName = el('companyNameInput').value.trim();
  state.jdText = el('jdInput').value;
  state.resumeText = el('resumeInput').value;
}

function runDeterministicScoreOnly() {
  pullStateFromInputs();
  state.analysis = analyzeMatch({
    resumeText: state.resumeText,
    jdText: state.jdText,
    roleTitle: state.roleTitle,
    company: state.companyName,
  });
  if (!state.roleTitle && state.analysis.job.roleTitle) {
    state.roleTitle = state.analysis.job.roleTitle;
    el('roleTitleInput').value = state.roleTitle;
  }
  if (!state.companyName && state.analysis.job.company) {
    state.companyName = state.analysis.job.company;
    el('companyNameInput').value = state.companyName;
  }
  renderWorkspace();
}

function buildFallbackBulletSuggestions(analysis) {
  const missing = [
    ...analysis.keywords.missingMustHave.map((s) => s.label),
    ...analysis.keywords.missingPreferred.map((s) => s.label),
  ];
  return analysis.weakestBullets.slice(0, 3).map((b, idx) => {
    const kwHint = missing[idx] ? ` leveraging ${missing[idx]}` : '';
    const cleaned = b.text
      .replace(/^(?:responsible\s+for|worked\s+on|helped\s+(?:with|to)?|assisted\s+(?:in|with)|participated\s+in)\s+/i, '')
      .replace(/\.$/, '');
    const cap = cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : b.text;
    const upgraded = b.hasMetric
      ? `Engineered and scaled ${cap.charAt(0).toLowerCase() + cap.slice(1)}${kwHint}, improving team delivery velocity and production reliability.`
      : `Spearheaded ${cap.charAt(0).toLowerCase() + cap.slice(1)}${kwHint}, reducing manual turnaround by [X%] across [N] monthly workflows.`;
    return {
      original: b.text,
      rewritten: upgraded,
      rationale: bridge.connected
        ? 'XYZ structural upgrade grounded in existing resume context.'
        : 'Deterministic XYZ scaffold — replace [X%] / [N] with your true metrics (or run inside Anna AI OS for LLM tailoring).',
    };
  });
}

async function runFullAnalysisAndAiTailor() {
  if (state.busy) return;
  pullStateFromInputs();
  if (!state.jdText.trim() || !state.resumeText.trim()) {
    showToast('Please provide both a Job Description and your Resume text.', 'error');
    return;
  }

  state.busy = true;
  el('runAnalyzeBtn').disabled = true;
  showToast('Running ATS skill-gap scoring & grounded AI tailoring…', 'info');

  try {
    // 1. Try bundled Executa engine first when running on Anna AI OS, with deterministic core fallback
    try {
      const execRes = await bridge.invokeEngine('analyze_match', {
        resumeText: state.resumeText,
        jdText: state.jdText,
        roleTitle: state.roleTitle,
        company: state.companyName,
      });
      if (execRes.usedExecuta && execRes.data) {
        state.analysis = execRes.data;
        state.usedExecuta = true;
      } else {
        state.analysis = analyzeMatch({
          resumeText: state.resumeText,
          jdText: state.jdText,
          roleTitle: state.roleTitle,
          company: state.companyName,
        });
        state.usedExecuta = false;
      }
    } catch {
      state.analysis = analyzeMatch({
        resumeText: state.resumeText,
        jdText: state.jdText,
        roleTitle: state.roleTitle,
        company: state.companyName,
      });
      state.usedExecuta = false;
    }

    await bridge.updateWindowTitle(`RoleFit (${state.analysis.matchScore}/100) — ${state.analysis.job.roleTitle}`);

    // 2. Run Anna Host LLM grounded bullet tailoring + hiring-bar executive summary
    if (bridge.connected) {
      const weakBullets = state.analysis.weakestBullets.slice(0, 4).map((b) => b.text);
      const missingMust = state.analysis.keywords.missingMustHave.map((s) => s.label);
      const sys = [
        'You are RoleFit Coach, a principal recruiter and evidence-grounded resume strategist.',
        'STRICT INTEGRITY RULE: Never fabricate employers, degrees, or fake numbers. If a bullet needs a metric not in the resume, insert a bracketed placeholder like [X%] or [N users] so the candidate fills their real figure.',
        'Return ONLY valid JSON with keys:',
        '{"executiveSummary": "2-3 crisp sentences on candidate fit & #1 positioning lever", "rewrites": [{"original": "exact original bullet string", "rewritten": "XYZ-formula upgraded bullet <= 30 words", "rationale": "1 short sentence why this improves ATS/recruiter signal"}]}',
      ].join('\n');

      const usr = JSON.stringify({
        targetRole: state.analysis.job.roleTitle,
        company: state.analysis.job.company,
        matchScore: state.analysis.matchScore,
        missingMustHaveSkills: missingMust,
        weakestBullets: weakBullets,
        resumeExcerpt: state.resumeText.slice(0, 4500),
      });

      const { data } = await bridge.completeJson(sys, usr, 2200);
      state.executiveSummary = String(data?.executiveSummary || '').trim();
      state.aiRewrites = Array.isArray(data?.rewrites) && data.rewrites.length > 0
        ? data.rewrites
        : buildFallbackBulletSuggestions(state.analysis);
      showToast(
        `Analysis complete: ${state.analysis.matchScore}/100 (${state.analysis.grade}) · AI generated ${state.aiRewrites.length} grounded bullet upgrades.`,
        'success',
      );
    } else {
      state.executiveSummary = `Deterministic ATS audit complete (${state.analysis.matchScore}/100 — ${state.analysis.grade}). Matched ${state.analysis.keywords.matchedMustHave.length} must-have skills and flagged ${state.analysis.keywords.missingMustHave.length} gaps.`;
      state.aiRewrites = buildFallbackBulletSuggestions(state.analysis);
      showToast(
        `Local ATS audit complete: ${state.analysis.matchScore}/100 (${state.analysis.grade}). Open inside Anna AI OS for live LLM rewrites & company web research.`,
        'success',
      );
    }

    await bridge.saveState(state);
    renderWorkspace();
  } catch (err) {
    state.aiRewrites = buildFallbackBulletSuggestions(state.analysis || analyzeMatch({
      resumeText: state.resumeText,
      jdText: state.jdText,
    }));
    renderWorkspace();
    showToast(`Scored locally (${state.analysis?.matchScore ?? '--'}/100). AI note: ${err.message}`, 'info');
  } finally {
    state.busy = false;
    el('runAnalyzeBtn').disabled = false;
  }
}

async function runCompanyIntel() {
  if (state.busy) return;
  pullStateFromInputs();
  const company = state.companyName || state.analysis?.job?.company || 'Target Company';
  const role = state.roleTitle || state.analysis?.job?.roleTitle || 'Target Role';

  state.busy = true;
  renderWorkspace();
  showToast(`Researching ${company} via Anna Web Search & Host LLM…`, 'info');

  try {
    if (bridge.connected) {
      let sources = [];
      try {
        sources = await bridge.searchCompanyWeb(company, role);
      } catch {
        sources = [];
      }

      const sys = [
        'You are an executive career intelligence analyst.',
        'Synthesize web search snippets and the job description into an actionable candidate brief.',
        'Return ONLY valid JSON: {"companySnapshot": "paragraph on product, momentum, and engineering/product culture", "whatHiringManagerCaresAbout": ["point 1", "point 2", "point 3"], "smartQuestionsToAsk": ["high-signal reverse-interview question 1", "question 2", "question 3"]}',
      ].join('\n');

      const usr = JSON.stringify({
        company,
        role,
        webSearchResults: sources.slice(0, 6),
        jdExcerpt: state.jdText.slice(0, 3000),
      });

      const { data } = await bridge.completeJson(sys, usr, 2000);
      state.companyIntel = {
        companySnapshot: data.companySnapshot || '',
        priorities: Array.isArray(data.whatHiringManagerCaresAbout) ? data.whatHiringManagerCaresAbout : [],
        questions: Array.isArray(data.smartQuestionsToAsk) ? data.smartQuestionsToAsk : [],
        sources,
      };
      showToast(`Live company intelligence ready for ${company}.`, 'success');
    } else {
      const jd = state.analysis?.job || { mustHaveSkills: [], workMode: 'Unspecified' };
      state.companyIntel = {
        companySnapshot: `${company} is hiring for ${role} (${jd.workMode}). Based on the JD structure, the team prioritizes immediate ownership in ${jd.mustHaveSkills.slice(0, 4).map((s) => s.label).join(', ') || 'core domain execution'}. Run inside Anna AI OS to enrich with live web news via anna.web.search.`,
        priorities: [
          `Demonstrated production ownership across ${jd.mustHaveSkills.slice(0, 3).map((s) => s.label).join(', ') || 'core stack'}.`,
          'Clear metric-backed impact stories rather than responsibilities-only descriptions.',
          'Ability to ship iteratively across cross-functional engineering, product, and GTM stakeholders.',
        ],
        questions: [
          `What is the #1 bottleneck on the ${role} roadmap over the next 90 days that this hire will own?`,
          `How does ${company} measure success at the 6-month mark for this role?`,
          'What trade-offs has the team recently made between shipping velocity and platform reliability?',
        ],
        sources: [],
      };
      showToast('Generated structured JD role brief (connect Anna AI OS for live web search citations).', 'info');
    }
  } catch (err) {
    showToast(`Company intel error: ${err.message}`, 'error');
  } finally {
    state.busy = false;
    renderWorkspace();
  }
}

async function runOutreachAndInterviewKit() {
  if (state.busy) return;
  pullStateFromInputs();
  if (!state.analysis) runDeterministicScoreOnly();

  state.busy = true;
  renderWorkspace();
  showToast('Generating tailored Hiring Manager DM & 5-question interview rubric…', 'info');

  try {
    const company = state.analysis.job.company;
    const role = state.analysis.job.roleTitle;
    const topMatched = state.analysis.keywords.matchedMustHave.slice(0, 5).map((s) => s.label);

    if (bridge.connected) {
      const sys = [
        'You are a top tech/SaaS hiring manager and interview coach.',
        'Ground every point strictly in the candidate resume and JD. Keep outreach under 110 words, direct, high-signal, zero fluff.',
        'Return ONLY valid JSON: {"coldDm": "<110 word LinkedIn/email note to hiring manager", "coverHook": "Opening paragraph for cover letter", "interviewQuestions": [{"question": "role-specific question", "whatTheyTest": "signal tested", "storyAnchor": "which experience from candidate resume to cite"}]}',
      ].join('\n');

      const usr = JSON.stringify({
        role,
        company,
        matchedSkills: topMatched,
        missingSkills: state.analysis.keywords.missingMustHave.map((s) => s.label),
        resumeText: state.resumeText.slice(0, 4000),
        jdText: state.jdText.slice(0, 3000),
      });

      const { data } = await bridge.completeJson(sys, usr, 2400);
      state.prepKit = {
        coldDm: data.coldDm || '',
        coverHook: data.coverHook || '',
        interviewQuestions: Array.isArray(data.interviewQuestions) ? data.interviewQuestions : [],
      };
      showToast('Tailored outreach & interview kit ready.', 'success');
    } else {
      state.prepKit = {
        coldDm: `Hi [Hiring Manager] — saw ${company} is hiring a ${role}. Over the past few years I've shipped production workflows across ${topMatched.slice(0, 3).join(', ') || 'this exact stack'} (including measurable latency/conversion wins on my attached resume). Would love to share a quick 3-bullet breakdown of how I'd approach ${company}'s roadmap if helpful!`,
        coverHook: `I'm excited to apply for ${role} at ${company}, bringing hands-on execution across ${topMatched.join(', ') || 'your core requirements'} and a track record of shipping measurable user and business outcomes.`,
        interviewQuestions: [
          {
            question: `Walk me through the most complex system or launch you owned involving ${topMatched[0] || 'your core stack'}.`,
            whatTheyTest: 'End-to-end ownership, trade-off clarity, and real depth vs surface familiarity.',
            storyAnchor: state.analysis.bulletAudits[0]?.text || 'Anchor in your most recent quantified role bullet.',
          },
          {
            question: `How would you ramp up quickly on ${state.analysis.keywords.missingMustHave[0]?.label || 'new domain constraints'} in your first 30 days?`,
            whatTheyTest: 'Self-awareness on skill gaps and pragmatic learning velocity.',
            storyAnchor: 'Connect to an adjacent system migration or fast ramp-up from your resume.',
          },
        ],
      };
      showToast('Generated structured outreach & interview kit.', 'info');
    }
  } catch (err) {
    showToast(`Prep kit error: ${err.message}`, 'error');
  } finally {
    state.busy = false;
    renderWorkspace();
  }
}

function insertMissingSkillIntoResume(skillLabel) {
  pullStateFromInputs();
  const lines = state.resumeText.split(/\r?\n/);
  const skillHeaderIdx = lines.findIndex((l) => /^(?:#{1,4}\s*)?(?:technical\s+)?skills\b/i.test(l.trim()));

  if (skillHeaderIdx !== -1 && skillHeaderIdx + 1 < lines.length) {
    const nextLine = lines[skillHeaderIdx + 1].trim();
    if (nextLine && !nextLine.toLowerCase().includes(skillLabel.toLowerCase())) {
      lines[skillHeaderIdx + 1] = `${lines[skillHeaderIdx + 1].replace(/\s+$/, '')}, ${skillLabel}`;
    }
  } else {
    lines.push('', '## Skills', skillLabel);
  }

  state.resumeText = lines.join('\n');
  el('resumeInput').value = state.resumeText;
  runDeterministicScoreOnly();
  bridge.saveState(state);
  showToast(`Added "${skillLabel}" to your Resume Skills section & updated ATS score (${state.analysis.matchScore}/100).`, 'success');
}

function renderMatchTab(container) {
  const a = state.analysis;
  const circumference = 2 * Math.PI * 46;
  const dashOffset = circumference - (a.matchScore / 100) * circumference;

  const missingMustHtml = a.keywords.missingMustHave.length
    ? a.keywords.missingMustHave
        .map(
          (s) =>
            `<button type="button" class="skill-chip missing" data-add-skill="${escapeHtml(s.label)}" title="Click to add if you have this skill">+ ${escapeHtml(s.label)}</button>`,
        )
        .join('')
    : `<span class="skill-chip matched">✓ 100% Must-Have Skills Covered</span>`;

  const matchedMustHtml = a.keywords.matchedMustHave.length
    ? a.keywords.matchedMustHave
        .map((s) => `<span class="skill-chip matched">✓ ${escapeHtml(s.label)}</span>`)
        .join('')
    : `<span style="font-size:12px;color:var(--text-muted)">No canonical must-haves matched yet.</span>`;

  const bonusHtml = [
    ...a.keywords.matchedPreferred.map((s) => `<span class="skill-chip matched">✓ ${escapeHtml(s.label)}</span>`),
    ...a.keywords.missingPreferred.map(
      (s) =>
        `<button type="button" class="skill-chip bonus" data-add-skill="${escapeHtml(s.label)}">+ ${escapeHtml(s.label)}</button>`,
    ),
  ].join('');

  container.innerHTML = `
    <div class="score-hero">
      <div class="gauge-wrap">
        <svg class="gauge-svg" viewBox="0 0 112 112">
          <circle class="gauge-track" cx="56" cy="56" r="46"></circle>
          <circle class="gauge-fill" cx="56" cy="56" r="46" stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${dashOffset.toFixed(1)}"></circle>
        </svg>
        <div class="gauge-center">
          <span class="gauge-score">${a.matchScore}</span>
          <span class="gauge-sub">${escapeHtml(a.grade)}</span>
        </div>
      </div>
      <div class="breakdown-list">
        <div class="metric-item">
          <div class="metric-head"><span>Hard Skills (45%)</span><span>${a.breakdown.hardSkills}%</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${a.breakdown.hardSkills}%"></div></div>
        </div>
        <div class="metric-item">
          <div class="metric-head"><span>Must-Haves (25%)</span><span>${a.breakdown.mustHaveAlignment}%</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${a.breakdown.mustHaveAlignment}%"></div></div>
        </div>
        <div class="metric-item">
          <div class="metric-head"><span>XYZ Impact (20%)</span><span>${a.breakdown.impactQuantification}%</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${a.breakdown.impactQuantification}%"></div></div>
        </div>
        <div class="metric-item">
          <div class="metric-head"><span>ATS Structure (10%)</span><span>${a.breakdown.atsReadiness}%</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${a.breakdown.atsReadiness}%"></div></div>
        </div>
      </div>
    </div>

    ${
      state.executiveSummary
        ? `<div class="sub-card"><h3>Hiring-Bar Verdict ${state.usedExecuta ? '· <small style="color:var(--brand)">Executa Engine + Host LLM</small>' : ''}</h3><div class="prose-box">${escapeHtml(state.executiveSummary)}</div></div>`
        : ''
    }

    <div class="sub-card">
      <h3>Missing Must-Have Keywords (Click to insert if applicable)</h3>
      <div class="chip-wrap">${missingMustHtml}</div>
    </div>

    <div class="sub-card">
      <h3>Matched Must-Have Skills (${a.keywords.matchedMustHave.length})</h3>
      <div class="chip-wrap">${matchedMustHtml}</div>
    </div>

    ${
      bonusHtml
        ? `<div class="sub-card"><h3>Preferred / Bonus Differentiators</h3><div class="chip-wrap">${bonusHtml}</div></div>`
        : ''
    }

    <div class="sub-card">
      <h3>Priority Tailoring Actions</h3>
      <div class="priority-list">
        ${a.topPriorities
          .map(
            (p) => `
          <div class="priority-row ${escapeHtml(p.severity)}">
            <strong>${escapeHtml(p.title)}</strong>
            <span>${escapeHtml(p.detail)}</span>
          </div>`,
          )
          .join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-add-skill]').forEach((btn) => {
    btn.addEventListener('click', () => insertMissingSkillIntoResume(btn.dataset.addSkill));
  });
}

function renderBulletsTab(container) {
  const a = state.analysis;
  const rewriteMap = new Map(state.aiRewrites.map((r) => [String(r.original || '').trim(), r]));

  container.innerHTML = `
    <div class="sub-card" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;">
      <div>
        <h3 style="margin-bottom:2px;">XYZ Formula Bullet Diagnostics & AI Diffs</h3>
        <span style="font-size:12px;color:var(--text-secondary);">Google XYZ standard: Accomplished [X] as measured by [Y], by doing [Z]. Never fabricates unverified facts.</span>
      </div>
      <button type="button" class="btn btn-primary" id="retailorBulletsBtn" ${state.busy ? 'disabled' : ''}>✨ Refresh AI Bullet Diffs</button>
    </div>

    ${a.bulletAudits
      .map((b, idx) => {
        const proposal = rewriteMap.get(b.text.trim());
        return `
        <div class="bullet-card">
          <div class="bullet-top">
            <span style="font-size:12px;font-weight:700;color:var(--text-muted);">Line ${b.lineNumber} · ${b.wordCount} words</span>
            <span class="score-pill ${b.tier}">XYZ Score: ${b.score}/100</span>
          </div>
          <p class="bullet-orig">${escapeHtml(b.text)}</p>
          ${
            b.issues.length
              ? `<ul class="bullet-issues">${b.issues.map((iss) => `<li>${escapeHtml(iss)}</li>`).join('')}</ul>`
              : `<div style="font-size:12px;color:var(--success);font-weight:600;">✓ Strong ownership verb + quantified impact</div>`
          }
          ${
            proposal
              ? `
            <div class="diff-proposal">
              <div style="font-size:11.5px;font-weight:700;color:var(--brand);margin-bottom:4px;">PROPOSED GROUNDED REWRITE</div>
              <p>${escapeHtml(proposal.rewritten)}</p>
              ${proposal.rationale ? `<div class="diff-rationale">${escapeHtml(proposal.rationale)}</div>` : ''}
              <button type="button" class="btn btn-primary" data-apply-idx="${idx}">✓ Apply Rewrite to Resume</button>
            </div>`
              : ''
          }
        </div>`;
      })
      .join('')}
  `;

  el('retailorBulletsBtn')?.addEventListener('click', runFullAnalysisAndAiTailor);

  container.querySelectorAll('[data-apply-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.applyIdx);
      const bullet = a.bulletAudits[idx];
      const proposal = rewriteMap.get(bullet?.text?.trim());
      if (!bullet || !proposal) return;

      const res = replaceBulletInResume(state.resumeText, bullet.text, proposal.rewritten);
      if (res.replaced) {
        state.resumeText = res.resumeText;
        el('resumeInput').value = state.resumeText;
        state.aiRewrites = state.aiRewrites.filter((r) => r.original.trim() !== bullet.text.trim());
        runDeterministicScoreOnly();
        bridge.saveState(state);
        showToast(`Applied rewrite to Line ${bullet.lineNumber}! Updated ATS Match Score: ${state.analysis.matchScore}/100.`, 'success');
      }
    });
  });
}

function renderIntelTab(container) {
  const intel = state.companyIntel;
  container.innerHTML = `
    <div class="sub-card" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;">
      <div>
        <h3 style="margin-bottom:2px;">Live Company & Hiring-Team Intelligence</h3>
        <span style="font-size:12px;color:var(--text-secondary);">Uses Anna Web Search (<code>anna.web.search</code>) + Host LLM to research product momentum, tech stack & culture.</span>
      </div>
      <button type="button" class="btn btn-primary" id="runIntelBtn" ${state.busy ? 'disabled' : ''}>🌐 Run Live Company Intel</button>
    </div>

    ${
      intel
        ? `
      <div class="sub-card">
        <h3>Company & Role Snapshot</h3>
        <div class="prose-box">${escapeHtml(intel.companySnapshot)}</div>
      </div>
      <div class="sub-card">
        <h3>What the Hiring Manager Actually Optimizes For</h3>
        <div class="priority-list">
          ${intel.priorities.map((p) => `<div class="priority-row"><span>${escapeHtml(p)}</span></div>`).join('')}
        </div>
      </div>
      <div class="sub-card">
        <h3>High-Signal Questions to Ask Your Interviewer</h3>
        <div class="priority-list">
          ${intel.questions.map((q) => `<div class="priority-row"><strong>“${escapeHtml(q)}”</strong></div>`).join('')}
        </div>
      </div>
      ${
        intel.sources?.length
          ? `<div class="sub-card"><h3>Live Web Sources (${intel.sources.length})</h3><div class="source-links">${intel.sources
              .map(
                (s) =>
                  `<a class="source-link" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(s.title || s.url)}</strong><br/><span style="color:var(--text-secondary);font-size:11.5px;">${escapeHtml((s.snippet || '').slice(0, 160))}</span></a>`,
              )
              .join('')}</div></div>`
          : ''
      }`
        : `<div class="sub-card"><p style="margin:0;color:var(--text-secondary);">Click <strong>Run Live Company Intel</strong> above to research <strong>${escapeHtml(state.companyName || state.analysis?.job?.company || 'this company')}</strong> and generate high-signal reverse-interview questions.</p></div>`
    }
  `;

  el('runIntelBtn')?.addEventListener('click', runCompanyIntel);
}

function renderPrepTab(container) {
  const kit = state.prepKit;
  container.innerHTML = `
    <div class="sub-card" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;">
      <div>
        <h3 style="margin-bottom:2px;">Hiring Manager Cold DM & Role-Specific Interview Prep</h3>
        <span style="font-size:12px;color:var(--text-secondary);">Generates non-cringe <110-word outreach + likely technical/behavioral questions anchored to your real resume.</span>
      </div>
      <button type="button" class="btn btn-primary" id="runPrepBtn" ${state.busy ? 'disabled' : ''}>🎯 Generate Outreach & Prep Kit</button>
    </div>

    ${
      kit
        ? `
      <div class="sub-card">
        <div class="field-label-row" style="margin-bottom:6px;">
          <h3 style="margin:0;">Hiring Manager Cold DM / Email (<110 words)</h3>
          <button type="button" class="btn btn-soft" id="copyDmBtn">Copy DM</button>
        </div>
        <div class="prose-box">${escapeHtml(kit.coldDm)}</div>
      </div>
      <div class="sub-card">
        <h3>Cover Letter Opening Hook</h3>
        <div class="prose-box">${escapeHtml(kit.coverHook)}</div>
      </div>
      <div class="sub-card">
        <h3>Likely Interview Questions & Resume Story Anchors</h3>
        ${kit.interviewQuestions
          .map(
            (q, i) => `
          <div class="bullet-card">
            <p class="bullet-orig"><strong>Q${i + 1}: ${escapeHtml(q.question)}</strong></p>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;"><strong>Signal tested:</strong> ${escapeHtml(q.whatTheyTest)}</div>
            <div style="font-size:12px;color:var(--brand);"><strong>Your story anchor:</strong> ${escapeHtml(q.storyAnchor)}</div>
          </div>`,
          )
          .join('')}
      </div>`
        : `<div class="sub-card"><p style="margin:0;color:var(--text-secondary);">Click <strong>Generate Outreach & Prep Kit</strong> to draft a concise hiring-manager note and role-specific interview rubric.</p></div>`
    }
  `;

  el('runPrepBtn')?.addEventListener('click', runOutreachAndInterviewKit);
  el('copyDmBtn')?.addEventListener('click', async () => {
    if (!kit?.coldDm) return;
    await navigator.clipboard?.writeText(kit.coldDm);
    showToast('Copied Cold DM to clipboard!', 'success');
  });
}

function renderExportTab(container) {
  const scorecardMd = buildScorecardMarkdown(state.analysis, {
    executiveSummary: state.executiveSummary,
    companyBrief: state.companyIntel?.companySnapshot,
    outreachNote: state.prepKit?.coldDm,
  });

  container.innerHTML = `
    <div class="sub-card">
      <h3>Export Tailored Resume & ATS Report</h3>
      <div class="cta-bar">
        <button type="button" class="btn btn-primary" id="downloadMdBtn">⬇ Download Resume (.md)</button>
        <button type="button" class="btn" id="downloadTxtBtn">⬇ Plain ATS (.txt)</button>
        <button type="button" class="btn" id="downloadReportBtn">⬇ Match Scorecard (.md)</button>
        <button type="button" class="btn btn-soft" id="sendChatArtifactBtn">💬 Send Card to Anna Chat</button>
      </div>
    </div>

    <div class="sub-card">
      <h3>Saved Job Applications (${state.savedApplications.length})</h3>
      ${
        state.savedApplications.length
          ? state.savedApplications
              .map(
                (item, idx) => `
            <div class="tracker-row">
              <div>
                <strong>${escapeHtml(item.roleTitle)} @ ${escapeHtml(item.companyName)}</strong>
                <div style="font-size:12px;color:var(--text-muted);">Score: ${item.matchScore}/100 (${escapeHtml(item.grade)}) · Saved ${escapeHtml(item.savedDate)}</div>
              </div>
              <div style="display:flex;gap:6px;">
                <button type="button" class="btn" data-load-saved="${idx}">Load</button>
                <button type="button" class="btn" data-del-saved="${idx}">✕</button>
              </div>
            </div>`,
              )
              .join('')
          : `<p style="margin:0;font-size:12.5px;color:var(--text-muted);">No saved applications yet. Click <strong>Save to Tracker</strong> on the left panel to bookmark tailored versions across sessions.</p>`
      }
    </div>

    <div class="sub-card">
      <h3>Live Scorecard Preview</h3>
      <div class="prose-box">${escapeHtml(scorecardMd)}</div>
    </div>
  `;

  const triggerDownload = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  el('downloadMdBtn')?.addEventListener('click', () => {
    triggerDownload('tailored-resume.md', exportAtsResume(state.resumeText, 'markdown'));
    showToast('Downloaded tailored-resume.md', 'success');
  });
  el('downloadTxtBtn')?.addEventListener('click', () => {
    triggerDownload('tailored-resume-ats.txt', exportAtsResume(state.resumeText, 'plain'));
    showToast('Downloaded parser-safe tailored-resume-ats.txt', 'success');
  });
  el('downloadReportBtn')?.addEventListener('click', () => {
    triggerDownload('rolefit-scorecard.md', scorecardMd);
    showToast('Downloaded rolefit-scorecard.md', 'success');
  });
  el('sendChatArtifactBtn')?.addEventListener('click', async () => {
    const sent = await bridge.shareScorecardToChat(
      `RoleFit Match: ${state.analysis.matchScore}/100 (${state.analysis.grade}) for ${state.analysis.job.roleTitle} @ ${state.analysis.job.company}`,
      {
        roleTitle: state.analysis.job.roleTitle,
        company: state.analysis.job.company,
        matchScore: state.analysis.matchScore,
        grade: state.analysis.grade,
        missingMustHave: state.analysis.keywords.missingMustHave.map((s) => s.label),
      },
    );
    if (sent) {
      showToast('Posted RoleFit Scorecard card into your Anna conversation!', 'success');
    } else {
      await navigator.clipboard?.writeText(scorecardMd);
      showToast('Copied RoleFit Scorecard Markdown to clipboard (open inside Anna Chat to post cards directly).', 'info');
    }
  });

  container.querySelectorAll('[data-load-saved]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = state.savedApplications[Number(btn.dataset.loadSaved)];
      if (!item) return;
      state.roleTitle = item.roleTitle;
      state.companyName = item.companyName;
      state.jdText = item.jdText;
      state.resumeText = item.resumeText;
      syncInputsFromState();
      runDeterministicScoreOnly();
      showToast(`Restored saved application: ${item.roleTitle} @ ${item.companyName}`, 'info');
    });
  });

  container.querySelectorAll('[data-del-saved]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      state.savedApplications.splice(Number(btn.dataset.delSaved), 1);
      await bridge.saveState(state);
      renderWorkspace();
    });
  });
}

function renderWorkspace() {
  if (!state.analysis) return;

  ['match', 'bullets', 'intel', 'prep', 'export'].forEach((tabKey) => {
    const btn = el(`tabBtn${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
    if (btn) btn.classList.toggle('active', state.activeTab === tabKey);
  });

  const body = el('tabBody');
  if (state.activeTab === 'match') renderMatchTab(body);
  else if (state.activeTab === 'bullets') renderBulletsTab(body);
  else if (state.activeTab === 'intel') renderIntelTab(body);
  else if (state.activeTab === 'prep') renderPrepTab(body);
  else renderExportTab(body);
}

function applyIncomingPayload(payload) {
  if (!payload || typeof payload !== 'object') return;
  if (payload.jdText) state.jdText = String(payload.jdText);
  if (payload.resumeText) state.resumeText = String(payload.resumeText);
  if (payload.roleTitle) state.roleTitle = String(payload.roleTitle);
  if (payload.company || payload.companyName) state.companyName = String(payload.company || payload.companyName);
  if (payload.analysis && payload.analysis.matchScore !== undefined) {
    state.analysis = payload.analysis;
  }
  syncInputsFromState();
  runDeterministicScoreOnly();
  showToast('Synced role & resume context from Anna Assistant.', 'success');
}

async function boot() {
  await bridge.init();

  const runtimePill = el('runtimePill');
  if (bridge.connected) {
    runtimePill.classList.add('connected');
    state.lang = bridge.locale === 'zh' ? 'zh' : 'en';
  }

  bridge.onLocaleChange((lang) => {
    state.lang = lang;
    applyLocaleLabels();
  });

  bridge.onEntryPayload((payload) => applyIncomingPayload(payload));

  const persisted = await bridge.loadState();
  if (persisted) {
    if (persisted.resumeText) state.resumeText = persisted.resumeText;
    if (persisted.jdText) state.jdText = persisted.jdText;
    if (persisted.roleTitle) state.roleTitle = persisted.roleTitle;
    if (persisted.companyName) state.companyName = persisted.companyName;
    if (Array.isArray(persisted.savedApplications)) state.savedApplications = persisted.savedApplications;
  }

  const initialPayload = bridge.getInitialEntryPayload();
  if (initialPayload) {
    applyIncomingPayload(initialPayload);
  }

  applyLocaleLabels();
  renderPresetButtons();
  syncInputsFromState();
  runDeterministicScoreOnly();

  // Event listeners
  el('langToggleBtn').addEventListener('click', () => {
    state.lang = state.lang === 'en' ? 'zh' : 'en';
    applyLocaleLabels();
  });

  el('themeToggleBtn').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = cur;
  });

  el('runAnalyzeBtn').addEventListener('click', runFullAnalysisAndAiTailor);

  el('saveAppBtn').addEventListener('click', async () => {
    pullStateFromInputs();
    if (!state.analysis) runDeterministicScoreOnly();
    state.savedApplications.unshift({
      roleTitle: state.analysis.job.roleTitle,
      companyName: state.analysis.job.company,
      matchScore: state.analysis.matchScore,
      grade: state.analysis.grade,
      jdText: state.jdText,
      resumeText: state.resumeText,
      savedDate: new Date().toISOString().slice(0, 10),
    });
    state.savedApplications = state.savedApplications.slice(0, 25);
    await bridge.saveState(state);
    state.activeTab = 'export';
    renderWorkspace();
    showToast('Saved current tailored application to Tracker!', 'success');
  });

  el('fetchUrlBtn').addEventListener('click', async () => {
    const url = el('jobUrlInput').value.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      showToast('Enter a valid https:// job posting URL first.', 'error');
      return;
    }
    el('fetchUrlBtn').disabled = true;
    showToast('Fetching job posting content via Anna Host Web Fetch…', 'info');
    try {
      const page = await bridge.fetchJobUrl(url);
      state.jdText = page.content;
      if (page.title && !state.roleTitle) state.roleTitle = page.title.slice(0, 80);
      syncInputsFromState();
      runDeterministicScoreOnly();
      showToast(`Fetched job posting (${page.content.length} chars) & scored match!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      el('fetchUrlBtn').disabled = false;
    }
  });

  el('uploadResumeBtn').addEventListener('click', () => el('resumeFileInput').click());
  el('resumeFileInput').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    state.resumeText = text;
    el('resumeInput').value = text;
    runDeterministicScoreOnly();
    await bridge.saveState(state);
    showToast(`Imported ${file.name} (${text.length} chars).`, 'success');
  });

  let debounceTimer = null;
  ['jdInput', 'resumeInput', 'roleTitleInput', 'companyNameInput'].forEach((inputId) => {
    el(inputId).addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        clearToast();
        runDeterministicScoreOnly();
      }, 300);
    });
  });

  [
    ['tabBtnMatch', 'match'],
    ['tabBtnBullets', 'bullets'],
    ['tabBtnIntel', 'intel'],
    ['tabBtnPrep', 'prep'],
    ['tabBtnExport', 'export'],
  ].forEach(([btnId, tabKey]) => {
    el(btnId).addEventListener('click', () => {
      state.activeTab = tabKey;
      renderWorkspace();
    });
  });
}

boot();

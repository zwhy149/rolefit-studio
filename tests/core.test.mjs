import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  PRESET_SCENARIOS,
  analyzeMatch,
  auditBullets,
  buildScorecardMarkdown,
  exportAtsResume,
  parseJobPosting,
  replaceBulletInResume,
} from '../src/core/index.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test('parseJobPosting extracts title, company, must-have vs preferred skills, and experience years', () => {
  const scenario = PRESET_SCENARIOS[0];
  const parsed = parseJobPosting(scenario.jdText);
  assert.equal(parsed.roleTitle, 'Senior Full-Stack Engineer, AI Agents');
  assert.equal(parsed.company, 'RunwayFlow');
  assert.equal(parsed.requiredYears, 5);
  assert.ok(parsed.mustHaveSkills.some((s) => s.id === 'typescript'));
  assert.ok(parsed.mustHaveSkills.some((s) => s.id === 'ai-agents'));
  assert.ok(parsed.preferredSkills.some((s) => s.id === 'kubernetes' || s.id === 'cloudflare'));
});

test('auditBullets distinguishes strong quantified XYZ bullets from weak passive bullets', () => {
  const results = auditBullets(
    [
      'Reduced API p95 latency by 42% across 140k monthly active users by introducing Redis caching.',
      'Responsible for helping with backend API maintenance.',
    ],
    ['Redis'],
  );
  assert.equal(results.length, 2);
  assert.ok(results[0].score >= 80, `Expected high score, got ${results[0].score}`);
  assert.equal(results[0].hasMetric, true);
  assert.equal(results[0].hasStrongVerb, true);

  assert.ok(results[1].score < 50, `Expected low score, got ${results[1].score}`);
  assert.equal(results[1].hasWeakOpener, true);
  assert.equal(results[1].hasMetric, false);
});

test('analyzeMatch computes weighted ATS score and updates cleanly after bullet replacement', () => {
  const scenario = PRESET_SCENARIOS[0];
  const before = analyzeMatch({
    resumeText: scenario.resumeText,
    jdText: scenario.jdText,
  });
  assert.ok(before.matchScore >= 40 && before.matchScore <= 95);
  assert.ok(before.keywords.missingMustHave.length > 0);

  const weak = before.bulletAudits.find((b) => b.hasWeakOpener);
  assert.ok(weak);

  const updated = replaceBulletInResume(
    scenario.resumeText,
    weak.text,
    'Automated CI/CD and Playwright E2E pipelines with Next.js and WebSockets, cutting release regressions by 64%.',
  );
  assert.equal(updated.replaced, true);

  const after = analyzeMatch({
    resumeText: updated.resumeText,
    jdText: scenario.jdText,
  });
  assert.ok(after.matchScore > before.matchScore, `Expected ${after.matchScore} > ${before.matchScore}`);
});

test('exportAtsResume and buildScorecardMarkdown produce clean outputs', () => {
  const scenario = PRESET_SCENARIOS[1];
  const analysis = analyzeMatch({
    resumeText: scenario.resumeText,
    jdText: scenario.jdText,
  });
  const plain = exportAtsResume(scenario.resumeText, 'plain');
  assert.ok(!plain.includes('## '));
  const card = buildScorecardMarkdown(analysis, { executiveSummary: 'Strong PLG candidate.' });
  assert.ok(card.includes('ATS Match Scorecard'));
  assert.ok(card.includes('Strong PLG candidate.'));
});

test('rolefit-engine Executa plugin handles initialize, describe, health, and invoke over stdio JSON-RPC', () => {
  const pluginPath = join(root, 'anna-app', 'executas', 'rolefit-engine', 'rolefit_engine_plugin.js');
  const scenario = PRESET_SCENARIOS[0];
  const lines = [
    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2.0' } }),
    JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'describe', params: {} }),
    JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'health', params: {} }),
    JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'invoke',
      params: {
        tool: 'analyze_match',
        arguments: {
          resumeText: scenario.resumeText,
          jdText: scenario.jdText,
        },
      },
    }),
  ].join('\n') + '\n';

  const stdout = execFileSync(process.execPath, [pluginPath], {
    input: lines,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });

  const responses = stdout
    .trim()
    .split(/\r?\n/)
    .map((l) => JSON.parse(l));

  assert.equal(responses.length, 4);
  assert.equal(responses[0].result.serverInfo.name, 'rolefit-engine');
  assert.equal(responses[1].result.tools.length, 4);
  assert.equal(responses[2].result.status, 'ok');
  assert.equal(responses[3].result.success, true);
  assert.ok(responses[3].result.data.matchScore > 40);
});

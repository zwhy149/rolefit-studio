#!/usr/bin/env node
/**
 * rolefit-engine — Anna AI OS Executa stdio tool plugin (Node.js ESM)
 *
 * Protocol: JSON-RPC 2.0 over stdio (newline-delimited)
 * Methods : initialize, describe, invoke, health, shutdown
 */

import readline from 'node:readline';
import {
  analyzeMatch,
  auditBullets,
  buildScorecardMarkdown,
  exportAtsResume,
  parseJobPosting,
} from './vendor/core/index.js';

const MANIFEST = {
  name: 'rolefit-engine',
  display_name: 'RoleFit ATS & XYZ Resume Engine',
  version: '1.0.5',
  description:
    'Deterministic ATS skill-gap scoring, must-have vs nice-to-have JD parsing, Google XYZ formula resume bullet diagnostics, and parser-safe ATS export.',
  author: 'zwhy149',
  homepage: 'https://github.com/zwhy149/rolefit-studio',
  icon: '💼',
  category: 'productivity',
  license: 'MIT',
  tags: ['productivity', 'career', 'ats', 'resume', 'job-search', 'anna-app'],
  tools: [
    {
      name: 'analyze_match',
      description:
        'Score a candidate resume against a target job description (0-100), returning weighted ATS sub-scores, matched/missing must-have and preferred skills, XYZ bullet audits, and priority actions.',
      parameters: [
        {
          name: 'resumeText',
          type: 'string',
          description: 'Full candidate resume in Markdown or plain text.',
          required: true,
        },
        {
          name: 'jdText',
          type: 'string',
          description: 'Full target job description text.',
          required: true,
        },
        {
          name: 'roleTitle',
          type: 'string',
          description: 'Optional override for target role title.',
          required: false,
          default: '',
        },
        {
          name: 'company',
          type: 'string',
          description: 'Optional override for company name.',
          required: false,
          default: '',
        },
      ],
      timeout: 60,
      streaming: false,
    },
    {
      name: 'parse_job_posting',
      description:
        'Extract structured role metadata, compensation hints, required years of experience, must-have skills, and bonus skills from a raw job description.',
      parameters: [
        {
          name: 'jdText',
          type: 'string',
          description: 'Raw job posting text or scraped markdown.',
          required: true,
        },
      ],
      timeout: 60,
      streaming: false,
    },
    {
      name: 'audit_bullets',
      description:
        'Audit resume experience bullets against the Google XYZ formula (action verb, measurable metric, concise length, cliche check, and JD keyword alignment).',
      parameters: [
        {
          name: 'resumeOrBullets',
          type: 'string',
          description: 'Full resume text or newline-separated bullet list.',
          required: true,
        },
        {
          name: 'targetKeywords',
          type: 'array',
          description: 'Optional list of target JD skill strings to check alignment against.',
          required: false,
          default: [],
        },
      ],
      timeout: 60,
      streaming: false,
    },
    {
      name: 'export_ats_resume',
      description:
        'Format a tailored resume into parser-safe plain text / Markdown, or compile a complete RoleFit ATS Match Scorecard Markdown report.',
      parameters: [
        {
          name: 'resumeText',
          type: 'string',
          description: 'Candidate resume text.',
          required: true,
        },
        {
          name: 'jdText',
          type: 'string',
          description: 'Optional job description text (when mode="scorecard").',
          required: false,
          default: '',
        },
        {
          name: 'mode',
          type: 'string',
          description: 'Export format: "markdown" | "plain" | "scorecard". Default: "markdown".',
          required: false,
          default: 'markdown',
        },
      ],
      timeout: 60,
      streaming: false,
    },
  ],
  runtime: {
    type: 'node',
    min_version: '18.0.0',
  },
};

async function toolAnalyzeMatch(args) {
  const resumeText = String(args.resumeText || '').trim();
  const jdText = String(args.jdText || '').trim();
  if (!resumeText) throw new Error('resumeText is required');
  if (!jdText) throw new Error('jdText is required');
  return analyzeMatch({
    resumeText,
    jdText,
    roleTitle: args.roleTitle || '',
    company: args.company || '',
  });
}

async function toolParseJobPosting(args) {
  const jdText = String(args.jdText || '').trim();
  if (!jdText) throw new Error('jdText is required');
  return parseJobPosting(jdText);
}

async function toolAuditBullets(args) {
  const raw = args.resumeOrBullets;
  if (!raw) throw new Error('resumeOrBullets is required');
  const keywords = Array.isArray(args.targetKeywords) ? args.targetKeywords.map(String) : [];
  if (Array.isArray(raw)) {
    return { bullets: auditBullets(raw, keywords) };
  }
  const text = String(raw).trim();
  const hasBulletMarkers = /^\s*(?:[-•*▪▸]|\d+\.)\s+/m.test(text);
  const input = hasBulletMarkers ? text : text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return { bullets: auditBullets(input, keywords) };
}

async function toolExportAtsResume(args) {
  const resumeText = String(args.resumeText || '').trim();
  if (!resumeText) throw new Error('resumeText is required');
  const mode = String(args.mode || 'markdown').toLowerCase();
  if (mode === 'scorecard') {
    const analysis = analyzeMatch({
      resumeText,
      jdText: String(args.jdText || 'General Role'),
    });
    return {
      mode: 'scorecard',
      content: buildScorecardMarkdown(analysis),
      matchScore: analysis.matchScore,
    };
  }
  return {
    mode: mode === 'plain' ? 'plain' : 'markdown',
    content: exportAtsResume(resumeText, mode === 'plain' ? 'plain' : 'markdown'),
  };
}

const TOOL_DISPATCH = {
  analyze_match: toolAnalyzeMatch,
  parse_job_posting: toolParseJobPosting,
  audit_bullets: toolAuditBullets,
  export_ats_resume: toolExportAtsResume,
};

async function handleInvoke(params) {
  const tool = params.tool || params.method;
  const args = params.arguments && typeof params.arguments === 'object'
    ? params.arguments
    : params.args && typeof params.args === 'object'
      ? params.args
      : {};
  const fn = TOOL_DISPATCH[tool];
  if (!fn) {
    throw new Error(`unknown tool: ${JSON.stringify(tool)}`);
  }
  try {
    const data = await fn(args);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: `${err.name}: ${err.message}` };
  }
}

const METHOD_DISPATCH = {
  describe: async () => MANIFEST,
  invoke: handleInvoke,
  health: async () => ({ status: 'ok', version: MANIFEST.version }),
};

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function main() {
  process.stderr.write(`[rolefit-engine] ${MANIFEST.display_name} v${MANIFEST.version} ready (node)\n`);
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

  rl.on('line', async (raw) => {
    const line = raw.trim();
    if (!line) return;
    let req;
    try {
      req = JSON.parse(line);
    } catch (err) {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: `parse error: ${err.message}` } });
      return;
    }

    const reqId = req.id;
    const method = req.method;
    const params = req.params || {};
    const handler = METHOD_DISPATCH[method];
    if (!handler) {
      if (reqId !== undefined) {
        send({ jsonrpc: '2.0', id: reqId, error: { code: -32601, message: `method not found: ${method}` } });
      }
      return;
    }

    try {
      const result = await handler(params);
      send({ jsonrpc: '2.0', id: reqId, result });
    } catch (err) {
      if (reqId !== undefined) {
        send({ jsonrpc: '2.0', id: reqId, error: { code: -32000, message: err.message || String(err) } });
      }
    }
  });
}

main();

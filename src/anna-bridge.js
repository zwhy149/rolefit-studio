/**
 * Anna AI OS Host Bridge + Standalone Local Fallback.
 *
 * Uses only implemented Anna Host API methods:
 *   - anna.tools.invoke
 *   - anna.llm.complete
 *   - anna.web.search
 *   - anna.web.fetch
 *   - anna.storage.get / anna.storage.set
 *   - anna.chat.append_artifact
 *   - anna.window.set_title
 */

const STORAGE_KEY_LOCAL = 'rolefit-studio:v1:state';

function isLikelyAnnaIframe() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('wid') || params.has('t') || window.parent !== window;
}

function unwrapRpc(resp) {
  if (!resp || typeof resp !== 'object') return resp;
  if ('ok' in resp) {
    if (!resp.ok) {
      const msg = resp.error?.message || resp.error?.code || 'Host RPC error';
      const err = new Error(msg);
      err.code = resp.error?.code;
      throw err;
    }
    return resp.result;
  }
  return resp;
}

function extractJsonBlock(text) {
  const raw = String(text || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  }
  throw new Error('Model response did not contain a valid JSON object.');
}

export class StudioHostBridge {
  constructor() {
    this.anna = null;
    this.connected = false;
    this.theme = 'light';
    this.locale = 'en';
    this._payloadHandlers = [];
    this._themeHandlers = [];
    this._localeHandlers = [];
  }

  getBundledToolId(handle = 'rolefit-engine') {
    if (typeof window !== 'undefined' && window.__ANNA_TOOL_IDS__?.[handle]) {
      return window.__ANNA_TOOL_IDS__[handle];
    }
    return 'tool-dev-rolefit-engine';
  }

  async init() {
    if (!isLikelyAnnaIframe()) {
      this._applyStandaloneDefaults();
      return false;
    }

    try {
      const sdkPath = '/static/anna-apps/_sdk/latest/index.js';
      const mod = await import(/* @vite-ignore */ sdkPath);
      const anna = await Promise.race([
        mod.AnnaAppRuntime.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('connect_timeout')), 3500)),
      ]);
      this.anna = anna;
      this.connected = true;

      if (typeof anna.onThemeChange === 'function') {
        anna.onThemeChange(({ theme }) => {
          if (theme) {
            this.theme = theme;
            document.documentElement.dataset.theme = theme;
            this._themeHandlers.forEach((fn) => fn(theme));
          }
        });
      }
      if (typeof anna.onLocaleChange === 'function') {
        anna.onLocaleChange(({ lang }) => {
          if (lang) {
            this.locale = lang.startsWith('zh') ? 'zh' : 'en';
            this._localeHandlers.forEach((fn) => fn(this.locale));
          }
        });
      }
      if (typeof anna.on === 'function') {
        anna.on('entry_payload', (payload) => {
          if (payload) this._payloadHandlers.forEach((fn) => fn(payload));
        });
      }
      return true;
    } catch {
      this._applyStandaloneDefaults();
      return false;
    }
  }

  _applyStandaloneDefaults() {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      this.theme = 'dark';
    }
  }

  getInitialEntryPayload() {
    return this.anna?.entryPayload || null;
  }

  onEntryPayload(fn) {
    this._payloadHandlers.push(fn);
  }

  onLocaleChange(fn) {
    this._localeHandlers.push(fn);
  }

  async loadState() {
    if (this.connected && this.anna?.storage) {
      try {
        const res = unwrapRpc(await this.anna.storage.get({ key: 'workspace_v1' }));
        if (res?.value && typeof res.value === 'object') {
          return res.value;
        }
        if (this.anna.runtimeState?.workspace_v1) {
          return this.anna.runtimeState.workspace_v1;
        }
      } catch {
        // Fall through to localStorage
      }
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOCAL);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async saveState(state) {
    const compact = {
      resumeText: String(state.resumeText || '').slice(0, 32000),
      jdText: String(state.jdText || '').slice(0, 24000),
      roleTitle: String(state.roleTitle || '').slice(0, 120),
      companyName: String(state.companyName || '').slice(0, 120),
      savedApplications: Array.isArray(state.savedApplications) ? state.savedApplications.slice(0, 25) : [],
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(compact));
    } catch {
      // Ignore quota errors in restricted sandboxes
    }

    if (this.connected && this.anna?.storage) {
      try {
        await this.anna.storage.set({ key: 'workspace_v1', value: compact });
      } catch {
        // Non-fatal
      }
    }
  }

  async updateWindowTitle(title) {
    if (this.connected && this.anna?.window) {
      try {
        await this.anna.window.set_title({ title: String(title || 'RoleFit Studio').slice(0, 110) });
      } catch {
        // Non-fatal on mobile stack
      }
    }
  }

  async invokeEngine(method, args) {
    if (!this.connected || !this.anna?.tools) {
      return { usedExecuta: false, data: null };
    }
    const anna = this.anna;
    const toolId = this.getBundledToolId('rolefit-engine');
    const resp = unwrapRpc(
      await anna.tools.invoke({
        tool_id: toolId,
        method,
        args,
        timeoutMs: 30000,
      }),
    );
    const payload = resp?.result ?? resp;
    if (payload?.success && payload?.data) {
      return { usedExecuta: true, data: payload.data };
    }
    if (payload?.matchScore !== undefined || payload?.roleTitle !== undefined) {
      return { usedExecuta: true, data: payload };
    }
    throw new Error(payload?.error || 'Executa returned an unexpected payload');
  }

  async completePrompt(systemPrompt, userPrompt, maxTokens = 1800) {
    if (!this.connected || !this.anna?.llm) {
      throw new Error('ANNA_OFFLINE');
    }
    const anna = this.anna;
    const messages = [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `${systemPrompt}\n\n---\n\n${userPrompt}`,
        },
      },
    ];

    let reply = unwrapRpc(
      await anna.llm.complete({
        messages,
        maxTokens,
      }),
    );

    // Guard against reasoning models consuming token budget when mandatory thinking is active
    const visibleText = reply?.content?.text || '';
    if (reply?.stopReason === 'maxTokens' && !visibleText.trim()) {
      reply = unwrapRpc(
        await anna.llm.complete({
          messages,
          maxTokens: Math.min(8192, maxTokens * 3),
        }),
      );
    }

    const text = reply?.content?.text || '';
    if (!text.trim()) {
      throw new Error('Model returned an empty completion.');
    }
    return {
      text,
      model: reply?.model || 'anna-host-llm',
    };
  }

  async completeJson(systemPrompt, userPrompt, maxTokens = 2000) {
    const { text, model } = await this.completePrompt(systemPrompt, userPrompt, maxTokens);
    return { data: extractJsonBlock(text), model };
  }

  async fetchJobUrl(url) {
    if (!this.connected || !this.anna?.web) {
      throw new Error('Live URL fetching uses Anna AI OS Host Web API (`anna.web.fetch`). Paste the job description text directly when running offline.');
    }
    const anna = this.anna;
    const res = unwrapRpc(
      await anna.web.fetch({
        urls: [url],
        max_chars: 16000,
      }),
    );
    const page = res?.pages?.[0];
    if (!page?.ok || !page?.content) {
      throw new Error(page?.error || 'Could not extract job posting text from that URL.');
    }
    return {
      title: page.title || '',
      content: page.content,
      finalUrl: page.final_url || url,
    };
  }

  async searchCompanyWeb(companyName, roleTitle) {
    if (!this.connected || !this.anna?.web) {
      throw new Error('Live web search requires Anna AI OS (`anna.web.search`).');
    }
    const anna = this.anna;
    const query = `${companyName} product news engineering culture ${roleTitle}`.trim();
    const res = unwrapRpc(
      await anna.web.search({
        query,
        max_results: 6,
      }),
    );
    return Array.isArray(res?.results) ? res.results : [];
  }

  async shareScorecardToChat(summary, scorecardData) {
    if (!this.connected || !this.anna?.chat) {
      return false;
    }
    const anna = this.anna;
    await anna.chat.append_artifact({
      artifact: {
        kind: 'app_event',
        summary,
        app_slug: 'rolefit-studio',
        data: scorecardData,
      },
    });
    return true;
  }
}

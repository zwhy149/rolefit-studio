# Privacy Policy — RoleFit Studio

**Last updated:** November 2026

RoleFit Studio (`rolefit-studio`) is an open-source, privacy-first ATS resume and job-match workspace maintained at <https://github.com/zwhy149/rolefit-studio>.

## 1. Standalone Local-First Web Mode

When run locally or via static web hosting outside Anna AI OS:

- All resume parsing, ATS skill-gap scoring, and XYZ bullet diagnostics execute **100% client-side** in your browser.
- Saved resumes and job trackers are stored solely in your browser's `localStorage`.
- Zero analytics, zero ad scripts, and zero developer-owned backend servers receive your data.

## 2. Anna AI OS App Mode

When installed and used inside [Anna AI OS](https://anna.partners):

- **Anna Persistent Storage (`anna.storage.*`)**: Stores your workspace draft and saved job tracker inside your own app-scoped Anna account storage.
- **Host LLM (`anna.llm.complete`)**: Invoked when you request AI bullet tailoring, executive summaries, outreach drafts, or interview prep, governed by your Anna account model preferences and quota.
- **Host Web (`anna.web.fetch` / `anna.web.search`)**: Invoked only when you explicitly click **Fetch URL** or **Run Live Company Intel**.
- **Bundled Executa (`rolefit-engine`)**: Runs deterministic scoring in Anna's isolated agent runtime with zero external network calls.

## 3. Contact

Report privacy or security questions via <https://github.com/zwhy149/rolefit-studio/issues>.

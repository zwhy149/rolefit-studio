# rolefit-engine (Anna Executa Tool)

Zero-dependency Node.js (>= 20) JSON-RPC 2.0 over stdio plugin powering deterministic ATS scoring and XYZ resume bullet diagnostics for **RoleFit Studio**.

## Exposed Tools

- `analyze_match({ resumeText, jdText, roleTitle?, company? })`
- `parse_job_posting({ jdText })`
- `audit_bullets({ resumeOrBullets, targetKeywords? })`
- `export_ats_resume({ resumeText, jdText?, mode? })`

## Smoke Test

```bash
anna-app executa dev --describe
anna-app executa dev --health
```

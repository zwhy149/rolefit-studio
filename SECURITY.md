# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| `1.0.x` | Yes |

## Architecture Security Guarantees

- **HTML Escaping**: All user-supplied resume text, job descriptions, and web search snippets are escaped prior to DOM rendering.
- **Zero Developer Backend**: RoleFit Studio ships as a static SPA + zero-dependency stdio Executa plugin (`rolefit-engine`). No API keys are embedded in client code.
- **SSRF Protection**: Live URL fetching inside Anna AI OS delegates exclusively to `anna.web.fetch`, enforcing host-level DNS & redirect SSRF guards.

## Reporting a Vulnerability

Please open a security advisory on <https://github.com/zwhy149/rolefit-studio/security/advisories> or file an issue without sensitive PII.

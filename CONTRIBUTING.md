# Contributing to RoleFit Studio

Thank you for helping make open-source, hallucination-free career tooling better!

## Development Workflow

```bash
git clone https://github.com/zwhy149/rolefit-studio.git
cd rolefit-studio
npm install
npm run build
npm test
```

## Guidelines

1. **Zero External Dependencies in `src/core/`**: The core ATS & XYZ bullet engine is shared directly with the Anna AI OS `rolefit-engine` stdio Executa plugin. Keep `src/core/` pure ES2022 JavaScript.
2. **Evidence-Grounded AI Prompts**: Never prompt an LLM to invent metrics, employers, or credentials. Always use explicit bracketed placeholders (`[X%]`, `[N users]`) when suggesting quantified rewrites.
3. **Mobile & Accessibility**: Maintain ≥ 44×44 px touch targets and zero horizontal overflow down to `320px` viewport width.

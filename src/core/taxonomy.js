/**
 * Canonical skill taxonomy, synonym aliases, action verbs, and ATS signals
 * shared across browser bundle and Anna Executa stdio plugin (zero external deps).
 */

export const SKILL_CATALOG = [
  // Languages
  { id: 'typescript', label: 'TypeScript', category: 'Languages', aliases: ['typescript', 'ts'] },
  { id: 'javascript', label: 'JavaScript', category: 'Languages', aliases: ['javascript', 'es6', 'ecmascript', 'js'] },
  { id: 'python', label: 'Python', category: 'Languages', aliases: ['python', 'python3', 'py'] },
  { id: 'go', label: 'Go', category: 'Languages', aliases: ['golang', 'go language'] },
  { id: 'rust', label: 'Rust', category: 'Languages', aliases: ['rust', 'rustlang'] },
  { id: 'java', label: 'Java', category: 'Languages', aliases: ['java'] },
  { id: 'kotlin', label: 'Kotlin', category: 'Languages', aliases: ['kotlin'] },
  { id: 'swift', label: 'Swift', category: 'Languages', aliases: ['swift', 'swiftui'] },
  { id: 'csharp', label: 'C#', category: 'Languages', aliases: ['c#', 'csharp', '.net', 'dotnet'] },
  { id: 'cpp', label: 'C++', category: 'Languages', aliases: ['c++', 'cpp'] },
  { id: 'sql', label: 'SQL', category: 'Languages', aliases: ['sql', 't-sql', 'pl/sql'] },
  { id: 'bash', label: 'Bash / Shell', category: 'Languages', aliases: ['bash', 'shell scripting', 'zsh', 'posix shell'] },

  // Frontend & Web
  { id: 'react', label: 'React', category: 'Frontend', aliases: ['react', 'react.js', 'reactjs'] },
  { id: 'nextjs', label: 'Next.js', category: 'Frontend', aliases: ['next.js', 'nextjs'] },
  { id: 'vue', label: 'Vue.js', category: 'Frontend', aliases: ['vue', 'vue.js', 'vuejs', 'nuxt'] },
  { id: 'angular', label: 'Angular', category: 'Frontend', aliases: ['angular', 'angularjs'] },
  { id: 'svelte', label: 'Svelte', category: 'Frontend', aliases: ['svelte', 'sveltekit'] },
  { id: 'tailwind', label: 'Tailwind CSS', category: 'Frontend', aliases: ['tailwind', 'tailwindcss', 'tailwind css'] },
  { id: 'html-css', label: 'HTML / CSS', category: 'Frontend', aliases: ['html5', 'css3', 'semantic html', 'responsive design'] },
  { id: 'accessibility', label: 'Web Accessibility (WCAG)', category: 'Frontend', aliases: ['wcag', 'a11y', 'accessibility', 'aria'] },
  { id: 'web-perf', label: 'Web Performance', category: 'Frontend', aliases: ['core web vitals', 'lighthouse', 'web performance', 'bundle optimization'] },
  { id: 'design-systems', label: 'Design Systems', category: 'Frontend', aliases: ['design system', 'design systems', 'storybook', 'component library'] },
  { id: 'webgl-canvas', label: 'Canvas / WebGL', category: 'Frontend', aliases: ['webgl', 'three.js', 'html5 canvas', 'webgpu'] },

  // Backend & Distributed Systems
  { id: 'nodejs', label: 'Node.js', category: 'Backend', aliases: ['node.js', 'nodejs', 'node runtime'] },
  { id: 'fastapi', label: 'FastAPI', category: 'Backend', aliases: ['fastapi'] },
  { id: 'django', label: 'Django', category: 'Backend', aliases: ['django'] },
  { id: 'flask', label: 'Flask', category: 'Backend', aliases: ['flask'] },
  { id: 'spring-boot', label: 'Spring Boot', category: 'Backend', aliases: ['spring boot', 'spring framework'] },
  { id: 'graphql', label: 'GraphQL', category: 'Backend', aliases: ['graphql', 'apollo'] },
  { id: 'rest-api', label: 'REST APIs', category: 'Backend', aliases: ['rest api', 'restful', 'rest apis', 'openapi', 'swagger'] },
  { id: 'grpc', label: 'gRPC / Protobuf', category: 'Backend', aliases: ['grpc', 'protobuf', 'protocol buffers'] },
  { id: 'websockets', label: 'WebSockets / SSE', category: 'Backend', aliases: ['websocket', 'websockets', 'server-sent events', 'sse', 'realtime streaming'] },
  { id: 'microservices', label: 'Distributed Systems', category: 'Backend', aliases: ['distributed systems', 'microservices', 'event-driven', 'high availability'] },
  { id: 'kafka', label: 'Kafka / Message Queues', category: 'Backend', aliases: ['kafka', 'rabbitmq', 'sqs', 'nats', 'message queue'] },

  // AI, Agents & ML
  { id: 'llm-orchestration', label: 'LLM Orchestration', category: 'AI & Agents', aliases: ['llm', 'large language models', 'llms', 'llm orchestration', 'foundation models'] },
  { id: 'ai-agents', label: 'AI Agents / Tool Use', category: 'AI & Agents', aliases: ['ai agent', 'ai agents', 'agentic', 'agent workflows', 'tool calling', 'function calling', 'mcp', 'model context protocol'] },
  { id: 'rag', label: 'RAG & Vector Search', category: 'AI & Agents', aliases: ['rag', 'retrieval-augmented generation', 'retrieval augmented generation', 'vector search', 'semantic search', 'embeddings'] },
  { id: 'evals', label: 'LLM Evals & Guardrails', category: 'AI & Agents', aliases: ['llm evals', 'evals', 'evaluation pipelines', 'promptfoo', 'braintrust', 'guardrails', 'hallucination'] },
  { id: 'prompt-eng', label: 'Prompt Engineering', category: 'AI & Agents', aliases: ['prompt engineering', 'structured outputs', 'system prompts', 'context engineering'] },
  { id: 'langchain', label: 'LangChain / LangGraph', category: 'AI & Agents', aliases: ['langchain', 'langgraph', 'llamaindex', 'vercel ai sdk'] },
  { id: 'pytorch', label: 'PyTorch / Fine-Tuning', category: 'AI & Agents', aliases: ['pytorch', 'tensorflow', 'fine-tuning', 'lora', 'huggingface', 'transformers'] },

  // Data & Storage
  { id: 'postgresql', label: 'PostgreSQL', category: 'Data', aliases: ['postgresql', 'postgres', 'pgvector'] },
  { id: 'mysql', label: 'MySQL', category: 'Data', aliases: ['mysql', 'mariadb'] },
  { id: 'redis', label: 'Redis', category: 'Data', aliases: ['redis', 'valkey', 'caching'] },
  { id: 'mongodb', label: 'MongoDB / NoSQL', category: 'Data', aliases: ['mongodb', 'dynamodb', 'nosql', 'firestore'] },
  { id: 'snowflake', label: 'Snowflake / BigQuery', category: 'Data', aliases: ['snowflake', 'bigquery', 'databricks', 'redshift', 'data warehouse'] },
  { id: 'dbt', label: 'dbt / ETL Pipelines', category: 'Data', aliases: ['dbt', 'airflow', 'etl', 'elt', 'data pipelines', 'spark'] },
  { id: 'analytics', label: 'Product Analytics', category: 'Data', aliases: ['amplitude', 'mixpanel', 'posthog', 'segment', 'looker', 'tableau', 'metabase'] },
  { id: 'ab-testing', label: 'A/B Testing & Experimentation', category: 'Data', aliases: ['a/b testing', 'ab testing', 'experimentation', 'statistical significance', 'cohort analysis', 'causal inference'] },

  // Cloud, DevOps & Security
  { id: 'aws', label: 'AWS', category: 'Cloud & Infra', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'ecs', 'eks'] },
  { id: 'gcp', label: 'GCP', category: 'Cloud & Infra', aliases: ['gcp', 'google cloud', 'cloud run', 'gke'] },
  { id: 'azure', label: 'Azure', category: 'Cloud & Infra', aliases: ['azure', 'microsoft azure'] },
  { id: 'cloudflare', label: 'Cloudflare / Edge', category: 'Cloud & Infra', aliases: ['cloudflare', 'cloudflare workers', 'r2', 'edge runtime', 'cdn'] },
  { id: 'docker', label: 'Docker', category: 'Cloud & Infra', aliases: ['docker', 'containers', 'containerization'] },
  { id: 'kubernetes', label: 'Kubernetes', category: 'Cloud & Infra', aliases: ['kubernetes', 'k8s', 'helm'] },
  { id: 'terraform', label: 'Terraform / IaC', category: 'Cloud & Infra', aliases: ['terraform', 'infrastructure as code', 'iac', 'pulumi', 'cloudformation'] },
  { id: 'cicd', label: 'CI/CD Automation', category: 'Cloud & Infra', aliases: ['ci/cd', 'github actions', 'gitlab ci', 'continuous integration', 'continuous deployment'] },
  { id: 'observability', label: 'Observability & SRE', category: 'Cloud & Infra', aliases: ['opentelemetry', 'datadog', 'prometheus', 'grafana', 'sentry', 'observability', 'slo', 'incident response'] },
  { id: 'testing', label: 'Automated Testing', category: 'Cloud & Infra', aliases: ['playwright', 'cypress', 'vitest', 'jest', 'pytest', 'unit testing', 'end-to-end testing', 'e2e testing'] },
  { id: 'security', label: 'Security & Compliance', category: 'Cloud & Infra', aliases: ['soc 2', 'soc2', 'oauth', 'oidc', 'jwt', 'rbac', 'ssrf', 'gdpr', 'hipaa', 'zero trust'] },

  // Product, Design & GTM
  { id: 'roadmap', label: 'Product Strategy & Roadmapping', category: 'Product & GTM', aliases: ['product strategy', 'product roadmap', 'roadmapping', 'prd', 'product requirements', '0-to-1', 'zero to one'] },
  { id: 'user-research', label: 'User Research & Discovery', category: 'Product & GTM', aliases: ['user research', 'customer discovery', 'user interviews', 'usability testing', 'jtbd', 'jobs to be done'] },
  { id: 'plg', label: 'Product-Led Growth (PLG)', category: 'Product & GTM', aliases: ['product-led growth', 'plg', 'activation', 'retention', 'onboarding funnel', 'conversion rate', 'churn reduction', 'monetization'] },
  { id: 'figma', label: 'Figma / Prototyping', category: 'Product & GTM', aliases: ['figma', 'wireframing', 'prototyping', 'user flows', 'interaction design'] },
  { id: 'pmm', label: 'Positioning & Go-To-Market', category: 'Product & GTM', aliases: ['go-to-market', 'gtm', 'positioning', 'messaging', 'competitive intelligence', 'sales enablement', 'product launches'] },
  { id: 'seo-content', label: 'SEO & Content Growth', category: 'Product & GTM', aliases: ['seo', 'content strategy', 'technical seo', 'organic traffic', 'demand generation', 'paid acquisition'] },
  { id: 'crm-revops', label: 'CRM & Lifecycle Ops', category: 'Product & GTM', aliases: ['hubspot', 'salesforce', 'lifecycle marketing', 'crm', 'pipeline generation', 'arr', 'mrr'] },
  { id: 'agile', label: 'Cross-Functional Leadership', category: 'Product & GTM', aliases: ['cross-functional', 'stakeholder management', 'agile', 'scrum', 'sprint planning', 'okrs', 'kpi'] },
];

export const STRONG_ACTION_VERBS = new Set([
  'architected', 'accelerated', 'automated', 'built', 'championed', 'consolidated',
  'created', 'cut', 'decreased', 'delivered', 'deployed', 'designed', 'developed',
  'diagnosed', 'drove', 'eliminated', 'engineered', 'established', 'expanded',
  'generated', 'grew', 'hardened', 'implemented', 'improved', 'increased',
  'instrumented', 'integrated', 'launched', 'led', 'lifted', 'mentored', 'migrated',
  'modernized', 'negotiated', 'optimized', 'orchestrated', 'owned', 'pioneered',
  'positioned', 'produced', 'redesigned', 'reduced', 'refactored', 'resolved',
  'revamped', 'scaled', 'shipped', 'simplified', 'spearheaded', 'standardized',
  'streamlined', 'transformed', 'tripled', 'doubled', 'unified', 'validated',
]);

export const WEAK_OPENERS = [
  /^responsible\s+for\b/i,
  /^worked\s+(on|with)\b/i,
  /^helped\s+(to\s+|with\s+)?/i,
  /^assisted\s+(in|with)\b/i,
  /^participated\s+in\b/i,
  /^involved\s+in\b/i,
  /^duties\s+included\b/i,
  /^tasked\s+with\b/i,
  /^was\s+in\s+charge\s+of\b/i,
  /^contributed\s+to\b/i,
];

export const BUZZWORD_CLICHES = [
  'synergy',
  'thought leader',
  'go-getter',
  'rockstar',
  'ninja',
  'hard worker',
  'detail-oriented team player',
  'results-driven professional',
  'think outside the box',
  'wear many hats',
  'fast-paced environment',
];

export const SECTION_PATTERNS = {
  summary: /^(professional\s+summary|executive\s+summary|summary|profile|about\s+me)\s*:?$/i,
  experience: /^(work\s+experience|professional\s+experience|experience|employment(\s+history)?|career\s+history)\s*:?$/i,
  skills: /^(technical\s+skills|core\s+competencies|skills(\s*&\s*tools)?|technologies|tech\s+stack)\s*:?$/i,
  education: /^(education(\s*&\s*certifications)?|academic\s+background)\s*:?$/i,
  projects: /^(selected\s+projects|projects|open[\s-]source)\s*:?$/i,
  certifications: /^(certifications|licenses(\s*&\s*certifications)?|awards)\s*:?$/i,
};

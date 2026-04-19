import { prisma } from './prisma.service';

const SYSTEM_SETTING_KEY = 'llm_allowed_base_urls';

export interface AllowedBaseUrlRule {
  origin: string; // e.g. "http://localhost:1234"
  pathPrefix?: string; // e.g. "/v1"
}

function normalizeRule(rule: AllowedBaseUrlRule): AllowedBaseUrlRule {
  const url = new URL(rule.origin);
  const origin = url.origin;
  const pathPrefix = rule.pathPrefix ? `/${rule.pathPrefix.replace(/^\/+/, '').replace(/\/+$/, '')}` : undefined;
  return { origin, pathPrefix };
}

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  return `/${pathname.replace(/^\/+/, '')}`;
}

export async function getAllowedLLMBaseUrls(): Promise<AllowedBaseUrlRule[]> {
  const row = await prisma.systemSetting.findUnique({ where: { key: SYSTEM_SETTING_KEY } });
  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((v): v is AllowedBaseUrlRule => !!v && typeof v === 'object' && 'origin' in v)
          .map((v) => normalizeRule(v));
      }
    } catch {
      // Fall back to defaults
    }
  }

  // Defaults: permitir loopback + OpenAI oficial (para setups comunes).
  return [
    normalizeRule({ origin: 'http://localhost:1234', pathPrefix: '/v1' }), // LM Studio default
    normalizeRule({ origin: 'http://127.0.0.1:1234', pathPrefix: '/v1' }),
    normalizeRule({ origin: 'http://localhost:11434', pathPrefix: '/v1' }), // Ollama (si se usa gateway OpenAI)
    normalizeRule({ origin: 'http://127.0.0.1:11434', pathPrefix: '/v1' }),
    normalizeRule({ origin: 'https://api.openai.com', pathPrefix: '/v1' }),
  ];
}

export async function setAllowedLLMBaseUrls(rules: AllowedBaseUrlRule[]): Promise<void> {
  const normalized = rules.map((r) => normalizeRule(r));
  await prisma.systemSetting.upsert({
    where: { key: SYSTEM_SETTING_KEY },
    create: { key: SYSTEM_SETTING_KEY, value: JSON.stringify(normalized) },
    update: { value: JSON.stringify(normalized) },
  });
}

export async function assertLLMBaseUrlAllowed(baseUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error('baseUrl inválida (no es una URL)');
  }

  if (url.username || url.password) {
    throw new Error('baseUrl inválida (no se permiten credenciales en la URL)');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('baseUrl inválida (solo http/https)');
  }

  // Normalizar a "origin + pathname" sin trailing slash para comparar.
  const candidateOrigin = url.origin;
  const candidatePath = normalizePathname(url.pathname).replace(/\/+$/, '') || '/';

  const allowlist = await getAllowedLLMBaseUrls();
  const allowed = allowlist.some((rule) => {
    if (candidateOrigin !== rule.origin) return false;
    const rulePrefix = (rule.pathPrefix ? normalizePathname(rule.pathPrefix) : '/').replace(/\/+$/, '') || '/';
    return candidatePath === rulePrefix || candidatePath.startsWith(rulePrefix + '/');
  });

  if (!allowed) {
    throw new Error('baseUrl no permitida por la allowlist del sistema');
  }
}


/**
 * Code Sanitizer Service (PHASE 3.4)
 * Sanitizes code before sending to LLM by removing secrets and sensitive data
 */

import { logger } from './logger.service';

interface SanitizationConfig {
  maskSecrets?: boolean;
  anonymizeNames?: boolean;
}

/**
 * Pattern matching for common secrets and sensitive data
 */
const SECRET_PATTERNS = {
  // API Keys and Tokens
  apiKey: /["'`]?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*["'`]?([a-zA-Z0-9\-_.]{20,})/g,
  bearerToken: /(bearer|token)\s*[:=]\s*["'`]?[a-zA-Z0-9\-_.]{20,}/gi,

  // AWS Credentials
  awsAccessKey: /AKIA[0-9A-Z]{16}/g,
  awsSecretKey: /aws_secret_access_key\s*=\s*["'`]?[a-zA-Z0-9\/+=]{40,}/gi,

  // GitHub Tokens
  githubToken: /github[_-]?token\s*[:=]\s*["'`]?ghp_[a-zA-Z0-9_]{36,}/gi,
  githubPAT: /ghp_[a-zA-Z0-9_]{36,}/g,

  // Private Keys
  privateKey: /-----BEGIN\s(RSA|DSA|EC|OPENSSH)\s(ENCRYPTED\s)?PRIVATE\sKEY/g,

  // Database Connection Strings
  dbConnection: /(?:mysql|postgresql|mongodb):\/\/[a-zA-Z0-9:@.\/\-_?=&]+/gi,

  // SSL/TLS Certificates
  certificate: /-----BEGIN\sCERTIFICATE/g,

  // Environment Variables
  envSecrets: /export\s+([A-Z_][A-Z0-9_]*)\s*=\s*["'`]?[^\n'"`;]+["'`]?/g,

  // Credit Card Numbers
  creditCard: /\b[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g,

  // Social Security Numbers
  ssn: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g,

  // Email addresses with passwords/secrets nearby
  emailWithPassword: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*[:=]\s*["'`]?[^\n'"`;]+/g,

  // Generic password patterns
  password: /password\s*[:=]\s*["'`]?[^\n'"`;]+["'`]?/gi,
  secret: /secret\s*[:=]\s*["'`]?[^\n'"`;]+["'`]?/gi,
  apiKeyGeneric: /api.?key\s*[:=]\s*["'`]?[^\n'"`;]+["'`]?/gi,
};

/**
 * Sanitize code by masking sensitive information
 */
export function sanitizeCode(
  code: string,
  config: SanitizationConfig = {}
): string {
  const { maskSecrets = true, anonymizeNames = false } = config;

  if (!maskSecrets && !anonymizeNames) {
    return code;
  }

  let sanitized = code;

  if (maskSecrets) {
    // Remove or mask sensitive patterns
    for (const [patternName, pattern] of Object.entries(SECRET_PATTERNS)) {
      sanitized = sanitized.replace(pattern, (match) => {
        // For patterns with groups, preserve the key but mask the value
        if (match.includes('=') || match.includes(':')) {
          const parts = match.split(/[:=]/);
          return `${parts[0]}=***MASKED***`;
        }
        // For pure tokens/keys, replace entire match
        return '***MASKED_SECRET***';
      });
    }
  }

  if (anonymizeNames) {
    // Anonymize variable names while preserving code structure
    sanitized = anonymizeIdentifiers(sanitized);
  }

  return sanitized;
}

/**
 * Anonymize variable and function names while preserving structure
 */
function anonymizeIdentifiers(code: string): string {
  const identifierMap = new Map<string, string>();
  let counter = 0;

  // Match identifiers (variable names, function names, etc.)
  // Exclude language keywords and common built-ins
  const keywords = new Set([
    'function', 'class', 'const', 'let', 'var', 'return', 'if', 'else',
    'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'async',
    'await', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super',
    'export', 'import', 'default', 'from', 'as', 'extends', 'implements',
    'interface', 'type', 'enum', 'namespace', 'module', 'declare',
    'public', 'private', 'protected', 'static', 'readonly', 'abstract',
    'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  ]);

  // Replace identifiers with anonymized names
  const identifierPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;

  return code.replace(identifierPattern, (match) => {
    if (keywords.has(match) || match[0] === match[0].toUpperCase()) {
      // Keep keywords and class names
      return match;
    }

    if (!identifierMap.has(match)) {
      identifierMap.set(match, `var_${++counter}`);
    }

    return identifierMap.get(match)!;
  });
}

/**
 * Detect if code contains secrets
 */
export function hasSecrets(code: string): {
  hasSuspiciousPatterns: boolean;
  detectedPatterns: string[];
} {
  const detectedPatterns: string[] = [];

  for (const [patternName, pattern] of Object.entries(SECRET_PATTERNS)) {
    if (pattern.test(code)) {
      detectedPatterns.push(patternName);
      // Reset regex for next test
      pattern.lastIndex = 0;
    }
  }

  return {
    hasSuspiciousPatterns: detectedPatterns.length > 0,
    detectedPatterns,
  };
}

/**
 * Remove common environment variable declarations
 */
export function removeEnvironmentVariables(code: string): string {
  let result = code;

  // Remove .env files content
  result = result.replace(/^[A-Z_][A-Z0-9_]*\s*=\s*[^\n]+$/gm, '***ENV_VAR_REMOVED***');

  // Remove process.env references but keep structure
  result = result.replace(/process\.env\.[A-Z_][A-Z0-9_]*/g, '***ENV_VAR***');

  // Remove os.environ references
  result = result.replace(/os\.environ\['[A-Z_][A-Z0-9_]*'\]/g, '***ENV_VAR***');

  return result;
}

/**
 * Remove comments containing secrets
 */
export function removeCommentSecrets(code: string): string {
  let result = code;

  // Remove single-line comments that contain secrets
  result = result.replace(/\/\/.*?(password|secret|api.?key|token|auth)[^\n]*/gi, '// ***COMMENT_REMOVED***');

  // Remove multi-line comments that contain secrets
  result = result.replace(/\/\*[\s\S]*?(password|secret|api.?key|token|auth)[\s\S]*?\*\//gi, '/* ***COMMENT_REMOVED*** */');

  return result;
}

/**
 * Full sanitization pipeline
 */
export function fullSanitize(
  code: string,
  config: SanitizationConfig = {}
): {
  sanitized: string;
  detectionResults: ReturnType<typeof hasSecrets>;
} {
  const detectionResults = hasSecrets(code);

  let sanitized = code;

  // Apply sanitization layers
  sanitized = removeEnvironmentVariables(sanitized);
  sanitized = removeCommentSecrets(sanitized);
  sanitized = sanitizeCode(sanitized, config);

  logger.info(
    `Code sanitized. Detected patterns: ${detectionResults.detectedPatterns.join(', ') || 'none'}`
  );

  return {
    sanitized,
    detectionResults,
  };
}

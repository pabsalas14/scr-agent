/**
 * Code Sanitizer Service Tests (PHASE 3.4)
 */

import {
  sanitizeCode,
  hasSecrets,
  removeEnvironmentVariables,
  removeCommentSecrets,
  fullSanitize,
} from '../code-sanitizer.service';

describe('Code Sanitizer Service', () => {
  describe('hasSecrets', () => {
    it('should detect API keys', () => {
      const code = 'const apiKey = "sk-1234567890abcdef1234567890"';
      const result = hasSecrets(code);
      expect(result.hasSuspiciousPatterns).toBe(true);
    });

    it('should detect GitHub tokens', () => {
      const code = 'github_token = ghp_1234567890abcdef1234567890';
      const result = hasSecrets(code);
      expect(result.hasSuspiciousPatterns).toBe(true);
    });

    it('should detect database URLs', () => {
      const code = 'postgresql://user:pass@localhost/db';
      const result = hasSecrets(code);
      expect(result.hasSuspiciousPatterns).toBe(true);
    });

    it('should not flag normal code', () => {
      const code = 'function add(a, b) { return a + b; }';
      const result = hasSecrets(code);
      expect(result.hasSuspiciousPatterns).toBe(false);
    });
  });

  describe('sanitizeCode', () => {
    it('should mask API keys', () => {
      const code = 'const apiKey = "sk_1234567890abcdef1234"';
      const sanitized = sanitizeCode(code, { maskSecrets: true });
      expect(sanitized).toContain('***');
      expect(sanitized).not.toContain('sk_');
    });

    it('should remove environment variables', () => {
      const code = 'export NODE_ENV=production\nexport API_KEY=secret123456';
      const sanitized = removeEnvironmentVariables(code);
      expect(sanitized).toContain('***ENV_VAR***');
    });

    it('should remove secret comments', () => {
      const code = '// password: admin123456\n// api_key: secret789';
      const sanitized = removeCommentSecrets(code);
      expect(sanitized).toContain('***COMMENT_REMOVED***');
    });
  });

  describe('fullSanitize', () => {
    it('should perform complete sanitization pipeline', () => {
      const code = `
        const apiKey = "sk_1234567890abcdef1234";
        export DATABASE_URL="postgresql://user:pass@localhost/db";
        // password: admin123
        function fetchData(url) {
          return fetch(url);
        }
      `;

      const result = fullSanitize(code, {
        maskSecrets: true,
        anonymizeNames: false,
      });

      expect(result.detectionResults.hasSuspiciousPatterns).toBe(true);
      expect(result.sanitized).toContain('***');
      expect(result.sanitized).not.toContain('sk_');
    });
  });
});

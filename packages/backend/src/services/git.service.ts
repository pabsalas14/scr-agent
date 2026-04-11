/**
 * ============================================================================
 * SERVICIO DE GIT
 * ============================================================================
 *
 * Servicio para interactuar con repositorios Git
 * Proporciona métodos para:
 * - Clonar/pullear repositorios
 * - Obtener historial de commits
 * - Analizar diffs entre commits
 * - Obtener información de autores
 *
 * Usa la librería simple-git para operaciones de Git
 * Soporta: GitHub, GitLab, Bitbucket
 */

import simpleGit, { SimpleGit } from 'simple-git';
import { logger, auditLog, AuditEventType } from './logger.service';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

/**
 * Interfaz para un commit de Git
 */
export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author: string;
  email: string;
  refs: string;
}

/**
 * Interfaz para cambios entre commits
 */
export interface GitDiff {
  file: string;
  status: 'A' | 'M' | 'D' | 'R'; // Added, Modified, Deleted, Renamed
  additions: number;
  deletions: number;
  content?: string; // Contenido del diff si se solicita
}

/**
 * Servicio de Git
 */
export class GitService {
  /**
   * Raíz del directorio de caché de repositorios
   */
  private cacheDir: string;

  constructor(cacheDir: string = '/tmp/scr-agent-cache') {
    this.cacheDir = cacheDir;
    // Crear directorio de caché si no existe
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  }

  /**
   * Obtener path local para un repositorio
   * Sanitizar URL para crear nombre de directorio seguro
   */
  private getLocalPath(repoUrl: string): string {
    // Sanitizar URL a nombre de directorio
    const sanitized = repoUrl
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 100);
    return path.join(this.cacheDir, sanitized);
  }

  /**
   * Construir URL autenticada con token de GitHub
   * Convierte https://github.com/owner/repo en https://token@github.com/owner/repo.git
   */
  private buildAuthenticatedUrl(repoUrl: string, githubToken?: string): string {
    if (!githubToken) {
      return repoUrl;
    }

    try {
      const url = new URL(repoUrl);
      // Fine-grained tokens (github_pat_*) require x-access-token format
      // Classic tokens work with either format
      url.username = 'x-access-token';
      url.password = githubToken;
      // Asegurar que la URL termina en .git para operaciones de git
      const urlString = url.toString();
      return urlString.endsWith('.git') ? urlString : `${urlString}.git`;
    } catch {
      // Si hay error, retornar URL original (sin autenticación)
      logger.warn(`Error construyendo URL autenticada, usando URL original: ${repoUrl}`);
      return repoUrl;
    }
  }

  /**
   * Clonar o pullear un repositorio
   * Maneja tanto clones iniciales como updates
   */
  async cloneOrPullRepository(repoUrl: string, githubToken?: string, branch?: string): Promise<string> {
    if (!this.validateRepositoryUrl(repoUrl)) {
      throw new Error('URL de repositorio inválida o no soportada');
    }

    const localPath = this.getLocalPath(repoUrl);

    // Construir URL con token si existe (para repos privados)
    const urlToUse = this.buildAuthenticatedUrl(repoUrl, githubToken);

    try {
      if (!fs.existsSync(localPath)) {
        // Clonar repositorio - crear directorio parent si no existe
        if (!fs.existsSync(path.dirname(localPath))) {
          fs.mkdirSync(path.dirname(localPath), { recursive: true });
        }

        logger.info(`Clonando repositorio: ${repoUrl}${githubToken ? ' [con GitHub token]' : ''}`);

        try {
          // Use simpleGit without options to clone
          // BUGFIX: Only force branch if it's not the default 'main'.
          // Many repos use 'master' as default — passing --branch main causes fatal error.
          // Let git clone the repo's default branch automatically.
          const cloneOptions = (branch && branch !== 'main') ? ['--branch', branch] : [];
          await simpleGit().clone(urlToUse, localPath, cloneOptions);
          logger.info(`✓ Repository cloned successfully`);
        } catch (cloneError: any) {
          const errorMsg = cloneError?.message || String(cloneError);
          logger.error(`Git clone failed: ${errorMsg}`);
          throw new Error(`Failed to clone repository: ${errorMsg}`);
        }

        // Verify clone was successful
        if (!fs.existsSync(localPath) || fs.readdirSync(localPath).length === 0) {
          throw new Error('Repository cloning succeeded but directory is empty - possible network issue');
        }

        auditLog(AuditEventType.DB_OPERATION, `Repositorio clonado`, {
          repoUrl,
          localPath,
          hasToken: !!githubToken,
        });
      } else {
        // Pullear cambios
        logger.info(`Actualizando repositorio: ${repoUrl}${githubToken ? ' [con GitHub token]' : ''}`);
        const git = simpleGit(localPath);
        // Si hay token, configurar credenciales
        if (githubToken) {
          await git.addConfig('user.token', githubToken, false, 'local');
        }
        await git.pull();
        auditLog(AuditEventType.DB_OPERATION, `Repositorio actualizado`, {
          repoUrl,
          hasToken: !!githubToken,
        });
      }

      // Verificar que la clonación fue exitosa comprobando que existen archivos
      if (!fs.existsSync(localPath) || fs.readdirSync(localPath).length === 0) {
        throw new Error('Repository cloning failed - directory is empty');
      }

      return localPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      logger.error(`Error al clonar/pullear repositorio: ${errorMessage}\nURL: ${repoUrl}\nLocalPath: ${localPath}\nStack: ${errorStack}`);
      throw new Error(`No se pudo acceder al repositorio: ${errorMessage}`);
    }
  }

  /**
   * Obtener historial de commits
   */
  async getCommitHistory(repoUrl: string, limit: number = 50): Promise<GitCommit[]> {
    try {
      const localPath = await this.cloneOrPullRepository(repoUrl);
      const git = simpleGit(localPath);

      /**
       * Obtener logs con formato personalizado
       * Format: hash|date|message|author|email|refs
       */
      const logResult = await git.log({
        maxCount: limit,
        format: {
          hash: '%h',
          date: '%ai',
          message: '%s',
          author: '%an',
          email: '%ae',
          refs: '%D',
        },
      });

      return logResult.all.map((commit: any) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author,
        email: commit.email,
        refs: commit.refs,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error obteniendo historial de commits: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Obtener cambios entre dos commits
   */
  async getDiffBetweenCommits(
    repoUrl: string,
    commitFrom: string,
    commitTo: string = 'HEAD'
  ): Promise<GitDiff[]> {
    try {
      const localPath = await this.cloneOrPullRepository(repoUrl);
      const git = simpleGit(localPath);

      /**
       * Obtener diff en formato numstat
       * Formato: additions deletions filename
       */
      const diffResult = await git.raw([
        'diff',
        '--numstat',
        `${commitFrom}..${commitTo}`,
      ]);

      const diffs: GitDiff[] = [];

      // Parsear output
      const lines = diffResult.split('\n').filter((line) => line.trim());
      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          const additions = parts[0] ?? '0';
          const deletions = parts[1] ?? '0';
          const file = parts[2] ?? '';
          diffs.push({
            file,
            status: 'M', // Por defecto modificado (podríamos mejorar esto)
            additions: parseInt(additions) || 0,
            deletions: parseInt(deletions) || 0,
          });
        }
      }

      return diffs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error obteniendo diff: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Obtener contenido de archivo en un commit específico
   */
  async getFileAtCommit(
    repoUrl: string,
    filePath: string,
    commitHash: string
  ): Promise<string> {
    try {
      const localPath = await this.cloneOrPullRepository(repoUrl);
      const git = simpleGit(localPath);

      const content = await git.show([`${commitHash}:${filePath}`]);
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error obteniendo archivo: ${errorMessage}`);
      throw new Error(`No se pudo obtener archivo: ${filePath}`);
    }
  }

  /**
   * Obtener commits que modificaron un archivo específico
   */
  async getCommitsForFile(
    repoUrl: string,
    filePath: string,
    limit: number = 20
  ): Promise<GitCommit[]> {
    try {
      const localPath = await this.cloneOrPullRepository(repoUrl);
      const git = simpleGit(localPath);

      const logResult = await git.log({
        maxCount: limit,
        file: filePath,
        format: {
          hash: '%h',
          date: '%ai',
          message: '%s',
          author: '%an',
          email: '%ae',
          refs: '%D',
        },
      });

      return Array.from(logResult.all).map((commit: any) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author,
        email: commit.email,
        refs: commit.refs,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error obteniendo commits de archivo: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Leer archivos de código de un repositorio clonado localmente.
   * Retorna contenido de archivos relevantes + metadata de cobertura (cuánto quedó fuera).
   */
  readRepositoryFiles(
    localPath: string,
    extensions: string[] = ['.ts', '.js', '.py', '.java', '.go', '.rb', '.php', '.cs', '.json', '.yaml', '.yml', '.sh', '.env'],
    limits: { maxFileSizeKb?: number; maxTotalSizeMb?: number; maxDirectoryDepth?: number } = {}
  ): {
    files: Array<{ path: string; content: string; size: number }>;
    totalSize: number;
    fileCount: number;
    coverage: {
      filesScanned: number;
      filesExcluded: number;
      bytesExcluded: number;
      excludedBySize: string[];
      excludedByLimit: string[];
      excludedDirs: string[];
    };
  } {
    const MAX_FILE_SIZE = (limits.maxFileSizeKb ?? 150) * 1024;
    const MAX_TOTAL_SIZE = (limits.maxTotalSizeMb ?? 2) * 1024 * 1024;
    const MAX_DEPTH = limits.maxDirectoryDepth ?? 6;

    const EXCLUDED_DIRS = new Set([
      'node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', '.venv',
      'test', 'tests', 'spec', 'specs', 'coverage', '.coverage',
      'vendor', 'third_party', 'external',
      'examples', 'samples', 'demo', 'docs',
      '.github', '.gitlab', '.gitignore',
      'public', 'static', 'assets',
      'tmp', 'temp', 'cache', '.cache',
      'node', 'pip', 'gem', 'npm'
    ]);

    const files: Array<{ path: string; content: string; size: number }> = [];
    let totalSize = 0;

    // Coverage tracking
    const excludedBySize: string[] = [];
    const excludedByLimit: string[] = [];
    const excludedDirsFound: string[] = [];
    let bytesExcluded = 0;

    const walk = (dir: string, depth: number = 0): void => {
      if (depth > MAX_DEPTH || totalSize >= MAX_TOTAL_SIZE) return;

      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (totalSize >= MAX_TOTAL_SIZE) break;

        if (entry.isDirectory()) {
          if (EXCLUDED_DIRS.has(entry.name)) {
            if (!excludedDirsFound.includes(entry.name)) excludedDirsFound.push(entry.name);
          } else {
            walk(path.join(dir, entry.name), depth + 1);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            const filePath = path.join(dir, entry.name);
            try {
              const stat = fs.statSync(filePath);
              const relativePath = path.relative(localPath, filePath);
              if (stat.size > MAX_FILE_SIZE) {
                excludedBySize.push(relativePath);
                bytesExcluded += stat.size;
                continue;
              }
              if (totalSize + stat.size > MAX_TOTAL_SIZE) {
                excludedByLimit.push(relativePath);
                bytesExcluded += stat.size;
                continue;
              }
              const content = fs.readFileSync(filePath, 'utf-8');
              files.push({ path: relativePath, content, size: stat.size });
              totalSize += stat.size;
            } catch {
              // Ignorar archivos que no se pueden leer
            }
          }
        }
      }
    };

    walk(localPath);

    const filesExcluded = excludedBySize.length + excludedByLimit.length;

    if (filesExcluded > 0 || totalSize >= MAX_TOTAL_SIZE * 0.8) {
      logger.warn(
        `⚠️ Cobertura parcial: ${files.length} archivos analizados, ${filesExcluded} excluidos ` +
        `(${Math.round(bytesExcluded / 1024)} KB omitidos). ` +
        `Por tamaño: ${excludedBySize.length}, por límite total: ${excludedByLimit.length}`
      );
    } else {
      logger.debug(`Archivos leídos: ${files.length}, tamaño total: ${totalSize} bytes`);
    }

    return {
      files,
      totalSize,
      fileCount: files.length,
      coverage: {
        filesScanned: files.length,
        filesExcluded,
        bytesExcluded,
        excludedBySize: excludedBySize.slice(0, 20), // limitar para no inflar el payload
        excludedByLimit: excludedByLimit.slice(0, 20),
        excludedDirs: excludedDirsFound,
      },
    };
  }

  /**
   * Validar que la URL es un repositorio válido (previene SSRF)
   */
  validateRepositoryUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Solo permitir HTTPS para reducir superficie SSRF
      if (urlObj.protocol !== 'https:') return false;

      // Evitar URLs con credenciales embebidas
      if (urlObj.username || urlObj.password) return false;

      // Solo permitir GitHub, GitLab, Bitbucket (agregar más si necesario)
      // Importante: evitar bypass tipo "evilgithub.com" (endsWith simple)
      const hostname = urlObj.hostname.toLowerCase();
      const allowedHosts = ['github.com', 'gitlab.com', 'bitbucket.org'];
      return allowedHosts.some(
        (host) => hostname === host || hostname.endsWith(`.${host}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Probar acceso a repositorio (validación avanzada)
   * Verifica que el repositorio existe y es accesible con el token proporcionado
   * Lanza error descriptivo si hay problemas
   */
  async testRepositoryAccess(
    repoUrl: string,
    githubToken?: string
  ): Promise<boolean> {
    // Primero validar formato de URL
    if (!this.validateRepositoryUrl(repoUrl)) {
      throw new Error(
        'INVALID_URL: Invalid repository URL format (must be HTTPS, no credentials embedded, and from allowed hosts)'
      );
    }

    try {
      const urlObj = new URL(repoUrl);
      const hostname = urlObj.hostname.toLowerCase();

      // Para repositorios de GitHub, verificar acceso vía API
      if (
        hostname === 'github.com' ||
        hostname.endsWith('.github.com')
      ) {
        // Extraer owner/repo de la URL
        // Ej: https://github.com/owner/repo o https://github.com/owner/repo.git
        const pathParts = urlObj.pathname
          .split('/')
          .filter((p) => p && !p.endsWith('.git'));
        if (pathParts.length < 2) {
          throw new Error('INVALID_URL: GitHub URL must be in format https://github.com/owner/repo');
        }

        const [owner, repo] = pathParts as [string, string];
        const repoName = repo!.replace('.git', '');
        const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;

        try {
          const headers: Record<string, string> = {
            'User-Agent': 'SCR-Agent',
            Accept: 'application/vnd.github.v3+json',
          };

          // Agregar token si disponible
          if (githubToken) {
            headers['Authorization'] = `token ${githubToken}`;
          }

          const response = await axios.get(apiUrl, { headers, timeout: 5000 });

          // Si llegamos aquí, el repositorio es accesible
          logger.debug(
            `Repository access verified: ${owner}/${repoName} (Public: ${!response.data.private})`
          );
          return true;
        } catch (error: any) {
          // Manejar diferentes códigos de error
          if (error.response?.status === 404) {
            throw new Error(
              'REPO_NOT_FOUND: Repository does not exist or has been deleted'
            );
          } else if (error.response?.status === 403) {
            throw new Error(
              'NO_ACCESS: Repository is private or you do not have access (check GitHub token in Settings)'
            );
          } else if (error.response?.status === 401) {
            throw new Error(
              'INVALID_TOKEN: GitHub token is invalid or has expired (refresh in Settings)'
            );
          } else if (error.code === 'ECONNABORTED') {
            throw new Error('NETWORK_TIMEOUT: Failed to verify repository (GitHub API timeout)');
          } else {
            throw new Error(
              `NETWORK_ERROR: Failed to verify repository access (${error.message})`
            );
          }
        }
      }

      // Para otras plataformas (GitLab, Bitbucket), simplemente validar que es una URL válida
      // Validación más robusta se hace durante el clone
      logger.debug(`Repository URL validated: ${repoUrl}`);
      return true;
    } catch (error: any) {
      // Si el error ya es uno de nuestros errores específicos, re-lanzar
      if (error.message?.startsWith('INVALID_URL:') ||
          error.message?.startsWith('REPO_NOT_FOUND:') ||
          error.message?.startsWith('NO_ACCESS:') ||
          error.message?.startsWith('INVALID_TOKEN:') ||
          error.message?.startsWith('NETWORK_')) {
        throw error;
      }
      // Otros errores inesperados
      throw new Error(`VALIDATION_ERROR: ${error.message}`);
    }
  }
}

// Singleton exportado
export const gitService = new GitService(process.env['GIT_CACHE_DIR']);

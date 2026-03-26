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
      // Insertar token en la URL: https://token@github.com/owner/repo
      url.username = githubToken;
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
  async cloneOrPullRepository(repoUrl: string, githubToken?: string): Promise<string> {
    if (!this.validateRepositoryUrl(repoUrl)) {
      throw new Error('URL de repositorio inválida o no soportada');
    }

    const localPath = this.getLocalPath(repoUrl);

    // Construir URL con token si existe (para repos privados)
    const urlToUse = this.buildAuthenticatedUrl(repoUrl, githubToken);

    try {
      if (!fs.existsSync(localPath)) {
        // Clonar repositorio
        logger.info(`Clonando repositorio: ${repoUrl}${githubToken ? ' [con GitHub token]' : ''}`);
        await simpleGit().clone(urlToUse, localPath);
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

      return localPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error al clonar/pullear repositorio: ${errorMessage}`);
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
   * Leer archivos de código de un repositorio clonado localmente
   * Retorna contenido de todos los archivos con extensiones relevantes
   */
  readRepositoryFiles(
    localPath: string,
    extensions: string[] = ['.ts', '.js', '.py', '.java', '.go', '.rb', '.php', '.cs', '.json', '.yaml', '.yml', '.sh', '.env']
  ): { files: Array<{ path: string; content: string; size: number }>; totalSize: number; fileCount: number } {
    const MAX_FILE_SIZE = 500 * 1024; // 500 KB por archivo
    const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5 MB total
    const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', '.venv']);

    const files: Array<{ path: string; content: string; size: number }> = [];
    let totalSize = 0;

    const walk = (dir: string): void => {
      if (totalSize >= MAX_TOTAL_SIZE) return;

      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (totalSize >= MAX_TOTAL_SIZE) break;

        if (entry.isDirectory()) {
          if (!EXCLUDED_DIRS.has(entry.name)) {
            walk(path.join(dir, entry.name));
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            const filePath = path.join(dir, entry.name);
            try {
              const stat = fs.statSync(filePath);
              if (stat.size > MAX_FILE_SIZE) continue;
              const content = fs.readFileSync(filePath, 'utf-8');
              const relativePath = path.relative(localPath, filePath);
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

    logger.debug(`Archivos leídos: ${files.length}, tamaño total: ${totalSize} bytes`);
    return { files, totalSize, fileCount: files.length };
  }

  /**
   * Validar que la URL es un repositorio válido
   * OWASP A10 - Prevenir SSRF
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
}

// Singleton exportado
export const gitService = new GitService(process.env['GIT_CACHE_DIR']);

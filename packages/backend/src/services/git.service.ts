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
   * Clonar o pullear un repositorio
   * Maneja tanto clones iniciales como updates
   */
  async cloneOrPullRepository(repoUrl: string): Promise<string> {
    const localPath = this.getLocalPath(repoUrl);

    try {
      if (!fs.existsSync(localPath)) {
        // Clonar repositorio
        logger.info(`Clonando repositorio: ${repoUrl}`);
        await simpleGit().clone(repoUrl, localPath);
        auditLog(AuditEventType.DB_OPERATION, `Repositorio clonado`, {
          repoUrl,
          localPath,
        });
      } else {
        // Pullear cambios
        logger.info(`Actualizando repositorio: ${repoUrl}`);
        const git = simpleGit(localPath);
        await git.pull();
        auditLog(AuditEventType.DB_OPERATION, `Repositorio actualizado`, {
          repoUrl,
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
          const file = parts[2] ?? '';
          const additions = parts[0] ?? '0';
          const deletions = parts[1] ?? '0';
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

      return [...logResult.all] as GitCommit[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error obteniendo commits de archivo: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Leer archivos de código del repositorio clonado
   * Filtra por extensiones relevantes y limita tamaño
   */
  async readRepoFiles(localPath: string): Promise<string> {
    const extensionesPermitidas = [
      '.ts', '.tsx', '.js', '.jsx',
      '.py', '.java', '.cs', '.go',
      '.rb', '.php', '.rs',
    ];

    const archivos: string[] = [];
    this.recorrerDirectorio(localPath, archivos, extensionesPermitidas);

    // Limitar a los primeros 50 archivos para no exceder el contexto
    const archivosLimitados = archivos.slice(0, 50);
    const contenido: string[] = [];

    for (const archivo of archivosLimitados) {
      try {
        const relativo = archivo.replace(localPath, '').replace(/^\//, '');
        const texto = fs.readFileSync(archivo, 'utf-8');

        // Ignorar archivos muy grandes (> 100KB)
        if (texto.length > 100_000) continue;

        contenido.push(`\n// === ARCHIVO: ${relativo} ===\n${texto}`);
      } catch {
        // Ignorar archivos que no se pueden leer
      }
    }

    return contenido.join('\n');
  }

  /**
   * Recorrer directorio recursivamente
   */
  private recorrerDirectorio(
    dir: string,
    archivos: string[],
    extensiones: string[],
    profundidad = 0
  ): void {
    if (profundidad > 5) return;

    const ignorar = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

    try {
      const entradas = fs.readdirSync(dir, { withFileTypes: true });

      for (const entrada of entradas) {
        if (ignorar.includes(entrada.name)) continue;

        const rutaCompleta = path.join(dir, entrada.name);

        if (entrada.isDirectory()) {
          this.recorrerDirectorio(rutaCompleta, archivos, extensiones, profundidad + 1);
        } else if (entrada.isFile()) {
          const ext = path.extname(entrada.name);
          if (extensiones.includes(ext)) {
            archivos.push(rutaCompleta);
          }
        }
      }
    } catch {
      // Ignorar errores de permisos
    }
  }

  /**
   * Validar que la URL es un repositorio válido
   * OWASP A10 - Prevenir SSRF
   */
  validateRepositoryUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Solo permitir GitHub, GitLab, Bitbucket (agregar más si necesario)
      const allowedHosts = ['github.com', 'gitlab.com', 'bitbucket.org'];
      return allowedHosts.some((host) => urlObj.hostname.endsWith(host));
    } catch {
      return false;
    }
  }
}

// Singleton exportado
export const gitService = new GitService(process.env['GIT_CACHE_DIR']);

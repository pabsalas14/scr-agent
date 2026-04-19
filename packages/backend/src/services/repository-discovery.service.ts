/**
 * Repository Discovery Service (PHASE 3.3)
 * Handles detection of public repositories and available branches
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.service';

const execPromise = promisify(exec);

/**
 * Check if a repository is public (accessible without authentication)
 */
export async function isRepositoryPublic(repositoryUrl: string): Promise<boolean> {
  try {
    // Create a temporary directory to test clone
    const testPath = `/tmp/repo-test-${Date.now()}`;

    // Try to clone without authentication (no timeout, short attempt)
    const { stderr } = await execPromise(
      `timeout 10 git clone --depth 1 "${repositoryUrl}" "${testPath}" 2>&1`,
      { maxBuffer: 1024 * 1024 }
    );

    // Clean up
    await execPromise(`rm -rf "${testPath}"`, { maxBuffer: 1024 * 1024 });

    // If clone succeeded, repo is public
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Check if error indicates private repo or auth required
    if (
      errorMsg.includes('fatal:') ||
      errorMsg.includes('HTTP Basic: Access denied') ||
      errorMsg.includes('Repository not found') ||
      errorMsg.includes('Authentication failed') ||
      errorMsg.includes('Permission denied')
    ) {
      return false;
    }

    // Timeout or other network error - assume private
    return false;
  }
}

/**
 * Get available branches from a repository
 */
export async function getAvailableBranches(
  repositoryUrl: string,
  githubToken?: string
): Promise<string[]> {
  try {
    let cmd = `git ls-remote --heads "${repositoryUrl}"`;

    // If token provided, use authenticated access
    if (githubToken && repositoryUrl.includes('github.com')) {
      // Insert token into GitHub URL
      const url = repositoryUrl.replace(
        'https://github.com/',
        `https://${githubToken}@github.com/`
      );
      cmd = `git ls-remote --heads "${url}"`;
    }

    const { stdout } = await execPromise(cmd, { maxBuffer: 1024 * 1024, timeout: 10000 });

    // Parse output: "hash    refs/heads/main"
    const branches = stdout
      .split('\n')
      .filter((line) => line.includes('refs/heads/'))
      .map((line) => line.split('refs/heads/')[1])
      .filter((branch) => branch && branch.trim());

    return branches;
  } catch (error) {
    logger.warn(`Failed to get branches for ${repositoryUrl}: ${error}`);
    // Return common default branches if discovery fails
    return ['main', 'master', 'develop'];
  }
}

/**
 * Get default branch for a repository (usually 'main' or 'master')
 */
export async function getDefaultBranch(
  repositoryUrl: string,
  githubToken?: string
): Promise<string> {
  try {
    let cmd = `git symbolic-ref refs/remotes/origin/HEAD "${repositoryUrl}" 2>/dev/null | sed 's@.*origin/@@' || echo "main"`;

    if (githubToken && repositoryUrl.includes('github.com')) {
      const url = repositoryUrl.replace(
        'https://github.com/',
        `https://${githubToken}@github.com/`
      );
      cmd = `git ls-remote --symref "${url}" HEAD | grep -oP 'refs/heads/\K\w+' || echo "main"`;
    }

    const { stdout } = await execPromise(cmd, { maxBuffer: 1024 * 1024, timeout: 10000 });
    const branch = stdout.trim();
    return branch || 'main';
  } catch (error) {
    logger.warn(`Failed to get default branch for ${repositoryUrl}: ${error}`);
    return 'main';
  }
}

/**
 * Validate repository URL format and accessibility
 */
export async function validateRepositoryUrl(
  repositoryUrl: string,
  githubToken?: string
): Promise<{
  valid: boolean;
  isPublic: boolean;
  defaultBranch: string;
  branches: string[];
  error?: string;
}> {
  try {
    // Validate URL format
    if (!repositoryUrl.match(/^https?:\/\/.+\.git$|^https?:\/\/.+\/?$/)) {
      return {
        valid: false,
        isPublic: false,
        defaultBranch: 'main',
        branches: [],
        error: 'Invalid repository URL format',
      };
    }

    // Check if public
    const isPublic = await isRepositoryPublic(repositoryUrl);

    // Get default branch
    const defaultBranch = await getDefaultBranch(repositoryUrl, githubToken || undefined);

    // Get available branches
    const branches = await getAvailableBranches(repositoryUrl, githubToken || undefined);

    return {
      valid: true,
      isPublic,
      defaultBranch,
      branches,
    };
  } catch (error) {
    return {
      valid: false,
      isPublic: false,
      defaultBranch: 'main',
      branches: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get repository info (name, owner, etc.)
 */
export function parseRepositoryInfo(repositoryUrl: string): {
  owner?: string;
  name?: string;
  provider?: string;
} {
  try {
    // GitHub: https://github.com/owner/repo or https://github.com/owner/repo.git
    const githubMatch = repositoryUrl.match(
      /github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/
    );
    if (githubMatch) {
      return {
        provider: 'github',
        owner: githubMatch[1],
        name: githubMatch[2],
      };
    }

    // GitLab: https://gitlab.com/owner/repo or https://gitlab.com/owner/repo.git
    const gitlabMatch = repositoryUrl.match(
      /gitlab\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/
    );
    if (gitlabMatch) {
      return {
        provider: 'gitlab',
        owner: gitlabMatch[1],
        name: gitlabMatch[2],
      };
    }

    return {};
  } catch (error) {
    return {};
  }
}

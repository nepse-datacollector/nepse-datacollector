const logger = require('./logger');
const constants = require('../config/constants');

// Load Octokit via dynamic import to work in CommonJS
async function getOctokit() {
  const mod = await import('@octokit/rest');
  const token = process.env.GH_PAT || process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GH_PAT or GITHUB_TOKEN environment variable not set');
  }

  return new mod.Octokit({ auth: token });
}

class GitHubPusher {
  constructor() {
    this.owner = constants.GITHUB.OWNER;
    this.repo = constants.GITHUB.REPO;
    this.branch = constants.GITHUB.BRANCH;
  }

  /**
   * Push JSON data to GitHub
   * Creates/updates file and commits it
   */
  async pushFile(filePath, data, commitMessage) {
    try {
      const octokit = await getOctokit();
      logger.info(`Pushing to GitHub: ${filePath}`);

      const fileContent = JSON.stringify(data, null, 2);
      const encodedContent = Buffer.from(fileContent).toString('base64');

      let sha = null;
      try {
        const existingFile = await octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          ref: this.branch,
        });
        sha = existingFile.data.sha;
      } catch (e) {
        logger.debug('File does not exist, will create new file');
      }

      const response = await octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: commitMessage,
        content: encodedContent,
        branch: this.branch,
        ...(sha && { sha }),
      });

      logger.info(`✅ Successfully pushed: ${filePath}`, {
        commit: response.data.commit.sha,
        url: response.data.content.html_url,
      });

      return response.data;
    } catch (error) {
      logger.error(`❌ Failed to push ${filePath}`, {
        error: error.message,
        status: error.status,
      });
      throw error;
    }
  }

  /**
   * Push multiple files at once
   */
  async pushMultipleFiles(filesData, commitMessage) {
    const results = [];
    for (const [filePath, data] of Object.entries(filesData)) {
      try {
        const result = await this.pushFile(filePath, data, commitMessage);
        results.push({ filePath, success: true, result });
      } catch (error) {
        results.push({ filePath, success: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Get file content from GitHub
   */
  async getFile(filePath) {
    try {
      const octokit = await getOctokit();
      const response = await octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.branch,
      });

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.warn(`Could not fetch ${filePath}`, { error: error.message });
      return null;
    }
  }
}

module.exports = new GitHubPusher();

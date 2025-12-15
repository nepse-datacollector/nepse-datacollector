const { Octokit } = require('@octokit/rest');
const logger = require('./logger');
const constants = require('../config/constants');

class GitHubPusher {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
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
      logger.info(`Pushing to GitHub: ${filePath}`);

      // Prepare file content
      const fileContent = JSON.stringify(data, null, 2);
      const encodedContent = Buffer.from(fileContent).toString('base64');

      // Check if file exists
      let sha = null;
      try {
        const existingFile = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          ref: this.branch,
        });
        sha = existingFile.data.sha;
      } catch (e) {
        // File doesn't exist yet, that's ok
        logger.debug('File does not exist, will create new file');
      }

      // Push file
      const response = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: commitMessage,
        content: encodedContent,
        branch: this.branch,
        ...(sha && { sha }), // Include SHA if updating
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
   * Get file content from Data Lake
   */
  async getFile(filePath) {
    try {
      const response = await this.octokit.repos.getContent({
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

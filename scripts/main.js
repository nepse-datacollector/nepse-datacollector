require('dotenv').config();
const logger = require('./utils/logger');
const demandSupplyScraper = require('./scrapers/demand_supply');
const sectorScraper = require('./scrapers/sector');
const pricesScraper = require('./scrapers/nepse_api');
const eventsScraper = require('./scrapers/events');
const githubPusher = require('./utils/github_push');
const DataFormatter = require('./utils/data_formatter');

class DataCollector {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Main collection function - runs during trading hours
   */
  async collectData() {
    const runId = new Date().toISOString();
    logger.info('================================');
    logger.info('🚀 Starting data collection run');
    logger.info('================================');

    try {
      // Parallel scraping
      const [demandSupply, sectors, prices, events] = await Promise.allSettled([
        demandSupplyScraper.scrape(),
        sectorScraper.scrape(),
        pricesScraper.scrape(),
        eventsScraper.scrape(),
      ]);

      const todayPath = DataFormatter.getTodayPath();
      const filesToPush = {};

      // Process demand/supply
      if (demandSupply.status === 'fulfilled' && demandSupply.value) {
        filesToPush[`data/raw/${todayPath}/demand_supply.json`] = demandSupply.value;
      } else {
        logger.warn('⚠️ Demand/supply scrape skipped');
      }

      // Process sectors
      if (sectors.status === 'fulfilled' && sectors.value) {
        filesToPush[`data/raw/${todayPath}/sector.json`] = sectors.value;
      } else {
        logger.warn('⚠️ Sector scrape skipped');
      }

      // Process prices
      if (prices.status === 'fulfilled' && prices.value) {
        filesToPush[`data/raw/${todayPath}/prices.json`] = prices.value;
      } else {
        logger.warn('⚠️ Price scrape skipped');
      }

      // Process events
      if (events.status === 'fulfilled' && events.value) {
        filesToPush[`data/raw/${todayPath}/events.json`] = events.value;
      } else {
        logger.warn('⚠️ Events scrape skipped');
      }

      // Push to GitHub Data Lake
      if (Object.keys(filesToPush).length > 0) {
        logger.info('📤 Pushing data to Account 4 (Data Lake)...');
        const commitMessage = `[Account 1] Data collection: ${runId}`;
        const results = await githubPusher.pushMultipleFiles(filesToPush, commitMessage);

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        logger.info(`✅ Push completed: ${successCount} success, ${failCount} failed`);
      } else {
        logger.warn('⚠️ No data to push');
      }

      logger.info('================================');
      logger.info('✅ Collection run completed successfully');
      logger.info('================================');
    } catch (error) {
      logger.error('❌ Data collection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if current time is within trading hours
   */
  isWithinTradingHours() {
    const now = new Date();
    // Nepal time is UTC+5:45
    const npalTime = new Date(now.getTime() + 5.75 * 60 * 60 * 1000);
    const hours = npalTime.getHours();
    const minutes = npalTime.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;

    const start = '11:00';
    const end = '15:00';

    const isWithinHours = currentTime >= start && currentTime < end;
    const isWeekday = npalTime.getDay() >= 1 && npalTime.getDay() <= 5; // Mon-Fri

    return isWithinHours && isWeekday;
  }

  /**
   * Start continuous scraping (used for local testing)
   */
  async start() {
    if (this.isRunning) {
      logger.warn('⚠️ Collector already running');
      return;
    }

    this.isRunning = true;
    logger.info('🎯 Data Collector started in continuous mode');
    logger.info(`Trading hours: 11:00 - 15:00 Nepal time`);

    while (this.isRunning) {
      try {
        if (this.isWithinTradingHours()) {
          await this.collectData();
        } else {
          logger.debug('Outside trading hours, waiting...');
        }

        // Wait 5 minutes before next collection
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      } catch (error) {
        logger.error('Uncaught error in main loop', { error: error.message });
        // Wait a bit longer before retrying after error
        await new Promise(resolve => setTimeout(resolve, 30 * 1000));
      }
    }
  }

  /**
   * Stop continuous scraping
   */
  stop() {
    this.isRunning = false;
    logger.info('🛑 Data Collector stopped');
  }
}

// Single run mode (for GitHub Actions)
async function singleRun() {
  logger.info('Running in single-shot mode (GitHub Actions)');
  const collector = new DataCollector();
  try {
    await collector.collectData();
    process.exit(0);
  } catch (error) {
    logger.error('Single run failed', { error: error.message });
    process.exit(1);
  }
}

// Continuous mode (for local testing)
function continuousMode() {
  logger.info('Running in continuous mode (local development)');
  const collector = new DataCollector();

  collector.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down...');
    collector.stop();
    process.exit(0);
  });
}

// Determine mode based on environment
if (process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true') {
  singleRun();
} else {
  continuousMode();
}

module.exports = DataCollector;

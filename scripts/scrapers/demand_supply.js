const axios = require('axios');
const logger = require('../utils/logger');
const DataFormatter = require('../utils/data_formatter');
const constants = require('../config/constants');

class DemandSupplyScraper {
  constructor() {
    this.baseUrl = constants.NEPSE_API.BASE;
    this.timeout = constants.REQUEST_TIMEOUT;
    this.maxRetries = constants.MAX_RETRIES;
  }

  /**
   * Scrape demand/supply data from NEPSE API
   */
  async scrape(retryCount = 0) {
    try {
      logger.info('🔍 Scraping demand/supply data...');

      // Fetch from NEPSE API
      const response = await axios.get(
        `${this.baseUrl}${constants.NEPSE_API.PRICE_DATA}`,
        {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'NEPSE-Quant-Bot/1.0',
          },
        }
      );

      if (!response.data || !response.data.data) {
        throw new Error('Invalid API response structure');
      }

      // Format the data
      const formattedData = DataFormatter.formatDemandSupply(response.data.data);

      logger.info(`✅ Successfully scraped ${formattedData.demand_supply.length} stocks`, {
        stocks: formattedData.demand_supply.slice(0, 3),
      });

      return formattedData;
    } catch (error) {
      logger.error(`❌ Scrape failed (attempt ${retryCount + 1}/${this.maxRetries})`, {
        error: error.message,
      });

      // Retry logic
      if (retryCount < this.maxRetries - 1) {
        logger.info(`Retrying in ${constants.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, constants.RETRY_DELAY));
        return this.scrape(retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Check if data is valid
   */
  isValidData(data) {
    return (
      data &&
      data.demand_supply &&
      Array.isArray(data.demand_supply) &&
      data.demand_supply.length > 0
    );
  }
}

module.exports = new DemandSupplyScraper();

const axios = require('axios');
const logger = require('../utils/logger');
const DataFormatter = require('../utils/data_formatter');
const constants = require('../config/constants');

class NepseAPIScraper {
  constructor() {
    this.baseUrl = constants.NEPSE_API.BASE;
    this.timeout = constants.REQUEST_TIMEOUT;
  }

  /**
   * Scrape OHLCV prices
   */
  async scrape() {
    try {
      logger.info('🔍 Scraping OHLCV prices...');

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
        throw new Error('Invalid OHLCV API response');
      }

      const formattedData = DataFormatter.formatPrices(response.data.data);

      logger.info(`✅ Successfully scraped prices for ${formattedData.prices.length} stocks`);

      return formattedData;
    } catch (error) {
      logger.error('❌ Price scrape failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new NepseAPIScraper();

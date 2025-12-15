const axios = require('axios');
const logger = require('../utils/logger');
const DataFormatter = require('../utils/data_formatter');
const constants = require('../config/constants');

class SectorScraper {
  constructor() {
    this.baseUrl = constants.NEPSE_API.BASE;
    this.timeout = constants.REQUEST_TIMEOUT;
  }

  /**
   * Scrape sector data
   */
  async scrape() {
    try {
      logger.info('🔍 Scraping sector data...');

      const response = await axios.get(
        `${this.baseUrl}${constants.NEPSE_API.SECTOR_DATA}`,
        {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'NEPSE-Quant-Bot/1.0',
          },
        }
      );

      if (!response.data || !response.data.data) {
        throw new Error('Invalid sector API response');
      }

      const formattedData = DataFormatter.formatSectorData(response.data.data);

      logger.info(`✅ Successfully scraped ${formattedData.sectors.length} sectors`, {
        sectors: formattedData.sectors.map(s => s.name),
      });

      return formattedData;
    } catch (error) {
      logger.error('❌ Sector scrape failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new SectorScraper();

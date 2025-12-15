module.exports = {
  // Trading hours (Nepal time)
  TRADING_START: '11:00',
  TRADING_END: '15:00',

  // GitHub
  GITHUB: {
    BASE_URL: 'https://api.github.com',
    OWNER: process.env.DATA_LAKE_OWNER,
    REPO: process.env.DATA_LAKE_REPO,
    BRANCH: process.env.DATA_LAKE_BRANCH || 'main',
  },

  // NEPSE API endpoints
  NEPSE_API: {
    BASE: 'https://api.nepseapi.com',
    PRICE_DATA: '/api/security/prices',
    SECTOR_DATA: '/api/sectors',
    INDEX_DATA: '/api/indices',
  },

  // Data collection intervals
  SCRAPE_INTERVAL: {
    DEMAND_SUPPLY: 5 * 60 * 1000,   // 5 minutes
    SECTOR: 10 * 60 * 1000,         // 10 minutes
    PRICE: 15 * 60 * 1000,          // 15 minutes
  },

  // Data paths in repository
  DATA_PATHS: {
    RAW: 'data/raw',
    DEMAND_SUPPLY: `data/raw/${new Date().toISOString().split('T')}/demand_supply.json`,
    SECTOR: `data/raw/${new Date().toISOString().split('T')}/sector.json`,
    PRICES: `data/raw/${new Date().toISOString().split('T')}/prices.json`,
    EVENTS: `data/raw/${new Date().toISOString().split('T')}/events.json`,
  },

  // Retry logic
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,

  // Timeout
  REQUEST_TIMEOUT: 30000,
};

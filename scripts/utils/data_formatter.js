const { format } = require('date-fns');

class DataFormatter {
  /**
   * Format demand/supply data
   */
  static formatDemandSupply(rawData) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm:ss'),
      source: 'nepse-data-collector',
      demand_supply: (Array.isArray(rawData) ? rawData : []).map(stock => ({
        stock: stock.symbol || stock.name || 'UNKNOWN',
        TopBuyQty: parseInt(stock.topBuyQty || stock.topBuyQuantity || 0),
        TopBuyPrice: parseFloat(stock.topBuyPrice || 0),
        TopSellQty: parseInt(stock.topSellQty || stock.topSellQuantity || 0),
        TopSellPrice: parseFloat(stock.topSellPrice || 0),
        BuyOrders: parseInt(stock.buyOrders || 0),
        SellOrders: parseInt(stock.sellOrders || 0),
        LastTradedPrice: parseFloat(stock.lastTradedPrice || stock.ltp || 0),
        Volume: parseInt(stock.volume || 0),
      })),
      metadata: {
        total_stocks: (Array.isArray(rawData) ? rawData : []).length,
        collection_source: 'NEPSE',
      },
    };
  }

  /**
   * Format sector data
   */
  static formatSectorData(rawData) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm:ss'),
      source: 'nepse-data-collector',
      sectors: (Array.isArray(rawData) ? rawData : []).map(sector => ({
        name: sector.name || 'UNKNOWN',
        turnover: parseFloat(sector.turnover || 0),
        volume: parseInt(sector.volume || 0),
        tradeCount: parseInt(sector.tradeCount || 0),
        change: parseFloat(sector.change || 0),
        changePercent: parseFloat(sector.changePercent || 0),
        index_value: parseFloat(sector.indexValue || 0),
      })),
      metadata: {
        total_sectors: (Array.isArray(rawData) ? rawData : []).length,
      },
    };
  }

  /**
   * Format OHLCV prices
   */
  static formatPrices(rawData) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm:ss'),
      source: 'nepse-data-collector',
      prices: (Array.isArray(rawData) ? rawData : []).map(stock => ({
        stock: stock.symbol || stock.name || 'UNKNOWN',
        open: parseFloat(stock.open || 0),
        high: parseFloat(stock.high || 0),
        low: parseFloat(stock.low || 0),
        close: parseFloat(stock.close || stock.ltp || 0),
        volume: parseInt(stock.volume || 0),
        change: parseFloat(stock.change || 0),
        changePercent: parseFloat(stock.changePercent || 0),
        tradedQuantity: parseInt(stock.tradedQuantity || 0),
      })),
      metadata: {
        total_stocks: (Array.isArray(rawData) ? rawData : []).length,
      },
    };
  }

  /**
   * Format events
   */
  static formatEvents(rawData) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm:ss'),
      source: 'nepse-data-collector',
      events: (Array.isArray(rawData) ? rawData : []).map(event => ({
        type: event.type || 'UNKNOWN', // IPO, RIGHTS, DIVIDEND, NEWS, etc
        stock: event.stock || event.symbol || 'N/A',
        title: event.title || event.description || '',
        date: event.date || event.eventDate || '',
        details: event.details || {},
      })),
      metadata: {
        total_events: (Array.isArray(rawData) ? rawData : []).length,
      },
    };
  }

  /**
   * Get today's date string
   */
  static getTodayPath() {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

module.exports = DataFormatter;

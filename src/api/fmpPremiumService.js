/**
 * Financial Modeling Prep (FMP) Premium API Service
 * 
 * This service is optimized for the Premium ($69/month) plan with:
 * - 750 API calls per minute
 * - Access to comprehensive financial data
 * - Batch data retrieval capabilities
 * - 5 years of financial statement data
 */

import axios from 'axios';
import { loadState, saveState } from '../services/storage/localStorageService';

// Constants
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'fmp_data_';

/**
 * FMP Premium API Service
 */
class FMPPremiumService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.rateLimit = 750; // Premium plan rate limit (calls per minute)
    this.pendingRequests = [];
    this.isProcessingQueue = false;
    this.requestsMade = 0;
    this.lastResetTime = Date.now();
    
    // Reset request counter every minute
    setInterval(() => {
      this.requestsMade = 0;
      this.lastResetTime = Date.now();
    }, 60 * 1000);
  }

  /**
   * Make an API request with rate limiting and caching
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise} - API response
   */
  async request(endpoint, params = {}, useCache = true) {
    const cacheKey = this._getCacheKey(endpoint, params);
    
    // Check cache first
    if (useCache) {
      const cachedData = this._getFromCache(cacheKey);
      if (cachedData) {
        console.log(`Retrieved ${endpoint} from cache`);
        return cachedData;
      }
    }
    
    // Add API key to params
    const requestParams = {
      ...params,
      apikey: this.apiKey
    };
    
    // Execute the request or queue it based on rate limits
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          if (this.requestsMade >= this.rateLimit) {
            // Wait until the next minute if we've hit the rate limit
            const timeToWait = 60 * 1000 - (Date.now() - this.lastResetTime);
            await new Promise(r => setTimeout(r, timeToWait > 0 ? timeToWait : 0));
          }
          
          this.requestsMade++;
          const response = await axios.get(`${FMP_BASE_URL}${endpoint}`, {
            params: requestParams,
            timeout: 30000 // 30 second timeout
          });
          
          // Cache the result
          if (useCache && response.data) {
            this._saveToCache(cacheKey, response.data);
          }
          
          resolve(response.data);
        } catch (error) {
          console.error(`Error fetching ${endpoint}:`, error.message);
          reject(error);
        }
      };
      
      // Add to queue if we're near rate limit
      if (this.requestsMade >= this.rateLimit * 0.9) {
        this.pendingRequests.push(executeRequest);
        this._processQueue();
      } else {
        executeRequest();
      }
    });
  }
  
  /**
   * Process the request queue
   */
  async _processQueue() {
    if (this.isProcessingQueue || this.pendingRequests.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.pendingRequests.length > 0) {
      if (this.requestsMade < this.rateLimit) {
        const request = this.pendingRequests.shift();
        request();
      } else {
        // Wait until rate limit resets
        const timeToWait = 60 * 1000 - (Date.now() - this.lastResetTime);
        await new Promise(r => setTimeout(r, timeToWait > 0 ? timeToWait : 0));
      }
    }
    
    this.isProcessingQueue = false;
  }
  
  /**
   * Generate cache key from endpoint and parameters
   */
  _getCacheKey(endpoint, params) {
    const paramString = Object.entries(params)
      .filter(([key]) => key !== 'apikey')
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return `${CACHE_PREFIX}${endpoint}?${paramString}`;
  }
  
  /**
   * Get data from cache
   */
  _getFromCache(key) {
    const cached = loadState(key);
    if (!cached) return null;
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Save data to cache
   */
  _saveToCache(key, data) {
    saveState(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear all cached data
   */
  clearCache() {
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Remove all keys with our prefix
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('FMP cache cleared');
  }
  
  /**
   * Get company profile data
   * @param {string} symbol - Stock symbol
   * @returns {Promise} - Company profile data
   */
  async getCompanyProfile(symbol) {
    return this.request(`/profile/${symbol}`);
  }
  
  /**
   * Get company quotes (current price data)
   * @param {string|Array} symbols - Single symbol or array of symbols
   * @returns {Promise} - Quote data
   */
  async getQuote(symbols) {
    const symbolString = Array.isArray(symbols) ? symbols.join(',') : symbols;
    return this.request(`/quote/${symbolString}`);
  }
  
  /**
   * Get batch quotes for multiple symbols (premium feature)
   * Useful for screening a large number of stocks
   * @param {Array} symbols - Array of stock symbols
   * @returns {Promise} - Batch quote data
   */
  async getBatchQuotes(symbols) {
    // Split into chunks of 25 to avoid URL length issues
    const chunkSize = 25;
    const chunks = [];
    
    for (let i = 0; i < symbols.length; i += chunkSize) {
      chunks.push(symbols.slice(i, i + chunkSize));
    }
    
    const results = [];
    
    for (const chunk of chunks) {
      const symbolString = chunk.join(',');
      const data = await this.request(`/quote/${symbolString}`);
      if (Array.isArray(data)) {
        results.push(...data);
      }
    }
    
    return results;
  }
  
  /**
   * Get historical daily prices
   * @param {string} symbol - Stock symbol
   * @param {Object} options - Options for fetching historical data
   * @returns {Promise} - Historical price data
   */
  async getHistoricalPrices(symbol, options = {}) {
    const { from, to, timeseries = 365 } = options;
    
    let endpoint = `/historical-price-full/${symbol}`;
    
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (timeseries) params.timeseries = timeseries;
    
    return this.request(endpoint, params);
  }
  
  /**
   * Get income statement data
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of statements to retrieve
   * @returns {Promise} - Income statement data
   */
  async getIncomeStatement(symbol, period = 'annual', limit = 5) {
    return this.request(`/income-statement/${symbol}`, {
      period,
      limit
    });
  }
  
  /**
   * Get balance sheet data
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of statements to retrieve
   * @returns {Promise} - Balance sheet data
   */
  async getBalanceSheet(symbol, period = 'annual', limit = 5) {
    return this.request(`/balance-sheet-statement/${symbol}`, {
      period,
      limit
    });
  }
  
  /**
   * Get cash flow statement data
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of statements to retrieve
   * @returns {Promise} - Cash flow statement data
   */
  async getCashFlowStatement(symbol, period = 'annual', limit = 5) {
    return this.request(`/cash-flow-statement/${symbol}`, {
      period,
      limit
    });
  }
  
  /**
   * Get financial ratios
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of periods to retrieve
   * @returns {Promise} - Financial ratios data
   */
  async getFinancialRatios(symbol, period = 'annual', limit = 5) {
    return this.request(`/ratios/${symbol}`, {
      period,
      limit
    });
  }
  
  /**
   * Get key metrics
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of periods to retrieve
   * @returns {Promise} - Key metrics data
   */
  async getKeyMetrics(symbol, period = 'annual', limit = 5) {
    return this.request(`/key-metrics/${symbol}`, {
      period,
      limit
    });
  }
  
  /**
   * Get enterprise value
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of periods to retrieve
   * @returns {Promise} - Enterprise value data
   */
  async getEnterpriseValue(symbol, period = 'annual', limit = 5) {
    return this.request(`/enterprise-values/${symbol}`, {
      period,
      limit
    });
  }
  
  /**
   * Get historical financial ratios
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of periods to retrieve
   * @returns {Promise} - Historical ratios
   */
  async getHistoricalRatios(symbol, period = 'annual', limit = 10) {
    return this.request(`/historical-price-full/ratios/${symbol}`, {
      period,
      limit
    });
  }
  
  /**
   * Get stock screener results
   * With Premium plan we can use advanced screening capabilities
   * @param {Object} criteria - Screening criteria
   * @returns {Promise} - Screener results
   */
  async screenStocks(criteria = {}) {
    // Set defaults for missing criteria
    const params = {
      isActivelyTrading: true,
      ...criteria
    };
    
    return this.request('/stock-screener', params);
  }
  
  /**
   * Get sector performance
   * @returns {Promise} - Sector performance data
   */
  async getSectorPerformance() {
    return this.request('/sector-performance');
  }
  
  /**
   * Get stock list (all available tickers)
   * @returns {Promise} - List of all stocks
   */
  async getStockList() {
    return this.request('/stock/list');
  }
  
  /**
   * Get batch fundamental data (Premium feature)
   * This allows fetching multiple data types for a single symbol in one request
   * @param {string} symbol - Stock symbol
   * @returns {Promise} - Comprehensive fundamental data
   */
  async getBatchFundamentals(symbol) {
    return this.request(`/batch/${symbol}`, {
      types: 'profile,quote,financial-growth,financial-ratios,enterprise-value,income-statement,balance-sheet-statement,cash-flow-statement,key-metrics'
    });
  }
  
  /**
   * Get historical owner earnings data
   * @param {string} symbol - Stock symbol
   * @param {number} years - Number of years of data
   * @returns {Promise} - Calculated owner earnings data
   */
  async getHistoricalOwnerEarnings(symbol, years = 5) {
    // Get required financial statements
    const incomeStatements = await this.getIncomeStatement(symbol, 'annual', years);
    const cashFlowStatements = await this.getCashFlowStatement(symbol, 'annual', years);
    const balanceSheets = await this.getBalanceSheet(symbol, 'annual', years + 1); // Need n+1 for working capital changes
    
    // Create a map of dates to statements for easier lookup
    const cashFlowByDate = {};
    const balanceSheetByDate = {};
    
    cashFlowStatements.forEach(statement => {
      cashFlowByDate[statement.date] = statement;
    });
    
    balanceSheets.forEach(statement => {
      balanceSheetByDate[statement.date] = statement;
    });
    
    // Calculate owner earnings for each year
    const ownerEarnings = incomeStatements.map(incomeStatement => {
      const date = incomeStatement.date;
      const cashFlow = cashFlowByDate[date];
      
      if (!cashFlow) {
        return {
          date,
          netIncome: incomeStatement.netIncome,
          ownerEarnings: null,
          error: 'Missing cash flow data'
        };
      }
      
      // Calculate working capital change
      const balanceSheet = balanceSheetByDate[date];
      const previousYear = new Date(new Date(date).setFullYear(new Date(date).getFullYear() - 1)).toISOString().split('T')[0];
      const previousBalanceSheet = balanceSheetByDate[previousYear];
      
      let workingCapitalChange = 0;
      
      if (balanceSheet && previousBalanceSheet) {
        const currentWorkingCapital = (balanceSheet.totalCurrentAssets || 0) - (balanceSheet.totalCurrentLiabilities || 0);
        const previousWorkingCapital = (previousBalanceSheet.totalCurrentAssets || 0) - (previousBalanceSheet.totalCurrentLiabilities || 0);
        
        workingCapitalChange = currentWorkingCapital - previousWorkingCapital;
      }
      
      // Calculate owner earnings
      // Owner Earnings = Net Income + Depreciation & Amortization - Capital Expenditures - Working Capital Change
      const ownerEarnings = 
        (incomeStatement.netIncome || 0) + 
        (cashFlow.depreciationAndAmortization || 0) - 
        Math.abs(cashFlow.capitalExpenditure || 0) - 
        workingCapitalChange;
      
      return {
        date,
        netIncome: incomeStatement.netIncome,
        depreciation: cashFlow.depreciationAndAmortization,
        capex: cashFlow.capitalExpenditure,
        workingCapitalChange,
        ownerEarnings,
        shares: incomeStatement.weightedAverageShsOut || cashFlow.weightedAverageShsOut,
        ownerEarningsPerShare: ownerEarnings / (incomeStatement.weightedAverageShsOut || cashFlow.weightedAverageShsOut || 1)
      };
    });
    
    return ownerEarnings;
  }
  
  /**
   * Get quality-focused stock list with relative valuation metrics
   * Specifically designed for overvalued markets
   * @param {Object} filters - Filtering criteria
   * @returns {Promise} - List of quality stocks with metrics
   */
  async getQualityStocksRelativeValuation(filters = {}) {
    // Set default filters focusing on quality metrics
    const defaultFilters = {
      marketCapMoreThan: 1000000000, // $1B+ market cap
      betaMoreThan: 0,
      betaLessThan: 1.5, // Moderate to low volatility
      volumeMoreThan: 100000, // Reasonable liquidity
      dividendMoreThan: 0.5, // Some dividend
      isActivelyTrading: true
    };
    
    const screenParams = { ...defaultFilters, ...filters };
    
    // Get initial screener results
    const screenResults = await this.screenStocks(screenParams);
    
    if (!screenResults || !Array.isArray(screenResults) || screenResults.length === 0) {
      return [];
    }
    
    // Get symbols from screen results
    const symbols = screenResults.map(stock => stock.symbol);
    
    // Get historical valuation ratios for these stocks
    const enhancedStocks = [];
    
    // Process in batches to respect API limits
    const batchSize = 20;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      // Process each stock in the batch
      const batchPromises = batch.map(async symbol => {
        try {
          // Get stock's historical ratios
          const historicalRatios = await this.getHistoricalRatios(symbol);
          
          // Get the base stock data from screen results
          const baseStock = screenResults.find(s => s.symbol === symbol);
          
          if (!baseStock || !historicalRatios || !historicalRatios.historical) {
            return null;
          }
          
          // Calculate relative valuation metrics
          const currentPE = baseStock.pe || 0;
          const currentPB = baseStock.pb || 0;
          
          // Get historical PE and PB values
          const historicalPEs = historicalRatios.historical
            .filter(h => h.pe > 0)
            .map(h => h.pe);
          
          const historicalPBs = historicalRatios.historical
            .filter(h => h.pb > 0)
            .map(h => h.pb);
          
          // Calculate percentiles
          const pePercentile = this._calculatePercentile(currentPE, historicalPEs);
          const pbPercentile = this._calculatePercentile(currentPB, historicalPBs);
          
          // Get additional quality metrics
          const keyMetrics = await this.getKeyMetrics(symbol);
          const ratios = await this.getFinancialRatios(symbol);
          
          // Add enhanced data to the stock
          const enhancedStock = {
            ...baseStock,
            historical: {
              pePercentile,
              pbPercentile,
              medianPE: this._median(historicalPEs),
              medianPB: this._median(historicalPBs),
              minPE: Math.min(...historicalPEs),
              maxPE: Math.max(...historicalPEs),
              peToPeakRatio: currentPE / Math.max(...historicalPEs),
              currentToMedianPERatio: currentPE / this._median(historicalPEs)
            },
            quality: {
              roic: keyMetrics.length > 0 ? keyMetrics[0].roic : null,
              roe: ratios.length > 0 ? ratios[0].returnOnEquity : null,
              roa: ratios.length > 0 ? ratios[0].returnOnAssets : null,
              debtToEquity: ratios.length > 0 ? ratios[0].debtToEquity : null,
              interestCoverage: ratios.length > 0 ? ratios[0].interestCoverage : null,
              currentRatio: ratios.length > 0 ? ratios[0].currentRatio : null,
              freeCashFlowYield: keyMetrics.length > 0 ? keyMetrics[0].freeCashFlowYield : null
            }
          };
          
          return enhancedStock;
        } catch (error) {
          console.error(`Error processing stock ${symbol}:`, error.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      enhancedStocks.push(...batchResults.filter(stock => stock !== null));
      
      // Delay between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Sort results by relative valuation (lower percentile = more attractive)
    return enhancedStocks.sort((a, b) => 
      (a.historical.pePercentile + a.historical.pbPercentile) - 
      (b.historical.pePercentile + b.historical.pbPercentile)
    );
  }
  
  /**
   * Calculate percentile of a value in its historical context
   * @param {number} value - Current value
   * @param {Array} historicalValues - Array of historical values
   * @returns {number} - Percentile (0-100)
   */
  _calculatePercentile(value, historicalValues) {
    if (!historicalValues || historicalValues.length === 0) return null;
    
    // Sort values from smallest to largest
    const sorted = [...historicalValues].sort((a, b) => a - b);
    
    // Find the position of the current value
    let position = sorted.findIndex(v => v >= value);
    
    if (position === -1) {
      // Value is larger than all historical values
      return 100;
    }
    
    // Calculate percentile
    return (position / sorted.length) * 100;
  }
  
  /**
   * Calculate median value
   * @param {Array} values - Array of numbers
   * @returns {number} - Median value
   */
  _median(values) {
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

export default FMPPremiumService;
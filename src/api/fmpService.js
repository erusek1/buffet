import axios from 'axios';
import apiConfig from './apiConfig';

// Cache for API responses
const apiCache = new Map();

// Rate limiting variables
let requestsThisMinute = 0;
let lastResetTime = Date.now();

/**
 * Check if we're within rate limits
 */
const checkRateLimit = () => {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    // Reset if a minute has passed
    requestsThisMinute = 0;
    lastResetTime = now;
  }
  
  if (requestsThisMinute >= apiConfig.rateLimit.requestsPerMinute) {
    throw new Error('API rate limit reached. Please try again in a minute.');
  }
  
  requestsThisMinute++;
};

/**
 * Makes a request to the Financial Modeling Prep API
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise} - Response data
 */
const fetchFromAPI = async (endpoint, params = {}) => {
  try {
    // Create cache key based on endpoint and parameters
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    
    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData && Date.now() < cachedData.expiry) {
      console.log(`Using cached data for ${endpoint}`);
      return cachedData.data;
    }
    
    // Check rate limit
    checkRateLimit();
    
    // Add API key to parameters
    params.apikey = apiConfig.apiKey;
    
    // Debug: log API key (partial for security)
    if (apiConfig.apiKey) {
      const maskedKey = apiConfig.apiKey.substring(0, 3) + '...' + 
        apiConfig.apiKey.substring(apiConfig.apiKey.length - 3);
      console.log(`Using API key: ${maskedKey} for endpoint: ${endpoint}`);
    } else {
      console.warn('No API key provided. Check your apiConfig.js file');
    }
    
    // Make the request
    const response = await axios.get(`${apiConfig.baseUrl}${endpoint}`, {
      params,
    });
    
    // Cache the response with appropriate TTL
    const cacheTTL = endpoint.includes('statement') ? 
      apiConfig.cache.financialStatementsTTL : 
      apiConfig.cache.stockDataTTL;
    
    apiCache.set(cacheKey, {
      data: response.data,
      expiry: Date.now() + cacheTTL,
    });
    
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    
    // Extract error message from API response if available
    const errorMessage = error.response?.data?.error || 'API request failed';
    const statusCode = error.response?.status || 500;
    
    throw new Error(`API error: ${statusCode} - ${errorMessage}`);
  }
};

/**
 * Get company profile data
 * @param {string} symbol - Stock ticker symbol
 * @returns {Promise} - Company profile data
 */
export const getCompanyProfile = async (symbol) => {
  return fetchFromAPI(`${apiConfig.endpoints.profile}${symbol}`);
};

/**
 * Get current stock price quote
 * @param {string} symbol - Stock ticker symbol
 * @returns {Promise} - Stock quote data
 */
export const getStockQuote = async (symbol) => {
  return fetchFromAPI(`${apiConfig.endpoints.quote}${symbol}`);
};

/**
 * Get company's income statement data
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Income statement data
 */
export const getIncomeStatement = async (symbol, limit = 5) => {
  return fetchFromAPI(`${apiConfig.endpoints.income}${symbol}`, { limit });
};

/**
 * Get company's balance sheet data
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Balance sheet data
 */
export const getBalanceSheet = async (symbol, limit = 5) => {
  return fetchFromAPI(`${apiConfig.endpoints.balance}${symbol}`, { limit });
};

/**
 * Get company's cash flow statement data
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Cash flow statement data
 */
export const getCashFlow = async (symbol, limit = 5) => {
  return fetchFromAPI(`${apiConfig.endpoints.cashflow}${symbol}`, { limit });
};

/**
 * Get company's key metrics
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Key metrics data
 */
export const getKeyMetrics = async (symbol, limit = 5) => {
  return fetchFromAPI(`${apiConfig.endpoints.metrics}${symbol}`, { limit });
};

/**
 * Get company's ratios
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Ratios data
 */
export const getRatios = async (symbol, limit = 5) => {
  return fetchFromAPI(`${apiConfig.endpoints.ratios}${symbol}`, { limit });
};

/**
 * Get all financial statements in one call
 * @param {string} symbol - Stock ticker symbol
 * @returns {Promise} - Object containing all financial statements
 */
export const getFinancialStatements = async (symbol) => {
  try {
    console.log(`Fetching financial data for: ${symbol}`);
    // Make parallel requests for all financial data
    const [profile, quote, incomeStatement, balanceSheet, cashFlow, keyMetrics, ratios] = await Promise.all([
      getCompanyProfile(symbol),
      getStockQuote(symbol),
      getIncomeStatement(symbol),
      getBalanceSheet(symbol),
      getCashFlow(symbol),
      getKeyMetrics(symbol),
      getRatios(symbol),
    ]);
    
    return {
      profile,
      quote,
      incomeStatement,
      balanceSheet,
      cashFlow,
      keyMetrics,
      ratios,
    };
  } catch (error) {
    console.error('Error fetching financial statements:', error);
    throw error;
  }
};

/**
 * Get quotes for multiple stocks
 * Added to support the stockScreener service
 */
export const getBatchQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) {
    return [];
  }
  
  try {
    // FMP API supports comma-separated symbols for batch quotes
    const symbolString = symbols.join(',');
    return await fetchFromAPI(`${apiConfig.endpoints.quote}${symbolString}`);
  } catch (error) {
    console.error('Error fetching batch quotes:', error);
    throw error;
  }
};

/**
 * Get company financials
 * Added to support the stockScreener service
 */
export const getCompanyFinancials = async (symbol) => {
  return getFinancialStatements(symbol);
};

/**
 * Test API connection and authentication
 * @returns {Promise} - Test result
 */
export const testAPIConnection = async () => {
  try {
    // Try to fetch a well-known stock to test connection
    const result = await getCompanyProfile('AAPL');
    return {
      success: true,
      message: 'API connection successful',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'API connection failed',
    };
  }
};

/**
 * Get full financial data for multiple stocks
 * This is used for the opportunity scanner
 */
export const getBatchStockData = async (symbols) => {
  if (!symbols || symbols.length === 0) {
    return [];
  }
  
  // Process in smaller batches to avoid overwhelming the API
  const batchSize = apiConfig.rateLimit.maxBatchSize || 5;
  const results = [];
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batchSymbols = symbols.slice(i, i + batchSize);
    
    try {
      // Process stocks in parallel within the batch
      const batchResults = await Promise.all(
        batchSymbols.map(async (symbol) => {
          try {
            return await getFinancialStatements(symbol);
          } catch (error) {
            console.warn(`Error fetching data for ${symbol}:`, error);
            return null;
          }
        })
      );
      
      // Add valid results to the final array
      results.push(...batchResults.filter(Boolean));
      
      // Brief pause to avoid hitting rate limits
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error processing batch of symbols:`, error);
      // Continue with the next batch even if there's an error
    }
  }
  
  return results;
};

/**
 * Get market screener results based on specified criteria
 * Used for initial filtering of stocks
 */
export const getMarketScreener = async (screenParams) => {
  try {
    // Use the stock screener endpoint
    const results = await fetchFromAPI(apiConfig.endpoints.screener, screenParams);
    
    return results || [];
  } catch (error) {
    console.error('Market screener error:', error);
    throw error;
  }
};

/**
 * Get a list of all traded symbols
 * This is useful for the opportunity scanner to get all available stocks
 */
export const getAllSymbols = async () => {
  try {
    const result = await fetchFromAPI(apiConfig.endpoints.symbols);
    
    // Filter to keep only common stocks from major exchanges
    return result.filter(stock => {
      const type = stock.type?.toUpperCase();
      const exchange = stock.exchange?.toUpperCase();
      
      // Keep common stocks from major exchanges
      return type === 'STOCK' && 
        ['NYSE', 'NASDAQ', 'AMEX', 'EURONEXT', 'TSX', 'LSE'].includes(exchange);
    });
  } catch (error) {
    console.error('Error fetching all symbols:', error);
    throw error;
  }
};

// Create a proper service object
const fmpService = {
  getCompanyProfile,
  getStockQuote,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getKeyMetrics,
  getRatios,
  getFinancialStatements,
  testAPIConnection,
  getBatchStockData,
  getMarketScreener,
  getAllSymbols,
  getBatchQuotes,
  getCompanyFinancials
};

export default fmpService;
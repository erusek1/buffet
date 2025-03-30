import axios from 'axios';

// Cache for API responses
const apiCache = new Map();

// API configuration
const API_CONFIG = {
  BASE_URL: 'https://financialmodelingprep.com/api/v3',
  API_KEY: process.env.REACT_APP_FMP_API_KEY || '', // Set your API key in .env file
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

/**
 * Makes a request to the Financial Modeling Prep API
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise} - Response data
 */
<<<<<<< HEAD
const fetchFromAPI = async (endpoint, params = {}) => {
=======
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
 * Make an API request with rate limiting and caching
 */
const makeRequest = async (endpoint, params = {}, cacheTTL = null) => {
  // Build the URL
  const url = new URL(`${apiConfig.baseUrl}${endpoint}`);
  
  // Add API key
  url.searchParams.append('apikey', apiConfig.apiKey);
  
  // Debug: log API key (partial for security)
  console.log(`Using API key: ${apiConfig.apiKey.substring(0, 5)}...${apiConfig.apiKey.substring(apiConfig.apiKey.length - 5)}`);
  
  // Add other parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const cacheKey = url.toString();
  console.log(`Making API request to: ${url.toString()}`);
  
  // Check cache first if TTL is provided
  if (cacheTTL !== null) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data');
      return cachedData;
    }
  }
  
  // Check rate limit
  checkRateLimit();
  
>>>>>>> 8b6e456c631ecf3a6ae9761eb36ca24777a0a583
  try {
    // Create cache key based on endpoint and parameters
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    
<<<<<<< HEAD
    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData && Date.now() < cachedData.expiry) {
      return cachedData.data;
=======
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      console.error('Response details:', await response.text());
      throw new Error(`API error: ${response.status} ${response.statusText}`);
>>>>>>> 8b6e456c631ecf3a6ae9761eb36ca24777a0a583
    }
    
    // Add API key to parameters
    params.apikey = API_CONFIG.API_KEY;
    
    // Make the request
    const response = await axios.get(`${API_CONFIG.BASE_URL}${endpoint}`, {
      params,
    });
    
    // Cache the response
    apiCache.set(cacheKey, {
      data: response.data,
      expiry: Date.now() + API_CONFIG.CACHE_DURATION,
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
  return fetchFromAPI(`/profile/${symbol}`);
};

/**
 * Get company's income statement data
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Income statement data
 */
export const getIncomeStatement = async (symbol, limit = 5) => {
  return fetchFromAPI(`/income-statement/${symbol}`, { limit });
};

/**
 * Get company's balance sheet data
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Balance sheet data
 */
export const getBalanceSheet = async (symbol, limit = 5) => {
  return fetchFromAPI(`/balance-sheet-statement/${symbol}`, { limit });
};

/**
 * Get company's cash flow statement data
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Cash flow statement data
 */
export const getCashFlow = async (symbol, limit = 5) => {
  return fetchFromAPI(`/cash-flow-statement/${symbol}`, { limit });
};

/**
 * Get company's key metrics
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Key metrics data
 */
export const getKeyMetrics = async (symbol, limit = 5) => {
  return fetchFromAPI(`/key-metrics/${symbol}`, { limit });
};

/**
 * Get company's ratios
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of periods to fetch
 * @returns {Promise} - Ratios data
 */
export const getRatios = async (symbol, limit = 5) => {
  return fetchFromAPI(`/ratios/${symbol}`, { limit });
};

/**
 * Get all financial statements in one call
 * @param {string} symbol - Stock ticker symbol
 * @returns {Promise} - Object containing all financial statements
 */
export const getFinancialStatements = async (symbol) => {
  try {
<<<<<<< HEAD
    // Make parallel requests for all financial data
    const [incomeStatement, balanceSheet, cashFlow, keyMetrics, ratios] = await Promise.all([
      getIncomeStatement(symbol),
      getBalanceSheet(symbol),
      getCashFlow(symbol),
=======
    console.log(`Fetching financial data for: ${symbol}`);
    const [profile, quote, incomeStatements, balanceSheets, cashFlows, metrics, ratios] = await Promise.all([
      getCompanyProfile(symbol),
      getStockQuote(symbol),
      getIncomeStatements(symbol),
      getBalanceSheets(symbol),
      getCashFlowStatements(symbol),
>>>>>>> 8b6e456c631ecf3a6ae9761eb36ca24777a0a583
      getKeyMetrics(symbol),
      getRatios(symbol),
    ]);
    
    return {
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
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batchSymbols = symbols.slice(i, i + batchSize);
    
    try {
      // Process stocks in parallel within the batch
      const batchResults = await Promise.all(
        batchSymbols.map(async (symbol) => {
          try {
            return await getCompanyFinancials(symbol);
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
    const results = await makeRequest(apiConfig.endpoints.screener, screenParams, 60 * 60 * 1000); // 1 hour cache
    
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
    const result = await makeRequest(apiConfig.endpoints.symbols, {}, 24 * 60 * 60 * 1000); // 24 hour cache
    
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
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getKeyMetrics,
<<<<<<< HEAD
  getRatios,
  getFinancialStatements,
  testAPIConnection,
};
=======
  getFinancialRatios,
  getCompanyFinancials,
  getBatchQuotes,
  getBatchStockData,
  getMarketScreener,
  getAllSymbols
};

export default fmpService;
>>>>>>> 8b6e456c631ecf3a6ae9761eb36ca24777a0a583

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
const fetchFromAPI = async (endpoint, params = {}) => {
  try {
    // Create cache key based on endpoint and parameters
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    
    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData && Date.now() < cachedData.expiry) {
      return cachedData.data;
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
    // Make parallel requests for all financial data
    const [incomeStatement, balanceSheet, cashFlow, keyMetrics, ratios] = await Promise.all([
      getIncomeStatement(symbol),
      getBalanceSheet(symbol),
      getCashFlow(symbol),
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

export default {
  getCompanyProfile,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getKeyMetrics,
  getRatios,
  getFinancialStatements,
  testAPIConnection,
};
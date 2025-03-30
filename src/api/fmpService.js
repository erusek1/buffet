import apiConfig from './apiConfig';

// For rate limiting
let requestsThisMinute = 0;
let lastResetTime = Date.now();

// Simple cache implementation
const cache = {
  data: {},
  
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      delete this.data[key];
      return null;
    }
    
    return item.value;
  },
  
  set(key, value, ttl) {
    this.data[key] = {
      value,
      expiry: Date.now() + ttl
    };
  }
};

/**
 * Reset rate limit counter if a minute has passed
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
 * Make an API request with rate limiting and caching
 */
const makeRequest = async (endpoint, params = {}, cacheTTL = null) => {
  // Build the URL
  const url = new URL(`${apiConfig.baseUrl}${endpoint}`);
  
  // Add API key
  url.searchParams.append('apikey', apiConfig.apiKey);
  
  // Add other parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const cacheKey = url.toString();
  
  // Check cache first if TTL is provided
  if (cacheTTL !== null) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;
  }
  
  // Check rate limit
  checkRateLimit();
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result if TTL is provided
    if (cacheTTL !== null) {
      cache.set(cacheKey, data, cacheTTL);
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get company profile
 */
export const getCompanyProfile = async (symbol) => {
  return makeRequest(apiConfig.endpoints.profile + symbol, {}, apiConfig.cache.stockDataTTL);
};

/**
 * Get current stock quote
 */
export const getStockQuote = async (symbol) => {
  return makeRequest(apiConfig.endpoints.quote + symbol, {}, 15 * 60 * 1000); // 15 minutes cache
};

/**
 * Get income statements
 */
export const getIncomeStatements = async (symbol, limit = 5) => {
  return makeRequest(apiConfig.endpoints.income + symbol, { limit }, apiConfig.cache.financialStatementsTTL);
};

/**
 * Get balance sheet statements
 */
export const getBalanceSheets = async (symbol, limit = 5) => {
  return makeRequest(apiConfig.endpoints.balance + symbol, { limit }, apiConfig.cache.financialStatementsTTL);
};

/**
 * Get cash flow statements
 */
export const getCashFlowStatements = async (symbol, limit = 5) => {
  return makeRequest(apiConfig.endpoints.cashflow + symbol, { limit }, apiConfig.cache.financialStatementsTTL);
};

/**
 * Get key metrics
 */
export const getKeyMetrics = async (symbol, limit = 5) => {
  return makeRequest(apiConfig.endpoints.metrics + symbol, { limit }, apiConfig.cache.financialStatementsTTL);
};

/**
 * Get financial ratios
 */
export const getFinancialRatios = async (symbol, limit = 5) => {
  return makeRequest(apiConfig.endpoints.ratios + symbol, { limit }, apiConfig.cache.financialStatementsTTL);
};

/**
 * Get all financial data for a company in one call
 */
export const getCompanyFinancials = async (symbol) => {
  try {
    const [profile, quote, incomeStatements, balanceSheets, cashFlows, metrics, ratios] = await Promise.all([
      getCompanyProfile(symbol),
      getStockQuote(symbol),
      getIncomeStatements(symbol),
      getBalanceSheets(symbol),
      getCashFlowStatements(symbol),
      getKeyMetrics(symbol),
      getFinancialRatios(symbol)
    ]);
    
    return {
      profile: profile[0] || {},
      quote: quote[0] || {},
      incomeStatements: incomeStatements || [],
      balanceSheets: balanceSheets || [],
      cashFlows: cashFlows || [],
      metrics: metrics || [],
      ratios: ratios || []
    };
  } catch (error) {
    console.error('Failed to fetch company financials:', error);
    throw error;
  }
};

/**
 * Get multiple stock quotes in batch
 * Only available on Premium plan and above
 */
export const getBatchQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) {
    return [];
  }
  
  // Batch limit enforcement
  if (symbols.length > apiConfig.rateLimit.maxBatchSize) {
    console.warn(`Batch size exceeds limit. Splitting into multiple requests.`);
    
    const results = [];
    for (let i = 0; i < symbols.length; i += apiConfig.rateLimit.maxBatchSize) {
      const batch = symbols.slice(i, i + apiConfig.rateLimit.maxBatchSize);
      const batchResults = await getBatchQuotes(batch);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  const symbolsString = symbols.join(',');
  return makeRequest(apiConfig.endpoints.quote + symbolsString, {}, 15 * 60 * 1000);
};

export default {
  getCompanyProfile,
  getStockQuote,
  getIncomeStatements,
  getBalanceSheets,
  getCashFlowStatements,
  getKeyMetrics,
  getFinancialRatios,
  getCompanyFinancials,
  getBatchQuotes
};
/**
 * Financial Modeling Prep API configuration
 */
const apiConfig = {
  baseUrl: 'https://financialmodelingprep.com/api/v3',
  apiKey: 'QVSS1WlYvP0VqnRtqhmfE7Rvb4BnbWFc',
  
  // Rate limits based on Premium tier ($69/mo)
  rateLimit: {
    requestsPerMinute: 600, // Conservative from the 750 limit you have
    maxBatchSize: 25,       // Maximum stocks to fetch in one request
  },
  
  // Caching settings
  cache: {
    stockDataTTL: 24 * 60 * 60 * 1000,           // 24 hours for stock data
    financialStatementsTTL: 7 * 24 * 60 * 60 * 1000,  // 7 days for financials
  },
  
  // Endpoints
  endpoints: {
    profile: '/profile/',
    quote: '/quote/',
    income: '/income-statement/',
    balance: '/balance-sheet-statement/',
    cashflow: '/cash-flow-statement/',
    metrics: '/key-metrics/',
    ratios: '/ratios/',
    growth: '/financial-growth/',
    dcf: '/discounted-cash-flow/',
    screener: '/stock-screener', // For filtering stocks based on criteria
    symbols: '/stock/list', // For getting all available symbols
  }
};

export default apiConfig;
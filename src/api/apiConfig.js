/**
 * Financial Modeling Prep API configuration
 */
const apiConfig = {
    baseUrl: 'https://financialmodelingprep.com/api/v3',
    apiKey: process.env.REACT_APP_FMP_API_KEY || '',
    
    // Rate limits based on Premium tier ($69/mo)
    rateLimit: {
      requestsPerMinute: 600, // Slightly conservative from 750 limit
      maxBatchSize: 25,       // Maximum stocks to fetch in one request
    },
    
    // Caching settings
    cache: {
      stockDataTTL: 24 * 60 * 60 * 1000,     // 24 hours for stock data
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
    },
    
    // Quality filters for Buffett-style investing
    qualityFilters: {
      minRoe: 15,            // Return on Equity > 15%
      minRoa: 7,             // Return on Assets > 7%
      maxDebtToEquity: 0.5,  // Debt to Equity < 0.5
      minGrossMargin: 35,    // Gross Margin > 35%
      minOperatingMargin: 15, // Operating Margin > 15%
      minFreeCashFlow: 0,    // Positive Free Cash Flow
      minEarningsStability: 7, // Years of consistent earnings
    }
  };
  
  export default apiConfig;
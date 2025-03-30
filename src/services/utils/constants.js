/**
 * Application constants
 */

// Default analysis parameters
export const DEFAULT_VALUATION_PARAMS = {
  growthRate: 5,
  yearsProjected: 10,
  discountRate: 10,
  terminalGrowthRate: 2,
  marginOfSafety: 25
};

// Business quality categories
export const BUSINESS_QUALITY = {
  EXCELLENT: {
    id: 'excellent',
    label: 'Excellent',
    description: 'Very predictable earnings (e.g., Coca-Cola)',
    marginOfSafety: 25,
    discountRate: 9,
    examples: ['KO', 'JNJ', 'PG']
  },
  GOOD: {
    id: 'good',
    label: 'Good',
    description: 'Stable business with good moat',
    marginOfSafety: 35,
    discountRate: 10,
    examples: ['COST', 'HD', 'WMT']
  },
  FAIR: {
    id: 'fair',
    label: 'Fair',
    description: 'Less predictable earnings',
    marginOfSafety: 40,
    discountRate: 11,
    examples: ['INTC', 'CSCO', 'DIS']
  },
  CYCLICAL: {
    id: 'cyclical',
    label: 'Cyclical',
    description: 'Highly variable earnings',
    marginOfSafety: 50,
    discountRate: 12,
    examples: ['CAT', 'DE', 'BAC']
  }
};

// Stock market sectors
export const SECTORS = [
  { id: 'technology', name: 'Technology' },
  { id: 'financial', name: 'Financial' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'consumer_discretionary', name: 'Consumer Discretionary' },
  { id: 'consumer_staples', name: 'Consumer Staples' },
  { id: 'industrials', name: 'Industrials' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'energy', name: 'Energy' },
  { id: 'materials', name: 'Materials' },
  { id: 'real_estate', name: 'Real Estate' },
  { id: 'communication_services', name: 'Communication Services' }
];

// Financial statement periods
export const STATEMENT_PERIODS = {
  ANNUAL: 'annual',
  QUARTERLY: 'quarterly',
  TTM: 'ttm' // Trailing Twelve Months
};

// Valuation methods
export const VALUATION_METHODS = {
  DCF: {
    id: 'dcf',
    name: 'Discounted Cash Flow (DCF)',
    description: 'Based on future cash flows adjusted for time value of money',
    buffettStyle: true
  },
  EARNINGS_POWER: {
    id: 'earnings_power',
    name: 'Earnings Power Value',
    description: 'Based on normalized earnings power with no growth assumption',
    buffettStyle: true
  },
  GRAHAM_NUMBER: {
    id: 'graham_number',
    name: 'Graham Number',
    description: 'Square root of (22.5 * EPS * BVPS)',
    buffettStyle: false
  },
  PE_MULTIPLE: {
    id: 'pe_multiple',
    name: 'P/E Multiple',
    description: 'Based on earnings per share and a fair multiple',
    buffettStyle: false
  },
  ASSET_BASED: {
    id: 'asset_based',
    name: 'Asset-Based',
    description: 'Based on the value of assets minus liabilities',
    buffettStyle: false
  },
  EBIT_MULTIPLE: {
    id: 'ebit_multiple',
    name: 'EBIT Multiple',
    description: 'Based on EBIT and a fair multiple of operating earnings',
    buffettStyle: true
  }
};

// Cache durations
export const CACHE_DURATION = {
  STOCK_PRICE: 15 * 60 * 1000, // 15 minutes
  COMPANY_PROFILE: 24 * 60 * 60 * 1000, // 1 day
  FINANCIAL_STATEMENTS: 7 * 24 * 60 * 60 * 1000, // 1 week
  MARKET_DATA: 60 * 60 * 1000 // 1 hour
};

// Financial API endpoints (without base URL or API key)
export const API_ENDPOINTS = {
  PROFILE: '/profile/',
  INCOME_STATEMENT: '/income-statement/',
  BALANCE_SHEET: '/balance-sheet-statement/',
  CASH_FLOW: '/cash-flow-statement/',
  KEY_METRICS: '/key-metrics/',
  RATIOS: '/ratios/',
  QUOTE: '/quote/',
  SEARCH: '/search',
  SECTOR_PE: '/sector-pe-ratio/',
  STOCK_LIST: '/stock/list'
};

// Error messages
export const ERROR_MESSAGES = {
  API_UNAVAILABLE: 'The financial data service is currently unavailable. Please try again later.',
  STOCK_NOT_FOUND: 'Stock symbol not found. Please check the symbol and try again.',
  CALCULATION_ERROR: 'An error occurred during value calculation. Please check your inputs.',
  INSUFFICIENT_DATA: 'Insufficient financial data available for analysis.',
  NEGATIVE_EARNINGS: 'Company has negative earnings, which affects valuation accuracy.',
  CONNECTION_ERROR: 'Error connecting to the financial data service. Please check your internet connection.'
};

// Tooltip information
export const TOOLTIPS = {
  GROWTH_RATE: 'The expected annual growth rate for earnings or cash flows. Be conservative with this estimate.',
  DISCOUNT_RATE: 'The rate used to discount future cash flows to present value. Typically 8-12% based on risk.',
  MARGIN_OF_SAFETY: 'The discount applied to the intrinsic value to account for uncertainty and provide a buffer against errors.',
  TERMINAL_VALUE: 'The estimated value of all future cash flows beyond the projection period.',
  OWNER_EARNINGS: 'Warren Buffett\'s preferred metric: Net Income + Depreciation - Capital Expenditures - Working Capital Changes.',
  INTRINSIC_VALUE: 'The calculated "true value" of a company based on its future cash generation ability.',
  PE_RATIO: 'Price-to-Earnings ratio compares the current share price to the earnings per share.',
  PB_RATIO: 'Price-to-Book ratio compares the market value to the book value per share.',
  EV_EBITDA: 'Enterprise Value to EBITDA ratio is a capital structure-neutral valuation multiple.'
};

// Chart color schemes
export const CHART_COLORS = {
  primary: [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#6366F1', // indigo-500
    '#EC4899', // pink-500
    '#8B5CF6', // violet-500
    '#14B8A6', // teal-500
    '#F97316', // orange-500
    '#06B6D4', // cyan-500
    '#EF4444'  // red-500
  ],
  positive: '#10B981', // emerald-500
  negative: '#EF4444', // red-500
  neutral: '#6B7280' // gray-500
};

// Screening presets
export const SCREENING_PRESETS = {
  BUFFETT_STYLE: {
    name: 'Buffett Style Value',
    description: 'Companies with stable earnings, good ROE, and reasonable valuation',
    filters: {
      minROE: 15,
      maxDebtToEquity: 0.5,
      minMargin: 10,
      maxPE: 20
    }
  },
  DIVIDEND_FOCUS: {
    name: 'Quality Dividend Payers',
    description: 'Companies with stable dividends and growth',
    filters: {
      minDividendYield: 2,
      minDividendGrowth: 5,
      maxPayoutRatio: 70,
      minYearsPayingDividend: 5
    }
  },
  UNDERVALUED_GROWTH: {
    name: 'Undervalued Growth',
    description: 'Growth companies at reasonable prices',
    filters: {
      minEarningsGrowth: 10,
      maxPEG: 1.5,
      maxPE: 25,
      minROE: 12
    }
  }
};

export default {
  DEFAULT_VALUATION_PARAMS,
  BUSINESS_QUALITY,
  SECTORS,
  STATEMENT_PERIODS,
  VALUATION_METHODS,
  CACHE_DURATION,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  TOOLTIPS,
  CHART_COLORS,
  SCREENING_PRESETS
};
/**
 * Calculation Service
 * Core valuation engine using Buffett's principles
 */
import dataQualityService from './dataQualityService';
import multiMethodValidator from './multiMethodValidator';

/**
 * Calculate owner earnings
 * @param {Object} income - Income statement
 * @param {Object} cashFlow - Cash flow statement
 * @param {Object} prevBalance - Previous balance sheet
 * @param {Object} currBalance - Current balance sheet
 * @returns {number} - Owner earnings
 */
const calculateOwnerEarnings = (income, cashFlow, prevBalance, currBalance) => {
  if (!income || !cashFlow || !prevBalance || !currBalance) {
    return null;
  }
  
  // Get net income
  const netIncome = income.netIncome || 0;
  
  // Get depreciation and amortization
  const depreciation = cashFlow.depreciationAndAmortization || 0;
  
  // Get capital expenditures (always negative in cash flow, convert to positive)
  const capex = Math.abs(cashFlow.capitalExpenditure || 0);
  
  // Calculate change in working capital
  const currentWorkingCapital = 
    (currBalance.totalCurrentAssets || 0) - (currBalance.totalCurrentLiabilities || 0);
  const previousWorkingCapital = 
    (prevBalance.totalCurrentAssets || 0) - (prevBalance.totalCurrentLiabilities || 0);
  const workingCapitalChange = currentWorkingCapital - previousWorkingCapital;
  
  // Owner Earnings = Net Income + Depreciation - Capex - Working Capital Change
  return netIncome + depreciation - capex - workingCapitalChange;
};

/**
 * Calculate owner earnings per share
 * @param {number} ownerEarnings - Total owner earnings
 * @param {number} sharesOutstanding - Number of shares outstanding
 * @returns {number} - Owner earnings per share
 */
const calculateOwnerEarningsPerShare = (ownerEarnings, sharesOutstanding) => {
  if (ownerEarnings === null || !sharesOutstanding || sharesOutstanding === 0) {
    return null;
  }
  
  return ownerEarnings / sharesOutstanding;
};

/**
 * Calculate growth rate from historical data
 * @param {Array} data - Historical data array, most recent first
 * @returns {number} - Annualized growth rate as decimal
 */
const calculateGrowthRate = (data) => {
  if (!data || data.length < 2) {
    return null;
  }
  
  // Use the most recent and oldest values
  const recent = data[0];
  const oldest = data[data.length - 1];
  
  // Need positive values for meaningful growth calculation
  if (recent <= 0 || oldest <= 0) {
    return 0; // Default to no growth for negative/zero earnings
  }
  
  // Calculate compound annual growth rate
  const years = data.length - 1;
  const cagr = Math.pow(recent / oldest, 1 / years) - 1;
  
  return cagr;
};

/**
 * Determine discount rate based on business quality
 * @param {string} businessQuality - Quality classification
 * @returns {number} - Discount rate as decimal
 */
const determineDiscountRate = (businessQuality) => {
  switch(businessQuality) {
    case 'excellent': return 0.09; // 9% for top quality
    case 'good': return 0.10;      // 10% for good quality
    case 'fair': return 0.11;      // 11% for fair quality
    case 'cyclical': return 0.12;  // 12% for cyclical businesses
    default: return 0.10;          // Default 10%
  }
};

/**
 * Determine margin of safety based on business quality
 * @param {string} businessQuality - Quality classification
 * @returns {number} - Margin of safety as decimal
 */
const determineMarginOfSafety = (businessQuality) => {
  switch(businessQuality) {
    case 'excellent': return 0.25; // 25% for top quality
    case 'good': return 0.35;      // 35% for good quality
    case 'fair': return 0.40;      // 40% for fair quality
    case 'cyclical': return 0.50;  // 50% for cyclical businesses
    default: return 0.40;          // Default 40%
  }
};

/**
 * Calculate Graham Number
 * @param {Object} stockData - Stock financial data
 * @returns {number} - Graham Number valuation
 */
const calculateGrahamNumber = (stockData) => {
  const eps = stockData.eps || 0;
  const bookValue = stockData.bookValuePerShare || 0;
  
  // Graham's formula: sqrt(15 * EPS * 1.5 * Book Value)
  if (eps <= 0 || bookValue <= 0) {
    return 0;
  }
  
  return Math.sqrt(22.5 * eps * bookValue);
};

/**
 * Calculate PE-based valuation
 * @param {Object} stockData - Stock financial data
 * @returns {number} - PE-based valuation
 */
const calculatePEValue = (stockData) => {
  const eps = stockData.eps || 0;
  
  // Determine appropriate PE ratio based on business quality
  let peRatio = 15; // Graham's default
  
  if (stockData.businessQuality === 'excellent') {
    peRatio = 20;
  } else if (stockData.businessQuality === 'good') {
    peRatio = 17;
  } else if (stockData.businessQuality === 'cyclical') {
    peRatio = 12;
  }
  
  return eps * peRatio;
};

/**
 * Assess business quality based on financial metrics
 * Returns 'excellent', 'good', 'fair', or 'cyclical'
 */
const assessBusinessQuality = (metrics, ratios, incomeStatements) => {
  if (!metrics || !ratios || !incomeStatements) {
    return 'fair'; // Default to fair if data is missing
  }
  
  // Extract the most recent metrics and ratios
  const recentMetrics = metrics[0] || {};
  const recentRatios = ratios[0] || {};
  
  // Calculate earnings stability (how many years of positive earnings)
  const earningsHistory = incomeStatements.map(stmt => stmt.netIncome);
  const positiveEarningsYears = earningsHistory.filter(earnings => earnings > 0).length;
  const earningsStability = positiveEarningsYears / earningsHistory.length;
  
  // Get key metrics
  const roe = recentRatios.returnOnEquity ? recentRatios.returnOnEquity * 100 : 0;
  const roa = recentRatios.returnOnAssets ? recentRatios.returnOnAssets * 100 : 0;
  const debtToEquity = recentRatios.debtToEquity || 0;
  const grossMargin = recentRatios.grossProfitMargin ? recentRatios.grossProfitMargin * 100 : 0;
  const operatingMargin = recentRatios.operatingProfitMargin ? recentRatios.operatingProfitMargin * 100 : 0;
  const freeCashFlow = recentMetrics.freeCashFlow || 0;
  
  // Scoring system
  let score = 0;
  
  // ROE scoring
  if (roe > 20) score += 3;
  else if (roe > 15) score += 2;
  else if (roe > 10) score += 1;
  
  // ROA scoring
  if (roa > 10) score += 3;
  else if (roa > 7) score += 2;
  else if (roa > 5) score += 1;
  
  // Debt to Equity scoring
  if (debtToEquity < 0.3) score += 3;
  else if (debtToEquity < 0.5) score += 2;
  else if (debtToEquity < 1.0) score += 1;
  
  // Gross Margin scoring
  if (grossMargin > 50) score += 3;
  else if (grossMargin > 35) score += 2;
  else if (grossMargin > 25) score += 1;
  
  // Operating Margin scoring
  if (operatingMargin > 25) score += 3;
  else if (operatingMargin > 15) score += 2;
  else if (operatingMargin > 10) score += 1;
  
  // Free Cash Flow scoring
  if (freeCashFlow > 0) score += 2;
  
  // Earnings Stability scoring
  if (earningsStability > 0.9) score += 3;
  else if (earningsStability > 0.7) score += 2;
  else if (earningsStability > 0.5) score += 1;
  
  // Classify business quality based on score
  if (score >= 16) return 'excellent';
  if (score >= 12) return 'good';
  if (score >= 8) return 'fair';
  return 'cyclical';
};

const calculationService = {
  /**
   * Calculate intrinsic value using Buffett's owner earnings approach
   * @param {Object} stockData - Stock financial data
   * @param {Object} options - Calculation options
   * @returns {Object} - Valuation results
   */
  calculateIntrinsicValue: (stockData, options = {}) => {
    // Extract options with defaults
    const {
      projectedGrowthRate = null,  // If null, will be calculated from historical data
      yearsProjected = 10,
      discountRate = 10,
      terminalGrowthRate = 2,
      marginOfSafety = 25,
      businessQuality = 'fair'
    } = options;
    
    // Get validated owner earnings
    const ownerEarningsPerShare = stockData.ownerEarningsPerShare || stockData.eps;
    
    // Handle negative owner earnings
    if (ownerEarningsPerShare <= 0) {
      return {
        inputs: {
          ownerEarningsPerShare: 0,
          projectedGrowthRate: 0,
          yearsProjected,
          discountRate,
          terminalGrowthRate,
          marginOfSafety,
          businessQuality
        },
        calculations: {
          futureEarnings: 0,
          terminalValue: 0,
          presentValueOfEarnings: 0,
          presentValueOfTerminal: 0
        },
        results: {
          intrinsicValue: 0,
          buyBelowPrice: 0,
          grahamNumber: 0,
          peValue: 0,
          valuationStatus: 'INVALID',
          upsidePercent: null
        },
        validation: {
          confidenceScore: 0,
          priceAssessment: { reliable: false, reason: 'Negative earnings' },
          normalizedFrom: null,
          reliabilityFlag: true
        }
      };
    }
    
    // Validate and normalize data
    const historicalGrowthRate = stockData.historicalGrowthRate || 5;
    const normalizedGrowthRate = projectedGrowthRate || 
                                dataQualityService.normalizeGrowthRate(historicalGrowthRate, businessQuality);
    
    // Convert percentages to decimals
    const growthRateDecimal = normalizedGrowthRate / 100;
    const discountRateDecimal = discountRate / 100;
    const terminalGrowthRateDecimal = terminalGrowthRate / 100;
    const marginOfSafetyDecimal = marginOfSafety / 100;
    
    // Fix for negative growth rates - use a more conservative approach
    const projectionGrowthRate = growthRateDecimal < 0 
      ? Math.max(-0.10, growthRateDecimal) // Limit negative growth to -10% to avoid extreme decline
      : Math.min(0.15, growthRateDecimal); // Cap growth at 15% to be conservative
    
    // Calculate future value of earnings
    const futureEarnings = ownerEarningsPerShare * Math.pow(1 + projectionGrowthRate, yearsProjected);
    
    // Ensure terminal growth rate is reasonable (between 1-3%)
    const actualTerminalGrowthRate = Math.min(0.03, Math.max(0.01, terminalGrowthRateDecimal));
    
    // Calculate present value of earnings stream
    let presentValueOfEarnings = 0;
    for (let year = 1; year <= yearsProjected; year++) {
      const yearEarnings = ownerEarningsPerShare * Math.pow(1 + projectionGrowthRate, year);
      // Sanity check - ensure no negative earnings
      const actualYearEarnings = Math.max(0, yearEarnings);
      presentValueOfEarnings += actualYearEarnings / Math.pow(1 + discountRateDecimal, year);
    }
    
    // Ensure discount rate is greater than terminal growth for formula to work
    const actualDiscountRate = Math.max(actualTerminalGrowthRate + 0.05, discountRateDecimal);
    
    // Calculate terminal value
    const terminalValue = futureEarnings * (1 + actualTerminalGrowthRate) / 
                          (actualDiscountRate - actualTerminalGrowthRate);
    
    // If terminal value is nonsensical (either negative or too high), use a multiple of final earnings instead
    const reasonableTerminalValue = terminalValue <= 0 || terminalValue > (futureEarnings * 25)
      ? futureEarnings * 12 // Use 12x earnings as a reasonable terminal multiple
      : terminalValue;
    
    // Calculate present value of terminal value
    const presentValueOfTerminal = reasonableTerminalValue / Math.pow(1 + discountRateDecimal, yearsProjected);
    
    // Calculate intrinsic value
    const intrinsicValue = presentValueOfEarnings + presentValueOfTerminal;
    
    // Apply margin of safety
    const buyBelowPrice = intrinsicValue * (1 - marginOfSafetyDecimal);
    
    // Calculate Graham Number for comparison
    const grahamNumber = calculateGrahamNumber(stockData);
    
    // Calculate PE-based valuation for comparison
    const peValue = calculatePEValue(stockData);
    
    // Create multi-method valuation result
    const valuationMethods = {
      dcf: intrinsicValue,
      graham: grahamNumber,
      pe: peValue,
      // Other methods could be added here
    };
    
    // Validate results with cross-checking
    const validatedResults = multiMethodValidator.validateValuation(valuationMethods);
    
    // Check for price discrepancy if current price is available
    const priceAssessment = stockData.currentPrice ? 
      multiMethodValidator.assessPriceDiscrepancy(intrinsicValue, stockData.currentPrice) : 
      { reliable: true };
    
    // Calculate upside potential if current price is available
    const upsidePercent = stockData.currentPrice ? 
      ((intrinsicValue - stockData.currentPrice) / stockData.currentPrice * 100).toFixed(2) : 
      null;
    
    // Determine valuation status
    let valuationStatus = 'UNKNOWN';
    if (stockData.currentPrice) {
      if (stockData.currentPrice <= buyBelowPrice) {
        valuationStatus = 'BUY';
      } else if (stockData.currentPrice <= intrinsicValue) {
        valuationStatus = 'FAIR VALUE';
      } else {
        valuationStatus = 'OVERVALUED';
      }
    }
    
    return {
      // Input parameters (normalized)
      inputs: {
        ownerEarningsPerShare,
        projectedGrowthRate: normalizedGrowthRate,
        yearsProjected,
        discountRate,
        terminalGrowthRate,
        marginOfSafety,
        businessQuality
      },
      // Calculation details
      calculations: {
        futureEarnings,
        terminalValue: reasonableTerminalValue,
        presentValueOfEarnings,
        presentValueOfTerminal
      },
      // Results
      results: {
        intrinsicValue: Number(intrinsicValue.toFixed(2)),
        buyBelowPrice: Number(buyBelowPrice.toFixed(2)),
        grahamNumber: Number(grahamNumber.toFixed(2)),
        peValue: Number(peValue.toFixed(2)),
        valuationStatus,
        upsidePercent: upsidePercent ? Number(upsidePercent) : null
      },
      // Validation information
      validation: {
        ...validatedResults,
        priceAssessment,
        normalizedFrom: projectedGrowthRate ? null : historicalGrowthRate,
        reliabilityFlag: !priceAssessment.reliable || validatedResults.confidenceScore < 50
      }
    };
  },
  
  // Add exported helper functions
  assessBusinessQuality,
  calculateOwnerEarnings,
  calculateOwnerEarningsPerShare,
  calculateGrowthRate,
  determineDiscountRate,
  determineMarginOfSafety,
  calculateGrahamNumber,
  
  /**
   * Perform a complete valuation analysis
   */
  performValuation: (financialData) => {
    const {
      profile,
      quote,
      incomeStatement,
      balanceSheet,
      cashFlow,
      keyMetrics,
      ratios
    } = financialData;
    
    if (!profile || !quote || !incomeStatement || !balanceSheet || !cashFlow) {
      return {
        error: 'Insufficient financial data for valuation'
      };
    }
    
    // Basic company info
    const ticker = profile.symbol;
    const name = profile.companyName;
    const currentPrice = quote.price;
    const sharesOutstanding = profile.mktCap / currentPrice;
    
    // For simplicity in this version, create a stock data object with essential metrics
    const stockData = {
      ticker,
      name,
      currentPrice,
      eps: quote.eps || 0,
      bookValuePerShare: quote.bookValue || 0,
      businessQuality: assessBusinessQuality(keyMetrics, ratios, incomeStatement),
      historicalGrowthRate: 5, // Default, would be calculated from historical data
      ownerEarningsPerShare: quote.eps || 0 // Simplified, would calculate actual owner earnings
    };
    
    // Calculate intrinsic value using the owner earnings approach
    return calculationService.calculateIntrinsicValue(stockData, {
      businessQuality: stockData.businessQuality
    });
  }
};

export default calculationService;
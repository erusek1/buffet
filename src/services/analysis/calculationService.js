/**
 * Calculation Service
 * Core valuation engine using Buffett's principles
 */
import dataQualityService from './dataQualityService';
import multiMethodValidator from './multiMethodValidator';

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
    
    // Validate and normalize data
    const historicalGrowthRate = stockData.historicalGrowthRate || 5;
    const normalizedGrowthRate = projectedGrowthRate || 
                                dataQualityService.normalizeGrowthRate(historicalGrowthRate, businessQuality);
    
    // Convert percentages to decimals
    const growthRateDecimal = normalizedGrowthRate / 100;
    const discountRateDecimal = discountRate / 100;
    const terminalGrowthRateDecimal = terminalGrowthRate / 100;
    const marginOfSafetyDecimal = marginOfSafety / 100;
    
    // Get validated owner earnings
    const ownerEarningsPerShare = stockData.ownerEarningsPerShare || stockData.eps;
    
    // Calculate future value of earnings
    const futureEarnings = ownerEarningsPerShare * Math.pow(1 + growthRateDecimal, yearsProjected);
    
    // Calculate terminal value
    const terminalValue = futureEarnings * (1 + terminalGrowthRateDecimal) / 
                         (discountRateDecimal - terminalGrowthRateDecimal);
    
<<<<<<< HEAD
    // Calculate present value of earnings stream
=======
    // Handle negative owner earnings
    if (currentOwnerEarnings <= 0) {
      return 0; // Cannot value a company with negative or zero earnings
    }
    
    // Fix for negative growth rates - use a more conservative approach
    const projectionGrowthRate = growthRate < 0 
      ? Math.max(-0.10, growthRate) // Limit negative growth to -10% to avoid extreme decline
      : Math.min(0.15, growthRate); // Cap growth at 15% to be conservative
    
    // Ensure terminal growth rate is reasonable (between 1-3%)
    const actualTerminalGrowthRate = Math.min(0.03, Math.max(0.01, terminalGrowthRate));
    
>>>>>>> 8fb64ae77250bdc85ff966b56332c9db6b5e2bd1
    let presentValueOfEarnings = 0;
    for (let year = 1; year <= yearsProjected; year++) {
<<<<<<< HEAD
      const yearEarnings = ownerEarningsPerShare * Math.pow(1 + growthRateDecimal, year);
      presentValueOfEarnings += yearEarnings / Math.pow(1 + discountRateDecimal, year);
    }
    
    // Calculate present value of terminal value
    const presentValueOfTerminal = terminalValue / Math.pow(1 + discountRateDecimal, yearsProjected);
=======
      const projectedEarnings = currentOwnerEarnings * Math.pow(1 + projectionGrowthRate, year);
      // Sanity check - ensure no negative earnings
      const actualProjectedEarnings = Math.max(0, projectedEarnings);
      presentValueOfEarnings += actualProjectedEarnings / Math.pow(1 + discountRate, year);
    }
    
    // Calculate terminal value using perpetuity growth formula
    const finalYearEarnings = currentOwnerEarnings * Math.pow(1 + projectionGrowthRate, yearsProjected);
    
    // Ensure we don't have negative final earnings
    const actualFinalEarnings = Math.max(0.01, finalYearEarnings);
    
    // Ensure discount rate is greater than terminal growth for formula to work
    const actualDiscountRate = Math.max(actualTerminalGrowthRate + 0.05, discountRate);
    
    // Calculate terminal value with safety checks
    const terminalValue = actualFinalEarnings * (1 + actualTerminalGrowthRate) / 
                         (actualDiscountRate - actualTerminalGrowthRate);
    
    // If terminal value is nonsensical (either negative or too high), use a multiple of final earnings instead
    const reasonableTerminalValue = terminalValue <= 0 || terminalValue > (actualFinalEarnings * 25)
      ? actualFinalEarnings * 12 // Use 12x earnings as a reasonable terminal multiple
      : terminalValue;
    
    // Calculate present value of terminal value
    const presentValueOfTerminal = reasonableTerminalValue / Math.pow(1 + discountRate, yearsProjected);
    
    // Total intrinsic value is sum of present values
    const intrinsicValue = presentValueOfEarnings + presentValueOfTerminal;
    
    return intrinsicValue;
  };
  
  /**
   * Calculate per-share intrinsic value
   */
  export const calculateIntrinsicValuePerShare = (intrinsicValue, sharesOutstanding) => {
    if (
      intrinsicValue === null ||
      sharesOutstanding === null ||
      sharesOutstanding === 0
    ) {
      return null;
    }
    
    return intrinsicValue / sharesOutstanding;
  };
  
  /**
   * Calculate buy price with margin of safety
   */
  export const calculateBuyPrice = (intrinsicValuePerShare, marginOfSafety) => {
    if (
      intrinsicValuePerShare === null ||
      marginOfSafety === null
    ) {
      return null;
    }
    
    return intrinsicValuePerShare * (1 - marginOfSafety);
  };
  
  /**
   * Assess business quality based on financial metrics
   * Returns 'excellent', 'good', 'fair', or 'cyclical'
   */
  export const assessBusinessQuality = (metrics, ratios, incomeStatements) => {
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
  
  /**
   * Calculate the Graham Number (a conservative valuation metric)
   * Graham Number = sqrt(22.5 * EPS * BVPS)
   */
  export const calculateGrahamNumber = (eps, bookValuePerShare) => {
    if (!eps || !bookValuePerShare || eps <= 0 || bookValuePerShare <= 0) {
      return null;
    }
    
    return Math.sqrt(22.5 * eps * bookValuePerShare);
  };
  
  /**
   * Perform a complete valuation analysis
   */
  export const performValuation = (financialData) => {
    const {
      profile,
      quote,
      incomeStatements,
      balanceSheets,
      cashFlows,
      metrics,
      ratios
    } = financialData;
    
    if (!profile || !quote || !incomeStatements || !balanceSheets || !cashFlows) {
      return {
        error: 'Insufficient financial data for valuation'
      };
    }
    
    // Basic company info
    const ticker = profile.symbol;
    const name = profile.companyName;
    const currentPrice = quote.price;
    const sharesOutstanding = profile.mktCap / currentPrice;
    
    // Calculate owner earnings for each year
    const ownerEarningsHistory = [];
    for (let i = 0; i < Math.min(incomeStatements.length, cashFlows.length, balanceSheets.length - 1); i++) {
      const income = incomeStatements[i];
      const cashFlow = cashFlows[i];
      const currentBalance = balanceSheets[i];
      const previousBalance = balanceSheets[i + 1];
      
      const ownerEarnings = calculateOwnerEarnings(income, cashFlow, previousBalance, currentBalance);
      
      if (ownerEarnings !== null) {
        ownerEarningsHistory.push(ownerEarnings);
      }
    }
    
    // Calculate owner earnings per share
    const ownerEarningsPerShare = calculateOwnerEarningsPerShare(
      ownerEarningsHistory[0], // Most recent
      sharesOutstanding
    );
    
    // Calculate historical growth rate of owner earnings
    const growthRate = calculateGrowthRate(ownerEarningsHistory);
    
    // Use a more conservative growth rate for projections
    // For negative growth, use a minimum floor
    let projectedGrowthRate;
    if (growthRate === null) {
      projectedGrowthRate = 0.04; // Default to 4% if growth rate cannot be calculated
    } else if (growthRate < 0) {
      // For negative growth, use a more conservative approach for projections
      const historicalGrowthRate = growthRate;
      // Apply a recovery assumption - limited decline followed by industry average growth
      // Instead of perpetual decline, assume the company can stabilize 
      projectedGrowthRate = Math.max(-0.05, historicalGrowthRate / 2);
    } else {
      // For positive growth, cap at 15% to be conservative
      projectedGrowthRate = Math.min(growthRate, 0.15);
    }
    
    // Assess business quality
    const businessQuality = assessBusinessQuality(metrics, ratios, incomeStatements);
    
    // Determine appropriate discount rate and margin of safety
    const discountRate = determineDiscountRate(businessQuality);
    const marginOfSafety = determineMarginOfSafety(businessQuality);
>>>>>>> 8fb64ae77250bdc85ff966b56332c9db6b5e2bd1
    
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
    
<<<<<<< HEAD
=======
    // Calculate upside potential
    const upsidePercent = intrinsicValuePerShare ? ((intrinsicValuePerShare / currentPrice) - 1) * 100 : 0;
    
>>>>>>> 8fb64ae77250bdc85ff966b56332c9db6b5e2bd1
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
        terminalValue,
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
  }
};

/**
 * Calculate Graham Number
 * @param {Object} stockData - Stock financial data
 * @returns {number} - Graham Number valuation
 */
function calculateGrahamNumber(stockData) {
  const eps = stockData.eps || 0;
  const bookValue = stockData.bookValuePerShare || 0;
  
  // Graham's formula: sqrt(15 * EPS * 1.5 * Book Value)
  return Math.sqrt(22.5 * eps * bookValue);
}

/**
 * Calculate PE-based valuation
 * @param {Object} stockData - Stock financial data
 * @returns {number} - PE-based valuation
 */
function calculatePEValue(stockData) {
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
}

export default calculationService;
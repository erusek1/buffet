/**
 * Buffett-Style Intrinsic Value Calculation Service
 * Following Warren Buffett and Benjamin Graham principles with realistic adjustments
 */

/**
 * Normalizes growth rate for future projections
 * Prevents unrealistically negative projections while remaining conservative
 * 
 * @param {number} historicalGrowth - Historical growth rate percentage
 * @param {string} businessQuality - Business quality category
 * @returns {number} - Normalized growth rate for projections
 */
export const normalizeGrowthRate = (historicalGrowth, businessQuality) => {
  // Minimum baseline growth rates by business quality
  const minimumGrowthRates = {
    excellent: 3.0,  // Strong moat companies don't typically shrink forever
    good: 2.0,       // Good businesses typically grow at least with inflation
    fair: 1.0,       // Fair businesses can at least match some inflation
    cyclical: 0.5    // Cyclical businesses may have limited real growth
  };

  // Maximum reasonable growth rates to cap optimistic projections
  const maximumGrowthRates = {
    excellent: 12.0,
    good: 9.0,
    fair: 7.0,
    cyclical: 5.0
  };

  // Default to 'fair' if businessQuality is not recognized
  const quality = Object.keys(minimumGrowthRates).includes(businessQuality) 
    ? businessQuality 
    : 'fair';

  // If historical growth is negative, use a recovery model
  if (historicalGrowth < 0) {
    // For negative growth histories, assume some recovery but stay conservative
    // More severe negative growth gets more conservative projections
    if (historicalGrowth < -10) {
      return minimumGrowthRates[quality] * 0.5; // Very conservative for severely declining businesses
    } else {
      return minimumGrowthRates[quality]; // Base minimum for moderately declining businesses
    }
  }

  // For positive historical growth, cap at maximum reasonable rate
  return Math.min(historicalGrowth, maximumGrowthRates[quality]);
};

/**
 * Determines appropriate discount rate based on business quality and risk factors
 * 
 * @param {string} businessQuality - Business quality category
 * @param {Object} financialMetrics - Financial metrics including debt ratios
 * @returns {number} - Appropriate discount rate percentage
 */
export const determineDiscountRate = (businessQuality, financialMetrics) => {
  // Base discount rates by business quality
  const baseRates = {
    excellent: 9.0,  // Lower discount rate for highest quality businesses
    good: 10.0,      // Standard rate for good businesses
    fair: 12.0,      // Higher rate for fair businesses to account for uncertainty
    cyclical: 14.0   // Highest base rate for cyclical businesses
  };

  // Default to 'fair' if businessQuality is not recognized
  const quality = Object.keys(baseRates).includes(businessQuality) 
    ? businessQuality 
    : 'fair';
    
  let rateAdjustment = 0;
  
  // Adjust for debt if available
  if (financialMetrics && financialMetrics.debtToEquity) {
    // Add premium for high debt levels
    if (financialMetrics.debtToEquity > 2.0) {
      rateAdjustment += 2.0;
    } else if (financialMetrics.debtToEquity > 1.0) {
      rateAdjustment += 1.0;
    }
  }
  
  // Adjust for profitability issues if available
  if (financialMetrics && financialMetrics.operatingMargin) {
    if (financialMetrics.operatingMargin < 5.0) {
      rateAdjustment += 1.0;
    }
    // Negative operating margin is a serious concern
    if (financialMetrics.operatingMargin < 0) {
      rateAdjustment += 2.0;
    }
  }
  
  return baseRates[quality] + rateAdjustment;
};

/**
 * Determines appropriate margin of safety based on business quality and predictability
 * 
 * @param {string} businessQuality - Business quality category
 * @returns {number} - Appropriate margin of safety percentage
 */
export const determineMarginOfSafety = (businessQuality) => {
  // Margins of safety by business quality
  const safetyMargins = {
    excellent: 25, // Even excellent businesses need margin of safety
    good: 35,      // Good businesses require more caution
    fair: 40,      // Fair businesses need significant safety margin
    cyclical: 50   // Cyclical businesses need maximum safety margin
  };

  // Default to 'fair' if businessQuality is not recognized
  return safetyMargins[businessQuality] || safetyMargins.fair;
};

/**
 * Classifies business quality based on financial metrics and industry
 * 
 * @param {Object} metrics - Financial metrics
 * @param {string} sector - Company sector
 * @param {string} industry - Company industry
 * @returns {string} - Business quality classification (excellent, good, fair, or cyclical)
 */
export const classifyBusinessQuality = (metrics, sector, industry) => {
  // Default classification
  let classification = 'fair';
  
  // Defensive (non-cyclical) sectors
  const defensiveSectors = [
    'Consumer Defensive', 
    'Healthcare', 
    'Utilities',
    'Consumer Non-Cyclical',
    'Consumer Staples'
  ];
  
  // Typically cyclical sectors
  const cyclicalSectors = [
    'Basic Materials',
    'Energy',
    'Consumer Cyclical',
    'Industrials',
    'Financial Services'
  ];
  
  // Excellent moat industries
  const excellentMoatIndustries = [
    'Beverages—Non-Alcoholic',
    'Tobacco',
    'Credit Services',
    'Medical Devices',
    'Pharmaceutical Retail',
    'Utilities—Regulated'
  ];
  
  // Check ROE, operating margin, and consistency for business quality
  if (metrics) {
    const { roe, operatingMargin, netMargin, roaFiveYearAvg, consistentGrowth } = metrics;
    
    // Excellent businesses have high returns and consistent profitability
    if (roe > 15 && operatingMargin > 20 && netMargin > 10 && consistentGrowth && 
        (defensiveSectors.includes(sector) || excellentMoatIndustries.includes(industry))) {
      classification = 'excellent';
    }
    // Good businesses have solid returns and profitability
    else if (roe > 10 && operatingMargin > 10 && netMargin > 5 && 
             defensiveSectors.includes(sector)) {
      classification = 'good';
    }
    // Cyclical check based on sector and volatility
    else if (cyclicalSectors.includes(sector) || metrics.earningsVolatility > 30) {
      classification = 'cyclical';
    }
  } else {
    // Without detailed metrics, classify based on sector alone
    if (defensiveSectors.includes(sector)) {
      classification = 'good';
    } else if (cyclicalSectors.includes(sector)) {
      classification = 'cyclical';
    }
  }
  
  return classification;
};

/**
 * Calculates intrinsic value using Discounted Cash Flow (DCF) method
 * Based on owner earnings with normalized growth
 * 
 * @param {number} ownerEarnings - Current owner earnings per share
 * @param {number} growthRate - Projected annual growth rate percentage
 * @param {number} discountRate - Discount rate percentage
 * @param {number} terminalGrowthRate - Terminal growth rate percentage
 * @param {number} yearsProjected - Number of years to project
 * @returns {number} - Intrinsic value per share
 */
export const calculateIntrinsicValue = (ownerEarnings, growthRate, discountRate, terminalGrowthRate, yearsProjected) => {
  // Convert percentages to decimals
  const growthDecimal = growthRate / 100;
  const discountDecimal = discountRate / 100;
  const terminalGrowthDecimal = terminalGrowthRate / 100;
  
  // Calculate present value of projected earnings
  let presentValueOfEarnings = 0;
  for (let year = 1; year <= yearsProjected; year++) {
    const yearEarnings = ownerEarnings * Math.pow(1 + growthDecimal, year);
    presentValueOfEarnings += yearEarnings / Math.pow(1 + discountDecimal, year);
  }
  
  // Calculate terminal value and its present value
  const finalYearEarnings = ownerEarnings * Math.pow(1 + growthDecimal, yearsProjected);
  const terminalValue = finalYearEarnings * (1 + terminalGrowthDecimal) / (discountDecimal - terminalGrowthDecimal);
  const presentValueOfTerminal = terminalValue / Math.pow(1 + discountDecimal, yearsProjected);
  
  // Total intrinsic value
  return presentValueOfEarnings + presentValueOfTerminal;
};

/**
 * Calculates Graham Number
 * Based on EPS and Book Value per Share
 * 
 * @param {number} eps - Earnings per share
 * @param {number} bookValue - Book value per share
 * @returns {number} - Graham Number value
 */
export const calculateGrahamNumber = (eps, bookValue) => {
  return Math.sqrt(22.5 * eps * bookValue);
};

/**
 * Calculates owner earnings per share
 * Owner Earnings = Net Income + Depreciation - CapEx - Working Capital Change
 * 
 * @param {Object} financials - Financial statement data
 * @param {number} sharesOutstanding - Shares outstanding
 * @returns {number} - Owner earnings per share
 */
export const calculateOwnerEarnings = (financials, sharesOutstanding) => {
  if (!financials || !financials.income || !financials.cashFlow || !sharesOutstanding) {
    return 0;
  }
  
  const netIncome = financials.income.netIncome || 0;
  const depreciation = financials.cashFlow.depreciation || 0;
  const capitalExpenditure = Math.abs(financials.cashFlow.capitalExpenditure || 0);
  const workingCapitalChange = financials.cashFlow.changeInWorkingCapital || 0;
  
  const totalOwnerEarnings = netIncome + depreciation - capitalExpenditure - workingCapitalChange;
  return totalOwnerEarnings / sharesOutstanding;
};

/**
 * Provides overall valuation assessment
 * 
 * @param {number} currentPrice - Current stock price
 * @param {number} intrinsicValue - Calculated intrinsic value
 * @param {number} marginOfSafety - Margin of safety percentage
 * @returns {Object} - Valuation status and details
 */
export const assessValuation = (currentPrice, intrinsicValue, marginOfSafety) => {
  const safetyPrice = intrinsicValue * (1 - marginOfSafety / 100);
  const upsidePercentage = ((intrinsicValue - currentPrice) / currentPrice) * 100;
  
  let status = '';
  let description = '';
  
  if (currentPrice <= safetyPrice) {
    status = 'BUY';
    description = 'Stock is trading below the buy price with sufficient margin of safety.';
  } else if (currentPrice <= intrinsicValue) {
    status = 'HOLD/WATCH';
    description = 'Stock is trading below intrinsic value but without sufficient margin of safety.';
  } else {
    status = 'OVERVALUED';
    description = 'Stock is trading above intrinsic value.';
  }
  
  return {
    status,
    description,
    intrinsicValue,
    safetyPrice,
    upsidePercentage
  };
};
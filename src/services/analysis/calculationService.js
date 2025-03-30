/**
 * Core valuation calculations following Buffett principles
 */

/**
 * Calculate owner earnings (Buffett's preferred cash flow measure)
 * Owner Earnings = Net Income + Depreciation - Capital Expenditures - Working Capital Changes
 */
export const calculateOwnerEarnings = (income, cashFlow, previousBalance, currentBalance) => {
    if (!income || !cashFlow) {
      return null;
    }
    
    // Get net income from income statement
    const netIncome = income.netIncome || 0;
    
    // Get depreciation from cash flow statement
    const depreciation = cashFlow.depreciationAndAmortization || 0;
    
    // Get capital expenditures from cash flow statement
    const capex = Math.abs(cashFlow.capitalExpenditure || 0);
    
    // Calculate working capital change if balance sheets are provided
    let workingCapitalChange = 0;
    
    if (previousBalance && currentBalance) {
      const currentWorkingCapital = (currentBalance.totalCurrentAssets || 0) - (currentBalance.totalCurrentLiabilities || 0);
      const previousWorkingCapital = (previousBalance.totalCurrentAssets || 0) - (previousBalance.totalCurrentLiabilities || 0);
      workingCapitalChange = currentWorkingCapital - previousWorkingCapital;
    }
    
    // Calculate owner earnings
    const ownerEarnings = netIncome + depreciation - capex - workingCapitalChange;
    
    return ownerEarnings;
  };
  
  /**
   * Calculate owner earnings per share
   */
  export const calculateOwnerEarningsPerShare = (ownerEarnings, sharesOutstanding) => {
    if (!ownerEarnings || !sharesOutstanding || sharesOutstanding === 0) {
      return null;
    }
    
    return ownerEarnings / sharesOutstanding;
  };
  
  /**
   * Calculate the historical growth rate based on array of values
   * Uses compound annual growth rate (CAGR) formula
   */
  export const calculateGrowthRate = (values) => {
    if (!values || values.length < 2) {
      return null;
    }
    
    // Filter out null, undefined, and non-positive values
    const filteredValues = values.filter(v => v !== null && v !== undefined && v > 0);
    
    if (filteredValues.length < 2) {
      return null;
    }
    
    const startValue = filteredValues[filteredValues.length - 1]; // Oldest value
    const endValue = filteredValues[0]; // Most recent value
    const years = filteredValues.length - 1;
    
    // CAGR = (endValue / startValue)^(1/years) - 1
    const growthRate = Math.pow(endValue / startValue, 1 / years) - 1;
    
    return growthRate;
  };
  
  /**
   * Determine the appropriate discount rate based on business quality
   * Higher quality businesses get lower discount rates (less risk)
   */
  export const determineDiscountRate = (businessQuality) => {
    switch (businessQuality) {
      case 'excellent':
        return 0.09; // 9% for excellent businesses
      case 'good':
        return 0.10; // 10% for good businesses
      case 'fair':
        return 0.12; // 12% for fair businesses
      case 'cyclical':
        return 0.15; // 15% for cyclical businesses
      default:
        return 0.10; // Default to 10%
    }
  };
  
  /**
   * Determine the appropriate margin of safety based on business quality
   */
  export const determineMarginOfSafety = (businessQuality) => {
    switch (businessQuality) {
      case 'excellent':
        return 0.25; // 25% for excellent businesses
      case 'good':
        return 0.35; // 35% for good businesses
      case 'fair':
        return 0.40; // 40% for fair businesses
      case 'cyclical':
        return 0.50; // 50% for cyclical businesses
      default:
        return 0.35; // Default to 35%
    }
  };
  
  /**
   * Calculate intrinsic value using discounted cash flow method
   * based on owner earnings
   */
  export const calculateIntrinsicValue = (
    currentOwnerEarnings,
    growthRate,
    discountRate,
    terminalGrowthRate,
    yearsProjected
  ) => {
    if (
      currentOwnerEarnings === null ||
      currentOwnerEarnings === undefined ||
      growthRate === null ||
      discountRate === null ||
      terminalGrowthRate === null ||
      yearsProjected === null
    ) {
      return null;
    }
    
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
    
    let presentValueOfEarnings = 0;
    
    // Calculate present value of projected earnings
    for (let year = 1; year <= yearsProjected; year++) {
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
    
    // Calculate intrinsic value
    const intrinsicValue = calculateIntrinsicValue(
      ownerEarningsHistory[0], // Most recent owner earnings
      projectedGrowthRate,
      discountRate,
      0.02, // Terminal growth rate (2%)
      10    // Years projected
    );
    
    // Calculate per share values
    const intrinsicValuePerShare = calculateIntrinsicValuePerShare(intrinsicValue, sharesOutstanding);
    const buyPrice = calculateBuyPrice(intrinsicValuePerShare, marginOfSafety);
    
    // Calculate Graham Number as a secondary valuation check
    const eps = incomeStatements[0].eps || (incomeStatements[0].netIncome / sharesOutstanding);
    const bookValuePerShare = balanceSheets[0].totalStockholdersEquity / sharesOutstanding;
    const grahamNumber = calculateGrahamNumber(eps, bookValuePerShare);
    
    // Determine valuation status
    let valuationStatus;
    if (currentPrice <= buyPrice) {
      valuationStatus = 'BUY';
    } else if (currentPrice <= intrinsicValuePerShare) {
      valuationStatus = 'FAIR';
    } else {
      valuationStatus = 'OVERVALUED';
    }
    
    // Calculate upside potential
    const upsidePercent = intrinsicValuePerShare ? ((intrinsicValuePerShare / currentPrice) - 1) * 100 : 0;
    
    return {
      ticker,
      name,
      currentPrice,
      businessQuality,
      ownerEarningsPerShare,
      growthRate: growthRate ? (growthRate * 100).toFixed(2) + '%' : 'N/A',
      projectedGrowthRate: (projectedGrowthRate * 100).toFixed(2) + '%',
      discountRate: (discountRate * 100).toFixed(2) + '%',
      marginOfSafety: (marginOfSafety * 100).toFixed(2) + '%',
      intrinsicValuePerShare: intrinsicValuePerShare ? intrinsicValuePerShare.toFixed(2) : 'N/A',
      buyPrice: buyPrice ? buyPrice.toFixed(2) : 'N/A',
      grahamNumber: grahamNumber ? grahamNumber.toFixed(2) : 'N/A',
      valuationStatus,
      upsidePercent: upsidePercent.toFixed(2) + '%',
      additionalMetrics: {
        roe: ratios[0].returnOnEquity ? (ratios[0].returnOnEquity * 100).toFixed(2) + '%' : 'N/A',
        roa: ratios[0].returnOnAssets ? (ratios[0].returnOnAssets * 100).toFixed(2) + '%' : 'N/A',
        debtToEquity: ratios[0].debtToEquity ? ratios[0].debtToEquity.toFixed(2) : 'N/A',
        currentRatio: ratios[0].currentRatio ? ratios[0].currentRatio.toFixed(2) : 'N/A',
        grossMargin: ratios[0].grossProfitMargin ? (ratios[0].grossProfitMargin * 100).toFixed(2) + '%' : 'N/A',
        operatingMargin: ratios[0].operatingProfitMargin ? (ratios[0].operatingProfitMargin * 100).toFixed(2) + '%' : 'N/A',
        netMargin: ratios[0].netProfitMargin ? (ratios[0].netProfitMargin * 100).toFixed(2) + '%' : 'N/A',
        peRatio: quote.pe ? quote.pe.toFixed(2) : 'N/A',
        pbRatio: quote.priceToBookRatio ? quote.priceToBookRatio.toFixed(2) : 'N/A',
      }
    };
  };
  
  export default {
    calculateOwnerEarnings,
    calculateOwnerEarningsPerShare,
    calculateGrowthRate,
    determineDiscountRate,
    determineMarginOfSafety,
    calculateIntrinsicValue,
    calculateIntrinsicValuePerShare,
    calculateBuyPrice,
    assessBusinessQuality,
    calculateGrahamNumber,
    performValuation
  };
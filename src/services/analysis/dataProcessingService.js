/**
 * Data Processing Service
 * Processes raw financial data into useful formats for analysis
 */

/**
 * Calculates growth rate from historical data
 * 
 * @param {Array} data - Historical financial data points
 * @param {string} metricName - Name of metric to analyze
 * @param {number} years - Number of years to consider (default 5)
 * @returns {number} - Annualized growth rate percentage
 */
export const calculateGrowthRate = (data, metricName, years = 5) => {
  if (!data || data.length < 2) {
    return 0;
  }
  
  // Limit to the requested number of years
  const limitedData = data.slice(0, Math.min(years, data.length));
  
  // Get latest and oldest values
  const latestValue = limitedData[0][metricName];
  const oldestValue = limitedData[limitedData.length - 1][metricName];
  
  // Handle negative or zero values
  if (oldestValue <= 0) {
    return 0; // Cannot calculate growth rate with negative or zero base
  }
  
  // Calculate compound annual growth rate
  const numberOfYears = limitedData.length - 1;
  const growthRate = Math.pow(latestValue / oldestValue, 1 / numberOfYears) - 1;
  
  return growthRate * 100; // Convert to percentage
};

/**
 * Extracts and processes financial metrics from API data
 * 
 * @param {Object} apiData - Raw API data
 * @returns {Object} - Processed financial metrics
 */
export const processFinancialMetrics = (apiData) => {
  if (!apiData || !apiData.incomeStatement || !apiData.balanceSheet || !apiData.cashFlow) {
    return null;
  }
  
  const income = apiData.incomeStatement[0] || {};
  const balanceSheet = apiData.balanceSheet[0] || {};
  const cashFlow = apiData.cashFlow[0] || {};
  
  // Calculate key financial metrics
  const totalAssets = balanceSheet.totalAssets || 0;
  const totalLiabilities = balanceSheet.totalLiabilities || 0;
  const totalEquity = balanceSheet.totalStockholdersEquity || 0;
  const netIncome = income.netIncome || 0;
  const revenue = income.revenue || 0;
  const ebit = income.ebit || 0;
  const interestExpense = income.interestExpense || 0;
  
  // Calculate ratios
  const roe = totalEquity ? (netIncome / totalEquity) * 100 : 0;
  const roa = totalAssets ? (netIncome / totalAssets) * 100 : 0;
  const debtToEquity = totalEquity ? (totalLiabilities / totalEquity) : 0;
  const currentRatio = balanceSheet.totalCurrentAssets && balanceSheet.totalCurrentLiabilities
    ? balanceSheet.totalCurrentAssets / balanceSheet.totalCurrentLiabilities
    : 0;
  const grossMargin = revenue ? (income.grossProfit / revenue) * 100 : 0;
  const operatingMargin = revenue ? (ebit / revenue) * 100 : 0;
  const netMargin = revenue ? (netIncome / revenue) * 100 : 0;
  const interestCoverage = interestExpense ? ebit / Math.abs(interestExpense) : 0;
  
  // Calculate growth rates
  const revenueGrowth = calculateGrowthRate(apiData.incomeStatement, 'revenue');
  const earningsGrowth = calculateGrowthRate(apiData.incomeStatement, 'netIncome');
  
  // Check for earnings consistency
  let consistentGrowth = true;
  let earningsVolatility = 0;
  
  if (apiData.incomeStatement.length >= 3) {
    const growthRates = [];
    
    for (let i = 1; i < apiData.incomeStatement.length; i++) {
      const currentEarnings = apiData.incomeStatement[i-1].netIncome;
      const prevEarnings = apiData.incomeStatement[i].netIncome;
      
      if (prevEarnings > 0) {
        const growthRate = (currentEarnings - prevEarnings) / prevEarnings;
        growthRates.push(growthRate);
        
        // Check if any year had negative growth
        if (growthRate < 0) {
          consistentGrowth = false;
        }
      } else {
        consistentGrowth = false;
      }
    }
    
    // Calculate volatility (standard deviation of growth rates)
    if (growthRates.length > 0) {
      const avg = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
      const squaredDiffs = growthRates.map(rate => Math.pow(rate - avg, 2));
      const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / growthRates.length;
      earningsVolatility = Math.sqrt(variance) * 100; // Convert to percentage
    }
  }
  
  return {
    roe,
    roa,
    debtToEquity,
    currentRatio,
    grossMargin,
    operatingMargin,
    netMargin,
    interestCoverage,
    revenueGrowth,
    earningsGrowth,
    consistentGrowth,
    earningsVolatility
  };
};

/**
 * Extracts and processes balance sheet data
 * 
 * @param {Object} balanceSheet - Balance sheet data
 * @param {number} sharesOutstanding - Shares outstanding
 * @returns {Object} - Processed balance sheet metrics
 */
export const processBalanceSheet = (balanceSheet, sharesOutstanding) => {
  if (!balanceSheet || !balanceSheet.length || !sharesOutstanding) {
    return null;
  }
  
  const data = balanceSheet[0];
  
  const totalAssets = data.totalAssets || 0;
  const totalLiabilities = data.totalLiabilities || 0;
  const totalEquity = data.totalStockholdersEquity || 0;
  const bookValue = totalEquity / sharesOutstanding;
  
  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    bookValue,
    debtToEquity: totalEquity ? totalLiabilities / totalEquity : 0,
    tangibleBookValue: ((totalEquity - (data.goodwill || 0) - (data.intangibleAssets || 0)) / sharesOutstanding)
  };
};

/**
 * Creates a structured financial data object from raw API data
 * 
 * @param {Object} apiData - Raw API data
 * @returns {Object} - Structured financial data
 */
export const structureFinancialData = (apiData) => {
  if (!apiData || !apiData.profile || !apiData.incomeStatement || !apiData.balanceSheet || !apiData.cashFlow) {
    return null;
  }
  
  const profile = apiData.profile[0] || {};
  const sharesOutstanding = profile.mktCap / profile.price || 0;
  
  // Process financial statements
  const financials = {
    income: apiData.incomeStatement[0] || {},
    balance: apiData.balanceSheet[0] || {},
    cashFlow: apiData.cashFlow[0] || {}
  };
  
  // Process metrics
  const metrics = processFinancialMetrics(apiData);
  const balanceMetrics = processBalanceSheet(apiData.balanceSheet, sharesOutstanding);
  
  return {
    profile,
    sharesOutstanding,
    financials,
    metrics,
    balanceMetrics
  };
};
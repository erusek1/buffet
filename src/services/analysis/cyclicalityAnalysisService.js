/**
 * Cyclicality Analysis Service
 * 
 * This service analyzes the cyclical nature of stocks and industries
 * to help make better investment decisions in overvalued markets by
 * identifying where companies are in their business and valuation cycles.
 */

/**
 * Analyzes the cyclicality score of a stock based on historical data
 * @param {Array} historicalData - Array of historical financial data
 * @param {Array} indicators - Financial indicators to analyze
 * @returns {Object} Cyclicality metrics
 */
export const analyzeCyclicality = (historicalData, indicators = ['earnings', 'revenue', 'margins']) => {
  if (!historicalData || historicalData.length < 8) {
    return {
      cyclicalityScore: null,
      volatility: null,
      currentPhase: null,
      error: 'Insufficient historical data for cyclicality analysis'
    };
  }
  
  const metrics = {};
  
  // Calculate coefficient of variation for each indicator
  indicators.forEach(indicator => {
    const values = historicalData.map(data => data[indicator]).filter(val => val !== null && val !== undefined);
    
    if (values.length < 8) return;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / mean) * 100;
    
    metrics[indicator] = {
      mean,
      stdDev,
      coefficientOfVariation
    };
  });
  
  // Calculate overall cyclicality score
  if (Object.keys(metrics).length === 0) {
    return {
      cyclicalityScore: null,
      volatility: null,
      currentPhase: null,
      error: 'No valid indicators for cyclicality analysis'
    };
  }
  
  // Average the coefficient of variation across indicators
  const averageCV = Object.values(metrics)
    .reduce((sum, metric) => sum + metric.coefficientOfVariation, 0) / Object.keys(metrics).length;
  
  // Normalize to a 0-100 scale (higher = more cyclical)
  // Typical ranges: <15 = defensive, 15-30 = moderate cyclicality, >30 = highly cyclical
  const cyclicalityScore = Math.min(Math.round(averageCV * 2), 100);
  
  // Determine current phase in the cycle
  const currentPhase = determineCurrentPhase(historicalData, metrics);
  
  // Calculate earnings volatility
  const earningsValues = historicalData.map(data => data.earnings).filter(val => val !== null && val !== undefined);
  const earningsGrowthRates = [];
  
  for (let i = 1; i < earningsValues.length; i++) {
    if (earningsValues[i-1] > 0) {
      earningsGrowthRates.push((earningsValues[i] - earningsValues[i-1]) / earningsValues[i-1] * 100);
    }
  }
  
  const volatility = earningsGrowthRates.length > 0 
    ? calculateVolatility(earningsGrowthRates) 
    : null;
  
  return {
    cyclicalityScore,
    volatility,
    currentPhase,
    metrics,
    cyclicalityCategory: categorizeCyclicality(cyclicalityScore)
  };
};

/**
 * Categorize cyclicality based on score
 * @param {number} score - Cyclicality score
 * @returns {string} Category description
 */
const categorizeCyclicality = (score) => {
  if (score === null) return 'Unknown';
  if (score < 15) return 'Defensive';
  if (score < 30) return 'Moderate Cyclicality';
  if (score < 50) return 'Cyclical';
  return 'Highly Cyclical';
};

/**
 * Calculate volatility from an array of growth rates
 * @param {Array} growthRates - Array of growth rates
 * @returns {number} Volatility measure
 */
const calculateVolatility = (growthRates) => {
  const mean = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / growthRates.length;
  return Math.sqrt(variance);
};

/**
 * Calculate average growth rate from array of values
 * @param {Array} values - Array of values
 * @returns {number} Average growth rate
 */
const calculateAverageGrowth = (values) => {
  const growthRates = [];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] && values[i-1] && values[i-1] !== 0) {
      growthRates.push((values[i] - values[i-1]) / Math.abs(values[i-1]) * 100);
    }
  }
  
  return growthRates.length > 0 
    ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length 
    : 0;
};

/**
 * Determines the current phase in the business cycle
 * @param {Array} historicalData - Historical financial data
 * @param {Object} metrics - Calculated metrics
 * @returns {string} Current phase description
 */
const determineCurrentPhase = (historicalData, metrics) => {
  // Ensure we have at least 8 quarters of data for trend analysis
  if (historicalData.length < 8) return 'Indeterminate';
  
  // Get the most recent periods
  const recentData = historicalData.slice(0, 8);
  
  // Check margins trend (last 4 quarters vs previous 4 quarters)
  const recentMargins = recentData.slice(0, 4).map(d => d.margins);
  const previousMargins = recentData.slice(4, 8).map(d => d.margins);
  
  const avgRecentMargin = recentMargins.reduce((sum, m) => sum + m, 0) / recentMargins.length;
  const avgPreviousMargin = previousMargins.reduce((sum, m) => sum + m, 0) / previousMargins.length;
  
  const marginTrend = avgRecentMargin > avgPreviousMargin ? 'Expanding' : 'Contracting';
  
  // Check earnings trend (acceleration/deceleration)
  const recentEarningsGrowth = [];
  for (let i = 1; i < 4; i++) {
    if (recentData[i].earnings && recentData[i-1].earnings && recentData[i-1].earnings !== 0) {
      recentEarningsGrowth.push(
        (recentData[i].earnings - recentData[i-1].earnings) / Math.abs(recentData[i-1].earnings) * 100
      );
    }
  }
  
  const previousEarningsGrowth = [];
  for (let i = 5; i < 8; i++) {
    if (recentData[i].earnings && recentData[i-1].earnings && recentData[i-1].earnings !== 0) {
      previousEarningsGrowth.push(
        (recentData[i].earnings - recentData[i-1].earnings) / Math.abs(recentData[i-1].earnings) * 100
      );
    }
  }
  
  const avgRecentGrowth = recentEarningsGrowth.length > 0 
    ? recentEarningsGrowth.reduce((sum, g) => sum + g, 0) / recentEarningsGrowth.length 
    : 0;
    
  const avgPreviousGrowth = previousEarningsGrowth.length > 0 
    ? previousEarningsGrowth.reduce((sum, g) => sum + g, 0) / previousEarningsGrowth.length 
    : 0;
  
  const earningsTrend = avgRecentGrowth > avgPreviousGrowth ? 'Accelerating' : 'Decelerating';
  
  // Check revenue trend
  const recentRevenues = recentData.slice(0, 4).map(d => d.revenue);
  const previousRevenues = recentData.slice(4, 8).map(d => d.revenue);
  
  const recentRevenueGrowth = calculateAverageGrowth(recentRevenues);
  const previousRevenueGrowth = calculateAverageGrowth(previousRevenues);
  
  const revenueTrend = recentRevenueGrowth > previousRevenueGrowth ? 'Accelerating' : 'Decelerating';
  
  // Check current earnings relative to peak earnings
  const allEarnings = historicalData.map(d => d.earnings).filter(e => e !== null && e !== undefined);
  const peakEarnings = Math.max(...allEarnings);
  const currentEarnings = historicalData[0].earnings;
  const percentOfPeak = (currentEarnings / peakEarnings) * 100;
  
  // Determine the phase based on these indicators
  if (marginTrend === 'Expanding' && earningsTrend === 'Accelerating' && revenueTrend === 'Accelerating') {
    if (percentOfPeak < 90) {
      return 'Early Expansion';
    } else {
      return 'Late Expansion';
    }
  } else if (marginTrend === 'Contracting' && (earningsTrend === 'Decelerating' || revenueTrend === 'Decelerating')) {
    if (percentOfPeak > 75) {
      return 'Early Contraction';
    } else {
      return 'Late Contraction';
    }
  } else if (marginTrend === 'Contracting' && earningsTrend === 'Accelerating') {
    return 'Early Recovery';
  } else if (marginTrend === 'Expanding' && earningsTrend === 'Decelerating') {
    return 'Late Cycle Peak';
  }
  
  return 'Mixed Signals';
};

/**
 * Calculate economic sensitivity score for a stock
 * @param {Object} stock - Stock data
 * @param {Array} economicIndicators - Economic indicator data
 * @returns {Object} Economic sensitivity metrics
 */
export const calculateEconomicSensitivity = (stock, economicIndicators) => {
  if (!stock || !stock.historicalData || !economicIndicators) {
    return {
      sensitivityScore: null,
      error: 'Insufficient data for economic sensitivity analysis'
    };
  }
  
  // Extract historical earnings or revenue data
  const financialData = stock.historicalData.map(period => ({
    date: period.date,
    value: period.earnings || period.revenue || 0
  })).filter(d => d.value !== 0);
  
  // Match economic indicator data to the same periods
  const matchedData = financialData.map(financialPeriod => {
    const matchingIndicator = economicIndicators.find(i => i.date === financialPeriod.date);
    
    if (!matchingIndicator) return null;
    
    return {
      date: financialPeriod.date,
      financialValue: financialPeriod.value,
      indicatorValue: matchingIndicator.value
    };
  }).filter(item => item !== null);
  
  if (matchedData.length < 8) {
    return {
      sensitivityScore: null,
      error: 'Insufficient matched data points for economic sensitivity analysis'
    };
  }
  
  // Calculate correlation coefficient
  const correlation = calculateCorrelation(
    matchedData.map(d => d.financialValue),
    matchedData.map(d => d.indicatorValue)
  );
  
  // Calculate beta (sensitivity) - similar to stock market beta
  const beta = calculateBeta(
    matchedData.map(d => d.financialValue),
    matchedData.map(d => d.indicatorValue)
  );
  
  // Calculate lag effect (how many periods the stock typically lags the economic indicator)
  const lag = calculateOptimalLag(
    financialData.map(d => d.value),
    economicIndicators.map(d => d.value),
    4 // Maximum lag periods to check
  );
  
  // Calculate overall sensitivity score (0-100)
  const sensitivityScore = Math.min(Math.round(Math.abs(beta) * 20), 100);
  
  return {
    sensitivityScore,
    correlation,
    beta,
    lag,
    sensitivityCategory: categorizeSensitivity(sensitivityScore)
  };
};

/**
 * Categorize economic sensitivity based on score
 * @param {number} score - Sensitivity score
 * @returns {string} Category description
 */
const categorizeSensitivity = (score) => {
  if (score === null) return 'Unknown';
  if (score < 20) return 'Defensive / Counter-Cyclical';
  if (score < 40) return 'Moderate Sensitivity';
  if (score < 60) return 'Average Cyclicality';
  if (score < 80) return 'Highly Cyclical';
  return 'Extreme Cyclicality';
};

/**
 * Calculate correlation coefficient between two data series
 * @param {Array} series1 - First data series
 * @param {Array} series2 - Second data series
 * @returns {number} Correlation coefficient (-1 to 1)
 */
const calculateCorrelation = (series1, series2) => {
  if (series1.length !== series2.length || series1.length === 0) {
    return null;
  }
  
  const n = series1.length;
  
  // Calculate means
  const mean1 = series1.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = series2.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate covariance and variances
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = series1[i] - mean1;
    const diff2 = series2[i] - mean2;
    
    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }
  
  // Calculate correlation coefficient
  const stdDev1 = Math.sqrt(variance1);
  const stdDev2 = Math.sqrt(variance2);
  
  if (stdDev1 === 0 || stdDev2 === 0) {
    return null; // Cannot calculate correlation if either series is constant
  }
  
  return covariance / (stdDev1 * stdDev2);
};

/**
 * Calculate beta (sensitivity) of a stock relative to an economic indicator
 * @param {Array} stockValues - Stock financial values
 * @param {Array} indicatorValues - Economic indicator values
 * @returns {number} Beta value
 */
const calculateBeta = (stockValues, indicatorValues) => {
  if (stockValues.length !== indicatorValues.length || stockValues.length < 2) {
    return null;
  }
  
  // Calculate percentage changes
  const stockChanges = [];
  const indicatorChanges = [];
  
  for (let i = 1; i < stockValues.length; i++) {
    if (stockValues[i-1] !== 0 && indicatorValues[i-1] !== 0) {
      stockChanges.push((stockValues[i] - stockValues[i-1]) / stockValues[i-1]);
      indicatorChanges.push((indicatorValues[i] - indicatorValues[i-1]) / indicatorValues[i-1]);
    }
  }
  
  if (stockChanges.length < 2) {
    return null;
  }
  
  // Calculate beta using covariance and variance
  const n = stockChanges.length;
  
  // Calculate means
  const stockMean = stockChanges.reduce((sum, val) => sum + val, 0) / n;
  const indicatorMean = indicatorChanges.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate covariance and variance
  let covariance = 0;
  let indicatorVariance = 0;
  
  for (let i = 0; i < n; i++) {
    covariance += (stockChanges[i] - stockMean) * (indicatorChanges[i] - indicatorMean);
    indicatorVariance += (indicatorChanges[i] - indicatorMean) * (indicatorChanges[i] - indicatorMean);
  }
  
  covariance /= n;
  indicatorVariance /= n;
  
  if (indicatorVariance === 0) {
    return null; // Cannot calculate beta if indicator has no variance
  }
  
  return covariance / indicatorVariance;
};

/**
 * Calculate the optimal lag period for maximum correlation
 * @param {Array} series1 - First data series
 * @param {Array} series2 - Second data series
 * @param {number} maxLag - Maximum lag periods to check
 * @returns {number} Optimal lag period
 */
const calculateOptimalLag = (series1, series2, maxLag) => {
  if (series1.length < maxLag + 1 || series2.length < maxLag + 1) {
    return 0;
  }
  
  // Test different lag periods to find the one with highest correlation
  let maxCorrelation = -2; // Start below minimum possible correlation (-1)
  let optimalLag = 0;
  
  for (let lag = 0; lag <= maxLag; lag++) {
    // Create lagged series
    const lagged1 = series1.slice(0, series1.length - lag);
    const lagged2 = series2.slice(lag);
    
    // Ensure both series have the same length
    const minLength = Math.min(lagged1.length, lagged2.length);
    const trimmed1 = lagged1.slice(0, minLength);
    const trimmed2 = lagged2.slice(0, minLength);
    
    // Calculate correlation
    const correlation = calculateCorrelation(trimmed1, trimmed2);
    
    if (correlation !== null && correlation > maxCorrelation) {
      maxCorrelation = correlation;
      optimalLag = lag;
    }
  }
  
  return optimalLag;
};

/**
 * Find the best investment opportunities based on current market cycle and stock cyclicality
 * @param {string} marketCycle - Current market cycle phase
 * @param {Array} stocks - Array of analyzed stocks with cyclicality data
 * @returns {Array} Filtered and scored investment opportunities
 */
export const findCyclicalOpportunities = (marketCycle, stocks) => {
  if (!marketCycle || !stocks || !Array.isArray(stocks)) {
    return [];
  }
  
  // Define strategy for different market cycle phases
  const strategies = {
    'Early Expansion': {
      targetCyclicality: 'Highly Cyclical',
      secondaryTarget: 'Cyclical',
      avoid: 'Defensive',
      preferredPhases: ['Early Expansion', 'Early Recovery'],
      valueWeight: 0.3,
      qualityWeight: 0.3,
      cyclicalityWeight: 0.4
    },
    'Late Expansion': {
      targetCyclicality: 'Moderate Cyclicality',
      secondaryTarget: 'Cyclical',
      avoid: 'Highly Cyclical',
      preferredPhases: ['Early Expansion', 'Stable'],
      valueWeight: 0.4,
      qualityWeight: 0.4,
      cyclicalityWeight: 0.2
    },
    'Early Contraction': {
      targetCyclicality: 'Defensive',
      secondaryTarget: 'Moderate Cyclicality',
      avoid: 'Highly Cyclical',
      preferredPhases: ['Stable', 'Mixed Signals'],
      valueWeight: 0.5,
      qualityWeight: 0.4,
      cyclicalityWeight: 0.1
    },
    'Late Contraction': {
      targetCyclicality: 'Defensive',
      secondaryTarget: 'Defensive',
      avoid: 'Cyclical',
      preferredPhases: ['Stable', 'Late Contraction'],
      valueWeight: 0.6,
      qualityWeight: 0.3,
      cyclicalityWeight: 0.1
    },
    'Early Recovery': {
      targetCyclicality: 'Cyclical',
      secondaryTarget: 'Highly Cyclical',
      avoid: 'Defensive',
      preferredPhases: ['Early Recovery', 'Late Contraction'],
      valueWeight: 0.5,
      qualityWeight: 0.2,
      cyclicalityWeight: 0.3
    }
  };
  
  // Use default strategy if market cycle not recognized
  const strategy = strategies[marketCycle] || {
    targetCyclicality: 'Moderate Cyclicality',
    secondaryTarget: 'Defensive',
    avoid: 'Highly Cyclical',
    preferredPhases: ['Stable', 'Mixed Signals'],
    valueWeight: 0.4,
    qualityWeight: 0.4,
    cyclicalityWeight: 0.2
  };
  
  // Score and filter stocks based on the strategy
  const scoredStocks = stocks.map(stock => {
    // Skip stocks without cyclicality data
    if (!stock.cyclicalityCategory || !stock.currentPhase) {
      return { ...stock, cyclicalFit: 0 };
    }
    
    // Calculate base cyclicality fit score
    let cyclicalFit = 0;
    
    if (stock.cyclicalityCategory === strategy.targetCyclicality) {
      cyclicalFit += 100;
    } else if (stock.cyclicalityCategory === strategy.secondaryTarget) {
      cyclicalFit += 70;
    } else if (stock.cyclicalityCategory === strategy.avoid) {
      cyclicalFit += 20;
    } else {
      cyclicalFit += 50;
    }
    
    // Adjust for current phase
    if (strategy.preferredPhases.includes(stock.currentPhase)) {
      cyclicalFit += 20;
    }
    
    // Cap at 100
    cyclicalFit = Math.min(cyclicalFit, 100);
    
    // Calculate combined score
    const valueScore = stock.valueScore || 50;
    const qualityScore = stock.qualityScore || 50;
    
    const combinedScore = 
      (valueScore * strategy.valueWeight) + 
      (qualityScore * strategy.qualityWeight) + 
      (cyclicalFit * strategy.cyclicalityWeight);
    
    return {
      ...stock,
      cyclicalFit,
      combinedScore
    };
  });
  
  // Sort by combined score (descending)
  return scoredStocks
    .sort((a, b) => b.combinedScore - a.combinedScore);
};

/**
 * Get investment strategy recommendations based on current market environment
 * @param {string} marketCycle - Current market cycle phase
 * @param {boolean} isOvervalued - Whether the market is generally overvalued
 * @returns {Object} Strategy recommendations
 */
export const getStrategyRecommendations = (marketCycle, isOvervalued = true) => {
  // Base strategies for different market cycles
  const baseStrategies = {
    'Early Expansion': {
      assetAllocation: {
        stocks: 70,
        bonds: 25,
        cash: 5
      },
      sectorFocus: ['Energy', 'Materials', 'Industrials', 'Consumer Discretionary'],
      factorTilts: ['Value', 'Size', 'Momentum'],
      riskLevel: 'Above Average',
      description: 'Focus on economically sensitive sectors that benefit early in the economic cycle.'
    },
    'Late Expansion': {
      assetAllocation: {
        stocks: 60,
        bonds: 30,
        cash: 10
      },
      sectorFocus: ['Technology', 'Financials', 'Communication Services'],
      factorTilts: ['Momentum', 'Quality', 'Growth'],
      riskLevel: 'Average',
      description: 'Begin to emphasize quality companies that can sustain growth as the cycle matures.'
    },
    'Early Contraction': {
      assetAllocation: {
        stocks: 50,
        bonds: 40,
        cash: 10
      },
      sectorFocus: ['Healthcare', 'Consumer Staples', 'Utilities'],
      factorTilts: ['Quality', 'Minimum Volatility', 'Dividend'],
      riskLevel: 'Below Average',
      description: 'Shift toward defensive sectors that can maintain earnings during economic slowdowns.'
    },
    'Late Contraction': {
      assetAllocation: {
        stocks: 40,
        bonds: 45,
        cash: 15
      },
      sectorFocus: ['Utilities', 'Healthcare', 'Consumer Staples'],
      factorTilts: ['Dividend', 'Minimum Volatility', 'Quality'],
      riskLevel: 'Low',
      description: 'Emphasize capital preservation with stable dividend payers and reduced cyclical exposure.'
    },
    'Early Recovery': {
      assetAllocation: {
        stocks: 55,
        bonds: 35,
        cash: 10
      },
      sectorFocus: ['Financials', 'Consumer Discretionary', 'Industrials'],
      factorTilts: ['Value', 'Size', 'Quality'],
      riskLevel: 'Average',
      description: 'Begin adding quality cyclicals that have been overly punished and show signs of recovery.'
    }
  };
  
  // Adjustments for overvalued markets
  const overvaluedAdjustments = {
    'Early Expansion': {
      assetAllocation: {
        stocks: -5,
        bonds: 0,
        cash: +5
      },
      emphasis: 'Focus on relative value within cyclical sectors; avoid the most expensive stocks.',
      additionalTactics: 'Consider value-oriented cyclicals rather than high-multiple growth stocks in sensitive sectors.'
    },
    'Late Expansion': {
      assetAllocation: {
        stocks: -10,
        bonds: +5,
        cash: +5
      },
      emphasis: 'Be especially selective on quality and valuation; reduce exposure to high-multiple growth stocks.',
      additionalTactics: 'Prioritize companies with strong free cash flow and reasonable valuations relative to sector.'
    },
    'Early Contraction': {
      assetAllocation: {
        stocks: -10,
        bonds: +5,
        cash: +5
      },
      emphasis: 'Emphasize highest quality defensive names and consider cash as a strategic position.',
      additionalTactics: 'Focus on companies with strong balance sheets and stable cash flows trading at reasonable valuations.'
    },
    'Late Contraction': {
      assetAllocation: {
        stocks: -5,
        bonds: 0,
        cash: +5
      },
      emphasis: 'Build a watch list of quality cyclicals to purchase when they reach attractive valuations.',
      additionalTactics: 'Maintain dry powder to deploy when opportunities arise in oversold quality cyclicals.'
    },
    'Early Recovery': {
      assetAllocation: {
        stocks: -5,
        bonds: 0,
        cash: +5
      },
      emphasis: 'Focus on companies with strong balance sheets that can survive if recovery is slow.',
      additionalTactics: 'Look for companies trading at discounts to tangible book value or with strong free cash flow yields.'
    }
  };
  
  // Get base strategy
  const baseStrategy = baseStrategies[marketCycle] || baseStrategies['Late Expansion'];
  
  // Apply adjustments if market is overvalued
  if (isOvervalued) {
    const adjustments = overvaluedAdjustments[marketCycle] || overvaluedAdjustments['Late Expansion'];
    
    // Adjust asset allocation
    const adjustedAllocation = {
      stocks: baseStrategy.assetAllocation.stocks + adjustments.assetAllocation.stocks,
      bonds: baseStrategy.assetAllocation.bonds + adjustments.assetAllocation.bonds,
      cash: baseStrategy.assetAllocation.cash + adjustments.assetAllocation.cash
    };
    
    return {
      marketCycle,
      isOvervalued,
      assetAllocation: adjustedAllocation,
      sectorFocus: baseStrategy.sectorFocus,
      factorTilts: baseStrategy.factorTilts,
      riskLevel: baseStrategy.riskLevel,
      description: baseStrategy.description,
      overvaluedEmphasis: adjustments.emphasis,
      additionalTactics: adjustments.additionalTactics
    };
  }
  
  // Return base strategy if market is not overvalued
  return {
    marketCycle,
    isOvervalued,
    assetAllocation: baseStrategy.assetAllocation,
    sectorFocus: baseStrategy.sectorFocus,
    factorTilts: baseStrategy.factorTilts,
    riskLevel: baseStrategy.riskLevel,
    description: baseStrategy.description
  };
};
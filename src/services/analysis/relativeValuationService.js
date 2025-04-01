/**
 * Relative Valuation Service
 * 
 * This service analyzes stocks in relation to their historical valuations,
 * industry peers, and overall market to find relative value opportunities
 * even in an overvalued market environment.
 */

import { formatPercentage, formatCurrency } from '../utils/formatters';

/**
 * Calculate historical valuation percentiles for a stock
 * @param {Object} stock - Stock data object
 * @param {Array} historicalData - Array of historical valuation metrics
 * @param {Array} metrics - Metrics to analyze (e.g., ['pe', 'pb', 'evToEbitda'])
 * @returns {Object} Percentile rankings for each metric
 */
export const calculateHistoricalPercentiles = (stock, historicalData, metrics = ['pe', 'pb', 'evToEbitda']) => {
  const percentiles = {};
  
  metrics.forEach(metric => {
    if (!stock[metric]) return;
    
    // Get all historical values for this metric
    const historicalValues = historicalData
      .filter(data => data[metric] > 0) // Filter out negative or zero values
      .map(data => data[metric])
      .sort((a, b) => a - b);
    
    if (historicalValues.length === 0) return;
    
    // Find what percentile the current value is in
    const currentValue = stock[metric];
    const position = historicalValues.findIndex(val => val >= currentValue);
    
    if (position === -1) {
      // Current value is higher than all historical values
      percentiles[metric] = 100;
    } else {
      percentiles[metric] = (position / historicalValues.length) * 100;
    }
  });
  
  return percentiles;
};

/**
 * Compare a stock's metrics to its industry peers
 * @param {Object} stock - Stock data object
 * @param {Array} peers - Array of peer company data
 * @param {Array} metrics - Metrics to compare
 * @returns {Object} Relative valuations compared to peers
 */
export const compareToIndustryPeers = (stock, peers, metrics = ['pe', 'pb', 'evToEbitda', 'dividendYield', 'freeCashFlowYield']) => {
  const peerComparison = {};
  
  metrics.forEach(metric => {
    if (!stock[metric]) return;
    
    // Calculate peer average excluding outliers
    const peerValues = peers
      .filter(peer => peer[metric] > 0) // Filter out negative or zero values
      .map(peer => peer[metric]);
    
    if (peerValues.length === 0) return;
    
    // Sort values to handle outliers
    peerValues.sort((a, b) => a - b);
    
    // Remove outliers (trim 10% from each end)
    const trimIndex = Math.floor(peerValues.length * 0.1);
    const trimmedValues = peerValues.slice(trimIndex, peerValues.length - trimIndex);
    
    // Calculate average of remaining peers
    const peerAverage = trimmedValues.reduce((sum, val) => sum + val, 0) / trimmedValues.length;
    
    // Calculate relative value (percentage compared to peer average)
    peerComparison[metric] = {
      value: stock[metric],
      peerAverage,
      relativeToPeers: (stock[metric] / peerAverage) * 100,
      percentileToPeers: calculatePercentileInArray(stock[metric], peerValues)
    };
  });
  
  return peerComparison;
};

/**
 * Helper function to calculate percentile of a value in an array
 * @param {Number} value - Value to find percentile for
 * @param {Array} array - Sorted array of values
 * @returns {Number} Percentile (0-100)
 */
const calculatePercentileInArray = (value, array) => {
  if (array.length === 0) return null;
  
  const position = array.findIndex(val => val >= value);
  
  if (position === -1) {
    return 100;
  } else {
    return (position / array.length) * 100;
  }
};

/**
 * Calculate stock's relative value against broader market
 * @param {Object} stock - Stock data object
 * @param {Object} marketData - Market average valuation data 
 * @param {Array} metrics - Metrics to compare
 * @returns {Object} Relative valuations compared to market
 */
export const compareToMarket = (stock, marketData, metrics = ['pe', 'pb', 'dividendYield']) => {
  const marketComparison = {};
  
  metrics.forEach(metric => {
    if (!stock[metric] || !marketData[metric]) return;
    
    marketComparison[metric] = {
      value: stock[metric],
      marketAverage: marketData[metric],
      relativeToMarket: (stock[metric] / marketData[metric]) * 100
    };
  });
  
  return marketComparison;
};

/**
 * Calculate sector-relative valuations
 * @param {string} sector - Sector name
 * @param {Array} sectorStocks - Array of stocks in the sector
 * @param {Object} marketData - Market average data
 * @returns {Object} Sector relative valuation metrics
 */
export const analyzeSectorValuation = (sector, sectorStocks, marketData) => {
  const metrics = ['pe', 'pb', 'dividendYield', 'freeCashFlowYield'];
  const sectorMetrics = {};
  
  // Calculate sector averages
  metrics.forEach(metric => {
    const values = sectorStocks
      .filter(stock => stock[metric] > 0)
      .map(stock => stock[metric]);
    
    if (values.length === 0) return;
    
    // Calculate average after removing outliers
    values.sort((a, b) => a - b);
    const trimIndex = Math.max(1, Math.floor(values.length * 0.1));
    const trimmedValues = values.slice(trimIndex, values.length - trimIndex);
    
    sectorMetrics[metric] = {
      average: trimmedValues.reduce((sum, val) => sum + val, 0) / trimmedValues.length,
      median: values[Math.floor(values.length / 2)],
      min: values[0],
      max: values[values.length - 1]
    };
    
    // Add relative to market
    if (marketData[metric]) {
      sectorMetrics[metric].relativeToMarket = 
        (sectorMetrics[metric].average / marketData[metric]) * 100;
    }
  });
  
  return {
    sector,
    metrics: sectorMetrics,
    stockCount: sectorStocks.length,
    relativeAttractiveness: calculateSectorAttractiveness(sectorMetrics, marketData)
  };
};

/**
 * Calculate overall sector attractiveness based on multiple metrics
 * @param {Object} sectorMetrics - Calculated sector metrics
 * @param {Object} marketData - Market data for comparison
 * @returns {Number} Attractiveness score (higher is better)
 */
const calculateSectorAttractiveness = (sectorMetrics, marketData) => {
  // This is a simplified scoring model - in practice you would use a more sophisticated approach
  let score = 0;
  let factors = 0;
  
  // PE ratio (lower is better)
  if (sectorMetrics.pe && marketData.pe) {
    const peRatio = sectorMetrics.pe.average / marketData.pe;
    score += (1 / peRatio) * 25; // Invert ratio so lower PE gives higher score
    factors++;
  }
  
  // PB ratio (lower is better)
  if (sectorMetrics.pb && marketData.pb) {
    const pbRatio = sectorMetrics.pb.average / marketData.pb;
    score += (1 / pbRatio) * 25;
    factors++;
  }
  
  // Dividend yield (higher is better)
  if (sectorMetrics.dividendYield && marketData.dividendYield) {
    const divRatio = sectorMetrics.dividendYield.average / marketData.dividendYield;
    score += divRatio * 25;
    factors++;
  }
  
  // Free cash flow yield (higher is better)
  if (sectorMetrics.freeCashFlowYield && marketData.freeCashFlowYield) {
    const fcfRatio = sectorMetrics.freeCashFlowYield.average / marketData.freeCashFlowYield;
    score += fcfRatio * 25;
    factors++;
  }
  
  return factors > 0 ? score / factors : 0;
};

/**
 * Find relative value opportunities in an overvalued market
 * @param {Array} stocks - Array of stock data
 * @param {Object} marketData - Market average data
 * @param {Number} threshold - Minimum attractiveness score
 * @returns {Array} Sorted opportunities by attractiveness
 */
export const findRelativeValueOpportunities = (stocks, marketData, threshold = 70) => {
  // Group stocks by sector
  const sectorMap = stocks.reduce((acc, stock) => {
    if (!acc[stock.sector]) {
      acc[stock.sector] = [];
    }
    acc[stock.sector].push(stock);
    return acc;
  }, {});
  
  // Analyze each sector
  const sectorAnalysis = Object.keys(sectorMap).map(sector => 
    analyzeSectorValuation(sector, sectorMap[sector], marketData)
  );
  
  // Sort sectors by attractiveness
  const sortedSectors = sectorAnalysis
    .sort((a, b) => b.relativeAttractiveness - a.relativeAttractiveness);
  
  // Find the most attractive sectors
  const attractiveSectors = sortedSectors
    .filter(sector => sector.relativeAttractiveness >= threshold)
    .map(sector => sector.sector);
  
  // For each attractive sector, find the most attractive stocks
  const opportunities = [];
  
  attractiveSectors.forEach(sectorName => {
    const sectorStocks = sectorMap[sectorName];
    
    // Calculate stock-specific attractiveness scores
    const scoredStocks = sectorStocks.map(stock => {
      // Calculate relative valuation score
      const relativeValuationScore = calculateRelativeValuationScore(stock, sectorStocks);
      
      // Calculate quality score
      const qualityScore = calculateQualityScore(stock);
      
      // Calculate combined score (60% valuation, 40% quality)
      const combinedScore = (relativeValuationScore * 0.6) + (qualityScore * 0.4);
      
      return {
        ...stock,
        analysis: {
          relativeValuationScore,
          qualityScore,
          combinedScore
        }
      };
    });
    
    // Sort stocks by combined score and take top 3
    const topStocks = scoredStocks
      .sort((a, b) => b.analysis.combinedScore - a.analysis.combinedScore)
      .slice(0, 3);
    
    opportunities.push(...topStocks);
  });
  
  // Return opportunities sorted by combined score
  return opportunities.sort((a, b) => b.analysis.combinedScore - a.analysis.combinedScore);
};

/**
 * Calculate relative valuation score for a stock compared to its sector peers
 * @param {Object} stock - Stock data
 * @param {Array} sectorPeers - Array of peer stocks in the same sector
 * @returns {Number} Relative valuation score (0-100)
 */
const calculateRelativeValuationScore = (stock, sectorPeers) => {
  let score = 0;
  let factors = 0;
  
  // PE ratio (lower is better)
  if (stock.pe && stock.pe > 0) {
    const peerPEs = sectorPeers.filter(peer => peer.pe > 0).map(peer => peer.pe);
    if (peerPEs.length > 0) {
      const peerMedianPE = calculateMedian(peerPEs);
      const peRatio = stock.pe / peerMedianPE;
      score += (1 / peRatio) * 30; // Invert ratio so lower PE gives higher score
      factors++;
    }
  }
  
  // P/B ratio (lower is better)
  if (stock.pb && stock.pb > 0) {
    const peerPBs = sectorPeers.filter(peer => peer.pb > 0).map(peer => peer.pb);
    if (peerPBs.length > 0) {
      const peerMedianPB = calculateMedian(peerPBs);
      const pbRatio = stock.pb / peerMedianPB;
      score += (1 / pbRatio) * 20; // Invert ratio so lower PB gives higher score
      factors++;
    }
  }
  
  // Dividend yield (higher is better)
  if (stock.dividendYield && stock.dividendYield > 0) {
    const peerYields = sectorPeers.filter(peer => peer.dividendYield > 0).map(peer => peer.dividendYield);
    if (peerYields.length > 0) {
      const peerMedianYield = calculateMedian(peerYields);
      const yieldRatio = stock.dividendYield / peerMedianYield;
      score += yieldRatio * 25;
      factors++;
    }
  }
  
  // Free cash flow yield (higher is better)
  if (stock.freeCashFlowYield && stock.freeCashFlowYield > 0) {
    const peerFCFYields = sectorPeers.filter(peer => peer.freeCashFlowYield > 0).map(peer => peer.freeCashFlowYield);
    if (peerFCFYields.length > 0) {
      const peerMedianFCFYield = calculateMedian(peerFCFYields);
      const fcfYieldRatio = stock.freeCashFlowYield / peerMedianFCFYield;
      score += fcfYieldRatio * 25;
      factors++;
    }
  }
  
  // Normalize to 0-100 scale
  return factors > 0 ? Math.min(100, score / factors) : 0;
};

/**
 * Calculate quality score for a stock based on financial metrics
 * @param {Object} stock - Stock data
 * @returns {Number} Quality score (0-100)
 */
const calculateQualityScore = (stock) => {
  let score = 0;
  let factors = 0;
  
  // Return on equity (higher is better)
  if (stock.roe && stock.roe > 0) {
    // Scale: 0-5% = 0-25 points, 5-15% = 25-75 points, 15%+ = 75-100 points
    const roeScore = stock.roe < 5 ? (stock.roe / 5) * 25 :
                     stock.roe < 15 ? 25 + ((stock.roe - 5) / 10) * 50 :
                     75 + Math.min(25, ((stock.roe - 15) / 10) * 25);
    score += roeScore;
    factors++;
  }
  
  // Return on invested capital (higher is better)
  if (stock.roic && stock.roic > 0) {
    // Scale: 0-4% = 0-25 points, 4-12% = 25-75 points, 12%+ = 75-100 points
    const roicScore = stock.roic < 4 ? (stock.roic / 4) * 25 :
                      stock.roic < 12 ? 25 + ((stock.roic - 4) / 8) * 50 :
                      75 + Math.min(25, ((stock.roic - 12) / 8) * 25);
    score += roicScore;
    factors++;
  }
  
  // Debt to equity (lower is better)
  if (stock.debtToEquity !== undefined) {
    // Scale: 0-0.5 = 75-100 points, 0.5-2 = 25-75 points, 2+ = 0-25 points
    const debtScore = stock.debtToEquity < 0.5 ? 75 + ((0.5 - stock.debtToEquity) / 0.5) * 25 :
                      stock.debtToEquity < 2 ? 25 + ((2 - stock.debtToEquity) / 1.5) * 50 :
                      Math.max(0, 25 - ((stock.debtToEquity - 2) / 2) * 25);
    score += debtScore;
    factors++;
  }
  
  // Interest coverage ratio (higher is better)
  if (stock.interestCoverage && stock.interestCoverage > 0) {
    // Scale: 0-2 = 0-25 points, 2-5 = 25-75 points, 5+ = 75-100 points
    const interestCoverageScore = stock.interestCoverage < 2 ? (stock.interestCoverage / 2) * 25 :
                                  stock.interestCoverage < 5 ? 25 + ((stock.interestCoverage - 2) / 3) * 50 :
                                  75 + Math.min(25, ((stock.interestCoverage - 5) / 5) * 25);
    score += interestCoverageScore;
    factors++;
  }
  
  // Normalize to 0-100 scale
  return factors > 0 ? score / factors : 0;
};

/**
 * Calculate median value from an array of numbers
 * @param {Array} values - Array of numbers
 * @returns {Number} Median value
 */
const calculateMedian = (values) => {
  if (!values || values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Format a stock list with key relative valuation metrics for display
 * @param {Array} stocks - Array of analyzed stocks
 * @returns {Array} Formatted stock data for display
 */
export const formatStocksForDisplay = (stocks) => {
  return stocks.map(stock => ({
    symbol: stock.symbol,
    name: stock.companyName || stock.name,
    sector: stock.sector,
    price: stock.price,
    pe: stock.pe,
    pb: stock.pb,
    dividendYield: stock.dividendYield,
    fcfYield: stock.freeCashFlowYield,
    relativeValue: stock.analysis ? stock.analysis.relativeValuationScore : null,
    quality: stock.analysis ? stock.analysis.qualityScore : null,
    combinedScore: stock.analysis ? stock.analysis.combinedScore : null,
    peRatio: stock.historical && stock.historical.medianPE 
      ? (stock.pe / stock.historical.medianPE).toFixed(2) + 'x'
      : 'N/A',
    pbRatio: stock.historical && stock.historical.medianPB
      ? (stock.pb / stock.historical.medianPB).toFixed(2) + 'x'
      : 'N/A',
    discount: stock.historical && stock.historical.medianPE && stock.pe
      ? ((1 - stock.pe / stock.historical.medianPE) * 100).toFixed(1) + '%'
      : 'N/A'
  }));
};

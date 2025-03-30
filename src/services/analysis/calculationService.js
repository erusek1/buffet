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
    
    // Calculate present value of earnings stream
    let presentValueOfEarnings = 0;
    for (let year = 1; year <= yearsProjected; year++) {
      const yearEarnings = ownerEarningsPerShare * Math.pow(1 + growthRateDecimal, year);
      presentValueOfEarnings += yearEarnings / Math.pow(1 + discountRateDecimal, year);
    }
    
    // Calculate present value of terminal value
    const presentValueOfTerminal = terminalValue / Math.pow(1 + discountRateDecimal, yearsProjected);
    
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
/**
 * Data Quality Service
 * Validates and normalizes financial data before valuation calculations
 */

const dataQualityService = {
    /**
     * Normalize growth rates to realistic Buffett-style conservative values
     * @param {number} historicalGrowth - Raw historical growth rate
     * @param {string} businessQuality - Quality category of the business
     * @returns {number} - Normalized growth rate for projections
     */
    normalizeGrowthRate: (historicalGrowth, businessQuality) => {
      // Cap growth rates based on business quality
      const growthCaps = {
        excellent: 12,
        good: 10,
        fair: 8, 
        cyclical: 6
      };
      
      // Floor growth rates
      const growthFloors = {
        excellent: 3,
        good: 2,
        fair: 1.5,
        cyclical: 1
      };
      
      // Default to 'fair' if business quality is not provided
      const quality = businessQuality || 'fair';
      const cap = growthCaps[quality] || 8;
      const floor = growthFloors[quality] || 1.5;
      
      // Normalize growth rate based on historical data
      let normalizedGrowth;
      
      if (historicalGrowth > 25) {
        // Very high growth rates are likely unsustainable
        // Use logarithmic dampening for high growth rates
        normalizedGrowth = cap * (Math.log(historicalGrowth / 10) / Math.log(25 / 10));
        normalizedGrowth = Math.min(normalizedGrowth, cap);
      } else if (historicalGrowth > cap) {
        // Use average between historical and cap for moderate high growth
        normalizedGrowth = (historicalGrowth + cap) / 2;
        normalizedGrowth = Math.min(normalizedGrowth, cap);
      } else if (historicalGrowth < 0) {
        // For negative growth, use a conservative positive floor
        normalizedGrowth = floor;
      } else {
        // Use the historical growth directly if within reasonable range
        normalizedGrowth = historicalGrowth;
      }
      
      return Number(normalizedGrowth.toFixed(2));
    },
    
    /**
     * Validate owner earnings calculation
     * @param {Object} earningsData - Raw earnings data
     * @returns {Object} - Validated and adjusted earnings data
     */
    validateOwnerEarnings: (earningsData) => {
      const { netIncome, depreciation, capex, workingCapitalChange } = earningsData;
      
      // Check for unrealistic capex proportions
      const capexRatio = capex / netIncome;
      let adjustedCapex = capex;
      
      if (capexRatio > 2) {
        // Unusually high capex relative to net income
        adjustedCapex = netIncome * 0.7; // Adjust to more realistic level
      }
      
      // Calculate owner earnings
      const ownerEarnings = netIncome + depreciation - adjustedCapex - workingCapitalChange;
      
      return {
        ...earningsData,
        adjustedCapex,
        ownerEarnings,
        adjustments: capexRatio > 2 ? ['High capex adjusted'] : []
      };
    },
    
    /**
     * Check for data anomalies that might affect valuation
     * @param {Object} stockData - Complete stock financial data
     * @returns {Object} - Anomaly report with warnings
     */
    detectAnomalies: (stockData) => {
      const anomalies = [];
      
      // Check for one-time events affecting earnings
      if (stockData.netIncomeGrowth > 100) {
        anomalies.push('Unusually high net income growth detected');
      }
      
      // Check for extreme values in key metrics
      if (stockData.ROE > 50) {
        anomalies.push('Extremely high ROE detected');
      }
      
      if (stockData.grossMargin > 80) {
        anomalies.push('Unusually high gross margin detected');
      }
      
      // Detect inconsistencies in financial statements
      if (stockData.totalAssets && stockData.totalLiabilities && stockData.shareholders_equity) {
        const calculatedEquity = stockData.totalAssets - stockData.totalLiabilities;
        const reportedEquity = stockData.shareholders_equity;
        
        if (Math.abs(calculatedEquity - reportedEquity) / reportedEquity > 0.1) {
          anomalies.push('Balance sheet inconsistency detected');
        }
      }
      
      return {
        hasAnomalies: anomalies.length > 0,
        anomalies,
        reliability: anomalies.length === 0 ? 'high' : 
                     anomalies.length <= 2 ? 'medium' : 'low'
      };
    }
  };
  
  export default dataQualityService;
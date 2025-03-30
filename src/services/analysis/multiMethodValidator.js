/**
 * Multi-Method Validator
 * Cross-validates valuation results using multiple approaches
 */

const multiMethodValidator = {
    /**
     * Validates DCF valuation against alternative methods
     * @param {Object} valuationResults - Results from multiple valuation methods
     * @returns {Object} - Validated results with confidence score
     */
    validateValuation: (valuationResults) => {
      const { dcf, graham, pe, epv, assetBased } = valuationResults;
      
      // Initialize validation metrics
      let weightedValue = 0;
      let totalWeight = 0;
      let confidenceScore = 0;
      const outlierMethods = [];
      
      // Define weights for each method based on business quality
      const weights = {
        dcf: 0.5,        // DCF is primary method for Buffett
        graham: 0.15,     // Graham Number as secondary check
        pe: 0.15,         // PE-based valuation
        epv: 0.15,        // Earnings Power Value
        assetBased: 0.05  // Asset-based has lowest weight for going concerns
      };
      
      // Calculate weighted average and check for outliers
      if (dcf) {
        weightedValue += dcf * weights.dcf;
        totalWeight += weights.dcf;
      }
      
      if (graham) {
        weightedValue += graham * weights.graham;
        totalWeight += weights.graham;
        
        // Check if Graham valuation is an outlier
        if (dcf && Math.abs(graham - dcf) / dcf > 0.5) {
          outlierMethods.push('graham');
        }
      }
      
      if (pe) {
        weightedValue += pe * weights.pe;
        totalWeight += weights.pe;
        
        // Check if PE valuation is an outlier
        if (dcf && Math.abs(pe - dcf) / dcf > 0.5) {
          outlierMethods.push('pe');
        }
      }
      
      if (epv) {
        weightedValue += epv * weights.epv;
        totalWeight += weights.epv;
        
        // Check if Earnings Power Value is an outlier
        if (dcf && Math.abs(epv - dcf) / dcf > 0.5) {
          outlierMethods.push('epv');
        }
      }
      
      if (assetBased) {
        weightedValue += assetBased * weights.assetBased;
        totalWeight += weights.assetBased;
        
        // Check if Asset-based valuation is an outlier
        if (dcf && Math.abs(assetBased - dcf) / dcf > 0.5) {
          outlierMethods.push('assetBased');
        }
      }
      
      // Calculate final weighted value
      const finalValue = totalWeight > 0 ? weightedValue / totalWeight : dcf || 0;
      
      // Calculate confidence score (0-100)
      if (totalWeight > 0) {
        // Base confidence on number of methods used
        const methodsCount = Object.keys(valuationResults).filter(key => valuationResults[key]).length;
        const methodScore = methodsCount / 5 * 40; // Max 40 points for using all methods
        
        // Deduct points for outliers
        const outlierDeduction = outlierMethods.length * 15;
        
        // Add points for consistency
        const consistencyScore = 60 - outlierDeduction;
        
        confidenceScore = Math.min(100, Math.max(0, methodScore + consistencyScore));
      }
      
      return {
        originalValues: valuationResults,
        validatedValue: finalValue,
        outlierMethods,
        confidenceScore,
        reliability: confidenceScore > 80 ? 'high' : 
                     confidenceScore > 60 ? 'medium' : 'low',
        recommendation: confidenceScore < 50 ? 'Manual review recommended' : 'Automated valuation acceptable'
      };
    },
    
    /**
     * Compares valuation to current market price to assess potential errors
     * @param {number} intrinsicValue - Calculated intrinsic value
     * @param {number} currentPrice - Current market price
     * @returns {Object} - Assessment of valuation reliability
     */
    assessPriceDiscrepancy: (intrinsicValue, currentPrice) => {
      if (!intrinsicValue || !currentPrice) {
        return { reliable: false, message: 'Missing price data' };
      }
      
      const discrepancy = (intrinsicValue - currentPrice) / currentPrice;
      
      // Define thresholds for suspicious valuations
      if (discrepancy > 2) {
        // Over 200% upside is suspicious
        return {
          reliable: false,
          message: 'Extremely high upside potential detected. Valuation may be unrealistic.',
          discrepancyLevel: 'extreme',
          reviewRequired: true
        };
      } else if (discrepancy > 1) {
        // 100-200% upside is high but possible
        return {
          reliable: true,
          message: 'High upside potential detected. Consider reviewing growth assumptions.',
          discrepancyLevel: 'high',
          reviewRequired: false
        };
      } else if (discrepancy < -0.9) {
        // Value less than 10% of current price is suspicious
        return {
          reliable: false,
          message: 'Extremely low valuation detected. Assumptions may be too conservative.',
          discrepancyLevel: 'extreme-low',
          reviewRequired: true
        };
      }
      
      // Normal range
      return {
        reliable: true,
        message: 'Valuation within reasonable range of current price.',
        discrepancyLevel: 'normal',
        reviewRequired: false
      };
    }
  };
  
  export default multiMethodValidator;
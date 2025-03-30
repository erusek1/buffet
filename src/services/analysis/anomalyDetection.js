/**
 * Anomaly Detection Service
 * Identifies suspicious valuations and flags outliers
 */

const anomalyDetection = {
    /**
     * Detect outliers in batch analysis results
     * @param {Array} stockAnalyses - Array of stock analysis results
     * @returns {Object} - Flagged anomalies with reasons
     */
    detectBatchOutliers: (stockAnalyses) => {
      if (!stockAnalyses || !stockAnalyses.length) {
        return { outliers: [] };
      }
      
      const outliers = [];
      
      // Calculate statistical metrics across the batch
      const upsideValues = stockAnalyses
        .filter(stock => stock.results && stock.results.upsidePercent !== null)
        .map(stock => stock.results.upsidePercent);
      
      if (upsideValues.length < 3) {
        return { outliers: [] }; // Not enough data for analysis
      }
      
      // Calculate mean and standard deviation
      const mean = upsideValues.reduce((sum, val) => sum + val, 0) / upsideValues.length;
      const variance = upsideValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / upsideValues.length;
      const stdDev = Math.sqrt(variance);
      
      // Flag stocks with upside more than 2 standard deviations from mean
      stockAnalyses.forEach(stock => {
        if (!stock.results || stock.results.upsidePercent === null) return;
        
        const zScore = Math.abs(stock.results.upsidePercent - mean) / stdDev;
        
        if (zScore > 2) {
          outliers.push({
            ticker: stock.ticker,
            name: stock.name,
            upside: stock.results.upsidePercent,
            zScore,
            reason: `Statistical outlier (${zScore.toFixed(2)} standard deviations from mean)`
          });
        }
      });
      
      return {
        outliers,
        statistics: {
          mean,
          stdDev,
          sampleSize: upsideValues.length
        }
      };
    },
    
    /**
     * Detect anomalies in a single stock valuation
     * @param {Object} stockAnalysis - Complete stock analysis results
     * @param {number} currentPrice - Current market price
     * @returns {Object} - Anomaly detection results
     */
    detectValuationAnomalies: (stockAnalysis, currentPrice) => {
      if (!stockAnalysis || !currentPrice) {
        return { anomalies: [] };
      }
      
      const anomalies = [];
      
      // Check for excessive upside potential
      if (stockAnalysis.results && stockAnalysis.results.intrinsicValue) {
        const upside = (stockAnalysis.results.intrinsicValue - currentPrice) / currentPrice;
        
        if (upside > 2) {
          anomalies.push({
            type: 'excessive_upside',
            description: 'Calculated upside exceeds 200%, suggesting potential calculation error',
            severity: 'high'
          });
        }
      }
      
      // Check for unrealistic growth assumptions
      if (stockAnalysis.inputs && stockAnalysis.inputs.projectedGrowthRate > 20) {
        anomalies.push({
          type: 'high_growth',
          description: 'Projected growth rate exceeds 20%, which is rarely sustainable long-term',
          severity: 'medium'
        });
      }
      
      // Check for unusually high terminal value contribution
      if (stockAnalysis.calculations) {
        const { presentValueOfTerminal, presentValueOfEarnings } = stockAnalysis.calculations;
        const terminalValueContribution = presentValueOfTerminal / 
                                        (presentValueOfTerminal + presentValueOfEarnings);
        
        if (terminalValueContribution > 0.7) {
          anomalies.push({
            type: 'high_terminal_value',
            description: 'Terminal value contributes more than 70% of total valuation, reducing reliability',
            severity: 'medium'
          });
        }
      }
      
      // Check for insufficient margin of safety relative to business quality
      if (stockAnalysis.inputs) {
        const { marginOfSafety, businessQuality } = stockAnalysis.inputs;
        
        if (businessQuality === 'cyclical' && marginOfSafety < 40) {
          anomalies.push({
            type: 'insufficient_safety',
            description: 'Cyclical business should have at least 40% margin of safety',
            severity: 'medium'
          });
        } else if (businessQuality === 'fair' && marginOfSafety < 30) {
          anomalies.push({
            type: 'insufficient_safety',
            description: 'Fair quality business should have at least 30% margin of safety',
            severity: 'low'
          });
        }
      }
      
      return {
        anomalies,
        isReliable: anomalies.filter(a => a.severity === 'high').length === 0,
        needsReview: anomalies.length > 0,
        reviewPriority: anomalies.filter(a => a.severity === 'high').length > 0 ? 'high' : 
                       anomalies.length > 0 ? 'medium' : 'low'
      };
    }
  };
  
  export default anomalyDetection;
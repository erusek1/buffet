/**
 * Service for processing and standardizing financial data
 */

/**
 * Process and normalize company financial data
 * This ensures consistent data format regardless of API response variations
 */
export const processFinancialData = (data) => {
    const {
      profile,
      quote,
      incomeStatements,
      balanceSheets,
      cashFlows,
      metrics,
      ratios
    } = data;
    
    // Ensure we have required data
    if (!profile || !quote || !incomeStatements || !balanceSheets || !cashFlows) {
      throw new Error('Incomplete financial data');
    }
    
    // Process company profile
    const processedProfile = {
      symbol: profile.symbol || '',
      companyName: profile.companyName || '',
      currency: profile.currency || 'USD',
      exchange: profile.exchange || '',
      industry: profile.industry || '',
      sector: profile.sector || '',
      description: profile.description || '',
      website: profile.website || '',
      ceo: profile.ceo || '',
      employees: profile.fullTimeEmployees || 0,
      mktCap: profile.mktCap || 0,
      volAvg: profile.volAvg || 0,
    };
    
    // Process stock quote
    const processedQuote = {
      price: quote.price || 0,
      change: quote.change || 0,
      changesPercentage: quote.changesPercentage || 0,
      dayLow: quote.dayLow || 0,
      dayHigh: quote.dayHigh || 0,
      yearHigh: quote.yearHigh || 0,
      yearLow: quote.yearLow || 0,
      marketCap: quote.marketCap || 0,
      priceAvg50: quote.priceAvg50 || 0,
      priceAvg200: quote.priceAvg200 || 0,
      volume: quote.volume || 0,
      avgVolume: quote.avgVolume || 0,
      exchange: quote.exchange || '',
      open: quote.open || 0,
      previousClose: quote.previousClose || 0,
      eps: quote.eps || 0,
      pe: quote.pe || 0,
      earningsAnnouncement: quote.earningsAnnouncement || '',
      sharesOutstanding: quote.sharesOutstanding || 0,
      timestamp: quote.timestamp || 0,
    };
    
    // Keep original statements but ensure they're sorted correctly (most recent first)
    const sortedIncomeStatements = [...incomeStatements].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    const sortedBalanceSheets = [...balanceSheets].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    const sortedCashFlows = [...cashFlows].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    const sortedMetrics = metrics ? [...metrics].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    }) : [];
    
    const sortedRatios = ratios ? [...ratios].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    }) : [];
    
    return {
      profile: processedProfile,
      quote: processedQuote,
      incomeStatements: sortedIncomeStatements,
      balanceSheets: sortedBalanceSheets,
      cashFlows: sortedCashFlows,
      metrics: sortedMetrics,
      ratios: sortedRatios
    };
  };
  
  /**
   * Extract TTM (Trailing Twelve Months) financial data
   */
  export const extractTTMData = (statements) => {
    if (!statements || statements.length < 4) {
      return null;
    }
    
    // Get the four most recent quarterly statements
    const ttmStatements = statements.slice(0, 4);
    
    // Sum up key financial metrics
    const ttmData = {};
    
    // Common financial fields to sum
    const fieldsToSum = [
      'revenue', 'grossProfit', 'operatingIncome', 'netIncome',
      'operatingExpenses', 'interestExpense', 'incomeTaxExpense',
      'depreciationAndAmortization', 'capitalExpenditure', 'dividendPayout'
    ];
    
    // Sum each field across the 4 quarters
    fieldsToSum.forEach(field => {
      ttmData[field] = ttmStatements.reduce((sum, statement) => {
        return sum + (statement[field] || 0);
      }, 0);
    });
    
    return ttmData;
  };
  
  /**
   * Extract key per-share metrics from financial data
   */
  export const calculatePerShareMetrics = (financialData) => {
    const {
      profile,
      quote,
      incomeStatements,
      balanceSheets,
      cashFlows
    } = financialData;
    
    // Get shares outstanding
    const sharesOutstanding = quote.sharesOutstanding || profile.mktCap / quote.price;
    if (!sharesOutstanding || sharesOutstanding === 0) {
        return null;
      }
      
      // Calculate per-share metrics from most recent financial statements
      const recentIncome = incomeStatements[0];
      const recentBalance = balanceSheets[0];
      const recentCashFlow = cashFlows[0];
      
      if (!recentIncome || !recentBalance || !recentCashFlow) {
        return null;
      }
      
      const perShareMetrics = {
        eps: recentIncome.eps || recentIncome.netIncome / sharesOutstanding,
        revenue: recentIncome.revenue / sharesOutstanding,
        bookValue: recentBalance.totalStockholdersEquity / sharesOutstanding,
        operatingCashFlow: recentCashFlow.operatingCashFlow / sharesOutstanding,
        freeCashFlow: (recentCashFlow.operatingCashFlow - Math.abs(recentCashFlow.capitalExpenditure)) / sharesOutstanding,
        tangibleBookValue: (recentBalance.totalStockholdersEquity - (recentBalance.goodwillAndIntangibleAssets || 0)) / sharesOutstanding,
        cashPerShare: (recentBalance.cashAndCashEquivalents || 0) / sharesOutstanding,
        debtPerShare: (recentBalance.totalDebt || 0) / sharesOutstanding,
        workingCapitalPerShare: ((recentBalance.totalCurrentAssets || 0) - (recentBalance.totalCurrentLiabilities || 0)) / sharesOutstanding
      };
      
      return perShareMetrics;
    };
    
    /**
     * Calculate historical growth rates for key metrics
     */
    export const calculateHistoricalGrowth = (financialData, years = 5) => {
      const {
        incomeStatements,
        balanceSheets,
        cashFlows
      } = financialData;
      
      if (!incomeStatements || !balanceSheets || !cashFlows) {
        return null;
      }
      
      // Ensure we have enough data
      const dataPoints = Math.min(
        incomeStatements.length,
        balanceSheets.length,
        cashFlows.length,
        years
      );
      
      if (dataPoints < 2) {
        return null;
      }
      
      // Calculate growth rates for various metrics
      const growthRates = {
        revenue: calculateCompoundGrowthRate(
          incomeStatements.slice(0, dataPoints).map(stmt => stmt.revenue)
        ),
        earnings: calculateCompoundGrowthRate(
          incomeStatements.slice(0, dataPoints).map(stmt => stmt.netIncome)
        ),
        operatingIncome: calculateCompoundGrowthRate(
          incomeStatements.slice(0, dataPoints).map(stmt => stmt.operatingIncome)
        ),
        operatingCashFlow: calculateCompoundGrowthRate(
          cashFlows.slice(0, dataPoints).map(stmt => stmt.operatingCashFlow)
        ),
        freeCashFlow: calculateCompoundGrowthRate(
          cashFlows.slice(0, dataPoints).map(stmt => 
            stmt.operatingCashFlow - Math.abs(stmt.capitalExpenditure)
          )
        ),
        bookValue: calculateCompoundGrowthRate(
          balanceSheets.slice(0, dataPoints).map(stmt => stmt.totalStockholdersEquity)
        ),
      };
      
      return growthRates;
    };
    
    /**
     * Calculate compound annual growth rate 
     */
    const calculateCompoundGrowthRate = (values) => {
      if (!values || values.length < 2) {
        return null;
      }
      
      // Filter out non-positive values
      const filteredValues = values.filter(v => v > 0);
      
      if (filteredValues.length < 2) {
        return null;
      }
      
      const mostRecent = filteredValues[0];
      const oldest = filteredValues[filteredValues.length - 1];
      const years = filteredValues.length - 1;
      
      // CAGR = (EndValue / StartValue)^(1/Years) - 1
      const cagr = Math.pow(mostRecent / oldest, 1 / years) - 1;
      
      return cagr;
    };
    
    /**
     * Calculate stability of earnings and cash flows
     * Returns a score from 0 to 1, with 1 being most stable
     */
    export const calculateFinancialStability = (financialData) => {
      const {
        incomeStatements,
        cashFlows
      } = financialData;
      
      if (!incomeStatements || !cashFlows || incomeStatements.length < 5 || cashFlows.length < 5) {
        return null;
      }
      
      // Get earnings and cash flows for the last 5 years (or what's available)
      const earnings = incomeStatements.slice(0, 5).map(stmt => stmt.netIncome);
      const operatingCashFlows = cashFlows.slice(0, 5).map(stmt => stmt.operatingCashFlow);
      
      // Calculate coefficient of variation (standard deviation / mean)
      // Lower CV = more stable
      const earningsCV = calculateCoefficientOfVariation(earnings);
      const cashFlowCV = calculateCoefficientOfVariation(operatingCashFlows);
      
      // Count years with positive earnings and cash flows
      const positiveEarningsCount = earnings.filter(e => e > 0).length;
      const positiveCashFlowCount = operatingCashFlows.filter(cf => cf > 0).length;
      
      // Earnings stability (0-1)
      const earningsStability = positiveEarningsCount / earnings.length * (1 - Math.min(earningsCV, 1));
      
      // Cash flow stability (0-1)
      const cashFlowStability = positiveCashFlowCount / operatingCashFlows.length * (1 - Math.min(cashFlowCV, 1));
      
      // Overall financial stability is the average of the two
      const overallStability = (earningsStability + cashFlowStability) / 2;
      
      return {
        earningsStability,
        cashFlowStability,
        overallStability
      };
    };
    
    /**
     * Calculate coefficient of variation (standard deviation / mean)
     */
    const calculateCoefficientOfVariation = (values) => {
      if (!values || values.length < 2) {
        return null;
      }
      
      // Calculate mean
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      
      if (mean === 0) {
        return null;
      }
      
      // Calculate sum of squared differences from mean
      const sumSquaredDiff = values.reduce((sum, value) => {
        const diff = value - mean;
        return sum + (diff * diff);
      }, 0);
      
      // Calculate standard deviation
      const standardDeviation = Math.sqrt(sumSquaredDiff / values.length);
      
      // Calculate coefficient of variation
      return standardDeviation / Math.abs(mean);
    };
    
    export default {
      processFinancialData,
      extractTTMData,
      calculatePerShareMetrics,
      calculateHistoricalGrowth,
      calculateFinancialStability
    };
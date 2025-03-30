import apiConfig from '../../api/apiConfig';
import { getBatchQuotes } from '../../api/fmpService';
import calculationService from './calculationService';
import dataProcessingService from './dataProcessingService';
import { getCompanyFinancials } from '../../api/fmpService';

/**
 * Quality stock screener based on Buffett principles
 */

// List of high-quality companies to focus on first
// This includes companies known for strong moats, stable earnings, and good returns on capital
const QUALITY_STOCK_UNIVERSE = [
  // Consumer defensive
  'KO', 'PG', 'JNJ', 'PEP', 'CLX', 'CL', 'CHD', 'MKC', 'GIS', 'K', 'SJM', 'HRL',
  
  // Healthcare
  'ABT', 'MDT', 'SYK', 'BDX', 'EW', 'ISRG', 'ZBH', 'BAX', 'RMD', 'XRAY', 'HSIC',
  
  // Industrial
  'MMM', 'HON', 'ITW', 'EMR', 'GWW', 'ROK', 'AME', 'ROP', 'FAST', 'SWK', 'PH',
  
  // Financial
  'BRK.B', 'JPM', 'BAC', 'AXP', 'V', 'MA', 'SPGI', 'MCO', 'BLK', 'CME', 'ICE',
  
  // Technology (more stable)
  'MSFT', 'AAPL', 'GOOG', 'ADBE', 'ORCL', 'ACN', 'IBM', 'CSCO', 'INTU', 'ADP', 'PAYX',
  
  // Consumer cyclical with strong brands
  'NKE', 'SBUX', 'MCD', 'YUM', 'DIS', 'HD', 'LOW', 'TJX', 'COST', 'WMT', 'TGT',
  
  // Utilities with good management
  'NEE', 'D', 'SO', 'DUK', 'WEC', 'XEL', 'ES', 'AEE', 'CMS', 'ETR'
];

/**
 * Screen for quality stocks at reasonable prices
 */
export const screenQualityStocks = async () => {
  try {
    // Get batch quotes for quality stocks
    const quotes = await getBatchQuotes(QUALITY_STOCK_UNIVERSE);
    
    if (!quotes || quotes.length === 0) {
      return [];
    }
    
    // Filter out stocks with no price data
    const validQuotes = quotes.filter(quote => quote.price && quote.price > 0);
    
    // Start with simple valuation metrics (P/E ratio)
    const reasonablyPricedStocks = validQuotes.filter(quote => {
      // Filter for stocks with P/E below 25 (initial rough filter)
      const pe = quote.pe || 9999;
      return pe > 0 && pe < 25;
    });
    
    console.log(`Found ${reasonablyPricedStocks.length} stocks with reasonable P/E ratios`);
    
    // Limit to 5 stocks for detailed analysis to prevent API rate limit issues
    const stocksForDetailedAnalysis = reasonablyPricedStocks.slice(0, 5);
    
    // Perform detailed analysis on each stock
    const analysisPromises = stocksForDetailedAnalysis.map(async (quote) => {
      try {
        // Get detailed financial data
        const financialData = await getCompanyFinancials(quote.symbol);
        
        // Process the data for consistent format
        const processedData = dataProcessingService.processFinancialData(financialData);
        
        // Perform full valuation
        const valuation = calculationService.performValuation(processedData);
        
        // Add timestamp for analysis
        valuation.analysisTimestamp = new Date().toISOString();
        
        return valuation;
      } catch (error) {
        console.error(`Error analyzing ${quote.symbol}:`, error);
        return null;
      }
    });
    
    // Wait for all analyses to complete
    const analysisResults = await Promise.all(analysisPromises);
    
    // Filter out failed analyses
    const validResults = analysisResults.filter(result => result !== null);
    
    // Sort by upside potential
    const sortedResults = validResults.sort((a, b) => {
      const aUpside = parseFloat(a.upsidePercent);
      const bUpside = parseFloat(b.upsidePercent);
      return bUpside - aUpside;
    });
    
    return sortedResults;
  } catch (error) {
    console.error('Error in stock screening:', error);
    return [];
  }
};

/**
 * Perform a more comprehensive market scan
 * Use with caution due to API limits
 */
export const fullMarketScan = async (sectors = [], maxStocks = 10) => {
  // This would typically involve:
  // 1. Getting a list of all stocks in specified sectors
  // 2. Filtering by basic criteria (market cap, volume, etc.)
  // 3. Performing detailed analysis on promising candidates
  
  // This is a placeholder for a more comprehensive implementation
  console.log('Full market scan not implemented due to API rate limiting considerations');
  
  // Fall back to quality stock screening
  return await screenQualityStocks();
};

/**
 * Check if a stock is currently a good value buy
 */
export const isStockGoodValue = async (symbol) => {
  try {
    // Get detailed financial data
    const financialData = await getCompanyFinancials(symbol);
    
    // Process the data for consistent format
    const processedData = dataProcessingService.processFinancialData(financialData);
    
    // Perform full valuation
    const valuation = calculationService.performValuation(processedData);
    
    // Check if stock is trading below buy price
    return {
      isGoodValue: valuation.valuationStatus === 'BUY',
      valuation
    };
  } catch (error) {
    console.error(`Error evaluating ${symbol}:`, error);
    return {
      isGoodValue: false,
      error: error.message
    };
  }
};

const stockScreenerService = {
  screenQualityStocks,
  fullMarketScan,
  isStockGoodValue
};

export default stockScreenerService;
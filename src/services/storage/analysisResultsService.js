/**
 * Service for managing stock analysis results in local storage
 */
import localStorageService from './localStorageService';

const ANALYSIS_RESULTS_KEY = 'analysis_results';
const RECENT_ANALYSIS_KEY = 'recent_analysis';
const MAX_RECENT_ANALYSES = 10;

/**
 * Saves analysis results for a specific stock
 * @param {string} symbol - Stock symbol
 * @param {Object} results - Analysis results object
 * @returns {boolean} - Whether the operation was successful
 */
const saveAnalysisResults = (symbol, results) => {
  try {
    // Get existing results or initialize empty object
    const allResults = localStorageService.getItem(ANALYSIS_RESULTS_KEY, {});
    
    // Add timestamp to results
    const resultsWithTimestamp = {
      ...results,
      timestamp: new Date().toISOString(),
      symbol
    };
    
    // Update results for this symbol
    allResults[symbol] = resultsWithTimestamp;
    
    // Save back to storage
    const success = localStorageService.setItem(ANALYSIS_RESULTS_KEY, allResults);
    
    // If successful, update recent analyses list
    if (success) {
      updateRecentAnalyses(symbol);
    }
    
    return success;
  } catch (error) {
    console.error(`Error saving analysis results for ${symbol}:`, error);
    return false;
  }
};

/**
 * Gets analysis results for a specific stock
 * @param {string} symbol - Stock symbol
 * @returns {Object|null} - Analysis results or null if not found
 */
const getAnalysisResults = (symbol) => {
  try {
    const allResults = localStorageService.getItem(ANALYSIS_RESULTS_KEY, {});
    return allResults[symbol] || null;
  } catch (error) {
    console.error(`Error getting analysis results for ${symbol}:`, error);
    return null;
  }
};

/**
 * Gets all stored analysis results
 * @returns {Object} - Object with symbol keys and result values
 */
const getAllAnalysisResults = () => {
  return localStorageService.getItem(ANALYSIS_RESULTS_KEY, {});
};

/**
 * Removes analysis results for a specific stock
 * @param {string} symbol - Stock symbol
 * @returns {boolean} - Whether the operation was successful
 */
const removeAnalysisResults = (symbol) => {
  try {
    const allResults = localStorageService.getItem(ANALYSIS_RESULTS_KEY, {});
    
    if (allResults[symbol]) {
      delete allResults[symbol];
      
      // Remove from recent analyses as well
      removeFromRecentAnalyses(symbol);
      
      return localStorageService.setItem(ANALYSIS_RESULTS_KEY, allResults);
    }
    
    return true; // Symbol wasn't there, so technically successful
  } catch (error) {
    console.error(`Error removing analysis results for ${symbol}:`, error);
    return false;
  }
};

/**
 * Clears all stored analysis results
 * @returns {boolean} - Whether the operation was successful
 */
const clearAllAnalysisResults = () => {
  try {
    const success = localStorageService.setItem(ANALYSIS_RESULTS_KEY, {});
    
    // Clear recent analyses as well
    if (success) {
      localStorageService.setItem(RECENT_ANALYSIS_KEY, []);
    }
    
    return success;
  } catch (error) {
    console.error('Error clearing all analysis results:', error);
    return false;
  }
};

/**
 * Updates the list of recent analyses
 * @param {string} symbol - Stock symbol to add to recent list
 * @private
 */
const updateRecentAnalyses = (symbol) => {
  try {
    const recentAnalyses = localStorageService.getItem(RECENT_ANALYSIS_KEY, []);
    
    // Remove the symbol if it's already in the list (to reorder)
    const filteredList = recentAnalyses.filter(item => item !== symbol);
    
    // Add the symbol to the beginning of the list
    filteredList.unshift(symbol);
    
    // Keep only the most recent analyses
    const trimmedList = filteredList.slice(0, MAX_RECENT_ANALYSES);
    
    localStorageService.setItem(RECENT_ANALYSIS_KEY, trimmedList);
  } catch (error) {
    console.error(`Error updating recent analyses for ${symbol}:`, error);
  }
};

/**
 * Removes a symbol from the recent analyses list
 * @param {string} symbol - Stock symbol to remove
 * @private
 */
const removeFromRecentAnalyses = (symbol) => {
  try {
    const recentAnalyses = localStorageService.getItem(RECENT_ANALYSIS_KEY, []);
    const filteredList = recentAnalyses.filter(item => item !== symbol);
    
    localStorageService.setItem(RECENT_ANALYSIS_KEY, filteredList);
  } catch (error) {
    console.error(`Error removing ${symbol} from recent analyses:`, error);
  }
};

/**
 * Gets the list of recently analyzed stocks
 * @returns {string[]} - Array of stock symbols, most recent first
 */
const getRecentAnalyses = () => {
  return localStorageService.getItem(RECENT_ANALYSIS_KEY, []);
};

/**
 * Checks if analysis results exist for a given symbol
 * @param {string} symbol - Stock symbol
 * @returns {boolean} - Whether analysis results exist
 */
const hasAnalysisResults = (symbol) => {
  const allResults = localStorageService.getItem(ANALYSIS_RESULTS_KEY, {});
  return !!allResults[symbol];
};

/**
 * Gets the age of analysis results for a given symbol in milliseconds
 * @param {string} symbol - Stock symbol
 * @returns {number|null} - Age in milliseconds or null if no results
 */
const getAnalysisAge = (symbol) => {
  const results = getAnalysisResults(symbol);
  
  if (!results || !results.timestamp) {
    return null;
  }
  
  const timestamp = new Date(results.timestamp).getTime();
  const now = new Date().getTime();
  
  return now - timestamp;
};

const analysisResultsService = {
  saveAnalysisResults,
  getAnalysisResults,
  getAllAnalysisResults,
  removeAnalysisResults,
  clearAllAnalysisResults,
  getRecentAnalyses,
  hasAnalysisResults,
  getAnalysisAge
};

export default analysisResultsService;
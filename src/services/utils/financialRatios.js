/**
 * Utility functions for calculating common financial ratios
 */

/**
 * Calculates Price-to-Earnings Ratio (P/E)
 * @param {number} price - Current stock price
 * @param {number} earningsPerShare - Earnings per share
 * @returns {number|null} - P/E ratio or null if invalid
 */
export const calculatePriceToEarnings = (price, earningsPerShare) => {
  if (!price || !earningsPerShare || earningsPerShare <= 0) {
    return null;
  }
  
  return price / earningsPerShare;
};

/**
 * Calculates Price-to-Book Ratio (P/B)
 * @param {number} price - Current stock price
 * @param {number} bookValuePerShare - Book value per share
 * @returns {number|null} - P/B ratio or null if invalid
 */
export const calculatePriceToBook = (price, bookValuePerShare) => {
  if (!price || !bookValuePerShare || bookValuePerShare <= 0) {
    return null;
  }
  
  return price / bookValuePerShare;
};

/**
 * Calculates Price-to-Sales Ratio (P/S)
 * @param {number} price - Current stock price
 * @param {number} salesPerShare - Sales per share
 * @returns {number|null} - P/S ratio or null if invalid
 */
export const calculatePriceToSales = (price, salesPerShare) => {
  if (!price || !salesPerShare || salesPerShare <= 0) {
    return null;
  }
  
  return price / salesPerShare;
};

/**
 * Calculates Earnings Yield (E/P) - inverse of P/E
 * @param {number} earningsPerShare - Earnings per share
 * @param {number} price - Current stock price
 * @returns {number|null} - Earnings yield or null if invalid
 */
export const calculateEarningsYield = (earningsPerShare, price) => {
  if (!price || !earningsPerShare || price <= 0) {
    return null;
  }
  
  return earningsPerShare / price;
};

/**
 * Calculates Dividend Yield
 * @param {number} annualDividend - Annual dividend per share
 * @param {number} price - Current stock price
 * @returns {number|null} - Dividend yield or null if invalid
 */
export const calculateDividendYield = (annualDividend, price) => {
  if (!price || !annualDividend || price <= 0) {
    return null;
  }
  
  return annualDividend / price;
};

/**
 * Calculates Return on Equity (ROE)
 * @param {number} netIncome - Net income
 * @param {number} shareholderEquity - Shareholder equity
 * @returns {number|null} - ROE or null if invalid
 */
export const calculateReturnOnEquity = (netIncome, shareholderEquity) => {
  if (!netIncome || !shareholderEquity || shareholderEquity <= 0) {
    return null;
  }
  
  return netIncome / shareholderEquity;
};

/**
 * Calculates Return on Assets (ROA)
 * @param {number} netIncome - Net income
 * @param {number} totalAssets - Total assets
 * @returns {number|null} - ROA or null if invalid
 */
export const calculateReturnOnAssets = (netIncome, totalAssets) => {
  if (!netIncome || !totalAssets || totalAssets <= 0) {
    return null;
  }
  
  return netIncome / totalAssets;
};

/**
 * Calculates Debt-to-Equity Ratio
 * @param {number} totalDebt - Total debt
 * @param {number} shareholderEquity - Shareholder equity
 * @returns {number|null} - Debt-to-equity ratio or null if invalid
 */
export const calculateDebtToEquity = (totalDebt, shareholderEquity) => {
  if (!totalDebt || !shareholderEquity || shareholderEquity <= 0) {
    return null;
  }
  
  return totalDebt / shareholderEquity;
};

/**
 * Calculates Current Ratio
 * @param {number} currentAssets - Current assets
 * @param {number} currentLiabilities - Current liabilities
 * @returns {number|null} - Current ratio or null if invalid
 */
export const calculateCurrentRatio = (currentAssets, currentLiabilities) => {
  if (!currentAssets || !currentLiabilities || currentLiabilities <= 0) {
    return null;
  }
  
  return currentAssets / currentLiabilities;
};

/**
 * Calculates Quick Ratio (Acid-Test Ratio)
 * @param {number} currentAssets - Current assets
 * @param {number} inventory - Inventory
 * @param {number} currentLiabilities - Current liabilities
 * @returns {number|null} - Quick ratio or null if invalid
 */
export const calculateQuickRatio = (currentAssets, inventory, currentLiabilities) => {
  if (!currentAssets || !inventory || !currentLiabilities || currentLiabilities <= 0) {
    return null;
  }
  
  return (currentAssets - inventory) / currentLiabilities;
};

/**
 * Calculates Gross Profit Margin
 * @param {number} grossProfit - Gross profit
 * @param {number} revenue - Revenue
 * @returns {number|null} - Gross profit margin or null if invalid
 */
export const calculateGrossProfitMargin = (grossProfit, revenue) => {
  if (!grossProfit || !revenue || revenue <= 0) {
    return null;
  }
  
  return grossProfit / revenue;
};

/**
 * Calculates Net Profit Margin
 * @param {number} netIncome - Net income
 * @param {number} revenue - Revenue
 * @returns {number|null} - Net profit margin or null if invalid
 */
export const calculateNetProfitMargin = (netIncome, revenue) => {
  if (!netIncome || !revenue || revenue <= 0) {
    return null;
  }
  
  return netIncome / revenue;
};

/**
 * Calculates Operating Margin
 * @param {number} operatingIncome - Operating income
 * @param {number} revenue - Revenue
 * @returns {number|null} - Operating margin or null if invalid
 */
export const calculateOperatingMargin = (operatingIncome, revenue) => {
  if (!operatingIncome || !revenue || revenue <= 0) {
    return null;
  }
  
  return operatingIncome / revenue;
};

/**
 * Calculates Payout Ratio
 * @param {number} dividendsPerShare - Dividends per share
 * @param {number} earningsPerShare - Earnings per share
 * @returns {number|null} - Payout ratio or null if invalid
 */
export const calculatePayoutRatio = (dividendsPerShare, earningsPerShare) => {
  if (!dividendsPerShare || !earningsPerShare || earningsPerShare <= 0) {
    return null;
  }
  
  return dividendsPerShare / earningsPerShare;
};

/**
 * Calculates Enterprise Value (EV)
 * @param {number} marketCap - Market capitalization
 * @param {number} totalDebt - Total debt
 * @param {number} cash - Cash and cash equivalents
 * @returns {number|null} - Enterprise value or null if invalid
 */
export const calculateEnterpriseValue = (marketCap, totalDebt, cash) => {
  if (!marketCap || !totalDebt || !cash) {
    return null;
  }
  
  return marketCap + totalDebt - cash;
};

/**
 * Calculates EV-to-EBITDA Ratio
 * @param {number} enterpriseValue - Enterprise value
 * @param {number} ebitda - EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization)
 * @returns {number|null} - EV/EBITDA ratio or null if invalid
 */
export const calculateEVToEBITDA = (enterpriseValue, ebitda) => {
  if (!enterpriseValue || !ebitda || ebitda <= 0) {
    return null;
  }
  
  return enterpriseValue / ebitda;
};

/**
 * Calculates Price-to-Free-Cash-Flow Ratio (P/FCF)
 * @param {number} price - Current stock price
 * @param {number} freeCashFlowPerShare - Free cash flow per share
 * @returns {number|null} - P/FCF ratio or null if invalid
 */
export const calculatePriceToFreeCashFlow = (price, freeCashFlowPerShare) => {
  if (!price || !freeCashFlowPerShare || freeCashFlowPerShare <= 0) {
    return null;
  }
  
  return price / freeCashFlowPerShare;
};

/**
 * Calculates PEG Ratio (Price/Earnings to Growth)
 * @param {number} priceToEarnings - P/E ratio
 * @param {number} earningsGrowth - Expected earnings growth rate (as decimal)
 * @returns {number|null} - PEG ratio or null if invalid
 */
export const calculatePEGRatio = (priceToEarnings, earningsGrowth) => {
  if (!priceToEarnings || !earningsGrowth || earningsGrowth <= 0) {
    return null;
  }
  
  return priceToEarnings / (earningsGrowth * 100); // Convert growth to percentage
};

// Export all ratio calculators as a single object
const financialRatios = {
  calculatePriceToEarnings,
  calculatePriceToBook,
  calculatePriceToSales,
  calculateEarningsYield,
  calculateDividendYield,
  calculateReturnOnEquity,
  calculateReturnOnAssets,
  calculateDebtToEquity,
  calculateCurrentRatio,
  calculateQuickRatio,
  calculateGrossProfitMargin,
  calculateNetProfitMargin,
  calculateOperatingMargin,
  calculatePayoutRatio,
  calculateEnterpriseValue,
  calculateEVToEBITDA,
  calculatePriceToFreeCashFlow,
  calculatePEGRatio
};

export default financialRatios;
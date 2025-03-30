/**
 * Utility functions for formatting data
 */

/**
 * Formats a number as currency (USD)
 * @param {number} value - Number to format
 * @param {boolean} showCents - Whether to show cents
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, showCents = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  
  const options = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0
  };
  
  return new Intl.NumberFormat('en-US', options).format(value);
};

/**
 * Formats a number as percentage
 * @param {number} value - Number to format (e.g., 0.15 for 15%)
 * @param {number} digits - Number of decimal places
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value, digits = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  
  const options = {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  };
  
  return new Intl.NumberFormat('en-US', options).format(value);
};

/**
 * Formats a number with commas for thousands
 * @param {number} value - Number to format
 * @param {number} digits - Number of decimal places
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value, digits = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  
  const options = {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  };
  
  return new Intl.NumberFormat('en-US', options).format(value);
};

/**
 * Formats a date string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format style ('short', 'medium', 'long', 'full')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) {
    return '-';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  const options = { dateStyle: format };
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Formats a large number in a human-readable way (e.g., 1.2M, 5.3B)
 * @param {number} value - Number to format
 * @param {number} digits - Number of decimal places
 * @returns {string} - Formatted number string
 */
export const formatLargeNumber = (value, digits = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1e12) {
    return (value / 1e12).toFixed(digits) + 'T';
  }
  
  if (absValue >= 1e9) {
    return (value / 1e9).toFixed(digits) + 'B';
  }
  
  if (absValue >= 1e6) {
    return (value / 1e6).toFixed(digits) + 'M';
  }
  
  if (absValue >= 1e3) {
    return (value / 1e3).toFixed(digits) + 'K';
  }
  
  return value.toFixed(digits);
};

/**
 * Formats a duration in milliseconds to a human-readable format
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} - Formatted duration string
 */
export const formatDuration = (milliseconds) => {
  if (milliseconds === null || milliseconds === undefined || isNaN(milliseconds)) {
    return '-';
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  return `${seconds}s`;
};

/**
 * Abbreviates a stock name to fit in smaller spaces
 * @param {string} name - Full company name
 * @param {number} maxLength - Maximum length
 * @returns {string} - Abbreviated name
 */
export const abbreviateCompanyName = (name, maxLength = 20) => {
  if (!name) {
    return '';
  }
  
  if (name.length <= maxLength) {
    return name;
  }
  
  // Common company terms to abbreviate
  const replacements = [
    { search: ' Corporation', replace: ' Corp.' },
    { search: ' Incorporated', replace: ' Inc.' },
    { search: ' Limited', replace: ' Ltd.' },
    { search: ' Company', replace: ' Co.' },
    { search: ' Holdings', replace: ' Hldgs.' },
    { search: ' International', replace: ' Intl.' },
    { search: ' Technologies', replace: ' Tech.' },
    { search: ' Technology', replace: ' Tech.' },
    { search: ' Industries', replace: ' Ind.' },
    { search: ' Solutions', replace: ' Sol.' },
    { search: ' Systems', replace: ' Sys.' },
    { search: ' Communications', replace: ' Comm.' },
    { search: ' Pharmaceuticals', replace: ' Pharma.' },
    { search: ' Group', replace: ' Grp.' }
  ];
  
  let abbreviated = name;
  
  // Apply replacements
  for (const { search, replace } of replacements) {
    abbreviated = abbreviated.replace(search, replace);
  }
  
  // If still too long, truncate with ellipsis
  if (abbreviated.length > maxLength) {
    return abbreviated.substring(0, maxLength - 3) + '...';
  }
  
  return abbreviated;
};

/**
 * Colors a number green if positive, red if negative
 * @param {number} value - Number to format and color
 * @param {Function} formatter - Formatting function to use
 * @returns {Object} - Object with 'value' and 'color' properties
 */
export const colorizeNumber = (value, formatter = formatNumber) => {
  if (value === null || value === undefined || isNaN(value)) {
    return { value: '-', color: 'text-gray-500' };
  }
  
  if (value > 0) {
    return { value: formatter(value), color: 'text-green-600' };
  }
  
  if (value < 0) {
    return { value: formatter(value), color: 'text-red-600' };
  }
  
  return { value: formatter(value), color: 'text-gray-600' };
};

/**
 * Gets a color class based on how far a value is from a target
 * @param {number} value - Current value
 * @param {number} target - Target value
 * @param {boolean} higherIsBetter - Whether higher values are better
 * @returns {string} - Tailwind color class
 */
export const getComparisonColor = (value, target, higherIsBetter = true) => {
  if (value === null || value === undefined || isNaN(value) || 
      target === null || target === undefined || isNaN(target)) {
    return 'text-gray-500';
  }
  
  const ratio = value / target;
  
  if (higherIsBetter) {
    if (ratio >= 1.2) return 'text-green-700';
    if (ratio >= 1.0) return 'text-green-500';
    if (ratio >= 0.8) return 'text-yellow-500';
    return 'text-red-500';
  } else {
    if (ratio <= 0.8) return 'text-green-700';
    if (ratio <= 1.0) return 'text-green-500';
    if (ratio <= 1.2) return 'text-yellow-500';
    return 'text-red-500';
  }
};

// Export all formatters as a single object
const formatters = {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatDate,
  formatLargeNumber,
  formatDuration,
  abbreviateCompanyName,
  colorizeNumber,
  getComparisonColor
};

export default formatters;
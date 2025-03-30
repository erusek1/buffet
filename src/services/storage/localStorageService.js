/**
 * A service for managing browser's local storage
 * with convenience methods for storing and retrieving data
 */

const PREFIX = 'buffett_value_';

/**
 * Stores a value in local storage with the given key
 * @param {string} key - The key to store the value under
 * @param {any} value - The value to store (will be JSON.stringified)
 * @returns {boolean} - Whether the operation was successful
 */
const setItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(`${PREFIX}${key}`, serializedValue);
    return true;
  } catch (error) {
    console.error(`Error storing ${key} in local storage:`, error);
    return false;
  }
};

/**
 * Retrieves a value from local storage by key
 * @param {string} key - The key to retrieve
 * @param {any} defaultValue - The default value to return if key doesn't exist
 * @returns {any} - The parsed value or defaultValue if not found
 */
const getItem = (key, defaultValue = null) => {
  try {
    const serializedValue = localStorage.getItem(`${PREFIX}${key}`);
    if (serializedValue === null) {
      return defaultValue;
    }
    return JSON.parse(serializedValue);
  } catch (error) {
    console.error(`Error retrieving ${key} from local storage:`, error);
    return defaultValue;
  }
};

/**
 * Removes an item from local storage by key
 * @param {string} key - The key to remove
 * @returns {boolean} - Whether the operation was successful
 */
const removeItem = (key) => {
  try {
    localStorage.removeItem(`${PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from local storage:`, error);
    return false;
  }
};

/**
 * Clears all items from local storage that start with the defined prefix
 * @returns {boolean} - Whether the operation was successful
 */
const clearAll = () => {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(PREFIX))
      .forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Error clearing local storage:', error);
    return false;
  }
};

/**
 * Gets all keys in local storage that start with the defined prefix
 * @returns {string[]} - Array of keys (without the prefix)
 */
const getAllKeys = () => {
  try {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(PREFIX))
      .map(key => key.slice(PREFIX.length));
  } catch (error) {
    console.error('Error getting all keys from local storage:', error);
    return [];
  }
};

/**
 * Gets all items in local storage that start with the defined prefix
 * @returns {Object} - Object with key-value pairs
 */
const getAllItems = () => {
  try {
    const allItems = {};
    getAllKeys().forEach(key => {
      allItems[key] = getItem(key);
    });
    return allItems;
  } catch (error) {
    console.error('Error getting all items from local storage:', error);
    return {};
  }
};

/**
 * Checks if an item exists in local storage
 * @param {string} key - The key to check
 * @returns {boolean} - Whether the item exists
 */
const hasItem = (key) => {
  return localStorage.getItem(`${PREFIX}${key}`) !== null;
};

/**
 * Gets the total size of all items in local storage with our prefix
 * @returns {number} - Size in bytes
 */
const getStorageSize = () => {
  try {
    let totalSize = 0;
    getAllKeys().forEach(key => {
      const item = localStorage.getItem(`${PREFIX}${key}`);
      if (item) {
        totalSize += item.length * 2; // UTF-16 uses 2 bytes per character
      }
    });
    return totalSize;
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
};

const localStorageService = {
  setItem,
  getItem,
  removeItem,
  clearAll,
  getAllKeys,
  getAllItems,
  hasItem,
  getStorageSize
};

export default localStorageService;
/**
 * Service for managing the watchlist
 */

const WATCHLIST_KEY = 'buffett_value_watchlist';

/**
 * Get the current watchlist from localStorage
 */
const getWatchlist = () => {
  try {
    const watchlistJSON = localStorage.getItem(WATCHLIST_KEY);
    if (!watchlistJSON) {
      return [];
    }
    
    return JSON.parse(watchlistJSON);
  } catch (error) {
    console.error('Error retrieving watchlist:', error);
    return [];
  }
};

/**
 * Save watchlist to localStorage
 */
const saveWatchlist = (watchlist) => {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    return true;
  } catch (error) {
    console.error('Error saving watchlist:', error);
    return false;
  }
};

/**
 * Add a stock to the watchlist
 */
const addToWatchlist = (stock) => {
  try {
    const watchlist = getWatchlist();
    
    // Check if stock already exists in watchlist
    const exists = watchlist.some(item => item.ticker === stock.ticker);
    
    if (!exists) {
      // Add timestamp and other metadata
      const stockWithMeta = {
        ...stock,
        addedAt: new Date().toISOString(),
        notes: ''
      };
      
      // Add to watchlist
      const updatedWatchlist = [...watchlist, stockWithMeta];
      saveWatchlist(updatedWatchlist);
      
      return {
        success: true,
        message: `${stock.ticker} added to watchlist`
      };
    } else {
      return {
        success: false,
        message: `${stock.ticker} is already in your watchlist`
      };
    }
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
};

/**
 * Remove a stock from the watchlist
 */
const removeFromWatchlist = (ticker) => {
  try {
    const watchlist = getWatchlist();
    const updatedWatchlist = watchlist.filter(stock => stock.ticker !== ticker);
    
    saveWatchlist(updatedWatchlist);
    
    return {
      success: true,
      message: `${ticker} removed from watchlist`
    };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
};

/**
 * Update stock notes in watchlist
 */
const updateStockNotes = (ticker, notes) => {
  try {
    const watchlist = getWatchlist();
    
    const updatedWatchlist = watchlist.map(stock => {
      if (stock.ticker === ticker) {
        return {
          ...stock,
          notes,
          updatedAt: new Date().toISOString()
        };
      }
      return stock;
    });
    
    saveWatchlist(updatedWatchlist);
    
    return {
      success: true,
      message: `Notes updated for ${ticker}`
    };
  } catch (error) {
    console.error('Error updating stock notes:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
};

/**
 * Update price alert for a stock
 */
const setPriceAlert = (ticker, alertPrice) => {
  try {
    const watchlist = getWatchlist();
    
    const updatedWatchlist = watchlist.map(stock => {
      if (stock.ticker === ticker) {
        return {
          ...stock,
          alertPrice,
          updatedAt: new Date().toISOString()
        };
      }
      return stock;
    });
    
    saveWatchlist(updatedWatchlist);
    
    return {
      success: true,
      message: `Price alert set for ${ticker} at $${alertPrice}`
    };
  } catch (error) {
    console.error('Error setting price alert:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
};

const watchlistServiceObject = {
  getWatchlist,
  saveWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateStockNotes,
  setPriceAlert
};

export default watchlistServiceObject;
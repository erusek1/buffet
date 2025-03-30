// src/components/Watchlist/WatchlistManager.jsx
import React, { useState, useEffect } from 'react';
import watchlistService from '../../services/storage/watchlistService';
import { getStockQuote } from '../../api/fmpService';

const WatchlistManager = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPrices, setCurrentPrices] = useState({});
  const [editNotes, setEditNotes] = useState({});
  const [alertInputs, setAlertInputs] = useState({});
  
  // Define loadWatchlist before useEffect
  const loadWatchlist = async () => {
    try {
      const list = watchlistService.getWatchlist();
      setWatchlist(list);
      
      // Initialize notes editing and alert inputs
      const notesObj = {};
      const alertsObj = {};
      
      list.forEach(stock => {
        notesObj[stock.ticker] = stock.notes || '';
        alertsObj[stock.ticker] = stock.alertPrice || '';
      });
      
      setEditNotes(notesObj);
      setAlertInputs(alertsObj);
      
      // Fetch current prices if there are stocks in the watchlist
      if (list.length > 0) {
        await refreshPrices(list);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadWatchlist();
  }, []);  // Empty dependency array is fine here as loadWatchlist is defined outside
  
  const refreshPrices = async (stocks = watchlist) => {
    if (stocks.length === 0) return;
    
    setLoading(true);
    
    try {
      const tickers = stocks.map(stock => stock.ticker);
      const quotes = await getStockQuote(tickers.join(','));
      
      const priceMap = {};
      
      quotes.forEach(quote => {
        priceMap[quote.symbol] = quote.price;
      });
      
      setCurrentPrices(priceMap);
      
      // Check for price alerts
      stocks.forEach(stock => {
        if (stock.alertPrice && priceMap[stock.ticker]) {
          const currentPrice = priceMap[stock.ticker];
          const alertPrice = parseFloat(stock.alertPrice);
          
          // Check if price is at or below alert price
          if (stock.alertPrice > 0 && currentPrice <= alertPrice) {
            // In a real app, we would trigger a notification here
            console.log(`Alert: ${stock.ticker} is now at or below $${alertPrice}`);
          }
        }
      });
    } catch (error) {
      console.error('Error refreshing prices:', error);
      setError('Failed to refresh prices');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveStock = (ticker) => {
    const result = watchlistService.removeFromWatchlist(ticker);
    
    if (result.success) {
      // Update local state
      setWatchlist(watchlist.filter(stock => stock.ticker !== ticker));
    } else {
      setError(result.message);
    }
  };
  
  const handleSaveNotes = (ticker) => {
    const notes = editNotes[ticker];
    const result = watchlistService.updateStockNotes(ticker, notes);
    
    if (result.success) {
      // Update local state
      setWatchlist(watchlist.map(stock => {
        if (stock.ticker === ticker) {
          return {
            ...stock,
            notes
          };
        }
        return stock;
      }));
    } else {
      setError(result.message);
    }
  };
  
  const handleSetAlert = (ticker) => {
    const alertPrice = parseFloat(alertInputs[ticker]);
    
    if (isNaN(alertPrice) || alertPrice <= 0) {
      setError(`Invalid alert price for ${ticker}`);
      return;
    }
    
    const result = watchlistService.setPriceAlert(ticker, alertPrice);
    
    if (result.success) {
      // Update local state
      setWatchlist(watchlist.map(stock => {
        if (stock.ticker === ticker) {
          return {
            ...stock,
            alertPrice
          };
        }
        return stock;
      }));
    } else {
      setError(result.message);
    }
  };
  
  const getPriceColor = (ticker, buyPrice) => {
    const currentPrice = currentPrices[ticker];
    if (!currentPrice) return '';
    
    return currentPrice <= buyPrice ? 'text-green-600 font-bold' : '';
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Value Investing Watchlist</h1>
        <button
          onClick={() => refreshPrices()}
          disabled={loading || watchlist.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Refreshing...' : 'Refresh Prices'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
          <button 
            className="ml-2 text-red-700 font-bold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {watchlist.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <p className="mb-2">Your watchlist is empty.</p>
          <p className="text-sm text-gray-600">
            Use the Opportunity Finder or Valuation Calculator to add stocks to your watchlist.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {watchlist.map(stock => (
            <div key={stock.ticker} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{stock.ticker} - {stock.name}</h2>
                  <div className="mt-1 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    <p><span className="font-semibold">Buy Below:</span> ${stock.buyPrice}</p>
                    <p><span className="font-semibold">Intrinsic Value:</span> ${stock.intrinsicValuePerShare}</p>
                    <p><span className="font-semibold">Quality:</span> <span className="capitalize">{stock.businessQuality}</span></p>
                    <p><span className="font-semibold">Added:</span> {new Date(stock.addedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm">Current Price:</p>
                  <p className={`text-2xl ${getPriceColor(stock.ticker, stock.buyPrice)}`}>
                    ${currentPrices[stock.ticker] ? currentPrices[stock.ticker].toFixed(2) : '--'}
                  </p>
                  <button
                    onClick={() => handleRemoveStock(stock.ticker)}
                    className="mt-2 px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Your Notes</h3>
                  <div className="flex">
                    <textarea
                      value={editNotes[stock.ticker] || ''}
                      onChange={(e) => setEditNotes({...editNotes, [stock.ticker]: e.target.value})}
                      className="w-full p-2 border rounded"
                      rows="3"
                    ></textarea>
                    <button
                      onClick={() => handleSaveNotes(stock.ticker)}
                      className="ml-2 px-3 whitespace-nowrap text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Price Alert</h3>
                  <div className="flex items-center">
                    <span className="mr-2">$</span>
                    <input
                      type="number"
                      value={alertInputs[stock.ticker] || ''}
                      onChange={(e) => setAlertInputs({...alertInputs, [stock.ticker]: e.target.value})}
                      placeholder="Alert price"
                      className="w-full p-2 border rounded"
                    />
                    <button
                      onClick={() => handleSetAlert(stock.ticker)}
                      className="ml-2 px-3 whitespace-nowrap text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                    >
                      Set Alert
                    </button>
                  </div>
                  {stock.alertPrice && (
                    <p className="mt-1 text-sm text-gray-600">
                      Alert set at: ${stock.alertPrice}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-2">Using Your Watchlist</h3>
        <p className="text-sm text-gray-700">
          Your watchlist helps you monitor potential investment opportunities over time.
          Set price alerts to be notified when a stock reaches your desired buy price.
          Add personal notes about each company to track your investment thesis.
          Remember Warren Buffett's advice: "The stock market is a device for transferring 
          money from the impatient to the patient."
        </p>
      </div>
    </div>
  );
};

export default WatchlistManager;
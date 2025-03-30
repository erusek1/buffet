// src/components/Screener/OpportunityFinder.jsx
import React, { useState } from 'react';
import { screenQualityStocks } from '../../services/analysis/stockScreener';

const OpportunityFinder = () => {
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const findOpportunities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await screenQualityStocks();
      setOpportunities(results);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error finding opportunities:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate color class for valuation status
  const getStatusColorClass = (status) => {
    switch (status) {
      case 'BUY':
        return 'bg-green-100 text-green-800';
      case 'FAIR':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERVALUED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Buffett-Style Opportunity Finder</h1>
        <button
          onClick={findOpportunities}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Searching...' : 'Find Opportunities'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {lastUpdated && (
        <p className="mb-4 text-sm text-gray-600">
          Last updated: {lastUpdated.toLocaleString()}
        </p>
      )}
      
      {opportunities.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-2 px-4 border">Ticker</th>
                <th className="py-2 px-4 border">Company</th>
                <th className="py-2 px-4 border">Price</th>
                <th className="py-2 px-4 border">Intrinsic Value</th>
                <th className="py-2 px-4 border">Buy Price</th>
                <th className="py-2 px-4 border">Upside</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Quality</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map(stock => (
                <tr key={stock.ticker} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border font-bold">{stock.ticker}</td>
                  <td className="py-2 px-4 border">{stock.name}</td>
                  <td className="py-2 px-4 border">${stock.currentPrice.toFixed(2)}</td>
                  <td className="py-2 px-4 border">${stock.intrinsicValuePerShare}</td>
                  <td className="py-2 px-4 border">${stock.buyPrice}</td>
                  <td className="py-2 px-4 border">{stock.upsidePercent}</td>
                  <td className="py-2 px-4 border">
                    <span className={`inline-block px-2 py-1 rounded ${getStatusColorClass(stock.valuationStatus)}`}>
                      {stock.valuationStatus}
                    </span>
                  </td>
                  <td className="py-2 px-4 border">
                    <span className={`capitalize ${
                      stock.businessQuality === 'excellent' ? 'text-green-600' :
                      stock.businessQuality === 'good' ? 'text-blue-600' :
                      stock.businessQuality === 'fair' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {stock.businessQuality}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          {loading ? (
            <p>Searching for value opportunities...</p>
          ) : (
            <div>
              <p className="mb-2">Click "Find Opportunities" to scan for quality stocks at reasonable prices.</p>
              <p className="text-sm text-gray-600">
                "The stock market is a device for transferring money from the impatient to the patient." - Warren Buffett
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-2">About This Tool</h3>
        <p className="text-sm text-gray-700">
          This opportunity finder scans a pre-selected list of quality companies that align with Warren Buffett's investment principles.
          It prioritizes businesses with strong competitive advantages, stable earnings, and healthy returns on capital.
          The analysis uses owner earnings (Buffett's preferred metric) and applies appropriate margins of safety
          based on business quality.
        </p>
      </div>
    </div>
  );
};

export default OpportunityFinder;
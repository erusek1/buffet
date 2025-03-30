import React, { useState, useEffect } from 'react';
import { getMarketScreener, getBatchStockData } from '../../api/fmpService';
import calculationService from '../../services/analysis/calculationService';
import dataProcessingService from '../../services/analysis/dataProcessingService';

const OpportunityScanner = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanCriteria, setScanCriteria] = useState({
    minRoe: 10,
    maxDebtToEquity: 1.0,
    minMarginOfSafety: 15,
    minYearsPositiveEarnings: 5,
    excludeSectors: [],
    marketCapMin: 100000000 // $100M minimum
  });
  
  // Filter options for the scanner
  const sectorOptions = [
    'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 
    'Consumer Defensive', 'Industrials', 'Energy', 'Basic Materials', 
    'Communication Services', 'Utilities', 'Real Estate'
  ];
  
  const handleCriteriaChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle excluded sectors checkboxes
      if (name === 'sector') {
        setScanCriteria(prev => {
          const updatedExcludeSectors = [...prev.excludeSectors];
          if (checked) {
            // Remove from excluded list
            const index = updatedExcludeSectors.indexOf(value);
            if (index > -1) {
              updatedExcludeSectors.splice(index, 1);
            }
          } else {
            // Add to excluded list
            if (!updatedExcludeSectors.includes(value)) {
              updatedExcludeSectors.push(value);
            }
          }
          return {
            ...prev,
            excludeSectors: updatedExcludeSectors
          };
        });
      }
    } else {
      // Handle numeric inputs
      setScanCriteria(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }));
    }
  };
  
  // Main scan function
  const startScan = async () => {
    setLoading(true);
    setError(null);
    setScanProgress(0);
    setScanComplete(false);
    setOpportunities([]);
    
    try {
      // First pass: Get screen of stocks that match basic criteria
      const screenedStocks = await performInitialScreening();
      
      if (screenedStocks.length === 0) {
        setError('No stocks matched the initial screening criteria.');
        setLoading(false);
        return;
      }
      
      // Second pass: Detailed analysis of screened stocks
      const analyzedOpportunities = await performDetailedAnalysis(screenedStocks);
      
      // Sort opportunities by margin of safety (best deals first)
      const sortedOpportunities = analyzedOpportunities.sort((a, b) => 
        b.upsidePercent - a.upsidePercent
      );
      
      setOpportunities(sortedOpportunities);
      setScanComplete(true);
    } catch (error) {
      console.error('Error scanning for opportunities:', error);
      setError(`Error during market scan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // First pass: Screen stocks based on basic criteria
  const performInitialScreening = async () => {
    try {
      // Get stocks that match our basic criteria using FMP screener endpoint
      const screenParams = {
        // Convert criteria to API parameters
        returnOnEquityMoreThan: scanCriteria.minRoe / 100,
        debtToEquityLessThan: scanCriteria.maxDebtToEquity,
        marketCapMoreThan: scanCriteria.marketCapMin
      };
      
      // Add sectors to exclude if any
      if (scanCriteria.excludeSectors.length > 0) {
        screenParams.excludeSector = scanCriteria.excludeSectors.join(',');
      }
      
      const screenResults = await getMarketScreener(screenParams);
      
      console.log(`Initial screening found ${screenResults.length} candidates`);
      setScanProgress(20); // Update progress to 20%
      
      return screenResults;
    } catch (error) {
      console.error('Initial screening error:', error);
      throw new Error('Failed to perform initial market screening');
    }
  };
  
  // Second pass: Perform detailed analysis on screened stocks
  const performDetailedAnalysis = async (screenedStocks) => {
    const opportunities = [];
    const batchSize = 10; // Process stocks in batches of 10
    
    // Calculate total number of batches
    const totalBatches = Math.ceil(screenedStocks.length / batchSize);
    
    for (let i = 0; i < screenedStocks.length; i += batchSize) {
      // Get current batch of stocks
      const batch = screenedStocks.slice(i, i + batchSize);
      const tickers = batch.map(stock => stock.symbol);
      
      try {
        // Get detailed financial data for the batch
        const batchData = await getBatchStockData(tickers);
        
        // Process each stock in the batch
        for (const stockData of batchData) {
          try {
            // Skip if missing required data
            if (!stockData || !stockData.profile || !stockData.financials) {
              continue;
            }
            
            // Process the data
            const processedData = dataProcessingService.processFinancialData(stockData);
            
            // Perform Buffett-style valuation
            const valuation = calculationService.performValuation(processedData);
            
            // Check if it meets our value criteria (undervalued with margin of safety)
            const currentPrice = processedData.quote.price;
            const intrinsicValue = parseFloat(valuation.intrinsicValuePerShare);
            const buyPrice = parseFloat(valuation.buyPrice);
            
            // Skip if no valid intrinsic value or not undervalued
            if (!intrinsicValue || currentPrice > buyPrice) {
              continue;
            }
            
            // Calculate actual margin of safety and upside percent
            const actualMarginOfSafety = (intrinsicValue - currentPrice) / intrinsicValue * 100;
            const upsidePercent = (intrinsicValue / currentPrice - 1) * 100;
            
            // Check if it meets our minimum margin of safety requirement
            if (actualMarginOfSafety < scanCriteria.minMarginOfSafety) {
              continue;
            }
            
            // Add to opportunities list
            opportunities.push({
              ...valuation,
              actualMarginOfSafety,
              upsidePercent,
              currentPrice
            });
          } catch (stockError) {
            console.warn(`Error analyzing ${stockData?.profile?.symbol || 'unknown stock'}:`, stockError);
            // Continue to next stock on error
          }
        }
        
        // Update progress
        const currentBatch = Math.floor(i / batchSize) + 1;
        const progressPercent = Math.min(95, 20 + (currentBatch / totalBatches * 75));
        setScanProgress(progressPercent);
        
      } catch (batchError) {
        console.error('Error processing batch:', batchError);
        // Continue to next batch on error
      }
    }
    
    // Complete progress
    setScanProgress(100);
    
    return opportunities;
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Buffett-Style Opportunity Scanner</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Scan Criteria</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">
              <span className="text-gray-700">Minimum Return on Equity (%)</span>
              <input
                type="number"
                name="minRoe"
                value={scanCriteria.minRoe}
                onChange={handleCriteriaChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                min="0"
                max="50"
              />
            </label>
            
            <label className="block mb-2">
              <span className="text-gray-700">Maximum Debt-to-Equity Ratio</span>
              <input
                type="number"
                name="maxDebtToEquity"
                value={scanCriteria.maxDebtToEquity}
                onChange={handleCriteriaChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                min="0"
                step="0.1"
              />
            </label>
            
            <label className="block mb-2">
              <span className="text-gray-700">Minimum Margin of Safety (%)</span>
              <input
                type="number"
                name="minMarginOfSafety"
                value={scanCriteria.minMarginOfSafety}
                onChange={handleCriteriaChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                min="5"
                max="70"
              />
            </label>
            
            <label className="block mb-2">
              <span className="text-gray-700">Minimum Market Cap ($M)</span>
              <input
                type="number"
                name="marketCapMin"
                value={scanCriteria.marketCapMin / 1000000}
                onChange={(e) => handleCriteriaChange({
                  target: {
                    name: 'marketCapMin',
                    value: parseFloat(e.target.value) * 1000000,
                    type: 'number'
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                min="10"
              />
            </label>
          </div>
          
          <div>
            <span className="block text-gray-700 mb-2">Include Sectors:</span>
            <div className="bg-white p-3 rounded border border-gray-300 h-48 overflow-y-auto">
              {sectorOptions.map(sector => (
                <label key={sector} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="sector"
                    value={sector}
                    checked={!scanCriteria.excludeSectors.includes(sector)}
                    onChange={handleCriteriaChange}
                    className="mr-2"
                  />
                  <span>{sector}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={startScan}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Scanning...' : 'Find Opportunities'}
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300" 
              style={{ width: `${scanProgress}%` }}
            ></div>
          </div>
          <p className="text-center mt-2">Scanning market for opportunities ({scanProgress.toFixed(0)}%)...</p>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {scanComplete && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Found {opportunities.length} Value Opportunities
          </h2>
          
          {opportunities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Company</th>
                    <th className="py-2 px-4 border-b text-right">Price</th>
                    <th className="py-2 px-4 border-b text-right">Intrinsic Value</th>
                    <th className="py-2 px-4 border-b text-right">Buy Price</th>
                    <th className="py-2 px-4 border-b text-right">Upside %</th>
                    <th className="py-2 px-4 border-b text-right">Quality</th>
                    <th className="py-2 px-4 border-b text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opportunity, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b">
                        <div className="font-medium">{opportunity.name}</div>
                        <div className="text-xs text-gray-500">{opportunity.ticker}</div>
                      </td>
                      <td className="py-2 px-4 border-b text-right">${opportunity.currentPrice.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b text-right">${opportunity.intrinsicValuePerShare}</td>
                      <td className="py-2 px-4 border-b text-right">${opportunity.buyPrice}</td>
                      <td className="py-2 px-4 border-b text-right text-green-600">
                        {opportunity.upsidePercent.toFixed(2)}%
                      </td>
                      <td className="py-2 px-4 border-b text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          opportunity.businessQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                          opportunity.businessQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                          opportunity.businessQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {opportunity.businessQuality.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b text-right">
                        <button 
                          onClick={() => window.location.href = `/?ticker=${opportunity.ticker}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-600">No opportunities found matching your criteria. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OpportunityScanner;
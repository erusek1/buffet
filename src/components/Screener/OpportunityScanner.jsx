import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../UI/Card';
import { Button } from '../UI/Button';
import LoadingIndicator from '../UI/LoadingIndicator';
import fmpService from '../../api/fmpService';
import calculationService from '../../services/analysis/calculationService';
import dataProcessingService from '../../services/analysis/dataProcessingService';

const OpportunityScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState([]);
  const [currentBatch, setCurrentBatch] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    sector: 'All',
    minMarketCap: 0,
    maxValuationRatio: 1.5,
    minMoatRating: 0,
    sortBy: 'potentialReturn',
    sortDirection: 'desc'
  });
  
  // Available sectors for filtering
  const availableSectors = [
    'All', 'Technology', 'Healthcare', 'Financials', 'Consumer Staples', 
    'Consumer Discretionary', 'Industrials', 'Energy', 'Utilities', 
    'Materials', 'Communication Services', 'Real Estate'
  ];
  
  // Start scanning the market for value opportunities using real API data
  const startScan = async () => {
    try {
      setIsScanning(true);
      setScanProgress(0);
      setScanResults([]);
      
      // Step 1: Get quality stock universe
      setCurrentBatch('Retrieving quality stock symbols...');
      setScanProgress(10);
      
      // Use a predefined list of high-quality stocks to start
      const qualityStocks = [
        'JNJ', 'PG', 'KO', 'MSFT', 'AAPL', 'BRK.B', 'JPM', 'V', 
        'HD', 'PEP', 'UNP', 'UPS', 'COST', 'MCD', 'CVX', 'CI'
      ];
      
      // Step 2: Fetch quotes for these stocks
      setCurrentBatch('Fetching current price data...');
      setScanProgress(30);
      
      const quotes = await fmpService.getBatchQuotes(qualityStocks);
      
      if (!quotes || quotes.length === 0) {
        throw new Error('Failed to fetch stock quotes');
      }
      
      // Step 3: Get detailed financial data and calculate valuations
      setCurrentBatch('Analyzing financial data and calculating intrinsic values...');
      setScanProgress(50);
      
      const analysis = [];
      const totalStocks = Math.min(quotes.length, 5); // Limit to 5 stocks to avoid API rate limits
      
      for (let i = 0; i < totalStocks; i++) {
        const quote = quotes[i];
        
        // Update progress for each stock analysis
        const progressPerStock = 40 / totalStocks; // 40% of progress bar dedicated to stock analysis
        setCurrentBatch(`Analyzing ${quote.symbol} (${i+1}/${totalStocks})...`);
        setScanProgress(50 + (i / totalStocks) * 40);
        
        try {
          // Get full financial data
          const financialData = await fmpService.getFinancialStatements(quote.symbol);
          
          // Assess business quality
          let moatRating = 3; // Default moat rating
          let businessQuality = 'fair'; // Default business quality
          
          if (financialData.ratios && financialData.ratios.length > 0) {
            const ratios = financialData.ratios[0];
            const roe = ratios.returnOnEquity ? ratios.returnOnEquity * 100 : 0;
            const grossMargin = ratios.grossProfitMargin ? ratios.grossProfitMargin * 100 : 0;
            
            // Simple moat assessment based on ROE and gross margins
            if (roe > 20 && grossMargin > 40) {
              moatRating = 5;
              businessQuality = 'excellent';
            } else if (roe > 15 && grossMargin > 30) {
              moatRating = 4;
              businessQuality = 'good';
            } else if (roe > 10 && grossMargin > 25) {
              moatRating = 3;
              businessQuality = 'fair';
            } else {
              moatRating = 2;
              businessQuality = 'cyclical';
            }
          }
          
          // Create stock data object for valuation calculation
          const stockData = {
            ticker: quote.symbol,
            name: quote.name,
            currentPrice: quote.price,
            eps: quote.eps || 0,
            bookValuePerShare: quote.bookValue || 0,
            businessQuality,
            historicalGrowthRate: 5, // Default growth rate
            ownerEarningsPerShare: quote.eps || 0 // Simplified, using EPS
          };
          
          // Calculate intrinsic value
          const valuation = calculationService.calculateIntrinsicValue(stockData, {
            businessQuality
          });
          
          // Get sector from profile data
          const sector = financialData.profile && financialData.profile.length > 0 
            ? financialData.profile[0].sector 
            : 'Unknown';
          
          // Get market cap from profile data
          const marketCap = financialData.profile && financialData.profile.length > 0 
            ? (financialData.profile[0].mktCap / 1000000000) // Convert to billions
            : 0;
          
          // Create result object
          analysis.push({
            ticker: quote.symbol,
            company: quote.name,
            sector,
            marketCap,
            currentPrice: quote.price,
            intrinsicValue: valuation.results.intrinsicValue,
            valuationRatio: quote.price / valuation.results.intrinsicValue,
            potentialReturn: valuation.results.upsidePercent,
            moatRating,
            moatDescription: getMoatDescription(moatRating),
            businessQuality,
            buyBelowPrice: valuation.results.buyBelowPrice
          });
        } catch (error) {
          console.error(`Error analyzing ${quote.symbol}:`, error);
          // Skip failed analysis but continue with next stock
        }
      }
      
      // Step 4: Sort results
      setCurrentBatch('Ranking opportunities...');
      setScanProgress(95);
      
      const sortedResults = analysis.sort((a, b) => b.potentialReturn - a.potentialReturn);
      
      // Step 5: Complete
      setScanProgress(100);
      setScanResults(sortedResults);
      setIsScanning(false);
      
    } catch (error) {
      console.error('Error in market scan:', error);
      setScanResults([]);
      setCurrentBatch(`Error: ${error.message}`);
      setIsScanning(false);
    }
  };
  
  // Get moat description based on rating
  const getMoatDescription = (rating) => {
    switch(rating) {
      case 5: return 'Exceptional competitive advantage, industry leader';
      case 4: return 'Strong brand, scale advantages, high switching costs';
      case 3: return 'Solid market position, some differentiation';
      case 2: return 'Limited competitive advantage';
      default: return 'No significant moat';
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterOptions(prev => ({
      ...prev,
      [name]: name === 'minMarketCap' || name === 'maxValuationRatio' || name === 'minMoatRating' 
        ? parseFloat(value) 
        : value
    }));
  };
  
  const handleSortChange = (sortField) => {
    if (filterOptions.sortBy === sortField) {
      // Toggle direction if same field
      setFilterOptions(prev => ({
        ...prev,
        sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      // New field, set default direction
      setFilterOptions(prev => ({
        ...prev,
        sortBy: sortField,
        sortDirection: sortField === 'potentialReturn' ? 'desc' : 'asc'
      }));
    }
  };
  
  // Filter and sort results
  const filteredResults = scanResults
    .filter(stock => 
      (filterOptions.sector === 'All' || stock.sector === filterOptions.sector) &&
      stock.marketCap >= filterOptions.minMarketCap &&
      stock.valuationRatio <= filterOptions.maxValuationRatio &&
      stock.moatRating >= filterOptions.minMoatRating
    )
    .sort((a, b) => {
      const multiplier = filterOptions.sortDirection === 'asc' ? 1 : -1;
      
      if (filterOptions.sortBy === 'potentialReturn') {
        return (a.potentialReturn - b.potentialReturn) * multiplier;
      } else if (filterOptions.sortBy === 'valuationRatio') {
        return (a.valuationRatio - b.valuationRatio) * multiplier;
      } else if (filterOptions.sortBy === 'moatRating') {
        return (a.moatRating - b.moatRating) * multiplier;
      } else if (filterOptions.sortBy === 'marketCap') {
        return (a.marketCap - b.marketCap) * multiplier;
      } else {
        return (a.ticker > b.ticker ? 1 : -1) * multiplier;
      }
    });
  
  const getValuationColor = (ratio) => {
    if (ratio <= 0.7) return 'text-green-600';
    if (ratio <= 0.9) return 'text-green-400';
    if (ratio <= 1.1) return 'text-blue-600';
    if (ratio <= 1.3) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getReturnColor = (returnValue) => {
    if (returnValue >= 30) return 'text-green-600';
    if (returnValue >= 15) return 'text-green-400';
    if (returnValue >= 0) return 'text-blue-600';
    if (returnValue >= -15) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getMoatStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Buffett-Style Market Scanner</CardTitle>
          <p className="text-gray-600">Find undervalued stocks with durable competitive advantages</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <Button 
              onClick={startScan} 
              disabled={isScanning}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              {isScanning ? 'Scanning...' : 'Scan Market for Value Opportunities'}
            </Button>
            
            {isScanning && (
              <div className="flex items-center gap-2 grow">
                <div className="w-full h-4 bg-gray-200 rounded-full">
                  <div 
                    className="h-4 bg-blue-600 rounded-full" 
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{scanProgress}%</span>
                <span className="text-sm text-gray-600">{currentBatch}</span>
              </div>
            )}
          </div>
          
          {scanResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Filter Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Sector</label>
                  <select
                    name="sector"
                    value={filterOptions.sector}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded"
                  >
                    {availableSectors.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Min Market Cap ($B)</label>
                  <input
                    type="number"
                    name="minMarketCap"
                    value={filterOptions.minMarketCap}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded"
                    min="0"
                    step="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max P/IV Ratio</label>
                  <input
                    type="number"
                    name="maxValuationRatio"
                    value={filterOptions.maxValuationRatio}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded"
                    min="0"
                    max="3"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Min Moat Rating (1-5)</label>
                  <input
                    type="number"
                    name="minMoatRating"
                    value={filterOptions.minMoatRating}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded"
                    min="0"
                    max="5"
                    step="1"
                  />
                </div>
              </div>
            </div>
          )}
          
          {filteredResults.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th 
                      className="p-3 text-left border cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSortChange('ticker')}
                    >
                      Stock
                      {filterOptions.sortBy === 'ticker' && (
                        <span className="ml-1">{filterOptions.sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="p-3 text-left border">Sector</th>
                    <th 
                      className="p-3 text-right border cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSortChange('marketCap')}
                    >
                      Market Cap ($B)
                      {filterOptions.sortBy === 'marketCap' && (
                        <span className="ml-1">{filterOptions.sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="p-3 text-right border">Current Price</th>
                    <th className="p-3 text-right border">Intrinsic Value</th>
                    <th 
                      className="p-3 text-right border cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSortChange('valuationRatio')}
                    >
                      Price/Value
                      {filterOptions.sortBy === 'valuationRatio' && (
                        <span className="ml-1">{filterOptions.sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="p-3 text-right border cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSortChange('potentialReturn')}
                    >
                      Potential Return
                      {filterOptions.sortBy === 'potentialReturn' && (
                        <span className="ml-1">{filterOptions.sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="p-3 text-center border cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSortChange('moatRating')}
                    >
                      Moat Rating
                      {filterOptions.sortBy === 'moatRating' && (
                        <span className="ml-1">{filterOptions.sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(stock => (
                    <tr key={stock.ticker} className="hover:bg-gray-50">
                      <td className="p-3 border">
                        <div className="font-semibold">{stock.ticker}</div>
                        <div className="text-xs text-gray-600">{stock.company}</div>
                      </td>
                      <td className="p-3 border">{stock.sector}</td>
                      <td className="p-3 text-right border">${stock.marketCap.toFixed(1)}</td>
                      <td className="p-3 text-right border">${stock.currentPrice?.toFixed(2) || 'N/A'}</td>
                      <td className="p-3 text-right border text-blue-600">${stock.intrinsicValue?.toFixed(2) || 'N/A'}</td>
                      <td className={`p-3 text-right border ${getValuationColor(stock.valuationRatio)}`}>
                        {stock.valuationRatio?.toFixed(2) || 'N/A'}x
                      </td>
                      <td className={`p-3 text-right border ${getReturnColor(stock.potentialReturn)}`}>
                        {stock.potentialReturn >= 0 ? '+' : ''}{stock.potentialReturn?.toFixed(1) || 'N/A'}%
                      </td>
                      <td className="p-3 text-center border text-yellow-500">
                        {getMoatStars(stock.moatRating)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {scanResults.length > 0 && filteredResults.length === 0 && (
            <div className="p-6 text-center text-gray-600">
              No stocks match your current filter criteria. Try adjusting your filters.
            </div>
          )}
        </CardContent>
      </Card>
      
      {filteredResults.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Market Insights</h3>
            <p className="text-sm text-gray-600">
              The current market analysis shows {filteredResults.filter(s => s.valuationRatio < 0.9).length} stocks 
              trading below 90% of their intrinsic value out of {filteredResults.length} analyzed. 
              {filteredResults.filter(s => s.valuationRatio < 0.9).length < 3 
                ? " Patience may be essential in this environment."
                : " There appear to be some potential value opportunities worth investigating further."}
            </p>
            <p className="mt-4 text-sm text-gray-600">
              "The stock market is a device for transferring money from the impatient to the patient." - Warren Buffett
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OpportunityScanner;
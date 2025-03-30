import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../UI/Card';
import { Button } from '../UI/Button';
import LoadingIndicator from '../UI/LoadingIndicator';

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
  
  // Mock available sectors for filtering
  const availableSectors = [
    'All', 'Technology', 'Healthcare', 'Financials', 'Consumer Staples', 
    'Consumer Discretionary', 'Industrials', 'Energy', 'Utilities', 
    'Materials', 'Communication Services', 'Real Estate'
  ];
  
  // Mock stock opportunities data (in real app would come from API)
  const mockOpportunities = [
    {
      ticker: 'CI',
      company: 'Cigna Group',
      sector: 'Healthcare',
      marketCap: 83.4,
      currentPrice: 279.32,
      intrinsicValue: 400.22,
      valuationRatio: 0.70,
      potentialReturn: 43.3,
      moatRating: 3,
      moatDescription: 'Scale in healthcare services, integrated model',
      businessQuality: 'good',
      buyBelowPrice: 300.16
    },
    {
      ticker: 'JNJ',
      company: 'Johnson & Johnson',
      sector: 'Healthcare',
      marketCap: 344.8,
      currentPrice: 142.27,
      intrinsicValue: 168.60,
      valuationRatio: 0.84,
      potentialReturn: 18.5,
      moatRating: 5,
      moatDescription: 'Diversified healthcare leader, essential products',
      businessQuality: 'excellent',
      buyBelowPrice: 126.45
    },
    {
      ticker: 'CVX',
      company: 'Chevron Corporation',
      sector: 'Energy',
      marketCap: 278.2,
      currentPrice: 150.31,
      intrinsicValue: 196.75,
      valuationRatio: 0.76,
      potentialReturn: 31.0,
      moatRating: 3,
      moatDescription: 'Scale advantages, integrated operations, strong balance sheet',
      businessQuality: 'good',
      buyBelowPrice: 147.57
    },
    {
      ticker: 'PG',
      company: 'Procter & Gamble',
      sector: 'Consumer Staples',
      marketCap: 382.1,
      currentPrice: 162.10,
      intrinsicValue: 156.40,
      valuationRatio: 1.04,
      potentialReturn: -3.5,
      moatRating: 4,
      moatDescription: 'Brand strength, distribution dominance',
      businessQuality: 'excellent',
      buyBelowPrice: 117.30
    },
    {
      ticker: 'UNP',
      company: 'Union Pacific',
      sector: 'Industrials',
      marketCap: 141.8,
      currentPrice: 231.82,
      intrinsicValue: 125.10,
      valuationRatio: 1.85,
      potentialReturn: -46.1,
      moatRating: 4,
      moatDescription: 'Irreplaceable rail network, high barriers to entry',
      businessQuality: 'excellent',
      buyBelowPrice: 93.82
    },
    {
      ticker: 'KO',
      company: 'Coca-Cola',
      sector: 'Consumer Staples',
      marketCap: 266.4,
      currentPrice: 61.67,
      intrinsicValue: 68.40,
      valuationRatio: 0.90,
      potentialReturn: 10.9,
      moatRating: 5,
      moatDescription: 'Unmatched distribution, century-proven brand',
      businessQuality: 'excellent',
      buyBelowPrice: 51.30
    },
    {
      ticker: 'V',
      company: 'Visa',
      sector: 'Financials',
      marketCap: 644.6,
      currentPrice: 312.48,
      intrinsicValue: 284.60,
      valuationRatio: 1.10,
      potentialReturn: -8.9,
      moatRating: 5,
      moatDescription: 'Dominant network, high switching costs',
      businessQuality: 'excellent',
      buyBelowPrice: 213.45
    },
    {
      ticker: 'COST',
      company: 'Costco',
      sector: 'Consumer Staples',
      marketCap: 411.2,
      currentPrice: 927.37,
      intrinsicValue: 684.50,
      valuationRatio: 1.35,
      potentialReturn: -26.2,
      moatRating: 4,
      moatDescription: 'Low-cost leader, membership loyalty',
      businessQuality: 'good',
      buyBelowPrice: 513.40
    },
    {
      ticker: 'UPS',
      company: 'United Parcel Service',
      sector: 'Industrials',
      marketCap: 109.3,
      currentPrice: 126.76,
      intrinsicValue: 148.40,
      valuationRatio: 0.85,
      potentialReturn: 17.1,
      moatRating: 3,
      moatDescription: 'Scale advantages, network density',
      businessQuality: 'good',
      buyBelowPrice: 111.30
    },
    {
      ticker: 'HD',
      company: 'Home Depot',
      sector: 'Consumer Discretionary',
      marketCap: 340.9,
      currentPrice: 342.87,
      intrinsicValue: 321.40,
      valuationRatio: 1.07,
      potentialReturn: -6.3,
      moatRating: 3,
      moatDescription: 'Scale advantages, brand recognition',
      businessQuality: 'good',
      buyBelowPrice: 241.05
    },
    {
      ticker: 'JPM',
      company: 'JPMorgan Chase',
      sector: 'Financials',
      marketCap: 517.6,
      currentPrice: 182.79,
      intrinsicValue: 193.60,
      valuationRatio: 0.94,
      potentialReturn: 5.9,
      moatRating: 3,
      moatDescription: 'Scale advantages, regulatory barriers',
      businessQuality: 'good',
      buyBelowPrice: 145.20
    },
    {
      ticker: 'MSFT',
      company: 'Microsoft',
      sector: 'Technology',
      marketCap: 2944.0,
      currentPrice: 425.52,
      intrinsicValue: 375.40,
      valuationRatio: 1.13,
      potentialReturn: -11.8,
      moatRating: 5,
      moatDescription: 'Network effects, high switching costs',
      businessQuality: 'excellent',
      buyBelowPrice: 281.55
    }
  ];
  
  // Simulate scanning the market for value opportunities
  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResults([]);
    setCurrentBatch('Retrieving S&P 500 constituents...');
    
    // Simulate scanning process with progress updates
    const totalSteps = 5;
    const steps = [
      'Retrieving S&P 500 constituents...',
      'Fetching financial data...',
      'Calculating intrinsic values...',
      'Applying valuation filters...',
      'Ranking opportunities...'
    ];
    
    let currentStep = 0;
    
    const scanInterval = setInterval(() => {
      if (currentStep < totalSteps) {
        setCurrentBatch(steps[currentStep]);
        setScanProgress(Math.round((currentStep + 1) / totalSteps * 100));
        currentStep++;
      } else {
        clearInterval(scanInterval);
        setIsScanning(false);
        setScanResults(mockOpportunities);
      }
    }, 1500);
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
                      <td className="p-3 text-right border">${stock.currentPrice.toFixed(2)}</td>
                      <td className="p-3 text-right border text-blue-600">${stock.intrinsicValue.toFixed(2)}</td>
                      <td className={`p-3 text-right border ${getValuationColor(stock.valuationRatio)}`}>
                        {stock.valuationRatio.toFixed(2)}x
                      </td>
                      <td className={`p-3 text-right border ${getReturnColor(stock.potentialReturn)}`}>
                        {stock.potentialReturn >= 0 ? '+' : ''}{stock.potentialReturn.toFixed(1)}%
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
              The current market appears to have limited value opportunities with only {filteredResults.filter(s => s.valuationRatio < 0.9).length} stocks 
              trading below 90% of their intrinsic value. Patience is essential in this environment.
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
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const MarketAdaptiveScreener = () => {
  const [marketEnvironment, setMarketEnvironment] = useState('overvalued'); // Options: 'overvalued', 'fair', 'undervalued'
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Sample stock data - in a real implementation, this would come from your API
  const sampleStocks = [
    { 
      ticker: 'CVX', 
      name: 'Chevron',
      price: 150.31, 
      intrinsicValue: 196.75, 
      upside: 30.9,
      pe: 12.5, 
      forwardPE: 11.2,
      industryPE: 15.4,
      relativeValuation: 0.73, // PE relative to industry
      roe: 18.7,
      debtToEquity: 0.15,
      freeCashFlowYield: 7.2,
      dividend: 4.3,
      beta: 0.88,
      volatility: 22.4,
      sector: 'Energy'
    },
    { 
      ticker: 'CI', 
      name: 'Cigna',
      price: 279.32, 
      intrinsicValue: 400.22, 
      upside: 43.3,
      pe: 11.0, 
      forwardPE: 10.5,
      industryPE: 18.2,
      relativeValuation: 0.61,
      roe: 23.1,
      debtToEquity: 0.67,
      freeCashFlowYield: 8.1,
      dividend: 1.8,
      beta: 0.72,
      volatility: 19.8,
      sector: 'Healthcare'
    },
    { 
      ticker: 'BRK.B', 
      name: 'Berkshire Hathaway',
      price: 451.84, 
      intrinsicValue: 365.07, 
      upside: -19.2,
      pe: 21.3, 
      forwardPE: 19.8,
      industryPE: 22.5,
      relativeValuation: 0.95,
      roe: 15.3,
      debtToEquity: 0.23,
      freeCashFlowYield: 5.4,
      dividend: 0,
      beta: 0.77,
      volatility: 18.6,
      sector: 'Financials'
    },
    { 
      ticker: 'UNH', 
      name: 'UnitedHealth Group',
      price: 524.52, 
      intrinsicValue: 537.79, 
      upside: 2.5,
      pe: 23.7, 
      forwardPE: 20.8,
      industryPE: 18.2,
      relativeValuation: 1.30,
      roe: 28.4,
      debtToEquity: 0.54,
      freeCashFlowYield: 5.6,
      dividend: 1.4,
      beta: 0.69,
      volatility: 21.2,
      sector: 'Healthcare'
    },
    { 
      ticker: 'TXN', 
      name: 'Texas Instruments',
      price: 191.66, 
      intrinsicValue: 109.37, 
      upside: -42.9,
      pe: 29.8, 
      forwardPE: 26.2,
      industryPE: 30.5,
      relativeValuation: 0.98,
      roe: 48.6,
      debtToEquity: 0.42,
      freeCashFlowYield: 3.8,
      dividend: 2.7,
      beta: 1.02,
      volatility: 28.3,
      sector: 'Technology'
    }
  ];
  
  // Define strategies based on market environment
  useEffect(() => {
    if (marketEnvironment === 'overvalued') {
      setStrategies([
        {
          id: 'quality-leaders',
          name: 'Quality Leaders with Reasonable Valuations',
          description: 'Companies with strong ROE, low debt and PE ratios below industry average',
          criteria: (stock) => stock.roe > 15 && stock.debtToEquity < 0.7 && stock.relativeValuation < 1
        },
        {
          id: 'defensive-dividend',
          name: 'Defensive Dividend Payers',
          description: 'Stable companies with attractive dividends and below-average volatility',
          criteria: (stock) => stock.dividend > 2 && stock.beta < 0.9 && stock.volatility < 25
        },
        {
          id: 'cash-generators',
          name: 'Superior Cash Generators',
          description: 'Companies with high free cash flow yields and strong balance sheets',
          criteria: (stock) => stock.freeCashFlowYield > 5 && stock.debtToEquity < 0.5
        },
        {
          id: 'relative-value',
          name: 'Relative Value Opportunities',
          description: 'Stocks that are undervalued compared to their industry, even if absolute valuations are high',
          criteria: (stock) => stock.relativeValuation < 0.85
        }
      ]);
    } else if (marketEnvironment === 'fair') {
      setStrategies([
        {
          id: 'buffett-classic',
          name: 'Classic Buffett Value',
          description: 'Companies trading below intrinsic value with a margin of safety',
          criteria: (stock) => stock.price < stock.intrinsicValue * 0.9
        },
        {
          id: 'moat-compounders',
          name: 'Moat Compounders',
          description: 'High-quality businesses with sustainable competitive advantages',
          criteria: (stock) => stock.roe > 20 && stock.freeCashFlowYield > 4
        },
        {
          id: 'growth-at-reasonable-price',
          name: 'Growth at Reasonable Price',
          description: 'Growing companies with reasonable valuations',
          criteria: (stock) => stock.forwardPE < stock.pe && stock.pe < stock.industryPE * 1.2
        }
      ]);
    } else if (marketEnvironment === 'undervalued') {
      setStrategies([
        {
          id: 'deep-value',
          name: 'Deep Value Opportunities',
          description: 'Significantly undervalued companies with substantial upside',
          criteria: (stock) => stock.upside > 50
        },
        {
          id: 'cigar-butts',
          name: 'Cigar Butt Opportunities',
          description: 'Graham-style bargains trading below intrinsic value',
          criteria: (stock) => stock.price < stock.intrinsicValue * 0.7
        },
        {
          id: 'mean-reversion',
          name: 'Mean Reversion Candidates',
          description: 'Quality companies temporarily beaten down',
          criteria: (stock) => stock.upside > 30 && stock.roe > 12
        }
      ]);
    }
    
    setSelectedStrategy(null);
  }, [marketEnvironment]);
  
  // Screen stocks based on selected strategy
  const runScreener = () => {
    if (!selectedStrategy) return;
    
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const foundStrategy = strategies.find(s => s.id === selectedStrategy);
      if (foundStrategy) {
        const filteredResults = sampleStocks.filter(foundStrategy.criteria);
        setResults(filteredResults);
      } else {
        setResults([]);
      }
      setLoading(false);
    }, 1000);
  };
  
  // Handle strategy selection
  const handleStrategyChange = (e) => {
    setSelectedStrategy(e.target.value);
  };
  
  // Handle market environment change
  const handleMarketChange = (e) => {
    setMarketEnvironment(e.target.value);
    setResults([]);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Market Environment Adaptive Screener</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Market Environment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Market Environment
                  </label>
                  <select
                    value={marketEnvironment}
                    onChange={handleMarketChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="overvalued">Overvalued Market</option>
                    <option value="fair">Fairly Valued Market</option>
                    <option value="undervalued">Undervalued Market</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Strategy
                  </label>
                  <select
                    value={selectedStrategy || ''}
                    onChange={handleStrategyChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="">Select a strategy...</option>
                    {strategies.map(strategy => (
                      <option key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedStrategy && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Strategy Description</h3>
                    <p className="text-sm text-gray-600">
                      {strategies.find(s => s.id === selectedStrategy)?.description}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={runScreener}
                  disabled={!selectedStrategy || loading}
                  className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  {loading ? 'Running Screener...' : 'Run Screener'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Market Environment Characteristics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketEnvironment === 'overvalued' && (
                  <div>
                    <h3 className="text-lg font-medium text-red-600 mb-2">Overvalued Market</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>Most stocks trading above their intrinsic values</li>
                      <li>High market P/E ratios relative to historical norms</li>
                      <li>Reduced margin of safety across the board</li>
                      <li>Increased importance of selectivity and quality</li>
                      <li>Cash becomes a more valuable strategic asset</li>
                    </ul>
                    
                    <div className="mt-4 p-4 bg-red-50 rounded-md">
                      <h4 className="font-medium">Buffett's Guidance:</h4>
                      <p className="text-sm italic mt-1">
                        "Be fearful when others are greedy, and greedy when others are fearful."
                      </p>
                    </div>
                  </div>
                )}
                
                {marketEnvironment === 'fair' && (
                  <div>
                    <h3 className="text-lg font-medium text-yellow-600 mb-2">Fairly Valued Market</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>Balance of overvalued and undervalued opportunities</li>
                      <li>Market P/E ratios close to historical averages</li>
                      <li>Moderate margins of safety available</li>
                      <li>Balanced approach to capital allocation</li>
                      <li>Quality at a reasonable price becomes attractive</li>
                    </ul>
                    
                    <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                      <h4 className="font-medium">Buffett's Guidance:</h4>
                      <p className="text-sm italic mt-1">
                        "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price."
                      </p>
                    </div>
                  </div>
                )}
                
                {marketEnvironment === 'undervalued' && (
                  <div>
                    <h3 className="text-lg font-medium text-green-600 mb-2">Undervalued Market</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>Abundant opportunities below intrinsic value</li>
                      <li>Low market P/E ratios relative to historical norms</li>
                      <li>Wide margins of safety available</li>
                      <li>Opportunity to be more aggressive with capital</li>
                      <li>Even average businesses become attractive investments</li>
                    </ul>
                    
                    <div className="mt-4 p-4 bg-green-50 rounded-md">
                      <h4 className="font-medium">Buffett's Guidance:</h4>
                      <p className="text-sm italic mt-1">
                        "The best chance to deploy capital is when things are going down."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Screening Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IV
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upside (%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P/E
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rel. PE
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROE (%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FCF Yield (%)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((stock) => (
                  <tr key={stock.ticker}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{stock.ticker}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${stock.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${stock.intrinsicValue.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap ${stock.upside > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.upside.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.pe.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.relativeValuation.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.roe.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.freeCashFlowYield.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedStrategy && results.length === 0 && !loading && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-amber-700">
            No stocks found matching the selected criteria. Consider adjusting your strategy or criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketAdaptiveScreener;
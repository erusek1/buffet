import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../UI/Card';
import { Button } from '../UI/Button';

const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data for recent scans and watchlist
  const recentScans = [
    { 
      date: '2025-03-30', 
      findings: '12 potential opportunities found',
      topPicks: ['CI', 'CVX', 'JNJ'],
      marketStatus: 'Generally Overvalued'
    },
    { 
      date: '2025-03-23', 
      findings: '9 potential opportunities found',
      topPicks: ['CI', 'CVX', 'UPS'],
      marketStatus: 'Generally Overvalued'
    },
    { 
      date: '2025-03-16', 
      findings: '15 potential opportunities found',
      topPicks: ['CI', 'JNJ', 'KO'],
      marketStatus: 'Moderately Overvalued'
    }
  ];
  
  const watchlist = [
    {
      ticker: 'CI',
      company: 'Cigna Group',
      currentPrice: 279.32,
      intrinsicValue: 400.22,
      buyBelowPrice: 300.16,
      valuationRatio: 0.70,
      status: 'Undervalued'
    },
    {
      ticker: 'CVX',
      company: 'Chevron Corporation',
      currentPrice: 150.31,
      intrinsicValue: 196.75,
      buyBelowPrice: 147.57,
      valuationRatio: 0.76,
      status: 'Near Buy Point'
    },
    {
      ticker: 'JNJ',
      company: 'Johnson & Johnson',
      currentPrice: 142.27,
      intrinsicValue: 168.60,
      buyBelowPrice: 126.45,
      valuationRatio: 0.84,
      status: 'Hold'
    },
    {
      ticker: 'KO',
      company: 'Coca-Cola',
      currentPrice: 61.67,
      intrinsicValue: 68.40,
      buyBelowPrice: 51.30,
      valuationRatio: 0.90,
      status: 'Hold'
    },
    {
      ticker: 'UPS',
      company: 'United Parcel Service',
      currentPrice: 126.76,
      intrinsicValue: 148.40,
      buyBelowPrice: 111.30,
      valuationRatio: 0.85,
      status: 'Hold'
    }
  ];
  
  const marketInsights = [
    "Most high-quality businesses appear overvalued using our conservative owner earnings methodology.",
    "Currently seeing the most value in healthcare and energy sectors.",
    "Patience is essential in the current market environment.",
    "Consider dollar-cost averaging into your highest conviction holdings.",
    "Maintain higher cash levels to take advantage of future market volatility."
  ];
  
  const getValuationColor = (ratio) => {
    if (ratio <= 0.7) return 'text-green-600';
    if (ratio <= 0.9) return 'text-green-400';
    if (ratio <= 1.1) return 'text-blue-600';
    if (ratio <= 1.3) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getValuationBackgroundColor = (ratio) => {
    if (ratio <= 0.7) return 'bg-green-50';
    if (ratio <= 0.9) return 'bg-green-50';
    if (ratio <= 1.1) return 'bg-blue-50';
    if (ratio <= 1.3) return 'bg-yellow-50';
    return 'bg-red-50';
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Buffett-Style Value Investing Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={() => window.location.href = '/screener'}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Scan Market
          </Button>
          <Button 
            onClick={() => window.location.href = '/calculator'}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            Value Calculator
          </Button>
        </div>
      </div>
      
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('overview')}
        >
          Market Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'watchlist' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('watchlist')}
        >
          Watchlist
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'scans' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('scans')}
        >
          Recent Scans
        </button>
      </div>
      
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Status</CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-yellow-50">
                <h3 className="text-2xl font-bold text-yellow-600">Generally Overvalued</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Based on our conservative owner earnings approach, most quality businesses are trading above
                  their intrinsic values.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Value Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold">12 <span className="text-sm text-gray-500">of 500</span></h3>
                <p className="text-sm text-gray-600 mt-2">
                  Only 2.4% of analyzed stocks currently trade below our buy price thresholds.
                </p>
                <div className="mt-4">
                  <Button 
                    onClick={() => window.location.href = '/screener'}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
                  >
                    View Opportunities
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Value Pick</CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-green-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">CI <span className="text-sm font-normal text-gray-600">Cigna Group</span></h3>
                    <p className="text-sm text-gray-600 mt-1">Healthcare sector</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Current: <span className="font-bold">$279.32</span></p>
                    <p className="text-sm">Value: <span className="font-bold text-blue-600">$400.22</span></p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-green-600 font-semibold">Undervalued by 30%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Market Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {marketInsights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm italic text-gray-600">
                  "Be fearful when others are greedy and greedy when others are fearful." — Warren Buffett
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sector Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Healthcare</span>
                      <span className="text-green-600">Most Attractive</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Energy</span>
                      <span className="text-green-400">Attractive</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Financials</span>
                      <span className="text-blue-600">Neutral</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Consumer Staples</span>
                      <span className="text-blue-600">Neutral</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Technology</span>
                      <span className="text-red-600">Overvalued</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Watchlist Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {watchlist.slice(0, 3).map(stock => (
                    <div key={stock.ticker} className="border-b pb-3">
                      <div className="flex justify-between">
                        <div>
                          <span className="font-semibold">{stock.ticker}</span>
                          <span className="text-xs text-gray-600 ml-2">{stock.company}</span>
                        </div>
                        <div className={getValuationColor(stock.valuationRatio)}>
                          {(stock.valuationRatio * 100).toFixed(0)}% of value
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div 
                          className={`h-1 rounded-full ${stock.valuationRatio <= 0.9 ? 'bg-green-600' : 'bg-yellow-600'}`} 
                          style={{ width: `${stock.valuationRatio * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center mt-4">
                    <Button 
                      onClick={() => setActiveTab('watchlist')}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm"
                    >
                      View All Watchlist Items
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      {activeTab === 'watchlist' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left border">Stock</th>
                    <th className="p-3 text-right border">Current Price</th>
                    <th className="p-3 text-right border">Intrinsic Value</th>
                    <th className="p-3 text-right border">Buy Below</th>
                    <th className="p-3 text-right border">Price/Value</th>
                    <th className="p-3 text-center border">Status</th>
                    <th className="p-3 text-center border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map(stock => (
                    <tr key={stock.ticker} className="hover:bg-gray-50">
                      <td className="p-3 border">
                        <div className="font-semibold">{stock.ticker}</div>
                        <div className="text-xs text-gray-600">{stock.company}</div>
                      </td>
                      <td className="p-3 text-right border">${stock.currentPrice.toFixed(2)}</td>
                      <td className="p-3 text-right border text-blue-600">${stock.intrinsicValue.toFixed(2)}</td>
                      <td className="p-3 text-right border text-green-600">${stock.buyBelowPrice.toFixed(2)}</td>
                      <td className={`p-3 text-right border ${getValuationColor(stock.valuationRatio)}`}>
                        {stock.valuationRatio.toFixed(2)}x
                      </td>
                      <td className={`p-3 text-center border ${
                        stock.status === 'Undervalued' ? 'text-green-600' :
                        stock.status === 'Near Buy Point' ? 'text-green-400' :
                        'text-blue-600'
                      }`}>
                        {stock.status}
                      </td>
                      <td className="p-3 text-center border">
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs mr-1"
                        >
                          Analyze
                        </Button>
                        <Button
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-2 rounded text-xs"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded"
              >
                Add Stock to Watchlist
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'scans' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Market Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentScans.map((scan, index) => (
                <div key={index} className={`p-4 rounded-lg ${index === 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{scan.date}</h3>
                      <p className="text-sm text-gray-600 mt-1">{scan.findings}</p>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        scan.marketStatus.includes('Overvalued') ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {scan.marketStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm font-medium">Top Picks:</p>
                    <div className="flex gap-2 mt-1">
                      {scan.topPicks.map(ticker => (
                        <span key={ticker} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {ticker}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => window.location.href = '/screener'}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                Run New Market Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Last data update: March 30, 2025 at 18:45 EST</p>
        <p className="mt-1">
          "Price is what you pay. Value is what you get." — Warren Buffett
        </p>
      </div>
    </div>
  );
};

export default MainDashboard;
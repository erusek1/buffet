import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../UI/Card';
import { Button } from '../UI/Button';
import { getCompanyFinancials } from '../../api/fmpService';
import * as dataProcessingService from '../../services/analysis/dataProcessingService';
import calculationService from '../../services/analysis/calculationService';

const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [watchlist, setWatchlist] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [marketStatus, setMarketStatus] = useState({ status: 'Loading...', description: 'Analyzing market data' });
  const [sectorAnalysis, setSectorAnalysis] = useState([]);
  const [topPick, setTopPick] = useState(null);
  const [valueOpportunities, setValueOpportunities] = useState({ count: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Default watchlist tickers - these would normally come from user preferences/database
  const defaultWatchlistTickers = ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'BRK.B', 'JNJ', 'PG', 'KO', 'CVX'];
  
  // Market insights are dynamically generated based on analysis results
  const [marketInsights, setMarketInsights] = useState([]);

  // Load watchlist data on component mount
  useEffect(() => {
    const loadWatchlistData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch data for watchlist tickers
        const watchlistData = [];
        
        for (const ticker of defaultWatchlistTickers) {
          try {
            const data = await getCompanyFinancials(ticker);
            if (data && data.profile) {
              const processedData = dataProcessingService.structureFinancialData(data);
              const valuation = calculationService.performValuation(processedData);
              
              const currentPrice = processedData.quote.price;
              const intrinsicValue = parseFloat(valuation.intrinsicValuePerShare);
              const buyBelowPrice = parseFloat(valuation.buyPrice);
              const valuationRatio = currentPrice / intrinsicValue;
              
              let status = 'Overvalued';
              if (currentPrice <= buyBelowPrice) {
                status = 'Undervalued';
              } else if (currentPrice <= intrinsicValue) {
                status = 'Fair Value';
              } else if (currentPrice <= intrinsicValue * 1.1) {
                status = 'Slightly Overvalued';
              }
              
              watchlistData.push({
                ticker,
                company: processedData.profile.name,
                currentPrice,
                intrinsicValue,
                buyBelowPrice,
                valuationRatio,
                status
              });
              
              // Wait to avoid API rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (err) {
            console.error(`Error fetching data for ${ticker}:`, err);
            // Continue with other tickers even if one fails
          }
        }
        
        setWatchlist(watchlistData);
        
        // Find the most undervalued stock for top pick
        if (watchlistData.length > 0) {
          const mostUndervalued = watchlistData.reduce((prev, current) => 
            (prev.valuationRatio < current.valuationRatio) ? prev : current
          );
          setTopPick(mostUndervalued);
        }
        
        // Generate market status based on average valuation
        const avgValuationRatio = watchlistData.reduce((sum, stock) => sum + stock.valuationRatio, 0) / watchlistData.length;
        let marketStatusResult = { status: 'Unknown', description: 'Unable to determine market status' };
        
        if (avgValuationRatio <= 0.8) {
          marketStatusResult = { 
            status: 'Undervalued', 
            description: 'Based on our conservative owner earnings approach, many quality businesses are trading below their intrinsic values.'
          };
        } else if (avgValuationRatio <= 0.95) {
          marketStatusResult = { 
            status: 'Fairly Valued', 
            description: 'Based on our conservative owner earnings approach, most quality businesses are trading near their intrinsic values.'
          };
        } else if (avgValuationRatio <= 1.1) {
          marketStatusResult = { 
            status: 'Slightly Overvalued', 
            description: 'Based on our conservative owner earnings approach, many quality businesses are trading slightly above their intrinsic values.'
          };
        } else {
          marketStatusResult = { 
            status: 'Generally Overvalued', 
            description: 'Based on our conservative owner earnings approach, most quality businesses are trading above their intrinsic values.'
          };
        }
        
        setMarketStatus(marketStatusResult);
        
        // Count value opportunities
        const opportunityCount = watchlistData.filter(stock => stock.currentPrice <= stock.buyBelowPrice).length;
        setValueOpportunities({
          count: opportunityCount,
          total: watchlistData.length,
          percentage: ((opportunityCount / watchlistData.length) * 100).toFixed(1)
        });
        
        // Generate sector analysis
        const sectors = {};
        
        for (const stock of watchlistData) {
          const sector = processedData.profile.sector || 'Unknown';
          if (!sectors[sector]) {
            sectors[sector] = { total: 0, undervalued: 0, fairValue: 0, overvalued: 0 };
          }
          
          sectors[sector].total++;
          
          if (stock.valuationRatio <= 0.8) {
            sectors[sector].undervalued++;
          } else if (stock.valuationRatio <= 1.0) {
            sectors[sector].fairValue++;
          } else {
            sectors[sector].overvalued++;
          }
        }
        
        // Convert to array and calculate scores
        const sectorAnalysisData = Object.entries(sectors).map(([sector, data]) => {
          const score = ((data.undervalued * 100) + (data.fairValue * 50)) / data.total;
          let status = 'Neutral';
          
          if (score >= 75) {
            status = 'Most Attractive';
          } else if (score >= 60) {
            status = 'Attractive';
          } else if (score <= 25) {
            status = 'Overvalued';
          }
          
          return {
            sector,
            score,
            status,
            total: data.total
          };
        });
        
        // Sort by score (highest first)
        sectorAnalysisData.sort((a, b) => b.score - a.score);
        setSectorAnalysis(sectorAnalysisData);
        
        // Generate market insights based on analysis
        const insights = [];
        
        // Add insight about market valuation
        if (avgValuationRatio > 1.1) {
          insights.push("Most high-quality businesses appear overvalued using our conservative owner earnings methodology.");
        } else if (avgValuationRatio > 0.95) {
          insights.push("Most high-quality businesses appear slightly overvalued using our conservative owner earnings methodology.");
        } else if (avgValuationRatio > 0.8) {
          insights.push("Most high-quality businesses appear fairly valued using our conservative owner earnings methodology.");
        } else {
          insights.push("Many high-quality businesses appear undervalued using our conservative owner earnings methodology.");
        }
        
        // Add insight about best sectors
        if (sectorAnalysisData.length > 0) {
          const topSectors = sectorAnalysisData.filter(s => s.score >= 60).map(s => s.sector);
          if (topSectors.length > 0) {
            insights.push(`Currently seeing the most value in ${topSectors.join(' and ')} ${topSectors.length === 1 ? 'sector' : 'sectors'}.`);
          }
        }
        
        // Add general value investing advice
        insights.push("Patience is essential in the current market environment.");
        
        if (avgValuationRatio > 1.1) {
          insights.push("Consider maintaining higher cash levels to take advantage of future market volatility.");
        } else if (avgValuationRatio < 0.8) {
          insights.push("Consider systematically adding to positions when quality businesses are undervalued.");
        } else {
          insights.push("Consider dollar-cost averaging into your highest conviction holdings.");
        }
        
        setMarketInsights(insights);
        
        // Generate mock recent scans data 
        // In a real application, this would come from a database of saved scan results
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const formatDate = (date) => {
          return date.toISOString().split('T')[0];
        };
        
        const undervaluedStocks = watchlistData
          .filter(stock => stock.status === 'Undervalued')
          .map(stock => stock.ticker);
        
        const mockScans = [
          {
            date: formatDate(today),
            findings: `${opportunityCount} potential opportunities found`,
            topPicks: undervaluedStocks.slice(0, 3),
            marketStatus: marketStatusResult.status
          },
          {
            date: formatDate(oneWeekAgo),
            findings: `${Math.max(0, opportunityCount - 2)} potential opportunities found`,
            topPicks: undervaluedStocks.slice(0, Math.min(3, undervaluedStocks.length)),
            marketStatus: marketStatusResult.status
          },
          {
            date: formatDate(twoWeeksAgo),
            findings: `${Math.max(0, opportunityCount + 1)} potential opportunities found`,
            topPicks: undervaluedStocks.slice(0, Math.min(3, undervaluedStocks.length)),
            marketStatus: marketStatusResult.status
          }
        ];
        
        setRecentScans(mockScans);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Error loading dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadWatchlistData();
  }, []);
  
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

  const getStatusColor = (status) => {
    if (status === 'Undervalued') return 'text-green-600';
    if (status === 'Fair Value') return 'text-blue-600';
    if (status === 'Slightly Overvalued') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarketStatusColor = (status) => {
    if (status === 'Undervalued') return 'bg-green-50 text-green-600';
    if (status === 'Fairly Valued') return 'bg-blue-50 text-blue-600';
    if (status === 'Slightly Overvalued') return 'bg-yellow-50 text-yellow-600';
    return 'bg-yellow-50 text-yellow-600';
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
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Status</CardTitle>
                  </CardHeader>
                  <CardContent className={`p-6 ${getMarketStatusColor(marketStatus.status)}`}>
                    <h3 className="text-2xl font-bold">{marketStatus.status}</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      {marketStatus.description}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Value Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold">{valueOpportunities.count} <span className="text-sm text-gray-500">of {valueOpportunities.total}</span></h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Only {valueOpportunities.percentage}% of analyzed stocks currently trade below our buy price thresholds.
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
                
                {topPick && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Value Pick</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 bg-green-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{topPick.ticker} <span className="text-sm font-normal text-gray-600">{topPick.company}</span></h3>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Current: <span className="font-bold">${topPick.currentPrice.toFixed(2)}</span></p>
                          <p className="text-sm">Value: <span className="font-bold text-blue-600">${topPick.intrinsicValue.toFixed(2)}</span></p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-green-600 font-semibold">
                          Undervalued by {((1 - topPick.valuationRatio) * 100).toFixed(0)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: `${topPick.valuationRatio * 100}%` }}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                      {sectorAnalysis.map((sector, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span>{sector.sector}</span>
                            <span className={
                              sector.status === 'Most Attractive' ? 'text-green-600' :
                              sector.status === 'Attractive' ? 'text-green-400' :
                              sector.status === 'Overvalued' ? 'text-red-600' : 'text-blue-600'
                            }>
                              {sector.status}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={
                                sector.status === 'Most Attractive' ? 'bg-green-600' :
                                sector.status === 'Attractive' ? 'bg-green-400' :
                                sector.status === 'Overvalued' ? 'bg-red-600' : 'bg-blue-600'
                              } 
                              style={{ width: `${sector.score}%` }}
                              className="h-2 rounded-full"
                            ></div>
                          </div>
                        </div>
                      ))}
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
                              style={{ width: `${Math.min(stock.valuationRatio * 100, 100)}%` }}
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
                          <td className={`p-3 text-center border ${getStatusColor(stock.status)}`}>
                            {stock.status}
                          </td>
                          <td className="p-3 text-center border">
                            <Button
                              onClick={() => window.location.href = `/calculator?ticker=${stock.ticker}`}
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
                          {scan.topPicks.length > 0 ? (
                            scan.topPicks.map(ticker => (
                              <span key={ticker} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {ticker}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-xs">No value picks found</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button
                          onClick={() => window.location.href = '/screener'}
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
        </>
      )}
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Last data update: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p className="mt-1">
          "Price is what you pay. Value is what you get." — Warren Buffett
        </p>
      </div>
    </div>
  );
};

export default MainDashboard;
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../UI/Card';
import { getCompanyFinancials } from '../../api/fmpService';
import calculationService from '../../services/analysis/calculationService';
import dataProcessingService from '../../services/analysis/dataProcessingService';

const RevisedBuffettSP500Analysis = () => {
  const [stockAnalysis, setStockAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tickerFilter, setTickerFilter] = useState('');
  const [sortBy, setSortBy] = useState('valuationRatio');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [scanStatus, setScanStatus] = useState('idle');

  // Default S&P components to analyze - these can be customized by the user
  const defaultTickers = [
    'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'META', 'BRK.B', 'LLY', 'V', 'UNH',
    'JPM', 'XOM', 'AVGO', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'KO'
  ];

  useEffect(() => {
    setSelectedTickers(defaultTickers);
  }, []);

  // Sort data based on selected criteria
  useEffect(() => {
    if (stockAnalysis.length > 0) {
      let sortedData = [...stockAnalysis];
      
      if (sortBy === 'valuationRatio') {
        sortedData.sort((a, b) => 
          sortOrder === 'asc' ? a.valuationRatio - b.valuationRatio : b.valuationRatio - a.valuationRatio
        );
      } else if (sortBy === 'upside') {
        sortedData.sort((a, b) => 
          sortOrder === 'asc' ? b.upside - a.upside : a.upside - b.upside
        );
      } else if (sortBy === 'percentToBuyPoint') {
        sortedData.sort((a, b) => 
          sortOrder === 'asc' ? a.percentToBuyPoint - b.percentToBuyPoint : b.percentToBuyPoint - a.percentToBuyPoint
        );
      }

      setStockAnalysis(sortedData);
    }
  }, [sortBy, sortOrder]);

  // Function to analyze a single stock
  const analyzeStock = async (ticker) => {
    try {
      const data = await getCompanyFinancials(ticker);
      if (!data || !data.profile) {
        throw new Error(`No data returned for ${ticker}`);
      }

      const processedData = dataProcessingService.processFinancialData(data);
      const valuation = calculationService.performValuation(processedData);
      
      // Calculate business quality and extract key metrics
      const businessQuality = calculationService.assessBusinessQuality(processedData);
      
      // Extract key strengths and moat assessment
      const moat = assessMoat(processedData, businessQuality);
      const qualityMetrics = extractQualityMetrics(processedData);
      const rationale = generateInvestmentRationale(processedData, businessQuality);
      
      // Calculate the current valuation
      const currentPrice = processedData.quote.price;
      const intrinsicValue = parseFloat(valuation.intrinsicValuePerShare);
      const buyBelow = parseFloat(valuation.buyPrice);
      
      // Generate assessment based on current price vs. intrinsic value
      const assessment = generateAssessment(currentPrice, intrinsicValue, buyBelow);
      
      return {
        ticker,
        company: processedData.profile.name,
        currentPrice,
        intrinsicValue,
        buyBelow,
        moat,
        qualityMetrics,
        rationale,
        assessment,
        // Additional calculated metrics
        valuationRatio: parseFloat((currentPrice / intrinsicValue).toFixed(2)),
        upside: parseFloat(((intrinsicValue / currentPrice * 100) - 100).toFixed(2)),
        marginOfSafetyPercent: parseFloat(((1 - buyBelow / intrinsicValue) * 100).toFixed(2)),
        percentToBuyPoint: parseFloat(((currentPrice / buyBelow - 1) * 100).toFixed(2))
      };
    } catch (error) {
      console.error(`Error analyzing ${ticker}:`, error);
      return null;
    }
  };

  // Helper function to assess moat based on financial data
  const assessMoat = (data, businessQuality) => {
    const { profile, metrics } = data;
    
    if (!metrics) return "Insufficient data to assess economic moat";
    
    const industry = profile.industry;
    const grossMargin = metrics.grossMargin;
    const operatingMargin = metrics.operatingMargin;
    const roe = metrics.roe;
    
    // Basic assessment based on profitability metrics
    if (roe > 25 && operatingMargin > 25) {
      return "Strong economic moat with high returns on capital and margins";
    } else if (roe > 15 && operatingMargin > 15) {
      return "Good economic moat with solid profitability metrics";
    } else if (roe > 10 && operatingMargin > 10) {
      return "Modest competitive advantages with reasonable returns";
    } else {
      return "Limited evidence of sustainable competitive advantages";
    }
  };

  // Helper function to extract quality metrics
  const extractQualityMetrics = (data) => {
    const { metrics } = data;
    
    if (!metrics) return "Insufficient data for quality assessment";
    
    const points = [];
    
    if (metrics.roe > 15) points.push("Strong ROE");
    if (metrics.roic > 12) points.push("Good ROIC");
    if (metrics.debtToEquity < 0.5) points.push("Low debt");
    if (metrics.operatingMargin > 15) points.push("High operating margins");
    if (metrics.netMargin > 10) points.push("Strong net margins");
    
    return points.length > 0 ? points.join(", ") : "Average quality metrics";
  };

  // Helper function to generate investment rationale
  const generateInvestmentRationale = (data, businessQuality) => {
    const { profile } = data;
    
    if (businessQuality === "Excellent") {
      return `High-quality business in ${profile.sector} sector with sustainable competitive advantages`;
    } else if (businessQuality === "Good") {
      return `Solid business fundamentals in the ${profile.industry} industry`;
    } else {
      return `May face competitive challenges in ${profile.sector} sector`;
    }
  };

  // Helper function to generate assessment
  const generateAssessment = (currentPrice, intrinsicValue, buyBelow) => {
    if (currentPrice <= buyBelow) {
      return "Currently trading below buy price - potentially attractive value";
    } else if (currentPrice <= intrinsicValue) {
      return "Trading below intrinsic value but above buy price - monitor for better entry";
    } else if (currentPrice < intrinsicValue * 1.2) {
      return "Slightly overvalued - consider on significant pullbacks";
    } else {
      return "Significantly overvalued at current prices";
    }
  };

  // Function to analyze multiple stocks
  const analyzeStocks = async () => {
    setLoading(true);
    setError(null);
    setScanStatus('scanning');
    
    try {
      const results = [];
      
      for (let i = 0; i < selectedTickers.length; i++) {
        const ticker = selectedTickers[i];
        setScanStatus(`Analyzing ${ticker} (${i+1}/${selectedTickers.length})`);
        
        const result = await analyzeStock(ticker);
        if (result) {
          results.push(result);
        }
        
        // Avoid API rate limits
        if (i < selectedTickers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      setStockAnalysis(results);
      setScanStatus('complete');
    } catch (error) {
      console.error('Error analyzing stocks:', error);
      setError(`Error analyzing stocks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle ticker input change
  const handleTickerChange = (e) => {
    const tickers = e.target.value.toUpperCase().split(',').map(t => t.trim()).filter(t => t);
    setSelectedTickers(tickers);
  };

  const filteredStocks = stockAnalysis.filter(stock => 
    stock.ticker.toLowerCase().includes(tickerFilter.toLowerCase()) ||
    stock.company.toLowerCase().includes(tickerFilter.toLowerCase())
  );

  const getCurrentValuation = (stock) => {
    if (stock.currentPrice <= stock.buyBelow) {
      return 'text-green-600 bg-green-50';
    } else if (stock.currentPrice <= stock.intrinsicValue) {
      return 'text-yellow-600 bg-yellow-50';
    }
    return 'text-red-600 bg-red-50';
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">S&P 500 Value Analysis - Conservative Owner Earnings Approach</CardTitle>
          <p className="text-gray-600">Based on actual owner earnings calculations with appropriate margins of safety</p>
          <p className="text-sm text-gray-600 mt-2">"Price is what you pay, value is what you get."</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Tickers to Analyze (comma-separated):</label>
              <input
                type="text"
                value={selectedTickers.join(', ')}
                onChange={handleTickerChange}
                className="w-full p-2 border rounded mt-1"
                placeholder="AAPL, MSFT, GOOGL, etc."
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={analyzeStocks}
                disabled={loading || selectedTickers.length === 0}
                className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? scanStatus : 'Analyze Selected Stocks'}
              </button>
              
              {stockAnalysis.length > 0 && (
                <span className="text-sm text-gray-600">
                  {stockAnalysis.length} stocks analyzed
                </span>
              )}
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            This analysis uses conservative owner earnings-based DCF methodology with growth rates of 2-6%, 
            discount rates of 9-12% based on business quality, terminal growth of 2%, and margins of safety of 25-50%.
          </p>
          
          {stockAnalysis.length > 0 && (
            <>
              <div className="my-4">
                <input
                  type="text"
                  placeholder="Filter by ticker or company name..."
                  className="w-full p-2 border rounded"
                  value={tickerFilter}
                  onChange={(e) => setTickerFilter(e.target.value)}
                />
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border text-left">Company</th>
                      <th className="p-2 border text-right">Current Price</th>
                      <th className="p-2 border text-right">Intrinsic Value</th>
                      <th className="p-2 border text-right">Buy Below</th>
                      <th 
                        className="p-2 border text-right cursor-pointer"
                        onClick={() => handleSortChange('valuationRatio')}
                      >
                        Price/Value
                        {sortBy === 'valuationRatio' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                      </th>
                      <th 
                        className="p-2 border text-right cursor-pointer"
                        onClick={() => handleSortChange('upside')}
                      >
                        Potential Upside
                        {sortBy === 'upside' && (sortOrder === 'asc' ? ' ↓' : ' ↑')}
                      </th>
                      <th 
                        className="p-2 border text-right cursor-pointer"
                        onClick={() => handleSortChange('percentToBuyPoint')}
                      >
                        % Above Buy Point
                        {sortBy === 'percentToBuyPoint' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.map((stock) => (
                      <tr key={stock.ticker}>
                        <td className="p-2 border font-medium">{stock.ticker} - {stock.company}</td>
                        <td className="p-2 border text-right">${stock.currentPrice.toFixed(2)}</td>
                        <td className="p-2 border text-right text-blue-600">${stock.intrinsicValue.toFixed(2)}</td>
                        <td className="p-2 border text-right text-green-600">${stock.buyBelow.toFixed(2)}</td>
                        <td className={`p-2 border text-right ${
                          stock.valuationRatio <= 0.9 ? 'text-green-600' : 
                          stock.valuationRatio <= 1.1 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {stock.valuationRatio}x
                        </td>
                        <td className={`p-2 border text-right ${stock.upside > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.upside > 0 ? '+' : ''}{stock.upside}%
                        </td>
                        <td className={`p-2 border text-right ${
                          stock.percentToBuyPoint <= 0 ? 'text-green-600' : 
                          stock.percentToBuyPoint <= 15 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {stock.percentToBuyPoint <= 0 ? 'Below Buy Point' : `+${stock.percentToBuyPoint.toFixed(1)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {stockAnalysis.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {filteredStocks.map((stock) => (
            <Card key={stock.ticker} className="bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{stock.ticker} - {stock.company}</h2>
                    <p className="text-sm text-gray-600 mt-1">Economic Moat: {stock.moat}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Current Price: <span className="font-bold">${stock.currentPrice.toFixed(2)}</span></p>
                    <p className="text-sm">Intrinsic Value: <span className="font-bold text-blue-600">${stock.intrinsicValue.toFixed(2)}</span></p>
                    <p className="text-sm">Buy Below: <span className="font-bold text-green-600">${stock.buyBelow.toFixed(2)}</span></p>
                    <p className="text-sm">
                      Price/Value: <span className={`font-bold ${
                        stock.valuationRatio <= 0.9 ? 'text-green-600' : 
                        stock.valuationRatio <= 1.1 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{stock.valuationRatio}x</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm"><span className="font-semibold">Quality Metrics:</span> {stock.qualityMetrics}</p>
                  <p className="text-sm mt-2"><span className="font-semibold">Investment Rationale:</span> {stock.rationale}</p>
                  <div className={`mt-4 p-3 rounded-lg ${getCurrentValuation(stock)}`}>
                    <p className="text-sm font-semibold">Current Assessment: {stock.assessment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardContent className="p-6">
          <p className="text-gray-600 font-semibold">Methodology Insights:</p>
          <p className="mt-2 text-sm text-gray-600">
            The valuations above reflect our conservative owner earnings approach, which is based on Warren Buffett's 
            methodology. We calculate owner earnings (Operating Cash Flow - Maintenance CapEx), project future earnings 
            with conservative growth rates, and discount back to present value. We then apply a margin of safety based 
            on business quality and predictability.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            "The stock market is a device for transferring money from the impatient to the patient." - Warren Buffett
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevisedBuffettSP500Analysis;
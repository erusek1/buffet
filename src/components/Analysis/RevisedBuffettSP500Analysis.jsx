import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../UI/Card';

const RevisedBuffettSP500Analysis = () => {
  // Initialize with more accurate, conservative valuations based on actual owner earnings
  const [stockAnalysis, setStockAnalysis] = useState([
    {
      ticker: "CVX",
      company: "Chevron Corporation",
      currentPrice: 150.31,
      intrinsicValue: 196.75,
      buyBelow: 147.57,
      moat: "Scale advantages, integrated operations, strong balance sheet",
      qualityMetrics: "High FCF generation, strong dividend coverage, low debt",
      rationale: "Energy infrastructure essential, disciplined capital allocation",
      assessment: "Near buy point. Energy prices could create volatility."
    },
    {
      ticker: "MCK",
      company: "McKesson Corporation",
      currentPrice: 590.26,
      intrinsicValue: 449.26,
      buyBelow: 336.94,
      moat: "Scale advantages in healthcare distribution, high switching costs",
      qualityMetrics: "Stable cash flows, improving margins, essential service provider",
      rationale: "Critical healthcare infrastructure, regulatory barriers",
      assessment: "Significantly overvalued despite business quality. Wait for better entry point."
    },
    {
      ticker: "BRK.B",
      company: "Berkshire Hathaway",
      currentPrice: 451.84,
      intrinsicValue: 365.07,
      buyBelow: 273.80,
      moat: "Diversified operations, exceptional capital allocation",
      qualityMetrics: "Strong insurance float, high-quality subsidiaries",
      rationale: "Collection of excellent businesses but price matters",
      assessment: "Overvalued at current prices. Would be interesting below $274."
    },
    {
      ticker: "CAT",
      company: "Caterpillar Inc.",
      currentPrice: 361.07,
      intrinsicValue: 205.72,
      buyBelow: 154.29,
      moat: "Brand strength, dealer network, aftermarket parts",
      qualityMetrics: "Strong service revenues, improving margins",
      rationale: "Infrastructure spending tailwinds, but cyclical risks",
      assessment: "Significantly overvalued. Wait for cyclical downturn to create opportunity."
    },
    {
      ticker: "CI",
      company: "Cigna Group",
      currentPrice: 279.32,
      intrinsicValue: 400.22,
      buyBelow: 300.16,
      moat: "Scale in healthcare services, integrated model",
      qualityMetrics: "Stable earnings, strong cash generation",
      rationale: "Essential healthcare services, growing pharmacy business",
      assessment: "Potentially undervalued. Most interesting current opportunity."
    },
    {
      ticker: "UNP",
      company: "Union Pacific",
      currentPrice: 231.82,
      intrinsicValue: 125.10,
      buyBelow: 93.82,
      moat: "Irreplaceable rail network, high barriers to entry",
      qualityMetrics: "Strong pricing power, improving operating ratios",
      rationale: "Essential infrastructure with pricing power",
      assessment: "Significantly overvalued. Wait for much better entry point."
    },
    {
      ticker: "WM",
      company: "Waste Management",
      currentPrice: 206.58,
      intrinsicValue: 99.74,
      buyBelow: 74.81,
      moat: "Hard-to-replicate landfill network, local monopolies",
      qualityMetrics: "Stable cash flows, pricing power, essential service",
      rationale: "Predictable earnings, high barriers to entry",
      assessment: "Significantly overvalued despite excellent business quality."
    }
  ]);

  const [tickerFilter, setTickerFilter] = useState('');
  const [sortBy, setSortBy] = useState('valuationRatio');
  const [sortOrder, setSortOrder] = useState('asc');

  // Calculate additional metrics and transform data for display
  useEffect(() => {
    const enhancedData = stockAnalysis.map(stock => ({
      ...stock,
      valuationRatio: parseFloat((stock.currentPrice / stock.intrinsicValue).toFixed(2)),
      upside: parseFloat((stock.intrinsicValue / stock.currentPrice * 100 - 100).toFixed(2)),
      marginOfSafetyPercent: parseFloat(((1 - stock.buyBelow / stock.intrinsicValue) * 100).toFixed(2)),
      percentToBuyPoint: parseFloat(((stock.currentPrice / stock.buyBelow - 1) * 100).toFixed(2))
    }));

    // Sort data
    let sortedData = [...enhancedData];
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
  }, [sortBy, sortOrder]);

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
          <CardTitle className="text-2xl">Revised S&P 500 Value Analysis - Conservative Owner Earnings Approach</CardTitle>
          <p className="text-gray-600">Based on actual owner earnings calculations with appropriate margins of safety</p>
          <p className="text-sm text-gray-600 mt-2">"Price is what you pay, value is what you get."</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            This analysis uses conservative owner earnings-based DCF methodology with growth rates of 2-6%, 
            discount rates of 9-12% based on business quality, terminal growth of 2%, and margins of safety of 25-50%.
          </p>
          
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
        </CardContent>
      </Card>

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
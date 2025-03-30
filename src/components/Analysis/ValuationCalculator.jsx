import React, { useState, useEffect } from 'react';
import { getCompanyFinancials } from '../../api/fmpService';
import calculationService from '../../services/analysis/calculationService';
import dataProcessingService from '../../services/analysis/dataProcessingService';

const ValuationCalculator = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [valuation, setValuation] = useState(null);
  
  // Custom inputs for valuation parameters
  const [inputs, setInputs] = useState({
    growthRate: 4,
    yearsProjected: 10,
    discountRate: 10,
    terminalGrowthRate: 2,
    marginOfSafety: 25
  });
  
  // Fetch financial data when ticker changes
  const fetchFinancialData = async () => {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCompanyFinancials(ticker);
      const processedData = dataProcessingService.processFinancialData(data);
      setFinancialData(processedData);
      
      // Auto-calculate valuation
      performValuation(processedData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setError(`Error fetching data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Perform valuation calculation
  const performValuation = (data = financialData) => {
    if (!data) return;
    
    try {
      const result = calculationService.performValuation(data);
      setValuation(result);
      
      // Update inputs based on calculated values
      const growthRateValue = parseFloat(result.projectedGrowthRate);
      const discountRateValue = parseFloat(result.discountRate);
      const marginOfSafetyValue = parseFloat(result.marginOfSafety);
      
      setInputs(prev => ({
        ...prev,
        growthRate: isNaN(growthRateValue) ? prev.growthRate : growthRateValue,
        discountRate: isNaN(discountRateValue) ? prev.discountRate : discountRateValue,
        marginOfSafety: isNaN(marginOfSafetyValue) ? prev.marginOfSafety : marginOfSafetyValue
      }));
    } catch (error) {
      console.error('Error performing valuation:', error);
      setError(`Error calculating valuation: ${error.message}`);
    }
  };
  
  // Handle custom valuation with user inputs
  const handleCustomValuation = () => {
    if (!financialData) return;
    
    try {
      // Extract the most recent owner earnings from the financial data
      const income = financialData.incomeStatements[0];
      const cashFlow = financialData.cashFlows[0];
      const currentBalance = financialData.balanceSheets[0];
      const previousBalance = financialData.balanceSheets[1];
      
      // Calculate owner earnings
      const ownerEarnings = calculationService.calculateOwnerEarnings(
        income, cashFlow, previousBalance, currentBalance
      );
      
      // Get shares outstanding
      const sharesOutstanding = financialData.quote.sharesOutstanding || 
                               (financialData.profile.mktCap / financialData.quote.price);
      
      // Growth rate as decimal
      const growthRate = inputs.growthRate / 100;
      
      // Discount rate as decimal
      const discountRate = inputs.discountRate / 100;
      
      // Terminal growth rate as decimal
      const terminalGrowthRate = inputs.terminalGrowthRate / 100;
      
      // Margin of safety as decimal
      const marginOfSafety = inputs.marginOfSafety / 100;
      
      // Calculate intrinsic value
      const intrinsicValue = calculationService.calculateIntrinsicValue(
        ownerEarnings,
        growthRate,
        discountRate,
        terminalGrowthRate,
        inputs.yearsProjected
      );
      
      // Calculate per share value
      const intrinsicValuePerShare = calculationService.calculateIntrinsicValuePerShare(
        intrinsicValue,
        sharesOutstanding
      );
      
      // Calculate buy price
      const buyPrice = calculationService.calculateBuyPrice(
        intrinsicValuePerShare,
        marginOfSafety
      );
      
      // Update valuation with custom calculations
      setValuation(prev => ({
        ...prev,
        projectedGrowthRate: `${(growthRate * 100).toFixed(2)}%`,
        discountRate: `${(discountRate * 100).toFixed(2)}%`,
        marginOfSafety: `${(marginOfSafety * 100).toFixed(2)}%`,
        intrinsicValuePerShare: intrinsicValuePerShare ? intrinsicValuePerShare.toFixed(2) : 'N/A',
        buyPrice: buyPrice ? buyPrice.toFixed(2) : 'N/A',
        valuationStatus: financialData.quote.price <= buyPrice ? 'BUY' : 
                        financialData.quote.price <= intrinsicValuePerShare ? 'FAIR' : 'OVERVALUED',
        upsidePercent: intrinsicValuePerShare ? 
                      ((intrinsicValuePerShare / financialData.quote.price - 1) * 100).toFixed(2) + '%' : 'N/A'
      }));
    } catch (error) {
      console.error('Error performing custom valuation:', error);
      setError(`Error calculating custom valuation: ${error.message}`);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  // Trigger custom valuation when inputs change
  useEffect(() => {
    if (financialData) {
      handleCustomValuation();
    }
  }, [inputs]);
  
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Buffett-Style Intrinsic Value Calculator</h1>
      
      <div className="mb-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter stock ticker (e.g., KO)"
            className="flex-grow p-2 border rounded"
          />
          <button
            onClick={fetchFinancialData}
            disabled={loading || !ticker}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </div>
        {error && <p className="mt-2 text-red-600">{error}</p>}
      </div>
      
      {valuation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p><span className="font-semibold">Company:</span> {valuation.name} ({valuation.ticker})</p>
              <p><span className="font-semibold">Current Price:</span> ${financialData.quote.price.toFixed(2)}</p>
              <p><span className="font-semibold">Business Quality:</span> {valuation.businessQuality}</p>
              <p><span className="font-semibold">Owner Earnings Per Share:</span> ${valuation.ownerEarningsPerShare ? valuation.ownerEarningsPerShare.toFixed(2) : 'N/A'}</p>
              <p><span className="font-semibold">Historical Growth Rate:</span> {valuation.growthRate}</p>
            </div>
            
            <h2 className="text-lg font-semibold mt-6 mb-4">Valuation Parameters</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-gray-700">Projected Growth Rate (%)</span>
                <input
                  type="number"
                  name="growthRate"
                  value={inputs.growthRate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  step="0.1"
                />
              </label>
              
              <label className="block">
                <span className="text-gray-700">Years to Project</span>
                <input
                  type="number"
                  name="yearsProjected"
                  value={inputs.yearsProjected}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                />
              </label>
              
              <label className="block">
                <span className="text-gray-700">Discount Rate (%)</span>
                <input
                  type="number"
                  name="discountRate"
                  value={inputs.discountRate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  step="0.1"
                />
              </label>
              
              <label className="block">
                <span className="text-gray-700">Terminal Growth Rate (%)</span>
                <input
                  type="number"
                  name="terminalGrowthRate"
                  value={inputs.terminalGrowthRate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  step="0.1"
                />
              </label>
              
              <label className="block">
                <span className="text-gray-700">Margin of Safety (%)</span>
                <input
                  type="number"
                  name="marginOfSafety"
                  value={inputs.marginOfSafety}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  step="1"
                />
              </label>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Valuation Results</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Intrinsic Value Per Share</p>
                <p className="text-2xl font-bold text-blue-600">${valuation.intrinsicValuePerShare}</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Buy Below Price (with Margin of Safety)</p>
                <p className="text-2xl font-bold text-green-600">${valuation.buyPrice}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Graham Number</p>
                <p className="text-2xl font-bold">${valuation.grahamNumber}</p>
              </div>
              
              <div className={`p-4 rounded-lg ${
                valuation.valuationStatus === 'BUY' ? 'bg-green-100' :
                valuation.valuationStatus === 'FAIR' ? 'bg-yellow-100' :
                'bg-red-100'
              }`}>
                <p className="text-sm text-gray-600">Valuation Status</p>
                <p className={`text-2xl font-bold ${
                  valuation.valuationStatus === 'BUY' ? 'text-green-600' :
                  valuation.valuationStatus === 'FAIR' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {valuation.valuationStatus}
                </p>
                <p className="text-sm mt-1">
                  {valuation.valuationStatus === 'BUY' ? 
                    'Stock is trading below buy price with adequate margin of safety.' :
                    valuation.valuationStatus === 'FAIR' ? 
                    'Stock is trading below intrinsic value but without sufficient margin of safety.' :
                    'Stock is trading above intrinsic value.'
                  }
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Upside Potential</p>
                <p className="text-2xl font-bold text-purple-600">{valuation.upsidePercent}</p>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold mt-6 mb-4">Key Metrics</h2>
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-2">
              <p><span className="font-semibold">ROE:</span> {valuation.additionalMetrics.roe}</p>
              <p><span className="font-semibold">ROA:</span> {valuation.additionalMetrics.roa}</p>
              <p><span className="font-semibold">Debt/Equity:</span> {valuation.additionalMetrics.debtToEquity}</p>
              <p><span className="font-semibold">Current Ratio:</span> {valuation.additionalMetrics.currentRatio}</p>
              <p><span className="font-semibold">Gross Margin:</span> {valuation.additionalMetrics.grossMargin}</p>
              <p><span className="font-semibold">Operating Margin:</span> {valuation.additionalMetrics.operatingMargin}</p>
              <p><span className="font-semibold">Net Margin:</span> {valuation.additionalMetrics.netMargin}</p>
              <p><span className="font-semibold">P/E Ratio:</span> {valuation.additionalMetrics.peRatio}</p>
              <p><span className="font-semibold">P/B Ratio:</span> {valuation.additionalMetrics.pbRatio}</p>
            </div>
          </div>
        </div>
      )}
      
      {!valuation && !loading && (
        <div className="p-6 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-600">Enter a stock ticker and click "Analyze" to perform a Buffett-style valuation.</p>
          <p className="text-sm mt-4 text-gray-500">
            "Price is what you pay. Value is what you get." - Warren Buffett
          </p>
        </div>
      )}
    </div>
  );
};

export default ValuationCalculator;
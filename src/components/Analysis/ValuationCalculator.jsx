import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { 
  normalizeGrowthRate, 
  determineDiscountRate, 
  determineMarginOfSafety,
  calculateIntrinsicValue,
  calculateGrahamNumber,
  calculateOwnerEarnings,
  assessValuation, 
  classifyBusinessQuality
} from '../../services/analysis/calculationService';
import { calculateGrowthRate, structureFinancialData } from '../../services/analysis/dataProcessingService';
import { getCompanyProfile, getFinancialStatements } from '../../api/fmpService';
=======
import { getCompanyFinancials } from '../../api/fmpService';
import calculationService from '../../services/analysis/calculationService';
import dataProcessingService from '../../services/analysis/dataProcessingService';
import apiConfig from '../../api/apiConfig';
>>>>>>> 8b6e456c631ecf3a6ae9761eb36ca24777a0a583

const ValuationCalculator = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [valuation, setValuation] = useState(null);
  
  // Valuation inputs with default values
  const [inputs, setInputs] = useState({
    projectedGrowthRate: 0,
    yearsToProject: 10,
    discountRate: 10,
    terminalGrowthRate: 2,
    marginOfSafety: 25
  });
<<<<<<< HEAD

=======
  
  // Check API configuration on mount
  useEffect(() => {
    console.log("API Config:", {
      baseUrl: apiConfig.baseUrl,
      keyIsSet: apiConfig.apiKey ? "Yes" : "No",
      keyStartsWith: apiConfig.apiKey ? apiConfig.apiKey.substring(0, 5) : "N/A",
      endpoints: apiConfig.endpoints
    });
  }, []);
  
  // Fetch financial data when ticker changes
  const fetchFinancialData = async () => {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching data for ${ticker}...`);
      const data = await getCompanyFinancials(ticker);
      console.log("Data received:", data);
      
      if (!data || !data.profile || !data.quote) {
        throw new Error("No data returned from API or missing required information");
      }
      
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
  
>>>>>>> 8b6e456c631ecf3a6ae9761eb36ca24777a0a583
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Calculate valuation based on current inputs
  const calculateValuation = () => {
    if (!companyData) return;
    
    // Destructure necessary data
    const { profile, financials, sharesOutstanding, metrics, balanceMetrics } = companyData;
    
    // Calculate owner earnings
    const ownerEarnings = calculateOwnerEarnings(financials, sharesOutstanding);
    
    // Calculate intrinsic value
    const intrinsicValue = calculateIntrinsicValue(
      ownerEarnings,
      inputs.projectedGrowthRate,
      inputs.discountRate,
      inputs.terminalGrowthRate,
      inputs.yearsToProject
    );
    
    // Calculate Graham Number if EPS and book value are available
    const grahamNumber = calculateGrahamNumber(
      profile.eps || 0,
      balanceMetrics?.bookValue || 0
    );
    
    // Assess valuation status
    const assessment = assessValuation(
      profile.price,
      intrinsicValue,
      inputs.marginOfSafety
    );
    
    // Set valuation state
    setValuation({
      ownerEarnings,
      intrinsicValue,
      grahamNumber,
      ...assessment
    });
  };

  // Recalculate valuation when inputs change
  useEffect(() => {
    if (companyData) {
      calculateValuation();
    }
  }, [inputs, companyData]);

  // Analyze a ticker symbol
  const analyzeStock = async () => {
    if (!ticker) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch company profile and financial data
      const profileData = await getCompanyProfile(ticker);
      
      if (!profileData || profileData.length === 0) {
        throw new Error('Company not found');
      }
      
      const financialData = await getFinancialStatements(ticker);
      
      // Structure and process the data
      const structuredData = structureFinancialData({
        profile: profileData,
        ...financialData
      });
      
      // Determine business quality
      const businessQuality = classifyBusinessQuality(
        structuredData.metrics,
        profileData[0].sector,
        profileData[0].industry
      );
      
      // Calculate historical growth rate
      const historicalGrowthRate = calculateGrowthRate(
        financialData.incomeStatement,
        'netIncome'
      );
      
      // Set recommended valuation parameters
      const normalizedGrowthRate = normalizeGrowthRate(historicalGrowthRate, businessQuality);
      const recommendedDiscountRate = determineDiscountRate(businessQuality, structuredData.metrics);
      const recommendedSafety = determineMarginOfSafety(businessQuality);
      
      // Update inputs with recommended values
      setInputs({
        projectedGrowthRate: normalizedGrowthRate,
        yearsToProject: 10,
        discountRate: recommendedDiscountRate,
        terminalGrowthRate: 2,
        marginOfSafety: recommendedSafety
      });
      
      // Store the company data
      setCompanyData({
        ...structuredData,
        businessQuality,
        historicalGrowthRate
      });
    } catch (err) {
      setError(err.message || 'Error fetching data');
      setCompanyData(null);
      setValuation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Buffett-Style Intrinsic Value Calculator</h1>
      
<<<<<<< HEAD
      {/* Stock Search */}
      <div className="mb-6 flex">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Enter stock ticker (e.g., KHC)"
          className="px-3 py-2 border border-gray-300 rounded-l-md w-64"
        />
        <button 
          onClick={analyzeStock}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
=======
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
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <div className="mt-2 text-sm">
              <p>Debugging tips:</p>
              <ul className="list-disc pl-5">
                <li>Check if you're using a valid stock ticker (e.g., AAPL, MSFT, KO)</li>
                <li>API key: {apiConfig.apiKey ? apiConfig.apiKey.substring(0, 5) + "..." + apiConfig.apiKey.substring(apiConfig.apiKey.length - 5) : "Not set"}</li>
                <li>Try refreshing the page</li>
              </ul>
            </div>
          </div>
        )}
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
              <p><span className="font-semibold">ROE:</span> {valuation.additionalMetrics?.roe || 'N/A'}</p>
              <p><span className="font-semibold">ROA:</span> {valuation.additionalMetrics?.roa || 'N/A'}</p>
              <p><span className="font-semibold">Debt/Equity:</span> {valuation.additionalMetrics?.debtToEquity || 'N/A'}</p>
              <p><span className="font-semibold">Current Ratio:</span> {valuation.additionalMetrics?.currentRatio || 'N/A'}</p>
              <p><span className="font-semibold">Gross Margin:</span> {valuation.additionalMetrics?.grossMargin || 'N/A'}</p>
              <p><span className="font-semibold">Operating Margin:</span> {valuation.additionalMetrics?.operatingMargin || 'N/A'}</p>
              <p><span className="font-semibold">Net Margin:</span> {valuation.additionalMetrics?.netMargin || 'N/A'}</p>
              <p><span className="font-semibold">P/E Ratio:</span> {valuation.additionalMetrics?.peRatio || 'N/A'}</p>
              <p><span className="font-semibold">P/B Ratio:</span> {valuation.additionalMetrics?.pbRatio || 'N/A'}</p>
            </div>
          </div>
>>>>>>> 8b6e456c631ecf3a6ae9761eb36ca24777a0a583
        </div>
      )}
      
      {companyData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Company:</span> {companyData.profile.companyName} ({companyData.profile.symbol})</p>
              <p><span className="font-semibold">Current Price:</span> ${companyData.profile.price.toFixed(2)}</p>
              <p><span className="font-semibold">Business Quality:</span> {companyData.businessQuality}</p>
              <p><span className="font-semibold">Owner Earnings Per Share:</span> ${valuation?.ownerEarnings.toFixed(2)}</p>
              <p><span className="font-semibold">Historical Growth Rate:</span> {companyData.historicalGrowthRate.toFixed(2)}%</p>
            </div>
          </div>
          
          {/* Valuation Parameters */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Valuation Parameters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm">
                  Projected Growth Rate (%)
                  <input
                    type="number"
                    name="projectedGrowthRate"
                    value={inputs.projectedGrowthRate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </label>
              </div>
              
              <div>
                <label className="block text-sm">
                  Years to Project
                  <input
                    type="number"
                    name="yearsToProject"
                    value={inputs.yearsToProject}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </label>
              </div>
              
              <div>
                <label className="block text-sm">
                  Discount Rate (%)
                  <input
                    type="number"
                    name="discountRate"
                    value={inputs.discountRate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </label>
              </div>
              
              <div>
                <label className="block text-sm">
                  Terminal Growth Rate (%)
                  <input
                    type="number"
                    name="terminalGrowthRate"
                    value={inputs.terminalGrowthRate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </label>
              </div>
              
              <div>
                <label className="block text-sm">
                  Margin of Safety (%)
                  <input
                    type="number"
                    name="marginOfSafety"
                    value={inputs.marginOfSafety}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </label>
              </div>
            </div>
          </div>
          
          {/* Valuation Results */}
          {valuation && (
            <>
              <div>
                <h2 className="text-lg font-semibold mb-4">Valuation Results</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Intrinsic Value Per Share</p>
                    <p className="text-2xl font-bold text-blue-600">${valuation.intrinsicValue.toFixed(2)}</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Buy Below Price (with Margin of Safety)</p>
                    <p className="text-2xl font-bold text-green-600">${valuation.safetyPrice.toFixed(2)}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Graham Number</p>
                    <p className="text-2xl font-bold">${valuation.grahamNumber.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div>
              <h2 className="text-lg font-semibold mb-4">Valuation Status</h2>
<div className={`p-4 rounded-lg ${
  valuation.status === 'BUY' 
    ? 'bg-green-100 text-green-800' 
    : valuation.status === 'HOLD/WATCH'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800'
}`}>
  <p className="font-bold">{valuation.status}</p>
  <p>{valuation.description}</p>
</div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Upside Potential</p>
                  <p className="text-2xl font-bold">
                    {valuation.upsidePercentage > 0 ? '+' : ''}
                    {valuation.upsidePercentage.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="col-span-1 md:col-span-2">
                <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">ROE</p>
                    <p className="font-bold">{companyData.metrics?.roe.toFixed(2)}%</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">ROA</p>
                    <p className="font-bold">{companyData.metrics?.roa.toFixed(2)}%</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Debt/Equity</p>
                    <p className="font-bold">
                      {companyData.metrics?.debtToEquity 
                        ? companyData.metrics.debtToEquity.toFixed(2) 
                        : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Current Ratio</p>
                    <p className="font-bold">{companyData.metrics?.currentRatio.toFixed(2)}</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Gross Margin</p>
                    <p className="font-bold">{companyData.metrics?.grossMargin.toFixed(2)}%</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Operating Margin</p>
                    <p className="font-bold">{companyData.metrics?.operatingMargin.toFixed(2)}%</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Net Margin</p>
                    <p className="font-bold">{companyData.metrics?.netMargin.toFixed(2)}%</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">P/E Ratio</p>
                    <p className="font-bold">
                      {companyData.profile.pe 
                        ? companyData.profile.pe.toFixed(2) 
                        : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">P/B Ratio</p>
                    <p className="font-bold">
                      {companyData.balanceMetrics?.bookValue && companyData.profile.price
                        ? (companyData.profile.price / companyData.balanceMetrics.bookValue).toFixed(2)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2 mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="italic text-gray-700">
                  "Price is what you pay. Value is what you get." - Warren Buffett
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ValuationCalculator;
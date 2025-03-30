import React, { useState, useEffect } from 'react';
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
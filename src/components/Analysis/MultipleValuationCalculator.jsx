// src/components/Analysis/MultipleValuationCalculator.jsx
import React, { useState, useEffect } from 'react';
import { getCompanyFinancials } from '../../api/fmpService';
import calculationService from '../../services/analysis/calculationService';
import dataProcessingService from '../../services/analysis/dataProcessingService';

const MultipleValuationCalculator = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  
  const [inputs, setInputs] = useState({
    // DCF Inputs
    currentEarnings: 25.3,
    growthRate: 5,
    yearsProjected: 10,
    discountRate: 10,
    terminalGrowthRate: 2,
    marginOfSafety: 25,
    
    // Graham Number Inputs
    eps: 25.3,
    bookValue: 180,
    
    // PE Multiple Inputs
    peRatio: 15,
    
    // Earnings Power Value Inputs
    operatingEarnings: 28.4,
    maintainenceCapex: 3.1,
    workingCapitalChange: 1.2,
    
    // Asset-Based Inputs
    totalAssets: 185.6,
    totalLiabilities: 120.4,
    
    // EBIT Multiple
    ebit: 30.2,
    enterpriseMultiple: 12
  });
  
  const [results, setResults] = useState({
    dcfValue: 0,
    grahamValue: 0,
    peValue: 0,
    epvValue: 0,
    assetValue: 0,
    ebitValue: 0
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
      
      // Update inputs based on fetched data
      updateInputsFromFinancialData(processedData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setError(`Error fetching data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateInputsFromFinancialData = (data) => {
    if (!data) return;

    try {
      const { incomeStatements, balanceSheets, cashFlows, quote } = data;
      
      // Extract relevant data from the most recent statements
      const income = incomeStatements[0];
      const balance = balanceSheets[0];
      const cashFlow = cashFlows[0];
      
      // Calculate owner earnings
      const ownerEarnings = calculationService.calculateOwnerEarnings(
        income, cashFlow, balanceSheets[1], balance
      );
      
      // Get shares outstanding
      const sharesOutstanding = quote.sharesOutstanding || 
                               (data.profile.mktCap / quote.price);
      
      // Update inputs state
      setInputs({
        // DCF Inputs
        currentEarnings: ownerEarnings / sharesOutstanding,
        growthRate: 5, // Conservative default
        yearsProjected: 10,
        discountRate: 10,
        terminalGrowthRate: 2,
        marginOfSafety: 25,
        
        // Graham Number Inputs
        eps: income.eps || income.netIncome / sharesOutstanding,
        bookValue: balance.totalStockholdersEquity / sharesOutstanding,
        
        // PE Multiple Inputs
        peRatio: 15, // Conservative industry average
        
        // Earnings Power Value Inputs
        operatingEarnings: income.operatingIncome / sharesOutstanding,
        maintainenceCapex: Math.abs(cashFlow.capitalExpenditure) / sharesOutstanding,
        workingCapitalChange: 
          ((balance.totalCurrentAssets - balance.totalCurrentLiabilities) - 
           (balanceSheets[1].totalCurrentAssets - balanceSheets[1].totalCurrentLiabilities)) / sharesOutstanding,
        
        // Asset-Based Inputs
        totalAssets: balance.totalAssets / sharesOutstanding,
        totalLiabilities: balance.totalLiabilities / sharesOutstanding,
        
        // EBIT Multiple
        ebit: income.operatingIncome / sharesOutstanding,
        enterpriseMultiple: 12 // Conservative default
      });
    } catch (error) {
      console.error('Error updating inputs from financial data:', error);
      setError(`Error processing financial data: ${error.message}`);
    }
  };
  
  const calculateValues = () => {
    // 1. DCF Calculation
    const growthDecimal = inputs.growthRate / 100;
    const discountDecimal = inputs.discountRate / 100;
    const terminalGrowthDecimal = inputs.terminalGrowthRate / 100;
    const safetyDecimal = inputs.marginOfSafety / 100;
    
    const futureEarnings = inputs.currentEarnings * Math.pow(1 + growthDecimal, inputs.yearsProjected);
    const terminalValue = futureEarnings * (1 + terminalGrowthDecimal) / (discountDecimal - terminalGrowthDecimal);
    
    let presentValueOfEarnings = 0;
    for (let year = 1; year <= inputs.yearsProjected; year++) {
      const yearEarnings = inputs.currentEarnings * Math.pow(1 + growthDecimal, year);
      presentValueOfEarnings += yearEarnings / Math.pow(1 + discountDecimal, year);
    }
    
    const presentValueOfTerminal = terminalValue / Math.pow(1 + discountDecimal, inputs.yearsProjected);
    const dcfValue = (presentValueOfEarnings + presentValueOfTerminal) * (1 - safetyDecimal);
    
    // 2. Graham Number
    const grahamValue = Math.sqrt(22.5 * inputs.eps * inputs.bookValue);
    
    // 3. PE Multiple
    const peValue = inputs.eps * inputs.peRatio;
    
    // 4. Earnings Power Value
    const normalizedEarnings = inputs.operatingEarnings - inputs.maintainenceCapex - inputs.workingCapitalChange;
    const epvValue = normalizedEarnings * 12; // Using a multiple of 12 for stable businesses
    
    // 5. Asset-Based Value
    const assetValue = inputs.totalAssets - inputs.totalLiabilities;
    
    // 6. EBIT Multiple
    const ebitValue = inputs.ebit * inputs.enterpriseMultiple;
    
    setResults({
      dcfValue: dcfValue.toFixed(2),
      grahamValue: grahamValue.toFixed(2),
      peValue: peValue.toFixed(2),
      epvValue: epvValue.toFixed(2),
      assetValue: assetValue.toFixed(2),
      ebitValue: ebitValue.toFixed(2)
    });
  };
  
  useEffect(() => {
    calculateValues();
  }, [inputs]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Multiple Valuation Methods Calculator</h1>
        
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
              {loading ? 'Loading...' : 'Fetch Data'}
            </button>
          </div>
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          <p>This calculator demonstrates multiple valuation approaches. For most investors, the DCF and Graham Number methods are recommended starting points.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Input Parameters</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">DCF Valuation Inputs</h3>
              <div className="space-y-2">
                <label className="block text-sm">
                  <span>Current Owner Earnings Per Share ($)</span>
                  <input
                    type="number"
                    name="currentEarnings"
                    value={inputs.currentEarnings}
                    onChange={handleInputChange}
                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm p-2"
                    step="0.01"
                  />
                </label>
                
                <label className="block text-sm">
                  <span>Growth Rate (%)</span>
                  <input
                    type="number"
                    name="growthRate"
                    value={inputs.growthRate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm p-2"
                    step="0.1"
                  />
                </label>
                
                <label className="block text-sm">
                  <span>Discount Rate (%)</span>
                  <input
                    type="number"
                    name="discountRate"
                    value={inputs.discountRate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm p-2"
                    step="0.1"
                  />
                </label>
                
                <label className="block text-sm">
                  <span>Margin of Safety (%)</span>
                  <input
                    type="number"
                    name="marginOfSafety"
                    value={inputs.marginOfSafety}
                    onChange={handleInputChange}
                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm p-2"
                    step="1"
                  />
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Graham Number Inputs</h3>
              <div className="space-y-2">
                <label className="block text-sm">
                  <span>Earnings Per Share ($)</span>
                  <input
                    type="number"
                    name="eps"
                    value={inputs.eps}
                    onChange={handleInputChange}
                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm p-2"
                    step="0.01"
                  />
                </label>
                
                <label className="block text-sm">
                  <span>Book Value Per Share ($)</span>
                  // src/components/Analysis/MultipleValuationCalculator.jsx (continued)
                  <input
                    type="number"
                    name="bookValue"
                    value={inputs.bookValue}
                    onChange={handleInputChange}
                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm p-2"
                    step="0.01"
                  />
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">PE Multiple Inputs</h3>
              <div className="space-y-2">
                <label className="block text-sm">
                  <span>P/E Ratio</span>
                  <input
                    type="number"
                    name="peRatio"
                    value={inputs.peRatio}
                    onChange={handleInputChange}
                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm p-2"
                    step="0.1"
                  />
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">EBIT Multiple Inputs</h3>
              <div className="space-y-2">
                <label className="block text-sm">
                  <span>EBIT Per Share ($)</span>
                  <input
                    type="number"
                    name="ebit"
                    value={inputs.ebit}
                    onChange={handleInputChange}
                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm p-2"
                    step="0.01"
                  />
                </label>
                
                <label className="block text-sm">
                  <span>Enterprise Multiple</span>
                  <input
                    type="number"
                    name="enterpriseMultiple"
                    value={inputs.enterpriseMultiple}
                    onChange={handleInputChange}
                    className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm p-2"
                    step="0.1"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Valuation Results</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">DCF Valuation (Buffett's Approach)</p>
              <p className="text-2xl font-bold text-blue-600">${results.dcfValue}</p>
              <p className="text-xs text-gray-500 mt-1">Based on discounted owner earnings with margin of safety</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Graham Number</p>
              <p className="text-2xl font-bold text-green-600">${results.grahamValue}</p>
              <p className="text-xs text-gray-500 mt-1">Benjamin Graham's formula for defensive investors</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">PE-Based Value</p>
              <p className="text-2xl font-bold text-yellow-600">${results.peValue}</p>
              <p className="text-xs text-gray-500 mt-1">Based on selected P/E multiple</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Earnings Power Value</p>
              <p className="text-2xl font-bold text-purple-600">${results.epvValue}</p>
              <p className="text-xs text-gray-500 mt-1">Conservative estimate based on normalized earnings</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Asset-Based Value</p>
              <p className="text-2xl font-bold text-red-600">${results.assetValue}</p>
              <p className="text-xs text-gray-500 mt-1">Based on net asset value per share</p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">EBIT Multiple Value</p>
              <p className="text-2xl font-bold text-orange-600">${results.ebitValue}</p>
              <p className="text-xs text-gray-500 mt-1">Based on operating earnings and selected multiple</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Value Investing Wisdom</h3>
            <p className="text-sm text-gray-600">
              "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price. 
              Remember that the stock market is a manic depressive."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleValuationCalculator;
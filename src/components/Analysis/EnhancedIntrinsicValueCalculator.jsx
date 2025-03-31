import React, { useState, useEffect } from 'react';
import { getCompanyFinancials } from '../../api/fmpService';
import calculationService from '../../services/analysis/calculationService';
import dataProcessingService from '../../services/analysis/dataProcessingService';

const EnhancedIntrinsicValueCalculator = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  
  const [inputs, setInputs] = useState({
    // Current year owner earnings components
    currentEarnings: 0,
    depreciation: 0,
    capex: 0,
    workingCapitalChange: 0,
    
    // Historical owner earnings (5-year cycle)
    yearMinus1: { earnings: 0, depreciation: 0, capex: 0, workingCapital: 0 },
    yearMinus2: { earnings: 0, depreciation: 0, capex: 0, workingCapital: 0 },
    yearMinus3: { earnings: 0, depreciation: 0, capex: 0, workingCapital: 0 },
    yearMinus4: { earnings: 0, depreciation: 0, capex: 0, workingCapital: 0 },
    
    // Business quality and predictability assessment
    businessCategory: 'good', // excellent, good, fair, or cyclical
    
    // Growth and valuation inputs
    growthRate: 4, // Default to conservative GDP-like growth
    yearsProjected: 10,
    discountRate: 10,
    terminalGrowthRate: 2
  });

  const [results, setResults] = useState({
    currentOwnerEarnings: 0,
    averageOwnerEarnings: 0,
    futureEarnings: 0,
    presentValue: 0,
    terminalValue: 0,
    intrinsicValue: 0,
    safetyPrice: 0,
    marginOfSafety: 0
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
      const { incomeStatements, balanceSheets, cashFlows, profile } = data;
      
      // Ensure we have enough historical data
      if (incomeStatements.length < 5 || balanceSheets.length < 5 || cashFlows.length < 5) {
        setError("Insufficient historical data (need at least 5 years)");
        return;
      }
      
      // Extract current year and historical data
      const currentYearData = {
        currentEarnings: incomeStatements[0].netIncome,
        depreciation: cashFlows[0].depreciation,
        capex: Math.abs(cashFlows[0].capitalExpenditure),
        workingCapitalChange: calculateWorkingCapitalChange(balanceSheets[1], balanceSheets[0])
      };
      
      // Calculate historical data
      const yearMinus1 = {
        earnings: incomeStatements[1].netIncome,
        depreciation: cashFlows[1].depreciation,
        capex: Math.abs(cashFlows[1].capitalExpenditure),
        workingCapital: calculateWorkingCapitalChange(balanceSheets[2], balanceSheets[1])
      };
      
      const yearMinus2 = {
        earnings: incomeStatements[2].netIncome,
        depreciation: cashFlows[2].depreciation,
        capex: Math.abs(cashFlows[2].capitalExpenditure),
        workingCapital: calculateWorkingCapitalChange(balanceSheets[3], balanceSheets[2])
      };
      
      const yearMinus3 = {
        earnings: incomeStatements[3].netIncome,
        depreciation: cashFlows[3].depreciation,
        capex: Math.abs(cashFlows[3].capitalExpenditure),
        workingCapital: calculateWorkingCapitalChange(balanceSheets[4], balanceSheets[3])
      };
      
      const yearMinus4 = {
        earnings: incomeStatements.length > 4 ? incomeStatements[4].netIncome : 0,
        depreciation: cashFlows.length > 4 ? cashFlows[4].depreciation : 0,
        capex: cashFlows.length > 4 ? Math.abs(cashFlows[4].capitalExpenditure) : 0,
        workingCapital: balanceSheets.length > 5 ? calculateWorkingCapitalChange(balanceSheets[5], balanceSheets[4]) : 0
      };
      
      // Assess business quality
      const businessCategory = assessBusinessQuality(data);
      
      // Calculate appropriate growth rate based on historical performance
      const historicalGrowthRate = calculationService.calculateHistoricalGrowthRate(incomeStatements);
      const adjustedGrowthRate = Math.min(historicalGrowthRate, 15); // Cap at 15% for conservatism
      const growthRate = Math.max(2, adjustedGrowthRate); // Minimum 2%
      
      // Determine appropriate discount rate based on business quality
      const discountRate = determineDiscountRate(businessCategory);
      
      // Update inputs state
      setInputs({
        ...currentYearData,
        yearMinus1,
        yearMinus2,
        yearMinus3,
        yearMinus4,
        businessCategory,
        growthRate: parseFloat(growthRate.toFixed(1)),
        yearsProjected: 10,
        discountRate,
        terminalGrowthRate: 2
      });
    } catch (error) {
      console.error('Error updating inputs from financial data:', error);
      setError(`Error processing financial data: ${error.message}`);
    }
  };

  // Helper function to calculate working capital change
  const calculateWorkingCapitalChange = (prevYear, currentYear) => {
    const prevWorkingCapital = prevYear.totalCurrentAssets - prevYear.totalCurrentLiabilities;
    const currentWorkingCapital = currentYear.totalCurrentAssets - currentYear.totalCurrentLiabilities;
    return currentWorkingCapital - prevWorkingCapital;
  };

  // Helper function to assess business quality
  const assessBusinessQuality = (data) => {
    const { incomeStatements, balanceSheets } = data;
    
    // Calculate average ROE over last 5 years
    const roeValues = [];
    for (let i = 0; i < Math.min(incomeStatements.length, balanceSheets.length); i++) {
      const netIncome = incomeStatements[i].netIncome;
      const equity = balanceSheets[i].totalStockholdersEquity;
      if (equity > 0) {
        roeValues.push((netIncome / equity) * 100);
      }
    }
    
    const avgROE = roeValues.length > 0 ? 
      roeValues.reduce((sum, value) => sum + value, 0) / roeValues.length : 0;
    
    // Calculate earnings stability (standard deviation of growth rates)
    const growthRates = [];
    for (let i = 1; i < incomeStatements.length; i++) {
      const currentEarnings = incomeStatements[i-1].netIncome;
      const prevEarnings = incomeStatements[i].netIncome;
      if (prevEarnings > 0) {
        growthRates.push((currentEarnings / prevEarnings - 1) * 100);
      }
    }
    
    const avgGrowthRate = growthRates.length > 0 ?
      growthRates.reduce((sum, value) => sum + value, 0) / growthRates.length : 0;
    
    const growthStdDev = calculateStandardDeviation(growthRates);
    
    // Assess business quality based on metrics
    if (avgROE > 20 && growthStdDev < 15) {
      return 'excellent';
    } else if (avgROE > 15 && growthStdDev < 25) {
      return 'good';
    } else if (avgROE > 10 && growthStdDev < 40) {
      return 'fair';
    } else {
      return 'cyclical';
    }
  };

  // Helper function to calculate standard deviation
  const calculateStandardDeviation = (values) => {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(variance);
  };

  // Helper function to determine appropriate discount rate
  const determineDiscountRate = (businessCategory) => {
    switch(businessCategory) {
      case 'excellent':
        return 9;
      case 'good':
        return 10;
      case 'fair':
        return 11;
      case 'cyclical':
        return 12;
      default:
        return 10;
    }
  };

  // Calculate owner earnings for a specific year
  const calculateOwnerEarnings = (year) => {
    return year.earnings + 
           year.depreciation - 
           year.capex - 
           year.workingCapital;
  };

  // Calculate weighted average owner earnings
  const calculateAverageOwnerEarnings = () => {
    const currentYear = inputs.currentEarnings + 
                       inputs.depreciation - 
                       inputs.capex - 
                       inputs.workingCapitalChange;
    
    const historicalEarnings = [
      calculateOwnerEarnings(inputs.yearMinus1),
      calculateOwnerEarnings(inputs.yearMinus2),
      calculateOwnerEarnings(inputs.yearMinus3),
      calculateOwnerEarnings(inputs.yearMinus4)
    ];
    
    // Weight recent years more heavily (50/30/15/5 weighting)
    const weightedAverage = (
      (currentYear * 0.5) +
      (historicalEarnings[0] * 0.3) +
      (historicalEarnings[1] * 0.15) +
      (historicalEarnings[2] * 0.05)
    );
    
    return weightedAverage;
  };

  // Determine appropriate margin of safety
  const determineMarginOfSafety = (businessCategory) => {
    // Vary margin of safety based on business predictability
    switch(businessCategory) {
      case 'excellent': // Think Coca-Cola, Johnson & Johnson
        return 0.25;
      case 'good': // Stable but less predictable
        return 0.35;
      case 'fair': // More challenging to predict
        return 0.40;
      case 'cyclical': // Most unpredictable
        return 0.50;
      default:
        return 0.40;
    }
  };

  // Calculate valuation based on inputs
  const calculateValues = () => {
    const baseEarnings = calculateAverageOwnerEarnings();
    const growthDecimal = inputs.growthRate / 100;
    const discountDecimal = inputs.discountRate / 100;
    const terminalGrowthDecimal = inputs.terminalGrowthRate / 100;
    const marginOfSafety = determineMarginOfSafety(inputs.businessCategory);

    const futureEarnings = baseEarnings * Math.pow(1 + growthDecimal, inputs.yearsProjected);
    const terminalValue = futureEarnings * (1 + terminalGrowthDecimal) / (discountDecimal - terminalGrowthDecimal);

    let presentValueOfEarnings = 0;
    for (let year = 1; year <= inputs.yearsProjected; year++) {
      const yearEarnings = baseEarnings * Math.pow(1 + growthDecimal, year);
      presentValueOfEarnings += yearEarnings / Math.pow(1 + discountDecimal, year);
    }

    const presentValueOfTerminal = terminalValue / Math.pow(1 + discountDecimal, inputs.yearsProjected);
    const intrinsicValue = presentValueOfEarnings + presentValueOfTerminal;
    const safetyPrice = intrinsicValue * (1 - marginOfSafety);

    setResults({
      currentOwnerEarnings: (inputs.currentEarnings + inputs.depreciation - inputs.capex - inputs.workingCapitalChange),
      averageOwnerEarnings: baseEarnings,
      futureEarnings: futureEarnings,
      presentValue: presentValueOfEarnings,
      terminalValue: terminalValue,
      intrinsicValue: intrinsicValue,
      safetyPrice: safetyPrice,
      marginOfSafety: (marginOfSafety * 100)
    });
  };

  // Recalculate results when inputs change
  useEffect(() => {
    calculateValues();
  }, [inputs]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Handle business category changes
  const handleBusinessCategoryChange = (e) => {
    setInputs(prev => ({
      ...prev,
      businessCategory: e.target.value
    }));
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Enhanced Buffett-Style Intrinsic Value Calculator</h1>
      
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Current Year Owner Earnings Components</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-gray-700">Current Annual Earnings ($)</span>
              <input
                type="number"
                name="currentEarnings"
                value={inputs.currentEarnings}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
            </label>

            <label className="block">
              <span className="text-gray-700">Depreciation ($)</span>
              <input
                type="number"
                name="depreciation"
                value={inputs.depreciation}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
            </label>

            <label className="block">
              <span className="text-gray-700">Capital Expenditures ($)</span>
              <input
                type="number"
                name="capex"
                value={inputs.capex}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
            </label>

            <label className="block">
              <span className="text-gray-700">Working Capital Change ($)</span>
              <input
                type="number"
                name="workingCapitalChange"
                value={inputs.workingCapitalChange}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
            </label>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Business Quality Assessment</h2>
              <select
                name="businessCategory"
                value={inputs.businessCategory}
                onChange={handleBusinessCategoryChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              >
                <option value="excellent">Excellent - Very Predictable (e.g., Coca-Cola)</option>
                <option value="good">Good - Stable (e.g., Quality Retailer)</option>
                <option value="fair">Fair - Less Predictable</option>
                <option value="cyclical">Cyclical - Highly Variable</option>
              </select>
            </div>

            <label className="block">
              <span className="text-gray-700">Expected Growth Rate (%)</span>
              <input
                type="number"
                name="growthRate"
                value={inputs.growthRate}
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
              />
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Valuation Results</h2>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Current Owner Earnings</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(results.currentOwnerEarnings)}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Weighted Average Owner Earnings (5-Year)</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.averageOwnerEarnings)}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Future Earnings (Year {inputs.yearsProjected})</p>
              <p className="text-2xl font-bold">{formatCurrency(results.futureEarnings)}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Present Value of Earnings</p>
              <p className="text-2xl font-bold">{formatCurrency(results.presentValue)}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Terminal Value</p>
              <p className="text-2xl font-bold">{formatCurrency(results.terminalValue)}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Intrinsic Value</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.intrinsicValue)}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Buy Below Price (with {results.marginOfSafety.toFixed(0)}% Margin of Safety)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(results.safetyPrice)}</p>
            </div>

            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Warren's Wisdom</h3>
              <p className="text-sm text-gray-600">
                "The key to investing is determining the competitive advantage of any given company and, above all, 
                the durability of that advantage. The products or services that have wide, sustainable moats around 
                them are the ones that deliver rewards to investors."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIntrinsicValueCalculator;
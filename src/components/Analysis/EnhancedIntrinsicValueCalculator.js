// src/components/Analysis/EnhancedIntrinsicValueCalculator.jsx
import React, { useState, useEffect } from 'react';

const EnhancedIntrinsicValueCalculator = () => {
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

  const calculateOwnerEarnings = (year) => {
    return year.earnings + 
           year.depreciation - 
           year.capex - 
           year.workingCapital;
  };

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
      currentOwnerEarnings: (inputs.currentEarnings + inputs.depreciation - inputs.capex - inputs.workingCapitalChange).toFixed(2),
      averageOwnerEarnings: baseEarnings.toFixed(2),
      futureEarnings: futureEarnings.toFixed(2),
      presentValue: presentValueOfEarnings.toFixed(2),
      terminalValue: terminalValue.toFixed(2),
      intrinsicValue: intrinsicValue.toFixed(2),
      safetyPrice: safetyPrice.toFixed(2),
      marginOfSafety: (marginOfSafety * 100).toFixed(0)
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

  const handleBusinessCategoryChange = (e) => {
    setInputs(prev => ({
      ...prev,
      businessCategory: e.target.value
    }));
  };

  const handleHistoricalInputChange = (year, field, value) => {
    setInputs(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Enhanced Buffett-Style Intrinsic Value Calculator</h1>
      
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

            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">Historical Data (Previous Years)</h3>
              
              {/* Year -1 */}
              <div className="p-3 border rounded-md mb-3">
                <h4 className="font-semibold mb-2">Previous Year (Year -1)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-gray-700 text-sm">Earnings</span>
                    <input
                      type="number"
                      value={inputs.yearMinus1.earnings}
                      onChange={(e) => handleHistoricalInputChange('yearMinus1', 'earnings', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 text-sm">Depreciation</span>
                    <input
                      type="number"
                      value={inputs.yearMinus1.depreciation}
                      onChange={(e) => handleHistoricalInputChange('yearMinus1', 'depreciation', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 text-sm">CapEx</span>
                    <input
                      type="number"
                      value={inputs.yearMinus1.capex}
                      onChange={(e) => handleHistoricalInputChange('yearMinus1', 'capex', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 text-sm">Working Capital</span>
                    <input
                      type="number"
                      value={inputs.yearMinus1.workingCapital}
                      onChange={(e) => handleHistoricalInputChange('yearMinus1', 'workingCapital', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-sm"
                    />
                  </label>
                </div>
              </div>
              
              {/* Year -2 */}
              <div className="p-3 border rounded-md mb-3">
                <h4 className="font-semibold mb-2">Year -2</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-gray-700 text-sm">Earnings</span>
                    <input
                      type="number"
                      value={inputs.yearMinus2.earnings}
                      onChange={(e) => handleHistoricalInputChange('yearMinus2', 'earnings', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 text-sm">Depreciation</span>
                    <input
                      type="number"
                      value={inputs.yearMinus2.depreciation}
                      onChange={(e) => handleHistoricalInputChange('yearMinus2', 'depreciation', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 text-sm">CapEx</span>
                    <input
                      type="number"
                      value={inputs.yearMinus2.capex}
                      onChange={(e) => handleHistoricalInputChange('yearMinus2', 'capex', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 text-sm">Working Capital</span>
                    <input
                      type="number"
                      value={inputs.yearMinus2.workingCapital}
                      onChange={(e) => handleHistoricalInputChange('yearMinus2', 'workingCapital', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-sm"
                    />
                  </label>
                </div>
              </div>

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
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Valuation Results</h2>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Current Owner Earnings</p>
              <p className="text-2xl font-bold text-yellow-600">${results.currentOwnerEarnings}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Weighted Average Owner Earnings (5-Year)</p>
              <p className="text-2xl font-bold text-blue-600">${results.averageOwnerEarnings}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Future Earnings (Year {inputs.yearsProjected})</p>
              <p className="text-2xl font-bold">${results.futureEarnings}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Present Value of Earnings</p>
              <p className="text-2xl font-bold">${results.presentValue}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Terminal Value</p>
              <p className="text-2xl font-bold">${results.terminalValue}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Intrinsic Value</p>
              <p className="text-2xl font-bold text-blue-600">${results.intrinsicValue}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Buy Below Price (with {results.marginOfSafety}% Margin of Safety)</p>
              <p className="text-2xl font-bold text-green-600">${results.safetyPrice}</p>
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
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../UI/Card';
import { getCompanyFinancials } from '../../api/fmpService';
import calculationService from '../../services/analysis/calculationService';
import dataProcessingService from '../../services/analysis/dataProcessingService';

const MultipleValuationMethodsCalculator = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState(null);

  const [inputs, setInputs] = useState({
    // DCF Inputs
    currentEarnings: 0,
    growthRate: 5,
    yearsProjected: 10,
    discountRate: 10,
    terminalGrowthRate: 2,
    marginOfSafety: 25,
    
    // Graham Number Inputs
    eps: 0,
    bookValue: 0,
    
    // PE Multiple Inputs
    peRatio: 15,
    
    // Earnings Power Value Inputs
    operatingEarnings: 0,
    maintenanceCapex: 0,
    workingCapitalChange: 0,
    
    // Asset-Based Inputs
    totalAssets: 0,
    totalLiabilities: 0,
    
    // EBIT Multiple
    ebit: 0,
    enterpriseMultiple: 12,
    
    // Current share price for valuation comparison
    currentPrice: 0,
    ticker: '',
    companyName: ''
  });
  
  const [results, setResults] = useState({
    dcfValue: 0,
    grahamValue: 0,
    peValue: 0,
    epvValue: 0,
    assetValue: 0,
    ebitValue: 0,
    averageValue: 0,
    medianValue: 0,
    weightedValue: 0,
    currentValuation: { ratio: 0, status: '' }
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
      const { incomeStatements, balanceSheets, cashFlows, quote, profile } = data;
      
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
                               (profile.mktCap / quote.price);
      
      // Update inputs state
      setInputs({
        // Company info
        ticker: profile.symbol,
        companyName: profile.name,
        currentPrice: quote.price,
        
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
        maintenanceCapex: Math.abs(cashFlow.capitalExpenditure) / sharesOutstanding,
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
    const normalizedEarnings = inputs.operatingEarnings - inputs.maintenanceCapex - inputs.workingCapitalChange;
    const epvValue = normalizedEarnings * 12; // Using a multiple of 12 for stable businesses
    
    // 5. Asset-Based Value
    const assetValue = inputs.totalAssets - inputs.totalLiabilities;
    
    // 6. EBIT Multiple
    const ebitValue = inputs.ebit * inputs.enterpriseMultiple;
    
    // Aggregated values
    const allValues = [dcfValue, grahamValue, peValue, epvValue, assetValue, ebitValue];
    const validValues = allValues.filter(value => !isNaN(value) && value > 0);
    
    const averageValue = validValues.length > 0 
      ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
      : 0;
    
    // Median calculation
    const sortedValues = [...validValues].sort((a, b) => a - b);
    const medianValue = sortedValues.length > 0 
      ? sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)]
      : 0;
    
    // Weighted average (DCF and EPV weighted more heavily)
    const weights = {
      dcf: 0.3,
      graham: 0.15,
      pe: 0.1,
      epv: 0.25,
      asset: 0.1,
      ebit: 0.1
    };
    
    const weightedValue = (
      dcfValue * weights.dcf +
      grahamValue * weights.graham +
      peValue * weights.pe +
      epvValue * weights.epv +
      assetValue * weights.asset +
      ebitValue * weights.ebit
    );
    
    // Current valuation assessment
    const currentRatio = weightedValue > 0 ? inputs.currentPrice / weightedValue : 0;
    let valuationStatus = '';
    
    if (currentRatio <= 0.7) valuationStatus = 'Significantly Undervalued';
    else if (currentRatio <= 0.9) valuationStatus = 'Undervalued';
    else if (currentRatio <= 1.1) valuationStatus = 'Fairly Valued';
    else if (currentRatio <= 1.3) valuationStatus = 'Overvalued';
    else valuationStatus = 'Significantly Overvalued';
    
    setResults({
      dcfValue: dcfValue.toFixed(2),
      grahamValue: grahamValue.toFixed(2),
      peValue: peValue.toFixed(2),
      epvValue: epvValue.toFixed(2),
      assetValue: assetValue.toFixed(2),
      ebitValue: ebitValue.toFixed(2),
      averageValue: averageValue.toFixed(2),
      medianValue: medianValue.toFixed(2),
      weightedValue: weightedValue.toFixed(2),
      currentValuation: { 
        ratio: currentRatio.toFixed(2),
        status: valuationStatus
      }
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

  const getValuationColor = (ratio) => {
    ratio = parseFloat(ratio);
    if (ratio <= 0.7) return 'text-green-600';
    if (ratio <= 0.9) return 'text-green-400';
    if (ratio <= 1.1) return 'text-blue-600';
    if (ratio <= 1.3) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getValuationBackgroundColor = (ratio) => {
    ratio = parseFloat(ratio);
    if (ratio <= 0.7) return 'bg-green-50';
    if (ratio <= 0.9) return 'bg-green-50';
    if (ratio <= 1.1) return 'bg-blue-50';
    if (ratio <= 1.3) return 'bg-yellow-50';
    return 'bg-red-50';
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Multiple Valuation Methods Calculator</h1>
      
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
      
      {inputs.ticker && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Ticker:</span>
                    <input
                      type="text"
                      name="ticker"
                      value={inputs.ticker}
                      onChange={(e) => setInputs(prev => ({ ...prev, ticker: e.target.value }))}
                      className="border rounded p-1 w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold">Company Name:</span>
                    <input
                      type="text"
                      name="companyName"
                      value={inputs.companyName}
                      onChange={(e) => setInputs(prev => ({ ...prev, companyName: e.target.value }))}
                      className="border rounded p-1 w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold">Current Price ($):</span>
                    <input
                      type="number"
                      name="currentPrice"
                      value={inputs.currentPrice}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-32 text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>DCF Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Current Earnings ($):</span>
                    <input
                      type="number"
                      name="currentEarnings"
                      value={inputs.currentEarnings}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Growth Rate (%):</span>
                    <input
                      type="number"
                      name="growthRate"
                      value={inputs.growthRate}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Years to Project:</span>
                    <input
                      type="number"
                      name="yearsProjected"
                      value={inputs.yearsProjected}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Discount Rate (%):</span>
                    <input
                      type="number"
                      name="discountRate"
                      value={inputs.discountRate}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Terminal Growth (%):</span>
                    <input
                      type="number"
                      name="terminalGrowthRate"
                      value={inputs.terminalGrowthRate}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Margin of Safety (%):</span>
                    <input
                      type="number"
                      name="marginOfSafety"
                      value={inputs.marginOfSafety}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Graham Number Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>EPS ($):</span>
                    <input
                      type="number"
                      name="eps"
                      value={inputs.eps}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Book Value per Share ($):</span>
                    <input
                      type="number"
                      name="bookValue"
                      value={inputs.bookValue}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Earnings Power Value Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Operating Earnings ($):</span>
                    <input
                      type="number"
                      name="operatingEarnings"
                      value={inputs.operatingEarnings}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Maintenance CapEx ($):</span>
                    <input
                      type="number"
                      name="maintenanceCapex"
                      value={inputs.maintenanceCapex}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Working Capital Change ($):</span>
                    <input
                      type="number"
                      name="workingCapitalChange"
                      value={inputs.workingCapitalChange}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Other Valuation Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>PE Ratio:</span>
                    <input
                      type="number"
                      name="peRatio"
                      value={inputs.peRatio}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Total Assets ($):</span>
                    <input
                      type="number"
                      name="totalAssets"
                      value={inputs.totalAssets}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Total Liabilities ($):</span>
                    <input
                      type="number"
                      name="totalLiabilities"
                      value={inputs.totalLiabilities}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>EBIT ($):</span>
                    <input
                      type="number"
                      name="ebit"
                      value={inputs.ebit}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Enterprise Multiple:</span>
                    <input
                      type="number"
                      name="enterpriseMultiple"
                      value={inputs.enterpriseMultiple}
                      onChange={handleInputChange}
                      className="border rounded p-1 w-24 text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {inputs.ticker && (
        <>
          <h2 className="text-xl font-semibold mb-4">Valuation Results for {inputs.ticker}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">DCF Value</p>
              <p className="text-2xl font-bold text-blue-600">${results.dcfValue}</p>
              <p className="text-xs text-gray-500">Weight: 30%</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Graham Value</p>
              <p className="text-2xl font-bold text-green-600">${results.grahamValue}</p>
              <p className="text-xs text-gray-500">Weight: 15%</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">PE-Based Value</p>
              <p className="text-2xl font-bold text-yellow-600">${results.peValue}</p>
              <p className="text-xs text-gray-500">Weight: 10%</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">EPV Value</p>
              <p className="text-2xl font-bold text-purple-600">${results.epvValue}</p>
              <p className="text-xs text-gray-500">Weight: 25%</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Net Asset Value</p>
              <p className="text-2xl font-bold text-red-600">${results.assetValue}</p>
              <p className="text-xs text-gray-500">Weight: 10%</p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">EBIT-Based Value</p>
              <p className="text-2xl font-bold text-orange-600">${results.ebitValue}</p>
              <p className="text-xs text-gray-500">Weight: 10%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Value</p>
              <p className="text-2xl font-bold">${results.averageValue}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Median Value</p>
              <p className="text-2xl font-bold">${results.medianValue}</p>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600">Weighted Value</p>
              <p className="text-2xl font-bold text-indigo-600">${results.weightedValue}</p>
            </div>
          </div>
          
          <div className={`p-6 rounded-lg ${getValuationBackgroundColor(results.currentValuation.ratio)}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-semibold">Current Price:</p>
                <p className="text-3xl font-bold">${inputs.currentPrice.toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-lg font-semibold">Current Price/Value Ratio:</p>
                <p className={`text-3xl font-bold ${getValuationColor(results.currentValuation.ratio)}`}>
                  {results.currentValuation.ratio}x
                </p>
                <p className={`text-lg ${getValuationColor(results.currentValuation.ratio)}`}>
                  {results.currentValuation.status}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Value Investing Wisdom</h3>
            <p className="text-sm text-gray-600">
              "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price. 
              Remember that the stock market is a manic depressive."
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MultipleValuationMethodsCalculator;
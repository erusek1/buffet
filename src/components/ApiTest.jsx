import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './UI/Card';
import LoadingIndicator from './UI/LoadingIndicator';
import fmpService from '../api/fmpService';

const ApiTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockData, setStockData] = useState(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Test API connection
        const result = await fmpService.testAPIConnection();
        setTestResult(result);
        
        if (result.success) {
          // If connection is successful, fetch stock data for a well-known stock
          const appleData = await fmpService.getStockQuote('AAPL');
          setStockData(appleData?.[0] || null);
        }
      } catch (error) {
        console.error('API test error:', error);
        setError(error.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    testApi();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Modeling Prep API Test</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <LoadingIndicator size="lg" />
              <p className="mt-4 text-gray-600">Testing API connection...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-600">API Error</h3>
              <p className="text-red-700">{error}</p>
              <div className="mt-4">
                <p className="text-gray-700">Please check:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  <li>You have a valid Financial Modeling Prep API key</li>
                  <li>Your API key is correctly set in the .env file</li>
                  <li>The .env file is in the root directory of your project</li>
                  <li>The environment variable is named REACT_APP_FMP_API_KEY</li>
                  <li>You've restarted your development server after updating the .env file</li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <div className={`p-4 rounded-lg ${testResult?.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`text-lg font-semibold ${testResult?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult?.success ? 'API Connection Successful' : 'API Connection Failed'}
                </h3>
                <p className={`${testResult?.success ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult?.message}
                </p>
              </div>
              
              {stockData && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold">Sample Stock Data (AAPL)</h3>
                  <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Symbol</p>
                        <p className="font-semibold">{stockData.symbol}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Name</p>
                        <p className="font-semibold">{stockData.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price</p>
                        <p className="font-semibold">${stockData.price?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Change</p>
                        <p className={`font-semibold ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stockData.change?.toFixed(2)} ({stockData.changesPercentage?.toFixed(2)}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Market Cap</p>
                        <p className="font-semibold">${(stockData.marketCap / 1e9).toFixed(2)}B</p>
                      </div>
                      <div>
                        <p className="text-gray-600">PE Ratio</p>
                        <p className="font-semibold">{stockData.pe?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <p>If you're seeing this stock data, your API key is working correctly! </p>
                    <p className="mt-2">Now you can use the application to perform intrinsic value calculations and market scans.</p>
                  </div>
                </div>
              )}
              
              {testResult?.success && !stockData && (
                <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                  <p className="text-yellow-700">
                    API connection successful, but no stock data was returned. This might indicate a rate limit or an issue with the specific endpoint.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiTest;
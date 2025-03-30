import React, { useState, useEffect } from 'react';
import apiConfig from '../../api/apiConfig';

const ApiTestComponent = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      // Build the API URL
      const url = new URL(`${apiConfig.baseUrl}/quote/AAPL`);
      url.searchParams.append('apikey', apiConfig.apiKey);
      
      // Log the URL for debugging
      console.log('Testing API connection with URL:', url.toString());
      
      // Make the request
      const response = await fetch(url.toString());
      
      // Get response status and headers
      const status = response.status;
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      setTestResult({
        status,
        headers,
        data
      });
    } catch (error) {
      console.error('API test failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      
      <div className="mb-6">
        <div className="mb-4">
          <p className="text-gray-700">Testing connection to the Financial Modeling Prep API</p>
          <p className="text-sm text-gray-500 mt-1">
            API Key: {apiConfig.apiKey ? `${apiConfig.apiKey.substring(0, 5)}...${apiConfig.apiKey.substring(apiConfig.apiKey.length - 5)}` : 'Not set'}
          </p>
          <p className="text-sm text-gray-500">
            Base URL: {apiConfig.baseUrl}
          </p>
        </div>
        
        <button
          onClick={testApiConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test API Connection'}
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 mb-6">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {testResult && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
            <p className="text-green-600 font-bold">Status: {testResult.status}</p>
            <p className="text-green-600">
              Connection successful! API is responding correctly.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Response Data</h3>
              <pre className="bg-gray-100 p-4 rounded-md mt-2 overflow-auto text-sm">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold">Response Headers</h3>
              <pre className="bg-gray-100 p-4 rounded-md mt-2 overflow-auto text-sm">
                {JSON.stringify(testResult.headers, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Troubleshooting Tips</h3>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          <li>Make sure your API key is correct</li>
          <li>Check if your API subscription is active</li>
          <li>Try using a different browser</li>
          <li>Clear your browser cache and cookies</li>
          <li>If you continue to have issues, contact FMP support</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTestComponent;
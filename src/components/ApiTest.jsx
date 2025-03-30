import React, { useState } from 'react';
import { testAPIConnection } from '../api/fmpService';

const ApiTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const result = await testAPIConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">API Connection Test</h2>
      
      <button
        onClick={runTest}
        disabled={loading}
        className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      {testResult && (
        <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <p className="font-semibold">{testResult.success ? 'Success!' : 'Failed!'}</p>
          <p>{testResult.message}</p>
          
          {testResult.success && testResult.data && (
            <div className="mt-2 text-sm">
              <p>Successfully retrieved data for: {testResult.data[0]?.companyName || 'Unknown'}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Make sure your API key is set in the .env file:</p>
        <pre className="mt-1 p-2 bg-gray-100 rounded">REACT_APP_FMP_API_KEY=your_api_key_here</pre>
      </div>
    </div>
  );
};

export default ApiTest;
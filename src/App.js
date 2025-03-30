import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';

// Import Dashboard components
import MainDashboard from './components/Dashboard/MainDashboard';

// Import Analysis components
import EnhancedIntrinsicValueCalculator from './components/Analysis/EnhancedIntrinsicValueCalculator';
import MultipleValuationMethodsCalculator from './components/Analysis/MultipleValuationMethodsCalculator';
import RevisedBuffettSP500Analysis from './components/Analysis/RevisedBuffettSP500Analysis';

// Import Screener components
import OpportunityScanner from './components/Screener/OpportunityScanner';

// Import API Test Component
import ApiTest from './components/ApiTest';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // For simplicity, assume user is authenticated
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-6">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-blue-600">Buffett-Style Value Investing</h1>
              <nav className="space-x-4">
                <Link to="/" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                <Link to="/screener" className="text-gray-600 hover:text-blue-600">Market Scanner</Link>
                <Link to="/calculator" className="text-gray-600 hover:text-blue-600">Value Calculator</Link>
                <Link to="/analysis" className="text-gray-600 hover:text-blue-600">Market Analysis</Link>
                <Link to="/api-test" className="text-gray-600 hover:text-blue-600">API Test</Link>
              </nav>
            </div>
          </div>
        </header>
        
        <main className="py-6">
          <Routes>
            {/* Protected Routes */}
            {isAuthenticated ? (
              <>
                <Route path="/" element={<MainDashboard />} />
                <Route path="/screener" element={<OpportunityScanner />} />
                <Route path="/calculator" element={<EnhancedIntrinsicValueCalculator />} />
                <Route path="/calculator/multi" element={<MultipleValuationMethodsCalculator />} />
                <Route path="/analysis" element={<RevisedBuffettSP500Analysis />} />
                <Route path="/api-test" element={<ApiTest />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </main>
        
        <footer className="bg-white shadow-inner">
          <div className="max-w-7xl mx-auto py-4 px-6">
            <p className="text-center text-gray-500 text-sm">
              "The stock market is a device for transferring money from the impatient to the patient." - Warren Buffett
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
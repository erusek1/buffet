import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ValuationCalculator from './components/Analysis/ValuationCalculator';
import OpportunityFinder from './components/Screener/OpportunityFinder';
import OpportunityScanner from './components/Screener/OpportunityScanner';
import WatchlistManager from './components/Watchlist/WatchlistManager';
import ApiTestComponent from './components/Analysis/ApiTestComponent';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-700 text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between">
              <div className="flex space-x-4">
                <div className="flex items-center py-4">
                  <span className="font-bold text-xl">Buffett-Style Value Investor</span>
                </div>
                <div className="hidden md:flex items-center space-x-1">
                  <Link to="/" className="py-4 px-3 hover:bg-blue-600">Valuation Calculator</Link>
                  <Link to="/opportunities" className="py-4 px-3 hover:bg-blue-600">Opportunity Finder</Link>
                  <Link to="/scanner" className="py-4 px-3 hover:bg-blue-600">Market Scanner</Link>
                  <Link to="/watchlist" className="py-4 px-3 hover:bg-blue-600">Watchlist</Link>
                  <Link to="/api-test" className="py-4 px-3 hover:bg-blue-600 text-yellow-300">API Test</Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="py-8">
          <Routes>
            <Route path="/" element={<ValuationCalculator />} />
            <Route path="/opportunities" element={<OpportunityFinder />} />
            <Route path="/scanner" element={<OpportunityScanner />} />
            <Route path="/watchlist" element={<WatchlistManager />} />
            <Route path="/api-test" element={<ApiTestComponent />} />
          </Routes>
        </div>
        
        <footer className="bg-gray-200 py-4">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
            <p className="text-sm">
              Buffett-Style Value Investor - Following the principles of Warren Buffett and Benjamin Graham
            </p>
            <p className="text-xs mt-2">
              "Price is what you pay. Value is what you get." - Warren Buffett
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
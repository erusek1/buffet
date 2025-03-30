import React, { useState, useEffect, useRef } from 'react';
import LoadingIndicator from './LoadingIndicator';

const StockSearch = ({ onSelect, placeholder = "Search for a stock..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Mock popular stocks data (in a real app, this would come from API)
  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.' },
    { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' }
  ];
  
  // Simulating an API search with our mock data
  const searchStocks = (searchQuery) => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      
      const filteredResults = popularStocks.filter(
        stock => 
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setResults(filteredResults);
      setLoading(false);
    }, 300);
  };
  
  useEffect(() => {
    searchStocks(query);
  }, [query]);
  
  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSelect = (stock) => {
    onSelect(stock);
    setQuery('');
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full p-2 pr-8 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <div className="absolute right-2 top-2.5">
          {loading ? (
            <LoadingIndicator size="sm" color="gray" />
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          )}
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md max-h-60 overflow-auto">
          {results.length > 0 ? (
            <ul>
              {results.map((stock) => (
                <li 
                  key={stock.symbol}
                  onClick={() => handleSelect(stock)}
                  className="p-2 hover:bg-blue-50 cursor-pointer"
                >
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-xs text-gray-600">{stock.name}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-gray-500 text-center">
              {query.trim() === '' ? 'Start typing to search' : 'No results found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockSearch;
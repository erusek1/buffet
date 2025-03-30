import React, { Component } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                An error occurred while rendering this component. Please try refreshing the page or contact support if the issue persists.
              </p>
              {this.state.error && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="font-semibold">Error:</p>
                  <p className="text-red-600">{this.state.error.toString()}</p>
                </div>
              )}
              
              {this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-gray-600 font-medium">
                    View technical details
                  </summary>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg overflow-auto text-xs">
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </div>
                </details>
              )}
              
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                >
                  Refresh Page
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
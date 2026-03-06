/**
 * Error Boundary Component
 * Catches errors in component tree and displays fallback UI
 */

import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="max-w-md w-full p-8 bg-red-900/20 border border-red-500 rounded-lg">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-300 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {import.meta.env.MODE === "development" && this.state.error && (
              <details className="mt-4 p-4 bg-gray-800 rounded text-sm text-gray-400">
                <summary className="cursor-pointer font-mono text-xs">Error Details</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded font-semibold transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

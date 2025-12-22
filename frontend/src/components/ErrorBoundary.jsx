import { Component } from "react";

/**
 * Error boundary to catch and display React errors gracefully
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 text-dark-100 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">😵</div>
            <h1 className="text-2xl font-display font-bold mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-dark-400 mb-6">
              We encountered an unexpected error. Please try refreshing the
              page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-xs text-red-400 bg-dark-900 p-4 rounded-lg mb-6 overflow-auto max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              className="btn-primary"
              aria-label="Retry loading the application"
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

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LifeLedger Uncaught Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6" role="alert">
          <div className="max-w-md w-full bg-slate-900 border border-red-800/40 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-950/80 border border-red-600/40 rounded-2xl flex items-center justify-center mx-auto text-red-500 text-3xl font-bold">
              !
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-100">Something Went Wrong</h1>
              <p className="text-sm text-slate-400">
                LifeLedger encountered an unexpected client error. Please refresh or return to safety.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-red-400 text-left overflow-x-auto max-h-32 border border-slate-800">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition duration-200 shadow-lg shadow-red-950"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-text-bright mb-2">Something went wrong</h1>
            <p className="text-text-dim mb-2">
              The app encountered an unexpected error. This has been noted.
            </p>
            <p className="text-text-dim text-sm mb-6 font-mono bg-surface rounded p-2 break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="w-full py-3 px-6 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors"
              >
                Back to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-6 bg-surface-hover text-text-bright font-medium rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <a
                href="https://github.com/ChindanaiNaKub/markrukthai/issues/new?template=bug_report.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-light text-sm underline"
              >
                Report this bug on GitHub
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

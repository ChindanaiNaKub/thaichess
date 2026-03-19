import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for async operations (data fetching, promises)
 * Catches both sync errors and unhandled promise rejections
 */
export class AsyncErrorBoundary extends Component<Props, State> {
  private handleError = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    this.setState({ hasError: true, error });
  };

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleError);
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AsyncErrorBoundary] Caught error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center p-8">
          <div className="bg-surface-alt border border-danger/50 rounded-lg p-6 max-w-md w-full text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-danger mb-2">Connection Error</h3>
            <p className="text-text-dim text-sm mb-4">
              {this.state.error?.message || 'An error occurred while loading data'}
            </p>
            <button
              onClick={this.reset}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <AsyncErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AsyncErrorBoundary>
    );
  };
}

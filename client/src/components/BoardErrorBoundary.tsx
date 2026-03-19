import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary specifically for the Board component.
 * Shows a minimal fallback UI that allows continuing the game.
 */
export class BoardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[BoardErrorBoundary] Board render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative aspect-square w-full bg-surface-alt rounded-lg shadow-xl flex items-center justify-center border border-surface-hover">
          <div className="text-center p-6">
            <div className="text-4xl mb-3 opacity-50">♞</div>
            <p className="text-text-dim text-sm mb-4">Board display error</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  this.props.onRetry?.();
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

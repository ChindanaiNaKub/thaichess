import { Component, type ReactNode } from 'react';
import { reportClientError } from '../lib/errorReporting';
import { translate } from '../lib/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const CHUNK_RELOAD_KEY = 'thaichess:chunk-reload-attempted';

function isRecoverableChunkLoadError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('dynamically imported module')
    || message.includes('failed to fetch dynamically imported module')
    || message.includes('importing a module script failed')
    || message.includes('loading module from')
    || message.includes('chunk')
  );
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
    if (isRecoverableChunkLoadError(error)) {
      const hasRetried = window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
      if (!hasRetried) {
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        window.location.reload();
        return;
      }
    } else {
      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }

    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    void reportClientError({
      source: 'react_error_boundary',
      error,
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error ? isRecoverableChunkLoadError(this.state.error) : false;

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-text-bright mb-2">{translate('error.something_wrong')}</h1>
            <p className="text-text-dim mb-2">
              {isChunkError ? 'The app was updated. Reload to get the latest version.' : translate('error.unexpected')}
            </p>
            <p className="text-text-dim text-sm mb-6 font-mono bg-surface rounded p-2 break-all">
              {this.state.error?.message || translate('error.unknown')}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="w-full py-3 px-6 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors"
              >
                {translate('common.back_home')}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-6 bg-surface-hover text-text-bright font-medium rounded-lg transition-colors"
              >
                {translate('error.reload_page')}
              </button>
              <a
                href="https://github.com/ChindanaiNaKub/markrukthai/issues/new?template=bug_report.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-light text-sm underline"
              >
                {translate('error.report_bug')}
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

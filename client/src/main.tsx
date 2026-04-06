import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './lib/auth';
import { initializeGlobalErrorReporting } from './lib/errorReporting';
import { I18nProvider, preloadDetectedTranslations } from './lib/i18n';
import { initializeClientPerfDebug, logClientPerfEvent } from './lib/perfDebug';
import { PieceStyleProvider } from './lib/pieceStyle';
import { queryClient } from './lib/queryClient';
import './index.css';

initializeGlobalErrorReporting();
initializeClientPerfDebug();

function bootstrap() {
  logClientPerfEvent('bootstrap_start', {
    readyState: document.readyState,
  });

  window.sessionStorage.removeItem('thaichess:chunk-reload-attempted');

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <AuthProvider>
              <PieceStyleProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </PieceStyleProvider>
            </AuthProvider>
          </I18nProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  );

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      logClientPerfEvent('bootstrap_rendered', {
        readyState: document.readyState,
      });
    });
  });

  void preloadDetectedTranslations().catch(() => {
    // Keep the app bootable even if a non-default catalog fails to load.
  });
}

void bootstrap();

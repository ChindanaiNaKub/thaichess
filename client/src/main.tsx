import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './lib/auth';
import { initializeGlobalErrorReporting } from './lib/errorReporting';
import { I18nProvider, preloadDetectedTranslations } from './lib/i18n';
import { PieceStyleProvider } from './lib/pieceStyle';
import './index.css';

declare global {
  interface Window {
    __thaichessStylesReady?: Promise<void>;
    __thaichessResolveStylesReady?: () => void;
    __thaichessStylesReadyResolved?: boolean;
  }
}

initializeGlobalErrorReporting();

async function waitForInitialStyles() {
  if (!import.meta.env.PROD || typeof window === 'undefined') return;

  const stylesReady = window.__thaichessStylesReady;
  if (!stylesReady) return;

  await stylesReady;
}

async function bootstrap() {
  try {
    await Promise.all([
      preloadDetectedTranslations(),
      waitForInitialStyles(),
    ]);
  } catch {
    // Keep the app bootable even if a non-default catalog or style handshake fails.
  }

  window.sessionStorage.removeItem('thaichess:chunk-reload-attempted');

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <I18nProvider>
          <AuthProvider>
            <PieceStyleProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </PieceStyleProvider>
          </AuthProvider>
        </I18nProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();

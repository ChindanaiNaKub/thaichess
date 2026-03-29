import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './lib/auth';
import { initializeGlobalErrorReporting } from './lib/errorReporting';
import { I18nProvider } from './lib/i18n';
import { PieceStyleProvider } from './lib/pieceStyle';
import { PuzzleProgressProvider } from './lib/puzzleProgress';
import './index.css';

initializeGlobalErrorReporting();
window.sessionStorage.removeItem('thaichess:chunk-reload-attempted');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <PuzzleProgressProvider>
            <PieceStyleProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </PieceStyleProvider>
          </PuzzleProgressProvider>
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
);

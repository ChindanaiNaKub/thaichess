import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { I18nProvider } from './lib/i18n';
import { PieceStyleProvider } from './lib/pieceStyle';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <PieceStyleProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PieceStyleProvider>
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
);

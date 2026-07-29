import { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PieceStyleProvider } from '../lib/pieceStyle';

// Custom render with providers
interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <PieceStyleProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </PieceStyleProvider>
  );
}

function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };

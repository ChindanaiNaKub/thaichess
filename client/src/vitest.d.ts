/// <reference types="@testing-library/jest-dom" />

import type { Assertion } from 'vitest';

declare module 'vitest' {
  interface Matchers<R = any> {
    toBeInTheDocument(): R;
    toHaveAttribute(name: string, value?: any): R;
    toHaveClass(...classNames: string[]): R;
    toHaveStyle(style: Partial<CSSStyleDeclaration>): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeChecked(): R;
    toBeDisabled(): R;
    toBeEmpty(): R;
    toBeFocused(): R;
    toBeInTheDocument(): R;
    toBeInvalid(): R;
    toBeRequired(): R;
    toBeVisible(): R;
    toBeDisabled(): R;
    toContainElement(element: HTMLElement | null): R;
    toHaveFocus(): R;
    toHaveFormValues(expectedValues: Record<string, any>): R;
  }
}

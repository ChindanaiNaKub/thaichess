import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FeedbackWidget from '../components/FeedbackWidget';

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      switch (key) {
        case 'feedback.title':
          return 'Send Feedback';
        case 'feedback.button':
          return 'Feedback';
        case 'feedback.bug':
          return 'Bug';
        case 'feedback.feature':
          return 'Feature';
        case 'feedback.other':
          return 'Other';
        case 'common.cancel':
          return 'Cancel';
        case 'common.send':
          return 'Send';
        case 'common.sending':
          return 'Sending...';
        default:
          return key;
      }
    },
  }),
}));

vi.mock('../lib/toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('../queries/feedback', () => ({
  useSubmitFeedbackMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('FeedbackWidget', () => {
  it('hides the launcher on puzzle routes', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/puzzles']}>
        <FeedbackWidget />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Send Feedback' })).not.toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={['/puzzle/77']}>
        <FeedbackWidget />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Send Feedback' })).not.toBeInTheDocument();
  });

  it('shows the launcher on non-puzzle routes', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <FeedbackWidget />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Send Feedback' })).toBeInTheDocument();
  });
});

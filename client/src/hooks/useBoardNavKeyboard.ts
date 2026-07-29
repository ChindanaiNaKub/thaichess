import { useEffect } from 'react';
import {
  applyBoardNavAction,
  isEditableKeyboardTarget,
  matchBoardNavKey,
  type BoardNavAction,
  type BoardNavHandlers,
} from '../lib/boardSession';

export type UseBoardNavKeyboardOptions = {
  /** When false, no listener is attached. */
  enabled: boolean;
  handlers: BoardNavHandlers;
  /** Use document capture phase (AnalysisPage). Default: window bubble. */
  capture?: boolean;
  /** Skip when focus is in an editable field. */
  skipEditable?: boolean;
  /** Skip when alt/ctrl/meta is held. */
  skipModified?: boolean;
};

/**
 * Shared arrow/Home/End keyboard navigation for board move scrubbing / review.
 */
export function useBoardNavKeyboard({
  enabled,
  handlers,
  capture = false,
  skipEditable = false,
  skipModified = false,
}: UseBoardNavKeyboardOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: Event) => {
      if (!(e instanceof KeyboardEvent)) return;
      if (skipEditable && isEditableKeyboardTarget(e.target)) return;
      if (skipModified && (e.altKey || e.ctrlKey || e.metaKey)) return;

      const action = matchBoardNavKey(e.key);
      if (!action) return;

      e.preventDefault();
      applyBoardNavAction(action, handlers);
    };

    const target: Window | Document = capture ? document : window;
    target.addEventListener('keydown', handleKeyDown, capture);
    return () => target.removeEventListener('keydown', handleKeyDown, capture);
  }, [capture, enabled, handlers, skipEditable, skipModified]);
}

export type { BoardNavAction, BoardNavHandlers };

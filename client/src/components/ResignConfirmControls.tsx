import { useState } from 'react';
import { useTranslation } from '../lib/i18n';

interface ResignConfirmControlsProps {
  onConfirm: () => void;
  /** i18n key for the idle resign button label */
  resignLabelKey: string;
  /** i18n key for the confirmation warning copy */
  confirmMessageKey: string;
  className?: string;
  fullWidth?: boolean;
}

/**
 * In-cloth resign confirm (DeleteAccount-style progressive disclosure).
 * Callers pass a confirm-free `onConfirm` that performs the resign.
 */
export default function ResignConfirmControls({
  onConfirm,
  resignLabelKey,
  confirmMessageKey,
  className = '',
  fullWidth = false,
}: ResignConfirmControlsProps) {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={
          className
          || 'py-2.5 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-xl border border-surface-hover transition-colors'
        }
        title={t(resignLabelKey)}
      >
        {t(resignLabelKey)}
      </button>
    );
  }

  return (
    <div
      className={`space-y-2 rounded-xl border border-danger/30 bg-danger/5 p-3 ${fullWidth ? 'w-full' : ''}`}
      role="group"
      aria-label={t(confirmMessageKey)}
    >
      <p className="text-sm font-medium text-danger">{t(confirmMessageKey)}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          className="flex-1 rounded-xl border border-surface-hover/70 bg-surface px-3 py-2.5 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowConfirm(false);
            onConfirm();
          }}
          className="flex-1 rounded-xl bg-danger px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger-bright"
        >
          {t('game.resign_confirm_action')}
        </button>
      </div>
    </div>
  );
}

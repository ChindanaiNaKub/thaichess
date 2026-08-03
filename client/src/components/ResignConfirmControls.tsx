import { useState } from 'react';
import { useTranslation } from '../lib/i18n';

type ConfirmTone = 'danger' | 'neutral';

interface ResignConfirmControlsProps {
  onConfirm: () => void;
  /** i18n key for the idle action button label */
  resignLabelKey: string;
  /** i18n key for the confirmation warning copy */
  confirmMessageKey: string;
  /** i18n key for the confirm CTA (defaults to resign) */
  confirmActionKey?: string;
  /** danger = resign/loss; neutral = offer-draw and other soft confirms */
  tone?: ConfirmTone;
  className?: string;
  fullWidth?: boolean;
}

/**
 * In-cloth progressive confirm (DeleteAccount-style disclosure).
 * Callers pass a confirm-free `onConfirm` that performs the action.
 */
export default function ResignConfirmControls({
  onConfirm,
  resignLabelKey,
  confirmMessageKey,
  confirmActionKey = 'game.resign_confirm_action',
  tone = 'danger',
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

  const panelClass = tone === 'danger'
    ? 'border-danger/30 bg-danger/5'
    : 'border-primary/25 bg-primary/5';
  const messageClass = tone === 'danger' ? 'text-danger' : 'text-primary-light';
  const confirmClass = tone === 'danger'
    ? 'flex-1 rounded-xl bg-danger px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger-bright'
    : 'ui-btn-primary flex-1 px-3 py-2.5 text-sm';

  return (
    <div
      className={`space-y-2 rounded-xl border p-3 ${panelClass} ${fullWidth ? 'w-full' : ''}`}
      role="group"
      aria-label={t(confirmMessageKey)}
    >
      <p className={`text-sm font-medium ${messageClass}`}>{t(confirmMessageKey)}</p>
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
          className={confirmClass}
        >
          {t(confirmActionKey)}
        </button>
      </div>
    </div>
  );
}

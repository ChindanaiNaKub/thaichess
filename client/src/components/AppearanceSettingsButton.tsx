import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';

interface AppearanceSettingsButtonProps {
  compact?: boolean;
  className?: string;
}

export default function AppearanceSettingsButton({
  compact = false,
  className = '',
}: AppearanceSettingsButtonProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => navigate(routes.appearanceSettings)}
      className={`inline-flex items-center justify-center rounded-md border border-surface-hover/60 bg-surface px-2.5 text-xs font-semibold text-text-dim transition-colors hover:bg-surface-hover hover:text-text-bright ${compact ? 'h-7' : 'h-9'} ${className}`.trim()}
      title={t('appearance.open')}
    >
      {compact ? t('appearance.open_short') : t('appearance.open')}
    </button>
  );
}

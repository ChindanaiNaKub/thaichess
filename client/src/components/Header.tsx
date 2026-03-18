import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import PieceSVG from './PieceSVG';

interface HeaderProps {
  active?: 'play' | 'puzzles' | 'games' | 'about';
  subtitle?: string;
  right?: React.ReactNode;
}

export default function Header({ active, subtitle, right }: HeaderProps) {
  const navigate = useNavigate();
  const { t, lang, setLang } = useTranslation();

  return (
    <header className="bg-surface-alt border-b border-surface-hover">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PieceSVG type="K" color="white" size={32} />
            <h1 className="text-lg font-bold text-text-bright tracking-tight">{t('app.name')}</h1>
          </button>
          {subtitle && <span className="text-text-dim text-sm hidden sm:inline">{subtitle}</span>}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {active !== undefined && (
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <button
                onClick={() => navigate('/')}
                className={active === 'play' ? 'text-primary font-medium' : 'text-text-dim hover:text-text-bright transition-colors'}
              >
                {t('nav.play')}
              </button>
              <button
                onClick={() => navigate('/puzzles')}
                className={active === 'puzzles' ? 'text-primary font-medium' : 'text-text-dim hover:text-text-bright transition-colors'}
              >
                {t('nav.puzzles')}
              </button>
              <button
                onClick={() => navigate('/games')}
                className={active === 'games' ? 'text-primary font-medium' : 'text-text-dim hover:text-text-bright transition-colors'}
              >
                {t('nav.games')}
              </button>
              <button
                onClick={() => navigate('/about')}
                className={active === 'about' ? 'text-primary font-medium' : 'text-text-dim hover:text-text-bright transition-colors'}
              >
                {t('nav.about')}
              </button>
            </nav>
          )}

          {right}

          <button
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="px-2.5 py-1 rounded-md bg-surface hover:bg-surface-hover border border-surface-hover text-text text-xs font-bold transition-colors"
            title={lang === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English'}
          >
            {t('lang.switch')}
          </button>
        </div>
      </div>
    </header>
  );
}

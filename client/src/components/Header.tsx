import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { usePieceStyle } from '../lib/pieceStyle';
import PieceSVG from './PieceSVG';

interface HeaderProps {
  active?: 'play' | 'puzzles' | 'games' | 'about';
  subtitle?: string;
  right?: React.ReactNode;
}

export default function Header({ active, subtitle, right }: HeaderProps) {
  const navigate = useNavigate();
  const { t, lang, setLang } = useTranslation();
  const { pieceStyle, setPieceStyle } = usePieceStyle();

  const navItem = (key: 'play' | 'puzzles' | 'games' | 'about', path: string, label: string) => (
    <button
      key={key}
      onClick={() => navigate(path)}
      className={`
        relative px-1 py-0.5 text-sm transition-colors duration-150
        ${active === key
          ? 'text-primary font-semibold'
          : 'text-text-dim hover:text-text-bright'
        }
      `}
    >
      {label}
      {active === key && (
        <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );

  return (
    <header className="bg-surface-alt/80 backdrop-blur-md border-b border-surface-hover/60 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 transition-opacity duration-150 hover:opacity-80 active:opacity-60"
          >
            <PieceSVG type="K" color="white" size={28} />
            <span className="text-base font-bold text-text-bright tracking-tight leading-none">
              {t('app.name')}
            </span>
          </button>
          {subtitle && (
            <span className="text-text-dim text-sm hidden sm:inline border-l border-surface-hover pl-3 ml-1">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {active !== undefined && (
            <nav className="hidden sm:flex items-center gap-5">
              {navItem('play', '/', t('nav.play'))}
              {navItem('puzzles', '/puzzles', t('nav.puzzles'))}
              {navItem('games', '/games', t('nav.games'))}
              {navItem('about', '/about', t('nav.about'))}
            </nav>
          )}

          {right}

          <label className="hidden sm:flex items-center gap-2 text-xs text-text-dim">
            <span className="uppercase tracking-[0.2em]">Pieces</span>
            <select
              value={pieceStyle}
              onChange={(e) => setPieceStyle(e.target.value as 'classic' | 'western' | 'traditional')}
              className="h-7 rounded-md border border-surface-hover/60 bg-surface px-2 text-xs font-semibold text-text-bright outline-none transition-colors hover:bg-surface-hover"
              title="Select piece style"
            >
              <option value="classic">Cute</option>
              <option value="western">Chess</option>
              <option value="traditional">OG Makruk</option>
            </select>
          </label>

          <button
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="h-7 px-2.5 rounded-md bg-surface hover:bg-surface-hover border border-surface-hover/60 text-text-dim hover:text-text-bright text-xs font-semibold tracking-wide transition-all duration-150 active:scale-95"
            title={lang === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English'}
          >
            {t('lang.switch')}
          </button>
        </div>
      </div>
    </header>
  );
}

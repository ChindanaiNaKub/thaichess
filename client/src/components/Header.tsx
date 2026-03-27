import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
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
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const navItem = (key: 'play' | 'puzzles' | 'games' | 'about', path: string, label: string) => (
    <button
      key={key}
      onClick={() => handleNavigate(path)}
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

  const mobileNavItem = (key: 'play' | 'puzzles' | 'games' | 'about', path: string, label: string) => (
    <button
      key={key}
      onClick={() => handleNavigate(path)}
      className={`
        rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors
        ${active === key
          ? 'border-primary/40 bg-primary/12 text-primary-light'
          : 'border-surface-hover/60 bg-surface text-text-bright hover:bg-surface-hover'
        }
      `}
    >
      {label}
    </button>
  );

  return (
    <header className="bg-surface-alt/80 backdrop-blur-md border-b border-surface-hover/60 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigate('/')}
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

        <div className="flex items-center gap-2 sm:gap-5">
          {active !== undefined && (
            <nav className="hidden sm:flex items-center gap-5">
              {navItem('play', '/', t('nav.play'))}
              {navItem('puzzles', '/puzzles', t('nav.puzzles'))}
              {navItem('games', '/games', t('nav.games'))}
              {navItem('about', '/about', t('nav.about'))}
            </nav>
          )}

          <div className="hidden sm:block">
            {right}
          </div>

          {!loading && (
            user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' && (
                  <button
                    onClick={() => handleNavigate('/feedback')}
                    className="hidden sm:inline h-7 px-2.5 rounded-md border border-surface-hover/60 bg-surface text-text-dim hover:text-text-bright text-xs font-semibold"
                  >
                    {t('header.admin')}
                  </button>
                )}
                <button
                  onClick={() => handleNavigate('/account')}
                  className="h-7 px-2.5 rounded-md border border-surface-hover/60 bg-surface text-text-dim hover:text-text-bright text-xs font-semibold"
                >
                  {user.username || user.email.split('@')[0]}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavigate('/login')}
                className="h-7 px-2.5 rounded-md bg-primary text-white text-xs font-semibold tracking-wide transition-all duration-150 active:scale-95"
              >
                {t('header.sign_in')}
              </button>
            )
          )}

          <label className="hidden sm:flex items-center gap-2 text-xs text-text-dim">
            <span className="hidden uppercase tracking-[0.2em] sm:inline">{t('game.piece_style')}</span>
            <select
              value={pieceStyle}
              onChange={(e) => setPieceStyle(e.target.value as 'classic' | 'western')}
              className="h-7 min-w-0 rounded-md border border-surface-hover/60 bg-surface px-2 text-xs font-semibold text-text-bright outline-none transition-colors hover:bg-surface-hover max-w-[5.5rem] sm:max-w-none"
              title={t('game.select_piece_style')}
              aria-label={t('game.select_piece_style')}
            >
              <option value="classic">{t('game.piece_style_makruk')}</option>
              <option value="western">{t('game.piece_style_western')}</option>
            </select>
          </label>

          <button
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="hidden sm:inline-flex h-7 px-2.5 rounded-md bg-surface hover:bg-surface-hover border border-surface-hover/60 text-text-dim hover:text-text-bright text-xs font-semibold tracking-wide transition-all duration-150 active:scale-95"
            title={lang === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English'}
          >
            {t('lang.switch')}
          </button>

          <div className="flex items-center gap-2 sm:hidden">
            {right}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-8 items-center rounded-md border border-surface-hover/60 bg-surface px-2.5 text-xs font-semibold tracking-wide text-text-bright transition-colors hover:bg-surface-hover"
              aria-expanded={menuOpen}
              aria-controls="mobile-site-menu"
            >
              {menuOpen ? t('header.close_menu') : t('header.menu')}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-site-menu" className="border-t border-surface-hover/60 bg-surface-alt/95 sm:hidden">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4">
            {active !== undefined && (
              <nav className="grid grid-cols-2 gap-2">
                {mobileNavItem('play', '/', t('nav.play'))}
                {mobileNavItem('puzzles', '/puzzles', t('nav.puzzles'))}
                {mobileNavItem('games', '/games', t('nav.games'))}
                {mobileNavItem('about', '/about', t('nav.about'))}
              </nav>
            )}

            <div className="grid gap-3">
              <label className="flex flex-col gap-2 text-xs text-text-dim">
                <span className="uppercase tracking-[0.2em]">{t('game.piece_style')}</span>
                <select
                  value={pieceStyle}
                  onChange={(e) => setPieceStyle(e.target.value as 'classic' | 'western')}
                  className="h-9 rounded-md border border-surface-hover/60 bg-surface px-3 text-sm font-semibold text-text-bright outline-none transition-colors hover:bg-surface-hover"
                  title={t('game.select_piece_style')}
                  aria-label={t('game.select_piece_style')}
                >
                  <option value="classic">{t('game.piece_style_makruk')}</option>
                  <option value="western">{t('game.piece_style_western')}</option>
                </select>
              </label>

              <button
                onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
                className="inline-flex h-9 items-center justify-center rounded-md border border-surface-hover/60 bg-surface px-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover"
                title={lang === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English'}
              >
                {t('lang.switch')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

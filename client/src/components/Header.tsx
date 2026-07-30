import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';
import { usePrefetchQueries } from '../hooks/usePrefetchQueries';
import PieceSVG from './PieceSVG';
import AppearanceSettingsButton from './AppearanceSettingsButton';

interface HeaderProps {
  active?: 'play' | 'watch' | 'lessons' | 'puzzles' | 'games' | 'about' | 'tools' | null;
  subtitle?: string;
  right?: ReactNode;
}

export default function Header({ active, subtitle, right }: HeaderProps) {
  const navigate = useNavigate();
  const { t, lang, setLang } = useTranslation();
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [puzzleMenuOpen, setPuzzleMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const { prefetchLeaderboard, prefetchFeedback } = usePrefetchQueries();

  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    setPuzzleMenuOpen(false);
    setToolsMenuOpen(false);
    navigate(path);
  };

  const navItem = (key: 'play' | 'watch' | 'lessons' | 'puzzles' | 'games' | 'about' | 'tools', path: string, label: string, onHover?: () => void) => (
    <button type="button"
      key={key}
      onClick={() => handleNavigate(path)}
      onMouseEnter={onHover}
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

  const mobileNavItem = (key: 'play' | 'watch' | 'lessons' | 'puzzles' | 'games' | 'about' | 'tools', path: string, label: string) => (
    <button type="button"
      key={key}
      onClick={() => handleNavigate(path)}
      className={`
        ui-btn-secondary px-3 py-2 text-left text-sm
        ${active === key
          ? 'border-primary/40 bg-primary/12 text-primary-light'
          : ''
        }
      `}
    >
      {label}
    </button>
  );

  const dropdownMenuItem = (key: string, path: string, label: string, disabled = false) => (
    <button type="button"
      key={key}
      onClick={() => {
        if (!disabled) handleNavigate(path);
      }}
      disabled={disabled}
      className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
        disabled
          ? 'cursor-not-allowed text-text-dim/60'
          : 'text-text-bright hover:bg-surface-hover'
      }`}
    >
      {label}
    </button>
  );

  const editorPath = `${routes.analysisRoot}?mode=editor`;

  return (
    <header className="sticky top-0 z-40 border-b border-surface-hover/60 bg-surface-alt/95 sm:bg-surface-alt/88">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button"
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
              {navItem('play', routes.home, t('nav.play'), prefetchLeaderboard)}
              {navItem('watch', routes.watch, t('nav.watch'))}
              {navItem('lessons', routes.lessons, t('nav.lessons'))}
              <div
                className="relative"
                onMouseEnter={() => setPuzzleMenuOpen(true)}
                onMouseLeave={() => setPuzzleMenuOpen(false)}
              >
                {navItem('puzzles', routes.puzzles, t('nav.puzzles'))}
                {puzzleMenuOpen && (
                  <div className="absolute left-0 top-full z-50 min-w-[200px] pt-2">
                    <div className="overflow-hidden rounded-xl border border-surface-hover bg-surface-alt shadow-xl">
                      {dropdownMenuItem('random', routes.puzzles, t('nav.puzzles_random'))}
                      {dropdownMenuItem('streak', routes.puzzleStreak, t('nav.puzzles_streak'))}
                    </div>
                  </div>
                )}
              </div>
              <div
                className="relative"
                onMouseEnter={() => setToolsMenuOpen(true)}
                onMouseLeave={() => setToolsMenuOpen(false)}
              >
                {navItem('tools', editorPath, t('nav.tools'))}
                {toolsMenuOpen && (
                  <div className="absolute left-0 top-full z-50 min-w-[200px] pt-2">
                    <div className="overflow-hidden rounded-xl border border-surface-hover bg-surface-alt shadow-xl">
                      {dropdownMenuItem('editor', editorPath, t('nav.tools_editor'))}
                      {dropdownMenuItem('analysis', routes.analysisRoot, t('nav.tools_analysis'))}
                      {dropdownMenuItem('database', routes.gameDatabase, t('nav.database'))}
                      {dropdownMenuItem('openings', routes.openingExplorer, t('nav.openings'))}
                      {dropdownMenuItem('import', routes.analysisRoot, t('nav.tools_import_game'), true)}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          )}

          <div className="hidden sm:block">
            {right}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {!loading && (
              user ? (
                <>
                  {user.role === 'admin' && (
                    <button type="button"
                      onClick={() => handleNavigate('/feedback')}
                      onMouseEnter={prefetchFeedback}
                      className="ui-btn-secondary h-7 px-2.5 text-xs text-text-dim hover:text-text-bright"
                    >
                      {t('header.admin')}
                    </button>
                  )}
                  <button type="button"
                    onClick={() => handleNavigate('/account')}
                    className="ui-btn-secondary h-7 px-2.5 text-xs text-text-dim hover:text-text-bright"
                  >
                    {user.username || user.email.split('@')[0]}
                  </button>
                </>
              ) : (
                <button type="button"
                  onClick={() => handleNavigate('/login')}
                  className="button-primary-contrast h-7 rounded-md px-2.5 text-xs font-semibold tracking-wide"
                >
                  {t('header.sign_in')}
                </button>
              )
            )}

            <AppearanceSettingsButton compact />

            <button type="button"
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="ui-btn-secondary inline-flex h-7 px-2.5 text-xs tracking-wide text-text-dim hover:text-text-bright"
              title={lang === 'en' ? t('header.switch_to_th') : t('header.switch_to_en')}
            >
              {t('lang.switch')}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            {right}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="ui-btn-secondary inline-flex h-8 items-center px-2.5 text-xs tracking-wide"
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
                {mobileNavItem('play', routes.home, t('nav.play'))}
                {mobileNavItem('watch', routes.watch, t('nav.watch'))}
                {mobileNavItem('lessons', routes.lessons, t('nav.lessons'))}
                {mobileNavItem('puzzles', routes.puzzles, t('nav.puzzles_random'))}
                {mobileNavItem('puzzles', routes.puzzleStreak, t('nav.puzzles_streak'))}
                {mobileNavItem('tools', editorPath, t('nav.tools_editor'))}
                {mobileNavItem('tools', routes.analysisRoot, t('nav.tools_analysis'))}
                {mobileNavItem('tools', routes.gameDatabase, t('nav.database'))}
                {mobileNavItem('tools', routes.openingExplorer, t('nav.openings'))}
                {mobileNavItem('games', routes.games, t('nav.games'))}
              </nav>
            )}

            <div className="grid gap-3">
              <button type="button"
                onClick={() => handleNavigate(routes.about)}
                className="ui-btn-secondary inline-flex h-9 items-center justify-center px-3 text-sm"
              >
                {t('nav.about')}
              </button>
              <AppearanceSettingsButton className="w-full justify-center" />

              <button type="button"
                onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
                className="ui-btn-secondary inline-flex h-9 items-center justify-center px-3 text-sm"
                title={lang === 'en' ? t('header.switch_to_th') : t('header.switch_to_en')}
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

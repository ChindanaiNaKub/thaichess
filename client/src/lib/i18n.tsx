import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'th';
type TranslationCatalog = Record<string, string>;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  const saved = localStorage.getItem('thaichess-lang');
  if (saved === 'th' || saved === 'en') return saved;

  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  if (browserLang.startsWith('th')) return 'th';

  return 'en';
}

async function loadThaiTranslations(): Promise<TranslationCatalog> {
  const module = await import('./i18n.th');
  return module.TH_TRANSLATIONS;
}

async function loadEnglishExtraTranslations(): Promise<TranslationCatalog> {
  const module = await import('./i18n.en.extra');
  return module.EN_EXTRA_TRANSLATIONS;
}

function applyParams(text: string, params?: Record<string, string | number>): string {
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export const EN_CORE_TRANSLATIONS: Record<string, string> = {
  'app.name': 'ThaiChess',
  'app.tagline': 'The Ancient Art of Chess',
  'nav.play': 'Play',
  'nav.watch': 'Watch',
  'nav.lessons': 'Lessons',
  'nav.puzzles': 'Puzzles',
  'nav.games': 'Games',
  'nav.about': 'About',
  'common.back_home': 'Back to Home',
  'common.white': 'White',
  'common.black': 'Black',
  'common.draw': 'Draw',
  'common.you': 'You',
  'common.guest': 'Guest',
  'common.anonymous': 'Anonymous',
  'common.cancel': 'Cancel',
  'common.send': 'Send',
  'common.sending': 'Sending...',
  'common.close': 'Close',
  'common.retry': 'Retry',
  'common.new_game': 'New Game',
  'common.loading': 'Loading...',
  'footer.tagline': 'ThaiChess — Free & Open Source',
  'footer.inspired': 'Inspired by',
  'footer.community': 'Community',
  'footer.github': 'GitHub',
  'footer.star_github': 'Star on GitHub',
  'appearance.title': 'Board & Pieces',
  'appearance.board_and_pieces': 'Board & Pieces',
  'appearance.subtitle': 'Choose a board theme and a readable piece color theme once, then use them everywhere: online, bot, local, and puzzles.',
  'appearance.open': 'Board & Pieces',
  'appearance.open_short': 'Theme',
  'appearance.boards_tab': 'Boards',
  'appearance.colors_tab': 'Piece Colors',
  'appearance.live_preview': 'Live Preview',
  'appearance.preview_title': 'Preview',
  'appearance.preview_subtitle': 'Hover to preview, click to apply instantly. Your choice is saved automatically on this device.',
  'appearance.preview_board': 'Board theme',
  'appearance.preview_piece_theme': 'Piece color theme',
  'appearance.core_shape_label': 'Core shape',
  'appearance.core_shape_desc': 'is the single supported gameplay silhouette for fast recognition and consistent play.',
  'appearance.saved_note': 'Saved automatically on this device',
  'appearance.category_classic': 'Classic',
  'appearance.category_soft': 'Soft',
  'appearance.category_dark': 'Dark Mode',
  'appearance.category_elegant': 'Elegant',
  'appearance.readability_checked': 'Contrast checked',
  'appearance.grid_contrast': 'Grid contrast',
  'appearance.piece_contrast': 'Weakest piece contrast',
  'appearance.single_surface_label': 'Single-surface Makruk',
  'appearance.single_surface_desc': 'Themes now change board tone, texture feel, and grid only.',
  'appearance.comparison_title': 'Old vs Makruk',
  'appearance.comparison_desc': 'Themes no longer switch square colors. They only change the board material tone and grid.',
  'appearance.comparison_before': 'Before',
  'appearance.comparison_after': 'Makruk now',
  'home.hero_title': 'Play Makruk Instantly',
  'home.hero_desc': 'No signup required. Start a ThaiChess game in seconds, play with friends, or practice against the bot.',
  'home.quick_play': 'Play Now',
  'home.quick_play_desc': 'Get paired instantly for casual or rated Makruk.',
  'home.find_opponent': 'Find Opponent',
  'home.no_signup': 'No signup required',
  'home.free_to_play': 'Free to play',
  'home.games_played': '{count} games played',
  'home.play_friend': 'Play a Friend',
  'home.play_friend_desc': 'Share a link',
  'home.play_bot': 'Play vs Bot',
  'home.play_bot_desc': '10 themed personas',
  'home.play_bot_long_desc': 'Challenge a roster of distinct Makruk rivals, each with a named identity, rating, and signature style.',
  'home.puzzles': 'Puzzles',
  'home.puzzles_desc': 'Tactical training',
  'home.puzzles_long_desc': 'Sharpen your tactical skills with curated puzzles from real games.',
  'home.lessons': 'Lessons',
  'home.lessons_desc': 'Structured Makruk course',
  'home.create_private': 'Create a Private Game',
  'home.private_desc': 'Choose a time control, pick a color, and share the game link.',
  'home.time_control': 'Time Control',
  'home.choose_color': 'Choose Color',
  'home.color_random': 'Random',
  'home.color_white': 'White',
  'home.color_black': 'Black',
  'home.play_with_friend': 'Play with a Friend',
  'home.creating': 'Creating...',
  'home.or': 'or',
  'home.play_local': 'Play Locally (Same Screen)',
  'home.play_local_desc': 'Pass the board back and forth on one screen.',
  'home.watch_live': 'Watch Live Games',
  'home.watch_live_desc': 'See active public Makruk games and jump straight into spectator mode.',
  'home.live_now_title': 'Live Now',
  'home.live_now_desc': 'Active public games update in real time. Open any board in read-only spectator mode.',
  'home.view_all_live': 'View All Live Games',
  'home.no_live_games': 'No live games right now',
  'home.no_live_games_desc': 'Check back soon for active public matches to watch.',
  'home.join_prompt': 'Have a game code?',
  'home.join_link': 'Join a game',
  'home.join_title': 'Join a Game',
  'home.join_desc': 'Open a shared game instantly with a code from a friend.',
  'home.join_placeholder': 'Enter game code...',
  'home.join': 'Join',
  'home.training_start': 'Start puzzle track',
  'home.training_continue': 'Continue training',
  'home.training_progress': '{done}/{total} puzzles completed',
  'home.training_focus': 'Strongest theme so far: {theme}',
  'home.training_resume': 'Last played: {title}',
  'home.training_recent': 'Latest solve: {title}',
  'home.streak_start': 'Start streak',
  'home.streak_continue': 'Jump back in',
  'home.streak_title': 'Puzzle streak',
  'home.streak_progress': '{done}/{total} lessons solved',
  'home.streak_focus': 'Best lesson theme so far: {theme}',
  'home.streak_resume': 'Last lesson played: {title}',
  'home.streak_recent': 'Latest lesson solved: {title}',
  'home.learn_eyebrow': 'Learn',
  'home.learn_title': 'Start With the Pages That Actually Help',
  'home.learn_desc': 'If you are new here, these three pages take you from basic context to your first real Makruk session.',
  'home.learn_card.what_is_title': 'What Is Makruk?',
  'home.learn_card.what_is_desc': 'Get the big picture first and see why Thai chess feels different from western chess.',
  'home.learn_card.how_to_title': 'How to Play Makruk',
  'home.learn_card.how_to_desc': 'Learn piece movement, promotion, and the counting rule without the usual confusion.',
  'home.learn_card.play_online_title': 'Play Makruk Online',
  'home.learn_card.play_online_desc': 'See whether bot games, puzzles, or live play make the best first step for you.',
  'time.bullet': 'Bullet',
  'time.blitz': 'Blitz',
  'time.rapid': 'Rapid',
  'time.classical': 'Classical',
  'puzzle.title': 'Puzzle streak',
  'quick.rated_available': 'Rated Available',
  'games.title': 'Recent Games',
  'feedback.button': 'Feedback',
  'time.just_now': 'just now',
  'time.min_ago': '{n}m ago',
  'time.hour_ago': '{n}h ago',
  'time.day_ago': '{n}d ago',
  'leaderboard.title': 'Leaderboard',
  'error.board_display': 'Board display error',
  'error.connection_title': 'Connection Error',
  'error.connection_body': 'An error occurred while loading data',
  'error.try_again': 'Try Again',
  'error.something_wrong': 'Something went wrong',
  'error.unexpected': 'The app encountered an unexpected error. This has been noted.',
  'error.unknown': 'Unknown error',
  'error.reload_page': 'Reload Page',
  'error.report_bug': 'Report this bug on GitHub',
  'header.admin': 'Admin',
  'header.sign_in': 'Sign In',
  'header.menu': 'Menu',
  'header.close_menu': 'Close',
  'header.switch_to_th': 'Switch to Thai',
  'header.switch_to_en': 'Switch to English',
  'footer.links_label': 'Site footer links',
  'footer.what_is_makruk': 'What Is Makruk?',
  'footer.how_to_play_makruk': 'How to Play Makruk',
  'lang.switch': 'TH',
};

const loadedTranslations: Partial<Record<Language, TranslationCatalog>> = {
  en: EN_CORE_TRANSLATIONS,
};
let englishExtraPromise: Promise<TranslationCatalog> | null = null;
let englishExtraLoaded = false;

function getEnglishTranslations(): TranslationCatalog {
  return loadedTranslations.en ?? EN_CORE_TRANSLATIONS;
}

export async function ensureEnglishExtraTranslations(): Promise<TranslationCatalog> {
  if (englishExtraLoaded) {
    return getEnglishTranslations();
  }

  if (!englishExtraPromise) {
    englishExtraPromise = loadEnglishExtraTranslations().then((extraTranslations) => {
      const mergedTranslations = {
        ...EN_CORE_TRANSLATIONS,
        ...extraTranslations,
      };
      loadedTranslations.en = mergedTranslations;
      englishExtraLoaded = true;
      return mergedTranslations;
    });
  }

  return englishExtraPromise;
}

export async function ensureTranslations(lang: Language): Promise<TranslationCatalog> {
  if (loadedTranslations[lang]) {
    return loadedTranslations[lang];
  }

  if (lang === 'th') {
    const thaiTranslations = await loadThaiTranslations();
    loadedTranslations.th = thaiTranslations;
    return thaiTranslations;
  }

  return EN_CORE_TRANSLATIONS;
}

export async function preloadDetectedTranslations(): Promise<Language> {
  const lang = detectLanguage();
  await ensureTranslations(lang);
  return lang;
}

function getTranslations(lang: Language): TranslationCatalog {
  if (lang === 'en') {
    return getEnglishTranslations();
  }

  return loadedTranslations[lang] ?? EN_CORE_TRANSLATIONS;
}

export function translate(
  key: string,
  params?: Record<string, string | number>,
  lang: Language = detectLanguage()
): string {
  const translations = getTranslations(lang);
  return applyParams(translations[key] || EN_CORE_TRANSLATIONS[key] || key, params);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);

  const setLang = useCallback((newLang: Language) => {
    const applyLanguage = () => {
      setLangState(newLang);
      localStorage.setItem('thaichess-lang', newLang);
      document.documentElement.lang = newLang;
    };

    if (newLang === 'en' || loadedTranslations[newLang]) {
      applyLanguage();
      return;
    }

    void ensureTranslations(newLang).then(() => {
      applyLanguage();
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translations = getTranslations(lang);
    return applyParams(translations[key] || EN_CORE_TRANSLATIONS[key] || key, params);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}

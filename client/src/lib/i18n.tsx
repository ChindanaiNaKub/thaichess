import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'en' | 'th';
type TranslationCatalog = Record<string, string>;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const BOOTSTRAP_TRANSLATIONS: TranslationCatalog = {
  'app.name': 'ThaiChess',
  'app.tagline': 'The Ancient Art of Chess',
  'appearance.open': 'Board & Pieces',
  'appearance.open_short': 'Theme',
  'common.back_home': 'Back to Home',
  'common.close': 'Close',
  'common.sending': 'Sending...',
  'error.connection_body': 'Something went wrong while connecting. Please try again.',
  'feedback.button': 'Feedback',
  'footer.community': 'Community',
  'footer.github': 'GitHub',
  'footer.how_to_play_makruk': 'How to Play Makruk',
  'footer.inspired': 'Inspired by',
  'footer.links_label': 'Useful links',
  'footer.star_github': 'Star on GitHub',
  'footer.support': 'Support ThaiChess',
  'footer.support_desc': 'ThaiChess is free and has no ads. Running it costs $20/month. If you enjoy playing, consider supporting the project!',
  'footer.donate_thai': 'Donate via QR',
  'footer.thanks': 'Thank you for keeping ThaiChess alive! 🙏',
  'footer.bank_info': 'SCB: 697-230137-6 | Name: Chindanai N.',
  'footer.tagline': 'ThaiChess — Free & Open Source',
  'footer.what_is_makruk': 'What Is Makruk?',
  'games.title': 'Recent Games',
  'privacy.title': 'Privacy Policy | นโยบายความเป็นส่วนตัว',
  'terms.title': 'Terms of Service | ข้อกำหนดการใช้งาน',
  'cookies.message': 'We use essential cookies for authentication and settings only.',
  'cookies.dismiss': 'Got it',
  'cookies.title': 'We use essential cookies',
  'cookies.description': 'This site uses cookies for authentication and language settings only. No marketing or tracking cookies.',
  'cookies.read_more': 'Read more:',
  'auth.sign_in': 'Sign In',
  'auth.continue_with_google': 'Continue with Google',
  'auth.signing_in': 'Signing in...',
  'auth.or_email_fallback': 'Or use email',
  'auth.hide_email': 'Hide email',
  'auth.email_placeholder': 'you@example.com',
  'auth.send_code': 'Send code',
  'auth.sending_code': 'Sending...',
  'auth.code_sent_to': 'Code sent to {email}',
  'auth.code_placeholder': 'Enter 6-digit code',
  'auth.verify_code': 'Verify code',
  'auth.use_another_email': 'Use another email',
  'auth.back_to_play': 'Back to play',
  'auth.send_code_failed': 'Failed to send code. Please try again.',
  'auth.sign_in_failed': 'Sign in failed. Please try again.',
  'auth.consent_text': 'I agree to the',
  'auth.privacy_link': 'Privacy Policy',
  'auth.terms_link': 'Terms of Service',
  'auth.consent_error': 'You must accept the policy and terms to create an account',
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms',
  'footer.and': '&',
  'common.dismiss': 'Dismiss',
  'common.delete': 'Delete',
  'common.confirm': 'Confirm',
  'header.admin': 'Admin',
  'header.close_menu': 'Close',
  'header.menu': 'Menu',
  'header.sign_in': 'Sign In',
  'header.switch_to_en': 'Switch to English',
  'header.switch_to_th': 'เปลี่ยนเป็นภาษาไทย',
  'home.choose_color': 'Choose Color',
  'home.color_black': 'Black',
  'home.color_random': 'Random',
  'home.color_white': 'White',
  'home.create_private': 'Create a Private Game',
  'home.creating': 'Creating...',
  'home.find_opponent': 'Find Opponent',
  'home.free_to_play': 'Free to play',
  'home.hero_desc': 'No signup required. Start a ThaiChess game in seconds, play with friends, or practice against the bot.',
  'home.hero_title': 'Play Makruk Instantly',
  'home.join': 'Join',
  'home.join_desc': 'Open a shared game instantly with a code from a friend.',
  'home.join_placeholder': 'Enter game code...',
  'home.join_title': 'Join a Game',
  'home.learn_card.how_to_desc': 'Learn piece movement, promotion, and the counting rule without the usual confusion.',
  'home.learn_card.how_to_title': 'How to Play Makruk',
  'home.learn_card.play_online_desc': 'See whether bot games, puzzles, or live play make the best first step for you.',
  'home.learn_card.play_online_title': 'Play Makruk Online',
  'home.learn_card.what_is_desc': 'Get the big picture first and see why Thai chess feels different from western chess.',
  'home.learn_card.what_is_title': 'What Is Makruk?',
  'home.learn_desc': 'If you are new here, these three pages take you from basic context to your first real Makruk session.',
  'home.learn_eyebrow': 'Learn',
  'home.learn_title': 'Start With the Pages That Actually Help',
  'home.lessons': 'Lessons',
  'home.lessons_desc': 'Structured Makruk course',
  'home.live_now_desc': 'Active public games update in real time. Open any board in read-only spectator mode.',
  'home.live_now_title': 'Live Now',
  'home.no_live_games': 'No live games right now',
  'home.no_live_games_desc': 'Check back soon for active public matches to watch.',
  'home.no_signup': 'No signup required',
  'home.play_bot': 'Play vs Bot',
  'home.play_bot_desc': '10 themed personas',
  'home.play_bot_long_desc': 'Challenge a roster of distinct Makruk rivals, each with a named identity, rating, and signature style.',
  'home.play_local': 'Play Locally (Same Screen)',
  'home.play_local_desc': 'Pass the board back and forth on one screen.',
  'home.play_with_friend': 'Play with a Friend',
  'home.private_desc': 'Choose a time control, pick a color, and share the game link.',
  'home.puzzles': 'Puzzles',
  'home.puzzles_desc': 'Tactical training',
  'home.quick_play': 'Play Now',
  'home.quick_play_desc': 'Get paired instantly for casual or rated Makruk.',
  'home.streak_start': 'Start streak',
  'home.streak_title': 'Puzzle streak',
  'home.time_control': 'Time Control',
  'home.view_all_live': 'View All Live Games',
  'home.watch_live': 'Watch Live Games',
  'home.watch_live_desc': 'See active public Makruk games and jump straight into spectator mode.',
  'lang.switch': 'TH',
  'leaderboard.title': 'Leaderboard',
  'leaderboard.you': 'You',
  'nav.about': 'About',
  'nav.games': 'Games',
  'nav.lessons': 'Lessons',
  'nav.play': 'Play',
  'nav.puzzles': 'Puzzles',
  'nav.watch': 'Watch',
  'puzzle.title': 'Puzzle Streak',
  'quick.casual_only': 'Casual Only',
  'quick.desc': 'Find an opponent instantly. No link sharing needed!',
  'quick.find': 'Find Opponent',
  'quick.rated_restricted': 'This account can still quick-play casually, but rated pairings are disabled.',
  'quick.rated_sign_in': 'Sign in to unlock rated games.',
  'quick.rated_signed_in': 'Rated if your opponent is also signed in.',
  'quick.rated_unavailable': 'Rated Disabled',
  'quick.title': 'Quick Play',
  'quick.rated_available': 'Rated Available',
  'sharecard.title': 'Share cards',
  'sharecard.variant_result': 'Result',
  'sharecard.variant_accuracy': 'Accuracy',
  'sharecard.variant_rating': 'Rating',
  'sharecard.final_position': 'Final position',
  'sharecard.result_heading': 'Result',
  'sharecard.download_png': 'Download PNG',
  'sharecard.share_image': 'Share image',
  'time.blitz': 'Blitz',
  'time.bullet': 'Bullet',
  'time.classical': 'Classical',
  'time.rapid': 'Rapid',
};

const THAI_SWITCH_BOOTSTRAP_TRANSLATIONS: TranslationCatalog = {
  'header.switch_to_en': 'Switch to English',
  'header.switch_to_th': 'เปลี่ยนเป็นภาษาไทย',
  'lang.switch': 'EN',
};

const loadedTranslations: Partial<Record<Language, TranslationCatalog>> = {
  en: BOOTSTRAP_TRANSLATIONS,
};

let fullEnglishLoaded = false;
let englishTranslationsPromise: Promise<TranslationCatalog> | null = null;
let thaiTranslationsPromise: Promise<TranslationCatalog> | null = null;
const shouldEagerlyLoadEnglish = import.meta.env.MODE === 'test';

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  const saved = localStorage.getItem('thaichess-lang');
  if (saved === 'th' || saved === 'en') return saved;

  const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || '';
  if (browserLang.startsWith('th')) return 'th';

  return 'en';
}

async function loadEnglishTranslations(): Promise<TranslationCatalog> {
  englishTranslationsPromise ??= import('./i18n.full').then((module) => {
    fullEnglishLoaded = true;
    loadedTranslations.en = module.EN_TRANSLATIONS;
    return module.EN_TRANSLATIONS;
  });

  return englishTranslationsPromise;
}

async function loadThaiTranslations(): Promise<TranslationCatalog> {
  thaiTranslationsPromise ??= import('./i18n.th').then((module) => {
    loadedTranslations.th = module.TH_TRANSLATIONS;
    return module.TH_TRANSLATIONS;
  });

  return thaiTranslationsPromise;
}

function applyParams(text: string, params?: Record<string, string | number>): string {
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }
  return text;
}

function getDefaultTranslations(lang: Language): TranslationCatalog {
  if (lang === 'th') {
    return loadedTranslations.th
      ?? {
        ...BOOTSTRAP_TRANSLATIONS,
        ...THAI_SWITCH_BOOTSTRAP_TRANSLATIONS,
      };
  }

  return loadedTranslations.en ?? BOOTSTRAP_TRANSLATIONS;
}

export async function ensureTranslations(lang: Language): Promise<TranslationCatalog> {
  if (lang === 'th') {
    if (loadedTranslations.th) {
      return loadedTranslations.th;
    }
    return loadThaiTranslations();
  }

  if (fullEnglishLoaded && loadedTranslations.en) {
    return loadedTranslations.en;
  }

  return loadEnglishTranslations();
}

export async function preloadDetectedTranslations(): Promise<Language> {
  const lang = detectLanguage();

  if (lang === 'th' || shouldEagerlyLoadEnglish) {
    await ensureTranslations(lang);
  }

  return lang;
}

function getTranslations(lang: Language): TranslationCatalog {
  return getDefaultTranslations(lang);
}

export function translate(
  key: string,
  params?: Record<string, string | number>,
  lang: Language = detectLanguage(),
): string {
  const translations = getTranslations(lang);
  return applyParams(translations[key] || BOOTSTRAP_TRANSLATIONS[key] || key, params);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);
  const [, setCatalogVersion] = useState(0);

  const setLang = useCallback((newLang: Language) => {
    const applyLanguage = () => {
      setLangState(newLang);
      localStorage.setItem('thaichess-lang', newLang);
      document.documentElement.lang = newLang;
    };

    if (newLang === 'th' && !loadedTranslations.th) {
      void ensureTranslations(newLang).then(() => {
        applyLanguage();
        setCatalogVersion((version) => version + 1);
      });
      return;
    }

    if (newLang === 'en') {
      void ensureTranslations(newLang)
        .then(() => {
          setCatalogVersion((version) => version + 1);
        })
        .catch(() => {
          // Keep bootstrap translations active even if the full catalog fails to load.
        });
    }

    applyLanguage();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (lang !== 'th') {
      return;
    }

    if (loadedTranslations.th) {
      return;
    }

    let cancelled = false;

    void ensureTranslations(lang).then(() => {
      if (cancelled) return;
      setCatalogVersion((version) => version + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (lang !== 'en' || fullEnglishLoaded || !shouldEagerlyLoadEnglish) {
      return;
    }

    let cancelled = false;

    void ensureTranslations('en').then(() => {
      if (cancelled) return;
      setCatalogVersion((version) => version + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translations = getTranslations(lang);
    return applyParams(translations[key] || BOOTSTRAP_TRANSLATIONS[key] || key, params);
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

export type Language = 'en' | 'th';
type TranslationCatalog = Record<string, string>;

export const BOOTSTRAP_TRANSLATIONS: TranslationCatalog = {
  'app.name': 'ThaiChess',
  'app.tagline': 'Makruk — play in seconds',
  'appearance.open': 'Board & Pieces',
  'appearance.open_short': 'Theme',
  'common.back_home': 'Back to Home',
  'common.close': 'Close',
  'common.retry': 'Retry',
  'common.sending': 'Sending...',
  'error.connection_body': 'Something went wrong while connecting. Please try again.',
  'feedback.button': 'Feedback',
  'footer.community': 'Community',
  'footer.discord': 'Discord',
  'footer.github': 'GitHub',
  'footer.how_to_play_makruk': 'How to Play Makruk',
  'footer.inspired': 'Inspired by',
  'footer.links_label': 'Useful links',
  'footer.star_github': 'Star on GitHub',
  'footer.support_desc': 'ThaiChess stays free and ad-free — if you want to help cover costs,',
  'footer.donate': 'Donate',
  'footer.tagline': 'ThaiChess — Free & Open Source',
  'donate.title': 'Donate',
  'donate.desc': 'ThaiChess stays free and ad-free. Transfers help cover hosting and development.',
  'donate.bank_info': 'SCB: 697-230137-6 | Name: Chindanai N.',
  'donate.thanks': 'Thanks.',
  'donate.qr_alt': 'ThaiChess donation QR code',
  'footer.what_is_makruk': 'What Is Makruk?',
  'games.title': 'Recent Games',
  'nav.database': 'Database',
  'nav.openings': 'Openings',
  'database.title': 'Game Database',
  'database.opening_explorer': 'Opening Explorer',
  'database.search_player': 'Search player name...',
  'database.player': 'Player',
  'database.min_rating': 'Min Rating',
  'database.max_rating': 'Max Rating',
  'database.result': 'Result',
  'database.type': 'Type',
  'database.mode': 'Mode',
  'database.any': 'Any',
  'database.white_wins': 'White wins',
  'database.black_wins': 'Black wins',
  'database.draw': 'Draw',
  'database.rated': 'Rated',
  'database.casual': 'Casual',
  'database.quick_play': 'Quick Play',
  'database.private': 'Private',
  'database.bot': 'Bot',
  'database.local': 'Local',
  'database.search': 'Search',
  'database.reset': 'Reset',
  'database.games_found': '{count} games found',
  'database.prev': 'Prev',
  'database.next': 'Next',
  'database.prev_page': 'Previous page of search results',
  'database.next_page': 'Next page of search results',
  'database.failed': 'Failed to load games',
  'database.empty_title': 'No games found',
  'database.empty_desc': 'Try adjusting your search filters.',
  'database.results_caption': 'Game Database search results',
  'database.players': 'Players',
  'database.time': 'Time',
  'database.moves': 'Moves',
  'database.date': 'Date',
  'database.action': 'Action',
  'database.analyze': 'Analyze',
  'games.moves_count': '{count} moves',
  'openings.title': 'Opening Explorer',
  'openings.database_link': 'Game Database',
  'openings.games_in_database': '{count} games in database',
  'openings.moves': 'Moves:',
  'openings.move_statistics': 'Move Statistics',
  'openings.empty_title': 'No data yet',
  'openings.empty_desc': 'Play games or run the backfill first, then explore from any position.',
  'openings.empty_hint': 'Make a move on the board to explore',
  'openings.games_for_move': 'Games with {move}',
  'openings.no_games_found': 'No games found',
  'openings.win_rate': '{rate}% wins for {color}',
  'openings.pagination': '{current} / {total}',
  'privacy.title': 'Privacy Policy | นโยบายความเป็นส่วนตัว',
  'terms.title': 'Terms of Service | ข้อกำหนดการใช้งาน',
  'cookies.message': 'We use essential cookies for authentication and settings only.',
  'cookies.dismiss': 'Got it',
  'cookies.title': 'We use essential cookies',
  'cookies.description': 'This site uses cookies for authentication and language settings only. No marketing or tracking cookies.',
  'cookies.title_analytics': 'Cookies & optional analytics',
  'cookies.description_analytics': 'Essential cookies keep you signed in and save language settings. You can also allow privacy-friendly analytics (PostHog) with no advertising cookies.',
  'cookies.essential_only': 'Essential only',
  'cookies.accept_analytics': 'Accept analytics',
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
  'auth.session_check_title': 'Connection issue',
  'auth.session_check_failed': 'We could not check your session.',
  'auth.session_check_desc': 'Your account may still be signed in. Reload once the connection is back.',
  'analysis.sign_in_required': 'Sign in to use engine analysis.',
  'analysis.editor.sign_in_to_analyze': 'Sign in to analyze',
  'analysis.editor.error': 'Position analysis failed',
  'analysis.editor.reset_board': 'Reset board',
  'analysis.editor.clear_board': 'Clear board',
  'analysis.editor.analyzing_position': 'Analyzing...',
  'analysis.editor.analyze_position': 'Analyze position',
  'analysis.editor.tools': 'Editor Tools',
  'analysis.editor.move_pieces': 'Move pieces',
  'analysis.editor.erase_square': 'Erase square',
  'analysis.editor.position': 'Position',
  'analysis.editor.copy_position': 'Copy position',
  'analysis.editor.copy_link': 'Copy link',
  'analysis.editor.engine': 'Engine',
  'analysis.editor.eval': 'Eval',
  'analysis.editor.best_move': 'Best move',
  'analysis.editor.none': 'none',
  'analysis.editor.source': 'Source',
  'analysis.editor.depth': 'Depth',
  'analysis.editor.pv': 'PV',
  'analysis.editor.label': 'Editor',
  'analysis.editor.turn_to_move': '{color} to move',
  'analysis.editor.black_pieces': 'Black pieces',
  'analysis.editor.white_pieces': 'White pieces',
  'analysis.editor.validation': 'Position validation',
  'analysis.editor.position_legal': 'Position is legal',
  'analysis.editor.position_needs_work': 'Fix the position before analysis',
  'analysis.editor.actions': 'Actions',
  'analysis.editor.flip_board': 'Flip board',
  'analysis.editor.validation.one_king': '{color} must have exactly one king.',
  'analysis.editor.validation.too_many_piece': '{color} has too many {piece} pieces for a legal Makruk game.',
  'analysis.editor.validation.too_many_bia': '{color} has more than eight bia/promoted-bia units.',
  'analysis.editor.validation.too_many_promoted_bia': '{color} has too many promoted bia pieces.',
  'analysis.editor.validation.too_many_met_like': '{color} has more met-like pieces than a legal Makruk game can produce.',
  'analysis.editor.validation.too_many_total': '{color} has more than sixteen pieces on the board.',
  'analysis.editor.validation.bia_behind': '{color} bia cannot be behind its starting rank.',
  'analysis.editor.validation.bia_unpromoted': '{color} bia cannot remain unpromoted on or beyond the promotion rank.',
  'analysis.editor.validation.board_shape': 'Board must be 8x8.',
  'analysis.editor.validation.adjacent_kings': 'Kings cannot be adjacent in a legal Makruk position.',
  'analysis.editor.validation.both_kings_check': 'Both kings cannot be in check at the same time.',
  'analysis.editor.validation.no_legal_turn': 'Board does not admit any legal side-to-move assignment.',
  'analysis.quick.title': 'Quick Analysis',
  'analysis.quick.desc': 'Play legal Makruk moves from the starting position and get engine feedback for the current board.',
  'analysis.quick.flip_board': 'Flip board',
  'analysis.quick.reset': 'Reset analysis',
  'analysis.quick.open_editor': 'Open position editor',
  'analysis.quick.variation': 'Current variation',
  'analysis.quick.moves': '{count} move(s)',
  'analysis.quick.empty_variation': 'Make a move on the board to begin an analysis line.',
  'analysis.quick.to_start': 'Go to start',
  'analysis.quick.back': 'Step back',
  'analysis.quick.forward': 'Step forward',
  'analysis.quick.to_end': 'Go to end',
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
  'home.choose_mode': 'Choose mode',
  'home.challenge_cta': 'Play vs Bot',
  'home.challenge_desc': 'No live games right now. Challenge a Makruk bot — or warm up with a puzzle streak.',
  'home.challenge_eyebrow': 'While you wait',
  'home.challenge_secondary': 'Try a puzzle streak',
  'home.challenge_title': 'Play a bot while you wait',
  'home.color_black': 'Black',
  'home.color_random': 'Random',
  'home.color_white': 'White',
  'home.create_private': 'Create a Private Game',
  'home.creating': 'Creating...',
  'home.find_opponent': 'Find Opponent',
  'home.free_to_play': 'Free to play',
  'home.games_played': '{count} games played',
  'home.hero_desc': 'No signup. A human when the table is busy — a bot when it is quiet.',
  'home.hero_title': 'Play Makruk anytime',
  'home.join': 'Join',
  'home.join_desc': 'Open a shared game with a code from a friend.',
  'home.join_placeholder': 'Enter game code...',
  'home.join_title': 'Join a Game',
  'home.learn_card.how_to_desc': 'Learn piece movement, promotion, and the counting rule without the usual confusion.',
  'home.learn_card.how_to_title': 'How to Play Makruk',
  'home.learn_card.play_online_desc': 'See whether bot games, puzzles, or live play make the best first step for you.',
  'home.learn_card.play_online_title': 'Play Makruk Online',
  'home.learn_card.what_is_desc': 'Get the big picture first and see why Thai chess feels different from western chess.',
  'home.learn_card.what_is_title': 'What Is Makruk?',
  'home.learn_desc': 'Three short pages from what Makruk is to your first real game.',
  'home.learn_eyebrow': 'Learn',
  'home.learn_title': 'Learn Makruk',
  'home.lessons': 'Lessons',
  'home.lessons_desc': 'Structured Makruk course',
  'home.live_now_desc': 'Active public games update in real time. Open any board in read-only spectator mode.',
  'home.live_now_title': 'Live Now',
  'home.more_ways': 'More ways to play',
  'home.more_times': 'More times',
  'home.fewer_times': 'Fewer times',
  'home.no_live_games': 'No live games right now',
  'home.no_live_games_desc': 'Check back soon for active public games to watch.',
  'home.no_signup': 'No signup required',
  'home.play_bot': 'Play vs Bot',
  'home.play_bot_desc': '12 themed personas',
  'home.play_bot_long_desc': 'Challenge a roster of distinct Makruk rivals, each with a named identity, rating, and signature style.',
  'home.play_friend': 'Play a Friend',
  'home.play_friend_desc': 'Share a link',
  'home.play_local': 'Play Locally (Same Screen)',
  'home.play_local_desc': 'Pass the board back and forth on one screen.',
  'home.play_with_friend': 'Play with a Friend',
  'home.private_desc': 'Choose a time control, pick a color, and share the game link.',
  'home.puzzles': 'Puzzles',
  'home.puzzles_desc': 'Tactical training',
  'home.quick_play': 'Play now',
  'home.quick_play_time': '5 min',
  'home.quick_play_desc': '5 minutes · starts a game',
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
  'nav.puzzles_random': 'Random Puzzle',
  'nav.puzzles_themes': 'Puzzle Themes',
  'nav.puzzles_streak': 'Puzzle Streak',
  'nav.tools': 'Tools',
  'nav.tools_editor': 'Editor',
  'nav.tools_analysis': 'Analysis',
  'nav.tools_import_game': 'Import game',
  'nav.watch': 'Watch',
  'puzzle.title': 'Puzzle Streak',
  'puzzle.more_details': 'More details',
  'puzzle.source_community': 'Community source',
  'puzzle.review_mode_on': 'Review mode: board interaction is paused while browsing previous moves.',
  'puzzle.review_mode_off': 'Live mode: use Arrow keys to review, H for hint, R for retry, N for next puzzle.',
  'quick.casual_only': 'Casual Only',
  'quick.desc': 'Search for a human game. If nobody is around, you can switch to bot play without waiting.',
  'quick.fallback_desc': 'Play a bot now, or keep searching for a human game.',
  'quick.fallback_title': 'No opponent yet',
  'quick.find': 'Find Opponent',
  'quick.keep_searching': 'Keep searching',
  'quick.play_bot_now': 'Play bot now',
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
  'sharecard.accuracy_sign_in': 'Sign in to include accuracy.',
  'sharecard.final_position': 'Final position',
  'sharecard.result_heading': 'Result',
  'sharecard.download_png': 'Download PNG',
  'sharecard.share_image': 'Share image',
  'bot.engine_unavailable': 'Fairy-Stockfish is unavailable. Please try again in a moment.',
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

export const loadedTranslations: Partial<Record<Language, TranslationCatalog>> = {
  en: BOOTSTRAP_TRANSLATIONS,
};

export let fullEnglishLoaded = false;
let englishTranslationsPromise: Promise<TranslationCatalog> | null = null;
let thaiTranslationsPromise: Promise<TranslationCatalog> | null = null;
export const shouldEagerlyLoadEnglish = import.meta.env.MODE === 'test';

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  const saved = localStorage.getItem('thaichess-lang');
  if (saved === 'th' || saved === 'en') return saved;

  const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || '';
  if (browserLang.startsWith('th')) return 'th';

  return 'en';
}

async function loadEnglishTranslations(): Promise<TranslationCatalog> {
  englishTranslationsPromise ??= import('./i18n.en').then((module) => {
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

export function applyParams(text: string, params?: Record<string, string | number>): string {
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

export function getTranslations(lang: Language): TranslationCatalog {
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

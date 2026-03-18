import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'th';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function detectLanguage(): Language {
  const saved = localStorage.getItem('makruk-lang');
  if (saved === 'th' || saved === 'en') return saved;

  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  if (browserLang.startsWith('th')) return 'th';

  return 'en';
}

const EN: Record<string, string> = {
  // Common
  'app.name': 'Makruk',
  'app.tagline': 'Thai Chess Online',
  'nav.play': 'Play',
  'nav.puzzles': 'Puzzles',
  'nav.games': 'Games',
  'nav.about': 'About',
  'common.back_home': 'Back to Home',
  'common.white': 'White',
  'common.black': 'Black',
  'common.draw': 'Draw',
  'common.you': 'You',
  'common.cancel': 'Cancel',
  'common.send': 'Send',
  'common.sending': 'Sending...',
  'common.close': 'Close',
  'common.retry': 'Retry',
  'common.new_game': 'New Game',
  'footer.tagline': 'Makruk Online — Free & Open Source',
  'footer.inspired': 'Inspired by',

  // Home Page
  'home.hero_title': 'Play Makruk Online',
  'home.hero_desc': 'The ancient Thai game of chess. Play online, offline with bots, or sharpen your skills with puzzles.',
  'home.quick_play': 'Quick Play',
  'home.quick_play_desc': 'Find an opponent instantly — no link sharing needed',
  'home.find_opponent': 'Find Opponent',
  'home.play_friend': 'Play a Friend',
  'home.play_friend_desc': 'Share a link',
  'home.play_bot': 'Play vs Bot',
  'home.play_bot_desc': '3 difficulty levels',
  'home.puzzles': 'Puzzles',
  'home.puzzles_desc': 'Tactical training',
  'home.create_private': 'Create a Private Game',
  'home.time_control': 'Time Control',
  'home.play_with_friend': 'Play with a Friend',
  'home.creating': 'Creating...',
  'home.or': 'or',
  'home.play_local': 'Play Locally (Same Screen)',
  'home.join_prompt': 'Have a game code?',
  'home.join_link': 'Join a game',
  'home.join_title': 'Join a Game',
  'home.join_placeholder': 'Enter game code...',
  'home.join': 'Join',
  'home.rules_title': 'How to Play Makruk',
  'home.rules_intro': 'Makruk (Thai Chess) is the traditional chess of Thailand, closely related to the original Indian game of chess.',
  'home.rules_pieces': 'Pieces:',
  'home.rules_special': 'Special Rules:',
  'home.piece_king': 'Khun (King) – Moves 1 square in any direction',
  'home.piece_queen': 'Met (Queen) – Moves 1 square diagonally',
  'home.piece_bishop': 'Khon (Bishop) – Moves 1 square diagonally or 1 forward',
  'home.piece_rook': 'Rua (Rook) – Moves any distance horizontally/vertically',
  'home.piece_knight': 'Ma (Knight) – Moves in an L-shape (like chess)',
  'home.piece_pawn': 'Bia (Pawn) – Moves 1 forward, captures diagonally',
  'home.rule_pawn_rank': 'Pawns start on the 3rd rank (not 2nd)',
  'home.rule_promote': 'Pawns promote to Met when reaching the 6th rank',
  'home.rule_no_special': 'No castling, no en passant, no double pawn step',
  'home.rule_checkmate': 'Checkmate wins the game',

  // Time presets
  'time.bullet': 'Bullet',
  'time.blitz': 'Blitz',
  'time.rapid': 'Rapid',
  'time.classical': 'Classical',

  // Bot Game
  'bot.title': 'Play vs Bot',
  'bot.setup_title': 'Play vs Computer',
  'bot.difficulty': 'Difficulty',
  'bot.easy': 'Easy',
  'bot.easy_desc': 'Random moves with basic captures',
  'bot.medium': 'Medium',
  'bot.medium_desc': 'Thinks 2 moves ahead',
  'bot.hard': 'Hard',
  'bot.hard_desc': 'Thinks 4 moves ahead',
  'bot.play_as': 'Play as',
  'bot.random': 'Random',
  'bot.start': 'Start Game',
  'bot.thinking': 'thinking...',
  'bot.your_turn': 'Your turn',
  'bot.bot_thinking': 'Bot is thinking...',
  'bot.you_won': 'You Won!',
  'bot.bot_wins': 'Bot Wins',
  'bot.resign': 'Resign',
  'bot.resign_confirm': 'Are you sure you want to resign?',
  'bot.vs_bot': 'vs Bot',

  // Puzzles
  'puzzle.title': 'Makruk Puzzles',
  'puzzle.desc': 'Sharpen your Makruk skills with tactical puzzles. Find the best move!',
  'puzzle.completed': '{done}/{total} completed',
  'puzzle.all': 'All',
  'puzzle.beginner': 'Beginner',
  'puzzle.intermediate': 'Intermediate',
  'puzzle.advanced': 'Advanced',
  'puzzle.to_move': '{color} to move',
  'puzzle.find_best': 'Find the best move for {color}!',
  'puzzle.step': 'Step {current} of {total}',
  'puzzle.correct': 'Correct!',
  'puzzle.solved_hint': 'Solved with hint',
  'puzzle.solved_clean': 'Solved without hints!',
  'puzzle.wrong': 'Not quite!',
  'puzzle.wrong_desc': "That wasn't the best move. Try again!",
  'puzzle.hint': 'Hint',
  'puzzle.next': 'Next Puzzle',
  'puzzle.previous': 'Previous',
  'puzzle.all_puzzles': 'All Puzzles',
  'puzzle.not_found': 'Puzzle not found',
  'puzzle.back': 'Back to Puzzles',

  // Puzzle themes
  'theme.Checkmate': 'Checkmate',
  'theme.Fork': 'Fork',
  'theme.Skewer': 'Skewer',
  'theme.Promotion': 'Promotion',
  'theme.Tactic': 'Tactic',
  'theme.Discovery': 'Discovery',
  'theme.Sacrifice': 'Sacrifice',
  'theme.Endgame': 'Endgame',

  // Quick Play / Matchmaking
  'quick.title': 'Quick Play',
  'quick.desc': 'Find an opponent instantly. No link sharing needed!',
  'quick.searching': 'Finding opponent...',
  'quick.search_time': 'Searching for {time}',
  'quick.queue': '{count} player(s) in queue',
  'quick.find': 'Find Opponent',

  // Game Page
  'game.waiting_title': 'Waiting for opponent',
  'game.waiting_desc': 'Share this link with a friend to start playing',
  'game.copy': 'Copy',
  'game.copied': 'Copied!',
  'game.playing_as': 'You are playing as {color}',
  'game.connecting': 'Connecting to game...',
  'game.error': 'Error',
  'game.your_turn': 'Your turn',
  'game.opponent_turn': "Opponent's turn",
  'game.you_won': 'You won!',
  'game.you_lost': 'You lost',
  'game.draw_offer_received': 'Your opponent offers a draw',
  'game.accept': 'Accept',
  'game.decline': 'Decline',
  'game.offer_draw': '½ Draw',
  'game.resign': '⚐ Resign',
  'game.resign_confirm': 'Are you sure you want to resign?',
  'game.share': 'Share',
  'game.piece_guide': '📖 Piece Guide',
  'game.opponent_dc': 'Opponent disconnected. Waiting for reconnection...',
  'game.game_label': 'Game:',

  // Game Over Modal
  'gameover.you_win': 'You Win!',
  'gameover.you_lost': 'You Lost',
  'gameover.draw': 'Draw',
  'gameover.by_checkmate': 'by checkmate',
  'gameover.by_resign': 'by resignation',
  'gameover.by_timeout': 'on time',
  'gameover.by_stalemate': 'by stalemate',
  'gameover.by_agreement': 'by mutual agreement',
  'gameover.by_material': 'by insufficient material',
  'gameover.rematch': 'Rematch',

  // Local Game
  'local.title': 'Local Game',
  'local.view_as': 'View as:',
  'local.turn': "{color}'s turn",
  'local.wins': '{color} wins!',
  'local.play_online': 'Play Online',

  // Move History
  'moves.title': 'Moves',
  'moves.empty': 'No moves yet',

  // Piece Guide
  'guide.title': 'Piece Guide',
  'guide.king': 'Khun (King)',
  'guide.queen': 'Met (Queen)',
  'guide.bishop': 'Khon (Bishop)',
  'guide.rook': 'Rua (Rook)',
  'guide.knight': 'Ma (Knight)',
  'guide.pawn': 'Bia (Pawn)',
  'guide.promoted': 'Bia Ngai (Promoted)',
  'guide.king_move': '1 square in any direction',
  'guide.queen_move': '1 square diagonally only',
  'guide.bishop_move': '1 square diagonally or 1 forward',
  'guide.rook_move': 'Any distance horizontally or vertically',
  'guide.knight_move': 'L-shape: 2+1 squares',
  'guide.pawn_move': '1 forward; captures diagonally',
  'guide.promoted_move': 'Same as Met (1 diagonal)',

  // Connection
  'conn.connected': 'Connected',
  'conn.reconnecting': 'Reconnecting...',
  'conn.disconnected': 'Disconnected — trying to reconnect...',

  // About Page
  'about.title': 'About Makruk Online',
  'about.intro1': 'Makruk Online is a <strong>free, open-source</strong> platform for playing Makruk (Thai Chess) with anyone in the world. No registration, no ads, no paywall — just pure Thai chess.',
  'about.intro2': 'Our mission is to make <strong>Makruk famous worldwide</strong>. Thai chess is one of the oldest board games in the world, closer to the original Indian chess (Chaturanga) than modern Western chess. It deserves a world-class online platform, just like chess has Lichess.',
  'about.intro3': 'Inspired by <a href="https://lichess.org" target="_blank" rel="noopener" class="text-primary hover:text-primary-light underline">Lichess</a>, we believe great gaming platforms should be free for everyone.',
  'about.stats_title': 'Platform Stats',
  'about.games_played': 'Games Played',
  'about.total_moves': 'Total Moves',
  'about.white_wins': 'White Wins',
  'about.black_wins': 'Black Wins',
  'about.support_title': 'Support the Project',
  'about.support_desc': 'Makruk Online runs on donations and community support. If you enjoy playing, consider helping us keep the servers running:',
  'about.star': 'Star us on GitHub',
  'about.star_desc': ' — helps others discover the project',
  'about.share': 'Share with friends',
  'about.share_desc': ' — the more players, the better the community',
  'about.contribute': 'Contribute code',
  'about.contribute_desc': ' — PRs are welcome! See our GitHub repo',
  'about.report': 'Report bugs & suggest features',
  'about.report_desc': ' — open an issue on GitHub',
  'about.what_title': 'What is Makruk?',
  'about.what1': '<strong>Makruk (หมากรุก)</strong> is the traditional chess of Thailand. It evolved from the ancient Indian game Chaturanga and has been played in Thailand for centuries.',
  'about.what2': 'Unlike Western chess, Makruk retains many features of the original game — the queen (Met) is weak, the bishop (Khon) moves differently, and pawns start on the third rank. This creates a game that is deeply strategic and uniquely beautiful.',
  'about.what3': "Makruk is widely played in Thailand and Cambodia (where it's called Ouk Chatrang). It is recognized by the World Chess Federation and has international tournaments.",
  'about.what4': 'We believe Makruk deserves the same global recognition as chess. Help us spread the word!',
  'about.opensource_title': 'Open Source',
  'about.opensource_desc': 'Makruk Online is 100% open source under the MIT license. The entire codebase is available on GitHub.',
  'about.footer': 'Makruk Online — Free & Open Source — Made with love for Thai Chess',

  // Games Page
  'games.title': 'Recent Games',
  'games.count': '{count} game(s) played',
  'games.empty': 'No games yet',
  'games.empty_desc': 'Be the first to play!',
  'games.start': 'Start Playing',
  'games.col_game': 'Game',
  'games.col_time': 'Time',
  'games.col_result': 'Result',
  'games.col_moves': 'Moves',
  'games.col_when': 'When',
  'games.prev': 'Prev',
  'games.next': 'Next',
  'games.page': 'Page {current} of {total}',
  'games.reason_checkmate': 'Checkmate',
  'games.reason_resignation': 'Resignation',
  'games.reason_timeout': 'Timeout',
  'games.reason_stalemate': 'Stalemate',
  'games.reason_agreement': 'Agreement',
  'games.reason_draw': 'Draw',

  // Feedback
  'feedback.button': 'Feedback',
  'feedback.title': 'Send Feedback',
  'feedback.bug': 'Bug',
  'feedback.feature': 'Feature',
  'feedback.other': 'Other',
  'feedback.placeholder_bug': 'What happened? What did you expect?',
  'feedback.placeholder_feature': 'What feature would you like?',
  'feedback.placeholder_other': 'Tell us anything...',
  'feedback.thanks': 'Thank you!',
  'feedback.thanks_desc': 'Your feedback helps improve Makruk Online.',
  'feedback.error': 'Failed to send. Please try again.',

  // Feedback Messages Page
  'feedback_page.title': 'Feedback Messages',
  'feedback_page.count': '{count} message(s)',
  'feedback_page.filter_all': 'All',
  'feedback_page.empty': 'No feedback yet',
  'feedback_page.empty_desc': 'Feedback submitted by users will appear here.',
  'feedback_page.detail_page': 'Page',
  'feedback_page.detail_date': 'Date',

  // Time ago
  'time.just_now': 'just now',
  'time.min_ago': '{n}m ago',
  'time.hour_ago': '{n}h ago',
  'time.day_ago': '{n}d ago',

  // Analysis
  'analysis.title': 'Game Analysis',
  'analysis.loading': 'Loading game...',
  'analysis.analyzing': 'Analyzing game...',
  'analysis.progress': 'Move {current} of {total}',
  'analysis.accuracy': 'Accuracy',
  'analysis.eval_graph': 'Evaluation',
  'analysis.show_best': 'Show best move',
  'analysis.keyboard_hint': 'Use arrow keys to navigate moves',
  'analysis.eval_before': 'Before',
  'analysis.eval_after': 'After',
  'analysis.best_was': 'Best was',
  'analysis.best': 'Best',
  'analysis.excellent': 'Excellent',
  'analysis.good': 'Good',
  'analysis.inaccuracy': 'Inaccuracy',
  'analysis.mistake': 'Mistake',
  'analysis.blunder': 'Blunder',
  'analysis.analyze': 'Analyze Game',
  'analysis.view': 'View Analysis',

  // Language
  'lang.switch': 'TH',
};

const TH: Record<string, string> = {
  // Common
  'app.name': 'หมากรุก',
  'app.tagline': 'หมากรุกไทยออนไลน์',
  'nav.play': 'เล่น',
  'nav.puzzles': 'ปริศนา',
  'nav.games': 'เกม',
  'nav.about': 'เกี่ยวกับ',
  'common.back_home': 'กลับหน้าแรก',
  'common.white': 'ขาว',
  'common.black': 'ดำ',
  'common.draw': 'เสมอ',
  'common.you': 'คุณ',
  'common.cancel': 'ยกเลิก',
  'common.send': 'ส่ง',
  'common.sending': 'กำลังส่ง...',
  'common.close': 'ปิด',
  'common.retry': 'ลองใหม่',
  'common.new_game': 'เกมใหม่',
  'footer.tagline': 'หมากรุกออนไลน์ — ฟรีและโอเพนซอร์ส',
  'footer.inspired': 'ได้แรงบันดาลใจจาก',

  // Home Page
  'home.hero_title': 'เล่นหมากรุกออนไลน์',
  'home.hero_desc': 'เกมหมากรุกไทยโบราณ เล่นออนไลน์ เล่นกับบอท หรือฝึกทักษะด้วยปริศนา',
  'home.quick_play': 'เล่นด่วน',
  'home.quick_play_desc': 'หาคู่แข่งทันที — ไม่ต้องแชร์ลิงก์',
  'home.find_opponent': 'หาคู่แข่ง',
  'home.play_friend': 'เล่นกับเพื่อน',
  'home.play_friend_desc': 'แชร์ลิงก์',
  'home.play_bot': 'เล่นกับบอท',
  'home.play_bot_desc': '3 ระดับความยาก',
  'home.puzzles': 'ปริศนา',
  'home.puzzles_desc': 'ฝึกกลยุทธ์',
  'home.create_private': 'สร้างเกมส่วนตัว',
  'home.time_control': 'เวลาเล่น',
  'home.play_with_friend': 'เล่นกับเพื่อน',
  'home.creating': 'กำลังสร้าง...',
  'home.or': 'หรือ',
  'home.play_local': 'เล่นในเครื่อง (จอเดียวกัน)',
  'home.join_prompt': 'มีรหัสเกม?',
  'home.join_link': 'เข้าร่วมเกม',
  'home.join_title': 'เข้าร่วมเกม',
  'home.join_placeholder': 'ใส่รหัสเกม...',
  'home.join': 'เข้าร่วม',
  'home.rules_title': 'วิธีเล่นหมากรุก',
  'home.rules_intro': 'หมากรุก เป็นเกมหมากรุกดั้งเดิมของไทย มีความเกี่ยวข้องกับเกมจตุรงค์ของอินเดียโบราณ',
  'home.rules_pieces': 'ตัวหมาก:',
  'home.rules_special': 'กฎพิเศษ:',
  'home.piece_king': 'ขุน (King) – เดินได้ 1 ช่องทุกทิศทาง',
  'home.piece_queen': 'เม็ด (Queen) – เดินได้ 1 ช่องแนวทแยง',
  'home.piece_bishop': 'โคน (Bishop) – เดินได้ 1 ช่องแนวทแยงหรือ 1 ช่องหน้า',
  'home.piece_rook': 'เรือ (Rook) – เดินได้ไม่จำกัดช่องในแนวตั้งและแนวนอน',
  'home.piece_knight': 'ม้า (Knight) – เดินรูปตัว L (เหมือนหมากรุกสากล)',
  'home.piece_pawn': 'เบี้ย (Pawn) – เดินหน้า 1 ช่อง กินแนวทแยง',
  'home.rule_pawn_rank': 'เบี้ยเริ่มที่แถว 3 (ไม่ใช่แถว 2)',
  'home.rule_promote': 'เบี้ยหงายเป็นเม็ดเมื่อถึงแถว 6',
  'home.rule_no_special': 'ไม่มีการขึ้นฝั่ง ไม่มีการกินผ่าน ไม่มีเดินเบี้ย 2 ช่อง',
  'home.rule_checkmate': 'รุกจนอับชนะเกม',

  // Time presets
  'time.bullet': 'บุลเลต',
  'time.blitz': 'บลิตซ์',
  'time.rapid': 'ราปิด',
  'time.classical': 'คลาสสิก',

  // Bot Game
  'bot.title': 'เล่นกับบอท',
  'bot.setup_title': 'เล่นกับคอมพิวเตอร์',
  'bot.difficulty': 'ระดับความยาก',
  'bot.easy': 'ง่าย',
  'bot.easy_desc': 'เดินสุ่มกินตัวพื้นฐาน',
  'bot.medium': 'ปานกลาง',
  'bot.medium_desc': 'คิดล่วงหน้า 2 ตา',
  'bot.hard': 'ยาก',
  'bot.hard_desc': 'คิดล่วงหน้า 4 ตา',
  'bot.play_as': 'เลือกฝั่ง',
  'bot.random': 'สุ่ม',
  'bot.start': 'เริ่มเกม',
  'bot.thinking': 'กำลังคิด...',
  'bot.your_turn': 'ตาของคุณ',
  'bot.bot_thinking': 'บอทกำลังคิด...',
  'bot.you_won': 'คุณชนะ!',
  'bot.bot_wins': 'บอทชนะ',
  'bot.resign': 'ยอมแพ้',
  'bot.resign_confirm': 'คุณแน่ใจหรือไม่ว่าต้องการยอมแพ้?',
  'bot.vs_bot': 'กับบอท',

  // Puzzles
  'puzzle.title': 'ปริศนาหมากรุก',
  'puzzle.desc': 'ฝึกทักษะหมากรุกด้วยปริศนากลยุทธ์ หาตาเดินที่ดีที่สุด!',
  'puzzle.completed': '{done}/{total} สำเร็จ',
  'puzzle.all': 'ทั้งหมด',
  'puzzle.beginner': 'เริ่มต้น',
  'puzzle.intermediate': 'ปานกลาง',
  'puzzle.advanced': 'ขั้นสูง',
  'puzzle.to_move': '{color} เดิน',
  'puzzle.find_best': 'หาตาเดินที่ดีที่สุดสำหรับฝั่ง{color}!',
  'puzzle.step': 'ขั้นที่ {current} จาก {total}',
  'puzzle.correct': 'ถูกต้อง!',
  'puzzle.solved_hint': 'แก้ได้โดยใช้คำใบ้',
  'puzzle.solved_clean': 'แก้ได้โดยไม่ใช้คำใบ้!',
  'puzzle.wrong': 'ไม่ถูกต้อง!',
  'puzzle.wrong_desc': 'นั่นไม่ใช่ตาเดินที่ดีที่สุด ลองอีกครั้ง!',
  'puzzle.hint': 'คำใบ้',
  'puzzle.next': 'ปริศนาถัดไป',
  'puzzle.previous': 'ก่อนหน้า',
  'puzzle.all_puzzles': 'ปริศนาทั้งหมด',
  'puzzle.not_found': 'ไม่พบปริศนา',
  'puzzle.back': 'กลับไปปริศนา',

  // Puzzle themes
  'theme.Checkmate': 'รุกจน',
  'theme.Fork': 'โจมตีซ้อน',
  'theme.Skewer': 'เสียบ',
  'theme.Promotion': 'หงายเบี้ย',
  'theme.Tactic': 'กลยุทธ์',
  'theme.Discovery': 'เปิดแนว',
  'theme.Sacrifice': 'สังเวย',
  'theme.Endgame': 'เกมจบ',

  // Quick Play / Matchmaking
  'quick.title': 'เล่นด่วน',
  'quick.desc': 'หาคู่แข่งทันที ไม่ต้องแชร์ลิงก์!',
  'quick.searching': 'กำลังหาคู่แข่ง...',
  'quick.search_time': 'กำลังค้นหามา {time}',
  'quick.queue': '{count} ผู้เล่นในคิว',
  'quick.find': 'หาคู่แข่ง',

  // Game Page
  'game.waiting_title': 'รอคู่แข่ง',
  'game.waiting_desc': 'แชร์ลิงก์นี้ให้เพื่อนเพื่อเริ่มเล่น',
  'game.copy': 'คัดลอก',
  'game.copied': 'คัดลอกแล้ว!',
  'game.playing_as': 'คุณเล่นฝั่ง{color}',
  'game.connecting': 'กำลังเชื่อมต่อ...',
  'game.error': 'ข้อผิดพลาด',
  'game.your_turn': 'ตาของคุณ',
  'game.opponent_turn': 'ตาฝ่ายตรงข้าม',
  'game.you_won': 'คุณชนะ!',
  'game.you_lost': 'คุณแพ้',
  'game.draw_offer_received': 'คู่แข่งเสนอเสมอ',
  'game.accept': 'ยอมรับ',
  'game.decline': 'ปฏิเสธ',
  'game.offer_draw': '½ เสมอ',
  'game.resign': '⚐ ยอมแพ้',
  'game.resign_confirm': 'คุณแน่ใจหรือไม่ว่าต้องการยอมแพ้?',
  'game.share': 'แชร์',
  'game.piece_guide': '📖 คู่มือตัวหมาก',
  'game.opponent_dc': 'คู่แข่งหลุดออก กำลังรอเชื่อมต่อใหม่...',
  'game.game_label': 'เกม:',

  // Game Over Modal
  'gameover.you_win': 'คุณชนะ!',
  'gameover.you_lost': 'คุณแพ้',
  'gameover.draw': 'เสมอ',
  'gameover.by_checkmate': 'โดยรุกจน',
  'gameover.by_resign': 'โดยยอมแพ้',
  'gameover.by_timeout': 'หมดเวลา',
  'gameover.by_stalemate': 'โดยอับ',
  'gameover.by_agreement': 'ตกลงเสมอ',
  'gameover.by_material': 'ตัวหมากไม่เพียงพอ',
  'gameover.rematch': 'แข่งอีกครั้ง',

  // Local Game
  'local.title': 'เล่นในเครื่อง',
  'local.view_as': 'มุมมอง:',
  'local.turn': 'ตาฝั่ง{color}',
  'local.wins': 'ฝั่ง{color}ชนะ!',
  'local.play_online': 'เล่นออนไลน์',

  // Move History
  'moves.title': 'ตาเดิน',
  'moves.empty': 'ยังไม่มีตาเดิน',

  // Piece Guide
  'guide.title': 'คู่มือตัวหมาก',
  'guide.king': 'ขุน (King)',
  'guide.queen': 'เม็ด (Queen)',
  'guide.bishop': 'โคน (Bishop)',
  'guide.rook': 'เรือ (Rook)',
  'guide.knight': 'ม้า (Knight)',
  'guide.pawn': 'เบี้ย (Pawn)',
  'guide.promoted': 'เบี้ยหงาย (Promoted)',
  'guide.king_move': 'เดินได้ 1 ช่องทุกทิศทาง',
  'guide.queen_move': 'เดินได้ 1 ช่องแนวทแยง',
  'guide.bishop_move': 'เดินได้ 1 ช่องแนวทแยงหรือ 1 ช่องหน้า',
  'guide.rook_move': 'เดินได้ไม่จำกัดในแนวตั้งและแนวนอน',
  'guide.knight_move': 'รูปตัว L: 2+1 ช่อง',
  'guide.pawn_move': 'เดินหน้า 1 ช่อง; กินแนวทแยง',
  'guide.promoted_move': 'เหมือนเม็ด (1 ช่องทแยง)',

  // Connection
  'conn.connected': 'เชื่อมต่อแล้ว',
  'conn.reconnecting': 'กำลังเชื่อมต่อใหม่...',
  'conn.disconnected': 'หลุดการเชื่อมต่อ — กำลังเชื่อมต่อใหม่...',

  // About Page
  'about.title': 'เกี่ยวกับหมากรุกออนไลน์',
  'about.intro1': 'หมากรุกออนไลน์เป็นแพลตฟอร์ม<strong>ฟรีและโอเพนซอร์ส</strong>สำหรับเล่นหมากรุกไทยกับทุกคนในโลก ไม่ต้องสมัคร ไม่มีโฆษณา ไม่มีค่าใช้จ่าย — แค่หมากรุกไทยบริสุทธิ์',
  'about.intro2': 'พันธกิจของเราคือการทำให้<strong>หมากรุกเป็นที่รู้จักทั่วโลก</strong> หมากรุกไทยเป็นหนึ่งในเกมกระดานที่เก่าแก่ที่สุดในโลก ใกล้เคียงกับจตุรงค์ของอินเดียมากกว่าหมากรุกสากล สมควรมีแพลตฟอร์มออนไลน์ระดับโลก',
  'about.intro3': 'ได้แรงบันดาลใจจาก <a href="https://lichess.org" target="_blank" rel="noopener" class="text-primary hover:text-primary-light underline">Lichess</a> เราเชื่อว่าแพลตฟอร์มเกมดีๆ ควรฟรีสำหรับทุกคน',
  'about.stats_title': 'สถิติแพลตฟอร์ม',
  'about.games_played': 'เกมที่เล่น',
  'about.total_moves': 'ตาเดินทั้งหมด',
  'about.white_wins': 'ฝั่งขาวชนะ',
  'about.black_wins': 'ฝั่งดำชนะ',
  'about.support_title': 'สนับสนุนโปรเจกต์',
  'about.support_desc': 'หมากรุกออนไลน์ดำเนินการโดยชุมชน หากคุณชอบเล่น ช่วยเราให้เซิร์ฟเวอร์ทำงานต่อไป:',
  'about.star': 'กดดาวบน GitHub',
  'about.star_desc': ' — ช่วยให้คนอื่นค้นพบโปรเจกต์',
  'about.share': 'แชร์ให้เพื่อน',
  'about.share_desc': ' — ยิ่งมีผู้เล่น ชุมชนยิ่งดี',
  'about.contribute': 'ร่วมพัฒนาโค้ด',
  'about.contribute_desc': ' — ยินดีรับ PR! ดู GitHub repo',
  'about.report': 'แจ้งบั๊กและเสนอฟีเจอร์',
  'about.report_desc': ' — เปิด issue บน GitHub',
  'about.what_title': 'หมากรุกคืออะไร?',
  'about.what1': '<strong>หมากรุก (Makruk)</strong> เป็นหมากรุกดั้งเดิมของไทย พัฒนามาจากจตุรงค์ของอินเดียโบราณ และเล่นกันในไทยมาหลายศตวรรษ',
  'about.what2': 'ต่างจากหมากรุกสากล หมากรุกไทยยังคงรักษาลักษณะดั้งเดิมไว้ — เม็ด (ควีน) อ่อนแอ โคน (บิชอป) เดินต่างออกไป และเบี้ยเริ่มที่แถวที่สาม ทำให้เกมมีกลยุทธ์ลึกซึ้งและสวยงามเป็นเอกลักษณ์',
  'about.what3': 'หมากรุกเป็นที่นิยมในไทยและกัมพูชา (เรียกว่า อุกจตุรงค์) ได้รับการยอมรับจากสหพันธ์หมากรุกโลกและมีการแข่งขันระดับนานาชาติ',
  'about.what4': 'เราเชื่อว่าหมากรุกสมควรได้รับการยอมรับระดับโลกเทียบเท่าหมากรุกสากล ช่วยเราเผยแพร่!',
  'about.opensource_title': 'โอเพนซอร์ส',
  'about.opensource_desc': 'หมากรุกออนไลน์เป็นโอเพนซอร์ส 100% ภายใต้ MIT license โค้ดทั้งหมดอยู่บน GitHub',
  'about.footer': 'หมากรุกออนไลน์ — ฟรีและโอเพนซอร์ส — สร้างด้วยรักเพื่อหมากรุกไทย',

  // Games Page
  'games.title': 'เกมล่าสุด',
  'games.count': 'เล่นแล้ว {count} เกม',
  'games.empty': 'ยังไม่มีเกม',
  'games.empty_desc': 'เป็นคนแรกที่เล่น!',
  'games.start': 'เริ่มเล่น',
  'games.col_game': 'เกม',
  'games.col_time': 'เวลา',
  'games.col_result': 'ผลลัพธ์',
  'games.col_moves': 'ตาเดิน',
  'games.col_when': 'เมื่อไหร่',
  'games.prev': 'ก่อนหน้า',
  'games.next': 'ถัดไป',
  'games.page': 'หน้า {current} จาก {total}',
  'games.reason_checkmate': 'รุกจน',
  'games.reason_resignation': 'ยอมแพ้',
  'games.reason_timeout': 'หมดเวลา',
  'games.reason_stalemate': 'อับ',
  'games.reason_agreement': 'ตกลง',
  'games.reason_draw': 'เสมอ',

  // Feedback
  'feedback.button': 'แจ้งปัญหา',
  'feedback.title': 'ส่งความคิดเห็น',
  'feedback.bug': 'บั๊ก',
  'feedback.feature': 'ฟีเจอร์',
  'feedback.other': 'อื่นๆ',
  'feedback.placeholder_bug': 'เกิดอะไรขึ้น? คุณคาดหวังอะไร?',
  'feedback.placeholder_feature': 'คุณอยากได้ฟีเจอร์อะไร?',
  'feedback.placeholder_other': 'บอกเราได้เลย...',
  'feedback.thanks': 'ขอบคุณ!',
  'feedback.thanks_desc': 'ความคิดเห็นของคุณช่วยพัฒนาหมากรุกออนไลน์',
  'feedback.error': 'ส่งไม่สำเร็จ กรุณาลองใหม่',

  // Feedback Messages Page
  'feedback_page.title': 'ข้อความแจ้งปัญหา',
  'feedback_page.count': '{count} ข้อความ',
  'feedback_page.filter_all': 'ทั้งหมด',
  'feedback_page.empty': 'ยังไม่มีข้อความ',
  'feedback_page.empty_desc': 'ข้อความจากผู้ใช้จะแสดงที่นี่',
  'feedback_page.detail_page': 'หน้า',
  'feedback_page.detail_date': 'วันที่',

  // Time ago
  'time.just_now': 'เมื่อสักครู่',
  'time.min_ago': '{n} นาทีที่แล้ว',
  'time.hour_ago': '{n} ชั่วโมงที่แล้ว',
  'time.day_ago': '{n} วันที่แล้ว',

  // Analysis
  'analysis.title': 'วิเคราะห์เกม',
  'analysis.loading': 'กำลังโหลดเกม...',
  'analysis.analyzing': 'กำลังวิเคราะห์เกม...',
  'analysis.progress': 'ตาที่ {current} จาก {total}',
  'analysis.accuracy': 'ความแม่นยำ',
  'analysis.eval_graph': 'ค่าประเมิน',
  'analysis.show_best': 'แสดงตาที่ดีที่สุด',
  'analysis.keyboard_hint': 'ใช้ลูกศรเพื่อดูตาเดิน',
  'analysis.eval_before': 'ก่อน',
  'analysis.eval_after': 'หลัง',
  'analysis.best_was': 'ตาที่ดีที่สุดคือ',
  'analysis.best': 'ดีที่สุด',
  'analysis.excellent': 'ยอดเยี่ยม',
  'analysis.good': 'ดี',
  'analysis.inaccuracy': 'ไม่แม่นยำ',
  'analysis.mistake': 'ผิดพลาด',
  'analysis.blunder': 'พลาดร้ายแรง',
  'analysis.analyze': 'วิเคราะห์เกม',
  'analysis.view': 'ดูการวิเคราะห์',

  // Language
  'lang.switch': 'EN',
};

const TRANSLATIONS: Record<Language, Record<string, string>> = { en: EN, th: TH };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('makruk-lang', newLang);
    document.documentElement.lang = newLang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = TRANSLATIONS[lang][key] || TRANSLATIONS['en'][key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
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

import { findSeoPuzzleById, getSeoPuzzlePaths, isIndexableSeoPuzzle } from './seoPuzzleManifest';

export const DEFAULT_SEO_IMAGE_PATH = '/og-image.jpg';

export interface SeoRouteData {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  robots?: string;
  type?: 'website' | 'article';
  image?: string;
  structuredData?: Record<string, unknown>[];
  snapshot?: SeoSnapshot;
}

export function getSeoImageUrl(baseUrl: string, imagePath = DEFAULT_SEO_IMAGE_PATH): string {
  return new URL(imagePath, `${baseUrl}/`).toString();
}

export interface SeoTextBlock {
  text: string;
  lang?: 'en' | 'th';
}

export interface SeoSnapshotLink {
  href: string;
  label: string;
  lang?: 'en' | 'th';
}

export interface SeoSnapshot {
  kicker?: SeoTextBlock;
  heading?: SeoTextBlock;
  paragraphs?: SeoTextBlock[];
  bullets?: SeoTextBlock[];
  links?: SeoSnapshotLink[];
}

const defaultKeywords = [
  'ThaiChess',
  'Makruk',
  'Thai chess',
  'หมากรุกไทย',
  'เล่นหมากรุกไทย',
  'เล่นหมากรุกไทยออนไลน์',
  'กติกาหมากรุกไทย',
  'วิธีเล่นหมากรุกไทย',
  'สอนหมากรุกไทย',
  'หมากรุกไทยออนไลน์',
  'play ThaiChess online',
  'Makruk puzzles',
  'Thai chess strategy',
  'Makruk rules',
  'Thai chess counting rule',
  'อุกจตุรงค์',
  'Cambodian chess',
  'หมากรุกไทยกับหมากรุกสากล',
  'Thai chess vs chess',
  'Makruk endgame',
  'หมากรุกไทยขั้นเทพ',
  'โปรแกรมหมากรุกไทย',
];

function getPublicPuzzleSeoTitle(title: string): string {
  return title
    .replace(/\s*\([0-9a-f]{8}\s*@\s*ply\s*\d+\)$/i, '')
    .replace(/^Real-Game\s+/i, '')
    .trim();
}

function buildWebsiteSchema(baseUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ThaiChess',
    alternateName: 'Makruk Thai Chess / หมากรุกไทย',
    url: baseUrl,
    description: 'Play ThaiChess online for free with friends, bots, and puzzles. Makruk is also known in Thai as หมากรุกไทย.',
    inLanguage: ['en', 'th'],
    image: getSeoImageUrl(baseUrl),
    publisher: {
      '@type': 'Organization',
      name: 'ThaiChess',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: new URL('/icon-512.png', `${baseUrl}/`).toString(),
      },
    },
  };
}

function buildWebApplicationSchema(baseUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ThaiChess',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    url: baseUrl,
    browserRequirements: 'Requires JavaScript and a modern browser.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    inLanguage: ['en', 'th'],
    keywords: defaultKeywords.join(', '),
  };
}

function buildHomeFaqSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is ThaiChess?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ThaiChess, also called Makruk, is the traditional chess variant of Thailand with its own pieces, openings, and endgame ideas.',
        },
      },
      {
        '@type': 'Question',
        name: 'หมากรุกไทยคืออะไร?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'หมากรุกไทยหรือ Makruk เป็นหมากรุกดั้งเดิมของไทย มีการเดินหมาก กติกาหงาย และกฎการนับที่เป็นเอกลักษณ์ต่างจากหมากรุกสากล',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I play ThaiChess online for free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. ThaiChess lets you play online for free in your browser.',
        },
      },
      {
        '@type': 'Question',
        name: 'เล่นหมากรุกไทยออนไลน์ฟรีได้ไหม?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ได้ เล่นหมากรุกไทยออนไลน์ฟรีได้ทันทีในเบราว์เซอร์ ไม่ต้องติดตั้ง และโหมดหลักไม่บังคับสมัครสมาชิก',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I play ThaiChess with friends or against a bot?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can create private games for friends, play local games, solve puzzles, and practice against a bot.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need an account to start playing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Core gameplay is available without registration.',
        },
      },
    ],
  };
}

function buildFaqSchema(entries: Array<{ question: string; answer: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  };
}

function normalizeSeoPath(pathname: string): string {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/';

  if (pathOnly === '/') {
    return '/';
  }

  return pathOnly.replace(/\/+$/, '') || '/';
}

export function getPublicSeoRoute(pathname: string, baseUrl: string): SeoRouteData {
  const cleanPath = normalizeSeoPath(pathname);
  const defaultImage = getSeoImageUrl(baseUrl);

  if (cleanPath === '/') {
    return {
      title: 'เล่นหมากรุกไทยออนไลน์ฟรี | Play Makruk Online Free | ThaiChess',
      description: 'เล่นหมากรุกไทยออนไลน์ฟรี ฝึกกับบอท แก้โจทย์หมากรุกไทย และเรียนรู้กติกา วิธีเล่นหมากรุกไทยสำหรับมือใหม่ Play ThaiChess online for free.',
      path: '/',
      keywords: [...defaultKeywords, 'เล่นหมากรุกไทยฟรี', 'หมากรุกไทยออนไลน์', 'สอนหมากรุกไทย', 'Makruk online free', 'Thai chess online free'],
      type: 'website',
      image: defaultImage,
      structuredData: [
        buildWebsiteSchema(baseUrl),
        buildWebApplicationSchema(baseUrl),
        buildHomeFaqSchema(),
      ],
      snapshot: {
        kicker: { text: 'ThaiChess • Makruk • หมากรุกไทย' },
        heading: { text: 'เล่นหมากรุกไทยออนไลน์', lang: 'th' },
        paragraphs: [
          { text: 'Makruk, or Thai chess, is the traditional chess game of Thailand. ThaiChess lets you play online, solve puzzles, and study the game in your browser.' },
          { text: 'หมากรุกไทยหรือ Makruk เป็นหมากรุกดั้งเดิมของไทย เว็บไซต์นี้ให้เล่นหมากรุกไทยออนไลน์ฟรี ฝึกกับบอท แก้โจทย์ และเรียนรู้กติกา', lang: 'th' },
        ],
        bullets: [
          { text: 'เล่นหมากรุกไทยออนไลน์กับเพื่อนหรือผู้เล่นทั่วโลก', lang: 'th' },
          { text: 'ฝึกหมากรุกไทยกับบอทและเรียนรู้จากบทเรียน', lang: 'th' },
          { text: 'แก้โจทย์หมากรุกไทยเพื่อพัฒนาทักษะการคำนวณ', lang: 'th' },
          { text: 'Play with friends, quick matchmaking, or a practice bot.' },
          { text: 'Learn rules, openings, tactics, and the counting rule.' },
        ],
        links: [
          { href: '/what-is-makruk', label: 'หมากรุกไทยคืออะไร', lang: 'th' },
          { href: '/how-to-play-makruk', label: 'วิธีเล่นหมากรุกไทย', lang: 'th' },
          { href: '/play-makruk-online', label: 'เริ่มเล่นหมากรุกไทย', lang: 'th' },
          { href: '/puzzles', label: 'โจทย์หมากรุกไทย', lang: 'th' },
          { href: '/lessons', label: 'บทเรียนหมากรุกไทย', lang: 'th' },
          { href: '/bot', label: 'Play vs Bot' },
        ],
      },
    };
  }

  if (cleanPath === '/about') {
    return {
      title: 'About ThaiChess | Learn Makruk and the Mission Behind the Site',
      description: 'Learn what ThaiChess, or Makruk / หมากรุกไทย, is and why this open-source project exists to make traditional Thai chess easier to play and discover online.',
      path: '/about',
      keywords: [...defaultKeywords, 'what is Makruk', 'Thai chess rules'],
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About ThaiChess',
          url: `${baseUrl}/about`,
          description: 'Background on ThaiChess, Makruk, and the project mission.',
        },
      ],
      snapshot: {
        heading: { text: 'About ThaiChess' },
        paragraphs: [
          { text: 'ThaiChess is an open-source project focused on making Makruk easier to learn, play, and discover online.' },
          { text: 'เป้าหมายของโปรเจกต์คือช่วยให้คนค้นพบหมากรุกไทยมากขึ้น และมีที่เล่นออนไลน์ที่ใช้ง่าย', lang: 'th' },
        ],
        links: [
          { href: '/what-is-makruk', label: 'What is Makruk?' },
          { href: '/how-to-play-makruk', label: 'วิธีเล่นหมากรุกไทย', lang: 'th' },
          { href: '/play-makruk-online', label: 'Play Makruk online' },
        ],
      },
    };
  }

  if (cleanPath === '/games') {
    return {
      title: 'Recent ThaiChess Games | Browse Finished Makruk Games',
      description: 'Browse recent finished ThaiChess games, review results, and open move analysis for completed Makruk matches.',
      path: '/games',
      keywords: [...defaultKeywords, 'Thai chess games', 'Makruk game archive'],
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Recent ThaiChess Games',
          url: `${baseUrl}/games`,
          description: 'A public archive of recent completed ThaiChess games.',
        },
      ],
      snapshot: {
        heading: { text: 'Recent Makruk Games' },
        paragraphs: [
          { text: 'Browse recent finished Makruk games, review results, and open move analysis for completed matches.' },
          { text: 'ดูเกมหมากรุกไทยที่จบแล้วเพื่อศึกษาผลการแข่งขันและรูปแบบการเดินหมาก', lang: 'th' },
        ],
        links: [
          { href: '/leaderboard', label: 'Leaderboard' },
          { href: '/quick-play', label: 'Quick Play' },
          { href: '/play-makruk-online', label: 'Play Makruk online' },
        ],
      },
    };
  }

  if (cleanPath === '/leaderboard') {
    return {
      title: 'ThaiChess Leaderboard | Top Rated Makruk Players',
      description: 'See the top rated ThaiChess players, compare Makruk ratings, and track the strongest active competitors on the leaderboard.',
      path: '/leaderboard',
      keywords: [...defaultKeywords, 'Makruk leaderboard', 'Thai chess rating', 'top Makruk players'],
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'ThaiChess Leaderboard',
          url: `${baseUrl}/leaderboard`,
          description: 'A public leaderboard of rated ThaiChess players.',
        },
      ],
      snapshot: {
        heading: { text: 'Makruk Leaderboard' },
        paragraphs: [
          { text: 'Track the top rated ThaiChess players and compare Makruk ratings on the public leaderboard.' },
          { text: 'ติดตามผู้เล่นหมากรุกไทยที่มีเรตสูงสุดและดูอันดับล่าสุด', lang: 'th' },
        ],
        links: [
          { href: '/quick-play', label: 'Quick Play' },
          { href: '/games', label: 'Recent games' },
          { href: '/bot', label: 'Practice vs bot' },
        ],
      },
    };
  }

  if (cleanPath === '/database') {
    return {
      title: 'Makruk Game Database | Search Finished ThaiChess Games',
      description: 'Search finished ThaiChess games by player, result, rating, and mode to study real Makruk positions and review complete game records.',
      path: '/database',
      keywords: [...defaultKeywords, 'Makruk database', 'Thai chess game database', 'Makruk archive'],
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'ThaiChess Game Database',
          url: `${baseUrl}/database`,
          description: 'A searchable archive of finished ThaiChess games.',
        },
      ],
      snapshot: {
        heading: { text: 'Makruk Game Database' },
        paragraphs: [
          { text: 'Search finished Makruk games by player, result, rating, and mode, then open full analysis for any game.' },
          { text: 'ค้นหาเกมหมากรุกไทยที่จบแล้วตามชื่อผู้เล่น ผลลัพธ์ เรต และโหมดการเล่น แล้วเปิดวิเคราะห์ต่อได้ทันที', lang: 'th' },
        ],
        links: [
          { href: '/openings', label: 'Opening Explorer' },
          { href: '/games', label: 'Recent games' },
          { href: '/leaderboard', label: 'Leaderboard' },
        ],
      },
    };
  }

  if (cleanPath === '/openings') {
    return {
      title: 'Makruk Opening Explorer | Study ThaiChess Positions',
      description: 'Explore ThaiChess opening positions, browse common continuations, and jump from a Makruk position into matching finished games.',
      path: '/openings',
      keywords: [...defaultKeywords, 'Makruk openings', 'Thai chess opening explorer', 'Makruk position explorer'],
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'ThaiChess Opening Explorer',
          url: `${baseUrl}/openings`,
          description: 'An interactive explorer for Makruk opening positions and related finished games.',
        },
      ],
      snapshot: {
        heading: { text: 'Makruk Opening Explorer' },
        paragraphs: [
          { text: 'Explore common continuations from a Makruk position and jump into finished games that reached the same setup.' },
          { text: 'สำรวจรูปแบบโอเพนนิงหมากรุกไทยจากตำแหน่งบนกระดาน และเปิดดูเกมจริงที่เดินมาถึงตำแหน่งเดียวกัน', lang: 'th' },
        ],
        links: [
          { href: '/database', label: 'Game Database' },
          { href: '/games', label: 'Recent games' },
          { href: '/bot', label: 'Practice vs bot' },
        ],
      },
    };
  }

  if (cleanPath === '/what-is-makruk') {
    return {
      title: 'What Is Makruk (หมากรุกไทย)? | Learn Thai Chess',
      description: 'Learn what Makruk, or หมากรุกไทย, is, how Thai chess differs from western chess, and why this traditional game rewards patient, technical play.',
      path: '/what-is-makruk',
      keywords: [...defaultKeywords, 'what is Makruk', 'learn Makruk', 'Thai chess explained', 'หมากรุกไทยคืออะไร'],
      type: 'article',
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'What Is Makruk (หมากรุกไทย)?',
          about: ['Makruk', 'Thai chess', 'หมากรุกไทย'],
          url: `${baseUrl}/what-is-makruk`,
          description: 'An introduction to Makruk, the traditional chess game of Thailand.',
          inLanguage: ['en', 'th'],
          image: defaultImage,
        },
        buildFaqSchema([
          {
            question: 'Is Makruk the same as western chess?',
            answer: 'No. Makruk is related to chess, but the pieces and strategic patterns are different enough that it should be treated as its own game.',
          },
          {
            question: 'Is Makruk hard to learn?',
            answer: 'The basic rules are approachable. Most players can start after learning the piece movement, promotion, and the main endgame draw rules.',
          },
          {
            question: 'หมากรุกไทยต่างจากหมากรุกสากลอย่างไร?',
            answer: 'หมากรุกไทยไม่มีการกรอก ไม่กินหมากผ่านทาง และมีกฎการหงายกับกฎการนับที่เป็นเอกลักษณ์ ทำให้จังหวะและแผนการเล่นต่างจากหมากรุกสากล',
          },
        ]),
      ],
      snapshot: {
        heading: { text: 'What Is Makruk?' },
        paragraphs: [
          { text: 'Makruk is the traditional chess game of Thailand. It is closely related to chess, but the piece values, openings, and endgames create a different strategic style.' },
          { text: 'หมากรุกไทยเป็นหมากรุกดั้งเดิมของไทย แม้จะเกี่ยวข้องกับหมากรุกสากล แต่รูปแบบการเดินหมากและแผนการเล่นมีเอกลักษณ์ของตัวเอง', lang: 'th' },
        ],
        bullets: [
          { text: 'Learn how Makruk differs from western chess.' },
          { text: 'Understand the role of promotion and the counting rule.' },
        ],
        links: [
          { href: '/how-to-play-makruk', label: 'วิธีเล่นหมากรุกไทย', lang: 'th' },
          { href: '/play-makruk-online', label: 'Play Makruk online' },
          { href: '/lessons', label: 'Makruk lessons' },
          { href: '/puzzles', label: 'โจทย์หมากรุกไทย', lang: 'th' },
        ],
      },
    };
  }

  if (cleanPath === '/how-to-play-makruk') {
    return {
      title: 'วิธีเล่นหมากรุกไทย | กติกาหมากรุกไทยสำหรับมือใหม่ | How to Play Makruk',
      description: 'สอนวิธีเล่นหมากรุกไทย กติกาหมากรุกไทย การเดินหมากแต่ละตัว การหงาย และกฎการนับสำหรับผู้เริ่มเล่น Learn how to play Makruk with board setup, piece movement, promotion, and the counting rule.',
      path: '/how-to-play-makruk',
      keywords: [...defaultKeywords, 'กติกาหมากรุกไทย', 'วิธีเล่นหมากรุกไทย', 'สอนหมากรุกไทย', 'Makruk rules', 'Thai chess rules', 'how to play Makruk', 'หมากรุกไทยขั้นเทพ'],
      type: 'article',
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'วิธีเล่นหมากรุกไทย | How to Play Makruk',
          url: `${baseUrl}/how-to-play-makruk`,
          description: 'คู่มือสอนหมากรุกไทยสำหรับมือใหม่ A beginner-friendly guide to the rules of Thai chess.',
          inLanguage: ['en', 'th'],
          image: defaultImage,
        },
        buildFaqSchema([
          {
            question: 'หมากรุกไทยมีการกรอกหรือกินหมากผ่านทางไหม?',
            answer: 'ไม่มี หมากรุกไทยไม่มีการกรอก ไม่มีการกินหมากผ่านทาง และเบี้ยเดินหนึ่งช่องตลอด',
          },
          {
            question: 'กฎการนับคืออะไร?',
            answer: 'กฎการนับเป็นวิธีจำกัดจำนวนเทิร์นเมื่อเหลือตัวหมากน้อย เพื่อป้องกันการยื้อเกม ถ้าฝ่ายที่เหนือกว่าไม่สามารถรุกจนได้ภายในเทิร์นที่กำหนด จะเสมอ',
          },
          {
            question: 'Does Makruk have castling or en passant?',
            answer: 'No. Makruk has no castling, no en passant, and no two-square pawn jump.',
          },
          {
            question: 'What is the hardest rule for beginners?',
            answer: 'Usually the counting rule, because it affects how some winning endgames are converted or drawn.',
          },
        ]),
      ],
      snapshot: {
        heading: { text: 'วิธีเล่นหมากรุกไทย', lang: 'th' },
        paragraphs: [
          { text: 'Learn the board setup, piece movement, promotion, and the counting rule in a practical guide for new Makruk players.' },
          { text: 'เรียนรู้การจัดกระดาน การเดินหมากแต่ละตัว การหงายเบี้ย และกฎการนับสำหรับผู้เริ่มเล่นหมากรุกไทย', lang: 'th' },
        ],
        bullets: [
          { text: 'การจัดกระดานและตำแหน่งเริ่มต้น', lang: 'th' },
          { text: 'การเดินหมากแต่ละตัวในหมากรุกไทย', lang: 'th' },
          { text: 'กฎการหงายและการรุกจน', lang: 'th' },
          { text: 'กฎการนับที่มือใหม่ต้องรู้', lang: 'th' },
          { text: 'Board setup and starting position.' },
          { text: 'How each piece moves in Thai chess.' },
        ],
        links: [
          { href: '/what-is-makruk', label: 'What is Makruk?' },
          { href: '/play-makruk-online', label: 'Play Makruk online' },
          { href: '/lessons', label: 'บทเรียนหมากรุกไทย', lang: 'th' },
          { href: '/puzzles', label: 'โจทย์หมากรุกไทย', lang: 'th' },
        ],
      },
    };
  }

  if (cleanPath === '/play-makruk-online') {
    return {
      title: 'Play Makruk Online | Thai Chess / หมากรุกไทย in Your Browser',
      description: 'Play Makruk online in your browser, practice against the bot, solve Thai chess puzzles, or challenge other players without installing anything.',
      path: '/play-makruk-online',
      keywords: [...defaultKeywords, 'play Makruk online', 'Thai chess online', 'browser Makruk', 'เล่นหมากรุกไทยออนไลน์'],
      type: 'article',
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Play Makruk Online',
          about: ['Makruk', 'Thai chess online'],
          url: `${baseUrl}/play-makruk-online`,
          description: 'A guide to the best ways to start playing Makruk online.',
          inLanguage: ['en', 'th'],
          image: defaultImage,
        },
        buildFaqSchema([
          {
            question: 'Do I need an account to play Makruk online?',
            answer: 'No. Core play modes can be started without registration, though accounts help with rated play and a persistent identity.',
          },
          {
            question: 'What if there are not many live players online?',
            answer: 'Bot games and puzzles are still useful ways to practice Makruk while the live player pool is quiet.',
          },
          {
            question: 'เล่นหมากรุกไทยออนไลน์เริ่มยังไง?',
            answer: 'เปิดเว็บ ThaiChess แล้วเลือก Quick Play, เล่นกับบอท, หรือสร้างห้องเล่นกับเพื่อนได้ทันทีโดยไม่ต้องติดตั้งโปรแกรม',
          },
        ]),
      ],
      snapshot: {
        heading: { text: 'Play Makruk Online' },
        paragraphs: [
          { text: 'Start playing Makruk in your browser with live games, bot practice, puzzles, and lessons. No installation is required.' },
          { text: 'เริ่มเล่นหมากรุกไทยออนไลน์ได้ทันทีในเบราว์เซอร์ ทั้งแบบเจอผู้เล่นจริง เล่นกับบอท และฝึกจากโจทย์', lang: 'th' },
        ],
        links: [
          { href: '/quick-play', label: 'Quick Play' },
          { href: '/bot', label: 'Play vs Bot' },
          { href: '/puzzles', label: 'โจทย์หมากรุกไทย', lang: 'th' },
          { href: '/lessons', label: 'บทเรียนหมากรุกไทย', lang: 'th' },
          { href: '/how-to-play-makruk', label: 'วิธีเล่นหมากรุกไทย', lang: 'th' },
        ],
      },
    };
  }

  if (cleanPath === '/puzzles') {
    return {
      title: 'ThaiChess Puzzles | Practice Makruk Tactics Online',
      description: 'Solve ThaiChess puzzles online and practice Makruk tactics, mating patterns, and calculation across beginner to advanced difficulty.',
      path: '/puzzles',
      keywords: [...defaultKeywords, 'Makruk tactics', 'Thai chess puzzles', 'โจทย์หมากรุกไทย'],
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'ThaiChess Puzzles',
          url: `${baseUrl}/puzzles`,
          description: 'A collection of interactive ThaiChess puzzles.',
        },
      ],
      snapshot: {
        heading: { text: 'Makruk Puzzles' },
        paragraphs: [
          { text: 'Practice Makruk tactics online with interactive puzzles that cover calculation, mating patterns, and material-winning ideas.' },
          { text: 'ฝึกโจทย์หมากรุกไทยเพื่อพัฒนาการคำนวณและรูปแบบรุกที่ใช้ได้จริง', lang: 'th' },
        ],
        links: [
          { href: '/lessons', label: 'Makruk lessons' },
          { href: '/how-to-play-makruk', label: 'วิธีเล่นหมากรุกไทย', lang: 'th' },
          { href: '/bot', label: 'Play vs Bot' },
          { href: '/play-makruk-online', label: 'Play Makruk online' },
        ],
      },
    };
  }

  if (cleanPath === '/lessons' || cleanPath === '/course' || cleanPath === '/course-path' || cleanPath === '/learn') {
    return {
      title: 'Makruk Lessons | Structured ThaiChess Course',
      description: 'Study Makruk through a structured lessons course with guided explanations, interactive boards, and practice linked to real concepts.',
      path: '/lessons',
      keywords: [...defaultKeywords, 'Makruk lessons', 'Thai chess course', 'learn Makruk', 'บทเรียนหมากรุกไทย'],
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'ThaiChess Makruk Lessons',
          url: `${baseUrl}/lessons`,
          description: 'A structured Makruk course with beginner, intermediate, and advanced lessons.',
          educationalLevel: ['Beginner', 'Intermediate', 'Advanced'],
        },
      ],
      snapshot: {
        heading: { text: 'Makruk Lessons' },
        paragraphs: [
          { text: 'Study Thai chess through a structured course with guided lessons, interactive boards, and practical training.' },
          { text: 'เรียนหมากรุกไทยแบบเป็นลำดับจากบทเรียนที่มีคำอธิบายและแบบฝึกหัด', lang: 'th' },
        ],
        links: [
          { href: '/how-to-play-makruk', label: 'วิธีเล่นหมากรุกไทย', lang: 'th' },
          { href: '/puzzles', label: 'โจทย์หมากรุกไทย', lang: 'th' },
          { href: '/bot', label: 'Practice vs bot' },
          { href: '/play-makruk-online', label: 'Play Makruk online' },
        ],
      },
    };
  }

  if (cleanPath.startsWith('/lessons/') || cleanPath.startsWith('/course/') || cleanPath.startsWith('/learn/')) {
    const lessonId = cleanPath.split('/')[2] ?? '';

    return {
      title: 'Makruk Lesson | ThaiChess Course',
      description: 'Work through an interactive Makruk lesson with guided steps, practice tasks, and follow-up puzzles.',
      path: lessonId ? `/lessons/${lessonId}` : '/lessons',
      keywords: [...defaultKeywords, 'Makruk lesson', 'Thai chess training'],
      image: defaultImage,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: 'ThaiChess Makruk Lesson',
          url: lessonId ? `${baseUrl}/lessons/${lessonId}` : `${baseUrl}/lessons`,
          description: 'An interactive Makruk lesson from the ThaiChess course.',
          learningResourceType: 'Interactive lesson',
        },
      ],
      snapshot: {
        heading: { text: 'Makruk Lesson' },
        paragraphs: [
          { text: 'This lesson covers a focused Makruk idea with guided explanation and practice.' },
          { text: 'บทเรียนนี้อธิบายแนวคิดหมากรุกไทยแบบทีละขั้นและมีแบบฝึกให้ลอง', lang: 'th' },
        ],
        links: [
          { href: '/lessons', label: 'All Makruk lessons' },
          { href: '/puzzles', label: 'More puzzles' },
          { href: '/how-to-play-makruk', label: 'Makruk rules' },
        ],
      },
    };
  }

  if (cleanPath.startsWith('/puzzle/')) {
    const id = Number(cleanPath.split('/')[2]);
    const puzzle = Number.isFinite(id) ? findSeoPuzzleById(id) : undefined;
    const indexable = Number.isFinite(id) && isIndexableSeoPuzzle(id);
    const puzzleTitle = puzzle ? getPublicPuzzleSeoTitle(puzzle.title) : `Puzzle ${id}`;
    const puzzleDescription = puzzle?.description ?? 'Interactive ThaiChess puzzle.';

    return {
      title: `${puzzleTitle} | ThaiChess Puzzle ${id}`,
      description: `${puzzleDescription} Practice this ThaiChess puzzle online and improve your Makruk calculation.`,
      path: cleanPath,
      keywords: [...defaultKeywords, 'interactive puzzle', puzzleTitle, 'โจทย์หมากรุกไทย'],
      image: defaultImage,
      robots: indexable ? undefined : 'noindex, follow',
      structuredData: indexable
        ? [
            {
              '@context': 'https://schema.org',
              '@type': 'Quiz',
              name: `${puzzleTitle} | ThaiChess Puzzle ${id}`,
              educationalLevel: puzzle?.difficulty ?? 'all',
              learningResourceType: 'Practice problem',
              about: ['ThaiChess', 'Makruk tactics'],
              url: `${baseUrl}${cleanPath}`,
              description: puzzleDescription,
              image: defaultImage,
            },
          ]
        : undefined,
      snapshot: {
        heading: { text: puzzleTitle },
        paragraphs: [
          { text: `${puzzleDescription} Practice this Makruk puzzle online and improve your tactical calculation.` },
          { text: 'โจทย์นี้ช่วยฝึกการคำนวณและการมองรูปแบบรุกในหมากรุกไทย', lang: 'th' },
        ],
        links: [
          { href: '/puzzles', label: 'More Makruk Puzzles' },
          { href: '/lessons', label: 'Makruk lessons' },
          { href: '/how-to-play-makruk', label: 'วิธีเล่นหมากรุกไทย', lang: 'th' },
        ],
      },
    };
  }

  if (cleanPath === '/quick-play') {
    return {
      title: 'Quick Play ThaiChess | Find an Online Makruk Opponent',
      description: 'Start a quick ThaiChess game online and get matched with an opponent for a fast Makruk game in your browser.',
      path: '/quick-play',
      keywords: [...defaultKeywords, 'quick play', 'online matchmaking'],
      image: defaultImage,
      snapshot: {
        heading: { text: 'Quick Play Makruk' },
        paragraphs: [
          { text: 'Start a fast online Makruk game and get matched with another player.' },
          { text: 'เริ่มเกมหมากรุกไทยแบบจับคู่ไวและเล่นได้ทันที', lang: 'th' },
        ],
        links: [
          { href: '/bot', label: 'Play vs Bot' },
          { href: '/local', label: 'Local board' },
          { href: '/play-makruk-online', label: 'All ways to play' },
        ],
      },
    };
  }

  if (cleanPath === '/bot') {
    return {
      title: 'Play ThaiChess Against Bot | Makruk Practice Online',
      description: 'Practice ThaiChess against a bot in your browser and sharpen your Makruk openings, tactics, and endgames.',
      path: '/bot',
      keywords: [...defaultKeywords, 'Thai chess bot', 'practice Makruk'],
      image: defaultImage,
      snapshot: {
        heading: { text: 'Play Makruk Against a Bot' },
        paragraphs: [
          { text: 'Practice against the ThaiChess bot to work on openings, tactics, and endgames at your own pace.' },
          { text: 'ฝึกหมากรุกไทยกับบอทเพื่อพัฒนาช่วงเปิดเกม แท็กติก และเอ็นด์เกม', lang: 'th' },
        ],
        links: [
          { href: '/puzzles', label: 'โจทย์หมากรุกไทย', lang: 'th' },
          { href: '/lessons', label: 'Makruk lessons' },
          { href: '/quick-play', label: 'Quick Play' },
        ],
      },
    };
  }

  if (cleanPath === '/local') {
    return {
      title: 'Local ThaiChess Board | Play Makruk on One Device',
      description: 'Use a local ThaiChess board to play Makruk on one device for study, over-the-board practice, or casual games.',
      path: '/local',
      keywords: [...defaultKeywords, 'local board', 'over the board'],
      image: defaultImage,
      snapshot: {
        heading: { text: 'Local Makruk Board' },
        paragraphs: [
          { text: 'Use one device to study Makruk positions or play casual local games over the board.' },
          { text: 'ใช้กระดานเดียวสำหรับฝึกหรือเล่นหมากรุกไทยแบบนั่งข้างกัน', lang: 'th' },
        ],
        links: [
          { href: '/bot', label: 'Play vs Bot' },
          { href: '/how-to-play-makruk', label: 'Makruk rules' },
          { href: '/play-makruk-online', label: 'Play online' },
        ],
      },
    };
  }

  if (cleanPath.startsWith('/game/') || cleanPath.startsWith('/analysis/') || cleanPath === '/feedback' || cleanPath === '/login' || cleanPath === '/account' || cleanPath === '/donate') {
    return {
      title: 'ThaiChess',
      description: 'Play ThaiChess online.',
      path: cleanPath,
      robots: 'noindex, nofollow',
    };
  }

  return {
    title: 'ThaiChess | Play Makruk Online',
    description: 'Play ThaiChess online for free and explore the traditional Thai chess game.',
    path: cleanPath,
    keywords: defaultKeywords,
    image: defaultImage,
  };
}

export function getIndexablePaths(): string[] {
  return [
    '/',
    '/about',
    '/games',
    '/database',
    '/openings',
    '/leaderboard',
    '/what-is-makruk',
    '/how-to-play-makruk',
    '/play-makruk-online',
    '/lessons',
    '/puzzles',
    '/quick-play',
    '/bot',
    '/local',
    ...getSeoPuzzlePaths(),
  ];
}

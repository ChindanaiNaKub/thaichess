import { PUZZLES } from './puzzles';

export interface SeoRouteData {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  robots?: string;
  type?: 'website' | 'article';
  structuredData?: Record<string, unknown>[];
}

const defaultKeywords = [
  'ThaiChess',
  'Makruk',
  'Thai chess',
  'play ThaiChess online',
  'Makruk puzzles',
  'Thai chess strategy',
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
    alternateName: 'Makruk Thai Chess',
    url: baseUrl,
    description: 'Play ThaiChess online for free with friends, bots, and puzzles.',
    inLanguage: ['en', 'th'],
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
        name: 'Can I play ThaiChess online for free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. ThaiChess lets you play online for free in your browser.',
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

export function getPublicSeoRoute(pathname: string, baseUrl: string): SeoRouteData {
  const cleanPath = pathname.split('?')[0].split('#')[0] || '/';

  if (cleanPath === '/') {
    return {
      title: 'Play ThaiChess Online Free | Makruk with Friends, Bot, and Puzzles',
      description: 'Play ThaiChess online for free. Challenge friends, practice against a bot, solve Makruk puzzles, and learn the traditional Thai chess game in your browser.',
      path: '/',
      keywords: [...defaultKeywords, 'play with friends', 'Thai chess bot'],
      type: 'website',
      structuredData: [
        buildWebsiteSchema(baseUrl),
        buildWebApplicationSchema(baseUrl),
        buildHomeFaqSchema(),
      ],
    };
  }

  if (cleanPath === '/about') {
    return {
      title: 'About ThaiChess | Learn Makruk and the Mission Behind the Site',
      description: 'Learn what ThaiChess, or Makruk, is and why this open-source project exists to make traditional Thai chess easier to play and discover online.',
      path: '/about',
      keywords: [...defaultKeywords, 'what is Makruk', 'Thai chess rules'],
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About ThaiChess',
          url: `${baseUrl}/about`,
          description: 'Background on ThaiChess, Makruk, and the project mission.',
        },
      ],
    };
  }

  if (cleanPath === '/games') {
    return {
      title: 'Recent ThaiChess Games | Browse Finished Makruk Games',
      description: 'Browse recent finished ThaiChess games, review results, and open move analysis for completed Makruk matches.',
      path: '/games',
      keywords: [...defaultKeywords, 'Thai chess games', 'Makruk game archive'],
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Recent ThaiChess Games',
          url: `${baseUrl}/games`,
          description: 'A public archive of recent completed ThaiChess games.',
        },
      ],
    };
  }

  if (cleanPath === '/leaderboard') {
    return {
      title: 'ThaiChess Leaderboard | Top Rated Makruk Players',
      description: 'See the top rated ThaiChess players, compare Makruk ratings, and track the strongest active competitors on the leaderboard.',
      path: '/leaderboard',
      keywords: [...defaultKeywords, 'Makruk leaderboard', 'Thai chess rating', 'top Makruk players'],
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'ThaiChess Leaderboard',
          url: `${baseUrl}/leaderboard`,
          description: 'A public leaderboard of rated ThaiChess players.',
        },
      ],
    };
  }

  if (cleanPath === '/what-is-makruk') {
    return {
      title: 'What Is Makruk? | Learn Thai Chess',
      description: 'Learn what Makruk is, how Thai chess differs from western chess, and why this traditional game rewards patient, technical play.',
      path: '/what-is-makruk',
      keywords: [...defaultKeywords, 'what is Makruk', 'learn Makruk', 'Thai chess explained'],
      type: 'article',
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'What Is Makruk?',
          about: ['Makruk', 'Thai chess'],
          url: `${baseUrl}/what-is-makruk`,
          description: 'An introduction to Makruk, the traditional chess game of Thailand.',
          inLanguage: ['en', 'th'],
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
        ]),
      ],
    };
  }

  if (cleanPath === '/how-to-play-makruk') {
    return {
      title: 'How to Play Makruk | Thai Chess Rules for Beginners',
      description: 'Learn how to play Makruk with board setup, piece movement, promotion, and the counting rule in a beginner-friendly Thai chess guide.',
      path: '/how-to-play-makruk',
      keywords: [...defaultKeywords, 'Makruk rules', 'how to play Makruk', 'Thai chess rules'],
      type: 'article',
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to Play Makruk',
          url: `${baseUrl}/how-to-play-makruk`,
          description: 'A beginner-friendly guide to the rules of Thai chess.',
          inLanguage: ['en', 'th'],
        },
        buildFaqSchema([
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
    };
  }

  if (cleanPath === '/play-makruk-online') {
    return {
      title: 'Play Makruk Online | Thai Chess in Your Browser',
      description: 'Play Makruk online in your browser, practice against the bot, solve Thai chess puzzles, or challenge other players without installing anything.',
      path: '/play-makruk-online',
      keywords: [...defaultKeywords, 'play Makruk online', 'Thai chess online', 'browser Makruk'],
      type: 'article',
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Play Makruk Online',
          about: ['Makruk', 'Thai chess online'],
          url: `${baseUrl}/play-makruk-online`,
          description: 'A guide to the best ways to start playing Makruk online.',
          inLanguage: ['en', 'th'],
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
        ]),
      ],
    };
  }

  if (cleanPath === '/puzzles') {
    return {
      title: 'ThaiChess Puzzles | Practice Makruk Tactics Online',
      description: 'Solve ThaiChess puzzles online and practice Makruk tactics, mating patterns, and calculation across beginner to advanced difficulty.',
      path: '/puzzles',
      keywords: [...defaultKeywords, 'Makruk tactics', 'Thai chess puzzles'],
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'ThaiChess Puzzles',
          url: `${baseUrl}/puzzles`,
          description: 'A collection of interactive ThaiChess puzzles.',
        },
      ],
    };
  }

  if (cleanPath === '/lessons' || cleanPath === '/course' || cleanPath === '/course-path' || cleanPath === '/learn') {
    return {
      title: 'Makruk Lessons | Structured ThaiChess Course',
      description: 'Study Makruk through a structured lessons course with guided explanations, interactive boards, and practice linked to real concepts.',
      path: '/lessons',
      keywords: [...defaultKeywords, 'Makruk lessons', 'Thai chess course', 'learn Makruk'],
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
    };
  }

  if (cleanPath.startsWith('/lessons/') || cleanPath.startsWith('/course/') || cleanPath.startsWith('/learn/')) {
    const lessonId = cleanPath.split('/')[2] ?? '';

    return {
      title: 'Makruk Lesson | ThaiChess Course',
      description: 'Work through an interactive Makruk lesson with guided steps, practice tasks, and follow-up puzzles.',
      path: lessonId ? `/lessons/${lessonId}` : '/lessons',
      keywords: [...defaultKeywords, 'Makruk lesson', 'Thai chess training'],
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
    };
  }

  if (cleanPath.startsWith('/puzzle/')) {
    const id = Number(cleanPath.split('/')[2]);
    const puzzle = PUZZLES.find((entry) => entry.id === id);
    const puzzleTitle = puzzle ? getPublicPuzzleSeoTitle(puzzle.title) : `Puzzle ${id}`;
    const puzzleDescription = puzzle?.description ?? 'Interactive ThaiChess puzzle.';

    return {
      title: `${puzzleTitle} | ThaiChess Puzzle ${id}`,
      description: `${puzzleDescription} Practice this ThaiChess puzzle online and improve your Makruk calculation.`,
      path: cleanPath,
      keywords: [...defaultKeywords, 'interactive puzzle', puzzleTitle],
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'Quiz',
          name: `${puzzleTitle} | ThaiChess Puzzle ${id}`,
          educationalLevel: puzzle?.difficulty ?? 'all',
          learningResourceType: 'Practice problem',
          about: ['ThaiChess', 'Makruk tactics'],
          url: `${baseUrl}${cleanPath}`,
          description: puzzleDescription,
        },
      ],
    };
  }

  if (cleanPath === '/quick-play') {
    return {
      title: 'Quick Play ThaiChess | Find an Online Makruk Opponent',
      description: 'Start a quick ThaiChess game online and get matched with an opponent for a fast Makruk game in your browser.',
      path: '/quick-play',
      keywords: [...defaultKeywords, 'quick play', 'online matchmaking'],
    };
  }

  if (cleanPath === '/bot') {
    return {
      title: 'Play ThaiChess Against Bot | Makruk Practice Online',
      description: 'Practice ThaiChess against a bot in your browser and sharpen your Makruk openings, tactics, and endgames.',
      path: '/bot',
      keywords: [...defaultKeywords, 'Thai chess bot', 'practice Makruk'],
    };
  }

  if (cleanPath === '/local') {
    return {
      title: 'Local ThaiChess Board | Play Makruk on One Device',
      description: 'Use a local ThaiChess board to play Makruk on one device for study, over-the-board practice, or casual games.',
      path: '/local',
      keywords: [...defaultKeywords, 'local board', 'over the board'],
    };
  }

  if (cleanPath.startsWith('/game/') || cleanPath.startsWith('/analysis/') || cleanPath === '/feedback' || cleanPath === '/login' || cleanPath === '/account') {
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
  };
}

export function getIndexablePaths(): string[] {
  return [
    '/',
    '/about',
    '/games',
    '/leaderboard',
    '/what-is-makruk',
    '/how-to-play-makruk',
    '/play-makruk-online',
    '/lessons',
    '/puzzles',
    '/quick-play',
    '/bot',
    '/local',
    ...PUZZLES.map((puzzle) => `/puzzle/${puzzle.id}`),
  ];
}

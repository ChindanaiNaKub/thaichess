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

  if (cleanPath.startsWith('/puzzle/')) {
    const id = Number(cleanPath.split('/')[2]);
    const puzzle = PUZZLES.find((entry) => entry.id === id);
    const puzzleTitle = puzzle?.title ?? `Puzzle ${id}`;
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
    '/puzzles',
    '/quick-play',
    '/bot',
    '/local',
    ...PUZZLES.map((puzzle) => `/puzzle/${puzzle.id}`),
  ];
}

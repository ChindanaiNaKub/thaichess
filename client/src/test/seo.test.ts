import { describe, expect, it, afterEach } from 'vitest';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { getIndexablePaths, getPublicSeoRoute } from '@shared/seo';
import { PUZZLES } from '@shared/puzzles';
import { routes } from '../lib/routes';
import { render } from '@testing-library/react';
import { SeoHeadManager } from '../lib/seo';

const managedStructuredDataSelector = 'script[type="application/ld+json"][data-seo-managed="true"]';

afterEach(() => {
  for (const node of document.head.querySelectorAll(managedStructuredDataSelector)) {
    node.remove();
  }
});

describe('shared SEO routes', () => {
  it('keeps every public static route in the indexable sitemap', () => {
    expect(getIndexablePaths()).toEqual([
      routes.home,
      routes.about,
      routes.games,
      routes.leaderboard,
      routes.whatIsMakruk,
      routes.howToPlayMakruk,
      routes.playMakrukOnline,
      routes.lessons,
      routes.puzzles,
      routes.quickPlay,
      routes.bot,
      routes.local,
      ...PUZZLES.map((puzzle) => `/puzzle/${puzzle.id}`),
    ]);
  });

  it('returns dedicated leaderboard metadata', () => {
    const seo = getPublicSeoRoute('/leaderboard', 'https://thaichess.dev');

    expect(seo.path).toBe('/leaderboard');
    expect(seo.title).toContain('Leaderboard');
    expect(seo.description).toContain('Makruk ratings');
    expect(seo.robots).toBeUndefined();
  });

  it('returns dedicated guide metadata for the evergreen content pages', () => {
    const whatIs = getPublicSeoRoute(routes.whatIsMakruk, 'https://thaichess.dev');
    const howTo = getPublicSeoRoute(routes.howToPlayMakruk, 'https://thaichess.dev');
    const playOnline = getPublicSeoRoute(routes.playMakrukOnline, 'https://thaichess.dev');

    expect(whatIs.title).toContain('What Is Makruk');
    expect(howTo.title).toContain('How to Play Makruk');
    expect(playOnline.title).toContain('Play Makruk Online');
    expect(whatIs.robots).toBeUndefined();
    expect(howTo.robots).toBeUndefined();
    expect(playOnline.robots).toBeUndefined();
  });

  it('returns dedicated metadata for the lessons section and its aliases', () => {
    const overview = getPublicSeoRoute(routes.lessons, 'https://thaichess.dev');
    const alias = getPublicSeoRoute(routes.coursePath, 'https://thaichess.dev');
    const lesson = getPublicSeoRoute('/lessons/rook-activity', 'https://thaichess.dev');

    expect(overview.path).toBe('/lessons');
    expect(overview.title).toContain('Lessons');
    expect(alias.path).toBe('/lessons');
    expect(lesson.path).toBe('/lessons/rook-activity');
    expect(lesson.title).toContain('Lesson');
  });

  it('uses cleaned public titles for puzzle metadata', () => {
    const seo = getPublicSeoRoute('/puzzle/5001', 'https://thaichess.dev');

    expect(seo.title).toBe('Trap The Knight Before It Escapes | ThaiChess Puzzle 5001');
    expect(seo.description).toContain('Win material in 2.');
  });

  it('marks non-public app routes as noindex', () => {
    expect(getPublicSeoRoute(routes.feedback, 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute(routes.login, 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute(routes.account, 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute('/game/abc123', 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute('/analysis/abc123', 'https://thaichess.dev').robots).toBe('noindex, nofollow');
  });

  it('emits FAQ structured data as a single FAQPage object per script tag', () => {
    render(
      createElement(
        MemoryRouter,
        { initialEntries: [routes.whatIsMakruk] },
        createElement(SeoHeadManager)
      )
    );

    const scripts = Array.from(document.head.querySelectorAll(managedStructuredDataSelector));
    expect(scripts).toHaveLength(2);

    const payloads = scripts.map((script) => JSON.parse(script.textContent ?? '{}'));
    expect(payloads.every((payload) => !Array.isArray(payload))).toBe(true);

    const faqPayloads = payloads.filter((payload) => payload['@type'] === 'FAQPage');
    expect(faqPayloads).toHaveLength(1);
    expect(faqPayloads[0].mainEntity).toHaveLength(2);
  });
});

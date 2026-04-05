import { describe, expect, it, afterEach } from 'vitest';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { getIndexablePaths, getPublicSeoRoute } from '@shared/seo';
import { SEO_PUZZLES } from '@shared/seoPuzzleManifest';
import { routes } from '../lib/routes';
import { render, waitFor } from '@testing-library/react';
import { SeoHeadManager } from '../lib/seo';

const managedStructuredDataSelector = 'script[type="application/ld+json"][data-seo-managed="true"]';
const serverStructuredDataSelector = 'script[type="application/ld+json"][data-seo-server="true"]';

afterEach(() => {
  for (const node of document.head.querySelectorAll(`${managedStructuredDataSelector}, ${serverStructuredDataSelector}`)) {
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
      ...SEO_PUZZLES.map((puzzle) => `/puzzle/${puzzle.id}`),
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
    expect(whatIs.title).toContain('หมากรุกไทย');
    expect(howTo.title).toContain('How to Play Makruk');
    expect(howTo.title).toContain('หมากรุกไทย');
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

  it('uses the published puzzle catalog for puzzle metadata', () => {
    const puzzle = SEO_PUZZLES.find((entry) => entry.id === 7001);
    expect(puzzle).toBeDefined();

    const seo = getPublicSeoRoute('/puzzle/7001', 'https://thaichess.dev');

    expect(seo.title).toBe('Ma Fork Through the Shell | ThaiChess Puzzle 7001');
    expect(seo.description).toContain(puzzle?.description ?? '');
  });

  it('marks non-public app routes as noindex', () => {
    expect(getPublicSeoRoute(routes.feedback, 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute(routes.login, 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute(routes.account, 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute('/game/abc123', 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute('/analysis/abc123', 'https://thaichess.dev').robots).toBe('noindex, nofollow');
  });

  it('emits FAQ structured data as a single FAQPage object per script tag', async () => {
    render(
      createElement(
        MemoryRouter,
        { initialEntries: [routes.whatIsMakruk] },
        createElement(SeoHeadManager)
      )
    );

    await waitFor(() => {
      expect(document.head.querySelectorAll(managedStructuredDataSelector)).toHaveLength(2);
    });

    const scripts = Array.from(document.head.querySelectorAll(managedStructuredDataSelector));
    expect(scripts).toHaveLength(2);

    const payloads = scripts.map((script) => JSON.parse(script.textContent ?? '{}'));
    expect(payloads.every((payload) => !Array.isArray(payload))).toBe(true);

    const faqPayloads = payloads.filter((payload) => payload['@type'] === 'FAQPage');
    expect(faqPayloads).toHaveLength(1);
    expect(faqPayloads[0].mainEntity).toHaveLength(2);
  });

  it('replaces server structured data during hydration instead of duplicating FAQPage', async () => {
    const serverScript = document.createElement('script');
    serverScript.type = 'application/ld+json';
    serverScript.setAttribute('data-seo-server', 'true');
    serverScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is ThaiChess?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ThaiChess is Makruk.',
          },
        },
      ],
    });
    document.head.appendChild(serverScript);

    render(
      createElement(
        MemoryRouter,
        { initialEntries: [routes.home] },
        createElement(SeoHeadManager)
      )
    );

    await waitFor(() => {
      expect(document.head.querySelector(serverStructuredDataSelector)).toBeNull();
      expect(document.head.querySelectorAll(managedStructuredDataSelector).length).toBeGreaterThan(0);
    });

    const scripts = Array.from(document.head.querySelectorAll(managedStructuredDataSelector));
    const faqPayloads = scripts
      .map((script) => JSON.parse(script.textContent ?? '{}'))
      .filter((payload) => payload['@type'] === 'FAQPage');

    expect(faqPayloads).toHaveLength(1);
  });

  it('includes Thai query support in the homepage SEO snapshot', () => {
    const seo = getPublicSeoRoute(routes.home, 'https://thaichess.dev');

    expect(seo.keywords).toContain('หมากรุกไทย');
    expect(seo.snapshot?.paragraphs?.some((paragraph) => paragraph.text.includes('หมากรุกไทย'))).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { renderSeoHtml } from '../seoHtml';

const template = `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>ThaiChess</title>
    <meta name="description" content="" />
    <meta name="robots" content="index, follow" />
    <meta name="keywords" content="" />
    <link rel="canonical" href="https://thaichess.dev/" />
    <meta property="og:title" content="" />
    <meta property="og:description" content="" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://thaichess.dev/" />
    <meta property="og:image" content="" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="" />
    <meta name="twitter:description" content="" />
    <meta name="twitter:image" content="" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

describe('renderSeoHtml', () => {
  it('injects a crawlable snapshot for indexable routes', () => {
    const html = renderSeoHtml(template, '/what-is-makruk', 'https://thaichess.dev');

    expect(html).toContain('<div id="root"><main data-seo-snapshot="true">');
    expect(html).toContain('What Is Makruk (หมากรุกไทย)? | Learn Thai Chess');
    expect(html).toContain('หมากรุกไทยเป็นหมากรุกดั้งเดิมของไทย');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('<meta property="og:image" content="https://thaichess.dev/og-felt-table.jpg" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('href="https://thaichess.dev/how-to-play-makruk"');
  });

  it('renders trailing-slash guide requests with canonical guide metadata', () => {
    const html = renderSeoHtml(template, '/how-to-play-makruk/', 'https://thaichess.dev');

    expect(html).toContain('<link rel="canonical" href="https://thaichess.dev/how-to-play-makruk" />');
    expect(html).toContain('วิธีเล่นหมากรุกไทย');
    expect(html).toContain('"@type":"HowTo"');
    expect(html).toContain('<div id="root"><main data-seo-snapshot="true">');
  });

  it('does not inject a snapshot for noindex routes', () => {
    const html = renderSeoHtml(template, '/login', 'https://thaichess.dev');

    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(html).toContain('<div id="root"></div>');
    expect(html).not.toContain('data-seo-snapshot="true"');
  });

  it('marks unpublished puzzle ids as noindex', () => {
    const html = renderSeoHtml(template, '/puzzle/7001', 'https://thaichess.dev');

    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).not.toContain('data-seo-snapshot="true"');
  });

  it('sets html lang and og:locale per route and strips hreflang/alternate', () => {
    const home = renderSeoHtml(template, '/', 'https://thaichess.dev');
    expect(home).toContain('<html lang="th">');
    expect(home).toContain('<meta property="og:locale" content="th_TH" />');
    expect(home).not.toContain('og:locale:alternate');
    expect(home).not.toContain('hreflang');
    // Home snapshot must be Thai-only (AC 4 — single bilingual page vs /th split: Thai-primary)
    expect(home).toContain('หมากรุกไทยหรือ Makruk');
    expect(home).not.toContain('Makruk, or Thai chess, is the traditional chess game of Thailand.');
    expect(home).not.toContain('Play with friends, quick matchmaking');
    expect(home).toContain('เล่นกับบอท');

    const guideEn = renderSeoHtml(template, '/what-is-makruk', 'https://thaichess.dev');
    expect(guideEn).toContain('<html lang="en">');
    expect(guideEn).toContain('<meta property="og:locale" content="en_US" />');
    expect(guideEn).not.toContain('og:locale:alternate');
    expect(guideEn).not.toContain('hreflang');

    const guideTh = renderSeoHtml(template, '/how-to-play-makruk', 'https://thaichess.dev');
    expect(guideTh).toContain('<html lang="th">');
    expect(guideTh).toContain('<meta property="og:locale" content="th_TH" />');
  });

  it('strips stale hreflang/alternate tags already present in the template', () => {
    const staleTemplate = template.replace('</head>', '  <link rel="alternate" hreflang="en" href="https://thaichess.dev/" />\n  <link rel="alternate" hreflang="th" href="https://thaichess.dev/" />\n  <meta property="og:locale:alternate" content="th_TH" />\n  </head>');
    const html = renderSeoHtml(staleTemplate, '/', 'https://thaichess.dev');
    expect(html).not.toContain('hreflang');
    expect(html).not.toContain('og:locale:alternate');
  });
});

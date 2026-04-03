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
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="" />
    <meta name="twitter:description" content="" />
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
  });

  it('does not inject a snapshot for noindex routes', () => {
    const html = renderSeoHtml(template, '/login', 'https://thaichess.dev');

    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(html).toContain('<div id="root"></div>');
    expect(html).not.toContain('data-seo-snapshot="true"');
  });
});

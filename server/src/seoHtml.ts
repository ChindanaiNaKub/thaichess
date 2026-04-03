import { getPublicSeoRoute, type SeoRouteData, type SeoSnapshotLink, type SeoTextBlock } from '../../shared/seo';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function upsertHeadTag(html: string, pattern: RegExp, replacement: string): string {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace('</head>', `  ${replacement}\n  </head>`);
}

function renderLangAttribute(lang?: string): string {
  return lang ? ` lang="${escapeHtml(lang)}"` : '';
}

function renderTextBlock(tagName: string, block: SeoTextBlock): string {
  return `<${tagName}${renderLangAttribute(block.lang)}>${escapeHtml(block.text)}</${tagName}>`;
}

function renderLink(link: SeoSnapshotLink, baseUrl: string): string {
  const href = new URL(link.href, `${baseUrl}/`).toString();
  return `<li><a href="${escapeHtml(href)}"${renderLangAttribute(link.lang)}>${escapeHtml(link.label)}</a></li>`;
}

function renderSnapshotHtml(seo: SeoRouteData, baseUrl: string): string {
  const heading = seo.snapshot?.heading ?? { text: seo.title, lang: 'en' as const };
  const paragraphs = seo.snapshot?.paragraphs?.length ? seo.snapshot.paragraphs : [{ text: seo.description, lang: 'en' as const }];
  const kickerHtml = seo.snapshot?.kicker ? `      ${renderTextBlock('p', seo.snapshot.kicker)}\n` : '';
  const paragraphsHtml = paragraphs.map((paragraph) => `      ${renderTextBlock('p', paragraph)}`).join('\n');
  const bulletsHtml = seo.snapshot?.bullets?.length
    ? `\n      <ul>\n${seo.snapshot.bullets.map((bullet) => `        <li${renderLangAttribute(bullet.lang)}>${escapeHtml(bullet.text)}</li>`).join('\n')}\n      </ul>`
    : '';
  const linksHtml = seo.snapshot?.links?.length
    ? `\n      <nav aria-label="SEO links">\n        <ul>\n${seo.snapshot.links.map((link) => `          ${renderLink(link, baseUrl)}`).join('\n')}\n        </ul>\n      </nav>`
    : '';

  return [
    '<main data-seo-snapshot="true">',
    '  <article>',
    kickerHtml.trimEnd(),
    `      ${renderTextBlock('h1', heading)}`,
    paragraphsHtml,
    bulletsHtml,
    linksHtml,
    '  </article>',
    '</main>',
  ].filter(Boolean).join('\n');
}

export function renderSeoHtml(template: string, pathname: string, baseUrl: string): string {
  const seo = getPublicSeoRoute(pathname, baseUrl);
  const canonicalUrl = new URL(seo.path, `${baseUrl}/`).toString();
  const robots = seo.robots ?? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
  const keywords = seo.keywords?.join(', ');
  const structuredData = seo.structuredData?.length
    ? JSON.stringify(seo.structuredData.length === 1 ? seo.structuredData[0] : seo.structuredData).replace(/</g, '\\u003c')
    : null;

  let html = template;
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(seo.title)}</title>`);
  html = upsertHeadTag(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(seo.description)}" />`);
  html = upsertHeadTag(html, /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${escapeHtml(robots)}" />`);
  html = upsertHeadTag(html, /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i, `<meta name="keywords" content="${escapeHtml(keywords ?? '')}" />`);
  html = upsertHeadTag(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  html = upsertHeadTag(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`);
  html = upsertHeadTag(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(seo.description)}" />`);
  html = upsertHeadTag(html, /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${escapeHtml(seo.type ?? 'website')}" />`);
  html = upsertHeadTag(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  html = upsertHeadTag(html, /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/i, '<meta name="twitter:card" content="summary" />');
  html = upsertHeadTag(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`);
  html = upsertHeadTag(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`);

  html = html.replace(/\s*<script[^>]*data-seo-server="true"[^>]*>.*?<\/script>/gs, '');
  if (structuredData) {
    html = html.replace('</head>', `  <script type="application/ld+json" data-seo-server="true">${structuredData}</script>\n  </head>`);
  }

  if (!seo.robots?.includes('noindex')) {
    html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${renderSnapshotHtml(seo, baseUrl)}</div>`);
  }

  return html;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPublicSeoRoute } from '@shared/seo';

const META_KEY = 'data-seo-managed';
const STRUCTURED_DATA_SELECTOR = 'script[type="application/ld+json"][data-seo-managed="true"], script[type="application/ld+json"][data-seo-server="true"]';

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return 'https://thaichess.dev';
}

function upsertMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  const selector = `meta[${attribute}="${name}"][${META_KEY}="true"]`;
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    tag.setAttribute(META_KEY, 'true');
    document.head.appendChild(tag);
  }

  tag.content = content;
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"][${META_KEY}="true"]`;
  let tag = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!tag) {
    tag = document.createElement('link');
    tag.rel = rel;
    tag.setAttribute(META_KEY, 'true');
    document.head.appendChild(tag);
  }

  tag.href = href;
}

function upsertStructuredData(entries: Record<string, unknown>[]) {
  const existing = Array.from(document.head.querySelectorAll(STRUCTURED_DATA_SELECTOR));

  for (const node of existing) {
    node.remove();
  }

  for (const entry of entries) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(META_KEY, 'true');
    script.textContent = JSON.stringify(entry);
    document.head.appendChild(script);
  }
}

export function SeoHeadManager() {
  const location = useLocation();

  useEffect(() => {
    const baseUrl = getBaseUrl();
    const seo = getPublicSeoRoute(location.pathname, baseUrl);
    const canonicalUrl = new URL(seo.path, `${baseUrl}/`).toString();

    document.title = seo.title;
    upsertMeta('description', seo.description);
    upsertMeta('robots', seo.robots ?? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    upsertMeta('keywords', seo.keywords?.join(', ') ?? '');
    upsertMeta('og:title', seo.title, 'property');
    upsertMeta('og:description', seo.description, 'property');
    upsertMeta('og:type', seo.type ?? 'website', 'property');
    upsertMeta('og:url', canonicalUrl, 'property');
    upsertMeta('twitter:card', 'summary', 'name');
    upsertMeta('twitter:title', seo.title, 'name');
    upsertMeta('twitter:description', seo.description, 'name');
    upsertLink('canonical', canonicalUrl);

    if (seo.structuredData?.length) {
      upsertStructuredData(seo.structuredData);
      return;
    }

    const existing = Array.from(document.head.querySelectorAll(STRUCTURED_DATA_SELECTOR));
    for (const node of existing) {
      node.remove();
    }
  }, [location.pathname]);

  return null;
}

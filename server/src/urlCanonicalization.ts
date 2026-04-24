export function getCanonicalRedirectUrl(options: {
  host: string;
  protocol: string;
  originalUrl: string;
}): string | null {
  const { host, protocol, originalUrl } = options;
  const requestHost = host || 'localhost';
  const parsedUrl = new URL(originalUrl, `https://${requestHost}`);
  let canonicalHost = requestHost;
  let canonicalProtocol = protocol;
  let canonicalPathname = parsedUrl.pathname;
  let changed = false;

  if (canonicalHost.startsWith('www.')) {
    canonicalHost = canonicalHost.slice(4);
    canonicalProtocol = 'https';
    changed = true;
  } else if (canonicalProtocol === 'http' && !canonicalHost.includes('localhost') && !canonicalHost.includes('127.0.0.1')) {
    canonicalProtocol = 'https';
    changed = true;
  }

  if (
    canonicalPathname.length > 1
    && canonicalPathname.endsWith('/')
    && !/\/[^/]+\.[^/]+$/.test(canonicalPathname)
  ) {
    canonicalPathname = canonicalPathname.replace(/\/+$/, '');
    changed = true;
  }

  if (!changed) {
    return null;
  }

  return `${canonicalProtocol}://${canonicalHost}${canonicalPathname}${parsedUrl.search}`;
}

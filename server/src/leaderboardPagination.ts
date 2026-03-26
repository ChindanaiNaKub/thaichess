export function normalizeLeaderboardPage(rawPage: string | undefined): number {
  const parsedPage = Number.parseInt(rawPage ?? '', 10);

  if (!Number.isFinite(parsedPage)) {
    return 0;
  }

  return Math.max(0, Math.min(parsedPage, 1000));
}

export function normalizeLeaderboardLimit(rawLimit: string | undefined): number {
  const parsedLimit = Number.parseInt(rawLimit ?? '', 10);

  if (!Number.isFinite(parsedLimit)) {
    return 25;
  }

  return Math.max(1, Math.min(parsedLimit, 100));
}

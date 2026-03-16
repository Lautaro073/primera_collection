const DEFAULT_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string): string {
  return value.replace(/\/$/, "");
}

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    return DEFAULT_SITE_URL;
  }

  return normalizeSiteUrl(configuredUrl);
}

export function isSiteUrlProductionReady(): boolean {
  try {
    const url = new URL(getSiteUrl());
    return !/^(localhost|127\.0\.0\.1)$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function shouldIndexSite(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return isSiteUrlProductionReady();
}

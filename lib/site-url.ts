// GitHub Pages supplies its configured base URL, including a custom domain.
const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/`;
export const siteUrl = new URL(configuredUrl.endsWith("/") ? configuredUrl : `${configuredUrl}/`).href;

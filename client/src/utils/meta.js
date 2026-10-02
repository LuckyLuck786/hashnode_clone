const SITE_NAME = 'Monospace';
const DEFAULT_DESCRIPTION =
  'A developer-first publishing platform. Write in Markdown, ship code that reads well.';

export function buildMetaTags({ title, description, url, image }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — writing for developers`;
  const summary = description || DEFAULT_DESCRIPTION;
  const absoluteUrl = url ?? (typeof window !== 'undefined' ? window.location.href : undefined);

  const tags = [
    ['property', 'og:site_name', SITE_NAME],
    ['property', 'og:type', 'website'],
    ['property', 'og:title', fullTitle],
    ['property', 'og:description', summary],
    ['name', 'twitter:card', image ? 'summary_large_image' : 'summary'],
    ['name', 'twitter:title', fullTitle],
    ['name', 'twitter:description', summary],
  ];

  if (absoluteUrl) tags.push(['property', 'og:url', absoluteUrl]);
  if (image) {
    tags.push(['property', 'og:image', image]);
    tags.push(['name', 'twitter:image', image]);
  }

  return { title: fullTitle, description: summary, tags };
}

// Creates the tag if it is missing, otherwise updates it, so navigating between pages
// never accumulates duplicates in the head.
function upsertMeta(attribute, key, value) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

/**
 * Writes title, description and social tags for the current page.
 *
 * Note on scope: the client is a single-page app, so this only affects a browser that
 * has already loaded the page. Link crawlers (Slack, Discord, X) read the raw HTML
 * before any JavaScript runs, so a shared link still shows the generic site preview.
 * Fixing that needs server-rendered tags or a prerender step at build time, which this
 * project deliberately avoids.
 */
export function applyMeta({ title, description, url, image }) {
  if (typeof document === 'undefined') return;

  const built = buildMetaTags({ title, description, url, image });

  document.title = built.title;
  upsertMeta('name', 'description', built.description);
  for (const [attribute, key, value] of built.tags) {
    upsertMeta(attribute, key, value);
  }

  // Tags removed by navigating away from a post must not linger.
  if (!image) {
    for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
      document.head.querySelector(selector)?.remove();
    }
  }
}
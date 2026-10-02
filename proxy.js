import { next } from '@vercel/functions';
import connectDB from './server/config/db.js';
import Post from './server/models/Post.js';

const SITE_NAME = 'Monospace';
const DEFAULT_DESCRIPTION =
  'A developer-first publishing platform. Write in Markdown, ship code that reads well.';

// Set on the internal fetch below so the middleware recognises its own request and
// passes straight through instead of calling itself again.
const INTERNAL_FETCH_HEADER = 'x-monospace-meta-fetch';

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!api/|assets/|_vercel/|favicon|robots\\.txt|sitemap\\.xml|.*\\.[a-zA-Z0-9]+$).*)'],
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// og:* is emitted before the twitter:* tags, because some crawlers stop reading at the
// first block they recognise and would otherwise miss the image.
function buildTags({ title, description, url, image, type }) {
  const tags = [
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:type', content: type }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
  ];

  if (image) {
    tags.push(['meta', { property: 'og:image', content: image }]);
    tags.push(['meta', { name: 'twitter:image', content: image }]);
  }

  return tags
    .map(([tag, attrs]) => {
      const rendered = Object.entries(attrs)
        .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
        .join(' ');
      return `<${tag} ${rendered}>`;
    })
    .join('');
}

// Swaps the generic title and description for page-specific ones and appends the
// Open Graph block. The client still updates document.title after navigation, so this
// is the no-JavaScript view that crawlers see.
function injectMeta(html, meta) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    )
    .replace('</head>', `  ${buildTags(meta)}\n</head>`);
}

// Resolves the metadata for a path, or null when the page has nothing specific to say.
async function resolveMeta(url) {
  const { origin, pathname } = url;

  const postMatch = pathname.match(/^\/post\/([^/]+)\/?$/);
  if (postMatch) {
    await connectDB();
    const post = await Post.findOne({
      slug: decodeURIComponent(postMatch[1]),
      status: 'published',
    })
      .select('title excerpt coverImage')
      .lean();

    if (post) {
      return {
        title: `${post.title} — ${SITE_NAME}`,
        description: post.excerpt || DEFAULT_DESCRIPTION,
        url: `${origin}${pathname}`,
        image: post.coverImage || undefined,
        type: 'article',
      };
    }
  }

  const tagMatch = pathname.match(/^\/tag\/([^/]+)\/?$/);
  if (tagMatch) {
    const name = decodeURIComponent(tagMatch[1]);
    return {
      title: `Posts tagged #${name} — ${SITE_NAME}`,
      description: `Every published post tagged ${name} on ${SITE_NAME}.`,
      url: `${origin}${pathname}`,
      type: 'website',
    };
  }

  return null;
}

/**
 * Vercel Routing Middleware (Node.js runtime).
 *
 * The client is a single-page app, so every route serves the same static index.html and
 * link crawlers — Slack, Discord, X, iMessage — would share one generic preview for
 * every post. This looks the page up in MongoDB and injects Open Graph tags into the HTML
 * before it is served.
 *
 * Every failure path returns the untouched page: a missing database, a slow query or an
 * unexpected error must never stop the site from serving.
 */
export default async function proxy(request) {
  // Our own fetch of the same URL, or anything that is not a browser asking for HTML.
  if (request.headers.get(INTERNAL_FETCH_HEADER)) return next();
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  if (!(request.headers.get('accept') ?? '').includes('text/html')) return next();

  const url = new URL(request.url);

  try {
    const meta = await resolveMeta(url);
    if (!meta) return next();

    const response = await fetch(request.url, {
      headers: {
        accept: 'text/html',
        [INTERNAL_FETCH_HEADER]: '1',
        // Stops a CDN in front of the deployment handing back a copy that never had
        // meta tags injected into it.
        'cache-control': 'no-cache',
      },
    });

    if (!response.ok) return next();

    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.append('vary', 'Accept');

    return new Response(injectMeta(html, meta), { status: response.status, headers });
  } catch (error) {
    console.error('Meta proxy failed; serving the page unchanged:', error);
    return next();
  }
}
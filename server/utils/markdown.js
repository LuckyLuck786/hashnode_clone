const WORDS_PER_MINUTE = 200;

// Strips Markdown syntax so the text can be used for excerpts and word counts.
// It does not need to be perfect, only readable in a feed card.
export function markdownToPlainText(markdown) {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, '$2')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createExcerpt(markdown, maxLength = 200) {
  const text = markdownToPlainText(markdown);
  if (text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}

export function estimateReadingTime(markdown) {
  const words = String(markdown).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

// "javascript, node js" or ["javascript"] -> ["javascript", "node js"]
export function parseTagInput(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagsToInput(tags = []) {
  return tags.map((tag) => tag.name).join(', ');
}

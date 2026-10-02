import { describe, expect, test } from 'vitest';
import { formatDate, parseTagInput, tagsToInput } from '../utils/format.js';

describe('formatDate', () => {
  test('formats a valid date', () => {
    expect(formatDate('2026-03-04T10:00:00.000Z')).toMatch(/2026/);
  });

  test('returns an empty string rather than "Invalid Date"', () => {
    // A malformed date must not put the literal text "Invalid Date" in the UI.
    expect(formatDate('not-a-date')).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});

describe('parseTagInput', () => {
  test('splits a comma separated list', () => {
    expect(parseTagInput('javascript, mongodb , career')).toEqual([
      'javascript',
      'mongodb',
      'career',
    ]);
  });

  test('drops empty entries from trailing or doubled commas', () => {
    expect(parseTagInput('react,,  ,vue,')).toEqual(['react', 'vue']);
    expect(parseTagInput('')).toEqual([]);
    expect(parseTagInput('   ')).toEqual([]);
  });
});

describe('tagsToInput', () => {
  test('joins tag names back into the editor string', () => {
    expect(tagsToInput([{ name: 'javascript' }, { name: 'node js' }])).toBe(
      'javascript, node js',
    );
  });

  test('round-trips with parseTagInput', () => {
    // This is what happens when a post is loaded into the editor and saved again:
    // the API returns tag objects, the editor shows a string, the API wants names.
    const original = 'javascript, mongodb, career';
    const fromApi = parseTagInput(original).map((name) => ({ name }));
    expect(parseTagInput(tagsToInput(fromApi))).toEqual(parseTagInput(original));
  });

  test('handles an empty or missing tag list', () => {
    expect(tagsToInput()).toBe('');
    expect(tagsToInput([])).toBe('');
  });
});
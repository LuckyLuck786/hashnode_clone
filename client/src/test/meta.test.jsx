import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import useDocumentMeta from '../hooks/useDocumentMeta.js';
import { applyMeta, buildMetaTags } from '../utils/meta.js';

function Probe(props) {
  useDocumentMeta(props);
  return <p>probe</p>;
}

function metaContent(selector) {
  return document.head.querySelector(selector)?.getAttribute('content');
}

afterEach(() => {
  // The hook writes into <head>, which jsdom does not reset between tests.
  document.head.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach((el) =>
    el.remove(),
  );
  document.head.querySelector('meta[name="description"]')?.remove();
});

describe('buildMetaTags', () => {
  test('builds a full title and falls back to a generic description', () => {
    const built = buildMetaTags({ title: 'My post' });

    expect(built.title).toBe('My post — Monospace');
    expect(built.description).toMatch(/developer-first publishing platform/i);
  });

  test('uses a small summary card when there is no image', () => {
    const built = buildMetaTags({ title: 'My post' });
    const card = built.tags.find(([, key]) => key === 'twitter:card');
    expect(card[2]).toBe('summary');
  });

  test('uses a large card and emits an image when one exists', () => {
    const built = buildMetaTags({ title: 'My post', image: 'https://example.com/a.png' });
    const card = built.tags.find(([, key]) => key === 'twitter:card');
    expect(card[2]).toBe('summary_large_image');
    expect(built.tags.some(([, key, value]) => key === 'og:image' && value.endsWith('a.png'))).toBe(
      true,
    );
  });
});

describe('applyMeta', () => {
  test('writes title, description and og tags into the head', () => {
    applyMeta({
      title: 'Mongoose connections',
      description: 'A post about connections.',
      image: 'https://example.com/cover.png',
    });

    expect(document.title).toBe('Mongoose connections — Monospace');
    expect(metaContent('meta[name="description"]')).toBe('A post about connections.');
    expect(metaContent('meta[property="og:title"]')).toBe('Mongoose connections — Monospace');
    expect(metaContent('meta[property="og:image"]')).toBe('https://example.com/cover.png');
  });

  test('updates an existing tag in place rather than duplicating it', () => {
    applyMeta({ title: 'First' });
    applyMeta({ title: 'Second' });

    expect(document.head.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
    expect(metaContent('meta[property="og:title"]')).toBe('Second — Monospace');
  });

  test('removes a stale image when navigating to a page without one', () => {
    applyMeta({ title: 'With image', image: 'https://example.com/cover.png' });
    expect(document.head.querySelector('meta[property="og:image"]')).not.toBeNull();

    // Leaving a post must not keep its cover image as this page's preview.
    applyMeta({ title: 'Without image' });
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
    expect(document.head.querySelector('meta[name="twitter:image"]')).toBeNull();
  });
});

describe('useDocumentMeta', () => {
  test('applies the metadata a page provides', () => {
    render(<Probe title="Design tokens" description="On naming colours." />);

    expect(document.title).toBe('Design tokens — Monospace');
    expect(metaContent('meta[property="og:description"]')).toBe('On naming colours.');
  });

  test('restores the site defaults for a page with no title', () => {
    render(<Probe title="Something" />);
    render(<Probe title={null} />);

    expect(document.title).toBe('Monospace — writing for developers');
  });

  test('renders its children regardless', () => {
    render(<Probe title="X" />);
    expect(screen.getByText('probe')).toBeInTheDocument();
  });
});
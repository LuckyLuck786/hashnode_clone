import { useEffect } from 'react';
import { applyMeta } from '../utils/meta.js';

/**
 * Sets the document title, description and social tags for a page.
 *
 * Pass `null` for title to restore the generic site defaults, which is what the feed
 * and other list pages do.
 */
export default function useDocumentMeta({ title, description, url, image } = {}) {
  useEffect(() => {
    applyMeta({ title, description, url, image });
  }, [title, description, url, image]);
}
import { useEffect } from 'react';

const SITE_NAME = 'Monospace';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - writing for developers`;
  }, [title]);
}

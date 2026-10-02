import { createLowlight } from 'lowlight';
import { visit } from 'unist-util-visit';
import languages from './highlightLanguages.js';

const lowlight = createLowlight(languages);

function readLanguage(node) {
  const classNames = node.properties?.className ?? [];
  const match = classNames.map(String).find((name) => name.startsWith('language-'));
  return match ? match.slice('language-'.length).toLowerCase() : null;
}

function readCode(node) {
  return node.children.map((child) => (child.type === 'text' ? child.value : '')).join('');
}

// Highlights fenced code blocks in place. Written against lowlight directly rather than
// using rehype-highlight, because that package statically imports every language
// highlight.js ships with and roughly triples the production bundle.
export default function rehypeCodeHighlight() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'code' || parent?.tagName !== 'pre') return;

      const language = readLanguage(node);
      const code = readCode(node);
      if (!code.trim()) return;

      let result;
      try {
        result =
          language && lowlight.registered(language)
            ? lowlight.highlight(language, code)
            : lowlight.highlightAuto(code);
      } catch {
        return; // Leave the block as plain text rather than failing the whole render.
      }

      node.properties = {
        ...node.properties,
        className: ['hljs', ...(language ? [`language-${language}`] : [])],
      };
      node.children = result.children;
    });
  };
}

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeCodeHighlight from './rehypeCodeHighlight.js';

// react-markdown escapes raw HTML unless rehype-raw is added, so post content cannot
// inject markup. rehypeCodeHighlight adds hljs classes to fenced code blocks, which
// styles/highlight.css then colours.
export default function MarkdownPreview({ content, placeholder = 'Nothing to preview yet.' }) {
  if (!content?.trim()) {
    return <p className="prose-empty">{placeholder}</p>;
  }

  return (
    <div className="prose">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeCodeHighlight]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer nofollow" />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// react-markdown builds React elements instead of injecting HTML, and its default URL
// transform drops javascript: links, so user written Markdown is safe to render here.
const components = {
  a({ href, children }) {
    const isExternal = /^https?:\/\//.test(href ?? '');
    return (
      <a href={href} {...(isExternal && { target: '_blank', rel: 'noreferrer noopener' })}>
        {children}
      </a>
    );
  },
  img({ src, alt }) {
    return <img src={src} alt={alt ?? ''} loading="lazy" />;
  },
  table({ children }) {
    return (
      <div className="table-scroll">
        <table>{children}</table>
      </div>
    );
  },
};

const rehypePlugins = [[rehypeHighlight, { detect: false }]];

export default function MarkdownView({ source }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}

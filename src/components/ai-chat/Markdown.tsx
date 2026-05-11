import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

type Props = {
  content: string
}

const strictSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: ['href', 'title', 'target', 'rel'],
    code: ['className'],
  },
  tagNames: [
    'a',
    'b',
    'blockquote',
    'br',
    'code',
    'del',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'li',
    'ol',
    'p',
    'pre',
    'strong',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'ul',
  ],
}

export default function Markdown({ content }: Props) {
  return (
    <div className="ai-chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, strictSchema]]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          table: (props) => (
            <div className="ai-chat-markdown-table">
              <table {...props} />
            </div>
          ),
          code: ({ className, ...props }) => (
            <code {...props} className={className} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

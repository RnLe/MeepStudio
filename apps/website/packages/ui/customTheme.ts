import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const customTheme = {
  ...vscDarkPlus,
  // Comments
  'comment': { color: '#6a9955' },
  'prolog': { color: '#6a9955' },
  'doctype': { color: '#6a9955' },
  'cdata': { color: '#6a9955' },
  
  // Keywords - Prism uses 'keyword' not 'token.keyword'
  'keyword': { color: '#c586c0' },
  'control': { color: '#c586c0' },
  'directive': { color: '#c586c0' },
  'unit': { color: '#c586c0' },
  'statement': { color: '#c586c0' },
  'regex': { color: '#569cd6' },
  'atrule': { color: '#c586c0' },
  
  // Strings
  'string': { color: '#ce9178' },
  'attr-value': { color: '#ce9178' },
  'template-string': { color: '#ce9178' },
  'triple-quoted-string': { color: '#ce9178' },
  'string-interpolation': { color: '#ce9178' },
  
  // Numbers
  'number': { color: '#b5cea8' },
  'boolean': { color: '#569cd6' },
  'constant': { color: '#569cd6' },
  
  // Functions
  'function': { color: '#dcdcaa' },
  'function-name': { color: '#dcdcaa' },
  'method': { color: '#dcdcaa' },
  'function-variable': { color: '#dcdcaa' },
  
  // Classes, types, namespaces
  'class-name': { color: '#4ec9b0' },
  'type-class': { color: '#4ec9b0' },
  'namespace': { color: '#4ec9b0' },
  'type': { color: '#4ec9b0' },
  'interface': { color: '#4ec9b0' },
  
  // Variables
  'variable': { color: '#9cdcfe' },
  'property': { color: '#9cdcfe' },
  'property-access': { color: '#9cdcfe' },
  'parameter': { color: '#9cdcfe' },
  
  // Special Python-specific
  'builtin': { color: '#4ec9b0' },
  'exception': { color: '#4ec9b0' },
  'decorator': { color: '#dcdcaa' },
  'important': { color: '#c586c0' },
  
  // Operators and punctuation
  'operator': { color: '#d4d4d4' },
  'punctuation': { color: '#d4d4d4' },
  'attr-name': { color: '#9cdcfe' },
  'char': { color: '#d7ba7d' },
  'tag': { color: '#569cd6' },
  'selector': { color: '#d7ba7d' },
  
  // Special highlighting
  'entity': { color: '#d7ba7d' },
  'url': { color: '#d7ba7d' },
  'symbol': { color: '#d7ba7d' },
  'inserted': { color: '#b5cea8' },
  'deleted': { color: '#ce9178' },
  
  // Add these specific token mappings for better Python support
  'plain': { color: '#d4d4d4' },
  'namespace-import': { color: '#4ec9b0' },
  'script': { color: '#d4d4d4' },
  
  // Make sure base styles are set
  'code[class*="language-"]': {
    color: '#d4d4d4',
    background: 'transparent',
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '1em',
    textAlign: 'left' as const,
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal' as const,
    wordWrap: 'normal' as const,
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none' as const,
  },
  'pre[class*="language-"]': {
    color: '#d4d4d4',
    background: 'transparent',
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '1em',
    textAlign: 'left' as const,
    whiteSpace: 'pre' as const,
    wordSpacing: 'normal',
    wordBreak: 'normal' as const,
    wordWrap: 'normal' as const,
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none' as const,
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto' as const,
  },
  ':not(pre) > code[class*="language-"]': {
    background: 'transparent',
    padding: '.1em',
    borderRadius: '.3em',
    whiteSpace: 'normal' as const,
  },
  
  // Add a catch-all for any unmatched tokens
  'token': { color: '#d4d4d4' },
  '.token': { color: '#d4d4d4' },
};

import type { MDXComponents } from 'mdx/types'
import Image, { ImageProps } from 'next/image'
import React from 'react'
 
// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.
 
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Custom inline code styling
    code: ({ children, ...props }) => (
      <code
        className="dark:text-neutral-200 text-neutral-800"
        style={{
          background: 'rgba(135,131,120,0.15)',
          borderRadius: '4px',
          padding: '0.1em 0.2em',
          margin: '0 0.2em',
          fontSize: '95%',
          fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        {...props}
      >
        {children}
      </code>
    ),
    // Allows customizing built-in components, e.g. to add styling.
    // h1: ({ children }) => (
    //   <h1 style={{ color: 'red', fontSize: '48px' }}>{children}</h1>
    // ),
    ...components,
  }
}
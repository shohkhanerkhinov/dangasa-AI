'use client';

import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

export default function MathText({ text, className = '' }: MathTextProps) {
  if (!text) return null;

  // Split by $$ first (block math)
  const blockParts = text.split(/\$\$(.*?)\$\$/g);

  return (
    <span className={className}>
      {blockParts.map((part, index) => {
        // If index is odd, it was enclosed in $$...$$ (block math)
        if (index % 2 === 1) {
          try {
            const html = katex.renderToString(part, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="block my-2 overflow-x-auto select-text"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (err) {
            console.error('KaTeX block error:', err);
            return <span key={index}>$${part}$$</span>;
          }
        }

        // For even parts (non-block), split by $ (inline math)
        const inlineParts = part.split(/\$(.*?)\$/g);

        return (
          <React.Fragment key={index}>
            {inlineParts.map((inlinePart, inlineIndex) => {
              // If inlineIndex is odd, it was enclosed in $...$ (inline math)
              if (inlineIndex % 2 === 1) {
                try {
                  const html = katex.renderToString(inlinePart, {
                    displayMode: false,
                    throwOnError: false,
                  });
                  return (
                    <span
                      key={inlineIndex}
                      className="inline-block px-1 select-text"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                } catch (err) {
                  console.error('KaTeX inline error:', err);
                  return <span key={inlineIndex}>${inlinePart}$</span>;
                }
              }

              // Otherwise it's normal text
              return <span key={inlineIndex}>{inlinePart}</span>;
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
}

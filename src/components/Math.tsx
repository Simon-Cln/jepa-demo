"use client";

import katex from "katex";

interface MathProps {
  children: string;
  block?: boolean;
}

export function Math({ children, block = false }: MathProps) {
  const html = katex.renderToString(children, {
    throwOnError: false,
    displayMode: block,
  });

  if (block) {
    return (
      <span
        className="block my-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className="inline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

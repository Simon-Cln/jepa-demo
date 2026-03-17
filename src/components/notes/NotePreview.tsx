"use client";

import { useEffect, useRef, useState } from "react";

// ── Mermaid lazy loader ────────────────────────────────────────────────────────
type Mermaid = typeof import("mermaid").default;
let _mermaid: Mermaid | null = null;

async function getMermaid(): Promise<Mermaid> {
  if (_mermaid) return _mermaid;
  const m = (await import("mermaid")).default;
  m.initialize({
    startOnLoad: false,
    theme: "dark",
    themeVariables: {
      primaryColor: "#1925aa",
      primaryTextColor: "#e8e6e0",
      primaryBorderColor: "#4a5fff",
      lineColor: "#6b7280",
      secondaryColor: "#1a1a2e",
      tertiaryColor: "#111",
      background: "#111",
      mainBkg: "#1a1a2e",
      nodeBorder: "#4a5fff",
      clusterBkg: "#0d0d1a",
      titleColor: "#e8e6e0",
      edgeLabelBackground: "#111",
      attributeBackgroundColorOdd: "#111",
      attributeBackgroundColorEven: "#1a1a2e",
    },
  });
  _mermaid = m;
  return m;
}

// ── Segment types ──────────────────────────────────────────────────────────────
interface Segment {
  type: "markdown" | "mermaid";
  content: string;
}

function parseSegments(raw: string): Segment[] {
  const segments: Segment[] = [];
  const re = /```mermaid\n([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(raw)) !== null) {
    if (match.index > last) {
      segments.push({ type: "markdown", content: raw.slice(last, match.index) });
    }
    segments.push({ type: "mermaid", content: match[1].trim() });
    last = match.index + match[0].length;
  }
  if (last < raw.length) {
    segments.push({ type: "markdown", content: raw.slice(last) });
  }
  return segments;
}

// ── Markdown renderer ──────────────────────────────────────────────────────────
function MarkdownSegment({ md }: { md: string }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!md.trim()) { setHtml(""); return; }
    import("marked").then(({ marked }) => {
      const result = marked(md, { async: false });
      setHtml(result as string);
    });
  }, [md]);

  return (
    <div
      className="note-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Mermaid renderer ───────────────────────────────────────────────────────────
let mermaidCounter = 0;

function MermaidSegment({ code }: { code: string }) {
  const ref  = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ref.current || !code.trim()) return;
    const id = `mermaid-${++mermaidCounter}`;
    setErr("");
    getMermaid()
      .then(m => m.render(id, code))
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch(e => setErr(String(e)));
  }, [code]);

  if (err) {
    return (
      <div className="my-4 p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
        {err}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
    />
  );
}

// ── Main preview ───────────────────────────────────────────────────────────────
export function NotePreview({ content }: { content: string }) {
  const segments = parseSegments(content);

  if (!content.trim()) {
    return (
      <div className="flex items-center justify-center h-full text-gray-700 text-[11px] uppercase tracking-widest">
        Aperçu vide
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      {segments.map((seg, i) =>
        seg.type === "mermaid" ? (
          <MermaidSegment key={i} code={seg.content} />
        ) : (
          <MarkdownSegment key={i} md={seg.content} />
        )
      )}
    </div>
  );
}

'use client';
import React, { useEffect, useId, useRef, useState } from 'react';

type Props = {
  graph: string;
  turns?: Array<{ id: string }>;
};

export default function MermaidGraph({ graph, turns }: Props) {
  const [mermaidApi, setMermaidApi] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    let cancelled = false;
    import('mermaid').then((m) => {
      if (cancelled) return;
      m.default.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#EEF2FF',
          secondaryColor: '#E9D7FF',
          primaryBorderColor: '#6366F1',
          lineColor: '#94A3B8',
          fontFamily: 'Inter, ui-sans-serif, system-ui',
          fontSize: '14px',
        },
      });
      setMermaidApi(m.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mermaidApi || !containerRef.current) return;
    const el = containerRef.current;
    mermaidApi
      .render(id, graph)
      .then((res: { svg: string }) => {
        el.innerHTML = res.svg;
      })
      .catch(() => {
        el.innerHTML = '<div class="text-sm text-gray-400">Unable to render graph</div>';
      });
  }, [graph, id, mermaidApi]);

  return <div ref={containerRef} className="w-full overflow-x-auto" />;
}



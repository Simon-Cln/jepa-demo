"use client";

import { motion } from "framer-motion";

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

interface Edge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  color?: string;
}

interface ArchitectureDiagramProps {
  nodes: Node[];
  edges: Edge[];
  title: string;
  subtitle: string;
  accentColor: string;
  animationKey: number;
}

const SIZE_MAP = { sm: 68, md: 88, lg: 104 };

export function ArchitectureDiagram({
  nodes,
  edges,
  title,
  subtitle,
  accentColor,
  animationKey,
}: ArchitectureDiagramProps) {
  const W = 700;
  const H = 380;

  const getNode = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-5 pb-4 border-b border-white/10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
        <p className="text-xs text-white/40 mt-1 uppercase tracking-wide">{subtitle}</p>
      </div>

      {/* SVG — prend tout l'espace restant */}
      <div className="flex-1 relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Un marker par couleur unique pour éviter les conflits */}
            {["#888888", "#aaaaaa", "#ffffff", "#ef4444", "#22c55e", "#8b5cf6"].map((col) => (
              <marker
                key={col}
                id={`arrow-${col.replace("#", "")}`}
                markerWidth="10" markerHeight="10"
                refX="8" refY="3.5" orient="auto"
              >
                <path d="M0,0 L0,7 L10,3.5 z" fill={col} fillOpacity="0.7" />
              </marker>
            ))}
            <marker
              id={`arrow-accent-${animationKey}`}
              markerWidth="10" markerHeight="10"
              refX="8" refY="3.5" orient="auto"
            >
              <path d="M0,0 L0,7 L10,3.5 z" fill={accentColor} fillOpacity="0.7" />
            </marker>

            <filter id="node-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="dot-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Edges ─────────────────────────────────────────────── */}
          {edges.map((edge, i) => {
            const from = getNode(edge.from);
            const to   = getNode(edge.to);
            const fs   = SIZE_MAP[from.size ?? "md"] / 2;
            const ts   = SIZE_MAP[to.size   ?? "md"] / 2;
            const dx   = to.x - from.x;
            const dy   = to.y - from.y;
            const len  = Math.sqrt(dx * dx + dy * dy);
            const x1   = from.x + (dx / len) * (fs + 4);
            const y1   = from.y + (dy / len) * (fs + 4);
            const x2   = to.x   - (dx / len) * (ts + 10);
            const y2   = to.y   - (dy / len) * (ts + 10);
            const color = edge.color ?? accentColor;
            const markerId = `arrow-${color.replace("#", "")}`;

            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color}
                  strokeOpacity={0.45}
                  strokeWidth={1.5}
                  strokeDasharray={edge.dashed ? "6 5" : undefined}
                  markerEnd={`url(#${markerId})`}
                />
                {/* Animated flow dot */}
                <motion.circle
                  key={`dot-${animationKey}-${i}`}
                  r={4}
                  fill={color}
                  filter="url(#dot-glow)"
                  initial={{ opacity: 0, offsetDistance: "0%" } as never}
                  animate={{ opacity: [0, 1, 1, 0], offsetDistance: ["0%", "100%"] } as never}
                  transition={{
                    duration: 1.8,
                    delay: i * 0.28,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                    ease: "linear",
                  }}
                  style={{ offsetPath: `path("M ${x1} ${y1} L ${x2} ${y2}")` } as never}
                />
                {/* Edge label */}
                {edge.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 10}
                    textAnchor="middle"
                    fill={color}
                    fillOpacity={0.65}
                    fontSize={10}
                    fontFamily="system-ui, sans-serif"
                    letterSpacing="0.08em"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Nodes ─────────────────────────────────────────────── */}
          {nodes.map((node, i) => {
            const size = SIZE_MAP[node.size ?? "md"];
            const r    = size / 2;
            return (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "backOut" }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              >
                {/* Outer halo */}
                <circle
                  cx={node.x} cy={node.y} r={r + 10}
                  fill={node.color} fillOpacity={0.04}
                  stroke={node.color} strokeOpacity={0.12} strokeWidth={1}
                />
                {/* Main circle */}
                <circle
                  cx={node.x} cy={node.y} r={r}
                  fill={node.color} fillOpacity={0.12}
                  stroke={node.color} strokeOpacity={0.7} strokeWidth={1.5}
                  filter="url(#node-glow)"
                />
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + (node.sublabel ? -7 : 5)}
                  textAnchor="middle"
                  fill="white"
                  fillOpacity={0.95}
                  fontSize={12}
                  fontWeight={700}
                  fontFamily="system-ui, sans-serif"
                >
                  {node.label}
                </text>
                {/* Sublabel */}
                {node.sublabel && (
                  <text
                    x={node.x}
                    y={node.y + 12}
                    textAnchor="middle"
                    fill={node.color}
                    fillOpacity={0.75}
                    fontSize={9.5}
                    fontFamily="monospace"
                    letterSpacing="0.04em"
                  >
                    {node.sublabel}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

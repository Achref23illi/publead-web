"use client";

/**
 * charts.tsx — SVG chart helpers shared across pro screens.
 * 1:1 ports of dashboard.jsx's <Sparkline>, <StackedArea>, <HorizontalBars>, <MiniBars>.
 */

import type { CityCount } from "@/lib/data";

export interface SparklineProps {
  data: number[];
  color?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = "#ffffff",
  fill = true,
  width = 620,
  height = 60,
}: SparklineProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const dx = width / (data.length - 1);
  const points = data.map(
    (v, i): [number, number] => [i * dx, height - ((v - min) / (max - min || 1)) * (height - 8) - 4],
  );
  const line = points.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ");
  const area = line + ` L${width},${height} L0,${height} Z`;
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        opacity: 0.5,
      }}
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      {fill && <path d={area} fill={color} opacity="0.18" />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function StackedArea({
  width = 720,
  height = 260,
}: {
  width?: number;
  height?: number;
}) {
  const n = 30;
  const flocage = Array.from(
    { length: n },
    (_, i) => 180 + Math.sin(i / 3) * 40 + i * 3 + (i % 5 === 0 ? 30 : 0),
  );
  const borne = Array.from({ length: n }, (_, i) => 90 + Math.cos(i / 2.5) * 25 + i * 1.6);
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const maxY = Math.max(...flocage.map((v, i) => v + borne[i])) * 1.1;
  const dx = w / (n - 1);
  const y = (v: number) => pad.t + h - (v / maxY) * h;
  const pathFloc = flocage
    .map((v, i) => (i === 0 ? "M" : "L") + (pad.l + i * dx) + "," + y(v))
    .join(" ");
  const pathTotal = flocage
    .map((v, i) => (i === 0 ? "M" : "L") + (pad.l + i * dx) + "," + y(v + borne[i]))
    .join(" ");
  const areaFloc = pathFloc + ` L${pad.l + w},${pad.t + h} L${pad.l},${pad.t + h} Z`;
  const bornePath = flocage.map((v, i) => ({
    x: pad.l + i * dx,
    y1: y(v),
    y2: y(v + borne[i]),
  }));
  const borneArea =
    "M" +
    bornePath.map((p) => `${p.x},${p.y1}`).join(" L") +
    " L" +
    bornePath
      .slice()
      .reverse()
      .map((p) => `${p.x},${p.y2}`)
      .join(" L") +
    " Z";
  const gridTicks = 4;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: "100%" }}
    >
      {Array.from({ length: gridTicks + 1 }).map((_, i) => {
        const yy = pad.t + (h / gridTicks) * i;
        const val = Math.round(maxY - (maxY / gridTicks) * i);
        return (
          <g key={i}>
            <line
              x1={pad.l}
              x2={pad.l + w}
              y1={yy}
              y2={yy}
              stroke="#E5E5E5"
              strokeWidth="1"
              opacity="0.7"
            />
            <text x={pad.l - 8} y={yy + 3} fill="#737373" fontSize="10" textAnchor="end">
              {val}€
            </text>
          </g>
        );
      })}
      <path d={borneArea} fill="#3B82F6" opacity="0.2" />
      <path d={pathTotal} fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      <path d={areaFloc} fill="#233466" opacity="0.2" />
      <path d={pathFloc} fill="none" stroke="#233466" strokeWidth="1.8" />
      {[0, 7, 14, 21, 29].map((i) => (
        <text
          key={i}
          x={pad.l + i * dx}
          y={height - 8}
          fill="#737373"
          fontSize="10"
          textAnchor="middle"
        >
          {i + 1} avr.
        </text>
      ))}
    </svg>
  );
}

export function HorizontalBars({ data, width = 520 }: { data: CityCount[]; width?: number }) {
  const max = Math.max(...data.map((d) => d.count));
  const rowH = 30;
  const pad = { l: 90, r: 40, t: 8, b: 8 };
  const h = data.length * rowH + pad.t + pad.b;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`}>
      {data.map((d, i) => {
        const y = pad.t + i * rowH + 6;
        const w = (d.count / max) * (width - pad.l - pad.r);
        return (
          <g key={d.city}>
            <text
              x={pad.l - 10}
              y={y + 13}
              fill="#0A0E1F"
              fontSize="12"
              textAnchor="end"
              fontWeight="500"
            >
              {d.city}
            </text>
            <rect x={pad.l} y={y + 2} width={w} height="16" rx="8" fill="#233466" />
            <text x={pad.l + w + 8} y={y + 14} fill="#0A0E1F" fontSize="12" fontWeight="700">
              {d.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function MiniBars({ data, height = 60 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: "var(--navy)",
            height: `${(v / max) * 100}%`,
            borderRadius: "3px 3px 0 0",
            opacity: 0.4 + 0.6 * (v / max),
          }}
        />
      ))}
    </div>
  );
}

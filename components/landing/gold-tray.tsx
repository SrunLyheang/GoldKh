"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { TrayPieceId } from "@/lib/landing/quote";
import type { LandingCopy } from "./copy";
import styles from "./landing.module.css";

// The hero: real gold on a shop's red velvet tray, drawn in SVG. Pieces
// settle into the velvet on load, shop light sweeps across them once the
// price has landed, and tapping a piece lifts it and shows what that much
// gold is worth at today's spot price.

interface LeafItem {
  kind: "leaf";
  key: string;
  piece: TrayPieceId;
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number;
  stampKm: string;
  stampEn: string;
}
interface RingItem {
  kind: "ring";
  key: string;
  piece: TrayPieceId;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
}
interface ChainItem {
  kind: "chain";
  key: string;
  piece: TrayPieceId;
  cx: number;
  cy: number;
  r: number;
  rot: number;
}
type Item = LeafItem | RingItem | ChainItem;

interface Layout {
  w: number;
  h: number;
  items: Item[];
}

const LEAF_1D = { stampKm: "១ ដំឡឹង", stampEn: "1 DAMLUNG" };
const LEAF_5C = { stampKm: "៥ ជី", stampEn: "5 CHI" };
const LEAF_1C = { stampKm: "១ ជី", stampEn: "1 CHI" };

const LAYOUTS: Record<"desktop" | "mobile", Layout> = {
  desktop: {
    w: 1200,
    h: 440,
    items: [
      { kind: "leaf", key: "leaf1d", piece: "leaf1d", cx: 300, cy: 262, w: 330, h: 212, rot: -7, ...LEAF_1D },
      { kind: "leaf", key: "leaf5c", piece: "leaf5c", cx: 612, cy: 222, w: 232, h: 150, rot: 5, ...LEAF_5C },
      { kind: "ring", key: "ring", piece: "ring", cx: 520, cy: 366, rx: 40, ry: 23, rot: -6 },
      { kind: "leaf", key: "leaf1c-a", piece: "leaf1c", cx: 790, cy: 310, w: 120, h: 80, rot: -12, ...LEAF_1C },
      { kind: "leaf", key: "leaf1c-b", piece: "leaf1c", cx: 884, cy: 246, w: 120, h: 80, rot: 9, ...LEAF_1C },
      { kind: "chain", key: "chain", piece: "chain", cx: 1048, cy: 270, r: 74, rot: 0 },
    ],
  },
  mobile: {
    w: 390,
    h: 300,
    items: [
      { kind: "leaf", key: "leaf1d", piece: "leaf1d", cx: 148, cy: 168, w: 226, h: 146, rot: -8, ...LEAF_1D },
      { kind: "leaf", key: "leaf1c", piece: "leaf1c", cx: 318, cy: 128, w: 102, h: 68, rot: 11, ...LEAF_1C },
      { kind: "ring", key: "ring", piece: "ring", cx: 312, cy: 232, rx: 32, ry: 19, rot: -6 },
    ],
  },
};

// Bounding box (before rotation) used for the hit area and the tag.
function box(item: Item): { w: number; h: number } {
  if (item.kind === "leaf") return { w: item.w, h: item.h };
  if (item.kind === "ring") return { w: item.rx * 2 + 16, h: item.ry * 2 + 16 };
  return { w: item.r * 2 + 16, h: item.r * 1.2 + 16 };
}

// A coiled chain: oval links laid along a flattened spiral. Deterministic,
// so server and client render the same markup.
function chainLinks(r: number) {
  const links: Array<{ x: number; y: number; a: number }> = [];
  const n = 70;
  const turns = 2.6;
  const r0 = r * 0.24;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = t * turns * 2 * Math.PI;
    const rr = r0 + (r - r0) * t;
    links.push({
      x: Math.round(rr * Math.cos(a) * 10) / 10,
      y: Math.round(rr * Math.sin(a) * 0.55 * 10) / 10,
      a: Math.round((a * 180) / Math.PI + 90),
    });
  }
  return links;
}

function GoldDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: "var(--gk-gold-1)" }} />
        <stop offset="0.28" style={{ stopColor: "var(--gk-gold-2)" }} />
        <stop offset="0.46" style={{ stopColor: "var(--gk-gold-3)" }} />
        <stop offset="0.7" style={{ stopColor: "var(--gk-gold-4)" }} />
        <stop offset="1" style={{ stopColor: "var(--gk-gold-5)" }} />
      </linearGradient>
      {/* Brushed metal: fine horizontal grain, masked to the gold. */}
      <filter id={`${id}-brush`} x="0" y="0" width="1" height="1">
        <feTurbulence type="fractalNoise" baseFrequency="0.002 0.9" numOctaves="2" seed="4" />
        <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .02  0 0 0 .22 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      {/* Struck lettering: a light lip under each glyph. */}
      <filter id={`${id}-stamp`}>
        <feOffset dy="1.2" in="SourceAlpha" result="o" />
        <feFlood style={{ floodColor: "var(--gk-gold-edge)" }} />
        <feComposite in2="o" operator="in" result="lip" />
        <feMerge>
          <feMergeNode in="lip" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* A generous filter region: WebKit clips a blur to it hard. */}
      <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      {/* Velvet nap. */}
      <filter id={`${id}-nap`}>
        <feTurbulence baseFrequency="0.85" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .08  0 0 0 0 .12  0 0 0 .5 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: "var(--gk-velvet-dark)" }} stopOpacity="0.55" />
        <stop offset="1" style={{ stopColor: "var(--gk-velvet-dark)" }} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: "var(--gk-rim-hi)" }} />
        <stop offset="1" style={{ stopColor: "var(--gk-rim-lo)" }} />
      </linearGradient>
    </defs>
  );
}

function Leaf({ item, id }: { item: LeafItem; id: string }) {
  const { w, h } = item;
  return (
    <>
      <rect
        className={styles.pieceShadow}
        x={-w / 2 + 4}
        y={-h / 2 + 8}
        width={w}
        height={h}
        rx="3"
        style={{ fill: "var(--gk-velvet-dark)" }}
        opacity="0.6"
        filter={`url(#${id}-soft)`}
      />
      <g className={styles.pieceLift}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="3" fill={`url(#${id}-gold)`} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="3" fill="#000" filter={`url(#${id}-brush)`} />
        <rect
          x={-w / 2 + w * 0.04}
          y={-h / 2 + h * 0.06}
          width={w * 0.92}
          height={h * 0.88}
          rx="2"
          fill="none"
          style={{ stroke: "var(--gk-gold-5)" }}
          strokeOpacity="0.5"
        />
        <g
          filter={`url(#${id}-stamp)`}
          style={{ fill: "var(--gk-gold-ink)" }}
          textAnchor="middle"
        >
          <text y={-h * 0.12} fontSize={h * 0.11} style={{ fontFamily: "var(--font-moul)" }}>
            ហាងមាស
          </text>
          <text
            y={h * 0.12}
            fontSize={h * 0.2}
            letterSpacing="2"
            style={{ fontFamily: "var(--font-koulen)" }}
          >
            9999
          </text>
          <text
            y={h * 0.32}
            fontSize={h * 0.08}
            fontWeight="600"
            letterSpacing="2"
            style={{ fontFamily: "var(--font-kantumruy)" }}
          >
            {item.stampKm} · {item.stampEn}
          </text>
        </g>
      </g>
    </>
  );
}

function Ring({ item, id }: { item: RingItem; id: string }) {
  return (
    <>
      <ellipse
        className={styles.pieceShadow}
        cx="3"
        cy="7"
        rx={item.rx + 4}
        ry={item.ry + 3}
        fill="none"
        strokeWidth="12"
        style={{ stroke: "var(--gk-velvet-dark)" }}
        opacity="0.6"
        filter={`url(#${id}-soft)`}
      />
      <g className={styles.pieceLift}>
        <ellipse rx={item.rx} ry={item.ry} fill="none" stroke={`url(#${id}-gold)`} strokeWidth="11" />
        <ellipse
          cy="-2"
          rx={item.rx}
          ry={item.ry}
          fill="none"
          strokeWidth="1.2"
          strokeOpacity="0.6"
          style={{ stroke: "var(--gk-gold-edge)" }}
        />
      </g>
    </>
  );
}

function Chain({ item, id }: { item: ChainItem; id: string }) {
  const links = chainLinks(item.r);
  return (
    <>
      <ellipse
        className={styles.pieceShadow}
        cx="4"
        cy="8"
        rx={item.r}
        ry={item.r * 0.56}
        style={{ fill: "var(--gk-velvet-dark)" }}
        opacity="0.45"
        filter={`url(#${id}-soft)`}
      />
      <g className={styles.pieceLift}>
        {links.map((l, i) => (
          <ellipse
            key={i}
            cx={l.x}
            cy={l.y}
            rx="6.5"
            ry="3.6"
            transform={`rotate(${l.a} ${l.x} ${l.y})`}
            fill="none"
            stroke={`url(#${id}-gold)`}
            strokeWidth="2.6"
          />
        ))}
      </g>
    </>
  );
}

export function GoldTray({
  variant,
  values,
  copy,
}: {
  variant: "desktop" | "mobile";
  values: Record<TrayPieceId, string> | null;
  copy: LandingCopy;
}) {
  const layout = LAYOUTS[variant];
  const rawId = useId();
  const id = `gk${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}${variant}`;
  const [lifted, setLifted] = useState<string | null>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  // Escape sets the lifted piece back down.
  useEffect(() => {
    if (!lifted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLifted(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lifted]);

  // Desktop only: a soft pool of shop light follows the pointer. Written
  // straight to the element's style, never React state, so a pointer
  // move costs one compositor update.
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--px", `${e.clientX - rect.left}px`);
    el.style.setProperty("--py", `${e.clientY - rect.top}px`);
    el.dataset.pointer = "true";
  }

  const liftedItem = layout.items.find((i) => i.key === lifted) ?? null;
  const pct = (n: number, of: number) => `${(n / of) * 100}%`;

  return (
    <div
      ref={trayRef}
      className={styles.tray}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        if (trayRef.current) trayRef.current.dataset.pointer = "false";
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || (e.target as Element).tagName === "svg") {
          setLifted(null);
        }
      }}
    >
      <svg
        viewBox={`0 0 ${layout.w} ${layout.h}`}
        role="img"
        aria-label={copy.trayLabel}
      >
        <GoldDefs id={id} />
        {/* The tray runs off the bottom edge: it sits on the counter. */}
        <rect x="16" y="24" width={layout.w - 32} height={layout.h} rx="18" fill={`url(#${id}-rim)`} />
        <rect
          x="38"
          y="46"
          width={layout.w - 76}
          height={layout.h}
          rx="10"
          style={{ fill: "var(--gk-velvet)" }}
        />
        <rect x="38" y="46" width={layout.w - 76} height={layout.h} rx="10" fill="#000" filter={`url(#${id}-nap)`} />
        {/* Shade under the back rim: a plain gradient, no blur filter. */}
        <rect x="38" y="46" width={layout.w - 76} height="34" fill={`url(#${id}-shade)`} />
        {layout.items.map((item, i) => (
          <g key={item.key} transform={`translate(${item.cx} ${item.cy}) rotate(${item.rot})`}>
            <g
              className={styles.piece}
              data-lifted={lifted === item.key}
              style={{ "--i": i } as CSSProperties}
            >
              {item.kind === "leaf" && <Leaf item={item} id={id} />}
              {item.kind === "ring" && <Ring item={item} id={id} />}
              {item.kind === "chain" && <Chain item={item} id={id} />}
            </g>
          </g>
        ))}
      </svg>

      <div
        className={styles.light}
        aria-hidden="true"
        style={{
          top: pct(24, layout.h),
          bottom: 0,
          left: pct(16, layout.w),
          right: pct(16, layout.w),
        }}
      >
        <div className={styles.sweep} />
        <div className={styles.scrollSweep} />
        {variant === "desktop" && <div className={styles.pointerLight} />}
      </div>

      {layout.items.map((item) => {
        const b = box(item);
        const name = copy.pieces[item.piece];
        const value = values?.[item.piece];
        return (
          <button
            key={item.key}
            type="button"
            className={styles.pieceButton}
            aria-pressed={lifted === item.key}
            aria-label={value ? `${name}, ${copy.pieceWorth(value)}` : name}
            onClick={() => setLifted((k) => (k === item.key ? null : item.key))}
            style={{
              left: pct(item.cx, layout.w),
              top: pct(item.cy, layout.h),
              width: pct(b.w, layout.w),
              height: pct(b.h, layout.h),
              transform: `translate(-50%, -50%) rotate(${item.rot}deg)`,
            }}
          />
        );
      })}

      {liftedItem && (
        <div
          key={liftedItem.key}
          className={styles.tag}
          style={{
            left: pct(liftedItem.cx, layout.w),
            top: pct(liftedItem.cy - box(liftedItem).h / 2 - 10, layout.h),
          }}
        >
          <span className={styles.tagName}>{copy.pieces[liftedItem.piece]}</span>
          {values && (
            <span className={`${styles.tagValue} ${styles.num}`}>
              {copy.pieceWorth(values[liftedItem.piece])}
            </span>
          )}
        </div>
      )}
      <p className={styles.srOnly} aria-live="polite">
        {liftedItem && values
          ? `${copy.pieces[liftedItem.piece]}: ${copy.pieceWorth(values[liftedItem.piece])}`
          : ""}
      </p>
    </div>
  );
}

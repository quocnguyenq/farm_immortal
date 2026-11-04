export const FIELD_COLS = 6;
export const FIELD_ROWS = 4;
export const FIELD_W = 1100;
export const FIELD_H = 660;

const OX = 500;
const OY = 56;
const HW = 96;
const HH = 54;
const DEPTH = 30;
const S = 512;

/** Tâm ô theo toạ độ của khung ruộng. */
export function cellCenter(index: number) {
  const col = index % FIELD_COLS;
  const row = Math.floor(index / FIELD_COLS);
  return { x: OX + (col - row) * HW, y: OY + (col + row + 1) * HH, row, col };
}

function corner(col: number, row: number) {
  return [OX + (col - row) * HW, OY + (col + row) * HH] as const;
}

function cellPoints(col: number, row: number, inset = 0) {
  const [tx, ty] = corner(col, row);
  const cx = tx;
  const cy = ty + HH;
  const pts = [
    [tx, ty],
    [tx + HW, ty + HH],
    [tx, ty + 2 * HH],
    [tx - HW, ty + HH],
  ].map(([x, y]) => {
    if (!inset) return [x, y];
    const k = 1 - inset / HW;
    return [cx + (x - cx) * k, cy + (y - cy) * k];
  });
  return pts.map((p) => p.join(",")).join(" ");
}

export type FieldCell = { unlocked: boolean; wet: boolean };

export function FarmField({ cells, hover }: { cells: FieldCell[]; hover: number | null }) {
  const [lx, ly] = corner(0, FIELD_ROWS);
  const [bx, by] = corner(FIELD_COLS, FIELD_ROWS);
  const [rx, ry] = corner(FIELD_COLS, 0);
  const [tx, ty] = corner(0, 0);
  const outline = `${tx},${ty} ${rx},${ry} ${bx},${by} ${lx},${ly}`;
  const leftWall = `${lx},${ly} ${bx},${by} ${bx},${by + DEPTH} ${lx},${ly + DEPTH}`;
  const rightWall = `${bx},${by} ${rx},${ry} ${rx},${ry + DEPTH} ${bx},${by + DEPTH}`;
  const topTex = `matrix(${HW / S} ${HH / S} ${-HW / S} ${HH / S} ${OX} ${OY})`;
  const sideV = 96 / S;

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={FIELD_W}
      height={FIELD_H}
      viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
      aria-hidden
    >
      <defs>
        {(["soil-dry", "soil-wet", "grass"] as const).map((t) => (
          <pattern key={t} id={`tex-${t}`} patternUnits="userSpaceOnUse" width={S} height={S} patternTransform={topTex}>
            <image href={`/farm/tex/${t}.jpg`} width={S} height={S} preserveAspectRatio="none" />
          </pattern>
        ))}
        <pattern
          id="tex-side-l"
          patternUnits="userSpaceOnUse"
          width={S}
          height={S}
          patternTransform={`matrix(${(2 * HW) / S} ${(2 * HH) / S} 0 ${sideV} ${lx} ${ly - 12})`}
        >
          <image href="/farm/tex/soil-side.jpg" width={S} height={S} preserveAspectRatio="none" />
        </pattern>
        <pattern
          id="tex-side-r"
          patternUnits="userSpaceOnUse"
          width={S}
          height={S}
          patternTransform={`matrix(${(2 * HW) / S} ${(-2 * HH) / S} 0 ${sideV} ${bx} ${by - 12})`}
        >
          <image href="/farm/tex/soil-side.jpg" width={S} height={S} preserveAspectRatio="none" />
        </pattern>
        <linearGradient id="cell-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#1a0d02" stopOpacity="0.28" />
        </linearGradient>
        <filter id="field-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <polygon
        points={`${tx},${ty + DEPTH + 14} ${rx + 10},${ry + DEPTH + 14} ${bx},${by + DEPTH + 22} ${lx - 10},${ly + DEPTH + 14}`}
        fill="#0d1a05"
        opacity="0.45"
        filter="url(#field-shadow)"
      />

      <polygon points={leftWall} fill="url(#tex-side-l)" />
      <polygon points={leftWall} fill="#1b0e04" opacity="0.18" />
      <polygon points={rightWall} fill="url(#tex-side-r)" />
      <polygon points={rightWall} fill="#1b0e04" opacity="0.42" />

      {cells.map((cell, i) => {
        const col = i % FIELD_COLS;
        const row = Math.floor(i / FIELD_COLS);
        const tex = !cell.unlocked ? "grass" : cell.wet ? "soil-wet" : "soil-dry";
        return (
          <g key={i}>
            <polygon points={cellPoints(col, row)} fill={`url(#tex-${tex})`} />
            <polygon points={cellPoints(col, row)} fill="url(#cell-light)" />
            {cell.unlocked && (
              <polygon
                points={cellPoints(col, row, 5)}
                fill="none"
                stroke="#f6dcb0"
                strokeOpacity="0.16"
                strokeWidth="2"
              />
            )}
            <polygon
              points={cellPoints(col, row)}
              fill="none"
              stroke={cell.unlocked ? "#2e1a0a" : "#24400f"}
              strokeOpacity="0.7"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
        );
      })}

      <polygon points={outline} fill="none" stroke="#3a220e" strokeWidth="5" strokeLinejoin="round" />

      {hover != null && hover < cells.length && (
        <polygon
          points={cellPoints(hover % FIELD_COLS, Math.floor(hover / FIELD_COLS), 2)}
          fill="#fff8d0"
          fillOpacity="0.18"
          stroke="#ffe066"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

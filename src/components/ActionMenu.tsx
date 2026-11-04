"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type MenuAnchor = { x: number; y: number };

/** Popup thao tác hiện ngay cạnh vị trí bấm, tự né mép màn hình. */
export function ActionMenu({
  anchor,
  title,
  subtitle,
  onClose,
  children,
}: {
  anchor: MenuAnchor;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: anchor.x + 14, top: anchor.y - 20 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 10;
    let left = anchor.x + 14;
    let top = anchor.y - 20;
    if (left + r.width > window.innerWidth - pad) left = anchor.x - r.width - 14;
    if (top + r.height > window.innerHeight - pad) top = window.innerHeight - r.height - pad;
    setPos({ left: Math.max(pad, left), top: Math.max(pad, top) });
  }, [anchor.x, anchor.y, children]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div data-ui className="fixed inset-0 z-40" onPointerDown={onClose}>
      <div
        ref={ref}
        className="action-menu absolute"
        style={pos}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-1.5 px-1">
          <div className="text-sm font-black text-amber-950">{title}</div>
          {subtitle && <div className="text-[11px] font-bold text-lime-800">{subtitle}</div>}
        </div>
        <div className="grid gap-1">{children}</div>
      </div>
    </div>
  );
}

export function MenuButton({
  icon,
  label,
  hint,
  disabled,
  tone = "default",
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  disabled?: boolean;
  tone?: "default" | "primary" | "water" | "gold";
  onClick: () => void;
}) {
  return (
    <button className={`menu-btn tone-${tone}`} disabled={disabled} onClick={onClick}>
      {icon && <span className="menu-icon">{icon}</span>}
      <span className="flex-1 text-left">
        <span className="block leading-tight">{label}</span>
        {hint && <span className="block text-[10px] leading-tight font-semibold opacity-80">{hint}</span>}
      </span>
    </button>
  );
}

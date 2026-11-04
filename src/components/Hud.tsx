"use client";

import type { FarmUser } from "@/lib/types";

export function Hud({
  user,
  onLogout,
}: {
  user: FarmUser;
  onLogout: () => void;
}) {
  const pct = Math.min(100, Math.round((user.xp / user.xpToNext) * 100));
  return (
    <div data-ui className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border-2 border-amber-600 bg-gradient-to-b from-amber-50 to-amber-200 py-1 pr-3 pl-1 shadow">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-lime-500 text-lg font-black text-white">
            {user.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-extrabold text-amber-950">{user.displayName}</div>
            <div className="h-2 w-24 overflow-hidden rounded bg-amber-100">
              <div className="h-full bg-lime-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <div className="hud-pill">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-yellow-400 text-xs">💰</span>
          Vàng {user.gold.toLocaleString("vi-VN")}
        </div>
        <div className="hud-pill">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-300 text-xs">💎</span>
          0
        </div>
        <div className="hud-pill">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-lime-400 text-xs">⚡</span>
          {user.energy}/{user.energyMax}
        </div>
        <div className="hud-pill">Cấp {user.level}</div>
      </div>
      <div className="pointer-events-auto flex gap-2">
        {user.isAdmin && (
          <a href="/admin" className="wood-sign rounded-xl px-3 py-2 text-sm no-underline">
            Admin
          </a>
        )}
        <button className="wood-sign rounded-xl px-3 py-2 text-sm" onClick={onLogout}>
          Thoát
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type Tab = "crops" | "fish" | "pond" | "fert" | "quality" | "plots" | "config" | "players";

const SWIM_STYLES = ["wander", "dart", "glide", "cruise", "lurk", "zigzag", "bottom", "hover", "graceful", "royal"];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("crops");
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.isAdmin) window.location.href = "/play";
        else setReady(true);
      });
  }, []);

  if (!ready) return <div className="p-8">Đang kiểm tra quyền...</div>;

  return (
    <div className="min-h-screen overflow-auto bg-[#f6efd9] p-6 text-amber-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black">Admin · Nông Trại Tiên Duyên</h1>
          <div className="flex gap-2">
            <a className="wood-sign rounded-lg px-3 py-2 no-underline" href="/play">
              Vào game
            </a>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["crops", "Hạt giống"],
              ["fish", "Cá"],
              ["pond", "Ao cá"],
              ["fert", "Phân bón"],
              ["quality", "Tỷ lệ sao"],
              ["plots", "Mở ô đất"],
              ["config", "Cấu hình"],
              ["players", "Người chơi"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              className={`rounded-lg px-3 py-2 font-bold ${tab === id ? "wood-sign" : "bg-white/70"}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {msg && <p className="mb-3 font-bold text-lime-800">{msg}</p>}
        {tab === "crops" && <CropsTab ping={setMsg} />}
        {tab === "fish" && <FishTab ping={setMsg} />}
        {tab === "pond" && <PondTab ping={setMsg} />}
        {tab === "fert" && <FertTab ping={setMsg} />}
        {tab === "quality" && <QualityTab ping={setMsg} />}
        {tab === "plots" && <PlotsTab ping={setMsg} />}
        {tab === "config" && <ConfigTab ping={setMsg} />}
        {tab === "players" && <PlayersTab />}
      </div>
    </div>
  );
}

function CropsTab({ ping }: { ping: (s: string) => void }) {
  const [crops, setCrops] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    fetch("/api/admin/crops")
      .then((r) => r.json())
      .then((d) => setCrops(d.crops || []));
  }, []);

  async function save(crop: Record<string, unknown>) {
    const res = await fetch("/api/admin/crops", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(crop),
    });
    ping(res.ok ? `Đã lưu ${crop.name}` : "Lỗi lưu cây");
  }

  const fields = [
    "name",
    "unlockLevel",
    "seedPrice",
    "xpReward",
    "harvestMin",
    "harvestMax",
    "durationSeedMs",
    "durationSproutMs",
    "durationGrowMs",
    "sellStar0",
    "sellStar1",
    "sellStar2",
    "sellStar3",
    "sellStar4",
    "sellStar5",
    "sellPremium",
    "color",
  ];

  return (
    <div className="grid gap-3">
      {crops.map((c) => (
        <div key={String(c.id)} className="rounded-xl border-2 border-amber-700 bg-white/80 p-3">
          <div className="mb-2 font-black">
            {String(c.name)} ({String(c.slug)})
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {fields.map((f) => (
              <label key={f} className="text-xs font-bold">
                {f}
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={String(c[f] ?? "")}
                  onChange={(e) =>
                    setCrops((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, [f]: e.target.value } : x)),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(c.enabled)}
              onChange={(e) =>
                setCrops((prev) => prev.map((x) => (x.id === c.id ? { ...x, enabled: e.target.checked } : x)))
              }
            />
            Bật
          </label>
          <button className="wood-sign mt-2 rounded-lg px-3 py-1" onClick={() => save(c)}>
            Lưu
          </button>
        </div>
      ))}
    </div>
  );
}

function FishTab({ ping }: { ping: (s: string) => void }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    fetch("/api/admin/fish")
      .then((r) => r.json())
      .then((d) => setRows(d.fish || []));
  }, []);

  const fields: [string, string][] = [
    ["name", "Tên"],
    ["unlockLevel", "Cấp mở"],
    ["price", "Giá cá giống"],
    ["xpReward", "XP khi thu"],
    ["durationFryMs", "Cá giống → nhỏ (ms)"],
    ["durationSmallMs", "Cá nhỏ → trưởng thành (ms)"],
    ["agingMaxMs", "Linh khí tối đa sau trưởng thành (ms)"],
    ["sizeScale", "Kích thước"],
    ["sellStar0", "Bán 0★"],
    ["sellStar1", "Bán 1★"],
    ["sellStar2", "Bán 2★"],
    ["sellStar3", "Bán 3★"],
    ["sellStar4", "Bán 4★"],
    ["sellStar5", "Bán 5★"],
    ["sellPremium", "Bán Thượng cấp"],
    ["sortOrder", "Thứ tự"],
  ];
  const update = (id: unknown, patch: Record<string, unknown>) =>
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="grid gap-3">
      <p className="text-sm">
        Tỷ lệ sao của cá dùng bảng &quot;Tỷ lệ sao&quot;, được đẩy lên theo linh khí hấp thụ. Độ mạnh chỉnh ở Cấu hình →{" "}
        <code>fishAgingStrength</code> (mặc định 0.6).
      </p>
      {rows.map((f) => (
        <div key={String(f.id)} className="rounded-xl border-2 border-sky-700 bg-white/80 p-3">
          <div className="mb-2 flex items-center gap-3 font-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/farm/fish/${String(f.iconKey)}.png`} alt="" className="h-8" />
            {String(f.name)} ({String(f.slug)})
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {fields.map(([k, label]) => (
              <label key={k} className="text-xs font-bold">
                {label}
                <input
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={String(f[k] ?? "")}
                  onChange={(e) => update(f.id, { [k]: e.target.value })}
                />
              </label>
            ))}
            <label className="text-xs font-bold">
              Kiểu bơi
              <select
                className="mt-1 w-full rounded border px-2 py-1"
                value={String(f.swimStyle)}
                onChange={(e) => update(f.id, { swimStyle: e.target.value })}
              >
                {SWIM_STYLES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-2 block text-xs font-bold">
            Mô tả
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={String(f.description ?? "")}
              onChange={(e) => update(f.id, { description: e.target.value })}
            />
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(f.enabled)} onChange={(e) => update(f.id, { enabled: e.target.checked })} />
            Bật
          </label>
          <button
            className="wood-sign mt-2 rounded-lg px-3 py-1"
            onClick={async () => {
              const res = await fetch("/api/admin/fish", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(f),
              });
              const d = await res.json();
              ping(res.ok ? `Đã lưu ${f.name}` : d.error || "Lỗi lưu cá");
            }}
          >
            Lưu
          </button>
        </div>
      ))}
    </div>
  );
}

function PondTab({ ping }: { ping: (s: string) => void }) {
  const [levels, setLevels] = useState<{ level: number; capacity: number; requiredLevel: number; goldCost: number }[]>([]);
  useEffect(() => {
    fetch("/api/admin/pond-levels")
      .then((r) => r.json())
      .then((d) => setLevels(d.levels || []));
  }, []);
  const set = (i: number, k: string, v: string) =>
    setLevels((p) => p.map((x, idx) => (idx === i ? { ...x, [k]: Number(v) } : x)));
  return (
    <div className="rounded-xl border-2 border-sky-700 bg-white/80 p-4">
      <p className="mb-3 text-sm">Mỗi cấp ao: sức chứa, cấp nhân vật cần đạt và vàng để nâng lên cấp đó.</p>
      <div className="mb-1 grid grid-cols-4 gap-2 text-xs font-black">
        <div>Cấp ao</div>
        <div>Sức chứa</div>
        <div>Cấp nhân vật</div>
        <div>Vàng</div>
      </div>
      <div className="grid gap-2">
        {levels.map((l, i) => (
          <div key={l.level} className="grid grid-cols-4 gap-2 text-sm">
            <div className="font-bold">Cấp {l.level}</div>
            {(["capacity", "requiredLevel", "goldCost"] as const).map((k) => (
              <input key={k} className="rounded border px-2 py-1" value={l[k]} onChange={(e) => set(i, k, e.target.value)} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          className="rounded-lg bg-white/70 px-3 py-1"
          onClick={() => {
            const last = levels[levels.length - 1];
            setLevels((p) => [
              ...p,
              {
                level: (last?.level ?? 0) + 1,
                capacity: (last?.capacity ?? 4) + 2,
                requiredLevel: (last?.requiredLevel ?? 1) + 10,
                goldCost: (last?.goldCost ?? 0) + 5000,
              },
            ]);
          }}
        >
          + Thêm cấp
        </button>
        <button
          className="wood-sign rounded-lg px-3 py-1"
          onClick={async () => {
            const res = await fetch("/api/admin/pond-levels", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ levels }),
            });
            const d = await res.json();
            ping(res.ok ? "Đã lưu cấp ao" : d.error || "Lỗi");
          }}
        >
          Lưu
        </button>
      </div>
    </div>
  );
}

function FertTab({ ping }: { ping: (s: string) => void }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    fetch("/api/admin/fertilizers")
      .then((r) => r.json())
      .then((d) => setRows(d.fertilizers || []));
  }, []);
  return (
    <div className="grid gap-3">
      {rows.map((f) => (
        <div key={String(f.id)} className="rounded-xl border-2 border-amber-700 bg-white/80 p-3">
          <div className="font-black">{String(f.grade)}</div>
          {["name", "timeReducePercent", "price", "description"].map((k) => (
            <label key={k} className="mt-1 block text-xs font-bold">
              {k}
              <input
                className="mt-1 w-full rounded border px-2 py-1"
                value={String(f[k] ?? "")}
                onChange={(e) =>
                  setRows((prev) => prev.map((x) => (x.id === f.id ? { ...x, [k]: e.target.value } : x)))
                }
              />
            </label>
          ))}
          <button
            className="wood-sign mt-2 rounded-lg px-3 py-1"
            onClick={async () => {
              const res = await fetch("/api/admin/fertilizers", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(f),
              });
              ping(res.ok ? "Đã lưu phân" : "Lỗi");
            }}
          >
            Lưu
          </button>
        </div>
      ))}
    </div>
  );
}

function QualityTab({ ping }: { ping: (s: string) => void }) {
  const [rates, setRates] = useState<{ id: string; label: string; chanceBps: number; quality: string }[]>([]);
  useEffect(() => {
    fetch("/api/admin/quality-rates")
      .then((r) => r.json())
      .then((d) => setRates(d.rates || []));
  }, []);
  const total = rates.reduce((s, r) => s + Number(r.chanceBps), 0);
  return (
    <div className="rounded-xl border-2 border-amber-700 bg-white/80 p-4">
      <p className="mb-2 text-sm">Tổng phải = 10000 bps (100%). Hiện: {total} ({(total / 100).toFixed(2)}%)</p>
      {rates.map((r, i) => (
        <div key={r.id} className="mb-2 flex gap-2">
          <div className="w-32 font-bold">{r.label}</div>
          <input
            className="rounded border px-2 py-1"
            value={r.chanceBps}
            onChange={(e) =>
              setRates((prev) => prev.map((x, idx) => (idx === i ? { ...x, chanceBps: Number(e.target.value) } : x)))
            }
          />
          <span className="text-sm">{(r.chanceBps / 100).toFixed(2)}%</span>
        </div>
      ))}
      <button
        className="wood-sign rounded-lg px-3 py-1"
        onClick={async () => {
          const res = await fetch("/api/admin/quality-rates", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rates }),
          });
          const d = await res.json();
          ping(res.ok ? "Đã lưu tỷ lệ" : d.error || "Lỗi");
        }}
      >
        Lưu tỷ lệ
      </button>
    </div>
  );
}

function PlotsTab({ ping }: { ping: (s: string) => void }) {
  const [unlocks, setUnlocks] = useState<{ plotIndex: number; requiredLevel: number; goldCost: number; enabled: boolean }[]>([]);
  useEffect(() => {
    fetch("/api/admin/plot-unlocks")
      .then((r) => r.json())
      .then((d) => setUnlocks(d.unlocks || []));
  }, []);
  return (
    <div className="rounded-xl border-2 border-amber-700 bg-white/80 p-4">
      <p className="mb-3 text-sm">
        Công thức mặc định: 4 ô cấp 1 miễn phí, mỗi 5 cấp mở thêm 1 ô, ô cuối (ô 24) ở cấp 100.
      </p>
      <div className="grid gap-2">
        {unlocks.map((u, i) => (
          <div key={u.plotIndex} className="grid grid-cols-4 gap-2 text-sm">
            <div className="font-bold">Ô {u.plotIndex + 1}</div>
            <input
              className="rounded border px-2 py-1"
              value={u.requiredLevel}
              onChange={(e) =>
                setUnlocks((p) => p.map((x, idx) => (idx === i ? { ...x, requiredLevel: Number(e.target.value) } : x)))
              }
            />
            <input
              className="rounded border px-2 py-1"
              value={u.goldCost}
              onChange={(e) =>
                setUnlocks((p) => p.map((x, idx) => (idx === i ? { ...x, goldCost: Number(e.target.value) } : x)))
              }
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={u.enabled}
                onChange={(e) =>
                  setUnlocks((p) => p.map((x, idx) => (idx === i ? { ...x, enabled: e.target.checked } : x)))
                }
              />
              bật
            </label>
          </div>
        ))}
      </div>
      <button
        className="wood-sign mt-3 rounded-lg px-3 py-1"
        onClick={async () => {
          const res = await fetch("/api/admin/plot-unlocks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ unlocks }),
          });
          ping(res.ok ? "Đã lưu ô đất" : "Lỗi");
        }}
      >
        Lưu
      </button>
    </div>
  );
}

function ConfigTab({ ping }: { ping: (s: string) => void }) {
  const [items, setItems] = useState<{ key: string; value: string }[]>([]);
  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((d) => setItems(d.config || []));
  }, []);
  return (
    <div className="rounded-xl border-2 border-amber-700 bg-white/80 p-4">
      {items.map((it, i) => (
        <label key={it.key} className="mb-2 block text-sm font-bold">
          {it.key}
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            value={it.value}
            onChange={(e) => setItems((p) => p.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))}
          />
        </label>
      ))}
      <button
        className="wood-sign rounded-lg px-3 py-1"
        onClick={async () => {
          const res = await fetch("/api/admin/config", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          });
          ping(res.ok ? "Đã lưu cấu hình" : "Lỗi");
        }}
      >
        Lưu
      </button>
    </div>
  );
}

function PlayersTab() {
  const [players, setPlayers] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    fetch("/api/admin/players")
      .then((r) => r.json())
      .then((d) => setPlayers(d.players || []));
  }, []);
  return (
    <table className="w-full overflow-hidden rounded-xl border-2 border-amber-700 bg-white/80 text-sm">
      <thead className="bg-amber-200">
        <tr>
          <th className="p-2 text-left">User</th>
          <th>Cấp</th>
          <th>Vàng</th>
          <th>XP</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p) => (
          <tr key={String(p.id)} className="border-t">
            <td className="p-2">
              {String(p.displayName)} ({String(p.username)})
            </td>
            <td className="text-center">{String(p.level)}</td>
            <td className="text-center">{String(p.gold)}</td>
            <td className="text-center">{String(p.xp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

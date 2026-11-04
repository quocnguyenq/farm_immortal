"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionIcon } from "@/components/ActionIcons";
import { ActionMenu, type MenuAnchor, MenuButton } from "@/components/ActionMenu";
import { CropSprite } from "@/components/CropSprite";
import { FarmScene } from "@/components/FarmScene";
import { FishSprite } from "@/components/FishSprite";
import { Hud } from "@/components/Hud";
import { PondModal, ShopModal, type ShopTab, Toast, WarehouseModal } from "@/components/Modals";
import { formatMs, qualityLabel, stageLabel } from "@/lib/game";
import { fishStageLabel } from "@/lib/fishText";
import type { FarmInventory, FarmState, FishInventoryItem, PublicFish, PublicPlot } from "@/lib/types";

type Menu =
  | { kind: "plot"; anchor: MenuAnchor; plotIndex: number; fert?: boolean }
  | { kind: "house"; anchor: MenuAnchor }
  | { kind: "fish"; anchor: MenuAnchor; fishId: string };

export default function PlayPage() {
  const [state, setState] = useState<FarmState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [fetchedAt, setFetchedAt] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [modal, setModal] = useState<"shop" | "warehouse" | "pond" | null>(null);
  const [shopTab, setShopTab] = useState<ShopTab>("seed");

  const ping = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2400);
  };

  const load = useCallback(async () => {
    const res = await fetch("/api/farm", { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    setState(data);
    setFetchedAt(Date.now());
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const a = setInterval(load, 8000);
    const b = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(a);
      clearInterval(b);
    };
  }, [load]);

  async function act(url: string, body: object) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      ping(data.error || "Không thực hiện được");
      return null;
    }
    await load();
    return data;
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function sell(item: FarmInventory, qty: number) {
    const data = await act("/api/shop/sell", { cropId: item.cropId, quality: item.quality, quantity: qty });
    if (data) ping(`Bán được ${data.gold} vàng`);
  }

  async function sellFish(item: FishInventoryItem, qty: number) {
    const data = await act("/api/shop/sell-fish", { fishId: item.fishId, quality: item.quality, quantity: qty });
    if (data) ping(`Bán cá được ${data.gold} vàng`);
  }

  async function harvestFish(body: { id?: string; all?: boolean }) {
    const data = await act("/api/pond/harvest", body);
    if (!data) return;
    const results = data.results as { name: string; quality: FarmInventory["quality"] }[];
    if (results.length === 1) ping(`Thu ${results[0].name} · ${qualityLabel(results[0].quality)}`);
    else {
      const order = ["STAR_0", "STAR_1", "STAR_2", "STAR_3", "STAR_4", "STAR_5", "PREMIUM"];
      const best = results.reduce((a, r) => (order.indexOf(r.quality) > order.indexOf(a) ? r.quality : a), results[0].quality);
      ping(`Thu ${results.length} con cá · tốt nhất ${qualityLabel(best)}`);
    }
  }

  async function plotAction(url: string, body: object, done: (data: Record<string, unknown>) => string) {
    setMenu(null);
    const data = await act(url, body);
    if (data) ping(done(data));
  }

  function openShop(tab: ShopTab) {
    setMenu(null);
    setShopTab(tab);
    setModal("shop");
  }

  function onPlot(plot: PublicPlot, anchor: MenuAnchor) {
    setMenu({ kind: "plot", anchor, plotIndex: plot.plotIndex });
  }

  function onFish(fish: PublicFish, anchor: MenuAnchor) {
    if (fish.stage === "ADULT") setMenu({ kind: "fish", anchor, fishId: fish.id });
    else setModal("pond");
  }

  if (!state) {
    return (
      <div className="farm-sky grid h-screen place-items-center text-lg font-extrabold text-lime-900">
        Đang vào nông trại...
      </div>
    );
  }

  const elapsed = Math.max(0, now - fetchedAt);

  function renderPlotMenu(m: Extract<Menu, { kind: "plot" }>) {
    const plot = state!.plots.find((p) => p.plotIndex === m.plotIndex);
    if (!plot) return null;
    const idx = plot.plotIndex;
    const close = () => setMenu(null);

    if (!plot.unlocked) {
      const lacksLevel = state!.user.level < plot.requiredLevel;
      const lacksGold = state!.user.gold < plot.goldCost;
      return (
        <ActionMenu anchor={m.anchor} title={`Ô đất ${idx + 1}`} subtitle="Chưa khai hoang" onClose={close}>
          <MenuButton
            icon={<ActionIcon id="unlock" />}
            label="Mở ô đất"
            hint={lacksLevel ? `Cần cấp ${plot.requiredLevel}` : `${plot.goldCost} vàng${lacksGold ? " · không đủ vàng" : ""}`}
            tone="gold"
            disabled={lacksLevel || lacksGold}
            onClick={() => plotAction("/api/farm/unlock", { plotIndex: idx }, () => "Đã mở ô đất mới!")}
          />
        </ActionMenu>
      );
    }

    if (!plot.cropId) {
      return (
        <ActionMenu anchor={m.anchor} title={`Ô đất ${idx + 1}`} subtitle="Chọn hạt để gieo" onClose={close}>
          {state!.seeds.length === 0 && <div className="px-1 text-xs font-bold text-amber-900">Kho hạt trống.</div>}
          <div className="grid max-h-72 gap-1 overflow-y-auto pr-0.5">
            {state!.seeds.map((s) => (
              <MenuButton
                key={s.cropId}
                icon={<CropSprite iconKey={s.iconKey} stage="RIPE" />}
                label={s.name}
                hint={`Còn ${s.quantity} hạt`}
                onClick={() =>
                  plotAction("/api/farm/plant", { plotIndex: idx, cropId: s.cropId }, () => "Đã gieo hạt. Nhớ tưới nước!")
                }
              />
            ))}
          </div>
          <MenuButton icon={<ActionIcon id="shop" />} label="Mua thêm hạt" tone="gold" onClick={() => openShop("seed")} />
        </ActionMenu>
      );
    }

    const title = plot.cropName ?? `Ô đất ${idx + 1}`;
    if (plot.currentStage === "RIPE") {
      return (
        <ActionMenu anchor={m.anchor} title={title} subtitle="Đã chín" onClose={close}>
          <MenuButton
            icon={<ActionIcon id="harvest" />}
            label="Thu hoạch"
            tone="primary"
            onClick={() =>
              plotAction("/api/farm/harvest", { plotIndex: idx }, (d) =>
                `Thu ${d.quantity} ${d.cropName} · ${qualityLabel(d.quality as FarmInventory["quality"])}`,
              )
            }
          />
        </ActionMenu>
      );
    }

    if (m.fert) {
      return (
        <ActionMenu anchor={m.anchor} title={title} subtitle="Chọn phân bón (1 lần / giai đoạn)" onClose={close}>
          {state!.fertilizers.map((f) => (
            <MenuButton
              key={f.id}
              icon={<ActionIcon id="fert" />}
              label={`${f.name} · -${f.timeReducePercent}%`}
              hint={`${f.price} vàng`}
              disabled={state!.user.gold < f.price}
              onClick={() =>
                plotAction("/api/farm/fertilize", { plotIndex: idx, fertilizerId: f.id }, () => "Đã bón phân cho giai đoạn này")
              }
            />
          ))}
          <MenuButton label="← Quay lại" onClick={() => setMenu({ ...m, fert: false })} />
        </ActionMenu>
      );
    }

    const waterLeft = Math.max(0, plot.waterLeftMs - elapsed);
    const growLeft = Math.max(0, plot.remainingMs - (waterLeft > 0 ? elapsed : 0));
    return (
      <ActionMenu
        anchor={m.anchor}
        title={title}
        subtitle={`${stageLabel(plot.currentStage)} · ${waterLeft > 0 ? `chín giai đoạn sau ${formatMs(growLeft)}` : "đang ngừng lớn"}`}
        onClose={close}
      >
        <MenuButton
          icon={<ActionIcon id="water" />}
          label="Tưới nước"
          hint={waterLeft > 0 ? `Còn ẩm ${formatMs(waterLeft)} · tưới lại = 6 giờ` : "Đất khô, cần tưới để cây lớn"}
          tone="water"
          onClick={() => plotAction("/api/farm/water", { plotIndex: idx }, () => "Đã tưới, đếm 6 giờ từ bây giờ")}
        />
        {!plot.fertilizedThisStage && (
          <MenuButton
            icon={<ActionIcon id="fert" />}
            label="Bón phân"
            hint="Rút ngắn giai đoạn hiện tại"
            onClick={() => setMenu({ ...m, fert: true })}
          />
        )}
      </ActionMenu>
    );
  }

  function renderMenu() {
    if (!menu) return null;
    const close = () => setMenu(null);
    if (menu.kind === "plot") return renderPlotMenu(menu);
    if (menu.kind === "house") {
      return (
        <ActionMenu anchor={menu.anchor} title="Nhà" onClose={close}>
          <MenuButton
            icon={<ActionIcon id="warehouse" />}
            label="Kho"
            hint="Xem & bán nông sản, cá"
            onClick={() => {
              setMenu(null);
              setModal("warehouse");
            }}
          />
          <MenuButton icon={<ActionIcon id="shop" />} label="Chợ" hint="Mua hạt giống, cá giống" tone="gold" onClick={() => openShop("seed")} />
        </ActionMenu>
      );
    }
    const fish = state!.pond.fish.find((f) => f.id === menu.fishId);
    if (!fish) return null;
    return (
      <ActionMenu
        anchor={menu.anchor}
        title={fish.name}
        subtitle={`${fishStageLabel(fish.stage)} · linh khí ${Math.round(fish.aging * 100)}%`}
        onClose={close}
      >
        <MenuButton
          icon={<FishSprite iconKey={fish.iconKey} className="h-full w-full object-contain" />}
          label="Thu hoạch cá"
          hint={fish.aging < 1 ? "Để lâu thêm sẽ dễ ra sao cao hơn" : "Linh khí đã đầy"}
          tone="primary"
          onClick={() => {
            setMenu(null);
            harvestFish({ id: fish.id });
          }}
        />
        <MenuButton
          icon={<ActionIcon id="fish" />}
          label="Xem ao"
          onClick={() => {
            setMenu(null);
            setModal("pond");
          }}
        />
      </ActionMenu>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden">
      <FarmScene
        plots={state.plots}
        now={now}
        fetchedAt={fetchedAt}
        selected={menu?.kind === "plot" ? menu.plotIndex : null}
        onPlot={onPlot}
        pond={state.pond}
        onOpenPond={() => setModal("pond")}
        onFish={onFish}
        onOpenHouse={(anchor) => setMenu({ kind: "house", anchor })}
      />
      <Hud user={state.user} onLogout={logout} />
      <Toast text={toast} />
      {renderMenu()}
      {modal === "warehouse" && (
        <WarehouseModal
          inventory={state.inventory}
          fishInventory={state.fishInventory}
          onSell={sell}
          onSellFish={sellFish}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "shop" && (
        <ShopModal
          crops={state.shopCrops}
          fish={state.shopFish}
          pond={state.pond}
          level={state.user.level}
          gold={state.user.gold}
          initialTab={shopTab}
          onClose={() => {
            setModal(null);
            setShopTab("seed");
          }}
          onBuy={async (cropId) => {
            const data = await act("/api/shop/buy-seed", { cropId, quantity: 1 });
            if (data) ping("Đã mua hạt giống");
          }}
          onBuyFish={async (fishId) => {
            const data = await act("/api/pond/buy", { fishId, quantity: 1 });
            if (data) ping(`Đã thả ${data.name} giống xuống ao`);
          }}
        />
      )}
      {modal === "pond" && (
        <PondModal
          pond={state.pond}
          level={state.user.level}
          gold={state.user.gold}
          elapsed={elapsed}
          onClose={() => setModal(null)}
          onHarvest={(id) => harvestFish({ id })}
          onHarvestAll={() => harvestFish({ all: true })}
          onUpgrade={async () => {
            const data = await act("/api/pond/upgrade", {});
            if (data) ping(`Ao lên cấp ${data.level}, chứa ${data.capacity} con`);
          }}
          onBuyFish={() => openShop("fish")}
        />
      )}
    </div>
  );
}

// src/components/AccountInfo.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMarketStore } from "@/stores/useMarketStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/useUserStore";
import { formatCurrency } from "@/lib/utils";

/* ===================== Helpers & tipos ===================== */

type TradeMeta = {
  commission?: number | string;
  swap?: number | string;
  copiedFrom?: string;
  marginUsed?: number | string;
  [k: string]: any;
};

type Trade = {
  id: string | number; // soporta text() o int
  userId?: string;
  symbol: string;
  side: "buy" | "sell";
  entryPrice: string; // drizzle numeric llega como string
  closePrice?: string | null;
  quantity: string;
  leverage: string;
  status: "open" | "closed";
  profit?: string | null;
  metadata?: TradeMeta | string | null;
  createdAt?: string | null;
  closedAt?: string | null;
};

const CURRENCY = "USD";
const sideSign = (side: "buy" | "sell") => (side === "buy" ? 1 : -1);

function toNum(n: any, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
function getMeta(t: Trade): TradeMeta {
  if (!t.metadata) return {};
  if (typeof t.metadata === "string") {
    try {
      return JSON.parse(t.metadata) as TradeMeta;
    } catch {
      return {};
    }
  }
  return t.metadata as TradeMeta;
}

/* ===================== Componente ===================== */

export default function AccountInfo() {
  const { isLoading, dataMarket, getLivePrice } = useMarketStore();
  const { user } = useUserStore();

  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [view, setView] = useState<"open" | "closed">("open");
  // ok 09/11/25
  // Estado exclusivo de acordeón (puede iniciar en "open", "closed" o null)
  const [expanded, setExpanded] = useState<"open" | "closed" | null>(null);

  const toggleOpenAccordion = async () => {
    const willExpand = expanded !== "open";
    setView("open");
    if (willExpand) await fetchTradesByStatus("open");
    setExpanded(willExpand ? "open" : null);
  };

  const toggleClosedAccordion = async () => {
    const willExpand = expanded !== "closed";
    setView("closed");
    if (willExpand) await fetchTradesByStatus("closed");
    setExpanded(willExpand ? "closed" : null);
  };



  

  const [metrics, setMetrics] = useState({
    balance: 0,
    usedMargin: 0,
    freeMargin: 0,
    openPnL: 0,
    equity: 0,
    marginLevel: 0,
    credit: 0,
  });

  // Rendimiento en vivo por trade.id
  const [livePerf, setLivePerf] = useState<
    Record<string | number, { price: number; pnl: number; pct: number }>
  >({});

  /* ----------------------------- Fetch on-demand ----------------------------- */
  const fetchTradesByStatus = async (status: "open" | "closed" | "all") => {
    if (!user?.id) return;
    const userId = String(user.id);

    const res = await fetch(
      `/api/trade/list?userId=${encodeURIComponent(userId)}&status=${status}&ts=${Date.now()}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (data?.success) {
      const rows: Trade[] = data.trades ?? [];
      if (status === "open") {
        setOpenTrades(rows.filter((t) => t.status === "open"));
      } else if (status === "closed") {
        setClosedTrades(
          rows
            .filter((t) => t.status === "closed")
            .sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? ""))
        );
      } else {
        setOpenTrades(rows.filter((t) => t.status === "open"));
        setClosedTrades(
          rows
            .filter((t) => t.status === "closed")
            .sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? ""))
        );
      }
    }
  };

  // Cargar una primera vez la pestaña "open"
  useEffect(() => {
    fetchTradesByStatus("open");
  }, [user?.id]);

  /* ---------------------- Precio en vivo (store) ---------------------- */
  // Resuelve precio: primero live del store, luego dataMarket, luego entry
  function resolveLivePrice(symbol: string, fallback: number) {
    const live = getLivePrice(symbol);
    if (typeof live === "number" && Number.isFinite(live) && live > 0) return live;

    const S = symbol.toUpperCase();
    const m = Array.isArray(dataMarket)
      ? dataMarket.find((mk: any) =>
          [mk.symbol, mk.ticker, mk.code]
            .map((x: any) => String(x).toUpperCase())
            .includes(S)
        )
      : undefined;

    const mPrice = Number(
      (m as any)?.lastPrice ??
        (m as any)?.last ??
        (m as any)?.price ??
        (m as any)?.close ??
        (m as any)?.bid ??
        (m as any)?.ask
    );
    if (Number.isFinite(mPrice) && mPrice > 0) return mPrice;

    return fallback;
  }

  /* ---------------------- Calcular métricas de la cuenta ---------------------- */
  useEffect(() => {
    if (!user) return;

    const balance = Number(user.balance ?? 0);
    let usedMargin = 0;
    let openPnL = 0;

    for (const trade of openTrades) {
      const entry = parseFloat(trade.entryPrice);
      const qty = parseFloat(trade.quantity);
      const leverage = Math.max(parseFloat(trade.leverage ?? "1"), 1);
      const margin = (entry * qty) / leverage;
      usedMargin += margin;

      const currentPrice = resolveLivePrice(trade.symbol, entry);
      const pnl =
        (currentPrice - entry) * qty * leverage * (trade.side === "buy" ? 1 : -1);

      openPnL += pnl;
    }

    const freeMargin = balance - usedMargin;
    const equity = balance + openPnL;
    const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

    setMetrics({
      balance,
      usedMargin: Number(usedMargin.toFixed(2)),
      freeMargin: Number(freeMargin.toFixed(2)),
      openPnL: Number(openPnL.toFixed(2)),
      equity: Number(equity.toFixed(2)),
      marginLevel: Number(marginLevel.toFixed(2)),
      credit: 0,
    });
  }, [openTrades, dataMarket, getLivePrice, user]);

  /* ---------------------- Rendimiento en tiempo real ---------------------- */
  useEffect(() => {
    if (!openTrades.length) {
      setLivePerf({});
      return;
    }

    const calc = () => {
      const next: Record<string | number, { price: number; pnl: number; pct: number }> = {};

      for (const t of openTrades) {
        const entry = toNum(t.entryPrice);
        const qty = toNum(t.quantity);
        const lev = Math.max(toNum(t.leverage, 1), 1);
        const dir = sideSign(t.side);

        const price = resolveLivePrice(t.symbol, entry);
        const pnl = (price - entry) * qty * lev * dir;
        const pct = ((price - entry) / (entry || 1)) * 100 * dir;

        next[t.id] = {
          price: Number(price.toFixed(6)),
          pnl: Number(pnl.toFixed(2)),
          pct: Number(pct.toFixed(2)),
        };
      }

      setLivePerf(next);
    };

    // inicial y cada 1s
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
    // Dependemos de getLivePrice (función) + openTrades + dataMarket
  }, [openTrades, dataMarket, getLivePrice]);

  /* --------------------------- Cerrar operación --------------------------- */
  async function handleCloseTrade(trade: Trade) {
    try {
      const fallback = Number.parseFloat(trade.entryPrice);
      const marketPrice = resolveLivePrice(trade.symbol, fallback);
      const closePrice = Number.isFinite(marketPrice) && marketPrice > 0 ? marketPrice : fallback;

      const res = await fetch("/api/trade/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: trade.id, closePrice }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Error al cerrar operación");
      }

      await Promise.all([fetchTradesByStatus("open"), fetchTradesByStatus("closed")]);
    } catch (err) {
      console.error("❌", err);
    }
  }

  /* ===================== Render helpers ===================== */

  const EmptyMsg = ({ label }: { label: string }) => (
    <p className="text-sm text-muted mt-4">{label}</p>
  );

  const MobileBadge = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-white/10">
      {children}
    </span>
  );

  /* --------------------------- Móvil: Abiertas --------------------------- */
  const OpenTradesMobile = () =>
    openTrades.length === 0 ? (
      <EmptyMsg label="No hay operaciones abiertas." />
    ) : (
      <div className="mt-4 space-y-3">
        {openTrades.map((t) => {
          const live = livePerf[t.id] ?? {
            price: Number(t.entryPrice),
            pnl: 0,
            pct: 0,
          };
          const pnlPos = live.pnl >= 0;

          return (
            <div key={t.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{t.symbol}</div>
                <MobileBadge>
                  <span className={t.side === "buy" ? "text-green-400" : "text-red-400"}>
                    {t.side.toUpperCase()}
                  </span>
                </MobileBadge>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-gray-300">
                <div>
                  <p className="opacity-60">Cantidad</p>
                  <p className="font-medium">{t.quantity}</p>
                </div>
                <div>
                  <p className="opacity-60">Entrada</p>
                  <p className="font-medium">
                    {formatCurrency(Number(t.entryPrice), "en-US", CURRENCY)}
                  </p>
                </div>
                <div>
                  <p className="opacity-60">Precio actual</p>
                  <p className="font-medium">
                    {formatCurrency(live.price, "en-US", CURRENCY)}
                  </p>
                </div>
                <div>
                  <p className="opacity-60">Leverage</p>
                  <p className="font-medium">{t.leverage}x</p>
                </div>
                <div className="col-span-2">
                  <p className="opacity-60">Rendimiento</p>
                  <p className={`font-medium ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(live.pnl, "en-US", CURRENCY)}&nbsp;({live.pct.toFixed(2)}%)
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => handleCloseTrade(t)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );

  /* --------------------------- Móvil: Cerradas --------------------------- */
  const ClosedTradesMobile = () =>
    closedTrades.length === 0 ? (
      <EmptyMsg label="No hay operaciones cerradas." />
    ) : (
      <div className="mt-4 space-y-3">
        {closedTrades.map((t) => {
          const md = getMeta(t);
          return (
            <div key={t.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{t.symbol}</div>
                <MobileBadge>
                  <span className={t.side === "buy" ? "text-green-400" : "text-red-400"}>
                    {t.side.toUpperCase()}
                  </span>
                </MobileBadge>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-gray-300">
                <div>
                  <p className="opacity-60">Cantidad</p>
                  <p className="font-medium">{t.quantity}</p>
                </div>
                <div>
                  <p className="opacity-60">P. Apertura</p>
                  <p className="font-medium">
                    {formatCurrency(toNum(t.entryPrice), "en-US", CURRENCY)}
                  </p>
                </div>
                <div>
                  <p className="opacity-60">P. Cierre</p>
                  <p className="font-medium">
                    {t.closePrice ? formatCurrency(toNum(t.closePrice), "en-US", CURRENCY) : "—"}
                  </p>
                </div>
                <div>
                  <p className="opacity-60">Beneficios</p>
                  <p className={`font-medium ${toNum(t.profit) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(toNum(t.profit), "en-US", CURRENCY)}
                  </p>
                </div>
                <div>
                  <p className="opacity-60">Intercambio</p>
                  <p className="font-medium">
                    {formatCurrency(toNum(md.swap), "en-US", CURRENCY)}
                  </p>
                </div>
                <div>
                  <p className="opacity-60">Comisión</p>
                  <p className="font-medium">
                    {formatCurrency(toNum(md.commission), "en-US", CURRENCY)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="opacity-60">Copiado de</p>
                  <p className="font-medium">{md.copiedFrom ?? "—"}</p>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-gray-400">
                <div>Abierta: {fmtDate(t.createdAt)}</div>
                <div>Cerrada: {fmtDate(t.closedAt)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );

  /* --------------------------- Desktop: Abiertas --------------------------- */
  const OpenTradesTable = () =>
    openTrades.length === 0 ? (
      <EmptyMsg label="No hay operaciones abiertas." />
    ) : (
      <div className="overflow-x-auto mt-4 hidden md:block">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs text-[var(--color-text-muted)]">
              <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Instrumento</th>
              <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">TIPO</th>
              <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Importación</th>
              <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Precio de apertura</th>
              <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Precio actual</th>
              <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Leverage</th>
              <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Rendimiento</th>
              <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Rendimiento %</th>
              <th className="pb-2 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {openTrades.map((t) => {
              const live = livePerf[t.id] ?? {
                price: Number(t.entryPrice),
                pnl: 0,
                pct: 0,
              };
              const pnlPos = live.pnl >= 0;

              return (
                <tr 
                  key={t.id} 
                  className="
                    transition-all duration-200 
                    bg-[var(--table-row-bg)]
                    hover:bg-[var(--table-row-bg)]
                    border border-[var(--color-border)]
                    rounded-lg
                  "
                >
                  <td className="py-3 px-4 border-r border-[var(--color-border)]/30 first:rounded-l-lg text-[var(--color-text)]">{t.symbol}</td>
                  <td className={`py-3 px-4 border-r border-[var(--color-border)]/30 ${t.side === "buy" ? "text-green-400" : "text-red-400"}`}>
                    {t.side.toUpperCase()}
                  </td>
                  <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{Number(t.quantity)}</td>
                  <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{formatCurrency(Number(t.entryPrice), "en-US", CURRENCY)}</td>
                  <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{formatCurrency(live.price, "en-US", CURRENCY)}</td>
                  <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{t.leverage}x</td>
                  <td className={`py-3 px-4 border-r border-[var(--color-border)]/30 ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(live.pnl, "en-US", CURRENCY)}
                  </td>
                  <td className={`py-3 px-4 border-r border-[var(--color-border)]/30 ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                    {live.pct.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 last:rounded-r-lg">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="ml-2 bg-red-600 hover:bg-red-700 cursor-pointer transition-colors"
                      onClick={() => handleCloseTrade(t)}
                    >
                      Cerrar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  /* --------------------------- Desktop: Cerradas --------------------------- */
  const [rowsPerPage, setRowsPerPage] = useState(4);
  const [page, setPage] = useState(0);
  const closedPaged = useMemo(() => {
    const start = page * rowsPerPage;
    return closedTrades.slice(start, start + rowsPerPage);
  }, [closedTrades, page, rowsPerPage]);

  const totalClosedPL = useMemo(
    () => closedTrades.reduce((acc, t) => acc + toNum(t.profit), 0),
    [closedTrades]
  );

  const ClosedTradesTable = () =>
    closedTrades.length === 0 ? (
      <EmptyMsg label="No hay operaciones cerradas." />
    ) : (
<div className="mt-4">
  <div className="overflow-x-auto hidden md:block">
    <table className="w-full text-sm border-separate border-spacing-y-2">
      <thead>
        <tr className="text-left text-xs text-[var(--color-text-muted)]">
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Instrumento</th>
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">TIPO</th>
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Importación</th>
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Precio de apertura</th>
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Hora de apertura</th>
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Precio de cierre</th>
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Hora de cierre</th>
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Beneficios</th>
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Intercambio</th>
          <th className="pb-2 px-4 border-r border-[var(--color-border)]/30 text-center">Comisión</th>
          <th className="pb-2 px-4 text-center">Copiado de</th>
        </tr>
      </thead>
      <tbody>
        {closedPaged.map((t) => {
          const md = getMeta(t);
          return (
            <tr 
              key={t.id} 
              className="
                transition-all duration-200 
                bg-[var(--table-row-bg)]
                hover:bg-[var(--table-row-hover)]
                border border-[var(--color-border)]
                rounded-lg
              "
            >
              <td className="py-3 px-4 border-r border-[var(--color-border)]/30 first:rounded-l-lg text-[var(--color-text)]">{t.symbol}</td>
              <td className={`py-3 px-4 border-r border-[var(--color-border)]/30 ${t.side === "buy" ? "text-green-400" : "text-red-400"}`}>
                {t.side.toUpperCase()}
              </td>
              <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{Number(t.quantity)}</td>
              <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{formatCurrency(toNum(t.entryPrice), "en-US", CURRENCY)}</td>
              <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{fmtDate(t.createdAt)}</td>
              <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">
                {t.closePrice ? formatCurrency(toNum(t.closePrice), "en-US", CURRENCY) : "—"}
              </td>
              <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{fmtDate(t.closedAt)}</td>
              <td className={`py-3 px-4 border-r border-[var(--color-border)]/30 ${toNum(t.profit) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatCurrency(toNum(t.profit), "en-US", CURRENCY)}
              </td>
              <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{formatCurrency(toNum(md.swap), "en-US", CURRENCY)}</td>
              <td className="py-3 px-4 border-r border-[var(--color-border)]/30 text-[var(--color-text)]">{formatCurrency(toNum(md.commission), "en-US", CURRENCY)}</td>
              <td className="py-3 px-4 last:rounded-r-lg text-[var(--color-text)]">{md.copiedFrom ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  {/* Footer: total + paginación */}
  <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-[var(--color-border)]">
    <div className="text-sm font-medium text-[var(--color-text)]">
      Total P/L:&nbsp;
      <span className={`${totalClosedPL >= 0 ? "text-green-400" : "text-red-400"}`}>
        {formatCurrency(totalClosedPL, "en-US", CURRENCY)}
      </span>
    </div>

    <div className="flex items-center gap-2">
      <label className="text-sm text-[var(--color-text-muted)]">Filas por página:</label>
      <select
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] transition-colors"
        value={rowsPerPage}
        onChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
      >
        {[4, 10, 25].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <div className="text-sm text-[var(--color-text-muted)] ml-2">
        {closedTrades.length === 0
          ? "0-0 of 0"
          : `${page * rowsPerPage + 1}-${Math.min(
              (page + 1) * rowsPerPage,
              closedTrades.length
            )} of ${closedTrades.length}`}
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setPage((p) => Math.max(p - 1, 0))}
        className="border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]"
      >
        {"<"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          setPage((p) => ((p + 1) * rowsPerPage < closedTrades.length ? p + 1 : p))
        }
        className="border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]"
      >
        {">"}
      </Button>
    </div>
  </div>
</div>
    );

  /* ===================== Datos de cabecera ===================== */
  const accountData = [
    { label: "Patrimonio neto", value: metrics.equity },
    { label: "Margen libre", value: metrics.freeMargin },
    { label: "Margen usado", value: metrics.usedMargin },
    { label: "P/L abiertas", value: metrics.openPnL },
    { label: "Saldo", value: metrics.balance },
    { label: "Nvl margen (%)", value: metrics.marginLevel },
    { label: "Crédito", value: metrics.credit },
  ];

  /* ===================== Render principal ===================== */
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 md:p-6 transition-colors">
      <div className="cursor-pointer select-none" onClick={() => setShowDetails((p) => !p)}>
        <h2 className="text-base md:text-lg font-semibold mb-4 text-[var(--color-text)] border-l-4 border-[var(--color-primary)] pl-2">
          Información de cuenta
        </h2>

        {/* Grilla métrica */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-y-4 gap-x-4 md:gap-x-6">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 md:w-24 mb-2 bg-[var(--color-border)]" />
                <Skeleton className="h-4 w-14 md:w-16 bg-[var(--color-border)]" />
              </div>
            ))
          ) : (
            accountData.map((item, index) => (
              <div key={index} className="col-span-1">
                <p className="text-[11px] md:text-xs text-[var(--color-text-muted)] mb-1 tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                </p>
                <p className={`text-sm md:text-base font-medium ${
                  Number(item.value) < 0 
                    ? "text-red-400" 
                    : "text-[var(--color-text)]"
                }`}>
                  {formatCurrency(Number(item.value), "en-US", CURRENCY)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

        {/* Detalles */}
        {/* ===== Bloque: Posiciones (botones acordeón lado a lado) ===== */}
      
        {/* Header con los dos acordeones, siempre visible y lado a lado */}
        {/* ===== Bloque: Posiciones (botones individuales tipo acordeón) ===== */}
        <div className="mt-6 pt-4 border-t border-[var(--color-border)] space-y-2">
          {/* Fila de botones lado a lado */}
          <div className="grid grid-cols-2 gap-2">
            {/* Posiciones abiertas */}
            <button
              onClick={toggleOpenAccordion}
              aria-expanded={expanded === "open"}
              type="button"
              className={`flex items-center justify-between w-full px-4 py-3 text-base font-medium rounded-xl border transition-all duration-200
                ${
                  expanded === "open"
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                    : "bg-transparent border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
                }`}
            >
              <span>Posiciones abiertas</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-5 h-5 transition-transform ${expanded === "open" ? "rotate-180" : "rotate-0"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Posiciones cerradas */}
            <button
              onClick={toggleClosedAccordion}
              aria-expanded={expanded === "closed"}
              type="button"
              className={`flex items-center justify-between w-full px-4 py-3 text-base font-medium rounded-xl border transition-all duration-200
                ${
                  expanded === "closed"
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                    : "bg-transparent border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
                }`}
            >
              <span>Posiciones cerradas</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-5 h-5 transition-transform ${expanded === "closed" ? "rotate-180" : "rotate-0"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Contenido acordeón (sin contenedor ni fondo) */}
          {expanded === "open" && (
            <div className="transition-all duration-300">
              <div className="md:hidden p-3">
                <OpenTradesMobile />
              </div>
              <div className="hidden md:block">
                <OpenTradesTable />
              </div>
            </div>
          )}

          {expanded === "closed" && (
            <div className="transition-all duration-300">
              <div className="md:hidden p-3">
                <ClosedTradesMobile />
              </div>
              <div className="hidden md:block">
                <ClosedTradesTable />
              </div>
            </div>
          )}
        </div>
      </div>
  );

}

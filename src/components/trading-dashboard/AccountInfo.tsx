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
            <tr className="text-left text-xs text-gray-400">
              <th>Instrumento</th>
              <th>TIPO</th>
              <th>Importación</th>
              <th>Precio de apertura</th>
              <th>Precio actual</th>
              <th>Leverage</th>
              <th>Rendimiento</th>
              <th>Rendimiento %</th>
              <th></th>
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
                <tr key={t.id} className="transition">
                  <td className="py-2 px-3">{t.symbol}</td>
                  <td className={`px-3 ${t.side === "buy" ? "text-green-400" : "text-red-400"}`}>
                    {t.side.toUpperCase()}
                  </td>
                  <td className="px-3">{Number(t.quantity)}</td>
                  <td className="px-3">{formatCurrency(Number(t.entryPrice), "en-US", CURRENCY)}</td>
                  <td className="px-3">{formatCurrency(live.price, "en-US", CURRENCY)}</td>
                  <td className="px-3">{t.leverage}x</td>
                  <td className={`px-3 ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(live.pnl, "en-US", CURRENCY)}
                  </td>
                  <td className={`px-3 ${pnlPos ? "text-green-400" : "text-red-400"}`}>{live.pct.toFixed(2)}%</td>
                  <td className="px-3">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="ml-2 bg-red-600 hover:bg-red-700 cursor-pointer"
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
              <tr className="text-left text-xs text-gray-400">
                <th>Instrumento</th>
                <th>TIPO</th>
                <th>Importación</th>
                <th>Precio de apertura</th>
                <th>Hora de apertura</th>
                <th>Precio de cierre</th>
                <th>Hora de cierre</th>
                <th>Beneficios</th>
                <th>Intercambio</th>
                <th>Comisión</th>
                <th>Copiado de</th>
              </tr>
            </thead>
            <tbody>
              {closedPaged.map((t) => {
                const md = getMeta(t);
                return (
                  <tr key={t.id} className="hover:opacity-80 transition">
                    <td className="py-2 px-3">{t.symbol}</td>
                    <td className={`px-3 ${t.side === "buy" ? "text-green-400" : "text-red-400"}`}>
                      {t.side.toUpperCase()}
                    </td>
                    <td className="px-3">{Number(t.quantity)}</td>
                    <td className="px-3">{formatCurrency(toNum(t.entryPrice), "en-US", CURRENCY)}</td>
                    <td className="px-3">{fmtDate(t.createdAt)}</td>
                    <td className="px-3">
                      {t.closePrice ? formatCurrency(toNum(t.closePrice), "en-US", CURRENCY) : "—"}
                    </td>
                    <td className="px-3">{fmtDate(t.closedAt)}</td>
                    <td className={`px-3 ${toNum(t.profit) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatCurrency(toNum(t.profit), "en-US", CURRENCY)}
                    </td>
                    <td className="px-3">{formatCurrency(toNum(md.swap), "en-US", CURRENCY)}</td>
                    <td className="px-3">{formatCurrency(toNum(md.commission), "en-US", CURRENCY)}</td>
                    <td className="px-3">{md.copiedFrom ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer: total + paginación */}
        <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm font-medium">
            Total P/L:&nbsp;
            <span className={`${totalClosedPL >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatCurrency(totalClosedPL, "en-US", CURRENCY)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Filas por página:</label>
            <select
              className="bg-transparent border rounded px-2 py-1"
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
            <div className="text-sm ml-2">
              {closedTrades.length === 0
                ? "0-0 of 0"
                : `${page * rowsPerPage + 1}-${Math.min(
                    (page + 1) * rowsPerPage,
                    closedTrades.length
                  )} of ${closedTrades.length}`}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 0))}>
              {"<"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setPage((p) => ((p + 1) * rowsPerPage < closedTrades.length ? p + 1 : p))
              }
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
    <div className="rounded-2xl border border-gray-50/80 p-4 md:p-6">
      <div className="cursor-pointer select-none" onClick={() => setShowDetails((p) => !p)}>
        <h2 className="text-base md:text-lg font-semibold mb-4">Información de cuenta</h2>

        {/* Grilla métrica */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-y-3 gap-x-4 md:gap-x-6">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 md:w-24 mb-2" />
                <Skeleton className="h-4 w-14 md:w-16" />
              </div>
            ))
          ) : (
            accountData.map((item, index) => (
              <div key={index} className="col-span-1">
                <p className="text-[11px] md:text-xs text-muted mb-1 tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                </p>
                <p className={`text-sm md:text-base font-medium ${Number(item.value) < 0 ? "text-red-500" : "text-white"}`}>
                  {formatCurrency(Number(item.value), "en-US", CURRENCY)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detalles */}
      {showDetails && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-2 w-full sticky top-0 z-10">
            <Button
              type="button"
              onClick={async () => {
                setView("open");
                await fetchTradesByStatus("open"); // consulta al hacer click
              }}
              aria-pressed={view === "open"}
              className={`w-full py-2 md:py-1 ${
                view === "open"
                  ? "bg-yellow-400 text-white hover:bg-yellow-500 cursor-pointer"
                  : "border bg-muted text-foreground hover:opacity-90 cursor-pointer"
              }`}
            >
              Posiciones abiertas
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setView("closed");
                await fetchTradesByStatus("closed"); // consulta al hacer click
              }}
              aria-pressed={view === "closed"}
              className={`w-full py-2 md:py-1 ${
                view === "closed"
                  ? "bg-yellow-400 text-white hover:bg-yellow-500 cursor-pointer"
                  : "border bg-muted text-foreground hover:opacity-90 cursor-pointer"
              }`}
            >
              Posiciones cerradas
            </Button>
          </div>

          {view === "open" ? (
            <>
              <div className="md:hidden">
                <OpenTradesMobile />
              </div>
              <OpenTradesTable />
            </>
          ) : (
            <>
              <div className="md:hidden">
                <ClosedTradesMobile />
              </div>
              <ClosedTradesTable />
            </>
          )}
        </div>
      )}
    </div>
  );
}

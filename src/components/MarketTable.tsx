// components/MarketTable.tsx
'use client';
import { useEffect, useState } from 'react';

type Quote = {
  symbol: string;
  price: number;
  high?: number;
  low?: number;
  latestTradingDay?: string;
};

const MARKETS = ['indices','acciones','commodities','crypto','fx','all'] as const;
type Market = typeof MARKETS[number];

export default function MarketTable() {
  const [market, setMarket] = useState<Market>('indices');
  const [data, setData] = useState<Quote[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(m: Market) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/markets?market=${encodeURIComponent(m)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Fetch error');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(market);
    const id = setInterval(() => load(market), 60_000); // refrescar por market cada 60s
    return () => clearInterval(id);
  }, [market]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {MARKETS.map(m => (
          <button
            key={m}
            onClick={() => setMarket(m)}
            className={`px-3 py-1 rounded-full text-sm ${m === market ? 'bg-yellow-500 text-gray-600' : 'bg-gray-600 text-yellow-500'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {loading && !data && <div>Cargando {market}...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}

      <div className="overflow-x-autorounded shadow">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Símbolo</th>
              <th className="px-4 py-2 text-right">Precio</th>
              <th className="px-4 py-2 text-right">Máx</th>
              <th className="px-4 py-2 text-right">Mín</th>
              <th className="px-4 py-2 text-right">Hora</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map(q => (
              <tr key={q.symbol} className="border-t">
                <td className="px-4 py-3 font-medium">{q.symbol}</td>
                <td className="px-4 py-3 text-right">{Number(q.price ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{q.high ? Number(q.high).toFixed(2) : '-'}</td>
                <td className="px-4 py-3 text-right">{q.low ? Number(q.low).toFixed(2) : '-'}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-500">{q.latestTradingDay ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-500">Mostrando: {market}</div>
    </div>
  );
}

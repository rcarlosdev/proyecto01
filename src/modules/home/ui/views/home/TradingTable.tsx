"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const positions = [
  { symbol: "USDJPY", type: "Buy", amount: 1000, open: 153.082, openTime: "10/10/2025 02:29", close: 153.069, closeTime: "10/10/2025 02:34", profit: -0.07 },
  { symbol: "EURUSD", type: "Sell", amount: 3000, open: 1.17401, openTime: "24/09/2025 17:31", close: 1.15943, closeTime: "09/10/2025 16:48", profit: 37.73 },
];

export function TradingTable() {
  return (
    <div className="bg-[#0f172a] border-t border-[#1f2937] p-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instrumento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Importación</TableHead>
              <TableHead>Precio apertura</TableHead>
              <TableHead>Hora apertura</TableHead>
              <TableHead>Precio cierre</TableHead>
              <TableHead>Hora cierre</TableHead>
              <TableHead>Beneficios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((p) => (
              <TableRow key={p.symbol}>
                <TableCell>{p.symbol}</TableCell>
                <TableCell>{p.type}</TableCell>
                <TableCell>{p.amount}</TableCell>
                <TableCell>{p.open}</TableCell>
                <TableCell>{p.openTime}</TableCell>
                <TableCell>{p.close}</TableCell>
                <TableCell>{p.closeTime}</TableCell>
                <TableCell className={p.profit > 0 ? "text-green-500" : "text-red-500"}>
                  €{p.profit.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="text-right font-semibold text-green-500 mt-2">Total P/L: €270.27</div>
    </div>
  );
}

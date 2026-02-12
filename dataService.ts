
import { OHLC, StockData } from '../types';
import { PAGES, BASE_CSV_URL } from '../constants';

export const fetchAllStockData = async (): Promise<StockData[]> => {
  const stockMap: Record<string, OHLC[]> = {};

  const fetchPage = async (gid: string) => {
    try {
      const response = await fetch(`${BASE_CSV_URL}&gid=${gid}`);
      const text = await response.text();
      const rows = text.split('\n').map(row => row.split(','));
      if (rows.length < 2) return;

      const headers = rows[0];
      // Headers look like: Timestamp, STOCK1_O, STOCK1_H, STOCK1_L, STOCK1_C, STOCK1_V, STOCK2_O...
      
      const stockGroups: { symbol: string, indices: number[] }[] = [];
      for (let i = 1; i < headers.length; i += 5) {
        const header = headers[i].trim();
        if (!header) continue;
        const symbol = header.replace(/_O|_H|_L|_C|_V/g, '');
        stockGroups.push({ symbol, indices: [i, i+1, i+2, i+3, i+4] });
      }

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const timestamp = row[0];
        if (!timestamp) continue;

        stockGroups.forEach(group => {
          const o = parseFloat(row[group.indices[0]]);
          const h = parseFloat(row[group.indices[1]]);
          const l = parseFloat(row[group.indices[2]]);
          const c = parseFloat(row[group.indices[3]]);
          const v = parseFloat(row[group.indices[4]]);

          if (!isNaN(o) && !isNaN(h) && !isNaN(l) && !isNaN(c)) {
            if (!stockMap[group.symbol]) stockMap[group.symbol] = [];
            stockMap[group.symbol].push({ timestamp, open: o, high: h, low: l, close: c, volume: v });
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching GID ${gid}:`, error);
    }
  };

  await Promise.all(PAGES.map(page => fetchPage(page.gid)));

  return Object.keys(stockMap).map(symbol => ({
    symbol,
    history: stockMap[symbol].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }));
};

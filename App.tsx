
import React, { useState, useEffect, useCallback } from 'react';
import { StockData, ScanResult, Timeframe, PatternType } from './types';
import { fetchAllStockData } from './services/dataService';
import { aggregateData, checkPattern } from './services/scannerService';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import DashboardStats from './components/DashboardStats';
import LogsTable from './components/LogsTable';

const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(Timeframe.MIN_15);
  const [selectedPattern, setSelectedPattern] = useState<string>(PatternType.HAMMER_GREEN);
  const [selectedSlot, setSelectedSlot] = useState<string>("All Day");
  const [historicLogs, setHistoricLogs] = useState<ScanResult[]>([]);
  const [liveResults, setLiveResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [selectedStockDetail, setSelectedStockDetail] = useState<string | null>(null);

  const parseTfMinutes = (tf: string): number => {
    if (tf === '1 day') return 375;
    const parts = tf.split(' ');
    const val = parseFloat(parts[0]);
    if (parts[1] === 'hour' || parts[1] === 'hours') return val * 60;
    if (tf.includes('.')) {
      const [h, m] = tf.split(' ')[0].split('.');
      return parseInt(h) * 60 + parseInt(m);
    }
    return val;
  };

  const runScan = useCallback(async (isLive: boolean = false) => {
    setScanning(true);
    try {
      const allData = await fetchAllStockData();
      setStocks(allData);
      setLastUpdated(new Date());
      const results: ScanResult[] = [];
      const targetMins = parseTfMinutes(selectedTimeframe);
      allData.forEach(stock => {
        const aggregated = aggregateData(stock.history, targetMins);
        aggregated.forEach((candle, idx) => {
          const match = checkPattern(aggregated, idx, selectedPattern);
          if (match) {
            const candleDate = new Date(candle.timestamp);
            const nextTime = new Date(candleDate.getTime() + targetMins * 60000);
            const slotStr = `${candleDate.getHours().toString().padStart(2, '0')}:${candleDate.getMinutes().toString().padStart(2, '0')} - ${nextTime.getHours().toString().padStart(2, '0')}:${nextTime.getMinutes().toString().padStart(2, '0')}`;
            if (selectedSlot === "All Day" || selectedSlot === slotStr) {
              results.push({ symbol: stock.symbol, timeframe: selectedTimeframe, pattern: selectedPattern, timeSlot: slotStr, timestamp: candleDate.getTime() });
            }
          }
        });
      });
      const sorted = results.sort((a, b) => b.timestamp - a.timestamp);
      if (isLive) setLiveResults(sorted); else setHistoricLogs(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
      setLoading(false);
    }
  }, [selectedTimeframe, selectedPattern, selectedSlot]);

  useEffect(() => {
    runScan(false);
    const id = setInterval(() => runScan(true), 300000);
    return () => clearInterval(id);
  }, [runScan]);

  const uniqueStocksWithPatterns = new Set([...historicLogs, ...liveResults].map(r => r.symbol)).size;
  const stockSpecificPatterns = [...historicLogs, ...liveResults].filter(r => r.symbol === selectedStockDetail);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SettingsPanel 
          selectedTimeframe={selectedTimeframe} setSelectedTimeframe={setSelectedTimeframe}
          selectedPattern={selectedPattern} setSelectedPattern={setSelectedPattern}
          selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock Terminal</h2>
                <p className="text-slate-500 font-medium">Auto-syncing OHLC every 5 mins</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => runScan(false)} disabled={scanning} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 transition-all">
                  <i className={`fas fa-history ${scanning ? 'animate-spin' : ''}`}></i> Historical Scan
                </button>
                <button onClick={() => runScan(true)} disabled={scanning} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all">
                  <i className={`fas fa-bolt ${scanning ? 'animate-pulse' : ''}`}></i> Live Scan
                </button>
              </div>
            </div>

            <DashboardStats scanned={stocks.length} patterns={historicLogs.length + liveResults.length} stocks={uniqueStocksWithPatterns} loading={loading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
              <LogsTable title="Historical Logs (9 AM+)" icon="fa-clock-rotate-left" results={historicLogs} colorClass="bg-slate-800" />
              <LogsTable title="Live Scan Results" icon="fa-wifi" results={liveResults} colorClass="bg-indigo-600" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Master Index</h3>
                  <p className="text-sm text-slate-400">Tracked stock names. Click for pattern breakdown.</p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Instruments</span>
                  <span className="text-2xl font-black text-slate-800">{stocks.length}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {stocks.map(s => (
                  <div key={s.symbol} onClick={() => setSelectedStockDetail(s.symbol)} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all group">
                    <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 truncate">{s.symbol}</div>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-[10px] text-slate-400 font-medium">Index</span>
                       <i className="fas fa-chevron-right text-[8px] text-slate-300 group-hover:text-indigo-400"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedStockDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setSelectedStockDetail(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black">{selectedStockDetail}</h2>
                <p className="opacity-80 font-medium">Pattern analysis for today</p>
              </div>
              <button onClick={() => setSelectedStockDetail(null)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-8">
               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Occurrences</span>
                    <span className="text-3xl font-black text-slate-900">{stockSpecificPatterns.length}</span>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</span>
                    <span className={`text-lg font-bold ${stockSpecificPatterns.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {stockSpecificPatterns.length > 0 ? 'Patterns Found' : 'No Hits'}
                    </span>
                 </div>
               </div>
               <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {stockSpecificPatterns.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                        <th className="py-2 px-2">Time Slot</th>
                        <th className="py-2 px-2">Pattern</th>
                        <th className="py-2 px-2 text-right">TF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stockSpecificPatterns.map((p, i) => (
                        <tr key={i} className="text-sm">
                          <td className="py-4 px-2 font-bold text-slate-800">{p.timeSlot}</td>
                          <td className="py-4 px-2">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">{p.pattern}</span>
                          </td>
                          <td className="py-4 px-2 text-right text-slate-500 font-medium">{p.timeframe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <i className="fas fa-search-minus text-4xl mb-4 opacity-20"></i>
                    <p className="font-medium">No patterns detected for this stock yet.</p>
                  </div>
                )}
               </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <button onClick={() => setSelectedStockDetail(null)} className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Close Dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

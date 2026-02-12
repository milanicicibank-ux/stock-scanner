
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StockData, ScanResult, Timeframe, PatternType } from './types';
import { fetchAllStockData } from './services/dataService';
import { aggregateData, checkPattern, getTimeSlots } from './services/scannerService';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import DashboardStats from './components/DashboardStats';
import LogsTable from './components/LogsTable';

const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Scanner Config
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(Timeframe.MIN_15);
  const [selectedPattern, setSelectedPattern] = useState<string>(PatternType.HAMMER_GREEN);
  const [selectedSlot, setSelectedSlot] = useState<string>("All Day");

  // Scan Results
  const [historicLogs, setHistoricLogs] = useState<ScanResult[]>([]);
  const [liveResults, setLiveResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            
            // Format slot string strictly to match UI drop-down
            const startH = candleDate.getHours();
            const startM = candleDate.getMinutes().toString().padStart(2, '0');
            const endH = nextTime.getHours();
            const endM = nextTime.getMinutes().toString().padStart(2, '0');
            const slotStr = `${startH}:${startM} - ${endH}:${endM}`;
            
            // Filter by slot if not "All Day"
            if (selectedSlot === "All Day" || selectedSlot === slotStr) {
              results.push({
                symbol: stock.symbol,
                timeframe: selectedTimeframe,
                pattern: selectedPattern,
                timeSlot: slotStr,
                timestamp: candleDate.getTime()
              });
            }
          }
        });
      });

      // Sort by latest first
      const sortedResults = results.sort((a, b) => b.timestamp - a.timestamp);

      if (isLive) {
        setLiveResults(sortedResults);
      } else {
        setHistoricLogs(sortedResults);
      }
    } catch (err) {
      console.error("Scanning Error:", err);
    } finally {
      setScanning(false);
      setLoading(false);
    }
  }, [selectedTimeframe, selectedPattern, selectedSlot]);

  // Initial Load
  useEffect(() => {
    runScan(false);
    
    // Auto refresh every 5 minutes for Live Scan
    const intervalId = setInterval(() => {
      runScan(true);
    }, 300000);

    return () => clearInterval(intervalId);
  }, [runScan]);

  const totalPatternsFound = historicLogs.length + liveResults.length;
  const uniqueAffectedStocks = new Set([...historicLogs.map(r => r.symbol), ...liveResults.map(r => r.symbol)]).size;

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <SettingsPanel 
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
          selectedPattern={selectedPattern}
          setSelectedPattern={setSelectedPattern}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Scanner Dashboard</h2>
                <p className="text-sm text-slate-500">
                  {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()} (5-min precision)` : 'Initializing scanner...'}
                </p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => runScan(false)}
                  disabled={scanning}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md flex items-center"
                >
                  <i className={`fas fa-history mr-2 ${scanning ? 'animate-spin' : ''}`}></i>
                  Historical Scan
                </button>
                <button 
                  onClick={() => runScan(true)}
                  disabled={scanning}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md flex items-center"
                >
                  <i className={`fas fa-bolt mr-2 ${scanning ? 'animate-pulse' : ''}`}></i>
                  Live Scan
                </button>
              </div>
            </div>

            <DashboardStats 
              scanned={stocks.length}
              patterns={totalPatternsFound}
              stocks={uniqueAffectedStocks}
              loading={loading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
              <LogsTable 
                title="Historical Logs" 
                icon="fa-book" 
                results={historicLogs} 
                colorClass="bg-slate-700"
              />
              <LogsTable 
                title="Live Scan Results" 
                icon="fa-satellite-dish" 
                results={liveResults} 
                colorClass="bg-indigo-600"
              />
            </div>

            <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Comprehensive Stock Index</h3>
                <div className="text-xs text-slate-400">Total: {stocks.length} instruments tracked</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stocks.slice(0, 48).map(stock => (
                  <div key={stock.symbol} className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer group">
                    <div className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">{stock.symbol}</div>
                    <div className="text-[10px] text-slate-400 mt-1">OHLC Validated</div>
                  </div>
                ))}
                {stocks.length > 48 && (
                  <div className="bg-slate-100 flex items-center justify-center rounded-lg text-[10px] font-bold text-slate-500">
                    + {stocks.length - 48} more stocks
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <footer className="bg-white border-t border-slate-200 px-6 py-2 text-[10px] text-slate-400 flex justify-between">
        <div>System: Time-bucketed grouping active (09:15 Start). Lag-compensation enabled.</div>
        <div>Status: Monitoring Google Sheet at 5-min intervals.</div>
      </footer>
    </div>
  );
};

export default App;

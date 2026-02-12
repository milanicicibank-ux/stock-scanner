
import React from 'react';
import { ScanResult } from '../types';

interface LogsTableProps {
  title: string;
  icon: string;
  results: ScanResult[];
  colorClass: string;
}

const LogsTable: React.FC<LogsTableProps> = ({ title, icon, results, colorClass }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${colorClass}`}>
        <div className="flex items-center space-x-2">
          <i className={`fas ${icon} text-lg`}></i>
          <h2 className="font-semibold text-white">{title}</h2>
        </div>
        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          {results.length} results
        </span>
      </div>
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <i className="fas fa-search mb-2 text-2xl opacity-20"></i>
            <p className="text-sm">No patterns identified yet</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Pattern</th>
                <th className="px-4 py-2">TF</th>
                <th className="px-4 py-2">Slot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.map((r, i) => (
                <tr key={`${r.symbol}-${i}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">{r.symbol}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.pattern.toLowerCase().includes('green') || r.pattern.toLowerCase().includes('bullish') || r.pattern.toLowerCase().includes('morning') 
                      ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {r.pattern}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.timeframe}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{r.timeSlot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LogsTable;

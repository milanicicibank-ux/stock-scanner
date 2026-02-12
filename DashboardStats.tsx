
import React from 'react';

interface StatsProps {
  scanned: number;
  patterns: number;
  stocks: number;
  loading: boolean;
}

const DashboardStats: React.FC<StatsProps> = ({ scanned, patterns, stocks, loading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
        <div className="bg-indigo-100 p-3 rounded-lg mr-4 text-indigo-600">
          <i className="fas fa-layer-group text-xl"></i>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase">Stocks Scanned</p>
          <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : scanned}</h3>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
        <div className="bg-emerald-100 p-3 rounded-lg mr-4 text-emerald-600">
          <i className="fas fa-bullseye text-xl"></i>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase">Patterns Found</p>
          <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : patterns}</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
        <div className="bg-blue-100 p-3 rounded-lg mr-4 text-blue-600">
          <i className="fas fa-microchip text-xl"></i>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase">Stocks Affected</p>
          <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : stocks}</h3>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;

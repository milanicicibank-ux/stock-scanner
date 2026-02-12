
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-indigo-700 text-white p-4 shadow-lg flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <i className="fas fa-chart-line text-2xl"></i>
        <h1 className="text-xl font-bold tracking-tight">ProScan OHLC Terminal</h1>
      </div>
      <div className="text-sm font-medium opacity-80">
        Index & FNO Stocks Real-time Scanner
      </div>
    </header>
  );
};

export default Header;

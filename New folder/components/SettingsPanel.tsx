
import React from 'react';
import { TIMEFRAMES, PATTERN_LIST } from '../constants';
import { getTimeSlots } from '../services/scannerService';

interface SettingsPanelProps {
  selectedTimeframe: string;
  setSelectedTimeframe: (tf: string) => void;
  selectedPattern: string;
  setSelectedPattern: (p: string) => void;
  selectedSlot: string;
  setSelectedSlot: (s: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedTimeframe, setSelectedTimeframe,
  selectedPattern, setSelectedPattern,
  selectedSlot, setSelectedSlot
}) => {
  const slots = getTimeSlots(selectedTimeframe);

  return (
    <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col space-y-8 overflow-y-auto">
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Time Frame</label>
        <select 
          value={selectedTimeframe}
          onChange={(e) => {
            setSelectedTimeframe(e.target.value);
            setSelectedSlot("All Day");
          }}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
        >
          {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Target Patterns</label>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {PATTERN_LIST.map(p => (
            <label key={p} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors border border-transparent hover:border-slate-100">
              <input 
                type="radio" 
                name="pattern" 
                checked={selectedPattern === p}
                onChange={() => setSelectedPattern(p)}
                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" 
              />
              <span className="text-sm text-slate-700">{p}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Time Slot Filter</label>
        <select 
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
        >
          <option value="All Day">All Day (Historical)</option>
          {slots.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="pt-4 mt-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700 flex items-start">
            <i className="fas fa-info-circle mt-0.5 mr-2"></i>
            Historical scan runs from 9:00 AM data. Live scan updates every 5 mins.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

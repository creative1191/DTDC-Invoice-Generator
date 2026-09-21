import React, { useState, useEffect } from 'react';
import { Minus, Square, X, ShieldCheck, Printer } from 'lucide-react';
import { CourierType } from '../types';
import { COURIER_CONFIGS } from '../data/courierConfigs';

interface WindowsTitlebarProps {
  onPrint?: () => void;
  activeLabel?: string;
  currentCourier?: CourierType;
  onSelectCourier?: (c: CourierType) => void;
}

export const WindowsTitlebar: React.FC<WindowsTitlebarProps> = ({
  onPrint,
  activeLabel,
  currentCourier = 'DTDC',
  onSelectCourier,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const config = COURIER_CONFIGS[currentCourier] || COURIER_CONFIGS.DTDC;

  return (
    <div className="bg-[#0b1c3c] text-white px-3 py-2 flex items-center justify-between select-none border-b border-[#1a2f5a] no-print">
      {/* Left: App icon and title */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-[#07132a] border border-[#254378] flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
          <img src="/favicon.svg" alt="App Icon" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs tracking-wide">
            {config.name} Bill Generator — Multi-Courier Desktop Suite
          </span>
          <span className="bg-emerald-600/80 text-[10px] text-white px-1.5 py-0.2 rounded font-mono font-medium">
            EXE READY
          </span>
          {activeLabel && (
            <span className="text-[11px] text-blue-200 hidden md:inline">
              | Current: <strong className="text-white">{activeLabel}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Center: System Status & Time */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-blue-200">
        <div className="flex items-center gap-1.5 bg-[#122b5e] px-2 py-0.5 rounded text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active: <strong className="text-white">{config.shortName}</strong></span>
        </div>
        <span className="font-mono text-xs text-white bg-black/30 px-2 py-0.5 rounded">
          {timeStr || '01:30 PM'}
        </span>
      </div>

      {/* Right: Window Controls & Quick Print */}
      <div className="flex items-center gap-1">
        {onPrint && (
          <button
            onClick={onPrint}
            title="Quick Direct Print (Ctrl+P)"
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1 rounded transition-colors mr-2 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-semibold">Direct Print</span>
          </button>
        )}

        <button
          onClick={() => {}}
          title="Minimize"
          className="w-7 h-6 flex items-center justify-center hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsMaximized(!isMaximized)}
          title={isMaximized ? 'Restore' : 'Maximize'}
          className="w-7 h-6 flex items-center justify-center hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <Square className="w-3 h-3" />
        </button>

        <button
          onClick={() => {}}
          title="Close"
          className="w-7 h-6 flex items-center justify-center hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { FileText, Layers, Code2, Sun, Settings } from 'lucide-react';
import { CourierConfig } from '../types';

interface WorkspaceNavBarProps {
  activeTab: 'generator' | 'label-printing' | 'build-files';
  onSelectTab: (tab: 'generator' | 'label-printing' | 'build-files') => void;
  currentConfig: CourierConfig;
  currentAwb: string;
  onOpenSettings: () => void;
}

export const WorkspaceNavBar: React.FC<WorkspaceNavBarProps> = React.memo(({
  activeTab,
  onSelectTab,
  currentConfig,
  currentAwb,
  onOpenSettings,
}) => {
  return (
    <div className="bg-[#122b5e] text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xs no-print">
      {/* Left: Tab switch buttons */}
      <div className="flex items-center gap-1.5 bg-[#0a1e45] p-1 rounded-lg border border-[#1d3d82]">
        <button
          type="button"
          onClick={() => onSelectTab('generator')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'generator'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-200 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Bill Generator & Print</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('label-printing')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'label-printing'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-blue-200 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Label Printing</span>
          <span className="text-[10px] bg-emerald-500/40 text-emerald-100 font-bold px-1.5 py-0.5 rounded-full ml-0.5">
            4-Up A4
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('build-files')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'build-files'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-blue-200 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Windows EXE & GitHub</span>
        </button>
      </div>

      {/* Center: Realtime Stats */}
      <div className="hidden lg:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 bg-[#0c234b] px-3 py-1 rounded-md border border-[#1b3d7a]">
          <span className="text-blue-300 font-semibold text-[10px] uppercase">Active Courier</span>
          <span className="font-bold text-white text-sm">{currentConfig.shortName}</span>
        </div>
        <div className="flex items-center gap-2 bg-[#0c234b] px-3 py-1 rounded-md border border-[#1b3d7a]">
          <span className="text-blue-300 font-semibold text-[10px] uppercase">AWB/Waybill</span>
          <span className="font-bold text-emerald-400 font-mono text-xs">{currentAwb}</span>
        </div>
        <div className="flex items-center gap-2 bg-[#0c234b] px-3 py-1 rounded-md border border-[#1b3d7a]">
          <span className="text-blue-300 font-semibold text-[10px] uppercase">Depot</span>
          <span className="font-bold text-blue-200 text-xs">Satna (MP)</span>
        </div>
      </div>

      {/* Right: Depot and Rules */}
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-blue-200 bg-[#0a1e45] px-2.5 py-1 rounded border border-[#1d3d82]">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Satna Depot 30°C</span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer border border-white/10"
          title="Locked Settings & Logo Management"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Locked Rules</span>
        </button>
      </div>
    </div>
  );
});

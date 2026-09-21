import React from 'react';
import { CourierType } from '../types';
import { COURIER_CONFIGS } from '../data/courierConfigs';
import { CourierLogo } from './CourierLogo';

interface CourierTabsProps {
  selectedCourier: CourierType;
  onSelectCourier: (courier: CourierType) => void;
}

const COURIER_LIST: CourierType[] = ['DTDC', 'BLUEDART', 'DELHIVERY'];

export const CourierTabs: React.FC<CourierTabsProps> = React.memo(({
  selectedCourier,
  onSelectCourier,
}) => {
  const currentConfig = COURIER_CONFIGS[selectedCourier] || COURIER_CONFIGS.DTDC;

  return (
    <div className="bg-[#0b1c3c] border-b border-[#1f3769] px-3 md:px-5 py-2.5 select-none no-print shadow-sm">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider hidden lg:inline mr-1">
            Select Courier:
          </span>

          {COURIER_LIST.map((courier) => {
            const config = COURIER_CONFIGS[courier];
            const isActive = selectedCourier === courier;
            const activeClass =
              courier === 'DTDC'
                ? 'bg-[#0f2854] text-white border-red-500 shadow-md ring-2 ring-red-500/40'
                : courier === 'BLUEDART'
                ? 'bg-[#003875] text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                : 'bg-[#1a2230] text-white border-red-500 shadow-md ring-2 ring-red-500/40';

            const badgeColor =
              courier === 'BLUEDART' ? 'bg-emerald-500' : 'bg-red-500';

            return (
              <button
                key={courier}
                type="button"
                onClick={() => onSelectCourier(courier)}
                className={`flex items-center gap-3 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                  isActive
                    ? activeClass
                    : 'bg-[#071735] text-gray-300 hover:text-white hover:bg-[#0e244d] border-[#1d386c]'
                }`}
              >
                <div className="bg-white h-9 w-[130px] sm:w-[150px] px-2.5 py-1 rounded-lg border border-gray-200/90 shadow-2xs flex items-center justify-center shrink-0">
                  <CourierLogo courier={courier} className="h-6 w-full" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs tracking-tight">{config.name}</span>
                    {isActive && (
                      <span className={`${badgeColor} text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider`}>
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-blue-200 font-normal">
                    {courier === 'DTDC' && 'Consignment Note • 7D/7X'}
                    {courier === 'BLUEDART' && 'Domestic Waybill • 82 AWB'}
                    {courier === 'DELHIVERY' && 'Surface / Air Parcel • 14 AWB'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
          <span className="text-gray-400 text-[11px]">Format:</span>
          <span className="font-bold text-white font-mono">
            {currentConfig.docTitle}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>
    </div>
  );
});

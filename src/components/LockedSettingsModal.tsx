import React from 'react';
import { Lock, ShieldCheck, Check, AlertTriangle, FileText, Sliders } from 'lucide-react';

interface LockedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customLogoUrl: string | null;
  onLogoUpload: (url: string | null) => void;
}

export const LockedSettingsModal: React.FC<LockedSettingsModalProps> = ({
  isOpen,
  onClose,
  customLogoUrl,
  onLogoUpload,
}) => {
  if (!isOpen) return null;

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onLogoUpload(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-[#0c2340] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-yellow-400" />
            <div>
              <h2 className="font-bold text-sm">DTDC Locked Format & System Settings</h2>
              <p className="text-[11px] text-blue-200">my_dtdc_settings.json — Strict Layout Rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded text-gray-200 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Rule 1: Logo */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>1. Custom Logo (Dark Blue with Red Dot)</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                LOCKED
              </span>
            </div>
            <p className="text-gray-600 mb-2">
              Active logo format uses dark blue corporate DTDC lettering with red signature dot.
            </p>
            <div className="flex items-center gap-3">
              <label className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-semibold px-3 py-1.5 rounded border border-gray-300 cursor-pointer shadow-2xs">
                Upload Custom Logo File (PNG)
                <input type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
              </label>
              {customLogoUrl && (
                <button
                  onClick={() => onLogoUpload(null)}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  Reset to Official Vector Logo
                </button>
              )}
            </div>
          </div>

          {/* Rule 2: Consignor Priority */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>2. Consignor Priority Logic</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </div>
            <p className="text-gray-600">
              Manual consignor input in the interface takes strict priority over any scanned text
              from customer images.
            </p>
          </div>

          {/* Rule 3: Courier Charges Format */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>3. Courier Charges Style (Simple Bordered Box Only)</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                STRICT
              </span>
            </div>
            <p className="text-gray-600">
              Formatted as a clean, bordered box: <code className="bg-yellow-100 px-1 font-bold">Courier Charges: ₹ [AMOUNT]</code>. No breakup like Freight, Fuel, GST, Tax, Discount, Subtotal, or Grand Total is added.
            </p>
          </div>

          {/* Rule 4: Negative Directives */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Negative Directives Enforced:</span>
            </div>
            <ul className="list-disc list-inside text-amber-800 space-y-0.5">
              <li>Do not invent missing values — leave blank if unstated in document.</li>
              <li>Preserve original spelling, capitalization, and numbers.</li>
              <li>Do not alter DTDC layout, borders, font weights, or barcode positions.</li>
              <li>Preserve exact 200mm x 92mm per-copy metrics on 3-copies portrait sheets.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-[#0c2340] hover:bg-[#122b5e] text-white font-semibold text-xs px-4 py-2 rounded-md transition-colors cursor-pointer"
          >
            Close & Apply Rules
          </button>
        </div>
      </div>
    </div>
  );
};

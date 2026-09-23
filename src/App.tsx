import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { DTDCBillData, PresetLabel, OCRMatchResult, CourierType } from './types';
import { INITIAL_BILL_DATA } from './data/defaults';
import { COURIER_CONFIGS, COURIER_PRESETS, generateAwbNumber } from './data/courierConfigs';
import { WindowsTitlebar } from './components/WindowsTitlebar';
import { CourierTabs } from './components/CourierTabs';
import { WorkspaceNavBar } from './components/WorkspaceNavBar';
import { QuickPresetsBar } from './components/QuickPresetsBar';
import { ConsignorForm } from './components/ConsignorForm';
import { CourierChargesCard } from './components/CourierChargesCard';
import { ConsigneeForm } from './components/ConsigneeForm';
import { ShipmentSpecsForm } from './components/ShipmentSpecsForm';
import { BookingBranchCard } from './components/BookingBranchCard';
import { BillExportBar } from './components/BillExportBar';
import { PrintSheet } from './components/PrintSheet';
import { SnipToolHandler } from './components/SnipToolHandler';
import { PythonBuildExport } from './components/PythonBuildExport';
import { LockedSettingsModal } from './components/LockedSettingsModal';
import { LabelPrintingManager } from './components/LabelPrinting/LabelPrintingManager';
import { downloadBillAsPdf, downloadBillAsPng, downloadBillAsHtml } from './utils/exportHelpers';
import { cleanAddressString } from './utils/ocrParser';

export default function App() {
  const [selectedCourier, setSelectedCourier] = useState<CourierType>('DTDC');
  const [billData, setBillData] = useState<DTDCBillData>(() => ({
    ...INITIAL_BILL_DATA,
    courier: 'DTDC',
  }));
  const [activeTab, setActiveTab] = useState<'generator' | 'label-printing' | 'build-files'>('generator');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('dtdc-dharmendra-220');

  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Memoized configuration and presets for zero-lag rendering
  const currentConfig = useMemo(
    () => COURIER_CONFIGS[selectedCourier] || COURIER_CONFIGS.DTDC,
    [selectedCourier]
  );
  const currentPresets = useMemo(
    () => COURIER_PRESETS[selectedCourier] || COURIER_PRESETS.DTDC,
    [selectedCourier]
  );

  // Direct print handler
  const handleDirectPrint = useCallback(() => {
    window.print();
  }, []);

  // Keyboard shortcut Ctrl+P for direct printing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleDirectPrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirectPrint]);

  // Switch courier tab handler
  const handleSwitchCourier = useCallback((courier: CourierType) => {
    setSelectedCourier(courier);
    const config = COURIER_CONFIGS[courier];
    setBillData((prev) => {
      const isDefaultProductOfAny = Object.values(COURIER_CONFIGS).some((c) =>
        c.defaultProducts.includes(prev.product)
      );

      return {
        ...prev,
        courier,
        product: isDefaultProductOfAny ? config.defaultProducts[0] : prev.product,
        awb: generateAwbNumber(courier),
      };
    });

    const presets = COURIER_PRESETS[courier];
    if (presets && presets.length > 0) {
      setActivePresetId(presets[0].id);
    }
  }, []);

  // Field change helper
  const updateField = useCallback((field: keyof DTDCBillData, value: any) => {
    setBillData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Generate new AWB for current courier
  const handleGenerateNewAwb = useCallback(() => {
    const newAwb = generateAwbNumber(selectedCourier);
    updateField('awb', newAwb);
  }, [selectedCourier, updateField]);

  // OCR extraction callback
  const handleOcrExtracted = useCallback((extracted: OCRMatchResult, detectedAwb?: string) => {
    // If OCR detected a different courier, sync active courier tab
    if (extracted.detectedCourier && extracted.detectedCourier !== selectedCourier) {
      handleSwitchCourier(extracted.detectedCourier);
    }

    setBillData((prev) => {
      const targetConsigneeName = extracted.consigneeName || prev.consigneeName;
      const cleanConsigneeAddr = cleanAddressString(
        extracted.consigneeAddress !== undefined ? extracted.consigneeAddress : prev.consigneeAddress,
        targetConsigneeName
      );

      return {
        ...prev,
        courier: extracted.detectedCourier || prev.courier || selectedCourier,
        awb: extracted.awb || detectedAwb || prev.awb,
        origin: extracted.origin || prev.origin,
        dest: extracted.dest || prev.dest,
        product: extracted.product || prev.product,
        type: extracted.type || prev.type,
        mode: extracted.mode || prev.mode,
        date: extracted.date || prev.date,
        consigneeName: targetConsigneeName,
        consigneeAddress: cleanConsigneeAddr,
        consigneePhone: extracted.consigneePhone || prev.consigneePhone,
        consignorName: extracted.consignorName || prev.consignorName,
        consignorAddress: extracted.consignorAddress || prev.consignorAddress,
        consignorPhone: extracted.consignorPhone || prev.consignorPhone,
        consignorGstin: extracted.consignorGstin || prev.consignorGstin,
        contentSpec: extracted.contentSpec || prev.contentSpec,
        declaredValue: extracted.declaredValue || prev.declaredValue,
        pieces: extracted.pieces || prev.pieces,
        actualWeight: extracted.actualWeight || prev.actualWeight,
        chargedWeight: extracted.chargedWeight || prev.chargedWeight,
        dim: extracted.dim || prev.dim,
        courierCharges: extracted.courierCharges !== undefined ? extracted.courierCharges : prev.courierCharges,
      };
    });
  }, [selectedCourier, handleSwitchCourier]);

  // Clear old data button logic
  const handleClearOldData = useCallback(() => {
    setBillData((prev) => ({
      ...prev,
      courier: selectedCourier,
      awb: generateAwbNumber(selectedCourier),
      customerRefNo: '',
      consigneeName: '',
      consigneeAddress: '',
      consigneePhone: '',
      consigneeGstin: '',
      consigneeEmail: '',
      origin: 'SATNA',
      dest: '',
      contentSpec: '',
      paperworkEnclosed: '',
      declaredValue: 'Not Applicable',
      actualWeight: '',
      chargedWeight: '',
      dim: '10 cm X 10 cm X 10 cm',
      ewaybillNumber: '',
      remark: '',
    }));
  }, [selectedCourier]);

  // Preset selector
  const applyPreset = useCallback((preset: PresetLabel) => {
    setActivePresetId(preset.id);
    setBillData((prev) => ({
      ...prev,
      courier: selectedCourier,
      ...preset.data,
    }));
  }, [selectedCourier]);

  // Apply frequent consignor
  const applyFrequentConsignor = useCallback((consignor: { name: string; address: string; phone: string }) => {
    setBillData((prev) => ({
      ...prev,
      consignorName: consignor.name,
      consignorAddress: consignor.address,
      consignorPhone: consignor.phone,
    }));
  }, []);

  // Export handlers
  const handleExportPng = useCallback(async (highRes = true) => {
    if (!printAreaRef.current) return;
    setIsExporting(true);
    setExportNotice(`Generating ${highRes ? '300 DPI High-Res' : 'Standard'} PNG...`);
    try {
      await downloadBillAsPng(printAreaRef.current, billData, highRes);
      setExportNotice('✅ PNG Downloaded Successfully!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      setExportNotice('Error generating PNG');
    } finally {
      setIsExporting(false);
    }
  }, [billData]);

  const handleExportPdf = useCallback(async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);
    setExportNotice('Compiling print-ready PDF...');
    try {
      await downloadBillAsPdf(printAreaRef.current, billData);
      setExportNotice('✅ PDF Downloaded Successfully!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      setExportNotice('Error generating PDF');
    } finally {
      setIsExporting(false);
    }
  }, [billData]);

  const handleExportHtml = useCallback(() => {
    downloadBillAsHtml(billData);
    setExportNotice('✅ HTML File Downloaded!');
    setTimeout(() => setExportNotice(null), 3000);
  }, [billData]);

  return (
    <div className="min-h-screen bg-[#f1f4f9] text-[#1c1d1f] flex flex-col antialiased">
      {/* 1. Windows Native Titlebar */}
      <WindowsTitlebar
        onPrint={handleDirectPrint}
        activeLabel={billData.awb}
        currentCourier={selectedCourier}
        onSelectCourier={handleSwitchCourier}
      />

      {/* 2. Top Courier Selection Tabs (DTDC / Blue Dart / Delhivery) */}
      <CourierTabs
        selectedCourier={selectedCourier}
        onSelectCourier={handleSwitchCourier}
      />

      {/* 3. Dashboard Navigation & Status Bar */}
      <WorkspaceNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentConfig={currentConfig}
        currentAwb={billData.awb}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* 4. Main Workspace Container */}
      <main className="flex-1 p-3 md:p-4 max-w-[1920px] w-full mx-auto">
        {activeTab === 'build-files' && (
          <div className="no-print">
            <PythonBuildExport />
          </div>
        )}

        {activeTab === 'label-printing' && (
          <div>
            <LabelPrintingManager />
          </div>
        )}

        {activeTab === 'generator' && (
          <div>
            {/* Top Quick Presets Bar for Selected Courier */}
            <QuickPresetsBar
              currentConfig={currentConfig}
              currentPresets={currentPresets}
              activePresetId={activePresetId}
              onApplyPreset={applyPreset}
              layoutMode={billData.layoutMode}
              paperSaveMode={billData.paperSaveMode}
              onUpdateField={updateField}
            />

            {/* Split Screen Layout: Editor on Left, Live Print Sheet on Right */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              {/* LEFT COLUMN: Input Form & Controls (5 Cols on xl) */}
              <div className="xl:col-span-5 space-y-3 no-print">
                <SnipToolHandler
                  onDataExtracted={handleOcrExtracted}
                  onClearOldData={handleClearOldData}
                  currentAwb={billData.awb}
                  currentCourier={selectedCourier}
                  onSelectCourier={handleSwitchCourier}
                />

                <ConsignorForm
                  billData={billData}
                  onUpdateField={updateField}
                  onApplyConsignor={applyFrequentConsignor}
                />

                <CourierChargesCard
                  charges={billData.courierCharges}
                  onUpdateField={updateField}
                />

                <ConsigneeForm
                  billData={billData}
                  onUpdateField={updateField}
                />

                <ShipmentSpecsForm
                  billData={billData}
                  currentConfig={currentConfig}
                  onUpdateField={updateField}
                  onGenerateNewAwb={handleGenerateNewAwb}
                />

                <BookingBranchCard
                  billData={billData}
                  onUpdateField={updateField}
                />
              </div>

              {/* RIGHT COLUMN: Real-Time Preview & Quick Export Toolbar (7 Cols on xl) */}
              <div className="xl:col-span-7 space-y-3">
                <BillExportBar
                  currentConfig={currentConfig}
                  billData={billData}
                  isExporting={isExporting}
                  onDirectPrint={handleDirectPrint}
                  onExportPdf={handleExportPdf}
                  onExportPng={handleExportPng}
                  onExportHtml={handleExportHtml}
                  onUpdateField={updateField}
                />

                {exportNotice && (
                  <div className="p-2 bg-blue-50 border border-blue-200 text-blue-900 rounded text-xs font-semibold flex items-center justify-between no-print animate-fadeIn">
                    <span>{exportNotice}</span>
                    <span className="text-[10px] text-blue-600">{currentConfig.shortName} System</span>
                  </div>
                )}

                {/* PREVIEW CONTAINER: EXACT A4 CANVAS */}
                <div className="invoice-preview-wrapper bg-[#e4e7ee] p-2 md:p-4 rounded-xl border border-gray-300 shadow-inner overflow-x-auto flex justify-center">
                  <PrintSheet
                    data={billData}
                    customLogoUrl={customLogoUrl}
                    sheetRef={printAreaRef}
                  />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-2.5 text-[11px] text-gray-600 flex items-center justify-between no-print">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Official {currentConfig.shortName} layout active: Code128 barcode, 200x92mm copies, POD signature block & custom logo enabled.
                    </span>
                  </div>
                  <span className="font-mono text-gray-500 font-semibold">
                    {currentConfig.website} verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 5. Locked Settings Modal */}
      <LockedSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        customLogoUrl={customLogoUrl}
        onLogoUpload={(url) => setCustomLogoUrl(url)}
      />
    </div>
  );
}

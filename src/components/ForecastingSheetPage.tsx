import { useState, useRef, useCallback, useEffect } from 'react';
import { ForecastGrid } from './ForecastGrid';
import { importFromExcel, exportToExcel } from '../utils/excelUtils';
import { ForecastRow, FORECAST_TYPES, MONTHS } from '../types/forecast';
import { supabase } from '../utils/supabaseClient';

export function ForecastingSheetPage() {
  const [rowData, setRowData] = useState<ForecastRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------- Supabase helpers --------

  const loadRowsFromSupabase = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('project_sheets') // table name: adjust if needed
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase load error:', error);
      setIsLoading(false);
      return;
    }

    setRowData((data || []) as ForecastRow[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadRowsFromSupabase();
  }, [loadRowsFromSupabase]);

  const addRow = useCallback(async () => {
    const newRow: ForecastRow = {
      id: crypto.randomUUID(),
      sheet_name: 'New Sheet',
      forecast_type: FORECAST_TYPES[0],
      month: MONTHS[0],
      budget: 0,
      actuals: 0,
      etc: 0,
      eac: 0,
      etcOverride: false,
    };

    // Optimistic update
    setRowData((prev) => [...prev, newRow]);

    const { error } = await supabase.from('project_sheets').insert(newRow);
    if (error) {
      console.error('Supabase insert error:', error);
      // optional rollback if you actually care
    }
  }, []);

  const resetData = useCallback(async () => {
    // For now, just reload whatever is in Supabase
    await loadRowsFromSupabase();
  }, [loadRowsFromSupabase]);

  // -------- Import / Export --------

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const importedRows = await importFromExcel(file);

        if (importedRows.length === 0) {
          alert(
            'No data found in the Excel file. Please ensure the file has data starting from row 2.'
          );
          return;
        }

        // Give each imported row an id if missing
        const normalizedRows: ForecastRow[] = importedRows.map((row) => ({
          id: row.id || crypto.randomUUID(),
          sheet_name: row.sheet_name ?? 'Imported Sheet',
          forecast_type: row.forecast_type ?? FORECAST_TYPES[0],
          month: row.month ?? MONTHS[0],
          budget: row.budget ?? 0,
          actuals: row.actuals ?? 0,
          etc: row.etc ?? 0,
          eac: row.eac ?? 0,
          etcOverride: row.etcOverride ?? false,
        }));

        setRowData(normalizedRows);

        // Brutal but simple: wipe and reinsert
        const { error: deleteError } = await supabase
          .from('project_sheets')
          .delete()
          .neq('id', ''); // delete all rows

        if (deleteError) {
          console.error('Supabase delete error during import:', deleteError);
        }

        const { error: insertError } = await supabase
          .from('project_sheets')
          .insert(normalizedRows);

        if (insertError) {
          console.error('Supabase insert error during import:', insertError);
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import Excel file. Please check the file format.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    []
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportToExcel(rowData, 'demo-forecast-export.xlsx');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export to Excel.');
    } finally {
      setIsExporting(false);
    }
  }, [rowData]);

  // -------- Render --------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-925 via-slate-900 to-slate-850">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">
              Project Forecasting Sheet
            </h1>
          </div>
          <div className="flex flex-wrap gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase tracking-wider text-xs font-medium">
                Company
              </span>
              <span className="text-slate-200 font-medium px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                Demo Corp
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase tracking-wider text-xs font-medium">
                Project
              </span>
              <span className="text-slate-200 font-medium px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                Demo Forecast
              </span>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            onClick={addRow}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-all duration-150 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Row
          </button>

          <button
            onClick={resetData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-all duration-150 border border-slate-600 hover:border-slate-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset Data
          </button>

          <div className="w-px h-8 bg-slate-700 mx-1" />

          <button
            onClick={handleImportClick}
            disabled={isImporting || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-all duration-150 border border-slate-600 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {isImporting ? 'Importing...' : 'Import from Excel'}
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting || rowData.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-all duration-150 border border-slate-600 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Grid Container */}
        <div className="bg-white rounded-xl shadow-2xl shadow-black/40 overflow-hidden border border-slate-200/10">
          {isLoading ? (
            <div className="h-[480px] flex items-center justify-center text-sm text-slate-500">
              Loading forecast data...
            </div>
          ) : (
            <ForecastGrid rowData={rowData} onRowDataChange={setRowData} />
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              {rowData.length} row{rowData.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400/20 border border-amber-400/30" />
              <span>ETC manually overridden</span>
            </span>
          </div>
          <span>Double-click a cell to edit · Click "View" for details</span>
        </div>
      </div>
    </div>
  );
}

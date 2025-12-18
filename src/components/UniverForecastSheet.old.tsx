import { useEffect, useRef } from 'react';
import { Univer } from '@univerjs/core';
import { ForecastRow } from '../types/forecast';

import {
    createUniver,
    defaultTheme,
    LocaleType,
    merge,
} from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
// import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import EnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { FUniver } from '@univerjs/core/facade';
import { supabase } from '../utils/supabaseClient';

// Import Univer styles
import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/docs-ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';
import '@univerjs/sheets-formula-ui/lib/index.css';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';

import '@univerjs/sheets/facade';

interface UniverForecastSheetProps {
    row: ForecastRow;
}

export function UniverForecastSheet({ row }: UniverForecastSheetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const univerRef = useRef<Univer | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const { univerAPI, univer } = createUniver({
            locale: LocaleType.EN_US,
            locales: { enUS: merge({}, EnUS) },
            theme: defaultTheme,
            presets: [UniverSheetsCorePreset({ container: containerRef.current })],
        });

        // -----------------------------
        // CREATE WORKBOOK
        // -----------------------------

        // Define headers and data for dynamic column sizing
        const headers = [
            { v: 'Sheet Name', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
            { v: 'Forecast Type', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
            { v: 'Month', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
            { v: 'Budget', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
            { v: 'Actuals', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
            { v: 'ETC', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
            { v: 'EAC', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
        ];

        const dataValues: Array<{ v: string | number | null }> = [
            { v: row.sheet_name },
            { v: row.forecast_type },
            { v: row.month },
            { v: row.budget },
            { v: row.actuals },
            { v: row.etc },
            { v: row.eac },
        ];

        // Build cellData dynamically
        const headerRow: Record<number, { v: string; s?: object }> = {};
        const dataRow: Record<number, { v: string | number | null }> = {};

        headers.forEach((header, index) => {
            headerRow[index] = header;
        });

        dataValues.forEach((cell, index) => {
            dataRow[index] = cell;
        });

        const columnCount = headers.length;

        console.log('row.sheet_json', row.sheet_json);

        if (row.sheet_json) {
            univerAPI.createWorkbook({
                id: 'forecast-detail',
                name: 'Forecast Detail',
                sheets: {
                    sheet1: row.sheet_json,
                },
                sheetOrder: ['sheet1'],
            });
        } else {
            univerAPI.createWorkbook({
                id: 'forecast-detail',
                name: 'Forecast Detail',
                sheets: {
                    sheet1: {
                        id: 'sheet1',
                        name: 'Forecast Detail',
                        rowCount: 100,
                        columnCount,
                        showGridlines: 1,
                        freeze: { startRow: 0, startColumn: 0, xSplit: 0, ySplit: 1 },
                        cellData: {
                            0: headerRow,
                            1: dataRow,
                        },
                    },
                },
                sheetOrder: ['sheet1'],
            });
        }

        const api = FUniver.newAPI(univer);
        const workbook = api.getActiveWorkbook();
        const sheet = workbook?.getActiveSheet();

        // -----------------------------
        // HANDLE VALUE CHANGES
        // -----------------------------

        const disposable = api.addEvent(api.Event.SheetValueChanged, async (params) => {
            if (!sheet) return;

            const { payload } = params as any;

            const subUnitId = payload?.params?.subUnitId || undefined;

            // Only handle our active sheet
            if (subUnitId !== sheet.getSheetId()) return;

            const cellValue = payload?.params?.cellValue as
                | Record<number, Record<number, { v: unknown }>>
                | undefined;

            if (!cellValue) return;

            const updated: Partial<ForecastRow> = {};

            // cellValue = { [rowIndex]: { [colIndex]: { v, ... } } }
            for (const [rowKey, colMap] of Object.entries(cellValue)) {
                const rowIndex = Number(rowKey);

                // Only track data row (row 2 -> index 1)
                if (rowIndex !== 1) continue;

                for (const [colKey, cell] of Object.entries(colMap as Record<string, { v: unknown }>)) {
                    const colIndex = Number(colKey);
                    const value = cell?.v;

                    switch (colIndex) {
                        case 0:
                            updated.sheet_name = String(value ?? '');
                            break;
                        case 1:
                            updated.forecast_type = String(value ?? '') as ForecastRow['forecast_type'];
                            break;
                        case 2:
                            updated.month = String(value ?? '');
                            break;
                        case 3:
                            updated.budget = Number(value ?? 0);
                            break;
                        case 4:
                            updated.actuals = Number(value ?? 0);
                            break;
                        case 5:
                            updated.etc = Number(value ?? 0);
                            break;
                        case 6:
                            updated.eac = Number(value ?? 0);
                            break;
                        default:
                            // ignore other columns for now
                            break;
                    }
                }
            }

            if (Object.keys(updated).length === 0) return;

            // Merge with original row
            const merged: ForecastRow = { ...row, ...updated };

            // get the sheet json from the row
            const sheetJson =sheet.getSheet().getSnapshot();

            // If budget or actuals changed, recompute ETC/EAC
            if (updated.budget !== undefined || updated.actuals !== undefined) {
                merged.etc = merged.budget - merged.actuals;
                merged.eac = merged.actuals + merged.etc;

                // Push recomputed values back into sheet
                sheet.getRange(1, 5).setValue(merged.etc); // F2
                sheet.getRange(1, 6).setValue(merged.eac); // G2
            }

            // Persist to Supabase
            const { error } = await supabase
                .from('project_sheets')
                .update({
                    sheet_name: merged.sheet_name,
                    forecast_type: merged.forecast_type,
                    month: merged.month,
                    budget: merged.budget,
                    actuals: merged.actuals,
                    etc: merged.etc,
                    eac: merged.eac,
                    sheet_json: sheetJson,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', merged.id);

            if (error) {
                console.error('Supabase update error:', error);
            }
        });

        return () => {
            disposable.dispose();
            univer.dispose();
        };
    }, [row.id]);

    return (
        <div
            ref={containerRef}
            id="univer"
            className="univer-workbook-container"
            style={{
                width: '100%',
                height: '600px',
                background: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
            }}
        />
    );
}

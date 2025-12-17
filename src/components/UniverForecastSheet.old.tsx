import { useEffect, useRef } from 'react';
import { Univer, IWorkbookData, BooleanNumber } from '@univerjs/core';
import { ForecastRow } from '../types/forecast';

import {
    createUniver,
    defaultTheme,
    LocaleType,
    merge,
  } from '@univerjs/presets';
  import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
  import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';

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

function createWorkbookData(row: ForecastRow): IWorkbookData {


    const columnCount = Object.keys(row).length - 2;

    return {
        id: 'forecast-workbook',
        name: 'Forecast Workbook',
        appVersion: '1.0.0',
        locale: LocaleType.EN_US,
        sheetOrder: ['sheet-1'],
        styles: {},
        sheets: {
            'sheet-1': {
                id: 'sheet-1',
                name: 'Forecast Detail',
                tabColor: '',
                hidden: BooleanNumber.FALSE,
                rowCount: 100,
                columnCount,
                zoomRatio: 1,
                showGridlines: BooleanNumber.TRUE,
                defaultColumnWidth: 100,
                defaultRowHeight: 24,
                freeze: {
                    xSplit: 0,
                    ySplit: 1,
                    startRow: 1,
                    startColumn: 0,
                },
                cellData: {
                    // Row 1: Headers
                    0: {
                        0: { v: 'Sheet Name', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                        1: { v: 'Forecast Type', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                        2: { v: 'Month', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                        3: { v: 'Budget', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                        4: { v: 'Actuals', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                        5: { v: 'ETC', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                        6: { v: 'EAC', s: { bl: 1, bg: { rgb: '#f1f5f9' } } },
                    },
                    // Row 2: Data from the selected row
                    1: {
                        0: { v: row.sheet_name || '' },
                        1: { v: row.forecast_type },
                        2: { v: row.month },
                        3: { v: row.budget, t: 2 },
                        4: { v: row.actuals, t: 2 },
                        5: { v: row.etc, t: 2 },
                        6: { v: row.eac, t: 2 },
                    },
                },
                columnData: {
                    0: { w: 180 }, // A - Line Item
                    1: { w: 140 }, // B - Forecast Type
                    2: { w: 100 }, // C - Month
                    3: { w: 100 }, // D - Budget
                    4: { w: 100 }, // E - Actuals
                    5: { w: 100 }, // F - ETC
                    6: { w: 100 }, // G - EAC
                },
                rowData: {
                    0: { h: 32 }, // Header row height
                },
            },
        },
    };
}

export function UniverForecastSheet({ row }: UniverForecastSheetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const univerRef = useRef<Univer | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const { univerAPI } = createUniver({
            locale: LocaleType.EN_US,
            locales: {
              enUS: merge({}, UniverPresetSheetsCoreEnUS),
            },
            theme: defaultTheme,
            presets: [
              UniverSheetsCorePreset({
                container: 'univer',
              }),
            ],
          });
          
        //   univerAPI.createWorkbook({ name: 'My first workbook' });
          univerAPI.createWorkbook(createWorkbookData(row));
        

        // Cleanup on unmount
        return () => {
            if (univerRef.current) {
                univerRef.current.dispose();
                univerRef.current = null;
            }
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

import { useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ValueFormatterParams,
  CellValueChangedEvent,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ForecastRow, FORECAST_TYPES, MONTHS } from '../types/forecast';
import { calculateETC, calculateEAC, formatCurrency } from '../utils/forecastCalculations';
import { supabase } from '../utils/supabaseClient';

interface ForecastGridProps {
  rowData: ForecastRow[];
  onRowDataChange: (data: ForecastRow[]) => void;
}

// Cell renderer for the Actions column
function ViewButtonRenderer(props: ICellRendererParams<ForecastRow>) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (props.data) {
      navigate(`/rows/${props.data.id}`, { state: { row: props.data } });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors duration-150"
    >
      View
    </button>
  );
}

export function ForecastGrid({ rowData, onRowDataChange }: ForecastGridProps) {
  const gridRef = useRef<AgGridReact<ForecastRow>>(null);

  const numberFormatter = useCallback((params: ValueFormatterParams) => {
    if (params.value == null) return '';
    return formatCurrency(params.value);
  }, []);

  const columnDefs = useMemo<ColDef<ForecastRow>[]>(() => [
    {
      headerName: 'Sheet Name',
      field: 'sheet_name',
      editable: true,
      flex: 2,
      minWidth: 180,
    },
    {
      headerName: 'Forecast Type',
      field: 'forecast_type',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: FORECAST_TYPES,
      },
      flex: 1.5,
      minWidth: 150,
    },
    {
      headerName: 'Month',
      field: 'month',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: MONTHS,
      },
      flex: 1,
      minWidth: 110,
    },
    {
      headerName: 'Budget',
      field: 'budget',
      editable: true,
      type: 'numericColumn',
      valueFormatter: numberFormatter,
      cellEditor: 'agNumberCellEditor',
      filter: 'agNumberColumnFilter',
      flex: 1,
      minWidth: 110,
    },
    {
      headerName: 'Actuals',
      field: 'actuals',
      editable: true,
      type: 'numericColumn',
      valueFormatter: numberFormatter,
      cellEditor: 'agNumberCellEditor',
      filter: 'agNumberColumnFilter',
      flex: 1,
      minWidth: 110,
    },
    {
      headerName: 'ETC',
      field: 'etc',
      editable: true,
      type: 'numericColumn',
      valueFormatter: numberFormatter,
      cellEditor: 'agNumberCellEditor',
      filter: 'agNumberColumnFilter',
      flex: 1,
      minWidth: 110,
      cellStyle: (params) => {
        if (params.data?.etcOverride) {
          return { backgroundColor: 'rgba(251, 191, 36, 0.15)', fontStyle: 'italic' };
        }
        return null;
      },
      headerTooltip: 'Estimate to Complete (Budget - Actuals). Editable for manual override.',
    },
    {
      headerName: 'EAC',
      field: 'eac',
      editable: false,
      type: 'numericColumn',
      valueFormatter: numberFormatter,
      filter: 'agNumberColumnFilter',
      flex: 1,
      minWidth: 110,
      cellStyle: { backgroundColor: 'rgba(59, 130, 246, 0.08)' },
      headerTooltip: 'Estimate at Completion (Actuals + ETC)',
    },
    {
      headerName: 'Actions',
      field: 'id',
      sortable: false,
      filter: false,
      editable: false,
      width: 100,
      minWidth: 100,
      maxWidth: 100,
    
      // Only show View button on normal rows
      cellRendererSelector: (params) => {
        // Detect pinned bottom row
        if (params.node.rowPinned === 'bottom') {
          return { component: null }; // no renderer
        }
        return { component: ViewButtonRenderer };
      },
    },
  ], [numberFormatter]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    // floatingFilter: true,
  }), []);

  const pinnedBottomRowData = useMemo(() => {
    if (!rowData || rowData.length === 0) return [];
  
    const total = rowData.reduce(
      (acc, row) => {
        acc.budget += row.budget || 0;
        acc.actuals += row.actuals || 0;
        acc.etc += row.etc || 0;
        acc.eac += row.eac || 0;
        return acc;
      },
      {
        id: '',
        sheetName: '',
        forecastType: '',
        month: '',
        budget: 0,
        actuals: 0,
        etc: 0,
        eac: 0,
        etcOverride: false,
      }
    );
  
    return [total];
  }, [rowData]);

  // const onCellValueChanged = useCallback(
  //   (event: CellValueChangedEvent<ForecastRow>) => {

  //     console.log('onCellValueChanged', event);

  //     const { data, colDef } = event;
  //     if (!data) return;

  //     const field = colDef.field as keyof ForecastRow;

  //     console.log('field', field);

  //     const updatedData = rowData.map((row) => {
  //       if (row.id !== data.id) return row;

  //       let updatedRow: ForecastRow = { ...row, ...data };

  //       // Handle ETC manual override
  //       if (field === 'etc') {
  //         updatedRow.etcOverride = true;
  //         updatedRow.eac = calculateEAC(updatedRow.actuals, updatedRow.etc);
  //       }
  //       // Handle Budget or Actuals change
  //       else if (field === 'budget' || field === 'actuals') {
  //         if (!updatedRow.etcOverride) {
  //           updatedRow.etc = calculateETC(updatedRow.budget, updatedRow.actuals);
  //         }
  //         updatedRow.eac = calculateEAC(updatedRow.actuals, updatedRow.etc);
  //       }

  //       return updatedRow;
  //     });

  //     console.log('After updatedRow');

  //     onRowDataChange(updatedData);

  //     // Persist to Supabase (fire and forget)
  //     (async () => {
  //       const updatedRow = updatedData.find((r) => r.id === data.id);

  //       console.log('updatedRow', updatedRow);
        
  //       if (!updatedRow) return;

  //       const { error } = await supabase
  //         .from('project_sheets')
  //         .update({
  //           sheet_name: updatedRow.sheet_name,
  //           forecast_type: updatedRow.forecast_type,
  //           month: updatedRow.month,
  //           budget: updatedRow.budget,
  //           actuals: updatedRow.actuals,
  //           etc: updatedRow.etc,
  //           eac: updatedRow.eac,
  //           // etcOverride: updatedRow.etcOverride,
  //           updated_at: new Date().toISOString(),
  //         })
  //         .eq('id', updatedRow.id);

  //       if (error) {
  //         console.error('Supabase update error:', error);
  //       }
  //     })();
  //   },
  //   [rowData, onRowDataChange]
  // );

  const onGridReady = useCallback((_event: GridReadyEvent) => {
    // no-op for now
  }, []);

  return (
    <div className="ag-theme-alpine w-full" style={{ height: '480px' }}>
      <AgGridReact<ForecastRow>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        // onCellValueChanged={onCellValueChanged}
        onGridReady={onGridReady}
        animateRows={true}
        getRowId={(params) => params.data.id}
        suppressRowClickSelection={true}
        stopEditingWhenCellsLoseFocus={true}
        pinnedBottomRowData={pinnedBottomRowData}
      />
    </div>
  );
}

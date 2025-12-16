import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ForecastRow } from '../types/forecast';
import { initialMockData } from '../data/mockData';
import { createNewRow } from '../utils/forecastCalculations';

interface ForecastContextType {
  rowData: ForecastRow[];
  setRowData: (data: ForecastRow[]) => void;
  getRowById: (id: string) => ForecastRow | undefined;
  addRow: () => void;
  resetData: () => void;
}

const ForecastContext = createContext<ForecastContextType | null>(null);

export function ForecastProvider({ children }: { children: ReactNode }) {
  const [rowData, setRowData] = useState<ForecastRow[]>(initialMockData);

  const getRowById = useCallback((id: string): ForecastRow | undefined => {
    return rowData.find(row => row.id === id);
  }, [rowData]);

  const addRow = useCallback(() => {
    setRowData(prev => [...prev, createNewRow()]);
  }, []);

  const resetData = useCallback(() => {
    setRowData([...initialMockData]);
  }, []);

  return (
    <ForecastContext.Provider value={{ rowData, setRowData, getRowById, addRow, resetData }}>
      {children}
    </ForecastContext.Provider>
  );
}

export function useForecast(): ForecastContextType {
  const context = useContext(ForecastContext);
  if (!context) {
    throw new Error('useForecast must be used within a ForecastProvider');
  }
  return context;
}


import { ForecastRow } from '../types/forecast';
import { calculateETC, calculateEAC } from '../utils/forecastCalculations';

function createRow(
  id: string,
  sheet_name: string,
  forecast_type: 'Commitment based' | 'Time based',
  month: 'Jan 2026' | 'Feb 2026' | 'Mar 2026' | 'Apr 2026' | 'May 2026' | 'Jun 2026',
  budget: number,
  actuals: number
): ForecastRow {
  const etc = calculateETC(budget, actuals);
  const eac = calculateEAC(actuals, etc);
  return {
    id,
    sheet_name,
    forecast_type,
    month,
    budget,
    actuals,
    etc,
    etcOverride: false,
    eac,
  };
}

export const initialMockData: ForecastRow[] = [
  createRow('1', 'Software Licenses', 'Commitment based', 'Jan 2026', 50000, 12500),
  createRow('2', 'Cloud Infrastructure', 'Time based', 'Jan 2026', 75000, 28000),
  createRow('3', 'Contractor Services', 'Commitment based', 'Feb 2026', 120000, 45000),
  createRow('4', 'Equipment Lease', 'Time based', 'Feb 2026', 35000, 8750),
  createRow('5', 'Marketing Campaign', 'Commitment based', 'Mar 2026', 60000, 15000),
];


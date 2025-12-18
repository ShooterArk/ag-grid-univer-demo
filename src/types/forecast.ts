export type ForecastType = 'Commitment based' | 'Time based';

export type Month = 'Jan 2026' | 'Feb 2026' | 'Mar 2026' | 'Apr 2026' | 'May 2026' | 'Jun 2026';

export interface ForecastRow {
  id: string;
  sheet_name: string;
  forecast_type: ForecastType;
  month: Month | any;
  budget: number;
  actuals: number;
  etc: number;        // Estimate to Complete (Budget - Actuals, but can be overridden)
  etcOverride: boolean; // Flag to track if ETC was manually edited
  eac: number;        // Estimate at Completion (Actuals + ETC)
  sheet_json?: any
}

export const FORECAST_TYPES: ForecastType[] = ['Commitment based', 'Time based'];

export const MONTHS: Month[] = [
  'Jan 2026',
  'Feb 2026',
  'Mar 2026',
  'Apr 2026',
  'May 2026',
  'Jun 2026',
];


import { ForecastRow, ForecastType, Month, FORECAST_TYPES, MONTHS } from '../types/forecast';

/**
 * Calculate ETC (Estimate to Complete)
 * Default: Budget - Actuals
 */
export function calculateETC(budget: number, actuals: number): number {
  return Math.max(0, budget - actuals);
}

/**
 * Calculate EAC (Estimate at Completion)
 * Formula: Actuals + ETC
 */
export function calculateEAC(actuals: number, etc: number): number {
  return actuals + etc;
}

/**
 * Create a new forecast row with default values
 */
export function createNewRow(): ForecastRow {
  const id = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const budget = 0;
  const actuals = 0;
  const etc = calculateETC(budget, actuals);
  const eac = calculateEAC(actuals, etc);

  return {
    id,
    lineItem: '',
    forecastType: 'Commitment based',
    month: 'Jan 2026',
    budget,
    actuals,
    etc,
    etcOverride: false,
    eac,
  };
}

/**
 * Update calculated fields when budget or actuals change
 */
export function recalculateRow(row: ForecastRow): ForecastRow {
  const etc = row.etcOverride ? row.etc : calculateETC(row.budget, row.actuals);
  const eac = calculateEAC(row.actuals, etc);

  return {
    ...row,
    etc,
    eac,
  };
}

/**
 * Format a number to 2 decimal places
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse a value to a valid forecast type, or return default
 */
export function parseForecastType(value: string): ForecastType {
  const normalized = value?.trim();
  if (FORECAST_TYPES.includes(normalized as ForecastType)) {
    return normalized as ForecastType;
  }
  return 'Commitment based';
}

/**
 * Parse a value to a valid month, or return default
 */
export function parseMonth(value: string): Month {
  const normalized = value?.trim();
  if (MONTHS.includes(normalized as Month)) {
    return normalized as Month;
  }
  return 'Jan 2026';
}

/**
 * Parse a number value safely
 */
export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}


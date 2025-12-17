import ExcelJS from 'exceljs';
import { ForecastRow } from '../types/forecast';
import {
  calculateETC,
  calculateEAC,
  parseForecastType,
  parseMonth,
  parseNumber,
} from './forecastCalculations';

/**
 * Import forecast data from an Excel file
 */
export async function importFromExcel(file: File): Promise<ForecastRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in the Excel file');
  }

  const rows: ForecastRow[] = [];
  let rowIndex = 0;

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row (first row)
    if (rowNumber === 1) return;

    const sheet_name = String(row.getCell(1).value ?? '').trim();
    const forecast_type = parseForecastType(String(row.getCell(2).value ?? ''));
    const month = parseMonth(String(row.getCell(3).value ?? ''));
    const budget = parseNumber(row.getCell(4).value);
    const actuals = parseNumber(row.getCell(5).value);
    const etc = calculateETC(budget, actuals);
    const eac = calculateEAC(actuals, etc);

    rows.push({
      id: `import-${Date.now()}-${rowIndex++}`,
      sheet_name,
      forecast_type,
      month,
      budget,
      actuals,
      etc,
      etcOverride: false,
      eac,
    });
  });

  return rows;
}

/**
 * Export forecast data to an Excel file
 */
export async function exportToExcel(data: ForecastRow[], filename: string = 'forecast-export.xlsx'): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Tarek MVP';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Forecast');

  // Define columns
  worksheet.columns = [
    { header: 'Sheet Name', key: 'lineItem', width: 25 },
    { header: 'Forecast Type', key: 'forecastType', width: 18 },
    { header: 'Month', key: 'month', width: 12 },
    { header: 'Budget', key: 'budget', width: 15 },
    { header: 'Actuals', key: 'actuals', width: 15 },
    { header: 'ETC', key: 'etc', width: 15 },
    { header: 'EAC', key: 'eac', width: 15 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A5F' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 24;

  // Add data rows
  data.forEach((row) => {
    worksheet.addRow({
      sheet_name: row.sheet_name,
      forecast_type: row.forecast_type,
      month: row.month,
      budget: row.budget,
      actuals: row.actuals,
      etc: row.etc,
      eac: row.eac,
    });
  });

  // Format number columns
  ['D', 'E', 'F', 'G'].forEach((col) => {
    worksheet.getColumn(col).numFmt = '#,##0.00';
    worksheet.getColumn(col).alignment = { horizontal: 'right' };
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };
      if (rowNumber > 1) {
        cell.alignment = { vertical: 'middle' };
      }
    });
    if (rowNumber > 1) {
      row.height = 22;
    }
  });

  // Generate blob and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


# Tarek MVP - Project Forecasting Sheet

A minimal MVP for a cost forecasting SaaS feature, focused on an Excel-like forecasting table with detail view.

## Features

- **AG Grid Table** with editable cells for line items, forecast types, months, budgets, and actuals
- **Auto-calculated fields**: ETC (Estimate to Complete) and EAC (Estimate at Completion)
- **Manual override**: ETC can be manually edited (highlighted with amber background)
- **Actions column**: View button to navigate to detail page for each row
- **Detail Page**: Univer-powered Excel-like view of individual forecast rows
- **Excel Import**: Upload `.xlsx` files to populate the grid
- **Excel Export**: Download current grid data as a formatted Excel file
- **Add/Reset Rows**: Quickly add new rows or reset to initial mock data

## Tech Stack

- React + TypeScript
- React Router v7 (navigation)
- AG Grid (data grid)
- Univer (Excel-like detail view)
- ExcelJS (Excel import/export)
- Tailwind CSS (styling)
- Vite (build tool)

## Getting Started

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── ForecastingSheetPage.tsx   # Main page with grid and toolbar
│   ├── ForecastGrid.tsx           # AG Grid wrapper with Actions column
│   ├── ForecastRowDetailPage.tsx  # Detail page for individual rows
│   └── UniverDetailSheet.tsx      # Univer workbook component
├── context/
│   └── ForecastContext.tsx        # Shared state for forecast data
├── data/
│   └── mockData.ts                # Initial sample data
├── types/
│   └── forecast.ts                # TypeScript interfaces
├── utils/
│   ├── forecastCalculations.ts    # ETC/EAC calculation helpers
│   └── excelUtils.ts              # Excel import/export functions
├── App.tsx                        # Router setup
├── main.tsx
└── index.css
```

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | ForecastingSheetPage | Main grid view with all forecast rows |
| `/rows/:id` | ForecastRowDetailPage | Detail view for a single forecast row |

## Table Columns

| Column | Description | Editable |
|--------|-------------|----------|
| Line Item | Description of the forecast item | Yes |
| Forecast Type | "Commitment based" or "Time based" | Yes (dropdown) |
| Month | Jan 2026 - Jun 2026 | Yes (dropdown) |
| Budget | Budgeted amount | Yes |
| Actuals | Actual spent amount | Yes |
| ETC | Estimate to Complete (Budget - Actuals) | Yes (override) |
| EAC | Estimate at Completion (Actuals + ETC) | No (calculated) |
| Actions | View button to see row details | N/A |

## Excel Import Format

When importing, the Excel file should have:
- Row 1: Headers (skipped)
- Column A: Line Item
- Column B: Forecast Type
- Column C: Month
- Column D: Budget
- Column E: Actuals

## License

MIT

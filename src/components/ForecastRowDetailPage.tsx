import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ForecastRow } from '../types/forecast';
import { supabase } from '../utils/supabaseClient';
import { UniverForecastSheet } from './UniverForecastSheet.old';

export function ForecastRowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<ForecastRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data, error } = await supabase
        .from('project_sheets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // Convert snake_case → camelCase
      const rowData: ForecastRow = {
        id: data.id,
        sheet_name: data.sheet_name,
        forecast_type: data.forecast_type,
        month: data.month,
        budget: data.budget,
        actuals: data.actuals,
        etc: data.etc,
        eac: data.eac,
        etcOverride: data.etc_override ?? false,
        sheet_json: data.sheet_json,
      };

      setRow(rowData);
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading row...
      </div>
    );
  }

  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Row not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-925 via-slate-900 to-slate-850">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white text-sm mb-6"
        >
          ← Back to sheet
        </button>

        <h1 className="text-3xl font-semibold text-white mb-2">Forecast Detail</h1>

        <p className="text-slate-400 mb-4">
          Line Item: <span className="text-white">{row.sheet_name}</span>
        </p>

        <div className="rounded-xl overflow-hidden border border-slate-700/30">
          <UniverForecastSheet row={row} />
        </div>

      </div>
    </div>
  );
}

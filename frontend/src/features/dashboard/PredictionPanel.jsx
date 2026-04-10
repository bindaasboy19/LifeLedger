import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar
} from 'recharts';
import SectionCard from '../../components/common/SectionCard.jsx';
import { api } from '../../lib/api.js';

const REGIONS = ['all', 'Delhi', 'Mumbai', 'Bengaluru'];

export default function PredictionPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [region, setRegion] = useState('all');
  const [health, setHealth] = useState({ status: 'checking', aiService: 'checking', mongo: 'checking' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [healthResponse, response] = await Promise.all([
        api.get('/ai/health').catch(() => null),
        api.post('/ai/predict', region === 'all' ? {} : { region })
      ]);

      if (healthResponse?.data?.data) {
        setHealth(healthResponse.data.data);
      } else {
        setHealth({ status: 'degraded', aiService: 'down', mongo: 'unknown' });
      }

      setData(response.data.data);
    } catch (err) {
      setError('Prediction service is temporarily unavailable.');
      setData(null);
      setHealth({ status: 'degraded', aiService: 'down', mongo: 'unknown' });
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    load();
  }, [load]);

  const topRisks = useMemo(() => {
    if (!data?.predictions) return [];
    return [...data.predictions]
      .sort((a, b) => b.shortage_risk_score - a.shortage_risk_score)
      .slice(0, 8)
      .map((item) => ({
        key: `${item.region}-${item.blood_group}`,
        label: `${item.region} ${item.blood_group}`,
        risk: Number(item.shortage_risk_score.toFixed(2))
      }));
  }, [data]);

  const trend = useMemo(() => {
    if (!data?.aggregate_daily_forecast) return [];
    return data.aggregate_daily_forecast.map((item) => ({
      day: item.day,
      demand: Number(item.predicted_demand.toFixed(1))
    }));
  }, [data]);

  return (
    <SectionCard
      title="AI Demand Forecast"
      subtitle="7-day blood demand prediction, shortage risk, and fallback resilience"
      action={
        <div className="flex items-center gap-2">
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white/70 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
          >
            {REGIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      }
    >
      {loading ? <p className="text-sm">Generating prediction...</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {data?.warning ? (
        <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          {data.warning}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-200 px-3 py-1 dark:bg-slate-800">
              AI Service: {health.aiService || 'unknown'}
            </span>
            <span className="rounded-full bg-slate-200 px-3 py-1 dark:bg-slate-800">
              Mongo: {health.mongo || 'unknown'}
            </span>
            <span className="rounded-full bg-slate-200 px-3 py-1 dark:bg-slate-800">
              Source: {data.source || 'unknown'}
            </span>
            <span className="rounded-full bg-slate-200 px-3 py-1 dark:bg-slate-800">
              Generated: {data.generated_at ? new Date(data.generated_at).toLocaleString() : 'n/a'}
            </span>
            <span className="rounded-full bg-slate-200 px-3 py-1 dark:bg-slate-800">
              Signals: {data.predictions?.length || 0}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-xl bg-white/60 p-2 dark:bg-slate-900/50">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="demand" stroke="#0a7dff" strokeWidth={3} name="Predicted demand" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-xl bg-white/60 p-2 dark:bg-slate-900/50">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRisks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={0} angle={-25} height={70} textAnchor="end" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="risk" fill="#dc2626" name="Shortage risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        !loading && <p className="text-sm text-slate-500">Prediction data is not available right now.</p>
      )}
    </SectionCard>
  );
}

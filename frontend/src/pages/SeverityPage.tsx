import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Cloud,
  Car,
  Lightbulb,
  ShieldAlert,
  GitBranch,
  Gauge,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getSeverityAnalytics } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const SeverityPage: React.FC = () => {
  const { selectedCity } = useCityFilter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['severity', selectedCity],
    queryFn: () => getSeverityAnalytics(selectedCity),
  });

  if (isLoading) {
    return <LoadingSpinner message="Analyzing road infrastructure & weather risk factors..." />;
  }

  if (isError || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
        Failed to fetch severity factor distributions. Please ensure the backend is running.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
          <Gauge className="w-3.5 h-3.5" />
          <span>Infrastructure & Environment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Road Factors & Crash Severity Guide
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          How speed corridors, road geometry, traffic signals, and weather patterns influence collision severity in {selectedCity || 'major Indian metros'}.
        </p>
      </div>

      {/* Road Type vs Severity Breakdown (Stacked Bar Chart) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-600" />
              Road Classification vs Collision Severity
            </h2>
            <p className="text-xs text-slate-500">
              Severity distribution across Highways, Urban Arterials, Local Streets, and Rural corridors
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            20k Verified Crashes
          </span>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.road_type_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="road_type" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '12px',
                  color: '#0F172A',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="minor" stackId="a" fill="#10B981" name="Minor / Property Damage" />
              <Bar dataKey="severe" stackId="a" fill="#F59E0B" name="Severe / Major Injury" />
              <Bar dataKey="fatal" stackId="a" fill="#EF4444" name="Fatal Collision" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Signals & Weather Impacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Signals Safety Impact */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Traffic Signal Infrastructure Safety Multiplier
            </h2>
            <p className="text-xs text-slate-500">Fatality rate at signalized intersections vs uncontrolled crossings</p>
          </div>

          <div className="space-y-3 pt-2">
            {data.traffic_signal_impact.map((sig, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  sig.has_signal
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-950'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">
                    {sig.has_signal ? '🟢 Signalized Intersection' : '⚪ Uncontrolled Crossing (No Signal)'}
                  </div>
                  <div className="text-xs opacity-75 mt-0.5">
                    {sig.total.toLocaleString()} crashes recorded in dataset
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold font-mono">
                    {sig.fatal_rate}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider">Fatal Proportion</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Conditions Impact */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              Weather Condition Hazard Ratios
            </h2>
            <p className="text-xs text-slate-500">Crash frequency and fatality percentage across ambient weather</p>
          </div>

          <div className="space-y-3 pt-2">
            {data.weather_impact.map((w, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">{w.weather} Weather</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{w.total.toLocaleString()} recorded collisions</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold font-mono text-slate-900">{w.fatal_rate}% Fatal</div>
                  <div className="text-[10px] text-slate-500">{w.fatal} Fatalities</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeverityPage;

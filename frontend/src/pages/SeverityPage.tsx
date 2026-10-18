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
  ShieldCheck
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
      <div className="p-6 rounded-xl bg-accent-critical/10 border border-accent-critical/30 text-accent-critical text-sm">
        Failed to fetch severity factor distributions. Please ensure the backend is running.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-border-dark pb-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold mb-2">
          <Gauge className="w-3.5 h-3.5" />
          <span>Infrastructure & Environment</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Road Factors & Crash Severity Guide
        </h1>
        <p className="text-sm text-text-muted mt-1">
          How speed corridors, road geometry, traffic signals, and weather patterns influence collision severity in {selectedCity || 'major Indian metros'}.
        </p>
      </div>

      {/* Road Type vs Severity Breakdown (Stacked Bar Chart) */}
      <div className="bg-bg-card border border-border-dark rounded-xl p-6 shadow-card-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-accent-primary" />
              Road Classification vs Collision Severity
            </h2>
            <p className="text-xs text-text-muted">
              Severity distribution across Highways, Urban Arterials, Local Streets, and Rural corridors
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-bg-surface text-text-muted border border-border-dark">
            20k Verified Crashes
          </span>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.road_type_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2B45" vertical={false} />
              <XAxis dataKey="road_type" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121A2D',
                  borderColor: '#1E2B45',
                  borderRadius: '10px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.8)',
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                formatter={(val) => <span className="text-xs text-text-main font-medium">{val}</span>}
              />
              <Bar dataKey="minor" stackId="a" fill="#10B981" name="Minor Damage" />
              <Bar dataKey="severe" stackId="a" fill="#F59E0B" name="Severe Injury" />
              <Bar dataKey="fatal" stackId="a" fill="#EF4444" name="Fatal Impact" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environmental Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Conditions & Fatal Ratio */}
        <div className="bg-bg-card border border-border-dark rounded-xl p-5 shadow-card-dark space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-dark">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-accent-primary" />
              Weather Conditions Impact
            </h3>
            <span className="text-[10px] font-mono text-text-muted">Fatality Ratio</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {data.weather_impact.map((w) => (
              <div key={w.weather} className="p-3 rounded-lg bg-bg-surface/60 border border-border-dark">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-text-main font-medium">{w.weather}</span>
                  <span className={w.fatal_rate > 15 ? 'text-accent-critical font-bold' : 'text-text-muted'}>
                    {w.fatal_rate}% Fatal
                  </span>
                </div>
                <div className="w-full bg-bg-main h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${w.fatal_rate > 15 ? 'bg-accent-critical' : 'bg-accent-primary'}`}
                    style={{ width: `${Math.min(100, w.fatal_rate * 4)}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-subtle block mt-1.5">
                  {w.total.toLocaleString()} total incidents recorded
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Density Impact */}
        <div className="bg-bg-card border border-border-dark rounded-xl p-5 shadow-card-dark space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-dark">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-accent-warning" />
              Traffic Density Stratification
            </h3>
            <span className="text-[10px] font-mono text-text-muted">Impact</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {data.traffic_density_impact.map((d) => (
              <div key={d.density} className="p-3 rounded-lg bg-bg-surface/60 border border-border-dark">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-text-main font-medium">{d.density} Congestion</span>
                  <span className="text-accent-warning font-bold">{d.fatal_rate}% Fatal</span>
                </div>
                <div className="w-full bg-bg-main h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-warning"
                    style={{ width: `${Math.min(100, d.fatal_rate * 4)}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-subtle block mt-1.5">
                  {d.total.toLocaleString()} crashes | {d.fatal} fatal
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Signal Control Impact */}
        <div className="bg-bg-card border border-border-dark rounded-xl p-5 shadow-card-dark space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-dark">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-accent-success" />
              Traffic Signal Protection
            </h3>
            <span className="text-[10px] font-mono text-text-muted">Control</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {data.traffic_signal_impact.map((s) => (
              <div key={String(s.has_signal)} className="p-3 rounded-lg bg-bg-surface/60 border border-border-dark">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-text-main font-medium">
                    {s.has_signal ? '🟢 Signalized Junction' : '⚪ Uncontrolled Road'}
                  </span>
                  <span className={s.has_signal ? 'text-accent-success font-bold' : 'text-accent-critical font-bold'}>
                    {s.fatal_rate}% Fatal
                  </span>
                </div>
                <div className="w-full bg-bg-main h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full ${s.has_signal ? 'bg-accent-success' : 'bg-accent-critical'}`}
                    style={{ width: `${Math.min(100, s.fatal_rate * 4)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-subtle">
                  <span>Total: {s.total.toLocaleString()}</span>
                  <span>Fatal: {s.fatal} crashes</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-bg-surface/40 border border-border-dark text-[11px] text-text-muted leading-relaxed">
            Traffic signals enforce speed mitigation and right-of-way clarity, reducing severe T-bone collisions by over 40%.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeverityPage;

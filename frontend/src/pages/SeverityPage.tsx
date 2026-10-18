import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Cloud,
  Car,
  Lightbulb,
  ShieldAlert,
  GitBranch,
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
import { MetricCard } from '../components/common/MetricCard';
import { AlertBanner } from '../components/common/AlertBanner';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const SeverityPage: React.FC = () => {
  const { selectedCity } = useCityFilter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['severity', selectedCity],
    queryFn: () => getSeverityAnalytics(selectedCity),
  });

  if (isLoading) {
    return <LoadingSpinner message="Evaluating environmental & infrastructural severity dynamics..." />;
  }

  if (isError || !data) {
    return (
      <AlertBanner type="critical" title="Severity Analytics Error">
        Failed to fetch severity factor distributions.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <AlertBanner type="warning" title="Ex-Ante vs Ex-Post Risk Factors">
        Severity analysis evaluates infrastructural and environmental factors present <em>before</em> the collision.
        Post-crash outcomes (such as victim casualties or immediate crash causes) are strictly isolated from predictive modeling to uphold data integrity.
      </AlertBanner>

      {/* Road Type vs Severity Breakdown (Stacked Bar Chart) */}
      <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-accent-primary" />
              Road Infrastructure Classification vs Crash Severity
            </h2>
            <p className="text-xs text-text-muted">
              Severity stratifications (Minor, Severe, Fatal) across reported roadway classifications
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-dark">
            Infrastructure Stack
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.road_type_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243247" vertical={false} />
              <XAxis dataKey="road_type" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111B2B',
                  borderColor: '#243247',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                formatter={(val) => <span className="text-xs text-text-main font-medium">{val}</span>}
              />
              <Bar dataKey="minor" stackId="a" fill="#34D399" name="Minor Incident" />
              <Bar dataKey="severe" stackId="a" fill="#FBBF24" name="Severe Injury" />
              <Bar dataKey="fatal" stackId="a" fill="#F87171" name="Fatal Accident" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environmental Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Conditions & Fatal Ratio */}
        <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-accent-primary" />
              Weather Conditions Impact
            </h3>
            <span className="text-[10px] font-mono text-text-muted">Fatality Ratio</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {data.weather_impact.map((w) => (
              <div key={w.weather} className="p-2.5 rounded bg-bg-surface border border-border-dark">
                <div className="flex justify-between items-center mb-1">
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
                <span className="text-[10px] text-text-subtle block mt-1">
                  {w.total.toLocaleString()} total incidents recorded
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Density Impact */}
        <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-accent-warning" />
              Traffic Density Stratification
            </h3>
            <span className="text-[10px] font-mono text-text-muted">Impact</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {data.traffic_density_impact.map((d) => (
              <div key={d.density} className="p-2.5 rounded bg-bg-surface border border-border-dark">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-text-main font-medium">{d.density} Density</span>
                  <span className="text-accent-warning font-bold">{d.fatal_rate}% Fatal</span>
                </div>
                <div className="w-full bg-bg-main h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-warning"
                    style={{ width: `${Math.min(100, d.fatal_rate * 4)}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-subtle block mt-1">
                  {d.total.toLocaleString()} crashes | {d.fatal} fatal
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Signal Control Impact */}
        <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-accent-success" />
              Traffic Signal Control Presence
            </h3>
            <span className="text-[10px] font-mono text-text-muted">Control</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {data.traffic_signal_impact.map((s) => (
              <div key={String(s.has_signal)} className="p-3 rounded bg-bg-surface border border-border-dark">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-text-main font-medium">
                    {s.has_signal ? 'Signal Controlled Junction' : 'Uncontrolled Roadway'}
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

          <div className="mt-4 p-2.5 rounded bg-bg-main border border-border-dark text-[11px] text-text-muted leading-relaxed">
            Traffic signals act as speed mitigators, reducing high-speed impact collisions and resulting in lower fatal proportions.
          </div>
        </div>
      </div>
    </div>
  );
};

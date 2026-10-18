import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Calendar,
  Sun,
  Moon,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getTemporalAnalytics } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { MetricCard } from '../components/common/MetricCard';
import { AlertBanner } from '../components/common/AlertBanner';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const TemporalAnalyticsPage: React.FC = () => {
  const { selectedCity } = useCityFilter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['temporal', selectedCity],
    queryFn: () => getTemporalAnalytics(selectedCity),
  });

  if (isLoading) {
    return <LoadingSpinner message="Aggregating multi-temporal diurnal time-series..." />;
  }

  if (isError || !data) {
    return (
      <AlertBanner type="critical" title="Temporal Analytics Feed Error">
        Failed to aggregate temporal crash profiles.
      </AlertBanner>
    );
  }

  const peakWindow = data.diurnal_hourly.reduce(
    (max, cur) => (cur.total > max.total ? cur : max),
    data.diurnal_hourly[0]
  );

  return (
    <div className="space-y-6">
      {/* Top Temporal Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="PEAK ACCIDENT HOUR"
          value={`${peakWindow.hour}:00`}
          subtitle={`${peakWindow.total.toLocaleString()} total incidents recorded`}
          icon={Clock}
          variant="warning"
          badge="Rush Window"
        />

        <MetricCard
          title="WEEKEND FATAL RATE"
          value={
            data.weekend_vs_weekday.find((w) => w.category === 'Weekend')?.fatal_rate !== undefined
              ? `${data.weekend_vs_weekday.find((w) => w.category === 'Weekend')?.fatal_rate}%`
              : 'N/A'
          }
          subtitle="Saturday & Sunday fatal share"
          icon={AlertTriangle}
          variant="critical"
          badge="Weekend"
        />

        <MetricCard
          title="WEEKDAY FATAL RATE"
          value={
            data.weekend_vs_weekday.find((w) => w.category === 'Weekday')?.fatal_rate !== undefined
              ? `${data.weekend_vs_weekday.find((w) => w.category === 'Weekday')?.fatal_rate}%`
              : 'N/A'
          }
          subtitle="Monday – Friday fatal share"
          icon={Activity}
          variant="primary"
          badge="Weekday"
        />

        <MetricCard
          title="DATASET SPAN"
          value="40 Months"
          subtitle="Jan 2022 — Apr 2025"
          icon={Calendar}
          variant="default"
          badge="Coverage"
        />
      </div>

      {/* 24-Hour Diurnal Progression Chart */}
      <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-primary" />
              24-Hour Diurnal Accident Progression & Severity Breakdown
            </h2>
            <p className="text-xs text-text-muted">
              Diurnal distribution of accidents across hours 00:00 to 23:00 with severity stratifications
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-dark">
            Diurnal Rhythm
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.diurnal_hourly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorFatal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F87171" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#F87171" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#243247" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(val) => `${val}:00`}
                tickLine={false}
              />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111B2B',
                  borderColor: '#243247',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '12px',
                }}
                labelFormatter={(label) => `Time: ${label}:00 hrs`}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                formatter={(val) => <span className="text-xs text-text-main font-medium">{val}</span>}
              />
              <Area type="monotone" dataKey="total" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Incidents" />
              <Area type="monotone" dataKey="severe" stroke="#FBBF24" strokeWidth={1.5} fillOpacity={0} fill="#FBBF24" name="Severe Crashes" />
              <Area type="monotone" dataKey="fatal" stroke="#F87171" strokeWidth={2} fillOpacity={1} fill="url(#colorFatal)" name="Fatal Crashes" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Day of Week & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of the Week Chart */}
        <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-secondary" />
                Weekly Distribution & Fatality Rates
              </h2>
              <p className="text-xs text-text-muted">Incident volume by day of week with fatal incidence</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-dark">
              7-Day Cycle
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.day_of_week} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243247" vertical={false} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111B2B',
                    borderColor: '#243247',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'fatal' ? `${val} Fatalities` : `${val} Incidents`,
                    name === 'fatal' ? 'Fatalities' : 'Total Incidents',
                  ]}
                />
                <Bar dataKey="total" fill="#818CF8" radius={[4, 4, 0, 0]} name="Total Volume" />
                <Bar dataKey="fatal" fill="#F87171" radius={[4, 4, 0, 0]} name="Fatal Volume" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend 2022-2025 */}
        <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-success" />
                Multi-Year Longitudinal Trend (2022–2025)
              </h2>
              <p className="text-xs text-text-muted">Monthly longitudinal crash frequency across recorded history</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-dark">
              Historical Series
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly_trend} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243247" vertical={false} />
                <XAxis
                  dataKey="month_year"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  interval={3}
                  angle={-20}
                  textAnchor="end"
                />
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
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={false}
                  name="Monthly Total"
                />
                <Line
                  type="monotone"
                  dataKey="fatal"
                  stroke="#F87171"
                  strokeWidth={1.5}
                  dot={false}
                  name="Monthly Fatal"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

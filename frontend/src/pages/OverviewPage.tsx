import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  BrainCircuit,
  MapPin,
  TrendingUp,
  Activity,
  ArrowRight,
  Database
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getOverview } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { MetricCard } from '../components/common/MetricCard';
import { AlertBanner } from '../components/common/AlertBanner';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const SEVERITY_COLORS: { [key: string]: string } = {
  Fatal: '#F87171',
  Severe: '#FBBF24',
  Minor: '#34D399',
};

export const OverviewPage: React.FC = () => {
  const { selectedCity } = useCityFilter();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['overview', selectedCity],
    queryFn: () => getOverview(selectedCity),
  });

  if (isLoading) {
    return <LoadingSpinner message="Synthesizing multi-city risk intelligence..." />;
  }

  if (isError || !data) {
    return (
      <AlertBanner type="critical" title="Telemetry Feed Error">
        Failed to load overview data from the backend engine. Ensure the FastAPI service is active.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <AlertBanner type="info" title="Research Benchmark & Scientific Grounding">
        This platform evaluates recorded accident telemetry (2022 – 2025). Models strictly isolate pre-accident
        environmental and road features to prevent post-incident data leakage. Findings demonstrate statistical associations
        rather than direct causal relationships.
      </AlertBanner>

      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TOTAL ACCIDENT RECORDS"
          value={data.total_records.toLocaleString()}
          subtitle={`${data.date_range_start} to ${data.date_range_end}`}
          icon={Database}
          variant="primary"
          badge={selectedCity ? selectedCity : '8 Metros'}
        />

        <MetricCard
          title="FATAL ACCIDENT RATE"
          value={`${data.fatal_pct}%`}
          subtitle={`${data.fatal_count.toLocaleString()} recorded fatal crashes`}
          icon={AlertTriangle}
          variant="critical"
          badge="High Severity"
        />

        <MetricCard
          title="OSM ROAD ENRICHMENT"
          value={`${data.osm_enrichment_pct}%`}
          subtitle="Linked with OpenStreetMap highway profiles"
          icon={ShieldCheck}
          variant="success"
          badge="Geospatial"
        />

        <MetricCard
          title="MODEL BENCHMARK ACCURACY"
          value={`${(data.model_validation_accuracy * 100).toFixed(1)}%`}
          subtitle={`Balanced Acc: ${(data.model_balanced_accuracy * 100).toFixed(1)}% | Zero Leakage`}
          icon={BrainCircuit}
          variant="warning"
          badge="Extra Trees"
        />
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City Distribution Chart (Takes 2 cols) */}
        <div className="lg:col-span-2 bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-main">
                {selectedCity ? `${selectedCity} Incident Volume & Severity` : 'Metropolitan Incident Volume & Fatal Rate'}
              </h2>
              <p className="text-xs text-text-muted">Total recorded accidents by metropolitan district with fatal percentage</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-dark">
              Comparative
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.city_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243247" vertical={false} />
                <XAxis
                  dataKey="city"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-15}
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
                  formatter={(val: any, name: any) => [
                    name === 'count' ? `${val.toLocaleString()} incidents` : `${val}%`,
                    name === 'count' ? 'Total Accidents' : 'Fatal Ratio',
                  ]}
                />
                <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} name="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Class Distribution (1 col) */}
        <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-text-main">Class Distribution</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-dark">
                3 Severity Levels
              </span>
            </div>
            <p className="text-xs text-text-muted mb-4">Historical class balance across recorded incidents</p>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.severity_distribution}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {data.severity_distribution.map((entry) => (
                      <Cell
                        key={`cell-${entry.severity}`}
                        fill={SEVERITY_COLORS[entry.severity] || '#818CF8'}
                        stroke="#111B2B"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111B2B',
                      borderColor: '#243247',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val.toLocaleString()} (${((val / data.total_records) * 100).toFixed(1)}%)`, 'Count']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-text-main font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-border-dark text-[11px] text-text-muted flex justify-between font-mono">
            <span>Fatal: {data.fatal_count} ({data.fatal_pct}%)</span>
            <span>Severe: {data.severe_count}</span>
            <span>Minor: {data.minor_count}</span>
          </div>
        </div>
      </div>

      {/* Key Analytical Insights & Geospatial Callouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-text-main tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-primary" />
            Key Empirical Discoveries & Intelligence Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.key_insights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-bg-card border border-border-dark rounded-lg p-4 shadow-card-dark flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        insight.type === 'critical'
                          ? 'bg-accent-critical'
                          : insight.type === 'warning'
                          ? 'bg-accent-warning'
                          : insight.type === 'success'
                          ? 'bg-accent-success'
                          : 'bg-accent-primary'
                      }`}
                    />
                    <h3 className="text-xs font-semibold text-text-main">{insight.title}</h3>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action / Geospatial Launcher */}
        <div className="bg-bg-card border border-accent-primary/20 rounded-lg p-5 shadow-card-dark flex flex-col justify-between bg-gradient-to-br from-bg-card to-bg-surface">
          <div>
            <div className="flex items-center space-x-2 text-accent-primary mb-2">
              <Flame className="w-5 h-5 text-accent-warning" />
              <h2 className="text-sm font-semibold text-text-main">Spatial Hotspot Telemetry</h2>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-4">
              Explore high-density accident clusters extracted via DBSCAN geospatial clustering (600m radius threshold).
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs py-1.5 border-b border-border-dark/60 font-mono">
                <span className="text-text-muted">Target Algorithm</span>
                <span className="text-text-main font-semibold">DBSCAN (Haversine)</span>
              </div>
              <div className="flex justify-between text-xs py-1.5 border-b border-border-dark/60 font-mono">
                <span className="text-text-muted">Min Cluster Size</span>
                <span className="text-text-main font-semibold">12 Incidents</span>
              </div>
              <div className="flex justify-between text-xs py-1.5 border-b border-border-dark/60 font-mono">
                <span className="text-text-muted">Spatial Tolerance (eps)</span>
                <span className="text-text-main font-semibold">600 meters</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/map')}
              className="flex-1 px-3 py-2 text-xs font-medium rounded bg-accent-primary text-bg-main hover:bg-sky-400 font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              View Map
            </button>
            <button
              onClick={() => navigate('/hotspots')}
              className="flex-1 px-3 py-2 text-xs font-medium rounded bg-bg-surface border border-border-dark text-text-main hover:border-accent-primary/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-accent-warning" />
              Hotspots
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

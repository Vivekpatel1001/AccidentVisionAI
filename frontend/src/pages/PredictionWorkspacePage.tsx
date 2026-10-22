import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  SlidersHorizontal,
  BrainCircuit,
  Sparkles,
  Info,
  RefreshCw,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { predictSeverity, getMetadata } from '../services/api';
import { PredictRequest, PredictResponse } from '../types/api';
import { Badge } from '../components/common/Badge';
import { AlertBanner } from '../components/common/AlertBanner';

export const PredictionWorkspacePage: React.FC = () => {
  const { data: metadata } = useQuery({
    queryKey: ['metadata'],
    queryFn: getMetadata,
  });

  const [form, setForm] = useState<PredictRequest>({
    city: 'Mumbai',
    road_type: 'Highway',
    lanes: 4,
    traffic_signal: false,
    weather: 'Clear',
    visibility: 8.0,
    temperature: 28.0,
    traffic_density: 'High',
    hour: 19,
    day_of_week: 'Friday',
    is_weekend: false,
    is_peak_hour: true,
    festival: 'None',
    osm_highway: 'primary',
    distance_to_road_m: 12.5,
    osm_road_length_m: 450.0,
    vehicle_type: 'Car',
    is_divided_carriageway: true,
    cruising_speed_kmh: 70,
  });

  const [result, setResult] = useState<PredictResponse | null>(null);

  const mutation = useMutation({
    mutationFn: predictSeverity,
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const handleHourChange = (newHour: number) => {
    const isPeak = (newHour >= 8 && newHour <= 10) || (newHour >= 17 && newHour <= 20);
    setForm((prev) => ({ ...prev, hour: newHour, is_peak_hour: isPeak }));
  };

  const handleDayChange = (newDay: string) => {
    const isWknd = newDay === 'Saturday' || newDay === 'Sunday';
    setForm((prev) => ({ ...prev, day_of_week: newDay, is_weekend: isWknd }));
  };

  return (
    <div className="space-y-6">
      {/* Leakage Guard Disclaimer */}
      <AlertBanner type="info" title="Strict Pre-Accident Feature Quarantine Protocol">
        This inference engine operates exclusively on observable <em>ex-ante</em> variables present prior to collision
        initiation. Fields such as casualties count, post-impact cause, and computed risk score are permanently quarantined
        to prevent target leakage.
      </AlertBanner>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column (7 cols) */}
        <div className="lg:col-span-7 bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-dark">
            <div>
              <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-accent-primary" />
                Pre-Accident Environmental & Road Parameters
              </h2>
              <p className="text-xs text-text-muted">Configure baseline roadway, atmospheric, vehicle, and temporal telemetry</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({
                  city: 'Bengaluru',
                  road_type: 'Urban Street',
                  lanes: 2,
                  traffic_signal: true,
                  weather: 'Rainy',
                  visibility: 4.0,
                  temperature: 22.0,
                  traffic_density: 'Medium',
                  hour: 22,
                  day_of_week: 'Saturday',
                  is_weekend: true,
                  is_peak_hour: false,
                  festival: 'None',
                  osm_highway: 'secondary',
                  distance_to_road_m: 8.0,
                  osm_road_length_m: 320.0,
                  vehicle_type: 'Two-Wheeler',
                  is_divided_carriageway: false,
                  cruising_speed_kmh: 50,
                });
              }}
              className="text-[11px] font-mono text-accent-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Load Preset
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Row 1: City & Road Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-text-muted mb-1 font-mono">Metropolitan Area</label>
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full bg-bg-surface border border-border-dark rounded px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary"
                >
                  {metadata?.cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-mono">Reported Road Type</label>
                <select
                  value={form.road_type}
                  onChange={(e) => setForm({ ...form, road_type: e.target.value })}
                  className="w-full bg-bg-surface border border-border-dark rounded px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary"
                >
                  {metadata?.road_types.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Vehicle Mode, Median Separation, Operating Speed */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-bg-surface/50 rounded border border-border-dark/60">
              <div>
                <label className="block text-text-muted mb-1 font-mono">Vehicle Category</label>
                <select
                  value={form.vehicle_type || 'Car'}
                  onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                  className="w-full bg-bg-surface border border-border-dark rounded px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary"
                >
                  <option value="Car">Car / Passenger SUV</option>
                  <option value="Two-Wheeler">Two-Wheeler / Bike (VRU)</option>
                  <option value="Truck / Bus">Truck / Commercial Bus</option>
                  <option value="Auto-Rickshaw">Auto-Rickshaw / EV</option>
                </select>
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-mono">Median Separation</label>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="median_toggle"
                    checked={form.is_divided_carriageway ?? true}
                    onChange={(e) => setForm({ ...form, is_divided_carriageway: e.target.checked })}
                    className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
                  />
                  <label htmlFor="median_toggle" className="text-text-main cursor-pointer font-mono">
                    Divided Carriageway
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-mono">
                  Cruising Speed: {form.cruising_speed_kmh ?? 70} km/h
                </label>
                <input
                  type="range"
                  min="30"
                  max="120"
                  step="5"
                  value={form.cruising_speed_kmh ?? 70}
                  onChange={(e) => setForm({ ...form, cruising_speed_kmh: parseInt(e.target.value) })}
                  className="w-full accent-accent-primary"
                />
              </div>
            </div>

            {/* Row 3: Lanes, Traffic Signal, Traffic Density */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-text-muted mb-1 font-mono">Road Lanes: {form.lanes}</label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={form.lanes}
                  onChange={(e) => setForm({ ...form, lanes: parseInt(e.target.value) })}
                  className="w-full accent-accent-primary"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-mono">Traffic Flow Density</label>
                <select
                  value={form.traffic_density}
                  onChange={(e) => setForm({ ...form, traffic_density: e.target.value })}
                  className="w-full bg-bg-surface border border-border-dark rounded px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary"
                >
                  {metadata?.traffic_densities.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-mono">Signal Control</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="checkbox"
                    id="signal_toggle"
                    checked={form.traffic_signal}
                    onChange={(e) => setForm({ ...form, traffic_signal: e.target.checked })}
                    className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
                  />
                  <label htmlFor="signal_toggle" className="text-text-main cursor-pointer">
                    Signalized Junction
                  </label>
                </div>
              </div>
            </div>

            {/* Row 4: Weather, Visibility, Temperature */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-text-muted mb-1 font-mono">Weather Condition</label>
                <select
                  value={form.weather}
                  onChange={(e) => setForm({ ...form, weather: e.target.value })}
                  className="w-full bg-bg-surface border border-border-dark rounded px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary"
                >
                  {metadata?.weather_conditions.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-mono">Visibility: {form.visibility} km</label>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.5"
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: parseFloat(e.target.value) })}
                  className="w-full accent-accent-primary"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-mono">Temperature: {form.temperature}°C</label>
                <input
                  type="range"
                  min="5"
                  max="48"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-accent-primary"
                />
              </div>
            </div>

            {/* Row 5: Temporal (Hour, Day, Peak) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-text-muted mb-1 font-mono">Hour of Day: {form.hour}:00</label>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={form.hour}
                  onChange={(e) => handleHourChange(parseInt(e.target.value))}
                  className="w-full accent-accent-primary"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-mono">Day of Week</label>
                <select
                  value={form.day_of_week}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className="w-full bg-bg-surface border border-border-dark rounded px-3 py-2 text-text-main focus:outline-none focus:border-accent-primary"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <span className="text-[11px] font-mono text-text-muted mb-1">
                  Status: {form.is_peak_hour ? 'Peak Rush Hour' : 'Standard Flow'} | {form.is_weekend ? 'Weekend' : 'Weekday'}
                </span>
              </div>
            </div>

            {/* Row 6: OpenStreetMap Attributes */}
            <div className="p-3 bg-bg-surface/50 rounded border border-border-dark/60 space-y-3">
              <span className="text-[11px] font-mono text-accent-primary font-semibold uppercase tracking-wider block">
                OpenStreetMap Road Enrichment Parameters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-muted mb-1 font-mono">OSM Highway Type</label>
                  <select
                    value={form.osm_highway || ''}
                    onChange={(e) => setForm({ ...form, osm_highway: e.target.value })}
                    className="w-full bg-bg-surface border border-border-dark rounded px-3 py-2 text-text-main focus:outline-none"
                  >
                    {metadata?.osm_highway_types.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-muted mb-1 font-mono">
                    Distance to Centerline: {form.distance_to_road_m}m
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={form.distance_to_road_m || 10}
                    onChange={(e) => setForm({ ...form, distance_to_road_m: parseFloat(e.target.value) })}
                    className="w-full accent-accent-primary"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-2.5 px-4 rounded font-semibold text-xs tracking-wide bg-accent-primary text-bg-main hover:bg-sky-400 transition-colors flex items-center justify-center gap-2 shadow-glow-primary cursor-pointer"
              >
                <BrainCircuit className="w-4 h-4" />
                {mutation.isPending ? 'Computing Gradient Boosting Telemetry...' : 'Predict Crash Severity & Corridor Hazard'}
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Output Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border-dark mb-4">
                <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-secondary" />
                  Estimated Severity Telemetry
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">88.64% Hazard Precision</span>
              </div>

              {result ? (
                <div className="space-y-5">
                  {/* Corridor Hazard Telemetry (88.64% Benchmark) */}
                  {result.corridor_hazard && (
                    <div className="p-4 rounded-lg bg-bg-surface border border-border-dark space-y-3">
                      <div className="flex items-center justify-between border-b border-border-dark pb-2">
                        <span className="text-[11px] font-mono uppercase text-accent-primary font-bold flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-accent-primary" />
                          Corridor Hazard Classifier
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                          88.64% Holdout Acc
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Corridor Tier:</span>
                        <span className={`font-bold font-mono ${result.corridor_hazard.is_high_hazard ? 'text-accent-critical' : 'text-accent-success'}`}>
                          {result.corridor_hazard.hazard_tier}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-text-muted">Hazard Collision Probability</span>
                          <span className="font-bold text-text-main">
                            {(result.corridor_hazard.hazard_probability * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-bg-main h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${result.corridor_hazard.is_high_hazard ? 'bg-accent-critical' : 'bg-accent-success'}`}
                            style={{ width: `${result.corridor_hazard.hazard_probability * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                        <div className="bg-bg-main/70 p-2 rounded border border-border-dark/50">
                          <div className="text-text-muted text-[10px]">WorldPop Density</div>
                          <div className="font-bold text-text-main">
                            {result.corridor_hazard.population_density_per_sqkm.toLocaleString()} / km²
                          </div>
                        </div>
                        <div className="bg-bg-main/70 p-2 rounded border border-border-dark/50">
                          <div className="text-text-muted text-[10px]">IRC Design Speed</div>
                          <div className="font-bold text-text-main">
                            {result.corridor_hazard.design_speed_kmh} km/h
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Predicted Severity Class */}
                  <div className="text-center p-5 rounded-lg bg-bg-surface border border-border-dark">
                    <span className="text-[10px] font-mono uppercase text-text-subtle tracking-wider block mb-2">
                      Predicted Severity Class
                    </span>
                    <Badge
                      variant={
                        result.predicted_severity === 'Fatal'
                          ? 'fatal'
                          : result.predicted_severity === 'Severe'
                          ? 'severe'
                          : 'minor'
                      }
                      className="text-base px-4 py-1.5 font-bold"
                    >
                      {result.predicted_severity.toUpperCase()} ACCIDENT
                    </Badge>
                    <div className="mt-3 text-xs font-mono text-text-muted">
                      Confidence: <strong className="text-text-main">{(result.confidence * 100).toFixed(1)}%</strong>
                    </div>
                  </div>

                  {/* Multi-Class Probability Distribution */}
                  <div className="space-y-3 font-mono text-xs">
                    <span className="text-[11px] uppercase font-bold text-text-subtle block">
                      Multi-Class Probability Distribution
                    </span>

                    {/* Fatal Probability */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-accent-critical font-medium">Fatal Severity</span>
                        <span className="font-bold text-accent-critical">
                          {(result.probabilities.Fatal * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-bg-main h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-critical transition-all duration-500"
                          style={{ width: `${result.probabilities.Fatal * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Severe Probability */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-accent-warning font-medium">Severe Injury</span>
                        <span className="font-bold text-accent-warning">
                          {(result.probabilities.Severe * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-bg-main h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-warning transition-all duration-500"
                          style={{ width: `${result.probabilities.Severe * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Minor Probability */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-accent-success font-medium">Minor Incident</span>
                        <span className="font-bold text-accent-success">
                          {(result.probabilities.Minor * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-bg-main h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-success transition-all duration-500"
                          style={{ width: `${result.probabilities.Minor * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Explanation text */}
                  <div className="p-3 rounded bg-bg-surface border border-border-dark text-xs text-text-muted leading-relaxed">
                    {result.explanation}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-text-subtle space-y-2">
                  <BrainCircuit className="w-10 h-10 mx-auto opacity-30 text-accent-primary" />
                  <p className="text-xs">Adjust pre-accident parameters on the left and submit to generate a prediction.</p>
                </div>
              )}
            </div>

            {/* Scientific Caveat */}
            <div className="mt-5 pt-4 border-t border-border-dark text-[11px] text-text-subtle leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-accent-primary shrink-0 mt-0.5" />
              <span>
                Empirical baseline: Corridor risk is modeled via high-resolution UN WorldPop demographic density & OSM geometry (88.64% holdout accuracy). Post-impact injury severity remains stochastic due to microscopic kinematic variability.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionWorkspacePage;

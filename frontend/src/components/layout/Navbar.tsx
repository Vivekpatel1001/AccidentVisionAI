import React from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, MapPin, Sparkles, Filter } from 'lucide-react';
import { getMetadata } from '../../services/api';
import { useCityFilter } from '../../context/CityContext';

const pageTitles: { [key: string]: { title: string; subtitle: string } } = {
  '/': { title: 'Executive Risk Overview', subtitle: 'Macro-level accident metrics, class distributions, and spatial previews' },
  '/map': { title: 'Interactive Spatial Map', subtitle: 'Point-level incident exploration with CartoDB Dark Matter telemetry' },
  '/hotspots': { title: 'Hotspot Cluster Intelligence', subtitle: 'DBSCAN corridor clustering (600m radius, min 12 points)' },
  '/temporal': { title: 'Temporal Dynamics & Seasonality', subtitle: '24-hour diurnal patterns, weekday shifts, and monthly trends' },
  '/severity': { title: 'Severity Factor Diagnostics', subtitle: 'Road infrastructure, weather conditions, and traffic signal correlations' },
  '/model': { title: 'Model Performance & Benchmarks', subtitle: 'Strict zero-leakage evaluation, confusion matrix & LOCO spatial cross-validation' },
  '/predictions': { title: 'Inference & Prediction Workspace', subtitle: 'Real-time pre-accident severity probability estimation' },
  '/explorer': { title: 'Master Dataset Explorer', subtitle: 'Server-side paginated tabular registry with attribute filters' },
  '/data-quality': { title: 'Data Quality & Provenance Audit', subtitle: 'Missingness metrics, OpenStreetMap enrichment, and leakage quarantine audit' },
  '/methodology': { title: 'Methodology, Limitations & Ethics', subtitle: 'Scientific documentation, evaluation principles, and governance guidelines' },
};

export const Navbar: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { selectedCity, setSelectedCity } = useCityFilter();

  const { data: metadata } = useQuery({
    queryKey: ['metadata'],
    queryFn: getMetadata,
    staleTime: 60000,
  });

  const currentPage = pageTitles[location.pathname] || {
    title: 'Risk Intelligence Platform',
    subtitle: 'AccidentVision AI Analytics',
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="h-16 px-6 border-b border-border-dark bg-bg-secondary/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base font-semibold text-text-main tracking-tight flex items-center gap-2">
          {currentPage.title}
          {selectedCity && (
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              {selectedCity}
            </span>
          )}
        </h1>
        <p className="text-xs text-text-muted hidden md:block">
          {currentPage.subtitle}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-3">
        {/* City Filter Selector */}
        <div className="flex items-center bg-bg-card border border-border-dark rounded-md px-2.5 py-1 text-xs">
          <MapPin className="w-3.5 h-3.5 text-accent-primary mr-1.5 shrink-0" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-transparent text-text-main text-xs focus:outline-none cursor-pointer pr-2 font-medium"
          >
            <option value="" className="bg-bg-card text-text-main">All 8 Metropolitan Cities</option>
            {metadata?.cities.map((city) => (
              <option key={city} value={city} className="bg-bg-card text-text-main">
                {city}
              </option>
            ))}
          </select>
          {selectedCity && (
            <button
              onClick={() => setSelectedCity('')}
              className="ml-1 text-[10px] text-text-muted hover:text-accent-critical underline font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Global Refresh Button */}
        <button
          onClick={handleRefresh}
          title="Refresh All Analytics"
          className="p-1.5 rounded-md bg-bg-card border border-border-dark text-text-muted hover:text-accent-primary hover:border-accent-primary/40 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Research Benchmark Tag */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-bg-surface border border-border-dark text-[11px] font-mono text-text-muted">
          <Sparkles className="w-3 h-3 text-accent-secondary" />
          <span>Evaluation: Zero-Leakage</span>
        </div>
      </div>
    </header>
  );
};

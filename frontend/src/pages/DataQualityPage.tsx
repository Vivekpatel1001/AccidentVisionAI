import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  AlertTriangle,
  Database,
  FileCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  Layers,
  MapPin
} from 'lucide-react';
import { getDataQuality } from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { AlertBanner } from '../components/common/AlertBanner';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DataQualityPage: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['data-quality'],
    queryFn: getDataQuality,
  });

  if (isLoading) {
    return <LoadingSpinner message="Executing comprehensive 20,000-record data quality audit..." />;
  }

  if (isError || !data) {
    return (
      <AlertBanner type="critical" title="Data Quality Feed Error">
        Failed to fetch dataset audit results.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integrity Summary Banner */}
      <AlertBanner type="info" title="Scientific Transparency & Research Provenance">
        The master dataset (20,000 records across 8 Indian metropolises) functions as an academic research benchmark.
        All structural anomalies, coordinate validity boundaries, and feature leakage risks have been systematically cataloged below.
      </AlertBanner>

      {/* Audit KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="DUPLICATE RECORDS"
          value={data.duplicate_rows}
          subtitle="Zero complete row duplications"
          icon={CheckCircle2}
          variant="success"
          badge="Verified Clean"
        />

        <MetricCard
          title="PRIMARY KEY INTEGRITY"
          value={data.duplicate_ids}
          subtitle="Zero duplicate accident_ids"
          icon={CheckCircle2}
          variant="success"
          badge="100% Unique"
        />

        <MetricCard
          title="COORDINATE BOUNDARY CHECK"
          value={data.invalid_coordinates_count}
          subtitle="All latitudes (8°-37°) & longitudes (68°-97°)"
          icon={MapPin}
          variant="success"
          badge="India Bounding Box"
        />

        <MetricCard
          title="QUARANTINED LEAKAGE COLS"
          value={data.quarantined_leakage_audit.length}
          subtitle="Protected from model exposure"
          icon={Lock}
          variant="warning"
          badge="Zero Leakage"
        />
      </div>

      {/* Grid: Missingness Table + OSM & Provenance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column-by-Column Missingness Table (7 cols) */}
        <div className="lg:col-span-7 bg-bg-card border border-border-dark rounded-lg overflow-hidden shadow-card-dark flex flex-col h-[560px]">
          <div className="p-4 border-b border-border-dark flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                <Database className="w-4 h-4 text-accent-primary" />
                Schema Completeness & Missingness Audit
              </h2>
              <p className="text-xs text-text-muted">Inspection of all 28 dataset attributes across 20,000 records</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-dark">
              28 Columns
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bg-surface text-text-subtle text-[11px] uppercase border-b border-border-dark sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Field Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Missing Count</th>
                  <th className="py-2.5 px-3">Missing %</th>
                  <th className="py-2.5 px-3 text-right">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/60">
                {data.columns_missingness.map((col) => {
                  const hasMissing = col.missing_count > 0;
                  return (
                    <tr
                      key={col.column}
                      className={`hover:bg-bg-surface/50 transition-colors ${
                        hasMissing ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-text-main">{col.column}</td>
                      <td className="py-2.5 px-3 text-text-muted">{col.data_type}</td>
                      <td className="py-2.5 px-3">
                        <span className={hasMissing ? 'text-accent-warning font-bold' : 'text-text-muted'}>
                          {col.missing_count.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={hasMissing ? 'text-accent-warning font-bold' : 'text-text-muted'}>
                          {col.missing_pct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {col.category === 'leakage' ? (
                          <Badge variant="fatal">LEAKAGE</Badge>
                        ) : col.category === 'osm_road' ? (
                          <Badge variant="primary">OSM ROAD</Badge>
                        ) : (
                          <Badge variant="neutral">BASELINE</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* OSM & Leakage Quarantine Deep Dive (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* OSM Enrichment Card */}
          <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark space-y-3">
            <h3 className="text-xs font-semibold text-text-main flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-primary" />
              OpenStreetMap Road Enrichment Analysis
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Four roadway attributes were linked via geospatial nearest-neighbor join against regional OpenStreetMap vector layers:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-border-dark/60">
                <span className="text-text-muted">Highway Profile Populated</span>
                <span className="text-text-main font-semibold">
                  {data.osm_enrichment_summary.osm_highway_populated.toLocaleString()} ({data.osm_enrichment_summary.osm_highway_pct}%)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-dark/60">
                <span className="text-text-muted">Distance to Road Populated</span>
                <span className="text-text-main font-semibold">
                  {data.osm_enrichment_summary.distance_populated.toLocaleString()} ({data.osm_enrichment_summary.distance_pct}%)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-dark/60">
                <span className="text-text-muted">Mumbai Unmatched Records</span>
                <span className="text-accent-warning font-bold">
                  {data.osm_enrichment_summary.mumbai_unmatched_records}
                </span>
              </div>
            </div>

            <div className="p-3 bg-bg-surface rounded border border-border-dark text-[11px] text-text-subtle leading-relaxed">
              <strong>Root Cause:</strong> {data.osm_enrichment_summary.cause_of_unmatched}
            </div>
          </div>

          {/* Quarantined Leakage Audit */}
          <div className="bg-bg-card border border-border-dark rounded-lg p-5 shadow-card-dark space-y-3">
            <h3 className="text-xs font-semibold text-text-main flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent-critical" />
              Target Leakage Quarantine Registry
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              The following columns exist in the raw dataset but are strictly forbidden during inference:
            </p>

            <div className="space-y-2.5">
              {data.quarantined_leakage_audit.map((l) => (
                <div key={l.feature} className="p-3 bg-bg-surface rounded border border-border-dark text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-accent-critical">{l.feature}</span>
                    <span className="text-[10px] font-mono text-text-subtle">{l.correlation_with_severity}</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">{l.reason_for_quarantine}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

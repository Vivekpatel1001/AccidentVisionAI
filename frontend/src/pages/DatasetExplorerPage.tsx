import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TableProperties,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle
} from 'lucide-react';
import { getAccidents, getMetadata } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { AccidentRecord } from '../types/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DatasetExplorerPage: React.FC = () => {
  const { selectedCity, setSelectedCity } = useCityFilter();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [roadTypeFilter, setRoadTypeFilter] = useState<string>('');
  const [weatherFilter, setWeatherFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<AccidentRecord | null>(null);

  const { data: metadata } = useQuery({
    queryKey: ['metadata'],
    queryFn: getMetadata,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accidents', page, pageSize, selectedCity, severityFilter, roadTypeFilter, weatherFilter, searchTerm],
    queryFn: () =>
      getAccidents({
        page,
        page_size: pageSize,
        city: selectedCity || undefined,
        severity: severityFilter || undefined,
        road_type: roadTypeFilter || undefined,
        weather: weatherFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // reset to page 1 on new search
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-bg-card border border-border-dark rounded-lg p-4 shadow-card-dark space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-text-subtle absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, city, road, or cause..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-bg-surface border border-border-dark rounded-md pl-9 pr-3 py-2 text-xs text-text-main focus:outline-none focus:border-accent-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-text-subtle hover:text-text-main"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-bg-surface border border-border-dark rounded px-2.5 py-2 text-text-main focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="Fatal">Fatal</option>
              <option value="Severe">Severe</option>
              <option value="Minor">Minor</option>
            </select>

            {/* Road Type Filter */}
            <select
              value={roadTypeFilter}
              onChange={(e) => {
                setRoadTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-bg-surface border border-border-dark rounded px-2.5 py-2 text-text-main focus:outline-none"
            >
              <option value="">All Road Types</option>
              {metadata?.road_types.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Weather Filter */}
            <select
              value={weatherFilter}
              onChange={(e) => {
                setWeatherFilter(e.target.value);
                setPage(1);
              }}
              className="bg-bg-surface border border-border-dark rounded px-2.5 py-2 text-text-main focus:outline-none"
            >
              <option value="">All Weather</option>
              {metadata?.weather_conditions.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Paginated Table */}
      <div className="bg-bg-card border border-border-dark rounded-lg overflow-hidden shadow-card-dark flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-bg-surface text-text-subtle text-[11px] uppercase border-b border-border-dark">
              <tr>
                <th className="py-3 px-4">Accident ID</th>
                <th className="py-3 px-4">City / State</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Road Type</th>
                <th className="py-3 px-4">Weather</th>
                <th className="py-3 px-4">Density</th>
                <th className="py-3 px-4">OSM Highway</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12">
                    <LoadingSpinner message="Querying master records..." />
                  </td>
                </tr>
              ) : data && data.records.length > 0 ? (
                data.records.map((r) => (
                  <tr
                    key={r.accident_id}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-bg-surface/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-accent-primary">{r.accident_id}</td>
                    <td className="py-3 px-4 text-text-main">{r.city}, {r.state}</td>
                    <td className="py-3 px-4 text-text-muted">{r.date} {r.time}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          r.accident_severity === 'Fatal'
                            ? 'fatal'
                            : r.accident_severity === 'Severe'
                            ? 'severe'
                            : 'minor'
                        }
                      >
                        {r.accident_severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text-muted">{r.road_type}</td>
                    <td className="py-3 px-4 text-text-muted">{r.weather}</td>
                    <td className="py-3 px-4 text-text-muted">{r.traffic_density}</td>
                    <td className="py-3 px-4 text-text-subtle">{r.osm_highway || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(r);
                        }}
                        className="p-1 rounded bg-bg-surface hover:bg-accent-primary hover:text-bg-main border border-border-dark transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted">
                    No accident records matched the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination Bar */}
        <div className="p-3 bg-bg-surface border-t border-border-dark flex flex-wrap items-center justify-between text-xs font-mono gap-3">
          <div className="text-text-muted">
            {data ? (
              <span>
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of{' '}
                <strong className="text-text-main">{data.total.toLocaleString()}</strong> records
              </span>
            ) : (
              <span>Loading records...</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-text-subtle text-[11px]">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setPage(1);
              }}
              className="bg-bg-card border border-border-dark rounded px-2 py-1 text-text-main text-xs focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <button
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded bg-bg-card border border-border-dark text-text-main disabled:opacity-40 disabled:cursor-not-allowed hover:border-accent-primary/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-text-main px-2">
              Page {page} of {data?.total_pages || 1}
            </span>

            <button
              disabled={data ? page >= data.total_pages : true || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded bg-bg-card border border-border-dark text-text-main disabled:opacity-40 disabled:cursor-not-allowed hover:border-accent-primary/50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-dark rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-border-dark flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TableProperties className="w-4 h-4 text-accent-primary" />
                <h3 className="font-mono font-bold text-text-main text-sm">
                  Record Details: {selectedRecord.accident_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded text-text-muted hover:text-text-main hover:bg-bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="flex justify-between items-center p-3 rounded bg-bg-surface border border-border-dark">
                <div>
                  <span className="text-text-subtle uppercase text-[10px] block">Severity Class</span>
                  <Badge
                    variant={
                      selectedRecord.accident_severity === 'Fatal'
                        ? 'fatal'
                        : selectedRecord.accident_severity === 'Severe'
                        ? 'severe'
                        : 'minor'
                    }
                  >
                    {selectedRecord.accident_severity}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="text-text-subtle uppercase text-[10px] block">Coordinates</span>
                  <span className="text-text-main font-semibold">
                    {selectedRecord.latitude.toFixed(6)}, {selectedRecord.longitude.toFixed(6)}
                  </span>
                </div>
              </div>

              {/* Grid of attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded bg-bg-surface border border-border-dark/60">
                  <span className="text-text-subtle text-[10px] block">City / State</span>
                  <span className="text-text-main font-medium">{selectedRecord.city}, {selectedRecord.state}</span>
                </div>
                <div className="p-2.5 rounded bg-bg-surface border border-border-dark/60">
                  <span className="text-text-subtle text-[10px] block">Date & Time</span>
                  <span className="text-text-main font-medium">{selectedRecord.date} {selectedRecord.time}</span>
                </div>
                <div className="p-2.5 rounded bg-bg-surface border border-border-dark/60">
                  <span className="text-text-subtle text-[10px] block">Day & Hour</span>
                  <span className="text-text-main font-medium">{selectedRecord.day_of_week} ({selectedRecord.hour}:00)</span>
                </div>
                <div className="p-2.5 rounded bg-bg-surface border border-border-dark/60">
                  <span className="text-text-subtle text-[10px] block">Roadway & Lanes</span>
                  <span className="text-text-main font-medium">{selectedRecord.road_type} ({selectedRecord.lanes} lanes)</span>
                </div>
                <div className="p-2.5 rounded bg-bg-surface border border-border-dark/60">
                  <span className="text-text-subtle text-[10px] block">Signal Control</span>
                  <span className="text-text-main font-medium">{selectedRecord.traffic_signal ? 'Yes (Signalized)' : 'No (Uncontrolled)'}</span>
                </div>
                <div className="p-2.5 rounded bg-bg-surface border border-border-dark/60">
                  <span className="text-text-subtle text-[10px] block">Atmosphere</span>
                  <span className="text-text-main font-medium">{selectedRecord.weather} ({selectedRecord.temperature}°C)</span>
                </div>
                <div className="p-2.5 rounded bg-bg-surface border border-border-dark/60">
                  <span className="text-text-subtle text-[10px] block">Visibility</span>
                  <span className="text-text-main font-medium">{selectedRecord.visibility} km</span>
                </div>
                <div className="p-2.5 rounded bg-bg-surface border border-border-dark/60">
                  <span className="text-text-subtle text-[10px] block">Traffic Flow</span>
                  <span className="text-text-main font-medium">{selectedRecord.traffic_density}</span>
                </div>
                <div className="p-2.5 rounded bg-bg-surface border border-border-dark/60">
                  <span className="text-text-subtle text-[10px] block">OSM Highway</span>
                  <span className="text-accent-primary font-medium">{selectedRecord.osm_highway || 'None'}</span>
                </div>
              </div>

              {/* Ex-Post Attributes Section */}
              <div className="p-3 rounded bg-accent-critical/5 border border-accent-critical/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-accent-critical tracking-wider block">
                  Ex-Post Incident Outcomes (Quarantined Leakage)
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>Casualties: <strong className="text-accent-critical">{selectedRecord.casualties}</strong></div>
                  <div>Vehicles: <strong className="text-text-main">{selectedRecord.vehicles_involved}</strong></div>
                  <div>Cause: <strong className="text-text-main">{selectedRecord.cause}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

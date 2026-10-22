import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleAccidentMap } from '../components/map/GoogleAccidentMap';
import {
  MapPin,
  Filter,
  Layers,
  Info,
  Calendar,
  Clock,
  Car,
  CloudRain,
  Navigation,
  Compass,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { getGeoAccidents } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { AccidentGeoPoint } from '../types/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AccidentMapPage: React.FC = () => {
  const { selectedCity, setSelectedCity } = useCityFilter();
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<AccidentGeoPoint | null>(null);

  const { data: points, isLoading } = useQuery({
    queryKey: ['geo-accidents', selectedCity, severityFilter],
    queryFn: () => getGeoAccidents(selectedCity, severityFilter, 4000),
  });

  const pointsList = Array.isArray(points) ? points : [];

  const getMarkerColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'fatal':
        return '#EF4444'; // Vibrant Crimson
      case 'severe':
      case 'major':
        return '#F59E0B'; // Warm Amber
      case 'minor':
      default:
        return '#10B981'; // Vibrant Emerald
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Real-World Geospatial Map</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Accident Collision Blackspot Explorer
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Explore verified accident coordinates, impact severity clusters, and road geometry attributes across 8 metropolitan cities.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
            <span>Fatal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
            <span>Severe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span>Minor</span>
          </div>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="relative h-[720px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md flex bg-slate-100">
        {/* Top Floating Controls Bar */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-md">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 px-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Filter Severity:
          </span>

          {[
            { id: '', label: 'All Incidents' },
            { id: 'Fatal', label: 'Fatal Crashes' },
            { id: 'Severe', label: 'Severe Injuries' },
            { id: 'Minor', label: 'Minor Accidents' }
          ].map((sev) => (
            <button
              key={sev.id}
              onClick={() => setSeverityFilter(sev.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                severityFilter === sev.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {sev.label}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <div className="text-xs font-mono font-bold text-slate-600 px-2">
            {isLoading ? (
              <span className="animate-pulse text-blue-600">Loading incidents...</span>
            ) : (
              <span>{pointsList.length.toLocaleString()} verified spots</span>
            )}
          </div>
        </div>

        {/* Main Map Container */}
        <div className="flex-1 h-full w-full relative">
          <GoogleAccidentMap
            points={pointsList}
            city={selectedCity || 'Mumbai'}
            severityFilter={severityFilter}
            selectedIncident={selectedIncident}
            onSelectIncident={setSelectedIncident}
            isLoading={isLoading}
          />
        </div>

        {/* Right Floating Incident Detail Drawer */}
        {selectedIncident && (
          <div className="absolute top-4 right-4 z-[1000] w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 animate-in fade-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getMarkerColor(selectedIncident.accident_severity) }}
                />
                <span className="font-extrabold text-sm text-slate-900">
                  {selectedIncident.accident_severity} Incident
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Accident ID:</span>
                <span className="font-mono font-bold text-slate-800">#{selectedIncident.accident_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">City / Jurisdiction:</span>
                <span className="font-semibold text-slate-800">{selectedIncident.city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Roadway Classification:</span>
                <span className="font-semibold text-slate-800">{selectedIncident.road_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Time of Occurrence:</span>
                <span className="font-mono font-bold text-slate-800">{selectedIncident.hour}:00 HRS</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Weather Condition:</span>
                <span className="font-semibold text-slate-800">{selectedIncident.weather}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Traffic Congestion:</span>
                <span className="font-semibold text-slate-800">{selectedIncident.traffic_density}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">WGS84 Coordinates:</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccidentMapPage;

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import {
  MapPin,
  Filter,
  X,
  Calendar,
  Clock,
  Cloud,
  Car,
  Compass,
  AlertTriangle,
  Info,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { getGeoAccidents } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { AccidentGeoPoint } from '../types/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const CITY_COORDINATES: { [key: string]: [number, number, number] } = {
  Mumbai: [19.076, 72.8777, 12],
  Delhi: [28.6139, 77.209, 12],
  Bengaluru: [12.9716, 77.5946, 12],
  Kolkata: [22.5726, 88.3639, 12],
  Chennai: [13.0827, 80.2707, 12],
  Hyderabad: [17.385, 78.4867, 12],
  Pune: [18.5204, 73.8567, 12],
  Chandigarh: [30.7333, 76.7794, 12],
};

const DEFAULT_CENTER: [number, number] = [21.0, 78.0];
const DEFAULT_ZOOM = 5;

// Helper component to smoothly reposition map when city changes
const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const AccidentMapPage: React.FC = () => {
  const { selectedCity, setSelectedCity } = useCityFilter();
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<AccidentGeoPoint | null>(null);

  const { data: points, isLoading } = useQuery({
    queryKey: ['geo-accidents', selectedCity, severityFilter],
    queryFn: () => getGeoAccidents(selectedCity, severityFilter, 4000),
  });

  const cityCoords = selectedCity && CITY_COORDINATES[selectedCity]
    ? [CITY_COORDINATES[selectedCity][0], CITY_COORDINATES[selectedCity][1]] as [number, number]
    : DEFAULT_CENTER;
  const zoomLevel = selectedCity && CITY_COORDINATES[selectedCity]
    ? CITY_COORDINATES[selectedCity][2]
    : DEFAULT_ZOOM;

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'Fatal':
        return '#EF4444'; // Classic Crimson
      case 'Severe':
        return '#F59E0B'; // Classic Amber
      case 'Minor':
      default:
        return '#10B981'; // Classic Emerald
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border-dark pb-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>City Blackspots & Danger Zones</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          {selectedCity ? `${selectedCity} Accident Hotspots & Blackspots` : 'Metropolitan Accident Hotspots Map'}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Explore individual crash coordinates, high-risk corridors, and dangerous intersections to plan safer routes.
        </p>
      </div>

      {/* Main Map Box */}
      <div className="relative h-[720px] w-full rounded-2xl overflow-hidden border border-border-dark shadow-card-dark flex">
        {/* Top Floating Controls Bar */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 bg-bg-card/95 backdrop-blur-md p-2 rounded-xl border border-border-dark shadow-xl">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 px-2">
            <Filter className="w-3.5 h-3.5 text-accent-primary" />
            Filter Severity:
          </span>

          {['', 'Fatal', 'Severe', 'Minor'].map((sev) => (
            <button
              key={sev || 'all'}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                severityFilter === sev
                  ? 'bg-accent-primary text-white font-semibold shadow-glow-primary'
                  : 'bg-bg-surface text-text-muted hover:text-white hover:bg-bg-surface/80'
              }`}
            >
              {sev ? `${sev} Accidents` : 'All Incidents'}
            </button>
          ))}

          <div className="h-4 w-px bg-border-dark mx-1 hidden sm:block" />

          <div className="text-xs font-mono text-text-muted px-2">
            {isLoading ? (
              <span className="animate-pulse text-accent-primary">Loading incidents...</span>
            ) : (
              <span>{points ? `${points.length.toLocaleString()} plotted` : '0 points'}</span>
            )}
          </div>
        </div>

        {/* Main Map Container */}
        <div className="flex-1 h-full w-full relative">
          {isLoading && (
            <div className="absolute inset-0 z-[500] bg-bg-main/70 backdrop-blur-sm flex items-center justify-center">
              <LoadingSpinner message="Loading geospatial accident blackspots..." />
            </div>
          )}

          <MapContainer
            center={cityCoords}
            zoom={zoomLevel}
            className="h-full w-full"
            zoomControl={true}
          >
            <MapRecenter center={cityCoords} zoom={zoomLevel} />

            {/* CartoDB Dark Matter Tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>'
              maxZoom={19}
            />

            {points?.map((pt) => {
              const color = getMarkerColor(pt.accident_severity);
              const radius = pt.accident_severity === 'Fatal' ? 7 : pt.accident_severity === 'Severe' ? 5 : 4;

              return (
                <CircleMarker
                  key={pt.accident_id}
                  center={[pt.latitude, pt.longitude]}
                  radius={radius}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.85,
                    color: '#080C15',
                    weight: 1.5,
                  }}
                  eventHandlers={{
                    click: () => setSelectedIncident(pt),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                    <div className="text-xs font-sans">
                      <span className="font-bold text-white">{pt.city}</span> ({pt.accident_severity})
                      <div className="text-[11px] text-text-muted">
                        {pt.road_type} • {pt.hour}:00 hrs • {pt.weather}
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-bg-card/95 backdrop-blur-md p-3.5 rounded-xl border border-border-dark shadow-xl text-xs space-y-2">
            <div className="text-[10px] uppercase font-bold text-text-subtle tracking-wider">
              Collision Severity
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-accent-critical inline-block shadow-glow-critical" />
              <span className="text-text-main font-semibold">Fatal Collision</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-accent-warning inline-block" />
              <span className="text-text-main font-semibold">Severe Injury Crash</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-accent-success inline-block" />
              <span className="text-text-main font-semibold">Minor Vehicle Damage</span>
            </div>
          </div>
        </div>

        {/* Slide-over Detail Drawer */}
        {selectedIncident && (
          <div className="w-84 sm:w-96 bg-bg-card border-l border-border-dark flex flex-col h-full z-[1001] shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-border-dark flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-accent-primary" />
                <span className="font-mono font-bold text-sm text-text-main">
                  Incident #{selectedIncident.accident_id}
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-bg-surface transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
              {/* Severity Pill */}
              <div>
                <span className="text-text-subtle uppercase text-[10px] font-mono block mb-1.5 font-bold">
                  Collision Severity
                </span>
                <Badge
                  variant={
                    selectedIncident.accident_severity === 'Fatal'
                      ? 'fatal'
                      : selectedIncident.accident_severity === 'Severe'
                      ? 'severe'
                      : 'minor'
                  }
                  className="text-xs px-3 py-1 font-bold"
                >
                  {selectedIncident.accident_severity.toUpperCase()} INCIDENT
                </Badge>
              </div>

              {/* Geographic Coordinates */}
              <div className="space-y-2 border-t border-border-dark pt-3">
                <span className="text-text-subtle uppercase text-[10px] font-mono block font-bold">
                  Location & Area
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-bg-surface p-2.5 rounded-lg border border-border-dark">
                  <div>
                    <span className="text-text-subtle block text-[10px]">Latitude</span>
                    <span className="text-text-main font-medium">{selectedIncident.latitude.toFixed(5)}° N</span>
                  </div>
                  <div>
                    <span className="text-text-subtle block text-[10px]">Longitude</span>
                    <span className="text-text-main font-medium">{selectedIncident.longitude.toFixed(5)}° E</span>
                  </div>
                </div>
                <div className="flex justify-between py-1 border-b border-border-dark/60">
                  <span className="text-text-muted">Metropolitan Zone</span>
                  <span className="text-text-main font-bold">{selectedIncident.city}</span>
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-2 border-t border-border-dark pt-3">
                <span className="text-text-subtle uppercase text-[10px] font-mono block font-bold">
                  Crash Context & Timing
                </span>
                <div className="flex justify-between py-1 border-b border-border-dark/60">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent-secondary" /> Incident Date
                  </span>
                  <span className="text-text-main font-medium">{selectedIncident.date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-dark/60">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent-secondary" /> Time of Day
                  </span>
                  <span className="text-text-main font-bold font-mono">{selectedIncident.hour}:00 HRS</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-dark/60">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-accent-secondary" /> Weather
                  </span>
                  <span className="text-text-main font-medium">{selectedIncident.weather}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-dark/60">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-accent-secondary" /> Traffic Flow
                  </span>
                  <span className="text-text-main font-medium">{selectedIncident.traffic_density}</span>
                </div>
              </div>

              {/* Roadway Profile */}
              <div className="space-y-2 border-t border-border-dark pt-3">
                <span className="text-text-subtle uppercase text-[10px] font-mono block font-bold">
                  Roadway Profile
                </span>
                <div className="flex justify-between py-1 border-b border-border-dark/60">
                  <span className="text-text-muted">Road Type</span>
                  <span className="text-text-main font-medium">{selectedIncident.road_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-dark/60">
                  <span className="text-text-muted">OSM Highway</span>
                  <span className="text-accent-primary font-mono font-medium">
                    {selectedIncident.osm_highway || 'Arterial'}
                  </span>
                </div>
              </div>

              {/* Safety Advisory for this type */}
              <div className="p-3.5 rounded-xl bg-bg-surface border border-border-dark space-y-1">
                <div className="text-[11px] font-bold text-accent-warning flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Driver Safety Recommendation</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {selectedIncident.accident_severity === 'Fatal'
                    ? 'High kinetic energy impact zone. Ensure speed stays strictly within legal limits and keep headlights on.'
                    : 'Heavy junction congestion area. Avoid aggressive overtaking and watch for sudden pedestrian or 2-wheeler crossings.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccidentMapPage;

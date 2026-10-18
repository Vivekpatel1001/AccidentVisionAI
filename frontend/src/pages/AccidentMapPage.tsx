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
  Maximize2
} from 'lucide-react';
import { getGeoAccidents } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { AccidentGeoPoint } from '../types/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const CITY_COORDINATES: { [key: string]: [number, number, number] } = {
  Mumbai: [19.076, 72.8777, 11],
  Delhi: [28.6139, 77.209, 11],
  Bengaluru: [12.9716, 77.5946, 11],
  Kolkata: [22.5726, 88.3639, 11],
  Chennai: [13.0827, 80.2707, 11],
  Hyderabad: [17.385, 78.4867, 11],
  Pune: [18.5204, 73.8567, 11],
  Ahmedabad: [23.0225, 72.5714, 11],
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
  const { selectedCity } = useCityFilter();
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
        return '#F87171';
      case 'Severe':
        return '#FBBF24';
      case 'Minor':
      default:
        return '#34D399';
    }
  };

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full rounded-lg overflow-hidden border border-border-dark shadow-card-dark flex">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 bg-bg-card/90 backdrop-blur-md p-2 rounded-lg border border-border-dark shadow-lg">
        <span className="text-xs font-semibold text-text-main flex items-center gap-1.5 px-2">
          <Filter className="w-3.5 h-3.5 text-accent-primary" />
          Severity Filter:
        </span>

        {['', 'Fatal', 'Severe', 'Minor'].map((sev) => (
          <button
            key={sev || 'all'}
            onClick={() => setSeverityFilter(sev)}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              severityFilter === sev
                ? 'bg-accent-primary text-bg-main font-semibold shadow'
                : 'bg-bg-surface text-text-muted hover:text-text-main hover:bg-bg-card'
            }`}
          >
            {sev || 'All Incidents'}
          </button>
        ))}

        <div className="h-4 w-px bg-border-dark mx-1 hidden sm:block" />

        <div className="text-xs font-mono text-text-muted px-2">
          {isLoading ? (
            <span className="animate-pulse">Loading points...</span>
          ) : (
            <span>
              {points ? `${points.length.toLocaleString()} plotted` : '0 points'}
            </span>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 h-full w-full relative">
        {isLoading && (
          <div className="absolute inset-0 z-[500] bg-bg-main/70 backdrop-blur-sm flex items-center justify-center">
            <LoadingSpinner message="Rendering geospatial accident telemetry..." />
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
            const radius = pt.accident_severity === 'Fatal' ? 6 : pt.accident_severity === 'Severe' ? 5 : 4;

            return (
              <CircleMarker
                key={pt.accident_id}
                center={[pt.latitude, pt.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.8,
                  color: '#080D17',
                  weight: 1,
                }}
                eventHandlers={{
                  click: () => setSelectedIncident(pt),
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div className="text-xs font-mono">
                    <span className="font-bold">{pt.accident_id}</span> ({pt.city})
                    <div className="text-[11px] text-text-muted">
                      {pt.accident_severity} • {pt.road_type} • {pt.weather}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-bg-card/90 backdrop-blur-md p-3 rounded-lg border border-border-dark shadow-lg text-xs font-mono space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-text-subtle tracking-wider mb-1">
            Severity Legend
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-accent-critical inline-block shadow-glow-critical" />
            <span className="text-text-main font-medium">Fatal Accident</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-accent-warning inline-block" />
            <span className="text-text-main font-medium">Severe Injury</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-accent-success inline-block" />
            <span className="text-text-main font-medium">Minor Incident</span>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedIncident && (
        <div className="w-80 bg-bg-card border-l border-border-dark flex flex-col h-full z-[1001] shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-border-dark flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-accent-primary" />
              <span className="font-mono font-bold text-sm text-text-main">
                {selectedIncident.accident_id}
              </span>
            </div>
            <button
              onClick={() => setSelectedIncident(null)}
              className="p-1 rounded text-text-muted hover:text-text-main hover:bg-bg-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
            {/* Severity Pill */}
            <div>
              <span className="text-text-subtle uppercase text-[10px] font-mono block mb-1.5 font-bold">
                Classification
              </span>
              <Badge
                variant={
                  selectedIncident.accident_severity === 'Fatal'
                    ? 'fatal'
                    : selectedIncident.accident_severity === 'Severe'
                    ? 'severe'
                    : 'minor'
                }
                className="text-xs px-2.5 py-1"
              >
                {selectedIncident.accident_severity.toUpperCase()} ACCIDENT
              </Badge>
            </div>

            {/* Geographical Attributes */}
            <div className="space-y-2 border-t border-border-dark pt-3">
              <span className="text-text-subtle uppercase text-[10px] font-mono block font-bold">
                Spatial Coordinates
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-bg-surface p-2.5 rounded border border-border-dark">
                <div>
                  <span className="text-text-subtle block">Latitude</span>
                  <span className="text-text-main font-medium">{selectedIncident.latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-text-subtle block">Longitude</span>
                  <span className="text-text-main font-medium">{selectedIncident.longitude.toFixed(6)}</span>
                </div>
              </div>
              <div className="flex justify-between py-1 border-b border-border-dark/60">
                <span className="text-text-muted">Metropolitan Area</span>
                <span className="text-text-main font-medium">{selectedIncident.city}</span>
              </div>
            </div>

            {/* Environmental & Temporal Attributes */}
            <div className="space-y-2 border-t border-border-dark pt-3">
              <span className="text-text-subtle uppercase text-[10px] font-mono block font-bold">
                Temporal & Environmental
              </span>
              <div className="flex justify-between py-1 border-b border-border-dark/60">
                <span className="text-text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent-secondary" /> Date
                </span>
                <span className="text-text-main font-medium">{selectedIncident.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-dark/60">
                <span className="text-text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent-secondary" /> Hour
                </span>
                <span className="text-text-main font-medium">{selectedIncident.hour}:00</span>
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

            {/* Road & OpenStreetMap Layer */}
            <div className="space-y-2 border-t border-border-dark pt-3">
              <span className="text-text-subtle uppercase text-[10px] font-mono block font-bold">
                Infrastructure Linkage
              </span>
              <div className="flex justify-between py-1 border-b border-border-dark/60">
                <span className="text-text-muted">Reported Road Type</span>
                <span className="text-text-main font-medium">{selectedIncident.road_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-dark/60">
                <span className="text-text-muted">OSM Highway</span>
                <span className="text-accent-primary font-mono font-medium">
                  {selectedIncident.osm_highway || 'Unmatched'}
                </span>
              </div>
              {selectedIncident.casualties !== undefined && (
                <div className="flex justify-between py-1 border-b border-border-dark/60">
                  <span className="text-text-muted">Casualties (Ex-Post)</span>
                  <span className="text-accent-critical font-bold">{selectedIncident.casualties}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

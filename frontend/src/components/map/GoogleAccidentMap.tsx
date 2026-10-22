import React, { useEffect, useRef } from 'react';
import { AccidentGeoPoint } from '../../types/api';
import { useGoogleMaps } from '../../utils/googleMapsLoader';
import { CITY_COORDINATES, DEFAULT_MAP_CENTER, CLEAN_LIGHT_MAP_STYLES } from '../../config/maps';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface GoogleAccidentMapProps {
  points: AccidentGeoPoint[];
  city: string;
  severityFilter: string;
  selectedIncident: AccidentGeoPoint | null;
  onSelectIncident: (pt: AccidentGeoPoint) => void;
  isLoading?: boolean;
}

export const GoogleAccidentMap: React.FC<GoogleAccidentMapProps> = ({
  points,
  city,
  severityFilter,
  selectedIncident,
  onSelectIncident,
  isLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const cityMeta = CITY_COORDINATES[city] || DEFAULT_MAP_CENTER;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: cityMeta.lat, lng: cityMeta.lng },
      zoom: cityMeta.zoom,
      styles: CLEAN_LIGHT_MAP_STYLES,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    mapInstanceRef.current = map;
  }, [isLoaded]);

  // Handle City Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const cityMeta = CITY_COORDINATES[city];
    if (cityMeta) {
      mapInstanceRef.current.panTo({ lat: cityMeta.lat, lng: cityMeta.lng });
      mapInstanceRef.current.setZoom(cityMeta.zoom);
    }
  }, [city]);

  // Plot Points
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Filter by severity if selected
    const filteredPoints = points.filter((pt) => {
      if (!severityFilter) return true;
      return String(pt.accident_severity).toLowerCase() === severityFilter.toLowerCase();
    });

    // Sample down to max 800 points for smooth client rendering
    const displayPoints = filteredPoints.length > 800 ? filteredPoints.slice(0, 800) : filteredPoints;

    displayPoints.forEach((pt) => {
      if (typeof pt.latitude !== 'number' || typeof pt.longitude !== 'number') return;
      if (isNaN(pt.latitude) || isNaN(pt.longitude)) return;

      const isFatal = String(pt.accident_severity).toLowerCase() === 'fatal';
      const isSevere = String(pt.accident_severity).toLowerCase() === 'severe' || String(pt.accident_severity).toLowerCase() === 'major';
      const fillColor = isFatal ? '#EF4444' : isSevere ? '#F59E0B' : '#10B981';
      const radius = isFatal ? 7 : isSevere ? 5.5 : 4.5;
      const isSelected = selectedIncident?.accident_id === pt.accident_id;

      const marker = new google.maps.Marker({
        map,
        position: { lat: pt.latitude, lng: pt.longitude },
        title: `ID #${pt.accident_id} (${pt.accident_severity})`,
        zIndex: isFatal ? 100 : isSevere ? 50 : 10,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? radius * 1.5 : radius,
          fillColor,
          fillOpacity: 0.9,
          strokeColor: isSelected ? '#1E3A8A' : '#FFFFFF',
          strokeWeight: isSelected ? 3 : 1.5,
        },
      });

      marker.addListener('click', () => {
        onSelectIncident(pt);
        if (infoWindowRef.current) {
          const badgeClass = isFatal
            ? 'background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;'
            : isSevere
            ? 'background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A;'
            : 'background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;';

          const content = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 200px; color: #0F172A;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 6px;">
                <span style="font-weight: 800; font-size: 13px; color: #0F172A;">ID #${pt.accident_id}</span>
                <span style="font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 9999px; ${badgeClass}">
                  ${pt.accident_severity}
                </span>
              </div>
              <div style="font-size: 12px; color: #334155; margin-bottom: 4px;">
                <strong>${pt.city}</strong> • ${pt.road_type}
              </div>
              <div style="font-size: 11px; color: #64748B;">
                Hour: <strong>${pt.hour}:00 HRS</strong> • Weather: <strong>${pt.weather}</strong>
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });
  }, [points, severityFilter, selectedIncident, isLoaded, onSelectIncident]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 max-w-md text-xs space-y-1">
          <div className="font-bold">Google Maps Load Error</div>
          <div>Unable to load Google Maps API.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {(!isLoaded || isLoading) && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <LoadingSpinner message={!isLoaded ? 'Connecting to Google Maps...' : `Plotting ${points.length} incident locations...`} />
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { AccidentGeoPoint } from '../../types/api';
import { useGoogleMaps } from '../../utils/googleMapsLoader';
import { CITY_COORDINATES, DEFAULT_MAP_CENTER, CLEAN_LIGHT_MAP_STYLES } from '../../config/maps';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface GoogleOverviewMapProps {
  points: AccidentGeoPoint[];
  city: string;
  roadType?: string;
  isLoading?: boolean;
  onSelectPoint?: (pt: AccidentGeoPoint) => void;
}

export const GoogleOverviewMap: React.FC<GoogleOverviewMapProps> = ({
  points,
  city,
  roadType,
  isLoading = false,
  onSelectPoint,
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
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      streetViewControl: false,
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

    // Filter points matching roadType if given
    const filteredPoints = points.filter((pt) => {
      if (!roadType || roadType === 'All') return true;
      const target = roadType.toLowerCase();
      const actual = (pt.road_type || '').toLowerCase();
      if (target === 'local') return actual === 'local' || actual === 'urban';
      return actual === target;
    });

    // Sample down if very large for smooth 60fps Google Map rendering
    const displayPoints = filteredPoints.length > 500 ? filteredPoints.slice(0, 500) : filteredPoints;

    displayPoints.forEach((pt) => {
      if (typeof pt.latitude !== 'number' || typeof pt.longitude !== 'number') return;
      if (isNaN(pt.latitude) || isNaN(pt.longitude)) return;

      const isFatal = String(pt.accident_severity).toLowerCase() === 'fatal';
      const isSevere = String(pt.accident_severity).toLowerCase() === 'severe' || String(pt.accident_severity).toLowerCase() === 'major';
      const fillColor = isFatal ? '#EF4444' : isSevere ? '#F59E0B' : '#10B981';
      const radius = isFatal ? 6.5 : isSevere ? 5 : 4;

      const marker = new google.maps.Marker({
        map,
        position: { lat: pt.latitude, lng: pt.longitude },
        title: `${pt.city} - ${pt.accident_severity}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: radius,
          fillColor,
          fillOpacity: 0.9,
          strokeColor: '#FFFFFF',
          strokeWeight: 1.5,
        },
      });

      marker.addListener('click', () => {
        if (onSelectPoint) onSelectPoint(pt);
        if (infoWindowRef.current) {
          const badgeClass = isFatal
            ? 'background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;'
            : isSevere
            ? 'background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A;'
            : 'background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;';

          const content = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px; min-width: 180px; color: #0F172A;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; margin-bottom: 6px;">
                <span style="font-weight: 800; font-size: 13px; color: #0F172A;">${pt.city}</span>
                <span style="font-weight: 700; font-size: 11px; padding: 1px 7px; border-radius: 9999px; ${badgeClass}">
                  ${pt.accident_severity}
                </span>
              </div>
              <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
                Roadway: <strong style="color: #0F172A;">${pt.road_type}</strong>
              </div>
              <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
                Time: <strong>${pt.hour}:00 HRS</strong> • Weather: <strong>${pt.weather}</strong>
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });
  }, [points, roadType, isLoaded, onSelectPoint]);

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
          <LoadingSpinner message={!isLoaded ? 'Connecting to Google Maps API...' : `Loading ${city} telemetry records...`} />
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

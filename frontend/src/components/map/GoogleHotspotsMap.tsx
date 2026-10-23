import React, { useEffect, useRef } from 'react';
import { HotspotItem } from '../../types/api';
import { useGoogleMaps } from '../../utils/googleMapsLoader';
import { CITY_COORDINATES, DEFAULT_MAP_CENTER, CLEAN_LIGHT_MAP_STYLES } from '../../config/maps';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface GoogleHotspotsMapProps {
  hotspots: HotspotItem[];
  selectedHotspot: HotspotItem | null;
  onSelectHotspot: (h: HotspotItem) => void;
  flyToCenter: [number, number] | null;
  selectedCity?: string;
  epsKm: number;
  isLoading?: boolean;
}

export const GoogleHotspotsMap: React.FC<GoogleHotspotsMapProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  flyToCenter,
  selectedCity,
  epsKm,
  isLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();

  // Helper to resolve city coordinates
  const resolveCityCoords = (name?: string) => {
    if (!name) return null;
    const clean = name.trim();
    if (CITY_COORDINATES[clean]) return CITY_COORDINATES[clean];
    const found = Object.keys(CITY_COORDINATES).find(
      (k) => k.toLowerCase() === clean.toLowerCase()
    );
    return found ? CITY_COORDINATES[found] : null;
  };

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const cityMeta = resolveCityCoords(selectedCity);
    const initialCenter = cityMeta
      ? { lat: cityMeta.lat, lng: cityMeta.lng }
      : { lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng };
    const initialZoom = cityMeta ? cityMeta.zoom : DEFAULT_MAP_CENTER.zoom;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      styles: CLEAN_LIGHT_MAP_STYLES,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    mapInstanceRef.current = map;
  }, [isLoaded, selectedCity]);

  // Handle City Pan/Zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const cityMeta = resolveCityCoords(selectedCity);

    if (cityMeta) {
      mapInstanceRef.current.panTo({ lat: cityMeta.lat, lng: cityMeta.lng });
      mapInstanceRef.current.setZoom(cityMeta.zoom);
    } else if (hotspots.length > 0 && typeof hotspots[0].centroid_lat === 'number') {
      mapInstanceRef.current.panTo({ lat: hotspots[0].centroid_lat, lng: hotspots[0].centroid_lon });
      mapInstanceRef.current.setZoom(selectedCity ? 12 : 6);
    }
  }, [selectedCity, hotspots]);

  // Handle flyToCenter when user clicks an item in the right-side list
  useEffect(() => {
    if (!mapInstanceRef.current || !flyToCenter) return;
    mapInstanceRef.current.panTo({ lat: flyToCenter[0], lng: flyToCenter[1] });
    mapInstanceRef.current.setZoom(13);
  }, [flyToCenter]);

  // Plot Hotspot Circles and Centroid Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear existing circles and markers
    circlesRef.current.forEach((c) => c.setMap(null));
    markersRef.current.forEach((m) => m.setMap(null));
    circlesRef.current = [];
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    hotspots.forEach((h) => {
      if (typeof h.centroid_lat !== 'number' || typeof h.centroid_lon !== 'number') return;
      if (isNaN(h.centroid_lat) || isNaN(h.centroid_lon)) return;

      const position = { lat: h.centroid_lat, lng: h.centroid_lon };
      bounds.extend(position);
      hasPoints = true;

      const isSelected = selectedHotspot?.cluster_id === h.cluster_id;
      const hasFatal = (h.fatal_count || 0) > 0;
      const radiusMeters = h.radius_m || epsKm * 1000;

      // 1. Cluster Buffer Circle
      const circle = new google.maps.Circle({
        map,
        center: position,
        radius: radiusMeters,
        strokeColor: isSelected ? '#2563EB' : hasFatal ? '#DC2626' : '#D97706',
        strokeOpacity: isSelected ? 0.95 : 0.7,
        strokeWeight: isSelected ? 2.5 : 1.5,
        fillColor: hasFatal ? '#EF4444' : '#F59E0B',
        fillOpacity: isSelected ? 0.35 : 0.18,
        clickable: false,
      });
      circlesRef.current.push(circle);

      // 2. Centroid Marker with collision scale
      const markerSize = Math.min(22, Math.max(10, Math.sqrt(h.size) * 2.8));
      const marker = new google.maps.Marker({
        map,
        position,
        title: `${h.name || ('Cluster #' + h.cluster_id)} - ${h.city}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: markerSize,
          fillColor: hasFatal ? '#DC2626' : '#D97706',
          fillOpacity: 0.95,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        label: {
          text: String(h.size),
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 'bold',
        },
      });

      marker.addListener('click', () => {
        onSelectHotspot(h);
        if (infoWindowRef.current) {
          const fatalPct = (h.fatal_ratio * 100).toFixed(1);
          const isHighFatal = parseFloat(fatalPct) > 25;
          const infoContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 240px; max-width: 300px; color: #0F172A; line-height: 1.45;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
                <div>
                  <span style="font-weight: 800; font-size: 13px; color: #DC2626;">🔥 ${h.name || ('Cluster #' + h.cluster_id)}</span>
                  <div style="font-size: 10px; color: #64748B;">${h.city} • High-Density Blackspot</div>
                </div>
                <span style="font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 9999px; ${isHighFatal ? 'background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;' : 'background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A;'}">
                  ${fatalPct}% Fatal
                </span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; background: #F8FAFC; padding: 6px 8px; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 8px;">
                <div><span style="color: #64748B;">Crashes:</span> <strong style="color: #0F172A;">${h.size}</strong></div>
                <div><span style="color: #64748B;">Fatalities:</span> <strong style="color: #DC2626;">${h.fatal_count}</strong></div>
                <div><span style="color: #64748B;">Density:</span> <strong style="color: #0F172A;">${h.density_per_sqkm} /km²</strong></div>
                <div><span style="color: #64748B;">Roadway:</span> <strong style="color: #0F172A;">${h.dominant_road || 'Highway'}</strong></div>
              </div>
              ${h.top_violation ? `
                <div style="font-size: 11px; color: #9A3412; background: #FFF7ED; padding: 4px 8px; border-radius: 6px; border: 1px solid #FFEDD5; margin-bottom: 6px;">
                  <strong>⚠️ Primary Violation:</strong> ${h.top_violation}
                </div>
              ` : ''}
              ${h.top_fatal_mode ? `
                <div style="font-size: 11px; color: #1E40AF; background: #EFF6FF; padding: 4px 8px; border-radius: 6px; border: 1px solid #DBEAFE; margin-bottom: 6px;">
                  <strong>🏍️ Vulnerable User:</strong> ${h.top_fatal_mode}
                </div>
              ` : ''}
            </div>
          `;
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // Auto fit if not single city focus
    if (!selectedCity && hasPoints && hotspots.length > 1) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }, [hotspots, selectedHotspot, isLoaded, epsKm, onSelectHotspot, selectedCity]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 max-w-md text-xs space-y-1">
          <div className="font-bold">Google Maps Load Error</div>
          <div>Unable to load Google Maps API. Please check network connectivity.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {(!isLoaded || isLoading) && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <LoadingSpinner message={!isLoaded ? 'Loading Google Maps Satellite & Roadway Engine...' : 'Calculating DBSCAN haversine clusters...'} />
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

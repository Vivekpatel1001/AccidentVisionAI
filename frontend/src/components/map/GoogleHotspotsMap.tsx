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

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const cityMeta = selectedCity ? CITY_COORDINATES[selectedCity] : null;
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
    const cityMeta = selectedCity ? CITY_COORDINATES[selectedCity] : null;

    if (cityMeta) {
      mapInstanceRef.current.panTo({ lat: cityMeta.lat, lng: cityMeta.lng });
      mapInstanceRef.current.setZoom(cityMeta.zoom);
    } else if (hotspots.length > 0) {
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
        title: `Cluster #${h.cluster_id} - ${h.city}`,
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
          const infoContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px; min-width: 190px; color: #0F172A;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; margin-bottom: 6px;">
                <span style="font-weight: 800; font-size: 13px; color: #0F172A;">Cluster #${h.cluster_id}</span>
                <span style="font-weight: 700; font-size: 11px; color: #2563EB; background: #EFF6FF; padding: 1px 6px; border-radius: 6px;">${h.city}</span>
              </div>
              <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                Total Collisions: <strong style="color: #0F172A;">${h.size}</strong>
              </div>
              <div style="font-size: 12px; color: #DC2626; font-weight: 700; margin-bottom: 4px;">
                Fatal Crashes: ${h.fatal_count} (${(h.fatal_ratio * 100).toFixed(1)}%)
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 4px; margin-top: 4px;">
                <span>${h.dominant_road}</span>
                <strong style="color: #0F172A;">${h.density_per_sqkm} /km²</strong>
              </div>
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

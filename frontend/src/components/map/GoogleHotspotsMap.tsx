import React, { useEffect, useRef, useState } from 'react';
import { HotspotItem, AccidentGeoPoint } from '../../types/api';
import { useGoogleMaps } from '../../utils/googleMapsLoader';
import { CITY_COORDINATES, DEFAULT_MAP_CENTER, CLEAN_LIGHT_MAP_STYLES } from '../../config/maps';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface GoogleHotspotsMapProps {
  hotspots: HotspotItem[];
  points?: AccidentGeoPoint[];
  selectedHotspot: HotspotItem | null;
  onSelectHotspot: (h: HotspotItem) => void;
  onSelectPoint?: (pt: AccidentGeoPoint) => void;
  flyToCenter: [number, number] | null;
  selectedCity?: string;
  epsKm: number;
  isLoading?: boolean;
}

export const GoogleHotspotsMap: React.FC<GoogleHotspotsMapProps> = ({
  hotspots,
  points = [],
  selectedHotspot,
  onSelectHotspot,
  onSelectPoint,
  flyToCenter,
  selectedCity,
  epsKm,
  isLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const hotspotMarkersRef = useRef<google.maps.Marker[]>([]);
  const incidentMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [showHotspots, setShowHotspots] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);

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
    hotspotMarkersRef.current.forEach((m) => m.setMap(null));
    circlesRef.current = [];
    hotspotMarkersRef.current = [];

    if (!showHotspots) return;

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
        zIndex: 500,
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
                <div style="font-size: 11px; color: #1E40AF; background: #EFF6FF; padding: 4px 8px; border-radius: 6px; border: 1px solid #DBEAFE; margin-bottom: 8px;">
                  <strong>🏍️ Vulnerable User:</strong> ${h.top_fatal_mode}
                </div>
              ` : ''}
            </div>
          `;
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(map, marker);
        }
      });

      hotspotMarkersRef.current.push(marker);
    });

    // Auto fit if not single city focus
    if (!selectedCity && hasPoints && hotspots.length > 1) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }, [hotspots, selectedHotspot, isLoaded, epsKm, onSelectHotspot, selectedCity, showHotspots]);

  // Plot Individual Verified Collision Dots
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear old incident markers
    incidentMarkersRef.current.forEach((m) => m.setMap(null));
    incidentMarkersRef.current = [];

    if (!showIncidents || !points || points.length === 0) return;

    const displayPoints = points.length > 3000 ? points.slice(0, 3000) : points;

    displayPoints.forEach((pt) => {
      if (typeof pt.latitude !== 'number' || typeof pt.longitude !== 'number') return;
      if (isNaN(pt.latitude) || isNaN(pt.longitude)) return;

      const isFatal = String(pt.accident_severity).toLowerCase() === 'fatal';
      const isSevere =
        String(pt.accident_severity).toLowerCase() === 'severe' ||
        String(pt.accident_severity).toLowerCase() === 'major';
      const fillColor = isFatal ? '#EF4444' : isSevere ? '#F59E0B' : '#10B981';
      const radius = isFatal ? 6.5 : isSevere ? 5.2 : 4.2;

      const marker = new google.maps.Marker({
        map,
        position: { lat: pt.latitude, lng: pt.longitude },
        title: `Crash #${pt.accident_id} • ${pt.city} • ${pt.accident_severity}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: radius,
          fillColor,
          fillOpacity: 0.90,
          strokeColor: '#FFFFFF',
          strokeWeight: 1.6,
        },
        zIndex: isFatal ? 100 : isSevere ? 50 : 10,
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
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 230px; max-width: 280px; color: #0F172A; line-height: 1.45;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
                <div>
                  <span style="font-weight: 800; font-size: 13px; color: #0F172A;">${pt.city}</span>
                  <div style="font-size: 10px; color: #64748B; font-family: monospace;">Case #${pt.accident_id}</div>
                </div>
                <span style="font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 9999px; ${badgeClass}">
                  ${pt.accident_severity}
                </span>
              </div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 3px;">
                <strong>Roadway:</strong> ${pt.road_type} (${pt.lanes || 4} Lanes)
              </div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 3px;">
                <strong>Timing:</strong> ${pt.date || ''} • ${pt.hour}:00 HRS
              </div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 3px;">
                <strong>Conditions:</strong> ${pt.weather || 'Clear'}
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      incidentMarkersRef.current.push(marker);
    });
  }, [points, showIncidents, isLoaded, onSelectPoint]);

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
      {/* Floating Layer Controls Bar in Top Left */}
      <div className="absolute top-3 left-3 z-[10] flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-semibold">
        <button
          type="button"
          onClick={() => setShowHotspots(!showHotspots)}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            showHotspots
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title="Toggle High-Risk Blackspots Layer"
        >
          <span>🔥</span>
          <span>Hotspots ({hotspots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setShowIncidents(!showIncidents)}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            showIncidents
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title="Toggle Incident Dots Layer"
        >
          <span>⚠️</span>
          <span>Incidents ({points.length})</span>
        </button>
      </div>

      {(!isLoaded || isLoading) && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <LoadingSpinner message={!isLoaded ? 'Loading Google Maps Satellite & Roadway Engine...' : 'Calculating DBSCAN haversine clusters & mapping collision points...'} />
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

export default GoogleHotspotsMap;

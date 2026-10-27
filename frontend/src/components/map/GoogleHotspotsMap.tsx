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
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
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

  // Plot Hotspot Clusters & Count Markers (Matching National Hotspots View)
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear existing circles and hotspot markers
    circlesRef.current.forEach((c) => c.setMap(null));
    hotspotMarkersRef.current.forEach((m) => m.setMap(null));
    circlesRef.current = [];
    hotspotMarkersRef.current = [];

    if (!showHotspots || !hotspots || hotspots.length === 0) return;

    // 1. If a hotspot is actively selected, draw its focus radius zone
    if (selectedHotspot) {
      const lat = typeof selectedHotspot.centroid_lat === 'number'
        ? selectedHotspot.centroid_lat
        : (typeof selectedHotspot.center_latitude === 'number' ? selectedHotspot.center_latitude : null);
      const lon = typeof selectedHotspot.centroid_lon === 'number'
        ? selectedHotspot.centroid_lon
        : (typeof selectedHotspot.center_longitude === 'number' ? selectedHotspot.center_longitude : null);

      if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
        const position = { lat, lng: lon };
        const radiusMeters = selectedHotspot.radius_m || epsKm * 1000;

        const circle = new google.maps.Circle({
          map,
          center: position,
          radius: radiusMeters,
          strokeColor: '#2563EB',
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.08,
          clickable: false,
        });
        circlesRef.current.push(circle);
      }
    }

    // 2. Render verified hotspot clusters with their accident count badges (Image 1 style)
    hotspots.forEach((h) => {
      const lat = typeof h.centroid_lat === 'number' ? h.centroid_lat : (typeof h.center_latitude === 'number' ? h.center_latitude : null);
      const lon = typeof h.centroid_lon === 'number' ? h.centroid_lon : (typeof h.center_longitude === 'number' ? h.center_longitude : null);
      if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;

      const count = h.size || h.cluster_size || 1;
      const isSelected = selectedHotspot?.cluster_id === h.cluster_id;
      const fatalPct = h.fatal_percentage || (h.fatal_ratio ? h.fatal_ratio * 100 : 0);
      const hasFatal = (h.fatal_count || 0) > 0;

      // Scale bubble dynamically with count (12px to 20px)
      const scale = isSelected ? 18 : Math.min(20, Math.max(12, Math.round(11 + Math.sqrt(count) * 1.3)));

      const marker = new google.maps.Marker({
        map,
        position: { lat, lng: lon },
        title: `${h.name || ('Cluster #' + h.cluster_id)} • ${h.city} (${count} crashes)`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale,
          fillColor: hasFatal ? '#DC2626' : '#EA580C',
          fillOpacity: 0.95,
          strokeColor: isSelected ? '#1E3A8A' : '#FFFFFF',
          strokeWeight: isSelected ? 3 : 2,
        },
        label: {
          text: count > 999 ? `${(count / 1000).toFixed(1)}k` : String(count),
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        zIndex: isSelected ? 999 : 200 + Math.min(count, 500),
      });

      marker.addListener('click', () => {
        onSelectHotspot(h);
        map.panTo({ lat, lng: lon });

        if (infoWindowRef.current) {
          const content = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 230px; max-width: 290px; color: #0F172A; line-height: 1.45;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
                <div>
                  <span style="font-weight: 800; font-size: 13px; color: #DC2626;">🔥 ${h.name || ('Cluster #' + h.cluster_id)}</span>
                  <div style="font-size: 10px; color: #64748B;">${h.city} • Verified High-Risk Blackspot</div>
                </div>
                <span style="font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;">
                  ${Number(fatalPct).toFixed(1)}% Fatal
                </span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; background: #F8FAFC; padding: 6px 8px; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 6px;">
                <div><span style="color: #64748B;">Collisions:</span> <strong style="color: #0F172A;">${count}</strong></div>
                <div><span style="color: #64748B;">Fatalities:</span> <strong style="color: #DC2626;">${h.fatal_count || 0}</strong></div>
                <div><span style="color: #64748B;">Density:</span> <strong style="color: #0F172A;">${h.density_per_sqkm || 120}/km²</strong></div>
                <div><span style="color: #64748B;">Roadway:</span> <strong style="color: #0F172A;">${h.dominant_road || h.top_road_type || 'Highway'}</strong></div>
              </div>
              ${h.top_violation ? `
                <div style="font-size: 10px; color: #9A3412; background: #FFF7ED; padding: 3px 6px; border-radius: 6px; border: 1px solid #FFEDD5; margin-bottom: 4px;">
                  <strong>Violation:</strong> ${h.top_violation}
                </div>
              ` : ''}
              <div style="text-align: center; border-top: 1px dashed #E2E8F0; padding-top: 5px; font-size: 10px; color: #2563EB; font-weight: 700;">
                Click row in table to inspect complete blackspot dossier
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      hotspotMarkersRef.current.push(marker);
    });
  }, [hotspots, selectedHotspot, showHotspots, isLoaded, epsKm, onSelectHotspot]);

  // Plot Individual Verified Collision Dots
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear old incident markers
    incidentMarkersRef.current.forEach((m) => m.setMap(null));
    incidentMarkersRef.current = [];

    if (!showIncidents || !points || points.length === 0) return;

    // Prioritize critical fatal & severe crash points, capping at 350 for silky 60fps rendering
    const fatalPts = points.filter((p) => String(p.accident_severity).toLowerCase() === 'fatal');
    const severePts = points.filter((p) => {
      const s = String(p.accident_severity).toLowerCase();
      return s === 'severe' || s === 'major';
    });
    const minorPts = points.filter((p) => {
      const s = String(p.accident_severity).toLowerCase();
      return s !== 'fatal' && s !== 'severe' && s !== 'major';
    });

    const displayPoints = [
      ...fatalPts.slice(0, 150),
      ...severePts.slice(0, 120),
      ...minorPts.slice(0, 80),
    ];

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

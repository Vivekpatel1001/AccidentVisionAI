import React, { useEffect, useRef } from 'react';
import { AccidentGeoPoint, HotspotItem } from '../../types/api';
import { useGoogleMaps } from '../../utils/googleMapsLoader';
import { CITY_COORDINATES, DEFAULT_MAP_CENTER, CLEAN_LIGHT_MAP_STYLES, lookupCoordinatesAsync } from '../../config/maps';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface RouteSummary {
  distance: string;
  duration: string;
}

interface GoogleAccidentMapProps {
  points: AccidentGeoPoint[];
  hotspots?: HotspotItem[];
  city?: string;
  source?: string;
  destination?: string;
  severityFilter?: string;
  roadTypeFilter?: string;
  showHotspots?: boolean;
  showIncidents?: boolean;
  selectedIncident: AccidentGeoPoint | null;
  selectedHotspot?: HotspotItem | null;
  onSelectIncident: (pt: AccidentGeoPoint) => void;
  onSelectHotspot?: (h: HotspotItem) => void;
  onRouteCalculated?: (summary: RouteSummary) => void;
  isLoading?: boolean;
}

export const GoogleAccidentMap: React.FC<GoogleAccidentMapProps> = ({
  points,
  hotspots = [],
  city,
  source,
  destination,
  severityFilter = '',
  roadTypeFilter = 'All',
  showHotspots = true,
  showIncidents = true,
  selectedIncident,
  selectedHotspot,
  onSelectIncident,
  onSelectHotspot,
  onRouteCalculated,
  isLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const incidentMarkersRef = useRef<google.maps.Marker[]>([]);
  const hotspotCirclesRef = useRef<google.maps.Circle[]>([]);
  const hotspotMarkersRef = useRef<google.maps.Marker[]>([]);
  const endpointMarkersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const fallbackPolylineRef = useRef<google.maps.Polyline | null>(null);
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

  // 1. Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const isNational = !city || city.toLowerCase().includes('national') || city.toLowerCase().includes('all');
    const cityMeta = isNational ? DEFAULT_MAP_CENTER : (resolveCityCoords(city) || DEFAULT_MAP_CENTER);

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: cityMeta.lat, lng: cityMeta.lng },
      zoom: isNational ? 5 : (cityMeta.zoom || 11),
      styles: CLEAN_LIGHT_MAP_STYLES,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    infoWindowRef.current = new google.maps.InfoWindow();

    // Directions renderer
    const renderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#2563EB',
        strokeOpacity: 0.9,
        strokeWeight: 6,
      },
    });
    directionsRendererRef.current = renderer;

    mapInstanceRef.current = map;
  }, [isLoaded]);

  // 2. Handle City Pan/Zoom or National Reset
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const isNational = !city || city.toLowerCase().includes('national') || city.toLowerCase().includes('all');

    if (isNational) {
      map.setCenter({ lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng });
      map.setZoom(5);
    } else {
      const cityMeta = resolveCityCoords(city);
      if (cityMeta) {
        map.panTo({ lat: cityMeta.lat, lng: cityMeta.lng });
        map.setZoom(cityMeta.zoom || 11);
      }
    }
  }, [city]);

  // 3. Driving Route Rendering (when source and destination exist)
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    const src = source?.trim() || city?.trim();
    const dst = destination?.trim();

    // Clear previous polyline & endpoint markers
    if (fallbackPolylineRef.current) {
      fallbackPolylineRef.current.setMap(null);
      fallbackPolylineRef.current = null;
    }
    endpointMarkersRef.current.forEach((m) => m.setMap(null));
    endpointMarkersRef.current = [];

    if (!src || !dst || src.toLowerCase() === dst.toLowerCase() || src.toLowerCase().includes('all')) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.set('directions', null);
      }
      return;
    }

    let isCurrentRequest = true;

    // Helper to draw custom polyline and endpoints
    const drawCustomRoute = (
      pathCoords: google.maps.LatLng[],
      startCoord: { lat: number; lng: number },
      endCoord: { lat: number; lng: number },
      distKmStr: string,
      durStr: string
    ) => {
      if (!isCurrentRequest) return;

      if (fallbackPolylineRef.current) {
        fallbackPolylineRef.current.setMap(null);
      }
      endpointMarkersRef.current.forEach((m) => m.setMap(null));
      endpointMarkersRef.current = [];

      const poly = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#2563EB',
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map,
      });
      fallbackPolylineRef.current = poly;

      const bounds = new google.maps.LatLngBounds();
      pathCoords.forEach((pt) => bounds.extend(pt));

      // Origin Pin 'A' (Emerald)
      const startMarker = new google.maps.Marker({
        position: startCoord,
        map,
        title: `Origin: ${src}`,
        label: { text: 'A', color: '#FFFFFF', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
      });

      // Destination Pin 'B' (Crimson)
      const endMarker = new google.maps.Marker({
        position: endCoord,
        map,
        title: `Destination: ${dst}`,
        label: { text: 'B', color: '#FFFFFF', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: '#DC2626',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
      });

      endpointMarkersRef.current = [startMarker, endMarker];
      map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });

      if (onRouteCalculated) {
        onRouteCalculated({
          distance: distKmStr,
          duration: durStr,
        });
      }
    };

    // Geodesic fallback helper
    const drawFallbackRoute = (
      p1: { lat: number; lng: number },
      p2: { lat: number; lng: number }
    ) => {
      const R = 6371;
      const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
      const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) *
          Math.cos((p2.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const straightKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))));
      const roadKm = Math.round(straightKm * 1.28);
      const hours = Math.floor(roadKm / 65);
      const mins = Math.round(((roadKm / 65) - hours) * 60);

      const pathCoords = [new google.maps.LatLng(p1.lat, p1.lng), new google.maps.LatLng(p2.lat, p2.lng)];
      drawCustomRoute(
        pathCoords,
        p1,
        p2,
        `${roadKm} km`,
        hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`
      );
    };

    // Universal coordinate resolution and OSRM turn-by-turn driving routing
    Promise.all([lookupCoordinatesAsync(src), lookupCoordinatesAsync(dst)]).then(
      ([startPt, endPt]) => {
        if (!isCurrentRequest) return;
        if (!startPt || !endPt) return;

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startPt.lng},${startPt.lat};${endPt.lng},${endPt.lat}?overview=full&geometries=geojson`;

        fetch(osrmUrl)
          .then((r) => r.json())
          .then((data) => {
            if (!isCurrentRequest) return;
            if (data.code === 'Ok' && data.routes && data.routes[0]?.geometry?.coordinates) {
              const rawCoords: [number, number][] = data.routes[0].geometry.coordinates;
              const gPath = rawCoords.map((c) => new google.maps.LatLng(c[1], c[0]));
              const distKm = Math.round(data.routes[0].distance / 1000);
              const durSec = data.routes[0].duration;
              const hours = Math.floor(durSec / 3600);
              const mins = Math.round((durSec % 3600) / 60);
              const durStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

              drawCustomRoute(gPath, startPt, endPt, `${distKm} km`, durStr);
            } else {
              throw new Error('OSRM empty coordinates');
            }
          })
          .catch(() => {
            if (!isCurrentRequest) return;
            drawFallbackRoute(startPt, endPt);
          });
      }
    );

    return () => {
      isCurrentRequest = false;
    };
  }, [source, destination, city, isLoaded]);

  // 4. Plot Hotspot Clusters & Selected Focus Boundary
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear old hotspot circles and markers
    hotspotCirclesRef.current.forEach((c) => c.setMap(null));
    hotspotMarkersRef.current.forEach((m) => m.setMap(null));
    hotspotCirclesRef.current = [];
    hotspotMarkersRef.current = [];

    if (!showHotspots || !hotspots || hotspots.length === 0) return;

    // A. Focus boundary if a hotspot is actively selected
    if (selectedHotspot) {
      const lat = typeof selectedHotspot.centroid_lat === 'number'
        ? selectedHotspot.centroid_lat
        : (typeof selectedHotspot.center_latitude === 'number' ? selectedHotspot.center_latitude : null);
      const lon = typeof selectedHotspot.centroid_lon === 'number'
        ? selectedHotspot.centroid_lon
        : (typeof selectedHotspot.center_longitude === 'number' ? selectedHotspot.center_longitude : null);

      if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
        const pos = { lat, lng: lon };
        const radiusMeters = selectedHotspot.radius_m || 850;

        const circle = new google.maps.Circle({
          map,
          center: pos,
          radius: radiusMeters,
          strokeColor: '#2563EB',
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.08,
          clickable: false,
        });
        hotspotCirclesRef.current.push(circle);

        map.panTo(pos);
        if ((map.getZoom() || 11) < 13) {
          map.setZoom(13);
        }
      }
    }

    // B. Plot verified hotspot cluster count badges (Image 1 style)
    hotspots.forEach((h) => {
      const lat = typeof h.centroid_lat === 'number' ? h.centroid_lat : (typeof h.center_latitude === 'number' ? h.center_latitude : null);
      const lon = typeof h.centroid_lon === 'number' ? h.centroid_lon : (typeof h.center_longitude === 'number' ? h.center_longitude : null);
      if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;

      const count = h.size || h.cluster_size || 1;
      const isSelected = selectedHotspot?.cluster_id === h.cluster_id;
      const fatalPct = h.fatal_percentage || (h.fatal_ratio ? h.fatal_ratio * 100 : 0);
      const hasFatal = (h.fatal_count || 0) > 0;

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
        if (onSelectHotspot) onSelectHotspot(h);
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
                Click to inspect active hotspot corridor
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      hotspotMarkersRef.current.push(marker);
    });
  }, [hotspots, selectedHotspot, showHotspots, isLoaded, onSelectHotspot]);

  // 5. Plot Verified Collision Dots (Fatal Red, Severe Orange, Minor Green)
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    incidentMarkersRef.current.forEach((m) => m.setMap(null));
    incidentMarkersRef.current = [];

    if (!showIncidents || !points || points.length === 0) return;

    // Filter points matching roadTypeFilter and severityFilter
    const filteredPoints = points.filter((pt) => {
      if (severityFilter && String(pt.accident_severity).toLowerCase() !== severityFilter.toLowerCase()) {
        return false;
      }
      if (roadTypeFilter && roadTypeFilter !== 'All') {
        const target = roadTypeFilter.toLowerCase();
        const actual = (pt.road_type || '').toLowerCase();
        if (target === 'local') return actual === 'local' || actual === 'urban';
        if (actual !== target) return false;
      }
      return true;
    });

    // Prioritize critical fatal & severe crash points, capping at 400 to ensure silky 60fps rendering and zero browser freezing
    const fatalPts = filteredPoints.filter((p) => String(p.accident_severity).toLowerCase() === 'fatal');
    const severePts = filteredPoints.filter((p) => {
      const s = String(p.accident_severity).toLowerCase();
      return s === 'severe' || s === 'major';
    });
    const minorPts = filteredPoints.filter((p) => {
      const s = String(p.accident_severity).toLowerCase();
      return s !== 'fatal' && s !== 'severe' && s !== 'major';
    });

    const displayPoints = [
      ...fatalPts.slice(0, 180),
      ...severePts.slice(0, 140),
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
      const isSelected = selectedIncident?.accident_id === pt.accident_id;

      const marker = new google.maps.Marker({
        map,
        position: { lat: pt.latitude, lng: pt.longitude },
        title: `Crash #${pt.accident_id} • ${pt.city} • ${pt.accident_severity}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? radius * 1.6 : radius,
          fillColor,
          fillOpacity: 0.92,
          strokeColor: isSelected ? '#1E3A8A' : '#FFFFFF',
          strokeWeight: isSelected ? 3 : 1.6,
        },
        zIndex: isSelected ? 999 : isFatal ? 100 : isSevere ? 50 : 10,
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
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 230px; max-width: 290px; color: #0F172A; line-height: 1.45;">
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
                <strong>Roadway:</strong> ${pt.road_type} (${pt.lanes || 4} Lanes${pt.traffic_signal ? ' • Signal' : ' • No Signal'})
              </div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 3px;">
                <strong>Timing:</strong> ${pt.date || ''} • ${pt.hour}:00 HRS
              </div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 3px;">
                <strong>Conditions:</strong> ${pt.weather || 'Clear'} • Density: ${pt.traffic_density || 'Medium'}
              </div>
              ${
                pt.casualties !== undefined
                  ? `<div style="font-size: 11px; color: ${isFatal ? '#DC2626' : '#D97706'}; font-weight: 700; margin-bottom: 4px;">
                      Impact: ${pt.casualties} Casualties • ${pt.vehicles_involved || 2} Vehicles
                    </div>`
                  : ''
              }
              ${
                pt.cause
                  ? `<div style="font-size: 10px; color: #64748B; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 4px 6px; border-radius: 6px; margin-top: 6px;">
                      <strong>Cause:</strong> ${pt.cause}
                    </div>`
                  : ''
              }
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      incidentMarkersRef.current.push(marker);
    });
  }, [points, severityFilter, roadTypeFilter, showIncidents, selectedIncident, isLoaded, onSelectIncident]);

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
          <LoadingSpinner
            message={
              !isLoaded
                ? 'Connecting to Google Maps API...'
                : `Plotting verified crash records & blackspots...`
            }
          />
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

export default GoogleAccidentMap;

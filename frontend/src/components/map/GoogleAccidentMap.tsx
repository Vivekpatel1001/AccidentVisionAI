import React, { useEffect, useRef } from 'react';
import { AccidentGeoPoint, HotspotItem } from '../../types/api';
import { useGoogleMaps } from '../../utils/googleMapsLoader';
import { CITY_COORDINATES, DEFAULT_MAP_CENTER, CLEAN_LIGHT_MAP_STYLES } from '../../config/maps';
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
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
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

    // Clear previous fallback polyline & endpoint markers
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

    const directionsService = new google.maps.DirectionsService();

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
      const straightKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      const roadKm = Math.round(straightKm * 1.25);
      const hours = Math.floor(roadKm / 65);
      const mins = Math.round(((roadKm / 65) - hours) * 60);

      const pathCoords = [new google.maps.LatLng(p1.lat, p1.lng), new google.maps.LatLng(p2.lat, p2.lng)];
      const poly = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#2563EB',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map,
      });
      fallbackPolylineRef.current = poly;

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(p1);
      bounds.extend(p2);
      map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });

      // Origin Marker 'A'
      const startM = new google.maps.Marker({
        position: p1,
        map,
        title: `Origin: ${src}`,
        label: { text: 'A', color: '#FFFFFF', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      // Destination Marker 'B'
      const endM = new google.maps.Marker({
        position: p2,
        map,
        title: `Destination: ${dst}`,
        label: { text: 'B', color: '#FFFFFF', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: '#DC2626',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      endpointMarkersRef.current = [startM, endM];

      if (onRouteCalculated) {
        onRouteCalculated({
          distance: `~${roadKm} km`,
          duration: hours > 0 ? `~${hours}h ${mins}m` : `~${mins} mins`,
        });
      }
    };

    directionsService.route(
      {
        origin: `${src}, India`,
        destination: `${dst}, India`,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result);
          }
          const leg = result.routes[0]?.legs[0];
          if (leg && onRouteCalculated) {
            onRouteCalculated({
              distance: leg.distance?.text || '',
              duration: leg.duration?.text || '',
            });
          }
        } else {
          // Fallback to coordinates
          const c1 = resolveCityCoords(src);
          const c2 = resolveCityCoords(dst);
          if (c1 && c2) {
            drawFallbackRoute(c1, c2);
          }
        }
      }
    );
  }, [source, destination, city, isLoaded]);

  // 4. Plot Selected Hotspot Focus Boundary (Subtle highlight only when a blackspot is clicked)
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear old hotspot circles and markers
    hotspotCirclesRef.current.forEach((c) => c.setMap(null));
    hotspotMarkersRef.current.forEach((m) => m.setMap(null));
    hotspotCirclesRef.current = [];
    hotspotMarkersRef.current = [];

    if (!selectedHotspot) return;

    const lat = typeof selectedHotspot.centroid_lat === 'number'
      ? selectedHotspot.centroid_lat
      : (typeof selectedHotspot.center_latitude === 'number' ? selectedHotspot.center_latitude : null);
    const lon = typeof selectedHotspot.centroid_lon === 'number'
      ? selectedHotspot.centroid_lon
      : (typeof selectedHotspot.center_longitude === 'number' ? selectedHotspot.center_longitude : null);

    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;

    const pos = { lat, lng: lon };
    const radiusMeters = selectedHotspot.radius_m || 850;

    // Elegant, ultra-subtle focal zone highlight (NO big red blocks, NO numbers)
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
  }, [selectedHotspot, isLoaded]);

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

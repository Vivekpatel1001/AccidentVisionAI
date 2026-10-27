import React, { useEffect, useRef, useState } from 'react';
import { AccidentGeoPoint, HotspotItem } from '../../types/api';
import { useGoogleMaps } from '../../utils/googleMapsLoader';
import { CITY_COORDINATES, DEFAULT_MAP_CENTER, CLEAN_LIGHT_MAP_STYLES, lookupCoordinatesAsync } from '../../config/maps';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface RouteSummary {
  distance: string;
  duration: string;
  distanceKm?: number;
  durationMinutes?: number;
  departureTime?: string;
  arrivalTime?: string;
  trafficDelayText?: string;
  startAddress?: string;
  endAddress?: string;
}

interface GoogleOverviewMapProps {
  points: AccidentGeoPoint[];
  hotspots?: HotspotItem[];
  city: string;
  source?: string;
  destination?: string;
  roadType?: string;
  isLoading?: boolean;
  selectedHotspot?: HotspotItem | null;
  selectedPoint?: AccidentGeoPoint | null;
  departureHour?: number;
  travelDate?: string;
  trafficDensity?: string;
  onSelectHotspot?: (h: HotspotItem) => void;
  onSelectPoint?: (pt: AccidentGeoPoint) => void;
  onRouteCalculating?: () => void;
  onRouteCalculated?: (summary: RouteSummary) => void;
}

export const GoogleOverviewMap: React.FC<GoogleOverviewMapProps> = ({
  points,
  hotspots = [],
  city,
  source,
  destination,
  roadType,
  isLoading = false,
  selectedHotspot,
  selectedPoint,
  departureHour = 14,
  travelDate,
  trafficDensity = 'Medium',
  onSelectHotspot,
  onSelectPoint,
  onRouteCalculating,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const hotspotMarkersRef = useRef<google.maps.Marker[]>([]);
  const hotspotCirclesRef = useRef<google.maps.Circle[]>([]);
  const endpointMarkersRef = useRef<google.maps.Marker[]>([]);
  const fallbackPolylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const cachedRouteRef = useRef<{
    key: string;
    pathCoords: google.maps.LatLng[];
    startPt: { lat: number; lng: number };
    endPt: { lat: number; lng: number };
    distMeters: number;
    durSec: number;
  } | null>(null);

  const [showHotspots, setShowHotspots] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [activeRoadFilter, setActiveRoadFilter] = useState<'All' | 'Highway' | 'Urban' | 'Rural'>('All');

  const { isLoaded, loadError } = useGoogleMaps();

  // Helper to resolve city coordinates
  const resolveCoords = (name?: string): { lat: number; lng: number; zoom?: number } | null => {
    if (!name) return null;
    const clean = name.trim();
    if (CITY_COORDINATES[clean]) return CITY_COORDINATES[clean];
    const key = Object.keys(CITY_COORDINATES).find(
      (k) => k.toLowerCase() === clean.toLowerCase()
    );
    if (key) return CITY_COORDINATES[key];
    return null;
  };

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const cityMeta = resolveCoords(city) || DEFAULT_MAP_CENTER;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: cityMeta.lat, lng: cityMeta.lng },
      zoom: (typeof cityMeta.zoom === 'number' ? cityMeta.zoom : 11),
      styles: CLEAN_LIGHT_MAP_STYLES,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    mapInstanceRef.current = map;
  }, [isLoaded]);

  // Compute accurate travel timing, traffic congestion impact, and departure-to-arrival schedule
  const computeJourneySchedule = (
    distanceMeters: number,
    durationSeconds: number,
    depHour: number = 14,
    trafficDensityStr: string = 'Medium'
  ) => {
    const distKm = Math.round(distanceMeters / 1000);
    const baseMins = Math.round(durationSeconds / 60);

    // Peak traffic detection: 8-11 AM and 17-20 PM
    const isRushHour = (depHour >= 8 && depHour <= 11) || (depHour >= 17 && depHour <= 20);
    const densityLower = trafficDensityStr?.toLowerCase() || 'medium';
    const isHighTraffic = densityLower === 'high' || isRushHour;

    let delayMins = 0;
    let delayText = 'Free-flow traffic throughput';
    if (isHighTraffic) {
      delayMins = Math.max(12, Math.round(baseMins * 0.18));
      delayText = `+${delayMins}m (Peak Traffic Delay)`;
    } else if (densityLower === 'low') {
      delayMins = 0;
      delayText = 'Clear open highway conditions';
    } else {
      delayMins = Math.round(baseMins * 0.05);
      delayText = delayMins > 0 ? `+${delayMins}m (Standard friction)` : 'Free-flow conditions';
    }

    const totalMins = Math.max(10, baseMins + delayMins);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

    // Calculate arrival window
    const depTimeStr = `${depHour.toString().padStart(2, '0')}:00 HRS`;
    const depTotalMins = depHour * 60;
    const arrTotalMins = depTotalMins + totalMins;
    const arrHour = Math.floor(arrTotalMins / 60) % 24;
    const arrMin = arrTotalMins % 60;
    const daysAdded = Math.floor(arrTotalMins / (24 * 60));
    const arrTimeStr = `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')} HRS${daysAdded > 0 ? ' (+1 Day)' : ''}`;

    return {
      distKm,
      durationText,
      totalMins,
      delayText,
      depTimeStr,
      arrTimeStr,
    };
  };

  // Geodesic distance calculation fallback
  const computeApproxRoute = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
    const roadKm = Math.round(straightKm * 1.28);
    const durSec = Math.round((roadKm / 65) * 3600);
    return {
      distanceMeters: roadKm * 1000,
      durationSeconds: durSec,
    };
  };

  // Handle Turn-by-Turn Driving Route rendering between Source & Destination
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    const src = source?.trim() || city?.trim();
    const dst = destination?.trim();

    if (!src || !dst || src.toLowerCase() === dst.toLowerCase()) {
      if (fallbackPolylineRef.current) {
        fallbackPolylineRef.current.setMap(null);
        fallbackPolylineRef.current = null;
      }
      endpointMarkersRef.current.forEach((m) => m.setMap(null));
      endpointMarkersRef.current = [];
      cachedRouteRef.current = null;
      return;
    }

    const currentRouteKey = `${src.toLowerCase()}->${dst.toLowerCase()}`;

    // Fast path: if the corridor route geometry is already loaded, update schedule instantly (0ms)
    if (cachedRouteRef.current && cachedRouteRef.current.key === currentRouteKey) {
      const cached = cachedRouteRef.current;
      const schedule = computeJourneySchedule(cached.distMeters, cached.durSec, departureHour, trafficDensity);
      if (onRouteCalculated) {
        onRouteCalculated({
          distance: `${schedule.distKm} km`,
          duration: schedule.durationText,
          distanceKm: schedule.distKm,
          durationMinutes: schedule.totalMins,
          departureTime: schedule.depTimeStr,
          arrivalTime: schedule.arrTimeStr,
          trafficDelayText: schedule.delayText,
          startAddress: `${src}, India`,
          endAddress: `${dst}, India`,
        });
      }
      return;
    }

    // Clear previous polyline & markers for new corridor endpoints
    if (fallbackPolylineRef.current) {
      fallbackPolylineRef.current.setMap(null);
      fallbackPolylineRef.current = null;
    }
    endpointMarkersRef.current.forEach((m) => m.setMap(null));
    endpointMarkersRef.current = [];

    // Inform parent that new route is being calculated
    if (onRouteCalculating) {
      onRouteCalculating();
    }

    let isCurrentRequest = true;

    // Helper to draw custom polyline and endpoints
    const drawCustomRoute = (
      pathCoords: google.maps.LatLng[],
      startCoord: { lat: number; lng: number },
      endCoord: { lat: number; lng: number },
      schedule: ReturnType<typeof computeJourneySchedule>,
      distMeters: number,
      durSec: number
    ) => {
      if (!isCurrentRequest) return;

      cachedRouteRef.current = {
        key: currentRouteKey,
        pathCoords,
        startPt: startCoord,
        endPt: endCoord,
        distMeters,
        durSec,
      };

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

      // Destination Pin 'B' (Blue)
      const endMarker = new google.maps.Marker({
        position: endCoord,
        map,
        title: `Destination: ${dst}`,
        label: { text: 'B', color: '#FFFFFF', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
      });

      endpointMarkersRef.current = [startMarker, endMarker];
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });

      if (onRouteCalculated) {
        onRouteCalculated({
          distance: `${schedule.distKm} km`,
          duration: schedule.durationText,
          distanceKm: schedule.distKm,
          durationMinutes: schedule.totalMins,
          departureTime: schedule.depTimeStr,
          arrivalTime: schedule.arrTimeStr,
          trafficDelayText: schedule.delayText,
          startAddress: `${src}, India`,
          endAddress: `${dst}, India`,
        });
      }
    };

    // Universal resolution: check dictionary, backend, Open-Meteo
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
              const distMeters = data.routes[0].distance;
              const durSec = data.routes[0].duration;

              const schedule = computeJourneySchedule(distMeters, durSec, departureHour, trafficDensity);
              drawCustomRoute(gPath, startPt, endPt, schedule, distMeters, durSec);
            } else {
              throw new Error('OSRM empty coordinates');
            }
          })
          .catch(() => {
            if (!isCurrentRequest) return;
            // Direct geodesic interpolation fallback
            const approx = computeApproxRoute(startPt, endPt);
            const schedule = computeJourneySchedule(approx.distanceMeters, approx.durationSeconds, departureHour, trafficDensity);
            const straightPath = [
              new google.maps.LatLng(startPt.lat, startPt.lng),
              new google.maps.LatLng(endPt.lat, endPt.lng),
            ];
            drawCustomRoute(straightPath, startPt, endPt, schedule, approx.distanceMeters, approx.durationSeconds);
          });
      }
    );

    return () => {
      isCurrentRequest = false;
    };
  }, [source, destination, departureHour, travelDate, trafficDensity, isLoaded]);

  // Handle City Pan when destination is not specified
  useEffect(() => {
    if (!mapInstanceRef.current || destination) return;
    const cityMeta = resolveCoords(city);
    if (cityMeta) {
      mapInstanceRef.current.panTo({ lat: cityMeta.lat, lng: cityMeta.lng });
      if (typeof cityMeta.zoom === 'number') {
        mapInstanceRef.current.setZoom(cityMeta.zoom);
      }
    }
  }, [city, destination]);

  // Plot Hotspot Clusters & Selected Focus Boundary
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear old hotspot markers & buffer circles
    hotspotCirclesRef.current.forEach((c) => c.setMap(null));
    hotspotMarkersRef.current.forEach((m) => m.setMap(null));
    hotspotCirclesRef.current = [];
    hotspotMarkersRef.current = [];

    // 1. Subtle focal zone highlight when a hotspot is selected
    if (selectedHotspot) {
      const lat = typeof selectedHotspot.centroid_lat === 'number'
        ? selectedHotspot.centroid_lat
        : (typeof selectedHotspot.center_latitude === 'number' ? selectedHotspot.center_latitude : null);
      const lon = typeof selectedHotspot.centroid_lon === 'number'
        ? selectedHotspot.centroid_lon
        : (typeof selectedHotspot.center_longitude === 'number' ? selectedHotspot.center_longitude : null);

      if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
        const pos = { lat, lng: lon };
        const radiusMeters = selectedHotspot.radius_m || 800;

        const circle = new google.maps.Circle({
          map,
          center: pos,
          radius: radiusMeters,
          strokeColor: '#2563EB',
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.07,
          clickable: false,
        });
        hotspotCirclesRef.current.push(circle);
      }
    }

    // 2. Plot verified hotspot cluster count badges (Image 1 style)
    if (hotspots && hotspots.length > 0) {
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
                    <div style="font-size: 10px; color: #64748B;">${h.city} • High-Risk Blackspot</div>
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
                  Click to inspect full investigation dossier
                </div>
              </div>
            `;
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(map, marker);
          }
        });

        hotspotMarkersRef.current.push(marker);
      });
    }
  }, [hotspots, selectedHotspot, isLoaded, onSelectHotspot]);

  // Synchronize Map view and InfoWindow when selectedHotspot changes from external selection
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !selectedHotspot) return;
    const lat = typeof selectedHotspot.centroid_lat === 'number' ? selectedHotspot.centroid_lat : (typeof selectedHotspot.center_latitude === 'number' ? selectedHotspot.center_latitude : null);
    const lon = typeof selectedHotspot.centroid_lon === 'number' ? selectedHotspot.centroid_lon : (typeof selectedHotspot.center_longitude === 'number' ? selectedHotspot.center_longitude : null);
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;

    const map = mapInstanceRef.current;
    map.panTo({ lat, lng: lon });
    if ((map.getZoom() || 11) < 13) {
      map.setZoom(13);
    }

    if (infoWindowRef.current) {
      const count = selectedHotspot.size || selectedHotspot.cluster_size || 15;
      const fatalPct = selectedHotspot.fatal_percentage || (selectedHotspot.fatal_ratio ? (selectedHotspot.fatal_ratio * 100).toFixed(1) : '35.0');
      const isHigh = parseFloat(String(fatalPct)) > 30;

      const content = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 250px; max-width: 320px; color: #0F172A; line-height: 1.45;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <span style="font-weight: 800; font-size: 13px; color: #DC2626;">🔥 ${selectedHotspot.name || ('Cluster #' + selectedHotspot.cluster_id)}</span>
              <div style="font-size: 10px; color: #64748B;">${selectedHotspot.city} • High-Density Blackspot</div>
            </div>
            <span style="font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 9999px; ${isHigh ? 'background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;' : 'background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A;'}">
              ${fatalPct}% Fatal Rate
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; background: #F8FAFC; padding: 6px 8px; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 8px;">
            <div><span style="color: #64748B;">Crashes:</span> <strong style="color: #0F172A;">${count}</strong></div>
            <div><span style="color: #64748B;">Fatalities:</span> <strong style="color: #DC2626;">${selectedHotspot.fatal_count}</strong></div>
            <div><span style="color: #64748B;">Density:</span> <strong style="color: #0F172A;">${selectedHotspot.density_per_sqkm || 150} /km²</strong></div>
            <div><span style="color: #64748B;">Roadway:</span> <strong style="color: #0F172A;">${selectedHotspot.dominant_road || selectedHotspot.top_road_type || 'Highway'}</strong></div>
          </div>
          ${selectedHotspot.top_violation ? `
            <div style="font-size: 11px; color: #9A3412; background: #FFF7ED; padding: 4px 8px; border-radius: 6px; border: 1px solid #FFEDD5; margin-bottom: 6px;">
              <strong>⚠️ Primary Violation:</strong> ${selectedHotspot.top_violation}
            </div>
          ` : ''}
          ${selectedHotspot.top_fatal_mode ? `
            <div style="font-size: 11px; color: #1E40AF; background: #EFF6FF; padding: 4px 8px; border-radius: 6px; border: 1px solid #DBEAFE; margin-bottom: 8px;">
              <strong>🏍️ Vulnerable User:</strong> ${selectedHotspot.top_fatal_mode}
            </div>
          ` : ''}
          <div style="text-align: center; border-top: 1px dashed #E2E8F0; padding-top: 6px;">
            <span style="color: #2563EB; font-weight: 700; font-size: 11px;">
              📍 Active Blackspot Dossier Opened Below
            </span>
          </div>
        </div>
      `;
      infoWindowRef.current.setContent(content);
      infoWindowRef.current.setPosition({ lat, lng: lon });
      infoWindowRef.current.open(map);
    }
  }, [selectedHotspot, isLoaded]);

  // Synchronize Map view and InfoWindow when selectedPoint changes from external selection
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !selectedPoint) return;
    if (typeof selectedPoint.latitude !== 'number' || typeof selectedPoint.longitude !== 'number') return;
    if (isNaN(selectedPoint.latitude) || isNaN(selectedPoint.longitude)) return;

    const map = mapInstanceRef.current;
    map.panTo({ lat: selectedPoint.latitude, lng: selectedPoint.longitude });
    if ((map.getZoom() || 11) < 14) {
      map.setZoom(14);
    }

    if (infoWindowRef.current) {
      const isFatal = String(selectedPoint.accident_severity).toLowerCase() === 'fatal';
      const isSevere = String(selectedPoint.accident_severity).toLowerCase() === 'severe' || String(selectedPoint.accident_severity).toLowerCase() === 'major';

      const content = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; min-width: 220px; max-width: 280px; color: #0F172A; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 12px; color: ${isFatal ? '#DC2626' : isSevere ? '#D97706' : '#059669'};">
              ${isFatal ? '🔴 Fatal Collision' : isSevere ? '🟡 Severe Collision' : '🟢 Minor Collision'}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: #64748B;">
              Case #${selectedPoint.accident_id}
            </span>
          </div>
          <div style="font-size: 11px; margin-bottom: 4px;">
            <strong>${selectedPoint.city}</strong> • ${selectedPoint.road_type}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
            Time: <strong>${selectedPoint.hour}:00 HRS</strong> • ${selectedPoint.weather || 'Clear'}
          </div>
          ${selectedPoint.cause ? `
            <div style="font-size: 10px; color: #64748B; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 4px 6px; border-radius: 6px; margin-top: 6px;">
              <strong>Cause:</strong> ${selectedPoint.cause}
            </div>
          ` : ''}
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #E2E8F0; text-align: center;">
            <span style="color: #2563EB; font-weight: 700; font-size: 11px;">
              📍 Active Case Dossier Opened Below
            </span>
          </div>
        </div>
      `;
      infoWindowRef.current.setContent(content);
      infoWindowRef.current.setPosition({ lat: selectedPoint.latitude, lng: selectedPoint.longitude });
      infoWindowRef.current.open(map);
    }
  }, [selectedPoint, isLoaded]);

  // Plot Verified Historical Accident Records
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (!showIncidents) return;

    // Filter points matching activeRoadFilter or prop roadType
    const filterToUse = activeRoadFilter !== 'All' ? activeRoadFilter : (roadType || 'All');
    const filteredPoints = points.filter((pt) => {
      if (!filterToUse || filterToUse === 'All') return true;
      const target = filterToUse.toLowerCase();
      const actual = (pt.road_type || '').toLowerCase();
      if (target === 'local') return actual === 'local' || actual === 'urban';
      return actual === target;
    });

    // Prioritize critical fatal & severe crash points, capping at 350 to ensure instant 60fps rendering and zero browser freezing
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
      ...fatalPts.slice(0, 150),
      ...severePts.slice(0, 150),
      ...minorPts.slice(0, 100),
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
          fillOpacity: 0.92,
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
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #E2E8F0; text-align: center;">
                <span style="color: #2563EB; font-weight: 700; font-size: 11px; cursor: pointer;">
                  👉 Click to open investigation file below
                </span>
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });
  }, [points, roadType, activeRoadFilter, isLoaded, showIncidents, onSelectPoint]);

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
      {/* Interactive Floating Map Layer Controls in Top Right */}
      <div className="absolute top-3 right-14 z-[10] flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-semibold">
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
          title="Toggle Incident Microdata Records Layer"
        >
          <span>⚠️</span>
          <span>Incidents ({points.length})</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Roadway Filter Selector */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[10px] font-bold">
          {(['All', 'Highway', 'Urban'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRoadFilter(r)}
              className={`px-2 py-0.5 rounded-md transition-all ${
                activeRoadFilter === r
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r === 'All' ? 'All Roads' : r}
            </button>
          ))}
        </div>
      </div>

      {(!isLoaded || isLoading) && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <LoadingSpinner
            message={
              !isLoaded
                ? 'Connecting to Google Maps API...'
                : `Mapping corridor collision records...`
            }
          />
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

export default GoogleOverviewMap;

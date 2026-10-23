import React, { useEffect, useRef, useState } from 'react';
import { AccidentGeoPoint, HotspotItem } from '../../types/api';
import { useGoogleMaps } from '../../utils/googleMapsLoader';
import { CITY_COORDINATES, DEFAULT_MAP_CENTER, CLEAN_LIGHT_MAP_STYLES } from '../../config/maps';
import { LoadingSpinner } from '../common/LoadingSpinner';

export interface RouteSummary {
  distance: string;
  duration: string;
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
  onSelectHotspot?: (h: HotspotItem) => void;
  onSelectPoint?: (pt: AccidentGeoPoint) => void;
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
  onSelectHotspot,
  onSelectPoint,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const hotspotMarkersRef = useRef<google.maps.Marker[]>([]);
  const hotspotCirclesRef = useRef<google.maps.Circle[]>([]);
  const endpointMarkersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const fallbackPolylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

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

  // Asynchronous geocoder for custom destinations or towns typed freely by the user
  const resolveCoordsAsync = async (name?: string): Promise<{ lat: number; lng: number; zoom?: number } | null> => {
    if (!name) return null;
    const local = resolveCoords(name);
    if (local) return local;

    if (window.google?.maps?.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        const res = await geocoder.geocode({ address: `${name.trim()}, India` });
        if (res.results && res.results[0]?.geometry?.location) {
          const loc = res.results[0].geometry.location;
          return { lat: loc.lat(), lng: loc.lng(), zoom: 12 };
        }
      } catch {
        // Fallback silently if offline or geocoder service unavailable
      }
    }
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
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    infoWindowRef.current = new google.maps.InfoWindow();

    // Initialize custom DirectionsRenderer
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

  // Handle Turn-by-Turn Driving Route rendering between Source & Destination
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    const src = source?.trim() || city?.trim();
    const dst = destination?.trim();

    // Clear previous fallback polyline & custom endpoint markers
    if (fallbackPolylineRef.current) {
      fallbackPolylineRef.current.setMap(null);
      fallbackPolylineRef.current = null;
    }
    endpointMarkersRef.current.forEach((m) => m.setMap(null));
    endpointMarkersRef.current = [];

    if (!src || !dst || src.toLowerCase() === dst.toLowerCase()) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.set('directions', null);
      }
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    // Helper to calculate geodesic distance & approximate driving time
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
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const straightKm = R * c;
      const roadKm = Math.round(straightKm * 1.25);
      const hours = Math.floor(roadKm / 65);
      const mins = Math.round(((roadKm / 65) - hours) * 60);
      return {
        distanceText: `~${roadKm} km`,
        durationText: hours > 0 ? `~${hours}h ${mins}m` : `~${mins} mins`,
      };
    };

    // Helper to draw custom polyline and endpoints
    const drawCustomRoute = (
      pathCoords: google.maps.LatLng[],
      startCoord: { lat: number; lng: number },
      endCoord: { lat: number; lng: number },
      distStr: string,
      durStr: string
    ) => {
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

      // Origin Pin 'A'
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

      // Destination Pin 'B'
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
      map.fitBounds(bounds, 50);

      if (onRouteCalculated) {
        onRouteCalculated({
          distance: distStr,
          duration: durStr,
          startAddress: `${src}, India`,
          endAddress: `${dst}, India`,
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
      (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          directionsRendererRef.current?.setDirections(response);

          const leg = response.routes[0]?.legs[0];
          if (leg && onRouteCalculated) {
            onRouteCalculated({
              distance: leg.distance?.text || '',
              duration: leg.duration?.text || '',
              startAddress: leg.start_address,
              endAddress: leg.end_address,
            });
          }

          const bounds = response.routes[0]?.bounds;
          if (bounds) {
            map.fitBounds(bounds);
          }
        } else {
          // Fallback: Use open road routing engine (OSRM) or geodesic highway path
          if (directionsRendererRef.current) {
            directionsRendererRef.current.set('directions', null);
          }

          const proceedWithCoords = (
            startPt: { lat: number; lng: number },
            endPt: { lat: number; lng: number }
          ) => {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startPt.lng},${startPt.lat};${endPt.lng},${endPt.lat}?overview=full&geometries=geojson`;

            fetch(osrmUrl)
              .then((r) => r.json())
              .then((data) => {
                if (data.code === 'Ok' && data.routes && data.routes[0]?.geometry?.coordinates) {
                  const rawCoords: [number, number][] = data.routes[0].geometry.coordinates;
                  const gPath = rawCoords.map((c) => new google.maps.LatLng(c[1], c[0]));
                  const distKm = (data.routes[0].distance / 1000).toFixed(0);
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
                // Direct geodesic interpolation fallback
                const approx = computeApproxRoute(startPt, endPt);
                const straightPath = [
                  new google.maps.LatLng(startPt.lat, startPt.lng),
                  new google.maps.LatLng(endPt.lat, endPt.lng),
                ];
                drawCustomRoute(straightPath, startPt, endPt, approx.distanceText, approx.durationText);
              });
          };

          const sCoord = resolveCoords(src);
          const dCoord = resolveCoords(dst);

          if (sCoord && dCoord) {
            proceedWithCoords(sCoord, dCoord);
          } else {
            // Asynchronously resolve coordinates via Geocoder if user entered a custom town
            resolveCoordsAsync(src).then((resolvedSrc) => {
              resolveCoordsAsync(dst).then((resolvedDst) => {
                if (resolvedSrc && resolvedDst) {
                  proceedWithCoords(resolvedSrc, resolvedDst);
                }
              });
            });
          }
        }
      }
    );
  }, [source, destination, isLoaded]);

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

  // Plot Selected Hotspot Focus Boundary (Subtle highlight only when user selects a hotspot from the dossier)
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;

    // Clear old hotspot markers & buffer circles
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
    const radiusMeters = selectedHotspot.radius_m || 800;

    // Elegant, ultra-subtle focal zone highlight (NO big red blocks, NO numbers)
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
  }, [selectedHotspot, isLoaded]);

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

    // Display up to 3,000 points for comprehensive roadway coverage with smooth 60fps rendering
    const displayPoints = filteredPoints.length > 3000 ? filteredPoints.slice(0, 3000) : filteredPoints;

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

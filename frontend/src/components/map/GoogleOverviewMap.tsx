import React, { useEffect, useRef } from 'react';
import { AccidentGeoPoint } from '../../types/api';
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
  city: string;
  source?: string;
  destination?: string;
  roadType?: string;
  isLoading?: boolean;
  onSelectPoint?: (pt: AccidentGeoPoint) => void;
  onRouteCalculated?: (summary: RouteSummary) => void;
}

export const GoogleOverviewMap: React.FC<GoogleOverviewMapProps> = ({
  points,
  city,
  source,
  destination,
  roadType,
  isLoading = false,
  onSelectPoint,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const endpointMarkersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const fallbackPolylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

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

  // Plot Verified Historical Accident Records & Hotspots
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

    // Display up to 1,500 points for comprehensive roadway coverage with smooth 60fps rendering
    const displayPoints = filteredPoints.length > 1500 ? filteredPoints.slice(0, 1500) : filteredPoints;

    displayPoints.forEach((pt) => {
      if (typeof pt.latitude !== 'number' || typeof pt.longitude !== 'number') return;
      if (isNaN(pt.latitude) || isNaN(pt.longitude)) return;

      const isFatal = String(pt.accident_severity).toLowerCase() === 'fatal';
      const isSevere =
        String(pt.accident_severity).toLowerCase() === 'severe' ||
        String(pt.accident_severity).toLowerCase() === 'major';
      const fillColor = isFatal ? '#EF4444' : isSevere ? '#F59E0B' : '#10B981';
      const radius = isFatal ? 7 : isSevere ? 5.5 : 4.5;

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
          strokeWeight: 1.8,
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

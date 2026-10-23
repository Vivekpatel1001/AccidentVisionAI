import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GoogleAccidentMap, RouteSummary } from '../components/map/GoogleAccidentMap';
import {
  MapPin,
  Filter,
  Layers,
  Info,
  Calendar,
  Clock,
  Car,
  CloudRain,
  Navigation,
  Compass,
  Sparkles,
  ShieldAlert,
  Flame,
  ArrowRightLeft,
  ChevronRight,
  Shield,
  Activity,
  AlertTriangle,
  X,
  CheckCircle2
} from 'lucide-react';
import { getGeoAccidents, getHotspots } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { AccidentGeoPoint, HotspotItem } from '../types/api';
import { SearchableDropdown } from '../components/common/SearchableDropdown';

const ALL_CITIES_AND_NATIONAL = [
  'All Cities (National Corridor Network)',
  'Agra', 'Ahmedabad', 'Ajmer', 'Alibaug', 'Amritsar', 'Asansol', 'Aurangabad',
  'Ayodhya', 'Bengaluru', 'Bhopal', 'Bhubaneswar', 'Bikaner', 'Chandigarh',
  'Chennai', 'Coimbatore', 'Cuttack', 'Dehradun', 'Delhi', 'Dhanbad', 'Dombivli',
  'Durgapur', 'Electronic City', 'Faridabad', 'Ghaziabad', 'Goa', 'Gorakhpur',
  'Gurgaon', 'Guwahati', 'Gwalior', 'Haridwar', 'Hinjewadi IT Hub', 'Howrah',
  'Hyderabad', 'Indore', 'Jabalpur', 'Jaipur', 'Jaisalmer', 'Jalandhar',
  'Jammu', 'Jodhpur', 'Kalyan', 'Kanpur', 'Khandala', 'Kochi', 'Kodaikanal',
  'Kolhapur', 'Kolkata', 'Kota', 'Lonavala', 'Lucknow', 'Ludhiana', 'Madurai',
  'Mahabaleshwar', 'Manali', 'Mangalore', 'Mathura', 'Meerut', 'Mount Abu',
  'Mumbai', 'Mysore', 'Nagpur', 'Nashik', 'Navi Mumbai', 'Noida', 'OMR Corridor',
  'Ooty', 'Panaji', 'Panvel', 'Patna', 'Pondicherry', 'Prayagraj', 'Pune',
  'Puri', 'Pushkar', 'Raipur', 'Rajkot', 'Ranchi', 'Rishikesh', 'Satara',
  'Shillong', 'Shimla', 'Shirdi', 'Siliguri', 'Solapur', 'Sriperumbudur',
  'Srinagar', 'Surat', 'Thane', 'Thiruvananthapuram', 'Tirupati', 'Udaipur',
  'Udupi', 'Vadodara', 'Varanasi', 'Vasai', 'Vijayawada', 'Virar', 'Visakhapatnam',
  'Vrindavan', 'Warangal', 'Whitefield'
];

const ALL_DESTINATIONS = ALL_CITIES_AND_NATIONAL.filter((c) => !c.includes('National'));

const POPULAR_CORRIDORS = [
  { source: 'Mumbai', destination: 'Pune', label: 'Mumbai ➔ Pune' },
  { source: 'Delhi', destination: 'Chandigarh', label: 'Delhi ➔ Chandigarh' },
  { source: 'Bengaluru', destination: 'Chennai', label: 'Bengaluru ➔ Chennai' },
  { source: 'Jaipur', destination: 'Delhi', label: 'Jaipur ➔ Delhi' },
  { source: 'Mumbai', destination: 'Goa', label: 'Mumbai ➔ Goa' },
  { source: 'Ahmedabad', destination: 'Surat', label: 'Ahmedabad ➔ Surat' },
  { source: 'Delhi', destination: 'Gurgaon', label: 'Delhi ➔ Gurgaon' },
  { source: 'Pune', destination: 'Lonavala', label: 'Pune ➔ Lonavala' },
];

export const AccidentMapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { selectedCity, setSelectedCity } = useCityFilter();

  const paramSource = searchParams.get('source');
  const paramDestination = searchParams.get('destination');
  const paramCity = searchParams.get('city');

  const initialMode = paramSource && paramDestination ? 'corridor' : 'city';

  const [viewMode, setViewMode] = useState<'corridor' | 'city'>(initialMode);
  const [activeCity, setActiveCity] = useState<string>(
    paramCity || selectedCity || 'All Cities (National Corridor Network)'
  );
  const [activeSource, setActiveSource] = useState<string>(paramSource || selectedCity || 'Mumbai');
  const [activeDestination, setActiveDestination] = useState<string>(paramDestination || 'Pune');

  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [roadTypeFilter, setRoadTypeFilter] = useState<string>('All');
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);

  const [selectedIncident, setSelectedIncident] = useState<AccidentGeoPoint | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);

  // Sync city filter from global context
  useEffect(() => {
    if (selectedCity && selectedCity !== activeCity && viewMode === 'city') {
      setActiveCity(selectedCity);
    }
  }, [selectedCity]);

  // Determine query targets
  const isNational = activeCity.includes('National');
  const queryCity = viewMode === 'city' && !isNational ? activeCity : undefined;
  const querySource = viewMode === 'corridor' ? activeSource : undefined;
  const queryDestination = viewMode === 'corridor' ? activeDestination : undefined;

  // 1. Fetch Verified Geo Accidents Microdata
  const { data: rawPoints, isLoading: isPointsLoading } = useQuery({
    queryKey: ['full-map-accidents', queryCity, severityFilter, querySource, queryDestination],
    queryFn: () => getGeoAccidents(queryCity, severityFilter, 4000, querySource, queryDestination),
  });

  // 2. Fetch High-Density Collision Hotspots (DBSCAN + MoRTH Blackspots)
  const { data: rawHotspotsData, isLoading: isHotspotsLoading } = useQuery({
    queryKey: ['full-map-hotspots', queryCity, querySource, queryDestination],
    queryFn: () => getHotspots(queryCity, 6, 0.8, querySource, queryDestination),
  });

  const pointsList: AccidentGeoPoint[] = Array.isArray(rawPoints) ? rawPoints : [];
  const hotspotsList: HotspotItem[] = rawHotspotsData?.hotspots || [];

  const handleSwapCorridor = () => {
    const s = activeSource;
    const d = activeDestination;
    setActiveSource(d);
    setActiveDestination(s);
  };

  const handleSelectCorridor = (c: { source: string; destination: string }) => {
    setViewMode('corridor');
    setActiveSource(c.source);
    setActiveDestination(c.destination);
  };

  const getMarkerColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'fatal':
        return '#EF4444';
      case 'severe':
      case 'major':
        return '#F59E0B';
      case 'minor':
      default:
        return '#10B981';
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>National Road Safety & Geospatial Blackspot Explorer</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Interactive Highway & Urban Accident Blackspots
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Explore 20,000 verified collision locations, DBSCAN high-density blackspots, and turn-by-turn driving corridor safety across India's metropolitan network.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('corridor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'corridor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Corridor Route Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('city')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'city'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>City / National Mode</span>
            </button>
          </div>
        </div>

        {/* View Mode Controls Bar */}
        {viewMode === 'corridor' ? (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Quick Corridors:
              </span>
              {POPULAR_CORRIDORS.map((c) => {
                const isSelected = activeSource === c.source && activeDestination === c.destination;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => handleSelectCorridor(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2">
                <SearchableDropdown
                  label="Origin (Source Hub)"
                  sublabel="select origin city"
                  value={activeSource}
                  options={ALL_DESTINATIONS}
                  placeholder="Select origin..."
                  onChange={(v) => v && setActiveSource(v)}
                />
              </div>

              <div className="flex items-center justify-center pb-2">
                <button
                  type="button"
                  onClick={handleSwapCorridor}
                  className="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                  title="Reverse Origin & Destination"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Swap</span>
                </button>
              </div>

              <div className="md:col-span-2">
                <SearchableDropdown
                  label="Destination Hub"
                  sublabel="select destination city"
                  value={activeDestination}
                  options={ALL_DESTINATIONS}
                  placeholder="Select destination..."
                  onChange={(v) => v && setActiveDestination(v)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <SearchableDropdown
                label="Selected Territory / Jurisdiction"
                sublabel="national or 50+ individual cities"
                value={activeCity}
                options={ALL_CITIES_AND_NATIONAL}
                placeholder="Search jurisdiction or select national..."
                onChange={(val) => {
                  if (val) {
                    setActiveCity(val);
                    if (!val.includes('National')) {
                      setSelectedCity(val);
                    }
                  }
                }}
                badge={`${ALL_CITIES_AND_NATIONAL.length} jurisdictions`}
              />
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isNational ? 'Pan-India MoRTH Network' : `${activeCity} Metropolitan Safety Scope`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Full-Scale Map Viewport */}
      <div className="relative h-[680px] sm:h-[740px] md:h-[780px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
        {/* Top-Left Floating Controls Bar */}
        <div className="absolute top-3 left-3 z-[10] flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-md text-xs">
          {/* Layer Toggles */}
          <button
            type="button"
            onClick={() => setShowHotspots(!showHotspots)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              showHotspots
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Toggle High-Risk Blackspots Layer"
          >
            <span>🔥</span>
            <span>Hotspot Zones ({hotspotsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              showIncidents
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Toggle Incident Dots Layer"
          >
            <span>⚠️</span>
            <span>Incidents ({pointsList.length.toLocaleString()})</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Severity Filters */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px] font-bold">
            {[
              { id: '', label: 'All' },
              { id: 'Fatal', label: '🔴 Fatal' },
              { id: 'Severe', label: '🟡 Severe' },
              { id: 'Minor', label: '🟢 Minor' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSeverityFilter(s.id)}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  severityFilter === s.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Roadway Filters */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px] font-bold">
            {(['All', 'Highway', 'Urban'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoadTypeFilter(r)}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  roadTypeFilter === r
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r === 'All' ? 'All Roads' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Corridor Driving Telemetry Pill */}
        {viewMode === 'corridor' && routeSummary && (
          <div className="absolute bottom-4 left-4 z-[10] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-lg text-xs flex items-center gap-3 font-semibold text-slate-800">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
              <Navigation className="w-3.5 h-3.5" />
              <span>{activeSource} ➔ {activeDestination}</span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <span>📏 Distance: <strong>{routeSummary.distance}</strong></span>
            <span>⏱️ Est. Drive: <strong>{routeSummary.duration}</strong></span>
          </div>
        )}

        {/* Embedded Google Full Accident Map */}
        <div className="h-full w-full">
          <GoogleAccidentMap
            points={pointsList}
            hotspots={hotspotsList}
            city={viewMode === 'city' ? activeCity : undefined}
            source={viewMode === 'corridor' ? activeSource : undefined}
            destination={viewMode === 'corridor' ? activeDestination : undefined}
            severityFilter={severityFilter}
            roadTypeFilter={roadTypeFilter}
            showHotspots={showHotspots}
            showIncidents={showIncidents}
            selectedIncident={selectedIncident}
            selectedHotspot={selectedHotspot}
            onSelectIncident={(pt) => {
              setSelectedHotspot(null);
              setSelectedIncident(pt);
            }}
            onSelectHotspot={(h) => {
              setSelectedIncident(null);
              setSelectedHotspot(h);
            }}
            onRouteCalculated={setRouteSummary}
            isLoading={isPointsLoading || isHotspotsLoading}
          />
        </div>

        {/* Slide-out Case Investigation Drawer on Right */}
        {selectedIncident && (
          <div className="absolute top-4 right-4 z-[1000] w-84 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-3.5 animate-in fade-in slide-in-from-right duration-200 max-h-[calc(100%-32px)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getMarkerColor(selectedIncident.accident_severity) }}
                />
                <span className="font-extrabold text-sm text-slate-900">
                  {selectedIncident.accident_severity} Incident
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  #{selectedIncident.accident_id}
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Jurisdiction:</span>
                <span className="font-bold text-slate-800">{selectedIncident.city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Roadway:</span>
                <span className="font-semibold text-slate-800">
                  {selectedIncident.road_type} ({selectedIncident.lanes || 4} Lanes)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Timing:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedIncident.date || '2024'} • {selectedIncident.hour}:00 HRS
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Weather & Flow:</span>
                <span className="font-semibold text-slate-800">
                  {selectedIncident.weather} • {selectedIncident.traffic_density} Traffic
                </span>
              </div>
              {selectedIncident.casualties !== undefined && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Casualties / Vehicles:</span>
                  <span className="font-bold text-red-600">
                    {selectedIncident.casualties} Casualties • {selectedIncident.vehicles_involved || 2} Vehicles
                  </span>
                </div>
              )}
              {selectedIncident.cause && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 mt-2">
                  <span className="font-bold block text-[11px] mb-0.5">⚠️ Primary Incident Cause:</span>
                  <span className="text-[11px]">{selectedIncident.cause}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-[11px] text-slate-500">
                <span>GPS Coordinates:</span>
                <span className="font-mono font-bold">
                  {selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Slide-out Hotspot Dossier Drawer on Right */}
        {selectedHotspot && (
          <div className="absolute top-4 right-4 z-[1000] w-88 bg-white/98 backdrop-blur-md rounded-2xl border border-red-200 shadow-2xl p-5 space-y-3.5 animate-in fade-in slide-in-from-right duration-200 max-h-[calc(100%-32px)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-red-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-sm text-slate-900">
                    {selectedHotspot.name || `Cluster #${selectedHotspot.cluster_id}`}
                  </span>
                  <div className="text-[10px] text-slate-500">{selectedHotspot.city} Blackspot Zone</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">Total Incidents:</span>
                <strong className="text-slate-900 font-bold text-sm">
                  {selectedHotspot.size || selectedHotspot.cluster_size || 0}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Fatal Collisions:</span>
                <strong className="text-red-600 font-bold text-sm">
                  {selectedHotspot.fatal_count}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Fatality Rate:</span>
                <strong className="text-amber-700 font-bold">
                  {selectedHotspot.fatal_percentage || (selectedHotspot.fatal_ratio ? (selectedHotspot.fatal_ratio * 100).toFixed(1) : '35.0')}%
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Cluster Density:</span>
                <strong className="text-slate-800 font-bold">
                  {selectedHotspot.density_per_sqkm || 150} /km²
                </strong>
              </div>
            </div>

            {selectedHotspot.top_violation && (
              <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs">
                <span className="font-bold block text-[11px] mb-0.5">⚠️ Primary Observed Violation:</span>
                <span className="text-[11px]">{selectedHotspot.top_violation}</span>
              </div>
            )}

            {selectedHotspot.top_fatal_mode && (
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs">
                <span className="font-bold block text-[11px] mb-0.5">🏍️ Most Vulnerable Mode:</span>
                <span className="text-[11px]">{selectedHotspot.top_fatal_mode}</span>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs space-y-1">
              <span className="font-bold text-[10px] uppercase tracking-wider text-amber-400 block">
                IRC Engineering Recommendation
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Deploy automated radar speed enforcement, install grade-separated pedestrian barriers, and upgrade high-friction anti-skid surfacing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccidentMapPage;

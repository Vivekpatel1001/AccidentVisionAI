import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  AlertTriangle,
  Sliders,
  Compass,
  Navigation,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  Activity,
  MapPin
} from 'lucide-react';
import { getHotspots } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { HotspotItem } from '../types/api';
import { GoogleHotspotsMap } from '../components/map/GoogleHotspotsMap';
import { SearchableDropdown } from '../components/common/SearchableDropdown';

const ALL_CITIES = [
  'All Cities (National)',
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

export const HotspotsPage: React.FC = () => {
  const { selectedCity, setSelectedCity } = useCityFilter();
  const [activeCity, setActiveCity] = useState<string>(selectedCity || 'All Cities (National)');
  const [minPoints, setMinPoints] = useState<number>(8);
  const [epsKm, setEpsKm] = useState<number>(0.8);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (selectedCity && selectedCity !== activeCity) {
      setActiveCity(selectedCity);
    }
  }, [selectedCity]);

  const targetCity = activeCity === 'All Cities (National)' || !activeCity ? undefined : activeCity;

  const { data, isLoading } = useQuery({
    queryKey: ['hotspots', targetCity, minPoints, epsKm],
    queryFn: () => getHotspots(targetCity, minPoints, epsKm),
  });

  const rawHotspots: HotspotItem[] = data?.hotspots || [];

  // Robustly normalize and filter valid hotspots with fallback for any schema
  const hotspots: HotspotItem[] = rawHotspots
    .map((h: any) => {
      const lat = typeof h.centroid_lat === 'number' ? h.centroid_lat : typeof h.center_latitude === 'number' ? h.center_latitude : null;
      const lon = typeof h.centroid_lon === 'number' ? h.centroid_lon : typeof h.center_longitude === 'number' ? h.center_longitude : null;
      const count = typeof h.size === 'number' ? h.size : typeof h.cluster_size === 'number' ? h.cluster_size : 0;
      const fatal_count = typeof h.fatal_count === 'number' ? h.fatal_count : 0;
      const fatal_ratio = typeof h.fatal_ratio === 'number' ? h.fatal_ratio : (typeof h.fatal_percentage === 'number' ? h.fatal_percentage / 100 : 0);
      const road = h.dominant_road || h.top_road_type || 'Urban Arterial';
      const weather = h.dominant_weather || h.top_weather || 'Clear';
      const radius = h.radius_m || epsKm * 1000;
      const density = h.density_per_sqkm || (radius > 0 ? Number((count / (Math.PI * Math.pow(radius / 1000, 2))).toFixed(1)) : 0);

      return {
        ...h,
        name: h.name || `Cluster #${h.cluster_id}`,
        centroid_lat: lat,
        center_latitude: lat,
        centroid_lon: lon,
        center_longitude: lon,
        size: count,
        cluster_size: count,
        fatal_count,
        fatal_ratio,
        fatal_percentage: fatal_ratio * 100,
        dominant_road: road,
        top_road_type: road,
        dominant_weather: weather,
        top_weather: weather,
        radius_m: radius,
        density_per_sqkm: density,
      };
    })
    .filter((h) => h.centroid_lat !== null && h.centroid_lon !== null && !isNaN(h.centroid_lat) && !isNaN(h.centroid_lon));

  const handleFocusHotspot = (h: HotspotItem) => {
    setSelectedHotspot(h);
    if (h.centroid_lat && h.centroid_lon) {
      setFlyToCenter([h.centroid_lat, h.centroid_lon]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>Unsupervised Geospatial Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Accident Hotspot Identification
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
            DBSCAN density clustering with geodesic haversine distance metric on Google Maps, identifying high-frequency collision corridors across India's metropolitan road networks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-64">
            <SearchableDropdown
              label="Active Hotspot Zone / City"
              sublabel="all 50+ cities • no limits"
              value={activeCity}
              options={ALL_CITIES}
              placeholder="Search or select city..."
              onChange={(val) => {
                const clean = val || 'All Cities (National)';
                setActiveCity(clean);
                if (clean !== 'All Cities (National)') {
                  setSelectedCity(clean);
                }
              }}
              badge={`${ALL_CITIES.length - 1} cities`}
            />
          </div>
        </div>
      </div>

      {/* Parameter Controls Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">DBSCAN Spatial Parameters</h2>
            <p className="text-xs text-slate-500">Tune spatial cluster radius (ε) and minimum sample threshold (MinPts)</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-600 font-medium">Search Radius (ε):</span>
            <input
              type="range"
              min="0.4"
              max="1.5"
              step="0.1"
              value={epsKm}
              onChange={(e) => setEpsKm(parseFloat(e.target.value))}
              className="w-32 accent-blue-600 cursor-pointer"
            />
            <span className="font-mono text-slate-900 font-bold w-16 px-2 py-1 bg-slate-100 rounded text-center border border-slate-200">
              {(epsKm * 1000).toFixed(0)}m
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-600 font-medium">Min Crashes:</span>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={minPoints}
              onChange={(e) => setMinPoints(parseInt(e.target.value))}
              className="w-28 accent-blue-600 cursor-pointer"
            />
            <span className="font-mono text-slate-900 font-bold w-12 px-2 py-1 bg-slate-100 rounded text-center border border-slate-200">
              {minPoints}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identified Hotspots</div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {data?.total_clusters ?? hotspots.length}
          </div>
          <div className="text-xs text-slate-500">Dense corridor clusters</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clustered Incidents</div>
          <div className="text-3xl font-black text-blue-600 font-mono">
            {typeof data?.clustered_accidents_count === 'number'
              ? data.clustered_accidents_count.toLocaleString()
              : hotspots.reduce((acc, h) => acc + (h.size || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Recurring collision locations</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Isolated / Dispersed</div>
          <div className="text-3xl font-black text-slate-700 font-mono">
            {typeof data?.noise_accidents_count === 'number'
              ? data.noise_accidents_count.toLocaleString()
              : 'Baseline'}
          </div>
          <div className="text-xs text-slate-500">Non-clustered single events</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Danger Corridor</div>
          <div className="text-3xl font-black text-red-600 font-mono truncate">
            {hotspots.length > 0 ? `${hotspots[0].size} Crashes` : 'Monitoring'}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {hotspots.length > 0 ? `${hotspots[0].city} (${hotspots[0].dominant_road || 'Corridor'})` : 'No dense clusters'}
          </div>
        </div>
      </div>

      {/* Split View: Google Map + Hotspots Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Cluster Map (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm h-[580px] relative flex flex-col">
          <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between z-10">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              Hotspot Spatial Map (Google Maps Engine)
            </span>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {hotspots.length} Clusters Plotted
            </span>
          </div>

          <div className="flex-1 w-full h-full relative">
            <GoogleHotspotsMap
              hotspots={hotspots}
              selectedHotspot={selectedHotspot}
              onSelectHotspot={handleFocusHotspot}
              flyToCenter={flyToCenter}
              selectedCity={targetCity}
              epsKm={epsKm}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Hotspots Ranked Registry (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[580px]">
          <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              Ranked Hazard Corridors
            </span>
            <span className="text-xs text-slate-500 font-medium">Click to Zoom on Map</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {hotspots.length > 0 ? (
              hotspots.map((h, idx) => {
                const isSelected = selectedHotspot?.cluster_id === h.cluster_id;
                const hasHighFatal = (h.fatal_count || 0) > 0;

                return (
                  <button
                    key={h.cluster_id}
                    onClick={() => handleFocusHotspot(h)}
                    className={`w-full p-3.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-300 shadow-sm ring-1 ring-blue-300'
                        : 'bg-white hover:bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-5 h-5 rounded-full font-mono font-bold flex items-center justify-center text-[10px] shrink-0 ${
                          hasHighFatal ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{idx + 1}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          🔥 {h.name || ('Cluster #' + h.cluster_id)}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                        hasHighFatal
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {Math.round((h.fatal_ratio || 0) * 100)}% Fatal
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span className="truncate">{h.city} • {h.dominant_road || 'Corridor'}</span>
                    </div>

                    {h.top_violation && (
                      <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 truncate mt-1">
                        ⚠️ Violation: {h.top_violation}
                      </div>
                    )}
                    {h.top_fatal_mode && (
                      <div className="text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate mt-1">
                        🏍️ Vulnerable: {h.top_fatal_mode}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                      <span>{h.size} verified crashes</span>
                      <span className="text-slate-600 font-bold">{h.density_per_sqkm ? `${h.density_per_sqkm} /km²` : 'High Density'}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Compass className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-bold text-slate-700">No dense clusters found under current thresholds.</p>
                <p className="text-[11px] text-slate-400">Try increasing search radius (ε) or lowering min crashes above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotspotsPage;

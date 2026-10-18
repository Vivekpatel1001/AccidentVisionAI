import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import {
  Flame,
  AlertTriangle,
  Sliders,
  Compass,
  ArrowUpDown,
  Navigation,
  Info,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { getHotspots } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { HotspotItem } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const MapFlyTo: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

export const HotspotsPage: React.FC = () => {
  const { selectedCity } = useCityFilter();
  const [minPoints, setMinPoints] = useState<number>(8);
  const [epsKm, setEpsKm] = useState<number>(0.8);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hotspots', selectedCity, minPoints, epsKm],
    queryFn: () => getHotspots(selectedCity, minPoints, epsKm),
  });

  const hotspots = data?.hotspots || [];

  const handleFocusHotspot = (h: HotspotItem) => {
    setSelectedHotspot(h);
    setFlyToCenter([h.centroid_lat, h.centroid_lon]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>DBSCAN High-Density Collision Corridors</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Accident Hotspot Identification
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Unsupervised density-based spatial clustering (DBSCAN) using geodesic haversine metrics to uncover recurring crash blackspots.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700">
          <span>Active City:</span>
          <span className="font-extrabold text-blue-600">{selectedCity || 'All 8 Metros'}</span>
        </div>
      </div>

      {/* Parameter Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">DBSCAN Spatial Parameters</h2>
            <p className="text-xs text-slate-500">Fine-tune cluster search radius and minimum incident threshold</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-600 font-medium">Search Radius:</span>
            <input
              type="range"
              min="0.4"
              max="1.5"
              step="0.1"
              value={epsKm}
              onChange={(e) => setEpsKm(parseFloat(e.target.value))}
              className="w-32 accent-blue-600 cursor-pointer"
            />
            <span className="font-mono text-slate-900 font-bold w-16 px-2 py-1 bg-slate-100 rounded text-center">
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
            <span className="font-mono text-slate-900 font-bold w-12 px-2 py-1 bg-slate-100 rounded text-center">
              {minPoints}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identified Hotspots</div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono">
            {data?.total_clusters ?? hotspots.length}
          </div>
          <div className="text-xs text-slate-500">Dense corridor clusters</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clustered Incidents</div>
          <div className="text-3xl font-extrabold text-blue-600 font-mono">
            {typeof data?.clustered_accidents_count === 'number' ? data.clustered_accidents_count.toLocaleString() : hotspots.reduce((acc, h) => acc + h.size, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Recurring crash locations</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispersed / Isolated</div>
          <div className="text-3xl font-extrabold text-slate-700 font-mono">
            {typeof data?.noise_accidents_count === 'number' ? data.noise_accidents_count.toLocaleString() : 'Baseline'}
          </div>
          <div className="text-xs text-slate-500">Non-clustered single occurrences</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Danger Corridor</div>
          <div className="text-3xl font-extrabold text-red-600 font-mono truncate">
            {hotspots.length > 0 ? `${hotspots[0].size} Crashes` : 'Monitoring'}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {hotspots.length > 0 ? `${hotspots[0].city} (${hotspots[0].dominant_road || 'Corridor'})` : 'No dense clusters'}
          </div>
        </div>
      </div>

      {/* Split View: Map + Hotspots Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Cluster Map (6 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[560px] relative flex flex-col">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between z-10">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              Hotspot Spatial Map (Real CartoDB Voyager Tiles)
            </span>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {hotspots.length} Clusters Plotted
            </span>
          </div>

          <div className="flex-1 w-full h-full relative">
            {isLoading && (
              <div className="absolute inset-0 z-[500] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <LoadingSpinner message="Calculating DBSCAN haversine clusters..." />
              </div>
            )}

            <MapContainer
              center={
                hotspots.length > 0
                  ? [hotspots[0].centroid_lat, hotspots[0].centroid_lon]
                  : [20.5937, 78.9629]
              }
              zoom={hotspots.length > 0 ? 11 : 5}
              className="h-full w-full"
            >
              <MapFlyTo center={flyToCenter} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
              />

              {hotspots.map((h) => {
                const isSelected = selectedHotspot?.cluster_id === h.cluster_id;
                return (
                  <React.Fragment key={h.cluster_id}>
                    {/* Outer Cluster Buffer Circle */}
                    <Circle
                      center={[h.centroid_lat, h.centroid_lon]}
                      radius={h.radius_m || epsKm * 1000}
                      pathOptions={{
                        color: isSelected ? '#2563EB' : '#D97706',
                        fillColor: '#F59E0B',
                        fillOpacity: isSelected ? 0.35 : 0.18,
                        weight: isSelected ? 2.5 : 1.5,
                      }}
                    />

                    {/* Centroid Point */}
                    <CircleMarker
                      center={[h.centroid_lat, h.centroid_lon]}
                      radius={Math.min(18, Math.max(7, Math.sqrt(h.size) * 2.2))}
                      pathOptions={{
                        color: '#FFFFFF',
                        fillColor: h.fatal_count > 2 ? '#EF4444' : '#F59E0B',
                        fillOpacity: 0.95,
                        weight: 2,
                      }}
                      eventHandlers={{
                        click: () => setSelectedHotspot(h),
                      }}
                    >
                      <Tooltip direction="top">
                        <div className="text-xs font-sans p-1">
                          <div className="font-bold text-slate-900">
                            Cluster #{h.cluster_id} ({h.city})
                          </div>
                          <div className="text-slate-600 mt-0.5">Total Incidents: {h.size}</div>
                          <div className="text-red-600 font-semibold">
                            Fatal Crashes: {h.fatal_count} ({(h.fatal_ratio * 100).toFixed(1)}%)
                          </div>
                          <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                            Dominant: {h.dominant_road}
                          </div>
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Hotspots Ranked Registry (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[560px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              Ranked Hazard Corridors
            </span>
            <span className="text-xs text-slate-500 font-medium">Click to Inspect</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {hotspots.length > 0 ? (
              hotspots.map((h, idx) => {
                const isSelected = selectedHotspot?.cluster_id === h.cluster_id;
                return (
                  <button
                    key={h.cluster_id}
                    onClick={() => handleFocusHotspot(h)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold flex items-center justify-center text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{h.city}</span>
                      </div>
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        {Math.round((h.fatal_ratio || 0) * 100)}% Fatal
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-700">
                      {h.dominant_road || 'Expressway / Arterial Corridor'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                      <span>{h.size} verified crashes</span>
                      <span>Density: {h.density_per_sqkm ? `${h.density_per_sqkm.toFixed(1)}/km²` : 'High'}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Compass className="w-8 h-8 mx-auto text-slate-400" />
                <p>No dense clusters found under current thresholds.</p>
                <p className="text-[11px] text-slate-400">Try increasing search radius or lowering min crashes above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotspotsPage;

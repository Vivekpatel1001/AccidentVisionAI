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
  Layers
} from 'lucide-react';
import { getHotspots } from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { HotspotItem } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { AlertBanner } from '../components/common/AlertBanner';
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
  const [minPoints, setMinPoints] = useState<number>(12);
  const [epsKm, setEpsKm] = useState<number>(0.6);
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
      {/* Parameter Controls Bar */}
      <div className="bg-bg-card border border-border-dark rounded-lg p-4 shadow-card-dark flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-md bg-accent-warning/10 text-accent-warning">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-main">DBSCAN Spatial Hyperparameters</h2>
            <p className="text-xs text-text-muted">Dynamic cluster extraction using spherical haversine metric</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-text-muted font-mono">Radius (eps):</span>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.1"
              value={epsKm}
              onChange={(e) => setEpsKm(parseFloat(e.target.value))}
              className="w-28 accent-accent-primary cursor-pointer"
            />
            <span className="font-mono text-text-main font-semibold w-14">
              {(epsKm * 1000).toFixed(0)}m
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-text-muted font-mono">Min Samples:</span>
            <input
              type="range"
              min="8"
              max="25"
              step="1"
              value={minPoints}
              onChange={(e) => setMinPoints(parseInt(e.target.value))}
              className="w-28 accent-accent-primary cursor-pointer"
            />
            <span className="font-mono text-text-main font-semibold w-8">{minPoints}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="IDENTIFIED HOTSPOTS"
          value={data ? data.total_clusters : '0'}
          subtitle="Dense corridor clusters"
          icon={Flame}
          variant="warning"
        />
        <MetricCard
          title="CLUSTERED INCIDENTS"
          value={data ? data.clustered_accidents_count.toLocaleString() : '0'}
          subtitle={
            data && (data.clustered_accidents_count + data.noise_accidents_count > 0)
              ? `${((data.clustered_accidents_count / (data.clustered_accidents_count + data.noise_accidents_count)) * 100).toFixed(1)}% of total volume`
              : 'Clustered share'
          }
          icon={Layers}
          variant="primary"
        />
        <MetricCard
          title="DISPERSED / NOISE INCIDENTS"
          value={data ? data.noise_accidents_count.toLocaleString() : '0'}
          subtitle="Non-clustered baseline points"
          icon={Compass}
          variant="default"
        />
        <MetricCard
          title="PEAK CORRIDOR CONCENTRATION"
          value={hotspots.length > 0 ? `${hotspots[0].size} Crashes` : 'N/A'}
          subtitle={hotspots.length > 0 ? `${hotspots[0].city} (ID #${hotspots[0].cluster_id})` : 'None'}
          icon={AlertTriangle}
          variant="critical"
        />
      </div>

      {/* Split View: Map + Hotspots Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Cluster Map (Takes 6 cols) */}
        <div className="lg:col-span-6 bg-bg-card border border-border-dark rounded-lg overflow-hidden shadow-card-dark h-[520px] relative flex flex-col">
          <div className="p-3 bg-bg-card border-b border-border-dark flex items-center justify-between z-10">
            <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-accent-warning" />
              Hotspot Spatial Map (CartoDB Dark)
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              {hotspots.length} Clusters Plotted
            </span>
          </div>

          <div className="flex-1 w-full h-full relative">
            {isLoading && (
              <div className="absolute inset-0 z-[500] bg-bg-main/70 backdrop-blur-sm flex items-center justify-center">
                <LoadingSpinner message="Calculating DBSCAN haversine clusters..." />
              </div>
            )}

            <MapContainer
              center={
                hotspots.length > 0
                  ? [hotspots[0].centroid_lat, hotspots[0].centroid_lon]
                  : [21.0, 78.0]
              }
              zoom={hotspots.length > 0 ? 11 : 5}
              className="h-full w-full"
            >
              <MapFlyTo center={flyToCenter} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>'
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
                        color: isSelected ? '#38BDF8' : '#FBBF24',
                        fillColor: '#FBBF24',
                        fillOpacity: isSelected ? 0.25 : 0.12,
                        weight: isSelected ? 2 : 1,
                      }}
                    />

                    {/* Centroid Point */}
                    <CircleMarker
                      center={[h.centroid_lat, h.centroid_lon]}
                      radius={Math.min(18, Math.max(6, Math.sqrt(h.size) * 2.2))}
                      pathOptions={{
                        color: '#080D17',
                        fillColor: h.fatal_count > 3 ? '#F87171' : '#FBBF24',
                        fillOpacity: 0.9,
                        weight: 2,
                      }}
                      eventHandlers={{
                        click: () => setSelectedHotspot(h),
                      }}
                    >
                      <Tooltip direction="top">
                        <div className="text-xs font-mono p-1">
                          <div className="font-bold text-accent-warning">
                            Cluster #{h.cluster_id} ({h.city})
                          </div>
                          <div>Total Incidents: {h.size}</div>
                          <div>Fatal Crashes: {h.fatal_count} ({(h.fatal_ratio * 100).toFixed(1)}%)</div>
                          <div>Dominant: {h.dominant_road}</div>
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Hotspots Ranked Registry (Takes 6 cols) */}
        <div className="lg:col-span-6 bg-bg-card border border-border-dark rounded-lg overflow-hidden shadow-card-dark flex flex-col h-[520px]">
          <div className="p-3 bg-bg-card border-b border-border-dark flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-accent-critical" />
              High-Risk Corridor Rankings
            </h3>
            <span className="text-[11px] font-mono text-text-muted">
              Sorted by Incident Volume
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-surface text-text-subtle text-[11px] font-mono uppercase sticky top-0 z-10 border-b border-border-dark">
                <tr>
                  <th className="py-2.5 px-3">Cluster</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Crashes</th>
                  <th className="py-2.5 px-3">Fatal</th>
                  <th className="py-2.5 px-3">Corridor Road</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/60 font-mono">
                {hotspots.map((h) => {
                  const isSelected = selectedHotspot?.cluster_id === h.cluster_id;
                  return (
                    <tr
                      key={h.cluster_id}
                      onClick={() => handleFocusHotspot(h)}
                      className={`hover:bg-bg-surface/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-accent-primary/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-accent-warning">
                        #{h.cluster_id}
                      </td>
                      <td className="py-2.5 px-3 text-text-main font-medium">{h.city}</td>
                      <td className="py-2.5 px-3 font-bold text-text-main">{h.size}</td>
                      <td className="py-2.5 px-3">
                        <span className={h.fatal_count > 0 ? 'text-accent-critical font-bold' : 'text-text-muted'}>
                          {h.fatal_count} ({(h.fatal_ratio * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-muted truncate max-w-[120px]">
                        {h.dominant_road}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusHotspot(h);
                          }}
                          className="px-2 py-0.5 rounded text-[11px] bg-bg-surface hover:bg-accent-primary hover:text-bg-main border border-border-dark transition-colors"
                        >
                          Focus
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {hotspots.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      No clusters found with current parameters. Try decreasing minimum samples or increasing radius.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedHotspot && (
            <div className="p-3 bg-bg-surface border-t border-border-dark text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-text-main">
                  Focused: Cluster #{selectedHotspot.cluster_id} ({selectedHotspot.city})
                </span>
                <span className="text-text-muted block text-[11px]">
                  Dominant Weather: {selectedHotspot.dominant_weather} | Density: {selectedHotspot.density_per_sqkm} crashes/km²
                </span>
              </div>
              <Badge variant={selectedHotspot.fatal_count > 2 ? 'fatal' : 'warning'}>
                {selectedHotspot.fatal_count > 2 ? 'HIGH RISK CORRIDOR' : 'ACCIDENT CLUSTER'}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

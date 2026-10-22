import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Building2,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  ExternalLink,
  ChevronDown,
  BarChart3,
  Layers,
  Bike,
  Users,
  Car,
  Truck,
  Activity,
  Globe2,
} from 'lucide-react';
import {
  getMorthCities,
  getMorthStates,
  getMorthCollisionTypes,
  getMorthSummary,
} from '../../services/api';
import type { MorthCityItem, MorthStateItem, MorthCollisionItem } from '../../types/api';

interface MorthNationalExplorerProps {
  onSelectOrigin?: (cityName: string) => void;
  onSelectDestination?: (cityName: string) => void;
  selectedSource?: string;
  selectedDestination?: string;
}

export const MorthNationalExplorer: React.FC<MorthNationalExplorerProps> = ({
  onSelectOrigin,
  onSelectDestination,
  selectedSource,
  selectedDestination,
}) => {
  const [activeTab, setActiveTab] = useState<'cities' | 'states' | 'collisions' | 'national'>('cities');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'accidents' | 'killed' | 'fatal_pct' | 'name'>('accidents');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Fetch official MoRTH datasets from backend
  const { data: citiesData, isLoading: loadingCities } = useQuery({
    queryKey: ['morthCities'],
    queryFn: getMorthCities,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });

  const { data: statesData, isLoading: loadingStates } = useQuery({
    queryKey: ['morthStates'],
    queryFn: getMorthStates,
    staleTime: 1000 * 60 * 30,
  });

  const { data: collisionData, isLoading: loadingCollisions } = useQuery({
    queryKey: ['morthCollisionTypes'],
    queryFn: getMorthCollisionTypes,
    staleTime: 1000 * 60 * 30,
  });

  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['morthSummary'],
    queryFn: getMorthSummary,
    staleTime: 1000 * 60 * 30,
  });

  // Filter and sort cities
  const filteredCities = (citiesData?.cities || [])
    .filter((c: MorthCityItem) =>
      c.city.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .sort((a: MorthCityItem, b: MorthCityItem) => {
      let valA: number = 0;
      let valB: number = 0;
      if (sortBy === 'accidents') {
        valA = a.accidents_2024;
        valB = b.accidents_2024;
      } else if (sortBy === 'killed') {
        valA = a.killed_2024;
        valB = b.killed_2024;
      } else if (sortBy === 'fatal_pct') {
        valA = a.fatal_pct;
        valB = b.fatal_pct;
      } else {
        return sortOrder === 'asc'
          ? a.city.localeCompare(b.city)
          : b.city.localeCompare(a.city);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  // Filter and sort states
  const filteredStates = (statesData?.states || [])
    .filter((s: MorthStateItem) =>
      s.State.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .sort((a: MorthStateItem, b: MorthStateItem) => {
      const getNum = (v: any) => {
        if (!v) return 0;
        const n = parseInt(String(v).replace(/,/g, ''), 10);
        return isNaN(n) ? 0 : n;
      };
      const numA = getNum(a['2024 Accidents']);
      const numB = getNum(b['2024 Accidents']);
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
      {/* Header Banner with Official Emblem & Verified Tag */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-center justify-center shrink-0">
              <Globe2 className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Official MoRTH 2024
                </span>
                <span className="text-xs text-blue-200 font-medium">
                  Transport Research Wing • Ministry of Road Transport & Highways, Govt. of India
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white mt-1">
                National Road Safety Intelligence Database
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                Verified microdata across 50 Million-Plus Indian Metros and all 36 States & UTs. 
                Explore official crash volumes, road user vulnerabilities, and primary causal violations.
              </p>
            </div>
          </div>

          {/* Quick Summary Pill on Header */}
          <div className="hidden lg:flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-slate-300">National 2024 Crashes</div>
              <div className="text-lg font-black text-amber-300">4,87,707</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-slate-300">Total Fatalities</div>
              <div className="text-lg font-black text-rose-300">1,77,175</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-b border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'cities'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            50 Million-Plus Cities
            <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">50</span>
          </button>
          <button
            onClick={() => setActiveTab('states')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'states'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All 36 States & UTs (5-Yr Trend)
          </button>
          <button
            onClick={() => setActiveTab('collisions')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'collisions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Collision Dynamics Breakdown
          </button>
          <button
            onClick={() => setActiveTab('national')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'national'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            National Benchmarks
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 md:p-6">
        {/* TAB 1: 50 CITIES TABLE */}
        {activeTab === 'cities' && (
          <div>
            {/* Search and Sort Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search among 50 MoRTH cities (e.g. Pune, Agra, Bengaluru)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
                >
                  <option value="accidents">Total Accidents</option>
                  <option value="killed">Total Fatalities</option>
                  <option value="fatal_pct">Fatal Severity Rate %</option>
                  <option value="name">City Name</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                  title="Toggle Ascending/Descending"
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    <tr>
                      <th className="py-2.5 px-3.5">City & Rank</th>
                      <th className="py-2.5 px-3.5 text-right">2024 Crashes</th>
                      <th className="py-2.5 px-3.5 text-right">Fatalities</th>
                      <th className="py-2.5 px-3.5 text-right">Fatal Severity %</th>
                      <th className="py-2.5 px-3.5">Top Causal Violation</th>
                      <th className="py-2.5 px-3.5">Most Vulnerable Mode</th>
                      <th className="py-2.5 px-3.5 text-center">Corridor Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {loadingCities ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Loading official MoRTH city data...
                        </td>
                      </tr>
                    ) : filteredCities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No cities found matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredCities.map((c) => {
                        const isOrigin = selectedSource?.toLowerCase() === c.city.toLowerCase();
                        const isDest = selectedDestination?.toLowerCase() === c.city.toLowerCase();

                        return (
                          <tr
                            key={c.city}
                            className={`hover:bg-blue-50/50 transition-colors ${
                              isOrigin || isDest ? 'bg-blue-50/70 font-medium' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3.5">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{c.city}</span>
                                {c.ranking_accidents && (
                                  <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                    #{c.ranking_accidents} in India
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-semibold text-slate-800">
                              {c.accidents_2024.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-semibold text-rose-600">
                              {c.killed_2024.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  c.fatal_pct > 35
                                    ? 'bg-rose-100 text-rose-800'
                                    : c.fatal_pct > 20
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {c.fatal_pct}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                {c.top_violation || 'Over-speeding'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                <Bike className="w-3 h-3 text-blue-500" />
                                {c.top_fatal_mode || 'Two-Wheelers'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              <div className="inline-flex items-center gap-1">
                                {onSelectOrigin && (
                                  <button
                                    onClick={() => onSelectOrigin(c.city)}
                                    className={`px-2 py-1 text-[10px] rounded font-semibold transition-all ${
                                      isOrigin
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                                    }`}
                                    title="Set as Route Origin (A)"
                                  >
                                    {isOrigin ? 'Origin ✓' : 'Set Origin'}
                                  </button>
                                )}
                                {onSelectDestination && (
                                  <button
                                    onClick={() => onSelectDestination(c.city)}
                                    className={`px-2 py-1 text-[10px] rounded font-semibold transition-all ${
                                      isDest
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                                    }`}
                                    title="Set as Route Destination (B)"
                                  >
                                    {isDest ? 'Dest ✓' : 'Set Dest'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALL 36 STATES (5-YEAR TREND) */}
        {activeTab === 'states' && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search state (e.g. Maharashtra, Tamil Nadu, Uttar Pradesh)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="text-xs text-slate-500">
                Tracking all 36 States & UTs across India
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3.5">State / UT</th>
                      <th className="py-2.5 px-3.5 text-right">2020 Crashes</th>
                      <th className="py-2.5 px-3.5 text-right">2022 Crashes</th>
                      <th className="py-2.5 px-3.5 text-right">2023 Crashes</th>
                      <th className="py-2.5 px-3.5 text-right">2024 Crashes</th>
                      <th className="py-2.5 px-3.5 text-right">2024 Fatalities</th>
                      <th className="py-2.5 px-3.5 text-right">YoY % Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingStates ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Loading 36 States MoRTH datasets...
                        </td>
                      </tr>
                    ) : (
                      filteredStates.map((s) => {
                        const pct = s['% change from 2023 to 2024'];
                        const isUp = typeof pct === 'number' && pct > 0;
                        const isDown = typeof pct === 'number' && pct < 0;

                        return (
                          <tr key={s.State} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                              {s.State}
                            </td>
                            <td className="py-2.5 px-3.5 text-right text-slate-600 font-mono">
                              {s['2020 Accidents'] || '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-right text-slate-600 font-mono">
                              {s['2022 Accidents'] || '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-right text-slate-600 font-mono">
                              {s['2023 Accidents'] || '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 font-mono">
                              {s['2024 Accidents'] || '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-bold text-rose-600 font-mono">
                              {s['2024 Killed'] || '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              {pct !== null && pct !== undefined ? (
                                <span
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    isUp
                                      ? 'bg-rose-100 text-rose-700'
                                      : isDown
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {isUp && <TrendingUp className="w-3 h-3" />}
                                  {isDown && <TrendingDown className="w-3 h-3" />}
                                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLLISION DYNAMICS */}
        {activeTab === 'collisions' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {loadingCollisions ? (
                <div className="col-span-full py-8 text-center text-slate-400">
                  Loading official national collision distribution...
                </div>
              ) : (
                collisionData?.collision_types
                  ?.filter((c) => c.collision_type !== 'Total')
                  ?.map((col) => {
                    const pctOfTotal = (
                      (col.accidents_2024 / (collisionData?.national_total_accidents || 487707)) *
                      100
                    ).toFixed(1);

                    return (
                      <div
                        key={col.collision_type}
                        className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 hover:border-blue-300 transition-all shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-900 text-xs">
                            {col.collision_type}
                          </h4>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {pctOfTotal}% of crashes
                          </span>
                        </div>
                        <div className="space-y-1.5 mt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">2024 Crashes:</span>
                            <span className="font-bold text-slate-800">
                              {col.accidents_2024.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Fatalities:</span>
                            <span className="font-bold text-rose-600">
                              {col.killed_2024.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Fatal Severity Rate:</span>
                            <span className="font-bold text-amber-700">
                              {col.fatal_pct}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, parseFloat(pctOfTotal) * 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: NATIONAL BENCHMARKS */}
        {activeTab === 'national' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Road Crashes (2024)
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">4,87,707</div>
                <div className="text-[11px] text-slate-500 mt-1">Across all Indian roads</div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  Road Fatalities (2024)
                </div>
                <div className="text-2xl font-black text-rose-700 mt-1">1,77,175</div>
                <div className="text-[11px] text-rose-600 mt-1">36.33% Fatal Severity Rate</div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                  Top Causal Violation
                </div>
                <div className="text-lg font-black text-amber-900 mt-1">Over-speeding</div>
                <div className="text-[11px] text-amber-700 mt-1">Accounts for 71.2% of road deaths</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
                  Most Vulnerable Mode
                </div>
                <div className="text-lg font-black text-blue-900 mt-1">Two-Wheelers (44.5%)</div>
                <div className="text-[11px] text-blue-700 mt-1">Followed by Pedestrians (19.5%)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  50 Million-Plus Cities Concentration
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The 50 Million-Plus cities in India accounted for{' '}
                  <strong className="text-slate-900">82,127 road accidents</strong> (16.8% of national total)
                  and <strong className="text-slate-900">17,186 fatalities</strong> (9.7% of national total). 
                  Delhi, Bengaluru, and Chennai recorded the highest urban crash volumes, whereas cities with high mixed-traffic 
                  such as Agra, Kanpur, and Varanasi exhibited fatal severity rates exceeding 45%.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  State Highway & National Corridor Dynamics
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">Tamil Nadu</strong> recorded the highest overall crash count (67,526 crashes),
                  while <strong className="text-slate-900">Uttar Pradesh</strong> recorded the highest fatalities (24,118 deaths),
                  followed by Maharashtra (15,715). Over 6,300 continuous 500-meter accident blackspot corridors have been mapped 
                  nationally by MoRTH and NHAI via the e-DAR/iRAD digital network.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

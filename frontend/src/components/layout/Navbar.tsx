import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  MapPin,
  Clock,
  Gauge,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  Flame,
  Navigation
} from 'lucide-react';
import { getMetadata } from '../../services/api';
import { useCityFilter } from '../../context/CityContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const customerNavItems: NavItem[] = [
  {
    name: 'Check Trip Risk',
    href: '/',
    icon: ShieldAlert,
    description: 'Calculate real-time accident risk for your trip',
  },
  {
    name: 'Accident Hotspots',
    href: '/hotspots',
    icon: Flame,
    description: 'Explore high-density collision corridors in your city',
  },
  {
    name: 'Incident Map',
    href: '/map',
    icon: Navigation,
    description: 'Geospatial point map of verified crash locations',
  },
  {
    name: 'Safe Travel Times',
    href: '/temporal',
    icon: Clock,
    description: 'Find safest and high-congestion commute windows',
  },
  {
    name: 'Road Safety Factors',
    href: '/severity',
    icon: Gauge,
    description: 'Weather, road types, and infrastructure impacts',
  },
  {
    name: 'Safety Guide',
    href: '/methodology',
    icon: HelpCircle,
    description: 'Defensive driving tips and emergency helplines',
  },
];

export const Navbar: React.FC = () => {
  const { selectedCity, setSelectedCity } = useCityFilter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: metadata } = useQuery({
    queryKey: ['metadata'],
    queryFn: getMetadata,
    staleTime: 60000,
  });

  const cityList = metadata?.cities || [
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Chennai',
    'Pune',
    'Hyderabad',
    'Kolkata',
    'Chandigarh',
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white shadow-md border border-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  AccidentVision
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  AI
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium tracking-wide">
                Road Risk Intelligence Platform
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center space-x-1">
            {customerNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Medium Screen Compact Navigation (768px - 1280px) */}
          <nav className="hidden md:flex xl:hidden items-center space-x-1">
            {customerNavItems.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* City Selector */}
            <div className="flex items-center bg-white border border-slate-200 hover:border-blue-400 rounded-lg px-2 py-1 text-xs transition-colors shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer pr-1 font-semibold max-w-[110px] truncate"
                aria-label="Select City"
              >
                <option value="" className="bg-white text-slate-900">
                  All Metros
                </option>
                {cityList.map((city) => (
                  <option key={city} value={city} className="bg-white text-slate-900">
                    {city}
                  </option>
                ))}
              </select>
              {selectedCity && (
                <button
                  onClick={() => setSelectedCity('')}
                  className="ml-1 text-[10px] text-slate-400 hover:text-red-600 underline font-mono"
                  title="Clear City Filter"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Telemetry Pill */}
            <div className="hidden 2xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>20K Crashes</span>
            </div>

            {/* Mobile / Compact Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2 shadow-lg">
          {customerNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-blue-600" />
                <div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-[11px] text-slate-500">{item.description}</div>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Navbar;

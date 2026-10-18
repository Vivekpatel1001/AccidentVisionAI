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
  ChevronDown,
  Activity,
  Layers
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
    href: '/map',
    icon: MapPin,
    description: 'Explore high-risk collision zones in your city',
  },
  {
    name: 'Safe Travel Times',
    href: '/temporal',
    icon: Clock,
    description: 'Find the safest and most dangerous commute hours',
  },
  {
    name: 'Road Safety Factors',
    href: '/severity',
    icon: Gauge,
    description: 'Weather, road types, and infrastructure impacts',
  },
  {
    name: 'Driving Advisory',
    href: '/methodology',
    icon: HelpCircle,
    description: 'Defensive driving tips and emergency contacts',
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
    <header className="sticky top-0 z-50 w-full border-b border-border-dark bg-bg-secondary/90 backdrop-blur-md shadow-card-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-glow-primary border border-blue-400/30 group-hover:scale-105 transition-transform duration-200">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  AccidentVision
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AI
                </span>
              </div>
              <div className="text-[11px] text-text-muted font-medium tracking-wide">
                Road Risk Intelligence
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {customerNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-accent-primary text-white font-semibold shadow-glow-primary'
                        : 'text-text-muted hover:text-white hover:bg-bg-surface'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* City Selector */}
            <div className="flex items-center bg-bg-card border border-border-dark hover:border-accent-primary/40 rounded-lg px-2.5 py-1.5 text-xs transition-colors shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-accent-primary mr-1.5 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-text-main text-xs focus:outline-none cursor-pointer pr-1 font-medium"
                aria-label="Select City"
              >
                <option value="" className="bg-bg-card text-text-main">
                  All 8 Metros
                </option>
                {cityList.map((city) => (
                  <option key={city} value={city} className="bg-bg-card text-text-main">
                    {city}
                  </option>
                ))}
              </select>
              {selectedCity && (
                <button
                  onClick={() => setSelectedCity('')}
                  className="ml-1 text-[10px] text-text-muted hover:text-accent-critical underline font-mono"
                  title="Clear City Filter"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Live Telemetry Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-accent-success/10 border border-accent-success/25 text-[11px] font-medium text-accent-success">
              <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse shrink-0" />
              <span>Live Telemetry</span>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-bg-card border border-border-dark text-text-muted hover:text-white hover:bg-bg-surface transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border-dark bg-bg-secondary px-4 pt-3 pb-4 space-y-2">
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
                      ? 'bg-accent-primary text-white font-semibold'
                      : 'text-text-muted hover:text-white hover:bg-bg-surface'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-accent-primary" />
                <div>
                  <div className="text-sm">{item.name}</div>
                  <div className="text-[11px] text-text-subtle">{item.description}</div>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};

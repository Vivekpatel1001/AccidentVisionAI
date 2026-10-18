import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Flame,
  Clock,
  AlertTriangle,
  BrainCircuit,
  SlidersHorizontal,
  TableProperties,
  ShieldCheck,
  BookOpen,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getHealth } from '../../services/api';

const navigation = [
  {
    group: 'INTELLIGENCE & WORKSPACE',
    items: [
      { name: 'Executive Overview', href: '/', icon: LayoutDashboard },
      { name: 'Accident Spatial Map', href: '/map', icon: MapPin },
      { name: 'Hotspot Clusters', href: '/hotspots', icon: Flame },
      { name: 'Temporal Dynamics', href: '/temporal', icon: Clock },
      { name: 'Severity Analysis', href: '/severity', icon: AlertTriangle },
    ],
  },
  {
    group: 'MACHINE LEARNING & AI',
    items: [
      { name: 'Model Benchmarks', href: '/model', icon: BrainCircuit },
      { name: 'Prediction Workspace', href: '/predictions', icon: SlidersHorizontal },
    ],
  },
  {
    group: 'DATA & METHODOLOGY',
    items: [
      { name: 'Dataset Explorer', href: '/explorer', icon: TableProperties },
      { name: 'Data Quality & Provenance', href: '/data-quality', icon: ShieldCheck },
      { name: 'Scientific Methodology', href: '/methodology', icon: BookOpen },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { data: health, isSuccess } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 10000,
    retry: false,
  });

  return (
    <aside className="w-64 bg-bg-sidebar border-r border-border-dark flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-border-dark flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary shadow-glow-primary">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide text-text-main flex items-center space-x-1">
              <span>AccidentVision</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary font-semibold">AI</span>
            </div>
            <div className="text-[11px] text-text-muted font-medium">Risk Intelligence v2.0</div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((section) => (
          <div key={section.group}>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-text-subtle uppercase font-mono">
              {section.group}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-xs font-medium rounded-md transition-all duration-150 group ${
                        isActive
                          ? 'bg-accent-primary/15 text-accent-primary border-l-2 border-accent-primary font-semibold shadow-sm'
                          : 'text-text-muted hover:text-text-main hover:bg-bg-card'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-2.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-border-dark bg-bg-main/60 space-y-2">
        <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-bg-card border border-border-dark">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSuccess ? 'bg-accent-success' : 'bg-accent-critical'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSuccess ? 'bg-accent-success' : 'bg-accent-critical'}`} />
            </span>
            <span className="text-text-muted font-mono">Backend Engine</span>
          </div>
          <span className={`font-mono font-semibold ${isSuccess ? 'text-accent-success' : 'text-accent-critical'}`}>
            {isSuccess ? 'ONLINE' : 'CONNECTING'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-text-subtle px-2 font-mono">
          <span>Scope: 20,000 Records</span>
          <span>8 Cities / India</span>
        </div>
      </div>
    </aside>
  );
};

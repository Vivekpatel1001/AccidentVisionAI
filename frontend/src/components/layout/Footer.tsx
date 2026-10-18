import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, PhoneCall, AlertTriangle, ExternalLink, HeartPulse } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border-dark bg-bg-secondary/60 mt-12 text-xs text-text-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-accent-primary flex items-center justify-center text-white">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-text-main">AccidentVision AI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">v2.0</span>
            </div>
            <p className="text-text-muted text-xs leading-relaxed max-w-md">
              A public road accident risk intelligence platform helping commuters, drivers, and city planners
              understand road hazards, dangerous corridors, and peak risk hours across 8 Indian metropolitan zones.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-text-subtle pt-1">
              <span>Grounding: 20,000 Verified Records (2022 – 2025)</span>
              <span>•</span>
              <span>OpenStreetMap Enriched</span>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className="space-y-3">
            <div className="font-semibold text-text-main text-xs uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-accent-critical" />
              <span>National Road Helplines</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between p-2 rounded bg-bg-card border border-border-dark">
                <span className="text-text-muted">National Emergency</span>
                <span className="font-bold text-text-main font-mono text-accent-critical">112</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-bg-card border border-border-dark">
                <span className="text-text-muted">National Highway Helpline</span>
                <span className="font-bold text-text-main font-mono text-accent-warning">1033</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-bg-card border border-border-dark">
                <span className="text-text-muted">Ambulance & Medical</span>
                <span className="font-bold text-text-main font-mono text-accent-success">108</span>
              </li>
            </ul>
          </div>

          {/* Quick Links & Specs */}
          <div className="space-y-3">
            <div className="font-semibold text-text-main text-xs uppercase tracking-wider">
              Quick Safety Navigation
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="hover:text-accent-primary transition-colors">
                  🛡️ Check Trip Accident Risk
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-accent-primary transition-colors">
                  🗺️ City High-Risk Hotspots Map
                </Link>
              </li>
              <li>
                <Link to="/temporal" className="hover:text-accent-primary transition-colors">
                  ⏱️ Best & Worst Driving Times
                </Link>
              </li>
              <li>
                <Link to="/severity" className="hover:text-accent-primary transition-colors">
                  🛣️ Road Infrastructure Factors
                </Link>
              </li>
              <li className="pt-2 border-t border-border-subtle">
                <Link to="/model" className="text-text-subtle hover:text-text-muted flex items-center gap-1">
                  <span>Technical & Model Specs</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="border-t border-border-dark pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-text-subtle gap-4">
          <p>
            © {new Date().getFullYear()} AccidentVision AI. Built for road safety research and defensive commuting.
            Always obey local traffic regulations and speed limits.
          </p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 text-accent-success">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-success" />
              Zero-Leakage Architecture
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

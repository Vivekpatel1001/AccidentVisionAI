import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, PhoneCall, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white mt-16 text-xs text-slate-600">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">AccidentVision AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">v2.0 Pro</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed max-w-md">
              A state-of-the-art road accident risk intelligence platform helping commuters, drivers, and safety planners
              identify road hazards, dangerous blackspots, and safest commute hours across 8 Indian metropolitan zones.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1 font-medium">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                20,000 Verified Telemetry Records
              </span>
              <span>•</span>
              <span>OpenStreetMap Road Enriched</span>
              <span>•</span>
              <span>AI Ensemble Safety Scoring</span>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              <span>National Road Helplines</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">National Emergency</span>
                <span className="font-extrabold text-red-600 font-mono text-sm">112</span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">National Highway Helpline</span>
                <span className="font-extrabold text-amber-600 font-mono text-sm">1033</span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Ambulance & Medical</span>
                <span className="font-extrabold text-emerald-600 font-mono text-sm">108</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Safety Platform Links
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  🛡️ Check Trip Accident Risk
                </Link>
              </li>
              <li>
                <Link to="/hotspots" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  🔥 Dangerous Collision Corridors
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  🗺️ Interactive Crash Map
                </Link>
              </li>
              <li>
                <Link to="/temporal" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  ⏰ Peak Rush & Safe Commute Hours
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  📘 Driving Guidelines & Defensive Tips
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div>
            © {new Date().getFullYear()} AccidentVision AI. Built with real verified open-source road accident records.
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-500">Defensive driving saves lives. Always wear seatbelts and adhere to posted speed limits.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

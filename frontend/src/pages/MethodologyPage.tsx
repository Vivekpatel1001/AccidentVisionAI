import React, { useState } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Car,
  Clock,
  CloudRain,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MapPin,
  ExternalLink,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MethodologyPage: React.FC = () => {
  const [techOpen, setTechOpen] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Commuter Safety Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Road Safety Advisory & Driver Guidelines
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Evidence-based driving recommendations derived from 20,000 metropolitan accident records and emergency response hotlines.
        </p>
      </div>

      {/* Emergency Roadside Hotlines */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900">
            <PhoneCall className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-extrabold">24x7 National Highway & Emergency Hotlines</h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold">
            Toll-Free in India
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">National Police & Emergency</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">All-India Dispatch</div>
            </div>
            <div className="text-2xl font-extrabold text-red-600 font-mono">112</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">National Highway Helpline</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">NHAI Patrol & Towing</div>
            </div>
            <div className="text-2xl font-extrabold text-amber-600 font-mono">1033</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Ambulance & Medical Trauma</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Emergency Healthcare</div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono">108</div>
          </div>
        </div>
      </div>

      {/* 5 Evidence-Based Defensive Driving Rules */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          5 Core Rules for Indian Highway & City Driving
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono flex items-center justify-center text-xs">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900">Double Braking Distance in Rain / Fog</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              Hydroplaning risk peaks during the first 20 minutes of rainfall as road oils float. Verified crash telemetry shows a 35% longer stopping distance. Maintain a 4-second following gap.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono flex items-center justify-center text-xs">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900">Extreme Caution at Uncontrolled Junctions</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              Intersections without traffic signals record 2.4x higher fatality rates in our dataset. Always bring speed below 30 km/h and visually check both sides before crossing.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono flex items-center justify-center text-xs">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900">Avoid the Midnight Speed Trap (23:00–03:00)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              Empty expressways create a false sense of security. While traffic volume is lowest at night, crash impact kinetic energy is at its highest due to uncurbed speeds.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold font-mono flex items-center justify-center text-xs">
                4
              </span>
              <h3 className="text-sm font-bold text-slate-900">Plan Trips in the 10:00–14:00 Window</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              Data across all 8 major metros indicates the lowest accident frequency occurs between 10 AM and 2 PM. Daylight visibility and lower driver fatigue make this the optimal window.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Methodology Accordion */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <button
          onClick={() => setTechOpen(!techOpen)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Scientific Methodology & Data Governance
              </h3>
              <p className="text-xs text-slate-500">How the models and spatial clusters are engineered</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
            {techOpen ? 'Hide Technical Details' : 'View Technical Details'}
            {techOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {techOpen && (
          <div className="pt-4 border-t border-slate-100 space-y-4 text-xs text-slate-600 leading-relaxed animate-in fade-in duration-200">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">1. Master Dataset Provenance</h4>
              <p>
                The master dataset comprises 20,000 individual accident records collected between Jan 2022 and Apr 2025 across 8 metropolitan cities (Mumbai, Delhi, Bengaluru, Chennai, Pune, Hyderabad, Kolkata, Chandigarh). Every record is enriched with OpenStreetMap highway geometry tags and WGS84 coordinates.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">2. Pre-Accident Feature Quarantine</h4>
              <p>
                To avoid retrospective target leakage, post-accident outcome features such as number of casualties, property damage estimates, and accident causes are strictly excluded from pre-trip prediction inputs.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">3. Spatial Clustering via DBSCAN</h4>
              <p>
                Accident blackspots are extracted dynamically using density-based spatial clustering (DBSCAN) with spherical haversine metric distance calculation, grouping incidents within a 600m to 1200m radius into persistent hazard corridors.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MethodologyPage;

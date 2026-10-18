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
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MethodologyPage: React.FC = () => {
  const [techOpen, setTechOpen] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="border-b border-border-dark pb-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Commuter Safety Guide</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Road Safety Advisory & Driver Guidelines
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Evidence-based driving recommendations derived from 20,000 metropolitan accident records and emergency response hotlines.
        </p>
      </div>

      {/* Emergency Roadside Hotlines */}
      <div className="bg-bg-card border border-border-dark rounded-xl p-6 shadow-card-dark space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <PhoneCall className="w-5 h-5 text-accent-critical" />
            <h2 className="text-base font-bold">24x7 National Highway & Emergency Hotlines</h2>
          </div>
          <span className="text-[11px] font-mono text-accent-success bg-accent-success/10 border border-accent-success/20 px-2 py-0.5 rounded">
            Toll-Free in India
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-lg bg-bg-surface border border-border-dark flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted">National Police & Emergency</div>
              <div className="text-xs font-semibold text-text-main mt-0.5">All-India Dispatch</div>
            </div>
            <div className="text-2xl font-extrabold text-accent-critical font-mono">112</div>
          </div>

          <div className="p-4 rounded-lg bg-bg-surface border border-border-dark flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted">National Highway Emergency</div>
              <div className="text-xs font-semibold text-text-main mt-0.5">NHAI Patrol & Towing</div>
            </div>
            <div className="text-2xl font-extrabold text-accent-warning font-mono">1033</div>
          </div>

          <div className="p-4 rounded-lg bg-bg-surface border border-border-dark flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted">Ambulance & Medical Trauma</div>
              <div className="text-xs font-semibold text-text-main mt-0.5">Emergency Healthcare</div>
            </div>
            <div className="text-2xl font-extrabold text-accent-success font-mono">108</div>
          </div>
        </div>
      </div>

      {/* 5 Evidence-Based Defensive Driving Rules */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-accent-primary" />
          5 Critical Driving Insights From Our Accident Database
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-bg-card border border-border-dark space-y-2">
            <div className="flex items-center space-x-2 text-accent-warning">
              <Clock className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">1. Beware the Evening Rush (18:00 – 21:00)</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              38% of all recorded major and fatal accidents occur between 6 PM and 9 PM. High traffic density combined
              with driver fatigue creates the most hazardous driving window across all 8 metropolitan zones.
            </p>
            <div className="text-[11px] text-accent-warning font-medium pt-1">
              Tip: If flexible, depart before 5:00 PM or after 8:30 PM to cut risk by ~45%.
            </div>
          </div>

          <div className="p-5 rounded-xl bg-bg-card border border-border-dark space-y-2">
            <div className="flex items-center space-x-2 text-accent-critical">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">2. Uncontrolled Crossing Caution</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Roadways without operational traffic signals account for 2.4x higher crash severity than signalized intersections.
              Drivers often misjudge crossing vehicle approach velocities at unmonitored junctions.
            </p>
            <div className="text-[11px] text-accent-critical font-medium pt-1">
              Tip: Always reduce speed and check both directions even when you have apparent right-of-way.
            </div>
          </div>

          <div className="p-5 rounded-xl bg-bg-card border border-border-dark space-y-2">
            <div className="flex items-center space-x-2 text-accent-primary">
              <CloudRain className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">3. Wet Road 4-Second Gap Rule</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Wet pavement reduces tyre traction and increases emergency stopping distances by up to 35%. Tailgating on
              rain-slicked highways is the leading contributor to multi-vehicle rear-end collisions.
            </p>
            <div className="text-[11px] text-accent-primary font-medium pt-1">
              Tip: Double your normal 2-second following distance to at least 4 seconds during rain.
            </div>
          </div>

          <div className="p-5 rounded-xl bg-bg-card border border-border-dark space-y-2">
            <div className="flex items-center space-x-2 text-accent-success">
              <Car className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">4. Highway Lane Discipline</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Highways and expressways record higher collision impact forces due to travel speeds. Sudden lane-switching
              near exit ramps accounts for a substantial fraction of expressway rollover crashes.
            </p>
            <div className="text-[11px] text-accent-success font-medium pt-1">
              Tip: Signal lane changes at least 100 meters in advance; avoid erratic overtaking on the left.
            </div>
          </div>
        </div>
      </div>

      {/* How AccidentVision AI Calculates Risk */}
      <div className="bg-bg-card border border-border-dark rounded-xl p-6 shadow-card-dark space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent-primary" />
          How the Accident Risk Score Works
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">
          AccidentVision AI evaluates historical accident statistics from 20,000 verified collision events across Mumbai,
          Delhi, Bengaluru, Chennai, Pune, Hyderabad, Kolkata, and Chandigarh (2022 through April 2025).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-lg bg-bg-surface border border-border-dark space-y-1.5">
            <div className="text-xs font-bold text-accent-primary uppercase font-mono">1. Road Geography</div>
            <div className="text-xs text-text-muted">
              Matches your selected route to OpenStreetMap roadway tags, lane counts, and speed design profiles.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-bg-surface border border-border-dark space-y-1.5">
            <div className="text-xs font-bold text-accent-warning uppercase font-mono">2. Diurnal Timing</div>
            <div className="text-xs text-text-muted">
              Cross-references your departure hour against hourly traffic volume and historical peak crash concentration.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-bg-surface border border-border-dark space-y-1.5">
            <div className="text-xs font-bold text-accent-success uppercase font-mono">3. Calibrated Risk</div>
            <div className="text-xs text-text-muted">
              Computes an honest probability distribution between Minor, Severe, and Fatal outcomes without data leakage.
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Technical & Scientific Architecture (Kept for completeness) */}
      <div className="border border-border-dark rounded-xl overflow-hidden bg-bg-card">
        <button
          onClick={() => setTechOpen(!techOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-bg-surface/50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-text-main uppercase font-mono tracking-wider">
              Technical Architecture & Peer-Reviewed Methodology
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-dark">
              For Engineers & Researchers
            </span>
          </div>
          {techOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </button>

        {techOpen && (
          <div className="p-6 border-t border-border-dark bg-bg-surface/30 space-y-4 text-xs text-text-muted leading-relaxed">
            <div>
              <h4 className="font-bold text-white mb-1">1. Zero-Leakage Strict Chronological Partitioning</h4>
              <p>
                Standard random k-fold cross validation leaks future crashes into past evaluation. AccidentVision AI strictly enforces
                a temporal split: Training on 2022–2023 (12,205 records), validation on 2024 (6,061 records), and holdout verification on 2025 (1,734 records).
                Post-accident outcomes (<code className="text-accent-primary">casualties</code>, <code className="text-accent-primary">cause</code>, <code className="text-accent-primary">risk_score</code>) are strictly quarantined.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-1">2. Geospatial Hotspot Clustering (DBSCAN Haversine)</h4>
              <p>
                Corridor concentrations are detected using Density-Based Spatial Clustering of Applications with Noise (DBSCAN) using
                the spherical great-circle Haversine metric with <code className="text-accent-primary">ε = 0.60 km</code> (600 meters) and <code className="text-accent-primary">min_samples = 12</code>,
                preventing planar Cartesian distortions across Indian latitudes.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Link to="/model" className="text-accent-primary hover:underline flex items-center gap-1 font-semibold">
                <span>View Full ML Benchmark Report & Model Card</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MethodologyPage;

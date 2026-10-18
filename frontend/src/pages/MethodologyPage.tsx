import React from 'react';
import {
  BookOpen,
  ShieldCheck,
  BrainCircuit,
  MapPin,
  Clock,
  Layers,
  Lock,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { AlertBanner } from '../components/common/AlertBanner';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="border-b border-border-dark pb-4">
        <h1 className="text-xl font-bold text-text-main flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent-primary" />
          Scientific Methodology, Technical Architecture & Governance
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Peer-defensible machine learning, spatial clustering principles, and ethical risk boundaries
        </p>
      </div>

      {/* Ethical & Governance Warning */}
      <AlertBanner type="warning" title="Institutional Disclaimer & Responsible AI Boundaries">
        AccidentVision AI is an exploratory decision-support and geospatial risk intelligence platform.
        It does not claim to prevent accidents, establish legal fault, or predict individual collisions with certainty.
        Traffic accident occurrences and physical collision injuries are governed by complex microscopic variables
        (e.g., instantaneous vehicle velocities, braking reaction times, and seatbelt usage) that cannot be fully captured
        by environmental macros.
      </AlertBanner>

      {/* Section 1: Chronological Temporal Split */}
      <div className="bg-bg-card border border-border-dark rounded-lg p-6 shadow-card-dark space-y-3">
        <div className="flex items-center space-x-2 text-accent-primary">
          <Clock className="w-4 h-4" />
          <h2 className="text-sm font-semibold text-text-main">1. Zero-Leakage Chronological Partitioning</h2>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Standard random k-fold cross-validation is fundamentally flawed for spatio-temporal accident datasets because future accidents
          leak information into the past. AccidentVision AI strictly enforces a chronological progression split:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs my-3">
          <div className="p-3 rounded bg-bg-surface border border-border-dark">
            <span className="text-accent-primary font-bold block mb-1">TRAINING PARTITION</span>
            <span className="text-text-main block">2022-01-01 to 2023-12-31</span>
            <span className="text-text-subtle text-[11px] block mt-1">12,000 crashes (60%)</span>
          </div>

          <div className="p-3 rounded bg-bg-surface border border-border-dark">
            <span className="text-accent-warning font-bold block mb-1">VALIDATION BENCHMARK</span>
            <span className="text-text-main block">2024-01-01 to 2024-12-31</span>
            <span className="text-text-subtle text-[11px] block mt-1">4,000 crashes (20%)</span>
          </div>

          <div className="p-3 rounded bg-bg-surface border border-border-dark">
            <span className="text-accent-success font-bold block mb-1">UNSEEN HOLDOUT</span>
            <span className="text-text-main block">2025-01-01 to 2025-04-15</span>
            <span className="text-text-subtle text-[11px] block mt-1">4,000 crashes (20%)</span>
          </div>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          All preprocessing scalers, encoders, and iterative imputers are fitted solely on the training partition and evaluated out-of-time.
        </p>
      </div>

      {/* Section 2: Spatial Hotspot Clustering Formulation */}
      <div className="bg-bg-card border border-border-dark rounded-lg p-6 shadow-card-dark space-y-3">
        <div className="flex items-center space-x-2 text-accent-secondary">
          <MapPin className="w-4 h-4" />
          <h2 className="text-sm font-semibold text-text-main">2. Geospatial Hotspot Extraction (DBSCAN Haversine)</h2>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Accident concentrations are detected using Density-Based Spatial Clustering of Applications with Noise (DBSCAN) using
          great-circle spherical distance (Haversine formula) to prevent planar projection distortions across India's latitudes:
        </p>

        <div className="p-3 rounded bg-bg-surface border border-border-dark font-mono text-xs text-accent-primary text-center">
          d = 2R · arcsin(√(sin²(Δφ/2) + cos(φ₁)cos(φ₂)sin²(Δλ/2)))
        </div>

        <div className="space-y-2 text-xs text-text-muted leading-relaxed">
          <div>
            <strong className="text-text-main">Spatial Neighborhood Threshold (ε):</strong> Set to 0.60 km (600 meters), matching typical urban traffic corridor spans.
          </div>
          <div>
            <strong className="text-text-main">Minimum Cluster Core Samples (min_samples):</strong> Set to 12 incidents, filtering out isolated noise points.
          </div>
        </div>
      </div>

      {/* Section 3: Feature Engineering & Target Leakage Prevention */}
      <div className="bg-bg-card border border-border-dark rounded-lg p-6 shadow-card-dark space-y-3">
        <div className="flex items-center space-x-2 text-accent-critical">
          <Lock className="w-4 h-4" />
          <h2 className="text-sm font-semibold text-text-main">3. Cyclical Transforms & Target Leakage Prevention</h2>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Temporal features possess periodic continuity (hour 23 is immediately adjacent to hour 0). Linear scalar representations break this geometry.
          We implement sinusoidal coordinate projections:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs my-2">
          <div className="p-2.5 rounded bg-bg-surface border border-border-dark text-center">
            hour_sin = sin(2π · hour / 24)<br />
            hour_cos = cos(2π · hour / 24)
          </div>
          <div className="p-2.5 rounded bg-bg-surface border border-border-dark text-center">
            month_sin = sin(2π · month / 12)<br />
            month_cos = cos(2π · month / 12)
          </div>
        </div>

        <div className="mt-3 p-3 rounded bg-accent-critical/10 border border-accent-critical/30 text-xs leading-relaxed text-amber-200">
          <strong>Permanent Feature Quarantine:</strong> The dataset fields <code className="text-text-main">casualties</code>,{' '}
          <code className="text-text-main">cause</code>, and <code className="text-text-main">risk_score</code> represent ex-post
          consequences. Incorporating them into severity prediction creates fatal data leakage, yielding artificially inflated test accuracy that collapses in production.
        </div>
      </div>

      {/* Section 4: Model Evaluation Metrics Philosophy */}
      <div className="bg-bg-card border border-border-dark rounded-lg p-6 shadow-card-dark space-y-3">
        <div className="flex items-center space-x-2 text-accent-success">
          <Scale className="w-4 h-4" />
          <h2 className="text-sm font-semibold text-text-main">4. Balanced Accuracy vs Deceptive Raw Accuracy</h2>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Due to class imbalance (Minor: ~52%, Severe: ~35%, Fatal: ~13%), a naive trivial classifier that always predicts "Minor" would achieve
          ~52% raw accuracy despite having 0% fatal sensitivity.
        </p>
        <p className="text-xs text-text-muted leading-relaxed">
          We prioritize <strong>Balanced Accuracy</strong> (unweighted macro mean of class recalls) and <strong>Fatal Recall</strong> as primary evaluation criteria.
          Our zero-leakage Extra Trees pipeline delivers <strong>32.6% Balanced Accuracy</strong> and <strong>10.7% Fatal Recall</strong> on the 2024 out-of-time validation benchmark.
        </p>
      </div>
    </div>
  );
};

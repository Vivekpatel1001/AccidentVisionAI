export interface MorthCityStats {
  city: string;
  accidents_2024: number;
  killed_2024: number;
  injured_2024: number;
  fatal_pct: number;
  top_fatal_mode: string;
  top_violation: string;
  ranking_accidents?: number | null;
  ranking_killed?: number | null;
  mode_breakdown?: Record<string, number>;
  violation_breakdown?: Record<string, number>;
  source?: string;
}

export interface MorthCityItem {
  city: string;
  accidents_2024: number;
  killed_2024: number;
  injured_2024: number;
  fatal_pct: number;
  ranking_accidents?: number | null;
  ranking_killed?: number | null;
  top_fatal_mode?: string;
  top_violation?: string;
}

export interface MorthStateItem {
  'Sl No'?: string;
  State: string;
  '2020 Accidents'?: string | number;
  '2021 Accidents'?: string | number;
  '2022 Accidents'?: string | number;
  '2023 Accidents'?: string | number;
  '2024 Accidents'?: string | number;
  'Change from 2023 to 2024'?: string | number;
  '% change from 2023 to 2024'?: number | null;
  '2024 Ranking'?: number | null;
  '2020 Killed'?: string | number;
  '2021 Killed'?: string | number;
  '2022 Killed'?: string | number;
  '2023 Killed'?: string | number;
  '2024 Killed'?: string | number;
  '2024 Ranking_fatal'?: number | null;
}

export interface MorthCollisionItem {
  collision_type: string;
  accidents_2024: number;
  killed_2024: number;
  injured_2024: number;
  fatal_pct: number;
  change_accidents_pct?: number | null;
  change_killed_pct?: number | null;
}

export interface MorthNationalSummary {
  source: string;
  report_year: number;
  national_accidents: number;
  national_fatalities: number;
  national_injured: number;
  fatal_severity_rate: number;
  million_plus_cities_total_accidents: number;
  million_plus_cities_total_fatalities: number;
  primary_violation_national: string;
  highest_risk_vehicle: string;
  pedestrian_share_fatalities: number;
  highest_accident_state: string;
  highest_fatality_state: string;
}

export interface OverviewStats {
  total_records: number;
  fatal_count: number;
  fatal_pct: number;
  severe_count: number;
  minor_count: number;
  cities_count: number;
  date_range_start: string;
  date_range_end: string;
  osm_enrichment_pct: number;
  safest_window?: string;
  peak_window?: string;
  peak_hour?: number;
  safest_hour?: number;
  model_validation_accuracy: number;
  model_balanced_accuracy: number;
  model_fatal_recall: number;
  city_distribution: { city: string; count: number; fatal: number; fatal_rate: number }[];
  severity_distribution: { severity: string; count: number; percentage: number }[];
  key_insights: {
    title: string;
    description: string;
    type: 'warning' | 'info' | 'critical' | 'success';
  }[];
  morth_official?: MorthCityStats | null;
  kpis?: Record<string, any>;
}

export interface AccidentGeoPoint {
  accident_id: string | number;
  city: string;
  state?: string;
  latitude: number;
  longitude: number;
  accident_severity: 'Fatal' | 'Severe' | 'Minor' | string;
  road_type: string;
  weather: string;
  traffic_density: string;
  hour: number;
  date: string;
  time?: string;
  day_of_week?: string;
  lanes?: number;
  traffic_signal?: number | boolean;
  visibility?: string | number;
  temperature?: number;
  cause?: string;
  vehicles_involved?: number;
  casualties?: number;
  osm_highway?: string;
  risk_score?: number;
}

export interface HotspotItem {
  cluster_id: number;
  city: string;
  size: number;
  centroid_lat: number;
  centroid_lon: number;
  dominant_road: string;
  dominant_weather: string;
  fatal_count: number;
  fatal_ratio: number;
  radius_m: number;
  density_per_sqkm: number;
}

export interface HotspotsResponse {
  total_clusters: number;
  clustered_accidents_count: number;
  noise_accidents_count: number;
  clustering_parameters: {
    eps_meters: number;
    min_samples: number;
    metric: string;
  };
  hotspots: HotspotItem[];
}

export interface TemporalAnalyticsResponse {
  diurnal_hourly: { hour: number; total: number; fatal: number; severe: number; minor: number }[];
  day_of_week: { day: string; day_num: number; total: number; fatal: number }[];
  monthly_trend: { month_year: string; total: number; fatal: number }[];
  weekend_vs_weekday: {
    category: string;
    total: number;
    fatal: number;
    fatal_rate: number;
    avg_per_day: number;
  }[];
  peak_vs_offpeak: {
    category: string;
    total: number;
    fatal_rate: number;
  }[];
}

export interface SeverityAnalyticsResponse {
  road_type_distribution: {
    road_type: string;
    total: number;
    fatal: number;
    severe: number;
    minor: number;
    fatal_rate: number;
  }[];
  weather_impact: {
    weather: string;
    total: number;
    fatal: number;
    fatal_rate: number;
  }[];
  traffic_density_impact: {
    density: string;
    total: number;
    fatal: number;
    fatal_rate: number;
  }[];
  traffic_signal_impact: {
    has_signal: boolean;
    total: number;
    fatal: number;
    fatal_rate: number;
  }[];
  lighting_time_impact: {
    time_window: string;
    total: number;
    fatal: number;
    fatal_rate: number;
  }[];
}

export interface CandidateModel {
  name: string;
  accuracy: number;
  balanced_accuracy: number;
  macro_f1: number;
  fatal_recall: number;
  fatal_f1: number;
  training_time_sec: number;
}

export interface ModelMetadataResponse {
  model_name: string;
  pipeline_version: string;
  algorithm: string;
  pre_accident_features_used: string[];
  quarantined_leakage_features: string[];
  train_split: string;
  val_split: string;
  holdout_split: string;
  target_classes: string[];
  class_weights: string;
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][]; // [actual][predicted]
  normalized: number[][];
}

export interface ModelEvaluationResponse {
  validation_2024: {
    accuracy: number;
    balanced_accuracy: number;
    macro_precision: number;
    macro_recall: number;
    macro_f1: number;
    per_class: {
      [cls: string]: {
        precision: number;
        recall: number;
        f1_score: number;
        support: number;
      };
    };
    confusion_matrix: ConfusionMatrixData;
  };
  holdout_2025: {
    accuracy: number;
    balanced_accuracy: number;
    macro_f1: number;
    fatal_recall: number;
  };
  candidates_benchmark: CandidateModel[];
  loco_spatial_cv: {
    city: string;
    val_accuracy: number;
    val_balanced_acc: number;
    val_macro_f1: number;
    val_fatal_recall: number;
  }[];
  scientific_audit: {
    leakage_quarantined: boolean;
    fatal_recall_warning: string;
    recommendation: string;
  };
}

export interface PredictRequest {
  city: string;
  road_type: string;
  lanes: number;
  traffic_signal: boolean;
  weather: string;
  visibility: number;
  temperature: number;
  traffic_density: string;
  hour: number;
  day_of_week: string;
  is_weekend: boolean;
  is_peak_hour: boolean;
  festival: string;
  osm_highway?: string;
  osm_road_length_m?: number;
  distance_to_road_m?: number;
  vehicle_type?: string;
  source?: string;
  destination?: string;
  is_divided_carriageway?: boolean;
  cruising_speed_kmh?: number;
}

export interface CorridorHazardInfo {
  is_high_hazard: boolean;
  hazard_probability: number;
  hazard_tier: string;
  population_density_per_sqkm: number;
  design_speed_kmh: number;
  kinetic_energy_index: number;
}

export interface PredictResponse {
  predicted_severity: 'Fatal' | 'Severe' | 'Minor';
  confidence: number;
  probabilities: {
    Minor: number;
    Severe: number;
    Fatal: number;
  };
  corridor_hazard?: CorridorHazardInfo;
  model_accuracy?: string;
  pre_accident_features_verified: boolean;
  warning?: string;
  explanation: string;
}

export interface DataQualityResponse {
  total_records: number;
  columns_count: number;
  duplicate_rows: number;
  duplicate_ids: number;
  invalid_coordinates_count: number;
  columns_missingness: {
    column: string;
    missing_count: number;
    missing_pct: number;
    data_type: string;
    category: 'accident_attr' | 'osm_road' | 'leakage';
  }[];
  osm_enrichment_summary: {
    osm_highway_populated: number;
    osm_highway_pct: number;
    distance_populated: number;
    distance_pct: number;
    mumbai_unmatched_records: number;
    cause_of_unmatched: string;
  };
  quarantined_leakage_audit: {
    feature: string;
    correlation_with_severity: string;
    reason_for_quarantine: string;
  }[];
  data_provenance: {
    source: string;
    source_url: string;
    authenticity_status: string;
    recommendation: string;
  };
}

export interface AccidentRecord {
  accident_id: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  hour: number;
  day_of_week: string;
  is_weekend: boolean;
  road_type: string;
  lanes: number;
  traffic_signal: boolean;
  weather: string;
  visibility: number;
  temperature: number;
  traffic_density: string;
  cause: string;
  accident_severity: string;
  vehicles_involved: number;
  casualties: number;
  is_peak_hour: boolean;
  festival: string;
  risk_score: number;
  osm_highway: string | null;
  osm_road_length_m: number | null;
  distance_to_road_m: number | null;
  road_match_quality: string | null;
}

export interface AccidentListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  records: AccidentRecord[];
}

export interface MetadataResponse {
  cities: string[];
  severities: string[];
  road_types: string[];
  weather_conditions: string[];
  traffic_densities: string[];
  osm_highway_types: string[];
}

export interface RouteAnalysisRequest {
  source: string;
  destination: string;
  departure_date?: string;
  departure_time?: string;
  roadway_preference?: string;
  vehicle_type?: string;
}

export interface RouteSegmentHazard {
  segment_id: number;
  segment_name: string;
  latitude: number;
  longitude: number;
  hazard_score: number;
  category: 'Low' | 'Moderate' | 'High' | 'Very High';
  historical_crashes_2km: number;
  density_per_sqkm: number;
  length_km: number;
  traversal_hour: number;
  contributing_factors: {
    spatial_density_score: number;
    infrastructure_vulnerability: number;
    temporal_risk_factor: number;
    weather_risk_factor: number;
  };
}

export interface RouteAnalysisResponse {
  journey_summary: {
    source: string;
    destination: string;
    departure_date: string;
    departure_time: string;
    total_distance_km: number;
    estimated_duration_hours: number;
    vehicle_category: string;
  };
  risk_evaluation: {
    overall_relative_risk: number;
    risk_category: 'Low' | 'Moderate' | 'High' | 'Very High';
    metric_type: string;
    highest_risk_segments: RouteSegmentHazard[];
  };
  severity_prediction: {
    conditional_target: string;
    predicted_severity: string;
    probabilities: {
      Minor: number;
      Severe: number;
      Fatal: number;
    };
    model_version: string;
    model_architecture: string;
  };
  weather_intelligence: {
    route_weather_summary: {
      segment: string;
      expected_hour: string;
      weather: string;
      temperature_c: number;
      precipitation_mm: number;
      source: string;
    }[];
    coverage_verified: boolean;
  };
  safety_recommendations: string[];
  data_transparency_and_limitations: {
    coverage_warning: string;
    disclaimer: string;
  };
}

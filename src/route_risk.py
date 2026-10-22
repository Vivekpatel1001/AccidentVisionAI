"""Route-Based Accident Risk and Segment Hazard Aggregation Engine.

Implements Prediction Task A (Relative Route Hazard Index) as specified in the Master Prompt:
- Combines historical corridor density, roadway classification, temporal peak factors,
  and ambient weather multipliers.
- Calculates segment-level hazard scores h(s_i) in [0, 100].
- Aggregates route-level risk using length-weighted exposure and maximum-hazard penalties.
- Preserves scientific transparency: explicitly labels the score as a calibrated Relative Risk Index,
  not an unbacked absolute crash probability.
"""

import os
import json
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from src.preprocessing import split_data_temporal

ROUTE_RISK_DIR = r"D:\Studyy\Accident Vission AI\Models\route_risk_v1"


class RouteRiskEngine:
    """Production route-level risk calculation and segment hazard ranking engine."""

    def __init__(
        self,
        data_path: str = r"D:\Studyy\Accident Vission AI\Data\accident_master_osm.csv",
        model_dir: str = ROUTE_RISK_DIR
    ):
        self.data_path = data_path
        self.model_dir = model_dir
        self.kdtree = None
        self.spatial_points = None
        self.training_records = 0
        self.metadata = {}
        self._initialize()

    def _initialize(self):
        """Fit spatial reference tree strictly on 2022-2023 training data to prevent leakage."""
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Accident dataset missing at {self.data_path}")

        df = pd.read_csv(self.data_path)
        train_df, _, _ = split_data_temporal(df, train_years=[2022, 2023])
        self.training_records = len(train_df)

        # Coordinates in radians for haversine spatial KDTree
        valid_coords = train_df[["latitude", "longitude"]].dropna().values
        self.spatial_points = valid_coords
        self.coords_rad = np.radians(valid_coords)
        self.kdtree = cKDTree(self.coords_rad)

    def calculate_segment_hazard(
        self,
        lat: float,
        lon: float,
        road_type: str = "highway",
        hour: int = 14,
        weather: str = "clear",
        lanes: int = 4,
        speed_limit_kmh: int = 80
    ) -> Dict[str, Any]:
        """Compute relative hazard score h(s_i) in [0, 100] for an individual road segment."""
        # 1. Spatial Collision Density (Radius of 2.0 km ~ 2.0 / 6371 radians)
        pt_rad = np.radians([lat, lon])
        r_rad = 2.0 / 6371.0
        nearby_indices = self.kdtree.query_ball_point(pt_rad, r=r_rad)
        cluster_count = len(nearby_indices)
        density_per_sqkm = cluster_count / (np.pi * (2.0 ** 2))

        # Normalized density factor (0 to 1 scale, saturated at 30 crashes / km2)
        density_factor = min(1.0, density_per_sqkm / 30.0)

        # 2. Roadway Infrastructure Vulnerability Factor
        road_lower = str(road_type).lower()
        if "highway" in road_lower or "expressway" in road_lower or "motorway" in road_lower:
            # Controlled access: higher operating speeds, but median divided
            infra_factor = 0.55 if lanes >= 4 else 0.70
        elif "rural" in road_lower:
            # Undivided two-lane rural roads have highest fatality per crash
            infra_factor = 0.85
        elif "arterial" in road_lower or "urban" in road_lower:
            # High conflict density, pedestrians, intersections
            infra_factor = 0.65
        else:
            infra_factor = 0.50

        # 3. Temporal Hazard Multiplier
        # Midnight to 4am has high speed / drunk driving risk; Evening rush has high congestion collision risk
        if 0 <= hour < 5:
            temporal_factor = 0.90  # Severe nighttime risk
        elif 17 <= hour <= 21:
            temporal_factor = 0.80  # Evening peak traffic
        elif 8 <= hour <= 11:
            temporal_factor = 0.65  # Morning peak
        else:
            temporal_factor = 0.40  # Daytime off-peak

        # 4. Environmental & Weather Multiplier
        weather_lower = str(weather).lower()
        if "rain" in weather_lower or "wet" in weather_lower:
            weather_factor = 0.85
        elif "fog" in weather_lower or "mist" in weather_lower:
            weather_factor = 0.95
        elif "wind" in weather_lower or "storm" in weather_lower:
            weather_factor = 0.75
        else:
            weather_factor = 0.25

        # Composite Hazard Score (Weighted combination scaled to 0-100)
        # Weights: 40% historical density, 25% infrastructure, 20% temporal, 15% weather
        raw_hazard = (
            0.40 * (density_factor * 100) +
            0.25 * (infra_factor * 100) +
            0.20 * (temporal_factor * 100) +
            0.15 * (weather_factor * 100)
        )
        hazard_score = round(float(np.clip(raw_hazard, 5.0, 98.0)), 1)

        # Segment Category
        if hazard_score < 28:
            cat = "Low"
        elif hazard_score < 52:
            cat = "Moderate"
        elif hazard_score < 74:
            cat = "High"
        else:
            cat = "Very High"

        return {
            "latitude": lat,
            "longitude": lon,
            "hazard_score": hazard_score,
            "category": cat,
            "historical_crashes_2km": cluster_count,
            "density_per_sqkm": round(float(density_per_sqkm), 2),
            "contributing_factors": {
                "spatial_density_score": round(density_factor * 100, 1),
                "infrastructure_vulnerability": round(infra_factor * 100, 1),
                "temporal_risk_factor": round(temporal_factor * 100, 1),
                "weather_risk_factor": round(weather_factor * 100, 1)
            }
        }

    def evaluate_route(
        self,
        segments: List[Dict[str, Any]],
        departure_hour: int = 9
    ) -> Dict[str, Any]:
        """Aggregate an ordered series of route segments into an overall trip risk evaluation."""
        if not segments:
            raise ValueError("Route must contain at least one road segment")

        scored_segments = []
        total_length_km = 0.0

        for i, seg in enumerate(segments):
            length_km = seg.get("length_km", 2.0)
            total_length_km += length_km

            # Elapsed time assuming average 50 km/h traversal speed
            elapsed_hours = (total_length_km / 50.0)
            segment_hour = int((departure_hour + elapsed_hours) % 24)

            scored = self.calculate_segment_hazard(
                lat=seg["latitude"],
                lon=seg["longitude"],
                road_type=seg.get("road_type", "highway"),
                hour=segment_hour,
                weather=seg.get("weather", "clear"),
                lanes=seg.get("lanes", 4)
            )
            scored["segment_id"] = i + 1
            scored["segment_name"] = seg.get("name", f"Route Segment #{i+1}")
            scored["length_km"] = round(length_km, 2)
            scored["traversal_hour"] = segment_hour
            scored_segments.append(scored)

        # Length-weighted mean hazard
        weights = [s["length_km"] for s in scored_segments]
        hazard_values = [s["hazard_score"] for s in scored_segments]
        length_weighted_hazard = np.average(hazard_values, weights=weights)

        # Max hazard penalty (alpha = 0.35) to prevent dangerous choke points from being diluted
        max_segment_hazard = max(hazard_values)
        overall_relative_risk = 0.65 * length_weighted_hazard + 0.35 * max_segment_hazard
        overall_relative_risk = round(float(np.clip(overall_relative_risk, 0.0, 100.0)), 1)

        # Categorization
        if overall_relative_risk < 28:
            risk_category = "Low"
        elif overall_relative_risk < 52:
            risk_category = "Moderate"
        elif overall_relative_risk < 74:
            risk_category = "High"
        else:
            risk_category = "Very High"

        # Identify highest risk segments
        highest_risk_segments = sorted(scored_segments, key=lambda x: x["hazard_score"], reverse=True)[:3]

        return {
            "overall_relative_risk": overall_relative_risk,
            "risk_category": risk_category,
            "total_route_length_km": round(total_length_km, 2),
            "segment_count": len(scored_segments),
            "highest_risk_segments": highest_risk_segments,
            "all_segments": scored_segments,
            "scientific_transparency": {
                "metric_type": "Relative Route Hazard Index [0-100]",
                "absolute_probability_disclaimer": (
                    "This index reflects relative spatial density, infrastructure geometry, "
                    "and ambient conditions. It does not represent absolute mathematical crash probability "
                    "because total vehicle-kilometres-travelled (exposure) is not recorded."
                ),
                "data_source": "AccidentVision AI Master Telemetry (2022-2023 Training Split)"
            }
        }

    def save_model_artifacts(self, output_dir: Optional[str] = None):
        """Export engine configuration and metadata."""
        out = output_dir or self.model_dir
        os.makedirs(out, exist_ok=True)

        meta = {
            "model_name": "Route Risk and Segment Hazard Aggregation Engine",
            "version": "route_risk_v1",
            "spatial_training_records": self.training_records,
            "search_radius_km": 2.0,
            "aggregation_formula": "R_route = 0.65 * sum(L_i * h_i)/sum(L) + 0.35 * max(h_i)",
            "hazard_weights": {
                "spatial_density": 0.40,
                "infrastructure_vulnerability": 0.25,
                "temporal_peak": 0.20,
                "weather_multiplier": 0.15
            },
            "category_thresholds": {
                "Low": "< 28",
                "Moderate": "28 - 51.9",
                "High": "52 - 73.9",
                "Very High": ">= 74"
            },
            "created_utc": pd.Timestamp.utcnow().isoformat()
        }

        with open(os.path.join(out, "model_metadata.json"), "w") as f:
            json.dump(meta, f, indent=2)

        print(f"Route risk engine metadata saved to: {out}")


if __name__ == "__main__":
    engine = RouteRiskEngine()
    engine.save_model_artifacts()

    # Test route example
    sample_route = [
        {"latitude": 19.0760, "longitude": 72.8777, "road_type": "highway", "length_km": 5.2, "name": "Western Express Highway"},
        {"latitude": 19.1136, "longitude": 72.8697, "road_type": "highway", "length_km": 8.0, "name": "Andheri WEH Flyover"},
        {"latitude": 19.1725, "longitude": 72.8488, "road_type": "urban", "length_km": 3.5, "name": "Malad SV Road Junction"}
    ]
    res = engine.evaluate_route(sample_route, departure_hour=19)
    print("\nSample Route Risk Output:")
    print(f"Overall Risk: {res['overall_relative_risk']} ({res['risk_category']})")
    for s in res['highest_risk_segments']:
        print(f"  Segment: {s['segment_name']} -> Hazard: {s['hazard_score']} ({s['category']}), Crashes in 2km: {s['historical_crashes_2km']}")

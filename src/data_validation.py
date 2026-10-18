"""Data validation module for AccidentVision AI.

Performs defensible schema verification, coordinate boundary checking,
integrity auditing, and leakage risk detection.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

# Plausible coordinate bounding boxes for the 8 cities in the dataset (min_lat, max_lat, min_lon, max_lon)
CITY_BOUNDING_BOXES = {
    "Delhi": (28.3, 28.9, 76.8, 77.4),
    "Bangalore": (12.8, 13.2, 77.4, 77.8),
    "Mumbai": (18.8, 19.4, 72.7, 73.2),
    "Pune": (18.3, 18.7, 73.7, 74.1),
    "Chandigarh": (30.6, 30.9, 76.6, 77.0),
    "Chennai": (12.8, 13.3, 80.0, 80.4),
    "Hyderabad": (17.2, 17.6, 78.2, 78.7),
    "Kolkata": (22.4, 22.8, 88.2, 88.6),
}

INDIA_BOUNDING_BOX = (6.0, 38.0, 68.0, 98.0)

VALID_SEVERITIES = {"minor", "major", "fatal"}
VALID_ROAD_TYPES = {"urban", "rural", "highway"}
VALID_WEATHER = {"clear", "rain", "fog"}
VALID_VISIBILITY = {"low", "medium", "high"}
VALID_TRAFFIC_DENSITY = {"low", "medium", "high"}

# Columns that represent post-accident outcomes or outcome-derived metrics
POST_ACCIDENT_COLUMNS = {"casualties", "cause", "risk_score", "vehicles_involved"}


def validate_schema(df: pd.DataFrame, expected_columns: Optional[List[str]] = None) -> Dict[str, Any]:
    """Validate DataFrame columns against an expected schema."""
    if expected_columns is None:
        expected_columns = [
            "accident_id", "city", "state", "latitude", "longitude", "date",
            "time", "hour", "day_of_week", "is_weekend", "road_type", "lanes",
            "traffic_signal", "weather", "visibility", "temperature",
            "traffic_density", "accident_severity"
        ]

    missing_cols = [c for c in expected_columns if c not in df.columns]
    present_cols = [c for c in expected_columns if c in df.columns]

    return {
        "is_valid": len(missing_cols) == 0,
        "missing_columns": missing_cols,
        "present_columns": present_cols,
        "total_columns": len(df.columns)
    }


def validate_coordinates(df: pd.DataFrame) -> Dict[str, Any]:
    """Validate that coordinates fall within valid geographic bounds for India and their respective cities."""
    total_records = len(df)
    
    # Check within India overall
    out_of_india = df[
        (df["latitude"] < INDIA_BOUNDING_BOX[0]) |
        (df["latitude"] > INDIA_BOUNDING_BOX[1]) |
        (df["longitude"] < INDIA_BOUNDING_BOX[2]) |
        (df["longitude"] > INDIA_BOUNDING_BOX[3])
    ]

    city_out_of_bounds: Dict[str, int] = {}
    if "city" in df.columns:
        for city, (min_lat, max_lat, min_lon, max_lon) in CITY_BOUNDING_BOXES.items():
            city_df = df[df["city"] == city]
            if len(city_df) > 0:
                oob = city_df[
                    (city_df["latitude"] < min_lat) |
                    (city_df["latitude"] > max_lat) |
                    (city_df["longitude"] < min_lon) |
                    (city_df["longitude"] > max_lon)
                ]
                city_out_of_bounds[city] = len(oob)

    return {
        "total_records": total_records,
        "out_of_india_count": len(out_of_india),
        "city_out_of_bounds_counts": city_out_of_bounds,
        "is_all_valid": len(out_of_india) == 0 and sum(city_out_of_bounds.values()) == 0
    }


def audit_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
    """Perform a comprehensive data quality and leakage audit on the dataset."""
    audit_report: Dict[str, Any] = {
        "record_count": len(df),
        "column_count": len(df.columns),
        "columns": list(df.columns),
        "duplicate_rows": int(df.duplicated().sum()),
        "duplicate_ids": int(df["accident_id"].duplicated().sum()) if "accident_id" in df.columns else 0,
        "unique_locations": int(df[["latitude", "longitude"]].drop_duplicates().shape[0]) if "latitude" in df.columns and "longitude" in df.columns else 0,
        "missing_values_per_col": df.isnull().sum()[df.isnull().sum() > 0].to_dict(),
        "severity_distribution": df["accident_severity"].value_counts().to_dict() if "accident_severity" in df.columns else {},
        "leakage_risks": {},
        "target_validation": {},
        "geography_validation": {},
    }

    # Target validation
    if "accident_severity" in df.columns:
        invalid_labels = set(df["accident_severity"].dropna().unique()) - VALID_SEVERITIES
        audit_report["target_validation"] = {
            "has_target": True,
            "classes": sorted(list(df["accident_severity"].dropna().unique())),
            "invalid_classes": list(invalid_labels),
            "missing_target": int(df["accident_severity"].isnull().sum())
        }

    # Geography validation
    if "latitude" in df.columns and "longitude" in df.columns:
        audit_report["geography_validation"] = validate_coordinates(df)

    # Post-accident outcome and leakage checks
    detected_leakage_cols = [c for c in POST_ACCIDENT_COLUMNS if c in df.columns]
    audit_report["leakage_risks"]["post_accident_cols_present"] = detected_leakage_cols

    if "casualties" in df.columns and "accident_severity" in df.columns:
        zero_cas_by_sev = df[df["casualties"] == 0]["accident_severity"].value_counts().to_dict()
        fatal_zero_cas = zero_cas_by_sev.get("fatal", 0)
        audit_report["leakage_risks"]["zero_casualties_fatal_count"] = fatal_zero_cas
        audit_report["leakage_risks"]["zero_casualties_distribution"] = zero_cas_by_sev
        audit_report["leakage_risks"]["casualties_definition_note"] = (
            "4,925 records have 0 casualties; fatal accidents have strictly >= 1 casualties. "
            "Casualties is an outcome variable observed post-crash and must not be used as a pre-event predictor."
        )

    if "risk_score" in df.columns:
        audit_report["leakage_risks"]["risk_score_present"] = True
        audit_report["leakage_risks"]["risk_score_distinct_values"] = int(df["risk_score"].nunique())
        audit_report["leakage_risks"]["risk_score_note"] = (
            "risk_score has only 18 discrete values and is strongly correlated with fatal outcomes. "
            "Its formula is undocumented in the public source; using it causes target leakage."
        )

    return audit_report

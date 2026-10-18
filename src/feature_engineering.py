"""Feature engineering module for AccidentVision AI.

Generates cyclical temporal features, log transforms, and defensible
pre-accident environmental indicators without data leakage.
"""

from typing import Tuple, List, Optional
import numpy as np
import pandas as pd


DAY_NAME_TO_INT = {
    "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
    "Friday": 4, "Saturday": 5, "Sunday": 6
}


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Engineer defensible pre-accident features from existing columns."""
    df_out = df.copy()

    # Ensure date parsing
    if "date" in df_out.columns:
        if not pd.api.types.is_datetime64_any_dtype(df_out["date"]):
            df_out["date"] = pd.to_datetime(df_out["date"])
        df_out["month"] = df_out["date"].dt.month
    elif "month" not in df_out.columns:
        df_out["month"] = 1

    # Cyclical hour encoding (24-hour cycle)
    if "hour" in df_out.columns:
        df_out["hour_sin"] = np.sin(2 * np.pi * df_out["hour"] / 24.0)
        df_out["hour_cos"] = np.cos(2 * np.pi * df_out["hour"] / 24.0)
        df_out["is_night"] = ((df_out["hour"] < 6) | (df_out["hour"] >= 20)).astype(int)
    else:
        df_out["hour_sin"] = 0.0
        df_out["hour_cos"] = 0.0
        df_out["is_night"] = 0

    # Cyclical month encoding (12-month cycle)
    df_out["month_sin"] = np.sin(2 * np.pi * df_out["month"] / 12.0)
    df_out["month_cos"] = np.cos(2 * np.pi * df_out["month"] / 12.0)

    # Cyclical day of week encoding (7-day cycle)
    if "day_of_week" in df_out.columns:
        dow_num = df_out["day_of_week"].map(DAY_NAME_TO_INT).fillna(0)
        df_out["dow_sin"] = np.sin(2 * np.pi * dow_num / 7.0)
        df_out["dow_cos"] = np.cos(2 * np.pi * dow_num / 7.0)

    # Log-transformed road geometry
    if "osm_road_length_m" in df_out.columns:
        df_out["log_road_length_m"] = np.log1p(df_out["osm_road_length_m"].clip(lower=0))
    if "distance_to_road_m" in df_out.columns:
        df_out["log_distance_to_road_m"] = np.log1p(df_out["distance_to_road_m"].clip(lower=0))

    # Multi-lane indicator
    if "lanes" in df_out.columns:
        df_out["is_multi_lane"] = (df_out["lanes"] > 2).astype(int)

    # Adverse environmental condition indicator
    if "weather" in df_out.columns:
        df_out["is_adverse_weather"] = df_out["weather"].isin(["Rainy", "Foggy"]).astype(int)

    if "visibility" in df_out.columns:
        df_out["is_poor_visibility"] = df_out["visibility"].isin(["Poor", "Moderate"]).astype(int)

    return df_out


# Engineered feature sets
ENGINEERED_NUMERIC_FEATURES = [
    "latitude",
    "longitude",
    "hour",
    "hour_sin",
    "hour_cos",
    "month_sin",
    "month_cos",
    "dow_sin",
    "dow_cos",
    "is_night",
    "is_weekend",
    "lanes",
    "is_multi_lane",
    "traffic_signal",
    "temperature",
    "is_peak_hour",
    "is_adverse_weather",
    "is_poor_visibility",
    "osm_road_length_m",
    "log_road_length_m",
    "distance_to_road_m",
    "log_distance_to_road_m"
]

ENGINEERED_CATEGORICAL_FEATURES = [
    "city",
    "road_type",
    "day_of_week",
    "weather",
    "visibility",
    "traffic_density",
    "osm_highway",
    "road_match_quality"
]

ALL_ENGINEERED_FEATURES = ENGINEERED_NUMERIC_FEATURES + ENGINEERED_CATEGORICAL_FEATURES

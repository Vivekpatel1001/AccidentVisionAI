"""Automated unit and integration tests for Model Pipeline v2."""

import os
import pytest
import numpy as np
import pandas as pd
import joblib

from src.inference import SeverityPredictor
from src.preprocessing import split_data_temporal, TARGET_COLUMN

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "severity_v2", "model_pipeline.joblib")
META_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "severity_v2", "model_metadata.json")
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "Data", "accident_master_osm.csv")


def test_model_pipeline_file_exists():
    """Verify saved pipeline and metadata artifacts exist."""
    assert os.path.exists(MODEL_PATH), "model_pipeline.joblib must exist"
    assert os.path.exists(META_PATH), "model_metadata.json must exist"


def test_model_pipeline_loads_and_infers():
    """Verify saved pipeline loads and executes valid prediction."""
    predictor = SeverityPredictor(model_path=MODEL_PATH, metadata_path=META_PATH)
    sample = {
        "city": "Mumbai",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "hour": 18,
        "is_weekend": 0,
        "lanes": 4,
        "traffic_signal": 1,
        "temperature": 28.5,
        "is_peak_hour": 1,
        "road_type": "highway",
        "day_of_week": "Friday",
        "weather": "clear",
        "visibility": "high",
        "traffic_density": "high",
        "osm_highway": "primary",
        "osm_road_length_m": 1200.0,
        "distance_to_road_m": 8.5,
        "road_match_quality": "Good"
    }
    result = predictor.predict(sample)
    assert "predicted_severity" in result
    assert result["predicted_severity"] in ["Fatal", "Major", "Minor", "fatal", "major", "minor"]
    assert "probabilities" in result

    # Check probabilities sum to 1.0
    probs = result["probabilities"]
    prob_sum = sum(probs.values())
    assert abs(prob_sum - 1.0) < 1e-4, f"Probabilities must sum to 1.0, got {prob_sum}"


def test_model_reproducibility_on_fixed_sample():
    """Verify identical predictions are produced on repeat invocations."""
    predictor = SeverityPredictor(model_path=MODEL_PATH, metadata_path=META_PATH)
    sample = {
        "city": "Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "hour": 22,
        "is_weekend": 1,
        "lanes": 6,
        "traffic_signal": 0,
        "temperature": 18.0,
        "is_peak_hour": 0,
        "road_type": "urban",
        "day_of_week": "Saturday",
        "weather": "fog",
        "visibility": "low",
        "traffic_density": "low",
        "osm_highway": "secondary",
        "osm_road_length_m": 850.0,
        "distance_to_road_m": 12.0,
        "road_match_quality": "Good"
    }
    res1 = predictor.predict(sample)
    res2 = predictor.predict(sample)
    assert res1["predicted_severity"] == res2["predicted_severity"]
    for k in res1["probabilities"]:
        assert abs(res1["probabilities"][k] - res2["probabilities"][k]) < 1e-6


def test_leakage_rejection():
    """Verify passing post-accident features raises ValueError."""
    predictor = SeverityPredictor(model_path=MODEL_PATH, metadata_path=META_PATH)
    leakage_sample = {
        "city": "Mumbai",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "hour": 18,
        "is_weekend": 0,
        "lanes": 4,
        "traffic_signal": 1,
        "temperature": 28.5,
        "is_peak_hour": 1,
        "road_type": "highway",
        "day_of_week": "Friday",
        "weather": "clear",
        "visibility": "high",
        "traffic_density": "high",
        "casualties": 3  # LEAKAGE
    }
    with pytest.raises(ValueError, match="Post-accident.*leakage"):
        predictor.predict(leakage_sample)


def test_temporal_split_integrity():
    """Verify train, val, and holdout splits do not overlap."""
    df = pd.read_csv(DATA_PATH)
    train_df, val_df, holdout_df = split_data_temporal(df)
    train_ids = set(train_df["accident_id"])
    val_ids = set(val_df["accident_id"])
    holdout_ids = set(holdout_df["accident_id"])

    assert len(train_ids.intersection(val_ids)) == 0, "Train and Val must have 0 overlapping accident IDs"
    assert len(train_ids.intersection(holdout_ids)) == 0, "Train and Holdout must have 0 overlapping accident IDs"
    assert len(val_ids.intersection(holdout_ids)) == 0, "Val and Holdout must have 0 overlapping accident IDs"

"""Unit tests for inference module."""

import pytest
import pandas as pd
import numpy as np

from src.inference import SeverityPredictor


@pytest.fixture
def predictor():
    return SeverityPredictor()


def test_predictor_single_sample(predictor):
    sample = {
        "city": "Mumbai",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "hour": 14,
        "is_weekend": 0,
        "lanes": 3,
        "traffic_signal": 0,
        "temperature": 31.0,
        "is_peak_hour": 0,
        "road_type": "urban",
        "day_of_week": "Tuesday",
        "weather": "clear",
        "visibility": "high",
        "traffic_density": "medium",
        "osm_highway": "secondary",
        "osm_road_length_m": 500.0,
        "distance_to_road_m": 10.0,
        "road_match_quality": "High"
    }

    res = predictor.predict(sample)
    assert "predictions" in res
    assert "predicted_severity" in res["predictions"]
    assert res["predictions"]["predicted_severity"] in ["minor", "major", "fatal"]
    assert "probabilities" in res["predictions"]
    assert "disclaimer" in res


def test_predictor_rejects_leakage_columns(predictor):
    sample_with_leakage = {
        "city": "Chennai",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "casualties": 5,           # Post-accident outcome!
        "cause": "Mechanical Failure", # Post-accident investigation!
        "risk_score": 0.95         # Post-accident score!
    }

    prepared = predictor.validate_and_prepare_input(sample_with_leakage)
    assert "casualties" not in prepared.columns
    assert "cause" not in prepared.columns
    assert "risk_score" not in prepared.columns

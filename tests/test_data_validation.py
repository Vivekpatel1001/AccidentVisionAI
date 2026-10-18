"""Unit tests for data validation module."""

import pytest
import pandas as pd
import numpy as np

from src.data_validation import (
    validate_schema,
    validate_coordinates,
    audit_data_quality,
    CITY_BOUNDING_BOXES
)


def test_validate_schema_valid():
    df = pd.DataFrame({
        "accident_id": [1],
        "city": ["Delhi"],
        "state": ["Delhi"],
        "latitude": [28.6],
        "longitude": [77.2],
        "date": ["2024-01-01"],
        "time": ["12:00"],
        "hour": [12],
        "day_of_week": ["Monday"],
        "is_weekend": [0],
        "road_type": ["highway"],
        "lanes": [4],
        "traffic_signal": [1],
        "weather": ["clear"],
        "visibility": ["high"],
        "temperature": [25.0],
        "traffic_density": ["medium"],
        "accident_severity": ["minor"]
    })
    res = validate_schema(df)
    assert res["is_valid"] is True
    assert len(res["missing_columns"]) == 0


def test_validate_schema_missing():
    df = pd.DataFrame({"city": ["Delhi"]})
    res = validate_schema(df)
    assert res["is_valid"] is False
    assert "accident_severity" in res["missing_columns"]


def test_validate_coordinates():
    # Valid Delhi coordinates
    df_valid = pd.DataFrame({
        "city": ["Delhi", "Bangalore"],
        "latitude": [28.6139, 12.9716],
        "longitude": [77.2090, 77.5946]
    })
    res = validate_coordinates(df_valid)
    assert res["is_all_valid"] is True

    # Invalid coordinates (outside India / city)
    df_invalid = pd.DataFrame({
        "city": ["Delhi"],
        "latitude": [-50.0],
        "longitude": [150.0]
    })
    res_inv = validate_coordinates(df_invalid)
    assert res_inv["is_all_valid"] is False
    assert res_inv["out_of_india_count"] == 1


def test_audit_data_quality_detects_leakage():
    df = pd.DataFrame({
        "accident_id": [1, 2],
        "city": ["Delhi", "Mumbai"],
        "latitude": [28.6, 19.0],
        "longitude": [77.2, 72.8],
        "accident_severity": ["minor", "fatal"],
        "casualties": [0, 3],
        "risk_score": [0.4, 0.9],
        "cause": ["Speeding", "Drunk driving"]
    })
    audit = audit_data_quality(df)
    assert "casualties" in audit["leakage_risks"]["post_accident_cols_present"]
    assert "risk_score" in audit["leakage_risks"]["post_accident_cols_present"]
    assert audit["leakage_risks"]["zero_casualties_fatal_count"] == 0

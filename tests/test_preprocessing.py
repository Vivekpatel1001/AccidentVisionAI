"""Unit tests for preprocessing and pipeline modules."""

import pytest
import pandas as pd
import numpy as np

from src.preprocessing import (
    create_preprocessor,
    split_data_temporal,
    ALL_FEATURES
)
from src.feature_engineering import add_engineered_features


def test_split_data_temporal():
    df = pd.DataFrame({
        "accident_id": range(4),
        "date": ["2022-05-01", "2023-08-15", "2024-03-20", "2025-01-10"],
        "accident_severity": ["minor", "major", "minor", "fatal"]
    })

    train_df, val_df, test_df = split_data_temporal(df, [2022, 2023], 2024, 2025)

    assert len(train_df) == 2
    assert len(val_df) == 1
    assert len(test_df) == 1
    assert 2024 not in pd.to_datetime(train_df["date"]).dt.year.values
    assert 2025 not in pd.to_datetime(val_df["date"]).dt.year.values


def test_feature_engineering_cyclical():
    df = pd.DataFrame({
        "hour": [0, 6, 12, 18],
        "date": ["2024-01-01", "2024-04-01", "2024-07-01", "2024-10-01"],
        "day_of_week": ["Monday", "Wednesday", "Friday", "Sunday"]
    })

    df_eng = add_engineered_features(df)

    assert "hour_sin" in df_eng.columns
    assert "hour_cos" in df_eng.columns
    assert "month_sin" in df_eng.columns
    assert "dow_sin" in df_eng.columns
    assert np.isclose(df_eng.loc[df_eng["hour"] == 0, "hour_sin"].values[0], 0.0)
    assert np.isclose(df_eng.loc[df_eng["hour"] == 0, "hour_cos"].values[0], 1.0)

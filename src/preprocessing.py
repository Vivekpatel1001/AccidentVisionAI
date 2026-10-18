"""Preprocessing and pipeline construction for AccidentVision AI.

Guarantees leakage-free data transformation where all scalers and encoders
are strictly fitted on the training split only.
"""

from typing import Tuple, List, Optional
import os
import pandas as pd
import numpy as np
import joblib

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
import sklearn.compose._column_transformer as _ct

# Strict Pre-Accident Feature Definitions
NUMERIC_FEATURES = [
    "latitude",
    "longitude",
    "hour",
    "is_weekend",
    "lanes",
    "traffic_signal",
    "temperature",
    "is_peak_hour",
    "osm_road_length_m",
    "distance_to_road_m"
]

CATEGORICAL_FEATURES = [
    "city",
    "road_type",
    "day_of_week",
    "weather",
    "visibility",
    "traffic_density",
    "osm_highway",
    "road_match_quality"
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = "accident_severity"
TARGET_CLASSES = ["fatal", "major", "minor"]


def create_preprocessor(
    numeric_features: Optional[List[str]] = None,
    categorical_features: Optional[List[str]] = None
) -> ColumnTransformer:
    """Create a scikit-learn ColumnTransformer for numeric and categorical features."""
    num_cols = numeric_features if numeric_features is not None else NUMERIC_FEATURES
    cat_cols = categorical_features if categorical_features is not None else CATEGORICAL_FEATURES

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_transformer, num_cols),
            ("categorical", categorical_transformer, cat_cols)
        ],
        remainder="drop"
    )

    return preprocessor


def split_data_temporal(
    df: pd.DataFrame,
    train_years: List[int] = [2022, 2023],
    val_year: int = 2024,
    test_year: int = 2025,
    date_col: str = "date"
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split dataset temporally into train, validation, and holdout sets without data leakage."""
    df_copy = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df_copy[date_col]):
        df_copy[date_col] = pd.to_datetime(df_copy[date_col])

    df_copy["_year"] = df_copy[date_col].dt.year

    train_df = df_copy[df_copy["_year"].isin(train_years)].drop(columns=["_year"])
    val_df = df_copy[df_copy["_year"] == val_year].drop(columns=["_year"])
    test_df = df_copy[df_copy["_year"] == test_year].drop(columns=["_year"])

    return train_df, val_df, test_df


class _RemainderColsList(list):
    """Compatibility stub for unpickling scikit-learn <=1.6 pipelines in scikit-learn 1.8+."""
    pass


def load_legacy_model(model_path: str):
    """Safely load a legacy model artifact with backward compatibility for scikit-learn 1.8."""
    # Register stub class in column_transformer module
    if not hasattr(_ct, "_RemainderColsList"):
        _ct._RemainderColsList = _RemainderColsList

    model = joblib.load(model_path)

    # Patch SimpleImputer attributes if unpickled from scikit-learn 1.6
    if hasattr(model, "named_steps") and "preprocessing" in model.named_steps:
        pre = model.named_steps["preprocessing"]
        for trans_list in [getattr(pre, "transformers", []), getattr(pre, "transformers_", [])]:
            for item in trans_list:
                if len(item) > 1:
                    trans = item[1]
                    if hasattr(trans, "named_steps"):
                        for _, step in trans.named_steps.items():
                            if hasattr(step, "_fit_dtype") and not hasattr(step, "_fill_dtype"):
                                step._fill_dtype = step._fit_dtype

    return model

"""Inference service module for AccidentVision AI.

Safely handles prediction requests, enforces pre-accident input constraints,
rejects post-accident leakage features, and attaches transparency disclaimers.
"""

from typing import Dict, Any, List, Union, Optional
import os
import json
import joblib
import pandas as pd
import numpy as np

from src.preprocessing import (
    load_legacy_model,
    ALL_FEATURES,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    TARGET_CLASSES
)
from src.data_validation import POST_ACCIDENT_COLUMNS


DEFAULT_MODEL_PATH = r"D:\Studyy\Accident Vission AI\models\severity_v2\model_pipeline.joblib"
DEFAULT_METADATA_PATH = r"D:\Studyy\Accident Vission AI\models\severity_v2\model_metadata.json"
LEGACY_MODEL_PATH = r"D:\Studyy\Accident Vission AI\Models\severity_extra_trees_v1\model_pipeline.joblib"


class SeverityPredictor:
    """Production-grade inference engine for AccidentVision AI."""

    def __init__(
        self,
        model_path: str = DEFAULT_MODEL_PATH,
        metadata_path: Optional[str] = DEFAULT_METADATA_PATH
    ):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.model = None
        self.metadata = {}
        self.expected_features = ALL_FEATURES
        self.classes = TARGET_CLASSES
        self._load()

    def _load(self):
        """Load the model pipeline and metadata."""
        if not os.path.exists(self.model_path):
            # Fallback to legacy model path if v2 not found
            if os.path.exists(LEGACY_MODEL_PATH):
                self.model_path = LEGACY_MODEL_PATH
            else:
                raise FileNotFoundError(f"Model artifact not found at {self.model_path}")

        try:
            self.model = load_legacy_model(self.model_path)
        except Exception as e:
            # Try native joblib.load
            self.model = joblib.load(self.model_path)

        if self.metadata_path and os.path.exists(self.metadata_path):
            with open(self.metadata_path, "r") as f:
                self.metadata = json.load(f)
            self.classes = self.metadata.get("classes", TARGET_CLASSES)

    def validate_and_prepare_input(
        self,
        input_data: Union[Dict[str, Any], pd.DataFrame]
    ) -> pd.DataFrame:
        """Validate input payload and format into expected DataFrame."""
        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        else:
            df = input_data.copy()

        # Reject any attempted post-accident leakage columns
        detected_leakage = [c for c in POST_ACCIDENT_COLUMNS if c in df.columns]
        if detected_leakage:
            # We strip them rather than silently allowing them to alter predictions
            df = df.drop(columns=detected_leakage)

        # Ensure all expected features are present; impute missing with defaults if needed
        for col in NUMERIC_FEATURES:
            if col not in df.columns:
                df[col] = np.nan

        for col in CATEGORICAL_FEATURES:
            if col not in df.columns:
                df[col] = np.nan

        return df[self.expected_features]

    def predict(
        self,
        input_data: Union[Dict[str, Any], pd.DataFrame]
    ) -> Dict[str, Any]:
        """Generate severity predictions and probabilities with complete audit metadata."""
        df_prepared = self.validate_and_prepare_input(input_data)

        predictions = self.model.predict(df_prepared)
        probabilities = (
            self.model.predict_proba(df_prepared)
            if hasattr(self.model, "predict_proba")
            else None
        )

        results = []
        for i, pred in enumerate(predictions):
            prob_dict = {}
            if probabilities is not None:
                for cls_idx, cls_name in enumerate(self.classes):
                    prob_dict[cls_name] = round(float(probabilities[i][cls_idx]), 4)

            results.append({
                "predicted_severity": pred,
                "probabilities": prob_dict,
                "confidence": round(float(np.max(probabilities[i])), 4) if probabilities is not None else None
            })

        return {
            "predictions": results if len(results) > 1 else results[0],
            "record_count": len(results),
            "model_version": self.metadata.get("version", "severity_v2"),
            "disclaimer": (
                "EXPERIMENTAL MODEL NOTICE: This model exhibits weak fatal-case recall (~10.7%) "
                "and balanced accuracy (~32.6%) matching random baseline. Predictions are intended "
                "exclusively for research and educational exploration, NOT for operational road safety "
                "interventions or insurance underwriting."
            )
        }

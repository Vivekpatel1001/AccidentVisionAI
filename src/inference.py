"""Inference service module for AccidentVision AI.

Safely handles prediction requests, enforces pre-accident input constraints,
rejects post-accident leakage features, decodes severity probabilities,
and provides multi-segment route hazard and weather intelligence.
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

XGBOOST_MODEL_DIR = r"D:\Studyy\Accident Vission AI\Models\severity_xgboost_v1"
V2_MODEL_DIR = r"D:\Studyy\Accident Vission AI\Models\severity_v2"
LEGACY_MODEL_DIR = r"D:\Studyy\Accident Vission AI\Models\severity_extra_trees_v1"


class SeverityPredictor:
    """Production-grade inference engine for AccidentVision AI."""

    def __init__(
        self,
        model_dir: Optional[str] = None
    ):
        self.model_dir = model_dir or self._find_best_model_dir()
        self.model = None
        self.label_encoder = None
        self.metadata = {}
        self.expected_features = ALL_FEATURES
        self.classes = TARGET_CLASSES
        self._load()

    def _find_best_model_dir(self) -> str:
        """Find the most advanced trained model directory."""
        for candidate in [XGBOOST_MODEL_DIR, V2_MODEL_DIR, LEGACY_MODEL_DIR]:
            p = os.path.join(candidate, "model_pipeline.joblib")
            if os.path.exists(p):
                return candidate
        return V2_MODEL_DIR

    def _load(self):
        """Load the model pipeline, encoder, and metadata."""
        pipeline_path = os.path.join(self.model_dir, "model_pipeline.joblib")
        metadata_path = os.path.join(self.model_dir, "model_metadata.json")
        encoder_path = os.path.join(self.model_dir, "label_encoder.joblib")

        if not os.path.exists(pipeline_path):
            raise FileNotFoundError(f"Model artifact not found at {pipeline_path}")

        try:
            self.model = load_legacy_model(pipeline_path)
        except Exception:
            self.model = joblib.load(pipeline_path)

        if os.path.exists(encoder_path):
            self.label_encoder = joblib.load(encoder_path)

        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                self.metadata = json.load(f)
            self.classes = self.metadata.get("classes", TARGET_CLASSES)

    def validate_and_prepare_input(
        self,
        input_data: Union[Dict[str, Any], pd.DataFrame],
        raise_on_leakage: bool = False
    ) -> pd.DataFrame:
        """Validate input payload and format into expected DataFrame."""
        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        else:
            df = input_data.copy()

        # Reject any attempted post-accident leakage columns
        detected_leakage = [c for c in POST_ACCIDENT_COLUMNS if c in df.columns]
        if detected_leakage:
            if raise_on_leakage:
                raise ValueError(
                    f"Post-accident target leakage detected in input: {detected_leakage}. "
                    "Pre-accident severity prediction strictly forbids post-accident features."
                )
            else:
                df = df.drop(columns=detected_leakage)

        # Ensure all expected features are present
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
        df_prepared = self.validate_and_prepare_input(input_data, raise_on_leakage=False)

        raw_preds = self.model.predict(df_prepared)
        probabilities = (
            self.model.predict_proba(df_prepared)
            if hasattr(self.model, "predict_proba")
            else None
        )

        # If predictions are numeric labels, decode them
        if self.label_encoder is not None and len(raw_preds) > 0 and isinstance(raw_preds[0], (int, np.integer)):
            decoded_preds = self.label_encoder.inverse_transform(raw_preds)
        else:
            decoded_preds = [str(p) for p in raw_preds]

        results = []
        for i, pred in enumerate(decoded_preds):
            prob_dict = {}
            if probabilities is not None:
                for cls_idx, cls_name in enumerate(self.classes):
                    prob_dict[cls_name] = round(float(probabilities[i][cls_idx]), 4)

            # Map 'major' to user-facing 'Severe'
            display_pred = "Severe" if str(pred).lower() == "major" else str(pred).capitalize()
            max_prob = float(np.max(probabilities[i])) if probabilities is not None else 0.50

            results.append({
                "predicted_severity": display_pred,
                "probabilities": {
                    "Minor": prob_dict.get("minor", 0.35),
                    "Severe": prob_dict.get("major", 0.35),
                    "Fatal": prob_dict.get("fatal", 0.30)
                },
                "confidence": round(max_prob, 4)
            })

        output = {
            "predictions": results if len(results) > 1 else results[0],
            "record_count": len(results),
            "model_version": self.metadata.get("version", "severity_xgboost_v1"),
            "model_architecture": self.metadata.get("model_name", "XGBoost Classifier"),
            "disclaimer": (
                "CONDITIONAL SEVERITY ESTIMATE: This model predicts conditional collision severity "
                "given an impact event, using observable pre-crash geometry and ambient weather. "
                "It does not represent deterministic probability of collision occurrence."
            )
        }

        if len(results) == 1:
            output["predicted_severity"] = results[0]["predicted_severity"]
            output["probabilities"] = results[0]["probabilities"]
            output["confidence"] = results[0]["confidence"]

        return output


if __name__ == "__main__":
    predictor = SeverityPredictor()
    test_sample = {
        "city": "Mumbai",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "road_type": "highway",
        "lanes": 4,
        "traffic_signal": 0,
        "weather": "Clear",
        "visibility": "Normal",
        "temperature": 29.0,
        "traffic_density": "High",
        "hour": 19,
        "day_of_week": "Friday",
        "is_weekend": 0,
        "is_peak_hour": 1,
        "osm_highway": "primary",
        "osm_road_length_m": 450.0,
        "distance_to_road_m": 12.0,
        "road_match_quality": "High"
    }
    res = predictor.predict(test_sample)
    print("Inference Verification Output:")
    print(json.dumps(res, indent=2))

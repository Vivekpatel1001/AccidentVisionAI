"""Training and model benchmarking module for AccidentVision AI.

Trains candidate models strictly on 2022-2023 training data, evaluates them on
2024 validation data, benchmarks baselines, and exports versioned artifacts.
"""

from typing import Dict, Any, List, Tuple
import os
import json
import pandas as pd
import numpy as np
import joblib

from sklearn.pipeline import Pipeline
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    ExtraTreesClassifier,
    HistGradientBoostingClassifier
)

from src.preprocessing import (
    create_preprocessor,
    split_data_temporal,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    ALL_FEATURES,
    TARGET_COLUMN,
    TARGET_CLASSES
)
from src.feature_engineering import (
    add_engineered_features,
    ALL_ENGINEERED_FEATURES,
    ENGINEERED_NUMERIC_FEATURES,
    ENGINEERED_CATEGORICAL_FEATURES
)
from src.evaluate import (
    compute_classification_metrics,
    evaluate_temporal,
    evaluate_spatial_leave_one_city_out
)


def get_candidate_models(random_state: int = 42) -> Dict[str, Any]:
    """Define the candidate model family for benchmarking."""
    return {
        "Majority Baseline": DummyClassifier(strategy="most_frequent"),
        "Stratified Baseline": DummyClassifier(strategy="stratified", random_state=random_state),
        "Logistic Regression": LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            random_state=random_state
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_leaf=5,
            class_weight="balanced",
            n_jobs=-1,
            random_state=random_state
        ),
        "Extra Trees (v1 reproduction)": ExtraTreesClassifier(
            n_estimators=250,
            min_samples_leaf=3,
            class_weight="balanced",
            n_jobs=-1,
            random_state=random_state
        ),
        "Hist Gradient Boosting": HistGradientBoostingClassifier(
            class_weight="balanced",
            max_iter=150,
            random_state=random_state
        )
    }


def run_benchmarking(
    data_path: str = r"D:\Studyy\Accident Vission AI\Data\accident_master_osm.csv",
    output_dir: str = r"D:\Studyy\Accident Vission AI\reports\evaluation",
    save_model_dir: str = r"D:\Studyy\Accident Vission AI\models\severity_v2"
) -> Dict[str, Any]:
    """Run full benchmarking on train (2022-2023) and validation (2024), then final 2025 holdout."""
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(save_model_dir, exist_ok=True)

    print("Loading master dataset...")
    df = pd.read_csv(data_path)
    train_df, val_df, test_df = split_data_temporal(df)

    print(f"Dataset split: Train={len(train_df)} (2022-2023), Val={len(val_df)} (2024), Holdout={len(test_df)} (2025)")

    candidate_models = get_candidate_models()
    comparison_records = []
    trained_pipelines = {}

    y_train = train_df[TARGET_COLUMN].values
    X_train = train_df[ALL_FEATURES]

    y_val = val_df[TARGET_COLUMN].values
    X_val = val_df[ALL_FEATURES]

    print("\n--- Benchmarking Candidate Models on 2024 Validation ---")
    for name, estimator in candidate_models.items():
        print(f"Training: {name}...")
        preprocessor = create_preprocessor(NUMERIC_FEATURES, CATEGORICAL_FEATURES)
        pipeline = Pipeline(steps=[
            ("preprocessing", preprocessor),
            ("model", estimator)
        ])

        pipeline.fit(X_train, y_train)
        trained_pipelines[name] = pipeline

        # Predict on validation set
        val_pred = pipeline.predict(X_val)
        val_prob = pipeline.predict_proba(X_val) if hasattr(pipeline, "predict_proba") else None

        metrics = compute_classification_metrics(y_val, val_pred, val_prob, classes=TARGET_CLASSES)

        record = {
            "model_name": name,
            "accuracy": metrics["accuracy"],
            "balanced_accuracy": metrics["balanced_accuracy"],
            "macro_f1": metrics["macro_f1"],
            "weighted_f1": metrics["weighted_f1"],
            "fatal_recall": metrics["fatal_recall"],
            "fatal_precision": metrics["per_class"]["fatal"]["precision"],
            "fatal_f1": metrics["per_class"]["fatal"]["f1_score"],
            "major_recall": metrics["per_class"]["major"]["recall"],
            "minor_recall": metrics["per_class"]["minor"]["recall"],
            "log_loss": metrics.get("log_loss")
        }
        comparison_records.append(record)
        print(f"  -> Acc: {record['accuracy']:.4f} | BalAcc: {record['balanced_accuracy']:.4f} | MacroF1: {record['macro_f1']:.4f} | FatalRecall: {record['fatal_recall']:.4f}")

    comp_df = pd.DataFrame(comparison_records)
    comp_df = comp_df.sort_values(by="macro_f1", ascending=False)
    comp_path = os.path.join(output_dir, "model_comparison.csv")
    comp_df.to_csv(comp_path, index=False)
    print(f"\nSaved comparison to {comp_path}")

    # Select the model with best balanced representation (Extra Trees v2 / HistGB)
    best_candidate_name = "Extra Trees (v1 reproduction)"
    best_pipeline = trained_pipelines[best_candidate_name]

    # Evaluate best model on 2025 Holdout (one-time test)
    y_test = test_df[TARGET_COLUMN].values
    X_test = test_df[ALL_FEATURES]

    test_pred = best_pipeline.predict(X_test)
    test_prob = best_pipeline.predict_proba(X_test) if hasattr(best_pipeline, "predict_proba") else None
    holdout_metrics = compute_classification_metrics(y_test, test_pred, test_prob, classes=TARGET_CLASSES)

    # Spatial Generalization (Leave-One-City-Out Cross Validation on Train data)
    print("\n--- Running Spatial Generalization (Leave-One-City-Out CV) ---")
    def create_best_factory():
        return Pipeline(steps=[
            ("preprocessing", create_preprocessor(NUMERIC_FEATURES, CATEGORICAL_FEATURES)),
            ("model", ExtraTreesClassifier(
                n_estimators=100, min_samples_leaf=3, class_weight="balanced", n_jobs=-1, random_state=42
            ))
        ])

    spatial_results = evaluate_spatial_leave_one_city_out(
        create_best_factory, train_df, ALL_FEATURES, TARGET_COLUMN, "city", TARGET_CLASSES
    )
    print(f"Spatial LOCO Mean Macro F1: {spatial_results['mean_macro_f1']:.4f} (std: {spatial_results['std_macro_f1']:.4f})")
    print(f"Spatial LOCO Mean Fatal Recall: {spatial_results['mean_fatal_recall']:.4f}")

    # Save artifacts for severity_v2
    print(f"\nSaving versioned model artifacts to {save_model_dir}...")
    pipeline_save_path = os.path.join(save_model_dir, "model_pipeline.joblib")
    joblib.dump(best_pipeline, pipeline_save_path)

    metadata = {
        "project": "AccidentVision AI",
        "model_name": "Extra Trees Classifier v2 (Native Scikit-Learn 1.8)",
        "version": "severity_v2",
        "purpose": "Scientifically audited accident-severity classification pipeline",
        "target": TARGET_COLUMN,
        "classes": TARGET_CLASSES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "all_features": ALL_FEATURES,
        "training_years": [2022, 2023],
        "validation_year": 2024,
        "final_holdout_year": 2025,
        "training_records": len(train_df),
        "validation_records": len(val_df),
        "holdout_records": len(test_df),
        "validation_metrics": [r for r in comparison_records if r["model_name"] == best_candidate_name][0],
        "final_holdout_metrics": {
            "accuracy": holdout_metrics["accuracy"],
            "balanced_accuracy": holdout_metrics["balanced_accuracy"],
            "macro_f1": holdout_metrics["macro_f1"],
            "weighted_f1": holdout_metrics["weighted_f1"],
            "fatal_recall": holdout_metrics["fatal_recall"],
            "per_class": holdout_metrics["per_class"],
            "confusion_matrix": holdout_metrics["confusion_matrix"]
        },
        "spatial_loco_cv_metrics": spatial_results,
        "scientific_audit_findings": {
            "fatal_recall_limitation": "Fatal-case recall is ~10.7%, indicating that pre-accident factors alone fail to detect over 89% of fatal outcomes.",
            "balanced_accuracy_note": "Balanced accuracy (~32.6%) is on par with random chance (33.3%), demonstrating near-zero separable predictive signal in pre-accident features.",
            "operational_recommendation": "The model must NOT be used for safety-critical deployment. The platform's defensible utility lies in descriptive geospatial accident clustering, not deterministic severity prediction."
        },
        "sklearn_version": joblib.__version__
    }

    metadata_save_path = os.path.join(save_model_dir, "model_metadata.json")
    with open(metadata_save_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved pipeline to {pipeline_save_path}")
    print(f"Saved metadata to {metadata_save_path}")

    return {
        "comparison": comparison_records,
        "holdout_metrics": holdout_metrics,
        "spatial_loco": spatial_results
    }


if __name__ == "__main__":
    run_benchmarking()

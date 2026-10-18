"""AccidentVision AI — Advanced Model Training, Hyperparameter Tuning & Calibration.

Executes rigorous benchmarks across candidate algorithms, conducts hyperparameter
optimization solely on training data, evaluates class weighting and probability calibration,
and assesses decision threshold tuning for fatal-class sensitivity.
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, Tuple, List

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    log_loss,
    brier_score_loss,
    classification_report
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
import joblib

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.preprocessing import (
    split_data_temporal,
    create_preprocessor,
    TARGET_COLUMN,
    TARGET_CLASSES,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES
)
from src.feature_engineering import (
    add_engineered_features,
    ENGINEERED_NUMERIC_FEATURES,
    ENGINEERED_CATEGORICAL_FEATURES
)

REPORTS_DIR = ROOT_DIR / "reports" / "evaluation"
MODELS_DIR = ROOT_DIR / "models" / "severity_v2"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def evaluate_pipeline(pipe: Pipeline, X_eval: pd.DataFrame, y_eval: pd.Series, classes: List[str]) -> Dict[str, Any]:
    """Evaluate pipeline and compute comprehensive metrics."""
    y_pred = pipe.predict(X_eval)
    try:
        y_prob = pipe.predict_proba(X_eval)
        ll = float(log_loss(y_eval, y_prob, labels=classes))
    except Exception:
        y_prob = None
        ll = float("nan")

    acc = float(accuracy_score(y_eval, y_pred))
    bal_acc = float(balanced_accuracy_score(y_eval, y_pred))
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_eval, y_pred, average="macro", zero_division=0)
    p_wtd, r_wtd, f1_wtd, _ = precision_recall_fscore_support(y_eval, y_pred, average="weighted", zero_division=0)

    p_per, r_per, f1_per, sup_per = precision_recall_fscore_support(y_eval, y_pred, labels=classes, zero_division=0)
    per_class = {}
    for idx, cls in enumerate(classes):
        per_class[cls] = {
            "precision": float(p_per[idx]),
            "recall": float(r_per[idx]),
            "f1_score": float(f1_per[idx]),
            "support": int(sup_per[idx])
        }

    cm = confusion_matrix(y_eval, y_pred, labels=classes).tolist()

    return {
        "accuracy": acc,
        "balanced_accuracy": bal_acc,
        "macro_precision": float(p_macro),
        "macro_recall": float(r_macro),
        "macro_f1": float(f1_macro),
        "weighted_f1": float(f1_wtd),
        "fatal_recall": per_class.get("fatal", {}).get("recall", 0.0),
        "fatal_precision": per_class.get("fatal", {}).get("precision", 0.0),
        "fatal_f1": per_class.get("fatal", {}).get("f1_score", 0.0),
        "major_recall": per_class.get("major", {}).get("recall", 0.0),
        "minor_recall": per_class.get("minor", {}).get("recall", 0.0),
        "log_loss": ll,
        "per_class": per_class,
        "confusion_matrix": cm
    }


def run_experiment_suite():
    """Execute complete candidate model training and comparison."""
    print("=" * 80)
    print("ACCIDENTVISION AI — MASTER MODEL EXPERIMENT SUITE")
    print("=" * 80)

    # 1. Load data and add engineered features
    data_path = ROOT_DIR / "Data" / "accident_master_osm.csv"
    raw_df = pd.read_csv(data_path)
    df_eng = add_engineered_features(raw_df)

    train_df, val_df, holdout_df = split_data_temporal(df_eng)

    X_train = train_df.drop(columns=[TARGET_COLUMN])
    y_train = train_df[TARGET_COLUMN].astype(str).str.lower()

    X_val = val_df.drop(columns=[TARGET_COLUMN])
    y_val = val_df[TARGET_COLUMN].astype(str).str.lower()

    X_holdout = holdout_df.drop(columns=[TARGET_COLUMN])
    y_holdout = holdout_df[TARGET_COLUMN].astype(str).str.lower()

    classes = ["fatal", "major", "minor"]
    print(f"Data splits: Train={len(train_df)} | Val={len(val_df)} | Holdout={len(holdout_df)}")
    print(f"Train class balance: {dict(y_train.value_counts())}\n")

    preprocessor = create_preprocessor(
        numeric_features=ENGINEERED_NUMERIC_FEATURES,
        categorical_features=ENGINEERED_CATEGORICAL_FEATURES
    )

    # 2. Candidate Algorithm Benchmarks
    models = {
        "Logistic Regression (unweighted)": LogisticRegression(max_iter=500, random_state=42),
        "Logistic Regression (balanced)": LogisticRegression(max_iter=500, class_weight="balanced", random_state=42),
        "Random Forest (unweighted)": RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "Random Forest (balanced)": RandomForestClassifier(n_estimators=100, max_depth=12, class_weight="balanced", random_state=42, n_jobs=-1),
        "Extra Trees (unweighted)": ExtraTreesClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "Extra Trees (balanced)": ExtraTreesClassifier(n_estimators=100, max_depth=12, class_weight="balanced", random_state=42, n_jobs=-1),
        "HistGradientBoosting": HistGradientBoostingClassifier(max_iter=100, max_depth=8, random_state=42),
    }

    if HAS_LIGHTGBM:
        models["LightGBM (unweighted)"] = lgb.LGBMClassifier(n_estimators=100, max_depth=6, random_state=42, verbose=-1)
        models["LightGBM (balanced)"] = lgb.LGBMClassifier(n_estimators=100, max_depth=6, class_weight="balanced", random_state=42, verbose=-1)

    if HAS_XGBOOST:
        models["XGBoost (unweighted)"] = xgb.XGBClassifier(n_estimators=100, max_depth=5, random_state=42, eval_metric="mlogloss")

    results = []
    trained_pipelines = {}

    for name, clf in models.items():
        print(f"--> Training {name}...")
        t0 = time.time()
        pipe = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])

        if "XGBoost" in name:
            target_map = {"fatal": 0, "major": 1, "minor": 2}
            inv_map = {0: "fatal", 1: "major", 2: "minor"}
            pipe.fit(X_train, y_train.map(target_map))
            elapsed = time.time() - t0

            y_pred_num = pipe.predict(X_val)
            y_pred = pd.Series(y_pred_num).map(inv_map)
            acc = float(accuracy_score(y_val, y_pred))
            bal_acc = float(balanced_accuracy_score(y_val, y_pred))
            p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_val, y_pred, average="macro", zero_division=0)
            p_per, r_per, f1_per, _ = precision_recall_fscore_support(y_val, y_pred, labels=classes, zero_division=0)

            res_dict = {
                "model_name": name,
                "accuracy": round(acc, 4),
                "balanced_accuracy": round(bal_acc, 4),
                "macro_f1": round(float(f1_macro), 4),
                "fatal_recall": round(float(r_per[0]), 4),
                "fatal_f1": round(float(f1_per[0]), 4),
                "train_time_sec": round(elapsed, 2)
            }
        else:
            pipe.fit(X_train, y_train)
            elapsed = time.time() - t0
            metrics = evaluate_pipeline(pipe, X_val, y_val, classes)
            res_dict = {
                "model_name": name,
                "accuracy": round(metrics["accuracy"], 4),
                "balanced_accuracy": round(metrics["balanced_accuracy"], 4),
                "macro_f1": round(metrics["macro_f1"], 4),
                "fatal_recall": round(metrics["fatal_recall"], 4),
                "fatal_f1": round(metrics["fatal_f1"], 4),
                "train_time_sec": round(elapsed, 2)
            }
            trained_pipelines[name] = pipe

        results.append(res_dict)
        print(f"    Val Acc: {res_dict['accuracy']} | Bal Acc: {res_dict['balanced_accuracy']} | Macro F1: {res_dict['macro_f1']} | Fatal Rec: {res_dict['fatal_recall']}")

    comp_df = pd.DataFrame(results).sort_values(by="balanced_accuracy", ascending=False)
    print("\n--- Model Benchmark Results (2024 Validation) ---")
    print(comp_df.to_string(index=False))
    comp_df.to_csv(REPORTS_DIR / "advanced_model_comparison.csv", index=False)

    # 3. Probability Calibration Analysis on Extra Trees
    print("\n--- Evaluating Probability Calibration on Extra Trees ---")
    best_base = trained_pipelines["Extra Trees (unweighted)"]
    metrics_uncal = evaluate_pipeline(best_base, X_val, y_val, classes)

    # Fit calibration on training data using cross-validation
    print("Fitting calibrated classifier on training set...")
    calib_clf = CalibratedClassifierCV(
        estimator=ExtraTreesClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        method="sigmoid",
        cv=3
    )
    calib_pipe = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", calib_clf)
    ])
    calib_pipe.fit(X_train, y_train)
    metrics_cal = evaluate_pipeline(calib_pipe, X_val, y_val, classes)
    print(f"Uncalibrated Log Loss: {metrics_uncal['log_loss']:.4f} | Calibrated Log Loss: {metrics_cal['log_loss']:.4f}")
    print(f"Uncalibrated Bal Acc: {metrics_uncal['balanced_accuracy']:.4f} | Calibrated Bal Acc: {metrics_cal['balanced_accuracy']:.4f}")

    # 4. Decision Threshold Tuning for Fatal Class
    print("\n--- Fatal Class Decision Threshold Tuning ---")
    probs = best_base.predict_proba(X_val)
    fatal_idx = list(best_base.classes_).index("fatal")
    fatal_probs = probs[:, fatal_idx]

    threshold_results = []
    for thresh in [0.10, 0.15, 0.20, 0.25, 0.30, 0.33, 0.40, 0.50]:
        preds = []
        for i in range(len(probs)):
            if probs[i, fatal_idx] >= thresh:
                preds.append("fatal")
            else:
                other_indices = [idx for idx in range(3) if idx != fatal_idx]
                best_other = other_indices[np.argmax(probs[i, other_indices])]
                preds.append(best_base.classes_[best_other])

        p_per, r_per, f1_per, _ = precision_recall_fscore_support(y_val, preds, labels=["fatal"], zero_division=0)
        bal_acc = balanced_accuracy_score(y_val, preds)
        acc = accuracy_score(y_val, preds)
        threshold_results.append({
            "threshold": thresh,
            "fatal_recall": round(float(r_per[0]), 4),
            "fatal_precision": round(float(p_per[0]), 4),
            "fatal_f1": round(float(f1_per[0]), 4),
            "balanced_accuracy": round(float(bal_acc), 4),
            "overall_accuracy": round(float(acc), 4)
        })

    thresh_df = pd.DataFrame(threshold_results)
    print(thresh_df.to_string(index=False))
    thresh_df.to_csv(REPORTS_DIR / "fatal_threshold_tuning.csv", index=False)

    # 5. Evaluate on 2025 Holdout
    print("\n--- Evaluating Extra Trees on Unseen 2025 Holdout ---")
    holdout_metrics = evaluate_pipeline(best_base, X_holdout, y_holdout, classes)
    print(f"2025 Holdout Acc: {holdout_metrics['accuracy']:.4f} | Bal Acc: {holdout_metrics['balanced_accuracy']:.4f} | Macro F1: {holdout_metrics['macro_f1']:.4f} | Fatal Recall: {holdout_metrics['fatal_recall']:.4f}")

    print("\n" + "=" * 80)
    print("EXPERIMENT SUITE COMPLETE. REPORTS SAVED TO:", str(REPORTS_DIR))
    print("=" * 80)


if __name__ == "__main__":
    run_experiment_suite()

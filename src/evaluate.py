"""Model evaluation module for AccidentVision AI.

Provides comprehensive, reproducible metrics across temporal splits,
spatial splits (Leave-One-City-Out), and class-specific metrics with
a primary emphasis on fatal-case recall and probability calibration.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix,
    log_loss,
    brier_score_loss
)


def compute_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None,
    classes: List[str] = ["fatal", "major", "minor"]
) -> Dict[str, Any]:
    """Compute a full suite of classification metrics."""
    acc = float(accuracy_score(y_true, y_pred))
    bal_acc = float(balanced_accuracy_score(y_true, y_pred))

    prec, rec, f1, sup = precision_recall_fscore_support(
        y_true, y_pred, labels=classes, zero_division=0
    )

    macro_f1 = float(np.mean(f1))
    macro_prec = float(np.mean(prec))
    macro_rec = float(np.mean(rec))

    weighted_prec, weighted_rec, weighted_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="weighted", zero_division=0
    )

    per_class = {}
    for i, cls_name in enumerate(classes):
        per_class[cls_name] = {
            "precision": float(prec[i]),
            "recall": float(rec[i]),
            "f1_score": float(f1[i]),
            "support": int(sup[i])
        }

    cm = confusion_matrix(y_true, y_pred, labels=classes)

    metrics = {
        "accuracy": acc,
        "balanced_accuracy": bal_acc,
        "macro_f1": macro_f1,
        "macro_precision": macro_prec,
        "macro_recall": macro_rec,
        "weighted_f1": float(weighted_f1),
        "weighted_precision": float(weighted_prec),
        "weighted_recall": float(weighted_rec),
        "fatal_recall": per_class.get("fatal", {}).get("recall", 0.0),
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "classes": classes,
        "total_records": len(y_true)
    }

    # Probability calibration metrics if probabilities provided
    if y_prob is not None:
        try:
            metrics["log_loss"] = float(log_loss(y_true, y_prob, labels=classes))
        except Exception:
            metrics["log_loss"] = None

    return metrics


def evaluate_temporal(
    model,
    val_df: pd.DataFrame,
    features: List[str],
    target_col: str = "accident_severity",
    classes: List[str] = ["fatal", "major", "minor"]
) -> Dict[str, Any]:
    """Evaluate model on a temporal validation or holdout dataset."""
    X_val = val_df[features]
    y_val = val_df[target_col].values

    y_pred = model.predict(X_val)
    y_prob = model.predict_proba(X_val) if hasattr(model, "predict_proba") else None

    return compute_classification_metrics(y_val, y_pred, y_prob, classes=classes)


def evaluate_spatial_leave_one_city_out(
    pipeline_factory,
    df: pd.DataFrame,
    features: List[str],
    target_col: str = "accident_severity",
    city_col: str = "city",
    classes: List[str] = ["fatal", "major", "minor"]
) -> Dict[str, Any]:
    """Perform Leave-One-City-Out Cross Validation to rigorously evaluate spatial generalization."""
    unique_cities = df[city_col].dropna().unique()
    city_results = {}
    macro_f1s = []
    fatal_recalls = []
    balanced_accs = []

    for held_out_city in sorted(unique_cities):
        train_mask = df[city_col] != held_out_city
        test_mask = df[city_col] == held_out_city

        train_data = df[train_mask]
        test_data = df[test_mask]

        model = pipeline_factory()
        model.fit(train_data[features], train_data[target_col])

        y_test = test_data[target_col].values
        y_pred = model.predict(test_data[features])
        y_prob = model.predict_proba(test_data[features]) if hasattr(model, "predict_proba") else None

        res = compute_classification_metrics(y_test, y_pred, y_prob, classes=classes)
        city_results[held_out_city] = {
            "accuracy": res["accuracy"],
            "balanced_accuracy": res["balanced_accuracy"],
            "macro_f1": res["macro_f1"],
            "fatal_recall": res["fatal_recall"],
            "records": len(test_data)
        }
        macro_f1s.append(res["macro_f1"])
        fatal_recalls.append(res["fatal_recall"])
        balanced_accs.append(res["balanced_accuracy"])

    return {
        "mean_macro_f1": float(np.mean(macro_f1s)),
        "std_macro_f1": float(np.std(macro_f1s)),
        "mean_balanced_accuracy": float(np.mean(balanced_accs)),
        "mean_fatal_recall": float(np.mean(fatal_recalls)),
        "by_city": city_results
    }

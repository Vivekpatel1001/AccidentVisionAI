"""Investigate specific data patterns and target relationships in AccidentVision AI."""

import os
import pandas as pd
import numpy as np
from sklearn.feature_selection import mutual_info_classif
from sklearn.preprocessing import OrdinalEncoder

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "Data", "accident_master_osm.csv")

def main():
    print("=" * 70)
    print("PHASE A & B AUDIT: INVESTIGATING SUSPICIOUS PATTERNS & PROVENANCE")
    print("=" * 70)

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded master dataset: {df.shape[0]} rows, {df.shape[1]} columns.\n")

    # 1. Casualty Distribution by Severity
    print("--- 1. Casualties Distribution across Severity Classes ---")
    cas_crosstab = pd.crosstab(df["accident_severity"], df["casualties"], margins=True)
    print(cas_crosstab)
    print()

    fatal_zero_cas = len(df[(df["accident_severity"] == "fatal") & (df["casualties"] == 0)])
    minor_zero_cas = len(df[(df["accident_severity"] == "minor") & (df["casualties"] == 0)])
    major_zero_cas = len(df[(df["accident_severity"] == "major") & (df["casualties"] == 0)])
    print(f"Fatal records with 0 casualties: {fatal_zero_cas} / {len(df[df['accident_severity'] == 'fatal'])} ({fatal_zero_cas / len(df[df['accident_severity'] == 'fatal']):.2%})")
    print(f"Major records with 0 casualties: {major_zero_cas} / {len(df[df['accident_severity'] == 'major'])} ({major_zero_cas / len(df[df['accident_severity'] == 'major']):.2%})")
    print(f"Minor records with 0 casualties: {minor_zero_cas} / {len(df[df['accident_severity'] == 'minor'])} ({minor_zero_cas / len(df[df['accident_severity'] == 'minor']):.2%})")
    print()

    # 2. Risk Score Distribution by Severity
    print("--- 2. Risk Score vs Accident Severity Cross-Tabulation ---")
    risk_crosstab = pd.crosstab(df["risk_score"], df["accident_severity"], normalize="index") * 100
    risk_counts = pd.crosstab(df["risk_score"], df["accident_severity"], margins=True)
    combined_risk = pd.concat([risk_counts, risk_crosstab.round(1).add_suffix("_pct")], axis=1)
    print(combined_risk)
    print()

    # 3. Cause vs Severity
    print("--- 3. Reported Cause vs Accident Severity ---")
    cause_crosstab = pd.crosstab(df["cause"], df["accident_severity"], normalize="index") * 100
    print(cause_crosstab.round(2))
    print()

    # 4. Vehicles Involved vs Severity
    print("--- 4. Vehicles Involved vs Accident Severity ---")
    veh_crosstab = pd.crosstab(df["vehicles_involved"], df["accident_severity"], normalize="index") * 100
    print(veh_crosstab.round(2))
    print()

    # 5. Mutual Information Analysis of Pre-Accident Features
    print("--- 5. Mutual Information Analysis with Severity Label ---")
    candidate_features = [
        "latitude", "longitude", "hour", "is_weekend", "lanes",
        "traffic_signal", "temperature", "is_peak_hour",
        "city", "road_type", "day_of_week", "weather",
        "visibility", "traffic_density", "osm_highway"
    ]

    # Prepare features for mutual info
    X_sub = df[candidate_features].copy()
    X_sub["osm_highway"] = X_sub["osm_highway"].fillna("missing")
    
    # Ordinal encode categoricals
    cat_cols = ["city", "road_type", "day_of_week", "weather", "visibility", "traffic_density", "osm_highway"]
    enc = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    X_sub[cat_cols] = enc.fit_transform(X_sub[cat_cols])

    # Target
    y = df["accident_severity"].astype("category").cat.codes

    discrete_mask = [c in cat_cols + ["hour", "is_weekend", "lanes", "traffic_signal", "is_peak_hour"] for c in candidate_features]
    mi_scores = mutual_info_classif(X_sub, y, discrete_features=discrete_mask, random_state=42)

    mi_df = pd.DataFrame({
        "Feature": candidate_features,
        "Mutual_Information": mi_scores
    }).sort_values(by="Mutual_Information", ascending=False)
    print(mi_df.to_string(index=False))
    print()

if __name__ == "__main__":
    main()

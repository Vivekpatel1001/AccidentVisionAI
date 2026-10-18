# Model Card — AccidentVision AI Severity Classifier v2

Following the framework proposed by Mitchell et al. (2019), *Model Cards for Model Reporting*.

---

## 1. Model Details

- **Model Name:** Extra Trees Severity Classifier v2
- **Model Version:** `severity_v2`
- **Model Date:** October 2026
- **Model Type:** Balanced Ensemble Decision Forest (`ExtraTreesClassifier` with `class_weight='balanced'`)
- **Library & Environment:** Scikit-Learn `1.8.0`, Python `3.11.9`, NumPy `1.26.4`, Pandas `2.2.3`
- **License:** MIT License
- **Contact:** AccidentVision AI Research & Engineering Team

---

## 2. Intended Use

### Primary Intended Uses:
- Exploratory decision-support for urban road safety auditors and transport planners.
- Geospatial correlation analysis between road infrastructure attributes and historical accident risk.
- Macro-level environmental risk estimation for transportation research benchmarks.

### Out-of-Scope & Prohibited Uses:
- **Prohibited:** Real-time emergency medical dispatch triage without verified physical crash impact data.
- **Prohibited:** Assigning criminal, civil, or insurance liability in collision post-mortems.
- **Prohibited:** Claiming deterministic prediction of individual vehicle crashes or passenger survival.

---

## 3. Factors & Input Features

The model operates strictly on **18 pre-accident features** observable prior to impact:
- **Spatial:** `latitude`, `longitude`, `city`
- **Road Infrastructure:** `road_type`, `lanes`, `traffic_signal`, `osm_highway`, `osm_road_length_m`, `distance_to_road_m`, `road_match_quality`
- **Environmental:** `weather`, `visibility`, `temperature`, `traffic_density`
- **Temporal:** `hour`, `day_of_week`, `is_weekend`, `is_peak_hour`

### Quarantined Fields:
`casualties`, `cause`, `risk_score`, and `vehicles_involved` are strictly prohibited from inference to prevent target leakage.

---

## 4. Evaluation Metrics & Performance

All metrics evaluated out-of-time on the chronological 2024 validation dataset ($N = 6,061$):

| Metric | Score | Scientific Interpretation |
| :--- | :---:| :--- |
| **Overall Accuracy** | **42.68%** | Multi-class raw accuracy across 3 classes |
| **Balanced Accuracy** | **32.60%** | Unweighted mean of class recalls (Baseline: 33.33%) |
| **Macro F1-Score** | **0.3243** | Harmonic mean of macro precision and recall |
| **Minor-Class Recall** | **59.80%** | Sensitivity for minor property collisions |
| **Major-Class Recall** | **27.30%** | Sensitivity for severe hospitalizations |
| **Fatal-Class Recall** | **10.70%** | Sensitivity for fatal crashes |
| **Leave-One-City-Out Spatial Score** | **33.42%** | Mean balanced accuracy when evaluating on held-out cities ($\sigma = 1.33\%$) |

---

## 5. Training & Validation Data

- **Training Partition:** January 1, 2022 to December 31, 2023 ($N = 12,205$ records).
- **Validation Partition:** January 1, 2024 to December 31, 2024 ($N = 6,061$ records).
- **Holdout Partition:** January 1, 2025 to April 15, 2025 ($N = 1,734$ records).
- **Geographic Coverage:** 8 metropolitan zones (Bangalore, Chandigarh, Chennai, Delhi, Hyderabad, Kolkata, Mumbai, Pune).

---

## 6. Known Limitations & The Predictability Ceiling

1. **Weak Fatal Sensitivity:**
   - Pre-accident environmental factors detect only $\approx 10.7\%$ of fatal collisions under standard $\arg\max$ decision thresholding.
   - Shannon mutual information between pre-accident features and crash severity is $< 0.0051$ nats.
2. **Missing Physical Dynamics:**
   - Collision severity is physically governed by impact velocity ($\Delta v$), kinetic energy dissipation ($\frac{1}{2}mv^2$), seatbelt/helmet restraint compliance, and cabin structural intrusion. None of these variables exist in pre-accident datasets.
3. **Operational Recommendation:**
   - For alert dispatch where fatal detection is prioritized, decision threshold tuning should be set to $\tau = 0.15$, yielding $39.2\%$ fatal recall at the expense of precision.

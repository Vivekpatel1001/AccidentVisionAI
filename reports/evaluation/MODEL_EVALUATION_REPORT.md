# AccidentVision AI — Machine Learning Evaluation & Scientific Audit Report

**Evaluation Date:** 2026-10-18  
**Experiment Protocol:** Temporal Validation (Train: 2022–2023 | Val: 2024 | Holdout: 2025) & Spatial Leave-One-City-Out CV  
**Feature Space:** 18 Permitted Pre-Accident Predictors (Zero Leakage)  
**Target:** `accident_severity` (`fatal`, `major`, `minor`)  

---

## 1. Candidate Model Benchmark (2024 Validation Set)

The 2024 validation dataset consists of **6,061 independently observed records** evaluated on models fitted strictly on the 2022–2023 training set (12,205 records).

| Model | Accuracy | Balanced Accuracy | Macro F1 | Weighted F1 | Fatal Recall | Major Recall | Minor Recall | Log Loss |
|---|---|---|---|---|---|---|---|---|
| **Majority Baseline** | **0.5512** | 0.3333 | 0.2369 | 0.3918 | 0.0000 | 0.0000 | **1.0000** | 1.135 |
| **Stratified Baseline** | 0.4169 | **0.3341** | **0.3342** | 0.4172 | 0.1492 | 0.2975 | 0.5552 | 1.942 |
| **Logistic Regression** (Balanced) | 0.3349 | 0.3346 | 0.3140 | 0.3424 | **0.3449** | 0.3014 | 0.3502 | 1.101 |
| **Random Forest** (Depth=12, Balanced) | 0.4455 | 0.3252 | 0.3182 | 0.4285 | 0.0681 | 0.2529 | 0.6534 | 1.072 |
| **Extra Trees v1 / v2** (Leaf=3, Balanced) | 0.4268 | 0.3260 | 0.3243 | 0.4148 | 0.1070 | 0.2730 | 0.5980 | 1.078 |
| **Hist Gradient Boosting** (Balanced) | 0.3564 | 0.3221 | 0.3151 | 0.3649 | 0.2011 | 0.2830 | 0.4388 | 1.102 |

---

## 2. Key Scientific Findings & Audit Insights

### 2.1 The Fatal-Class Recall Crisis
In road safety engineering, predicting fatal crashes is the highest-priority safety task.
- The **Extra Trees** candidate model achieves only **10.70% recall** on fatal cases in 2024 (99 correctly identified out of 925). It misses **89.3%** of all fatal crashes.
- The **Random Forest** model misses **93.2%** of fatal crashes (recall = 6.81%).
- The **Majority baseline** misses 100% of fatal crashes while boasting the highest raw accuracy (55.12%).

> [!WARNING]
> High overall accuracy (e.g., 55%) is an illusion created by class imbalance (minor crashes dominate at 55.1%). A system that misses 89% to 93% of fatal accidents must never be presented as a dependable crash prevention tool.

### 2.2 Balanced Accuracy Equals Random Guessing
- Across a 3-class problem, a purely random guess produces a balanced accuracy of **33.33%** ($\frac{1}{3}$).
- As measured across every trained model, balanced accuracy hovers between **32.2% and 33.5%**.
- None of the complex tree-based or boosted ensembles exceed the naive Stratified Baseline in balanced accuracy or Macro F1.

### 2.3 Feature Separability & Mutual Information
When post-accident information (`casualties`, `cause`, `risk_score`) is properly quarantined:
- Ambient temperature, traffic signals, road lanes, hour of day, and weather conditions share virtually zero mutual information with the final crash severity.
- Physical factors that actually dictate crash severity—such as seatbelt/helmet compliance, collision delta-V (speed change at impact), vehicular mass differential, airbag deployment, structural intrusion, and occupant age—are absent from the dataset.

---

## 3. Spatial Generalization: Leave-One-City-Out (LOCO) Cross-Validation

To test whether models can generalize to unseen geographic territories, we evaluated models across all 8 metropolitan centers by training on 7 cities and evaluating on the held-out city.

| Held-Out City | Evaluated Records | Accuracy | Balanced Accuracy | Macro F1 | Fatal Recall |
|---|---|---|---|---|---|
| **Bangalore** | 1,487 | 0.4217 | 0.3284 | 0.3269 | 0.0882 |
| **Chandigarh** | 1,570 | 0.4287 | 0.3301 | 0.3292 | 0.0917 |
| **Chennai** | 1,571 | 0.4252 | 0.3275 | 0.3259 | 0.0854 |
| **Delhi** | 1,484 | 0.4299 | 0.3312 | 0.3301 | 0.0921 |
| **Hyderabad** | 1,469 | 0.4186 | 0.3251 | 0.3238 | 0.0798 |
| **Kolkata** | 1,561 | 0.4228 | 0.3288 | 0.3274 | 0.0865 |
| **Mumbai** | 1,520 | 0.4355 | 0.3364 | 0.3352 | 0.0984 |
| **Pune** | 1,543 | 0.4161 | 0.3230 | 0.3217 | 0.0702 |
| **Average (LOCO-CV)** | **1,526** | **0.4248** | **0.3288** | **0.3275** | **0.0865** |

**Finding:** Spatial generalization drops fatal recall even further to an average of **8.65%**, confirming that city-specific coordinates and road segments do not provide transferable severity intelligence.

---

## 4. Final 2025 Holdout Set Evaluation (One-Time Verification)

Evaluated on the 1,734 holdout records from January 1 to April 15, 2025:

- **Accuracy:** 0.4487
- **Balanced Accuracy:** 0.3379
- **Macro F1:** 0.3366
- **Weighted F1:** 0.4404
- **Fatal Recall:** 0.1069 (28 detected out of 262)

### Confusion Matrix (2025 Holdout):
```text
                  Predicted Fatal    Predicted Major    Predicted Minor
Actual Fatal            28                 82                152
Actual Major            54                140                295
Actual Minor           135                238                610
```

---

## 5. Defensible Operational Recommendation

1. **Retain the Severity Predictor as "Experimental Prototype Only":**
   - In accordance with Phase G & J, the predictive model is included in the dashboard solely as an educational demonstration with prominent transparency notices.
2. **Elevate Geospatial & Descriptive Intelligence:**
   - The primary operational value of AccidentVision AI resides in identifying spatial accident hotspots, high-collision intersections, temporal concentration windows (peak commute vs night), and road geometry distributions.

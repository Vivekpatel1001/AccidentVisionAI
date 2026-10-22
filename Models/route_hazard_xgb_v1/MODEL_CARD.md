# Model Card — AccidentVision AI Corridor Hazard Model (`route_hazard_xgb_v1`)

## 1. Model Summary
- **Architecture:** Tuned Extreme Gradient Boosting (`XGBClassifier`)
- **Objective:** Road corridor collision hazard classification (Safe Corridor vs High-Hazard Collision Blackspot)
- **Data Enrichment:** Integrated real 1-km WorldPop demographic density raster + OpenStreetMap highway design speeds + spatial collision density.
- **Validation Accuracy (2024, N=6,061):** **87.79%** (ROC-AUC = 0.9542)
- **Holdout Accuracy (2025, N=1,734):** **88.64%** (ROC-AUC = 0.9609)

## 2. Benchmark Comparison on 2024 Validation Data

| Model Architecture | Accuracy | ROC-AUC | F1-Score | Balanced Accuracy |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest** | 86.04% | 0.9415 | 0.7956 | 83.76% |
| **CatBoost Classifier** | 86.55% | 0.9483 | 0.8094 | 85.02% |
| **XGBoost Classifier (Champion)** | **87.79%** | **0.9542** | **0.8273** | **86.40%** |

## 3. Real Trusted Data Provenance
1. **WorldPop Global Demographic Archive:** High-resolution spatial demographic counts from WorldPop (University of Southampton / UK Aid).
2. **OpenStreetMap Highway Network:** Real highway geometry, lane counts, and junction markers.
3. **IRC:73 / IRC:86 Design Physics:** Physical operating speed limits and kinetic energy thresholds.

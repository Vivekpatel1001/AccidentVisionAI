# Model Card — AccidentVision AI Corridor Hazard Model (`route_hazard_xgb_v1`)

## 1. Model Summary
- **Architecture:** Tuned Extreme Gradient Boosting (`XGBClassifier`)
- **Objective:** Road corridor collision hazard classification (Safe Corridor vs High-Hazard Collision Blackspot)
- **Data Enrichment:** Integrated real 1-km WorldPop demographic density raster + OpenStreetMap highway design speeds + spatial collision density.
- **Validation Accuracy (2024, N=6,061):** **77.46%** (ROC-AUC = 0.8317)
- **Holdout Accuracy (2025, N=1,734):** **79.76%** (ROC-AUC = 0.8591)

## 2. Benchmark Comparison on 2024 Validation Data

| Model Architecture | Accuracy | ROC-AUC | F1-Score | Balanced Accuracy |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest** | 73.22% | 0.7391 | 0.4530 | 63.10% |
| **CatBoost Classifier** | 73.27% | 0.7787 | 0.5353 | 66.54% |
| **XGBoost Classifier (Champion)** | **77.46%** | **0.8317** | **0.6235** | **72.24%** |

## 3. Real Trusted Data Provenance
1. **WorldPop Global Demographic Archive:** High-resolution spatial demographic counts from WorldPop (University of Southampton / UK Aid).
2. **OpenStreetMap Highway Network:** Real highway geometry, lane counts, and junction markers.
3. **IRC:73 / IRC:86 Design Physics:** Physical operating speed limits and kinetic energy thresholds.

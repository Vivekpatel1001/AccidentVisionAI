# AccidentVision AI — Data Provenance, Quality & Leakage Audit Report

**Audit Date:** 2026-10-18  
**Dataset Under Review:** `Data/accident_master_osm.csv` (20,000 records, 28 columns) & `Data/Accidents/indian_roads_dataset.csv` (20,000 records, 24 columns)  
**Lead Auditor:** Senior Data Scientist & Geospatial ML Engineer  
**Status:** Audit Completed & Scientifically Defensible  

---

## 1. Executive Summary

This rigorous audit examines the integrity, provenance, coverage, and potential leakage of the datasets provided for **AccidentVision AI**. 

Key findings:
1. **Source Authenticity:** The 20,000 records originate from the public repository `Aditya2213/INDIAN_ROAD_ACCIDENT_DATASET_DASHBOARD`. While structurally coherent with valid coordinates and chronological timestamps, individual police crash-level records cannot be independently verified against Ministry of Road Transport and Highways (MoRTH) FIR numbers. It is therefore classified as an **unverified benchmark research dataset**.
2. **Post-Accident Outcome Leakage:** `casualties`, `cause`, `vehicles_involved`, and `risk_score` represent post-event facts or outcome-derived indices. Specifically, `risk_score` possesses only 18 discrete values and is strongly correlated with fatal outcomes. Including them in pre-accident prediction creates fatal data leakage.
3. **Severe Casualty Inconsistency:** 4,925 records in the dataset have **0 casualties** (3,200 minor, 1,725 major), whereas fatal accidents have strictly $\ge 1$ casualties (mean 3.00, range 1 to 5).
4. **Enrichment Reality:** 
   - OpenStreetMap (OSM) highway vector enrichment is present for 15,425 records, with 642 distance-to-road missing records concentrated in Mumbai.
   - ERA5 weather reanalysis and WorldPop population rasters in the `Data/` directory were **never merged into `accident_master_osm.csv`**, and weather CSVs only partially cover 2022 and North regions.
5. **Class Imbalance:** Minor accidents account for 55.1% of records, Major 29.9%, and Fatal only 14.9%.

---

## 2. Dataset Schema & Data Dictionary

| Column Name | Type | Missing Count | Missing % | Available at Prediction Time? | Leakage Risk? | Purpose / Description |
|---|---|---|---|---|---|---|
| `accident_id` | Integer | 0 | 0.0% | N/A (Identifier) | High (memorization) | Unique identifier for the crash incident. |
| `city` | Categorical | 0 | 0.0% | Yes | None | 8 major Indian metropolitan areas. |
| `state` | Categorical | 0 | 0.0% | Yes | None | State corresponding to the urban center. |
| `latitude` | Float | 0 | 0.0% | Yes | None | Geographic latitude (WGS84). Validated within city bounds. |
| `longitude` | Float | 0 | 0.0% | Yes | None | Geographic longitude (WGS84). Validated within city bounds. |
| `date` | Date (YYYY-MM-DD) | 0 | 0.0% | Yes | None | Incident date (Jan 1, 2022 to Apr 15, 2025). |
| `time` | Time (HH:MM) | 0 | 0.0% | Yes | None | Recorded time of incident. |
| `hour` | Integer (0-23) | 0 | 0.0% | Yes | None | Hour of day. |
| `day_of_week` | Categorical | 0 | 0.0% | Yes | None | Day name (Monday to Sunday). |
| `is_weekend` | Binary (0/1) | 0 | 0.0% | Yes | None | Weekend flag (Saturday/Sunday). |
| `road_type` | Categorical | 0 | 0.0% | Yes | None | Road category (`urban`, `rural`, `highway`). |
| `lanes` | Integer | 0 | 0.0% | Yes | None | Number of road lanes (1 to 6). |
| `traffic_signal` | Binary (0/1) | 0 | 0.0% | Yes | None | Presence of traffic control signal (0=No, 1=Yes). |
| `weather` | Categorical | 0 | 0.0% | Yes | None | Weather condition (`clear`, `rain`, `fog`). |
| `visibility` | Categorical | 0 | 0.0% | Yes | None | Visibility level (`low`, `medium`, `high`). |
| `temperature` | Float | 0 | 0.0% | Yes | None | Ambient temperature in Celsius. |
| `traffic_density` | Categorical | 0 | 0.0% | Yes | None | Traffic flow category (`low`, `medium`, `high`). |
| `cause` | Categorical | 0 | 0.0% | **NO (Post-Event)** | **CRITICAL** | Primary crash cause determined after accident investigation. |
| `accident_severity` | Categorical | 0 | 0.0% | **TARGET** | Target | Ground truth severity (`minor`, `major`, `fatal`). |
| `vehicles_involved` | Integer | 0 | 0.0% | **NO (Post-Event)** | Moderate | Number of vehicles damaged/involved in collision. |
| `casualties` | Integer | 0 | 0.0% | **NO (Post-Event)** | **CRITICAL** | Count of injured/deceased individuals. |
| `is_peak_hour` | Binary (0/1) | 0 | 0.0% | Yes | None | Flag for morning/evening peak commute hours. |
| `festival` | Categorical | 19,885 | **99.43%** | Yes | None | Festival name if occurred during festival. (Virtually empty). |
| `risk_score` | Float | 0 | 0.0% | **NO (Post-Event)** | **CRITICAL** | Undocumented post-hoc score strongly correlated with fatal label. |
| `osm_highway` | Categorical | 4,575 | 22.88% | Yes | None | OpenStreetMap road classification tag. |
| `osm_road_length_m` | Float | 4,575 | 22.88% | Yes | None | OpenStreetMap segment length in meters. |
| `distance_to_road_m` | Float | 642 | 3.21% | Yes | None | Distance from crash coordinate to nearest OSM vector. |
| `road_match_quality` | Categorical | 642 | 3.21% | Yes | None | Match confidence (`Exact`, `High`, `Good`, `Medium`). |

---

## 3. Geographic Boundary Validation

All 20,000 latitude and longitude coordinates were tested against geographic bounding boxes for India and their designated metropolitan areas:
- **India Bounding Box (6°N–38°N, 68°E–98°E):** 20,000 / 20,000 records inside (0 out of bounds).
- **City Specific Bounding Boxes:**
  * Delhi (28.3°–28.9°N, 76.8°–77.4°E): 2,433 records (0 out of bounds)
  * Bangalore (12.8°–13.2°N, 77.4°–77.8°E): 2,438 records (0 out of bounds)
  * Mumbai (18.8°–19.4°N, 72.7°–73.2°E): 2,492 records (0 out of bounds)
  * Pune (18.3°–18.7°N, 73.7°–74.1°E): 2,517 records (0 out of bounds)
  * Chandigarh (30.6°–30.9°N, 76.6°–77.0°E): 2,577 records (0 out of bounds)
  * Chennai (12.8°–13.3°N, 80.0°–80.4°E): 2,575 records (0 out of bounds)
  * Hyderabad (17.2°–17.6°N, 78.2°–78.7°E): 2,409 records (0 out of bounds)
  * Kolkata (22.4°–22.8°N, 88.2°–88.6°E): 2,559 records (0 out of bounds)

**Finding:** The spatial coordinates are tightly bounded to legitimate metropolitan envelopes without swapped latitude/longitude coordinates or inverted signs.

---

## 4. Casualty & Severity Consistency Audit

An examination of casualty numbers revealed significant structural patterns:

```text
accident_severity      count      mean       std  min  25%  50%  75%  max
fatal                 2987.0  3.001674  1.416224  1.0  2.0  3.0  4.0  5.0
major                 5988.0  1.494823  1.376437  0.0  0.0  1.0  2.0  5.0
minor                11025.0  1.506757  1.390140  0.0  0.0  1.0  2.0  5.0
```

- **Zero-Casualty Crashes:**
  * Minor crashes with 0 casualties: 3,200 records (29.0%)
  * Major crashes with 0 casualties: 1,725 records (28.8%)
  * Fatal crashes with 0 casualties: **0 records (0.0%)**
- **Interpretation:** In standard road safety engineering, "casualties" is defined as any person killed or injured. If a crash has 0 injuries and 0 fatalities, designating it as "Major" suggests severe property damage. However, because fatal crashes strictly have $\ge 1$ casualties, an algorithm trained with `casualties` would instantly eliminate ~49% of candidate records from being fatal, causing severe post-event leakage.
- **Rule:** `casualties` must remain strictly quarantined from any pre-accident risk model.

---

## 5. Investigation of `risk_score`

`risk_score` contains exactly 18 distinct float values:
`[0.1, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0]`

- Fatal accidents have a mean `risk_score` of **0.608** ($\pm 0.204$).
- Major accidents have a mean `risk_score` of **0.407** ($\pm 0.206$).
- Minor accidents have a mean `risk_score` of **0.408** ($\pm 0.207$).
- The original repository provides no mathematical formula or documentation on how `risk_score` was calculated.
- **Verdict:** `risk_score` was computed post-hoc from crash characteristics and outcome labels. It cannot be defended as an input to a severity prediction system.

---

## 6. External Enrichment Audit (Weather & Population)

1. **Weather Files:**
   - 20 ERA5 `.grib` files and 23 `.csv` files exist under `Data/Weather/`.
   - `AccidentVision_Weather_2022_AllRegions.csv` contains 6,117 rows (only year 2022).
   - Years 2023 and 2024 only have North region files (`AccidentVision_North_2023_Weather.csv`, `AccidentVision_North_2024_Weather.csv`).
   - South, West, and East regions have no weather CSVs for 2023–2025.
   - Year 2025 has zero weather files.
   - **Conclusion:** Reanalysis weather was an incomplete experiment. The master dataset uses internal `temperature`, `weather`, and `visibility` columns.
2. **Population Rasters:**
   - 16 Global Human Settlement / WorldPop TIFF files exist under `Data/Population/` (2015 to 2030).
   - They were not sampled or joined to `accident_master_osm.csv`.

---

## 7. Data Preprocessing & Quarantine Strategy

To maintain strict scientific integrity:
1. **Quarantined Columns (Excluded from Pre-Accident Feature Matrix):**
   - `accident_id` (identifier)
   - `cause` (post-accident investigation)
   - `casualties` (post-accident outcome)
   - `vehicles_involved` (post-accident outcome)
   - `risk_score` (outcome-derived post-hoc index)
   - `festival` (99.4% missing)
2. **Permitted Pre-Accident Numeric Features (10):**
   - `latitude`, `longitude`, `hour`, `is_weekend`, `lanes`, `traffic_signal`, `temperature`, `is_peak_hour`, `osm_road_length_m`, `distance_to_road_m`
3. **Permitted Pre-Accident Categorical Features (8):**
   - `city`, `road_type`, `day_of_week`, `weather`, `visibility`, `traffic_density`, `osm_highway`, `road_match_quality`
4. **Target Variable:**
   - `accident_severity` (`minor`, `major`, `fatal`)

"""Geospatial analytics and hotspot clustering module for AccidentVision AI.

Implements defensible spatial aggregation, DBSCAN density clustering
(using geodesic coordinates), and road-type safety concentration analysis.
"""

from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN


def compute_spatial_grid_aggregation(
    df: pd.DataFrame,
    grid_size_deg: float = 0.01,
    lat_col: str = "latitude",
    lon_col: str = "longitude"
) -> pd.DataFrame:
    """Aggregate accidents into spatial grid cells (default ~1.1km cells).

    Returns grid cells with accident counts, severity breakdowns, and centroid coordinates.
    """
    df_valid = df.dropna(subset=[lat_col, lon_col]).copy()

    df_valid["grid_lat"] = (df_valid[lat_col] / grid_size_deg).round() * grid_size_deg
    df_valid["grid_lon"] = (df_valid[lon_col] / grid_size_deg).round() * grid_size_deg

    agg_df = df_valid.groupby(["grid_lat", "grid_lon", "city"]).agg(
        total_accidents=("accident_id", "count"),
        fatal_count=("accident_severity", lambda s: (s == "fatal").sum()),
        major_count=("accident_severity", lambda s: (s == "major").sum()),
        minor_count=("accident_severity", lambda s: (s == "minor").sum()),
        mean_temperature=("temperature", "mean") if "temperature" in df_valid.columns else ("accident_id", "count"),
        mean_road_length_m=("osm_road_length_m", "mean") if "osm_road_length_m" in df_valid.columns else ("accident_id", "count"),
    ).reset_index()

    agg_df["fatal_rate"] = agg_df["fatal_count"] / agg_df["total_accidents"]
    agg_df = agg_df.sort_values(by="total_accidents", ascending=False)

    return agg_df


def cluster_hotspots_dbscan(
    df: pd.DataFrame,
    city: Optional[str] = None,
    eps_meters: float = 500.0,
    min_samples: int = 15,
    lat_col: str = "latitude",
    lon_col: str = "longitude"
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Identify dense accident clusters using DBSCAN with haversine metric.

    Parameters
    ----------
    df : pd.DataFrame
        Accident dataset.
    city : Optional[str]
        Specific city to filter by. If None, runs on all data.
    eps_meters : float
        Radius threshold in meters.
    min_samples : int
        Minimum accident records to form a dense cluster.

    Returns
    -------
    Tuple[pd.DataFrame, pd.DataFrame]
        (Clustered accident records with cluster_id, Summary dataframe of identified hotspots)
    """
    df_city = df[df["city"] == city].copy() if city else df.copy()
    df_city = df_city.dropna(subset=[lat_col, lon_col])

    if len(df_city) < min_samples:
        df_city["cluster_id"] = -1
        return df_city, pd.DataFrame()

    # Convert coordinates to radians for haversine metric
    # Earth radius ~ 6,371,000 meters
    earth_radius_m = 6371000.0
    eps_radians = eps_meters / earth_radius_m

    coords_rad = np.radians(df_city[[lat_col, lon_col]].values)

    db = DBSCAN(eps=eps_radians, min_samples=min_samples, metric="haversine", n_jobs=-1)
    df_city["cluster_id"] = db.fit_predict(coords_rad)

    # Summarize identified dense clusters (excluding noise cluster -1)
    dense_clusters = df_city[df_city["cluster_id"] != -1]

    if len(dense_clusters) == 0:
        return df_city, pd.DataFrame()

    hotspots = dense_clusters.groupby("cluster_id").agg(
        cluster_size=("accident_id", "count"),
        center_latitude=(lat_col, "mean"),
        center_longitude=(lon_col, "mean"),
        city=("city", "first") if "city" in dense_clusters.columns else ("cluster_id", "first"),
        fatal_count=("accident_severity", lambda s: (s == "fatal").sum()),
        major_count=("accident_severity", lambda s: (s == "major").sum()),
        minor_count=("accident_severity", lambda s: (s == "minor").sum()),
        top_road_type=("road_type", lambda r: r.mode().iloc[0] if len(r) > 0 else "Unknown"),
        top_weather=("weather", lambda w: w.mode().iloc[0] if len(w) > 0 else "Unknown")
    ).reset_index()

    hotspots["fatal_percentage"] = (hotspots["fatal_count"] / hotspots["cluster_size"]) * 100.0
    hotspots = hotspots.sort_values(by="cluster_size", ascending=False)

    return df_city, hotspots


def compute_road_type_analytics(df: pd.DataFrame) -> pd.DataFrame:
    """Compute accident counts, severity rates, and road coverage across road types."""
    road_stats = df.groupby("road_type").agg(
        total_accidents=("accident_id", "count"),
        fatal_count=("accident_severity", lambda s: (s == "fatal").sum()),
        major_count=("accident_severity", lambda s: (s == "major").sum()),
        minor_count=("accident_severity", lambda s: (s == "minor").sum()),
        avg_lanes=("lanes", "mean"),
        traffic_signals=("traffic_signal", lambda ts: (ts == 1).sum() if "traffic_signal" in df.columns else 0)
    ).reset_index()

    road_stats["fatal_rate"] = road_stats["fatal_count"] / road_stats["total_accidents"]
    road_stats["major_rate"] = road_stats["major_count"] / road_stats["total_accidents"]
    road_stats["minor_rate"] = road_stats["minor_count"] / road_stats["total_accidents"]
    road_stats["pct_of_total"] = (road_stats["total_accidents"] / len(df)) * 100.0

    return road_stats.sort_values(by="total_accidents", ascending=False)

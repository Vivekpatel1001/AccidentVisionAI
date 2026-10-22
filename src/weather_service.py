"""Future Weather Intelligence Service for AccidentVision AI.

Retrieves legitimate future weather forecasts along route corridors for specified
departure dates and arrival hours using the Open-Meteo Weather API.
Provides transparent fallbacks and clearly indicates whether data is a live forecast
or seasonal historical climatology.
"""

from typing import Dict, Any, Optional
import urllib.request
import urllib.parse
import json
from datetime import datetime, date, timedelta
import pandas as pd


WMO_WEATHER_CODE_MAP = {
    0: "Clear",
    1: "Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Rainy",
    53: "Rainy",
    55: "Rainy",
    61: "Rainy",
    63: "Rainy",
    65: "Rainy",
    80: "Rainy",
    81: "Rainy",
    82: "Rainy",
    95: "Stormy"
}


def fetch_segment_weather(
    lat: float,
    lon: float,
    travel_date: str,
    travel_hour: int
) -> Dict[str, Any]:
    """Retrieve weather forecast for a road segment at a specific date and hour."""
    try:
        t_date = pd.to_datetime(travel_date).date()
        today = date.today()
        days_diff = (t_date - today).days

        # Open-Meteo 7-day forecast horizon check
        if 0 <= days_diff <= 7:
            url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={lat:.4f}&longitude={lon:.4f}&"
                f"hourly=temperature_2m,precipitation,visibility,wind_speed_10m,weather_code&"
                f"timezone=auto"
            )

            req = urllib.request.Request(
                url,
                headers={"User-Agent": "AccidentVisionAI/2.0 (Geospatial Safety System)"}
            )

            with urllib.request.urlopen(req, timeout=4) as response:
                payload = json.loads(response.read().decode())

            hourly = payload.get("hourly", {})
            times = hourly.get("time", [])

            # Target ISO time: YYYY-MM-DDTHH:00
            target_str = f"{t_date.isoformat()}T{int(travel_hour):02d}:00"

            if target_str in times:
                idx = times.index(target_str)
                temp = hourly.get("temperature_2m", [28.0])[idx]
                precip = hourly.get("precipitation", [0.0])[idx]
                vis_m = hourly.get("visibility", [10000])[idx]
                wind_kmh = hourly.get("wind_speed_10m", [12.0])[idx]
                code = hourly.get("weather_code", [0])[idx]

                vis_km = (vis_m / 1000.0) if vis_m is not None else 10.0
                condition = WMO_WEATHER_CODE_MAP.get(code, "Clear")
                if precip > 0.5:
                    condition = "Rainy"

                return {
                    "source": "Open-Meteo Live Forecast",
                    "is_real_forecast": True,
                    "condition": condition,
                    "temperature_c": round(float(temp), 1),
                    "precipitation_mm": round(float(precip), 2),
                    "visibility_km": round(float(vis_km), 1),
                    "visibility_category": "Normal" if vis_km >= 6 else ("Low" if vis_km >= 3 else "Poor"),
                    "wind_speed_kmh": round(float(wind_kmh), 1),
                    "disclaimer": "Real-time meteorological forecast for estimated segment traversal time."
                }
    except Exception as e:
        # Fallback to seasonal climate baseline on network timeout
        pass

    # Seasonal Historical Baseline Fallback
    month = pd.to_datetime(travel_date).month if travel_date else 6
    is_monsoon = month in [6, 7, 8, 9]

    return {
        "source": "Historical Seasonal Climatology (Fallback)",
        "is_real_forecast": False,
        "condition": "Rainy" if is_monsoon else "Clear",
        "temperature_c": 26.5 if is_monsoon else 29.0,
        "precipitation_mm": 5.0 if is_monsoon else 0.0,
        "visibility_km": 6.0 if is_monsoon else 9.0,
        "visibility_category": "Normal",
        "wind_speed_kmh": 15.0 if is_monsoon else 10.0,
        "disclaimer": (
            "Exceeds supported 7-day live numerical weather prediction horizon or network offline. "
            "Using historical seasonal climatology. Never treated as a live deterministic forecast."
        )
    }


if __name__ == "__main__":
    test_res = fetch_segment_weather(19.0760, 72.8777, date.today().isoformat(), 18)
    print("Weather Service Verification Output:")
    print(json.dumps(test_res, indent=2))

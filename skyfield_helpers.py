from skyfield.api import EarthSatellite, load
from math import isnan

# Original Skyfield Geolocation Processing as Backup

# Check if invalid/missing data returned
def is_nan(value):
    return value is None or (isinstance(value, float) and isnan(value))

# Use TLE data to calculate current geocentric positioning
def get_geo_data(current_LEO, timescale, current_time):
    try:
        satellite = EarthSatellite(current_LEO['TLE_LINE1'], current_LEO['TLE_LINE2'], current_LEO['OBJECT_NAME'])
        geocentric = satellite.at(current_time)
        subpoint = geocentric.subpoint()
        return {
            "latitude": subpoint.latitude.degrees,
            "longitude": subpoint.longitude.degrees,
            "altitude": subpoint.elevation.km
        }
    except Exception as e:
        print(f"Error processing ID: {current_LEO['NORAD_CAT_ID']}: {e}")
        return None

# Assess object risk based on parameters
# Bstar - Higher drag indicates lower altitude and increased rate of decay
# Periapsis - Lower altitude to earth's surface points towards potential atmospheric entry / decay. 
# Mean motion - Higher velocity results in increased potential for collision risk and severity. 
# Size - Larger objects have an increased risk and severity in collision. 
# Crowded Zone Risk - Objects in the Crowded Cluster have increased collision probability.      
def risk_assessment(obj):
    bstar = float(obj.get("BSTAR", 0))
    periapsis = float(obj.get("PERIAPSIS", 0))
    mean_motion = float(obj.get("MEAN_MOTION", 0))
    size = obj.get("RCS_SIZE", "Small")
    crowded_zone = 600 <= periapsis <= 800

    bstar_risk = 3 if bstar > 1e-3 else (2 if bstar > 1e-4 else 1)
    periapsis_risk = 3 if periapsis < 200 else (2 if periapsis <= 300 else 1)
    mean_motion_risk = 3 if mean_motion > 15.5 else (2 if mean_motion >= 15 else 1)
    size_risk = 2 if size == "Medium" else 1
    crowded_zone_risk = 2 if crowded_zone else 0

    risk_score = (
        3 * bstar_risk +
        2 * periapsis_risk +
        2 * mean_motion_risk +
        1 * size_risk +
        2 * crowded_zone_risk
    )

    return "High Risk" if risk_score >= 15 else ("Medium Risk" if risk_score >= 10 else "Low Risk")

# Process TLE data into relevant data
# Identifiers, Positioning, Orbit calibration, Risk
def aggregate_data(raw_data):
    ts = load.timescale()
    now = ts.now()
    processed_data = []

    for obj in raw_data:
        geocentric_data = get_geo_data(obj, ts, now)
        if geocentric_data and not any(is_nan(value) for value in geocentric_data.values()):
            risk_level = risk_assessment(obj)

            processed_data.append({
                "name": obj.get("OBJECT_NAME", "Unknown"),
                "NORAD_CAT_ID": obj["NORAD_CAT_ID"],
                "latitude": geocentric_data["latitude"],
                "longitude": geocentric_data["longitude"],
                "altitude": geocentric_data["altitude"],
                "mean_motion": float(obj.get("MEAN_MOTION", 0)),
                "inclination": float(obj.get("INCLINATION", 0)),
                "Priority": risk_level
            })

    return processed_data
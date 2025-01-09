import requests
import json
from dotenv import load_dotenv
from skyfield.api import EarthSatellite, load
from math import isnan
import os
import time

load_dotenv()

# Space Track credentials
USERNAME = os.getenv('SPACE_TRACK_USER')
PASSWORD = os.getenv('SPACE_TRACK_PASS')
base_url = "https://www.space-track.org"

def login():
    url = f"{base_url}/ajaxauth/login"
    payload = {
        "identity": USERNAME,
        "password": PASSWORD
    }
    session = requests.Session()
    response = session.post(url, data=payload)
    
    if response.status_code == 200:
        print("Logged in.")
        return session
    else:
        print(f"Login Error: {response.status_code}, Response: {response.text}")
        return 

def get_data(session, url):
    try:
        response = session.get(url)
        if response.status_code == 200:
            tle_latest_data = response.json()
            return tle_latest_data
        elif response.status_code == 429:  # API Throttling
            print("API OVERLOAD")
            time.sleep(60)
            return get_data(session, url)
        else:
            print(f"Failed to retrieve data: {response.status_code}, Response: {response.text}")
            return 
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return 

def fetch_data():
    session = login()
    if not session:
        return 

    url = "https://www.space-track.org/basicspacedata/query/class/tle_latest/APOGEE/%3C2000/DECAYED/NULL/PERIGEE//%3E160/PERIOD/88--127/OBJECT_TYPE/debris/BSTAR/%3E1e-4/orderby/BSTAR%20desc/limit/100/emptyresult/show"
    
    debris_data = get_data(session, url) 
    if debris_data is None:   
        return 
    
    return debris_data

def aggregate_data(raw_data):
    ts = load.timescale()
    now = ts.now()

    IDitto = set()
    processed_data = []

    for obj in raw_data:
        if obj['NORAD_CAT_ID'] in IDitto:
            continue
        IDitto.add(obj['NORAD_CAT_ID'])

        try:
            satellite = EarthSatellite(obj['TLE_LINE1'], obj['TLE_LINE2'], obj['OBJECT_NAME'])
            geocentric = satellite.at(now)
            subpoint = geocentric.subpoint()

            # Validate calculated fields
            if any(is_nan(value) for value in [subpoint.latitude.degrees, subpoint.longitude.degrees, subpoint.elevation.km]):
                print(f"Skipping invalid satellite data: {obj['NORAD_CAT_ID']}")
                continue

            processed_data.append({
                "name": obj.get("OBJECT_NAME", "Unknown"),
                "NORAD_CAT_ID": obj["NORAD_CAT_ID"],
                "latitude": subpoint.latitude.degrees,
                "longitude": subpoint.longitude.degrees,
                "altitude": subpoint.elevation.km,
                "mean_motion": float(obj.get("MEAN_MOTION", 0)),
                "inclination": float(obj.get("INCLINATION", 0))
            })
        except Exception as e:
            print(f"Error processing NORAD_CAT_ID {obj['NORAD_CAT_ID']}: {e}")
            continue

    return processed_data

def is_nan(value):
    return value is None or (isinstance(value, float) and isnan(value))
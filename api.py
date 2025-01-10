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

#Query
QUERY_URL = os.getenv('TEST_QUERY_URL')

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

    url = QUERY_URL
    
    debris_data = get_data(session, url) 
    if debris_data is None:   
        return 
    
    return debris_data

def is_nan(value):
    return value is None or (isinstance(value, float) and isnan(value))

def filter_data(raw_data):
    unique_data = []
    IDitto = set()
    for obj in raw_data:
         if obj['NORAD_CAT_ID'] not in IDitto:
             IDitto.add(obj['NORAD_CAT_ID'])
             unique_data.append(obj)
    return unique_data

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

def process_data(filtered_data):
    ts = load.timescale()
    now = ts.now()
    processed_data = []

    for obj in filtered_data:
        geocentric_data = get_geo_data(obj, ts, now)
        if geocentric_data and not any(is_nan(value) for value in geocentric_data.values()):
            processed_data.append({
                "name": obj.get("OBJECT_NAME", "Unknown"),
                "NORAD_CAT_ID": obj["NORAD_CAT_ID"],
                "latitude": geocentric_data["latitude"],
                "longitude": geocentric_data["longitude"],
                "altitude": geocentric_data["altitude"],
                "mean_motion": float(obj.get("MEAN_MOTION", 0)),
                "inclination": float(obj.get("INCLINATION", 0))
            })
    
    return processed_data

def aggregate_data(raw_data):
    filtered_data = filter_data(raw_data)
    processed_data = process_data(filtered_data)
    return processed_data


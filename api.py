import requests
import json
from dotenv import load_dotenv
import os
import time

load_dotenv()

# Space Track API Integration to fetch TLE data for LEOs 

# Space Track credentials
USERNAME = os.getenv('SPACE_TRACK_USER')
PASSWORD = os.getenv('SPACE_TRACK_PASS')
base_url = "https://www.space-track.org"

# Query
QUERY_URL = os.getenv('GP_QUERY_URL')

# Login to Space-Track
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

# Perform API request
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

# Verify login
# Pass Query and Session to fetch API data
def fetch_data():
    session = login()
    if not session:
        return 

    url = QUERY_URL
    
    debris_data = get_data(session, url) 
    if debris_data is None:   
        return 
    
    return debris_data

# Process TLE data containing 
# TLE_0 - Contains object Name and Unique NORAD CAT ID
# TLE_1 - Contains object metadata (ID, EPOCH, BStar/Drag)
# TLE_2 - Contains orbital parameters (Inclination, RAAN/Equator Crossing, Eccentricity/Shape of orbit, Perigee/Altitude, Mean Motion/ Orbits per day)
def test_data(raw_data):
    tle_data = []
    for obj in raw_data:
        tle_data.append({
            "tle0": obj.get("TLE_LINE0", "Unknown"),
            "tle1": obj.get("TLE_LINE1", "Unknown"),
            "tle2": obj.get("TLE_LINE2", "Unknown")
        })
    return tle_data




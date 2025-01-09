import requests
from dotenv import load_dotenv
import pandas as pd
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
            return response.json()
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

def aggregate_data():
    session = login()
    if not session:
        return 

    url = "https://www.space-track.org/basicspacedata/query/class/tle_latest/APOGEE/%3C2000/DECAYED/NULL/PERIGEE//%3E160/PERIOD/88--127/OBJECT_TYPE/debris/BSTAR/%3E1e-4/orderby/BSTAR%20desc/limit/200/format/csv/emptyresult/show"
    
    raw_data = get_data(session, url)

    if not raw_data:
        return 

    processed_data = []
    for obj in raw_data:
        try:
            processed_data.append({
                "name": obj.get("OBJECT_NAME", "Unknown"),
                "type": obj.get("OBJECT_TYPE", "Unknown"),
                "apogee": float(obj.get("APOGEE", 0)),
                "perigee": float(obj.get("PERIGEE", 0)),
                "mean_motion": float(obj.get("MEAN_MOTION", 0)),
                "risk_level": "high" if float(obj.get("BSTAR", 0)) > 0.01 else "low",
                "eccentricity": float(obj.get("ECCENTRICITY", 0)),
            })

        except KeyError as e:
            print(f"Missing key {e} in object: {obj}")

    return processed_data

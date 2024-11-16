import requests
from dotenv import load_dotenv
import os

load_dotenv()

# Space Track credentials
USERNAME = os.getenv('SPACE_TRACK_USER')
PASSWORD = os.getenv('SPACE_TRACK_PASS')

def login():
    session = requests.Session()
    dataUrl = "https://www.space-track.org/ajaxauth/login"
    payload = {
        'identity': USERNAME,
        'password': PASSWORD
    }

    response = session.post(dataUrl, data=payload)

    if response.status_code == 200:
        print("Login Successful")
        return session
    else:
        print("ERROR: Failure to Login")
        return

def get_leo(session):
    if not session:
        print("ERROR: Session not Active")
        return 
    
    endpoint = "https://www.space-track.org/basicspacedata/query/class/tle_latest"

    # High-risk LEO object parameters
    params = {
        "ODRINAL": 1,
        "PERIOD": ">=88",
        "PERIOD": "<=127",
        "APOGEE": ">=160",
        "APOGEE": "<=2000",
        "PERIGEE": ">=160",
        "PERIGEE": "<=2000", 
        "DECAYED": "false",
        "FORMAT": "json",
    }

    response = session.get(endpoint)

    if response.status_code == 200:
        return response.text
    else:
        print("ERROR: Failure to retrive Data")
        return
    
    
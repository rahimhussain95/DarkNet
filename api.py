import requests
from dotenv import load_dotenv
import os

load_dotenv()

# Space Track credentials
USERNAME = os.getenv('SPACE_TRACK_USER')
PASSWORD = os.getenv('SPACE_TRACK_PASS')

def login():
    session = requests.Session()
    url = "https://www.space-track.org/ajaxauth/login"
    payload = {
        'identity': USERNAME,
        'password': PASSWORD
    }

    response = session.post(url, data=payload)

    if response.status_code == 200:
        print("Login Successful")
        return session
    else:
        print("ERROR: Failure to Login")
        return

def get_leo(session):
    
    
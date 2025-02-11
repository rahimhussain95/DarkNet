from apscheduler.schedulers.background import BackgroundScheduler
from redis_utils import update_cache
import api
import time

# API fetch scheduler to avoid API throttling, Query limits, and Reduce overhead. 

# Refresh Cache'd API data at hourly intervals
def refresh_satellite_data():
    print("Refreshing Space-Track TLE Data...")
    debris_data = api.fetch_data()
    if not debris_data:
        print("Error: Failed to retrieve data")
        return False

    aggregated_data = api.test_data(debris_data)
    if not aggregated_data:
        print("Error: Failed to process data")
        return False

    update_cache(aggregated_data)
    print("Cache updated successfully!")
    return True

scheduler = BackgroundScheduler()
scheduler.add_job(refresh_satellite_data, 'interval', hours=1) 
scheduler.start()

print("Scheduler Initiated.")

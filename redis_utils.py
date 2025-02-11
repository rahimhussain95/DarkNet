import redis
import json
import time

redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

CACHE_KEY = 'satellite_data'
CACHE_TIMESTAMP_KEY = 'satellite_data_timestamp'
CACHE_EXPIRATION = 3600  

# Cache satellite data and update as needed if outdated
def get_cached_data():
    cached_data = redis_client.get(CACHE_KEY)
    cached_timestamp = redis_client.get(CACHE_TIMESTAMP_KEY)

    if cached_data and cached_timestamp:
        age = time.time() - float(cached_timestamp)
        if age < CACHE_EXPIRATION:
            return json.loads(cached_data)
    return None

def update_cache(data):
    redis_client.set(CACHE_KEY, json.dumps(data))
    redis_client.set(CACHE_TIMESTAMP_KEY, time.time())

def check_cache():
    cached_timestamp = redis_client.get(CACHE_TIMESTAMP_KEY)
    if not cached_timestamp:
        return True
    age = time.time() - float(cached_timestamp)
    return age >= CACHE_EXPIRATION

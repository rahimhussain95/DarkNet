from flask import Flask, jsonify, redirect, render_template
import api
from redis_utils import get_cached_data, check_cache
from scheduler import refresh_satellite_data

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/sphere', methods=['GET'])
def sphereTest():
    return render_template('world.html')

@app.route('/data', methods=['GET']) 
def data_display():
    debris_data = api.fetch_data()
    if not debris_data:
        return jsonify({"ERROR": "Failed to retrieve data"}), 502
    
    data = api.test_data(debris_data)
    if not data:
        return jsonify({"Error": "Failed to retrieve data"}), 503
    
    return jsonify(data), 200

@app.route('/scheduled', methods=['GET'])
def render_satellite():
    cached_data = get_cached_data()
    if cached_data:
        return jsonify(cached_data), 200

    if check_cache():
        success = refresh_satellite_data()
        if not success:
            return jsonify({"ERROR": "Failed to retrieve or update satellite data"}), 502

    updated_data = get_cached_data()
    if not updated_data:
        return jsonify({"ERROR": "Failed to retrieve data after refresh"}), 503

    return jsonify(updated_data), 200

@app.route('/test', methods=['GET'])
def tester():
    data = api.fetch_data();
    if not data:
        return jsonify({"Couldn't get data buddy"}), 505
    
    trueData = api.test_data(data)
    
    return jsonify(trueData), 200

# @app.route('/about', methods=['GET'])
# @app.route('/cleanup)
# @app.route('/satellite', methods=['GET'])
   

if __name__ == "__main__":
    app.run(debug=True)

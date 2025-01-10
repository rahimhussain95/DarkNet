from flask import Flask, jsonify, redirect, render_template
import api

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/data', methods=['GET']) 
def data_display():
    tle_data = api.fetch_data()
    if not tle_data:
        return jsonify({"ERROR": "Failed to retrieve data"}), 502
    
    debris_data = api.aggregate_data(tle_data)
    if not debris_data:
        return jsonify({"Error": "Failed to retrieve data"}), 503
    
    return jsonify(debris_data), 200

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5002)

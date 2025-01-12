from flask import Flask, jsonify, redirect, render_template
import api

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/data', methods=['GET']) 
def data_display():
    session = api.login()
    if not session:
        return jsonify({"ERROR": "Login Failure"}), 501
    
    debris_data = api.fetch_data()
    if not debris_data:
        return jsonify({"ERROR": "Failed to retrieve data"}), 502
    
    data = api.aggregate_data(debris_data)
    if not data:
        return jsonify({"Error": "Failed to retrieve data"}), 503
    
    return jsonify(data), 200

if __name__ == "__main__":
    app.run(debug=True, port=5002)

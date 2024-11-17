from flask import Flask, jsonify, redirect, render_template, request, session
from flask_socketio import SocketIO
from datetime import datetime
import api

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def home():
    return "Flask is running!"

@app.route('/test', methods=['GET'])
def test():
    session = api.login()
    if session:
        data = api.get_leo(session)
        if data:
            return jsonify({'data': data[:5]}), 200
        else:
            return jsonify({'error': "Failed to retrieve data"}), 500
    else:
        return jsonify({'error': "Failed to login authenticate login"}), 500
    
if __name__=='__main__':
    socketio.run(app, host='0.0.0.0', port=5002, debug=True)
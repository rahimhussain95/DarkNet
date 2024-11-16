from flask import Flask, jsonify
from flask_socketio import SocketIO
import api

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    session = api.login()
    if session:
        data = api.get_leo(session)
        if data:
            return jsonify({'data': data}), 200
        else:
            return jsonify({'error': "Failed to retrieve data"}), 500
    else:
        return jsonify({'error': "Failed to login authenticate login"}), 500
    
if __name__=='__main__':
    app.run(debug=True)
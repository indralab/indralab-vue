import json
from os import path, listdir

from flask import Flask, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder='static',
            template_folder="static/display/dist")
CORS(app)

HERE = path.dirname(path.abspath(__file__))
DATA_FOLDER = path.join(HERE, 'static', 'data')


@app.route("/")
def index():
    return render_template('index.html')


@app.route('/data/<name>')
def get_data(name):
    with open(path.join(HERE, 'static/data', name + '.json'), 'r') as f:
        res = json.load(f)
    return jsonify(res)


@app.route('/listdata')
def list_stages():
    file_list = listdir(DATA_FOLDER)
    ret_list = []
    for filename in file_list:
        if not filename.endswith('.json') or filename.startswith('runtime'):
            continue
        ret_list.append(filename[:-len('.json')])
    return jsonify(ret_list)


@app.route("/hello")
def hello():
    return "Hello World!"


if __name__ == '__main__':
    app.run()


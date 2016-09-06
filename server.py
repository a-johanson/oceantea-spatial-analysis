# Copyright 2016 Arne Johanson
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import json
import os
import time
import sys

from bathymetry import importBathymetry


app = Flask(__name__, static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 120 * 1024 * 1024 # 120 MB
app.config['UPLOAD_FOLDER'] = "temp"
app.debug = False



def getBathymetryList():
	return list(map(lambda s: s[:-5], filter(lambda s: s.endswith(".json"), os.listdir("data"))))

def isAuth(headers):
	try:
		return True if "x-auth-userid" in headers and int(headers["x-auth-userid"]) >= 0 else False
	except:
		return False



@app.route("/bathymetries", methods=["GET"])
def getBathymetries():
	return jsonify(regions=getBathymetryList())


@app.route("/bathymetries/<region>", methods=["GET"])
def getSpecificBathymetry(region):
	return send_from_directory("data", "{}.json".format(region), mimetype="application/json")


@app.route("/bathymetries/<region>", methods=["DELETE"])
def deleteBathymetry(region):
	if not isAuth(request.headers):
		return jsonify(success=False, message="Forbidden"), 403

	path = os.path.join("data", secure_filename("{}.json".format(region)))
	result = False
	try:
		os.remove(path)
		result = True
	except:
		pass
	return jsonify(success=result, message="Deleted" if result else "Could not delete data"), 200 if result else 500


@app.route("/bathymetries/<region>", methods=["POST"])
def uploadBathymetry(region):
	if not isAuth(request.headers):
		return jsonify(success=False, message="Forbidden"), 403
	
	if not ("dataFile" in request.files):
		return jsonify(success=False, message="No input file provided"), 400
	
	bathyFile = request.files["dataFile"]

	result = False
	if bathyFile and not (bathyFile.filename == ""):
		try:
			fullPath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename("{}_{}".format(int(time.time()), bathyFile.filename)))
			bathyFile.save(fullPath)
			try:
				result = importBathymetry(fullPath, os.path.join("data", secure_filename("{}.json".format(region))))
			except:
				pass
			os.remove(fullPath)
		except:
			pass

	try:
		bathyFile.close()
	except:
		pass
	
	return jsonify(success=result, message="Bathymetry added" if result else "Could not parse/add input file"), 200 if result else 500




if __name__ == "__main__":
	acceptAllHosts = False
    for arg in sys.argv:
        if arg == "--acceptAllHosts":
            acceptAllHosts = True
			break
    
    app.run(host="0.0.0.0" if acceptAllHosts else "127.0.0.1", port=3338, threaded=True, use_debugger=False, use_reloader=False)

// Copyright 2016 Arne Johanson
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

try {
	process.chdir(__dirname);
}
catch(err) {
	console.log("Could not change working directory to app root");
	process.exit(1);
}

const express = require("express");
const fs = require("fs");

const appPort = 3338;
const localAddr = "127.0.0.1";


const app = express();

app.get("/bathymetries", function (req, res) {
	res.json({
		"regions": ["northern-norway"]
	});
});

app.get("/bathymetries/:region", function (req, res) {
	if(req.params.region !== "northern-norway") {
		res.status(404).send("No bathymetry data found for this region");
		return;
	}
	
	var filePath = "./data/northern-norway.json";
	var stat = fs.statSync(filePath);
	res.set("content-type", "application/json")
		.set("content-length", stat.size);

    var readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
});

app.use(express.static("./public"));

app.listen(appPort, localAddr, function () {
	console.log("Spatial analysis app listening on port " + appPort);
});

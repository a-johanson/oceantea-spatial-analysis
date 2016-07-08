try {
	process.chdir(__dirname);
}
catch(err) {
	console.log("Could not change working directory to app root");
	process.exit(1);
}

const express = require("express");

const appPort = 3330;
const localAddr = "127.0.0.1";


const app = express();

app.use(express.static("./public"));

app.listen(appPort, localAddr, function () {
	console.log("Static content app listening on port " + appPort);
});

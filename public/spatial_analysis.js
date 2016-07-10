
$(document).ready(function() {
	$.getJSON("stjernsund.json", function(data) {
		addRenderer(data);
	});
});

function colorScale(v) {
	if(v < 0.0) {
		v = 0.0;
	}
	else if(v > 1.0) {
		v = 1.0;
	}

	var colorStops = [
		[0.0,     1, 0, 1],
		[0.2,     0, 0, 1],
		[0.4,     0, 1, 1],
		[0.6,     0, 1, 0],
		[0.8,     1, 1, 0],
		[1.0,     1, 0, 0]
	];

	for(var i=1; i<colorStops.length; ++i) {
		if(colorStops[i][0] >= v) {
			var a = colorStops[i-1][0];
			var b = colorStops[i  ][0];
			var w_a = (b - v) / (b - a);
			var w_b = 1.0 - w_a;
			
			var r_a = colorStops[i-1][1];
			var r_b = colorStops[i  ][1];
			var g_a = colorStops[i-1][2];
			var g_b = colorStops[i  ][2];
			var b_a = colorStops[i-1][3];
			var b_b = colorStops[i  ][3];

			return new THREE.Color(w_a*r_a + w_b*r_b, w_a*g_a + w_b*g_b, w_a*b_a + w_b*b_b);
		}
	}

	return new THREE.Color(0, 0, 0);
}

function createGroundGeometry(model) {
	var geometry = new THREE.Geometry();

	var lon_offset = model.lon_min;
	var lat_offset = model.lat_min;
	var depth_offset = model.depth_min;
	var depth_scale = (model.depth_max - model.depth_min);

	for(var i = 0; i < model.vertices.length; ++i) {
		var lon = model.lon[model.vertices[i][0]];
		var lat = model.lat[model.vertices[i][1]];
		var depth = model.vertices[i][2];
		
		var x = lon-lon_offset;
		var y = lat-lat_offset;
		var z = depth-depth_offset;

		geometry.vertices.push(new THREE.Vector3(x,y,z));
	}
	
	for(var i = 0; i < model.faces.length; ++i) {
		geometry.faces.push(new THREE.Face3(model.faces[i][0],model.faces[i][1],model.faces[i][2]));
		var f = geometry.faces[geometry.faces.length-1];
		for(var j = 0; j < 3; ++j) {
			var p = geometry.vertices[model.faces[i][j]];
			var depth_norm = p.z / depth_scale;
			f.vertexColors[j] = colorScale(depth_norm);
		}
	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	return geometry;
}

var controls, scene, camera, renderer;

function addRenderer(model) {
	var width  = window.innerWidth,
		height = window.innerHeight;

	scene = new THREE.Scene();

	var axes = new THREE.AxisHelper(200);
	scene.add(axes);

	camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
	camera.position.set(0, -50, 50);

	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(width, height);
	renderer.setClearColor( 0xFFFFFF );

	var groundGeom = createGroundGeometry(model);

	var lon_offset = model.lon_min;
	var lon_scale = model.lon_max - model.lon_min;

	var lat_offset = model.lat_min;
	var lat_scale = model.lat_max - model.lat_min;

	var depth_offset = model.depth_min;
	var depth_scale = (model.depth_max - model.depth_min);// * (lon_scale * degreesLatInMeters);

	var materials = [
		new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } )
		//new THREE.MeshPhongMaterial( { vertexColors: THREE.VertexColors } ),
		//new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, wireframeLinewidth: 1} )
	];

	var groundGroup = THREE.SceneUtils.createMultiMaterialObject(groundGeom, materials);
	groundGroup.scale.x = 100.0/lon_scale;
	groundGroup.scale.y = 100.0/lat_scale;
	groundGroup.scale.z = 100.0/depth_scale;
	scene.add(groundGroup);

	//var ambientLight = new THREE.AmbientLight( 0xD0D0D0 );
	//scene.add(ambientLight);
	//var sunLight = new THREE.PointLight( 0x0000ff, 100, 0);
	//var sphere = new THREE.SphereGeometry( 0.5, 16, 8 );
	//sunLight.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) );
	//sunLight.position.x = -50;
	//sunLight.position.y = 150;
	//sunLight.position.z = 250;
	//scene.add( sunLight );

	controls = new THREE.TrackballControls(camera);

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	document.getElementById("webgl").appendChild(renderer.domElement);

	render();
}

function render() {
	controls.update();    
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}

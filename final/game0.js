/*
Game
This is a ThreeJS program which implements a simple game
The user flies a bird through the sky
*/
	// First we declare the variables that hold the objects we need
	// in the animation code
	var scene, renderer;  // all threejs programs need these
	var camera, avatarCam, edgeCam;  // we have two cameras in the main scene
	var avatar; var dove; var building;
	// here are some mesh objects ...

	// var controls =
	//      {fwd:false, bwd:false, left:false, right:false,
	// 			speed:10, fly:false, reset:false,
	// 	    camera:camera}

	var gameState =
	     {scene:'main', camera:'none' }

  	init(); //
	initControls();
	animate();  // start the animation loop!

	function init(){
   		initPhysijs();
		initScene();
		initRenderer();
		createMainScene();
	}

	function initPhysijs() {
   		Physijs.scripts.worker = '/js/physijs_worker.js';
    		Physijs.scripts.ammo = '/js/ammo.js';
  	}

	function initScene(){
    scene = new Physijs.Scene();
	}

	function initRenderer() {
		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight - 50 );
		document.body.appendChild( renderer.domElement );
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	}

	function createMainScene(){
		setEnvironment();
		setLights();
		setMusic();
		setCameras();
		setFlightCamera();
	}

	function setEnvironment() {
		var skybox = createSkyBall( 'sky_texture.png' );
		var ground = createGround( 'ground.png' );
		var sun = createSun();

		addCoins( 10 );
		addClouds( 10 );
		addBuilding( 20 );

		scene.add( skybox );
		scene.add( ground );
		scene.add( sun );
	}

	function setLights() {
		var ambientLight = new THREE.AmbientLight( 0xffffff, 0.25 );
		var pointLight1 = createPointLight();
		pointLight1.position.set( 0, 200, 20 );

		scene.add( ambientLight );
		scene.add( pointLight1 );
	}

	function setMusic() {
		//playGameMusic();
	}

	function setCameras() {
		// do we need this camera? Should we delete it?
		// camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
		// camera.position.set(0,50,0);
		// camera.lookAt(0,0,0);

		edgeCam = new THREE.PerspectiveCamera( 120, window.innerWidth / window.innerHeight, 0.1, 1000 );
		edgeCam.position.set(20,20,10);
	}

	function setFlightCamera() {
		flightCamera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
		flightCamera.position.set(0, 6 , -15);
		flightCamera.lookAt(0,0,0);

		flightControls = new THREE.FlyControls( flightCamera );
		flightControls.movementSpeed = 10;
		flightControls.rollSpeed = Math.PI / 24;
		flightControls.autoForward = true;
		flightControls.dragToLook = false;

		gameState.camera = flightCamera;
		scene.add(flightCamera);

		addDove();
	}

	function randN( n ) {
		return Math.random() * n;
	}

	function createSkyBall(image){
		var geometry = new THREE.SphereGeometry(160, 160, 160);
		var texture = new THREE.TextureLoader().load( '../images/' + image);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		var material = new THREE.MeshLambertMaterial({ color: 0xffffff,  map: texture ,side:THREE.DoubleSide});
		var mesh = new THREE.Mesh( geometry, material, 0 );
		mesh.receiveShadow = false;

		return mesh
	}

	function createGround(image) {
		var geometry = new THREE.PlaneGeometry( 360, 360, 256 );
		var texture = new THREE.TextureLoader().load( '../images/' + image );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 15, 15 );
		var material = new THREE.MeshLambertMaterial( { color: 0xffffff, map: texture, side: THREE.DoubleSide } );
		var pmaterial = new Physijs.createMaterial( material, 0.9, 0.5 );
		var mesh = new Physijs.BoxMesh( geometry, pmaterial, 0 );
		mesh.receiveShadow = true;
		mesh.rotateX( Math.PI / 2 );

		return mesh;
	}

	function createSun(){
		var geometry = new THREE.SphereGeometry( 5, 10, 10 );
		var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.set( 20, 150, 10 );

		return mesh;
	}

	function createPointLight() {
		var light;
		light = new THREE.PointLight( 0xffffff );
		light.castShadow = true;
		light.shadow.mapSize.width = 2048;  // default
		light.shadow.mapSize.height = 2048; // default
		light.shadow.camera.near = 0.5;       // default
		light.shadow.camera.far = 500      // default

		return light;
	}

	function createCoin() {
		var geometry = new THREE.TorusGeometry( 1, 0.2, 32, 32 );
		var material = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
		var pmaterial = new Physijs.createMaterial( material, 0.9, 0.95 );
   		var mesh = new Physijs.BoxMesh( geometry, pmaterial, 0 );
		mesh.setDamping( 0.1, 0.1 );
		mesh.castShadow = true;

		return mesh;
	}

	function addCoins( n ) {
		for(i=0; i <= n; i++) {
			var coin = createCoin();
			coin.position.set( randN(160) - 80, 30, randN(160) - 80 );
			scene.add( coin );

			coin.addEventListener( 'collision',
				function( other_object, relative_velocity, relative_rotation, contact_normal ) {
					if ( other_object == avatar ) {
						this.position.y = this.position.y - 100;
						this.__dirtyPosition = true;
					}
				}
			)
		}
	}

	function addClouds( n ) {
		var loader = new THREE.OBJLoader();
		loader.load( "../models/cloud.obj" ,
			function ( obj ) {
				console.log("loading cloud file");
				console.dir(obj);
				cloud = obj;

				var geometry = cloud.children[0].geometry;
				var material = new THREE.MeshLambertMaterial( { color: 0x1e90ff } );


				for(i = 0; i < n; i++) {
					cloud = new Physijs.BoxMesh( geometry, material, 0 );
					cloud.position.set( randN( 160 ) -80, 40, randN( 160 ) - 80 );
					scene.add( cloud );

					cloud.addEventListener( 'collision',
						function( other_object, relative_velocity, relative_rotation, contact_normal ) {
							if ( other_object == avatar ) {
								this.position.y = this.position.y - 100;
								this.__dirtyPosition = true;
							}
						}
					)
				}
				cloud.castShadow = true;
				cloud.material.color.b = 2;

				console.log( "just added cloud" );
			},

			function( xhr ) {
				console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},

			function( err ) {
				console.log( "error in loading: " + err );
			}
		)
	}
	function addBuilding( n ) {
		var loader = new THREE.OBJLoader();
		loader.load( "../models/2.obj" ,
			function ( obj ) {
				console.log("loading building file");
				console.dir(obj);
				building = obj;

				var texture = new THREE.TextureLoader().load( '../images/skyscraper.jpg' );
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set( 2, 2 );
				var geometry = building.children[0].geometry;
				var material = new THREE.MeshLambertMaterial( { map: texture } );

				for(i = 0; i < n; i++) {
					building = new Physijs.BoxMesh( geometry, material, 0 );
					building.position.set( randN( 160 ) -80, 0, randN( 160 ) - 80 );
					scene.add( building );


				}
				//building.material.color.b = 2;

				console.log( "just added buildings" );
			},

			function( xhr ) {
				console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},

			function( err ) {
				console.log( "error in loading: " + err );
			}
		)
	}

	function addDove() {
		var loader = new THREE.OBJLoader();
		loader.load( "../models/dove.obj",
		function ( obj ) {
			console.log( "loading dove.obj file" );

			var geometry = obj.children[1].geometry;
			var material = obj.children[1].material;
			dove = new Physijs.BoxMesh( geometry, material );

			dove.position.set( -40, 20, -40 );
			dove.castShadow = false;
			scene.add( dove );
			avatar = dove;

			console.log( "dove has been added" );
		},

		function( xhr ) {
			console.log( ( xhr.loaded / xhr.total * 100) + '% loaded' );
		},

		function( err ) {
			console.log( "error in loading: " + err );
		}
		)
	}

	var clock;

	function initControls() {
		// here is where we create the eventListeners to respond to operations
		//create a clock for the time-based animation ...
		clock = new THREE.Clock();
		clock.start();

		//window.addEventListener( 'keydown', keydown );
		//window.addEventListener( 'keyup',   keyup );
  }

	// function keydown( event ){
	// 	console.log( "Keydown:" + event.key );
	//
	// 	switch ( event.key ) {
	// 		case "1": gameState.camera = camera; break;
	// 		case "2": gameState.camera = avatarCam; break;
	// 	}
	// }

	// function keyup( event ) {
	// 	switch ( event.key ){
	//
	// 	}
	// }

	function animate() {
		var delta = clock.getDelta();
		flightControls.update(delta);

		if ( dove && flightCamera ) {
			flightCamera.add( dove );
			dove.position.set( 0, -4, -6 );
			dove.lookAt( 0, 0, -20 );
		}

		requestAnimationFrame( animate );
		switch(gameState.scene) {
			case "start":
				renderer.render(startScene, startCamera);
				break;
			case "youwon":
				renderer.render( endScene, endCamera );
				break;
			case "youlose":
				renderer.render( loseScene, loseCamera );
				break;

			case "main":
				if (avatar) {
					edgeCam.lookAt(avatar.position);
	    		scene.simulate();
				}
				if (gameState.camera!= 'none'){
					renderer.render( scene, gameState.camera );
				}
				break;

			default:
			  console.log("don't know the scene "+gameState.scene);
		}
	}

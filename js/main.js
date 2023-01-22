import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { TWEEN } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js'

import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const degsToRad = 0.01745329;
const renderer = new THREE.WebGLRenderer();
const textureLoader = new THREE.TextureLoader();

const ttfLoader = new TTFLoader();
const fontLoader = new FontLoader();
const gltfLoader = new GLTFLoader();

const raycastLayer = 3;

const options = {
  angle: 1,
  x: 0,
  y: 0,
  z: 0,
  intensity: 1,
  distance: 1000,
  color: '#00ff00'
};

const gui = new dat.GUI();

gui.addColor(options, 'color').onChange(function (e) {
  var colorValue = e.replace('#', '0x');
  //create a Color

  spotlight.color.set(e);
})

gui.add(options, 'x').onChange(function (e) {
  spotlight.position.x = e;
});
gui.add(options, 'y').onChange(function (e) {
  spotlight.position.y = e;
});

gui.add(options, 'z').onChange(function (e) {
  spotlight.position.z = e;
});
gui.add(options, 'intensity').onChange(function (e) {
  spotlight.intensity = e;
});

gui.add(options, 'distance').onChange(function (e) {
  spotlight.distance = e;
});


gui.add(options, 'angle').onChange(function (e) {
  spotlight.angle = e * degsToRad;
});

var font = null;

fontLoader.load('/js/three/fonts/helvetiker_regular.typeface.json', function (loadedFont) {
  font = loadedFont;
});

/*ttfLoader.load("/assets/fonts/cop.ttf", (fnt) => {
  font = fontLoader.parse(fnt);
});
*/
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.gammaOutput = true;
renderer.gammaFactor = 2.2;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new FirstPersonControls(camera, renderer.domElement);
controls.enabled = false;
const raycaster = new THREE.Raycaster();
raycaster.layers.set(raycastLayer);
const mouse = new THREE.Vector2();

var loadBarrier = 0;

var barrierActions = [];

function AddLoadBarrier() {
  loadBarrier++;
}

function RemoveLoadBarrier() {
  loadBarrier--;

  if (loadBarrier <= 0) {
    loadBarrier = 0;


    barrierActions.forEach(action => {
      action.execute();
    });

    barrierActions = [];
  }

}

function onMouseMove(event) {

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function pick() {
  raycaster.setFromCamera(mouse, camera);
  const intersect = raycaster.intersectObjects(scene.children);

  for (let i = 0; i < intersect.length; i++) {
    console.log("Raycast: " + intersect[i].object.name);

    if (intersect[i].object.callbackAction != null)
      intersect[i].object.callbackAction.execute();


    //Remove this return to get all objects in line
    return;
  }
}

function onClick() {
  pick();
}

function init() {
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('click', onClick);
}

function addPickListener(objectName, caller, callbackAction, includeChildren) {


  barrierActions.push(new CallbackAction
    (null, function () {

      var pickObject = scene.getObjectByName(objectName, true);

      if (pickObject != null) {
        pickObject.layers.enable(raycastLayer);
        pickObject.callbackAction = new CallbackAction(caller, callbackAction);

      } else {
        console.log("Error when finding " + objectName);
      }
    }))

}


window.onload = init();

var gameObjects = [];

//scene.add(cube);


class Component {
  constructor(gameObject) {
    this.gameObject = gameObject;
  }

  update() {

  }
}

class GameObject {
  constructor(parent, name) {

    if (parent == null || parent == undefined) console.log("Dont Forget Parent in gameObject!");
    if (name == null || name == undefined) console.log("Dont Forget Name in gameObject!")

    this.name = name;
    this.components = [];
    this.transform = new THREE.Object3D();
    this.model = null;

    parent.add(this.transform);
    gameObjects.push(this);
  }
  addComponent(ComponentType, ...args) {
    const component = new ComponentType(this, ...args);
    this.components.push(component);
    return component;
  }
  removeComponent(component) {
    removeArrayElement(this.components, component);
  }
  getComponent(ComponentType) {
    return this.components.find(c => c instanceof ComponentType);
  }
  update(deltaTime) {
    for (const component of this.components) {
      component.update(deltaTime);
    }
  }
}

class MeshRenderer extends Component {
  constructor(gameObject, modelName, loadCallback, addToBarrier = true) {
    super(gameObject);

    this.modelName = modelName;
    this.gameObject = gameObject;
    this.addedToBarrier = addToBarrier;


    if (addToBarrier) {
      AddLoadBarrier();
      this.loadModel(modelName, this, gameObject, loadCallback);
    }
  }

  loadModel(modelName, renderer, caller, loadCallback) {
    gltfLoader.load('../models/' + modelName, function (gltf) {

      renderer.model = gltf;
      renderer.model.animRoot = SkeletonUtils.clone(renderer.model.scene);
      renderer.mixer = new THREE.AnimationMixer(renderer.animRoot);

      renderer.gameObject.transform.add(renderer.model.animRoot);

      gltf.scene.castShadow = true;
      gltf.scene.receiveShadow = true;

      if (renderer.addedToBarrier == true)
        RemoveLoadBarrier();

      if (loadCallback != null)
        loadCallback(caller);

    }, undefined, function (error) {

      console.error(error);

    });
  }

  playAnimation(animationName) {
    var mixer = this.mixer;
    var clips = this.model.animations;

    return;

    var clip = THREE.AnimationClip.findByName(clips, animationName);

    if (clip != undefined) {
      var action = mixer.clipAction(clip);
      action.play();
    }
  }

  update() {

  }
}

class SkinnedMeshRenderer extends Component{
  constructor(gameObject, modelName, loadCallback, addToBarrier = true) {
    super(gameObject);

    this.modelName = modelName;
    this.gameObject = gameObject;
    this.addedToBarrier = addToBarrier;


    if (addToBarrier) {
      AddLoadBarrier();
      this.loadModel(modelName, this, gameObject, loadCallback);
    }
  }

  loadModel(modelName, renderer, caller, loadCallback) {
    gltfLoader.load('../models/' + modelName, function (gltf) {

      renderer.model = gltf;
      renderer.model.animRoot = SkeletonUtils.clone(renderer.model.scene);
      renderer.mixer = new THREE.AnimationMixer(renderer.animRoot);

      renderer.gameObject.transform.add(renderer.model.animRoot);

      gltf.scene.castShadow = true;
      gltf.scene.receiveShadow = true;

      if (renderer.addedToBarrier == true)
        RemoveLoadBarrier();

      if (loadCallback != null)
        loadCallback(caller);

    }, undefined, function (error) {

      console.error(error);

    });
  }

  playAnimation(animationName) {
    var mixer = this.mixer;
    var clips = this.model.animations;


    return;
    var clip = THREE.AnimationClip.findByName(clips, animationName);

    if (clip != undefined) {
      var action = mixer.clipAction(clip);
      action.play();
    }
  }

  update() {

  }
}

var done = false;

class CallbackAction {
  constructor(caller, callback) {
    this.caller = caller;
    this.callback = callback;
  }

  execute() {
    this.callback(this.caller);
  }

}



class CameraPositioner extends GameObject {

  constructor(parent, name) {
    super(parent, name);

    this.startPosition = new THREE.Vector3(-3, 3.25, 11);
    this.startLookAt = new THREE.Vector3(0, -20 * degsToRad, 0);

    this.paperPosition = new THREE.Vector3(-2, 3.25, 11);
    this.paperLookAt = new THREE.Vector3(-40 * degsToRad, -35 * degsToRad, -40 * degsToRad);

    this.currentPosTween;
    this.currentRotTween;

    this.currentLookAt = new THREE.Vector3();

    barrierActions.push(new CallbackAction(this, function (caller) {
      caller.paperLookAt = scene.getObjectByName("ReportLookAt", true).position;
      caller.paperPosition = scene.getObjectByName("ReportCameraPosition", true).position;

    }));

  }

  goToStart(duration = 500) {
    this.moveCamera(this.startPosition, this.startLookAt, duration);
  }

  goToPaper(duration = 500) {
    this.moveCamera(this.paperPosition, this.paperLookAt, duration);
  }

  moveCamera(targetPos, targetLookAt, duration) {
    if (this.currentPosTween != null && this.currentPosTween != undefined)
      this.currentPosTween.stop();

    this.currentPosTween = new TWEEN.Tween(camera.position)
      .to({
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z
      }, duration)
      .delay(250)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

    if (this.currentRotTween != null && this.currentRotTween != undefined)
      this.currentRotTween.stop();

    this.currentRotTween = new TWEEN.Tween(this.currentLookAt)
      .to({
        x: targetLookAt.x,
        y: targetLookAt.y,
        z: targetLookAt.z
      }, duration)
      .delay(250)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

  }

  update(deltaTime) {
    super.update(deltaTime)

    controls.lookAt(this.currentLookAt);
  }

}

class ReportPage {

  constructor(name, imageName, showcase1, showcase2, showcase3, text) {
    this.name = name;
    this.imagePath = imageName;
    this.showcases = [textureLoader.load("/textures/" + showcase1), textureLoader.load("/textures/" + showcase2), textureLoader.load("/textures/" + showcase3)];

    this.text = text.split('\n');
    this.texture = textureLoader.load("/textures/" + this.imagePath);
  }

}

class Report extends GameObject {
  constructor(parent, name) {
    super(parent, name);
    this.pages = [];
    this.currentPage = 0;

    this.pages.push(new ReportPage("003", "003.png", "003.png", "003.png", "003.png", "Scary Game consisting in \nescaping a hideous bunker with a\n terrible threat!"));
    this.pages.push(new ReportPage("Holobots", "holobots.png", "holobots.png", "holobots.png", "holobots.png", "XCOM like game where\nrobots pelean a\n todo trapo!"));

    this.geometry = null;
    this.material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

    this.opened = false;



    this.meshRenderer = new MeshRenderer(this, "book.glb", function (caller) {

      caller.picture = scene.getObjectByName("MainPicture", true);
      caller.leftReport = scene.getObjectByName("LeftReportText", true);
      caller.leftArrow = scene.getObjectByName("LeftArrow", true);
      caller.rightArrow = scene.getObjectByName("RightArrow", true);

      //caller.hideArrows();

      caller.showcasePictures = [];
      caller.showcasePictures.push(scene.getObjectByName("ShowCasePicture1"));
      caller.showcasePictures.push(scene.getObjectByName("ShowCasePicture2"));
      caller.showcasePictures.push(scene.getObjectByName("ShowCasePicture3"));
    });

    barrierActions.push(new CallbackAction(this, function (caller) {
      caller.book = scene.getObjectByName("ReportBook");
      var bookPosition = scene.getObjectByName("ReportBookPosition").position;

      caller.book.position.x = bookPosition.x;
      caller.book.position.y = bookPosition.y;
      caller.book.position.z = bookPosition.z;

      caller.meshRenderer.playAnimation("Open");
    }));

    addPickListener("LeftReport", this, function (caller) {
      if (done == false) {
        done = true;
        cameraPositioner.goToPaper(1000);
        caller.next();
        caller.open();
      } else {
        done = false;
        cameraPositioner.goToStart(1000);
        caller.close();
      }
    });


    addPickListener("RightArrow", this,
      (this, function (caller) {
        caller.next();
      }));

    addPickListener("LeftArrow", this, (this, function (caller) {
      caller.previous();

    }));

  }

  open() {
    this.opened = true;

    this.showArrows();
  }

  close() {
    this.opened = false;

    this.hideArrows();
  }

  next() {
    if (this.opened == false) return;
    if (this.currentPage < (this.pages.length - 1)) {
      this.currentPage++;

      this.displayPage(this.pages[this.currentPage]);
    }

  }

  previous() {
    if (this.opened == false) return;

    if (this.currentPage > 0) {
      this.currentPage--;

      this.displayPage(this.pages[this.currentPage]);
    }
  }

  hideArrows() {
    this.leftArrow.visible = false;
    this.rightArrow.visible = false;
  }


  showArrows() {
    this.leftArrow.visible = true;
    this.rightArrow.visible = true;
  }

  displayPage(page) {
    console.log("Displaying " + page.name);

    var material = new THREE.MeshStandardMaterial();
    material.map = page.texture;
    this.picture.material = material;


    for (var i = 0; i < this.showcasePictures.length; i++) {
      material.map = page.showcases[i];
      this.showcasePictures[i].material = material;
    }


    canvas.width = canvas.height = 256;

    var textHeight = 100;
    var textWidth = 100;
    var lineheight = 32;

    var xOffset = 0;
    var yOffset = 20;

    // draw/fill the circle
    ctx.beginPath();
    ctx.arc(1000, 1000, 1000, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();

    // draw the number
    ctx.fillStyle = 'black';
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < page.text.length; i++) {
      ctx.fillText(page.text[i], xOffset, yOffset + (i * lineheight));
    }

    this.leftReport.material = new THREE.MeshBasicMaterial({ transparent: true, map: new THREE.CanvasTexture(canvas) });

  }
}

class Lamp extends GameObject {

  constructor(parent, name) {
    super(parent, name);



    this.spotlight = new THREE.SpotLight(0xffff00);
    this.spotlight.angle = 65 * degsToRad;
    this.spotlight.distance = 5;
    this.spotlight.decay = 1;

    scene.add(this.spotlight);
    this.spotlightHelper = new THREE.SpotLightHelper(this.spotlight);
    scene.add(this.spotlightHelper);
    scene.add(new THREE.CameraHelper(this.spotlight.shadow.camera));



    barrierActions.push(new CallbackAction(this, function (caller) {
      caller.lamp = scene.getObjectByName("Lamp");
      caller.spotlight.target = caller.lamp;
      caller.spotlight.parent = caller.lamp;

      caller.lamp.children.push(caller.spotlight);

      caller.spotlight.position.x = 0;
      caller.spotlight.position.y = 1.75;
      caller.spotlight.position.z = 0;
    }));
  }

  update(deltaTime) {
    super.update(deltaTime);


    this.spotlightHelper.update()
  }

}

class Room extends GameObject {
  constructor(parent, name) {
    super(parent, name);
    this.meshRenderer = new MeshRenderer(this, "room.glb", null);
  }

  update(deltaTime) {
    super.update(deltaTime);
  }
}

class Fan extends GameObject {
  constructor(parent, name) {
    super(parent, name);

    barrierActions.push(new CallbackAction(this, function (caller) {
      caller.fanModel = scene.getObjectByName("FanWings");
    }));

  }

  update(deltaTime) {
    super.update(deltaTime);

    if (this.fanModel != null) {
      this.fanModel.rotation.y += 90 * degsToRad * deltaTime;
    }
  }
}

//
AddLoadBarrier();

var ambientLight = new THREE.AmbientLight(0xcccccc, 0.3);
scene.add(ambientLight);

var spotlight = new THREE.SpotLight();

scene.add(spotlight);
const spotlightHelper = new THREE.SpotLightHelper(spotlight);
scene.add(spotlightHelper)
spotlight.distance = 1000;

spotlight.position.x = -5;
spotlight.position.y = 25;
spotlight.position.z = -10;

spotlight.angle = 30 * degsToRad;
spotlight.intensity = 8
spotlight.color.set('#4d4d96');

var spotlightTwo = new THREE.SpotLight();
const spotlightHelperTwo = new THREE.SpotLightHelper(spotlight);
scene.add(spotlightTwo);
scene.add(spotlightHelperTwo)
spotlight.distance = 1000;

spotlight.position.x = 30;
spotlight.position.y = 25;
spotlight.position.z = -10;

spotlight.angle = 30 * degsToRad;
spotlight.intensity = 5
spotlight.color.set('#4d4d96');


barrierActions.push(new CallbackAction(spotlight, function (caller) {
  caller.target = scene.getObjectByName("TowerBuilding");
}));

const room = new Room(scene, "Room");

//const report = new Report(scene, "Report");
const cameraPositioner = new CameraPositioner(scene, "CameraPositioner");
cameraPositioner.goToStart(2000);


const fan = new Fan(scene, "Fan");
const lamp = new Lamp(scene, "Lamp");

const clock = new THREE.Clock();
clock.start();

RemoveLoadBarrier();

function animate() {

  var deltaTime = clock.getDelta();

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  spotlightHelper.update();
  gameObjects.forEach(element => {
    element.update(deltaTime);
  });

  TWEEN.update();

}
animate();
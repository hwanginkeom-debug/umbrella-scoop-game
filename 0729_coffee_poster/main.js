// Coffee Bean World - clean rewrite
var renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.setClearColor(0x8b4513, 1);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x8b4513);
scene.fog = new THREE.FogExp2(0x8b4513, 0.01);

var camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 100);
var camY = 13.5, camDist = 14, camAngle = -137;
function updateCamera() {
  var a = camAngle * Math.PI / 180;
  camera.position.set(Math.sin(a)*camDist, camY, Math.cos(a)*camDist);
  camera.lookAt(0, 0, 2);
}
updateCamera();

// 조명
scene.add(new THREE.AmbientLight(0xc8a060, 0.5));
var keyLight = new THREE.DirectionalLight(0xfff0d0, 1.2);
keyLight.position.set(5, 12, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -10; keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10; keyLight.shadow.camera.bottom = -10;
scene.add(keyLight);
var fillLight = new THREE.PointLight(0xff8c42, 0.7, 20);
fillLight.position.set(-4, 4, 3);
scene.add(fillLight);
scene.add(new THREE.DirectionalLight(0xffd090, 0.3)).position.set(-6, 8, -6);

// 원두 지오메트리
function makeBeanGeo() {
  var g = new THREE.SphereGeometry(0.5, 18, 12);
  var pos = g.attributes.position;
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), z = pos.getZ(i);
    pos.setZ(i, z * 0.52);
    var s = Math.abs(x) / 0.5;
    pos.setY(i, pos.getY(i) * (1 + s * 0.1));
    var groove = Math.exp(-x*x*8) * 0.05;
    pos.setZ(i, pos.getZ(i) - groove * (z > 0 ? 1 : -1));
  }
  g.computeVertexNormals();
  return g;
}
var BEAN_GEO = makeBeanGeo();
var BEAN_COLORS = [0x3d1a08, 0x4a2010, 0x5c2d12, 0x3a1508, 0x2e1206, 0x5a2a0a];
function makeBeanMat(v) {
  return new THREE.MeshPhysicalMaterial({
    color: BEAN_COLORS[v % BEAN_COLORS.length],
    roughness: 0.42, metalness: 0.0,
    clearcoat: 0.3, clearcoatRoughness: 0.4
  });
}

// 바닥 원두 빽빽하게 — 원형으로 배치
var bStep = 0.14;
for (var bx = -11; bx <= 11; bx += bStep) {
  for (var bz2 = -11; bz2 <= 11; bz2 += bStep) {
    var dist = Math.sqrt(bx*bx + bz2*bz2);
    if (dist > 10.5) continue; // 원형 클리핑
    var dm = new THREE.Mesh(BEAN_GEO, makeBeanMat(Math.floor(Math.random()*6)));
    var sc = 0.11 + Math.random()*0.08;
    // 가장자리로 갈수록 서서히 작아지는 효과
    var edgeFade = Math.max(0.5, 1 - (dist-8)/3);
    sc *= edgeFade;
    dm.position.set(bx+(Math.random()-0.5)*0.07, -0.03+Math.random()*0.05, bz2+(Math.random()-0.5)*0.07);
    dm.scale.set(sc, sc*0.65, sc);
    dm.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    dm.receiveShadow = true;
    scene.add(dm);
  }
}

// 물리 원두
var beans = [];
function spawnBean(x, y, z) {
  var sc = 0.13 + Math.random()*0.1;
  var m = new THREE.Mesh(BEAN_GEO, makeBeanMat(Math.floor(Math.random()*6)));
  m.scale.set(sc, sc*0.65, sc);
  m.castShadow = true;
  m.position.set(x, Math.max(y, sc*0.4), z);
  scene.add(m);
  // y가 낮으면 바로 onGround, 높으면 떨어지게
  var isLow = (y < 0.3);
  beans.push({ mesh:m, sc:sc,
    vx:isLow?0:(Math.random()-0.5)*0.04, vy:isLow?0:-0.01, vz:isLow?0:(Math.random()-0.5)*0.04,
    rx:Math.random()*0.04, ry:Math.random()*0.04,
    onGround:isLow, aiOwner:null, _basketFloor:undefined
  });
}
for (var bi = 0; bi < 80; bi++) {
  // 절반은 바닥에 바로 안착, 절반은 떨어지게
  var isFloor = bi < 40;
  spawnBean(
    (Math.random()-0.5)*(isFloor?10:7),
    isFloor ? 0.05 : 0.5+Math.random()*2,
    (Math.random()-0.5)*(isFloor?10:7)
  );
}

// 그라인더
var grinderGroup = new THREE.Group();
var ironM = new THREE.MeshStandardMaterial({color:0x1a1814,roughness:0.6,metalness:0.85});
var darkM = new THREE.MeshPhysicalMaterial({color:0x2a2520,roughness:0.35,metalness:0.9,clearcoat:0.4});
var woodM = new THREE.MeshPhysicalMaterial({color:0x8b5e2a,roughness:0.7});
function gAdd(geo,mat,x,y,z){var m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=true;m.receiveShadow=true;grinderGroup.add(m);return m;}
gAdd(new THREE.BoxGeometry(1.8,0.15,1.8),ironM,0,0.075,0);
gAdd(new THREE.BoxGeometry(1.5,1.6,1.5),ironM,0,0.95,0);
gAdd(new THREE.BoxGeometry(0.55,0.45,0.05),darkM,0,0.75,0.78);
gAdd(new THREE.CylinderGeometry(0.7,0.45,0.7,24),darkM,0,2.05,0);
gAdd(new THREE.CylinderGeometry(0.06,0.06,1.8,12),darkM,0,2.45,0);
var handleGroup = new THREE.Group();
handleGroup.position.set(0,3.2,0);
grinderGroup.add(handleGroup);
var armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,1.5,10),darkM);
armMesh.rotation.z=Math.PI/2; armMesh.position.set(0,0,0.75);
armMesh.rotation.x=Math.PI/2; armMesh.castShadow=true;
handleGroup.add(armMesh);
var knobMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.09,0.4,12),woodM);
knobMesh.position.set(0,-0.1,1.5); knobMesh.castShadow=true;
handleGroup.add(knobMesh);
var drawerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.03,0.4),new THREE.MeshStandardMaterial({color:0x2a1208,roughness:0.9}));
drawerMesh.position.set(0,0.2,0.85); drawerMesh.scale.x=0.01;
grinderGroup.add(drawerMesh);
grinderGroup.position.set(0,0,0);
scene.add(grinderGroup);

var coffeeAmt=0, coffeeObj=null, coffeeAutoTimer=0;
function spawnCoffee(){
  if(coffeeObj)scene.remove(coffeeObj);
  coffeeObj=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.15,0.1,12),new THREE.MeshPhysicalMaterial({color:0x2a1008,roughness:0.85}));
  coffeeObj.position.set(-0.5,0.2,1.8); coffeeObj.castShadow=true;
  scene.add(coffeeObj);
  coffeeAmt=0; drawerMesh.scale.x=0.01;
}

// 마대자루
function makeSack(x,z,ry){
  var g=new THREE.SphereGeometry(0.55,12,10);
  var p=g.attributes.position;
  for(var i=0;i<p.count;i++){p.setX(i,p.getX(i)*1.3);p.setY(i,p.getY(i)*0.85+0.08);}
  g.computeVertexNormals();
  var m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x9b7b3a,roughness:0.95}));
  m.scale.set(1,0.85,0.75);m.position.set(x,0.38,z);m.rotation.y=ry;m.castShadow=true;
  scene.add(m);
}
makeSack(2.5,1.5,0.4); makeSack(3.2,0.5,1.2);

// 바구니
var basketGroup = new THREE.Group();
var woodBrown = new THREE.MeshPhysicalMaterial({color:0x7a4a1a,roughness:0.9});
var woodLight2 = new THREE.MeshPhysicalMaterial({color:0x9a6a3a,roughness:0.85});
(function(){
  var bm = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.42,0.55,16,1,true),woodBrown);
  bm.position.y=0.28; bm.castShadow=true; basketGroup.add(bm);
  var bd = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.06,16),woodBrown);
  bd.position.y=0.03; bd.castShadow=true; basketGroup.add(bd);
  var ringYs = [0.03, 0.28, 0.52];
  for(var ri=0;ri<3;ri++){
    var rm=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.03,8,20),woodLight2);
    rm.rotation.x=Math.PI/2; rm.position.y=ringYs[ri]; rm.castShadow=true;
    basketGroup.add(rm);
  }
  for(var wi=0;wi<8;wi++){
    var wa=wi*(Math.PI*2/8);
    var wm=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.52,0.03),woodLight2);
    wm.position.set(Math.cos(wa)*0.49,0.28,Math.sin(wa)*0.49);
    wm.rotation.y=-wa; wm.castShadow=true;
    basketGroup.add(wm);
  }
})();
// 바구니 — 뷰에서 오른쪽 앞에 보이게
basketGroup.position.set(2.2,0,2.8);
scene.add(basketGroup);
var BASKET_POS = new THREE.Vector3(2.2,0,2.8);
var basketStackH = 0.3;

// 연기
var smokeBuf=new Float32Array(60*3), smokeVels=[];
for(var si=0;si<60;si++){
  smokeBuf[si*3]=(Math.random()-0.5)*1.5;
  smokeBuf[si*3+1]=3+Math.random()*2;
  smokeBuf[si*3+2]=(Math.random()-0.5)*1.5;
  smokeVels.push(0.008+Math.random()*0.01);
}
var smokeGeo=new THREE.BufferGeometry();
smokeGeo.setAttribute('position',new THREE.BufferAttribute(smokeBuf,3));
scene.add(new THREE.Points(smokeGeo,new THREE.PointsMaterial({color:0xa08060,size:0.5,transparent:true,opacity:0.1})));

// 피규어
var REACTIONS=['으악!','이게뭐야!','앗!','살려줘!','내커피!','야!!'];
var figures=[];
function fm(geo,mat,x,y,z){var m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=true;m.receiveShadow=true;return m;}
function buildFig(role){
  var root=new THREE.Group();
  var unCol=role==='lifter'?0x4a5f70:role==='operator'?0x6a5040:0x4a6050;
  var sk=new THREE.MeshPhysicalMaterial({color:0xe8a070,roughness:0.6,clearcoat:0.08});
  var skD=new THREE.MeshPhysicalMaterial({color:0xc07848,roughness:0.65});
  var un=new THREE.MeshPhysicalMaterial({color:unCol,roughness:0.65,metalness:0.05});
  var unL=new THREE.MeshPhysicalMaterial({color:unCol+0x111111,roughness:0.6,metalness:0.05});
  var ap=new THREE.MeshPhysicalMaterial({color:0xe0d4b8,roughness:0.85});
  var sh=new THREE.MeshPhysicalMaterial({color:0x1c1208,roughness:0.8,metalness:0.05});
  var ht=new THREE.MeshPhysicalMaterial({color:0x6a7a88,roughness:0.7,metalness:0.05});
  var htD=new THREE.MeshPhysicalMaterial({color:0x3a4a54,roughness:0.75});
  var hr=new THREE.MeshPhysicalMaterial({color:0x201408,roughness:0.85});
  var eyeW=new THREE.MeshStandardMaterial({color:0xf5ede0,roughness:0.3});
  var eyeB=new THREE.MeshStandardMaterial({color:0x080808,roughness:0.2});
  var irisM=new THREE.MeshStandardMaterial({color:0x5a3010,roughness:0.3});
  var hlM=new THREE.MeshBasicMaterial({color:0xffffff});
  var mouthM=new THREE.MeshStandardMaterial({color:0x904030,roughness:0.7});
  root.add(fm(new THREE.BoxGeometry(0.13,0.07,0.2),sh,-0.11,0.035,0.02));
  root.add(fm(new THREE.BoxGeometry(0.13,0.07,0.2),sh, 0.11,0.035,0.02));
  var legLG=new THREE.Group(); legLG.position.set(-0.11,0.44,0); root.add(legLG);
  legLG.add(fm(new THREE.CylinderGeometry(0.075,0.065,0.54,14),un));
  legLG.add(fm(new THREE.SphereGeometry(0.07,12,10),unL,0,-0.22,0));
  legLG.add(fm(new THREE.CylinderGeometry(0.062,0.052,0.26,12),un,0,-0.4,0));
  var legRG=new THREE.Group(); legRG.position.set(0.11,0.44,0); root.add(legRG);
  legRG.add(fm(new THREE.CylinderGeometry(0.075,0.065,0.54,14),un));
  legRG.add(fm(new THREE.SphereGeometry(0.07,12,10),unL,0,-0.22,0));
  legRG.add(fm(new THREE.CylinderGeometry(0.062,0.052,0.26,12),un,0,-0.4,0));
  var torso=new THREE.Group(); torso.position.set(0,0.94,0); root.add(torso);
  torso.add(fm(new THREE.CylinderGeometry(0.19,0.14,0.52,18),un));
  var shG=new THREE.SphereGeometry(0.1,12,10); shG.scale(1,0.7,0.9);
  torso.add(fm(shG,unL,-0.21,0.17,0)); torso.add(fm(shG.clone(),unL,0.21,0.17,0));
  torso.add(fm(new THREE.BoxGeometry(0.27,0.43,0.04),ap,0,-0.03,0.14));
  torso.add(fm(new THREE.BoxGeometry(0.03,0.26,0.03),ap,-0.09,0.18,0.13));
  torso.add(fm(new THREE.BoxGeometry(0.03,0.26,0.03),ap, 0.09,0.18,0.13));
  root.add(fm(new THREE.CylinderGeometry(0.08,0.09,0.11,12),sk,0,1.23,0));
  var head=new THREE.Group(); head.position.set(0,1.43,0); root.add(head);
  var hG=new THREE.SphereGeometry(0.21,22,16); hG.scale(0.92,1.0,0.9);
  head.add(fm(hG,sk));
  var jawG=new THREE.SphereGeometry(0.14,12,10); jawG.scale(1.0,0.55,0.88);
  head.add(fm(jawG,skD,0,-0.14,0.02));
  head.add(fm(new THREE.SphereGeometry(0.04,10,8),eyeW,-0.082,0.055,0.185));
  head.add(fm(new THREE.SphereGeometry(0.04,10,8),eyeW, 0.082,0.055,0.185));
  head.add(fm(new THREE.SphereGeometry(0.026,10,8),irisM,-0.082,0.058,0.197));
  head.add(fm(new THREE.SphereGeometry(0.026,10,8),irisM, 0.082,0.058,0.197));
  head.add(fm(new THREE.SphereGeometry(0.016,10,8),eyeB,-0.082,0.06,0.201));
  head.add(fm(new THREE.SphereGeometry(0.016,10,8),eyeB, 0.082,0.06,0.201));
  head.add(fm(new THREE.SphereGeometry(0.008,6,6),hlM,-0.075,0.066,0.205));
  head.add(fm(new THREE.SphereGeometry(0.008,6,6),hlM, 0.089,0.066,0.205));
  var nG=new THREE.SphereGeometry(0.026,10,8); nG.scale(1,0.9,1.2);
  head.add(fm(nG,skD,0,-0.016,0.2));
  var mG=new THREE.SphereGeometry(0.032,10,6); mG.scale(2.0,0.55,0.7);
  head.add(fm(mG,mouthM,0,-0.1,0.183));
  var eG=new THREE.SphereGeometry(0.055,10,8); eG.scale(0.45,0.78,0.6);
  head.add(fm(eG,sk,-0.21,0.01,0)); head.add(fm(eG.clone(),sk,0.21,0.01,0));
  var hcG=new THREE.SphereGeometry(0.215,18,13); hcG.scale(0.94,0.82,0.92);
  head.add(fm(hcG,hr,0,0.1,-0.01));
  var bG=new THREE.SphereGeometry(0.13,12,10); bG.scale(1.3,0.4,0.7);
  head.add(fm(bG,hr,0,0.2,0.12));
  head.add(fm(new THREE.CylinderGeometry(0.24,0.24,0.04,18),ht,0,0.22,0));
  head.add(fm(new THREE.CylinderGeometry(0.16,0.2,0.17,16),ht,0,0.34,0));
  head.add(fm(new THREE.CylinderGeometry(0.202,0.202,0.03,16),htD,0,0.245,0));
  var armL=new THREE.Group(); armL.position.set(-0.26,1.15,0); root.add(armL);
  armL.add(fm(new THREE.CylinderGeometry(0.07,0.062,0.26,14),un,0,-0.13,0));
  var eLG=new THREE.Group(); eLG.position.set(0,-0.26,0); armL.add(eLG);
  eLG.add(fm(new THREE.SphereGeometry(0.064,12,10),unL));
  eLG.add(fm(new THREE.CylinderGeometry(0.058,0.048,0.24,12),sk,0,-0.15,0));
  eLG.add(fm(new THREE.SphereGeometry(0.058,12,10),sk,0,-0.29,0));
  var armR=new THREE.Group(); armR.position.set(0.26,1.15,0); root.add(armR);
  armR.add(fm(new THREE.CylinderGeometry(0.07,0.062,0.26,14),un,0,-0.13,0));
  var eRG=new THREE.Group(); eRG.position.set(0,-0.26,0); armR.add(eRG);
  eRG.add(fm(new THREE.SphereGeometry(0.064,12,10),unL));
  eRG.add(fm(new THREE.CylinderGeometry(0.058,0.048,0.24,12),sk,0,-0.15,0));
  eRG.add(fm(new THREE.SphereGeometry(0.058,12,10),sk,0,-0.29,0));
  return {root:root,torso:torso,head:head,armL:armL,armR:armR,eLG:eLG,eRG:eRG,legLG:legLG,legRG:legRG};
}
function spawnFig(x,z,ry,role){
  var p=buildFig(role);
  p.root.position.set(x,0,z); p.root.rotation.y=ry;
  scene.add(p.root);
  if(role==='lifter'){p.armL.rotation.z=-0.8;p.armL.rotation.x=-0.4;p.armR.rotation.z=0.8;p.armR.rotation.x=-0.4;p.torso.rotation.x=-0.2;}
  else if(role==='operator'){p.armR.rotation.z=-0.35;p.armR.rotation.x=-0.9;}
  else{p.armL.rotation.z=-0.25;p.armR.rotation.z=0.5;p.armR.rotation.x=-0.35;}
  figures.push({parts:p,role:role,held:false,reaction:false,drinkingCoffee:false,baseX:x,baseZ:z,aiBean:null,aiPhase:null});
}
spawnFig(-2.5, 2.0, Math.PI, 'lifter');
spawnFig( 0.0, 2.5, Math.PI, 'worker');
spawnFig( 2.5, 2.0, Math.PI,'operator');

// 겹침 방지
var OBSTACLES = [{x:0,z:0,r:1.2},{x:2.5,z:2.5,r:0.9}];
function isBlocked(nx,nz,self){
  // 그라인더만 막기 (피규어간 겹침은 허용)
  var dx=nx-0,dz=nz-0;
  return Math.sqrt(dx*dx+dz*dz)<1.0;
}

// 픽셀 커서
var cursor2d = document.getElementById('cursor2d');
var cursorCanvas = document.getElementById('cursor-canvas');
var cctx = cursorCanvas.getContext('2d');
cctx.imageSmoothingEnabled = false;

// 픽셀 손가락 커서 (오픈/클로즈 두 버전)
// 0=투명, 1=밝은 피부, 2=어두운 피부, 3=검정(윤곽)
var CURSOR_OPEN = [
  '0000333000000000',
  '0003113300000000',
  '0031111330000000',
  '0031111133000000',
  '0031111113300000',
  '0031133111330000',
  '0031133113113000',
  '0031133113113300',
  '0031131131113300',
  '0033311311113300',
  '0003331131111300',
  '0000331311113300',
  '0000031311111300',
  '0000031113111300',
  '0000031113133300',
  '0000033333330000',
];
var CURSOR_CLOSE = [
  '0000000000000000',
  '0003333333000000',
  '0031111111330000',
  '0311111111113000',
  '0311111111113000',
  '0311111111113000',
  '0311111111113000',
  '0311111111113000',
  '0311111111113000',
  '0031111111130000',
  '0003311111300000',
  '0000331111300000',
  '0000031113300000',
  '0000003333000000',
  '0000000000000000',
  '0000000000000000',
];
var CURSOR_COLORS = {
  '0': 'rgba(0,0,0,0)',
  '1': '#f0c888',
  '2': '#c8906a',
  '3': '#1a1008'
};

function drawPixelCursor(holding) {
  cctx.clearRect(0, 0, 32, 32);
  var grid = holding ? CURSOR_CLOSE : CURSOR_OPEN;
  var scale = 2;
  for (var row = 0; row < grid.length; row++) {
    for (var col = 0; col < grid[row].length; col++) {
      var ch = grid[row][col];
      if (ch !== '0') {
        cctx.fillStyle = CURSOR_COLORS[ch];
        cctx.fillRect(col * scale, row * scale, scale, scale);
      }
    }
  }
}
drawPixelCursor(false);

function moveCursor(cx,cy){cursor2d.style.left=cx+'px';cursor2d.style.top=cy+'px';}
function setCursorHold(h){drawPixelCursor(h);}
document.addEventListener('mousemove',function(e){moveCursor(e.clientX,e.clientY);});

// 인터랙션
var ray=new THREE.Raycaster(),mv=new THREE.Vector2();
var dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),dHit=new THREE.Vector3();
var dragFig=null,isDragHandle=false,lastHA=0,dragCoffee=false,holdIv=null;

function showBubble(wp,txt){
  var v=wp.clone().project(camera);
  var el=document.createElement('div');
  el.className='bubble';el.textContent=txt;
  el.style.left=((v.x*0.5+0.5)*window.innerWidth)+'px';
  el.style.top=((-v.y*0.5+0.5)*window.innerHeight)+'px';
  document.getElementById('bubbles').appendChild(el);
  setTimeout(function(){el.remove();},1800);
}
function setRay(e){mv.x=(e.clientX/window.innerWidth)*2-1;mv.y=-(e.clientY/window.innerHeight)*2+1;ray.setFromCamera(mv,camera);}
function getFig(e){
  setRay(e);
  for(var i=0;i<figures.length;i++){
    if(ray.intersectObjects(figures[i].parts.root.children,true).length>0) return figures[i];
  }
  return null;
}
function getHandle(e){setRay(e);return ray.intersectObjects(handleGroup.children,true).length>0;}
function getCoffee(e){if(!coffeeObj)return false;setRay(e);return ray.intersectObject(coffeeObj).length>0;}
function hAngle(e){return Math.atan2(e.clientY-window.innerHeight/2,e.clientX-window.innerWidth/2);}
function blastBeans(cx,cy){
  mv.x=(cx/window.innerWidth)*2-1;mv.y=-(cy/window.innerHeight)*2+1;ray.setFromCamera(mv,camera);
  var pt=new THREE.Vector3();ray.ray.at(8,pt);
  for(var i=0;i<beans.length;i++){
    var b=beans[i];
    var d=b.mesh.position.distanceTo(pt);
    if(d<3.5){
      var dir=b.mesh.position.clone().sub(pt).normalize();
      var str=(2-d)/2*0.22;
      b.vx+=dir.x*str+(Math.random()-0.5)*0.08;
      b.vy+=0.12+Math.random()*0.15;
      b.vz+=dir.z*str+(Math.random()-0.5)*0.08;
      b.onGround=false;
    }
  }
}
renderer.domElement.addEventListener('pointerdown',function(e){
  setCursorHold(true);
  if(getHandle(e)){isDragHandle=true;lastHA=hAngle(e);return;}
  if(getCoffee(e)){dragCoffee=true;return;}
  var fig=getFig(e);
  if(fig){dragFig=fig;fig.held=true;return;}
  blastBeans(e.clientX,e.clientY);
  holdIv=setInterval(function(){blastBeans(e.clientX,e.clientY);},100);
});
renderer.domElement.addEventListener('pointermove',function(e){
  moveCursor(e.clientX,e.clientY);
  if(isDragHandle){
    var a=hAngle(e),da=a-lastHA;
    handleGroup.rotation.y+=da*3;
    coffeeAmt=Math.min(coffeeAmt+Math.abs(da)*0.4,1);
    drawerMesh.scale.x=Math.max(coffeeAmt,0.01);
    if(coffeeAmt>=1&&!coffeeObj) spawnCoffee();
    lastHA=a; return;
  }
  if(dragCoffee&&coffeeObj){
    setRay(e);dragPlane.constant=-0.3;
    ray.ray.intersectPlane(dragPlane,dHit);
    coffeeObj.position.set(dHit.x,0.5,dHit.z); return;
  }
  if(dragFig){
    setRay(e);dragPlane.constant=0;
    ray.ray.intersectPlane(dragPlane,dHit);
    dragFig.parts.root.position.set(dHit.x,0.5+Math.sin(Date.now()*0.01)*0.1,dHit.z);
    dragFig.parts.root.rotation.x=Math.sin(Date.now()*0.008)*0.2;
  }
});
renderer.domElement.addEventListener('pointerup',function(e){
  setCursorHold(false);
  if(isDragHandle){isDragHandle=false;return;}
  if(dragCoffee&&coffeeObj){
    dragCoffee=false;
    var near=null,minD=2.5;
    for(var i=0;i<figures.length;i++){
      var d=figures[i].parts.root.position.distanceTo(coffeeObj.position);
      if(d<minD){minD=d;near=figures[i];}
    }
    if(near){showBubble(near.parts.root.position.clone().add(new THREE.Vector3(0,1.8,0)),'☕ 고마워요~');near.drinkingCoffee=true;setTimeout(function(){near.drinkingCoffee=false;},3000);scene.remove(coffeeObj);coffeeObj=null;coffeeAmt=0;drawerMesh.scale.x=0.01;}
    return;
  }
  if(dragFig){
    dragFig.parts.root.rotation.x=0;
    var pos=dragFig.parts.root.position.clone();
    var di;
    for(di=0;di<20;di++) spawnBean(pos.x+(Math.random()-0.5)*0.4,pos.y+0.8,pos.z+(Math.random()-0.5)*0.4);
    for(di=0;di<figures.length;di++){
      var fi=figures[di];
      if(!fi.reaction){fi.reaction=true;showBubble(fi.parts.root.position.clone().add(new THREE.Vector3(0,1.6,0)),REACTIONS[Math.floor(Math.random()*REACTIONS.length)]);setTimeout(function(){fi.reaction=false;},2000);}
    }
    dragFig.held=false;dragFig=null;return;
  }
  if(holdIv){clearInterval(holdIv);holdIv=null;}
});

// 애니메이션
var clk=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  var t=clk.getElapsedTime();
  var i,b,fig,p;

  // 원두 물리
  for(i=0;i<beans.length;i++){
    b=beans[i];
    if(b.onGround) continue;
    b.vy-=0.01;
    b.mesh.position.x+=b.vx; b.mesh.position.y+=b.vy; b.mesh.position.z+=b.vz;
    b.mesh.rotation.x+=b.rx; b.mesh.rotation.z+=b.ry;
    b.vx*=0.98; b.vz*=0.98;
    // 바구니 내부 바닥
    if(b._basketFloor!==undefined && b.mesh.position.y<=b._basketFloor){
      b.mesh.position.y=b._basketFloor;b.vy=-b.vy*0.2;b.vx*=0.8;b.vz*=0.8;
      if(Math.abs(b.vy)<0.004){b.vy=0;b.onGround=true;delete b._basketFloor;}
    }
    if(b.mesh.position.y<=b.sc*0.4){
      b.mesh.position.y=b.sc*0.4;b.vy=-b.vy*0.3;b.vx*=0.85;b.vz*=0.85;
      if(Math.abs(b.vy)<0.005){b.vy=0;b.onGround=true;}
    }
    if(Math.abs(b.mesh.position.x)>12||b.mesh.position.y<-3){
      b.mesh.position.set((Math.random()-0.5)*5,1+Math.random()*2,(Math.random()-0.5)*5);
      b.vy=-0.01;b.vx=0;b.vz=0;b.onGround=false;
    }
  }

  // 연기
  var sp=smokeGeo.attributes.position.array;
  for(var si=0;si<60;si++){sp[si*3+1]+=smokeVels[si];if(sp[si*3+1]>9){sp[si*3]=(Math.random()-0.5)*1.5;sp[si*3+1]=3;sp[si*3+2]=(Math.random()-0.5)*1.5;}}
  smokeGeo.attributes.position.needsUpdate=true;
  fillLight.intensity=0.7+Math.sin(t*3.5)*0.15;

  // 피규어 AI
  for(i=0;i<figures.length;i++){
    fig=figures[i]; p=fig.parts;
    if(fig.held) continue;
    if(fig.drinkingCoffee){p.head.rotation.x=-0.3+Math.sin(t*4)*0.1;p.armR.rotation.x=-2.0;p.armR.rotation.z=0.3;continue;}

    if(!fig.aiBean){
      var farBean=null,maxD=0,j,bd;
      for(j=0;j<beans.length;j++){
        b=beans[j];
        if(b.aiOwner) continue;
        bd=p.root.position.distanceTo(b.mesh.position);
        if(bd>maxD){maxD=bd;farBean=b;}
      }
      if(farBean){farBean.aiOwner=fig;fig.aiBean=farBean;fig.aiPhase='go';}
    }

    if(fig.aiBean){
      var bP=fig.aiBean.mesh.position;
      if(fig.aiPhase==='go'){
        var dir=bP.clone().sub(p.root.position);dir.y=0;
        if(dir.length()>0.4){
          dir.normalize();
          var nx=p.root.position.x+dir.x*0.014,nz=p.root.position.z+dir.z*0.014;
          if(!isBlocked(nx,nz,fig)){p.root.position.x=nx;p.root.position.z=nz;}
          p.root.rotation.y=Math.atan2(dir.x,dir.z);
          p.legLG.rotation.x=Math.sin(t*2.5)*0.3;p.legRG.rotation.x=-Math.sin(t*2.5)*0.3;          // 걸을때 주변 원두 살짝 밀기
          for(j=0;j<beans.length;j++){
            b=beans[j];
            bd=p.root.position.distanceTo(b.mesh.position);
            if(bd<0.4&&b.onGround){b.vx+=(b.mesh.position.x-p.root.position.x)*0.003;b.vz+=(b.mesh.position.z-p.root.position.z)*0.003;b.vy+=0.005;b.onGround=false;}
          }
        } else {
          p.armL.rotation.x=-1.5;fig.aiBean.onGround=false;fig.aiBean.vx=0;fig.aiBean.vy=0;fig.aiBean.vz=0;fig.aiPhase='carry';
        }
      } else if(fig.aiPhase==='carry'){
        fig.aiBean.mesh.position.set(p.root.position.x,p.root.position.y+1.2,p.root.position.z+0.1);
        var gP=BASKET_POS.clone();
        var dir2=gP.sub(p.root.position);dir2.y=0;
        if(dir2.length()>0.5){
          dir2.normalize();
          var nx2=p.root.position.x+dir2.x*0.012,nz2=p.root.position.z+dir2.z*0.012;
          if(!isBlocked(nx2,nz2,fig)){p.root.position.x=nx2;p.root.position.z=nz2;}
          p.root.rotation.y=Math.atan2(dir2.x,dir2.z);
          p.legLG.rotation.x=Math.sin(t*2.5)*0.3;p.legRG.rotation.x=-Math.sin(t*2.5)*0.3;
        } else {
          p.armL.rotation.x=-0.5;
          basketStackH+=0.1;
          // 바구니 드롭 범위 확대
          fig.aiBean.mesh.position.set(BASKET_POS.x+(Math.random()-0.5)*1.2,BASKET_POS.y+1.0,BASKET_POS.z+(Math.random()-0.5)*1.2);
          fig.aiBean._basketFloor=BASKET_POS.y+0.1+basketStackH*0.05;
          fig.aiBean.vy=0;fig.aiBean.vx=(Math.random()-0.5)*0.03;fig.aiBean.vz=(Math.random()-0.5)*0.03;fig.aiBean.onGround=false;
          if(basketStackH>1.5) basketStackH=0.3;
          fig.aiBean.aiOwner=null;fig.aiBean=null;fig.aiPhase='return';
        }
      } else if(fig.aiPhase==='return'){
        var home=new THREE.Vector3(fig.baseX,0,fig.baseZ);
        var dr=home.sub(p.root.position);dr.y=0;
        if(dr.length()>0.3){dr.normalize();p.root.position.x+=dr.x*0.006;p.root.position.z+=dr.z*0.006;p.root.rotation.y=Math.atan2(dr.x,dr.z);}
        else fig.aiPhase=null;
      }
    } else {
      p.head.rotation.y=Math.sin(t*0.7+fig.baseX)*0.15;
      if(fig.role==='operator'){p.armR.rotation.z=-0.4+Math.sin(t*2.2)*0.4;p.armR.rotation.x=-1.0+Math.cos(t*2.2)*0.4;}
    }
  }

  renderer.render(scene,camera);
}

window.addEventListener('resize',function(){
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

// 카메라 고정 완료 — Y:13.5, Z:14, 각도:-137°

animate();
console.log('Coffee World ready!');

/**
 * 우산 퍼내기 게임 (Three.js 3D)
 *
 * - 그리스 고딕 양식 건물 (지붕 없음) 안에서 비가 내려 물이 차오름
 * - 우산으로 물을 퍼서 건물 밖으로 버림
 * - 시간이 지날수록 레벨업: 비 강해짐, 번개, 이펙트 강화
 * - 픽셀 스타일 배경
 */

// 픽셀 배경 제거 — 3D 씬 배경 사용

// ============================================================
// 설정
// ============================================================
var CONFIG = {
    waterRiseBase: 0.0004,
    waterAccel: 0.003,
    scoopAmount: 0.035,
    segments: 8,
    canopyRadius: 1.0,
    canopyHeight: 0.45,
    rainCount: 2000,
    houseW: 5,
    houseD: 5,
    houseH: 4,
};

var DESIGNS = [
    { main: 0x7CB342, accent: 0xFFFFFF },
    { main: 0xE53935, accent: 0xFDD835 },
    { main: 0x1E88E5, accent: 0xFFFFFF },
    { main: 0xFF6F00, accent: 0xFFD54F },
    { main: 0x5C6BC0, accent: 0xE8EAF6 },
    { main: 0xAD1457, accent: 0xF8BBD0 },
    { main: 0x00897B, accent: 0xB2DFDB },
    { main: 0x6A1B9A, accent: 0xCE93D8 },
];

var SCOOP_TEXTS = ['퍼담았어요! 🪣', '가득! 💧', '담았다! ☂️', '물 잡았다! 💦', '쓱-! 🌊'];
var DUMP_TEXTS = ['버렸어요! 🌊', '쏟았다! 💨', '시원하다! ✨', '밖으로! 🔄', '비켜! 💪'];

// ============================================================
// 상태
// ============================================================
var state = {
    waterLevel: 0,
    isGameOver: false,
    startTime: Date.now(),
    elapsed: 0,
    clicks: 0,
    designIndex: 0,
    phase: 'empty',
    isAnimating: false,
    level: 1,
    lastLightning: 0,
};

// ============================================================
// Three.js
// ============================================================
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(7, 7, 9);
camera.lookAt(0, 2, 0);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.target.set(0, 2, 0);

// ============================================================
// 조명
// ============================================================
var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
var mainLight = new THREE.DirectionalLight(0xffeedd, 0.7);
mainLight.position.set(5, 12, 6);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(1024, 1024);
scene.add(mainLight);
var fillLight = new THREE.DirectionalLight(0x4466aa, 0.2);
fillLight.position.set(-4, 4, -4);
scene.add(fillLight);

// ============================================================
// 그리스 고딕 건물 (기둥 + 벽)
// ============================================================
var W = CONFIG.houseW;
var D = CONFIG.houseD;
var H = CONFIG.houseH;

// 바닥 (대리석)
var floorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(W + 2, 0.2, D + 2),
    new THREE.MeshStandardMaterial({ color: 0x9E9E8E, roughness: 0.4, metalness: 0.1 })
);
floorMesh.position.y = 0.1;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// 단상 (계단 2개)
var step1 = new THREE.Mesh(
    new THREE.BoxGeometry(W + 3, 0.2, D + 3),
    new THREE.MeshStandardMaterial({ color: 0x8A8A7A, roughness: 0.5 })
);
step1.position.y = -0.1;
scene.add(step1);

var step2 = new THREE.Mesh(
    new THREE.BoxGeometry(W + 4, 0.2, D + 4),
    new THREE.MeshStandardMaterial({ color: 0x7A7A6A, roughness: 0.5 })
);
step2.position.y = -0.3;
scene.add(step2);

// 기둥 (코린트식)
var pillarMat = new THREE.MeshStandardMaterial({ color: 0xC8B896, roughness: 0.4, metalness: 0.05 });
var pillarPositions = [];

function makePillar(px, pz) {
    // 기둥 몸통
    var body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.22, H - 0.6, 12),
        pillarMat
    );
    body.position.set(px, H / 2 + 0.1, pz);
    body.castShadow = true;
    scene.add(body);

    // 주두 (capital - 코린트식 장식)
    var cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.2, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0xD4C4A0, roughness: 0.3 })
    );
    cap.position.set(px, H - 0.1, pz);
    scene.add(cap);

    // 주초 (base)
    var base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xB8A888, roughness: 0.4 })
    );
    base.position.set(px, 0.3, pz);
    scene.add(base);

    pillarPositions.push({ x: px, z: pz });
}

// 4면에 기둥 배치
var halfW = W / 2;
var halfD = D / 2;
// 앞면
makePillar(-halfW, halfD); makePillar(-halfW * 0.33, halfD); makePillar(halfW * 0.33, halfD); makePillar(halfW, halfD);
// 뒷면
makePillar(-halfW, -halfD); makePillar(-halfW * 0.33, -halfD); makePillar(halfW * 0.33, -halfD); makePillar(halfW, -halfD);
// 좌면
makePillar(-halfW, -halfD * 0.33); makePillar(-halfW, halfD * 0.33);
// 우면
makePillar(halfW, -halfD * 0.33); makePillar(halfW, halfD * 0.33);

// 기둥 위 엔타블러처 (보)
var beamMat = new THREE.MeshStandardMaterial({ color: 0xB8A080, roughness: 0.4 });
// 앞뒤
scene.add((function() {
    var m = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.3, 0.4), beamMat);
    m.position.set(0, H + 0.15, halfD); m.castShadow = true; return m;
})());
scene.add((function() {
    var m = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.3, 0.4), beamMat);
    m.position.set(0, H + 0.15, -halfD); m.castShadow = true; return m;
})());
// 좌우
scene.add((function() {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, D + 0.5), beamMat);
    m.position.set(-halfW, H + 0.15, 0); m.castShadow = true; return m;
})());
scene.add((function() {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, D + 0.5), beamMat);
    m.position.set(halfW, H + 0.15, 0); m.castShadow = true; return m;
})());

// 낮은 벽 (기둥 사이, 하단 절반만)
var lowWallMat = new THREE.MeshStandardMaterial({ color: 0xA09070, roughness: 0.6 });
var lowH = H * 0.35;
// 앞면 벽 (문 제외 좌우)
scene.add((function() {
    var m = new THREE.Mesh(new THREE.BoxGeometry(W * 0.3, lowH, 0.15), lowWallMat);
    m.position.set(-W * 0.35, lowH / 2 + 0.2, halfD); return m;
})());
scene.add((function() {
    var m = new THREE.Mesh(new THREE.BoxGeometry(W * 0.3, lowH, 0.15), lowWallMat);
    m.position.set(W * 0.35, lowH / 2 + 0.2, halfD); return m;
})());
// 뒷면
scene.add((function() {
    var m = new THREE.Mesh(new THREE.BoxGeometry(W, lowH, 0.15), lowWallMat);
    m.position.set(0, lowH / 2 + 0.2, -halfD); return m;
})());
// 좌우
scene.add((function() {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.15, lowH, D), lowWallMat);
    m.position.set(-halfW, lowH / 2 + 0.2, 0); return m;
})());
scene.add((function() {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.15, lowH, D), lowWallMat);
    m.position.set(halfW, lowH / 2 + 0.2, 0); return m;
})());

// ============================================================
// 물 수면
// ============================================================
var waterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.3, D - 0.3),
    new THREE.MeshStandardMaterial({
        color: 0x1a6688, transparent: true, opacity: 0.8,
        roughness: 0.02, metalness: 0.55,
    })
);
waterMesh.rotation.x = -Math.PI / 2;
waterMesh.position.y = 0.21;
scene.add(waterMesh);

// ============================================================
// 우산
// ============================================================
var umbrellaGroup = new THREE.Group();
umbrellaGroup.position.set(0, H - 0.5, 0);
scene.add(umbrellaGroup);

var canopyGroup = new THREE.Group();
umbrellaGroup.add(canopyGroup);
var segmentMats = [];

(function buildCanopy() {
    var R = CONFIG.canopyRadius;
    var CH = CONFIG.canopyHeight;
    var N = CONFIG.segments;
    var design = DESIGNS[0];
    for (var i = 0; i < N; i++) {
        var a1 = (Math.PI * 2 * i) / N;
        var a2 = (Math.PI * 2 * (i + 1)) / N;
        var aMid = (a1 + a2) / 2;
        var verts = new Float32Array([
            0, CH, 0,
            Math.cos(a1) * R, -0.03, Math.sin(a1) * R,
            Math.cos(aMid) * R * 0.97, -0.07, Math.sin(aMid) * R * 0.97,
            0, CH, 0,
            Math.cos(aMid) * R * 0.97, -0.07, Math.sin(aMid) * R * 0.97,
            Math.cos(a2) * R, -0.03, Math.sin(a2) * R,
        ]);
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geo.computeVertexNormals();
        var mat = new THREE.MeshStandardMaterial({
            color: (i % 2 === 0) ? design.main : design.accent,
            side: THREE.DoubleSide, roughness: 0.35,
        });
        segmentMats.push(mat);
        canopyGroup.add(new THREE.Mesh(geo, mat));
    }
})();

// 테두리+팁+살+축+손잡이
canopyGroup.add((function() { var m = new THREE.Mesh(new THREE.TorusGeometry(CONFIG.canopyRadius * 0.97, 0.012, 6, 48), new THREE.MeshStandardMaterial({ color: 0x333333 })); m.rotation.x = Math.PI / 2; m.position.y = -0.04; return m; })());
canopyGroup.add((function() { var m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0x222222 })); m.position.y = CONFIG.canopyHeight + 0.09; return m; })());

for (var ri = 0; ri < CONFIG.segments; ri++) {
    var rAng = (Math.PI * 2 * ri) / CONFIG.segments;
    var rm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, CONFIG.canopyRadius, 4), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    rm.position.set(Math.cos(rAng) * CONFIG.canopyRadius * 0.5, CONFIG.canopyHeight * 0.22, Math.sin(rAng) * CONFIG.canopyRadius * 0.5);
    rm.lookAt(new THREE.Vector3(Math.cos(rAng) * CONFIG.canopyRadius, -0.03, Math.sin(rAng) * CONFIG.canopyRadius));
    rm.rotateX(Math.PI / 2);
    canopyGroup.add(rm);
}

umbrellaGroup.add((function() { var m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.2 })); m.position.y = -0.75; m.castShadow = true; return m; })());

umbrellaGroup.add((function() {
    var c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -1.5, 0), new THREE.Vector3(0, -1.62, 0), new THREE.Vector3(0.03, -1.7, 0), new THREE.Vector3(0.1, -1.76, 0), new THREE.Vector3(0.2, -1.78, 0), new THREE.Vector3(0.28, -1.75, 0), new THREE.Vector3(0.3, -1.65, 0)]);
    return new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.03, 8, false), new THREE.MeshStandardMaterial({ color: 0xC8A05A, roughness: 0.5 }));
})());

// 담긴 물
var bucketWaterMat = new THREE.MeshStandardMaterial({ color: 0x3399cc, transparent: true, opacity: 0, roughness: 0.05, metalness: 0.4 });
var bucketWater = new THREE.Mesh(new THREE.CircleGeometry(CONFIG.canopyRadius * 0.55, 16), bucketWaterMat);
bucketWater.rotation.x = Math.PI / 2; bucketWater.position.y = -0.1; bucketWater.visible = false;
canopyGroup.add(bucketWater);

// ============================================================
// 비
// ============================================================
var rainGeo = new THREE.BufferGeometry();
var rainPositions = new Float32Array(CONFIG.rainCount * 6);
var rainSpeeds = new Float32Array(CONFIG.rainCount);

function resetRaindrop(i, randomY) {
    var idx = i * 6;
    var x = (Math.random() - 0.5) * (W - 0.5);
    var z = (Math.random() - 0.5) * (D - 0.5);
    var y = randomY ? (H + Math.random() * 5) : (H + 2 + Math.random() * 3);
    var len = 0.1 + Math.random() * 0.15;
    rainPositions[idx] = x; rainPositions[idx + 1] = y; rainPositions[idx + 2] = z;
    rainPositions[idx + 3] = x; rainPositions[idx + 4] = y - len; rainPositions[idx + 5] = z;
    rainSpeeds[i] = 0.06 + Math.random() * 0.08;
}
for (var i = 0; i < CONFIG.rainCount; i++) resetRaindrop(i, true);
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
var rainMat = new THREE.LineBasicMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.3 });
var rainMesh = new THREE.LineSegments(rainGeo, rainMat);
scene.add(rainMesh);

// ============================================================
// 스플래시
// ============================================================
var splashes = [];
function createSplash(pos, color, count) {
    count = count || 8;
    for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1 + Math.random() * 2;
        var sm = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 5), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 }));
        sm.position.set(pos.x, pos.y, pos.z);
        scene.add(sm);
        splashes.push({ mesh: sm, vx: Math.cos(angle) * speed * 0.025, vy: 0.06 + Math.random() * 0.05, vz: Math.sin(angle) * speed * 0.025, life: 1 });
    }
}

// ============================================================
// 번개
// ============================================================
function triggerLightning() {
    var el = document.getElementById('lightning');
    el.classList.add('flash');
    ambientLight.intensity = 2.0;
    setTimeout(function() {
        el.classList.remove('flash');
        ambientLight.intensity = 0.4;
    }, 80);
    setTimeout(function() {
        el.classList.add('flash');
        ambientLight.intensity = 1.5;
        setTimeout(function() {
            el.classList.remove('flash');
            ambientLight.intensity = 0.4 + state.level * 0.02;
        }, 50);
    }, 150);
}

// ============================================================
// 레벨 시스템
// ============================================================
function getLevel() {
    if (state.elapsed < 20) return 1;
    if (state.elapsed < 45) return 2;
    if (state.elapsed < 75) return 3;
    if (state.elapsed < 120) return 4;
    return 5;
}

function applyLevelEffects() {
    var newLevel = getLevel();
    if (newLevel !== state.level) {
        state.level = newLevel;
        // 비 강화
        rainMat.opacity = 0.3 + state.level * 0.08;
        // 번개
        triggerLightning();
    }
    // 레벨에 따라 비 속도 증가
    var speedBoost = 1 + (state.level - 1) * 0.3;
    for (var i = 0; i < CONFIG.rainCount; i++) {
        rainSpeeds[i] = (0.06 + Math.random() * 0.08) * speedBoost;
    }
    // 랜덤 번개 (레벨 높을수록 자주)
    if (state.level >= 2 && Date.now() - state.lastLightning > (5000 / state.level)) {
        if (Math.random() < 0.01 * state.level) {
            triggerLightning();
            state.lastLightning = Date.now();
        }
    }
    document.getElementById('level').textContent = '⚡ Lv.' + state.level + (state.level >= 4 ? ' STORM!' : '');
}

// ============================================================
// 우산 동선 (벽 밖으로 나감)
// ============================================================
function animateTo(targets, duration, onDone) {
    var t0 = Date.now();
    function tick() {
        var p = Math.min((Date.now() - t0) / duration, 1);
        var t = p * p * (3 - 2 * p);
        for (var i = 0; i < targets.length; i++) {
            var tgt = targets[i];
            var val = tgt.from + (tgt.to - tgt.from) * t;
            if (tgt.prop === 'px') umbrellaGroup.position.x = val;
            else if (tgt.prop === 'py') umbrellaGroup.position.y = val;
            else if (tgt.prop === 'pz') umbrellaGroup.position.z = val;
            else if (tgt.prop === 'rx') umbrellaGroup.rotation.x = val;
            else if (tgt.prop === 'rz') umbrellaGroup.rotation.z = val;
        }
        if (p < 1) requestAnimationFrame(tick);
        else { if (onDone) onDone(); }
    }
    tick();
}

function doScoop() {
    state.isAnimating = true;
    state.phase = 'full';
    var amount = Math.min(CONFIG.scoopAmount, state.waterLevel);
    state.waterLevel = Math.max(0, state.waterLevel - amount);
    var waterY = 0.21 + state.waterLevel * (H - 0.21);
    var targetY = waterY + 1.0;

    animateTo([
        { prop: 'py', from: umbrellaGroup.position.y, to: targetY },
        { prop: 'rx', from: 0, to: Math.PI },
    ], 400, function() {
        bucketWater.visible = true;
        bucketWaterMat.opacity = 0.6;
        createSplash({ x: 0, y: waterY + 0.1, z: 0 }, 0x66ccee, 6 + state.level * 2);
        state.isAnimating = false;
    });
    document.getElementById('phase').textContent = '🔄 클릭! 밖으로 버리기!';
}

function doDump() {
    state.isAnimating = true;
    state.phase = 'empty';
    var curY = umbrellaGroup.position.y;
    var aboveY = H + 1.5;
    var dumpX = W / 2 + 2.5;

    // 위로 → 밖으로 → 쏟기 → 복귀
    animateTo([{ prop: 'py', from: curY, to: aboveY }], 250, function() {
        animateTo([{ prop: 'px', from: 0, to: dumpX }], 200, function() {
            animateTo([
                { prop: 'rx', from: Math.PI, to: 0.3 },
                { prop: 'rz', from: 0, to: -0.8 },
            ], 200, function() {
                bucketWater.visible = false;
                bucketWaterMat.opacity = 0;
                createSplash({ x: dumpX, y: aboveY - 1, z: 0 }, 0x55aadd, 8 + state.level * 2);
                // 복귀
                animateTo([
                    { prop: 'px', from: dumpX, to: 0 },
                    { prop: 'rz', from: -0.8, to: 0 },
                    { prop: 'rx', from: 0.3, to: 0 },
                ], 250, function() {
                    animateTo([{ prop: 'py', from: aboveY, to: H - 0.5 }], 200, function() {
                        state.isAnimating = false;
                    });
                });
            });
        });
    });
    document.getElementById('phase').textContent = '🪣 클릭! 물 퍼담기!';
}

// ============================================================
// 입력 / UI
// ============================================================
function showClickText(x, y, texts) {
    var el = document.createElement('div');
    el.className = 'click-text';
    el.textContent = texts[Math.floor(Math.random() * texts.length)];
    el.style.left = (x - 50) + 'px';
    el.style.top = (y - 20) + 'px';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 800);
}

function updateDesign() {
    var design = DESIGNS[state.designIndex];
    for (var i = 0; i < segmentMats.length; i++) {
        segmentMats[i].color.setHex((i % 2 === 0) ? design.main : design.accent);
    }
}

var pointerDownPos = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointerdown', function(e) { pointerDownPos.x = e.clientX; pointerDownPos.y = e.clientY; });
renderer.domElement.addEventListener('pointerup', function(e) {
    if (Math.abs(e.clientX - pointerDownPos.x) < 8 && Math.abs(e.clientY - pointerDownPos.y) < 8) {
        handleClick(e.clientX, e.clientY);
    }
});

function handleClick(cx, cy) {
    if (state.isGameOver || state.isAnimating) return;
    state.clicks++;
    if (state.phase === 'empty') { doScoop(); showClickText(cx, cy, SCOOP_TEXTS); }
    else { doDump(); showClickText(cx, cy, DUMP_TEXTS); }
    state.designIndex = (state.designIndex + 1) % DESIGNS.length;
    updateDesign();
}

document.getElementById('retryBtn').addEventListener('click', resetGame);

// ============================================================
// 게임
// ============================================================
function resetGame() {
    state.waterLevel = 0;
    state.isGameOver = false;
    state.startTime = Date.now();
    state.elapsed = 0;
    state.clicks = 0;
    state.phase = 'empty';
    state.isAnimating = false;
    state.level = 1;
    umbrellaGroup.rotation.set(0, 0, 0);
    umbrellaGroup.position.set(0, H - 0.5, 0);
    bucketWater.visible = false;
    bucketWaterMat.opacity = 0;
    rainMat.opacity = 0.3;
    document.getElementById('gameOver').classList.remove('show');
    document.getElementById('phase').textContent = '🪣 클릭! 물 퍼담기!';
}

function formatTime(s) { var m = Math.floor(s / 60); var sec = Math.floor(s % 60); return m + ':' + (sec < 10 ? '0' : '') + sec; }

function updateGame() {
    if (state.isGameOver) return;
    state.elapsed = (Date.now() - state.startTime) / 1000;
    var speedMult = 1 + state.elapsed * CONFIG.waterAccel;
    state.waterLevel = Math.min(state.waterLevel + CONFIG.waterRiseBase * speedMult, 1);

    applyLevelEffects();

    if (state.waterLevel >= 1) {
        state.isGameOver = true;
        triggerLightning();
        document.getElementById('gameOver').classList.add('show');
        document.getElementById('resultText').textContent = '버틴 시간: ' + formatTime(state.elapsed) + ' | Lv.' + state.level + ' | 클릭: ' + state.clicks;
    }

    var pct = Math.round(state.waterLevel * 100);
    document.getElementById('timer').textContent = formatTime(state.elapsed);
    document.getElementById('info').textContent = '💧 ' + pct + '% | ☂️ ' + state.clicks;
    document.getElementById('gaugeFill').style.height = pct + '%';
    document.getElementById('gaugePercent').textContent = pct + '%';
    if (pct >= 70) document.getElementById('gaugeFill').classList.add('danger');
    else document.getElementById('gaugeFill').classList.remove('danger');
}

// ============================================================
// 렌더 루프
// ============================================================
function animate() {
    requestAnimationFrame(animate);
    var time = Date.now() * 0.001;
    controls.update();
    updateGame();

    // 물 높이
    var waterY = 0.21 + state.waterLevel * (H - 0.21);
    waterMesh.position.y = waterY;

    // 비
    var rArr = rainGeo.attributes.position.array;
    var speedBoost = 1 + (state.level - 1) * 0.25;
    for (var i = 0; i < CONFIG.rainCount; i++) {
        var idx = i * 6;
        var spd = rainSpeeds[i] * speedBoost;
        rArr[idx + 1] -= spd;
        rArr[idx + 4] -= spd;
        if (rArr[idx + 1] < waterY) resetRaindrop(i, false);
    }
    rainGeo.attributes.position.needsUpdate = true;

    // 스플래시
    for (var j = splashes.length - 1; j >= 0; j--) {
        var s = splashes[j];
        s.mesh.position.x += s.vx;
        s.mesh.position.y += s.vy;
        s.mesh.position.z += s.vz;
        s.vy -= 0.004;
        s.life -= 0.025;
        s.mesh.material.opacity = Math.max(0, s.life);
        if (s.life <= 0) { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); splashes.splice(j, 1); }
    }

    // 우산 idle
    if (!state.isAnimating && state.phase === 'empty') {
        umbrellaGroup.position.y = (H - 0.5) + Math.sin(time * 0.7) * 0.06;
        umbrellaGroup.rotation.z = Math.sin(time * 0.9) * 0.02;
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

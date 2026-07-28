// 빠칭코 스타일 BGM (Web Audio API로 생성)
var audioCtx = null;
var bgmPlaying = false;
var bgmInterval = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playNote(freq, duration, time, type, vol) {
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + duration);
}

function playBGMLoop() {
    if (!audioCtx) return;
    var now = audioCtx.currentTime;
    // 빠칭코 느낌: 밝고 반복적인 멜로디
    var melody = [523, 659, 784, 659, 523, 784, 659, 523, 587, 698, 880, 784, 698, 587, 523, 659];
    var bass = [262, 262, 330, 330, 349, 349, 262, 262, 294, 294, 349, 349, 262, 262, 330, 330];
    
    for (var i = 0; i < melody.length; i++) {
        playNote(melody[i], 0.15, now + i * 0.18, "square", 0.06);
        playNote(bass[i], 0.16, now + i * 0.18, "triangle", 0.04);
    }
    // 드럼 비트
    for (var j = 0; j < 8; j++) {
        playNote(80, 0.05, now + j * 0.36, "sawtooth", 0.1);
        playNote(200, 0.03, now + j * 0.36 + 0.18, "square", 0.05);
    }
}

function toggleBGM() {
    initAudio();
    if (bgmPlaying) {
        clearInterval(bgmInterval);
        bgmInterval = null;
        bgmPlaying = false;
        document.querySelector(".sound-btn").textContent = "🔇 BGM";
    } else {
        playBGMLoop();
        bgmInterval = setInterval(playBGMLoop, 2880);
        bgmPlaying = true;
        document.querySelector(".sound-btn").textContent = "🔊 BGM";
    }
}

// 성공/실패 효과음
function playSfxWin() {
    initAudio();
    if (!audioCtx) return;
    var now = audioCtx.currentTime;
    playNote(523, 0.1, now, "square", 0.12);
    playNote(659, 0.1, now + 0.1, "square", 0.12);
    playNote(784, 0.15, now + 0.2, "square", 0.12);
    playNote(1047, 0.2, now + 0.35, "square", 0.1);
}

function playSfxLose() {
    initAudio();
    if (!audioCtx) return;
    var now = audioCtx.currentTime;
    playNote(300, 0.2, now, "sawtooth", 0.12);
    playNote(200, 0.3, now + 0.2, "sawtooth", 0.1);
    playNote(100, 0.4, now + 0.4, "sawtooth", 0.08);
}

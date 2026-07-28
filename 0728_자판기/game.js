var ITEMS=[
{name:"풍선껌",price:50,art:"gum",desc:"씹 으면 행복 하다"},
{name:"편지",price:80,art:"letter",desc:"감사 하다고 하다"},
{name:"물",price:300,art:"water",desc:"투명 한 액체 다"},
{name:"캔커피",price:400,art:"coffee",desc:"검은 액체 다"},
{name:"삼각김밥",price:1500,art:"rice",desc:"편의점 의 왕 이다"},
{name:"아이스크림",price:1800,art:"icecream",desc:"녹기 전 에 먹다"},
{name:"치킨",price:8000,art:"chicken",desc:"소울 푸드 다"},
{name:"피자",price:9000,art:"pizza",desc:"원형 빵 이다"},
{name:"이어폰",price:30000,art:"earphone",desc:"귀 장치 다"},
{name:"게임기",price:40000,art:"gamepad",desc:"생산성 파괴 하다"},
{name:"전화기",price:150000,art:"phone",desc:"매년 사야 하다"},
{name:"가방",price:400000,art:"bag",desc:"가방 그 이상 이다"},
{name:"시계",price:3000000,art:"watch",desc:"비싼 방법 이다"},
{name:"자동차",price:4000000,art:"car",desc:"금속 상자 다"},
{name:"전기차",price:30000000,art:"car",desc:"미래 상자 다"},
{name:"요트",price:45000000,art:"yacht",desc:"물 위 의 집 이다"},
{name:"아파트",price:300000000,art:"building",desc:"비싼 상자 다"},
{name:"건물",price:450000000,art:"building",desc:"월세 받다"},
{name:"섬",price:5000000000,art:"island",desc:"당신 의 땅 이다"},
{name:"축구팀",price:8000000000,art:"soccer",desc:"22명 이 공 찬다"},
{name:"나라",price:50000000000,art:"planet",desc:"왕 이라 부른다"},
{name:"항공모함",price:80000000000,art:"ship",desc:"바다 위 공항 이다"},
{name:"달기지",price:500000000000,art:"moon",desc:"달 에 집 짓다"},
{name:"세계정복",price:999000000000,art:"crown",desc:"당신 이 이겼다"},
];

var BET_OPTIONS=[
{pct:75,mult:1.2,label:"75%"},
{pct:50,mult:2,label:"50%"},
{pct:25,mult:5,label:"25%"},
{pct:10,mult:10,label:"10%"},
{pct:5,mult:100,label:"5%"},
{pct:1,mult:10000,label:"1%"},
{pct:0.5,mult:10000000,label:"0.5%"},
];

var money = 10;
var streak = 0;
var curBet = 2;
var bought = [];
var busy = false;
var checkpoints = [100000, 1000000000, 10000000000, 100000000000, 500000000000];
var reachedCheckpoint = -1; // 도달한 최고 체크포인트 index
var easterClicks = 0;
var gameClear = false;

function fmt(n) {
    if (n >= 1000000000000) return (n / 1000000000000).toFixed(1) + "조";
    if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
    if (n >= 10000) return (n / 10000).toFixed(1) + "만";
    return n.toLocaleString() + "원";
}

// 이스터에그: 커맨드 누른 상태로 버튼 아닌곳 3번 클릭
document.addEventListener("click", function(e) {
    if (!e.metaKey && !e.ctrlKey) { easterClicks = 0; return; }
    // 버튼이 아닌 곳인지 체크
    if (e.target.tagName === "BUTTON") { easterClicks = 0; return; }
    easterClicks++;
    if (easterClicks >= 3) {
        easterClicks = 0;
        showClear();
    }
});

function showClear() {
    gameClear = true;
    var d = document.createElement("div");
    d.className = "overlay easter";
    d.innerHTML = '<div class="easter-content">' +
        '<div class="easter-crown">👑</div>' +
        '<div class="easter-title">모든 것 의 신</div>' +
        '<div class="easter-sub">자판기 의 왕</div>' +
        '<div class="easter-desc">당신 은 모든 것 을 손 에 넣었다...<br>자판기 의 모든 물건 이 당신 의 것 이다</div>' +
        '<br><button class="restart-btn" onclick="restartGame()">다시 하다</button>' +
        '</div>';
    document.body.appendChild(d);
}

function restartGame() {
    bought = [];
    money = 10;
    streak = 0;
    reachedCheckpoint = -1;
    gameClear = false;
    var overlays = document.querySelectorAll(".overlay");
    overlays.forEach(function(o) { o.remove(); });
    update();
}

function checkGameClear() {
    // 모든 아이템을 구매했는지
    var allBought = ITEMS.every(function(item) {
        return bought.indexOf(item) !== -1;
    });
    if (allBought) {
        setTimeout(showClear, 300);
    }
}

function update() {
    if (gameClear) return;
    for (var ci = checkpoints.length - 1; ci >= 0; ci--) {
        if (money >= checkpoints[ci] && ci > reachedCheckpoint) {
            reachedCheckpoint = ci;
            break;
        }
    }

    document.getElementById("money").textContent = fmt(money);
    var opt = BET_OPTIONS[curBet];
    var reward = Math.floor(money * opt.mult);
    document.getElementById("reward-big").textContent = opt.mult + "배!";
    document.getElementById("reward-sub").textContent = "(성공 하면 " + fmt(money + reward) + ")";
    document.getElementById("streak").textContent = streak;
    renderShop();
    renderOwned();
    renderTooltip();
}

function renderShop() {
    var el = document.getElementById("vm-grid");
    var html = "";
    ITEMS.forEach(function(item, idx) {
        var can = money >= item.price;
        var owned = bought.indexOf(item) !== -1;
        var cls = "vm-item";
        if (owned) cls += " vm-owned";
        else if (can) cls += " vm-can";
        else cls += " vm-locked";

        html += '<div class="' + cls + '" ' + (can && !owned ? 'onclick="buy(' + idx + ')"' : '') + '>';
        if (can || owned) {
            html += '<canvas data-art="' + item.art + '" width="24" height="24"></canvas>';
            html += '<div class="vn">' + (owned ? "[보유]" : item.name) + '</div>';
            html += '<div class="vp">' + (owned ? "✓" : fmt(item.price)) + '</div>';
        } else {
            html += '<div style="font-size:16px;color:#666">??</div>';
            html += '<div class="vn">???????</div>';
            html += '<div class="vp">???????</div>';
        }
        html += '</div>';
    });
    el.innerHTML = html;
    document.querySelectorAll("#vm-grid canvas").forEach(function(c) {
        drawPixelArt(c, c.dataset.art, 3);
    });
}

function renderOwned() {
    var el = document.getElementById("owned");
    if (bought.length === 0) {
        el.innerHTML = '<p class="empty-text">아무것 도 없다</p>';
        return;
    }
    var html = "";
    bought.forEach(function(item) {
        html += '<div class="o-item">';
        html += '<canvas data-art="' + item.art + '" width="12" height="12"></canvas>';
        html += '<span>' + item.name + '</span></div>';
    });
    el.innerHTML = html;
    document.querySelectorAll("#owned canvas").forEach(function(c) {
        drawPixelArt(c, c.dataset.art, 2);
    });
}

function renderTooltip() {
    var el = document.getElementById("tooltip-list");
    var html = "";
    ITEMS.forEach(function(item) {
        var can = money >= item.price;
        var owned = bought.indexOf(item) !== -1;
        if (owned) {
            html += '<div class="tip-item tip-can">[보유] ' + item.name + '</div>';
        } else if (can) {
            html += '<div class="tip-item tip-can">' + item.name + ' (' + fmt(item.price) + ')</div>';
        } else {
            html += '<div class="tip-item tip-locked">??????? (' + fmt(item.price) + ')</div>';
        }
    });
    el.innerHTML = html;
}

function initBetButtons() {
    var el = document.getElementById("bet-options");
    var html = "";
    BET_OPTIONS.forEach(function(opt, idx) {
        html += '<button class="b-btn' + (idx === curBet ? ' active' : '') + '" onclick="setBet(' + idx + ')">' + opt.label + '</button>';
    });
    el.innerHTML = html;
}

function setBet(idx) {
    curBet = idx;
    document.querySelectorAll(".b-btn").forEach(function(b, i) {
        b.className = i === idx ? "b-btn active" : "b-btn";
    });
    update();
}

function doGamble() {
    if (busy || gameClear) return;
    var opt = BET_OPTIONS[curBet];



    var chance = opt.pct / 100;
    busy = true;

    setTimeout(function() {
        var win = Math.random() < chance;
        if (win) {
            var gain = Math.floor(money * opt.mult);
            money += gain;
            streak++;
            document.getElementById("result").textContent = "성공 하다! +" + fmt(gain) + " 을 벌다!";
            document.getElementById("result").className = "result w";
            spawnCoins(Math.min(streak * 3 + 5, 40));
            playSfxWin();
        } else {
            var lost = Math.floor(money * 0.5);
            money -= lost;
            streak = 0;
            spawnLoseEffect();
            playSfxLose();
            document.getElementById("result").innerHTML = '<span style="font-size:18px">대 - NO!</span><br>소 - 50% 잃었어요 (-' + fmt(lost) + ')';
            document.getElementById("result").className = "result l";

            if (money <= 0) {
                setTimeout(function(){gameOver('zero');}, 600);
            } else if (reachedCheckpoint >= 0 && money < checkpoints[reachedCheckpoint]) {
                setTimeout(function(){gameOver('checkpoint');}, 600);
            }
        }
        update();
        busy = false;
    }, 200);
}

function buy(idx) {
    if (gameClear) return;
    var item = ITEMS[idx];
    if (money < item.price) return;
    if (bought.indexOf(item) !== -1) return;

    // 동전 투입 애니메이션
    animateCoinInsert(function() {
        money -= item.price;
        bought.push(item);
        document.getElementById("result").textContent = item.name + " 을 구매 하다! -- " + item.desc;
        document.getElementById("result").className = "result w";
        spawnCoins(5);
        playSfxWin();
        update();
        checkGameClear();
    });
}

function animateCoinInsert(callback) {
    var coinSlot = document.querySelector(".vm-coin-slot");
    if (!coinSlot) { callback(); return; }
    var rect = coinSlot.getBoundingClientRect();
    var coin = document.createElement("div");
    coin.className = "insert-coin";
    coin.textContent = "🪙";
    coin.style.left = (rect.left + rect.width/2) + "px";
    coin.style.top = (rect.top - 60) + "px";
    document.body.appendChild(coin);

    // 동전이 슬롯으로 떨어지는 애니메이션
    setTimeout(function() {
        coin.style.top = (rect.top + rect.height/2) + "px";
        coin.style.opacity = "0";
        coin.style.transform = "scale(0.3)";
    }, 50);

    setTimeout(function() {
        coin.remove();
        // 찰칵 소리
        if (typeof playSfxWin === "function") {
            initAudio();
            if (audioCtx) {
                var osc = audioCtx.createOscillator();
                var gain = audioCtx.createGain();
                osc.type = "sine";
                osc.frequency.value = 1200;
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.1);
            }
        }
        callback();
    }, 500);
}

function gameOver(reason) {
    bought = [];
    money = 10;
    streak = 0;
    reachedCheckpoint = -1;
    var msg = "";
    if (reason === "checkpoint") {
        msg = "GAME OVER<br><br>하한선 이하 로 떨어졌다..<br><br>한번 올라간 자 는 떨어지면 끝 이다..<br>다시 처음 부터 시작 하라<br><br><span>클릭 하라</span>";
    } else if (reason === "zero") {
        msg = "GAME OVER<br><br>0원 이 되었다..<br><br>무일푼.. 다시 시작 하라<br><br><span>클릭 하라</span>";
    } else if (reason === "trap") {
        msg = "GAME OVER<br><br>욕심 을 부리다 모든 것 을 잃다..<br><br>정정당당 하게 일해서 버는 것 이다..<br><br><span>클릭 하라</span>";
    } else {
        msg = "GAME OVER<br><br>사기 를 당해 모든 것 을 잃다..<br><br>정정당당 하게 일해서 버는 것 이다..<br><br><span>클릭 하라</span>";
    }
    var d = document.createElement("div");
    d.className = "overlay go";
    d.innerHTML = msg;
    d.onclick = function() { d.remove(); update(); };
    document.body.appendChild(d);
    playSfxLose();
    setTimeout(function() { if (d.parentNode) d.remove(); update(); }, 4000);
}

initBetButtons();
update();

// 배너 업로드
var bannerLinks = { left: "", right: "" };

function uploadBanner(side) {
    document.getElementById("ad-file-" + side).click();
}

function setBanner(side, input) {
    if (!input.files || !input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var link = prompt("배너 클릭 시 이동할 링크 를 입력 하라 (없으면 비워두라)") || "";
        bannerLinks[side] = link;
        var container = document.getElementById("ad-" + side);
        container.innerHTML = '<img src="' + e.target.result + '" class="ad-img" onclick="clickBanner(\'' + side + '\')">';
        container.innerHTML += '<input type="file" id="ad-file-' + side + '" accept="image/*" onchange="setBanner(\'' + side + '\',this)" hidden>';
        container.innerHTML += '<div class="ad-change" onclick="uploadBanner(\'' + side + '\')">변경</div>';
    };
    reader.readAsDataURL(input.files[0]);
}

function clickBanner(side) {
    if (bannerLinks[side]) {
        window.open(bannerLinks[side], "_blank");
    }
}

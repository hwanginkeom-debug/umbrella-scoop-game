var pixelData={
coin:["..yyyy..","yYYYYYy.","yYyYYyYy","yYYyyYYy","yYyYYyYy","yYYYYYy.","..yyyy.."],
gum:["..pppp..",".pPPPPp.",".pPPPPp.",".pPPPPp.","..pppp..","...pp...","...pp..."],
coffee:[".wwwww..",".wBBBw..",".wBbBw.w",".wBBBw..",".wwwww.."],
water:["..bbbb..",".bBBBBb.",".bBBBBb.",".bBBBBb.","..bbbb.."],
letter:["wwwwwwww","wW....Ww","w..WW..w","w......w","wwwwwwww"],
rice:["...ww...",".wBBBBw.","wBBBBBBw",".wwwwww."],
icecream:["..pPPp..",".pPPPPp.","..yyyy..","...yy...","...yy..."],
chicken:["..bbb...",".bBBBb..","bBBBBBb.","bBBBBBb.",".bBBBb..","..b.b..."],
pizza:["..yyyy..",".yRRRRy.","yRRrRRRy",".yRRRRy.","..yyyy.."],
earphone:[".ss..ss.","sBBssBBs","sBBssBBs",".ss..ss."],
gamepad:[".ssssss.","sBrBBrBs","ssBBBBss","..ssss.."],
phone:[".ssssss.",".sBBBBs.",".sbbbbs.",".sbbbbs.",".sBBBBs.",".ssssss."],
bag:["...bb...",".bBBBBb.",".bBBBBb.",".bBBBBb.","..bbbb.."],
watch:["..ssss..",".sGGGGs.",".sGssGs.",".sGGGGs.","..ssss.."],
car:["...rrr..","..rRRRr.","rrRRRRrr","rOrrrOr."],
yacht:["....w...","...ww...","bbbbbbb.",".bBBBb.."],
building:["ssssssss","swswswsw","ssssssss","swswswsw","sBBBBsss"],
island:["...gg...",".gGGGGg.","bbbbbbbb","bBBBBBBb"],
soccer:["..wwww..",".wBwwBw.","wBBwwBBw",".wBwwBw.","..wwww.."],
ship:["..ssss..",".ssssss.","ssssssss",".BBBBBB."],
moon:["..yyyy..",".yYYYy..","yYYYYy..","yYYYYy..",".yYYYy..","..yyyy.."],
crown:["g.g.g.g.","gGgGgGg.",".GGGGGG.",".GrGrGG.",".GGGGGG."],
planet:["..pppp..",".pPPPPp.","pPPppPPp","pPPPPPPp",".pPPPPp.","..pppp.."],
};
var colorMap={"y":"#b8860b","Y":"#ffd700","p":"#ff69b4","P":"#ffb6c1","w":"#ffffff","W":"#ddd","B":"#222","b":"#4488ff","s":"#808080","S":"#c0c0c0","r":"#cc0000","R":"#ff4444","g":"#228b22","G":"#44cc44","O":"#ff8800",".":null};

function drawPixelArt(canvas,name,scale){
    scale=scale||3;
    var data=pixelData[name]||pixelData["coin"];
    var ctx=canvas.getContext("2d");
    canvas.width=data[0].length*scale;
    canvas.height=data.length*scale;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=false;
    for(var r=0;r<data.length;r++){
        for(var c=0;c<data[r].length;c++){
            var cl=colorMap[data[r][c]];
            if(cl){ctx.fillStyle=cl;ctx.fillRect(c*scale,r*scale,scale,scale);}
        }
    }
}

// 코인
var coinCvs=document.getElementById("coin-canvas");
var coinCtx=coinCvs.getContext("2d");
var coins=[];var coinAnim=null;
function resizeC(){coinCvs.width=window.innerWidth;coinCvs.height=window.innerHeight;}
resizeC();window.addEventListener("resize",resizeC);

function spawnCoins(n){
    var cx=window.innerWidth/2,cy=60;
    for(var i=0;i<n;i++){
        coins.push({x:cx+(Math.random()-0.5)*80,y:cy,vx:(Math.random()-0.5)*12,vy:-(Math.random()*8+3),size:5+Math.random()*4,life:1,ground:cy+200+Math.random()*400});
    }
    if(!coinAnim)runC();
}
function spawnLoseEffect(){
    var cx=window.innerWidth/2,cy=60;
    for(var i=0;i<12;i++){coins.push({x:cx,y:cy,vx:(Math.random()-0.5)*20,vy:-(Math.random()*6+2),size:3+Math.random()*3,life:1,ground:cy+300,red:true});}
    if(!coinAnim)runC();
}
function runC(){
    coinCtx.clearRect(0,0,coinCvs.width,coinCvs.height);
    coins=coins.filter(function(c){
        c.vy+=0.45;c.x+=c.vx;c.y+=c.vy;c.life-=0.013;
        if(c.y>c.ground){c.y=c.ground;c.vy*=-0.5;c.vx*=0.7;}
        if(c.life<=0)return false;
        coinCtx.globalAlpha=c.life;
        coinCtx.fillStyle=c.red?"#f00":"#ffd700";
        coinCtx.fillRect(c.x-c.size/2,c.y-c.size/2,c.size,c.size);
        if(!c.red){coinCtx.fillStyle="#fff";coinCtx.fillRect(c.x-c.size/2,c.y-c.size/2,2,2);}
        coinCtx.globalAlpha=1;
        return true;
    });
    if(coins.length>0)coinAnim=requestAnimationFrame(runC);else coinAnim=null;
}

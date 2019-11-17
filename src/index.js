const canvas = document.getElementById('canvas');
const context = canvas.getContext("2d");

const killSound = new Audio('/static/assets/kill.wav');
const shootSounds = [new Audio('/static/assets/shoot.wav'), new Audio('/static/assets/shoot.wav'), new Audio('/static/assets/shoot.wav')];
let shootSoundIteration = 0;
const dieSound = new Audio('/static/assets/die.wav');
let isDead = false;

let mouseX = 0;
let mouseY = 0;

let playerX = 0;
let playerY = 0;

let standard_res;
let positions;

const socket = io({
    reconnection: false,
    timeout: 2500
});

socket.on('standard_res', (resolution) => {
    standard_res = resolution;
});

socket.on('positions', (pos) => {
    positions = pos;
});

socket.on('projectiles', (objects) => {
    for(let key in objects){
        if(projectiles[key] == null && !isDead){
            projectiles[key] = new Projectile(false).fromObject(objects[key]);
        }
    }
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if(socket != null){
        socket.emit('res', {width: canvas.width, height: canvas.height});
    }
}

window.addEventListener("keypress", (e) => {if(e.keyCode == 32){fire();} if(e.keyCode == 13 && isDead){restart();}}, false);

document.onmousemove = function(e){
    mouseX = e.x;
    mouseY = e.y;
}

function glideFrame(){
    let vx = (mouseX - playerX) / 8;
    let vy = (mouseY - playerY) / 8;

    playerX += vx;
    playerY += vy;

    playerX = playerX < (canvas.width - standard_res.width)/2 ? (canvas.width - standard_res.width)/2 : playerX;
    playerY = playerY < (canvas.height - standard_res.height)/2 ? (canvas.height - standard_res.height)/2 : playerY;
    
    playerX = playerX > (canvas.width - standard_res.width)/2 + standard_res.width ? (canvas.width - standard_res.width)/2 + standard_res.width : playerX;
    playerY = playerY > (canvas.height - standard_res.height)/2 + standard_res.height ? (canvas.height - standard_res.height)/2 + standard_res.height : playerY;

    socket.emit('pos', {x: playerX - (canvas.width - standard_res.width)/2, y: playerY - (canvas.height - standard_res.height)/2, id: socket.id});
}

let projectiles = {};

function updateCanvas(){
    glideFrame();

    context.clearRect(0, 0, canvas.width, canvas.height);
    resizeCanvas();

    context.fillStyle = isDead ? '#200' : '#000';
    context.fillRect((canvas.width - standard_res.width)/2, (canvas.height - standard_res.height)/2, standard_res.width, standard_res.height)
    context.fillStyle = '#777';

    context.beginPath();
    context.arc(canvas.width/2, canvas.height/2, 3, 0, 2 * Math.PI);
    context.fill();

    for (let i = 0; i < positions.length; i++) {
        if(positions[i].id == socket.id || isDead){
            continue;
        }

        context.strokeStyle = '#FFF';
        context.beginPath();
        context.arc((canvas.width - standard_res.width)/2 + positions[i].x, (canvas.height - standard_res.height)/2 + positions[i].y, 6, 0, 2 * Math.PI);
        context.stroke();
    }

    if(!isDead){
        for (let key in projectiles) {
            try{
                projectiles[key].frame();
                projectiles[key].render();
                if(projectiles[key].checkHitbox()){
                    die();
                    delete projectiles[key];
                }
            }catch(e){}
        }
    }

    updateMouse();
}

function updateMouse(){
    playerX = playerX < (canvas.width - standard_res.width)/2 ? (canvas.width - standard_res.width)/2 : playerX;
    playerY = playerY < (canvas.height - standard_res.height)/2 ? (canvas.height - standard_res.height)/2 : playerY;
    
    playerX = playerX > (canvas.width - standard_res.width)/2 + standard_res.width ? (canvas.width - standard_res.width)/2 + standard_res.width : playerX;
    playerY = playerY > (canvas.height - standard_res.height)/2 + standard_res.height ? (canvas.height - standard_res.height)/2 + standard_res.height : playerY;

    if(!isDead){
        context.strokeStyle = '#777';
        context.setLineDash([12, 8]);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(playerX, playerY);
        context.lineTo(canvas.width/2, canvas.height/2);
        context.stroke();
        context.setLineDash([12, 0]);

        context.strokeStyle = '#fff';
        context.lineWidth = 3;

        var angle = getAngle(playerX, playerY, canvas.width/2, canvas.height/2);
        context.beginPath();
        context.arc(playerX, playerY, 12, angle - 1, angle + 1);
        context.stroke();
    }

    context.strokeStyle = '#fff';
    context.lineWidth = 3;

    context.beginPath();
    context.arc(playerX, playerY, 6, 0, 2 * Math.PI);
    context.stroke();

    
}

class Projectile{
    //this.id
    //this.vx
    //this.vy
    //this.x
    //this.y
    //this.angle

    constructor(own){
        this.id = create_UUID();
        this.x = playerX;
        this.y = playerY;
        this.width = 3;
        this.radius = 12;
        this.own = own;
        this.angle = getAngle(playerX, playerY, canvas.width/2, canvas.height/2);
        this.vx = -(Math.abs(getAngle(playerX, playerY, canvas.width/2, canvas.height/2)) / Math.PI - 0.5) * 40.0;
        this.vy = -(Math.abs(getAngle(playerY, playerX, canvas.height/2, canvas.width/2)) / Math.PI - 0.5) * 40.0;
        this.render = () => {
            context.strokeStyle = own ? '#FFF' : '#F55';
            context.lineWidth = this.width;
            context.beginPath();
            context.arc(this.x, this.y, this.radius, this.angle - 1, this.angle + 1);
            context.stroke();
        }
        this.drawHitbox = () => {
            context.beginPath();
            context.strokeStyle = '#F55';
            context.lineWidth = 1;
            var x = this.x + this.vx;
            var y = this.y + this.vy;
            context.arc(x, y, this.radius, 0, Math.PI*2);
            context.stroke();
        }
        this.frame = () => {
            this.x += this.vx;
            this.y += this.vy;
            this.radius += 0.2;

            if(this.x > canvas.width || this.y > canvas.height || this.y < 0 || this.x < 0){
                delete projectiles[this.id];
            }
        }
        this.serverData = () => {
            return {
                id: this.id, 
                x: this.x - (canvas.width - standard_res.width)/2,
                y: this.y - (canvas.height - standard_res.height)/2,
                angle: this.angle,
                vx: this.vx,
                vy: this.vy
            }
        }
        this.fromObject = (object) => {
            this.id = object.id;
            this.x = (canvas.width - standard_res.width)/2 + object.x;
            this.y = (canvas.height - standard_res.height)/2 + object.y;
            this.angle = object.angle;
            this.vx = object.vx;
            this.vy = object.vy;
            return this;
        }
        this.checkHitbox = () => {
            if(own){return;}

            var a = this.x - playerX;
            var b = this.y - playerY;
            var c = Math.sqrt( a*a + b*b );

            if(c - this.radius <= 0){
                return true;
            }
            return false;
        }
    }
}

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

let lastProjectile = 0;
function fire(){
    if(new Date().getTime() - lastProjectile > 150 && !isDead){
        shootSounds[shootSoundIteration % 3].play();
        shootSoundIteration++;
        let newProjectile = new Projectile(true);
        projectiles[newProjectile.id] = newProjectile;
        lastProjectile = new Date().getTime();
        socket.emit('fire', newProjectile.serverData());
    }
}

function die(){
    isDead = true;
    dieSound.play();
    socket.emit('die');
    projectiles = {};
    document.getElementById('text').classList.add('dead');
    document.getElementById('text').innerHTML = "press 'enter' to rejoin";
}

function restart(){
    isDead = false;
    socket.emit('revive');
    document.getElementById('text').classList.remove('dead');
    document.getElementById('text').innerHTML = "press 'space' to fire";
}

function getAngle(cx, cy, ex, ey) {
    var dy = ey - cy;
    var dx = ex - cx;
    var theta = Math.atan2(dy, dx);

    return theta;
}

//Canvas render clock
setInterval(updateCanvas, 1000/60);
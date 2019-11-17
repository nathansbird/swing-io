const express = require('express');
var port = process.env.PORT || 3000;
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/src/index.html');
});

app.get('/index.css', function(req, res){
    res.sendFile(__dirname + '/src/index.css');
});

app.get('/index.js', function(req, res){
    res.sendFile(__dirname + '/src/index.js');
});

app.use('/static/assets', express.static(__dirname + '/src/assets'));

let socketList = {};
let projectiles = {};

io.on('connection', function(socket){
    socketList[socket.id] = {};
    socketList[socket.id]['data'] = socket;
    socketList[socket.id]['isDead'] = false;
    socket.on('disconnect', function(){
        delete socketList[socket.id];
    });
    socket.on('res', function(resolution){
        if(socketList[socket.id] != null){
            socketList[socket.id]['resolution'] = resolution;
        }
    });
    socket.on('pos', function(pos){
        if(socketList[socket.id] != null){
            socketList[socket.id]['pos'] = pos;
        }
    });
    socket.on('fire', function(projectile){
        projectiles[projectile.id] = projectile;
    });
    socket.on('revive', function(){
        socketList[socket.id]['isDead'] = false;
    });
    socket.on('die', function(){
        socketList[socket.id]['isDead'] = true;
    });
});

function update(){
    let width = 0;
    let height = 0;
    let positions = [];

    for(let key in socketList){
        if(socketList[key]['resolution'] != null){
            let x = socketList[key]['resolution'].width;
            let y = socketList[key]['resolution'].height;
            
            if(width > x || width == 0){width = x;}
            if(height > y || height == 0){height = y;}

            if(!socketList[key]['isDead']){
                positions.push(socketList[key]['pos']);
            }
        }
    }

    io.sockets.emit('standard_res', {width: width, height: height});
    io.sockets.emit('positions', positions);
    io.sockets.emit('projectiles', projectiles);
    projectiles = {};
}

setInterval(update, 1000/20);

http.listen(port, function(){
    console.log('listening');
});
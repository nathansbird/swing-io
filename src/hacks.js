function cheatShot(){
    for (i of positions) {
        if(i.id == socket.id){
            continue;
        }
    
        var newItem = new Projectile(true);
        var newItem2 = new Projectile(true);
        var newItem3 = new Projectile(true);
        var newItem4 = new Projectile(true);
        newItem.serverData = function(){
            return {
                id: newItem.id, 
                x: i.x - 50,
                y: i.y,
                angle: newItem.angle,
                vx: 15,
                vy: 0
            }
        } 
        newItem2.serverData = function(){
            return {
                id: newItem2.id, 
                x: i.x + 50,
                y: i.y,
                angle: newItem2.angle,
                vx: -15,
                vy: 0
            }
        } 
        newItem3.serverData = function(){
            return {
                id: newItem3.id, 
                x: i.x,
                y: i.y - 50,
                angle: newItem3.angle,
                vx: 0,
                vy: 15
            }
        } 
        newItem4.serverData = function(){
            return {
                id: newItem4.id, 
                x: i.x,
                y: i.y + 50,
                angle: newItem4.angle,
                vx: 0,
                vy: -15
            }
        } 
        socket.emit('fire', newItem.serverData());
        socket.emit('fire', newItem2.serverData());
        socket.emit('fire', newItem3.serverData());
        socket.emit('fire', newItem4.serverData());
    }
}
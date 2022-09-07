const Defines = require("./defines.js");

const Events = require("events");
var event = new Events.EventEmitter();

const Hardware = require("./element.js");

var towers = new Array(Defines.dimension[0] * Defines.dimension[1] / 4);
for(var i = 0; i < towers.length; i++){
    towers[i] = new Hardware.Tower();
}

function HandleConnection(socket){
    var slaveID = socket.remoteAddress.replace(/^.*:/, '');
    slaveID = parseInt(slaveID.substring(slaveID.lastIndexOf('.')+1))-8;
    console.log(`A new connection has been established from: ${slaveID}`);

    towers[slaveID].SetTCPSlave(socket);

    socket.on('data', HandleData);
    socket.on('end', HandleEnd);
    socket.on('close', HandleClose);
    socket.on('error', HandleError);
}

function HandleData(chunk){
    if(chunk.length % 3 == 0){
        chunk = chunk.slice(-3);
        var val = (chunk[1]<<8) + chunk[2];
        var slaveID = -1;
        var actuatorID = parseInt(chunk[0],16);
        for(var i = 0; i < towers.length; i++){
            if(towers[i].TCP == this){
                slaveID = i;
                towers[i].ForcePosition(actuatorID, val);
                break;
            }                
        }
        
        //console.log(`Input on motor ${(slaveID % 4)*2 + i % 2}: ${Math.floor(slaveID/4)*2 + Math.floor(i/2)}`);
        if(slaveID >=0)
            event.emit("input", (slaveID % 4)*2 + actuatorID % 2, Math.floor(slaveID/4)*2 + Math.floor(actuatorID/2), val);
    } else {
        console.log(`Error: received wrong input of ${chunk.length} bytes`);
    }
}

function HandleEnd(){
    for(var i = 0; i < towers.length; i++){
        if(towers[i].TCP == slaveID){
            slaveID.SetTCPSlave(null);
            break;
        }                
    }
}

function HandleClose(){
    /*for(var i = 0; i < towers.length; i++){
        if(towers[i].TCP == slaveID){
            slaveID.SetTCPSlave(null);
            break;
        }                
    }*/
}

function HandleError(err) {
    console.log(`Error: ${err}`);
    /*for(var i = 0; i < towers.length; i++){
        if(towers[i].TCP == slaveID){
            slaveID.SetTCPSlave(null);
            break;
        }                
    }*/
}

function SetPosition(index, value, time){
    const val = Math.min(Math.max(value, 0),Defines.maximumSteps);
    towers[IndexToTower(index)].SetPosition(IndexToActuator(index), val, time);
}

function UpdatePositions(){
    for(var i = 0; i < towers.length; i++){
        towers[i].SendPositions();
    }
}

function SendParameter(paramID, index, value){
    if(index == -1){
        for(var i = 0; i < towers.length; i++){
            towers[i].SetParameter(paramID, index, value);
        }
    } else {
        towers[IndexToTower(index)].SetParameter(paramID, IndexToActuator(index), value);
    }
    
            
}

function IndexToTower(index){
    
    return Math.floor(index / Defines.dimension[0] / 2)*4 + Math.floor((index % Defines.dimension[0])/2);
}

function IndexToActuator(index){
    return (Math.floor(index / Defines.dimension[0]) % 2)*2 + (index % 2);
}

module.exports = {HandleConnection, SetPosition, UpdatePositions, SendParameter, event};


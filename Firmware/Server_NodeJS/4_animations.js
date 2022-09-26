const Defines = require("./defines");
const Events = require("events");

var event = new Events.EventEmitter();

var playPreset = false;

var currentPreset = null;
var i = 0;

const DEG_TO_RAD = Math.PI / 180;

function StartAnimation(animationID){
    console.log("Start animation: " + animationID);
    switch(animationID){
        case 0: currentPreset = allSine; break;
        case 1: currentPreset = xSine; break;
        case 2: currentPreset = ySine; break;
        case 3: currentPreset = xySine; break;
        case 4: currentPreset = xTwoWaySine; break;
        case 5: currentPreset = yTwoWaySine; break;
        case 6: currentPreset = xyTwoWaySine; break;
        default: console.log("Unknown Animation ID");
    }
    playPreset = true;
}

function StopAnimation(){
    playPreset = false;
}

function PlayAnimation(){
    if(playPreset){
        var time = Math.round(process.hrtime()[0] * 1000000 + process.hrtime()[1] / 10000); 
        //console.log(time);

        for(var y = 0; y < Defines.dimension[1]; y++){
            for(var x = 0; x < Defines.dimension[0]; x++){
                var val = currentPreset(x,y,time) * 1000 + 500;
                event.emit("position", y * Defines.dimension[0] + x, val);
                // TODO add color animation
            }
        }
    }
}

function allSine(x,y, time){
    return Math.sin(time * DEG_TO_RAD) * 0.5 + 0.5;
}

function xSine(x,y, time){
    if(Defines.dimension[0] > 1)
        return Math.sin((time + x / (Defines.dimension[0] - 1) * 360) * DEG_TO_RAD) * 0.5 + 0.5;
    return allSine(x,y,time);
}

function ySine(x,y, time){
    if(Defines.dimension[1] > 1)
        return Math.sin((time + y / (Defines.dimension[1] - 1) * 360) * DEG_TO_RAD) * 0.5 + 0.5;
    return allSine(x,y,time);
}

function xySine(x,y, time){
    if(Defines.dimension[0] + Defines.dimension[1] > 2)
        return Math.sin((time + (x+y) / (Defines.dimension[0] + Defines.dimension[1] - 2) * 360) * DEG_TO_RAD) * 0.5 + 0.5;
    return allSine(x,y,time);
}

function xTwoWaySine(x,y, time){
    if(Defines.dimension[0] > 1)
        return Math.sin((time + Math.min(x, Defines.dimension[0]) / (Defines.dimension[0] / 2 - 2) * 360) * DEG_TO_RAD) * 0.5 + 0.5;
    return allSine(x,y,time);
}

function yTwoWaySine(x,y, time){
    if(Defines.dimension[1] > 1)
        return Math.sin((time + Math.min(y, Defines.dimension[1] - y) / (Defines.dimension[1] / 2 - 2) * 360) * DEG_TO_RAD) * 0.5 + 0.5;
    return allSine(x,y,time);
}

function xyTwoWaySine(x,y, time){
    if(Defines.dimension[0] + Defines.dimension[1] > 2)
        return Math.sin((time + (Math.min(x, Defines.dimension[0] - x) + Math.min(y, Defines.dimension[1] - x)) / ((Defines.dimension[0] + Defines.dimension[1]) / 2 - 2) * 360) * DEG_TO_RAD) * 0.5 + 0.5;
    return allSine(x,y,time);
}

module.exports = {StartAnimation, StopAnimation, PlayAnimation, event};
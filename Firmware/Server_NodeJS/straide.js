const Defines = require("./defines.js");

const WebSocket = require('ws');
const HandleWebSockets = require('./2_websocket.js');

const HandleTCP = require("./3_tcp.js");

const Animations = require("./4_animations.js");

const WebSocket2 = require('ws');
const HandleColor = require('./5_colors.js');


const { networkInterfaces } = require('os');
const Net = require('net');

const targetColors = new Array(Defines.dimension[0] * Defines.dimension[1]);
const oldColors = new Array(Defines.dimension[0] * Defines.dimension[1]);

var requestAcknowledgments = true;
var playPreset = true;
var offset = 0;

var temp = 0;
var lastTemReading = -600000;
var btn1pressed = false;
var btn2pressed = true;


function Start(){

    var ip = GetIP();

    // Incoming WS Server
    const wss = new WebSocket.Server({
        port: Defines.WSPort
    }, function(){
        console.log(`WebSocket Server accessible on ${ip}:${Defines.WSPort}`);
    });
    wss.on('connection', HandleWebSockets.HandleConnection);

    // Event Calls
    HandleWebSockets.event.on("position", HandleTCP.SetPosition);
    HandleWebSockets.event.on("color", SetColor);
    HandleWebSockets.event.on("param", HandleTCP.SendParameter);

    // Outgoing TCP Server
    const tcp = new Net.createServer();
    tcp.listen(Defines.TCPPort, function(){
        console.log(`TCP Server listening for slaves on ${ip}:${Defines.TCPPort}`);
    });
    tcp.on('connection', HandleTCP.HandleConnection);

    HandleTCP.event.on("input", handleInput);

    // Color
    const wscolor = new WebSocket2.Server({
        port: Defines.ColorPort
    }, function(){
        console.log(`Color Server accessible on ${ip}:${Defines.ColorPort}`);
    });
    wscolor.on('connection', HandleColor.HandleConnection);

    // Animations
    HandleWebSockets.event.on("startAnimation", Animations.StartAnimation);
    HandleWebSockets.event.on("stopAnimation", Animations.StopAnimation);
    Animations.event.on("position", HandleTCP.SetPosition);
    Animations.event.on("color", SetColor);

    for(var i = 0; i < targetColors.length; i++){
        targetColors[i] = new Defines.SCIColor(0,0,0,0);
    }

    // LOOPS
    setInterval(function(){
        HandleTCP.UpdatePositions();
        Animations.PlayAnimation();
    }, 1);

    setInterval(function(){
        HandleColor.SendColor(targetColors);
    }, 100);

    return Promise.resolve();
}

function SetColor(index, color){
    targetColors[index] = color;
}

function handleInput(x, y, pos){
    HandleWebSockets.SendInput(x, y, pos);
}

function GetIP(){

    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
}

module.exports = {Start};
const TCPPort = 7778;
const WSPort = 7777;
const ColorPort = 7779;

const dimension = [8,8]; 
const diameter = 40;
const resolution = 50;
const stepsPerMeter = 3183;
const maximumSteps = 3400;

var timeDifference = -1;

const autoDisableMS = [30000, 1200000];

const messageType = {
    PING: 0x00,
    CONFIRM: 0x01,
    ACKNOWLEDGMENT: 0x02,
    RESET: 0x03,
    ENABLE: 0x04,
    GET: 0x10,
    INFO: 0x11,
    SETPARAM: 0x20,
    ELEMENTPOS: 0x30,
    ELEMENTCOL: 0x31,
    ELEMENTPOSCOL: 0x32,
    MULTIPLEPOS: 0x33,
    MULTIPLECOL: 0x34,
    MULTIPLEPOSCOL: 0x35,
    PRESET: 0x40,
    OFFSET: 0x41,
    USERINPUT: 0x50
};

const infoID = {
    DIM: 0x01,
    DIAMETER: 0x02,
    RESOLUTION: 0x03,
    STEPSPERM: 0x04,
    MAXSTEPS: 0x05
};

const paramID = {
    SPEED: 0x01,
    ACCELERATION: 0x02,
    TIME: 0x10
};

function SCIColor(red,green,blue,white){
    this.r = red;
    this.g = green;
    this.b = blue;
    this.w = white;

    this.equals = function(c){
        return Math.abs(this.r - c.r) + Math.abs(this.g - c.g) + Math.abs(this.b - c.b) + Math.abs(this.w - c.w) < 20;
    }
}

module.exports = Object.assign({TCPPort, WSPort, ColorPort, dimension, diameter, resolution, stepsPerMeter, maximumSteps, timeDifference, autoDisableMS, messageType, infoID, paramID, SCIColor});
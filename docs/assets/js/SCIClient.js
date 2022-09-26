/**
 * 
 * @file SCIClient.js
 * @author Severin Engert
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 * 
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

// ===========================  DEFINES =======================
// Generic X|Y Coordinate for every element, starting from front-left
class SCIElement {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// Generic Color construct with red, green, blue, and white component 0-255
class SCIColor {
    constructor(r,g,b,w=0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.w = w;
    }
}

// Definition of general messages shared within all libraries, first byte hold MessageType
const SCIMessageType = {
    PING: 0x00,
    CONFIRM: 0x01,
    ACKNOWLEDGMENT: 0x02,
    RESET: 0x03,
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

// Definition of different types of general information about STRAIDE
const SCIInfoType = {
    DIM: 0x01,
    DIAMETER: 0x02,
    RESOLUTION: 0x03,
    STEPSPERM: 0x04,
    MAXSTEPS: 0x05
};

// Definition of controllable motor Parameters
const SCIParamType = {
    SPEED: 0x01,
    ACCELERATION: 0x02
};

// Definition of usable Resets
const SCIResetType = {
    ALL: 0x00,
    POS: 0x01,
    COL: 0x02
  };
  
// ========================== EVENT LISTENER =======================

function SCIEventListener(messageType,callback) {
    this.messageType = messageType;
    this.callback = callback;
    this.answer = function(data){
        if(data[0] == this.messageType){           
            callback(data.slice(1));
            return true;
        }
        return false;
    }
}

// ========================= STRAIDE Client ========================

function SCIClient (address) {
    this.address = address;

    // WebSocket Functions -------------------------------------------
    this.ws = new WebSocket(this.address);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = function(e) {
        if(typeof this.onready === "function"){
            this.onready();
        } else {
            console.log("SCIClient.onready was misassigned.")
        }
    }.bind(this);
    
    this.ws.onmessage = (function(event) {
        this.receiveMessage(new Uint8Array(event.data));
    }).bind(this);
    
    this.ws.onclose = function(event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.log('[close] Connection died');
        }
    };
    
    this.ws.onerror = function(error) {
        console.log(`[error] ${error.message}`);
    };

    SCIClient.prototype.send = function(content, important){
        if(this.ws.readyState === WebSocket.OPEN && this.ws.bufferedAmount < 400){
            this.ws.send(content);
            this.lastTimeSend = Date.now();
            return true;
        } else if (important) {
            setTimeout(function(){
                this.send(content, important);
            }.bind(this),1000);
        }
        return false;
    };

    // Other Functions ----------------------------------------------
    this.messageID = 0;

    // Callback triggered once connection is established
    SCIClient.prototype.onready = function(){
        console.log("[open] Connection established");
    }

    this.awaitedAnswers = [];
    SCIClient.prototype.receiveMessage = function(data){
        switch(data[0]){
            case SCIMessageType.CONFIRM:
                break;
            case SCIMessageType.INFO:
                var index = -1;
                var counter = 0;
                this.awaitedAnswers.forEach(function(item){
                    if(item[0] == data[1]){
                        item[1](data.slice(2));
                        index = counter;
                    }
                    counter++;
                });
                if(index != -1)
                    this.awaitedAnswers.splice(index,1);
                break;
            case SCIMessageType.USERINPUT:
                this.oninput(new SCIElement(data[1], data[2]), (data[3]<<8) + data[4]);
                break;
        }
    }

    // Callback triggered by direct user input
    SCIClient.prototype.oninput = function(el,val){
        console.log("Received Input");
    }

    SCIClient.prototype.sendPing = function(callback) {
        this.send(Uint8Array.of(SCIMessageType.PING));
    };

    SCIClient.prototype.toggleAcknowledgment = function(requestConfirmation){
        this.send(Uint8Array.of(SCIMessageType.ACKNOWLEDGMENT,this.messageID, requestConfirmation),true);
        this.messageID = (this.messageID + 1) % 255;
    };

    SCIClient.prototype.reset = function(resetType){
        this.send(Uint8Array.of(SCIMessageType.RESET, this.messageID, resetType), true);
        this.messageID = (this.messageID + 1) % 255;
    };

    SCIClient.prototype.getInformation = function(infoID,callback) {
        if(typeof callback === "function"){
            this.awaitedAnswers.push([infoID,callback]);
            this.send(Uint8Array.of(SCIMessageType.GET,infoID),true);           
        } else {
            console.error("<callback> of getInformation(infoID,callback) must be a function!");
        }
    };

    SCIClient.prototype.setParam = function(paramID,val){
        this.send(Uint8Array.of(SCIMessageType.SETPARAM,this.messageID, paramID, val>>8,val), false);
        this.messageID = (this.messageID + 1) % 255;
    };

    SCIClient.prototype.setElementPosition = function(element,position){
        var message = new Uint8Array(6);
        
        message[0] = SCIMessageType.ELEMENTPOS;
        message[1] = this.messageID;
        message[2] = element.x;
        message[3] = element.y;
        message[4] = position>>8;
        message[5] = position;
        this.send(message, false);
        this.messageID = (this.messageID + 1) % 255;
    };

    SCIClient.prototype.setAreaPosition = function(lowerElement, upperElement, position){
        var message = new Uint8Array(8);
        message[0] = SCIMessageType.ELEMENTPOS;
        message[1] = this.messageID;
        message[2] = lowerElement.x;
        message[3] = lowerElement.y;
        message[4] = upperElement.x;
        message[5] = upperElement.y;
        message[6] = position>>8;
        message[7] = position;
        this.send(message, false);
        this.messageID = (this.messageID + 1) % 255;
    }

    SCIClient.prototype.setElementColor = function(element, color){
        var message = new Uint8Array(8);
        message[0] = SCIMessageType.ELEMENTCOL;
        message[1] = this.messageID;
        message[2] = element.x;
        message[3] = element.y;
        message[4] = color.r;
        message[5] = color.g;
        message[6] = color.b;
        message[7] = color.w;
        this.send(message,false);
        this.messageID = (this.messageID + 1) % 255;
    };

    SCIClient.prototype.setAreaColor = function(lowerElement, upperElement, color){
        var message = new Uint8Array(10);
        message[0] = SCIMessageType.ELEMENTCOL;
        message[1] = this.messageID;
        message[2] = lowerElement.x;
        message[3] = lowerElement.y;
        message[4] = upperElement.x;
        message[5] = upperElement.y;
        message[6] = color.r;
        message[7] = color.g;
        message[8] = color.b;
        message[9] = color.w;
        this.send(message,false);
        this.messageID = (this.messageID + 1) % 255;
    };

    SCIClient.prototype.setElementPositionAndColor = function(element, position, color){
        var message = new Uint8Array(10);
        message[0] = SCIMessageType.ELEMENTPOSCOL;
        message[1] = this.messageID;
        message[2] = element.x;
        message[3] = element.y;
        message[4] = position>>8;
        message[5] = position;
        message[6] = color.r;
        message[7] = color.g;
        message[8] = color.b;
        message[9] = color.w;
        this.send(message,false);
        this.messageID = (this.messageID + 1) % 255;
    }

    SCIClient.prototype.setAreaPositionAndColor = function(lowerElement, upperElement, position, color){
        var message = new Uint8Array(12);
        message[0] = SCIMessageType.ELEMENTPOSCOL;
        message[1] = this.messageID;
        message[2] = lowerElement.x;
        message[3] = lowerElement.y;
        message[4] = upperElement.x;
        message[5] = upperElement.y;
        message[6] = position>>8;
        message[7] = position;
        message[8] = color.r;
        message[9] = color.g;
        message[10] = color.b;
        message[11] = color.w;
        this.send(message,false);
        this.messageID = (this.messageID + 1) % 255;
    }

    SCIClient.prototype.setMultiplePositions = function(positions){
        var message = new Uint8Array(2 + positions.length * 2);
        message[0] = SCIMessageType.MULTIPLEPOS;
        message[1] = this.messageID;
        for(var i = 0; i < positions.length; i++){
            message[i*2+2] = positions[i]>>8;
            message[i*2+3] = positions[i];
        }
        this.send(message, false);
        this.messageID = (this.messageID + 1) % 255;
    };

    SCIClient.prototype.setMultipleColors = function(colors){
        var message = new Uint8Array(2 + colors.length * 4);
        message[0] = SCIMessageType.MULTIPLECOL;
        message[1] = this.messageID;
        for(var i = 0; i < colors.length; i++){
            message[i*4+2] = colors[i].r;
            message[i*4+3] = colors[i].g;
            message[i*4+4] = colors[i].b;
            message[i*4+5] = colors[i].w;
        }
        this.send(message, false);
        this.messageID = (this.messageID + 1) % 255;
    };

    SCIClient.prototype.setMultiplePositionsAndColors = function(positions,colors){
        if(positions.length == colors.length){
            var message = new Uint8Array(2 + positions.length * 6);
            message[0] = SCIMessageType.MULTIPLEPOSCOL;
            message[1] = this.messageID;
            for(var i = 0; i < positions.length; i++){
                message[i*6+2] = positions[i]>>8;
                message[i*6+3] = positions[i];
                message[i*6+4] = colors[i].r;
                message[i*6+5] = colors[i].g;
                message[i*6+6] = colors[i].b;
                message[i*6+7] = colors[i].w;
            }
            this.send(message, false);
            this.messageID = (this.messageID + 1) % 255;
        } else {
            console.log("<positions> and <colors> need to have the same length!")
        }
    };

    SCIClient.prototype.playPreset = function(presetID){
        var message = Uint8Array.of(SCIMessageType.PRESET, this.messageID, presetID);
        this.send(message, false);
        this.messageID = (this.messageID + 1) % 255;
    };

    SCIClient.prototype.setOffset = function(val){
        var message = Uint8Array.of(SCIMessageType.OFFSET, this.messageID, val >> 8, val);
        this.send(message,false);
        this.messageID = (this.messageID + 1) % 255;
    };
}

exports = {};
exports.SCIClient = SCIClient;
exports.SCIElement = SCIElement;
exports.SCIColor = SCIColor;
exports.SCIInfoType = SCIInfoType;
exports.SCIParamType = SCIParamType;
exports.SCIEventListener = SCIEventListener;
exports.SCIMessageType = SCIMessageType;
exports.SCIResetType = SCIResetType;

const Defines = require("./defines");
const Events = require("events");

var event = new Events.EventEmitter();

var requestAcknowledgments = true;

var clients = [];

function HandleConnection(ws){
    
    ws.on('close', HandleClose);
    ws.on('error', HandleError);
    ws.on('message', HandleMessage);
    ws.on('open', HandleOpen);
    ws.on('ping', HandlePing);
    ws.on('pong', HandlePong);
    ws.on('unexpected-response', HandleUnexpected);
    ws.on('upgrade', HandleUpgrade);
    clients.push(ws);
    console.log("New WS Connection [" + (clients.length - 1) + "]");
}

function HandleClose(code, reason){
    console.log("[" + code + "] WS disconnect");
    removeClient(this);
}

function HandleError(error){
    console.log("WS Error: " + error);
    removeClient(this);
}

function removeClient(ws){
    var index = clients.indexOf(ws);
    if (index > -1) {
        clients.splice(index, 1);
    }
}

function HandleMessage(data){
    //console.log(`Received Binary with ${data.length} Byte Length`);
    if(data.length > 0){
        switch(data[0]){
            case Defines.messageType.PING:
                SendCONFIRM(this, 0);
                break;
            case Defines.messageType.CONFIRM:
                console.log("CONFIRM Message was received, should only be send by SCI.");
                break;
            case Defines.messageType.ACKNOWLEDGMENT:
                if(data.length == 3){
                    SendCONFIRM(this, data[1]);
                    ToggleAcknowledgment(data[2]);
                } else {
                    console.log("DataPacket to Toggle Acknowledgments needs to have 3 Bytes.");
                }
                break;
            case Defines.messageType.RESET:
                if(data.length == 3){
                    SendCONFIRM(this, data[1]);
                    Reset(data[2]);
                } else {
                    console.log("DataPacket to Reset Device needs to have 3 Bytes.");
                }
                break;
            case Defines.messageType.GET:
                if(data.length == 2)
                    SendInfo(this, data[1]);
                else
                    console.log("DataPacket of Request for Information needs to have 2 Bytes.");
                break;
            case Defines.messageType.INFO:
                console.log("INFO Message was received, should only be send by SCI.");
                break;
            case Defines.messageType.SETPARAM:
                if(data.length == 5){
                    SendCONFIRM(this, data[1]);
                    SetParameter(data);
                } else if(data.length == 7) {
                    SendCONFIRM(this, data[1]);
                    SetSingleParameter(data);
                } else {
                    console.log("DataPacket to Set Parameter needs to have 5 Bytes.");
                }
                break;
            case Defines.messageType.ELEMENTPOS:
                if(data.length == 6 || data.length == 8){
                    SendCONFIRM(this, data[1]);
                    SetElementPosition(data, data.length);
                } else {
                    console.log("DataPacket to Set the Position of Elements needs to have 6 or 8 Bytes.");
                }
                break;
            case Defines.messageType.ELEMENTCOL:
                if(data.length >= 7){
                    SendCONFIRM(this, data[1]);
                    SetElementColor(data, data.length);
                } else {
                    console.log("DataPacket to Set Color of Elements needs to have at least 7 Bytes.");
                }
                break;
            case Defines.messageType.ELEMENTPOSCOL:
                if(data.length >= 9){
                    SendCONFIRM(this, data[1]);
                    SetElementPositionAndColor(data, data.length);
                } else {
                    console.log("DataPacket to Set Position and Color of Elements needs to have at least 9 Bytes.");
                }
                break;
            case Defines.messageType.MULTIPLEPOS:
                if(data.length == Defines.dimension[0] * Defines.dimension[1] * 2 + 2 || data.length == Defines.dimension[0] * Defines.dimension[1] * 2 + 4){
                    SendCONFIRM(this, data[1]);
                    SetMultiplePositions(data, data.length);
                } else {
                    console.log("DataPacket to Set Position of all Elements needs to have DimX * DimY * 2 + 2|4 Bytes.");
                }
                break;
            case Defines.messageType.MULTIPLECOL:
                if(data.length == Defines.dimension[0] * Defines.dimension[1] * 3 + 2 || data.length == Defines.dimension[0] * Defines.dimension[1] * 4 + 2){
                    SendCONFIRM(this, data[1]);
                    SetMultipleColors(data, data.length);
                } else {
                    console.log("DataPacket to Set Color of all Elements needs to have at least DimX * DimY * 3 + 2 Bytes.");
                }
                break;
            case Defines.messageType.MULTIPLEPOSCOL:
                if(data.length >= Defines.dimension[0] * Defines.dimension[1] * 5 + 2){
                    SendCONFIRM(this, data[1]);
                    SetMultiplePositionsAndColor(data, data.length);
                } else {
                    console.log("DataPacket to Set Position and Color of all Elements needs to have at least DimX * DimY * 5 + 2 Bytes.");
                }
                break;
            case Defines.messageType.PRESET:
                if(data.length == 3){
                    SendCONFIRM(this, data[1]);
                    StartPreset(data[2]);
                } else {
                    console.log("DataPacket to Start a Preset needs to have 3 Bytes.");
                }
                break;
            case Defines.messageType.OFFSET:
                if(data.length == 4){
                    SendCONFIRM(this, data[1]);
                    //offset = payload[2]<<8 + payload[3];
                } else {
                    console.log("DataPacket to Set the Offset needs to have 4 Bytes.");
                }
                break;
            default:
                console.log("Received unknown message");
                break;  
        }
    }
}

function HandleOpen(){
    console.log("WS Connection Opened");
}

function HandlePing(data){

}

function HandlePong(data){

}

function HandleUnexpected(request, response){

}

function HandleUpgrade(response){

}

function ToggleAcknowledgment(request){
    requestAcknowledgments = (request == 0x01);
}

function Reset(what){
    switch(what){
        case 0x00:
            event.emit("stopAnimation");
            for(var i = 0; i < Defines.dimension[0] * Defines.dimension[1]; i++){
                event.emit("position", i, 0);
                event.emit("color", i, new Defines.SCIColor(0,0,0,0));
            }
            break;
        case 0x01:
            event.emit("stopAnimation");
            for(var i = 0; i < Defines.dimension[0] * Defines.dimension[1]; i++){
                event.emit("position", i, 0);
            }
            break;
        case 0x02:
            for(var i = 0; i < Defines.dimension[0] * Defines.dimension[1]; i++){
                event.emit("color", i, new Defines.SCIColor(0,0,0,0));
            }
            break;
        default:
            console.log("Received unknown Reset code.");
            break;
    }
}

function SendCONFIRM(ws, messageID){
    if(requestAcknowledgments){
        var answer = new Array(2);
        answer[0] = Defines.messageType.CONFIRM;
        answer[1] = messageID;
        ws.send(Buffer.from(answer));
        //ws.sendBIN(num, &(answer[0]),2);
    }
}

function SendInfo(ws, infoID){
    var answer;
    switch (infoID)
    {
        case Defines.infoID.DIM:
        {
            answer = [Defines.messageType.INFO, infoID, Defines.dimension[0], Defines.dimension[1]];
        }
            break;
        case Defines.infoID.DIAMETER:
        {
            answer = [Defines.messageType.INFO, infoID, Defines.diameter];
            break;
        }
        case Defines.infoID.RESOLUTION:
        {
            answer = [Defines.messageType.INFO, infoID, Defines.resolution];
            break;
        }
        case Defines.infoID.STEPSPERM:
        {
            answer = [Defines.messageType.INFO, infoID, Defines.stepsPerMeter>>8, Defines.stepsPerMeter%255];
            break;
        }
        case Defines.infoID.MAXSTEPS:
        {
            answer = [Defines.messageType.INFO, infoID, Defines.maximumSteps>>8, Defines.maximumSteps%255];
            break;
        }
        default:
            console.log("Received request for unknown information.");
            return;
    }

    ws.send(Buffer.from(answer));
}

function SendInput(x, y, pos){
    const data = [Defines.messageType.USERINPUT, x, y, pos >> 8, pos];
    clients.forEach(ws => ws.send(Buffer.from(data)));
}

function SetParameter(data){
    const val = (data[3]<<8) + data[4];
    if(data[2] == Defines.paramID.TIME){
        Defines.timeDifference = Date.now() % (256*256) - val;
    }
    event.emit("param", data[2], -1, val);
}

function SetSingleParameter(data){
    event.emit("param", data[2], data[4] * Defines.dimension[0] + data[3], (data[5]<<8) + data[6]);
}

function SetElementPosition(data, length){
    event.emit("stopAnimation");
    if(Defines.timeDifference == -1){
        if(length == 6){
            event.emit("position", data[3] * Defines.dimension[0] + data[2], (data[4]<<8) + data[5], 0);
        } else if (length == 8){
            for(var y = Math.min(data[3],data[5]); y <= Math.max(data[3],data[5]); y++){
                for(var x = Math.min(data[2],data[4]); x <= Math.max(data[2],data[4]); x++){
                    event.emit("position", y * Defines.dimension[0] + x, (data[6]<<8) + data[7], 0);
                }
            }
        }
    } else {
        if(length == 8){
            event.emit("position", data[3] * Defines.dimension[0] + data[2], (data[4]<<8) + data[5], (data[6] << 8) + data[7]);
        } else if (length == 10){
            for(var y = Math.min(data[3],data[5]); y <= Math.max(data[3],data[5]); y++){
                for(var x = Math.min(data[2],data[4]); x <= Math.max(data[2],data[4]); x++){
                    event.emit("position", y * Defines.dimension[0] + x, (data[6]<<8) + data[7], (data[8] << 8) + data[9]);
                }
            }
        }
    }

}

function SetElementColor(data, length){
    if(length < 9){
        event.emit("color",data[3] * Defines.dimension[0] + data[2], new Defines.SCIColor(data[4], data[5], data[6]), length == 8 ? data[7] : 0);
    } else {
        for(var y = Math.min(data[3],data[5]); y <= Math.max(data[3],data[5]); y++){
            for(var x = Math.min(data[2],data[4]); x <= Math.max(data[2],data[4]); x++){
                event.emit("color", y * Defines.dimension[0] + x, new Defines.SCIColor(data[6], data[7], data[8], length > 9 ? data[9] : 0));
            }
        }
    }
}

function SetElementPositionAndColor(data, length){
    event.emit("stopAnimation");

    switch(length){
        case 9:
        case 10:
        {
            const i = data[3] * Defines.dimension[0] + data[2];
            event.emit("position", i, (data[4]<<8) +  data[5]);
            event.emit("color", i, new Defines.SCIColor(data[6], data[7], data[8], length == 10 ? data[9] : 0));
        }
            break;
        case 11:
        case 12:
        {
            for(var y = Math.min(data[3],data[5]); y <= Math.max(data[3],data[5]); y++){
                for(var x = Math.min(data[2],data[4]); x <= Math.max(data[2],data[4]); x++){
                    const i = y * Defines.dimension[0] + x;
                    event.emit("position", i, (data[6]<<8) +  data[7]);
                    event.emit("color", i, new Defines.SCIColor(data[8], data[9], data[10], length == 12 ? data[11] : 0));
                }
            }
        }
            break;
    }
}

function SetMultiplePositions(data, length){
    event.emit("stopAnimation");

    if(length == Defines.dimension[0] * Defines.dimension[1] * 2 + 2){
        for(var y = 0; y < Defines.dimension[1]; y++){
            for(var x = 0; x < Defines.dimension[0]; x++){
                const i = y * Defines.dimension[0] + x;
                event.emit("position",i, (data[2 + i*2]<<8) + data[3 + i*2], 0);
            }
        }
    } else {
        const time = (data[2] << 8) + data[3];
        for(var y = 0; y < Defines.dimension[1]; y++){
            for(var x = 0; x < Defines.dimension[0]; x++){
                const i = y * Defines.dimension[0] + x;
                event.emit("position",i, (data[4 + i*2]<<8) + data[5 + i*2], time);
            }
        }
    }
    
}

function SetMultipleColors(data, length){
    const components = (length == Defines.dimension[0] * Defines.dimension[1] * 4 + 2 ? 4 : 3);
    for(var y = 0; y < Defines.dimension[1]; y++){
        for(var x = 0; x < Defines.dimension[0]; x++){
            const i = y * Defines.dimension[0] + x;
            event.emit("color", i, new Defines.SCIColor(data[2 + i * components], data[3 + i * components], data[4 + i * components], components == 4 ? data[5 + i * components] : 0));
        }
    }
}

function SetMultiplePositionsAndColor(data, length){
    event.emit("stopAnimation");

    const components = (length == Defines.dimension[0] * Defines.dimension[1] * 6 + 2 ? 6 : 5);
    for(var y = 0; y < Defines.dimension[1]; y++){
        for(var x = 0; x < Defines.dimension[0]; x++){
            const i = y * Defines.dimension[0] + x;
            event.emit("position", i, (data[2 + i*components]<<8) + data[3 + i*components]);
            event.emit("color", i, new Defines.SCIColor(data[4 + i * components], data[5 + i * components], data[6 + i * components], components == 6 ? data[7 + i * components] : 0));
        }
    }
}

function StartPreset(presetID){
    event.emit("startAnimation", presetID);
}

module.exports = {HandleConnection, SendInput, event}; //{HandleClose, HandleError, HandleMessage, HandleOpen, HandlePing, HandlePong, HandleUnexpected, HandleUpgrade};
const Defines = require("./defines.js");
//const WebSocket = require('ws');

let messageID = 0;

let oldColors = null;

let wsConnection = null;

function HandleConnection(ws, req){
    console.log(`A color client connected from ${req.connection.remoteAddress}`);
    wsConnection = ws;
}

function SendColor(colors){
    if(oldColors == null){
        oldColors = new Array(Defines.dimension[0] * Defines.dimension[1]);
        for(let i = 0; i < oldColors.length; i++){
            oldColors[i] = new Defines.SCIColor(0,0,0,0);
        }
    }

    if(wsConnection != null){
        let data = new Array(2 + colors.length*4);
        data[0] = 0x01; // remove hardcoded Message type ID
        data[1] = messageID;
    
        let send = false;
        for(let i = 0; i < colors.length; i++){
    
            data[i*4+2] = colors[i].r;
            data[i*4+3] = colors[i].g;
            data[i*4+4] = colors[i].b;
            data[i*4+5] = colors[i].w;
            if(!colors[i].equals(oldColors[i])){
                send = true;
                oldColors[i] = colors[i];
            }
        }
    
        if(send){
            messageID = (messageID + 1) % 256;
            wsConnection.send(Buffer.from(data));
        }
    }
}

module.exports = {HandleConnection, SendColor};
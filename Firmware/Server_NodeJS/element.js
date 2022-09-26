const { errorMonitor } = require("ws");
const Defines = require("./defines.js");

function Tower() {
    this.actuators = [new Actuator(), new Actuator(), new Actuator(), new Actuator()];
    this.TCP = null;
    this.enabled = false;
    this.disableTimer = null;

    this.SetTCPSlave = function(tcpSlave){
        this.TCP = tcpSlave;
        if(tcpSlave != null){
            this.setActive(true);
            this.SendPositions();
        }
    }

    this.setActive = function(enable){
        if(enable != this.enabled){
            this.enabled = enable;
            console.log("setActive("+enable+")");
            if(this.TCP != null){
                var data = new Array(2);
                data[0] = Defines.messageType.ENABLE;
                data[1] = enable?0x01:0x00;
                this.TCP.write(Buffer.from(data));
            }
        }
    }

    this.SetPosition = function(index, value, time){
        this.setActive(true);
        clearTimeout(this.disableTimer);
        this.disableTimer = setTimeout(function(){
            this.setActive(false);
        }.bind(this),Defines.autoDisableMS[value == Defines.maximumSteps?0:1]);


        if(time < 1){
            this.actuators[index].parameters[Defines.paramID.SPEED] = this.actuators[index].speedCopy;
            this.actuators[index].speedCopy = -1;
            this.actuators[index].targetPosition = value;
        } else {
            if(this.actuators[index].speedCopy == -1)
                this.actuators[index].speedCopy = this.actuators[index].parameters[Defines.paramID.SPEED];

            var t = ((time - Date.now() % (256*256) - Defines.timeDifference) + 256 * 256) % (256 * 256);
            var diff = this.actuators[index].realPosition - value;
            var v = diff/t * 1000;
            this.actuators[index].parameters[Defines.paramID.SPEED] = Math.round(Math.abs(v));
            this.actuators[index].targetPosition = value;
        }
    }

    this.ForcePosition = function(index, value){
        this.actuators[index].targetPosition = value;
        this.actuators[index].realPosition = value;
    }

    this.SendPositions = function(){
        if( this.TCP != null && (
            this.actuators[0].PositionChanged() ||
            this.actuators[1].PositionChanged() ||
            this.actuators[2].PositionChanged() ||
            this.actuators[3].PositionChanged())) {
                
                var pos =  [this.actuators[0].GetPosition(),
                            this.actuators[1].GetPosition(),
                            this.actuators[2].GetPosition(),
                            this.actuators[3].GetPosition()];

                var data = new Array(10);
                data[0] = Defines.messageType.ELEMENTPOS;
                data[1] = 0;
                data[2] = pos[0]>>8;
                data[3] = pos[0]%256;
                data[4] = pos[1]>>8;
                data[5] = pos[1]%256;
                data[6] = pos[2]>>8;
                data[7] = pos[2]%256;
                data[8] = pos[3]>>8;
                data[9] = pos[3]%256;
                this.TCP.write(Buffer.from(data));
        }
    }

    this.SetParameter = function(paramID, index, value){
        if(index == -1){
            if(this.TCP != null){
                for(var i = 0; i < 4; i++)
                    this.actuators[i].SetParameter(paramID, value);

                var data = [Defines.messageType.SETPARAM, paramID, value>>8, value%256];
                this.TCP.write(Buffer.from(data));
            }
        } else {
            this.actuators[index].SetParameter(paramID, value);
            var data = [Defines.messageType.SETPARAM, paramID, index, value>>8, value%256];
            this.TCP.write(Buffer.from(data));
        }
        
    }
}

function Actuator() {
    this.targetPosition = 0;
    this.realPosition = 0;

    this.targetColor = new Defines.SCIColor(0,0,0,0);
    this.realColor = new Defines.SCIColor(0,0,0,0);

    this.parameters = [undefined,1000,16000];
    this.speedCopy = -1;

    this.PositionChanged = function(){
        return (Math.abs(this.targetPosition - this.realPosition) > 10);
    }

    this.GetPosition = function(){
        this.realPosition = this.targetPosition;
        return this.realPosition;
    }

    this.SetParameter = function(paramID, value){
        this.parameters[paramID] = value;
        if(paramID == Defines.paramID.SPEED)
            this.speedCopy = value;
    }
}

module.exports = {Tower};
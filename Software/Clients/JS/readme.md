# JavaScript Client

This _SCIClient_ can be used in client- or server-side JavaScript applications to communicate with STRAIDE instances.

## Setup

To create and setup a new SCIClient object, type:
```js
var sciclient = new SCIClient("ws://192.168.0.1:7777/simulator"); // for Simulator
var sciclient = new SCIClient("ws://10.0.1.3:7777"); // for real STRAIDE
```
Note that the address does not include any definition of the _port_ or the _subaddress_ if connected to the real STRAIDE.
It will create a new object, setup the WebSocket connection the device and setup the messageListeners.

For most applications it will be interesting to know, if the SCIClient is set up and a WebSocket connection is established. Use the following code for this purpose:
```js
sciclient.onready = function(){
   console.log("Connection established");
}
```

## Ping
Send a simple ping to the device.
```js
sciclient.sendPing();
```

## Acknowledgments
Typically, STRAIDE will send acknowledgment packets `0x01 | MessageID` for every received data packet. To reduce the traffic, acknowledgments can be toggled by sending:
```js
sciclient.toggleAcknowledgment(true);
```

## Reset
To reset STRAIDE or some parts thereof send
```js
sciclient.reset(SCIResetType.ALL);
```
The code determines what to reset:\
`0x00` - Reset Everything\
`0x01` - Reset Elements' Positions (aka calibrate positions)\
`0x02` - Reset Elements' Color (aka turn off all lights)

## Request Information
For many client applications it is necessary to know some information about STRAIDE. The `SCIInfoType` defines all potential information that can be requested. Currently it supports `DIM, DIAMETER, RESOLUTION, STEPSPERM, MAXSTEPS`.

```js
sciclient.getInformation(SCIInfoType.DIM, function(data){
   dimX = data[0];
   dimY = data[1];
});
```
A custom callback function needs to be added to evaluate the sculpture's response. Take a look into the [Protocol](/Hardware/protocol.md) to find the encoding of the response's data.

## Set Parameter
To set a motor parameter of STRAIDE (see [Parameters](/Hardware/parameters.md)), use
```js
sciclient.setParam(SCIParamType.SPEED, 1000);
```
The `SCIParamType` currently defines `SPEED, ACCELERATION`.

## Set Position
The API provides three ways to set the position of elements. To set the position of a single element, use
```js
sciclient.setElementPosition(new SCIElement(2,5), 4321);
```

To set multiple elements (in a rectangular region defined by the coordinates of the lower left and upper right corner elements) to the same position, use
```js
sciclient.setAreaPosition(new SCIElement(2,3), new SCIElement(4,6), 4321);
```

To set the position of all elements individually, use
```js
sciclient.setMultiplePositions(new int[64]);
```
The array needs to have a length of exactly `XDimension * YDimension`. To properly sort the elements' positions, calculate `i = y * XDimension + x` for each element.

## Set Color
The API provides three ways to set the color of elements. A basic definition for colors is provided by the `SCIColor` class. To set the color of a single element, use
```js
sciclient.setElementColor(new SCIElement(2,5), new SCIColor(255,0,0));
```
To set multiple elements (in a rectangular region defined by the coordinates of the lower left and upper right corner elements) to the same color, use
```js
sciclient.setAreaColor(new SCIElement(2,3), new SCIElement(4,6), new SCIColor(255,0,0));
```

To set the color of all elements individually, use
```js
scisclient.setMultipleColors(new SCIColor[64]);
```
The array needs to have a length of exactly `XDimension * YDimension`. To properly sort the elements' positions, calculate `i = y * XDimension + x` for each element.


## Set Position and Color
To reduce the WebSocket traffic, messages can combine position and color definitions for one or multiple elements. 
```js
sciclient.setElementPositionAndColor(new SCIElement(2,5), 4321, new SCIColor(255,0,0));

sciclient.setAreaPositionAndColor(new SCIElement(2,3), new SCIElement(4,6), 4321, new SCIColor(255,0,0));

sciclient.setMultiplePositionsAndColors(new int[64], new SCIColor[64]);
```

## Animations
Some animations are predefined on STRAIDE itself. Currently, this includes different sine waves. Each animation has an ID (currently ranging from 0-5). To start or change an animation, use
```js
sciclient.playPreset(2);
```
Animations can be stopped by sending any command that sets the positions of at least one element.

The amplitude of the predefined sine waves is approximately 20cm. But the vertical position of the sine wave can be adapted by using
```js
sciclient.setOffset(4321);
```

## User Input
Users can manually drag the outer elements of the device. The respective data is send to all clients via the WebSocket broadcast method. Override the `oninput` method of the `SCIClient` to access the data. The method should take an `SCIElement` and an integer value as parameters like this:

```js
sciclient.oninput = function(element, value) {
   // element.x and element.y available
   // value: absolute number steps from top
}
```
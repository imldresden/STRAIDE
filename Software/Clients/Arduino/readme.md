# Arduino Client

This _SCIClient_ is intended to be used on ESP32 micro-controller boards that should communicate with STRAIDE, e.g., for IoT applications

## Setup

To use the SCIClient in a script, you should create a new library. Open the Arduino [Library](https://www.arduino.cc/en/Guide/Libraries) folder and create a new folder called _SCIClient_. Copy the `SCIClient.h` and `SCIClient.cpp` files into this folder. Now you need to import the library in your sketch.

The library uses the [Arduino WebSocket](https://github.com/Links2004/arduinoWebSockets) library. Make sure, the library is ready for import aswell. 

Create a new SCIClient object as a global variable with the correct address information. In your script's `setup()` function, you should setup a WiFi connection and register a callback that is triggered when the WebSocket server is ready. Use this call to request information that is needed for your application.

```cpp
#include <SCIClient.h>

SCIClient client = SCIClient("192.168.0.1", 7777, "/simulator");  // for Simulator
// SCIClient client = SCIClient("10.6.0.1", 80, "/");  // for real STRAIDE

void setup(){
   WiFi.mode(WIFI_STA);
   WiFi.begin(WLAN_SSID, WLAN_PASS);
   client.CallOnReady(ServerIsReady);
}

void ServerIsReady(){
   sciclient.GetInformation(SCIClient::InfoID::DIM);
}
```

## Ping
Send a simple ping to the device.
```cpp
sciclient.SendPing();
```

## Acknowledgments
Typically, the Kinetic Sculptures will send acknowledgment packets `0x01 | MessageID` for every received data packet. To reduce the traffic, acknowledgments can be toggled by sending:
```cpp
sciclient.ToggleAcknowledgment(false);
```

## Reset
To reset the Kinetic Sculpture or some parts thereof send
```cpp
sciclient.Reset(0x00);
```
The code determines what to reset:\
`0x00` - Reset Everything\
`0x01` - Reset Elements' Positions (aka calibrate positions)\
`0x02` - Reset Elements' Color (aka turn off all lights)

## Request Information
For many client applications it is necessary to know some information about the Kinetic Sculpture. The `InfoID` defines all potential information that can be requested. Currently it supports `DIM, DIAMETER, RESOLUTION, STEPSPERM, MAXSTEPS`.

```cpp
sciclient.GetInformation(SCIClient::InfoID::DIM);
```
To receive the requested information, you need to register a custom callback function. Take a look into the [Protocol](SCIClient/Protocol) (Kinetic Sculpture -> Client Application) to find the encoding of the response's data.
```cpp
int maxsteps = 0;
void RequestInformation(){
   sciclient.CallOnInfo(ReceiveInformation);
   sciclient.GetInformation(SCIClient::InfoID::MAXSTEPS);
}

private void ReceiveInformation(byte[] data){
   switch(data[0]){
      case SCIClient::InfoID::MAXSTEPS:
         maxsteps = (int)word(data[1], data[2]);
         break;
   }
}
```

## Set Parameter
To set a parameter of the Kinetic Sculpture, use
```cpp
sciclient.SetParam(SCIClient::ParamID::SPEED, 1000);
```
The `SCIClient::ParamID` currently defines `SPEED, ACCELERATION`.

## Set Position
The API provides three ways to set the position of elements. To set the position of a single element, use
```cpp
sciclient.SetElementPosition(new SCIElement(2,5), 4321);
```

To set multiple elements (in a rectangular region defined by the coordinates of the lower left and upper right corner elements) to the same position, use
```cpp
sciclient.SetAreaPosition(new SCIElement(2,3), new SCIElement(4,6), 4321);
```

To set the position of all elements individually, use
```cpp
sciclient.SetMultiplePositions(positions, 64);   // int positions[64]; 
```
The array needs to have a length of exactly `XDimension * YDimension`. To properly sort the elements' positions, calculate `i = y * XDimension + x` for each element. The second parameter needs to be the length of the array.

## Set Color
The API provides three ways to set the color of elements. A basic definition for colors is provided by the `SCIColor` class. To set the color of a single element, use
```cpp
sciclient.SetElementColor(new SCIElement(2,5), new SCIColor(255,0,0));
```
To set multiple elements (in a rectangular region defined by the coordinates of the lower left and upper right corner elements) to the same color, use
```cpp
sciclient.SetAreaColor(new SCIElement(2,3), new SCIElement(4,6), new SCIColor(255,0,0));
```

To set the color of all elements individually, use
```cpp
sciclient.SetMultipleColors(colors, 64);   // SCIColor colors[64];
```
The array needs to have a length of exactly `XDimension * YDimension`. To properly sort the elements' positions, calculate `i = y * XDimension + x` for each element.


## Set Position and Color
To reduce the WebSocket traffic, messages can combine position and color definitions for one or multiple elements. 
```cpp
sciclient.SetPositionAndColor(new SCIElement(2,5), 4321, new SCIColor(255,0,0));

sciclient.SetAreaPositionAndColor(new SCIElement(2,3), new SCIElement(4,6), 4321, new SCIColor(255,0,0));

sciclient.SetMultiplePositionsAndColors(positions, colors);
```

## Animations
Some animations are predefined on the Kinetic Sculpture itself. Currently, this includes different sine waves. Each animation has an ID (currently ranging from 0-5). To start or change an animation, use
```cpp
sciclient.PlayPreset(2);
```
Animations can be stopped by sending any command that sets the positions of at least one element.

The amplitude of the predefined sine waves is approximately 20cm. But the vertical position of the sine wave can be adapted by using
```cpp
sciclient.SetOffset(4321);
```

## User Input
Users can manually drag the outer elements of the device. The respective data is send to all clients via the WebSocket broadcast method. Register a custom method using `CallOnInput(method)` to access the data. The method should take an `SCIElement` and an integer value as parameters like this:

```cpp
sciclient.CallOnInput(UserInput);

private void UserInput(SCIElement element, int value){
   // element.x and element.y available
   // value: absolute steps from top for respective element
}
```
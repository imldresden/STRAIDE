# Unity Client

This _SCIClient_ can be used inside Unity applications to communicate to STRAIDE instances.

## Setup

To use the SCIClient object in Unity, simply place the _SCIClient.cs_ (depends on [_WebSocket.cs_](https://github.com/endel/NativeWebSocket)) file in your Assets folder. Then add the script of the SCIClient to any `GameObject`.
It will create a new object, setup the WebSocket connection the device, and setup the messageListeners upon Start of the application.
To access the SCIClient from another script, use
```csharp
sciclient = gameobjectwithscript.GetComponent<SCIClient>();
```
or assign it to a public variable via the Unity Editor:
```csharp
public SCIClient sciclient;
```

In your script's `Start()` function, you should register a callback that is triggered when the WebSocket server is ready. Use this call to request information that is needed for your application.
```csharp

private SCIClient client;
void Start(){
   sciclient = this.getComponent<SCIClient>();
   client.onReady += ServerIsReady;
}

private void ServerIsReady(){
   sciclient.GetInformation(InfoID.DIM);
}
```

## Ping
Send a simple ping to the device.
```csharp
sciclient.SendPing();
```

## Acknowledgments
Typically, the Kinetic Sculptures will send acknowledgment packets `0x01 | MessageID` for every received data packet. To reduce the traffic, acknowledgments can be toggled by sending:
```csharp
sciclient.ToggleAcknowledgment(false);
```

## Reset
To reset the Kinetic Sculpture or some parts thereof send
```csharp
sciclient.Reset(0x00);
```
The code determines what to reset:\
'0x00' - Reset Everything\
'0x01' - Reset Elements' Positions (aka calibrate positions)\
'0x02' - Reset Elements' Color (aka turn off all lights)

## Request Information
For many client applications it is necessary to know some information about the Kinetic Sculpture. The `SCIInfoType` defines all potential information that can be requested. Currently it supports `DIM, DIAMETER, RESOLUTION, STEPSPERM, MAXSTEPS`.

```csharp
sciclient.GetInformation(SCIInfoType.DIM);
```
To receive the requested information, you need to register a custom callback function. Take a look into the [Protocol](SCIClient/Protocol) (Kinetic Sculpture -> Client Application) to find the encoding of the response's data.
```csharp
private Vector2Int dimension;
private void RequestInformation(){
   sciclient.onInformation += ReceiveInformation;
   sciclient.GetInformation(InfoID.DIM);
}

private void ReceiveInformation(byte[] data){
   switch((InfoID)data[0]){
      case InfoID.DIM:
         dimension = new Vector2Int(data[1], data[2]);
         break;
   }
}
```

## Set Parameter
To set a parameter of the Kinetic Sculpture, use
```csharp
sciclient.SetParam(ParamID.SPEED, 1000);
```
The `ParamID` currently defines `SPEED, ACCELERATION`.

## Set Position
The API provides three ways to set the position of elements. To set the position of a single element, use
```csharp
sciclient.SetElementPosition(new SCIElement(2,5), 4321);
```

To set multiple elements (in a rectangular region defined by the coordinates of the lower left and upper right corner elements) to the same position, use
```csharp
sciclient.SetAreaPosition(new SCIElement(2,3), new SCIElement(4,6), 4321);
```

To set the position of all elements individually, use
```csharp
sciclient.SetMultiplePositions(new int[64]);
```
The array needs to have a length of exactly `XDimension * YDimension`. To properly sort the elements' positions, calculate `i = y * XDimension + x` for each element.

## Set Color
The API provides three ways to set the color of elements. If utilizes the [`UnityEngine.Color`](https://docs.unity3d.com/ScriptReference/Color.html) definition of colors. To set the color of a single element, use
```csharp
sciclient.SetElementColor(new SCIElement(2,5), new Color(1.0f,0,0));
```
To set multiple elements (in a rectangular region defined by the coordinates of the lower left and upper right corner elements) to the same color, use
```csharp
sciclient.SetAreaColor(new SCIElement(2,3), new SCIElement(4,6), new Color(1.0f,0,0));
```

To set the color of all elements individually, use
```csharp
sciclient.SetMultipleColors(new Color[64]);
```
The array needs to have a length of exactly `XDimension * YDimension`. To properly sort the elements' positions, calculate `i = y * XDimension + x` for each element.


## Set Position and Color
To reduce the WebSocket traffic, messages can combine position and color definitions for one or multiple elements. 
```csharp
sciclient.SetPositionAndColor(new SCIElement(2,5), 4321, new Color(1.0f,0,0));

sciclient.SetAreaPositionAndColor(new SCIElement(2,3), new SCIElement(4,6), 4321, new Color(1.0f,0,0));

sciclient.SetMultiplePositionsAndColors(new int[64], new Color[64]);
```

## Animations
Some animations are predefined on the Kinetic Sculpture itself. Currently, this includes different sine waves. Each animation has an ID (currently ranging from 0-5). To start or change an animation, use
```csharp
sciclient.PlayPreset(2);
```
Animations can be stopped by sending any command that sets the positions of at least one element.

The amplitude of the predefined sine waves is approximately 20cm. But the vertical position of the sine wave can be adapted by using
```csharp
sciclient.SetOffset(4321);
```
## User Input
Users can manually drag the outer elements of the device. The respective data is send to all clients via the WebSocket broadcast method. Add a custom method to the `SCIClient.onInput` event-handler to access the data. The method should take an `SCIElement` and an integer value as parameters like this:

```csharp
sciclient.onInput += UserInput;

private void UserInput(SCIElement element, int value){
   // element.x and element.y available
   // value: absolute number of steps from top
}
```
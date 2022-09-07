# NodeJS Server

The central heart of STRAIDE is a NodeJS server. It handles all the communication between the Motor Towers, the Color Clients, and any application. It opens 3 separate interfaces: a TCP server on port 7778 for the communication via Ethernet with the Arduino Unos, a WS server on port 7779 for the wireless communcation with any hardware components like the color clients, and the external WS interface for applications on port 7777.
For every Motor Tower/TCP client that opens a connection to the server, it creates a new class of `Tower` including four `Elements` that handle the movement (speed, acceleration, shutdown) of the physical elements. Applications connected to the WS interface can send command according to the [Protocol](../../Hardware/protocol.md) which will control those parameters.
A loop will regularly check for changes and send out new values to the assigned Motor Tower.

## Setup
Install `NodeJS` and `npm` on a capable machine, preferable a thin client like a Raspberry Pi 4B. Then connect the machine to a local network containing all the Motor Towers via Ethernet or WiFi. Disable any other connection interface, as the server will pick the first one available. Configure your router so that your machine receives a static IP address, copy this address to the [Motor_Uno](../Motor_Uno) firmware. Finally, run `npm install` and `node controller.js` to start the server and make sure, all three interfaces are properly connected.

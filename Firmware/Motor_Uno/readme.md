# Motor Controller

STRAIDE setups comprise multiple actuation towers, each with 4 motors and a PCB stack on top.
It is a stack of an Arduino Uno, an Ethernet Shield, a custom PCB to reroute pins, and an CNC Shield.
The Uno runs the software from this folder.
It uses the Ethernet Shield to connect to a network and WebSockets to connect to the central server.
Commands are mapped to the motor positions, including setup, calibration, and handling of direct user input.

## Setup
In `defines.h`, you need to adjust the `SLAVE_ADDR` for each individual actuation tower. Also, the `IPAddress serverIP(X.X.X.X)` and `IPAddress clientIP(X.X.X.X)` needs to be set up to fit the network.

## Communication
Element Position: `0x30 | messageID | M0 (high) | M0 (low) | M1 (high) | M1 (low) | M2 (high) | M2 (low) | M3 (high) | M3 (low)` (positions for each motor `M`: `high<<8+low`) 

Parameter: `0x20 | ParamID | high | low` (ParamID: `0x01`-speed, `0x02`-acceleration)
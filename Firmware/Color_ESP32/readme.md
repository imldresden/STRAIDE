# Color Controller

STRAIDE's Matrix Setup uses 64 illuminated elements for appealing visualizations in midair.
Each element features a single SK6812 LED for individual illumination.
All LEDs are connected to a central PCB in the lower Display Element Unit via 3m long tone arm wires.
8 LEDs make up a column, and overall 8 columns are connected to 8 digital pins of an NodeMCU ESP32.
This wifi-capable microcontroller connects to the central server and receives websocket messages containing new color information.
These are repeatedly send to the 8 strains of LEDs, and (with low latency) color works in unison with the actuation of the spheres.

## Message Format
`messageType | messageID | LED0 red | LED0 green | LED0 blue | LED0 white | LED1 red | LED1 green | ...`

`messageType`: `0x01` for new colors  
`messageID`: sequential numbers `0-255`  
LED: `index = y * DIMX + x` and `red`(byte)
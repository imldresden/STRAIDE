# STRAIDE Visual Editor

> To support ideation and brainstorming sessions in an early concept phase, we provide a Visual Designer. We implemented a mobile web application that allows sketching, iterating, and discussing ideas in real-time, e.g. on a handheld device like a tablet with touch or pen interaction. The physical actuators are configured with a 2D position along a customizable grid. The Visual Designer represents them as two large canvases, one for selecting the elements’ colors and the other for defining their vertical position. The designer can create, compose, or modify 2.5D geometries by using predefined shapes or a free-form brush. All designs and configurations created in the Visual Designer can be both exported and imported to persistently save and reload any intermediate or final states. Furthermore, results can be the foundation for later application development as they can be fed to the server using the aforementioned image-based approach.

Excerpt from our [paper]()

## Basic concept

This webpage enables free sketching on 2 canvases for STRAIDE. One canvas is used to define the color of elements, the other one for the position (greyscale). Drawings can be exported/imported as a persistent caching method. [Examples](Examples) are provided.

## Requirements
1. Modern browser on a WiFi-capable computer.
2. STRAIDE or Platform Emulator in same local network.

## Dependencies
The software makes use of multiple libraries. They are included with this repository and linked locally, as development environments might not have access to CDNs.
* [fabric.js](http://fabricjs.com/)
* [SCIClient](../Clients/JS)
* [jQuery](https://jquery.com/)
* [Bootstrap v5](https://getbootstrap.com/)
* [Font Awesome](https://fontawesome.com/)

## How-To
1. Open the [`index.html`](../../docs/VisualEditor/index.html) with the browser of your choice.
2. Put in the IP of STRAIDE or the Platform Emulator and click `Connect`.
3. Add Elements to the first or second canvas. You can either add geometric primitives via the displayed buttons, or use the free drawing brush for custom sketches.
4. Alter elements by direct manipulation in the canvas or via the color controls (single fill color or gradient).
5. Use the "Save Current" button to save the current canvas. Export those presets into files.
6. Load preset files by the displayed file input element (see [Examples](Examples)). Once selected, click `Load from Disk`. All imported files are shown and can be modified once put into focus.

## Bugs
Please report bugs or functional improvements as a new Issue.
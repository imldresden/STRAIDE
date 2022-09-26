# STRAIDE: A Research Platform for Shape-Changing Spatial Displays based on Actuated Strings

**[Severin Engert](https://imld.de/en/our-group/team/severin-engert/), [Konstantin Klamka](https://imld.de/en/our-group/team/konstantin-klamka/), [Andreas Peetz](https://imld.de/en/our-group/team/andreas-peetz/), [Raimund Dachselt](https://imld.de/en/our-group/team/raimund-dachselt/)**

**[Interactive Media Lab Dresden](https://imld.de/en/)**

## CHI'22 Full Paper

We present STRAIDE, a string-actuated interactive display environment that allows to explore the promising potential of shape-changing interfaces for casual visualizations.
At the core, we envision a platform that spatially levitates elements to create dynamic visual shapes in space.
We conceptualize this type of tangible midair display and discuss its multifaceted design dimensions.
Through a design exploration, we realize a physical research platform with adjustable parameters and modular components.
For conveniently designing and implementing novel applications, we provide developer tools ranging from graphical emulators to in-situ augmented reality representations. 
To demonstrate STRAIDE's reconfigurability, we further introduce three representative physical setups as a basis for situated applications including ambient notifications, personal smart home controls, and entertainment.
They serve as a technical validation, lay the foundations for a discussion with developers that provided valuable insights, and encourage ideas for future usage of this type of appealing interactive installation.

[doi.org/10.1145/3491102.3517462](https://doi.org/10.1145/3491102.3517462)

## Repository
maintained by [Severin Engert](https://github.com/sev01)

### Components:
* [Hardware](Hardware)
* [Firmware](Firmware)
  * [Server](Firmware/Server_NodeJS)
  * [Slave Motors](Firmware/Motor_Uno)
  * [Slave Colors](Firmware/Color_ESP32)
* [Software](Software)
  * [Platform Emulator](Software/PlatformEmulator) ([Executable](Software/PlatformEmulator/PlatformEmulator.zip), [Unity-Project](Software/PlatformEmulator/Unity), AR (tba))
  * [Clients](Software/Clients) ([Arduino](Software/Clients/Arduino), [JavaScript](Software/Clients/), [C#](Software/Clients/Unity))
  * [Visual Editor](Software/VisualEditor) ([live](https://imldresden.github.io/STRAIDE/visual_editor.html))


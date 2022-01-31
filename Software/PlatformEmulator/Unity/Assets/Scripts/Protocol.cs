/**
 * This file is part of the STRAIDE Platform Emulator.
 * 
 * The Platform Emulator is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * The Platform Emulator is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with the Platform Emulator.  If not, see <http://www.gnu.org/licenses/>.
**/

using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Defines the protocol used for communication which is share among all STRAIDE software and firmware components.
/// </summary>
public enum MessageType : byte
{
    PING = 0x00,
    CONFIRM = 0x01,
    ACKNOWLEDGMENT = 0x02,
    RESET = 0x03,
    GET = 0x10,
    INFO = 0x11,
    SETPARAM = 0x20,
    ELEMENTPOS = 0x30,
    ELEMENTCOL = 0x31,
    ELEMENTPOSCOL = 0x32,
    MULTIPLEPOS = 0x33,
    MULTIPLECOL = 0x34,
    MULTIPLEPOSCOL = 0x35,
    PRESET = 0x40,
    OFFSET = 0x41,
    USERINPUT = 0x50
};

public enum InfoID : byte
{
    DIM = 0x01,
    DIAMETER = 0x02,
    RESOLUTION = 0x03,
    STEPSPERM = 0x04,
    MAXSTEPS = 0x05
};

public enum ParamID : byte
{
    SPEED = 0x01,
    ACCELERATION = 0x02
};

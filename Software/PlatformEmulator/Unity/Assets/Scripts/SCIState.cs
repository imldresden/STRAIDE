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
/// Stores the state of the system, predefined (diameter, resolution, ...) and dynamic (positions, velocities, ...).
/// </summary>
public static class SCIState
{
    public static readonly Vector2Int dim = new Vector2Int(8, 8);
    public static readonly int diameter = 40;
    public static readonly int resolution = 50;
    public static readonly int stepsPerM = 3183;
    public static readonly int maxSteps = 3700;

    public static int[] positions = new int[64];
    public static float[] velocities = new float[64];
    public static Color[] colors = new Color[64];

    public static int speed = 1000;
    public static int acceleration = 16000;
    public static int offset = 0;

    public static bool playPreset = false;
    public static int currentPreset = 0;

    public static bool clientConnected = false;
    public static string lastCommand = "";
    public static bool sendAck = true;
}

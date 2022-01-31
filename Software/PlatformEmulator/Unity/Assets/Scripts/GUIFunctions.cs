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
using System.Net.NetworkInformation;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Script takes care of all GUI functions:
/// * [esc] to exit application
/// * [1] - [5] to move camera to 5 predefined positions
/// * [0] to toggle frame
/// * Helper showing controls
/// </summary>
public class GUIFunctions : MonoBehaviour
{

    public GameObject controlsButton;
    public GameObject controlsGroup;
    public GameObject keys;
    public GameObject mouse;


    public RawImage connection;
    public RawImage client;
    public Texture connected;
    public Texture disconnected;
    public Texture hasClient;
    public Texture noClient;

    public Text lastCommand;

    public GameObject frame;

    void Start()
    {
        
    }

    void Update()
    {

        Vector3 targetPos = Vector3.zero;
        if(Input.anyKeyDown)
        {
            for (int y = 0; y < SCIState.dim.y; y++)
            {
                for (int x = 0; x < SCIState.dim.x; x++)
                {
                    targetPos += new Vector3(x * 0.05f, SCIState.positions[y * SCIState.dim.x + x] * -1.0f / (float)SCIState.stepsPerM, y * 0.05f);
                }
            }
            targetPos /= 64.0f;
        }


        if (Input.GetKey("escape"))
        {
            ExitSimulator();
        } else if (Input.GetKeyDown(KeyCode.Alpha1))
        {
            Camera.main.transform.position = targetPos + new Vector3(-0.6f, 0.5f, -0.6f);
            Camera.main.transform.rotation = Quaternion.Euler(28,45,0);
        }
        else if (Input.GetKeyDown(KeyCode.Alpha2))
        {
            Camera.main.transform.position = targetPos + new Vector3(-0.6f, 0, -0.6f);
            Camera.main.transform.rotation = Quaternion.Euler(0, 45, 0);
        }
        else if (Input.GetKeyDown(KeyCode.Alpha3))
        {
            Camera.main.transform.position = targetPos + new Vector3(0, 0, -0.9518766f);
            Camera.main.transform.rotation = Quaternion.Euler(18, 0, 0);
        }
        else if (Input.GetKeyDown(KeyCode.Alpha4))
        {
            Camera.main.transform.position = targetPos + new Vector3(0.6f, 0, -0.6f);
            Camera.main.transform.rotation = Quaternion.Euler(0, -45, 0);
        }
        else if (Input.GetKeyDown(KeyCode.Alpha5))
        {
            Camera.main.transform.position = targetPos + new Vector3(0.6f, 0.5f, -0.6f);
            Camera.main.transform.rotation = Quaternion.Euler(28, -45, 0);
        } else if (Input.GetKeyDown(KeyCode.Alpha0))
        {
            frame.SetActive(!frame.activeSelf);
        }


        client.texture = SCIState.clientConnected ? hasClient : noClient;
        lastCommand.text = "Last Command:\n" + SCIState.lastCommand;
    }

    public void ShowControls()
    {
        controlsButton.SetActive(false);
        controlsGroup.SetActive(true);
        //keys.SetActive(true);
        //mouse.SetActive(true);
    }

    public void ExitSimulator()
    {
        Debug.Log("Leaving Simulator...");
        Application.Quit();
    }

    public void IsConnected(bool state)
    {
        connection.texture = state ? connected : disconnected;
    }
}

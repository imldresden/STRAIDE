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

using System;
using System.Collections;
using System.Collections.Generic;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using WebSocketSharp;
using WebSocketSharp.Server;


/// <summary>
/// Main class implementing the behavior of the virtual representation of the physical device.
/// </summary>
public sealed class Simulator : MonoBehaviour
{
    public GUIFunctions gui;
    public Text IPText;
    public Text targetPosText;
    public GameObject elementPrefab;
    public GameObject selectorPrefab;

    // Private Variables
    WebSocketServer server;
    GameObject selected = null;

    int[] oldPos = new int[64];
    Color[] oldCol = new Color[64];
    Transform[] elements = new Transform[64];

    int stringState = 0;

    /// <summary>
    /// Setup websocket server.
    /// Instantiate spherical elements from prefab.
    /// </summary>
    public void Start()
    {

        server = new WebSocketServer(7777);
        server.AddWebSocketService<MessageHandler>("/simulator");
        server.Start();
        this.IPText.text = "ws://" + GetLocalIP() + ":" + server.Port + "/simulator";
        //NetworkChange.NetworkAddressChanged += new NetworkAddressChangedEventHandler(Restart);        // did not work


        GameObject parent = new GameObject
        {
            name = "Root"
        };

        for (int y = 0; y < 8; y++)
        {
            for (int x = 0; x < 8; x++)
            {
                GameObject element = Instantiate(elementPrefab);
                element.name = "Sphere_" + x + "_" + y;
                element.transform.SetParent(parent.transform);
                elements[y * 8 + x] = element.transform;
                Vector3 p = new Vector3(x * 0.05f, 0, y * 0.05f);
                elements[y * 8 + x].position = p;
                elements[y * 8 + x].GetComponent<LineRenderer>().SetPositions(new Vector3[]{ p + new Vector3(0,0.05f,0), p, p, p - new Vector3(0,1.8f,0)});
            }
        }
        
    }

    public void Update()
    {
        if (Input.GetKeyDown(KeyCode.O))
        {
            stringState = (stringState + 1) % 3;
        }
    }

    /// <summary>
    /// FixedUpdate() is used to consistently control the behavior of the virtual representation.
    /// It considers current and target positions and velocities for each element to accurately mimic the physical behavior.
    /// Takes further care of coloring the elements and direct user input.
    /// </summary>
    public void FixedUpdate()
    {
        if (server.IsListening && NetworkInterface.GetIsNetworkAvailable())
        {
            gui.IsConnected(true);
        }
        else
        {
            gui.IsConnected(false);
            return;
        }


        if (SCIState.playPreset)
            PlayAnimation();

        if (selected)
        {   
            Vector2Int coords = new Vector2Int(Mathf.RoundToInt(selected.transform.position.x / 0.05f), Mathf.RoundToInt(selected.transform.position.z / 0.05f));
            int i = coords.y * SCIState.dim.x + coords.x;
            if (coords.x == 0 || coords.y == 0 || coords.x == SCIState.dim.x - 1 || coords.y == SCIState.dim.y - 1)
            {
                if (SCIState.velocities[i] == 0 && SCIState.positions[i] <= SCIState.maxSteps - 5)
                {
                    selectorPrefab.SetActive(true);
                    selectorPrefab.transform.position = selected.transform.position;

                    if (Input.GetMouseButton(0))
                    {
                        SCIState.positions[i] += 5;
                        if (UnityEngine.Random.value > 0.8f)
                        {
                            byte[] data = { (byte)MessageType.USERINPUT, (byte)coords.x, (byte)coords.y, (byte)(SCIState.positions[i] >> 8), (byte)(SCIState.positions[i]) };
                            server.WebSocketServices.Broadcast(data);
                        }
                    }
                    else
                    {
                        selected = null;
                    }
                }
            }
            else
            {
                selected = null;
                selectorPrefab.SetActive(false);
            }
        } else
        {
            Ray r = Camera.main.ScreenPointToRay(Input.mousePosition);
            RaycastHit hit;
            if (Physics.Raycast(r, out hit) && hit.transform.parent && hit.transform.parent.name.Equals("Root"))
            {
                selected = hit.transform.gameObject;
            } else
            {
                selectorPrefab.SetActive(false);
            }
        }
            

        string s = "";
        for (int y = SCIState.dim.y - 1; y >= 0; y--)
        {
            for (int x = 0; x < SCIState.dim.x; x++)
            {
                s += string.Format("{0,4:####}", SCIState.positions[y * SCIState.dim.x + x]) + "|";
            }
            s += "\n";
        }
        targetPosText.text = s;

        for (int y = 0; y < SCIState.dim.y; y++)
        {
            for (int x = 0; x < SCIState.dim.x; x++)
            {
                int i = y * SCIState.dim.x + x;
                if (oldPos[i] != SCIState.positions[i])
                {

                    int targetPos = Mathf.Clamp(SCIState.positions[i], 0, SCIState.maxSteps);


                    int diff = targetPos - oldPos[i];


                    // reached target position
                    if (Mathf.Abs(diff) < 2 || Mathf.Abs(diff) < Mathf.Abs(SCIState.velocities[i] * Time.deltaTime))
                    {
                        oldPos[i] = targetPos;
                        SCIState.velocities[i] = 0;
                    }
                    // target position not reached
                    else
                    {
                        // unpretty workaround for speeds below 30 by moving 1 step once in a while, adds jitter; would require another global array otherwise;
                        if (SCIState.speed < 1.0f / Time.fixedDeltaTime)
                        {
                            SCIState.velocities[i] = UnityEngine.Random.value < SCIState.speed * Time.fixedDeltaTime ? 1 : 0;
                            SCIState.velocities[i] *= diff > 0 ? 1 : -1;
                            oldPos[i] += (int)SCIState.velocities[i];
                        }
                        else
                        {

                            if (diff > 0)
                            {
                                if ((SCIState.velocities[i] / SCIState.acceleration) * SCIState.velocities[i] / 2 > diff)
                                {

                                    SCIState.velocities[i] = Mathf.Max(SCIState.velocities[i] - SCIState.acceleration * Time.deltaTime, 1);      // decel
                                }
                                else
                                {
                                    SCIState.velocities[i] = Mathf.Min(SCIState.velocities[i] + SCIState.acceleration * Time.deltaTime, SCIState.speed);     // accel
                                }
                            }
                            else if (diff < 0)
                            {
                                if ((SCIState.velocities[i] / -SCIState.acceleration) * -SCIState.velocities[i] / 2 > Mathf.Abs(diff))
                                {

                                    SCIState.velocities[i] = Mathf.Min(SCIState.velocities[i] + SCIState.acceleration * Time.deltaTime, -1);      // decel
                                }
                                else
                                {
                                    SCIState.velocities[i] = Mathf.Max(SCIState.velocities[i] - SCIState.acceleration * Time.deltaTime, -SCIState.speed);     // accel
                                }
                            }

                            oldPos[i] = Mathf.Clamp(oldPos[i] + Mathf.RoundToInt(SCIState.velocities[i] * Time.deltaTime), 0, SCIState.maxSteps);

                        }
                    }

                    Vector3 p = new Vector3(x * 0.05f, oldPos[i] * -1.0f / (float)SCIState.stepsPerM, y * 0.05f);
                    elements[i].position = p;

                }

                if (oldCol[i] != SCIState.colors[i]) {
                    oldCol[i] = SCIState.colors[i];
                    //Color targetCol = Color.HSVToRGB((float)(SCIState.positions[i] % 2000) / 2000.0f,1,1);
                    Color targetCol = SCIState.colors[i];
                    elements[i].GetComponent<MeshRenderer>().material.SetColor("_EmissionColor", targetCol * 0.9f + new Color(0.1f,0.1f,0.1f)); // to simulate white base color of elements
                    elements[i].GetChild(0).GetComponent<Light>().color =  targetCol;

                }
            }
        }

        UpdateWire();
    }

    public void ApplicationQuit()
    {
        server.Stop();
    }

    /// <summary>
    /// In an early version, STRAIDE provided predefined animations to be shown.
    /// They are implemented in the Platform Emulator as well.
    /// </summary>
    private void PlayAnimation()
    {
        
        float scale = Time.time * 100.0f;
        float val = 0;
        for (int y = 0; y < SCIState.dim.y; y++)
        {
            for (int x = 0; x < SCIState.dim.x; x++)
            {
                switch (SCIState.currentPreset)
                {
                    case 0: // all sine
                        val = Mathf.Sin(scale * Mathf.Deg2Rad) * 0.5f + 0.5f;
                        break;
                    case 1: // x sine
                        val = Mathf.Sin((scale + x / (SCIState.dim.x - 1.0f) * 360.0f) * Mathf.Deg2Rad) * 0.5f + 0.5f;
                        break;
                    case 2: // y sine
                        val = Mathf.Sin((scale + y / (SCIState.dim.y - 1.0f) * 360.0f) * Mathf.Deg2Rad) * 0.5f + 0.5f;
                        break;
                    case 3: // xy sine
                        val = Mathf.Sin((scale + (x + y) / (SCIState.dim.x + SCIState.dim.y - 2.0f) * 360.0f) * Mathf.Deg2Rad) * 0.5f + 0.5f;
                        break;
                    case 4: // x twoway sine
                        val = Mathf.Sin((scale + Mathf.Min(x, SCIState.dim.x - x - 1) / (SCIState.dim.x / 2.0f) * 180.0f) * Mathf.Deg2Rad) * 0.5f + 0.5f;
                        break;
                    case 5: // y twoway sine
                        val = Mathf.Sin((scale + Mathf.Min(y, SCIState.dim.y - y - 1) / (SCIState.dim.y / 2.0f) * 180.0f) * Mathf.Deg2Rad) * 0.5f + 0.5f;
                        break;
                    case 6:
                        val = Mathf.Sin((scale + (Mathf.Min(x, SCIState.dim.x - x - 1) + Mathf.Min(y, SCIState.dim.y - y - 1)) / ((SCIState.dim.x + SCIState.dim.y) / 2.0f) * 180.0f) * Mathf.Deg2Rad) * 0.5f + 0.5f;
                        break;
                }
                int position = (int)(val * 300.0f + 500.0f + SCIState.offset);
                SCIState.positions[y * SCIState.dim.x + x] = position;
                SCIState.colors[y * SCIState.dim.x + x] = Color.HSVToRGB((position % 2000.0f) / 2000.0f, 1, 1);
            }
        }
    }

    /// <summary>
    /// Adds line renderer to scene which represent the strings and/or cables connected to each element.
    /// User can toggle their visibilty using [O].
    /// </summary>
    private void UpdateWire()
    {

        if (elements[0] != null)
        {
            for (int y = 0; y < SCIState.dim.y; y++)
            {
                for (int x = 0; x < SCIState.dim.x; x++)
                {

                    int i = y * SCIState.dim.x + x;
                    LineRenderer lr = elements[i].gameObject.GetComponent<LineRenderer>();
                    Vector3 p = elements[i].position;
                    Vector3 o = new Vector3(x * 0.05f, 0.05f, y * 0.05f);
                    Vector3 u = new Vector3(x * 0.05f, -1.8f, y * 0.05f);
                    switch (stringState)
                    {
                        case 1:
                            lr.enabled = true;
                            lr.SetPositions(new Vector3[] { o, p, p, p });
                            break;
                        case 2:
                            lr.enabled = true;
                            lr.SetPositions(new Vector3[] { o, p, p, u });
                            break;
                        default: lr.enabled = false; break;
                    }
                }
            }
        }     
    }

    public static string GetLocalIP()
    {
        var host = Dns.GetHostEntry(Dns.GetHostName());
        foreach (var ip in host.AddressList)
        {
            if (ip.AddressFamily == AddressFamily.InterNetwork)
            {
                return ip.ToString();
            }
        }
        Debug.LogError("Unable to retrieve IP Address");
        return "[error]";
    }

    public static void Restart(object sender, EventArgs e) { Restart(); }
    public static void Restart()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().name,LoadSceneMode.Single);
    }
}

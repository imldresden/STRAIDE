/**
 * 
 * @file SCIClient.cs
 * @author Severin Engert
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 * 
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using NativeWebSocket;      // see https://github.com/endel/NativeWebSocket
using System.Linq;

// Definition of general messages shared within all libraries, first byte hold MessageType
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

// Definition of different types of general information about STRAIDE
public enum InfoID : byte
{
    DIM = 0x01,
    DIAMETER = 0x02,
    RESOLUTION = 0x03,
    STEPSPERM = 0x04,
    MAXSTEPS = 0x05
};

// Definition of controllable motor Parameters
public enum ParamID : byte
{
    SPEED = 0x01,
    ACCELERATION = 0x02
};

// Generic X|Y Coordinate for every element, starting from front-left
public struct SCIElement
{
    public SCIElement(byte x, byte y)
    {
        this.x = x;
        this.y = y;
    }

    public byte x;
    public byte y;
}

public class SCIClient : MonoBehaviour
{
    public string WSAddress;

    WebSocket websocket;

    byte messageID = 0;

    public bool connected = false;

    // Callbacks
    public delegate void InformationListener(byte[] data);
    public InformationListener onInformation;
    public delegate void ReadyListener();
    public ReadyListener onReady;
    public delegate void InputListener(SCIElement element, int value);
    public InputListener onInput;


    async void Start()
    {
        websocket = new WebSocket(WSAddress);

        websocket.OnOpen += () =>
        {
            Debug.Log("Connection open!");
            onReady();
        };

        websocket.OnError += (e) =>
        {
            Debug.Log("Error! " + e);
        };

        websocket.OnClose += (e) =>
        {
            Debug.Log("Connection closed!");
        };

        websocket.OnMessage += (bytes) =>
        {
            ReceiveMessage(bytes);
        };

        await websocket.Connect();
    }

    async void SendMessage(byte[] message)
    {
        connected = (websocket.State == WebSocketState.Open);

        if (websocket.State == WebSocketState.Open)
        {
            await websocket.Send(message);
        }
        else
        {
            Debug.LogWarning("Sending message without connection.");
        }
    }

    private void ReceiveMessage(byte[] message)
    {
        if (message.Length > 0)
        {
            switch ((MessageType)message[0])
            {
                case MessageType.CONFIRM:
                    break;
                case MessageType.INFO:
                    onInformation(message.Skip(1).Take(message.Length).ToArray());
                    break;
                case MessageType.USERINPUT:
                    onInput(new SCIElement(message[1], message[2]), (message[3]<<8) + message[4]);
                    break;
                default:
                    Debug.LogError("Received Unknown Message, Type: " + message[0]);
                    break;

            }
        }
    }

    // ================  STRAIDE Commands   ===================================================================================
    public void SendPing()
    {
        SendMessage(new byte[] { (byte)MessageType.PING});
    }

    public void ToggleAcknowledgment(bool requestAck)
    {
        SendMessage(new byte[] { (byte)MessageType.ACKNOWLEDGMENT, messageID++, (byte)(requestAck? 0x01 : 0)});
    }

    public void Reset(byte what){
        SendMessage(new byte[] { (byte)MessageType.RESET, messageID++, what});
    }

    public void GetInformation(InfoID infoID)
    {
        SendMessage(new byte[] { (byte)MessageType.GET, (byte)infoID});
    }

    public void SetParam(ParamID paramID, int val)
    {
        SendMessage(new byte[] { (byte)MessageType.SETPARAM, messageID++, (byte)paramID, (byte)(val >> 8), (byte)val });
    }

    public void SetElementPosition(SCIElement element, int position)
    {
        byte[] message = new byte[6];

        message[0] = (byte)MessageType.ELEMENTPOS;
        message[1] = messageID++;
        message[2] = element.x;
        message[3] = element.y;
        message[4] = (byte)(position >> 8);
        message[5] = (byte)position;
        SendMessage(message);
    }

    public void SetAreaPosition(SCIElement lower, SCIElement upper, int position)
    {
        byte[] message = new byte[8];

        message[0] = (byte)MessageType.ELEMENTPOS;
        message[1] = messageID++;
        message[2] = lower.x;
        message[3] = lower.y;
        message[4] = upper.x;
        message[5] = upper.y;
        message[6] = (byte)(position >> 8);
        message[7] = (byte)position;
        SendMessage(message);
    }

    public void SetElementColor(SCIElement element, Color col)
    {
        byte[] message = new byte[7];

        message[0] = (byte)MessageType.ELEMENTCOL;
        message[1] = messageID++;
        message[2] = element.x;
        message[3] = element.y;
        message[4] = (byte)(col.r * 255);
        message[5] = (byte)(col.g * 255);
        message[6] = (byte)(col.b * 255);
        SendMessage(message);
    }

    public void SetAreaColor(SCIElement lower, SCIElement upper, Color col)
    {
        byte[] message = new byte[9];

        message[0] = (byte)MessageType.ELEMENTCOL;
        message[1] = messageID++;
        message[2] = lower.x;
        message[3] = lower.y;
        message[4] = upper.x;
        message[5] = upper.y;
        message[6] = (byte)(col.r * 255);
        message[7] = (byte)(col.g * 255);
        message[8] = (byte)(col.b * 255);
        SendMessage(message);
    }

    public void SetElementPositionAndColor(SCIElement element, int position, Color col)
    {
        byte[] message = new byte[9];

        message[0] = (byte)MessageType.ELEMENTPOSCOL;
        message[1] = messageID++;
        message[2] = element.x;
        message[3] = element.y;
        message[4] = (byte)(position >> 8);
        message[5] = (byte)position;
        message[6] = (byte)(col.r * 255);
        message[7] = (byte)(col.g * 255);
        message[8] = (byte)(col.b * 255);
        SendMessage(message);
    }

    public void SetAreaPositionAndColor(SCIElement lower, SCIElement upper, int position, Color col)
    {
        byte[] message = new byte[11];

        message[0] = (byte)MessageType.ELEMENTPOSCOL;
        message[1] = messageID++;
        message[2] = lower.x;
        message[3] = lower.y;
        message[4] = upper.x;
        message[5] = upper.y;
        message[6] = (byte)(position >> 8);
        message[7] = (byte)position;
        message[8] = (byte)(col.r * 255);
        message[9] = (byte)(col.g * 255);
        message[10] = (byte)(col.b * 255);
        SendMessage(message);
    }

    public void SetMultiplePositions(int[] positions)
    {

        byte[] message = new byte[2 + positions.Length * 2];
        message[0] = (byte)MessageType.MULTIPLEPOS;
        message[1] = messageID++;
        for (int i = 0; i < positions.Length; i++)
        {
            message[i * 2 + 2] = (byte)(positions[i] >> 8);
            message[i * 2 + 3] = (byte)positions[i];
        }
        SendMessage(message);
    }

    public void SetMultipleColors(Color[] colors)
    {

        byte[] message = new byte[2 + colors.Length * 3];
        message[0] = (byte)MessageType.MULTIPLEPOSCOL;
        message[1] = messageID++;
        for (int i = 0; i < colors.Length; i++)
        {
            message[i * 3 + 2] = (byte)(colors[i].r * 255);
            message[i * 3 + 3] = (byte)(colors[i].g * 255);
            message[i * 3 + 4] = (byte)(colors[i].b * 255);
        }
        SendMessage(message);

    }

    public void SetMultiplePositionsAndColors(int[] positions, Color[] colors)
    {
        if(positions.Length == colors.Length)
        {
            byte[] message = new byte[2 + positions.Length * 5];
            message[0] = (byte)MessageType.MULTIPLEPOSCOL;
            message[1] = messageID++;
            for (int i = 0; i < positions.Length; i++)
            {
                message[i * 5 + 2] = (byte)(positions[i] >> 8);
                message[i * 5 + 3] = (byte)positions[i];
                message[i * 5 + 4] = (byte)(colors[i].r * 255);
                message[i * 5 + 5] = (byte)(colors[i].g * 255);
                message[i * 5 + 6] = (byte)(colors[i].b * 255);
            }
            SendMessage(message);
        }
        else
        {
            Debug.LogError("Arrays for Position and Color need to be the same length.");
        }
    }

    public void PlayPreset(byte presetID)
    {
        SendMessage(new byte[] { (byte)MessageType.PRESET, messageID++, presetID });
    }

    public void SetOffset(int offset)
    {
        SendMessage(new byte[] { (byte)MessageType.OFFSET, messageID++, (byte)(offset >> 8), (byte)offset });
    }





    // ===============  OTHER STUFF ====================================================================================

    void Update()
    {
        #if !UNITY_WEBGL || UNITY_EDITOR
        websocket.DispatchMessageQueue();
        #endif
    }


    private async void OnApplicationQuit()
    {
        await websocket.Close();
    }

}

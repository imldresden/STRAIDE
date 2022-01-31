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

using UnityEngine;
using WebSocketSharp;
using WebSocketSharp.Server;


/// <summary>
/// This handler is used for the WebSocket communication.
/// It takes care of incoming messages and writes the global state of STRAIDE.
/// For application client requests, it packs answer messages and sends them directly.
/// </summary>
public class MessageHandler : WebSocketBehavior
{
    protected override void OnOpen()
    {
        SCIState.clientConnected = true;
        base.OnOpen();
    }

    protected override void OnClose(CloseEventArgs e)
    {
        SCIState.clientConnected = false;
        base.OnClose(e);
    }


    protected override void OnMessage(MessageEventArgs e)
    {
        byte[] data = e.RawData;
        UpdateLastCommandOutput((MessageType)data[0], (MessageType)data[0] == MessageType.PING ? 0 : data[1]);
        switch ((MessageType)data[0])
        {
            case MessageType.PING:
                SendConfirm(0);
                break;
            case MessageType.CONFIRM:
                Debug.LogWarning("CONFIRM Message was received, should only be send by SCI.");
                break;
            case MessageType.ACKNOWLEDGMENT:
                if (data.Length == 3)
                {
                    SendConfirm(data[1]);
                    ToggleAcknowledgments(data[2] == 0x01);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Toggle Acknowledgments needs to have 3 Bytes.");
                }
                break;
            case MessageType.RESET:
                if (data.Length == 3)
                {
                    SendConfirm(data[1]);
                    Reset(data[2]);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Reset Device needs to have 3 Bytes.");
                }
                break;
            case MessageType.GET:
                if (data.Length == 2)
                    SendInformation((InfoID)data[1]);
                else
                    Debug.LogWarning("DataPacket of Request for Information needs to have 2 Bytes.");
                break;
            case MessageType.INFO:
                Debug.LogWarning("INFO Message was received, should only be send by SCI.");
                break;
            case MessageType.SETPARAM:
                if (data.Length == 5)
                {
                    SendConfirm(data[1]);
                    SetParam((ParamID)data[2], (data[3] << 8) + data[4]);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Set Parameter needs to have 5 Bytes.");
                }
                break;
            case MessageType.ELEMENTPOS:
                if (data.Length == 6 || data.Length == 8)
                {
                    SendConfirm(data[1]);
                    SetElementPosition(data);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Set the Position of Elements needs to have 6 or 8 Bytes.");
                }
                break;
            case MessageType.ELEMENTCOL:
                if (data.Length >= 7)
                {
                    SendConfirm(data[1]);
                    SetElementColor(data);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Set Color of Elements needs to have at least 7 Bytes.");
                }
                break;
            case MessageType.ELEMENTPOSCOL:
                if (data.Length >= 9)
                {
                    SendConfirm(data[1]);
                    SetElementPositionAndColor(data);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Set Position and Color of Elements needs to have at least 9 Bytes.");
                }
                break;
            case MessageType.MULTIPLEPOS:
                if (data.Length == SCIState.dim.x * SCIState.dim.y * 2 + 2)
                {
                    SendConfirm(data[1]);
                    SetMultiplePositions(data);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Set Position of all Elements needs to have DimX * DimY * 2 + 2 Bytes.");
                }
                break;
            case MessageType.MULTIPLECOL:
                if (data.Length >= SCIState.dim.x * SCIState.dim.y * 3 + 2)
                {
                    SendConfirm(data[1]);
                    SetMultipleColors(data);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Set Color of all Elements needs to have at least DimX * DimY * 3 + 2 Bytes.");
                }
                break;
            case MessageType.MULTIPLEPOSCOL:
                if (data.Length >= SCIState.dim.x * SCIState.dim.y * 5 + 2)
                {
                    SendConfirm(data[1]);
                    SetMultiplePositionsAndColor(data);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Set Position and Color of all Elements needs to have at least DimX * DimY * 5 + 2 Bytes.");
                }
                break;
            case MessageType.PRESET:
                if (data.Length == 3)
                {
                    SendConfirm(data[1]);
                    StartAnimation(data[2]);
                }
                else
                {
                    Debug.LogWarning("DataPacket to Start a Preset needs to have 3 Bytes.");
                }
                break;
            case MessageType.OFFSET:
                if (data.Length == 4)
                {
                    SendConfirm(data[1]);
                    SCIState.offset = (data[2] << 8) + data[3];
                }
                else
                {
                    Debug.LogWarning("DataPacket to Set the Offset needs to have 4 Bytes.");
                }
                break;
            default:
                Debug.LogWarning("Received unknown message");
                break;
        }
    }

    private void ToggleAcknowledgments(bool sendAck)
    {
        SCIState.sendAck = sendAck;
    }

    private void Reset(byte what)
    {
        switch (what)
        {
            case 0x00:
                Debug.Log("Reset");
                SCIState.positions = new int[SCIState.dim.x * SCIState.dim.y];
                SCIState.colors = new Color[SCIState.dim.x * SCIState.dim.y];
                break;
            case 0x01:
                SCIState.positions = new int[SCIState.dim.x * SCIState.dim.y];
                break;
            case 0x02:
                SCIState.colors = new Color[SCIState.dim.x * SCIState.dim.y];
                break;
        }
    }

    private void SendConfirm(byte messageID)
    {
        if (SCIState.sendAck)
        {
            byte[] data = { (byte)MessageType.CONFIRM, messageID };
            Send(data);
        }
    }

    private void SendInformation(InfoID infoID)
    {
        switch (infoID)
        {
            case InfoID.DIM:
                {
                    byte[] data = { (byte)MessageType.INFO, (byte)infoID, (byte)SCIState.dim.x, (byte)SCIState.dim.y };
                    Send(data);

                }
                break;
            case InfoID.DIAMETER:
                {
                    byte[] data = { (byte)MessageType.INFO, (byte)infoID, (byte)SCIState.diameter };
                    Send(data);
                }
                break;
            case InfoID.RESOLUTION:
                {
                    byte[] data = { (byte)MessageType.INFO, (byte)infoID, (byte)SCIState.resolution };
                    Send(data);
                }
                break;
            case InfoID.STEPSPERM:
                {
                    byte[] data = { (byte)MessageType.INFO, (byte)infoID, (byte)(SCIState.stepsPerM >> 8), (byte)(SCIState.stepsPerM) };
                    Send(data);

                }
                break;
            case InfoID.MAXSTEPS:
                {
                    byte[] data = { (byte)MessageType.INFO, (byte)infoID, (byte)(SCIState.maxSteps >> 8), (byte)(SCIState.maxSteps) };
                    Send(data);

                }
                break;
            default:
                Debug.LogWarning("Received unknown infoID");
                break;
        }
    }

    private void SetParam(ParamID paramID, int val)
    {
        switch (paramID)
        {
            case ParamID.SPEED:
                SCIState.speed = Mathf.Clamp(val, 0, 4000);
                break;
            case ParamID.ACCELERATION:
                SCIState.acceleration = Mathf.Clamp(val, 50, 65000);
                break;
            default:
                Debug.LogWarning("Received unknown ParamID");
                break;
        }
    }

    private void SetElementPosition(byte[] data)
    {
        SCIState.playPreset = false;

        if (data.Length == 6)    // set single element
        {
            SCIState.positions[data[3] * SCIState.dim.x + data[2]] = (data[4] << 8) + data[5];
        }
        else if (data.Length == 8)  // set area of elements defined by min / max
        {
            GetBounds(data.SubArray<byte>(2, 5), out Vector2Int lower, out Vector2Int upper);
            for (int y = lower.y; y <= upper.y; y++)
            {
                for (int x = lower.x; x <= upper.x; x++)
                {
                    SCIState.positions[y * SCIState.dim.x + x] = (data[6] << 8) + data[7];
                }
            }
        }
    }

    private void SetElementColor(byte[] data)
    {
        switch (data.Length)
        {
            case 7:
                SCIState.colors[data[3] * SCIState.dim.x + data[2]] = CreateColor(data[4], data[5], data[6]); // new Color(data[4] / 255.0f, data[5] / 255.0f, data[6] / 255.0f);
                break;
            case 8: // #14
                SCIState.colors[data[3] * SCIState.dim.x + data[2]] = CreateColor(data[4], data[5], data[6], data[7]); // new Color(data[4] / 255.0f, data[5] / 255.0f, data[6] / 255.0f);
                break;
            case 9:
            case 10:
                GetBounds(data.SubArray<byte>(2, 5), out Vector2Int lower, out Vector2Int upper);
                for (int y = lower.y; y <= upper.y; y++)
                {
                    for (int x = lower.x; x <= upper.x; x++)
                    {
                        if (data.Length == 9)
                            SCIState.colors[y * SCIState.dim.x + x] = CreateColor(data[6], data[7], data[8]); // new Color(data[6] / 255.0f, data[7] / 255.0f, data[8] / 255.0f);
                        else
                            SCIState.colors[y * SCIState.dim.x + x] = CreateColor(data[6], data[7], data[8], data[9]); // #14
                    }
                }
                break;
            default:
                Debug.LogWarning("DataPacket to Set Color of Elements was malformed.");
                break;
        }
    }

    private void SetElementPositionAndColor(byte[] data)
    {
        SCIState.playPreset = false;

        switch (data.Length)
        {
            case 9:
            case 10: // unable to use white component of RGBW command
                SCIState.positions[data[3] * SCIState.dim.x + data[2]] = (data[4] << 8) + data[5];
                if (data.Length == 9)
                    SCIState.colors[data[3] * SCIState.dim.x + data[2]] = CreateColor(data[6], data[7], data[8]); // new Color(data[6] / 255.0f, data[7] / 255.0f, data[8] / 255.0f);
                else
                    SCIState.colors[data[3] * SCIState.dim.x + data[2]] = CreateColor(data[6], data[7], data[8], data[9]); // new Color(data[6] / 255.0f, data[7] / 255.0f, data[8] / 255.0f);
                break;
            case 11:
            case 12: // unable to use white component of RGBW command
                GetBounds(data.SubArray<byte>(2, 5), out Vector2Int lower, out Vector2Int upper);
                for (int y = lower.y; y <= upper.y; y++)
                {
                    for (int x = lower.x; x <= upper.x; x++)
                    {
                        SCIState.positions[y * SCIState.dim.x + x] = (data[6] << 8) + data[7];
                        if (data.Length == 11)
                            SCIState.colors[y * SCIState.dim.x + x] = CreateColor(data[8], data[9], data[10]); // new Color(data[8] / 255.0f, data[9] / 255.0f, data[10] / 255.0f);
                        else
                            SCIState.colors[y * SCIState.dim.x + x] = CreateColor(data[8], data[9], data[10], data[11]); // new Color(data[8] / 255.0f, data[9] / 255.0f, data[10] / 255.0f);
                    }
                }
                break;
            default:
                Debug.LogWarning("DataPacket to Set Position and Color of Elements was malformed.");
                break;
        }
    }

    private void GetBounds(byte[] data, out Vector2Int lower, out Vector2Int upper)
    {
        lower = new Vector2Int(data[0] < data[2] ? data[0] : data[2], data[1] < data[3] ? data[1] : data[3]);
        upper = new Vector2Int(data[0] > data[2] ? data[0] : data[2], data[1] > data[3] ? data[1] : data[3]);
    }

    private void SetMultiplePositions(byte[] data)
    {
        SCIState.playPreset = false;

        for (int y = 0; y < SCIState.dim.y; y++)
        {
            for (int x = 0; x < SCIState.dim.x; x++)
            {
                int i = y * SCIState.dim.x + x;
                SCIState.positions[i] = (data[i * 2 + 2] << 8) + data[i * 2 + 3];
            }
        }
    }

    private void SetMultipleColors(byte[] data)
    {
        bool whiteComponentIncluded = (data.Length == SCIState.dim.x * SCIState.dim.y * 4 + 2);
        for (int y = 0; y < SCIState.dim.y; y++)
        {
            for (int x = 0; x < SCIState.dim.x; x++)
            {
                int i = y * SCIState.dim.x + x;
                if (!whiteComponentIncluded)
                    SCIState.colors[i] = CreateColor(data[i * 3 + 2], data[i * 3 + 3], data[i * 3 + 4]); // new Color(data[i * 3 + 2] / 255.0f, data[i * 3 + 3] / 255.0f, data[i * 3 + 4] / 255.0f);
                else
                    SCIState.colors[i] = CreateColor(data[i * 4 + 2], data[i * 4 + 3], data[i * 4 + 4], data[i * 4 + 5]); // new Color(data[i * 4 + 2] / 255.0f, data[i * 4 + 3] / 255.0f, data[i * 4 + 4] / 255.0f);   // cannot use white component
            }
        }
    }

    private void SetMultiplePositionsAndColor(byte[] data)
    {
        SCIState.playPreset = false;

        bool whiteComponentIncluded = (data.Length == SCIState.dim.x * SCIState.dim.y * 6 + 2);
        for (int y = 0; y < SCIState.dim.y; y++)
        {
            for (int x = 0; x < SCIState.dim.x; x++)
            {
                int i = y * SCIState.dim.x + x;
                if (!whiteComponentIncluded)
                {
                    SCIState.positions[i] = (data[i * 5 + 2] << 8) + data[i * 5 + 3];
                    SCIState.colors[i] = CreateColor(data[i * 5 + 4], data[i * 5 + 5], data[i * 5 + 6]); // new Color(data[i * 5 + 4] / 255.0f, data[i * 5 + 5] / 255.0f, data[i * 5 + 6] / 255.0f);
                }
                else
                {
                    SCIState.positions[i] = (data[i * 6 + 2] << 8) + data[i * 6 + 3];
                    SCIState.colors[i] = CreateColor(data[i * 6 + 4], data[i * 6 + 5], data[i * 6 + 6], data[i * 6 + 7]); // new Color(data[i * 6 + 4] / 255.0f, data[i * 6 + 5] / 255.0f, data[i * 6 + 6] / 255.0f);   // cannot use white component
                }
            }
        }
    }

    private void StartAnimation(int presetNumber)
    {
        SCIState.currentPreset = presetNumber;
        SCIState.playPreset = true;
    }


    private void UpdateLastCommandOutput(MessageType type, int messageID)
    {
        string s = "";
        switch (type)
        {
            case MessageType.PING: s = "Ping"; break;
            case MessageType.CONFIRM: s = "Acknowledgment [Forbidden]"; break;
            case MessageType.ACKNOWLEDGMENT: s = "Toggle Acknowledgments"; break;
            case MessageType.RESET: s = "Reset"; break;
            case MessageType.GET: s = "Request Information"; break;
            case MessageType.INFO: s = "Info [Forbidden]"; break;
            case MessageType.SETPARAM: s = "Set Parameter"; break;
            case MessageType.ELEMENTPOS: s = "Set Position of One or More Element"; break;
            case MessageType.ELEMENTCOL: s = "Set Color of One or More Element"; break;
            case MessageType.ELEMENTPOSCOL: s = "Set Position and Color of One or More Elements"; break;
            case MessageType.MULTIPLEPOS: s = "Set Position of All Elements Individually"; break;
            case MessageType.MULTIPLECOL: s = "Set Color of All Elements Individually"; break;
            case MessageType.MULTIPLEPOSCOL: s = "Set Position and Color of All Elements Individually"; break;
            case MessageType.PRESET: s = "Start Animation"; break;
            case MessageType.OFFSET: s = "Set Offset for Animation"; break;
        }

        SCIState.lastCommand = "[" + messageID.ToString().PadLeft(3, '0') + "] " + s;
    }

    private Color CreateColor(byte r, byte g, byte b)
    {
        return new Color(r / 255.0f, g / 255.0f, b / 255.0f);
    }

    private Color CreateColor(byte r, byte g, byte b, byte w)
    {
        return new Color(r / 255f + w / 255f, g / 255f + w / 255f, b / 255f + w / 255f);    // may create a HDR color with values > 1
    }
}

/**
 * 
 * @file SCIClient.h
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

#ifndef SCIClient_h
#define SCIClient_h

#include <stdlib.h>
#include <WebSocketsClient.h>   // https://github.com/Links2004/arduinoWebSockets

// Generic Color construct with red, green, blue, and white component 0-255
class SCIColor {
    public:
        uint8_t r,g,b,w;
        SCIColor(uint8_t red = 0, uint8_t green = 0, uint8_t blue = 0, uint8_t white = 0){
            r = red;
            g = green;
            b = blue;
            w = white;
        }
};

// Generic X|Y Coordinate for every element, starting from front-left
class SCIElement {
    public:
        uint8_t x,y;
        SCIElement(uint8_t xCoord = 0, uint8_t yCoord = 0){
            x = xCoord;
            y = yCoord;
        }

        bool operator==(const SCIElement rhs){
            return x==rhs.x && y == rhs.y;
        }
};

class SCIClient {

    // Callbacks
    using ReadyCallback = void (*)();
    using InfoCallback = void (*)(uint8_t * payload, size_t length);
    using InputCallback = void (*)(SCIElement element, int value);

    public:
        // Definition of general messages shared within all libraries, first byte hold MessageType
        enum MessageType {
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
        enum InfoID {
            DIM = 0x01,
            DIAMETER = 0x02,
            RESOLUTION = 0x03,
            STEPSPERM = 0x04,
            MAXSTEPS = 0x05
        };

        // Definition of controllable motor Parameters
        enum ParamID {
            SPEED = 0x01,
            ACCELERATION = 0x02
        };

        SCIClient(String ip, uint16_t port = 80, String address = "/");
        void CallOnReady(ReadyCallback cb);
        void CallOnInfo(InfoCallback cb);
        void CallOnInput(InputCallback cb);
        void Loop();
        void SendPing();
        void ToggleAcknowledgment(bool requestAck);
        void Reset(uint8_t what = 0x00);
        void GetInformation(InfoID infoID);
        void SetParam(ParamID paramID, int val);
        void SetElementPosition(SCIElement element, int position);
        void SetAreaPosition(SCIElement lower, SCIElement upper, int position);
        void SetElementColor(SCIElement element, SCIColor color);
        void SetAreaColor(SCIElement lower, SCIElement upper, SCIColor color);
        void SetElementPositionAndColor(SCIElement element, int position, SCIColor color);
        void SetAreaPositionAndColor(SCIElement lower, SCIElement upper, int position, SCIColor color);
        void SetMultiplePositions(int positions[], const size_t length);
        void SetMultipleColors(SCIColor colors[], const size_t length);
        void SetMultiplePositionsAndColors(int positions[], SCIColor colors[], const size_t length);
        void PlayPreset(uint8_t presetID);
        void SetOffset(int offset);

    private:
        WebSocketsClient ws;
        ReadyCallback onReady = nullptr;
        InfoCallback onInfo = nullptr;
        InputCallback onInput = nullptr;
        uint8_t messageID = 0;
        void onMessage(WStype_t type, uint8_t * payload, size_t length);
        void ReceiveMessage(uint8_t * payload, size_t length);
};

#endif 
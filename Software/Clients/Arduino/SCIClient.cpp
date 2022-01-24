/**
 * 
 * @file SCIClient.cpp
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

#include "SCIClient.h"

SCIClient::SCIClient(String ip, uint16_t port, String address){
    ws.begin(ip,port,address);
    ws.onEvent(std::bind(&SCIClient::onMessage, this, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    ws.setReconnectInterval(5000);
}

void SCIClient::CallOnReady(ReadyCallback cb) 
{
	onReady = cb;
}

void SCIClient::CallOnInfo(InfoCallback cb) 
{
	onInfo = cb;
}

void SCIClient::CallOnInput(InputCallback cb) 
{
	onInput = cb;
}

void SCIClient::Loop(){
    ws.loop();
}

void SCIClient::SendPing() 
{
	uint8_t message[1];
	message[0] = MessageType::PING;
	ws.sendBIN(message,1);
}

void SCIClient::ToggleAcknowledgment(bool requestAck) 
{
	uint8_t message[3];
	message[0] = MessageType::ACKNOWLEDGMENT;
	message[1] = messageID++;
	message[2] = requestAck;
	ws.sendBIN(message,3);
}

void SCIClient::Reset(uint8_t what) 
{
	uint8_t message[3];
	message[0] = MessageType::RESET;
	message[1] = messageID++;
	message[2] = what;
	ws.sendBIN(message,3);
}

void SCIClient::GetInformation(InfoID infoID) 
{
	uint8_t message[2];
	message[0] = MessageType::GET;
	message[1] = infoID;
	ws.sendBIN(message,2);
}

void SCIClient::SetParam(ParamID paramID, int val) 
{
	uint8_t message[5];
	message[0] = MessageType::SETPARAM;
	message[1] = messageID++;
	message[2] = paramID;
	message[3] = val >> 8;
	message[4] = val;
	ws.sendBIN(message,5);
}

void SCIClient::SetElementPosition(SCIElement element, int position) 
{
	uint8_t message[6];
	message[0] = MessageType::ELEMENTPOS;
	message[1] = messageID++;
	message[2] = element.x;
	message[3] = element.y;
	message[4] = position >> 8;
	message[5] = position;
	ws.sendBIN(message,6);
}

void SCIClient::SetAreaPosition(SCIElement lower, SCIElement upper, int position) 
{
	uint8_t message[8];
	message[0] = MessageType::ELEMENTPOS;
	message[1] = messageID++;
	message[2] = lower.x;
	message[3] = lower.y;
	message[4] = upper.x;
	message[5] = upper.y;
	message[6] = position >> 8;
	message[7] = position;
	ws.sendBIN(message,8);
}

void SCIClient::SetElementColor(SCIElement element, SCIColor color) 
{
	uint8_t message[7];
	message[0] = MessageType::ELEMENTCOL;
	message[1] = messageID++;
	message[2] = element.x;
	message[3] = element.y;
	message[4] = color.r;
	message[5] = color.g;
	message[6] = color.b;
	message[7] = color.w;
	ws.sendBIN(message,7);
}

void SCIClient::SetAreaColor(SCIElement lower, SCIElement upper, SCIColor color) 
{
	uint8_t message[9];
	message[0] = MessageType::ELEMENTCOL;
	message[1] = messageID++;
	message[2] = lower.x;
	message[3] = lower.y;
	message[4] = upper.x;
	message[5] = upper.y;
	message[6] = color.r;
	message[7] = color.g;
	message[8] = color.b;
	message[9] = color.w;
	ws.sendBIN(message,9);
}

void SCIClient::SetElementPositionAndColor(SCIElement element, int position, SCIColor color) 
{
	uint8_t message[9];
	message[0] = MessageType::ELEMENTPOSCOL;
	message[1] = messageID++;
	message[2] = element.x;
	message[3] = element.y;
	message[4] = position >> 8;
	message[5] = position;
	message[6] = color.r;
	message[7] = color.g;
	message[8] = color.b;
	message[9] = color.w;
	ws.sendBIN(message,9);
}

void SCIClient::SetAreaPositionAndColor(SCIElement lower, SCIElement upper, int position, SCIColor color) 
{
	uint8_t message[11];
	message[0] = MessageType::ELEMENTPOSCOL;
	message[1] = messageID++;
	message[2] = lower.x;
	message[3] = lower.y;
	message[4] = upper.x;
	message[5] = upper.y;
	message[6] = position >> 8;
	message[7] = position;
	message[8] = color.r;
	message[9] = color.g;
	message[10] = color.b;
	message[11] = color.w;
	ws.sendBIN(message,11);	
}

void SCIClient::SetMultiplePositions(int positions[], const size_t length) 
{
	uint8_t message[length*2+2];
	message[0] = MessageType::MULTIPLEPOS;
	message[1] = messageID++;
	for (int i = 0; i < length; i++)
	{
		message[i * 2 + 2] = positions[i] >> 8;
		message[i * 2 + 3] = positions[i];
	}
	ws.sendBIN(message, length*2+2);
}

void SCIClient::SetMultipleColors(SCIColor colors[], const size_t length) 
{
	uint8_t message[2 + length*3];
	message[0] = MessageType::MULTIPLECOL;
	message[1] = messageID++;
	for (int i = 0; i < length; i++)
	{
		message[i * 4 + 2] = colors[i].r;
		message[i * 4 + 3] = colors[i].g;
		message[i * 4 + 4] = colors[i].b;
		message[i * 4 + 5] = colors[i].w;
	}
	ws.sendBIN(message, length*4+2);
}

void SCIClient::SetMultiplePositionsAndColors(int positions[], SCIColor colors[], const size_t length) 
{
	uint8_t message[2 + length*6];
	message[0] = MessageType::MULTIPLEPOSCOL;
	message[1] = messageID++;
	for (int i = 0; i < length; i++)
	{
		message[i * 6 + 2] = positions[i] >> 8;
		message[i * 6 + 3] = positions[i];
		message[i * 6 + 4] = colors[i].r;
		message[i * 6 + 5] = colors[i].g;
		message[i * 6 + 6] = colors[i].b;
		message[i * 6 + 7] = colors[i].w;
	}
	ws.sendBIN(message, length*6+2);
}

void SCIClient::PlayPreset(uint8_t presetID) 
{
	uint8_t message[3];
	message[0] = MessageType::PRESET;
	message[1] = messageID++;
	message[2] = presetID;
	ws.sendBIN(message,3);
}

void SCIClient::SetOffset(int offset) 
{
	uint8_t message[4];
	message[0] = MessageType::OFFSET;
	message[1] = messageID++;
	message[2] = offset >> 8;
	message[3] = offset;
	ws.sendBIN(message,4);
}

void SCIClient::onMessage(WStype_t type, uint8_t * payload, size_t length){
	switch(type) {
		case WStype_DISCONNECTED:
			Serial.printf("[WS] Disconnected!\n");
			break;
		case WStype_CONNECTED:
			Serial.printf("[WS] Connected to url: %s\n", payload);
			onReady();
			break;
		case WStype_TEXT:
			//Serial.printf("[WS] get text: %s\n", payload);
			break;
		case WStype_BIN:
			//Serial.printf("[WS] get binary length: %u\n", length);
			ReceiveMessage(payload, length);
			break;
		case WStype_ERROR:			
		case WStype_FRAGMENT_TEXT_START:
		case WStype_FRAGMENT_BIN_START:
		case WStype_FRAGMENT:
		case WStype_FRAGMENT_FIN:
			break;
	}    
}

void SCIClient::ReceiveMessage(uint8_t * payload, size_t length) 
{
	if(length > 0){
		switch(payload[0]){
			case MessageType::CONFIRM:
				break;
			case MessageType::INFO:
				onInfo(&(payload[1]), length-1);
				break;
			case MessageType::USERINPUT:
				onInput(SCIElement(payload[1],payload[2]),(payload[3]<<8)+payload[4]);
				break;
			default:
				Serial.println("Received unknown message!");
				break;
		}
	}
}

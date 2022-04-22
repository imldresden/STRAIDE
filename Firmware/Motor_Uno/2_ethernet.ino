#include "defines.h"

void enableShields(bool enable)
{
    digitalWrite(ETH_EN, enable ? HIGH : LOW);
}

void hardresetShields()
{
    enableShields(false);
    delay(1234);
    enableShields(true);
    delay(1234);
    Ethernet.init(10);
    delay(1000);
    Ethernet.begin(mac, clientIP);
}

void loopEthernet()
{

    Ethernet.maintain();

    // NO CONNECTION
    if (!eth.connected())
    {
        eth.stop();
        delay(500);
        if (eth.connect(serverIP, serverPort))
        {
            Serial.println("Reconnected to TCP server");
        }
        else
        {
            Serial.println("Resetting Ethernet Shield");
            hardresetShields();
        }
    }
    else // HAS CONNECTION
    {
        if (eth.available() > 0)
        {
            receiveEvent();
        }

        // check for user input
        uint8_t i = 0;
        for (SCIMotor *m : motors)
        {
            if (m->getInput())
            {
                int pos = m->m()->targetPosition();
                byte d[] = {i, pos >> 8, pos};
                eth.write(d, 3);
#if DEBUG == true
                Serial.print("Send Input: [");
                Serial.print(d[0], HEX);
                Serial.print(d[1], HEX);
                Serial.print(d[2], HEX);
                Serial.println("]");
#endif
            }
            i++;
        }
    }
}

void receiveEvent()
{
    digitalWrite(LED_BUILTIN, HIGH);
    int dataSize = eth.available();
    byte data[dataSize];

    // Read Ethernet Data
    for (int i = 0; i < dataSize; i++)
    {
        data[i] = eth.read();
    }

    // Parse data package
    switch (data[0])
    {
    case MessageType::PING:
        Serial.println("Received Ping");
        break;
    case MessageType::SETPARAM:
    {
        Serial.print("Set Param To ");
        int val = max(0, (int)word(data[2], data[3]));
        Serial.println(val);
        switch (data[1])
        {
        case ParamID::SPEED:
        {
            for (SCIMotor *m : motors)
                m->setMaxSpeed(val);
            break;
        }
        case ParamID::ACCELERATION:
        {
            for (SCIMotor *m : motors)
                m->setAcceleration(val);
            break;
        }
        default:
        {
            Serial.println("Received faulty parameter data");
            break;
        }
        }
        break;
    }
    case MessageType::ELEMENTPOS:
    {
        if (dataSize == 10)
        {
            int val0 = (int)word(data[2], data[3]);
            int val1 = (int)word(data[4], data[5]);
            int val2 = (int)word(data[6], data[7]);
            int val3 = (int)word(data[8], data[9]);
            motors[0]->moveTo(val0);
            motors[1]->moveTo(val1);
            motors[2]->moveTo(val2);
            motors[3]->moveTo(val3);
        }
        else
        {
            Serial.println("Message to set Elements' Position had incorrect length.");
        }
        break;
    }
    default:
        Serial.println("Received unknown data package");
        break;
    }
    digitalWrite(LED_BUILTIN, LOW);
}
#include <Adafruit_NeoPixel.h> // install library from https://github.com/adafruit/Adafruit_NeoPixel
#include <WiFi.h>              // part of esp-32 arduino library https://github.com/espressif/arduino-esp32
#include <confidential.h>      // private libray containing WLAN_SSID and WLAN_PASS
#include <WebSocketsClient.h>  // install library from https://github.com/Links2004/arduinoWebSockets

#define IP "X.X.X.X" // enter the IP of server

#define LEDS_PER_ROW 8

#define ROW_0_PIN 14
#define ROW_1_PIN 27
#define ROW_2_PIN 26
#define ROW_3_PIN 25
#define ROW_4_PIN 33
#define ROW_5_PIN 32
#define ROW_6_PIN 16
#define ROW_7_PIN 17

WebSocketsClient ws;

Adafruit_NeoPixel leds0(LEDS_PER_ROW, ROW_0_PIN, NEO_GRBW + NEO_KHZ800);
Adafruit_NeoPixel leds1(LEDS_PER_ROW, ROW_1_PIN, NEO_GRBW + NEO_KHZ800);
Adafruit_NeoPixel leds2(LEDS_PER_ROW, ROW_2_PIN, NEO_GRBW + NEO_KHZ800);
Adafruit_NeoPixel leds3(LEDS_PER_ROW, ROW_3_PIN, NEO_GRBW + NEO_KHZ800);
Adafruit_NeoPixel leds4(LEDS_PER_ROW, ROW_4_PIN, NEO_GRBW + NEO_KHZ800);
Adafruit_NeoPixel leds5(LEDS_PER_ROW, ROW_5_PIN, NEO_GRBW + NEO_KHZ800);
Adafruit_NeoPixel leds6(LEDS_PER_ROW, ROW_6_PIN, NEO_GRBW + NEO_KHZ800);
Adafruit_NeoPixel leds7(LEDS_PER_ROW, ROW_7_PIN, NEO_GRBW + NEO_KHZ800);
Adafruit_NeoPixel *rows[64 / LEDS_PER_ROW];

bool dirty[] = {false, false, false, false, false, false, false, false};

void setup()
{
    Serial.begin(115200);

    // Setup WiFi
    WiFi.mode(WIFI_STA);
    WiFi.begin(WLAN_SSID, WLAN_PASS);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
        if (millis() > 20000) // sometimes this process takes forever, ESP32 can be restarted which sometimes helps, remove for other microcontrollers
            ESP.restart();
    }

    // Setup WS connection
    ws.begin(IP, 7779, "/");
    ws.onEvent(onMessage);
    ws.setReconnectInterval(5000);

    // Setup LEDs
    rows[0] = &leds0;
    rows[1] = &leds1;
    rows[2] = &leds2;
    rows[3] = &leds3;
    rows[4] = &leds4;
    rows[5] = &leds5;
    rows[6] = &leds6;
    rows[7] = &leds7;

    for (Adafruit_NeoPixel *leds : rows)
    {
        leds->begin();
        leds->show();
        leds->setPixelColor(0, leds->ColorHSV(random(64000), 255, 150));
        for (int i = 1; i < LEDS_PER_ROW; i++)
        {
            leds->setPixelColor(i, leds->Color(0, 0, 0));
        }
        leds->show();
    }
}

// Loop WS and apply new colors to LEDs
void loop()
{
    for (int i = 0; i < 8; i++)
    {
        if (dirty[i])
        {
            delay(1);
            portDISABLE_INTERRUPTS(); // sometimes color flickering occurs due to interrupt handling, this might be workaround
            rows[i]->show();
            portENABLE_INTERRUPTS();
            dirty[i] = false;
        }
    }
    ws.loop();
}

void dataAvailable(uint8_t *payload, size_t length)
{
    if (length == 2 + 64 * 4)
    {
        for (uint8_t x = 0; x < 8; x++)
        {
            Adafruit_NeoPixel *leds = rows[x];
            for (uint8_t y = 0; y < 8; y++)
            {
                int i = y * 8 * 4 + x * 4 + 2;
                uint32_t col = leds->gamma32(leds->Color(payload[i], payload[i + 1], payload[i + 2], payload[i + 3]));
                if (leds->getPixelColor(y) != col)
                {
                    leds->setPixelColor(y, col);
                    dirty[x] = true;
                }
            }
        }
    }
    else
    {
        Serial.println("Received malformed data.");
    }
}

void onMessage(WStype_t type, uint8_t *payload, size_t length)
{
    switch (type)
    {
    case WStype_DISCONNECTED:
        Serial.printf("[WS] Disconnected!\n");
        break;
    case WStype_CONNECTED:
        Serial.printf("[WS] Connected to url: %s\n", payload);
        break;
    case WStype_TEXT:
        break;
    case WStype_BIN:
        dataAvailable(payload, length);
        break;
    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
        break;
    }
}

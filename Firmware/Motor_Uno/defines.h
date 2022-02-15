#pragma once

#include <AccelStepper.h>
#include <MultiStepper.h>
#include <SPI.h>
#include <Ethernet.h>

#define SLAVE_ADDR 17
#define RETRACTION 5
#define DEBUG false

// Pin Assignment with Ethernet Shield
#define ETH_EN A5

#define EN_PIN 8
#define MOTOR1_STEP A2
#define MOTOR1_DIR A4
#define MOTOR2_STEP 4
#define MOTOR2_DIR 7
#define MOTOR3_STEP 2
#define MOTOR3_DIR 5
#define MOTOR4_STEP 3
#define MOTOR4_DIR 6

#define USE_ENDSTOPS true
#define ANTI_CLOCKWISE false
#define MOTOR1_STOP A3
#define MOTOR2_STOP A1
#define MOTOR3_STOP 9
#define MOTOR4_STOP A0

#include "SCIMotor.h"

// Communication Messages
enum MessageType {
    PING = 0x00,
    CONFIRM = 0x01,
    SETPARAM = 0x20,
    ELEMENTPOS = 0x30
};

enum ParamID {
    SPEED = 0x01,
    ACCELERATION = 0x02
};

// Ethernet setup
byte mac[] = {0xFC, 0xFE, 0xFE, 0xFE, 0xFE, SLAVE_ADDR};
IPAddress clientIP(X, X, X, SLAVE_ADDR);
IPAddress serverIP(X, X, X, X);
const int serverPort = 7778;

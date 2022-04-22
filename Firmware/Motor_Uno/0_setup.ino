#include "defines.h"

// create 4 separate AccelStepper instances for each motor
AccelStepper motor1 = AccelStepper(AccelStepper::DRIVER, MOTOR1_STEP, MOTOR1_DIR);
AccelStepper motor2 = AccelStepper(AccelStepper::DRIVER, MOTOR2_STEP, MOTOR2_DIR);
AccelStepper motor3 = AccelStepper(AccelStepper::DRIVER, MOTOR3_STEP, MOTOR3_DIR);
AccelStepper motor4 = AccelStepper(AccelStepper::DRIVER, MOTOR4_STEP, MOTOR4_DIR);

// Array to access motors via custom interface
SCIMotor *motors[4];

EthernetClient eth;

void setup() {
  // Reset of Ethernet Shield is wired to ETH_EN, needs to be HIGH to activate ethernet shield
  pinMode(ETH_EN,OUTPUT);
  enableShields(true);

  Serial.begin(115200);
  Serial.println("Slave Demo");

  // create 4 motor interfaces
  motors[0] = new SCIMotor(&motor1, MOTOR1_STOP);
  motors[1] = new SCIMotor(&motor2, MOTOR2_STOP);
  motors[2] = new SCIMotor(&motor3, MOTOR3_STOP);
  motors[3] = new SCIMotor(&motor4, MOTOR4_STOP);

  delay(300 * SLAVE_ADDR);    // delay each client to not overload router

  Ethernet.init(10);    // boot ethernet shield

  delay(1000);

  Ethernet.begin(mac,clientIP);   // connect to network
  Ethernet.setRetransmissionCount(4);

  delay(1000);

  if (eth.connect(serverIP, serverPort))    // connect to server
    Serial.println("Connected to TCP server");
  else
    Serial.println("Failed to connect to TCP server");
}
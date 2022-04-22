#include "defines.h"
/**
 * @brief Class encapsulating the logic for each individual motor
 * building on top of AccelStepper.h, but adding initial setup, calibration, user input 
 */
class SCIMotor
{
private:
  AccelStepper *motor;
  uint8_t endStopPin;
  float targetSpeed = 1000;
  bool calibrating = false;
  bool releasing = false;
  bool userInput = false;

public:
  /**
     * @brief Construct a new SCIMotor object
     * 
     * @param m reference to AccelStepper instance
     * @param end endstop pin
     */
  SCIMotor(AccelStepper *m, uint8_t end)
  {
    motor = m;
    motor->setMinPulseWidth(5);
    motor->setEnablePin(EN_PIN);
    motor->setPinsInverted(ANTI_CLOCKWISE, false, true);
    motor->enableOutputs();
    motor->setMaxSpeed(targetSpeed);
    motor->setAcceleration(16000);

    endStopPin = end;
    pinMode(endStopPin, INPUT_PULLUP);

#if USE_ENDSTOPS == true
    calibrating = true;
    motor->setMaxSpeed(100);
    motor->moveTo(-10000);
#endif
  }
  /**
     * @brief Set a new target position for motor, 0 triggers calibration
     * 
     * @param absolute position value > 0
     */
  void moveTo(long absolute)
  {

#if USE_ENDSTOPS == true

    if (absolute <= 0 && absolute != motor->targetPosition())
    {
      calibrating = true;
      motor->moveTo(-10000);
    }
    else if (!calibrating)
    {
      motor->moveTo(absolute);
    }

#else

    motor->moveTo(absolute);

#endif
  }

  /**
     * @brief Run motor 1 step, implements automated calibration
     * 
     * @return true if motor is stepped
     * @return false if motor is not stepped
     */
  bool run()
  {
#if USE_ENDSTOPS == true

    // Detect User Input: if element is dragged, the end stop will be triggered
    if (!calibrating && !releasing && !digitalRead(endStopPin) && motor->distanceToGo() < RETRACTION)
    {
      motor->move(RETRACTION);
      userInput = true;
    }

    if (calibrating)
    {
      if (motor->currentPosition() < 50)
      {
        motor->setMaxSpeed(100);
      }

      if (!digitalRead(endStopPin))
      {
        calibrating = false;
        releasing = true;
        motor->setCurrentPosition(-100);
        motor->setMaxSpeed(targetSpeed);
        motor->moveTo(0);
      }
    }

    if (releasing && digitalRead(endStopPin))
    {
      releasing = false;
    }

#endif

    return motor->run();
  }

  /**
   * @brief Set the Max Speed value
   * 
   * @param speed value in steps/second
   */
  void setMaxSpeed(float speed)
  {
    targetSpeed = speed;
    motor->setMaxSpeed(targetSpeed);
  }

  /**
   * @brief Set the Acceleration value
   * 
   * @param acceleration value in steps/second²
   */
  void setAcceleration(float acceleration)
  {
    motor->setAcceleration(acceleration);
  }

  /**
   * @brief Get direct user input
   * 
   * @return true if user input was detected
   * @return false if no input occured
   */

  bool getInput()
  {
    bool inp = userInput;
    userInput = false;
    return inp;
  }

  /**
   * @brief Return the AccelStepper instance
   * 
   * @return AccelStepper* of this interface
   */
  AccelStepper *m()
  {
    return motor;
  }
};
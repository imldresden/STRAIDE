#include "defines.h"

// loop ethernet and all motors
void loop()
{
  int i = 0;
  for (SCIMotor *m : motors)
  {
#if DEBUG == true
    if (i == 0)
    {
      Serial.print(3000);
      Serial.print(",");
      Serial.print(m->m()->currentPosition());
      Serial.print(",");
      Serial.print(m->m()->targetPosition());
      Serial.print(",");
      Serial.print(m->m()->speed() + 2500);
      Serial.print(",");
      Serial.println(2000);
      i++;
    }
#endif
    m->run();
  }
  loopEthernet();
}
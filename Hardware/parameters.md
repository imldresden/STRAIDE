# Controllable Motor Parameters

To date, STRAIDE applications can control 2 different parameters of the actuators.

## Speed
The speed for each motor can be defined as an unsigned integer value. It refers to the number of steps per second, which the stepper motor actuates the elements. A single step size can be calculated as

$step=pi*40mm/400\approx0.31416mm$

The real world speed can therefor be calculated like

$RealSpeed=speed*^{step}/_s$

| Speed | RealSpeed |
| --- | --- |
| 100 | $`31^{mm}/_s`$ |
| 1000 | $`314^{mm}/_s`$ |
| 4000 | $`1257^{mm}/_s`$ |

The speed value can be picked in between $0-4000$. Everything above 4000 is not achievable due to hardware constraints. Everything above 1000 is only achievable, if only one of every 4 motors is actuated, as they are internally grouped into $2\times2$ motor towers. Speeds below 200 should be prevented, as the motor's torque is reduced at low speeds.

## Acceleration
***! Acceleration NOT yet implemented in Simulator !*** 

The acceleration is also defined as an unsigned integer value. It refers to the speed increase in steps per square second. Generally an acceleration above 1000 should be picked.

More information can be found in the chart. Currently, the elements weight approximately 200g.
![motorresults](/img/motorresults.png)
# CrystalSolver

Javascript implementation of a 2D finite difference scheme solver of parabolic problems
running on a GPU.

To run the code, open `index.html`.

[Live demonstration](http://rekka.github.com/crystal/)

## Compatibility

Tested in recent Google Chrome and Mozilla Firefox.
Firefox seems to be three times faster than Chrome
(tested on `stefan` program, mesh size 512: Chrome 25.0.1364.160: 4000 timesteps/s, Firefox 21.0a2: 12000 timesteps/s).

### Mozilla Firefox

The code can be open both locally
and via http protocol by opening `index.html`.

### Google Chrome

Since Chrome does not support accessing local files
(shader sources are loaded via `XMLHttpRequest`)
due to its [Same Origin Policy](http://en.wikipedia.org/wiki/Same_origin_policy) restriction,
the code runs properly in Chrome
only if opened via http protocol.



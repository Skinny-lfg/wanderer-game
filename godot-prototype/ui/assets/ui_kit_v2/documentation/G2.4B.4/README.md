# G2.4B.4 — Resource Bars

Candidate production PNGs based on G2.4B.1 materials and G2.4B.3 v2 restrained frame direction; Art Style Guide v1.2. Six 320×32 RGBA assets, no text or icons baked in. One reusable frame and empty track, four independent fills (Health red, Mana blue, Barrier pale blue/cyan, Experience muted gold). Frame center transparent. All source textures unchanged.

## Godot integration proposal
Use three layered controls: a NinePatchRect for bar_track, a clipped Control containing a full-size NinePatchRect for fill_<resource>, and a NinePatchRect for bar_frame above. All three have patch margins left/right 16 px, top/bottom 7 px; stretch mode, mouse_filter IGNORE. Set the fill child to the full size of the bar, not the current value. On resize update all layers. Clip with a parent Control (clip_contents=true) anchored at the left, its width calculated from the fill alpha bounds at that size (approx 5–6 px inset; use manifest algorithm), and hide the fill at zero. Use a Label as separate optional overlay. Keep barrier separate or integrate with health only after checking current gameplay UI; do not change mechanics. For compact enemy bars a minimum tested size is 100×16; smaller sizes not validated.

## Tests
6 PNGs decoded and checked for expected dimensions, RGBA and transparency. 36 nine-slice simulations with exact corner preservation at six sizes; 120 fill clipping simulations at 0/1/25/50/100%, checking monotonic coverage, 0 empty, 1% produces a composited RGB change of at least 15/255, and 100% identical to the full fill. Preview uses actual exported PNGs. No Godot runtime test or GitHub upload. Final color and readability in combat need owner approval and runtime verification.

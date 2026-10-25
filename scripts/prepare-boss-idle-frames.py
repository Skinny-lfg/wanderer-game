#!/usr/bin/env python3
"""Extract first frame of approved boss attack GIFs to matching transparent idle PNGs."""
from pathlib import Path
from io import BytesIO
import sys
from PIL import Image

root=Path(__file__).resolve().parents[1]
check="--check" in sys.argv
for boss in ("abyssal_guardian","rift_harbinger","ember_sovereign"):
    gif_file=root/"assets"/"bosses"/"animated"/f"{boss}_attack_x1.gif"
    png_file=gif_file.with_name(f"{boss}_idle.png")
    with Image.open(gif_file) as gif:
        assert gif.n_frames >= 4 and gif.width <= 768, boss
        gif.seek(0)
        image=gif.convert("RGBA")
        assert image.getbbox(), f"{boss}: empty frame"
        assert image.getchannel("A").getextrema()[0]<255, f"{boss}: missing transparency"
        io=BytesIO()
        image.save(io,format="PNG",optimize=True)
        data=io.getvalue()
        if check:
            assert png_file.is_file() and png_file.read_bytes()==data, f"{boss}: stale idle"
        elif not png_file.is_file() or png_file.read_bytes()!=data:
            png_file.write_bytes(data)
        print(f"PASS {boss}: {image.width}x{image.height} idle matches GIF first frame")

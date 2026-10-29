#!/usr/bin/env python3
"""Generate the Bill Tracker app icon (home-screen / PWA icon): lime
background, bold black "Bill Tracker" wordmark in SF Pro Rounded, stacked
on two lines with tight letter-spacing, no caption.

Produces assets/icon-512.png, assets/icon-192.png, assets/icon-180.png.
"""
from PIL import Image, ImageDraw, ImageFont

HERE = __file__.rsplit("/", 1)[0]
FONT_PATH = "/System/Library/Fonts/SFNSRounded.ttf"
OUT_DIR = HERE + "/../assets"

BG = "#D6F25C"
INK = "#14151A"
SIZE = 512
LINES = ["Bill", "Tracker"]
TRACKING = -6


def load_font(size):
    f = ImageFont.truetype(FONT_PATH, size)
    f.set_variation_by_axes([400, 900])  # GRAD, Weight
    return f


def line_width(draw, text, font, tracking):
    w = 0
    for ch in text:
        w += draw.textbbox((0, 0), ch, font=font)[2] + tracking
    return w - tracking


def fit_font(draw, text, target_width, start_size, tracking):
    size = start_size
    while size > 10:
        f = load_font(size)
        w = line_width(draw, text, f, tracking)
        if w <= target_width:
            return f, w
        size -= 2
    f = load_font(10)
    return f, line_width(draw, text, f, tracking)


def draw_tracked(draw, xy, text, font, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textbbox((0, 0), ch, font=font)[2] + tracking


def main():
    img = Image.new("RGB", (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)

    rendered = []
    for line in LINES:
        font, w = fit_font(draw, line, SIZE * 0.84, 220, TRACKING)
        bbox = draw.textbbox((0, 0), line, font=font)
        rendered.append((line, font, w, bbox))

    line_gap = 6
    heights = [b[3] - b[1] for _, _, _, b in rendered]
    total_h = sum(heights) + line_gap * (len(rendered) - 1)
    y = (SIZE - total_h) / 2

    for (line, font, w, bbox), h in zip(rendered, heights):
        x = (SIZE - w) / 2 - bbox[0]
        draw_tracked(draw, (x, y - bbox[1]), line, font, INK, TRACKING)
        y += h + line_gap

    img.save(f"{OUT_DIR}/icon-512.png")
    img.resize((192, 192), Image.LANCZOS).save(f"{OUT_DIR}/icon-192.png")
    img.resize((180, 180), Image.LANCZOS).save(f"{OUT_DIR}/icon-180.png")
    print("Wrote icon-512.png, icon-192.png, icon-180.png")


if __name__ == "__main__":
    main()

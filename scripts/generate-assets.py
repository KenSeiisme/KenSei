
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, os, pathlib, json

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = os.environ.get("SYSTEM_FONTS", r"C:\Windows\Fonts")
BG = (16, 11, 20)

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def stops(colors):
    def f(t):
        t = min(max(t, 0.0), 1.0)
        if len(colors) == 1:
            return colors[0]
        pos = t * (len(colors) - 1)
        i = int(pos)
        return colors[-1] if i >= len(colors) - 1 else lerp(colors[i], colors[i + 1], pos - i)
    return f

def vgrad(size, y0, y1, colors):
    w, h = size
    img = Image.new("RGB", (w, h))
    f = stops(colors)
    px = img.load()
    for y in range(h):
        c = f((y - y0) / max(y1 - y0, 1))
        for x in range(0, w):
            px[x, y] = c
    return img

def radial(size, center, radius, color, strength=1.0, power=2.0):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - center[0]) ** 2 + (yy - center[1]) ** 2) / radius
    a = np.clip(1 - d, 0, 1) ** power * strength
    arr = np.zeros((h, w, 4), dtype=np.uint8)
    arr[..., 0], arr[..., 1], arr[..., 2] = color
    arr[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")

# ---------- avatar ----------
if (ROOT / "profile_picture.webp").exists():
    print("avatar exists, skip re-encode")
    av = Image.open(ROOT / "profile_picture.png").convert("RGBA")
else:
    src = Image.open(ROOT / "profile_picture.png").convert("RGBA")
    av = src.resize((400, 400), Image.LANCZOS)
    av.save(ROOT / "profile_picture.webp", "WEBP", quality=82, method=6)
    av.save(ROOT / "profile_picture.png", "PNG", optimize=True)
    png_size = (ROOT / "profile_picture.png").stat().st_size
    if png_size > 120 * 1024:
        q = av.quantize(colors=256, method=Image.FASTOCTREE)
        tmp = ROOT / "_q.png"
        q.save(tmp, "PNG", optimize=True)
        if tmp.stat().st_size < png_size:
            tmp.replace(ROOT / "profile_picture.png")
            print("quantized avatar png")
        else:
            tmp.unlink()
    print("avatar webp=%d png=%d" % ((ROOT / "profile_picture.webp").stat().st_size, (ROOT / "profile_picture.png").stat().st_size))

# ---------- og image ----------
W, H = 1200, 630
og = Image.new("RGBA", (W, H), BG + (255,))
og.alpha_composite(radial((W, H), (330, 60), 700, (244, 114, 182), 0.20, 2.2))
og.alpha_composite(radial((W, H), (1180, 620), 560, (168, 85, 247), 0.17, 2.0))
og.alpha_composite(radial((W, H), (950, 315), 260, (244, 114, 182), 0.16, 2.4))

# no dot texture: keep gradients clean for social previews

line = Image.new("RGBA", (W, 2))
f_line = stops([(244, 114, 182), (232, 121, 249), (167, 139, 250)])
lp = line.load()
for x in range(W):
    lp[x, 0] = f_line(x / (W - 1)) + (255,)
    lp[x, 1] = f_line(x / (W - 1)) + (255,)
og.alpha_composite(line, (0, 0))

d = ImageDraw.Draw(og)
d.text((80, 84), "<PROFILE />", font=font("consolab.ttf", 24), fill=(249, 168, 212, 200))

name_font = font("segoeuib.ttf", 132)
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).text((80, 148), "KenSei", font=name_font, fill=(244, 114, 182, 150))
og.alpha_composite(glow.filter(ImageFilter.GaussianBlur(26)))

mask = Image.new("L", (W, H), 0)
ImageDraw.Draw(mask).text((80, 148), "KenSei", font=name_font, fill=255)
name_grad = vgrad((W, H), 148, 320, [(255, 255, 255), (255, 228, 230), (249, 168, 212)])
og.paste(name_grad, (0, 0), mask)

d.text((84, 330), "Code. Local AI. Generative Art.", font=font("segoeui.ttf", 36), fill=(171, 152, 157, 255))
d.text((84, 392), "TAR UMT Computer Science Student \u00b7 Malaysia", font=font("segoeui.ttf", 24), fill=(124, 109, 115, 255))
d.text((84, 500), "kensei-eta.vercel.app", font=font("consola.ttf", 22), fill=(124, 109, 115, 255))

avatar = av.resize((260, 260), Image.LANCZOS)
amask = Image.new("L", (260, 260), 0)
ImageDraw.Draw(amask).rounded_rectangle([0, 0, 259, 259], radius=58, fill=255)
ring = Image.new("RGBA", (276, 276), (0, 0, 0, 0))
ImageDraw.Draw(ring).rounded_rectangle([0, 0, 275, 275], radius=62, outline=(249, 168, 212, 150), width=3)
og.alpha_composite(ring, (812, 177))
og.paste(avatar, (820, 185), amask)

og.convert("RGB").save(ROOT / "og-image.png", "PNG", optimize=True)
print("og-image bytes=%d" % (ROOT / "og-image.png").stat().st_size)

# ---------- icons ----------
def bracket_icon(size):
    S = size * 4
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=BG + (255,))
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    w = max(2, int(S * 0.085))
    left = [(int(S * 0.42), int(S * 0.30)), (int(S * 0.27), int(S * 0.50)), (int(S * 0.42), int(S * 0.70))]
    right = [(int(S * 0.58), int(S * 0.30)), (int(S * 0.73), int(S * 0.50)), (int(S * 0.58), int(S * 0.70))]
    for pts in (left, right):
        md.line(pts, fill=255, width=w, joint="curve")
    grad = vgrad((S, S), 0, S, [(244, 114, 182), (232, 121, 249), (167, 139, 250)])
    img.paste(grad, (0, 0), mask)
    return img.resize((size, size), Image.LANCZOS)

bracket_icon(32).save(ROOT / "favicon-32.png", "PNG", optimize=True)
bracket_icon(180).save(ROOT / "apple-touch-icon.png", "PNG", optimize=True)
print("icons ok")

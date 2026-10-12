"""Bake the Arka hero bean's texture atlas (color, bump, roughness).

Atlas layout matches components/beanGeometry.js: left half = crease face, right half = domed back
(mirrored in x). UVs there are spread by surface distance (arc tables); this script inverts that
spread so painted features (the crease) land exactly on the modelled geometry.
Run from the project root:  python scratch/bake_arka_bean.py
"""
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree

RES = 1024                       # pixels per face; atlas is 2*RES x RES
E = 1.2                          # BEAN.uvExtent
A, B = 1.16, 0.8                 # BEAN.halfLength, BEAN.halfWidth
PROFILES = {"front": (0.24, 0.4), "back": (0.72, 0.52)}   # (height, exponent) per face
SAMPLES = 512
OUT = "public/models"
rng = np.random.default_rng(20260917)

xs = (np.arange(RES) + 0.5) / RES * 2 * E - E
ys = E - (np.arange(RES) + 0.5) / RES * 2 * E
U, V = np.meshgrid(xs, ys)       # atlas (UV) face-space coordinates
PX = 2 * E / RES


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def noise(sigma, shape=(RES, RES)):
    n = gaussian_filter(rng.standard_normal(shape), sigma, mode="wrap")
    return (n - n.min()) / (n.max() - n.min())


def lerp(a, b, t):
    return a + (b - a) * t[..., None]


def arc_table(height, exponent):
    rs = np.linspace(0, 1, SAMPLES + 1)
    z = height * (1 - rs ** 2) ** exponent
    s = np.concatenate([[0], np.cumsum(np.hypot((A + B) / 2 / SAMPLES, np.diff(z)))])
    return rs, s / s[-1]


def surface_coords(face):
    """Map atlas coordinates back to the model's (x, y) by inverting the UV spread."""
    rs, table = arc_table(*PROFILES[face])
    q = V / A
    rho = np.hypot(U / (B * (1 + 0.05 * q)), q)
    r = np.where(rho < 1, np.interp(rho, table, rs), rho)
    k = np.where(rho > 1e-6, r / np.maximum(rho, 1e-6), 0)
    return U * k, V * k


def segments_field(X, Y, count, near_crease, length_rng, width, depth_rng, angle_jitter):
    """Rasterize short crack/wrinkle segments (placed in model space) into a 0..1 field."""
    field = np.zeros((RES, RES))
    for _ in range(count):
        if near_crease:
            y0 = rng.uniform(-0.92, 0.92) * A
            x0 = 0.05 * np.sin(2.1 * y0 + 0.5) + 0.018 * np.sin(5.3 * y0) + rng.choice([-1, 1]) * rng.uniform(0.07, 0.42)
            ang = rng.normal(0, angle_jitter)            # roughly perpendicular to the crease
        else:
            y0, x0, ang = rng.uniform(-0.9, 0.9) * A, rng.uniform(-0.8, 0.8) * B, rng.uniform(0, np.pi)
        if np.hypot(x0 / B, y0 / A) > 0.92:
            continue
        half = rng.uniform(*length_rng) / 2
        dx, dy = np.cos(ang), np.sin(ang)
        sx, sy = X - x0, Y - y0
        box = (np.abs(sx) < half + 5 * width) & (np.abs(sy) < half + 5 * width)
        rows, cols = np.nonzero(box.any(1))[0], np.nonzero(box.any(0))[0]
        if not len(rows):
            continue
        sl = (slice(rows[0], rows[-1] + 1), slice(cols[0], cols[-1] + 1))
        along = np.clip(sx[sl] * dx + sy[sl] * dy, -half, half)
        dist = np.hypot(sx[sl] - along * dx, sy[sl] - along * dy)
        taper = 1 - (np.abs(along) / half) ** 2
        val = np.exp(-(dist / (width * (0.4 + 0.6 * taper))) ** 2) * taper * rng.uniform(*depth_rng)
        field[sl] = np.maximum(field[sl], val)
    return field


def pits(X, Y, count, radius):
    pts = np.column_stack([rng.uniform(-E, E, count), rng.uniform(-E, E, count)])
    depth = rng.uniform(0.35, 1.0, count)
    dist, idx = cKDTree(pts).query(np.column_stack([X.ravel(), Y.ravel()]))
    return (np.exp(-(dist / radius) ** 2) * depth[idx]).reshape(RES, RES)


# Shared across faces (sampled in atlas space, which matches along the rim).
mottle = smoothstep(0.2, 0.85, np.clip(0.35 * noise(30) + 0.4 * noise(10) + 0.25 * noise(3), 0, 1))
dark, mid, light = np.array([84, 40, 22], float), np.array([124, 62, 33], float), np.array([156, 82, 45], float)
base = np.where((mottle < 0.5)[..., None], lerp(dark, mid, mottle * 2), lerp(mid, light, (mottle - 0.5) * 2))
base += (noise(0.8) - 0.5)[..., None] * 16                               # fine speckle
crinkle = (1 - np.abs(2 * noise(2.4) - 1)) ** 3                         # ridged network of tiny wrinkles
grain = noise(0.9)                                                       # micro roughness


def bake_face(face):
    X, Y = surface_coords(face)
    color = base * (1 - 0.14 * (1 - crinkle))[..., None]
    height = 0.55 + 0.22 * (crinkle - 0.3) + 0.12 * (grain - 0.5)
    rough = 0.62 + 0.12 * (1 - mottle) + 0.1 * (1 - crinkle)

    pores = pits(X, Y, 20000 if face == "front" else 18000, 0.0045)
    color *= (1 - 0.14 * pores)[..., None]
    height -= 0.3 * pores
    rough += 0.1 * pores

    if face == "front":
        R = np.hypot(X / (B * (1 + 0.05 * Y / A)), Y / A)
        D = X - (0.05 * np.sin(2.1 * Y + 0.5) + 0.018 * np.sin(5.3 * Y))
        cracks = segments_field(X, Y, 110, True, (0.04, 0.16), 0.003, (0.3, 0.65), 0.35)
        fade = 1 - smoothstep(0.84, 0.99, R)
        w = 0.052 * (1 + 0.45 * (noise(6) - 0.5) * 2)                   # torn, irregular crease lips
        inner = smoothstep(w, w * 0.55, np.abs(D)) * fade
        slit = np.exp(-((np.abs(D) - w) / 0.007) ** 2) * fade            # thin dark gap between lobe and silverskin
        lip = np.exp(-((np.abs(D) - w - 0.016) / 0.012) ** 2) * fade     # raised lips catch light
        streak = gaussian_filter(rng.standard_normal((RES, RES)), (7, 0.7), mode="wrap")
        streak = smoothstep(-1, 1, streak / streak.std())                 # papery fibres along the crease
        silver = lerp(np.array([122, 74, 40], float), np.array([198, 142, 84], float), streak)
        color = color * (1 - 0.5 * slit)[..., None] * (1 - 0.22 * cracks)[..., None] * (1 + 0.12 * lip)[..., None]
        color = lerp(color, silver, inner)
        height = height - 0.45 * slit + 0.12 * lip - 0.35 * cracks + inner * (0.14 * streak - 0.06)
        rough = rough + 0.15 * cracks + inner * 0.25
    else:
        wrinkles = segments_field(X, Y, 110, False, (0.03, 0.11), 0.0035, (0.25, 0.55), 0)
        dimples = pits(X, Y, 1400, 0.026)
        color *= (1 - 0.2 * wrinkles - 0.12 * dimples)[..., None]
        height = height - 0.3 * wrinkles - 0.22 * dimples
        rough = rough + 0.06 * dimples

    return (np.clip(color, 0, 255).astype(np.uint8),
            (np.clip(height, 0, 1) * 255).astype(np.uint8),
            (np.clip(rough, 0, 1) * 255).astype(np.uint8))


fc, fh, fr = bake_face("front")
bc, bh, br = bake_face("back")
flip = lambda a: a[:, ::-1]                                              # back half is mirrored in x
Image.fromarray(np.hstack([fc, flip(bc)])).save(f"{OUT}/arka-bean-color.jpg", quality=90)
Image.fromarray(np.hstack([fh, flip(bh)])).save(f"{OUT}/arka-bean-bump.jpg", quality=90)
Image.fromarray(np.hstack([fr, flip(br)])).save(f"{OUT}/arka-bean-roughness.jpg", quality=85)
print("baked", OUT + "/arka-bean-{color,bump,roughness}.jpg")

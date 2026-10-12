import os
import numpy as np
from PIL import Image, ImageFilter, ImageOps
from scipy.ndimage import gaussian_filter, sobel

input_path = r"C:\Users\dines\.gemini\antigravity-ide\brain\db6885a0-df83-42b6-bc3f-1461dc899586\.user_uploaded\media_1789611080200.png"
output_dir = r"c:\Users\dines\OneDrive\Desktop\claude\Arka website\public\models"
os.makedirs(output_dir, exist_ok=True)

img = Image.open(input_path).convert("RGBA")

# Extract crops
# Left bean (back): X [37, 453], Y [21, 549]
back_crop = img.crop((35, 18, 455, 552))
# Right bean (front): X [511, 1009], Y [75, 544]
front_crop = img.crop((508, 72, 1012, 548))

# Rotate to be vertically upright
front_rot = front_crop.rotate(47.5, expand=True, resample=Image.BICUBIC)
back_rot = back_crop.rotate(-29.3, expand=True, resample=Image.BICUBIC)

def extract_bean_with_alpha(pil_img):
    arr = np.array(pil_img).astype(float)
    # Background in the render is neutral gray [140, 140, 140]
    # Bean has strong red/brown coloration (R >> G > B)
    diff_rg = arr[:, :, 0] - arr[:, :, 1]
    diff_rb = arr[:, :, 0] - arr[:, :, 2]
    chroma = np.sqrt(diff_rg**2 + diff_rb**2)
    
    # Sigmoid / smoothstep alpha mask based on chroma
    alpha = np.clip((chroma - 8.0) / 12.0, 0.0, 1.0)
    alpha = gaussian_filter(alpha, sigma=1.0)
    
    # Also find bounding box where alpha > 0.1
    ys, xs = np.where(alpha > 0.08)
    ymin, ymax = ys.min(), ys.max()
    xmin, xmax = xs.min(), xs.max()
    
    # Crop to bounding box
    cropped_rgb = arr[ymin:ymax+1, xmin:xmax+1, :3]
    cropped_alpha = alpha[ymin:ymax+1, xmin:xmax+1]
    
    return cropped_rgb, cropped_alpha

front_rgb, front_alpha = extract_bean_with_alpha(front_rot)
back_rgb, back_alpha = extract_bean_with_alpha(back_rot)

print(f"Front bean extracted size: {front_rgb.shape[:2]}")
print(f"Back bean extracted size: {back_rgb.shape[:2]}")

# We will build 2048 x 2048 maps:
CANVAS_SIZE = 2048
TARGET_H = 1750 # Leave ~150px margin top and bottom for pole tapering

# Resize front bean to target height
front_aspect = front_rgb.shape[1] / front_rgb.shape[0]
target_w_front = int(TARGET_H * front_aspect * 1.05)
front_pil = Image.fromarray(np.uint8(front_rgb))
front_alpha_pil = Image.fromarray(np.uint8(front_alpha * 255))
front_pil_resized = front_pil.resize((target_w_front, TARGET_H), Image.LANCZOS)
front_alpha_resized = front_alpha_pil.resize((target_w_front, TARGET_H), Image.LANCZOS)

# Resize back bean to target height
back_aspect = back_rgb.shape[1] / back_rgb.shape[0]
target_w_back = int(TARGET_H * back_aspect * 1.08)
back_pil = Image.fromarray(np.uint8(back_rgb))
back_alpha_pil = Image.fromarray(np.uint8(back_alpha * 255))
back_pil_resized = back_pil.resize((target_w_back, TARGET_H), Image.LANCZOS)
back_alpha_resized = back_alpha_pil.resize((target_w_back, TARGET_H), Image.LANCZOS)

# Create 2048x2048 diffuse canvas
# Fill with rich dark roasted coffee color
bg_color = np.array([48, 22, 12], dtype=float) # Deep roasted umber
diffuse = np.zeros((CANVAS_SIZE, CANVAS_SIZE, 3), dtype=float) + bg_color

# Add organic roasted texture variation to base canvas
np.random.seed(42)
noise = np.random.randn(CANVAS_SIZE, CANVAS_SIZE, 3) * 6.0
noise = gaussian_filter(noise, sigma=[3.0, 3.0, 0])
diffuse = np.clip(diffuse + noise, 20, 80)

# Paste Front Bean centered at X = 1024 (U = 0.5)
y_offset = (CANVAS_SIZE - TARGET_H) // 2
x_center_front = CANVAS_SIZE // 2
x_start_front = x_center_front - target_w_front // 2

f_arr = np.array(front_pil_resized).astype(float)
f_mask = np.array(front_alpha_resized).astype(float) / 255.0

# Paste with alpha blending
for c in range(3):
    sub = diffuse[y_offset:y_offset+TARGET_H, x_start_front:x_start_front+target_w_front, c]
    diffuse[y_offset:y_offset+TARGET_H, x_start_front:x_start_front+target_w_front, c] = (
        sub * (1.0 - f_mask) + f_arr[:, :, c] * f_mask
    )

# Paste Back Bean centered at X = 0 and wrapped at X = 2048 (U = 0.0 and 1.0)
b_arr = np.array(back_pil_resized).astype(float)
b_mask = np.array(back_alpha_resized).astype(float) / 255.0

half_w = target_w_back // 2
# Left half of back bean goes to right side of canvas (X from 2048 - half_w to 2048)
b_left_rgb = b_arr[:, :half_w]
b_left_mask = b_mask[:, :half_w]
x_start_right = CANVAS_SIZE - half_w

for c in range(3):
    sub = diffuse[y_offset:y_offset+TARGET_H, x_start_right:CANVAS_SIZE, c]
    diffuse[y_offset:y_offset+TARGET_H, x_start_right:CANVAS_SIZE, c] = (
        sub * (1.0 - b_left_mask) + b_left_rgb[:, :, c] * b_left_mask
    )

# Right half of back bean goes to left side of canvas (X from 0 to target_w_back - half_w)
b_right_rgb = b_arr[:, half_w:]
b_right_mask = b_mask[:, half_w:]
rem_w = target_w_back - half_w

for c in range(3):
    sub = diffuse[y_offset:y_offset+TARGET_H, 0:rem_w, c]
    diffuse[y_offset:y_offset+TARGET_H, 0:rem_w, c] = (
        sub * (1.0 - b_right_mask) + b_right_rgb[:, :, c] * b_right_mask
    )

# Seamlessly feather and blend seams at X=0/2048
seam_w = 30
blend_x = (diffuse[:, :seam_w] + diffuse[:, -seam_w:]) * 0.5
diffuse[:, :seam_w] = blend_x
diffuse[:, -seam_w:] = blend_x

# Smooth polar ends to natural dark roasted coffee tips
y_coords = np.arange(CANVAS_SIZE)
top_pole_fade = np.clip(y_coords / float(y_offset + 60), 0.0, 1.0)[:, None, None]
bottom_pole_fade = np.clip((CANVAS_SIZE - 1 - y_coords) / float(y_offset + 60), 0.0, 1.0)[:, None, None]
pole_mask = top_pole_fade * bottom_pole_fade
# darken tips slightly (natural bean hilum / chalaza)
tip_dark = np.array([32, 14, 8], dtype=float)
diffuse = diffuse * pole_mask + tip_dark * (1.0 - pole_mask)

diffuse = np.clip(diffuse, 0, 255).astype(np.uint8)
diffuse_img = Image.fromarray(diffuse)
diffuse_path = os.path.join(output_dir, "coffee-bean-diffuse.jpg")
diffuse_img.save(diffuse_path, quality=95)
print(f"Saved diffuse texture to {diffuse_path}")

# Now build Normal Map
# Convert diffuse to grayscale / height approximation
gray = diffuse.astype(float).mean(axis=2)
# Chaff in the center is brighter but physically sunken in the fissure,
# so invert the brightness inside the fissure region for the macro cleft
# Region around X = 1024 (crease)
x_coords = np.arange(CANVAS_SIZE)[None, :]
crease_dist = np.abs(x_coords - 1024) / 120.0
is_center = np.exp(-crease_dist**2)

# Normal calculation using Sobel filters
scale = 1.8
dx = sobel(gray, axis=1) * (scale / 8.0)
dy = sobel(gray, axis=0) * (scale / 8.0)

# Add steep fissure canyon slope toward the center line
# Slope pulls towards center X=1024
fissure_slope = -(x_coords - 1024) / 80.0 * np.exp(-crease_dist**2) * 45.0
dx = dx + fissure_slope

# High frequency micro-wrinkles
hf = gray - gaussian_filter(gray, sigma=2.0)
dx += sobel(hf, axis=1) * 0.6
dy += sobel(hf, axis=0) * 0.6

dz = np.full_like(dx, 60.0)

# Normalize vectors
norm = np.sqrt(dx**2 + dy**2 + dz**2)
nx = -dx / norm
ny = -dy / norm
nz = dz / norm

normal_r = np.uint8(np.clip((nx * 0.5 + 0.5) * 255, 0, 255))
normal_g = np.uint8(np.clip((ny * 0.5 + 0.5) * 255, 0, 255))
normal_b = np.uint8(np.clip((nz * 0.5 + 0.5) * 255, 0, 255))
normal_map = np.stack([normal_r, normal_g, normal_b], axis=-1)

normal_img = Image.fromarray(normal_map)
normal_path = os.path.join(output_dir, "coffee-bean-normal.jpg")
normal_img.save(normal_path, quality=95)
print(f"Saved normal map to {normal_path}")

# Now build Roughness Map
# High points on roasted lobes: silky sheen (roughness ~0.35)
# Micro-wrinkles & pores: slightly rougher (~0.45 - 0.50)
# Inside the central fissure and chaff: dry, fibrous, matte (roughness ~0.85 - 0.95)
roughness = np.full((CANVAS_SIZE, CANVAS_SIZE), 0.38, dtype=float)

# Crease is rough/matte
roughness += is_center * 0.48

# Chaff detection (light yellowish pixels)
is_chaff = (diffuse[:, :, 0] > 110) & (diffuse[:, :, 1] > 80) & (diffuse[:, :, 2] < 90)
roughness[is_chaff] = 0.92

# Micro-texture roughness variation
roughness += (hf / 255.0) * 0.18
roughness = np.clip(roughness * 255.0, 0, 255).astype(np.uint8)

rough_img = Image.fromarray(roughness)
rough_path = os.path.join(output_dir, "coffee-bean-roughness.jpg")
rough_img.save(rough_path, quality=95)
print(f"Saved roughness map to {rough_path}")

# Build Ambient Occlusion Map
ao = np.full((CANVAS_SIZE, CANVAS_SIZE), 255, dtype=float)
# Deep occlusion inside fissure canyon
ao -= is_center * 160.0
# Fine occlusion in micro-wrinkles
ao -= np.clip(-hf * 2.0, 0, 70)
ao = np.clip(ao, 0, 255).astype(np.uint8)

ao_img = Image.fromarray(ao)
ao_path = os.path.join(output_dir, "coffee-bean-ao.jpg")
ao_img.save(ao_path, quality=95)
print(f"Saved AO map to {ao_path}")
print("All realistic textures generated successfully!")

import json
import struct
import numpy as np

obj_path = r"c:\Users\dines\OneDrive\Desktop\claude\Arka website\public\models\coffee-bean.obj"
glb_path = r"c:\Users\dines\OneDrive\Desktop\claude\Arka website\public\models\coffee-bean.glb"

# We can directly generate the binary arrays:
# High resolution grid
U_SEGS = 140
V_SEGS = 140

positions = []
uvs = []
normals = []
indices = []

for iv in range(V_SEGS + 1):
    v_norm = iv / float(V_SEGS)
    phi = v_norm * np.pi
    y_raw = np.cos(phi)
    y = y_raw * 1.15
    
    y_shifted = y_raw + 0.08
    profile = np.sqrt(np.maximum(0.001, 1.0 - y_shifted**2 * 0.92)) * (1.0 - 0.12 * y_shifted**2)
    tip_factor = 1.0 - 0.35 * np.exp(-((abs(y_raw) - 0.95)**2) / 0.01)
    profile *= tip_factor
    
    crease_center_theta = 0.09 * np.sin(np.pi * y * 0.85) + 0.035 * np.sin(2.4 * np.pi * y + 0.3)
    
    for iu in range(U_SEGS + 1):
        u_norm = iu / float(U_SEGS)
        theta = (u_norm - 0.5) * 2.0 * np.pi
        d_theta = theta - crease_center_theta
        
        width = 0.68
        front_depth = 0.44
        back_depth = 0.48
        
        cos_th = np.cos(theta)
        sin_th = np.sin(theta)
        
        if cos_th <= 0:
            back_flatten = 1.0 - 0.08 * (sin_th**2)
            bx = sin_th * width * profile * back_flatten
            bz = cos_th * back_depth * profile
            if bx > 0:
                bx *= 1.03
        else:
            sigma = 0.42
            cleft_depth = 0.88
            cleft = np.exp(-(d_theta**2) / (2.0 * sigma**2))
            lobe_curve = (1.0 - cleft * cleft_depth)
            lobe_bulge = 1.0 + 0.18 * np.sin(np.pi * np.clip(abs(d_theta)/0.9, 0, 1))**2
            
            bx = sin_th * width * profile * (1.0 - 0.16 * cleft)
            bz = cos_th * front_depth * profile * lobe_curve * lobe_bulge
            
            chaff_sigma = 0.12
            chaff_ridge = 0.045 * np.exp(-(d_theta**2) / (2.0 * chaff_sigma**2)) * profile
            bz += chaff_ridge
            
            if bx > 0:
                bx *= 1.06
                bz *= 1.03
                
        micro_wrinkle = (
            np.sin(y * 24.0 + bx * 14.0) * 0.007 +
            np.sin(bx * 28.0 - bz * 18.0) * 0.005 +
            np.cos(y * 38.0 + bz * 22.0) * 0.004
        ) * profile
        
        bx += bx * micro_wrinkle
        bz += bz * micro_wrinkle
        
        positions.append([bx, y, bz])
        uvs.append([u_norm, 1.0 - v_norm])

pos_arr = np.array(positions, dtype=np.float32)
uv_arr = np.array(uvs, dtype=np.float32)

# Generate indices
for iv in range(V_SEGS):
    for iu in range(U_SEGS):
        p1 = iv * (U_SEGS + 1) + iu
        p2 = p1 + 1
        p3 = (iv + 1) * (U_SEGS + 1) + iu
        p4 = p3 + 1
        
        indices.extend([p1, p3, p2])
        indices.extend([p2, p3, p4])

idx_arr = np.array(indices, dtype=np.uint32)

# Compute vertex normals
norm_arr = np.zeros_like(pos_arr)
for i in range(0, len(idx_arr), 3):
    i1, i2, i3 = idx_arr[i], idx_arr[i+1], idx_arr[i+2]
    v1, v2, v3 = pos_arr[i1], pos_arr[i2], pos_arr[i3]
    fn = np.cross(v2 - v1, v3 - v1)
    norm_arr[i1] += fn
    norm_arr[i2] += fn
    norm_arr[i3] += fn

# Normalize
norm_lengths = np.linalg.norm(norm_arr, axis=1, keepdims=True)
norm_lengths[norm_lengths == 0] = 1.0
norm_arr = (norm_arr / norm_lengths).astype(np.float32)

# Pack binary buffer
pos_bytes = pos_arr.tobytes()
norm_bytes = norm_arr.tobytes()
uv_bytes = uv_arr.tobytes()
idx_bytes = idx_arr.tobytes()

# Align each buffer view to 4-byte boundaries
def pad_bytes(b):
    pad = (4 - (len(b) % 4)) % 4
    return b + b"\x00" * pad

b_pos = pad_bytes(pos_bytes)
b_norm = pad_bytes(norm_bytes)
b_uv = pad_bytes(uv_bytes)
b_idx = pad_bytes(idx_bytes)

bin_data = b_pos + b_norm + b_uv + b_idx

pos_offset = 0
norm_offset = len(b_pos)
uv_offset = norm_offset + len(b_norm)
idx_offset = uv_offset + len(b_uv)

# GLTF structure
gltf = {
    "asset": {"version": "2.0", "generator": "Arka 3D Coffee Bean Generator"},
    "scenes": [{"nodes": [0]}],
    "nodes": [{"mesh": 0, "name": "CoffeeBean"}],
    "meshes": [{
        "name": "CoffeeBeanMesh",
        "primitives": [{
            "attributes": {
                "POSITION": 0,
                "NORMAL": 1,
                "TEXCOORD_0": 2
            },
            "indices": 3,
            "mode": 4
        }]
    }],
    "accessors": [
        {
            "bufferView": 0,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(pos_arr),
            "type": "VEC3",
            "max": [float(x) for x in pos_arr.max(axis=0)],
            "min": [float(x) for x in pos_arr.min(axis=0)]
        },
        {
            "bufferView": 1,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(norm_arr),
            "type": "VEC3",
            "max": [float(x) for x in norm_arr.max(axis=0)],
            "min": [float(x) for x in norm_arr.min(axis=0)]
        },
        {
            "bufferView": 2,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(uv_arr),
            "type": "VEC2",
            "max": [float(x) for x in uv_arr.max(axis=0)],
            "min": [float(x) for x in uv_arr.min(axis=0)]
        },
        {
            "bufferView": 3,
            "byteOffset": 0,
            "componentType": 5125, # UNSIGNED_INT
            "count": len(idx_arr),
            "type": "SCALAR",
            "max": [int(idx_arr.max())],
            "min": [int(idx_arr.min())]
        }
    ],
    "bufferViews": [
        {"buffer": 0, "byteOffset": pos_offset, "byteLength": len(pos_bytes), "target": 34962},
        {"buffer": 0, "byteOffset": norm_offset, "byteLength": len(norm_bytes), "target": 34962},
        {"buffer": 0, "byteOffset": uv_offset, "byteLength": len(uv_bytes), "target": 34962},
        {"buffer": 0, "byteOffset": idx_offset, "byteLength": len(idx_bytes), "target": 34963}
    ],
    "buffers": [{"byteLength": len(bin_data)}]
}

json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
# Pad JSON to 4-byte boundary with spaces (0x20)
json_pad = (4 - (len(json_bytes) % 4)) % 4
json_bytes += b" " * json_pad

# Total GLB length: Header(12) + Chunk0(8 + len(json_bytes)) + Chunk1(8 + len(bin_data))
total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_data)

header = struct.pack("<4sII", b"glTF", 2, total_length)
chunk0_header = struct.pack("<I4s", len(json_bytes), b"JSON")
chunk1_header = struct.pack("<I4s", len(bin_data), b"BIN\x00")

with open(glb_path, "wb") as f:
    f.write(header)
    f.write(chunk0_header)
    f.write(json_bytes)
    f.write(chunk1_header)
    f.write(bin_data)

print(f"Saved GLB binary model to {glb_path} ({total_length} bytes)")

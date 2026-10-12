import os
import numpy as np

output_obj = r"c:\Users\dines\OneDrive\Desktop\claude\Arka website\public\models\coffee-bean.obj"

# High-resolution parametric grid
U_SEGS = 160
V_SEGS = 160

vertices = []
uvs = []
normals = []

for iv in range(V_SEGS + 1):
    v_norm = iv / float(V_SEGS) # 0 to 1 (bottom to top)
    
    # Normalized height along Y: from -1.15 to +1.15
    # Bean is slightly wider in bottom half (y < 0) than top half (y > 0)
    phi = v_norm * np.pi # 0 at top, pi at bottom
    # Let y go from +1.15 at iv=0 to -1.15 at iv=V_SEGS
    y_raw = np.cos(phi) # 1 at top, -1 at bottom
    y = y_raw * 1.15
    
    # Cross-sectional scaling along length:
    # Natural coffee bean profile: rounded poles with slight indentation, widest around y = -0.15
    y_shifted = y_raw + 0.08
    profile = np.sqrt(np.maximum(0.001, 1.0 - y_shifted**2 * 0.92)) * (1.0 - 0.12 * y_shifted**2)
    
    # Tip flattening / pole indentation (hilum and blossom ends)
    tip_factor = 1.0 - 0.35 * np.exp(-((abs(y_raw) - 0.95)**2) / 0.01)
    profile *= tip_factor
    
    # Organic S-curve center line of the crease
    crease_center_theta = 0.09 * np.sin(np.pi * y * 0.85) + 0.035 * np.sin(2.4 * np.pi * y + 0.3)
    
    for iu in range(U_SEGS + 1):
        u_norm = iu / float(U_SEGS) # 0 to 1
        # In our UV map:
        # u = 0.5 is the front center (where the fissure is located, +Z)
        # u = 0.0 and 1.0 is the back center (-Z)
        # Angle theta: 0 at front center, +pi and -pi at back center
        theta = (u_norm - 0.5) * 2.0 * np.pi
        
        # S-curve crease displacement
        d_theta = theta - crease_center_theta
        
        # Dimensions
        width = 0.68   # X radius
        front_depth = 0.44 # +Z radius
        back_depth = 0.48  # -Z radius
        
        cos_th = np.cos(theta)
        sin_th = np.sin(theta)
        
        if cos_th <= 0:
            # BACK of the bean: rounded convex dome
            # Natural back profile: rounded with gentle longitudinal ridge
            back_flatten = 1.0 - 0.08 * (sin_th**2)
            bx = sin_th * width * profile * back_flatten
            bz = cos_th * back_depth * profile
            
            # Subtle back asymmetry
            if bx > 0:
                bx *= 1.03
                
        else:
            # FRONT of the bean: two rounded fleshy lobes with deep central canyon cleft
            # Crease Gaussian well
            sigma = 0.42
            cleft_depth = 0.88 # plunges 88% into the front depth!
            cleft = np.exp(-(d_theta**2) / (2.0 * sigma**2))
            
            # Double-lobe cross section
            lobe_curve = (1.0 - cleft * cleft_depth)
            
            # Front lobes bulge slightly forward
            lobe_bulge = 1.0 + 0.18 * np.sin(np.pi * np.clip(abs(d_theta)/0.9, 0, 1))**2
            
            bx = sin_th * width * profile * (1.0 - 0.16 * cleft)
            bz = cos_th * front_depth * profile * lobe_curve * lobe_bulge
            
            # Chaff ridge inside the floor of the fissure
            chaff_sigma = 0.12
            chaff_ridge = 0.045 * np.exp(-(d_theta**2) / (2.0 * chaff_sigma**2)) * profile
            bz += chaff_ridge
            
            # Asymmetry between left and right lobes (real coffee beans are asymmetrical)
            if bx > 0:
                bx *= 1.06
                bz *= 1.03
                
        # Roasted skin micro-wrinkling (sub-percent organic displacement)
        # Wrinkles run somewhat transverse to the length
        micro_wrinkle = (
            np.sin(y * 24.0 + bx * 14.0) * 0.007 +
            np.sin(bx * 28.0 - bz * 18.0) * 0.005 +
            np.cos(y * 38.0 + bz * 22.0) * 0.004
        ) * profile
        
        bx += bx * micro_wrinkle
        bz += bz * micro_wrinkle
        
        vertices.append([bx, y, bz])
        # UV coordinates (match our 2048x2048 texture)
        # Flip V so 0 is bottom, 1 is top
        uvs.append([u_norm, 1.0 - v_norm])

vertices = np.array(vertices)
uvs = np.array(uvs)

print(f"Generated {len(vertices)} vertices")
print(f"X bounds: [{vertices[:,0].min():.3f}, {vertices[:,0].max():.3f}]")
print(f"Y bounds: [{vertices[:,1].min():.3f}, {vertices[:,1].max():.3f}]")
print(f"Z bounds: [{vertices[:,2].min():.3f}, {vertices[:,2].max():.3f}]")

# Write OBJ file
with open(output_obj, "w") as f:
    f.write("# Photorealistic 3D Coffee Bean Model\n")
    f.write("# Created for Arka Specialty Coffee\n")
    f.write("o CoffeeBean\n")
    
    for v in vertices:
        f.write(f"v {v[0]:.5f} {v[1]:.5f} {v[2]:.5f}\n")
        
    for uv in uvs:
        f.write(f"vt {uv[0]:.5f} {uv[1]:.5f}\n")
        
    # Faces (quads split to triangles)
    for iv in range(V_SEGS):
        for iu in range(U_SEGS):
            # 1-indexed vertex indices
            p1 = iv * (U_SEGS + 1) + iu + 1
            p2 = p1 + 1
            p3 = (iv + 1) * (U_SEGS + 1) + iu + 1
            p4 = p3 + 1
            
            # Triangle 1: p1, p3, p2
            f.write(f"f {p1}/{p1} {p3}/{p3} {p2}/{p2}\n")
            # Triangle 2: p2, p3, p4
            f.write(f"f {p2}/{p2} {p3}/{p3} {p4}/{p4}\n")

print(f"Saved 3D OBJ model to {output_obj}")

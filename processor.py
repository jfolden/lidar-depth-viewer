import numpy as np
import io
# from plyfile import PlyData

# def parse_ply(file_bytes):
#     # Wrap bytes in a file-like object for PlyData
#     with io.BytesIO(file_bytes) as f:
#         ply_data = PlyData.read(f)
    
#     # Access the 'vertex' element
#     # This handles both float32 and float64 automatically
#     vertex = ply_data['vertex']
    
#     x = np.array(vertex['x'])
#     y = np.array(vertex['y'])
#     z = np.array(vertex['z'])
    
#     # Check for color properties (red, green, blue or r, g, b)
#     colors = None
#     try:
#         r = np.array(vertex['red']) if 'red' in vertex else np.array(vertex['r'])
#         g = np.array(vertex['green']) if 'green' in vertex else np.array(vertex['g'])
#         b = np.array(vertex['blue']) if 'blue' in vertex else np.array(vertex['b'])
        
#         # Normalize 0-255 to 0.0-1.0
#         colors = np.vstack((r, g, b)).T / 255.0
#     except KeyError:
#         # No colors in file, use the colormap logic downstream
#         colors = None
        
#     return x, y, z, colors

def parse_csv(file_bytes):
    # Standard CSV: x,y,z or x,y,z,r,g,b
    decoded = file_bytes.tobytes().decode('utf-8')
    data = np.genfromtxt(io.StringIO(decoded), delimiter=',', skip_header=1)
    return data[:, 0], data[:, 1], data[:, 2], None

def process_lidar_data(file_bytes, filename, angle_deg=0, cmap_name="viridis"):
    print(f"Processing file: {filename} with angle {angle_deg}° and colormap '{cmap_name}'")
    ext = filename.split('.')[-1].lower()
    
    if hasattr(file_bytes, "to_bytes"):
        file_bytes = file_bytes.to_bytes()
    else:
        file_bytes = bytes(file_bytes)


    # 1. Extraction Phase
    if ext == 'npy':
        data = np.load(io.BytesIO(file_bytes))
        h, w = data.shape
        y, x = np.mgrid[0:h, 0:w]
        x_raw, y_raw, z_raw = x.flatten() / w, (h - y.flatten()) / h, data.flatten()
        colors_raw = None
    elif ext == 'csv':
        x_raw, y_raw, z_raw, colors_raw = parse_csv(file_bytes)
    # elif ext == 'ply':
    #     x_raw, y_raw, z_raw, colors_raw = parse_ply(file_bytes)
    else:
        # Fallback/Error handling for LAS/LAZ/PCD
        # These usually require specific C-extensions not always in Pyodide
        raise ValueError(f"Format {ext} not yet supported in browser runtime")

    # 2. Normalization & Rotation (Unified Pipeline)
    mask = np.isfinite(x_raw) & np.isfinite(y_raw) & np.isfinite(z_raw)
    x_raw, y_raw, z_raw = x_raw[mask], y_raw[mask], z_raw[mask]

    # --- NEW: CLAMP EXTREME VALUES ---
    # This prevents sums from hitting infinity during mean calculations
    z_raw = np.clip(z_raw, -1e10, 1e10) 
    x_raw = np.clip(x_raw, -1e10, 1e10)
    y_raw = np.clip(y_raw, -1e10, 1e10)

    if len(x_raw) == 0:
        raise ValueError("No valid points found in file.")

    # 1. Centering (Anchor the pivot to 0,0)
    x_centered = x_raw - np.nanmean(x_raw)
    y_centered = y_raw - np.nanmean(y_raw)
    z_centered = z_raw - np.nanmean(z_raw)

    # 2. Rotation (Apply while 0,0 is the center of the cloud)
    theta = np.radians(angle_deg)
    c, s = np.cos(theta), np.sin(theta)
    x_rot = x_centered * c - y_centered * s
    y_rot = x_centered * s + y_centered * c
    # Z remains unchanged during an Orbit-style rotation
    z_rot = z_centered 

    # 3. Global Scaling (Maintain aspect ratio)
    # Find the largest dimension across all axes to prevent stretching
    max_dim = max(
        x_rot.max() - x_rot.min(),
        y_rot.max() - y_rot.min(),
        z_rot.max() - z_rot.min()
    )
    scale = 1.0 / max_dim if max_dim > 1e-6 else 1.0

    # 4. Final Shift to [0, 1] range for Three.js
    # This maps the entire rotated cloud into a 1x1x1 cube
    x_norm = (x_rot - x_rot.min()) * scale
    y_norm = (y_rot - y_rot.min()) * scale
    z_norm = (z_rot - z_rot.min()) * scale

    # z_min, z_max = z_raw.min(), z_raw.max()
    # z_range = z_max - z_min

    # # --- NEW: ROBUST RANGE CHECK ---
    # if z_range < 1e-6:
    #     z_norm = np.zeros_like(z_raw)
    # else:
    #     z_norm = (z_raw - z_min) / z_range

    # # Sanity check: ensure final z_norm is clean
    # z_norm = np.nan_to_num(z_norm, nan=0.5, posinf=1.0, neginf=0.0)

    

    
    # 3. Coloring
    if colors_raw is None:
        colors = get_colormap(z_norm, cmap_name)
    else:
        colors = colors_raw # Use original file colors if available
    positions = np.vstack((x_rot, y_rot, 1.0 - z_norm)).T.astype(np.float32).flatten()
    colors = colors.astype(np.float32).flatten()

    # print(f"Python: Processing {filename}")
    # Since they are flattened, shape will be (N*3,)
    # print(f"Python: Position flat size: {positions.size}, Color flat size: {colors.size}")
    
    # Check bounds before returning (using the original unflattened logic if you need)
    # Or just check the flat array:
    if np.isnan(positions).any():
        print("CRITICAL: NaNs found in positions!")

    return {
        "positions": positions,
        "colors": colors
    }


def get_colormap(z_norm, cmap_name):
    cmap_name = cmap_name.lower()
    # print(f"Applying colormap: {cmap_name}")
    maps = {
        "viridis": [(0.26, 0.0, 0.33), (0.13, 0.56, 0.55), (0.99, 0.90, 0.14)],
        "plasma":  [(0.05, 0.03, 0.52), (0.75, 0.23, 0.51), (0.94, 0.94, 0.21)],
        "magma":   [(0.00, 0.00, 0.01), (0.72, 0.19, 0.50), (0.98, 0.92, 0.73)],
        "inferno": [(0.00, 0.00, 0.01), (0.73, 0.19, 0.20), (0.98, 0.90, 0.14)],
        "jet":     [(0,0,0.5), (0,0.5,1), (0,1,0), (1,0.5,0), (0.5,0,0)]
    }
    
    colors = maps.get(cmap_name, maps["viridis"])
    nodes = [np.array(c) for c in colors]
    res = np.zeros((len(z_norm), 3), dtype=np.float32)

    if cmap_name == "jet":
        # 4-segment interpolation
        q1 = z_norm < 0.25
        q2 = (z_norm >= 0.25) & (z_norm < 0.5)
        q3 = (z_norm >= 0.5) & (z_norm < 0.75)
        q4 = z_norm >= 0.75
        
        res[q1] = nodes[0] + (nodes[1] - nodes[0]) * (z_norm[q1][:, None] * 4)
        res[q2] = nodes[1] + (nodes[2] - nodes[1]) * ((z_norm[q2][:, None] - 0.25) * 4)
        res[q3] = nodes[2] + (nodes[3] - nodes[2]) * ((z_norm[q3][:, None] - 0.5) * 4)
        res[q4] = nodes[3] + (nodes[4] - nodes[3]) * ((z_norm[q4][:, None] - 0.75) * 4)
    else:
        # Standard 2-segment interpolation for viridis/plasma/etc
        mask = z_norm < 0.5
        res[mask] = nodes[0] + (nodes[1] - nodes[0]) * (z_norm[mask][:, None] * 2)
        res[~mask] = nodes[1] + (nodes[2] - nodes[1]) * ((z_norm[~mask][:, None] - 0.5) * 2)

    return res
import numpy as np
import io

def process_depth_to_xyz(file_bytes):
    data = io.BytesIO(file_bytes)
    depth_map = np.load(data)
    

    h, w = depth_map.shape
    y, x = np.mgrid[0:h, 0:w]
    
    # 1. Flip Y to fix "Upside Down"
    # Instead of y / h, we use (h - y) / h
    y_scaled = (h - y) / float(h) 
    x_scaled = x / float(w)
    
    # 2. Normalize Z
    z = depth_map.flatten()
    z_min, z_max = z.min(), z.max()
    z_scaled = (z - z_min) / (z_max - z_min + 1e-6)
    
    # 3. Flip Z to fix "Furthest is Closest"
    # In Three.js, smaller Z (or more negative) is further away.
    # We subtract it from 1.0 so that 1.0 (far) becomes 0.0, 
    # and 0.0 (near) becomes 1.0. 
    z_final = (1.0 - z_scaled) 

    # Center X and Y
    points = np.vstack((
        x_scaled.flatten() - 0.5, 
        y_scaled.flatten() - 0.5, 
        z_final
    )).T
    
    # Color map logic (using the scaled Z for brightness)
    colors = np.zeros((len(z), 3), dtype=np.float32)
    colors[:, 1] = z_scaled  # Green channel tied to depth
    colors[:, 2] = 1.0 - z_scaled # Blue channel inverse
    
    return {
        "positions": points.astype(np.float32).flatten(),
        "colors": colors.astype(np.float32).flatten()
    }

import numpy as np
import io

def process_depth_to_xyz(file_bytes):
    # Load from bytes
    data = io.BytesIO(file_bytes)
    depth_map = np.load(data)
    
    # --- YOUR SPAD SIMULATION LOGIC HERE ---
    # Example: Create grid and project depth to XYZ
    h, w = depth_map.shape
    y, x = np.mgrid[0:h, 0:w]
    
    # Flatten and stack
    points = np.vstack((x.flatten(), y.flatten(), depth_map.flatten())).T
    
    # return as flat float32 for the browser
    return points.astype(np.float32).flatten()
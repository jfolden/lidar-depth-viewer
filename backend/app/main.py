from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/pointcloud')
def get_pointcloud():
    num_points = 2000

    points = np.random.uniform(0, 1, (num_points, 3))

    return {
        'points': points.tolist()
    }
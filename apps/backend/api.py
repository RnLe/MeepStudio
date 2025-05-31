from fastapi import FastAPI
import meep as mp

mp.air

# ────────────────────────────────── SOURCES ───────────────────────────────────

# Define sources (3 total)
sources = []

# Source 1: ContinuousSource (ID: egaC-V-S1QJf6aW4cOJIH)
sources.append(mp.Source(
    src=mp.ContinuousSource(frequency=2.8080000000000003),
    component=mp.Ex,
    center=mp.Vector3(2.951332560834299, 4, 0)
))

# Source 2: EigenModeSource (ID: RGcp-5f2zMbXsA9hoBSEI)
sources.append(mp.EigenModeSource(
    src=mp.GaussianSource(frequency=1, width=1),
    center=mp.Vector3(2, 2, 0),
    eig_resolution=8
))

# Source 3: GaussianSource (ID: JBTRDgvxWjVX_Rdy5w718)
sources.append(mp.Source(
    src=mp.GaussianSource(frequency=1, width=1),
    component=mp.Ez,
    center=mp.Vector3(2, 4, 0)
))

# ───────────────────────────────── BOUNDARIES ─────────────────────────────────

# Define boundary conditions

# PML (Perfectly Matched Layer) boundaries
pml_layers = []

# PML for top and bottom boundaries
pml_layers.append(mp.PML(
    thickness=1.2000000000000002,
    direction=mp.Y,
    R_asymptotic=6.309573444801917e-16
))

# PML for left boundary
pml_layers.append(mp.PML(
    thickness=0.7000000000000001,
    direction=mp.X,
    side=mp.Low,
    R_asymptotic=1.584893192461111e-15
))

app = FastAPI()

@app.get("/")
def hello_world():
    return {"message": "Hello, world!"}
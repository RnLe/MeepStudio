from fastapi import FastAPI
import meep as mp

mp.air

app = FastAPI()

@app.get("/")
def hello_world():
    return {"message": "Hello, world!"}
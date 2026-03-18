"""FastAPI backend for JEPA benchmark training.
Run with: uvicorn server:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import asyncio, json, time
from pathlib import Path
from typing import AsyncGenerator
import numpy as np

class _NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.bool_): return bool(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return super().default(obj)

def _safe_json(data):
    return json.loads(json.dumps(data, cls=_NumpyEncoder))

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# In-memory results store
results_store: dict = {}
training_status: dict = {m: "idle" for m in ["ijepa", "mae", "dino", "simclr"]}

@app.get("/api/methods")
def get_methods():
    return {
        "methods": [
            {"id": "ijepa",   "name": "I-JEPA",  "type": "Prédictif latent",  "color": "#8b5cf6", "status": training_status["ijepa"]},
            {"id": "mae",     "name": "MAE",     "type": "Génératif pixels",  "color": "#3b82f6", "status": training_status["mae"]},
            {"id": "dino",    "name": "DINO",    "type": "Distillation",      "color": "#22c55e", "status": training_status["dino"]},
            {"id": "simclr",  "name": "SimCLR",  "type": "Contrastif",        "color": "#ef4444", "status": training_status["simclr"]},
        ]
    }

@app.post("/api/train/{method_id}")
async def train_method(method_id: str):
    if method_id not in training_status:
        return {"error": "unknown method"}
    training_status[method_id] = "running"
    # Launch training in background thread
    import threading
    from train import run_training
    def _train():
        run_training(method_id, results_store)
        training_status[method_id] = "done"
    t = threading.Thread(target=_train, daemon=True)
    t.start()
    return {"started": True}

@app.get("/api/stream/{method_id}")
async def stream_progress(method_id: str):
    async def event_gen() -> AsyncGenerator[str, None]:
        last_step = -1
        for _ in range(600):  # max 60s
            await asyncio.sleep(0.1)
            data = results_store.get(method_id, {})
            steps = data.get("steps", [])
            if len(steps) > last_step + 1:
                for i in range(last_step + 1, len(steps)):
                    yield f"data: {json.dumps(steps[i])}\n\n"
                last_step = len(steps) - 1
            if training_status.get(method_id) == "done" and last_step >= len(steps) - 1:
                yield f"data: {json.dumps({'done': True})}\n\n"
                break
    return StreamingResponse(event_gen(), media_type="text/event-stream")

@app.get("/api/results")
def get_results():
    return JSONResponse(_safe_json(results_store))

@app.get("/api/features/{method_id}")
def get_features(method_id: str):
    data = results_store.get(method_id, {})
    return JSONResponse(_safe_json({"features": data.get("features", [])}))

@app.get("/api/visuals/{method_id}")
def get_visuals(method_id: str):
    data = results_store.get(method_id, {})
    return JSONResponse(_safe_json({"visuals": data.get("visuals", [])}))

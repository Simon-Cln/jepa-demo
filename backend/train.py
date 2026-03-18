"""Training scripts for JEPA benchmark comparison.
Linear probe on CIFAR-10 using frozen ViT-B/16 encoders.
Uses torchvision (no transformers required), with optional HF fallback.
"""
import torch, torchvision, time, threading
import torch.nn as nn
import numpy as np
import io, base64
from torchvision import transforms
from torchvision.models import vit_b_16, ViT_B_16_Weights
from torch.utils.data import DataLoader, Subset, TensorDataset
from PIL import Image as PILImage

DEVICE     = "cuda" if torch.cuda.is_available() else "cpu"
N_EPOCHS   = 15
BATCH_SIZE = 128
LR         = 1e-3
TRAIN_SIZE = 5000
TEST_SIZE  = 1000

_download_lock = threading.Lock()

# ── Dataset ────────────────────────────────────────────────────────────────────
def get_cifar10(train: bool):
    tf = transforms.Compose([
        transforms.Resize(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    # Lock ensures only one thread downloads at a time
    with _download_lock:
        return torchvision.datasets.CIFAR10(root="./data", train=train, download=True, transform=tf)


# ── Encoders ───────────────────────────────────────────────────────────────────
def _vit_torchvision() -> nn.Module:
    """ViT-B/16 from torchvision — always available."""
    model = vit_b_16(weights=ViT_B_16_Weights.IMAGENET1K_V1)
    # Replace classifier with identity so forward() returns 768-d CLS features
    model.heads = nn.Identity()
    model.eval()
    return model


def _vit_huggingface(hf_id: str) -> nn.Module:
    """Try loading from HuggingFace. Returns None if unavailable."""
    try:
        # Works with transformers >= 4.0
        import importlib
        tf_mod = importlib.import_module("transformers")
        AutoModel = getattr(tf_mod, "AutoModel", None)
        if AutoModel is None:
            return None
        model = AutoModel.from_pretrained(hf_id)
        model.eval()
        return model
    except Exception:
        return None


class TorchvisionWrapper(nn.Module):
    """Wraps torchvision ViT so extract_features() can call it uniformly."""
    def __init__(self, base: nn.Module):
        super().__init__()
        self.base = base

    def forward(self, pixel_values: torch.Tensor):
        return self.base(pixel_values)  # returns (B, 768) directly


class HFWrapper(nn.Module):
    """Wraps HuggingFace model — extracts CLS token."""
    def __init__(self, base):
        super().__init__()
        self.base = base

    def forward(self, pixel_values: torch.Tensor):
        out = self.base(pixel_values=pixel_values)
        return out.last_hidden_state[:, 0]


def load_encoder(method_id: str) -> tuple[nn.Module, int]:
    """
    Load a frozen ViT encoder. Strategy per method:
      ijepa  — torchvision ViT-B/16 (ImageNet1K, proxy for I-JEPA architecture)
      mae    — HuggingFace facebook/vit-mae-base  → fallback torchvision
      dino   — HuggingFace facebook/dino-vitb16   → fallback torchvision
      simclr — HuggingFace google/vit-base-patch16-224 → fallback torchvision
    """
    HF_IDS = {
        "mae":    "facebook/vit-mae-base",
        "dino":   "facebook/dino-vitb16",
        "simclr": "google/vit-base-patch16-224",
    }

    if method_id == "ijepa":
        print(f"[{method_id}] Using torchvision ViT-B/16 (ImageNet1K proxy)")
        return TorchvisionWrapper(_vit_torchvision()), 768

    hf_id = HF_IDS[method_id]
    hf_model = _vit_huggingface(hf_id)
    if hf_model is not None:
        print(f"[{method_id}] Using HuggingFace {hf_id}")
        return HFWrapper(hf_model), 768

    # Fallback
    print(f"[{method_id}] HuggingFace unavailable → torchvision ViT-B/16 fallback")
    return TorchvisionWrapper(_vit_torchvision()), 768


# ── Feature extraction ─────────────────────────────────────────────────────────
def extract_features(encoder: nn.Module, loader: DataLoader) -> tuple[torch.Tensor, torch.Tensor]:
    feats, labels = [], []
    encoder.to(DEVICE)
    with torch.no_grad():
        for imgs, lbls in loader:
            f = encoder(imgs.to(DEVICE)).cpu()
            feats.append(f)
            labels.append(lbls)
    return torch.cat(feats), torch.cat(labels)


def tensor_to_b64(t: torch.Tensor) -> str:
    """Convert CHW float tensor (normalized) to base64 PNG."""
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3,1,1)
    std  = torch.tensor([0.229, 0.224, 0.225]).view(3,1,1)
    img  = (t.cpu() * std + mean).clamp(0, 1)
    arr  = (img.permute(1, 2, 0).numpy() * 255).astype(np.uint8)
    # Resize to 96x96 for display
    pil  = PILImage.fromarray(arr).resize((96, 96), PILImage.NEAREST)
    buf  = io.BytesIO()
    pil.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()


def heatmap_to_b64(attn: np.ndarray, size: int = 96) -> str:
    """Convert 2D attention map (float 0-1) to base64 heatmap PNG."""
    # Normalize
    a = (attn - attn.min()) / (attn.max() - attn.min() + 1e-8)
    # Colormap: dark blue → cyan → yellow → red
    r = np.clip(2 * a - 0.5, 0, 1)
    g = np.clip(1 - 2 * abs(a - 0.5), 0, 1)
    b = np.clip(0.5 - 2 * a, 0, 1)
    rgb = np.stack([r, g, b], axis=-1)
    arr = (rgb * 255).astype(np.uint8)
    pil = PILImage.fromarray(arr).resize((size, size), PILImage.NEAREST)
    buf = io.BytesIO()
    pil.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()


CIFAR10_CLASSES = ['airplane','automobile','bird','cat','deer','dog','frog','horse','ship','truck']

def compute_sample_visuals(encoder, method_id: str, test_ds, probe: torch.nn.Linear, feat_dim: int, n_samples: int = 8):
    """
    For n_samples test images, compute:
    - original image (base64)
    - attention map from last ViT layer (base64 heatmap)
    - top-3 predictions with confidence
    Returns list of dicts.
    """
    results = []
    indices = [i * (len(test_ds) // n_samples) for i in range(n_samples)]

    for idx in indices:
        img_tensor, label = test_ds[idx]
        img224 = torch.nn.functional.interpolate(
            img_tensor.unsqueeze(0), size=224, mode='bilinear', align_corners=False
        ).to(DEVICE)

        # Collect attention from last layer
        attn_store = []

        def _hook(mod, inp, out):
            # HuggingFace attention: out[1] is weights if output_attentions, or we grab from out[0]
            if isinstance(out, tuple) and len(out) > 1 and out[1] is not None:
                attn_store.append(out[1].detach().cpu())

        # Register hooks on last attention layer
        handles = []
        try:
            if method_id == "ijepa":
                # torchvision ViT: encoder.base.encoder.layers[-1].self_attention
                sa = encoder.base.encoder.layers[-1].self_attention
                handles.append(sa.register_forward_hook(_hook))
            else:
                # HuggingFace: encoder.base.encoder.layer[-1].attention.attention
                attn_module = encoder.base.encoder.layer[-1].attention.attention
                handles.append(attn_module.register_forward_hook(_hook))
        except Exception:
            pass

        with torch.no_grad():
            # For HuggingFace models, pass output_attentions
            if method_id != "ijepa":
                try:
                    out = encoder.base(pixel_values=img224, output_attentions=True)
                    if out.attentions:
                        last_attn = out.attentions[-1].cpu()  # (1, heads, seq, seq)
                        attn_store = [last_attn]
                except Exception:
                    feat = encoder(img224)
            else:
                feat = encoder(img224)

        for h in handles:
            h.remove()

        # Build attention map
        attn_map_b64 = None
        if attn_store:
            attn = attn_store[0][0]  # (heads, seq, seq)
            attn_mean = attn.mean(0)  # (seq, seq)
            cls_to_patches = attn_mean[0, 1:].numpy()  # (196,) for 14x14 patches
            n = int(len(cls_to_patches) ** 0.5)
            if n * n == len(cls_to_patches):
                attn_grid = cls_to_patches.reshape(n, n)
                attn_map_b64 = heatmap_to_b64(attn_grid, size=96)

        # Get feature for prediction
        with torch.no_grad():
            feat = encoder(img224)
            logits = probe(feat.to(DEVICE))
            probs  = torch.softmax(logits, dim=-1)[0].cpu().numpy()

        top3 = probs.argsort()[::-1][:3]
        predictions = [
            {"class": CIFAR10_CLASSES[i], "confidence": round(float(probs[i]) * 100, 1)}
            for i in top3
        ]

        results.append({
            "image_b64":     tensor_to_b64(img_tensor),
            "attention_b64": attn_map_b64,
            "true_label":    CIFAR10_CLASSES[int(label)],
            "predictions":   predictions,
            "correct":       bool(top3[0] == label),
        })

    return results


# ── Main training ──────────────────────────────────────────────────────────────
def run_training(method_id: str, store: dict) -> None:
    store[method_id] = {"steps": [], "features": []}
    steps = store[method_id]["steps"]

    def log(d: dict):
        steps.append(d)

    try:
        log({"epoch": 0, "phase": "load", "msg": f"Chargement encodeur {method_id}…", "loss": None, "acc": None})
        encoder, feat_dim = load_encoder(method_id)

        log({"epoch": 0, "phase": "load", "msg": "Chargement CIFAR-10…", "loss": None, "acc": None})
        print(f"[{method_id}] Loading CIFAR-10…")
        train_ds = get_cifar10(train=True)
        test_ds  = get_cifar10(train=False)

        train_loader = DataLoader(Subset(train_ds, range(TRAIN_SIZE)), batch_size=BATCH_SIZE, num_workers=0)
        test_loader  = DataLoader(Subset(test_ds,  range(TEST_SIZE)),  batch_size=BATCH_SIZE, num_workers=0)

        log({"epoch": 0, "phase": "extract", "msg": "Extraction features (encodeur gelé)…", "loss": None, "acc": None})
        print(f"[{method_id}] Extracting features…")
        train_feats, train_labels = extract_features(encoder, train_loader)
        test_feats,  test_labels  = extract_features(encoder, test_loader)
        log({"epoch": 0, "phase": "extract", "msg": f"Features extraits — dim {feat_dim}", "loss": None, "acc": None})

        # ── Linear probe ───────────────────────────────────────────────────────
        probe     = nn.Linear(feat_dim, 10).to(DEVICE)
        optimizer = torch.optim.Adam(probe.parameters(), lr=LR, weight_decay=1e-4)
        criterion = nn.CrossEntropyLoss()

        trn = DataLoader(TensorDataset(train_feats, train_labels), batch_size=256, shuffle=True)
        tst = DataLoader(TensorDataset(test_feats,  test_labels),  batch_size=256)

        print(f"[{method_id}] Training linear probe ({N_EPOCHS} epochs)…")
        for epoch in range(N_EPOCHS):
            probe.train()
            total_loss, correct, total = 0.0, 0, 0
            for xb, yb in trn:
                xb, yb = xb.to(DEVICE), yb.to(DEVICE)
                optimizer.zero_grad()
                loss = criterion(probe(xb), yb)
                loss.backward()
                optimizer.step()
                total_loss += loss.item() * len(xb)
                correct    += (probe(xb).argmax(1) == yb).sum().item()
                total      += len(xb)

            train_acc  = correct / total
            train_loss = total_loss / total

            probe.eval()
            ec, et = 0, 0
            with torch.no_grad():
                for xb, yb in tst:
                    xb, yb = xb.to(DEVICE), yb.to(DEVICE)
                    ec += (probe(xb).argmax(1) == yb).sum().item()
                    et += len(yb)
            test_acc = ec / et

            log({
                "epoch":        epoch + 1,
                "total_epochs": N_EPOCHS,
                "train_loss":   round(train_loss, 4),
                "train_acc":    round(train_acc  * 100, 2),
                "test_acc":     round(test_acc   * 100, 2),
                "phase":        "train",
            })
            print(f"[{method_id}] {epoch+1}/{N_EPOCHS}  loss={train_loss:.4f}  train={train_acc*100:.1f}%  test={test_acc*100:.1f}%")
            time.sleep(0.03)

        # ── PCA 2D feature viz ─────────────────────────────────────────────────
        idxs   = torch.randperm(len(test_feats))[:120]
        raw    = test_feats[idxs].numpy().astype(np.float32)
        lbls   = test_labels[idxs].numpy()
        raw   -= raw.mean(0)
        U, S, _ = np.linalg.svd(raw, full_matrices=False)
        coords  = U[:, :2] * S[:2]
        for i in range(2):
            mn, mx = coords[:, i].min(), coords[:, i].max()
            coords[:, i] = 2 * (coords[:, i] - mn) / (mx - mn + 1e-8) - 1

        store[method_id]["features"] = [
            {"x": float(coords[j, 0]), "y": float(coords[j, 1]), "label": int(lbls[j])}
            for j in range(len(coords))
        ]
        # -- Sample visuals (attention maps + predictions) --
        log({"epoch": 0, "phase": "visual", "msg": "Génération des visualisations...", "loss": None, "acc": None})
        print(f"[{method_id}] Computing sample visuals...")
        try:
            raw_test_ds = torchvision.datasets.CIFAR10(
                root="./data", train=False, download=False,
                transform=transforms.Compose([
                    transforms.ToTensor(),
                    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
                ])
            )
            visuals = compute_sample_visuals(encoder, method_id, raw_test_ds, probe, feat_dim)
            store[method_id]["visuals"] = visuals
            print(f"[{method_id}] Visuals done — {len(visuals)} samples")
        except Exception as ve:
            print(f"[{method_id}] Visuals error (non-fatal): {ve}")
            store[method_id]["visuals"] = []

        print(f"[{method_id}] Done!")

    except Exception as e:
        import traceback
        print(f"[{method_id}] ERROR: {e}")
        traceback.print_exc()
        log({"epoch": -1, "phase": "error", "msg": str(e), "loss": None, "acc": None})

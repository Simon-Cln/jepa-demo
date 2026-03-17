# Vue d'ensemble — JEPA

> **Joint Embedding Predictive Architecture** · Yann LeCun · Meta AI · 2022

## Idée centrale

Plutôt que prédire des **données brutes** (pixels, tokens), JEPA prédit dans un **espace de représentations abstraites**. C'est la distinction fondamentale avec les LLMs et les modèles génératifs.

---

## Architecture générale

```mermaid
flowchart LR
    X["🖼 Image\n(patches visibles)"] --> CE["Context\nEncoder"]
    CE --> ZC["z_context"]
    ZC --> P["Predictor"]
    PM["📍 Positions\nmasquées"] --> P
    P --> ZH["ẑ_target\n(prédiction)"]

    XT["🖼 Image\ncomplète"] --> TE["Target Encoder\n(EMA)"]
    TE --> ZT["z_target\n(cible)"]

    ZH -.->|"Loss ‖ẑ − z‖²"| ZT

    style CE fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style TE fill:#14532d,stroke:#22c55e,color:#fff
    style P  fill:#581c87,stroke:#8b5cf6,color:#fff
    style ZH fill:#7c2d12,stroke:#ef4444,color:#fff
    style ZT fill:#14532d,stroke:#22c55e,color:#fff
    style ZC fill:#1e3a5f,stroke:#3b82f6,color:#fff
```

---

## JEPA vs Génératif

| | Génératif (VAE/Diffusion) | **JEPA** |
|---|---|---|
| **Prédit** | Pixels bruts | Représentations |
| **Coût** | O(H×W) | O(1) |
| **Collapse** | Non | Stop-gradient / EMA |
| **Sémantique** | Implicite | Explicite |
| **IA autonome ?** | Non | Objectif principal |

---

## Famille JEPA

- **I-JEPA** (2023) — Images
- **V-JEPA** (2024) — Vidéos
- **MC-JEPA** (2023) — Mouvement + Contenu

# V-JEPA — Video JEPA

> Bardes, Garrido, Ponce et al. — **NeurIPS 2024** · Meta AI

## Extension vidéo

V-JEPA étend I-JEPA à la **vidéo** : prédit des représentations spatio-temporelles de clips masqués.

---

## Masquage spatio-temporel

```mermaid
flowchart LR
    V["🎬 Clip vidéo\n(T frames)"] --> MASK["Masquage\nspatio-temporel"]
    MASK --> VIS["Patches\nvisibles (~10%)"]
    MASK --> MSK["Patches\nmasqués (~90%)"]

    VIS --> CE["Context\nEncoder (ViT)"]
    CE --> ZC["z_context"]
    ZC --> P["Predictor"]
    MSK --> |positions| P
    P --> ZH["ẑ_target"]

    V --> TE["Target Encoder\n(EMA)"]
    TE --> ZT["z_target"]

    ZH -.->|Loss| ZT

    style CE fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style TE fill:#14532d,stroke:#22c55e,color:#fff
    style P  fill:#581c87,stroke:#8b5cf6,color:#fff
```

---

## Résultats remarquables

- **90% de masquage** (vs 75% pour I-JEPA)
- Transfert **zero-shot** fort sur action recognition
- Surpasse les méthodes supervisées sur Something-Something v2
- Représentations robustes aux changements de caméra

---

## Différence I-JEPA vs V-JEPA

| | I-JEPA | V-JEPA |
|---|---|---|
| **Input** | Images 2D | Vidéos 3D |
| **Masquage** | 75% patches | 90% spatio-temporel |
| **Cible** | Représentation image | Représentation vidéo |
| **Use case** | Vision statique | Compréhension temporelle |

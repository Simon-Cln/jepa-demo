# I-JEPA — Image JEPA

> Assran, Duval, Misra et al. — **CVPR 2023** · Meta AI

## Principe

I-JEPA masque des blocs d'image et prédit les **représentations latentes** des zones masquées à partir du contexte visible.

---

## Pipeline d'entraînement

```mermaid
sequenceDiagram
    participant I  as 🖼 Image
    participant CE as Context Encoder (ViT)
    participant P  as Predictor
    participant TE as Target Encoder (EMA)

    I->>CE: patches visibles (~25%)
    CE->>P: z_context
    Note over P: + positions masquées
    P-->>P: Prédiction ẑ_target

    I->>TE: image complète (100%)
    TE-->>TE: z_target (cible stable)

    Note over P,TE: Loss = ‖ẑ_target − z_target‖²
    Note over TE: Mis à jour par EMA uniquement
```

---

## Stop-Gradient & EMA

Le Target Encoder est mis à jour par **EMA** uniquement, jamais par rétropropagation directe. Cela évite le *representation collapse*.

```
θ_target ← τ · θ_target + (1 − τ) · θ_context
τ = 0.996
```

---

## Résultats clés

- **75% de masquage** → performance optimale (vs ~15% pour MAE)
- Surpasse MAE, SimCLR, DINO sur ImageNet (évaluation linéaire)
- Représentations sémantiques **sans supervision explicite**
- Transfert fort sur ADE20k (segmentation), iNaturalist (fine-grained)

---

## Notes personnelles

_À compléter…_

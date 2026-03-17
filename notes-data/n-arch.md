# Architecture — World Model

> Inspiré de LeCun 2022 · Ha & Schmidhuber 2018

## Vision de LeCun

Un agent autonome doit maintenir un **modèle interne du monde** pour simuler les conséquences de ses actions *avant* de les exécuter.

---

## Architecture complète

```mermaid
flowchart TD
    OBS["👁 Observation\nbrute s_t"] --> ENC["Encodeur\nde Perception"]
    ENC --> ZS["z_s (état latent)"]

    ZS --> WM["🧠 World Model\n(JEPA-based)"]
    ACT["⚡ Action a_t"] --> WM
    WM --> ZSP["ẑ_s+1\n(état prédit)"]

    ZSP --> ROLL["Rollout\nN étapes"]
    ROLL --> EVAL["Évaluation\n(Critic)"]
    EVAL --> OPT["Optimiseur\n(planification)"]
    OPT --> ACT

    ZSP --> |"meilleure\ntrajectoire"| EXEC["✅ Exécution"]

    style WM   fill:#1925aa,stroke:#4a5fff,color:#fff
    style OPT  fill:#581c87,stroke:#8b5cf6,color:#fff
    style EXEC fill:#14532d,stroke:#22c55e,color:#fff
    style ENC  fill:#1e3a5f,stroke:#3b82f6,color:#fff
```

---

## Composants clés

1. **Encodeur de perception** — encode l'observation brute → représentation latente `z_s`
2. **World Model** — prédit `z_{s+1}` étant donné `z_s` et une action `a`
3. **Critic** — évalue la valeur d'un état latent
4. **Acteur** — planifie en cherchant la meilleure séquence d'actions

---

## Différence avec le RL classique

```mermaid
graph LR
    subgraph "RL classique"
        A1["Agit"] --> E1["Observe résultat"]
        E1 --> L1["Apprend par essai/erreur"]
    end
    subgraph "World Model"
        A2["Imagine des actions"] --> S2["Simule mentalement"]
        S2 --> P2["Planifie la meilleure"]
        P2 --> A3["Agit"]
    end
```

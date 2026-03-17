export type ConceptCategory =
  | "animal"
  | "vehicle"
  | "building"
  | "nature"
  | "food"
  | "tool";

export interface Concept {
  id: string;
  label: string;
  emoji: string;
  category: ConceptCategory;
  // Pixel space coords (spread out, no semantic structure)
  pixelX: number;
  pixelY: number;
  // Latent space coords (clustered by category)
  latentX: number;
  latentY: number;
}

const CATEGORY_CENTERS: Record<ConceptCategory, [number, number]> = {
  animal:   [0.18, 0.25],
  vehicle:  [0.78, 0.22],
  building: [0.75, 0.72],
  nature:   [0.22, 0.70],
  food:     [0.50, 0.50],
  tool:     [0.48, 0.18],
};

function jitter(center: number, spread: number, seed: number): number {
  return Math.max(0.05, Math.min(0.95, center + (Math.sin(seed * 127.1) * 2 - 1) * spread));
}

const RAW_CONCEPTS: Omit<Concept, "pixelX" | "pixelY" | "latentX" | "latentY">[] = [
  // Animals
  { id: "cat",   label: "Chat",    emoji: "🐱", category: "animal" },
  { id: "dog",   label: "Chien",   emoji: "🐶", category: "animal" },
  { id: "bird",  label: "Oiseau",  emoji: "🐦", category: "animal" },
  { id: "fish",  label: "Poisson", emoji: "🐟", category: "animal" },
  { id: "horse", label: "Cheval",  emoji: "🐴", category: "animal" },
  // Vehicles
  { id: "car",   label: "Voiture", emoji: "🚗", category: "vehicle" },
  { id: "bike",  label: "Vélo",    emoji: "🚲", category: "vehicle" },
  { id: "plane", label: "Avion",   emoji: "✈️", category: "vehicle" },
  { id: "boat",  label: "Bateau",  emoji: "⛵", category: "vehicle" },
  { id: "train", label: "Train",   emoji: "🚂", category: "vehicle" },
  // Buildings
  { id: "house",  label: "Maison",  emoji: "🏠", category: "building" },
  { id: "castle", label: "Château", emoji: "🏰", category: "building" },
  { id: "office", label: "Bureau",  emoji: "🏢", category: "building" },
  { id: "school", label: "École",   emoji: "🏫", category: "building" },
  // Nature
  { id: "tree",    label: "Arbre",   emoji: "🌳", category: "nature" },
  { id: "flower",  label: "Fleur",   emoji: "🌸", category: "nature" },
  { id: "mountain",label: "Montagne",emoji: "⛰️", category: "nature" },
  { id: "ocean",   label: "Océan",   emoji: "🌊", category: "nature" },
  // Food
  { id: "apple",  label: "Pomme",   emoji: "🍎", category: "food" },
  { id: "bread",  label: "Pain",    emoji: "🍞", category: "food" },
  { id: "pizza",  label: "Pizza",   emoji: "🍕", category: "food" },
  { id: "cake",   label: "Gâteau",  emoji: "🎂", category: "food" },
  // Tools
  { id: "hammer",  label: "Marteau", emoji: "🔨", category: "tool" },
  { id: "key",     label: "Clé",     emoji: "🔑", category: "tool" },
  { id: "phone",   label: "Téléphone",emoji: "📱", category: "tool" },
  { id: "laptop",  label: "Laptop",  emoji: "💻", category: "tool" },
];

// Deterministic pseudo-random pixel positions (no semantic structure)
function pixelPos(id: string, idx: number): [number, number] {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1) + idx;
  return [
    0.05 + ((seed * 137.508) % 1) * 0.9,
    0.05 + ((seed * 251.309) % 1) * 0.9,
  ];
}

export const CONCEPTS: Concept[] = RAW_CONCEPTS.map((c, idx) => {
  const [cx, cy] = CATEGORY_CENTERS[c.category];
  const [px, py] = pixelPos(c.id, idx);
  const seed = idx + c.id.charCodeAt(0) * 0.01;
  return {
    ...c,
    pixelX: px,
    pixelY: py,
    latentX: jitter(cx, 0.1, seed),
    latentY: jitter(cy, 0.1, seed + 0.5),
  };
});

export const CATEGORY_COLORS: Record<ConceptCategory, string> = {
  animal:   "#f97316",
  vehicle:  "#3b82f6",
  building: "#6b7280",
  nature:   "#22c55e",
  food:     "#ec4899",
  tool:     "#a78bfa",
};

export const CATEGORY_LABELS: Record<ConceptCategory, string> = {
  animal:   "Animaux",
  vehicle:  "Véhicules",
  building: "Bâtiments",
  nature:   "Nature",
  food:     "Nourriture",
  tool:     "Outils",
};

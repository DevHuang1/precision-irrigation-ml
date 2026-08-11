export const GROWTH_STAGES = [
  "establishment",
  "vegetative",
  "flowering",
  "maturity",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  establishment: "Just planted",
  vegetative: "Growing",
  flowering: "Flowering",
  maturity: "Fruiting / maturity",
};

export const STAGE_TIPS: Record<string, string> = {
  establishment:
    "Sow-in stage: keep the topsoil moist with light, frequent water.",
  vegetative: "Growing stage: steady water helps leaves and roots develop.",
  flowering: "Flowering stage: avoid stress now — it sets your yield.",
  maturity: "Fruiting stage: ease off slightly, but do not let soil dry out.",
};

export const SOIL_TYPES = ["sandy", "loamy", "clay"] as const;

export const SOIL_LABELS: Record<string, string> = {
  sandy: "Sandy — drains fast",
  loamy: "Loamy — balanced",
  clay: "Clay — holds water well",
};

export const SOIL_FACTORS: Record<string, number> = {
  sandy: 0.7,
  loamy: 1.0,
  clay: 1.3,
};

export const TARGET_MOISTURE: Record<string, number> = {
  establishment: 65,
  vegetative: 60,
  flowering: 62,
  maturity: 55,
};

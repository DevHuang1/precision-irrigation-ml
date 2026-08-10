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

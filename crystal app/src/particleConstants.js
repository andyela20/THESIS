// ============================================================
//  particleConstants.js
//  Single source of truth for all urinary particle types
//  Used across: Analysis, Export, Results, Upload, Library
// ============================================================

export const PARTICLE_TYPES = [
  // Cells
  { key: 'rbc',            label: 'RBC',                    group: 'Cells',          color: '#E24B4A', risk: 'High'     },
  { key: 'wbc',            label: 'WBC',                    group: 'Cells',          color: '#F5A623', risk: 'Moderate' },
  { key: 'epithelial',     label: 'Epithelial Cells',       group: 'Cells',          color: '#4A90D9', risk: 'Low'      },
  // Casts
  { key: 'cast',           label: 'Cast',                   group: 'Casts',          color: '#7B5EA7', risk: 'Moderate' },
  // Misc
  { key: 'misc',           label: 'Misc',                   group: 'Misc',           color: '#A0845C', risk: 'Low'      },
  // Microorganisms
  { key: 'microorganisms', label: 'Microorganisms',         group: 'Microorganisms', color: '#D4A017', risk: 'High'     },
  // Lipids
  { key: 'lipids',         label: 'Lipids',                 group: 'Lipids',         color: '#F0C040', risk: 'Moderate' },
  // Crystals — detected by RF-DETR
  { key: 'caox_di',        label: 'CaOx Dihydrate',         group: 'Crystals',       color: '#E8735A', risk: 'High'     },
  { key: 'caox_mono',      label: 'CaOx Monohydrate Ovoid', group: 'Crystals',       color: '#C0392B', risk: 'High'     },
  { key: 'ammonium',       label: 'Ammonium Biurate',       group: 'Crystals',       color: '#8E44AD', risk: 'Moderate' },
  { key: 'uric',           label: 'Uric Acid',              group: 'Crystals',       color: '#1FB505', risk: 'High'     },
  { key: 'triple',         label: 'Triple Phosphate',       group: 'Crystals',       color: '#6D9922', risk: 'Moderate' },
];

// label → color  (for quick lookup by detection result label)
export const PARTICLE_COLORS = Object.fromEntries(
  PARTICLE_TYPES.map(p => [p.label, p.color])
);

// label → default risk
export const PARTICLE_DEFAULT_RISK = Object.fromEntries(
  PARTICLE_TYPES.map(p => [p.label, p.risk])
);

// key → label  (for normalizing backend data that uses short keys)
export const KEY_TO_LABEL = Object.fromEntries(
  PARTICLE_TYPES.map(p => [p.key, p.label])
);

// Group names (for filter pills)
export const PARTICLE_GROUPS = [
  'All',
  ...Array.from(new Set(PARTICLE_TYPES.map(p => p.group))),
];

// All labels including 'All' (for library filter)
export const PARTICLE_LABELS = ['All', ...PARTICLE_TYPES.map(p => p.label)];

// ⚠️ FIXED: Must exactly match PARTICLE_TYPES labels above
export const RFDETR_CLASSES = new Set([
  'CaOx Dihydrate',
  'CaOx Monohydrate Ovoid',  // was 'CaOx Monohydrate' — fixed to match label
  'Ammonium Biurate',
  'Uric Acid',
  'Triple Phosphate',
]);

// Which classes come from YOLOv8
export const YOLO_CLASSES = new Set([
  'RBC',
  'WBC',
  'Epithelial Cells',
  'Cast',
  'Misc',
  'Microorganisms',
  'Lipids',
]);

// Risk badge styles (shared UI)
export const RISK_STYLE = {
  High:     { background: '#FFF0ED', color: '#A32D2D' },
  Moderate: { background: '#FFF8ED', color: '#C07320' },
  Low:      { background: '#E8F5E8', color: '#1F5330' },
};

// ============================================================
//  normalizeLabel()
//  Call this when reading data from the backend to ensure
//  whatever the backend saves (key, old label, or new label)
//  gets mapped to the correct current label.
// ============================================================
export const normalizeLabel = (raw) => {
  if (!raw) return '';

  // Already a valid label → return as-is
  if (PARTICLE_COLORS[raw]) return raw;

  // It's a short key (e.g. 'caox_mono') → map to label
  if (KEY_TO_LABEL[raw]) return KEY_TO_LABEL[raw];

  // Legacy backend value without 'Ovoid' → patch it
  if (raw === 'CaOx Monohydrate') return 'CaOx Monohydrate Ovoid';

  // Unknown → return raw so it still renders
  return raw;
};
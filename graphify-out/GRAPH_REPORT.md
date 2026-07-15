# Graph Report - /Users/varsekhar/Library/Mobile Documents/com~apple~CloudDocs/Var_NeuroAI_Simulator  (2026-07-11)

## Corpus Check
- Corpus is ~6,440 words - fits in a single context window. You may not need a graph.

## Summary
- 101 nodes · 180 edges · 10 communities
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Alzheimer's Pathology & Neuroplasticity|Alzheimer's Pathology & Neuroplasticity]]
- [[_COMMUNITY_Exercise, Omega-3 & Neurotrophic Biomarkers|Exercise, Omega-3 & Neurotrophic Biomarkers]]
- [[_COMMUNITY_Simulator UI Wiring|Simulator UI Wiring]]
- [[_COMMUNITY_APOE Genetics & Domain Interaction|APOE Genetics & Domain Interaction]]
- [[_COMMUNITY_App Data Model & Globals|App Data Model & Globals]]
- [[_COMMUNITY_3D Brain Scene Builders|3D Brain Scene Builders]]
- [[_COMMUNITY_Parkinson's, Dopamine & Movement|Parkinson's, Dopamine & Movement]]
- [[_COMMUNITY_APOE 3D Scene Builders|APOE 3D Scene Builders]]
- [[_COMMUNITY_Neuroplasticity Model Math|Neuroplasticity Model Math]]
- [[_COMMUNITY_Render & Animation Helpers|Render & Animation Helpers]]

## God Nodes (most connected - your core abstractions)
1. `$()` - 19 edges
2. `initBrain()` - 13 edges
3. `Neuroplasticity` - 10 edges
4. `APOE4 allele` - 10 edges
5. `initApoe()` - 9 edges
6. `Omega-3 fatty acids (n-3 PUFA)` - 9 edges
7. `refresh()` - 8 edges
8. `boot()` - 8 edges
9. `Aerobic exercise` - 8 edges
10. `Alzheimer's disease` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Alzheimer's disease` --semantically_similar_to--> `Parkinson's disease`  [INFERRED] [semantically similar]
  research/01_alzheimers_neuroplasticity_paper.md → research/02_chronic_illness_neuroplasticity_paper.md
- `Synergy hypothesis (multi-modal)` --conceptually_related_to--> `Cognitive stimulation therapy (CST)`  [EXTRACTED]
  README.md → research/01_alzheimers_neuroplasticity_paper.md
- `BDNF` --semantically_similar_to--> `GDNF`  [INFERRED] [semantically similar]
  research/01_alzheimers_neuroplasticity_paper.md → research/02_chronic_illness_neuroplasticity_paper.md
- `APOE4 allele` --conceptually_related_to--> `SNP rs429358 (codon 112)`  [EXTRACTED]
  research/02_chronic_illness_neuroplasticity_paper.md → index.html
- `APOE4 allele` --conceptually_related_to--> `SNP rs7412 (codon 158)`  [EXTRACTED]
  research/02_chronic_illness_neuroplasticity_paper.md → index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The three synergistic AD interventions** — c_omega3, c_aerobic_exercise, c_cst [EXTRACTED 1.00]
- **ApoE4 domain-interaction residues** — c_arg112, c_arg61, c_glu255 [EXTRACTED 1.00]
- **Neuroplasticity biomarker panel** — c_bdnf, c_neurogenesis, c_hippocampal_volume, c_vegf [INFERRED 0.85]

## Communities (10 total, 0 thin omitted)

### Community 0 - "Alzheimer's Pathology & Neuroplasticity"
Cohesion: 0.14
Nodes (19): Amyloid beta 42 (AB42), Alzheimer's disease, Amyloid-β plaques, Chronic illness, Cognitive stimulation therapy (CST), Dementia, Diers (visual feedback & pain), Doidge (The Brain's Way of Healing) (+11 more)

### Community 1 - "Exercise, Omega-3 & Neurotrophic Biomarkers"
Cohesion: 0.17
Nodes (16): Aerobic exercise, BDNF, Cerebral blood flow, Chávez-Castillo (W-3 PUFA review), DHA (docosahexaenoic acid), EPA (eicosapentaenoic acid), GDNF, Hippocampal volume (+8 more)

### Community 2 - "Simulator UI Wiring"
Cohesion: 0.27
Nodes (13): applyPreset(), boot(), buildChartLegend(), buildCoefTable(), buildGauges(), drawChart(), initSci(), refresh() (+5 more)

### Community 3 - "APOE Genetics & Domain Interaction"
Cohesion: 0.18
Nodes (13): APOE2 allele, APOE3 allele, APOE4 allele, Arg112 residue, Arg61 residue, Bryant (APOE4), Choline supplementation, ApoE4 domain interaction (+5 more)

### Community 4 - "App Data Model & Globals"
Cohesion: 0.20
Nodes (9): apoe, brain, COL, GAUGES, ISO, PRESETS, SERIES, state (+1 more)

### Community 5 - "3D Brain Scene Builders"
Cohesion: 0.32
Nodes (8): gyri(), initBrain(), label(), mkPart(), nucleus(), setDissect(), tmat(), updateInnerVis()

### Community 6 - "Parkinson's, Dopamine & Movement"
Cohesion: 0.33
Nodes (7): Basal ganglia, Dopamine, Fibromyalgia, Huntington's disease, Meditation / mindfulness, Parkinson's disease, Substantia nigra

### Community 7 - "APOE 3D Scene Builders"
Cohesion: 0.40
Nodes (6): buildDNA(), buildProtein(), cyl(), initApoe(), makeScene(), setView()

### Community 8 - "Neuroplasticity Model Math"
Cohesion: 0.40
Nodes (6): clamp(), lerpC(), setGhost(), synergy(), trajectory(), updateBrain()

### Community 9 - "Render & Animation Helpers"
Cohesion: 0.67
Nodes (3): animateApoe(), animateBrain(), isActive()

## Knowledge Gaps
- **29 isolated node(s):** `W`, `state`, `SERIES`, `COL`, `brain` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `APOE4 allele` connect `APOE Genetics & Domain Interaction` to `Alzheimer's Pathology & Neuroplasticity`, `Exercise, Omega-3 & Neurotrophic Biomarkers`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `Neuroplasticity` connect `Alzheimer's Pathology & Neuroplasticity` to `Exercise, Omega-3 & Neurotrophic Biomarkers`, `Parkinson's, Dopamine & Movement`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `Alzheimer's disease` connect `Alzheimer's Pathology & Neuroplasticity` to `Exercise, Omega-3 & Neurotrophic Biomarkers`, `APOE Genetics & Domain Interaction`, `Parkinson's, Dopamine & Movement`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `APOE4 allele` (e.g. with `APOE2 allele` and `Omega-3 fatty acids (n-3 PUFA)`) actually correct?**
  _`APOE4 allele` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `W`, `state`, `SERIES` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Alzheimer's Pathology & Neuroplasticity` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
# Neuroplasticity Exploration Simulator

Interactive 3D companion to two of my research papers on **neuroplasticity** — one on early-stage Alzheimer's (omega-3 + aerobic exercise + CST), one on multi-modal neuroplasticity in chronic-illness pain. Built to explore, demonstrate, and pressure-test the ideas at science fairs / research reviews.

## Run it

ES modules + import maps need a real server (not `file://`):

```bash
cd "Var_NeuroAI_Simulator"
python3 -m http.server 8777
```

Open <http://localhost:8777/index.html>. Needs internet the first time (loads Three.js from a CDN).

## What's inside

**🧠 Intervention Simulator**
- A live, **dissectable** 3D brain. Drag the **X-ray cortex** + **Cross-section** sliders to cut inward and reveal labeled interior anatomy: cortex, white matter, corpus callosum, lateral ventricles, thalamus, basal ganglia, amygdala, substantia nigra, hippocampus, cerebellum, brainstem. Hippocampus grows/shrinks, amyloid plaques appear, cerebral-blood-flow glow and neurogenesis sparks all react to your plan.
- Sliders for the four interventions + APOE4 copies, a 24-month timeline (scrub or ▶ Play), presets (Untreated / Exercise only / Full synergy).
- Charts: your plan (solid) vs. untreated early-AD baseline (dashed) for cognition, hippocampal volume, neuroplasticity index, plaque, BDNF.
- A **synergy** term — the paper's core hypothesis that combined treatments beat the sum of parts — that you can toggle and watch.
- **Tune coefficients**: every effect weight is editable, so the model is a sandbox, not a black box.

**🧬 APOE Genetics Explorer**
- Rotatable 3D **DNA** with the two defining SNPs (`rs429358` codon 112, `rs7412` codon 158). Switch ε2 / ε3 / ε4 and watch the alleles and residues change.
- Rotatable 3D **ApoE protein**: N-terminal 4-helix receptor-binding domain, C-terminal lipid-binding domain, and the key residues (Arg112, Arg61, Glu255) that form ApoE4's pathogenic **domain interaction**.
- **Structure corrector** toggle (PH002-type) that breaks the Arg61–Glu255 salt bridge — the removable pathogenic part — making ApoE4 behave like ApoE3.

**🔬 Pathology Lab** — two rotatable close-ups:
- **Parkinson's dopamine circuit**: the substantia nigra → striatum nigrostriatal pathway with dopamine particles flowing along the axons. Slide neuron loss up and dopamine falls, particles thin out, and the whole circuit develops a tremor; slide exercise + meditation up to partly restore it. Live dopamine / motor / tremor gauges.
- **Molecular AD**: a neuron with extracellular amyloid-β fibrils clumping into a plaque, and intracellular tau detaching from microtubules into neurofibrillary tangles. Burden vs. clearance sliders show plaques/tangles appear and microtubule integrity collapse.

**📄 Science & Model Notes** — how the model works and the verified effect directions.

## Honesty note
Every *direction* of effect is grounded in the literature reviewed in the papers (and was independently fact-checked). The *magnitudes* are illustrative and fully tunable. This is a teaching/hypothesis tool, **not** a validated clinical predictor or medical advice.

## Files
- `index.html`, `styles.css`, `app.js` — the app (only dependency: Three.js via CDN)
- `research/` — the two source papers
- `graphify-out/` — knowledge graph of the research (if generated)

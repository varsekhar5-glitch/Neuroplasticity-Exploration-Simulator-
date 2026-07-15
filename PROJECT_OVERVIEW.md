# Neuroplasticity Exploration Simulator — Project Overview

## What it is
The **Neuroplasticity Exploration Simulator** is an interactive, browser-based 3D neuroscience laboratory that lets anyone *see and manipulate* the biology behind two of my research papers on **neuroplasticity** — the brain's ability to rewire and heal itself. It turns abstract mechanisms (biomarkers, brain atrophy, protein misfolding, dopamine loss) into living, rotatable, dissectible 3D models that respond in real time to lifestyle interventions and genetic risk.

It opens on a cinematic landing screen, then has three interactive modules plus a knowledge graph:
0. **Landing / "Enter the lab"** — a living neural-network animation (firing neurons, dendrites, traveling action potentials) behind the why-I-built-this story, with a liquid-glass entry button.
1. **Intervention Simulator** — a dissectible living brain + a 24-month model of how omega-3, aerobic exercise, cognitive stimulation therapy (CST), and meditation change neuroplasticity.
2. **APOE Genetics Explorer** — a rotatable 3D DNA + protein model of the APOE4 Alzheimer's risk gene and its removable pathogenic feature.
3. **Pathology Lab** — the Parkinson's dopamine circuit and the molecular plaques-and-tangles of Alzheimer's, up close.
4. **Knowledge graph** — every concept in the research linked into a navigable map.

## Why it was made
Neuroplasticity is one of the most exciting frontiers in neuroscience — real, measurable proof that the brain can rewire, adapt, and heal itself through the choices we make every day, not just in childhood. That felt like a wonder worth sharing in a way people could actually see and test for themselves, not just read about.

The underlying problem is real too: chronic neurodegenerative diseases — Alzheimer's and Parkinson's — are common, devastating, and still poorly understood. Treatment is dominated by short-term pharmaceuticals that manage symptoms rather than address the underlying disease process. A growing body of evidence shows that **lifestyle interventions can enhance neuroplasticity** and may improve cognitive function, biomarkers, or slow progression in some contexts — though they have not been shown to reverse Alzheimer's disease generally — yet these interventions are rarely studied *together* (synergistically), and the mechanisms are hard to picture.

I wrote two research papers on this:
- *"The Impact of Omega-3 Fatty Acids, Aerobic Exercise, and Cognitive Stimulation Therapy on Neuroplasticity Enhancement in Early-Stage Alzheimer's Disease"*
- *"Positive Re-wiring of a Dying Brain: Multi-Modal Neuroplasticity Enhancement in Chronic Illness Pain Management"* (companion PDF, with full Works Cited, in `research/`)

The Alzheimer's paper has been hard to advance because I've struggled to find a research mentor. So I built this simulator to **make the ideas testable, teachable, and visible** — something I can tinker with to explore my own hypotheses, demonstrate at science fairs, and use to raise the level of neuroscience understanding for anyone who opens it. I'm a high school student with a passion for neuroscience, and I wanted this to invite real scientific curiosity — explore the models, test the research, question the assumptions — not just present a finished answer.

## Goals
- **Prove and pressure-test the research** — expose the model's assumptions and let the user change every coefficient, so it is a sandbox, not a black box.
- **Make mechanisms visible** — show *where* in the brain, *which* molecules, and *how* each intervention acts.
- **Demonstrate the synergy hypothesis** — that combining diet + exercise + cognitive therapy beats the sum of the parts (explicitly labeled as a hypothesis, not a measured effect — see Evidence calibration below).
- **Educate** — anatomically and biologically accurate models anyone can rotate, dissect, and label-read.
- **Stay honest** — every *direction* of effect is grounded in the literature; every *magnitude* is illustrative, sourced where possible, and clearly labeled as a teaching model, not clinical advice.

## Evidence calibration (2026-07-12)
The simulator's coefficients (the `W` object in `app.js` — how strongly omega-3/exercise/CST/meditation drive BDNF, cerebral blood flow, and neuroinflammation) were originally illustrative placeholders. They have since been recalibrated against real meta-analyses and RCTs, dispatched as parallel literature searches per intervention→biomarker pair:

- **Exercise → BDNF**: Szuhany et al. 2015 meta-analysis (29 studies, n=1,111), Hedges' g=0.28
- **Exercise → hippocampal volume/CBF**: Erickson et al. 2011 (PNAS, n=120, +2% hippocampal volume vs. control decline) and Tomoto et al. 2023 (CBF +5–6%)
- **Omega-3 → inflammation**: Li et al. 2014 (PLOS ONE, 68 RCTs, healthy subgroup CRP −16.5%)
- **Omega-3 → BDNF**: Ziaei et al. 2024 (12 RCTs, SMD=0.72)
- **CST → cognition**: Cochrane/Woods et al. 2023 review (37 RCTs, n=2,766, mild-moderate dementia — the one relationship with a strong population match to this app's target group; SMD=0.40, MMSE +1.99 pts)
- **Meditation → inflammation/BDNF**: Grasmann et al. 2023 (33 RCTs — inflammation effect NOT statistically significant) and a 2020 Frontiers meta-analysis (BDNF SMD=0.72, low confidence)
- **FINGER trial** (Ngandu et al. 2015, Lancet, n=1,260): the closest real analogue to "multi-domain intervention," but it tested a combined effect only — **no study anywhere in the literature isolates a synergy/interaction effect**, so the model's `SYN` multiplier remains an explicit, labeled *hypothesis* (reduced from 22 → 12), not a literature-derived number.

Every coefficient in `app.js` now has an inline comment citing its source paper, the extracted effect size, a confidence rating, and a population-match flag (most underlying studies are in healthy adults or MCI, not diagnosed early-stage Alzheimer's — a mismatch worth knowing about). Several original placeholders were substantially larger than real evidence supports and have been reduced; the sim now moves less dramatically than before, on purpose. Full detail: `app.js` `W` object, and the "Supporting research" section of the Science & Model Notes tab.

## How it was made
- **Single self-contained web app** — `index.html` + `styles.css` + `app.js`. The only dependency is **Three.js**, **vendored locally in `vendor/` so the whole thing runs fully offline** (important for a fair venue with no wifi) — no CDN calls, no build step, no framework; runs from any static server.
- **Procedural 3D anatomy** — the brain, DNA, protein, and cells are generated in code (noise-displaced meshes for cortical folds, tube geometry for the hippocampus and axons, clipping planes for dissection), not downloaded models — so every structure is individually colored, labeled, and reactive.
- **A transparent phenomenological model** — a monthly-step simulation drives biomarkers (BDNF, cerebral blood flow, neuroinflammation → neurogenesis → hippocampal volume, amyloid load → cognition) with an explicit cross-product **synergy** term and an APOE risk multiplier. All coefficients are editable in the UI and now literature-cited (see Evidence calibration).
- **Fact-checked science** — the APOE residues/SNPs, the Arg61–Glu255 domain interaction, the PH002 structure-corrector strategy, and every intervention→biomarker direction were independently verified against the literature.
- **Design system** — an "instrument-panel clinical + anatomy-atlas editorial" visual language: one committed signal accent (cool teal) on true graphite-black, hairline borders, no gradients/glow/pill-radius in the app chrome, serif headings paired with monospace controls/data, hand-drawn SVG icons (no emoji), colorblind-safe chart markers. The landing screen is the one deliberately cinematic exception — a living neural-network canvas, bouncing 3D neuroscience terms, and a liquid-glass CTA button.
- **Knowledge graph** — the two papers + the app were run through a graph-extraction pipeline, producing an interactive map of 101 concepts in 10 communities (`graphify-out/graph.html`).

## Functions & features

### Landing page
- **Living neural network** — canvas animation of drifting neurons with dendrites, synapse lines, and traveling action-potential pulses; a faint anatomical brain silhouette behind the copy.
- **Bouncing 3D terms** — Neuroplasticity, Synaptogenesis, Neurogenesis, BDNF, GDNF, Myelination, and more drift and bounce around the screen.
- **The story** — why neuroplasticity is worth sharing, what the simulator does, and who built it (a high school student), plus an explicit disclaimer that projections are a teaching model, not a prediction.
- **Liquid-glass "Enter the lab" button** — translucent, blurred, specular-highlight CTA into the app.

### Intervention Simulator
- **Dissectible 3D brain.** Two sliders — *X-ray cortex* (fades the cortex to translucent) and *Cross-section* (a clipping plane that cuts the brain open) — reveal labeled interior anatomy: cerebral cortex, white matter, corpus callosum, lateral ventricles, thalamus, basal ganglia, amygdala, substantia nigra, hippocampus, cerebellum, brainstem. Fully rotatable and zoomable, with **Sagittal / Coronal / Axial** section planes.
- **Click-to-inspect.** Click any structure (dissect first to reach the interior) and its name + role appears in a panel — built for judges and demos.
- **Explicit default-mode labeling.** The hint text states the default trajectory is untreated early-stage Alzheimer's (hippocampal atrophy, plaque, cognition decline); Parkinson's mode is a separate, off-by-default toggle that additionally layers in substantia nigra dopamine decline.
- **PNG export.** A ⤓ button saves the current 3D view as an image for slides or a poster.
- **Live biology.** The hippocampus shrinks or regrows, amyloid plaques accumulate, a cerebral-blood-flow glow brightens, and neurogenesis sparks appear — all driven by your plan and the month scrubber.
- **Intervention sliders** — omega-3, aerobic exercise, CST, meditation, and APOE4 copies (0/1/2 genetic risk) — now literature-calibrated (see Evidence calibration).
- **24-month timeline** — scrub or press ▶ Play to watch the trajectory unfold.
- **Charts** — your plan (solid) vs. an untreated early-Alzheimer's baseline (dashed) for cognition, hippocampal volume, neuroplasticity index, amyloid load, and BDNF; each series has a distinct marker shape (circle/square/triangle/diamond/cross), not color alone, for colorblind accessibility.
- **Synergy meter** — quantifies the multi-modal bonus, explicitly labeled as a hypothesis (see Evidence calibration); toggle it off to see single-treatment behavior.
- **Tunable coefficients** — edit the effect weights and rerun instantly.
- **Presets + Reset** — Untreated / Exercise only / Full synergy, and a Reset that restores default settings.

### APOE Genetics Explorer
- **Rotatable 3D DNA** with the two real defining SNPs — `rs429358` (codon 112) and `rs7412` (codon 158). Switching ε2 / ε3 / ε4 recolors the alleles and updates the residues.
- **Rotatable 3D ApoE protein** — the N-terminal (receptor-binding) and C-terminal (lipid-binding) domains, with the key residues Arg112, Arg61, and Glu255.
- **The pathogenic feature made visible** — in ApoE4, Arg112 repositions Arg61 to form a salt bridge with Glu255 (the "domain interaction"). A **structure-corrector toggle** (PH002-type) breaks that bond, so ApoE4 behaves like ApoE3 — the removable pathogenic part.
- **Genotype panel + Reset** — SNP/residue table, AD-risk explanation (sourced to a University of Washington ADRC fact sheet), gene locus (chr 19q13.32), and a Reset view.

### Pathology Lab
- **Parkinson's dopamine circuit** — the substantia nigra → striatum (nigrostriatal) pathway with dopamine particles flowing along the axons. Raise *neuron loss* and dopamine falls, particles thin, and the whole circuit develops a tremor; add *exercise + meditation* to partly restore it. Live dopamine / motor / tremor gauges.
- **Molecular Alzheimer's** — a neuron with extracellular amyloid-β fibrils clumping into a plaque, and intracellular tau detaching from microtubules into neurofibrillary tangles. *Burden* vs. *clearance* sliders show plaques and tangles appear and microtubule integrity collapse.
- **Reset** for quick model testing.

### Science & Model Notes
- How the model works, effect directions, and the synergy hypothesis (now flagged as untested).
- **Supporting research** — 5 real linked sources spanning PubMed, NIH/PMC, NIH/NIA, and a university ADRC (Köbe 2016, Hilton 2016, Jeon 2020, an NIA briefing, and the UW ADRC).
- A wording-correction note: earlier drafts described interventions as able to "reverse" Alzheimer's/chronic-illness effects; current evidence supports management/slowing, not reversal, and both research papers plus this app were revised to reflect that.
- A link to the full chronic-illness paper as a PDF, with Works Cited.

### Knowledge graph
- An interactive, searchable graph of the research: 101 concepts, 10 communities, with the cross-cutting "bridge" concepts (APOE4, neuroplasticity) surfaced automatically.

## Is there a reset button?
Yes. Every module has a Reset for quick model testing:
- **Intervention Simulator** — a **↺ Reset** button (restores all sliders and the month to defaults), plus a **Reset** on the brain viewport that restores the X-ray/cross-section sliders and camera.
- **APOE Explorer** — a **↺ Reset view** (back to ε3, DNA view, corrector off).
- **Pathology Lab** — a **↺ Reset** (restores the sliders and returns to the Parkinson's view).

## How to run
ES modules + import maps need a real server (not `file://`):

```bash
cd Var_NeuroAI_Simulator
python3 -m http.server 8777
```
Then open <http://localhost:8777/index.html>. Fully offline after that — Three.js is vendored locally in `vendor/`, no CDN calls.

If a change doesn't show up after re-running the server, it's almost always the browser caching the old files — hard-refresh or empty the browser cache for `localhost:8777`.

## Scientific accuracy & disclaimer
Every **direction** of effect in the models is grounded in the peer-reviewed literature and was independently fact-checked; the core intervention→biomarker **magnitudes** are now literature-calibrated with per-coefficient citations (see Evidence calibration), though most underlying studies are in healthy or MCI populations rather than diagnosed early-stage Alzheimer's patients — a mismatch that's flagged in the code and the UI. The synergy multiplier remains an explicit, labeled hypothesis with no dedicated interaction-effect study behind it. This is an educational and hypothesis-exploration tool — **not** a validated clinical predictor and **not** medical advice.

## Files
- `index.html`, `styles.css`, `app.js` — the app (only dependency: Three.js, vendored locally in `vendor/`)
- `research/` — the two source papers, plus a PDF (with Works Cited) of the chronic-illness paper
- `graphify-out/graph.html` — the interactive knowledge graph
- `README.md` — quick start
- `PROJECT_OVERVIEW.md` — this document

# Neuroplasticity Exploration Simulator — Project Overview

## What it is
The **Neuroplasticity Exploration Simulator** is an interactive, browser-based 3D neuroscience laboratory that lets anyone *see and manipulate* the biology behind two of my research papers on **neuroplasticity** — the brain's ability to rewire and heal itself. It turns abstract mechanisms (biomarkers, brain atrophy, protein misfolding, dopamine loss) into living, rotatable, dissectible 3D models that respond in real time to lifestyle interventions and genetic risk.

It is also a **self-validating computational model**: a 54-source machine-readable literature base feeds the model's coefficients, and a built-in Validation & Metrics panel continuously compares every simulated run against published clinical-trial endpoints (Alzheimer's *and* Parkinson's), reporting the residual error honestly instead of hiding it. The unifying thesis: neuroplasticity is a shared therapeutic pathway across neurodegenerative diseases — the same four lifestyle levers act on it in Alzheimer's (memory system), Parkinson's (dopamine/motor system), and under APOE4 genetic risk (the dial that modulates both). Prepared as an ISEF project (Translational Medical Science).

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

For a long time the Alzheimer's paper was hard to advance without a research mentor, so I built this simulator to **make the ideas testable, teachable, and visible** — something I can tinker with to explore my own hypotheses, demonstrate at science fairs, and use to raise the level of neuroscience understanding for anyone who opens it. I'm a high school student with a passion for neuroscience, and I wanted this to invite real scientific curiosity — explore the models, test the research, question the assumptions — not just present a finished answer.

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

## Literature pipeline & second calibration pass (2026-09-08)
The hand-transcribed citations were upgraded into a **reproducible data pipeline**:

- **`research/literature.csv`** — 54 evidence rows (one per study × outcome), each with population, n, effect size, 95% CI, p-value, confidence rating, disease match (AD / PD / MCI / healthy), and the model parameter it feeds. Every quantitative value was verified against the fetched abstract (PMIDs/DOIs recorded).
- **`research/build_benchmarks.py`** — converts the CSV into `benchmarks.json` using a single documented rule (standardized effect × 20 on the model's 0–100 scale; direct percentages used as-is; non-significant results forced near zero).
- The app **loads `benchmarks.json` at boot**, derives the validation panel's trial endpoints from it, and auto-lists all 54 sources in a machine-readable table in Science & Model Notes.

This pass produced four model **recalibrations**, each cited inline in the code:
1. **CST → cognition cut 0.33 → 0.08/mo** — Woods et al. 2023 Cochrane update (n=1,893): CST yields ~+2.0 MMSE points [1.24, 2.74]; the old value implied ~+8.
2. **New meditation → cognition path (0.09/mo)** — Shi et al. 2025 meta-analysis (25 RCTs, n=2,095, SCD/MCI/AD): MMSE +2.22 [0.83, 3.62]. Meditation previously had no direct cognition effect in the model.
3. **Parkinson's dopamine decline halved (1.9 → 0.95/mo)** — calibrated to Marek et al. 2001 serial DAT-SPECT imaging (−11.2%/yr untreated); the untreated simulation now lands within ~5% of the trial trajectory.
4. **Untreated MMSE benchmark −2.4 → −3.3 pts/yr** — Han et al. 2000 meta-analysis (37 studies, n=3,492).

It also surfaced two honest corrections: the nigral-loss-at-motor-onset threshold was updated from the older "60–80%" dogma to **30–50%** (Popescu 2024), and a meditation–inflammation effect size was corrected to the verified value (Grasmann 2023, g=−0.11, marginal). Notable evidence banked for the paper: exercise → BDNF in PD is ~4× the healthy-adult effect (Kaagman 2024 RCT-only meta, SMD 1.2); APOE4 shows a gene-dose hippocampal-atrophy effect (Cai 2026, n=4,311); and Quinn 2010 shows DHA benefits only APOE4 *non*-carriers in established AD — which challenges one of the model's own interaction assumptions and is flagged as such.

**Known open issue (deliberately displayed, not hidden):** with real trial endpoints loaded, the model's default structural decline runs 2–3× steeper than the published trials — the validation panel shows agreement near 0/100 at defaults, and the sensitivity sliders demonstrate that a single coefficient (hippocampal atrophy rate) moves agreement to ~83/100. Fitting `atrophy`/`regrow` against Barnes 2009 + Han 2000 the way the dopamine rate was fitted against Marek 2001 is the identified next step.

## How it was made
- **Single self-contained web app** — `index.html` + `styles.css` + `app.js`. The only dependency is **Three.js**, **vendored locally in `vendor/` so the whole thing runs fully offline** (important for a fair venue with no wifi) — no CDN calls, no build step, no framework; runs from any static server.
- **Real 3D anatomy** — the brain is built from real data, not drawn by hand: the cortex is the FreeSurfer *fsaverage* pial/white surface and every inner structure (hippocampus, thalamus, striatum, amygdala, ventricles, brainstem, cerebellum, corpus callosum) is segmented from the MNI152 atlas brain (`brain_structure.js`), just as the ApoE protein is the real PDB 2L7B backbone. Labels are anatomical-plate callouts (text outside the silhouette, leader line to the structure) so they never hide what they name. DNA and cells remain procedural (tube geometry for axons, clipping planes for dissection); every structure is individually colored, labeled, and reactive.
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
- **Tunable coefficients & live sensitivity analysis** — the literature-derived intervention→biomarker weights are editable, and **10 structural coefficients** (BDNF→neuroplasticity weight, hippocampal atrophy/regrowth rates, APOE-ε4 multiplier, amyloid accrual, CST→cognition, meditation→cognition, synergy) are exposed as sliders; every trajectory, gauge, and 3D visual recalculates in real time while dragging — built for live sensitivity analysis in front of judges.
- **Validation & Metrics panel** — reads the current sliders, matches them to the closest published trial scenario (Barnes & Fox 2009 + Han 2000 for untreated AD; Erickson 2011 for exercise-only; Köbe 2016 + FINGER for multi-domain), and shows simulated vs. trial 24-month endpoints for hippocampal volume and MMSE with per-metric **residuals** and a normalized model–trial agreement score. With Parkinson's mode on, a dopamine row benchmarks the simulated decline against Marek 2001 serial DAT imaging.
- **Batch simulation run** — sweeps any one intervention 0→100% in 25% steps holding everything else constant, logs the full 24-month trajectories of dopamine, neuroplasticity index, and amyloid plaque (126 rows), and outputs a dose-response summary table plus a downloadable/copyable CSV for graphing software.
- **Plain-English scoreboard** — every factor (BDNF, blood flow, inflammation, neuroplasticity, hippocampus, amyloid plaque, substantia-nigra dopamine, MMSE) as a **percent difference vs. doing nothing** at the current month, worded so a non-specialist can read it.
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
- **Literature base table (auto-generated)** — all 54 machine-readable sources from `research/literature.csv`, listed with study, design, outcome, effect size, and the model parameter each feeds; spans Alzheimer's, Parkinson's/dopamine, APOE4, and all four interventions.
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

## How to use it (a 5-minute tour)
Written so anyone — including a middle schooler — can follow along. No science background needed.

1. **Click "Enter the lab."** The animated screen with the firing brain cells is just the welcome page — the button takes you into the real lab.
2. **Try the brain (Intervention Simulator tab).** Drag on the 3D brain to spin it. Now slide **X-ray cortex** down to make the outside see-through, and **Cross-section** to slice it open like a real dissection. Click any part you can see — a little panel tells you what it is and what it does.
3. **Give the "patient" a healthy lifestyle.** The four sliders on the right are treatments: fish oil (omega-3), exercise, brain games (cognitive stimulation), and meditation. The brain you're looking at starts as an untreated early Alzheimer's brain. Push the sliders up and you're prescribing a plan.
4. **Press ▶ Play.** The model runs 2 years of that plan, month by month. Watch the memory center (hippocampus) shrink or hold on, red plaque dots appear or fade, and the graph draw your plan (solid line) against doing nothing (dashed line).
5. **Read the scoreboard.** The "Plain-English scoreboard" card turns everything into simple percents: how much better or worse each brain factor is compared to doing nothing. Green ▲ = your plan helped. Red ▼ = it didn't.
6. **Check the model against real studies.** The "Validation & metrics" card compares the simulation's 2-year result to what real clinical trials measured in real patients — and shows the difference honestly, even when the model is off. That difference (the "residual") is the science-fair part: it tells us where the model matches reality and where it doesn't.
7. **Be the scientist.** Open "Tune model coefficients" and drag any slider — like the brain-shrink rate — and watch every graph and the 3D brain recalculate instantly. This is called *sensitivity analysis*: finding out which assumption matters most.
8. **Collect data.** The "Batch simulation run" card runs the experiment for you five times automatically (exercise at 0%, 25%, 50%, 75%, 100%) and gives you a table plus a CSV file you can drop into any graphing tool.
9. **Explore the other tabs.** **APOE Genetics Explorer**: flip between the ε2/ε3/ε4 gene versions and watch the DNA and protein change; try the "structure corrector" toggle to fix the bad protein. **Pathology Lab**: watch dopamine flow from the substantia nigra, then raise "neuron loss" to see Parkinson's happen — and exercise partly rescue it. **Science & Model Notes**: every study the model is built on, with links.
10. **Made a mess? Hit ↺ Reset.** Every tab has one. You cannot break anything.

## Scientific accuracy & disclaimer
Every **direction** of effect in the models is grounded in the peer-reviewed literature and was independently fact-checked; the core intervention→biomarker **magnitudes** are now literature-calibrated with per-coefficient citations (see Evidence calibration), though most underlying studies are in healthy or MCI populations rather than diagnosed early-stage Alzheimer's patients — a mismatch that's flagged in the code and the UI. The synergy multiplier remains an explicit, labeled hypothesis with no dedicated interaction-effect study behind it. This is an educational and hypothesis-exploration tool — **not** a validated clinical predictor and **not** medical advice.

## Files
- `index.html`, `styles.css`, `app.js` — the app (only dependency: Three.js, vendored locally in `vendor/`)
- `research/` — the two source papers, a PDF (with Works Cited) of the chronic-illness paper, **`literature.csv`** (the 54-row evidence base), and **`build_benchmarks.py`** (the conversion script)
- `benchmarks.json` — generated trial-endpoint data the app loads at boot (regenerate with `python3 research/build_benchmarks.py`; edit the CSV, not this file)
- `graphify-out/graph.html` — the interactive knowledge graph
- `README.md` — quick start
- `PROJECT_OVERVIEW.md` — this document

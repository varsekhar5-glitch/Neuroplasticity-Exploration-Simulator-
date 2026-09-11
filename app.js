import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { APOE_CA, APOE_HELICES, APOE_PDB } from './apoe_structure.js';
import { BRAIN_MESHES } from './brain_structure.js';

/* ============================================================
   Neuroplasticity Exploration Simulator ,  app.js
   Sections:  MODEL · CHARTS · 3D-BRAIN · 3D-APOE · UI · NOTES
   ============================================================ */

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerpC = (a, b, t) => a.clone().lerp(b, clamp(t, 0, 1));

/* ============================================================
   1. NEUROPLASTICITY MODEL  (24-month monthly step)
   ============================================================ */
const MONTHS = 24;
/* ------------------------------------------------------------------------
   EVIDENCE-CALIBRATED COEFFICIENTS (2026-07-12).
   Scope: only the intervention→biomarker weights below (ex/o3/cst/med) are
   literature-derived. `base` values are model initial conditions (assumed
   untreated early-AD starting point), not effect sizes, out of scope.

   Conversion rule: where a study reports a direct % change in the real
   biomarker, that % is used as the coefficient directly. Where a study
   reports a standardized effect size (Hedges' g / Cohen's d / SMD), it is
   converted via coefficient ≈ round(d × 20), a stated convention (d≈1.0
   large effect → 20 points on this model's illustrative 0–100 scale), NOT
   a claim that SD units equal percentage points. Point estimates are used
   as-is; confidence and population-match are recorded as separate flags
   rather than silently baked into the number, so weak evidence stays
   visible instead of disappearing into a "safe" smaller value. The one
   exception: a result that is NOT statistically significant is set near
   zero rather than at its point estimate, because "no reliable evidence
   of an effect" and "a small confirmed effect" are different claims.
   ------------------------------------------------------------------------ */
const W = {
  bdnf: {
    base: 40, // untreated early-AD starting point (model assumption, not literature)
    // Szuhany, Bugatti & Otto 2015, J Psychiatric Research 60:56-64. Meta-analysis,
    // 29 studies, n=1,111. Chronic aerobic training → resting BDNF: Hedges' g=0.28
    // (small, p=0.005). Confidence: high (study quality) / medium (generalizability).
    // MISMATCH: healthy/mixed-age adult samples, no AD-specific trials. g×20=5.6→6.
    ex: 6,
    // Ziaei et al. 2024, Nutritional Neuroscience 27(7):715-725. Meta-analysis,
    // 12 RCTs, n=587. Omega-3 → BDNF: SMD=0.72 (moderate-large), I²=84%.
    // Confidence: medium (high heterogeneity). MISMATCH: mixed clinical populations
    // (CVD, T2DM, depression, schizophrenia) — no AD trials in the pool; a separate
    // AD-specific RCT (PMC4632767) found NO cognitive/mood benefit. SMD×20=14.4→14.
    o3: 14,
    // No direct CST→BDNF evidence found — Woods/Spector Cochrane review (37 RCTs,
    // n=2,766) is silent on this outcome. Kept small, reflecting the model's existing
    // "weaker molecular effect" framing for CST. This is an EVIDENCE GAP, not a
    // confirmed null result — flag accordingly if surfaced in the UI.
    cst: 2,
    // Frontiers in Psychology 2020 (PMC7522212). Meta-analysis, 8 RCTs, n=479.
    // Meditation → BDNF: SMD=0.72, I²=78%. Confidence: LOW-medium (small n, high
    // heterogeneity). MISMATCH: population mostly psychiatric (depression/
    // schizophrenia) + one MCI subgroup — no AD-specific data. SMD×20=14.4→14.
    med: 14,
  },
  cbf: {
    base: 45, // untreated early-AD starting point (model assumption, not literature)
    // Tomoto et al. 2023, J Cerebral Blood Flow & Metabolism 43(3):404-418. RCT,
    // n=73 (55 completed), 1-year aerobic vs. stretching control. Global CBF +5±7%
    // vs 0±5% control (p=0.007); normalized CBF +6±7% (p=0.002). Confidence: high
    // (significant RCT) but wide individual variance. MISMATCH: cognitively normal
    // older adults, not AD. Direct % used: 6.
    ex: 6,
    // Jackson et al. 2017, J Prevention of Alzheimer's Disease (PMC/PubMed 29405229).
    // RCT, n=13, 26 weeks, mild cognitive impairment patients (best population match
    // found in this whole search). Omega-3 → resting cerebral perfusion: +26.1% vs.
    // no change in placebo. Confidence: LOW — n=13 is a small pilot; point estimate
    // not used directly, substantially discounted pending replication. Set to 10.
    o3: 10,
    // No claimed/plausible direct CBF pathway for CST — structural zero, not an
    // evidence gap (CST is a cognitive/behavioral intervention, not vascular).
    cst: 0,
    // No quantified chronic CBF effect found for meditation. Wang et al. 2011
    // (Psychiatry Res: Neuroimaging, n=10) found unquantified regional CBF shifts;
    // Kjaer et al. 2002 measured acute striatal DOPAMINE release, not CBF, in n=8
    // expert meditators. EVIDENCE GAP — kept small pending a real chronic-CBF trial.
    med: 2,
  },
  inflam: {
    base: 52, // untreated early-AD starting point (model assumption, not literature)
    // Meta-analysis of long-term exercise training, 38 studies, n=2,557 healthy
    // subjects. Exercise → CRP: SMD=-0.18 (95% CI -0.31 to -0.06, p=0.005) — small
    // but significant. Confidence: medium-high. MISMATCH: healthy subjects, not
    // AD/inflammatory-disease-specific. SMD×20=-3.6→-4.
    ex: -4,
    // Li, Huang, Zheng & Wu 2014, PLOS ONE 9(2):e88103. Meta-analysis, 68 RCTs,
    // n=4,601 (healthy subgroup: 17 studies). Omega-3 → CRP (healthy subgroup):
    // -16.5% (95% CI -0.28 to -0.08 mg/L, p=0.001). Confidence: medium (high
    // heterogeneity across the full pool). MISMATCH: no AD/dementia subgroup in
    // this review. Direct % used: -16.
    o3: -16,
    // No claimed/plausible direct anti-inflammatory pathway for CST — structural
    // zero (CST is cognitive/behavioral, not immunomodulatory).
    cst: 0,
    // Grasmann et al. 2023, Int J Molecular Sciences. 3-level meta-analysis, 33
    // RCTs, n=2,880. Meditation → inflammation biomarkers: Hedges' g=0.13, 95% CI
    // -0.01 to 0.28 — NOT STATISTICALLY SIGNIFICANT (CI crosses zero). Set near
    // zero rather than at a point estimate: this is "no reliable evidence of an
    // effect," not a confirmed small effect. (Meditation's own inflammation-adjacent
    // effect — cortisol/stress biomarkers — was significant, g=-0.20, but that is a
    // different outcome than the CRP/IL-6/NF-κB markers this model tracks.)
    med: -2,
  },
};
/* Synergy term REMOVED 2026-09-10: no trial anywhere combines all four
   interventions, so there is nothing to calibrate an interaction effect
   against (FINGER 2015 has no factorial arms). The model now sums the
   literature-derived single-intervention effects only. */
/* Structural model coefficients, tunable live via "Tune model coefficients"
   for sensitivity analysis. K_DEF holds the defaults (values documented above
   and in trajectory() comments); K is the live copy the sliders mutate. */
const K_DEF = {
  apoeRisk: 0.45,   // APOE-ε4 degradation multiplier per allele copy
  nBdnf: 0.5,       // BDNF → neuroplasticity weight (drives hippocampal regrowth)
  nCbf: 0.3,        // cerebral blood flow → neuroplasticity weight
  nInflam: 0.35,    // neuroinflammation penalty on neuroplasticity
  regrow: 1.15,     // hippocampal regrowth rate (per month, × neuroplasticity)
  atrophy: 0.75,    // hippocampal atrophy rate (per month, × APOE factor)
  plaqueGrow: 0.9,  // amyloid accrual rate (per month, × APOE factor)
  // CST → cognition, RECALIBRATED 2026-09-08: Woods et al. 2023 Cochrane update
  // (25 studies, n=1,893) reports MMSE +1.99 pts [1.24, 2.74] vs usual care.
  // 0.08/mo × 24 mo ≈ +1.9 pts at 100% dose (previous hardcoded 0.33 implied
  // +7.9 pts — ~4× the literature).
  cstCog: 0.08,
  // Meditation → cognition, NEW direct path 2026-09-08: Shi et al. 2025 meta
  // (25 RCTs, n=2,095, SCD/MCI/AD) reports MMSE +2.22 pts [0.83, 3.62].
  // 0.09/mo × 24 mo ≈ +2.2 pts at 100% dose.
  medCog: 0.09,
};
const K = { ...K_DEF };
const state = { o3:.6, ex:.6, cst:.6, med:.3, apoe:1, month:0 };

function trajectory(p){
  const apoeF = 1 + p.apoe*K.apoeRisk;
  const out = { bdnf:[], cbf:[], inflam:[], neuro:[], hippo:[], plaque:[], cog:[], npi:[], dopa:[] };
  let hippo = 100, plaque = 28 + p.apoe*11, cog = 24, dopa = 88;
  for(let m=0; m<=MONTHS; m++){
    const bdnf   = clamp(W.bdnf.base + p.ex*W.bdnf.ex + p.o3*W.bdnf.o3 + p.cst*W.bdnf.cst + p.med*W.bdnf.med, 0, 100);
    const cbf    = clamp(W.cbf.base  + p.ex*W.cbf.ex  + p.o3*W.cbf.o3  + p.med*W.cbf.med, 0, 100);
    const inflam = clamp(W.inflam.base + p.ex*W.inflam.ex + p.o3*W.inflam.o3 + p.med*W.inflam.med + p.apoe*8, 0, 100);
    const neuro  = clamp((bdnf*K.nBdnf + cbf*K.nCbf - inflam*K.nInflam), 0, 100);
    const npi    = clamp(0.34*bdnf + 0.22*neuro + 0.18*cbf + 0.26*(100-inflam), 0, 100);
    out.bdnf.push(bdnf); out.cbf.push(cbf); out.inflam.push(inflam); out.neuro.push(neuro); out.npi.push(npi);
    out.hippo.push(hippo); out.plaque.push(plaque); out.cog.push(cog); out.dopa.push(dopa);
    const atrophy   = K.atrophy * apoeF;
    const regrow    = neuro/100 * K.regrow;
    hippo  = clamp(hippo - atrophy + regrow - inflam*0.004, 55, 108);
    const growth    = K.plaqueGrow * apoeF;
    const clearance = (p.o3*0.55 + p.ex*0.5) * (1 + p.apoe*0.3);
    plaque = clamp(plaque + growth - clearance, 0, 100);
    const fromBrain = (hippo-90)*0.03 - (plaque-30)*0.014;
    cog = clamp(cog + fromBrain + p.cst*K.cstCog + p.med*K.medCog - 0.07*apoeF, 0, 30);
    // nigral dopamine loss, RECALIBRATED 2026-09-08: Marek et al. 2001 (Neurology,
    // serial DAT SPECT, n=56) measured −11.2%/yr striatal dopaminergic loss in
    // untreated PD (0.8%/yr in healthy controls). 0.95/mo × 24 ≈ −26% of the
    // 88-point baseline ≈ the trial's −22.4%/24mo (previous 1.9 was ~2× too steep).
    const pdDecline = p.pd ? 0.95*(1+p.apoe*0.06) : 0.12;
    const dopaRescue = (p.pd ? (p.ex*0.9 + p.med*0.8) : p.ex*0.2) * 0.6;  // exercise/meditation slow it (Kaagman 2024 BDNF SMD 1.2; Kwok 2019)
    dopa = clamp(dopa - pdDecline + dopaRescue, 15, 100);
  }
  return out;
}

/* ============================================================
   2. CHARTS
   ============================================================ */
const SERIES = [
  { key:'cog',    label:'Cognition (MMSE 0–30)', color:'#4fbd72', shape:'circle',   max:30, on:true },
  { key:'hippo',  label:'Hippocampal volume %',  color:'#6f93ad', shape:'square',   max:110, on:true },
  { key:'npi',    label:'Neuroplasticity index', color:'#5aa8a0', shape:'triangle', max:100, on:true },
  { key:'plaque', label:'Amyloid plaque load',   color:'#e2705f', shape:'diamond',  max:100, on:true },
  { key:'bdnf',   label:'BDNF',                  color:'#9a8aa8', shape:'cross',    max:100, on:false },
];
/* marker shapes double-encode series identity so lines don't rely on hue alone (colorblind-safe) */
function drawMarker(g,x,y,shape,color){
  g.fillStyle = color; g.strokeStyle = color; g.beginPath();
  if(shape==='circle'){ g.arc(x,y,2.6,0,Math.PI*2); g.fill(); }
  else if(shape==='square'){ g.rect(x-2.4,y-2.4,4.8,4.8); g.fill(); }
  else if(shape==='triangle'){ g.moveTo(x,y-3.2); g.lineTo(x+3,y+2.4); g.lineTo(x-3,y+2.4); g.closePath(); g.fill(); }
  else if(shape==='diamond'){ g.moveTo(x,y-3.4); g.lineTo(x+3.4,y); g.lineTo(x,y+3.4); g.lineTo(x-3.4,y); g.closePath(); g.fill(); }
  else { g.lineWidth=1.6; g.moveTo(x-2.8,y-2.8); g.lineTo(x+2.8,y+2.8); g.moveTo(x+2.8,y-2.8); g.lineTo(x-2.8,y+2.8); g.stroke(); }
}
function drawChart(tr, base){
  const c = $('#chart'), g = c.getContext('2d');
  const W0 = c.width, H0 = c.height, padL = 58, padR = 6, padT = 14, padB = 34;
  const pw = W0-padL-padR, ph = H0-padT-padB;
  g.clearRect(0,0,W0,H0);
  g.strokeStyle = '#3a3632'; g.lineWidth = 1;
  for(let i=0;i<=4;i++){ const y = padT + ph*i/4; g.beginPath(); g.moveTo(padL,y); g.lineTo(W0-padR,y); g.stroke(); }
  g.fillStyle = '#928879'; g.font = '10px ui-monospace,"SF Mono",monospace';
  g.textAlign='right';
  for(let i=0;i<=4;i++){ const y = padT + ph*i/4; g.fillText((100-i*25)+'%', padL-7, y+3.5); }
  g.textAlign='center';
  for(let m=0;m<=MONTHS;m+=6){ const x = padL + pw*m/MONTHS; g.fillText(String(m), x, H0-padB+13); }
  g.fillText('Time (months)', padL+pw/2, H0-4);
  g.save(); g.translate(11, padT+ph/2); g.rotate(-Math.PI/2); g.fillText('Level (% of series max)', 0, 0); g.restore();
  g.textAlign='left';
  const plot = (arr, max, color, dash, shape) => {
    g.beginPath(); g.setLineDash(dash?[4,4]:[]); g.strokeStyle = color; g.lineWidth = dash?1.4:2.2;
    arr.forEach((v,m)=>{ const x = padL+pw*m/MONTHS, y = padT+ph*(1-v/max);
      m?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); g.setLineDash([]);
    if(!dash) arr.forEach((v,m)=>{ if(m%4) return; const x = padL+pw*m/MONTHS, y = padT+ph*(1-v/max); drawMarker(g,x,y,shape,color); });
  };
  SERIES.filter(s=>s.on).forEach(s=>{ plot(base[s.key], s.max, s.color, true, s.shape); plot(tr[s.key], s.max, s.color, false, s.shape); });
  const mx = padL+pw*state.month/MONTHS;
  g.strokeStyle = '#4fbd7299'; g.setLineDash([2,3]); g.beginPath(); g.moveTo(mx,padT); g.lineTo(mx,H0-padB); g.stroke(); g.setLineDash([]);
}
function shapeSwatch(shape,color){
  const shapes = {
    circle: `<circle cx="6" cy="6" r="3.4" fill="${color}"/>`,
    square: `<rect x="2.6" y="2.6" width="6.8" height="6.8" fill="${color}"/>`,
    triangle: `<polygon points="6,1.5 10.5,9.5 1.5,9.5" fill="${color}"/>`,
    diamond: `<polygon points="6,1 11,6 6,11 1,6" fill="${color}"/>`,
    cross: `<path d="M2.3 2.3l7.4 7.4M9.7 2.3l-7.4 7.4" stroke="${color}" stroke-width="1.8"/>`,
  };
  return `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${shapes[shape]}</svg>`;
}
function buildChartLegend(){
  $('#chartLegend').innerHTML = SERIES.map(s=>
    `<span style="cursor:pointer;opacity:${s.on?1:.4}" data-s="${s.key}" title="Click to ${s.on?'hide':'show'} this series">${shapeSwatch(s.shape,s.color)}${s.label}</span>`).join('');
  $('#chartLegend').querySelectorAll('span').forEach(el=>el.onclick=()=>{
    const s = SERIES.find(x=>x.key===el.dataset.s); s.on=!s.on; buildChartLegend(); refresh();
  });
}

/* ============================================================
   3. 3D scene helper + label
   ============================================================ */
function makeScene(vp){
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, vp.clientWidth/vp.clientHeight, 0.1, 100);
  const r = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
  r.localClippingEnabled = true;
  r.setPixelRatio(Math.min(devicePixelRatio,2)); r.setSize(vp.clientWidth, vp.clientHeight);
  vp.appendChild(r.domElement);
  const ctrl = new OrbitControls(cam, r.domElement);
  ctrl.enableDamping = true; ctrl.autoRotateSpeed = 0.6;
  ctrl.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x33262b, 1.0));
  const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(4,6,5); scene.add(d);
  const d2 = new THREE.DirectionalLight(0xffd9a0, 0.55); d2.position.set(-5,-2,-4); scene.add(d2);
  const onR = () => { cam.aspect = vp.clientWidth/vp.clientHeight; cam.updateProjectionMatrix(); r.setSize(vp.clientWidth, vp.clientHeight); };
  return { scene, cam, r, ctrl, onR };
}
// text sprite label — canvas auto-sizes to text; call sp.setText() to relabel
function label(text, color='#dfe8f2', scale=0.34, info=null, plain=false){
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent:true, depthTest:false }));
  sp.renderOrder=999; sp._scale=scale; sp._color=color; sp._plain=plain;
  if(info) sp.userData.info=info; else sp.raycast=()=>{}; // a labeled structure is clickable via its own box; purely decorative labels stay click-through to whatever's behind them
  sp.setText = t => {
    const fs=32, pad=18;
    const m=document.createElement('canvas').getContext('2d'); m.font=`bold ${fs}px sans-serif`;
    const w=Math.ceil(m.measureText(t).width)+pad*2, h=fs+18;
    const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
    const x=cv.getContext('2d'); x.font=`bold ${fs}px sans-serif`; x.textAlign='center'; x.textBaseline='middle';
    if(sp._plain){ x.lineJoin='round'; x.lineWidth=7; x.strokeStyle='rgba(8,6,4,.9)'; x.strokeText(t,w/2,h/2); }   // outlined text, no box: never hides what it labels
    else { x.fillStyle='rgba(10,7,4,.72)'; x.fillRect(0,0,w,h); }
    x.fillStyle=sp._color; x.fillText(t,w/2,h/2);
    const tex=new THREE.CanvasTexture(cv); tex.anisotropy=4;
    sp.material.map&&sp.material.map.dispose(); sp.material.map=tex; sp.material.needsUpdate=true;
    sp._aspect=w/h; sp.scale.set(sp._scale*w/h, sp._scale, 1);
  };
  sp.setText(text); return sp;
}

/* ============================================================
   3b. 3D BRAIN, dissectable, layered anatomy
   ============================================================ */
/* ---- anatomical tissue colors, sampled from fresh-tissue photos & atlas plates ---- */
/* shells keep true tissue tones; inner structures are atlas colour-coded (one distinct hue each,
   warm/green/teal only) so they read clearly through the ghosted cortex in X-ray mode */
const COL={cortex:0xc8a094,white:0xe8dccb,hippo:0xf2853d,thal:0xe0b23e,striat:0x79c46b,
  pallid:0xefe19a,nigra:0x4a2a1e,amyg:0xd9455f,cbl:0xb8978a,stem:0xd6c5b0,vdc:0xc7a97f,
  vent:0x6fd3cc,callosum:0xfff3dc,plaque:0xff4a3a,spark:0xc8ff5a,blood:0xb8322e};
const CMAX=2.0;
const brain={clip:new THREE.Plane(new THREE.Vector3(1,0,0),CMAX)};
function tmat(color,extra){return new THREE.MeshStandardMaterial(Object.assign({color,roughness:.72,metalness:.02,clippingPlanes:[brain.clip]},extra));}
// real anatomical mesh from brain_structure.js (fsaverage pial cortex + MNI152 aseg structures).
// Geometry is re-centred on its own centroid so mesh.scale shrinks/grows the structure in place.
function realMesh(key,mat,name,role){
  const {v,f}=BRAIN_MESHES[key], g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(v,3)); g.setIndex(f);
  g.computeBoundingSphere(); const c=g.boundingSphere.center.clone(); g.translate(-c.x,-c.y,-c.z);
  g.computeVertexNormals(); g.computeBoundingSphere();
  const m=new THREE.Mesh(g,mat); m.position.copy(c); m.userData.r=g.boundingSphere.radius;
  if(name) m.userData.info={name,role}; brain.root.add(m); return m;
}
// callout label: small text sprite kept OUTSIDE the brain silhouette, thin leader line + dot on the
// structure. Laid out every frame in layoutLabels(); `targets` are candidate meshes (L/R pairs), the
// one nearest the camera that survives the cross-section is used; `fixed` = anchor offset from centroid.
function callout(text,color,targets,info,inner,fixed,top=false){
  const sp=label(text,color,1,info,true); sp.visible=false; brain.root.add(sp);
  brain.labels.push({sp,targets:[].concat(targets),inner,fixed,top,anchor:new THREE.Vector3(),on:false});
}
function tagInfo(obj,name,role){ obj.traverse?obj.traverse(o=>{if(o.isMesh)o.userData.info={name,role};}):(obj.userData.info={name,role}); return obj; }
function setupInspect(o, panelSel){
  const ray=new THREE.Raycaster(), m=new THREE.Vector2(), el=o.r.domElement; let dx=0,dy=0;
  el.addEventListener('pointerdown',e=>{dx=e.clientX;dy=e.clientY;});
  el.addEventListener('click',e=>{
    if(Math.abs(e.clientX-dx)>6||Math.abs(e.clientY-dy)>6) return;           // was a rotate-drag
    const b=el.getBoundingClientRect();
    m.x=((e.clientX-b.left)/b.width)*2-1; m.y=-((e.clientY-b.top)/b.height)*2+1;
    ray.setFromCamera(m,o.cam);
    const hits=ray.intersectObjects(o.scene.children,true); let info=null;
    for(const h of hits){
      let ob=h.object, hidden=false;
      while(ob){ if(ob.visible===false){hidden=true;break;} ob=ob.parent; }
      if(hidden) continue; // three.js raycasts invisible objects too, skip hits inside a hidden group (e.g. the other DNA/protein or park/mol view)
      if(o.clip && o.clip.distanceToPoint(h.point)<0) continue;       // dissected away by the cross-section plane, raycasting ignores clip planes, so check manually
      const mat=h.object.material;
      if(mat && mat.transparent && mat.opacity<0.35) continue;        // ghosted past readability by X-ray, same as invisible for click purposes
      ob=h.object; while(ob){ if(ob.userData&&ob.userData.info){info=ob.userData.info;break;} ob=ob.parent; } if(info)break;
    }
    const p=$(panelSel); if(!p) return;
    p.innerHTML = info ? `<div class="kv"><b>${info.name}</b><span>${info.role}</span></div>`
      : '<span style="color:var(--dim2)">No labeled structure there, dissect inward (X-ray + Cross-section) or click a plaque.</span>';
  });
}
function exportPNG(o,name){ o.r.render(o.scene,o.cam); const a=document.createElement('a'); a.download=(name||'neuroai')+'.png'; a.href=o.r.domElement.toDataURL('image/png'); a.click(); }
const SECT={sagittal:[1,0,0],coronal:[0,0,-1],axial:[0,-1,0]};
const SECT_TAG={sagittal:'Sagittal section · left/right',coronal:'Coronal section · front/back',axial:'Axial section · top/bottom'};
const setRange=(el,v)=>{ el.value=v; el.style.setProperty('--p',((v-el.min)/(el.max-el.min)*100)+'%'); };
function updateViewTag(){ const t=$('#brainViewTag'); if(!t) return;
  t.textContent = +$('#dissect').value>=98 ? 'Left lateral view · whole brain' : SECT_TAG[brain.axis||'sagittal']; }
function setSection(axis){ const n=SECT[axis]||SECT.sagittal; brain.axis=axis; brain.clip.normal.set(n[0],n[1],n[2]);
  const d=$('#dissect'); if(+d.value>=98) setRange(d,55);   // picking a plane with no cut engaged would look like a dead button — open the cut so the choice shows
  setDissect(+d.value); updateInnerVis(); updateViewTag();
  $('#sectSeg')&&$('#sectSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.sect===axis)); }
function initBrain(){
  const vp=$('#brainVP');Object.assign(brain,makeScene(vp),brain);
  brain.cam.position.set(-3.95,1.0,3.5); brain.ctrl.target.set(0,-.15,0);   // left lateral, slightly anterior; fills the viewport, callout columns fit at the edges
  const root=new THREE.Group();brain.scene.add(root);brain.root=root;
  brain.shells=[];brain.labels=[];brain.showInner=false;
  const shell=(k,col,name,role,extra)=>{const m=realMesh(k,tmat(col,Object.assign({transparent:true,side:THREE.DoubleSide},extra)),name,role);brain.shells.push(m);return m;};
  const part=(k,col,name,role,extra)=>realMesh(k,tmat(col,Object.assign({roughness:.5,emissive:col,emissiveIntensity:.22},extra)),name,role);
  const cxL=shell('cortexL',COL.cortex,'Cerebral cortex','Outer grey matter, thinking, memory, reasoning.',{roughness:.6});
  const cxR=shell('cortexR',COL.cortex,'Cerebral cortex','Outer grey matter, thinking, memory, reasoning.',{roughness:.6});
  const wm=['whiteL','whiteR'].filter(k=>BRAIN_MESHES[k]).map(k=>shell(k,COL.white,'White matter','Myelinated axon tracts wiring regions together.'));
  const cc=part('corpusCallosum',COL.callosum,'Corpus callosum','Fiber bridge connecting the two hemispheres.',{roughness:.5});
  const pair=(k,col,name,role,extra)=>['L','R'].map(s=>part(k+s,col,name,role,extra));
  const thal=pair('thalamus',COL.thal,'Thalamus','Sensory & motor relay hub to the cortex.');
  const caud=pair('caudate',COL.striat,'Caudate nucleus (striatum)','Movement & reward; dopamine target of the substantia nigra.');
  const put =pair('putamen',COL.striat,'Putamen (striatum)','Movement & reward; dopamine target of the substantia nigra.');
  pair('pallidum',COL.pallid,'Globus pallidus','Basal ganglia output, regulates movement.');
  pair('accumbens',COL.striat,'Nucleus accumbens','Reward hub of the ventral striatum; dopamine target.');
  const amyg=pair('amygdala',COL.amyg,'Amygdala','Emotion & fear processing.');
  const vdc=pair('ventralDC',COL.vdc,'Midbrain / ventral diencephalon','Hypothalamus, subthalamic nucleus & cerebral peduncles; houses the substantia nigra.');
  const vent=pair('ventricle',COL.vent,'Lateral ventricle','CSF space; enlarges as brain tissue is lost.',{roughness:.3,emissiveIntensity:.35,transparent:true,opacity:.9});
  part('ventricle3',COL.vent,'Third ventricle','CSF space between the two thalami.',{roughness:.3,transparent:true,opacity:.85});
  part('ventricle4',COL.vent,'Fourth ventricle','CSF space between brainstem and cerebellum.',{roughness:.3,transparent:true,opacity:.85});
  const bs=shell('brainstem',COL.stem,'Brainstem','Vital functions; relays signals between brain and body.',{roughness:.6});
  const cbl=shell('cerebellum',COL.cbl,'Cerebellum','Balance, coordination & motor timing.',{roughness:.65});
  // substantia nigra: dark neuromelanin sheet in the midbrain, under each thalamus (not a separate aseg label,
  // so placed at the ventral-diencephalon centroid). Shrinks & fades with dopamine in Parkinson's mode.
  brain.sn=new THREE.Group(); root.add(brain.sn);
  const snInfo={name:'Substantia nigra',role:'Dopamine source; degenerates in Parkinson’s disease.'};
  vdc.forEach(v=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),tmat(COL.nigra,{roughness:.5,emissive:0x3a1408,emissiveIntensity:.5}));
    m.position.copy(v.position).add(new THREE.Vector3(0,-.04,-.06)); m.scale.set(.09,.045,.2); m.userData.base=m.scale.clone(); m.userData.r=.2; m.userData.info=snInfo; brain.sn.add(m);});
  // hippocampus: shared material so colour/emissive track the sim; each side scales about its own centroid
  brain.hipMat=tmat(COL.hippo,{roughness:.5,emissive:COL.hippo,emissiveIntensity:.25});
  brain.hip=new THREE.Group(); root.add(brain.hip);
  const hipInfo={name:'Hippocampus',role:'Learning & memory; atrophies early in Alzheimer’s.'};
  ['hippocampusL','hippocampusR'].forEach(k=>{const m=realMesh(k,brain.hipMat,hipInfo.name,hipInfo.role); brain.hip.add(m);});
  // callouts (≤10 on screen; text lives outside the silhouette, leader lines point in)
  callout('Cerebral cortex','#f2d6ca',[cxL,cxR],cxL.userData.info,false,new THREE.Vector3(0,1.1,.3),true);
  callout('Cerebellum','#f0cbb8',cbl,cbl.userData.info,false);
  callout('Brainstem','#e8c7ac',bs,bs.userData.info,false,new THREE.Vector3(0,-.55,0));
  callout('Hippocampus','#ffa66a',brain.hip.children,hipInfo,false);
  callout('Corpus callosum','#fff3dc',cc,cc.userData.info,true,new THREE.Vector3(0,.15,0));
  callout('Thalamus','#f5cd5a',thal,thal[0].userData.info,true);
  callout('Basal ganglia (striatum)','#9ee08c',[...caud,...put],{name:'Basal ganglia (striatum)',role:'Caudate + putamen: movement & reward; dopamine target of the substantia nigra.'},true);
  callout('Amygdala','#ff7a92',amyg,amyg[0].userData.info,true);
  callout('Lateral ventricle','#8ff0e6',vent,vent[0].userData.info,true);
  callout('Substantia nigra','#d9906a',brain.sn.children,snInfo,true);
  // leader lines + anchor dots (screen-space overlay, rebuilt each frame)
  const N=brain.labels.length;
  brain.leaders=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xf4ece4,transparent:true,opacity:.75,depthTest:false}));
  brain.leaders.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*6),3)); brain.leaders.renderOrder=998; brain.leaders.raycast=()=>{}; root.add(brain.leaders);
  brain.dots=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:0xf4ece4,size:5,sizeAttenuation:false,depthTest:false}));
  brain.dots.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3)); brain.dots.renderOrder=998; brain.dots.raycast=()=>{}; root.add(brain.dots);
  // silhouette: bounding sphere of the whole cerebrum, used to push labels outside it
  const box=new THREE.Box3().setFromObject(cxL).union(new THREE.Box3().setFromObject(cxR));
  brain.centre=box.getCenter(new THREE.Vector3()); brain.radius=box.getSize(new THREE.Vector3()).length()/2*.92;
  brain.plaques=[];const pg=new THREE.SphereGeometry(.06,10,10),pm=tmat(COL.plaque,{emissive:0x8a1a0c,emissiveIntensity:.6,roughness:.4});
  for(let i=0;i<60;i++){const cx=i%2?cxL:cxR, P=cx.geometry.attributes.position, k=(i*331)%P.count;   // pseudo-random cortex vertex, just under the pia
    const m=new THREE.Mesh(pg,pm);m.position.set(P.getX(k),P.getY(k),P.getZ(k)).multiplyScalar(.96).add(cx.position);m.visible=false;m.userData.info={name:'Amyloid-β plaque',role:'Toxic protein clump, a hallmark of Alzheimer’s.'};root.add(m);brain.plaques.push(m);}
  brain.sparks=[];const sg=new THREE.SphereGeometry(.045,8,8),sm=new THREE.MeshBasicMaterial({color:COL.spark});
  for(let i=0;i<40;i++){const m=new THREE.Mesh(sg,sm);m.visible=false;root.add(m);brain.sparks.push(m);
    const h=brain.hip.children[i%2], r=h.userData.r, a=i*2.4;
    m.position.copy(h.position).add(new THREE.Vector3(Math.cos(a)*.35*r,(((i*5)%7)/7-.5)*.5*r,Math.sin(a)*.8*r));}
  brain.blood=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),new THREE.MeshBasicMaterial({color:COL.blood,transparent:true,opacity:.05,side:THREE.BackSide}));
  brain.blood.position.copy(brain.centre); brain.blood.scale.copy(box.getSize(new THREE.Vector3()).multiplyScalar(.62)); root.add(brain.blood);
  setGhost(15);setDissect(100);updateInnerVis();
  setupInspect(brain,'#brainInspect');
  animateBrain();
}
function setGhost(v){const o=clamp((115-v)/100,.15,1);brain.shells.forEach(m=>{if(m.material){m.material.opacity=o;m.material.transparent=true;m.material.depthWrite=o>.95;}});} // slider right = more transparent
function setDissect(v){brain.clip.constant=(v/100)*CMAX;}
function updateInnerVis(){brain.showInner=(+$('#ghost').value>43)||(+$('#dissect').value<96);}
// Per-frame label layout (see callout): project each anchor, push the text radially outside the projected
// brain silhouette, sort into left/right sides and space rows apart so no label covers anatomy or another label.
const _a=new THREE.Vector3(),_b=new THREE.Vector3();
function layoutLabels(){
  const cam=brain.cam,W=brain.r.domElement.clientWidth,H=brain.r.domElement.clientHeight,PX=17,ROW=PX+7,GAP=26;
  const depth=-_a.copy(brain.centre).applyMatrix4(cam.matrixWorldInverse).z;
  const pxPerWorld=(H/2)/(Math.tan(cam.fov*Math.PI/360)*depth), Rpx=brain.radius*pxPerWorld;
  const cp=_a.copy(brain.centre).project(cam), cx=(cp.x+1)/2*W, cy=(1-cp.y)/2*H, zN=cp.z;
  const sides={l:[],r:[],t:[]};
  for(const L of brain.labels){
    L.on=false; if(L.inner&&!brain.showInner){L.sp.visible=false;continue;}
    let best=null,bd=1e9;
    for(const t of L.targets){
      t.getWorldPosition(_b); const r=(t.userData.r||.3)*t.scale.x;
      if(L.fixed) _b.add(L.fixed); else _b.add(_a.copy(cam.position).sub(_b).normalize().multiplyScalar(r*.85)); // surface point facing the camera
      if(brain.clip.distanceToPoint(_b)<0) continue;                                                            // dissected away
      const d=_b.distanceToSquared(cam.position); if(d<bd){bd=d;best=_b.clone();}
    }
    if(!best){L.sp.visible=false;continue;}
    L.on=true; L.anchor.copy(best);
    const p=best.clone().project(cam), ax=(p.x+1)/2*W, ay=(1-p.y)/2*H;
    L.w=L.sp._aspect*PX;
    if(L.top){ L.x=ax; L.y=Math.min(ay,cy-Rpx)-GAP; sides.t.push(L); continue; }              // above the silhouette
    const r=ax>=cx; L.y=ay; L.x=r?Math.max(cx+Rpx,ax)+GAP:Math.min(cx-Rpx,ax)-GAP;             // column just outside the silhouette
    sides[r?'r':'l'].push(L);
  }
  const Y0=44,Y1=H-40;                                                       // keep clear of the corner tags
  for(const s in sides){ const arr=sides[s].sort((a,b)=>a.y-b.y);
    for(const L of arr) L.y=clamp(L.y,Y0,Y1);
    for(let i=1;i<arr.length;i++) if(arr[i].y<arr[i-1].y+ROW) arr[i].y=arr[i-1].y+ROW;
    for(let i=arr.length-1;i>=0;i--){ const lim=i===arr.length-1?Y1:arr[i+1].y-ROW; if(arr[i].y>lim) arr[i].y=lim; }   // relax back up if pushed off the bottom
    for(const L of arr){
      if(s==='t'){ L.x=clamp(L.x,8+L.w/2,W-8-L.w/2); L.sp.center.set(.5,.5); }
      else { L.x=s==='r'?clamp(L.x,0,W-8-L.w):clamp(L.x,8+L.w,W); L.sp.center.set(s==='r'?0:1,.5); }
      L.sp.position.set(L.x/W*2-1,1-L.y/H*2,zN).unproject(cam);
      L.sp.scale.set(L.w/pxPerWorld,PX/pxPerWorld,1); L.sp.visible=true;
    }}
  const lp=brain.leaders.geometry.attributes.position, dp=brain.dots.geometry.attributes.position; let n=0;
  for(const L of brain.labels){ if(!L.on) continue;
    lp.setXYZ(n*2,L.anchor.x,L.anchor.y,L.anchor.z); lp.setXYZ(n*2+1,L.sp.position.x,L.sp.position.y,L.sp.position.z);
    dp.setXYZ(n,L.anchor.x,L.anchor.y,L.anchor.z); n++; }
  lp.needsUpdate=dp.needsUpdate=true; brain.leaders.geometry.setDrawRange(0,n*2); brain.dots.geometry.setDrawRange(0,n);
}
function updateBrain(){
  if(!brain.hip)return;const tr=brain._tr,m=state.month;
  const hip=tr.hippo[m],plaque=tr.plaque[m],cbf=tr.cbf[m],neuro=tr.neuro[m],dopa=tr.dopa[m];
  if(brain.sn){ const f=dopa/100;
    brain.sn.children.forEach(c=>{ c.scale.copy(c.userData.base).multiplyScalar(0.55+0.45*f); c.material.color.copy(lerpC(new THREE.Color(0x6f6153),new THREE.Color(COL.nigra),f)); }); }
  brain.hip.children.forEach(c=>c.scale.setScalar(clamp(hip/100,.6,1.08)));
  brain.hipMat.color.copy(lerpC(new THREE.Color(0x8a7a70),new THREE.Color(COL.hippo),(hip-60)/48));
  brain.hipMat.emissiveIntensity=.15+.35*neuro/100;
  const nP=Math.round(plaque/100*60);brain.plaques.forEach((p,i)=>p.visible=i<nP);
  const nS=Math.round(neuro/100*40);brain.sparks.forEach((p,i)=>p.visible=i<nS);
  brain.blood.material.opacity=.03+.16*cbf/100;
  $('#brainMonthTag').textContent=`Month ${m} · plaques ${plaque.toFixed(0)} · flow ${cbf.toFixed(0)} · dopamine ${dopa.toFixed(0)}`;
}
function animateBrain(){
  requestAnimationFrame(animateBrain);
  if(!isActive('sim')) return;
  brain.ctrl.update(); layoutLabels(); brain.r.render(brain.scene, brain.cam);
}

/* ============================================================
   4. 3D APOE  (DNA helix + protein domains)
   ============================================================ */
const ISO = {
  2:{ name:'ε2', col:'#5fae7a', r112:'Cys', r158:'Cys', s429:'T', s7412:'T' },
  3:{ name:'ε3', col:'#8a95a3', r112:'Cys', r158:'Arg', s429:'T', s7412:'C' },
  4:{ name:'ε4', col:'#e2705f', r112:'Arg', r158:'Arg', s429:'C', s7412:'C' },
};
const apoe = { iso:3, view:'dna', fix:false };

function initApoe(){
  const vp = $('#geneVP');
  Object.assign(apoe, makeScene(vp), apoe);
  apoe.cam.position.set(0,0,9);
  apoe.dna = buildDNA(); apoe.scene.add(apoe.dna);
  apoe.prot = buildProtein(); apoe.prot.visible=false; apoe.scene.add(apoe.prot);
  setupInspect(apoe,'#apoeInspect');
  animateApoe(); setIso(3); setView('dna');
}
function buildDNA(){
  const g = new THREE.Group();
  const N = 34, rise = 0.34, rad = 1.1, turn = 0.6;
  const backA=new THREE.MeshStandardMaterial({color:0x4a90c4,roughness:.5});
  const backB=new THREE.MeshStandardMaterial({color:0x46bfa0,roughness:.5});
  const rungMat=new THREE.MeshStandardMaterial({color:0x8493a0,roughness:.6});
  const sph=new THREE.SphereGeometry(0.17,14,14);
  g.snpNodes={};
  const backboneInfo={name:'Sugar-phosphate backbone',role:"The structural chain of the DNA strand; genetic information lives in the attached bases, not here."};
  const basePairInfo={name:'Base pair',role:'Hydrogen-bonded rung connecting the two strands.'};
  for(let i=0;i<N;i++){
    const a=i*turn, y=(i-N/2)*rise;
    const p1=new THREE.Vector3(Math.cos(a)*rad,y,Math.sin(a)*rad);
    const p2=new THREE.Vector3(Math.cos(a+Math.PI)*rad,y,Math.sin(a+Math.PI)*rad);
    const s1=new THREE.Mesh(sph,backA); s1.position.copy(p1); s1.userData.info=backboneInfo; g.add(s1);
    const s2=new THREE.Mesh(sph,backB); s2.position.copy(p2); s2.userData.info=backboneInfo; g.add(s2);
    const rung=cyl(p1,p2,0.045,rungMat); rung.userData.info=basePairInfo; g.add(rung);
    if(i===11){ g.snpNodes.s429={base:s1, pos:p1.clone()}; }
    if(i===23){ g.snpNodes.s7412={base:s1, pos:p1.clone()}; }
  }
  const snpInfo={
    s429:{name:'rs429358 (codon 112)',role:'This SNP defines codon 112, a T allele encodes Cys112 (ε2/ε3), a C allele encodes Arg112 (ε4).'},
    s7412:{name:'rs7412 (codon 158)',role:'This SNP defines codon 158, a C allele encodes Arg158 (ε3/ε4), a T allele encodes Cys158 (ε2).'},
  };
  ['s429','s7412'].forEach(k=>{
    const node=g.snpNodes[k];
    node.base.userData.info=snpInfo[k];
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.32,0.04,10,24),
      new THREE.MeshStandardMaterial({color:0xdfeaf2,emissive:0x1a2630}));
    ring.position.copy(node.pos); ring.userData.info=snpInfo[k]; g.add(ring); node.ring=ring;
  });
  const lab=(t,c,pos,sc,info)=>{const l=label(t,c,sc,info);l.position.copy(pos);g.add(l);return l;};
  g.lab429  = lab('rs429358 · codon 112','#cfe4f2', g.snpNodes.s429.pos.clone().add(new THREE.Vector3(0,0.55,0)),.62,snpInfo.s429);
  g.lab7412 = lab('rs7412 · codon 158','#cfe4f2', g.snpNodes.s7412.pos.clone().add(new THREE.Vector3(0,0.55,0)),.6,snpInfo.s7412);
  lab("5' sugar-phosphate backbone",'#9fc4d8', new THREE.Vector3(0, N/2*rise+0.3,0),.7,backboneInfo);
  g.rotation.z=0.06;
  return g;
}
function cyl(a,b,r,mat){
  const d=new THREE.Vector3().subVectors(b,a), len=d.length();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d.clone().normalize());
  return m;
}
/* Real backbone: Cα trace of PDB 2L7B (full-length human ApoE, NMR model 1),
   rendered cartoon-style — thick coiled tubes for the 12 real α-helices, thin
   worms for loops, colored by domain. Residue markers sit at their true
   positions on the fold. */
function buildProtein(){
  const g=new THREE.Group();
  const pos=new Map(APOE_CA.map(([r,x,y,z])=>[r,new THREE.Vector3(x,y,z)]));
  const P=r=>pos.get(r).clone();
  const NRES=APOE_CA.length, CT_START=201;                 // hinge ends ~200; C-terminal domain 201–299
  const inHelix=r=>APOE_HELICES.some(([a,b])=>r>=a&&r<=b);
  const nGrp=new THREE.Group(), cGrp=new THREE.Group();
  g.add(nGrp); g.add(cGrp); g.nGrp=nGrp; g.cGrp=cGrp;
  const SEG={
    nt:   {col:0x5fbf9f, info:{name:'N-terminal domain (four-helix bundle)',role:'Receptor-binding domain, four long α-helices packed side-by-side that dock ApoE into the LDL receptor.'}},
    ldlr: {col:0xf0c05a, info:{name:'LDLR-binding region (136–150)',role:'Where ApoE engages the LDL receptor to clear lipids from the bloodstream, a stretch of helix 4.'}},
    hinge:{col:0xb9a98c, info:{name:'Hinge region',role:'Flexible tether between the N- and C-terminal domains.'}},
    ct:   {col:0xe0876a, info:{name:'C-terminal domain (lipid-binding)',role:'Amphipathic helices that anchor ApoE to lipoprotein particles; folds back against the bundle.'}},
  };
  const segOf=r=> (r>=136&&r<=150)?'ldlr' : r<=163?'nt' : r<=200?'hinge' : 'ct';
  // walk the chain, emitting one tube per contiguous run of (segment, helix/loop)
  let run=[1];
  const flush=(endR)=>{
    const r0=run[0], key=segOf(r0), hel=inHelix(r0);
    const pts=[]; for(let r=Math.max(1,r0-1); r<=Math.min(NRES,endR+1); r++) pts.push(P(r)); // 1-residue overlap keeps the chain visually continuous
    if(pts.length<2) return;
    const tube=new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length*3, hel?0.058:0.026, 8),
      new THREE.MeshStandardMaterial({color:SEG[key].col,roughness:hel?.45:.6}));
    tube.userData.info=SEG[key].info;
    (r0>=CT_START?cGrp:nGrp).add(tube);
  };
  for(let r=2;r<=NRES;r++){
    const prev=run[run.length-1];
    if(segOf(r)!==segOf(prev) || inHelix(r)!==inHelix(prev) || (r>=CT_START)!==(prev>=CT_START)){ flush(prev); run=[r]; }
    else run.push(r);
  }
  flush(NRES);
  const resGeo=new THREE.SphereGeometry(0.16,16,16);
  const UP=new THREE.Vector3(0,0,0.42);                    // local z = world vertical after the group rotation below
  const mkRes=(name,r,col,role,parent)=>{ const m=new THREE.Mesh(resGeo,new THREE.MeshStandardMaterial({color:col,emissive:0x111111}));
    m.position.copy(P(r)); m.userData.info={name,role}; parent.add(m);
    const l=label(name,'#fff',.3,{name,role}); l.position.copy(P(r).add(UP)); parent.add(l);
    return {mesh:m,lab:l}; };
  g.res112 = mkRes('112',112, 0x5fae7a,'Cys112 (ε2/ε3) or Arg112 (ε4), sits on helix 3; its identity repositions Arg61 in ApoE4.',nGrp);
  g.res158 = mkRes('158',158, 0x8a95a3,'Arg158 (ε3/ε4, common) or Cys158 (ε2), on helix 4, defines the second SNP.',nGrp);
  g.res61  = mkRes('Arg61',61, 0xf0d68a,'On helix 2. In ApoE4, repositioned by Arg112 to form a salt bridge with Glu255, the pathogenic domain interaction.',nGrp);
  g.res255 = mkRes('Glu255',255,0xf0d68a,'On the long C-terminal helix. Partners with Arg61 in ApoE4 to form the salt bridge that locks the domains together.',cGrp);
  // 2L7B is the ApoE3 pose: 61 and 255 far apart. ε4 rigid-body swings the CT
  // domain ~55% of the way toward Arg61 to close the salt bridge; the bridge rod
  // is built at that clamped pose and only shown once ε4 is selected.
  g.ctClamp = P(61).sub(P(255)).multiplyScalar(0.55);
  const p255e4 = P(255).add(g.ctClamp);
  g.bridge = cyl(P(61), p255e4, 0.045,
    new THREE.MeshStandardMaterial({color:0xe2705f,emissive:0x2a0c08}));
  g.bridge.userData.info={name:'Domain interaction (salt bridge)',role:'The Arg61–Glu255 bond unique to ApoE4, the removable pathogenic feature; a structure corrector breaks it.'};
  g.bridge.visible=false; g.add(g.bridge);
  g.bridgeLab = label('domain interaction','#ff9a9a',.32,g.bridge.userData.info);
  g.bridgeLab.position.copy(P(61).lerp(p255e4,.5).add(new THREE.Vector3(0.9,0,0)));
  g.bridgeLab.visible=false; g.add(g.bridgeLab);
  const centroid=(a,b)=>{const c=new THREE.Vector3();for(let r=a;r<=b;r++)c.add(P(r));return c.multiplyScalar(1/(b-a+1));};
  const lab=(t,c,posV,sc,info,parent)=>{const l=label(t,c,sc,info);l.position.copy(posV);(parent||g).add(l);};
  lab('N-terminal · receptor-binding','#a9e0cc', centroid(24,163).add(new THREE.Vector3(0,0,1.1)),.38,SEG.nt.info,nGrp);
  lab('LDLR-binding 136–150','#f0d08a', P(143).add(new THREE.Vector3(0,0,-0.55)),.34,SEG.ldlr.info,nGrp);
  lab('C-terminal · lipid-binding','#f0b09a', centroid(210,299).add(new THREE.Vector3(0,0,-1.1)),.38,SEG.ct.info,cGrp);
  lab(`Backbone: PDB ${APOE_PDB} (NMR)`,'#9aa89f', new THREE.Vector3(0,0,3.5),.3,
    {name:`PDB ${APOE_PDB}`,role:'This shape is the real experimentally-solved backbone of human ApoE (full-length NMR structure), drawn as a Cα cartoon.'});
  g.rotation.x=-Math.PI/2;                                  // long bundle axis (data z) → vertical
  g.scale.setScalar(1.0);
  return g;
}
function updateApoe(){
  const iso=ISO[apoe.iso], isE4 = apoe.iso===4 && !apoe.fix;
  const baseCol = b => b==='C' ? 0xe2705f : 0x5fae7a;
  const nd=apoe.dna.snpNodes;
  nd.s429.base.material = new THREE.MeshStandardMaterial({color:baseCol(iso.s429),emissive:0x111111});
  nd.s7412.base.material= new THREE.MeshStandardMaterial({color:baseCol(iso.s7412),emissive:0x111111});
  apoe.dna.lab429.setText(`rs429358 = ${iso.s429} → ${iso.r112}112`);
  apoe.dna.lab7412.setText(`rs7412 = ${iso.s7412} → ${iso.r158}158`);
  apoe.prot.res112.mesh.material.color.set(iso.r112==='Arg'?0xe2705f:0x5fae7a);
  apoe.prot.res112.lab.setText(`${iso.r112}112`);
  apoe.prot.res158.mesh.material.color.set(iso.r158==='Arg'?0xe2705f:0x5fae7a);
  apoe.prot.res158.lab.setText(`${iso.r158}158`);
  apoe.prot.bridge.visible = isE4; apoe.prot.bridgeLab.visible = isE4;
  // ε4 (uncorrected) swings the CT domain toward Arg61 to close the salt bridge;
  // ε2/ε3/corrector relax back to the open PDB (ApoE3) pose — animated in animateApoe
  apoe.prot._ctTarget = isE4 ? apoe.prot.ctClamp : new THREE.Vector3();
  $('#isoTag').textContent = `Isoform ${iso.name}${apoe.fix?' + corrector':''}`;
}
function animateApoe(){
  requestAnimationFrame(animateApoe);
  if(!isActive('apoe')) return;
  if(apoe.prot&&apoe.prot._ctTarget) apoe.prot.cGrp.position.lerp(apoe.prot._ctTarget,0.06);
  apoe.ctrl.update(); apoe.r.render(apoe.scene, apoe.cam);
}
function setView(v){
  apoe.view=v; apoe.dna.visible=(v==='dna'); apoe.prot.visible=(v==='protein');
  $('#viewSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  $('#geneTag').textContent = v==='dna' ? 'Double helix · codons 112 & 158' : `Folded protein · real backbone, PDB ${APOE_PDB}`;
  $('#proteinCard').style.opacity = v==='protein'?1:.55;
  apoe.cam.position.set(0,0, v==='dna'?9:10.5);
  $('#geneLegend').innerHTML = v==='dna'
    ? '<span><i style="background:#5fae7a"></i>T allele (→Cys)</span><span><i style="background:#e2705f"></i>C allele (→Arg)</span><span><i style="background:#4a90c4"></i>strand A</span><span><i style="background:#46bfa0"></i>strand B</span><span><i style="background:#8493a0"></i>base pair</span>'
    : '<span><i style="background:#5fbf9f"></i>N-terminal four-helix bundle</span><span><i style="background:#f0c05a"></i>LDLR-binding 136–150</span><span><i style="background:#b9a98c"></i>hinge</span><span><i style="background:#e0876a"></i>C-terminal domain</span><span><i style="background:#e2705f"></i>salt bridge (ε4)</span><span><i style="background:#f0d68a"></i>key residue</span>';
}
function setIso(n){
  apoe.iso=n;
  $('#isoSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active',+b.dataset.iso===n));
  const iso=ISO[n];
  $('#snpTbl').innerHTML = `<tr><th>Marker</th><th>Allele</th><th>Codon → residue</th></tr>
    <tr><td>rs429358</td><td>${iso.s429}</td><td>${iso.r112} 112</td></tr>
    <tr><td>rs7412</td><td>${iso.s7412}</td><td>${iso.r158} 158</td></tr>
    <tr><td>Genotype</td><td colspan="2"><span class="pill e${n}">APOE ${iso.name}</span></td></tr>`;
  const risk = { 2:'~0.6× (relatively protective vs AD; ε2/ε2 linked to type III hyperlipoproteinemia)',
    3:'reference risk (most common allele, ~60–70% of people)',
    4:'~2–3× (one copy) to ~8–12× (two copies) higher AD risk' }[n];
  $('#isoInfo').innerHTML = `
    <div class="kv"><b>Allele</b><span class="pill e${n}">APOE ${iso.name}</span></div>
    <div class="kv"><b>AD risk</b><span>${risk}</span></div>
    <div class="kv"><b>Residue 112</b><span>${iso.r112}${iso.r112==='Arg'?', repositions Arg61 → pathogenic domain interaction':', no domain interaction'}</span></div>
    <div class="kv"><b>Residue 158</b><span>${iso.r158}</span></div>
    <div class="kv"><b>Locus</b><span>chromosome 19q13.32</span></div>
    <div class="kv"><b>In brain</b><span>made by astrocytes/microglia; taken up by neurons via LDLR/LRP1. ε4 also injures pericytes → blood-brain-barrier breakdown.</span></div>`;
  updateFixState(); updateApoe();
}
function updateFixState(){
  const on=apoe.fix, e4=apoe.iso===4;
  $('#fixState').innerHTML = !e4
    ? `<span class="pill e${apoe.iso}">APOE ${ISO[apoe.iso].name}</span> has no ε4 domain interaction to correct, corrector only acts on the Arg112/Arg61/Glu255 configuration unique to ε4.`
    : on ? `<span class="pill e2">Corrected</span> Arg61–Glu255 salt bridge broken → ApoE4 adopts an ApoE3-like fold. Restores lipid transport &amp; amyloid-β clearance; lowers ApoE4 fragmentation, Aβ &amp; tau phosphorylation (PH002 mechanism).`
    : `<span class="pill e4">Pathogenic</span> Arg61–Glu255 domain interaction active → impaired lipid transport, reduced Aβ clearance, neurotoxic fragmentation.`;
}

/* ============================================================
   4b. PATHOLOGY LAB, Parkinson's dopamine circuit + molecular AD
   ============================================================ */
const path = { pview:'park' };
function initPath(){
  const vp=$('#pathVP'); Object.assign(path, makeScene(vp), path);
  path.cam.position.set(2.6,1.4,5.2);
  path.park=buildPark(); path.scene.add(path.park);
  path.mol=buildMol(); path.mol.visible=false; path.scene.add(path.mol);
  setupInspect(path,'#pathInspect');
  animatePath(); setPview('park'); refreshPath();
}
// ---- Parkinson's nigrostriatal circuit ----
function buildPark(){
  const g=new THREE.Group();
  const sn=new THREE.Mesh(new THREE.CapsuleGeometry(0.34,2.2,10,20),
    new THREE.MeshStandardMaterial({color:0x2c1a10,roughness:.7}));
  sn.rotation.z=Math.PI/2; sn.position.set(0,-1.4,0); sn.userData.info={name:'Substantia nigra',role:'Dopaminergic neuron cluster; degenerates in Parkinson’s.'}; g.add(sn);
  const str=new THREE.Mesh(new THREE.SphereGeometry(0.8,32,24),
    new THREE.MeshStandardMaterial({color:0xa8705a,roughness:.6}));
  str.position.set(0,1.6,0); str.scale.set(1.3,1,1); str.userData.info={name:'Striatum',role:'Movement control; receives dopamine from the nigra.'}; g.add(str);
  path.neurons=[]; path.dopa=[];
  const axMat=new THREE.MeshStandardMaterial({color:0x8a6a4a,roughness:.6});
  const N=14;
  for(let i=0;i<N;i++){
    const x=(i/(N-1)-0.5)*3.2, z=(((i*7)%5)/5-0.5)*0.5;
    const p0=new THREE.Vector3(x,-1.4,z);
    const curve=new THREE.CatmullRomCurve3([p0,new THREE.Vector3(x*0.8,-0.4,z),new THREE.Vector3(x*0.5,0.6,z),new THREE.Vector3(x*0.28,1.5,z*0.4)]);
    const body=new THREE.Mesh(new THREE.SphereGeometry(0.16,18,14),
      new THREE.MeshStandardMaterial({color:0x3a2416,roughness:.5,emissive:0x140a04,emissiveIntensity:.5}));
    body.position.copy(p0); body.userData.info={name:'Dopaminergic neuron',role:'Makes dopamine; projects nigra→striatum.'}; g.add(body);
    const axon=new THREE.Mesh(new THREE.TubeGeometry(curve,30,0.03,8),axMat.clone()); axon.userData.info={name:'Nigrostriatal axon',role:'Carries dopamine signals to the striatum. The darker it turns, the less dopamine it is sending, and the slower that dopamine travels.'}; g.add(axon);
    path.neurons.push({body,axon,curve});
  }
  const dm=new THREE.MeshBasicMaterial({color:0xffe08a});
  for(let i=0;i<40;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8),dm); m.visible=false; g.add(m);
    m.userData.info={name:'Dopamine',role:'The neurotransmitter itself, released by the axon terminal and taken up by the striatum, its flow is what falls as substantia nigra neurons die.'};
    path.dopa.push({m,curve:path.neurons[i%N].curve,t:(i%10)/10,speed:0.004+(i%3)*0.001});
  }
  const L=(t,c,pos,sc,info)=>{const l=label(t,c,sc,info);l.position.copy(pos);g.add(l);};
  L('Substantia nigra','#e8c7a8',new THREE.Vector3(0,-2.05,0),.4,{name:'Substantia nigra',role:'Dopaminergic neuron cluster; degenerates in Parkinson’s.'});
  L('Striatum','#f0cbb8',new THREE.Vector3(0,2.55,0),.4,{name:'Striatum',role:'Movement control; receives dopamine from the nigra.'});
  L('Nigrostriatal axons','#e8d2b0',new THREE.Vector3(1.75,0.4,0),.36,{name:'Nigrostriatal axon',role:'Carries dopamine signals to the striatum. The darker it turns, the less dopamine it is sending, and the slower that dopamine travels.'});
  L('Dopamine','#ffe08a',new THREE.Vector3(-1.5,0.1,0),.34,{name:'Dopamine',role:'The neurotransmitter itself, released by the axon terminal and taken up by the striatum, its flow is what falls as substantia nigra neurons die.'});
  return g;
}
function updatePark(loss,rescue){
  const dopamine=clamp((1-loss/100)*100 + rescue*0.32, 0, 100);
  const nShow=Math.round((1-loss/100)*path.neurons.length);
  // darker axon = less dopamine being carried; particle speed falls with it too
  const axCol=lerpC(new THREE.Color(0x231106), new THREE.Color(0x8a6a4a), dopamine/100);
  path.neurons.forEach((n,i)=>{
    const alive=i<nShow;
    n.body.material.color.set(alive?0x3a2416:0x9c8b78);
    n.body.material.emissiveIntensity=alive?0.5:0.05;
    n.body.scale.setScalar(alive?1:0.6);
    if(alive) n.axon.material.color.copy(axCol);
    n.axon.material.opacity=alive?1:0.22; n.axon.material.transparent=!alive;
  });
  const nDopa=Math.round(dopamine/100*path.dopa.length);
  path.dopa.forEach((d,i)=>d.on=i<nDopa);
  path._speedF=0.25+0.75*dopamine/100;   // dark, failing axons move dopamine at ~1/4 healthy speed
  path._tremor=(100-dopamine)/100; path._dopamine=dopamine; path._motor=clamp(dopamine*0.9+8,0,100);
}
// ---- Molecular AD: plaques + tangles ----
function buildMol(){
  const g=new THREE.Group();
  const soma=new THREE.Mesh(new THREE.SphereGeometry(0.9,32,24),
    new THREE.MeshStandardMaterial({color:0xcaa184,roughness:.6})); soma.position.set(-1.6,0,0); soma.scale.set(1,1.1,1); soma.userData.info={name:'Neuron soma',role:'Cell body of the neuron.'}; g.add(soma);
  const axon=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,4,24,1,true),
    new THREE.MeshStandardMaterial({color:0xd8b48c,roughness:.6,transparent:true,opacity:.32,side:THREE.DoubleSide}));
  axon.rotation.z=Math.PI/2; axon.position.set(0.9,0,0); axon.userData.info={name:'Axon',role:'Signal projection; transport runs along the microtubules.'}; g.add(axon);
  path.mtubes=[];
  const mtMat=new THREE.MeshStandardMaterial({color:0x8fb3ad,roughness:.5});
  for(let i=0;i<5;i++){ const off=(i/4-0.5)*0.5;
    const mt=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,3.4,8),mtMat.clone());
    mt.rotation.z=Math.PI/2; mt.position.set(0.9,off,off*0.6); mt.userData.info={name:'Microtubule',role:'Transport track normally stabilized by tau.'}; g.add(mt); path.mtubes.push({mt,base:off}); }
  path.tau=[];
  const tauMat=new THREE.MeshStandardMaterial({color:0x6a4a2a,roughness:.7});
  for(let i=0;i<10;i++){ const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(0.12,0.045,40,6,2,3),tauMat);
    knot.position.set(-0.2+i*0.28,(((i*5)%7)/7-0.5)*0.5,(((i*3)%5)/5-0.5)*0.4); knot.visible=false; knot.userData.info={name:'Tau tangle (NFT)',role:'Hyperphosphorylated tau, collapses axonal transport.'}; g.add(knot); path.tau.push(knot); }
  path.fibrils=[];
  const fibMat=new THREE.MeshStandardMaterial({color:0xc84a30,roughness:.5,emissive:0x2a0a05,emissiveIntensity:.25});
  // dense Fibonacci shell hugging the soma (radius .9, y-scale 1.1) so full burden encases the whole sphere;
  // phi order is hashed so partial burden scatters over the surface instead of filling pole-down
  const NFIB=90;
  for(let i=0;i<NFIB;i++){ const a=i*2.399, rr=1.02+((i*13)%7)/28;
    const phi=Math.acos(1-2*(((i*37)%NFIB)+0.5)/NFIB);
    const seg=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.3,6),fibMat);
    seg.position.set(-1.6+rr*Math.sin(phi)*Math.cos(a), rr*Math.cos(phi)*1.1, rr*Math.sin(phi)*Math.sin(a));
    seg.rotation.set(a,a*1.7,a*0.5);
    seg.visible=false; seg.userData.info={name:'Amyloid-β plaque',role:'Clumped amyloid-β fibrils aggregating into an extracellular senile plaque.'}; g.add(seg); path.fibrils.push(seg); }
  const L=(t,c,pos,sc,info)=>{const l=label(t,c,sc,info);l.position.copy(pos);g.add(l);};
  L('Neuron soma','#f0d4b8',new THREE.Vector3(-1.6,1.3,0),.38,{name:'Neuron soma',role:'Cell body of the neuron.'});
  L('Axon','#e8cfa8',new THREE.Vector3(1.95,0.6,0),.34,{name:'Axon',role:'Signal projection; transport runs along the microtubules.'});
  L('Microtubules','#bfe0d8',new THREE.Vector3(0.9,-0.9,0),.34,{name:'Microtubule',role:'Transport track normally stabilized by tau.'});
  L('Tau tangles (NFT)','#c9a06a',new THREE.Vector3(0.6,1.05,0),.36,{name:'Tau tangle (NFT)',role:'Hyperphosphorylated tau, collapses axonal transport.'});
  L('Amyloid-β plaque','#e88a70',new THREE.Vector3(-1.6,-2.15,0),.38,{name:'Amyloid-β plaque',role:'Clumped amyloid-β fibrils aggregating into an extracellular senile plaque.'});
  return g;
}
function updateMol(burden,clear){
  const load=clamp(burden - clear*0.7, 0, 100);
  const nF=Math.round(load/100*path.fibrils.length); path.fibrils.forEach((f,i)=>f.visible=i<nF);
  const nT=Math.round(load/100*path.tau.length); path.tau.forEach((t,i)=>t.visible=i<nT);
  path.mtubes.forEach(o=>{o.mt.position.y=o.base*(1+load/60);});
  path._amyloid=load; path._tau=load; path._mtInteg=100-load;
}
function pathGauges(rows){
  return rows.map(([lab,v,good])=>{
    const pct=clamp(v,0,100);
    const col=good?(pct>55?'#5fae7a':pct>35?'#d1a53c':'#e2705f'):(pct<40?'#5fae7a':pct<65?'#d1a53c':'#e2705f');
    return `<div class="g"><div class="gt"><b>${lab}</b><span class="gv">${v.toFixed(0)}%</span></div>
      <div class="bar"><i style="width:${pct}%;background:${col}"></i></div></div>`;
  }).join('');
}
function setPview(v){
  path.pview=v; path.park.visible=(v==='park'); path.mol.visible=(v==='mol');
  $('#pathSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.pview===v));
  $('#parkCtl').style.display=v==='park'?'':'none';
  $('#molCtl').style.display=v==='mol'?'':'none';
  path.cam.position.set(v==='park'?2.4:3.0, v==='park'?0.7:0.4, v==='park'?6.8:7.2);
  path.park.position.set(0,0,0);
  $('#pathTag').textContent=v==='park'?'Nigrostriatal dopamine pathway':'Amyloid-β plaque & tau neurofibrillary tangles';
  $('#pathLegend').innerHTML = v==='park'
    ? '<span><i style="background:#2c1a10"></i>Substantia nigra (neuromelanin)</span><span><i style="background:#3a2416"></i>Dopaminergic neuron</span><span><i style="background:#a8705a"></i>Striatum</span><span><i style="background:#ffe08a"></i>Dopamine</span><span><i style="background:#231106"></i>Darker axon = less &amp; slower dopamine</span>'
    : '<span><i style="background:#c84a30"></i>Amyloid-β fibril</span><span><i style="background:#6a4a2a"></i>Tau tangle (NFT)</span><span><i style="background:#8fb3ad"></i>Microtubule</span><span><i style="background:#caa184"></i>Neuron</span>';
  refreshPath();
}
function refreshPath(){
  if(!path.park) return;
  if(path.pview==='park'){
    const loss=+$('#loss').value, rescue=+$('#rescue').value;
    $('#vLoss').textContent=loss+'%'; $('#vRescue').textContent=rescue+'%';
    updatePark(loss,rescue);
    $('#pathState').textContent=`Dopamine ${path._dopamine.toFixed(0)}% · motor ${path._motor.toFixed(0)}%`;
    $('#parkGauges').innerHTML=pathGauges([
      ['Dopamine level',path._dopamine,true],['Motor function',path._motor,true],
      ['Tremor / rigidity',path._tremor*100,false],['Surviving SN neurons',100-loss,true]]);
    $('#pathInfo').innerHTML=`<div class="kv"><b>Circuit</b><span>Substantia nigra pars compacta → striatum (nigrostriatal pathway), ~80% of the brain's dopamine.</span></div>
      <div class="kv"><b>Lesion</b><span>Dopaminergic neuron loss; motor signs appear once ~30–50% of nigral neurons are gone (Popescu 2024).</span></div>
      <div class="kv"><b>Intervention</b><span>Aerobic exercise raises dopamine D2-receptor binding &amp; BDNF and delays progression (Petzinger 2013, Lancet Neurol); meditation raises dopamine (2nd paper).</span></div>
      <div class="kv"><b>Axon shade</b><span>As dopamine output falls, the nigrostriatal axons darken, a darker axon is sending less dopamine to the striatum, and the yellow dopamine particles visibly travel slower along it.</span></div>`;
  } else {
    const burden=+$('#burden').value, clear=+$('#clear').value;
    $('#vBurden').textContent=burden+'%'; $('#vClear').textContent=clear+'%';
    updateMol(burden,clear);
    $('#pathState').textContent=`Amyloid ${path._amyloid.toFixed(0)}% · MT integrity ${path._mtInteg.toFixed(0)}%`;
    $('#molGauges').innerHTML=pathGauges([
      ['Amyloid-β load',path._amyloid,false],['Tau tangle load',path._tau,false],
      ['Microtubule integrity',path._mtInteg,true]]);
    $('#pathInfo').innerHTML=`<div class="kv"><b>Plaques</b><span>Extracellular amyloid-β42 fibrils aggregate into senile plaques → oxidative stress, impaired LTP.</span></div>
      <div class="kv"><b>Tangles</b><span>Hyperphosphorylated tau detaches from microtubules → neurofibrillary tangles → transport failure.</span></div>
      <div class="kv"><b>Clearance</b><span>Omega-3 &amp; exercise lower amyloid/oxidative load; anti-amyloid drugs target fibrils.</span></div>`;
  }
}
function animatePath(){
  requestAnimationFrame(animatePath);
  if(!isActive('path')) return;
  path.ctrl.update();
  if(path.pview==='park'){
    const a=(path._tremor||0)*0.055, t=Date.now();
    path.park.position.x=Math.sin(t*0.03)*a; path.park.position.y=Math.cos(t*0.037)*a;
    path.dopa.forEach(d=>{ if(!d.on){d.m.visible=false;return;} d.m.visible=true; d.t=(d.t+d.speed*(path._speedF||1))%1; d.m.position.copy(d.curve.getPoint(d.t)); });
  }
  path.r.render(path.scene,path.cam);
}

/* ============================================================
   5. UI WIRING
   ============================================================ */
function isActive(tab){ return $('#tab-'+tab).classList.contains('active'); }
function refresh(){
  state.o3=+$('#o3').value/100; state.ex=+$('#ex').value/100;
  state.cst=+$('#cst').value/100; state.med=+$('#med').value/100;
  state.apoe=+$('#apoe').value; state.month=+$('#month').value; state.pd=$('#pdMode').checked;
  $('#vO3').textContent=$('#o3').value+'%'; $('#vEx').textContent=$('#ex').value+'%';
  $('#vCst').textContent=$('#cst').value+'%'; $('#vMed').textContent=$('#med').value+'%';
  $('#vApoe').textContent=$('#apoe').value; $('#monthLbl').textContent=state.month;
  const tr = trajectory(state);
  const base = trajectory({...state, o3:0, ex:0, cst:0, med:0});
  brain._tr = tr;
  drawChart(tr, base); buildGauges(tr); updateBrain(); updateValidation(tr); buildScoreboard(tr, base);
}
const GAUGES=[
  {k:'cog',   lab:'Cognition (MMSE)', max:30, good:true},
  {k:'hippo', lab:'Hippocampal vol %', max:110, good:true},
  {k:'npi',   lab:'Neuroplasticity idx', max:100, good:true},
  {k:'bdnf',  lab:'BDNF', max:100, good:true},
  {k:'plaque',lab:'Amyloid plaque', max:100, good:false},
  {k:'inflam',lab:'Neuroinflammation', max:100, good:false},
  {k:'dopa',  lab:'Dopamine (SN)', max:100, good:true},
];
function buildGauges(tr){
  const m=state.month;
  $('#gauges').innerHTML = GAUGES.map(g=>{
    const v=tr[g.k][m], v0=tr[g.k][0], d=v-v0, pct=v/g.max*100;
    const col=g.good?(pct>55?'#5fae7a':pct>35?'#d1a53c':'#e2705f'):(pct<40?'#5fae7a':pct<65?'#d1a53c':'#e2705f');
    const gd=g.good?d>=0:d<=0; const arrow=d>0?'▲':d<0?'▼':'–';
    return `<div class="g"><div class="gt"><b>${g.lab}</b><span class="gv">${v.toFixed(1)}
      <span class="delta ${gd?'up':'down'}">${arrow}${Math.abs(d).toFixed(1)}</span></span></div>
      <div class="bar"><i style="width:${clamp(pct,0,100)}%;background:${col}"></i></div></div>`;
  }).join('');
}
/* ---- plain-English scoreboard: % difference vs. untreated at current month ---- */
const SCORE=[
  ['bdnf',  'BDNF, the "brain fertilizer" that helps brain cells grow &amp; connect', true],
  ['cbf',   'Blood flow, oxygen delivery to the brain', true],
  ['inflam','Inflammation, brain irritation (lower is better)', false],
  ['npi',   'Neuroplasticity, how easily the brain rewires itself', true],
  ['hippo', 'Hippocampus, the brain’s memory center', true],
  ['plaque','Amyloid plaque, sticky protein clumps (lower is better)', false],
  ['dopa',  'Dopamine, the chemical made by the substantia nigra', true],
  ['cog',   'Memory test score (MMSE, out of 30)', true],
];
function buildScoreboard(tr, base){
  const m=state.month;
  $('#scoreTbl').innerHTML='<tr><th>Factor</th><th>Your plan</th><th>Doing nothing</th><th>Difference</th></tr>'+
    SCORE.map(([k,lab,goodUp])=>{
      const a=tr[k][m], b=base[k][m], pct=b?(a-b)/b*100:0;
      const better=goodUp?pct>=0:pct<=0;
      const col=Math.abs(pct)<0.05?'var(--dim)':better?'var(--good)':'var(--bad)';
      const arrow=pct>0.05?'▲':pct<-0.05?'▼':'–';
      return `<tr><td>${lab}</td><td>${a.toFixed(1)}</td><td>${b.toFixed(1)}</td><td style="color:${col}">${arrow} ${pct>0?'+':''}${pct.toFixed(1)}%</td></tr>`;
    }).join('');
}

function buildCoefTable(){
  const rows=[['bdnf','BDNF'],['cbf','Blood flow'],['inflam','Inflammation']];
  const cols=['base','ex','o3','cst','med'];
  let h=`<tr><th>Marker</th>${cols.map(c=>`<th>${c}</th>`).join('')}</tr>`;
  rows.forEach(([k,lab])=>{ h+=`<tr><td>${lab}</td>`+cols.map(c=>
    (W[k][c]!==undefined)?`<td><input data-k="${k}" data-c="${c}" value="${W[k][c]}" title="Editable model weight, see app.js source comments for the citation this value is based on"></td>`:'<td>–</td>').join('')+'</tr>'; });
  $('#coefTbl').innerHTML=h;
  $('#coefTbl').querySelectorAll('input').forEach(inp=>inp.onchange=()=>{
    const v=parseFloat(inp.value); if(!isNaN(v)) W[inp.dataset.k][inp.dataset.c]=v; refresh(); });
}
/* ---- structural-coefficient sliders (sensitivity analysis) ---- */
const K_META=[
  ['nBdnf',     'BDNF → neuroplasticity weight',        0, 1.5, .05],
  ['nCbf',      'Blood flow → neuroplasticity weight',  0, 1.5, .05],
  ['nInflam',   'Inflammation penalty weight',          0, 1.5, .05],
  ['regrow',    'Hippocampal regrowth rate',            0, 3,   .05],
  ['atrophy',   'Hippocampal atrophy rate',             0, 3,   .05],
  ['apoeRisk',  'APOE-ε4 degradation multiplier',       0, 1,   .05],
  ['plaqueGrow','Amyloid accrual rate',                 0, 3,   .05],
  ['cstCog',    'CST → cognition (Woods 2023 Cochrane)',0, 0.5, .01],
  ['medCog',    'Meditation → cognition (Shi 2025)',    0, 0.5, .01],
];
function buildKSliders(){
  $('#kSliders').innerHTML = K_META.map(([k,lab,mn,mx,st])=>`
    <div class="ctrl" style="margin-bottom:10px">
      <label><span class="lab">${lab}</span><span class="val" id="kv_${k}">${K[k]}</span></label>
      <input type="range" id="k_${k}" min="${mn}" max="${mx}" step="${st}" value="${K[k]}" title="Default ${K_DEF[k]}, drag to test model sensitivity; everything recalculates live">
    </div>`).join('') + `<button class="btn reset" id="kReset" title="Restore all structural coefficients to their documented defaults">↺ Reset coefficients</button>`;
  $('#kSliders').querySelectorAll('input[type=range]').forEach(el=>{
    el.style.setProperty('--p', ((el.value-el.min)/(el.max-el.min)*100)+'%');
    el.oninput=()=>{ K[el.id.slice(2)]=+el.value; $('#kv_'+el.id.slice(2)).textContent=+el.value; refresh(); };
  });
  $('#kReset').onclick=()=>{ Object.assign(K,K_DEF); buildKSliders(); refresh(); };
}

/* ---- validation vs. published trial endpoints ----
   Each benchmark: the trial's 24-month expected change in hippocampal volume (%)
   and MMSE (points), plus the slider profile it corresponds to. The panel picks
   the benchmark closest to the current sliders and reports residuals honestly,
   population mismatches & extrapolations are flagged in the note. */
/* Literature base: generated by research/build_benchmarks.py from
   research/literature.csv. Loaded at boot; when present it re-derives the
   BENCH endpoints from the source rows and lists every source in Science
   & Model Notes. The hardcoded BENCH below is the offline fallback. */
let LIT=null;
async function loadLiterature(){
  try{
    LIT=await (await fetch('benchmarks.json')).json();
    const g=(t,i)=>{const e=(LIT.benchmarks[t]||[])[0];return e&&e.effect_value!=null?e.effect_value*(i||1):null;};
    const uh=g('untreated.hippo',2), um=g('untreated.mmse',2), eh=g('exercise.hippo',2);
    if(uh!=null) BENCH[0].hippo=+uh.toFixed(1);
    if(um!=null) BENCH[0].mmse=+um.toFixed(1);
    if(eh!=null) BENCH[1].hippo=+eh.toFixed(1);
    const host=$('#sciProse');
    if(host && LIT){
      const all=[...Object.entries(LIT.coefficients),...Object.entries(LIT.benchmarks)]
        .flatMap(([t,es])=>es.map(e=>({t,...e}))).concat(LIT.context.map(e=>({t:'context',...e})));
      host.insertAdjacentHTML('beforeend',
        `<h3>Literature base (${LIT.n_sources} sources, machine-readable)</h3>
        <p>Generated from <code>research/literature.csv</code> by <code>research/build_benchmarks.py</code>; the validation panel's trial endpoints are derived from these rows, spanning Alzheimer's, Parkinson's/dopamine, APOE4, and all four interventions, not exercise alone.</p>
        <table class="wt">${'<tr><th>Study</th><th>Design</th><th>Outcome</th><th>Effect</th><th>Model use</th></tr>'}
        ${all.map(e=>`<tr><td>${e.citation.split(',')[0]}</td><td>${e.source_type}</td><td>${e.outcome||''}</td><td>${e.effect_value!=null?e.effect_type+' '+e.effect_value:'qualitative'}</td><td>${e.t}</td></tr>`).join('')}</table>`);
    }
    refresh();
  }catch(e){ /* offline (file://) — hardcoded fallback values stay */ }
}

const BENCH=[
  { label:'Untreated AD · Barnes & Fox 2009 + Han 2000 meta-analyses',
    match:{o3:0,ex:0,cst:0,med:0}, hippo:-9.3, mmse:-6.6,
    note:'Hippocampal atrophy ≈ −4.66%/yr (meta-analysis of serial-MRI AD studies); MMSE −3.3 pts/yr [−3.7, −2.9] (Han 2000, 37 studies, n=3,492; mild AD toward the slower end). Both extrapolated to 24 mo.' },
  { label:'Exercise only · Erickson et al. 2011 RCT (n=120)',
    match:{o3:0,ex:70,cst:0,med:0}, hippo:4.0, mmse:-3.4,
    note:'+2%/yr hippocampal volume from aerobic walking, in HEALTHY older adults (population mismatch), extrapolated to 24 mo. MMSE endpoint approximated as decline slowed ~30% vs. untreated, no AD RCT reports this directly.' },
];
/* Multi-domain benchmark removed 2026-09-10: no published trial combines all
   four interventions, so its Δ=0 "endpoints" were placeholders, not data —
   they produced misleading residuals whenever several sliders were raised. */
function updateValidation(tr){
  const el=$('#validPanel'); if(!el) return;
  const s={o3:+$('#o3').value, ex:+$('#ex').value, cst:+$('#cst').value, med:+$('#med').value};
  let best=BENCH[0], bd=Infinity;
  BENCH.forEach(b=>{ const d=['o3','ex','cst','med'].reduce((a,k)=>a+(s[k]-b.match[k])**2,0); if(d<bd){bd=d;best=b;} });
  const rows=[   // [label, simulated Δ, trial Δ, unit, normalizing clinical range]
    ['Hippocampal volume Δ', tr.hippo[MONTHS]-tr.hippo[0], best.hippo, '%',    20],
    ['Cognition (MMSE) Δ',   tr.cog[MONTHS]-tr.cog[0],     best.mmse,  ' pts', 6],
  ];
  let pdNote='';
  if(state.pd){ // Marek 2001 (Neurology, n=56 serial SPECT): striatal DAT −11.2%/yr in PD → −22.4% over 24 mo
    rows.push(['Dopamine (SN) Δ', (tr.dopa[MONTHS]-tr.dopa[0])/tr.dopa[0]*100, -22.4, '%', 30]);
    pdNote=' PD row: dopaminergic decline vs Marek 2001 serial DAT imaging (−11.2%/yr untreated; interventions in your plan slow the simulated rate).';
  }
  const agree=clamp(100*(1-rows.reduce((a,r)=>a+Math.min(1,Math.abs(r[1]-r[2])/r[4]),0)/rows.length),0,100);
  const fmt=v=>(v>0?'+':'')+v.toFixed(1);
  el.innerHTML=`
    <div style="display:flex;gap:9px;margin-bottom:9px;font-size:13px;color:var(--dim)">
      <b style="font-family:var(--font-mono);font-size:11.5px;letter-spacing:.02em;color:var(--ink);flex:none">CLOSEST TRIAL</b><span>${best.label}</span></div>
    <table class="wt">
      <tr><th>Metric, 24-month Δ</th><th>Simulated</th><th>Trial endpoint</th><th>Residual</th></tr>
      ${rows.map(r=>{ const res=r[1]-r[2], f=Math.abs(res)/r[4];
        const col=f<0.35?'var(--good)':f<0.8?'var(--warn)':'var(--bad)';
        return `<tr><td>${r[0]}</td><td>${fmt(r[1])}${r[3]}</td><td>${fmt(r[2])}${r[3]}</td><td style="color:${col}">${fmt(res)}${r[3]}</td></tr>`; }).join('')}
    </table>
    <div class="g" style="margin-top:10px"><div class="gt"><b>Model–trial agreement</b><span class="gv">${agree.toFixed(0)} / 100</span></div>
      <div class="bar"><i style="width:${agree}%;background:${agree>65?'var(--good)':agree>35?'var(--warn)':'var(--bad)'}"></i></div></div>
    <p class="hint" style="margin:9px 0 0">${best.note}${pdNote} Residual = simulated − trial. The agreement score normalizes each residual by a plausible clinical range (heuristic, not a fitted statistic). This table checks how well the simulation's <i>rate of change</i> matches the trial's, not whether the disease itself is reversed, in the untreated scenario the trial endpoint is a decline the model is trying to match, not beat. No published trial combines all four interventions, so there is no benchmark for the full-combination scenario, with several sliders raised, the panel compares against the closest single-intervention trial and the residual should be read as "beyond what that trial tested", not as error.</p>`;
}

/* ---- batch simulation sweep + CSV export ---- */
let batchCsv='';
function runBatch(){
  const key=$('#sweepVar').value, levels=[0,25,50,75,100];
  const name={o3:'Omega-3',ex:'Aerobic exercise',cst:'Cognitive stimulation',med:'Meditation'}[key];
  const rows=[['sweep_var','sweep_pct','month','dopamine','neuroplasticity_index','amyloid_plaque']];
  let sum='';
  levels.forEach(L=>{
    const tr=trajectory({...state,[key]:L/100});
    for(let m=0;m<=MONTHS;m++) rows.push([key,L,m,tr.dopa[m].toFixed(2),tr.npi[m].toFixed(2),tr.plaque[m].toFixed(2)]);
    sum+=`<tr><td>${L}%</td><td>${tr.dopa[MONTHS].toFixed(1)}</td><td>${tr.npi[MONTHS].toFixed(1)}</td><td>${tr.plaque[MONTHS].toFixed(1)}</td></tr>`;
  });
  batchCsv=rows.map(r=>r.join(',')).join('\n');
  $('#batchSummary').innerHTML=`<table class="wt" style="margin:10px 0 0">
    <tr><th>${name}</th><th>Dopamine @ 24 mo</th><th>Neuroplasticity idx @ 24 mo</th><th>Amyloid plaque @ 24 mo</th></tr>${sum}</table>
    <p class="hint" style="margin:8px 0 0">All other sliders held at current values (ω-3 ${$('#o3').value}% · exercise ${$('#ex').value}% · CST ${$('#cst').value}% · meditation ${$('#med').value}% · APOE4 ×${$('#apoe').value}). Full 24-month trajectories in the CSV below.</p>`;
  const ta=$('#batchCsv'); ta.value=batchCsv; ta.style.display='block';
  $('#dlCsv').disabled=false;
}

const PRESETS={ none:{o3:0,ex:0,cst:0,med:0}, single:{o3:0,ex:70,cst:0,med:0}, combo:{o3:80,ex:80,cst:75,med:50} };
function applyPreset(p){ const v=PRESETS[p];
  $('#o3').value=v.o3; $('#ex').value=v.ex; $('#cst').value=v.cst; $('#med').value=v.med; refresh(); }
let playing=null;
function togglePlay(){
  if(playing){ clearInterval(playing); playing=null; $('#play').textContent='▶ Play'; return; }
  $('#play').textContent='⏸ Pause';
  playing=setInterval(()=>{ let m=+$('#month').value; m=m>=MONTHS?0:m+1; $('#month').value=m; refresh(); }, 380);
}
function initSci(){
  $('#sciProse').innerHTML = `
  <h2>How the model works</h2>
  <div class="note">This is a transparent, phenomenological teaching model, not a validated clinical predictor. Every <b>direction</b> of effect is grounded in the literature reviewed in the two papers; the <b>magnitudes</b> are illustrative and fully editable (see "Tune coefficients"). Use it to explore mechanisms, not to make health decisions.</div>
  <h3>Interventions → biomarkers → structure → cognition</h3>
  <p>Each month, four intervention doses drive three primary biomarkers, <b>BDNF</b>, <b>cerebral blood flow/VEGF</b>, and <b>neuroinflammation</b>, which set a <b>neurogenesis rate</b> and a composite <b>Neuroplasticity Index</b>. These integrate over 24 months into <b>hippocampal volume</b> (atrophy vs. regrowth) and <b>amyloid plaque load</b> (accrual vs. clearance), which in turn move a <b>cognition</b> score (MMSE-like, 0–30). CST also adds a direct executive-function gain.</p>
  <h3>Effect directions (verified)</h3>
  <ul>
    <li><b>Aerobic exercise</b>, strongest BDNF & vascular driver; ↑ cerebral blood flow/VEGF, ↑ hippocampal volume, ↑ neurogenesis.</li>
    <li><b>Omega-3 (DHA/EPA)</b>, ↑ BDNF, ↑ neurogenesis/synaptogenesis, ↓ neuroinflammation & oxidative stress; clearance benefit modeled larger in ε4 carriers.</li>
    <li><b>CST</b>, direct ↑ cognition/executive function & functional connectivity; weaker molecular effect.</li>
    <li><b>Meditation</b>, ↓ stress/inflammation, supports dopamine & connectivity.</li>
    <li><b>APOE4</b>, accelerates atrophy & plaque growth (risk factor 1.0/1.45/1.90× for 0/1/2 copies).</li>
  </ul>
  <h3>Why there is no synergy term</h3>
  <p>Earlier versions added a cross-product "synergy bonus" when several interventions were combined. It was removed: no published trial combines all four of these interventions, so there is no data to calibrate an interaction effect against (FINGER 2015 has no factorial arms isolating each domain). Combining sliders still helps in the model, but only as the sum of each intervention's own literature-derived effect.</p>
  <div class="note">Coefficients recalibrated 2026-07-12 against real meta-analyses and RCTs (see <code>W</code> object in <code>app.js</code> for full per-coefficient citations, effect sizes, and confidence/population-match flags). Several placeholders were substantially larger than the literature supports and have been reduced, most real intervention→biomarker effects are small-to-moderate, not the dramatic swings the original placeholders implied.</div>
  <h3>Supporting research (external, peer-reviewed &amp; institutional)</h3>
  <p>The two companion papers are backed by published studies and by federal/university Alzheimer's research bodies, not just self-reviewed literature:</p>
  <div class="cite"><a href="https://pubmed.ncbi.nlm.nih.gov/26433119/" target="_blank" rel="noopener">Köbe et al., <i>NeuroImage</i> (2016), combined omega-3 + aerobic exercise + cognitive stimulation prevents gray-matter decline in MCI</a>
    <p>RCT, 22 MCI patients age 60–80: 6 months of omega-3 + aerobic cycling + cognitive stimulation (n=13) vs. omega-3 + non-aerobic stretching (n=9). Combined group preserved/grew gray matter in frontal, parietal &amp; cingulate cortex; controls declined. Evidence that stacking several interventions is worthwhile, though it cannot separate each one's contribution.</p>
    <span class="src">PubMed 26433119</span></div>
  <div class="cite"><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5368208/" target="_blank" rel="noopener">Hilton et al., <i>Annals of Behavioral Medicine</i> (2016), mindfulness meditation for chronic pain: systematic review &amp; meta-analysis</a>
    <p>38 RCTs / 3,536 participants. Small but statistically significant reduction in pain plus improved depression &amp; quality of life (evidence graded low-to-moderate). Backs the meditation slider's role in the chronic-illness pain model.</p>
    <span class="src">NIH · PMC5368208</span></div>
  <div class="cite"><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7093017/" target="_blank" rel="noopener">Jeon et al., <i>Frontiers in Aging Neuroscience</i> (2020), midlife lifestyle activities moderate APOE ε4 effect on in vivo Alzheimer's pathology</a>
    <p>287 non-demented older adults (KBASE cohort). Midlife physical activity blunted APOE4-associated amyloid/glucose-metabolism decline, the direct evidence for this simulator's APOE-risk × intervention interaction.</p>
    <span class="src">NIH · PMC7093017</span></div>
  <div class="cite"><a href="https://www.nia.nih.gov/news/physical-activity-and-alzheimers-related-hippocampal-atrophy" target="_blank" rel="noopener">National Institute on Aging, physical activity and Alzheimer's-related hippocampal atrophy</a>
    <p>NIH/NIA research briefing: physical activity shows a protective effect on the hippocampus in older adults at genetic risk for Alzheimer's, backs the hippocampal-volume mechanic's response to the exercise slider.</p>
    <span class="src">NIH · National Institute on Aging</span></div>
  <div class="cite"><a href="https://depts.washington.edu/mbwc/adrc/page/genetics" target="_blank" rel="noopener">University of Washington Alzheimer's Disease Research Center, genetic risk factors</a>
    <p>ADRC fact sheet: one APOE ε4 allele raises Alzheimer's risk 3–4×, two copies &gt;10×, though the allele is neither necessary nor sufficient for disease. Source for this app's ε2/ε3/ε4 risk-multiplier values.</p>
    <span class="src">UW ADRC (NIH-funded)</span></div>
  <h3>APOE explorer</h3>
  <p>Two SNPs define the alleles: <code>rs429358</code> (codon 112) and <code>rs7412</code> (codon 158). ε4 = Arg112/Arg158; ε3 = Cys112/Arg158; ε2 = Cys112/Cys158. In ApoE4, Arg112 repositions Arg61 to form a salt bridge with Glu255, the pathogenic "domain interaction." A structure corrector (PH002-type) breaks that bond so ApoE4 behaves like ApoE3, the removable target. Gene locus: chr 19q13.32.</p>
  <div class="note">A note on wording: earlier drafts of this project described lifestyle interventions as able to "reverse" Alzheimer's or chronic-illness effects. Current evidence supports that certain lifestyle interventions may improve cognitive function, biomarkers, or slow progression in some contexts, but they have not been shown to reverse Alzheimer's disease generally. Both papers and this app have been revised to reflect that; treat this as a hypothesis-exploration and educational tool, not a treatment claim.</div>`;
}

/* ---------- boot ---------- */
function boot(){
  $('#introStart').onclick=()=>$('#intro').classList.add('hidden');
  const openLegal=target=>e=>{
    e.preventDefault();
    $('#intro').classList.add('hidden');
    $('#tabs').querySelectorAll('button').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tabpane').forEach(x=>x.classList.remove('active'));
    $('[data-tab="legal"]').classList.add('active'); $('#tab-legal').classList.add('active');
    setTimeout(()=>$(target).scrollIntoView({block:'start'}),50);
  };
  $('#introPrivacyLink').onclick=openLegal('#legalPrivacy');
  $('#introTermsLink').onclick=openLegal('#legalTerms');
  $('#tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{
    $('#tabs').querySelectorAll('button').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tabpane').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); $('#tab-'+b.dataset.tab).classList.add('active');
    setTimeout(()=>{ brain.onR&&brain.onR(); apoe.onR&&apoe.onR(); path.onR&&path.onR(); },30);
  });
  ['o3','ex','cst','med','apoe','month'].forEach(id=>$('#'+id).oninput=refresh);
  $('#play').onclick=togglePlay;
  document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset));
  $('#viewSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>setView(b.dataset.view));
  $('#isoSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>setIso(+b.dataset.iso));
  $('#fixOn').onchange=e=>{ apoe.fix=e.target.checked; updateFixState(); updateApoe(); };
  ['dissect','ghost'].forEach(id=>$('#'+id).oninput=()=>{setDissect(+$('#dissect').value);setGhost(+$('#ghost').value);updateInnerVis();updateViewTag();});
  $('#brainReset').onclick=()=>{setRange($('#dissect'),100);setRange($('#ghost'),15);setDissect(100);setGhost(15);updateInnerVis();updateViewTag();brain.cam.position.set(3.2,1.1,4.4);};
  $('#pathSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>setPview(b.dataset.pview));
  ['loss','rescue','burden','clear'].forEach(id=>$('#'+id).oninput=refreshPath);
  $('#simReset').onclick=()=>{ $('#o3').value=60;$('#ex').value=60;$('#cst').value=60;$('#med').value=30;$('#apoe').value=1;$('#month').value=0; refresh(); };
  $('#apoeReset').onclick=()=>{ $('#fixOn').checked=false; apoe.fix=false; setIso(3); setView('dna'); };
  $('#pathReset').onclick=()=>{ $('#loss').value=55;$('#rescue').value=40;$('#burden').value=60;$('#clear').value=30; setPview('park'); };
  $('#pdMode').onchange=refresh;
  $('#sectSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>setSection(b.dataset.sect));
  $('#brainExport').onclick=()=>exportPNG(brain,'neuroai-brain');
  $('#apoeExport').onclick=()=>exportPNG(apoe,'neuroai-apoe');
  $('#pathExport').onclick=()=>exportPNG(path,'neuroai-pathology');
  window.addEventListener('resize',()=>{ brain.onR&&brain.onR(); apoe.onR&&apoe.onR(); path.onR&&path.onR(); });
  const fillRange = el => el.style.setProperty('--p', ((el.value-el.min)/(el.max-el.min)*100)+'%');
  document.querySelectorAll('input[type=range]').forEach(fillRange);
  document.addEventListener('input', e=>{ if(e.target.matches('input[type=range]')) fillRange(e.target); });
  $('#runBatch').onclick=runBatch;
  $('#dlCsv').onclick=()=>{ const a=document.createElement('a'); a.download='neuroai-sweep.csv';
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(batchCsv); a.click(); };
  buildChartLegend(); buildCoefTable(); buildKSliders(); initSci();
  initBrain(); initApoe(); initPath(); refresh(); loadLiterature();
}
boot();

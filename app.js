import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
/* Ngandu et al. 2015 (FINGER trial), Lancet 385(9984):2255-2263. RCT, n=1,260,
   2-year multi-domain intervention (diet+exercise+cognitive training+vascular risk
   management) vs. control in at-risk-but-cognitively-largely-intact older adults —
   NOT diagnosed AD patients. Combined intervention: +25% relative improvement on
   composite cognitive test battery vs. control.
   CRITICAL GAP: FINGER reports only the combined multi-domain effect vs. control —
   no factorial arm isolating single domains, so there is NO empirical measurement of
   synergy/interaction (more-than-the-sum-of-parts) anywhere in this literature. A
   2022 follow-up (Ngandu et al., Alzheimer's & Dementia) found domain-adherence
   variables too multicollinear to even estimate each component's independent
   contribution. This makes SYN the single most speculative parameter in the model —
   it operationalizes the two source papers' own thesis ("rarely studied together")
   as an explicit, labeled HYPOTHESIS under test, not a literature-derived point
   estimate. Reduced from the placeholder 22 to reflect that no dedicated
   interaction-effect study exists to calibrate against. */
const SYN = 12;
const state = { o3:.6, ex:.6, cst:.6, med:.3, apoe:1, synOn:true, month:0 };

function synergy(p){
  if(!p.synOn) return 0;
  const x = p.o3*p.ex + p.ex*p.cst + p.o3*p.cst + p.ex*p.med + p.o3*p.med;
  return SYN * (x/5);
}
function trajectory(p){
  const apoeF = 1 + p.apoe*0.45;
  const syn = synergy(p);
  const out = { bdnf:[], cbf:[], inflam:[], neuro:[], hippo:[], plaque:[], cog:[], npi:[], dopa:[], syn };
  let hippo = 100, plaque = 28 + p.apoe*11, cog = 24, dopa = 88;
  for(let m=0; m<=MONTHS; m++){
    const bdnf   = clamp(W.bdnf.base + p.ex*W.bdnf.ex + p.o3*W.bdnf.o3 + p.cst*W.bdnf.cst + p.med*W.bdnf.med + syn*0.6, 0, 100);
    const cbf    = clamp(W.cbf.base  + p.ex*W.cbf.ex  + p.o3*W.cbf.o3  + p.med*W.cbf.med, 0, 100);
    const inflam = clamp(W.inflam.base + p.ex*W.inflam.ex + p.o3*W.inflam.o3 + p.med*W.inflam.med + p.apoe*8, 0, 100);
    const neuro  = clamp((bdnf*0.5 + cbf*0.3 - inflam*0.35 + syn*0.5), 0, 100);
    const npi    = clamp(0.34*bdnf + 0.22*neuro + 0.18*cbf + 0.26*(100-inflam), 0, 100);
    out.bdnf.push(bdnf); out.cbf.push(cbf); out.inflam.push(inflam); out.neuro.push(neuro); out.npi.push(npi);
    out.hippo.push(hippo); out.plaque.push(plaque); out.cog.push(cog); out.dopa.push(dopa);
    const atrophy   = 0.75 * apoeF;
    const regrow    = neuro/100 * 1.15 + syn*0.012;
    hippo  = clamp(hippo - atrophy + regrow - inflam*0.004, 55, 108);
    const growth    = 0.9 * apoeF;
    const clearance = (p.o3*0.55 + p.ex*0.5) * (1 + p.apoe*0.3);
    plaque = clamp(plaque + growth - clearance, 0, 100);
    const fromBrain = (hippo-90)*0.03 - (plaque-30)*0.014;
    cog = clamp(cog + fromBrain + p.cst*0.33 - 0.07*apoeF, 0, 30);
    const pdDecline = p.pd ? 1.9*(1+p.apoe*0.06) : 0.12;                  // nigral dopamine loss
    const dopaRescue = (p.pd ? (p.ex*0.9 + p.med*0.8) : p.ex*0.2) * 0.6;  // exercise/meditation slow it
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
  const W0 = c.width, H0 = c.height, pad = 30;
  g.clearRect(0,0,W0,H0);
  g.strokeStyle = '#3a3632'; g.lineWidth = 1;
  for(let i=0;i<=4;i++){ const y = pad + (H0-2*pad)*i/4; g.beginPath(); g.moveTo(pad,y); g.lineTo(W0-6,y); g.stroke(); }
  g.fillStyle = '#928879'; g.font = '10px ui-monospace,"SF Mono",monospace';
  for(let m=0;m<=MONTHS;m+=6){ const x = pad + (W0-pad-6)*m/MONTHS; g.fillText(m+'mo', x-8, H0-4); }
  const plot = (arr, max, color, dash, shape) => {
    g.beginPath(); g.setLineDash(dash?[4,4]:[]); g.strokeStyle = color; g.lineWidth = dash?1.4:2.2;
    arr.forEach((v,m)=>{ const x = pad+(W0-pad-6)*m/MONTHS, y = pad+(H0-2*pad)*(1-v/max);
      m?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); g.setLineDash([]);
    if(!dash) arr.forEach((v,m)=>{ if(m%4) return; const x = pad+(W0-pad-6)*m/MONTHS, y = pad+(H0-2*pad)*(1-v/max); drawMarker(g,x,y,shape,color); });
  };
  SERIES.filter(s=>s.on).forEach(s=>{ plot(base[s.key], s.max, s.color, true, s.shape); plot(tr[s.key], s.max, s.color, false, s.shape); });
  const mx = pad+(W0-pad-6)*state.month/MONTHS;
  g.strokeStyle = '#4fbd7299'; g.setLineDash([2,3]); g.beginPath(); g.moveTo(mx,pad); g.lineTo(mx,H0-pad); g.stroke(); g.setLineDash([]);
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
function label(text, color='#dfe8f2', scale=0.34, info=null){
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent:true, depthTest:false }));
  sp.renderOrder=999; sp._scale=scale; sp._color=color;
  if(info) sp.userData.info=info; else sp.raycast=()=>{}; // a labeled structure is clickable via its own box; purely decorative labels stay click-through to whatever's behind them
  sp.setText = t => {
    const fs=32, pad=18;
    const m=document.createElement('canvas').getContext('2d'); m.font=`bold ${fs}px sans-serif`;
    const w=Math.ceil(m.measureText(t).width)+pad*2, h=fs+18;
    const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
    const x=cv.getContext('2d'); x.font=`bold ${fs}px sans-serif`; x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='rgba(10,7,4,.72)'; x.fillRect(0,0,w,h); x.fillStyle=sp._color; x.fillText(t,w/2,h/2);
    const tex=new THREE.CanvasTexture(cv); tex.anisotropy=4;
    sp.material.map&&sp.material.map.dispose(); sp.material.map=tex; sp.material.needsUpdate=true;
    sp.scale.set(sp._scale*w/h, sp._scale, 1);
  };
  sp.setText(text); return sp;
}

/* ============================================================
   3b. 3D BRAIN, dissectable, layered anatomy
   ============================================================ */
/* ---- anatomical tissue colors ---- */
const COL={cortex:0xd7a595,white:0xece0cf,hippo:0xc77b5e,thal:0xb98a6d,striat:0xa8705a,
  pallid:0xcaa184,nigra:0x2c1a10,amyg:0xb06a54,cbl:0xcf9a86,cblCore:0xe8dcc6,stem:0xc99277,
  vent:0x8fb3ad,callosum:0xf0e6d3,plaque:0xbf3b2b,spark:0x9ccf6a,blood:0xcc3333};
const CMAX=2.0;
const brain={clip:new THREE.Plane(new THREE.Vector3(-1,0,0),CMAX)};
function gyri(rad,amp,freq){
  const geo=new THREE.SphereGeometry(rad,120,90),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    let n=Math.sin(freq*x)*Math.sin(freq*y)*Math.sin(freq*z)+0.5*Math.sin(freq*1.9*x+1)*Math.sin(freq*1.7*z)+0.25*Math.sin(freq*3.1*y)*Math.sin(freq*2.7*x);
    let k=1+amp*n; k-=0.07*Math.exp(-(x*x)/(0.02*rad*rad));
    p.setXYZ(i,x*k,y*k,z*k);}
  geo.computeVertexNormals();return geo;
}
function tmat(color,extra){return new THREE.MeshStandardMaterial(Object.assign({color,roughness:.72,metalness:.02,clippingPlanes:[brain.clip]},extra));}
function mkPart(color,r1,r2,h,pos){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,18),tmat(color));m.position.set(...pos);return m;}
function nucleus(color,rad,pos,scl,name,role,showLabel=true){
  const g=new THREE.Group(); g.userData.info={name,role};
  [1,-1].forEach(s=>{const m=new THREE.Mesh(new THREE.SphereGeometry(rad,28,22),tmat(color,{roughness:.55}));
    m.position.set(pos[0]*s,pos[1],pos[2]);if(scl)m.scale.set(...scl);m.userData.info={name,role};g.add(m);});
  brain.root.add(g);brain.inner.push(g);
  if(showLabel&&name){const l=label(name,'#dfe8f2',.28,{name,role});l.position.set(Math.abs(pos[0])+rad+0.15,pos[1]+0.05,pos[2]);brain.root.add(l);brain.innerLabels.push(l);}
  return g;
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
const SECT={sagittal:[-1,0,0],coronal:[0,0,-1],axial:[0,-1,0]};
function setSection(axis){ const n=SECT[axis]||SECT.sagittal; brain.clip.normal.set(n[0],n[1],n[2]); setDissect(+$('#dissect').value);
  $('#sectSeg')&&$('#sectSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.sect===axis)); }
function initBrain(){
  const vp=$('#brainVP');Object.assign(brain,makeScene(vp),brain);
  brain.cam.position.set(3.2,1.1,4.4);
  const root=new THREE.Group();brain.scene.add(root);brain.root=root;
  brain.shells=[];brain.inner=[];brain.innerLabels=[];
  const XS=[1.22,1.0,1.32];
  const wm=new THREE.Mesh(gyri(1.34,0.03,7.6),tmat(COL.white,{transparent:true,side:THREE.DoubleSide}));wm.scale.set(...XS);root.add(wm);brain.shells.push(wm);
  tagInfo(wm,'White matter','Myelinated axon tracts wiring regions together.');
  const cx=new THREE.Mesh(gyri(1.5,0.088,7.4),tmat(COL.cortex,{transparent:true,side:THREE.DoubleSide,flatShading:false}));cx.scale.set(...XS);root.add(cx);brain.shells.push(cx);
  tagInfo(cx,'Cerebral cortex','Outer grey matter, thinking, memory, reasoning.');
  const ccPts=[[0,.5,.85],[0,.78,.35],[0,.82,-.2],[0,.6,-.7],[0,.2,-.75],[0,-.05,-.5]].map(a=>new THREE.Vector3(...a));
  const cc=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ccPts),50,0.1,14),tmat(COL.callosum,{roughness:.5}));root.add(cc);brain.inner.push(cc);
  tagInfo(cc,'Corpus callosum','Fiber bridge connecting the two hemispheres.');
  {const l=label('Corpus callosum','#dfe8f2',.28,{name:'Corpus callosum',role:'Fiber bridge connecting the two hemispheres.'});l.position.set(0.15,1.0,-0.1);root.add(l);brain.innerLabels.push(l);}
  nucleus(COL.thal,.3,[.34,.08,-.12],[.85,1,1.15],'Thalamus','Sensory & motor relay hub to the cortex.');
  nucleus(COL.striat,.28,[.72,.06,.12],[.6,1.15,1],'Basal ganglia (striatum)','Movement & reward; dopamine target of the substantia nigra.');
  nucleus(COL.pallid,.16,[.5,-.02,.06],null,'Globus pallidus','Basal ganglia output, regulates movement.',false);
  nucleus(COL.amyg,.2,[.72,-.3,.5],null,'Amygdala','Emotion & fear processing.');
  brain.sn=nucleus(COL.nigra,.13,[.3,-.72,-.28],[1.6,.5,1.1],'Substantia nigra','Dopamine source; degenerates in Parkinson’s disease.');
  const hipGrp=new THREE.Group();root.add(hipGrp);brain.hip=hipGrp;
  brain.hipMat=tmat(COL.hippo,{roughness:.5,emissive:0x2a1206,emissiveIntensity:.25});
  [1,-1].forEach(s=>{const pts=[[.2*s,-.1,.7],[.6*s,-.28,.45],[.8*s,-.4,0],[.62*s,-.32,-.45],[.36*s,-.12,-.7]].map(a=>new THREE.Vector3(...a));
    hipGrp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),44,0.12,14),brain.hipMat));});
  brain.inner.push(hipGrp); tagInfo(hipGrp,'Hippocampus','Learning & memory; atrophies early in Alzheimer’s.');
  {const l=label('Hippocampus','#f0c6ac',.4,{name:'Hippocampus',role:'Learning & memory; atrophies early in Alzheimer’s.'});l.position.set(1.35,-.4,0);root.add(l);brain.hipLabel=l;}
  [1,-1].forEach(s=>{const v=new THREE.Mesh(new THREE.SphereGeometry(.28,20,16),tmat(COL.vent,{roughness:.3,emissive:0x12302c,emissiveIntensity:.3,transparent:true,opacity:.85}));
    v.position.set(.3*s,.28,-.05);v.scale.set(.4,1,1.35);v.userData.info={name:'Lateral ventricle',role:'CSF space; enlarges as brain tissue is lost.'};root.add(v);brain.inner.push(v);});
  {const l=label('Lateral ventricle','#bfe0d8',.28,{name:'Lateral ventricle',role:'CSF space; enlarges as brain tissue is lost.'});l.position.set(.55,.6,-.05);root.add(l);brain.innerLabels.push(l);}
  const bs=new THREE.Group();
  bs.add(mkPart(COL.stem,.24,.2,.55,[0,-.55,-.35]));
  const pons=new THREE.Mesh(new THREE.SphereGeometry(.3,22,18),tmat(COL.stem));pons.position.set(0,-1,-.25);pons.scale.set(1,.9,1.15);bs.add(pons);
  bs.add(mkPart(COL.stem,.17,.24,.7,[0,-1.5,-.15]));
  root.add(bs);bs.children.forEach(c=>brain.shells.push(c)); tagInfo(bs,'Brainstem','Vital functions; relays signals between brain and body.');
  {const l=label('Brainstem','#e8c7ac',.36,{name:'Brainstem',role:'Vital functions; relays signals between brain and body.'});l.position.set(0,-1.55,.35);root.add(l);}
  const cbl=new THREE.Mesh(gyri(.62,.06,16),tmat(COL.cbl));cbl.position.set(0,-1,-1.2);cbl.scale.set(1.3,.78,1);root.add(cbl);brain.shells.push(cbl);
  tagInfo(cbl,'Cerebellum','Balance, coordination & motor timing.');
  const cblCore=new THREE.Mesh(new THREE.SphereGeometry(.34,20,16),tmat(COL.cblCore));cblCore.position.copy(cbl.position);cblCore.scale.set(1.1,.6,.8);root.add(cblCore);brain.inner.push(cblCore);
  tagInfo(cblCore,'Cerebellum','Balance, coordination & motor timing.');
  {const l=label('Cerebellum','#f0cbb8',.38,{name:'Cerebellum',role:'Balance, coordination & motor timing.'});l.position.set(0,-1.55,-1.5);root.add(l);}
  {const l=label('Cerebral cortex','#f2d6ca',.42,{name:'Cerebral cortex',role:'Outer grey matter, thinking, memory, reasoning.'});l.position.set(0,1.85,0);root.add(l);}
  brain.plaques=[];const pg=new THREE.SphereGeometry(.06,10,10),pm=tmat(COL.plaque,{emissive:0x3a0f08,emissiveIntensity:.4,roughness:.4});
  for(let i=0;i<60;i++){const a=i*2.399,rr=.4+((i*13)%9)/10,yy=(((i*7)%11)/11-.5)*1.8;
    const m=new THREE.Mesh(pg,pm);m.position.set(Math.cos(a)*rr*1.2,yy,Math.sin(a)*rr*1.25);m.visible=false;m.userData.info={name:'Amyloid-β plaque',role:'Toxic protein clump, a hallmark of Alzheimer’s.'};root.add(m);brain.plaques.push(m);}
  brain.sparks=[];const sg=new THREE.SphereGeometry(.035,8,8),sm=new THREE.MeshBasicMaterial({color:COL.spark});
  for(let i=0;i<40;i++){const m=new THREE.Mesh(sg,sm);m.visible=false;hipGrp.add(m);brain.sparks.push(m);
    const a=i*2.4;m.position.set(Math.cos(a)*.7*(i%2?1:-1),-.2+((i*5)%7)/7*.3,Math.sin(a)*.5);}
  brain.blood=new THREE.Mesh(new THREE.SphereGeometry(1.95,32,24),new THREE.MeshBasicMaterial({color:COL.blood,transparent:true,opacity:.05,side:THREE.BackSide}));
  brain.blood.scale.set(...XS);root.add(brain.blood);
  setGhost(100);setDissect(100);updateInnerVis();
  setupInspect(brain,'#brainInspect');
  animateBrain();
}
function setGhost(v){const o=clamp(v/100,.15,1);brain.shells.forEach(m=>{if(m.material){m.material.opacity=o;m.material.transparent=true;m.material.depthWrite=o>.95;}});}
function setDissect(v){brain.clip.constant=(v/100)*CMAX;}
function updateInnerVis(){const show=(+$('#ghost').value<72)||(+$('#dissect').value<96);brain.innerLabels.forEach(l=>l.visible=show);}
function updateBrain(){
  if(!brain.hip)return;const tr=brain._tr,m=state.month;
  const hip=tr.hippo[m],plaque=tr.plaque[m],cbf=tr.cbf[m],neuro=tr.neuro[m],dopa=tr.dopa[m];
  if(brain.sn){ const f=dopa/100; brain.sn.scale.setScalar(0.55+0.45*f);
    brain.sn.children.forEach(c=>{ if(c.material) c.material.color.copy(lerpC(new THREE.Color(0x6f6153),new THREE.Color(COL.nigra),f)); }); }
  brain.hip.scale.setScalar(clamp(hip/100,.6,1.08));
  brain.hipMat.color.copy(lerpC(new THREE.Color(0x8a7a70),new THREE.Color(COL.hippo),(hip-60)/48));
  brain.hipMat.emissiveIntensity=.1+.35*neuro/100;
  const nP=Math.round(plaque/100*60);brain.plaques.forEach((p,i)=>p.visible=i<nP);
  const nS=Math.round(neuro/100*40);brain.sparks.forEach((p,i)=>p.visible=i<nS);
  brain.blood.material.opacity=.03+.16*cbf/100;
  $('#brainMonthTag').textContent=`Month ${m} · plaques ${plaque.toFixed(0)} · flow ${cbf.toFixed(0)} · dopamine ${dopa.toFixed(0)}`;
}
function animateBrain(){
  requestAnimationFrame(animateBrain);
  if(!isActive('sim')) return;
  brain.ctrl.update(); brain.r.render(brain.scene, brain.cam);
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
function buildProtein(){
  const g=new THREE.Group();
  const nGrp=new THREE.Group(); g.add(nGrp); g.nGrp=nGrp;
  const helixMat=new THREE.MeshStandardMaterial({color:0x6fa8cf,roughness:.5});
  const hx=[[-.5,0],[.5,0],[-.5,1],[.5,1]];
  hx.forEach(([x,z])=>{ const h=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,2.6,18), helixMat);
    h.position.set(x, 0.9, z*0.9-0.45); h.userData.info={name:'N-terminal domain (α-helices)',role:'Receptor-binding domain, four helices that dock ApoE into the LDL receptor.'}; nGrp.add(h); });
  const ldlr=new THREE.Mesh(new THREE.SphereGeometry(0.3,16,16),
    new THREE.MeshStandardMaterial({color:0x3f86c4,emissive:0x0a2036}));
  ldlr.position.set(0,2.15,-0.1); ldlr.userData.info={name:'LDLR-binding region (136–150)',role:'Where ApoE engages the LDL receptor to clear lipids from the bloodstream.'}; nGrp.add(ldlr);
  const cGrp=new THREE.Group(); g.add(cGrp); g.cGrp=cGrp;
  const cdom=new THREE.Mesh(new THREE.CapsuleGeometry(0.45,2.2,8,16),
    new THREE.MeshStandardMaterial({color:0x5fbf9f,roughness:.5}));
  cdom.position.set(0,-1.9,0.2); cdom.userData.info={name:'C-terminal domain',role:'Lipid-binding domain, anchors ApoE to lipoprotein particles.'}; cGrp.add(cdom);
  const hinge=cyl(new THREE.Vector3(0,-0.4,0), new THREE.Vector3(0,-0.9,0.1),0.12,
    new THREE.MeshStandardMaterial({color:0x8493a0}));
  hinge.userData.info={name:'Domain-linking hinge',role:'Flexible tether between the N- and C-terminal domains.'};
  g.add(hinge);
  const resGeo=new THREE.SphereGeometry(0.22,16,16);
  const mkRes=(name,pos,col,role)=>{ const m=new THREE.Mesh(resGeo,new THREE.MeshStandardMaterial({color:col,emissive:0x111111}));
    m.position.copy(pos); m.userData.info={name,role}; g.add(m); const l=label(name,'#fff',.32,{name,role}); l.position.copy(pos.clone().add(new THREE.Vector3(0,0.35,0))); g.add(l);
    return {mesh:m,lab:l}; };
  g.res112 = mkRes('112', new THREE.Vector3(-0.7,1.2,0.6), 0x5fae7a, 'Cys112 (ε2/ε3) or Arg112 (ε4), the residue whose identity repositions Arg61 in ApoE4.');
  g.res158 = mkRes('158', new THREE.Vector3(0.7,-0.2,0.7), 0x8a95a3, 'Arg158 (ε3/ε4, common) or Cys158 (ε2), defines the second SNP.');
  g.res61  = mkRes('Arg61', new THREE.Vector3(-0.2,0.2,0.9), 0xf0d68a, 'In ApoE4, repositioned by Arg112 to form a salt bridge with Glu255, the pathogenic domain interaction.');
  g.res255 = mkRes('Glu255', new THREE.Vector3(0.1,-1.1,0.7), 0xf0d68a, 'Partners with Arg61 in ApoE4 to form the salt bridge that locks the domains together.');
  g.bridge = cyl(g.res61.mesh.position, g.res255.mesh.position, 0.06,
    new THREE.MeshStandardMaterial({color:0xe2705f,emissive:0x2a0c08}));
  g.bridge.userData.info={name:'Domain interaction (salt bridge)',role:'The Arg61–Glu255 bond unique to ApoE4, the removable pathogenic feature; a structure corrector breaks it.'};
  g.bridge.visible=false; g.add(g.bridge);
  g.bridgeLab = label('domain interaction','#ff9a9a',.34,g.bridge.userData.info);
  g.bridgeLab.position.copy(g.res61.mesh.position.clone().lerp(g.res255.mesh.position,.5).add(new THREE.Vector3(0.9,0,0)));
  g.bridgeLab.visible=false; g.add(g.bridgeLab);
  const lab=(t,c,pos,sc,info)=>{const l=label(t,c,sc,info);l.position.copy(pos);g.add(l);};
  lab('N-terminal · receptor-binding','#bfe0f0', new THREE.Vector3(0,3.05,0),.4,{name:'N-terminal domain (α-helices)',role:'Receptor-binding domain, four helices that dock ApoE into the LDL receptor.'});
  lab('LDLR-binding 136–150','#8fc4e2', new THREE.Vector3(1.7,2.15,0),.38,{name:'LDLR-binding region (136–150)',role:'Where ApoE engages the LDL receptor to clear lipids from the bloodstream.'});
  lab('C-terminal · lipid-binding','#a9d8c8', new THREE.Vector3(0,-3.35,0),.4,{name:'C-terminal domain',role:'Lipid-binding domain, anchors ApoE to lipoprotein particles.'});
  g.scale.setScalar(0.9);
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
  const tint = new THREE.Color(iso.col);
  apoe.prot.nGrp.children.forEach(c=>{ if(c.material?.color) c.material.color.lerp(tint,0.12); });
  $('#isoTag').textContent = `Isoform ${iso.name}${apoe.fix?' + corrector':''}`;
}
function animateApoe(){
  requestAnimationFrame(animateApoe);
  if(!isActive('apoe')) return;
  apoe.ctrl.update(); apoe.r.render(apoe.scene, apoe.cam);
}
function setView(v){
  apoe.view=v; apoe.dna.visible=(v==='dna'); apoe.prot.visible=(v==='protein');
  $('#viewSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  $('#geneTag').textContent = v==='dna' ? 'Double helix · codons 112 & 158' : 'Folded protein · two domains';
  $('#proteinCard').style.opacity = v==='protein'?1:.55;
  apoe.cam.position.set(0,0, v==='dna'?9:12.8);
  $('#geneLegend').innerHTML = v==='dna'
    ? '<span><i style="background:#5fae7a"></i>T allele (→Cys)</span><span><i style="background:#e2705f"></i>C allele (→Arg)</span><span><i style="background:#4a90c4"></i>strand A</span><span><i style="background:#46bfa0"></i>strand B</span><span><i style="background:#8493a0"></i>base pair</span>'
    : '<span><i style="background:#6fa8cf"></i>N-terminal domain</span><span><i style="background:#5fbf9f"></i>C-terminal domain</span><span><i style="background:#e2705f"></i>salt bridge (ε4)</span><span><i style="background:#f0d68a"></i>key residue</span>';
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
    const axon=new THREE.Mesh(new THREE.TubeGeometry(curve,30,0.03,8),axMat.clone()); axon.userData.info={name:'Nigrostriatal axon',role:'Carries dopamine signals to the striatum.'}; g.add(axon);
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
  L('Nigrostriatal axons','#e8d2b0',new THREE.Vector3(1.75,0.4,0),.36,{name:'Nigrostriatal axon',role:'Carries dopamine signals to the striatum.'});
  L('Dopamine','#ffe08a',new THREE.Vector3(-1.5,0.1,0),.34,{name:'Dopamine',role:'The neurotransmitter itself, released by the axon terminal and taken up by the striatum, its flow is what falls as substantia nigra neurons die.'});
  return g;
}
function updatePark(loss,rescue){
  const dopamine=clamp((1-loss/100)*100 + rescue*0.32, 0, 100);
  const nShow=Math.round((1-loss/100)*path.neurons.length);
  path.neurons.forEach((n,i)=>{
    const alive=i<nShow;
    n.body.material.color.set(alive?0x3a2416:0x9c8b78);
    n.body.material.emissiveIntensity=alive?0.5:0.05;
    n.body.scale.setScalar(alive?1:0.6);
    n.axon.material.opacity=alive?1:0.22; n.axon.material.transparent=!alive;
  });
  const nDopa=Math.round(dopamine/100*path.dopa.length);
  path.dopa.forEach((d,i)=>d.on=i<nDopa);
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
  for(let i=0;i<28;i++){ const a=i*2.399, rr=0.35+((i*13)%7)/12;
    const seg=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.3,6),fibMat);
    seg.position.set(-1.6+Math.cos(a)*rr,Math.sin(a)*rr,1.1+((i*7)%5)/8); seg.rotation.set(a,a*1.7,a*0.5);
    seg.visible=false; seg.userData.info={name:'Amyloid-β plaque',role:'Clumped amyloid-β fibrils aggregating into an extracellular senile plaque.'}; g.add(seg); path.fibrils.push(seg); }
  const L=(t,c,pos,sc,info)=>{const l=label(t,c,sc,info);l.position.copy(pos);g.add(l);};
  L('Neuron soma','#f0d4b8',new THREE.Vector3(-1.6,1.3,0),.38,{name:'Neuron soma',role:'Cell body of the neuron.'});
  L('Axon','#e8cfa8',new THREE.Vector3(1.95,0.6,0),.34,{name:'Axon',role:'Signal projection; transport runs along the microtubules.'});
  L('Microtubules','#bfe0d8',new THREE.Vector3(0.9,-0.9,0),.34,{name:'Microtubule',role:'Transport track normally stabilized by tau.'});
  L('Tau tangles (NFT)','#c9a06a',new THREE.Vector3(0.6,1.05,0),.36,{name:'Tau tangle (NFT)',role:'Hyperphosphorylated tau, collapses axonal transport.'});
  L('Amyloid-β plaque','#e88a70',new THREE.Vector3(-1.6,-1.45,1.1),.38,{name:'Amyloid-β plaque',role:'Clumped amyloid-β fibrils aggregating into an extracellular senile plaque.'});
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
    ? '<span><i style="background:#2c1a10"></i>Substantia nigra (neuromelanin)</span><span><i style="background:#3a2416"></i>Dopaminergic neuron</span><span><i style="background:#a8705a"></i>Striatum</span><span><i style="background:#ffe08a"></i>Dopamine</span>'
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
      <div class="kv"><b>Lesion</b><span>Dopaminergic neuron loss; motor signs appear once ~60–80% are gone.</span></div>
      <div class="kv"><b>Intervention</b><span>Aerobic exercise raises dopamine/BDNF and delays progression; meditation raises dopamine (2nd paper).</span></div>`;
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
    path.dopa.forEach(d=>{ if(!d.on){d.m.visible=false;return;} d.m.visible=true; d.t=(d.t+d.speed)%1; d.m.position.copy(d.curve.getPoint(d.t)); });
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
  state.apoe=+$('#apoe').value; state.synOn=$('#synOn').checked; state.month=+$('#month').value; state.pd=$('#pdMode').checked;
  $('#vO3').textContent=$('#o3').value+'%'; $('#vEx').textContent=$('#ex').value+'%';
  $('#vCst').textContent=$('#cst').value+'%'; $('#vMed').textContent=$('#med').value+'%';
  $('#vApoe').textContent=$('#apoe').value; $('#monthLbl').textContent=state.month;
  const tr = trajectory(state);
  const base = trajectory({...state, o3:0, ex:0, cst:0, med:0, synOn:false});
  brain._tr = tr;
  drawChart(tr, base); buildGauges(tr); updateBrain();
  $('#synVal').textContent = tr.syn.toFixed(1); $('#synBar').style.width=(tr.syn/SYN*100)+'%';
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
const PRESETS={ none:{o3:0,ex:0,cst:0,med:0}, single:{o3:0,ex:70,cst:0,med:0}, synergy:{o3:80,ex:80,cst:75,med:50} };
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
  <div class="note">This is a transparent, phenomenological teaching model, not a validated clinical predictor. Every <b>direction</b> of effect is grounded in the literature reviewed in the two papers; the <b>magnitudes</b> are illustrative and fully editable (see "Tune coefficients"). Use it to explore mechanisms and the synergy hypothesis, not to make health decisions.</div>
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
  <h3>The synergy hypothesis</h3>
  <p>Your central claim: these treatments are rarely studied <i>together</i>. The model adds a cross-product bonus, proportional to the products of intervention pairs, so a balanced multi-modal plan out-performs the sum of single treatments. Toggle it off to see the difference.</p>
  <div class="note">Coefficients recalibrated 2026-07-12 against real meta-analyses and RCTs (see <code>W</code> object in <code>app.js</code> for full per-coefficient citations, effect sizes, and confidence/population-match flags). Several placeholders were substantially larger than the literature supports and have been reduced, most real intervention→biomarker effects are small-to-moderate, not the dramatic swings the original placeholders implied. The synergy multiplier (SYN) has <i>no</i> dedicated interaction-effect study to calibrate against anywhere in the literature searched, it remains this model's explicit, labeled hypothesis, not a measured quantity.</div>
  <h3>Supporting research (external, peer-reviewed &amp; institutional)</h3>
  <p>The two companion papers are backed by published studies and by federal/university Alzheimer's research bodies, not just self-reviewed literature:</p>
  <div class="cite"><a href="https://pubmed.ncbi.nlm.nih.gov/26433119/" target="_blank" rel="noopener">Köbe et al., <i>NeuroImage</i> (2016), combined omega-3 + aerobic exercise + cognitive stimulation prevents gray-matter decline in MCI</a>
    <p>RCT, 22 MCI patients age 60–80: 6 months of omega-3 + aerobic cycling + cognitive stimulation (n=13) vs. omega-3 + non-aerobic stretching (n=9). Combined group preserved/grew gray matter in frontal, parietal &amp; cingulate cortex; controls declined. Backs this simulator's three-intervention synergy mechanic.</p>
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
  <p><small>Companion to: "Impact of Omega-3, Aerobic Exercise & CST on Neuroplasticity in Early-Stage Alzheimer's" and "Positive Re-wiring of a Dying Brain: Multi-Modal Neuroplasticity in Chronic Illness Pain Management." See <code>research/</code>.</small></p>
  <div class="cite"><a href="research/02_chronic_illness_neuroplasticity_paper.pdf?v=3" target="_blank" rel="noopener">Read the full paper (PDF), "Positive Re-wiring of a Dying Brain: Multi-Modal Neuroplasticity Enhancement in Chronic Illness Pain Management"</a>
    <p>The chronic-illness lit review behind this app's meditation/exercise/Parkinson's mechanics, in full, for anyone who wants to check the sourcing themselves rather than take the simulator's word for it.</p>
    <span class="src">Student research paper · PDF</span></div>
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
  $('#synOn').onchange=refresh;
  $('#play').onclick=togglePlay;
  document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset));
  $('#viewSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>setView(b.dataset.view));
  $('#isoSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>setIso(+b.dataset.iso));
  $('#fixOn').onchange=e=>{ apoe.fix=e.target.checked; updateFixState(); updateApoe(); };
  ['dissect','ghost'].forEach(id=>$('#'+id).oninput=()=>{setDissect(+$('#dissect').value);setGhost(+$('#ghost').value);updateInnerVis();});
  $('#brainReset').onclick=()=>{$('#dissect').value=100;$('#ghost').value=100;setDissect(100);setGhost(100);updateInnerVis();brain.cam.position.set(3.2,1.1,4.4);};
  $('#pathSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>setPview(b.dataset.pview));
  ['loss','rescue','burden','clear'].forEach(id=>$('#'+id).oninput=refreshPath);
  $('#simReset').onclick=()=>{ $('#o3').value=60;$('#ex').value=60;$('#cst').value=60;$('#med').value=30;$('#apoe').value=1;$('#month').value=0;$('#synOn').checked=true; refresh(); };
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
  buildChartLegend(); buildCoefTable(); initSci();
  initBrain(); initApoe(); initPath(); refresh();
}
boot();

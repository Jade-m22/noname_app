(() => {

  const __BASEURL__ =
    (document.querySelector('meta[name="docusaurus:baseUrl"]')?.content) || '/';
  const joinBase = (p) =>
    (__BASEURL__.endsWith('/') ? __BASEURL__.slice(0, -1) : __BASEURL__) +
    (p.startsWith('/') ? p : '/' + p);

  // Config 
  const READ_MORE_HREF = joinBase('/docs/overview');
  const END_SLOW_ZOOM_SPEED = 0.004;
  const END_SLOW_DRIFT = 0.0018;
  const CLONE_LAG = 0.75;
  const MEGA_START_T = 0.92;
  const MEGA_TRAVEL_DUR = 2.2;
  const MEGA_NODE_RATE = 0.12;
  const BG_POINTS_ALPHA = 0.14;

  const ANCHOR_T_TITLE = 0.30, ANCHOR_T_BODY  = 0.80;
  const ANCHOR_RADIUS_TITLE = 0.18, ANCHOR_RADIUS_BODY  = 0.32;
  const PULL_TITLE = 0.68, PULL_BODY  = 0.92;
  const BODY_HOLD_MS = 650, HOLD_SPEED_THRESHOLD = 0.35;
  const SECTION_VH = 205;

  // Canvas 
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');

  Object.assign(canvas.style, {
    position:'fixed', inset:'0', display:'block', width:'100vw', height:'100vh'
  });

  // Scroll spacer
  const spacer = document.getElementById('scroll-spacer') || (() => {
    const d=document.createElement('div'); d.id='scroll-spacer'; document.body.appendChild(d); return d;
  })();

  // DOM overlay
  const overlay = document.querySelector('.overlay');
  Object.assign(overlay.style, { position:'fixed', inset:'0' });

  const kicker  = document.getElementById('kicker');
  const title   = document.getElementById('title');
  const l1      = document.getElementById('line1') || (() => { const p=document.createElement('p'); p.id='line1'; p.className='line'; overlay.appendChild(p); return p;})();
  const l2      = document.getElementById('line2') || (() => { const p=document.createElement('p'); p.id='line2'; p.className='line'; overlay.appendChild(p); return p;})();

  // Dimensions
  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;

  // ---- Read more button (fixed bottom position with slide-up reveal)
  const readMore = (() => {
    const a=document.createElement('a');
    a.id='read-more';
    a.textContent='Read more';
    a.href=READ_MORE_HREF;
    Object.assign(a.style,{
      position:'fixed', left:'50%', bottom:'24px', transform:'translate(-50%, 56px)',
      zIndex:'20',
      padding:'14px 22px', borderRadius:'14px',
      fontSize:'16px', fontWeight:'700', letterSpacing:'0.2px',
      color:'#0b1220', textDecoration:'none',
      background:'linear-gradient(180deg,#bfe0ff,#8fbaff)',
      border:'1px solid rgba(255,255,255,0.7)',
      boxShadow:'0 10px 28px rgba(56,123,255,0.45), inset 0 0 12px rgba(255,255,255,0.35)',
      textShadow:'0 1px 0 rgba(255,255,255,0.6)',
      backdropFilter:'blur(6px)',
      opacity:'0', pointerEvents:'none',
      transition:'opacity .45s ease, transform .45s ease, box-shadow .3s ease',
    });
    a.onmouseenter = () => { a.style.boxShadow = '0 12px 34px rgba(56,123,255,0.55), inset 0 0 14px rgba(255,255,255,0.45)'; };
    a.onmouseleave = () => { a.style.boxShadow = '0 10px 28px rgba(56,123,255,0.45), inset 0 0 12px rgba(255,255,255,0.35)'; };
    overlay.appendChild(a);
    return a;
  })();

  // ---- Ghost overlay (handoff)
  const ghost = (() => {
    const d=document.createElement('div');
    d.className='overlay ghost';
    Object.assign(d.style,{ position:'absolute', inset:'0', display:'grid',
      alignContent:'center', justifyItems:'center', pointerEvents:'none', zIndex:'3' });
    const gK=document.createElement('p'); const gT=document.createElement('h1');
    const gL1=document.createElement('p'); gL1.className='line';
    const gL2=document.createElement('p'); gL2.className='line';
    [gK,gT,gL1,gL2].forEach(el=>{ el.style.opacity='0'; el.style.transform=`translateY(${45*H/100}px)`; el.style.willChange='transform,opacity'; });
    d.appendChild(gK); d.appendChild(gT); d.appendChild(gL1); d.appendChild(gL2);
    overlay.parentNode.appendChild(d);
    return {root:d, k:gK, t:gT, l:gL1, l2:gL2};
  })();

  // Scenes
  const SCENES = [
    { key:"prologue", kicker:"Prologue",
      title:"The world overflows with information.",
      l1:"Billions of voices speak at once, each certain, none aligned.",
      l2:"Trust thins. Meaning blurs. Noise reigns." },

    { key:"c1", kicker:"Chapter I — First Spark",
      title:"A nucleus appears — the debate.",
      l1:"Then comes a viewpoint, a reading, a sense.",
      l2:"A first line traces the first position." },

    { key:"c2", kicker:"Chapter II — Weaving",
      title:"The debate thickens: links branch out.",
      l1:"Arguments, counter-arguments, evidence and sources answer one another.",
      l2:"The network arranges into a living map of reasoning." },

    { key:"c3", kicker:"Chapter III — What Endures",
      title:"Some debates rise above.",
      l1:"Not because they shout the loudest. Not because they attract crowds.",
      l2:"But because challenges refine them — and they withstand collective scrutiny." },

    { key:"c4", kicker:"Chapter IV — The Market of Reasoning",
      title:"Here, we don't bet on outcomes — we bet on solidity of ideas.",
      l1:"Every position carries real commitment.",
      l2:"Trust becomes traceable, measurable, and shared." },

    { key:"c5", kicker:"Chapter V — A Collective Constellation",
      title:"Millions of ideas, one shared sky.",
      l1:"Each reflection feeds a greater whole.",
      l2:"The horizon reveals a vast, collective constellation." },
  ];
  const TOTAL = SCENES.length;

  // Placement overlay 
  const POS = {
    prologue:{ac:'center', ji:'center', ta:'center'},
    c1:{ac:'center', ji:'end',   ta:'right'},
    c2:{ac:'center', ji:'start', ta:'left'},
    c3:{ac:'start',  ji:'end',   ta:'right'},
    c4:{ac:'end',    ji:'center',ta:'center'},
    c5:{ac:'center', ji:'end',   ta:'right'},
  };
  function placeForKey(key, tgt=overlay){
    const p=POS[key]||POS.prologue;
    tgt.style.alignContent=p.ac; tgt.style.justifyItems=p.ji;
    const els = tgt===overlay ? [kicker,title,l1,l2] : [ghost.k,ghost.t,ghost.l,ghost.l2];
    els.forEach(el=> el.style.textAlign=p.ta);
  }
  function noTransition(el, apply){ const prev=el.style.transition; el.style.transition='none'; apply(); void el.offsetHeight; el.style.transition=prev||''; }
  function primeEl(el, y, op){ noTransition(el, () => { el.style.transform=`translateY(${y}px)`; el.style.opacity=op; }); }

  const setScrollHeight = () => spacer.style.height = `${SECTION_VH*TOTAL}vh`;
  setScrollHeight();

  // -------- Utils --------
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const ease=(e0,e1,x)=>{ const t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); };
  const RND=(a,b)=>Math.random()*(b-a)+a;
  const dist2=(a,b)=>{ const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy; };

  function cubicBezierY(y1, y2, t){
    const u = 1 - t;
    return (3*u*u*t*y1) + (3*u*t*t*y2) + (t*t*t);
  }
  function easeCinema(t){
    t = clamp(t, 0, 1);
    const e = cubicBezierY(0.08, 0.92, t);
    return Math.pow(e, 0.92);
  }

  // -------- Timeline state --------
  let smoothY = 0, lastY = 0, lastScrollTime = performance.now();
  let bodyHoldUntil = 0;
  let shownIdx=-1;
  let handoffNext=null;

  function nearestAnchorLocal(localT){
    const dTitle = Math.abs(localT - ANCHOR_T_TITLE);
    const dBody  = Math.abs(localT - ANCHOR_T_BODY);
    if (dBody <= dTitle) return { type:'body',  a: ANCHOR_T_BODY,  d: dBody  };
    return                   { type:'title', a: ANCHOR_T_TITLE, d: dTitle };
  }
  function snapLocalT(t){
    const n = nearestAnchorLocal(t);
    const radius = n.type === 'body' ? ANCHOR_RADIUS_BODY : ANCHOR_RADIUS_TITLE;
    if (n.d >= radius) return t;
    const pull = n.type === 'body' ? PULL_BODY : PULL_TITLE;
    const k = (Math.cos(Math.PI * (n.d / radius)) + 1) / 2;
    return lerp(t, n.a, pull * k);
  }
  function TL(){
    const total = document.documentElement.scrollHeight - innerHeight;
    const rawY = clamp(scrollY / Math.max(1, total), 0, 1);

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastScrollTime) / 1000);
    lastScrollTime = now;

    const speed = Math.abs(rawY - lastY) / Math.max(1e-6, dt);
    lastY = rawY;

    const localSection = (smoothY * TOTAL) % 1;
    const n = nearestAnchorLocal(localSection);
    const radius = n.type === 'body' ? ANCHOR_RADIUS_BODY : ANCHOR_RADIUS_TITLE;
    const near = 1 - Math.max(0, Math.min(1, n.d / radius));

    const base = 0.12 + 0.26 * Math.min(1, speed / 2);
    const anchorFactor = n.type === 'body' ? 0.48 : 0.60;
    let alpha = clamp(base * (anchorFactor + (1 - anchorFactor) * (1 - near)), 0.08, 0.30);

    if (n.type === 'body' && n.d < radius && speed > HOLD_SPEED_THRESHOLD && now > bodyHoldUntil) {
      bodyHoldUntil = now + BODY_HOLD_MS;
    }
    const holdActive = now < bodyHoldUntil && n.type === 'body';
    if (holdActive) alpha = Math.max(0.05, alpha * 0.45);

    smoothY = lerp(smoothY, rawY, 1 - Math.exp(-alpha));

    const p = smoothY * TOTAL;
    let idx = Math.floor(p); if (idx >= TOTAL) idx = TOTAL - 1;
    let t = p - idx;
    t = snapLocalT(t);
    if (holdActive) t = lerp(t, ANCHOR_T_BODY, 0.88);

    return { idx, t, dt, now };
  }

  function setGhostCopy(i){
    const s=SCENES[i];
    ghost.k.textContent=s.kicker; ghost.t.textContent=s.title; ghost.l.textContent=s.l1; ghost.l2.textContent=s.l2;
    placeForKey(s.key, ghost.root);
  }
  function setCopyFromIndex(i){
    if(handoffNext===i){
      const s=SCENES[i]; const isPrologue = s.key==="prologue";
      kicker.textContent=s.kicker; title.textContent=s.title; l1.textContent=s.l1; l2.textContent=s.l2;
      placeForKey(s.key);
      title.classList.toggle('title-prologue', isPrologue);
      title.classList.toggle('title-small', !isPrologue);
      [kicker,title,l1,l2].forEach(el=> primeEl(el, 0, 1));
      [ghost.k, ghost.t, ghost.l, ghost.l2].forEach(el=> primeEl(el, 45*H/100, 0));
      shownIdx=i; handoffNext=null; return;
    }
    if(i===shownIdx) return; shownIdx=i;
    const s=SCENES[i]; const isPrologue = s.key==="prologue";
    kicker.textContent=s.kicker; title.textContent=s.title; l1.textContent=s.l1; l2.textContent=s.l2;
    placeForKey(s.key);
    title.classList.toggle('title-prologue', isPrologue);
    title.classList.toggle('title-small', !isPrologue);
    if(s.key==="prologue"){ [kicker,title,l1,l2].forEach(el => primeEl(el, 0, 1)); }
    else { [kicker,title,l1,l2].forEach(el => primeEl(el, H*0.45, 0)); }
  }

  // Graph (main)
  const N=360; const nodes=[]; const edges=[];
  function initNodes(){ for(let i=0;i<N;i++) nodes.push({ i, x:RND(0,W), y:RND(0,H), vx:RND(-1,1), vy:RND(-1,1), r:RND(1.1,2.2) }); }
  function initEdgesPool(avg=4.8){
    const target=Math.floor((N*avg)/2), seen=new Set(); let tries=0;
    while(edges.length<target && tries<20000){
      const i=(Math.random()*N)|0, j=(Math.random()*N)|0; tries++;
      if(i===j) continue;
      const key=i<j?`${i}-${j}`:`${j}-${i}`; if(seen.has(key)) continue;
      const a=nodes[i], b=nodes[j];
      if(dist2(a,b)>(W*W+H*H)*0.05) continue;
      seen.add(key);
      edges.push({i,j,born:Math.random(), jitter:RND(-0.05,0.05), dir:(Math.random()<0.5?0:1)});
    }
  }
  initNodes(); initEdgesPool();

  const ch1={a:0,b:1}; let ABAdded=false;
  (function choosePair(){
    const cx=W*0.5, cy=H*0.5; let best=1e18, A=0,B=1;
    for(let t=0;t<300;t++){
      const ia=(Math.random()*N)|0, ib=(Math.random()*N)|0; if(ia===ib) continue;
      const na=nodes[ia], nb=nodes[ib];
      const d=(na.x-cx)**2+(na.y-cy)**2+(nb.x-cx)**2+(nb.y-cy)**2;
      if(d<best){best=d; A=ia; B=ib;}
    }
    ch1.a=A; ch1.b=B;
  })();

  // Pulses
  const edgePulses = [];
  function ensurePulse(ei){ if(!edgePulses[ei]) edgePulses[ei] = { u: Math.random(), speed: RND(0.16, 0.26) }; }

  // Sphere (C4)
  const sphereTargets = nodes.map((n,idx) => ({
    theta: (idx / N) * Math.PI * 2,
    phi: RND(-Math.PI/2, Math.PI/2),
    noise: RND(-1,1)
  }));
  function sphereParams(k){
    const margin = 16;
    const RmaxW = (W/2) - margin;
    const RmaxH = H*0.25;
    const R = Math.min(RmaxW, RmaxH);
    const cx = W*0.5;
    const cyTarget = H*0.28;
    const cy = lerp(H*0.5, cyTarget, k);
    return {R,cx,cy};
  }
  function sphereXYZ(i){
    const t=sphereTargets[i];
    const cp=Math.cos(t.phi), sp=Math.sin(t.phi), ct=Math.cos(t.theta), st=Math.sin(t.theta);
    return { x: cp*ct, y: sp, z: cp*st, n: t.noise };
  }
  function projectToSphere(i, k, cxOverride, cyOverride, scaleR=1){
    if(k<=0) return { x: nodes[i].x, y: nodes[i].y, z: 0 };
    const {R,cx,cy} = sphereParams(k);
    const s = sphereXYZ(i);
    const jitter = (0.06*R) * s.n * k;
    const baseR = (R + jitter) * scaleR;
    const sx = (cxOverride ?? cx) + baseR * s.x;
    const sy = (cyOverride ?? cy) + baseR * s.y;
    return { x: lerp(nodes[i].x, sx, k), y: lerp(nodes[i].y, sy, k), z: s.z };
  }
  let sphereK = 0;

  // Weave target
  function weaveTarget(idx, t) {
    if (idx <= 0) return 0;
    if (idx === 1) {
      const out = clamp(stageText._out || 0, 0, 1);
      return 0.32 * ease(0.02, 0.55, out);
    }
    if (idx === 2) {
      return 0.32 + 0.68 * ease(0.05, 0.90, t);
    }
    return 1.0;
  }

  // Time-clamped integrator
  let revealP = 0;
  function stepRevealTowards(target, dt, idx){
    const riseRate  = (idx<=2) ? 0.50 : 3.0;
    const fallRate  = 4.0;
    const delta = target - revealP;
    const maxUp   = riseRate * dt;
    const maxDown = fallRate * dt;
    if (delta > 0) revealP += Math.min(delta, maxUp);
    else           revealP += Math.max(delta, -maxDown);
    revealP = clamp(revealP, 0, 1);
    return revealP;
  }

  // Edges + pulses (2D/sphere) 
  function endpointsForEdge(e){
    if(sphereK>0){
      const PA = projectToSphere(e.i, sphereK), PB = projectToSphere(e.j, sphereK);
      return [PA, PB, (Math.max(0,PA.z)+Math.max(0,PB.z))/2];
    }
    return [nodes[e.i], nodes[e.j], 0];
  }
  function drawGrowingSegment(A, B, grow, dir){
    const t = clamp(grow, 0, 1);
    const S = dir===0 ? A : B;
    const E = dir===0 ? B : A;
    const gx = lerp(S.x, E.x, t), gy = lerp(S.y, E.y, t);
    ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(gx, gy); ctx.stroke();
    ctx.beginPath(); ctx.arc(gx, gy, 2.0, 0, Math.PI*2); ctx.fill();
    return {S,E,t};
  }
  function drawEdgesWithPulses(progress, dt, idx){
    const p = clamp(progress, 0, 1);
    if (p <= 0) return;

    for(let ei=0; ei<edges.length; ei++){
      const e = edges[ei];
      let bornAdj = clamp(e.born + (idx===2 ? (0.10*e.jitter) : 0), 0, 1);
      if(bornAdj>p) continue;

      const skipAB = (idx===1 && stageText._out < 0.35 && ((e.i===ch1.a && e.j===ch1.b) || (e.i===ch1.b && e.j===ch1.a)));
      if (skipAB) continue;

      const denom = (idx<=2) ? 0.38 : 0.18;
      const growBase = clamp((p - bornAdj) / denom, 0, 1);

      const [A,B,depth] = endpointsForEdge(e);
      const alphaBase = (sphereK>0) ? lerp(0.15, 0.30, depth) : (idx<=1?0.14: idx===2?0.20: (idx===3?0.24:0.30));

      ctx.strokeStyle=`rgba(120,165,255,${alphaBase})`;
      ctx.lineWidth=1.05;
      ctx.fillStyle='rgba(180,210,255,0.92)';

      const seg = drawGrowingSegment(A, B, growBase, e.dir);

      ensurePulse(ei);
      const pulse = edgePulses[ei];
      const speedMul = (idx<2 ? 0.52 : idx===2 ? 0.66 : idx===3 ? 0.80 : 0.90);
      pulse.u += pulse.speed * speedMul * dt;
      const maxU = Math.max(1e-3, seg.t);
      if (pulse.u > maxU) pulse.u -= Math.floor(pulse.u / maxU) * maxU;
      const px = lerp(seg.S.x, (e.dir===0?B:A).x, pulse.u);
      const py = lerp(seg.S.y, (e.dir===0?B:A).y, pulse.u);
      ctx.beginPath(); ctx.arc(px, py, 2.0, 0, Math.PI*2); ctx.fill();
    }
  }

  // BG points only 
  function drawBackgroundPoints(alpha){
    for(let i=0;i<N;i++){
      ctx.fillStyle=`rgba(157,180,255,${alpha})`;
      ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI*2); ctx.fill();
    }
  }

  // Sphere helpers 
  function drawSphereEdgesWithPulses(k, cx, cy, scale, dt){
    if(k<=0) return;
    for(let ei=0; ei<edges.length; ei++){
      const e = edges[ei];
      const A = projectToSphere(e.i, k, cx, cy, scale);
      const B = projectToSphere(e.j, k, cx, cy, scale);
      const depth = (Math.max(0,A.z)+Math.max(0,B.z))/2;
      ctx.strokeStyle=`rgba(120,165,255,${lerp(0.15,0.30,depth)})`;
      ctx.lineWidth=1.05;
      ctx.fillStyle='rgba(180,210,255,0.92)';
      ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.stroke();

      ensurePulse(ei);
      const pulse = edgePulses[ei];
      pulse.u += pulse.speed * 0.90 * dt;
      if (pulse.u > 1) pulse.u -= Math.floor(pulse.u);
      const px = lerp(A.x, B.x, pulse.u);
      const py = lerp(A.y, B.y, pulse.u);
      ctx.beginPath(); ctx.arc(px, py, 2.0, 0, Math.PI*2); ctx.fill();
    }
  }
  function renderSpherePoints(k, cx, cy, scale){
    if(k<=0) return;
    const deg = renderSpherePoints._deg || (renderSpherePoints._deg=(function(){const d=new Array(N).fill(0);for(const e of edges){d[e.i]++;d[e.j]++;}return d;})());
    const sorted=[...deg].sort((a,b)=>b-a);
    const cutoff=sorted[Math.max(0, Math.floor(N*0.08)-1)]||0;
    const pulse = 0.5 + 0.5*Math.sin(performance.now()*0.005);

    ctx.save(); ctx.globalCompositeOperation='screen';
    for(let i=0;i<N;i++){
      const P = projectToSphere(i, k, cx, cy, scale);
      const depth=(P.z*0.5+0.5);
      ctx.fillStyle=`rgba(157,180,255,${0.28 + 0.55*depth})`;
      ctx.beginPath(); ctx.arc(P.x,P.y,Math.max(1.0, nodes[i].r*(0.9+0.3*depth)),0,Math.PI*2); ctx.fill();

      if(deg[i]>=cutoff){
        const amp = 1.0 + 0.6*pulse;
        ctx.fillStyle='rgba(90,170,255,0.55)';
        ctx.beginPath(); ctx.arc(P.x,P.y,Math.max(2.2, nodes[i].r*3.0*amp),0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(220,240,255,0.95)';
        ctx.beginPath(); ctx.arc(P.x,P.y,Math.max(1.8, nodes[i].r*1.5*amp),0,Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();
  }

  // Clone staging (layout)
  function buildCloneDefs(){
    return [
      { target:{x:W*0.28, y:H*0.74}, scale:0.92, delay:0.18 },
      { target:{x:W*0.72, y:H*0.74}, scale:0.92, delay:0.24 },
      { target:{x:W*0.12, y:H*0.58}, scale:0.70, delay:0.30 },
      { target:{x:W*0.88, y:H*0.58}, scale:0.70, delay:0.34 },
      { target:{x:W*0.04, y:H*0.18}, scale:0.55, delay:0.40 },
      { target:{x:W*0.96, y:H*0.22}, scale:0.55, delay:0.44 },
    ].map(c=>{
      const dx = c.target.x - W*0.5, dy = c.target.y - H*0.55;
      const n = Math.hypot(dx,dy) || 1;
      const start = { x: c.target.x + (dx/n)*W*0.9, y: c.target.y + (dy/n)*H*0.9 };
      const theta = RND(0, Math.PI*2), phi=RND(-Math.PI/2, Math.PI/2);
      return { ...c, start, jx:RND(-1,1)*0.6, jy:RND(-1,1)*0.6, theta, phi, attached:false, attachK:0, tau:0 };
    });
  }
  let cloneDefs = buildCloneDefs();

  // MegaSphere state
  let endMode = false;
  let megaMode = false;
  let megaStart = 0;
  let endCamera = 0;
  const mega = { cx:0, cy:0, scale:1.35, k:0 };

  function enterEnd(now){ if(!endMode){ endMode = true; } }
  function enterMega(now){
    if(megaMode) return;
    megaMode = true; megaStart = now;
    mega.cx = W*0.5; mega.cy = H*0.52; mega.k = 0.0;
  }

  // ---- Anchor and trail for the main sphere (C4)
  const mainSphereAnchor = {
    theta: RND(0, Math.PI*2),
    phi: RND(-Math.PI/2, Math.PI/2),
    attached: false, tau:0, prev:null
  };

  // ---- Satellites
  function buildSatellites(){
    return [
      { x: W*0.07, y: H*0.08, scale: 0.78 },
      { x: W*0.93, y: H*0.86, scale: 0.86 },
    ];
  }
  let satellites = buildSatellites();

  // -------- Text (incl. C4->C5 orchestration) --------
  function stageText(i,t, c4ToC5Out=0, c5In=0){
    const key=SCENES[i].key;

    const ENTER = H*0.45;
    const EXIT_TITLE = H*1.10;
    const EXIT_BODY  = H*1.08;

    if(key==="prologue"){
      const up = - (H * 0.95) * ease(0.05,0.95,t);
      [kicker,title,l1,l2].forEach(el => { el.style.opacity = 1; el.style.transform = `translateY(${up}px)`; });
      [ghost.k, ghost.t, ghost.l, ghost.l2].forEach(el=> primeEl(el, 45*H/100, 0));
      stageText._ch1BodyIn=0; stageText._ch1TitleIn=0; stageText._ch3BodyIn=0; stageText._ch3TitleIn=0; stageText._out=0; stageText._ghostFor=null; return;
    }

    // Entrées (C2 corrigé pour éviter le flash des lignes)
    const aTitleIn = ease(0.00,0.30,t);
    const aBodyIn  =
      (key==="c1") ? ease(0.45,0.82,t) :
      (key==="c2") ? ease(0.56,0.90,t) :
                     ease(0.40,0.80,t);

    let aOut = ease(0.85,1.00,t);
    if(key==="c4"){ aOut = clamp( Math.max(aOut, c4ToC5Out), 0, 1 ); }

    if(key==="c5"){
      const inK = c5In;
      const y = lerp(H*1.10, 0, inK);
      const op = inK;
      placeForKey('c5');
      [kicker,title,l1,l2].forEach(el => { el.style.transform = `translateY(${y}px)`; el.style.opacity = op; });
      stageText._ghostFor = null; stageText._out = 0; return;
    }

    // Positionnement standard
    let titleY = (1-aTitleIn)*ENTER + (-EXIT_TITLE)*aOut;
    let bodyY  = (1-aBodyIn )*ENTER + (-EXIT_BODY )*aOut;

    // C2: cacher l1/l2 tant que le titre n’est pas posé
    let titleOp = aTitleIn, bodyOp  = aBodyIn;
    if (key==="c2" && aTitleIn < 0.92) { bodyOp = 0; bodyY = ENTER + (H * 0.30); }

    kicker.style.opacity = titleOp;
    title .style.opacity = titleOp;
    l1    .style.opacity = bodyOp;
    l2    .style.opacity = bodyOp;

    placeForKey(key);
    kicker.style.transform = `translateY(${titleY}px)`;
    title .style.transform = `translateY(${titleY}px)`;
    l1    .style.transform = `translateY(${bodyY }px)`;
    l2    .style.transform = `translateY(${bodyY }px)`;

    // Ghost (handoff standard)
    if(i < TOTAL-1){
      const nextIdx = i+1;
      if(!stageText._ghostFor || stageText._ghostFor !== nextIdx){
        setGhostCopy(nextIdx); stageText._ghostFor = nextIdx;
      }
      const baseK = clamp((-bodyY) / (H*0.95), 0, 1);
      const gY = (1 - baseK) * ENTER; const gOp = baseK;

      ghost.k.style.opacity = gOp; ghost.t.style.opacity = gOp;
      ghost.l.style.opacity = gOp; ghost.l2.style.opacity= gOp;

      ghost.k.style.transform = `translateY(${gY}px)`;
      ghost.t.style.transform = `translateY(${gY}px)`;
      ghost.l.style.transform = `translateY(${gY}px)`;
      ghost.l2.style.transform= `translateY(${gY}px)`;

      if(gOp > 0.985){ handoffNext = nextIdx; }
    } else {
      [ghost.k, ghost.t, ghost.l, ghost.l2].forEach(el=> primeEl(el, 45*H/100, 0));
      stageText._ghostFor = null;
    }

    stageText._ch1BodyIn  = (key==="c1") ? aBodyIn  : 0;
    stageText._ch1TitleIn = (key==="c1") ? aTitleIn : 0;
    stageText._ch3BodyIn  = (key==="c3") ? aBodyIn  : 0;
    stageText._ch3TitleIn = (key==="c3") ? aTitleIn : 0;
    stageText._out        = aOut;
  }

  // ===== Loop =====
  requestAnimationFrame(function draw(){
    const {idx,t,dt,now} = TL(); setCopyFromIndex(idx);

    // BG gradient
    const BG = [
      {a:'#03050a', b:'#0a0f19'},
      {a:'#050814', b:'#0d1422'},
      {a:'#07101c', b:'#111b2b'},
      {a:'#0a1320', b:'#1a2232'},
      {a:'#0a1422', b:'#1c2436'},
      {a:'#0a1526', b:'#1e273a'},
    ];
    function mixColor(h1,h2,t){ const p=c=>parseInt(c,16);
      const c1=[p(h1.slice(1,3)),p(h1.slice(3,5)),p(h1.slice(5,7))];
      const c2=[p(h2.slice(1,3)),p(h2.slice(3,5)),p(h2.slice(5,7))];
      const m=c1.map((v,i)=>Math.round(lerp(v,c2[i],t)));
      const h=v=>v.toString(16).padStart(2,'0');
      return `#${h(m[0])}${h(m[1])}${h(m[2])}`;
    }
    const cur = BG[idx]; const next = BG[Math.min(idx+1,BG.length-1)];
    const kbg = ease(0.85,1.00,t);
    const ca = mixColor(cur.a, next.a, kbg), cb = mixColor(cur.b, next.b, kbg);
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, ca); g.addColorStop(1, cb);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    // Physics (pre-C4)
    (function(){
      let chaos=0;
      if(idx===0){ chaos = lerp(1.6, 0.18, ease(0.05,0.95,t)); }
      else if(idx===1){ const base=lerp(0.18, 0.06, ease(0.10,0.90,t)); chaos = base * (1 - 0.90*(stageText._out||0)); }
      else if(idx===2){ chaos = 0.0; }
      else if(idx===3){ chaos = lerp(0.04, 0.03, ease(0.10,0.90,t)); }
      if(chaos>0){
        for(const n of nodes){
          n.vx += (Math.random()*0.3-0.15)*chaos*0.5;
          n.vy += (Math.random()*0.3-0.15)*chaos*0.5;
          const s=Math.hypot(n.vx,n.vy), maxS=1.6*chaos+0.05;
          if(s>maxS){ n.vx*=maxS/s; n.vy*=maxS/s; }
          n.x+=n.vx; n.y+=n.vy;
          if(n.x<-40) n.x=W+40; if(n.x>W+40) n.x=-40;
          if(n.y<-40) n.y=H+40; if(n.y>H+40) n.y=-40;
        }
      }
    })();

    // Reveal factor t
    const targetReveal = weaveTarget(idx,t);
    const reveal = stepRevealTowards(targetReveal, dt, idx);

    // ===== General rendering =====
    const isWorld = (idx>=4); // C4 & C5

    // CH1 - initial link
    if(idx===1){
      const bodyIn = stageText._ch1BodyIn||0, aTitleIn = stageText._ch1TitleIn||0, out=stageText._out||0;
      const CCx=W*0.5, CCy=H*0.5;
      const jx = Math.sin(now*0.003)*3*(1-out), jy = Math.cos(now*0.0023)*2*(1-out);
      const PA = { x: CCx + jx, y: CCy + jy };
      const B = nodes[ch1.b];

      const pulseAlive = bodyIn < 0.98;
      const pulse = pulseAlive ? (0.5 + 0.5*Math.sin(now*0.008)) : 0;
      const aAlpha  = Math.min(1, 0.55 + 0.35*aTitleIn + (pulseAlive ? 0.10*pulse : 0));
      const aRadius = (nodes[ch1.a].r) + (pulseAlive ? 1.1*pulse : 0);

      ctx.fillStyle=`rgba(255,255,255,${aAlpha})`;
      ctx.beginPath(); ctx.arc(PA.x,PA.y,aRadius,0,Math.PI*2); ctx.fill();

      ctx.fillStyle='rgba(157,180,255,0.92)';
      ctx.beginPath(); ctx.arc(B.x,B.y,B.r,0,Math.PI*2); ctx.fill();

      const grow = clamp((bodyIn - 0.02) / 0.98, 0, 1);
      if(grow>0){
        const width = lerp(2.0, 1.05, clamp(out*1.2,0,1));
        const alpha = lerp(0.60, 0.25, out);
        ctx.strokeStyle=`rgba(120,165,255,${alpha})`; ctx.lineWidth=width;
        ctx.beginPath(); ctx.moveTo(PA.x,PA.y);
        ctx.lineTo(lerp(PA.x,B.x,grow), lerp(PA.y,B.y,grow));
        ctx.stroke();

        if(grow>0.92){
          const u=(now*0.0006)%1; const qx=lerp(PA.x,B.x,u), qy=lerp(PA.y,B.y,u);
          ctx.fillStyle='rgba(160,205,255,0.95)'; ctx.beginPath(); ctx.arc(qx,qy,2.0,0,Math.PI*2); ctx.fill();
        }
      }

      if(!ABAdded && bodyIn>0.35){
        edges.push({ i: ch1.a, j: ch1.b, born: 0, jitter:RND(-0.04,0.04), dir:(Math.random()<0.5?0:1) });
        edgePulses.push(null); ABAdded = true;
      }
    }

    // BG & edges for < C4
    if(!isWorld){
      drawBackgroundPoints(idx===0?0.70:0.32);
      drawEdgesWithPulses(reveal, dt, idx);
      for(let i=0;i<N;i++){
        const alpha=(idx===0?0.70:0.78);
        ctx.fillStyle=`rgba(157,180,255,${alpha})`;
        ctx.beginPath(); ctx.arc(nodes[i].x,nodes[i].y,nodes[i].r,0,Math.PI*2); ctx.fill();
      }
    }

    // (C4 / C5)
    let attachP = 0;

    if(isWorld){
      drawBackgroundPoints(BG_POINTS_ALPHA);

      const tC4 = (idx===4) ? t : 1;
      const kForm = ease(0.00,0.95,tC4);

      if(idx===4 && t>MEGA_START_T) enterEnd(now);
      if(idx===5) enterEnd(now);
      if( (idx===4 && t>MEGA_START_T && !megaMode) || (idx===5 && !megaMode) ) enterMega(now);

      if(endMode && !megaMode) endCamera += END_SLOW_ZOOM_SPEED * dt;

      const cxC = W*0.5, cyC = H*0.24;
      const mainScale = 1.0 * (1 - 0.18*clamp(endCamera,0,1));

      if (!megaMode) {
        drawSphereEdgesWithPulses(kForm, cxC, cyC, mainScale, dt);
        renderSpherePoints(kForm, cxC, cyC, mainScale);
        mainSphereAnchor.prev = null; mainSphereAnchor.tau=0; mainSphereAnchor.attached=false;
      } else {
        const tauRaw = clamp((now - megaStart)/1000 / MEGA_TRAVEL_DUR, 0, 1);
        const tau = easeCinema(tauRaw);
        mainSphereAnchor.tau = tau;

        const anchor = spherePoint(mainSphereAnchor.theta, mainSphereAnchor.phi, mega.cx, mega.cy, 1, mega.scale);
        const arcAmp = 30;
        const mid = {
          x: (cxC + anchor.x)/2 + Math.sin(mainSphereAnchor.theta) * arcAmp,
          y: (cyC + anchor.y)/2 - Math.cos(mainSphereAnchor.theta) * arcAmp
        };

        const p1x = lerp(cxC, mid.x, tau);
        const p1y = lerp(cyC, mid.y, tau);
        const curX = lerp(p1x, anchor.x, Math.pow(tau, 0.85));
        const curY = lerp(p1y, anchor.y, Math.pow(tau, 0.85));

        const preZoom = 1 + 0.10 * ease(0.00, 0.25, tau);
        const shrink  = (1 - 0.88 * tau);
        const cineScale = Math.max(0.02, mainScale * preZoom * shrink);

        if (mainSphereAnchor.prev){
          ctx.save();
          ctx.strokeStyle = 'rgba(140,180,255,0.14)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(mainSphereAnchor.prev.x, mainSphereAnchor.prev.y);
          ctx.lineTo(curX, curY);
          ctx.stroke();
          ctx.restore();
        }
        mainSphereAnchor.prev = { x: curX, y: curY };

        if (tau < 0.985) {
          drawSphereEdgesWithPulses(kForm, curX, curY, cineScale, dt);
          renderSpherePoints(kForm, curX, curY, cineScale);
        } else {
          mainSphereAnchor.attached = true;
        }
      }

      // Clones
      const clonesP = ease(0.20, 0.98, (idx===4? t : 1));
      for(const c of cloneDefs){
        const baseLocal = clamp((clonesP - c.delay) / CLONE_LAG, 0, 1);
        const local = endMode ? 1 : baseLocal;
        if(local<=0) continue;

        const drift = Math.pow(local, 0.85);
        const dx = c.target.x - c.start.x, dy = c.target.y - c.start.y;
        let curX = c.start.x + dx*drift;
        let curY = c.start.y + dy*drift;

        if(endMode && !megaMode){
          curX += Math.sin(now*0.0008 + c.jx)*END_SLOW_DRIFT*W;
          curY += Math.cos(now*0.0007 + c.jy)*END_SLOW_DRIFT*H;
        }

        if(megaMode){
          const tau = clamp((now - megaStart)/1000 / MEGA_TRAVEL_DUR, 0, 1);
          c.tau = easeCinema(tau);

          mega.k = lerp(mega.k, 1.0, 1 - Math.exp(-3*dt));
          const anchor = spherePoint(c.theta, c.phi, mega.cx, mega.cy, 1, mega.scale);

          const mid = { x:(curX+anchor.x)/2 + Math.sin(c.theta)*30, y:(curY+anchor.y)/2 - Math.cos(c.theta)*30 };
          const p1 = { x: lerp(curX, mid.x, c.tau), y: lerp(curY, mid.y, c.tau) };
          const p2 = { x: lerp(mid.x, anchor.x, Math.pow(c.tau,0.85)), y: lerp(mid.y, anchor.y, Math.pow(c.tau,0.85)) };
          curX = p2.x; curY = p2.y;

          let bigScale = (c.scale * (0.92 + 0.08*drift)) * (1 - 0.22*clamp(endCamera,0,1));
          bigScale *= (1 - 0.85*c.tau);
          const showBig = !(c.tau>0.98);

          if(showBig){
            drawSphereEdgesWithPulses(kForm, curX, curY, Math.max(0.06, bigScale), dt);
            renderSpherePoints(kForm, curX, curY, Math.max(0.06, bigScale));
          } else { c.attached=true; c.attachK=1; }
        } else {
          let bigScale = (c.scale * (0.92 + 0.08*drift)) * (1 - 0.22*clamp(endCamera,0,1));
          drawSphereEdgesWithPulses(kForm, curX, curY, Math.max(0.06, bigScale), dt);
          renderSpherePoints(kForm, curX, curY, Math.max(0.06, bigScale));
        }

        if(c.attached){
          const P = spherePoint(c.theta, c.phi, mega.cx, mega.cy, 1, mega.scale);
          const pulse = 0.5 + 0.5*Math.sin(now*0.005);
          ctx.save(); ctx.globalCompositeOperation='screen';
          ctx.fillStyle=`rgba(90,170,255,${0.30 + 0.35*pulse})`;
          ctx.beginPath(); ctx.arc(P.x,P.y, 8+6*pulse, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle='rgba(220,240,255,0.95)';
          ctx.beginPath(); ctx.arc(P.x,P.y, 2.2+1.4*pulse, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        }
      }

      // Mega-sphere
      if(megaMode){
        endCamera += END_SLOW_ZOOM_SPEED * 0.25 * dt;

        drawSphereEdgesWithPulses(mega.k, mega.cx, mega.cy, mega.scale, dt);
        renderSpherePoints(mega.k, mega.cx, mega.cy, mega.scale);

        const deg = (function(){const d=new Array(N).fill(0);for(const e of edges){d[e.i]++;d[e.j]++;}return d;})();
        const sorted=[...deg].sort((a,b)=>b-a);
        const cutoff=sorted[Math.max(0, Math.floor(N*MEGA_NODE_RATE)-1)]||0;
        const pulse = 0.5 + 0.5*Math.sin(now*0.005);

        ctx.save(); ctx.globalCompositeOperation='screen';
        for(let i=0;i<N;i++) if(deg[i]>=cutoff && Math.random()<0.25){
          const P = projectToSphere(i, mega.k, mega.cx, mega.cy, mega.scale);
          ctx.fillStyle=`rgba(90,170,255,${0.22 + 0.38*pulse})`;
          ctx.beginPath(); ctx.arc(P.x,P.y, 5+4*pulse, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle='rgba(220,240,255,0.95)';
          ctx.beginPath(); ctx.arc(P.x,P.y, 1.8+1.2*pulse, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();

        // satellites
        for (const s of satellites) {
          drawSphereEdgesWithPulses(1, s.x, s.y, s.scale, dt);
          renderSpherePoints(1, s.x, s.y, s.scale);
        }

        // Progress attach pour orchestrer le texte/bouton
        let sum = mainSphereAnchor.tau || 0, cnt = 1;
        for(const c of cloneDefs){ sum += (c.tau||0); cnt++; }
        attachP = clamp(sum / Math.max(1,cnt), 0, 1);
      } else {
        attachP = 0;
      }
    }

    // C4->C5 orchestration
    const c4ToC5Out = attachP;
    const c5In      = easeCinema(attachP);

    // CH3 highlight
    function computeDegrees(progress){ const deg = new Array(N).fill(0); for(const e of edges){ if(e.born<=progress){ deg[e.i]++; deg[e.j]++; } } return deg; }
    if(idx===3){
      const glow = Math.max(stageText._ch3TitleIn||0, stageText._ch3BodyIn||0);
      if(glow>0){
        const deg = computeDegrees(1.0);
        const sorted=[...deg].sort((a,b)=>b-a);
        const topCount=Math.max(1,Math.floor(N*0.12));
        const cutoff=sorted[topCount-1]||0;

        ctx.save(); ctx.globalCompositeOperation = 'screen';
        const pulse = 0.5 + 0.5*Math.sin(performance.now()*0.005);
        for(let i=0;i<N;i++) if(deg[i]>=cutoff){
          const n=nodes[i];
          const amp  = 1.0 + 0.6*pulse;
          ctx.fillStyle=`rgba(90,170,255,0.65)`;
          ctx.beginPath(); ctx.arc(n.x,n.y,n.r*4.2*amp,0,Math.PI*2); ctx.fill();
          ctx.fillStyle=`rgba(130,200,255,0.75)`;
          ctx.beginPath(); ctx.arc(n.x,n.y,n.r*2.6*amp,0,Math.PI*2); ctx.fill();
          ctx.fillStyle=`rgba(220,240,255,0.95)`;
          ctx.beginPath(); ctx.arc(n.x,n.y,Math.max(1.6, n.r*1.25*amp),0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
      }
    }

    // Text staging
    if(idx===4){
      stageText(idx, t, c4ToC5Out, 0);
    } else if(idx===5){
      stageText(idx, t, 0, c5In);
    } else {
      stageText(idx, t, 0, 0);
    }

    // Read more button
    const isC5 = (SCENES[idx]?.key === 'c5');
    const btnK = isC5 ? Math.max(0, Math.min(1, c5In)) : 0;
    const btnVisible = btnK > 0.02;

    readMore.style.pointerEvents = btnVisible ? 'auto' : 'none';
    readMore.style.opacity = btnVisible ? String(Math.min(1, btnK*1.15)) : '0';
    readMore.style.transform = `translate(-50%, ${56*(1-btnK)}px)`;

    // Reset si retour avant C4
    if(!isWorld && (endMode || megaMode)){
      endMode=false; megaMode=false; endCamera=0; mega.k=0;
      for(const c of cloneDefs){ c.attached=false; c.attachK=0; c.tau=0; }
      mainSphereAnchor.attached = false; mainSphereAnchor.tau=0; mainSphereAnchor.prev=null;
      readMore.style.opacity='0';
      readMore.style.transform='translate(-50%, 56px)';
      readMore.style.pointerEvents='none';
    }

    requestAnimationFrame(draw);
  });

  // Sphere geometry helpers
  function spherePoint(theta, phi, cx, cy, k, scale){
    if(k<=0) return {x:cx, y:cy, z:0};
    const {R} = sphereParams(1);
    const cp=Math.cos(phi), sp=Math.sin(phi), ct=Math.cos(theta), st=Math.sin(theta);
    const baseR = (R * scale);
    return { x: cx + baseR*ct*cp, y: cy + baseR*sp, z: st*cp };
  }

  // Resize
  addEventListener('resize', () => {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
    setScrollHeight();
    cloneDefs = buildCloneDefs();
    satellites = buildSatellites();
  });
})();

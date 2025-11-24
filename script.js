// ====== DOM refs (cached once) ======
const steakWrap = document.getElementById("steakWrap");
const grill = document.getElementById("grill");
const fire  = document.getElementById("fire");
const glow  = document.getElementById("glow");
const smoke = document.getElementById("smoke");
const particlesBack = document.getElementById("particlesBack");
const particlesFront = document.getElementById("particlesFront");
const scrollHint = document.getElementById("scrollHint");
const texts = Array.from(document.querySelectorAll(".text-card"));
const textWrap = document.getElementById("textWrap");
const sceneEl = document.getElementById("scene");

if(!steakWrap || !grill || !fire || !glow || !smoke || !scrollHint || !textWrap || !sceneEl){
  console.error("Missing required DOM elements.");
}

// ====== helpers ======
const lerp = (a,b,t)=> a+(b-a)*t;
const clamp01 = x => Math.max(0,Math.min(1,x));
const easeInOut = t => (t<.5 ? 2*t*t : 1-((-2*t+2)**2)/2);

function getScrollProgress(){
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const y = window.scrollY || document.documentElement.scrollTop;
  return clamp01(y / (maxScroll || 1));
}

// segments
const segs = {
  intro:[0.00,0.10],
  pepper:[0.10,0.30],
  salt:[0.30,0.50],
  swing:[0.50,0.80],
  land:[0.80,1.00],
};
const segT = (p,[a,b]) => p<=a ? 0 : p>=b ? 1 : (p-a)/(b-a);

// ====== DYNAMIC SCROLL LENGTH ======
// ensures ALL devices can reach final steps
const stepCount = texts.length;
const VH_PER_STEP = 1.0;   // ~1 viewport per text step
const EXTRA_VH = 1.5;      // cushion for intro/landing

function setScrollLength(){
  const vhPx = window.innerHeight;          // real pixel viewport height
  const totalScreens = stepCount * VH_PER_STEP + EXTRA_VH;
  const totalPx = totalScreens * vhPx;      // convert to real px from vh

  const EXTRA_PX = 200;                     // buffer so all devices reach final steps
  document.body.style.minHeight = `${totalPx + EXTRA_PX}px`;
}


setScrollLength();
window.addEventListener("resize", setScrollLength);

// ====== LOGO ======
const logoSlot = document.getElementById("logoSlot");
let logoPaths = [];
let logoLens = [];

async function loadLogo(){
  try{
    const res = await fetch("/assets/logo.svg");
    if(!res.ok) return;
    const txt = await res.text();
    logoSlot.innerHTML = txt;

    const svg = logoSlot.querySelector("svg");
    if(svg && !svg.getAttribute("viewBox")){
      const w = svg.getAttribute("width") || 886;
      const h = svg.getAttribute("height") || 886;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.removeAttribute("width");
      svg.removeAttribute("height");
    }

    const all = [...logoSlot.querySelectorAll("path")];
    if(all.length){
      const firstFill = (all[0].getAttribute("fill") || "").toLowerCase();
      if(firstFill === "#000000" || firstFill === "black" || firstFill === "rgb(0,0,0)") all[0].remove();
    }

    const candidates = [...logoSlot.querySelectorAll("path")];
    const lens = candidates.map(p => p.getTotalLength());
    const maxLen = Math.max(...lens);
    const threshold = Math.max(35, maxLen * 0.28);

    logoPaths = candidates.filter((p,i)=> lens[i] >= threshold);
    logoLens = logoPaths.map(p=>{
      p.classList.add("logo-path");
      p.style.fill = "none";
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      return len;
    });

    candidates.forEach(p=>{ if(!logoPaths.includes(p)) p.style.display="none"; });
  }catch(e){}
}
function drawLogo(scrollP, finishAt){
  if(!logoPaths.length) return;
  const tRaw = clamp01(scrollP / finishAt);
  const t = tRaw*tRaw*(3-2*tRaw);
  logoPaths.forEach((p,i)=>{
    p.style.strokeDashoffset = logoLens[i] * (1 - t);
    p.style.opacity = 0.15 + 0.85*t;
  });
}
loadLogo();

// cache scene rect
let sceneRect = null;
function updateSceneRect(){ sceneRect = sceneEl.getBoundingClientRect(); }
updateSceneRect();
window.addEventListener("resize", updateSceneRect);

// ====== UNIFIED SWING (same for all steps) ======
const SWING_AMPLITUDE_X = 36;  // px left-right
const SWING_AMPLITUDE_R = 6;   // degrees tilt
const SWING_CYCLES = 1.35;     // full swings across full scroll

function unifiedSwing(p){
  const phase = p * Math.PI * 2 * SWING_CYCLES;

  // damp right before / during landing to settle smoothly
  const dampStart = segs.land[0];
  const dampT = p < dampStart ? 1 : lerp(1, 0, segT(p, segs.land));
  const damp = easeInOut(dampT);

  return {
    x: Math.sin(phase) * SWING_AMPLITUDE_X * damp,
    r: Math.sin(phase + 0.6) * SWING_AMPLITUDE_R * damp
  };
}

// ====== main loop ======
let prevStep = 0;

function animate(){
  const p = getScrollProgress();
  drawLogo(p, segs.land[0]);

  // text steps (robust so last card always triggers)
  const EPS = 1e-6;
  const stepIndex = Math.min(
    stepCount - 1,
    Math.floor(p * stepCount + EPS)
  );

  texts.forEach((t,i)=>{
    t.classList.remove("show","exit-right");
    if(i===stepIndex) t.classList.add("show");
    if(i===prevStep && prevStep!==stepIndex) t.classList.add("exit-right");
  });
  prevStep = stepIndex;
  textWrap.classList.toggle("final-on", stepIndex === stepCount - 1);

  // scroll hint
  if(p > 0.03){
    scrollHint.style.opacity = 0;
    scrollHint.style.transform = "translateX(-50%) translateY(10px)";
  } else {
    scrollHint.style.opacity = 0.95;
    scrollHint.style.transform = "translateX(-50%) translateY(0)";
  }

  // reset scene elements each frame
  grill.style.opacity=0;
  fire.style.opacity=0;
  glow.style.opacity=0;
  smoke.style.opacity=0;

  let x=0, y=0, r=0, scale=1;

  // unified swing values
  const { x: sx, r: sr } = unifiedSwing(p);

  // ====== FALL + SWING ======
  if (p <= segs.land[0]) {
    const tFall = easeInOut(segT(p, [0, segs.land[0]]));

    y = lerp(-160, 250, tFall);   // smooth continuous drop
    x = sx;
    r = sr;
    scale = lerp(1.04, 0.98, tFall);
  }

  // ====== LANDING ======
  const tl = segT(p, segs.land);
  if (p > segs.land[0]) {
    const t = easeInOut(tl);

    y = lerp(250, 270, t);        // sit on grill
    x = lerp(sx, 0, t);           // settle to center
    r = lerp(sr, 0, t);
    scale = lerp(0.98, 1.02, t);

    steakWrap.style.setProperty("--sear", t);

    grill.style.opacity = lerp(0,1,t);
    grill.style.transform =
      `translate(-50%,-50%) perspective(900px) rotateX(58deg) translateZ(-120px) scale(${lerp(.95,1,t)})`;
    fire.style.opacity  = lerp(0,1,t);
    glow.style.opacity  = lerp(0,1,t);

    // show smoke on landing
    smoke.style.opacity = lerp(0,1, clamp01((t-0.15)/0.6));
  }

  // apply transform
  steakWrap.style.transform =
    `translate(-50%,-50%)
     translate3d(${x}px,${y}px,140px)
     rotate(${r}deg)
     scale(${scale})`;

  requestAnimationFrame(animate);
}

animate();

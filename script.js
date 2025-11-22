// ====== DOM refs (cached once) ======
const steakWrap = document.getElementById("steakWrap");
const grill = document.getElementById("grill");
const fire  = document.getElementById("fire");
const glow  = document.getElementById("glow");
const smoke = document.getElementById("smoke");
const particlesBack = document.getElementById("particlesBack");
const particlesFront = document.getElementById("particlesFront");
const stuckLayer = document.getElementById("stuckLayer");
const scrollHint = document.getElementById("scrollHint");
const texts = Array.from(document.querySelectorAll(".text-card"));
const textWrap = document.getElementById("textWrap");
const sceneEl = document.getElementById("scene");

// ====== helpers ======
const lerp = (a,b,t)=> a+(b-a)*t;
const clamp01 = x => Math.max(0,Math.min(1,x));
const easeInOut = t => (t<.5 ? 2*t*t : 1-((-2*t+2)**2)/2);
const rand = i => {
  const x = Math.sin(i*999.1)*10000;
  return x - Math.floor(x);
};

function getScrollProgress(){
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  return clamp01((window.scrollY || document.documentElement.scrollTop) / (maxScroll || 1));
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

function steakCenterPx(){
  return { cx: sceneRect.width/2, cy: sceneRect.height*0.22 };
}

function swingX(t){
  // smaller amplitude, fewer oscillations = smoother
  const amp = lerp(90, 32, t);
  const phase = t * Math.PI * 2; // ~1 full sway
  return Math.sin(phase) * amp;
}
function swingR(t){
  const amp = lerp(16, 6, t);
  const phase = t * Math.PI * 2 + 0.5;
  return Math.sin(phase) * amp;
}
const swingEndX = swingX(1);
const swingEndR = swingR(1);

// ====== main loop ======
let prevStep = 0;

// Adjusted the initial position of the meat for step 1 to start higher and move down consistently
function animate(){
  const p = getScrollProgress();
  drawLogo(p, segs.land[0]);

  // text steps
  const stepCount = texts.length;
  const stepIndex = Math.max(0, Math.min(stepCount-1, Math.floor(p * stepCount)));
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

  // reset
  grill.style.opacity=0;
  fire.style.opacity=0;
  glow.style.opacity=0;
  smoke.style.opacity=0;

  let x=0,y=0,r=0,scale=1;

  if (p <= segs.swing[0]) {
    const tPre = easeInOut(clamp01(p / segs.swing[0])); 

    // continuous drop
    y = lerp(-160, 10, tPre);

    // gentle left-right sway during early steps
    const preAmp = lerp(18, 6, tPre);          // small sway that calms down
    const prePhase = p * Math.PI * 2;         // slow single sway across steps 1–3
    x = Math.sin(prePhase) * preAmp;

    // tiny matching tilt
    r = Math.sin(prePhase + 0.6) * lerp(4, 1, tPre);

    scale = lerp(1.04, 1.0, tPre);
  }

  // ====== SWING DESCENT (steps 4-ish) ======
  const tw = segT(p, segs.swing);
  if (p > segs.swing[0] && p <= segs.swing[1]) {
    const t = easeInOut(tw);

    // continue descending while swinging
    y = lerp(10, 250, t);
    x = swingX(t);
    r = swingR(t);
    scale = lerp(1.0, 0.98, t);
  }

  // landing
  const tl = segT(p,segs.land);
  if(p>segs.swing[1]){
    const t = easeInOut(tl);

    // finish higher so it sits on grill
    y = lerp(250,270,t);
    x = lerp(swingEndX,0,t);
    r = lerp(swingEndR,0,t);
    scale = lerp(0.98,1.02,t);

    steakWrap.style.setProperty("--sear", t);

    grill.style.opacity = lerp(0,1,t);
    grill.style.transform =
      `translate(-50%,-50%) perspective(900px) rotateX(58deg) translateZ(-120px) scale(${lerp(.95,1,t)})`;
    fire.style.opacity  = lerp(0,1,t);
    glow.style.opacity  = lerp(0,1,t);

    // show smoke on landing
    smoke.style.opacity = lerp(0,1, clamp01((t-0.15)/0.6));
  }

  steakWrap.style.transform =
    `translate(-50%,-50%)
     translate3d(${x}px,${y}px,140px)
     rotate(${r}deg)
     scale(${scale})`;

  requestAnimationFrame(animate);
}
animate();

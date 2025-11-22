// ====== DOM refs (cached once) ======
const steakWrap = document.getElementById("steakWrap");
const grill = document.getElementById("grill");
const fire  = document.getElementById("fire");
const glow  = document.getElementById("glow");
const particlesBack = document.getElementById("particlesBack");
const particlesFront = document.getElementById("particlesFront");
const stuckLayer = document.getElementById("stuckLayer");
const scrollHint = document.getElementById("scrollHint");
const texts = Array.from(document.querySelectorAll(".text-card"));
const searMarks = document.getElementById("searMarks");
const textWrap = document.getElementById("textWrap");
const sceneEl = document.getElementById("scene");
const smokeEl = document.getElementById("smoke");

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
      if(firstFill === "#000000" || firstFill === "black" || firstFill === "rgb(0,0,0)"){
        all[0].remove();
      }
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

    candidates.forEach(p=>{
      if(!logoPaths.includes(p)) p.style.display="none";
    });
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

// ====== particles ======
const PEPPER_COUNT = 40;
const SALT_COUNT   = 40;

function makeParticle(type, parent){
  const d = document.createElement("div");
  d.className = `p ${type}`;
  parent.appendChild(d);
  return d;
}
const pepperFall = Array.from({length:PEPPER_COUNT},()=>makeParticle("pepper", particlesBack));
const saltFall   = Array.from({length:SALT_COUNT},()=>makeParticle("salt", particlesFront));

function makeStuck(type){
  const d = document.createElement("div");
  d.className = `stuck ${type}`;
  stuckLayer.appendChild(d);
  return d;
}
const pepperStuck = Array.from({length:PEPPER_COUNT},()=>makeStuck("pepper"));
const saltStuck   = Array.from({length:SALT_COUNT},()=>makeStuck("salt"));

// cache scene rect
let sceneRect = null;
function updateSceneRect(){ sceneRect = sceneEl.getBoundingClientRect(); }
updateSceneRect();
window.addEventListener("resize", updateSceneRect);

function steakCenterPx(){
  return { cx: sceneRect.width/2, cy: sceneRect.height*0.22 };
}

function layoutStuck(list, seedOffset=0){
  list.forEach((s,i)=>{
    const r1 = rand(i+seedOffset);
    const r2 = rand(i*7.1+seedOffset);

    s.style.left = lerp(16,84,r1) + "%";
    s.style.top  = lerp(18,74,r2) + "%";

    const size = lerp(3.2, 7.2, rand(i*9.9 + seedOffset));
    s.style.width = size + "px";
    s.style.height = size + "px";

    const rot = lerp(-40, 40, rand(i*5.3 + seedOffset));
    s.style.transform = `rotate(${rot}deg)`;
  });
}
layoutStuck(pepperStuck, 22);
layoutStuck(saltStuck, 777);

function setFalling(list, t, seedOffset=0){
  const {cx, cy} = steakCenterPx();
  const tt = easeInOut(t);

  list.forEach((p,i)=>{
    const r1 = rand(i+seedOffset);
    const r2 = rand(i*7.3+seedOffset);

    const startX = cx + lerp(-160,160, r1);
    const startY = cy - lerp(180,280, r2);
    const endX   = cx + lerp(-90,90,  r1);
    const endY   = cy + lerp(-10,70,  r2);

    const x = lerp(startX, endX, tt);
    const y = lerp(startY, endY, tt);
    const spin = lerp(-120,180, tt);
    const sizeJitter = lerp(0.5, 1.4, rand(i*13.7 + seedOffset));
    const scale = lerp(.55,1.15, tt) * sizeJitter;
    const wobble = lerp(-12, 12, rand(i*3.3 + seedOffset));

    p.style.opacity = lerp(0,1, tt) * (t<.9 ? 1 : lerp(1,0,(t-.9)/.1));
    p.style.transform = `
      translate(${x}px,${y}px)
      rotate(${spin + wobble}deg)
      scale(${scale})
    `;
  });
}

const hideFalling = list => list.forEach(p=>p.style.opacity=0);
const showStuck = (list,a=1)=> list.forEach(s=>s.style.opacity=a);
const hideStuck = list => list.forEach(s=>s.style.opacity=0);

// ====== steak swing / landing ======
function swingX(t){
  const amp = lerp(140,55,t);
  const phase = t*Math.PI*3;
  return Math.sin(phase) * amp;
}
function swingR(t){
  const amp = lerp(28,10,t);
  const phase = t*Math.PI*3 + 0.6;
  return Math.sin(phase) * amp;
}
const swingEndX = swingX(1);
const swingEndR = swingR(1);

// ====== main loop ======
let prevStep = 0;

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

  // reset visibilities
  hideFalling(pepperFall);
  hideFalling(saltFall);
  hideStuck(pepperStuck);
  hideStuck(saltStuck);
  grill.style.opacity=0;
  fire.style.opacity=0;
  glow.style.opacity=0;
  if(smokeEl) smokeEl.style.setProperty("--smoke", 0);

  let x=0,y=0,r=0,scale=1;

  // intro
  const ti = segT(p,segs.intro);
  if(p<=segs.intro[1]) y = lerp(0,8,easeInOut(ti));

  // pepper
  const tp = segT(p,segs.pepper);
  if(p>segs.intro[1] && p<=segs.pepper[1]){
    y = lerp(0,10,easeInOut(tp));
    setFalling(pepperFall,tp,11);
    if(tp>0.9) showStuck(pepperStuck, lerp(0,1,(tp-0.9)/0.1));
  } else if(p>segs.pepper[1]){
    showStuck(pepperStuck,1);
  }

  // salt
  const ts = segT(p,segs.salt);
  if(p>segs.pepper[1] && p<=segs.salt[1]){
    y = 10;
    setFalling(saltFall,ts,999);
    if(ts>0.9) showStuck(saltStuck, lerp(0,1,(ts-0.9)/0.1));
  } else if(p>segs.salt[1]){
    showStuck(pepperStuck,1);
    showStuck(saltStuck,1);
  }

  // swing
  const tw = segT(p,segs.swing);
  if(p>segs.salt[1] && p<=segs.swing[1]){
    const t = easeInOut(tw);
    y = lerp(10,255,t);
    x = swingX(t);
    r = swingR(t);
    scale = lerp(1,0.98,t);
  }

  // landing + sear + smoke
  const tl = segT(p,segs.land);
  if(p>segs.swing[1]){
    const t = easeInOut(tl);
    y = lerp(255,300,t);
    x = lerp(swingEndX,0,t);
    r = lerp(swingEndR,0,t);
    scale = lerp(0.98,1.03,t);

    steakWrap.style.setProperty("--sear", t);
    if(searMarks) searMarks.style.opacity = t;

    // smoke fades in quickly when landing starts
    if(smokeEl){
      const smokeT = clamp01((t - 0.08) / 0.92); // delay a hair
      smokeEl.style.setProperty("--smoke", smokeT);
    }

    grill.style.opacity = lerp(0,1,t);
    grill.style.transform =
      `translate(-50%,-50%) perspective(900px) rotateX(58deg) translateZ(-120px) scale(${lerp(.95,1,t)})`;
    fire.style.opacity  = lerp(0,1,t);
    glow.style.opacity  = lerp(0,1,t);
  }

  steakWrap.style.transform =
    `translate(-50%,-50%)
     translate3d(${x}px,${y}px,140px)
     rotate(${r}deg)
     scale(${scale})`;

  requestAnimationFrame(animate);
}

animate();

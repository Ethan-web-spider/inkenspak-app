import { categories, colors, keywordMap } from './keywords.js';

const canvas = document.getElementById("canvas");
const input = document.getElementById("thoughtInput");
const micBtn = document.getElementById("micButton");
const center = { x: window.innerWidth / 2, y: (window.innerHeight - 60) / 2 };
const orbitRadius = 110;
const orbitSpeed = 0.00075;
const categoryElements = {};
const thoughtBubbles = {};
let time = 0;
let currentOverlay = null;
let isRecording = false;
let rec = null;

const popSounds = ['pop1.wav', 'pop2.wav', 'pop3.wav', 'pop4.wav'].map(src => {
  const audio = new Audio(src);
  audio.load();
  return audio;
});

function detectCategory(text) {
  const t = text.toLowerCase();
  for (let cat of categories) {
    if (keywordMap[cat].some(word => t.includes(word))) return cat;
  }
  return "Random";
}

function createCategoryBubbles() {
  categories.forEach((cat, i) => {
    const el = document.createElement("div");
    el.className = "category";
    el.innerText = cat;
    el.style.setProperty('--cat-color', colors[cat]);
    canvas.appendChild(el);
    categoryElements[cat] = { el: el, angle: (i / categories.length) * 2 * Math.PI };
    thoughtBubbles[cat] = [];
    el.onclick = () => openZoom(cat);
  });
}

function animate() {
  time += 1;
  categories.forEach(cat => {
    const angle = categoryElements[cat].angle + time * orbitSpeed;
    const x = center.x + orbitRadius * Math.cos(angle) - 80;
    const y = center.y + orbitRadius * Math.sin(angle) - 80;
    const el = categoryElements[cat].el;
    el.style.left = `${x + 60}px`;
    el.style.top = `${y}px`;

    thoughtBubbles[cat].forEach((b, i) => {
      const offset = 20 + i * 8;
      const innerAngle = (i / thoughtBubbles[cat].length) * 2 * Math.PI;
      b.style.left = `${x + offset * Math.cos(innerAngle)}px`;
      b.style.top = `${y + offset * Math.sin(innerAngle)}px`;
    });
  });
  requestAnimationFrame(animate);
}

function addThought(text) {
  const sanitized = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cat = detectCategory(sanitized);
  if (thoughtBubbles[cat].length >= 7) return;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerText = sanitized;
  bubble.style.setProperty('--bubble-color', colors[cat]);
  bubble.style.left = `${center.x}px`;
  bubble.style.top = `${center.y}px`;
  canvas.appendChild(bubble);
  thoughtBubbles[cat].push(bubble);

  bubble.style.transition = 'all 1s ease';
  bubble.style.transform = 'scale(1.2)';
  setTimeout(() => bubble.style.transform = 'scale(0.9)', 100);

  const target = categoryElements[cat].el.getBoundingClientRect();
  const targetX = target.left + target.width / 2;
  const targetY = target.top + target.height / 2;
  const startX = center.x;
  const startY = center.y;

  let frame = 0;
  const maxFrames = 120;
  function animateMove() {
    frame++;
    const t = Math.min(1, frame / maxFrames);
    const x = startX + (targetX - startX) * t;
    const y = startY + (targetY - startY) * t;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    if (t < 1) requestAnimationFrame(animateMove);
  }
  animateMove();

  bubble.onclick = e => {
    e.stopPropagation();
    bubble.classList.add("pop-effect");
    const sound = popSounds[Math.floor(Math.random() * popSounds.length)];
    sound.currentTime = 0;
    sound.play();
    if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(() => {
      bubble.remove();
      const index = thoughtBubbles[cat].indexOf(bubble);
      if (index !== -1) thoughtBubbles[cat].splice(index, 1);
    }, 300);
  };
}

function openZoom(cat) {
  if (currentOverlay) currentOverlay.remove();
  const overlay = document.createElement("div");
  overlay.className = "zoom-view";
  overlay.style.setProperty('--cat-color', colors[cat]);
  document.body.appendChild(overlay);

  const container = document.createElement("div");
  container.style.position = 'absolute';
  container.style.width = '150px';
  container.style.height = '150px';
  container.style.borderRadius = '50%';
  container.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), ${colors[cat]})`;
  container.style.left = '50%';
  container.style.top = '50%';
  container.style.transform = 'translate(-50%, -50%) scale(1)';
  container.style.transition = 'transform 0.5s ease';
  overlay.appendChild(container);
  setTimeout(() => container.style.transform = 'translate(-50%, -50%) scale(1.2)', 10);

  [...thoughtBubbles[cat]].forEach(b => {
    const z = document.createElement("div");
    z.className = "zoom-bubble";
    z.innerText = b.innerText;
    z.style.setProperty('--bubble-color', colors[cat]);
    container.appendChild(z);
    let x = 150 + Math.random() * 100;
    let y = 150 + Math.random() * 100;
    let dx = Math.random() > 0.5 ? 1 : -1;
    let dy = Math.random() > 0.5 ? 1 : -1;
    const animateZoom = () => {
      const radius = 75;
      const cx = 100;
      const cy = 100;
      const dxRel = x - cx;
      const dyRel = y - cy;
      const dist = Math.sqrt(dxRel ** 2 + dyRel ** 2);
      const speed = 1.2;
      if (dist >= radius - 40) {
        const angle = Math.atan2(dyRel, dxRel);
        x = cx + (radius - 41) * Math.cos(angle);
        y = cy + (radius - 41) * Math.sin(angle);
        dx *= -1;
        dy *= -1;
      }
      x += dx * speed;
      y += dy * speed;
      z.style.left = `${x}px`;
      z.style.top = `${y}px`;
      requestAnimationFrame(animateZoom);
    };
    animateZoom();
    z.onclick = e => {
      e.stopPropagation();
      z.classList.add("pop-effect");
      const sound = popSounds[Math.floor(Math.random() * popSounds.length)];
      sound.currentTime = 0;
      sound.play();
      if (navigator.vibrate) navigator.vibrate(30);
      setTimeout(() => {
        z.remove();
        const original = thoughtBubbles[cat].find(b => b.innerText === z.innerText);
        if (original) {
          const index = thoughtBubbles[cat].indexOf(original);
          if (index !== -1) {
            original.remove();
            thoughtBubbles[cat].splice(index, 1);
          }
        }
      }, 300);
    };
  });

  const exitBtn = document.createElement("button");
  exitBtn.innerText = "Close";
  exitBtn.style.position = "absolute";
  exitBtn.style.top = "calc(50% + 110px)";
  exitBtn.style.zIndex = "200";
  exitBtn.style.position = "fixed";
  exitBtn.style.left = "50%";
  exitBtn.style.transform = "translateX(-50%)";
  exitBtn.style.padding = "10px 15px";
  exitBtn.style.border = "none";
  exitBtn.style.borderRadius = "12px";
  exitBtn.style.background = "#e53935";
  exitBtn.style.color = "white";
  exitBtn.style.fontWeight = "bold";
  exitBtn.style.cursor = "pointer";
  overlay.appendChild(exitBtn);
  exitBtn.onclick = () => overlay.remove();

  currentOverlay = overlay;
}

document.getElementById("addButton").onclick = () => {
  const val = input.value.trim();
  if (val.length >= 3) {
    addThought(val);
    input.value = "";
  }
};

document.getElementById("mobileAddButton").onclick = () => {
  const val = input.value.trim();
  if (val.length >= 3) {
    addThought(val);
    input.value = "";
  }
};

input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const val = input.value.trim();
    if (val.length >= 3) {
      addThought(val);
      input.value = "";
    }
  }
});

micBtn.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  if (isRecording) {
    rec.stop();
    micBtn.classList.remove('recording');
    micBtn.style.backgroundColor = '#e53935';
    isRecording = false;
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert("Speech recognition not supported.");
  rec = new SpeechRecognition();
  rec.continuous = true;
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        if (text.length > 3) {
          text.split(/[.?!]/).forEach(p => {
            if (p.trim().length > 3) addThought(p.trim());
          });
        }
      }
    }
  };
  rec.onerror = e => console.error("Mic error:", e);
  rec.onend = () => {
    micBtn.classList.remove('recording');
    micBtn.style.backgroundColor = '#e53935';
    isRecording = false;
  };
  rec.start();
  micBtn.classList.add('recording');
  micBtn.style.backgroundColor = '#4CAF50';
  isRecording = true;
});

createCategoryBubbles();
micBtn.style.backgroundColor = isRecording ? '#4CAF50' : '#e53935';
animate();

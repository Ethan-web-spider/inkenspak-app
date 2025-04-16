// app.js

const categories = ["Reflection", "Plans", "Emotions", "Productivity", "Growth", "Conversations", "Random"];
const colors = {
  Reflection: '#6C63FF', Plans: '#00C896', Emotions: '#FF6B6B',
  Productivity: '#F9A825', Growth: '#A3E635', Conversations: '#29B6F6', Random: '#9C27B0'
};

function detectCategory(text) {
  const lowered = text.toLowerCase();
  for (const cat of categories) {
    if (window.keywordMap[cat].some(word => lowered.includes(word))) {
      return cat;
    }
  }
  return window.detectWithNLP ? window.detectWithNLP(text) : "Random";
}

const canvas = document.getElementById("canvas");
const input = document.getElementById("thoughtInput");
const micBtn = document.getElementById("micButton");
const center = { x: window.innerWidth / 2, y: (window.innerHeight - 60) / 2 };
const orbitRadius = 110;
const orbitSpeed = 0.00075;
const categoryElements = {};
const thoughtBubbles = {};
let time = 0;
let rec = null;
let isRecording = false;

const popSounds = ["pop1.wav", "pop2.wav", "pop3.wav", "pop4.wav"].map(src => {
  const a = new Audio(src);
  a.load();
  return a;
});

function createCategoryBubbles() {
  categories.forEach((cat, i) => {
    const el = document.createElement("div");
    el.className = "category";
    el.innerText = cat;
    el.style.setProperty('--cat-color', colors[cat]);
    canvas.appendChild(el);

    categoryElements[cat] = {
      el: el,
      angle: (i / categories.length) * 2 * Math.PI
    };
    thoughtBubbles[cat] = [];

    el.onclick = () => {
      if (navigator.vibrate) navigator.vibrate(20);
      alert(`Category: ${cat}`); // Replace with zoom logic if needed
    };
  });
}

function animate() {
  time++;
  categories.forEach(cat => {
    const angle = categoryElements[cat].angle + time * orbitSpeed;
    const x = center.x + orbitRadius * Math.cos(angle) - 45;
    const y = center.y + orbitRadius * Math.sin(angle) - 45;
    const el = categoryElements[cat].el;
    el.style.left = `${x + 60}px`;
    el.style.top = `${y}px`;

    thoughtBubbles[cat].forEach((b, i) => {
      const offset = 10 + i * 6;
      const innerAngle = (i / thoughtBubbles[cat].length) * 2 * Math.PI;
      b.style.left = `${x + offset * Math.cos(innerAngle)}px`;
      b.style.top = `${y + offset * Math.sin(innerAngle)}px`;
    });
  });
  requestAnimationFrame(animate);
}

function addThought(text) {
  const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cat = detectCategory(safeText);
  if (thoughtBubbles[cat].length >= 7) return;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerText = safeText;
  bubble.style.setProperty('--bubble-color', colors[cat]);
  bubble.style.left = `${center.x}px`;
  bubble.style.top = `${center.y}px`;
  canvas.appendChild(bubble);
  thoughtBubbles[cat].push(bubble);

  const target = categoryElements[cat].el.getBoundingClientRect();
  const targetX = target.left + target.width / 2;
  const targetY = target.top + target.height / 2;
  const startX = center.x;
  const startY = center.y;

  let frame = 0;
  const maxFrames = 120;

  function move() {
    frame++;
    const t = Math.min(1, frame / maxFrames);
    const x = startX + (targetX - startX) * t;
    const y = startY + (targetY - startY) * t;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    if (t < 1) requestAnimationFrame(move);
  }
  move();

  bubble.onclick = (e) => {
    e.stopPropagation();
    bubble.classList.add("pop-effect");
    const sound = popSounds[Math.floor(Math.random() * popSounds.length)];
    sound.currentTime = 0;
    sound.play();
    if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(() => {
      bubble.remove();
      const i = thoughtBubbles[cat].indexOf(bubble);
      if (i !== -1) thoughtBubbles[cat].splice(i, 1);
    }, 300);
  };
}

function setupInput() {
  const addBtn = document.getElementById("addButton");
  const mobileBtn = document.getElementById("mobileAddButton");

  const handle = () => {
    const val = input.value.trim();
    if (val.length >= 3) {
      addThought(val);
      input.value = "";
    }
  };

  addBtn.onclick = handle;
  mobileBtn.onclick = handle;

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") handle();
  });
}

function setupMic() {
  micBtn.addEventListener('mousedown', () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported in this browser.");

    rec = new SpeechRecognition();
    rec.continuous = true;
    rec.lang = "en-US";
    rec.interimResults = false;

    rec.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript.trim();
        if (r.isFinal && t.length > 3) {
          t.split(/(?<=[.?!])\s+/).forEach(p => {
            if (p.trim().length > 3) addThought(p.trim());
          });
        }
      }
    };

    rec.onerror = e => console.error("Mic error:", e);
    rec.onend = () => stopRecording();

    rec.start();
    micBtn.classList.add("recording");
    micBtn.style.backgroundColor = '#4CAF50';
    isRecording = true;
  });
}

function stopRecording() {
  if (rec) rec.stop();
  micBtn.classList.remove("recording");
  micBtn.style.backgroundColor = '#e53935';
  isRecording = false;
}

// Initialize app
createCategoryBubbles();
setupInput();
setupMic();
animate();

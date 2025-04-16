import './compromise.js';

const categories = ["Reflection", "Plans", "Emotions", "Productivity", "Growth", "Conversations", "Random"];
const colors = {
  Reflection: '#6C63FF', Plans: '#00C896', Emotions: '#FF6B6B',
  Productivity: '#F9A825', Growth: '#A3E635', Conversations: '#29B6F6', Random: '#9C27B0'
};

function detectCategory(text) {
  const t = text.toLowerCase();
  for (let cat of categories) {
    if (window.keywordMap[cat].some(word => t.includes(word))) return cat;
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
let currentOverlay = null;
let isRecording = false;
let rec;

const popSounds = ["pop1.wav", "pop2.wav", "pop3.wav", "pop4.wav"].map(src => {
  const audio = new Audio(src);
  audio.load();
  return audio;
});

function createCategoryBubbles() {
  categories.forEach((cat, i) => {
    const el = document.createElement("div");
    el.className = "category";
    el.innerText = cat;
    el.style.setProperty('--cat-color', colors[cat]);
    canvas.appendChild(el);
    categoryElements[cat] = { el: el, angle: (i / categories.length) * 2 * Math.PI };
    thoughtBubbles[cat] = [];
    el.onclick = () => {
      if (navigator.vibrate) navigator.vibrate(20);
      openZoom(cat);
    };
  });
}

function animate() {
  time += 1;
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

  let frame = 0;
  const maxFrames = 120;
  const target = categoryElements[cat].el.getBoundingClientRect();
  const targetX = target.left + target.width / 2;
  const targetY = target.top + target.height / 2;
  const startX = center.x;
  const startY = center.y;

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

  bubble.onclick = (e) => {
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

createCategoryBubbles();
animate();

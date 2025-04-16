compromise.js
// compromise.js
// Requires compromise to be loaded first via <script src="https://unpkg.com/compromise"></script>

function detectWithNLP(text) {
  if (typeof window.nlp !== "function") {
    console.warn("Compromise NLP not loaded.");
    return "Random";
  }

  const doc = nlp(text);
  const nouns = doc.nouns().out('array');
  const verbs = doc.verbs().out('array');
  const topics = [...nouns, ...verbs].map(w => w.toLowerCase());

  const scores = {};
  for (const category in window.keywordMap) {
    scores[category] = 0;
    for (const keyword of window.keywordMap[category]) {
      if (topics.includes(keyword.toLowerCase())) {
        scores[category]++;
      }
    }
  }

  let bestCategory = "Random";
  let maxScore = 0;

  for (const category in scores) {
    if (scores[category] > maxScore) {
      maxScore = scores[category];
      bestCategory = category;
    }
  }

  return bestCategory;
}

// Attach to global scope
window.detectWithNLP = detectWithNLP;

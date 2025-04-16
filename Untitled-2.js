// compromise.js logic for NLP fallback
// This file assumes compromise is loaded via <script src="https://unpkg.com/compromise"></script> in index.html

function detectWithNLP(text) {
    if (!window.nlp) return null; // fallback if compromise not loaded
    const doc = nlp(text);
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    const topics = [...nouns, ...verbs].map(w => w.toLowerCase());
  
    const scores = {};
    for (const cat of Object.keys(window.keywordMap)) {
      scores[cat] = 0;
      for (const word of window.keywordMap[cat]) {
        if (topics.includes(word.toLowerCase())) {
          scores[cat]++;
        }
      }
    }
  
    let bestCategory = "Random";
    let highest = 0;
    for (const [cat, score] of Object.entries(scores)) {
      if (score > highest) {
        highest = score;
        bestCategory = cat;
      }
    }
  
    return bestCategory;
  }
  
  window.detectWithNLP = detectWithNLP;
  
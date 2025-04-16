function detectWithNLP(text) {
    if (typeof window.nlp !== "function") {
      console.warn("Compromise NLP not loaded.");
      return "Random";
    }
  
    const doc = nlp(text);
    const nouns = doc.nouns().out("array");
    const verbs = doc.verbs().out("array");
    const adjectives = doc.adjectives().out("array");
    const terms = [...nouns, ...verbs, ...adjectives].map(w => w.toLowerCase());
  
    const scores = {};
    for (const category in window.keywordMap) {
      scores[category] = 0;
      for (const keyword of window.keywordMap[category]) {
        if (terms.includes(keyword)) scores[category]++;
      }
    }
  
    let bestCategory = "Random";
    let highestScore = 0;
    for (const category in scores) {
      if (scores[category] > highestScore) {
        highestScore = scores[category];
        bestCategory = category;
      }
    }
  
    return bestCategory;
  }
  
  window.detectWithNLP = detectWithNLP;
  
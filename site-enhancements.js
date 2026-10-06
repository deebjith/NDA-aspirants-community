/* Responsive and study-flow fixes for NDA Aspirants Community. */
(() => {
  const safeRead = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value == null ? fallback : value;
    } catch { return fallback; }
  };

  const addTypedAnswerHandler = () => {
    window.submitTypedAIAnswer = event => {
      event?.preventDefault();
      const field = document.getElementById('aiTextAnswer');
      const answer = field?.value.trim();
      if (!answer) { field?.focus(); return; }
      if (typeof aiInterviewState === 'undefined' || !aiInterviewState.active) { window.showToast?.('Start the interview before submitting an answer.'); return; }
      field.value = '';
      window.submitAIAnswer(answer);
    };
    const toggleVoice = window.toggleAIListening;
    if (typeof toggleVoice === 'function') window.toggleAIListening = function () {
      if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
        if (typeof aiInterviewState === 'undefined' || !aiInterviewState.active) window.showToast?.('Start the interview first.');
        else { window.showToast?.('Voice recognition is unavailable here. Type your answer below.'); document.getElementById('aiTextAnswer')?.focus(); }
        return;
      }
      return toggleVoice.apply(this, arguments);
    };
    const finish = window.finishAIInterview;
    if (typeof finish === 'function') window.finishAIInterview = async function () {
      const result = await finish.apply(this, arguments);
      document.getElementById('aiTextAnswer').disabled = true;
      document.getElementById('aiTextSubmit').disabled = true;
      return result;
    };
  };

  const questionComplexity = question => {
    const text = String(question?.q || '').replace(/\[(?:new question variant|practice set|chapter:)[^\]]*\]/gi, '').trim();
    const numbers = text.match(/\d+/g) || [];
    const numericWeight = numbers.reduce((sum, value) => sum + Math.min(3, Math.log10(Number(value) + 1)), 0);
    const operations = (text.match(/[+*/=]|\b(?:and then|after|before|together|remaining|successive)\b/gi) || []).length;
    const reasoning = /simultaneously|compound|probability|permutation|combination|mixture|two equations|at the same time|least number|reasoning|inference|conclusion/i.test(text) ? 1.5 : 0;
    return Math.min(text.length, 220) / 95 + numbers.length * .55 + numericWeight * .35 + operations * .45 + reasoning;
  };
  const difficultyGroups = chapter => {
    const ranked = chapter.questions.map((question, index) => ({ question, index, score:questionComplexity(question) }))
      .sort((a,b) => a.score-b.score || a.index-b.index);
    const third = Math.ceil(ranked.length / 3);
    return {
      easy:ranked.slice(0,third).map(item=>item.question),
      medium:ranked.slice(third,third*2).map(item=>item.question),
      hard:ranked.slice(third*2).map(item=>item.question),
    };
  };

  const topicLabel = (subject, chapter, question) => {
    const text = String(question?.q || '').replace(/\[(?:new question variant|practice set|chapter:)[^\]]*\]/gi, '');
    const rules = {
      Mathematics:[[/\bHCF\b|\bLCM\b/i,'HCF & LCM'],[/remainder/i,'Remainders'],[/prime number|prime factor/i,'Prime numbers'],[/percentage|percent/i,'Percentages'],[/profit|loss|discount|selling price/i,'Profit, loss & discount'],[/simple interest|principal|rate of interest/i,'Simple interest'],[/time and work|work together|finish.*days|complete.*work/i,'Time & work'],[/speed|distance|travell?ed|journey/i,'Speed, distance & time'],[/ratio|proportion/i,'Ratio & proportion'],[/area|perimeter|volume|surface area/i,'Mensuration'],[/angle|triangle|circle|polygon|parallel line/i,'Geometry'],[/equation|solve for|value of x|simplify/i,'Algebraic equations']],
      GAT:[[/series|sequence|next number|next letter/i,'Series completion'],[/code|coded|shifted|alphabet/i,'Coding & decoding'],[/analogy|is to.*as/i,'Analogy'],[/odd one|least like|classification/i,'Classification'],[/blood relation|brother|sister|mother|father/i,'Blood relations'],[/direction|north|south|east|west/i,'Direction sense'],[/physics|force|energy|motion|speed|gravity/i,'Physics'],[/chemistry|element|atom|acid|chemical/i,'Chemistry'],[/biology|cell|plant|human body|organ/i,'Biology'],[/computer|internet|software|hardware/i,'Computer awareness'],[/constitution|parliament|president|polity/i,'Indian polity'],[/geography|river|mountain|climate|monsoon/i,'Indian geography'],[/history|empire|movement|dynasty/i,'Indian history'],[/defence|armed forces|air force|navy|army/i,'Defence & armed forces'],[/sport|tournament|athlete|olympic/i,'Sports'],[/award|honour|medal/i,'Awards & honours'],[/economy|budget|inflation|gdp/i,'Indian economy'],[/environment|ecology|forest|pollution/i,'Environment & ecology']],
      English:[[/synonym/i,'Synonyms'],[/antonym/i,'Antonyms'],[/one-word|one word/i,'One-word substitution'],[/idiom|phrase/i,'Idioms & phrases'],[/preposition/i,'Prepositions'],[/fill in the blank|blank/i,'Fill in the blanks'],[/conjunction|connector/i,'Connectors & conjunctions'],[/grammar|sentence|verb|noun|tense|error/i,'Grammar & sentence use'],[/vocabulary|meaning|word/i,'Vocabulary in context']],
      'Current Affairs':[[/defence|air force|navy|army/i,'Defence & security'],[/science|technology|space|isro/i,'Science & technology'],[/sport|tournament|athlete/i,'Sports'],[/award|honour/i,'Awards & honours'],[/economy|budget|gdp|inflation/i,'Economy'],[/environment|climate|wildlife/i,'Environment'],[/history|heritage|culture/i,'History & culture'],[/polity|constitution|parliament|government/i,'Polity & governance'],[/geography|river|state|country/i,'Geography'],[/current affairs|news|recent/i,'Current affairs review']],
      SSB:[[/oir|intelligence|reasoning/i,'OIR'],[/ppdt|picture perception|picture discussion/i,'PPDT'],[/tat|thematic apperception/i,'TAT'],[/wat|word association/i,'WAT'],[/srt|situation reaction/i,'SRT'],[/sdt|self description/i,'SDT'],[/gto|group task|group planning/i,'GTO'],[/interview|personal question|tell us/i,'Interview'],[/conference/i,'Conference']]
    };
    for (const [pattern,label] of (rules[subject] || [])) if (pattern.test(text)) return label;
    return `Core ${chapter.name}`;
  };

  const topicGroups = (subject, chapter) => {
    const groups = new Map();
    chapter.questions.forEach(question => {
      const label = topicLabel(subject, chapter, question);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(question);
    });
    const ready=[],small=[];
    for(const [name,questions] of groups.entries()) (questions.length<9?small:ready).push({name,questions});
    if(small.length){
      const core=ready.find(group=>/^Core /.test(group.name));
      if(core) core.questions.push(...small.flatMap(group=>group.questions));
      else ready.push({name:'Core & mixed practice',questions:small.flatMap(group=>group.questions)});
    }
    return ready.sort((a,b)=>a.name.localeCompare(b.name));
  };

  window.chooseChapterTopics = (subject, chapterIndex) => {
    const chapter = typeof quizBank !== 'undefined' ? quizBank?.[subject]?.[chapterIndex] : null;
    const topics = document.getElementById('topicChooser');
    const levels = document.getElementById('difficultyChooser');
    if (!chapter || !topics) return;
    levels.hidden = true;
    const groups = topicGroups(subject, chapter);
    topics.hidden = false;
    topics.innerHTML = `<h3>Choose a topic · ${escapeHtml(chapter.name)}</h3><p>Topics are grouped from the questions currently available in this chapter. Select a topic to choose a practice level.</p><div class="topic-options">${groups.map((group,index)=>`<button class="subjectcard" type="button" onclick="chooseTopicDifficulty('${escapeHtml(subject)}',${chapterIndex},${index})"><b>${escapeHtml(group.name)}</b><span>${group.questions.length} questions</span></button>`).join('')}</div>`;
    topics.scrollIntoView({behavior:'smooth',block:'nearest'});
  };

  window.chooseTopicDifficulty = (subject, chapterIndex, topicIndex) => {
    const chapter = typeof quizBank !== 'undefined' ? quizBank?.[subject]?.[chapterIndex] : null;
    const groups = chapter ? topicGroups(subject, chapter) : [];
    const group = groups[topicIndex];
    const chooser = document.getElementById('difficultyChooser');
    if (!group || !chooser) return;
    const levels = difficultyGroups({questions:group.questions});
    chooser.hidden = false;
    chooser.innerHTML = `<h3>${escapeHtml(group.name)} · Choose your level</h3><p>This question bank has no authored difficulty tags, so levels are estimated relative to this topic from question structure. Use them as practice guidance.</p><div class="difficulty-options">${['easy','medium','hard'].map(level=>`<button class="btn secondary" type="button" onclick="startChapterQuiz('${escapeHtml(subject)}',${chapterIndex},'${level}',${topicIndex})"><b>${level[0].toUpperCase()+level.slice(1)} · ${levels[level].length} questions</b><span>${level==='easy'?'Start with simpler formats':level==='medium'?'Practise the middle range':'Try the more involved formats'}</span></button>`).join('')}</div>`;
    chooser.scrollIntoView({behavior:'smooth',block:'nearest'});
  };

  window.chooseChapterDifficulty = (subject, chapterIndex) => {
    const chapter = typeof quizBank !== 'undefined' ? quizBank?.[subject]?.[chapterIndex] : null;
    const chooser = document.getElementById('difficultyChooser');
    if (!chapter || !chooser) return;
    const groups = difficultyGroups(chapter);
    chooser.hidden = false;
    chooser.innerHTML = `<h3>Choose your level · ${escapeHtml(chapter.name)}</h3><p>This question bank has no authored difficulty tags, so levels are estimated relative to this chapter from question structure. Use them as practice guidance.</p><div class="difficulty-options">${['easy','medium','hard'].map(level => `<button class="btn secondary" type="button" onclick="startChapterQuiz('${escapeHtml(subject)}',${chapterIndex},'${level}')"><b>${level[0].toUpperCase()+level.slice(1)} · ${groups[level].length} questions</b><span>${level==='easy'?'Start with simpler formats':level==='medium'?'Practise the middle range':'Try the more involved formats'}</span></button>`).join('')}</div>`;
    chooser.scrollIntoView({ behavior:'smooth', block:'nearest' });
  };

  const trackSeenQuestions = () => {
    const start = window.startChapterQuiz;
    if (typeof start !== 'function' || start.__seenTracking) return;
    const wrapped = function (subject, chapterIndex, difficulty) {
      const chapter = typeof quizBank !== 'undefined' ? quizBank?.[subject]?.[chapterIndex] : null;
      if (!chapter || !Array.isArray(chapter.questions)) return start.apply(this, arguments);
      const level = ['easy','medium','hard'].includes(difficulty) ? difficulty : null;
      const topicIndex = Number.isInteger(arguments[3]) ? arguments[3] : null;
      const selectedTopic = topicIndex == null ? null : topicGroups(subject,chapter)[topicIndex];
      const selectedQuestions = selectedTopic?.questions || chapter.questions;
      const levelQuestions = level ? difficultyGroups({questions:selectedQuestions})[level] : selectedQuestions;
      if (!levelQuestions.length) { window.showToast?.(`No ${level} questions are tagged for this chapter yet.`); return; }
      currentQuizTopic = selectedTopic?.name || null;
      currentQuizDifficulty = level;
      const key = `nda-seen:${subject}:${chapter.name}:${selectedTopic?.name || 'all'}:${level || 'all'}`;
      const storedSeen = safeRead(key, []);
      const seen = new Set(Array.isArray(storedSeen) ? storedSeen : []);
      const fresh = levelQuestions.filter(question => !seen.has(question.q));
      const shuffle = window.shuffleArr;
      const source = fresh.length ? fresh : levelQuestions;
      window.shuffleArr = items => shuffle(source);
      try { start.call(this, subject, chapterIndex); }
      finally { window.shuffleArr = shuffle; }
      if (!fresh.length) {
        seen.clear();
        window.showToast?.('You finished this chapter’s question bank. Starting a fresh revision round.');
      }
      currentQuizQuestions.forEach(question => seen.add(question.q));
      try { localStorage.setItem(key, JSON.stringify([...seen])); } catch { /* storage may be unavailable */ }
    };
    wrapped.__seenTracking = true;
    window.startChapterQuiz = wrapped;
  };

  const buildSSBGuide = () => {
    const page = document.getElementById('ssb');
    if (!page || page.dataset.guideReady) return;
    page.dataset.guideReady = 'true';
    page.innerHTML = `<div class="ssb-guide-hero"><span class="tag">SSB PREPARATION</span><h2>Understand the process. Practise with purpose.</h2><p>Use this guide to learn the main assessment areas in order. Digital activities are practice aids; they do not reproduce an SSB board or predict a recommendation.</p></div>
      <ol class="ssb-stage-list">
        <li class="ssb-stage"><span class="ssb-stage-number">01</span><div><span class="tag">STAGE I · SCREENING</span><h3>Officer Intelligence Rating (OIR)</h3><p>Build familiarity with verbal and non-verbal reasoning formats. Focus on careful reading, pace and accuracy.</p><h4>Picture Perception and Discussion (PPDT)</h4><p>Practise observing a scene, forming a concise story, narrating it clearly and listening respectfully in a group discussion.</p></div></li>
        <li class="ssb-stage"><span class="ssb-stage-number">02</span><div><span class="tag">STAGE II · PSYCHOLOGY</span><h3>TAT · WAT · SRT · SDT</h3><p>Learn what each written technique asks you to do. Keep responses natural, specific and grounded in your real experiences. Avoid memorised “ideal” answers.</p><div class="ssb-format-grid"><span><b>TAT</b> Story response to a picture prompt</span><span><b>WAT</b> Brief response to a word</span><span><b>SRT</b> Practical response to a situation</span><span><b>SDT</b> Honest self-description</span></div><button class="btn" type="button" onclick="showPage('ssbCoach')">Open AI SSB Coach for answer feedback</button></div></li>
        <li class="ssb-stage"><span class="ssb-stage-number">03</span><div><span class="tag">STAGE II · GROUP TESTING</span><h3>Group Testing Officer (GTO) tasks</h3><p>Learn about group discussion, planning and outdoor task formats. Real GTO activities depend on a physical group and assessor instructions, so this site provides preparation notes only.</p></div></li>
        <li class="ssb-stage"><span class="ssb-stage-number">04</span><div><span class="tag">STAGE II · INTERVIEW</span><h3>Personal interview</h3><p>Practise clear, truthful answers about your background, choices, responsibilities and interests. Use the AI interview room for spoken or typed practice and feedback.</p><button class="btn secondary" type="button" onclick="showPage('aiInterview')">Open AI Interview practice</button></div></li>
        <li class="ssb-stage"><span class="ssb-stage-number">05</span><div><span class="tag">FINAL STAGE</span><h3>Conference and reflection</h3><p>Review what you learned from practice, note specific improvements and plan what to work on next. The site does not estimate selection outcomes.</p></div></li>
      </ol>`;
    const ppdtSelect = document.getElementById('ppdtMockSelect');
    const ppdtWrap = document.getElementById('ppdtMockWrap');
    if (ppdtSelect) ppdtSelect.hidden = true;
    if (ppdtWrap) ppdtWrap.hidden = true;
  };

  const addAirForceDayCard = () => {
    const home = document.getElementById('home');
    if (!home || document.getElementById('airForceDayCard')) return;
    const card = document.createElement('section');
    card.id = 'airForceDayCard';
    card.className = 'airforce-card';
    const update = () => {
      const now = new Date();
      const year = now.getFullYear();
      let event = new Date(year, 9, 8, 0, 0, 0);
      if (event < new Date(now.getFullYear(), now.getMonth(), now.getDate())) event = new Date(year + 1, 9, 8, 0, 0, 0);
      const days = Math.ceil((event - now) / 86400000);
      card.innerHTML = `<div><span class="tag">INDIAN AIR FORCE DAY · 8 OCTOBER</span><h3>${days === 0 ? 'Air Force Day is today' : `Countdown: ${days} day${days === 1 ? '' : 's'}`}</h3><p>Take a short Air Force Day knowledge challenge. Scores are saved only on this device; shared rankings will be released later after verification is available.</p><button class="btn secondary" type="button" onclick="startAFDayChallenge()">Start the 3-question challenge</button><div id="afDayChallenge" class="af-day-challenge" aria-live="polite"></div></div><span class="airforce-mark" aria-hidden="true">✈</span>`;
    };
    update();
    home.querySelector('.hero')?.after(card);
  };

  const addJetFlyby = () => {
    if (document.getElementById('ndaJetFlyby') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const jet = document.createElement('div');
    jet.id = 'ndaJetFlyby'; jet.className = 'nda-jet-flyby'; jet.setAttribute('aria-hidden', 'true');
    jet.innerHTML = '<span>✈</span>';
    document.body.append(jet);
    jet.addEventListener('animationend', () => jet.remove(), { once: true });
  };

  const removeSampleRankings = () => {
    const render = window.renderLeaderboard;
    if (typeof render !== 'function' || render.__realScoresOnly) return;
    const honestRender = function () {
      const box = document.getElementById('leaderboard');
      if (!box) return;
      const best = Array.isArray(state.scores) && state.scores.length ? Math.max(...state.scores) : 0;
      box.innerHTML = `<div class="leader you"><span class="rank">★</span><span style="flex:1">Your best verified-on-this-device mock score</span><b style="color:var(--accent)">${best}%</b></div><p class="muted ranking-note">Community rankings will be enabled after scores can be verified and shared safely.</p>`;
    };
    honestRender.__realScoresOnly = true;
    window.renderLeaderboard = honestRender;
    honestRender();
  };

  const airForceQuestions = [
    { q:'On what date is Indian Air Force Day observed?', options:['8 October','15 August','26 January','4 December'], correct:0 },
    { q:'Which motto is associated with the Indian Air Force?', options:['Service Before Self','Touch the Sky with Glory','Always Alert','Nabha Sparsham Deeptam'], correct:3 },
    { q:'Which branch of the armed forces primarily operates military aircraft?', options:['Indian Army','Indian Navy','Indian Air Force','Border Security Force'], correct:2 },
  ];
  let airForceStep = 0;
  let airForceScore = 0;
  window.startAFDayChallenge = () => {
    airForceStep = 0; airForceScore = 0; renderAFDayQuestion();
  };
  window.answerAFDayChallenge = choice => {
    const question = airForceQuestions[airForceStep];
    if (!question) return;
    if (Number(choice) === question.correct) airForceScore++;
    airForceStep++;
    if (airForceStep < airForceQuestions.length) renderAFDayQuestion();
    else {
      const panel = document.getElementById('afDayChallenge');
      const key = 'nda-airforce-day-best';
      const previous = Number(safeRead(key, 0)) || 0;
      const best = Math.max(previous, airForceScore);
      try { localStorage.setItem(key, JSON.stringify(best)); } catch { /* storage may be unavailable */ }
      panel.innerHTML = `<div class="af-result"><b>Challenge complete · ${airForceScore}/${airForceQuestions.length}</b><span>Your best on this device: ${best}/${airForceQuestions.length}</span><button type="button" class="btn secondary" onclick="startAFDayChallenge()">Try again</button></div>`;
    }
  };
  function renderAFDayQuestion() {
    const panel = document.getElementById('afDayChallenge');
    const question = airForceQuestions[airForceStep];
    if (!panel || !question) return;
    panel.innerHTML = `<div class="af-question"><b>Question ${airForceStep + 1} of ${airForceQuestions.length}</b><p>${escapeHtml(question.q)}</p><div class="af-options">${question.options.map((option,index) => `<button type="button" class="btn secondary" onclick="answerAFDayChallenge(${index})">${escapeHtml(option)}</button>`).join('')}</div></div>`;
  }

  const init = () => {
    addTypedAnswerHandler();
    trackSeenQuestions();
    buildSSBGuide();
    addAirForceDayCard();
    addJetFlyby();
    removeSampleRankings();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

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
    home.classList.add('airforce-home');
    const card = document.createElement('section');
    card.id = 'airForceDayCard';
    card.className = 'airforce-card';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let event = new Date(now.getFullYear(), 9, 8);
    if (event < today) event = new Date(now.getFullYear() + 1, 9, 8);
    const days = Math.ceil((event - today) / 86400000);
    card.innerHTML = `<div class="airforce-card-copy"><span class="tag">INDIAN AIR FORCE DAY · 8 OCTOBER</span><h3>${days === 0 ? 'Honouring the Guardians of the Sky' : `Air Force Day · ${days} day${days === 1 ? '' : 's'} to go`}</h3><p>Take the 25-question hard challenge. Your score stays private and is saved for the results announcement on 9 December 2026. Finishers will receive their e-certificate by email on 9 October 2026.</p><button class="btn secondary" type="button" onclick="startAFDayChallenge()">Enter the hard challenge</button></div><span class="airforce-mark" aria-hidden="true">✈</span><div class="airforce-tricolour" aria-hidden="true"></div>`;
    home.querySelector('.hero')?.after(card);
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
    { q:'Which year marks the establishment of the Indian Air Force as a service?', options:['1932','1947','1950','1952'], correct:0 },
    { q:'Which aircraft equipped the IAF’s first operational flight in 1933?', options:['Hawker Hart','de Havilland Tiger Moth','Westland Wapiti IIA','Bristol Blenheim'], correct:2 },
    { q:'On what date did the IAF’s first operational flight take place?', options:['8 October 1932','1 April 1933','1 June 1938','15 August 1947'], correct:1 },
    { q:'What is the English rendering of “Nabhaḥ Sparśaṁ Dīptam”?', options:['Victory through courage','Touch the sky with glory','Service before self','Ever vigilant'], correct:1 },
    { q:'Which officer heads the Indian Air Force at the national level?', options:['Chief of the Air Staff','Chief of Integrated Defence Staff','Western Air Command chief','Defence Secretary'], correct:0 },
    { q:'In June 1938, the first three IAF flights (A, B and C) were integrated to form which unit?', options:['No. 1 Squadron','No. 2 Squadron','No. 3 Squadron','No. 45 Squadron'], correct:0 },
    { q:'Which aircraft type is designed primarily to refuel other aircraft in flight?', options:['Airborne early warning aircraft','Flight-refuelling tanker','Strategic airlifter','Trainer aircraft'], correct:1 },
    { q:'How many commands is the Indian Air Force organised into?', options:['5','6','7','8'], correct:2 },
    { q:'The C-295 MW is described by the Ministry of Defence as belonging to which payload-capacity range?', options:['1–3 tonnes','3–5 tonnes','5–10 tonnes','10–20 tonnes'], correct:2 },
    { q:'Under the original C-295 contract, how were the 56 aircraft divided between flyaway deliveries and Indian manufacture?', options:['16 and 40','20 and 36','24 and 32','40 and 16'], correct:0 },
    { q:'Which C-295 capability lets it operate from airstrips with limited ground infrastructure?', options:['Short take-off and landing from semi-prepared surfaces','Carrier arrestor-hook landing','Vertical take-off','In-flight conversion to a tanker'], correct:0 },
    { q:'What specific loading and rapid-exit feature is fitted to the C-295?', options:['A rear ramp/door','A nose cargo hatch','A detachable wing pod','An under-fuselage lift'], correct:0 },
    { q:'Which IAF squadron became the first to operate the Tejas Light Combat Aircraft?', options:['No. 45 “Flying Daggers”','No. 1 “Tigers”','No. 18 “Flying Bullets”','No. 22 “Swifts”'], correct:0 },
    { q:'Which air station was named as the designated location for No. 45 Squadron after its initial period operating from Bengaluru?', options:['Sulur','Ambala','Gwalior','Jamnagar'], correct:0 },
    { q:'Which set best describes the Tejas role set cited at its induction?', options:['Air defence, maritime reconnaissance and strike','Heavy lift, refuelling and transport','Search and rescue, training and firefighting','Long-range bombing only'], correct:0 },
    { q:'What is the primary role of an airborne early warning and control aircraft?', options:['Detect and track airborne activity and coordinate the air picture','Carry troops to remote landing zones','Refuel fighters in flight','Train new pilots in basic handling'], correct:0 },
    { q:'What does a beyond-visual-range air-to-air missile enable a fighter to do?', options:['Engage an aircraft beyond visual range','Attack ground targets from low altitude','Intercept ballistic missiles in space','Guide transport aircraft during landing'], correct:0 },
    { q:'Which four operational capabilities were highlighted for the approved Tejas Mk-1A?', options:['AESA radar, BVR missile, electronic warfare suite and air-to-air refuelling','Stealth shaping, vertical lift, naval arrestor gear and laser cannon','Airborne radar, cargo ramp, aerial refuelling and drone control','Night vision, submarine detection, parachute delivery and afterburner'], correct:0 },
    { q:'Why are aircraft dispersal and hardened shelters useful at an air base?', options:['They can reduce vulnerability from concentrating aircraft','They make aircraft fly faster','They replace runway maintenance','They eliminate the need for air defence'], correct:0 },
    { q:'Under the 2021 approval for 83 Tejas aircraft, what was the split between Mk-1A fighters and Mk-1 trainers?', options:['73 fighters and 10 trainers','63 fighters and 20 trainers','40 fighters and 43 trainers','83 fighters and no trainers'], correct:0 },
    { q:'What is the stated indigenous-content target at the start of the Tejas Mk-1A programme, with a planned progression to?', options:['40%, progressing to 50%','50%, progressing to 60%','60%, progressing to 70%','70%, progressing to 80%'], correct:1 },
    { q:'In a transport aircraft design, why is a rear ramp useful for loading wheeled cargo?', options:['It can bridge the cargo floor to ground level','It creates lift during take-off','It provides an airborne radar aperture','It replaces the aircraft landing gear'], correct:0 },
    { q:'A force needs to sustain fighter operations farther from its home base. Which support capability most directly extends aircraft endurance in flight?', options:['Air-to-air refuelling','A flight data recorder','An airborne early-warning radar','A cargo pallet system'], correct:0 },
    { q:'In fighter operations, what does “sortie generation” mean?', options:['Preparing and launching aircraft for successive missions','Counting aircraft in a ceremonial formation','Logging simulator hours as operational flights','Moving aircraft between bases by road'], correct:0 },
    { q:'Who became the first Indian Chief of Air Staff on 1 April 1954?', options:['Air Marshal Arjan Singh','Air Marshal Aspy Engineer','Air Marshal Subroto Mukerjee','Air Marshal Pratap Chandra Lal'], correct:2 },
  ];
  let airForceStep = 0;
  let airForceScore = 0;
  let airForceSubmitting = false;
  let airForceAnswers = [];
  let airForceOptionOrder = [];
  const shuffledOptionIndexes = options => {
    const indexes = options.map((_, index) => index);
    for (let i = indexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    return indexes;
  };
  const balancedCorrectPositions = count => {
    const positions = Array.from({length:count}, (_,index) => index % 4);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    return positions;
  };
  const buildAirForceOptionOrder = () => {
    const correctPositions = balancedCorrectPositions(airForceQuestions.length);
    return airForceQuestions.map((question, questionIndex) => {
      const correctPosition = correctPositions[questionIndex];
      const distractors = question.options.map((_, index) => index).filter(index => index !== question.correct);
      const shuffledDistractors = shuffledOptionIndexes(distractors).map(index => distractors[index]);
      const order = new Array(question.options.length);
      order[correctPosition] = question.correct;
      let distractorIndex = 0;
      for (let position = 0; position < order.length; position++) {
        if (position !== correctPosition) order[position] = shuffledDistractors[distractorIndex++];
      }
      return order;
    });
  };
  const closeAFDayChallenge = () => {
    document.getElementById('afDayOverlay')?.remove();
    document.body.classList.remove('af-challenge-open');
  };
  window.startAFDayChallenge = () => {
    airForceStep = 0; airForceScore = 0; airForceSubmitting = false;
    airForceAnswers = [];
    airForceOptionOrder = buildAirForceOptionOrder();
    document.body.classList.add('af-challenge-open');
    let overlay = document.getElementById('afDayOverlay');
    if (!overlay) {
      overlay = document.createElement('div'); overlay.id = 'afDayOverlay'; overlay.className = 'af-challenge-overlay';
      overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-labelledby','afChallengeTitle');
      document.body.append(overlay);
    }
    renderAFDayQuestion();
  };
  window.answerAFDayChallenge = choice => {
    const question = airForceQuestions[airForceStep];
    if (!question || airForceSubmitting) return;
    const selected = Number(choice);
    airForceAnswers.push(selected);
    if (selected === question.correct) airForceScore++;
    airForceStep++;
    if (airForceStep < airForceQuestions.length) renderAFDayQuestion();
    else showAFDaySubmissionForm();
  };
  function showAFDaySubmissionForm() {
    const overlay = document.getElementById('afDayOverlay');
    if (!overlay) return;
    overlay.innerHTML = `<main class="af-challenge-page"><header class="af-challenge-top"><span class="tag">INDIAN AIR FORCE DAY · CHALLENGE COMPLETE</span><button class="af-exit-button" type="button" aria-label="Exit challenge" onclick="closeAFDayChallenge()">×</button></header><section class="af-finish-card af-certificate-card"><div class="af-finish-emblem" aria-hidden="true">✦</div><h1 id="afChallengeTitle">Submit your position</h1><p>Your score stays private. Add the name for your certificate and the email address where the site team can send your e-certificate on 9 October 2026.</p><form id="afCertificateForm" onsubmit="submitAFDayPosition(event)"><label for="afCertificateName">Name on certificate</label><input id="afCertificateName" name="certificateName" type="text" maxlength="80" autocomplete="name" required><label for="afCertificateEmail">Email address</label><input id="afCertificateEmail" name="certificateEmail" type="email" maxlength="254" autocomplete="email" required><label class="af-consent"><input type="checkbox" name="certificateConsent" required><span>I agree to have my name, email and challenge result stored privately for Air Force Day results and e-certificate delivery on 9 October 2026.</span></label><p class="af-submit-status" aria-live="polite"></p><button class="btn secondary af-submit-button" type="submit">Submit position and certificate details</button></form><p class="af-publish-date">Results will be published on <strong>9 December 2026</strong>.</p></section></main>`;
  }
  async function submitAFDayPosition(event) {
    event?.preventDefault();
    const overlay = document.getElementById('afDayOverlay');
    if (!overlay || airForceSubmitting) return;
    const form = overlay.querySelector('#afCertificateForm');
    if (!form || !form.reportValidity()) return;
    const name = form.elements.certificateName.value.trim().slice(0,80);
    const email = form.elements.certificateEmail.value.trim().toLowerCase().slice(0,254);
    if (!name || !email) return;
    airForceSubmitting = true;
    overlay.querySelector('.af-submit-button').disabled = true;
    overlay.querySelector('.af-submit-status').textContent = 'Saving your result and certificate details privately…';
    try {
      const sb = window.realBackend?.supabase;
      if (!window.realBackend?.configured || !sb) throw new Error('Database is unavailable');
      const { error } = await sb.rpc('submit_airforce_day_result', { p_answers: airForceAnswers, p_certificate_name: name, p_certificate_email: email, p_certificate_consent: true });
      if (error) throw error;
      overlay.querySelector('.af-finish-card').innerHTML = `<div class="af-finish-emblem" aria-hidden="true">✦</div><h1 id="afChallengeTitle">Position submitted</h1><p>Your result and certificate details have been recorded privately. Your score will not appear on this screen.</p><p>The site team will email your completion e-certificate on 9 October 2026.</p><p class="af-publish-date">Results will be published on <strong>9 December 2026</strong>.</p>`;
    } catch (error) {
      console.error('Air Force Day position submission failed:', error);
      airForceSubmitting = false;
      overlay.querySelector('.af-submit-status').textContent = 'We could not save your result. Your details were not submitted. Check your connection and submit again.';
      overlay.querySelector('.af-submit-button').disabled = false;
    }
    if (!airForceSubmitting) return;
    overlay.querySelector('.af-finish-card').insertAdjacentHTML('beforeend','<button class="btn secondary af-close-button" type="button" onclick="closeAFDayChallenge()">Close</button>');
  }
  window.submitAFDayPosition = submitAFDayPosition;
  window.closeAFDayChallenge = closeAFDayChallenge;
  function renderAFDayQuestion() {
    const panel = document.getElementById('afDayOverlay');
    const question = airForceQuestions[airForceStep];
    if (!panel || !question) return;
    const progress = Math.round((airForceStep / airForceQuestions.length) * 100);
    panel.innerHTML = `<main class="af-challenge-page"><header class="af-challenge-top"><div><span class="tag">INDIAN AIR FORCE DAY · HARD CHALLENGE</span><h1 id="afChallengeTitle">Test your Air Force knowledge</h1></div><button class="af-exit-button" type="button" aria-label="Exit challenge" onclick="closeAFDayChallenge()">×</button></header><div class="af-challenge-meta"><span>Question ${airForceStep + 1} of ${airForceQuestions.length}</span><span>Your score is private</span></div><div class="af-progress-track" role="progressbar" aria-valuenow="${airForceStep}" aria-valuemin="0" aria-valuemax="${airForceQuestions.length}"><span style="width:${progress}%"></span></div><section class="af-question-card"><span class="af-question-kicker">QUESTION ${String(airForceStep + 1).padStart(2,'0')}</span><h2>${escapeHtml(question.q)}</h2><div class="af-options">${airForceOptionOrder[airForceStep].map((originalIndex,displayIndex) => `<button type="button" class="af-answer-option" onclick="answerAFDayChallenge(${originalIndex})"><span class="af-option-letter">${String.fromCharCode(65+displayIndex)}</span><span>${escapeHtml(question.options[originalIndex])}</span></button>`).join('')}</div></section><footer class="af-challenge-foot"><span>25 difficult questions · One attempt</span><span>Results publish 9 December 2026</span></footer></main>`;
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

/* Mobile-first navigation, PYQ library, and lightweight study quality-of-life tools. */
(() => {
  const archiveCurrent = 'https://www.upsc.gov.in/examinations/previous-question-papers';
  const archivePast = 'https://www.upsc.gov.in/examinations/previous-question-papers/archives';
  const papers = [
    { year: 2026, session: 'II', examPage: 'https://www.upsc.gov.in/examinations/National%20Defence%20Academy%20and%20Naval%20Academy%20Examination%20%28II%29%2C%202026' },
    { year: 2026, session: 'I', examPage: 'https://www.upsc.gov.in/examinations/National%20Defence%20Academy%20and%20Naval%20Academy%20Examination%20%28I%29%2C%202026' },
    { year: 2025, session: 'II', archive: archiveCurrent },
    { year: 2025, session: 'I', archive: archiveCurrent },
    { year: 2024, session: 'II', archive: archiveCurrent },
    { year: 2024, session: 'I', archive: archiveCurrent },
    { year: 2023, session: 'II', archive: archivePast },
    { year: 2023, session: 'I', archive: archivePast },
    { year: 2022, session: 'II', archive: archivePast },
    { year: 2022, session: 'I', archive: archivePast },
  ];
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const getPageButtons = () => [...document.querySelectorAll('.nav button[onclick*="showPage"]')];
  const switchPage = (id, sourceButton) => {
    const navButton = sourceButton || getPageButtons().find(button => button.dataset.page === id || button.getAttribute('onclick')?.includes(`'${id}'`));
    if (typeof window.showPage === 'function') window.showPage(id, navButton || null);
    else {
      document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === id));
    }
    document.querySelectorAll('.mobile-dock button').forEach(button => button.classList.toggle('active', button.dataset.page === id));
    if (id === 'pyqs') { const title = document.getElementById('pageTitle'); if (title) title.textContent = 'PYQ Library'; }
    document.querySelector('.mobile-sheet-backdrop')?.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const addPyqPage = () => {
    if (document.getElementById('pyqs')) return;
    const nav = document.querySelector('.nav');
    const page = document.createElement('section');
    page.id = 'pyqs'; page.className = 'page';
    page.innerHTML = `<div class="pyq-intro"><div class="pyq-banner"><span class="tag">OFFICIAL UPSC PAPERS</span><h2>Past papers. Clearer preparation.</h2><p>Open the complete Mathematics and General Ability Test papers for NDA (I) and NDA (II) from 2022–2026. Solve them under timed conditions, then review the topics you missed.</p><button class="btn secondary" type="button" onclick="window.open('https://www.upsc.gov.in/examinations/previous-question-papers','_blank','noopener')">Browse the UPSC paper archive ↗</button></div><div class="pyq-stat"><strong>10</strong><b>exam sessions</b><span class="muted">20 official subject papers · 2022–2026</span></div></div><div class="card"><div class="pyq-card-head"><div><h3 style="margin:0">NDA PYQ library</h3><div class="muted" style="font-size:12px;margin-top:4px">Choose a session to open UPSC’s original paper list.</div></div><span class="tag">2022–2026</span></div><div class="pyq-grid" id="pyqGrid"></div><p class="pyq-note">Papers are hosted by the Union Public Service Commission. Each link opens the official UPSC question-paper page; select Mathematics or General Ability Test under the listed NDA session. This site is an independent study platform and is not affiliated with UPSC.</p></div>`;
    const home = document.getElementById('home');
    const pages = [...document.querySelectorAll('.page')];
    const insertBefore = pages.find(element => element.id === 'aspirants') || null;
    insertBefore ? insertBefore.before(page) : document.querySelector('.main')?.append(page);
    if (nav && !nav.querySelector('[data-page="pyqs"]')) {
      const button = document.createElement('button'); button.dataset.page='pyqs'; button.innerHTML='📄 PYQ Library';
      button.addEventListener('click', () => switchPage('pyqs', button));
      const tests = nav.querySelector('[onclick*="tests"]'); tests ? tests.after(button) : nav.append(button);
    }
    const grid = page.querySelector('#pyqGrid');
    grid.innerHTML = papers.map(paper => {
      const exam = `National Defence Academy and Naval Academy Examination (${paper.session}), ${paper.year}`;
      const target = paper.examPage || `${paper.archive}#:~:text=${encodeURIComponent(exam)}`;
      return `<article class="pyq-card"><div class="pyq-card-head"><div><div class="pyq-year">NDA (${paper.session}) · ${paper.year}</div><div class="pyq-session">${paper.session === 'I' ? 'First' : 'Second'} examination session</div></div><span class="tag">UPSC</span></div><div class="pyq-subjects"><div class="pyq-subject"><b>Mathematics</b>Paper I · 300 marks</div><div class="pyq-subject"><b>General Ability</b>Paper II · 600 marks</div></div><a class="pyq-link" href="${escapeHtml(target)}" target="_blank" rel="noopener noreferrer">Open official papers <span aria-hidden="true">↗</span></a></article>`;
    }).join('');
    if (home && !document.getElementById('pyqHomeCard')) {
      const promo = document.createElement('div'); promo.id='pyqHomeCard'; promo.className='pyq-home-card';
      promo.innerHTML='<div><h3>📄 Five years of NDA PYQs</h3><p>10 exam sessions · original Mathematics and GAT papers from UPSC</p></div><button class="btn" type="button">Explore PYQ Library ↗</button>';
      promo.querySelector('button').addEventListener('click', () => switchPage('pyqs', null));
      const hero = home.querySelector('.hero'); hero ? hero.after(promo) : home.prepend(promo);
    }
  };
  const addMobileNavigation = () => {
    if (document.querySelector('.mobile-dock')) return;
    const dock = document.createElement('nav'); dock.className='mobile-dock'; dock.setAttribute('aria-label','Main navigation');
    const shortcuts = [
      { id:'home', icon:'⌂', label:'Home' },
      { id:'tests', icon:'◎', label:'Tests' },
      { id:'pyqs', icon:'▤', label:'PYQs' },
      { id:'aiCenter', icon:'✦', label:'NDA AI' },
      { id:'more', icon:'•••', label:'More' },
    ];
    dock.innerHTML = shortcuts.map(item => `<button type="button" data-page="${item.id}" aria-label="${item.label}" ${item.id==='home'?'class="active"':''}><span class="dock-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span></button>`).join('');
    const backdrop=document.createElement('div'); backdrop.className='mobile-sheet-backdrop'; backdrop.innerHTML='<div class="mobile-sheet" role="dialog" aria-modal="true" aria-label="More sections"><h3>Explore your academy</h3><div class="mobile-sheet-grid"></div></div>';
    backdrop.addEventListener('click',event=>{if(event.target===backdrop)backdrop.classList.remove('open');});
    const sheet=backdrop.querySelector('.mobile-sheet-grid');
    sheet.innerHTML=getPageButtons().map(button=>{
      const text=button.textContent.trim();
      const match=button.getAttribute('onclick')?.match(/showPage\('([^']+)'/);
      return match?`<button type="button" data-page="${match[1]}"><span>${escapeHtml(text.split(' ')[0])}</span><span>${escapeHtml(text.replace(/^\S+\s*/,''))}</span></button>`:'';
    }).join('')+`<button type="button" data-profile="true"><span>👤</span><span>Profile</span></button>`;
    backdrop.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>switchPage(button.dataset.page,getPageButtons().find(nav=>nav.getAttribute('onclick')?.includes(`'${button.dataset.page}'`))||null)));
    backdrop.querySelector('[data-profile]')?.addEventListener('click',()=>{backdrop.classList.remove('open');window.openProfile?.();});
    dock.addEventListener('click',event=>{
      const button=event.target.closest('button'); if(!button)return;
      if(button.dataset.page==='more'){backdrop.classList.add('open');return;}
      switchPage(button.dataset.page,getPageButtons().find(nav=>nav.getAttribute('onclick')?.includes(`'${button.dataset.page}'`))||null);
    });
    document.body.append(backdrop,dock);
  };
  const bindSearchShortcut = () => {
    document.addEventListener('keydown',event=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
        const input=document.querySelector('#aiChatInput');
        if(input&&document.getElementById('aiChat')?.classList.contains('active')){event.preventDefault();input.focus();}
      }
    });
  };
  const addInterviewerLipSync = () => {
    const card = document.querySelector('#aiInterview .ai-video-grid .ai-video-card:not(#candidateVideoCard)');
    if (!card || card.dataset.lipSyncReady === 'true') return;
    card.dataset.lipSyncReady = 'true';
    const mouth = document.createElement('span'); mouth.className = 'ai-lipsync-mouth'; mouth.setAttribute('aria-hidden', 'true');
    const stateLabel = document.createElement('span'); stateLabel.className = 'ai-voice-state'; stateLabel.setAttribute('aria-live', 'polite'); stateLabel.textContent = 'INTERVIEWER READY';
    card.append(mouth, stateLabel);

    const setState = state => {
      card.classList.remove('ai-speaking', 'ai-listening', 'ai-thinking');
      if (state !== 'ready') card.classList.add(`ai-${state}`);
      stateLabel.textContent = ({ speaking:'AI SPEAKING', listening:'YOUR TURN', thinking:'AI THINKING', ready:'INTERVIEWER READY' })[state] || 'INTERVIEWER READY';
    };
    window.ndaSetInterviewerState = setState;

    const originalSpeak = window.speakAIQuestion;
    if (typeof originalSpeak === 'function') {
      window.speakAIQuestion = function () {
        const question = document.getElementById('aiQuestionText')?.textContent?.trim();
        if (!question || typeof window.SpeechSynthesisUtterance !== 'function' || !window.speechSynthesis) {
          setState('ready');
          return originalSpeak.apply(this, arguments);
        }
        const token = (window.ndaInterviewerSpeechToken || 0) + 1;
        window.ndaInterviewerSpeechToken = token;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(question);
        utterance.lang = 'en-IN'; utterance.rate = .92; utterance.pitch = .92;
        const clearSpeaking = () => {
          if (window.ndaInterviewerSpeechToken !== token) return;
          setState('ready');
          if (typeof window.aiSetStatus === 'function') window.aiSetStatus('Your turn — tap the microphone and answer.');
        };
        utterance.onstart = () => {
          if (window.ndaInterviewerSpeechToken !== token) return;
          setState('speaking');
          if (typeof window.aiSetStatus === 'function') window.aiSetStatus('AI interviewer is speaking…');
        };
        utterance.onend = clearSpeaking;
        utterance.onerror = clearSpeaking;
        window.speechSynthesis.speak(utterance);
        if (typeof window.aiSetStatus === 'function') window.aiSetStatus('AI interviewer is speaking…');
      };
    }

    const mic = document.getElementById('aiMicBtn');
    const syncMic = () => {
      if (mic?.classList.contains('listening')) setState('listening');
      else if (!card.classList.contains('ai-speaking') && !card.classList.contains('ai-thinking')) setState('ready');
    };
    if (mic && typeof MutationObserver === 'function') {
      new MutationObserver(syncMic).observe(mic, { attributes:true, attributeFilter:['class'] });
    }
    const wrapState = (name, state, afterState) => {
      const original = window[name];
      if (typeof original !== 'function') return;
      window[name] = function () {
        setState(state);
        const result = original.apply(this, arguments);
        if (afterState) {
          const finish = () => { if (!card.classList.contains('ai-speaking')) afterState(); };
          Promise.resolve(result).then(finish, finish);
        }
        return result;
      };
    };
    wrapState('startAIInterview','thinking');
    wrapState('submitAIAnswer','thinking');
    wrapState('finishAIInterview','ready', () => {
      const total = typeof aiInterviewState !== 'undefined' ? aiInterviewState.questions.length : 10;
      const count = document.getElementById('aiProgressText'); if (count) count.textContent = `${total} / ${total}`;
    });
    wrapState('endAIInterview','ready');

    const originalReset = window.resetAIUI;
    if (typeof originalReset === 'function') window.resetAIUI = function () {
      const result = originalReset.apply(this, arguments);
      const total = typeof aiInterviewState !== 'undefined' ? aiInterviewState.questions.length : 10;
      const count = document.getElementById('aiProgressText'); if (count) count.textContent = `0 / ${total}`;
      return result;
    };
  };
  const expandPracticeContent = () => {
    const interviewQuestions = [
      'What first made you consider a career as an officer in the armed forces?',
      'Which personal value matters most to you, and when have you had to act on it?',
      'Tell me about a disagreement in a team and how you helped the group move forward.',
      'Describe a responsibility you took on without being asked.',
      'What is one mistake you have made recently, and what did you change afterward?',
      'How do you react when someone gives you difficult feedback?',
      'Which subject challenges you most, and what is your plan for improving in it?',
      'Tell me about a long-term goal you worked toward and how you stayed consistent.',
      'What would you do if a friend on your team began falling behind?',
      'Describe a time you had to make a sensible decision with limited information.',
      'Which recent national or defence development have you followed, and what did you learn from it?',
      'How do you balance your study commitments with family and other responsibilities?',
      'What habit are you actively trying to improve, and how are you measuring progress?',
      'If your first plan failed during a group task, how would you help the team adapt?',
    ];
    if (typeof aiInterviewState !== 'undefined' && Array.isArray(aiInterviewState.questions)) {
      interviewQuestions.forEach(question => { if (!aiInterviewState.questions.includes(question)) aiInterviewState.questions.push(question); });
      const progress=document.getElementById('aiProgressText'); if(progress) progress.textContent=`0 / ${aiInterviewState.questions.length}`;
      const badge=document.getElementById('aiModeBadge');
      if(badge && !document.getElementById('aiQuestionBankCount')){
        const count=document.createElement('span'); count.id='aiQuestionBankCount'; count.className='tag'; count.textContent=`${aiInterviewState.questions.length} interview prompts`; badge.after(count);
      }
    }

    const extraOIR = [
      {q:'Complete the series: 3, 8, 15, 24, 35, ?',a:['44','46','48','50'],c:2},
      {q:'Complete the series: 4, 9, 19, 39, ?',a:['69','78','79','80'],c:2},
      {q:'You face north, turn right, turn right, then turn left. Which way are you facing?',a:['North','East','South','West'],c:1},
      {q:'All pilots are officers. Some officers are athletes. What must be true?',a:['All pilots are athletes','Some athletes are pilots','No pilots are athletes','No conclusion about pilots and athletes follows'],c:3},
      {q:'A square has sides of 5 cm. What is its perimeter?',a:['10 cm','15 cm','20 cm','25 cm'],c:2},
      {q:'Complete the series: 3, 6, 12, 24, ?',a:['36','42','48','54'],c:2},
      {q:'A vehicle covers 150 km in 2.5 hours at a steady speed. What is its speed?',a:['50 km/h','55 km/h','60 km/h','65 km/h'],c:2},
      {q:'A team has 12 members. If 3/4 are present, how many members are present?',a:['8','9','10','11'],c:1},
      {q:'Which item is least like the others?',a:['Cube','Sphere','Triangle','Cylinder'],c:2},
      {q:'If 1 January is a Monday, what day is 8 January?',a:['Sunday','Monday','Tuesday','Wednesday'],c:1},
      {q:'Complete the series: 1, 4, 9, 16, ?',a:['20','24','25','36'],c:2},
      {q:'Four people finish a task in 6 days at the same rate. How long would 8 people take?',a:['2 days','3 days','4 days','12 days'],c:1},
      {q:'A person walks 4 km north and then 3 km east. How far are they from the starting point?',a:['5 km','6 km','7 km','8 km'],c:0},
      {q:'The ratio of two numbers is 2:3 and their sum is 25. What is the smaller number?',a:['8','10','12','15'],c:1},
      {q:'Complete the letter series: B, D, F, H, ?',a:['I','J','K','L'],c:1},
      {q:'A clock gains 5 minutes every hour. How much does it gain in 6 hours?',a:['20 minutes','25 minutes','30 minutes','35 minutes'],c:2},
      {q:'If P is before Q and R is after Q, which order is correct?',a:['P, Q, R','Q, P, R','R, P, Q','P, R, Q'],c:0},
      {q:'Seven birds are on a branch. Three fly away. How many remain?',a:['3','4','5','10'],c:1},
    ];
    const extraPsych = [
      {type:'TAT-style story',prompt:'You notice a younger student struggling to organise a school event that begins tomorrow. Write a realistic story about what happens next.',time:240},
      {type:'TAT-style story',prompt:'A team reaches a road closure while carrying supplies to a community programme. Show how the main character responds.',time:240},
      {type:'WAT-style response',prompt:'Word: TEAMWORK — write the first constructive sentence or thought that comes to mind.',time:15},
      {type:'WAT-style response',prompt:'Word: PRESSURE — write the first constructive sentence or thought that comes to mind.',time:15},
      {type:'WAT-style response',prompt:'Word: INITIATIVE — write the first constructive sentence or thought that comes to mind.',time:15},
      {type:'SRT-style response',prompt:'Your group is running out of time and two members disagree about the next step. What would you do?',time:30},
      {type:'SRT-style response',prompt:'You realise you have made an error in an important assignment shortly before it is due. What would you do?',time:30},
      {type:'SRT-style response',prompt:'A teammate is quiet during a group activity and has a useful skill for the task. How would you involve them?',time:30},
    ];
    const extraSSBInterview = [
      'What responsibility at home or school has taught you the most?',
      'Tell us about a time you encouraged someone who had lost confidence.',
      'How do you decide what to do first when several tasks are urgent?',
      'What would your closest friend say is one quality you should improve?',
      'Describe a moment when you changed your opinion after hearing another person.',
      'How do you keep yourself informed about events that affect India?',
      'What would you do if a group plan you supported began to fail?',
      'Which achievement are you proud of, and what effort did it require?',
      'What does being dependable look like in everyday life?',
    ];
    try {
      if (typeof ssbOIR !== 'undefined' && Array.isArray(ssbOIR)) extraOIR.forEach(question => { if (!ssbOIR.some(existing => existing.q === question.q)) ssbOIR.push(question); });
      if (typeof ssbPsych !== 'undefined' && Array.isArray(ssbPsych)) extraPsych.forEach(task => { if (!ssbPsych.some(existing => existing.prompt === task.prompt)) ssbPsych.push(task); });
      if (typeof ssbInterview !== 'undefined' && Array.isArray(ssbInterview)) extraSSBInterview.forEach(question => { if (!ssbInterview.includes(question)) ssbInterview.push(question); });
    } catch (error) { console.warn('Extra NDA practice prompts could not be added.', error); }

    const simulator=document.getElementById('ssbSimulator');
    const baseNote=simulator?.querySelector(':scope > p');
    if(baseNote && !document.getElementById('ssbQuestionBankCount')){
      const count=document.createElement('p'); count.id='ssbQuestionBankCount'; count.className='ssb-question-bank-note';
      count.textContent='Expanded practice: 26 OIR questions · 13 psychology prompts · 14 interview questions · 5 GTO scenarios.';
      baseNote.after(count);
    }

    const gtoScenarios = [
      'Your group must move four people and limited supplies across a marked area using only the resources provided. How would you organise the group?',
      'Your team is planning a safe route to deliver first-aid supplies after heavy rain has blocked the direct path. How would you assess options and involve everyone?',
      'A group activity has a strict time limit and one resource is damaged. What practical plan would you suggest, and how would you adapt if it fails?',
      'Your team must carry a fragile item across an obstacle course while keeping all members involved. How would you divide roles and protect the item?',
      'Two groups need to share limited materials to complete a common task. How would you coordinate a fair, workable approach?',
    ];
    const originalRenderGTO = window.renderSSBDay3;
    const originalFinishGTO = window.finishSSBGTO;
    if (typeof originalRenderGTO === 'function' && typeof originalFinishGTO === 'function') {
      window.renderSSBDay3 = function () {
        const step = typeof ssbSim !== 'undefined' ? ssbSim.step : 0;
        const scenario = gtoScenarios[step % gtoScenarios.length];
        const panel = document.getElementById('ssbSimPanel');
        if (!panel || typeof window.ssbShell !== 'function') return originalRenderGTO.apply(this, arguments);
        panel.innerHTML = window.ssbShell('GTO Practice',`DAY 3 · GROUP TASK ${step + 1} OF ${gtoScenarios.length}`,`<div class="sim-question">${escapeHtml(scenario)}</div><textarea id="ssbGTOAnswer" class="sim-story" maxlength="1600" placeholder="Describe a safe, practical plan, how you would communicate, and how you would involve the group..."></textarea><div class="sim-actions"><button class="btn" onclick="finishSSBGTO()">Submit Plan</button></div><div class="sim-note">This digital exercise practises planning and communication. Real GTO tasks are physical and group-based.</div>`);
        window.startSSBTimer(150,window.finishSSBGTO);
      };
      window.finishSSBGTO = function () {
        window.clearSSBSimTimer();
        const answer=(document.getElementById('ssbGTOAnswer')?.value||'').trim();
        if(typeof ssbSim!=='undefined'){
          ssbSim.answers.push({type:'GTO',answer});
          if(ssbSim.step<gtoScenarios.length-1){ssbSim.step++;window.renderSSBDay3();return;}
          ssbSim.answers=ssbSim.answers.slice(-gtoScenarios.length);
        }
        return originalFinishGTO.apply(this,arguments);
      };
    }
  };
  const init = () => { expandPracticeContent(); addPyqPage(); addMobileNavigation(); bindSearchShortcut(); addInterviewerLipSync(); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();


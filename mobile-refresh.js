/* Mobile-first navigation, PYQ library, and lightweight study quality-of-life tools. */
(() => {
  const archiveCurrent = 'https://www.upsc.gov.in/examinations/previous-question-papers';
  const archivePast = 'https://www.upsc.gov.in/examinations/previous-question-papers/archives';
  const papers = [
    { year: 2025, session: 'II', archive: archiveCurrent },
    { year: 2025, session: 'I', archive: archiveCurrent },
    { year: 2024, session: 'II', archive: archiveCurrent },
    { year: 2024, session: 'I', archive: archiveCurrent },
    { year: 2023, session: 'II', archive: archivePast },
    { year: 2023, session: 'I', archive: archivePast },
    { year: 2022, session: 'II', archive: archivePast },
    { year: 2022, session: 'I', archive: archivePast },
    { year: 2021, session: 'II', archive: archivePast },
    { year: 2021, session: 'I', archive: archivePast },
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
    page.innerHTML = `<div class="pyq-intro"><div class="pyq-banner"><span class="tag">OFFICIAL UPSC PAPERS</span><h2>Past papers. Clearer preparation.</h2><p>Open the complete Mathematics and General Ability Test papers for NDA (I) and NDA (II) from 2021–2025. Solve them under timed conditions, then review the topics you missed.</p><button class="btn secondary" type="button" onclick="window.open('https://www.upsc.gov.in/examinations/previous-question-papers','_blank','noopener')">Browse the UPSC paper archive ↗</button></div><div class="pyq-stat"><strong>10</strong><b>exam sessions</b><span class="muted">20 official subject papers · 2021–2025</span></div></div><div class="card"><div class="pyq-card-head"><div><h3 style="margin:0">NDA PYQ library</h3><div class="muted" style="font-size:12px;margin-top:4px">Choose a session to open UPSC’s original paper list.</div></div><span class="tag">2021–2025</span></div><div class="pyq-grid" id="pyqGrid"></div><p class="pyq-note">Papers are hosted by the Union Public Service Commission. Each link opens the official UPSC question-paper page; select Mathematics or General Ability Test under the listed NDA session. This site is an independent study platform and is not affiliated with UPSC.</p></div>`;
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
      const target = `${paper.archive}#:~:text=${encodeURIComponent(exam)}`;
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
  const init = () => { addPyqPage(); addMobileNavigation(); bindSearchShortcut(); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();


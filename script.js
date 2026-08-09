(function(){
  "use strict";

  // Aktuální rok v patičce
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ============================================================
  // ŽIVÁ DATA ZE SERVERU (počet hráčů + online/offline stav)
  // ============================================================
  // Načítá se z oficiálního FiveM server-list API. Funguje i na
  // webu běžícím přes HTTPS a nepotřebuješ k tomu žádný vlastní
  // backend ani otevřené porty navíc.
  //
  // JAK ZÍSKAT SVŮJ "JOIN KÓD" (cfxCode):
  // 1. Server musí být viditelný na https://servers.fivem.net
  // 2. Otevři jeho stránku — adresa vypadá takto:
  //    https://servers.fivem.net/servers/detail/abcd1234xyz
  //    Kód je poslední část adresy: "abcd1234xyz"
  // 3. Vlož ho níže do FIVEM_CONFIG.cfxCode
  //
  // POZOR: Aktivní frakce, unikátní vozidla a uptime FiveM API
  // nenabízí (jsou to data z tvého vlastního gamemodu/databáze).
  // Tato tři čísla si buď uprav ručně v HTML výše, nebo si na
  // serveru vytvoř vlastní HTTP endpoint (např. přes SetHttpHandler
  // v server-side Lua/JS resource), který vrátí JSON, a stránku
  // na něj napoj stejným způsobem jako na fetchFiveMStatus() níže.

  const FIVEM_CONFIG = {
    cfxCode: "qqqq3jp",  // <-- ZDE ZMEŇ na svůj join kód z cfx.re
    maxPlayers: 48,               // zobrazené maximum hráčů (slots na serveru)
    maxPlayersFallback: 48,       // záložní maximum hráčů, pokud se live data nenačtou
    refreshInterval: 60000      // jak často (ms) obnovovat data — 60000 = 1 minuta
  };

  const DISCORD_CONFIG = {
    inviteCode: "dqZ7HvwFc6",   // invite kód z discord.gg/...
    refreshInterval: 60000
  };

  function animateCounter(el){
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1700;
    const startTime = performance.now();

    function tick(now){
      const target = parseFloat(el.dataset.target || '0', 10);
      const suffix = el.dataset.suffix || '';
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1){
        requestAnimationFrame(tick);
      } else {
        el.dataset.counted = 'true';
      }
    }
    requestAnimationFrame(tick);
  }

  function updateStatsPlayerCounter(online, max){
    const playerCounter = document.getElementById('playerCounter');
    if (!playerCounter) return;

    playerCounter.dataset.target = online;
    playerCounter.dataset.suffix = `/${max}`;

    if (playerCounter.dataset.counted === 'true') {
      playerCounter.dataset.counted = 'false';
      animateCounter(playerCounter);
    }
  }

  function updateNavPlayerCount(online, max){
    document.querySelectorAll('.js-player-count').forEach(el => {
      el.textContent = `${online}/${max}`;
    });
  }

  function updatePlayerDisplays(online, max){
    updateNavPlayerCount(online, max);
    updateStatsPlayerCounter(online, max);
  }

  async function fetchFiveMStatus(){
    const dots = document.querySelectorAll('.js-status-dot');
    const texts = document.querySelectorAll('.js-status-text');

    try{
      const res = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${FIVEM_CONFIG.cfxCode}`);
      if (!res.ok) throw new Error('Server neodpovídá');
      const json = await res.json();
      const data = json.Data;

      const online = data.clients ?? 0;
      const max = FIVEM_CONFIG.maxPlayers;

      updatePlayerDisplays(online, max);

      dots.forEach(d => d.classList.remove('is-offline'));
      texts.forEach(t => t.textContent = 'Server online');

    }catch(err){
      dots.forEach(d => d.classList.add('is-offline'));
      texts.forEach(t => t.textContent = 'Server offline');
      updatePlayerDisplays(0, FIVEM_CONFIG.maxPlayers);
    }
  }

  async function fetchDiscordMembers(){
    const discordCounter = document.getElementById('discordCounter');
    if (!discordCounter) return;

    try{
      const res = await fetch(`https://discord.com/api/v9/invites/${DISCORD_CONFIG.inviteCode}?with_counts=true`);
      if (!res.ok) throw new Error('Discord neodpovídá');
      const data = await res.json();
      const count = data.approximate_member_count ?? 0;

      discordCounter.dataset.target = count;
      discordCounter.dataset.suffix = '';
      if (discordCounter.dataset.counted === 'true') animateCounter(discordCounter);
    }catch(err){
      discordCounter.dataset.target = 0;
      discordCounter.dataset.suffix = '';
      if (discordCounter.dataset.counted === 'true') animateCounter(discordCounter);
    }
  }

  fetchFiveMStatus();
  setInterval(fetchFiveMStatus, FIVEM_CONFIG.refreshInterval);
  fetchDiscordMembers();
  setInterval(fetchDiscordMembers, DISCORD_CONFIG.refreshInterval);

  // --- Hero video: plynulé odhalení po načtení ---
  const heroVideoWrap = document.querySelector('.hero-video-wrap');
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideoWrap && heroVideo) {
    const revealHeroVideo = () => heroVideoWrap.classList.add('is-ready');
    const onHeroVideoReady = () => setTimeout(revealHeroVideo, 400);

    heroVideo.addEventListener('canplay', onHeroVideoReady, { once: true });
    heroVideo.addEventListener('loadeddata', onHeroVideoReady, { once: true });
    setTimeout(revealHeroVideo, 2500);

    const playPromise = heroVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }

  // --- Navigace: pozadí při scrollu ---
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
  }

  // --- Mobilní menu ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.setAttribute('aria-label', isOpen ? 'Zavřít menu' : 'Otevřít menu');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Otevřít menu');
      });
    });
  }

  // --- Scroll reveal animace ---
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  // --- Animované počítadlo statistik ---
  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(c => counterObserver.observe(c));

  // --- FAQ akordeon (pokud je na stránce přítomen) ---
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      item.closest('.faq-list').querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) openItem.classList.remove('open');
      });

      item.classList.toggle('open', !wasOpen);
    });
  });

  // --- Tým z Discordu (team.json, generuje GitHub Action) ---
  const teamGrid = document.getElementById('teamGrid');
  if (teamGrid) {
    const teamStatus = document.getElementById('teamStatus');

    const escapeHtml = (str) =>
      String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c]));

    const CATEGORY_LABELS = { management: 'Management', 'high-staff': 'High Staff', staff: 'Staff' };
    const CATEGORY_ORDER = ['management', 'high-staff', 'staff'];

    fetch('team.json', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('team.json nenalezen');
        return res.json();
      })
      .then((data) => {
        if (!data.members || data.members.length === 0) {
          teamStatus.textContent = 'Tým se ještě nepodařilo načíst ze serveru. Zkus to prosím později.';
          return;
        }

        teamStatus.remove();

        const groups = { management: [], 'high-staff': [], staff: [] };
        data.members.forEach((m) => {
          const cat = groups[m.category] ? m.category : 'staff';
          groups[cat].push(m);
        });

        teamGrid.innerHTML = CATEGORY_ORDER
          .filter((cat) => groups[cat].length > 0)
          .map((cat) => `
            <section class="team-group" data-category="${cat}">
              <div class="team-category-head">
                <span class="team-category-line" aria-hidden="true"></span>
                <h2 class="team-category-title">${CATEGORY_LABELS[cat]}</h2>
                <span class="team-category-line" aria-hidden="true"></span>
              </div>
              <div class="team-grid">
                ${groups[cat].map((m) => `
                  <article class="team-card reveal is-visible" data-category="${cat}">
                    <div class="team-avatar">
                      <img src="${escapeHtml(m.avatar)}" alt="" loading="lazy">
                    </div>
                    <h3 class="team-name">${escapeHtml(m.name)}</h3>
                    <span class="team-role">${escapeHtml(m.role)}</span>
                  </article>
                `).join('')}
              </div>
            </section>
          `).join('');

      })
      .catch(() => {
        teamStatus.textContent = 'Tým se nepodařilo načíst. Zkus to prosím později nebo nás najdi na Discordu.';
      });
  }

  // --- Pravidla serveru ---
  const rulesResults = document.getElementById('rulesResults');
  if (rulesResults) {
    const rulesSearch = document.getElementById('rulesSearch');
    const rulesTags = document.getElementById('rulesTags');
    const rulesCount = document.getElementById('rulesCount');
    const rulesStatus = document.getElementById('rulesStatus');

    let rulesData = null;
    let activeTag = 'all';
    let searchQuery = '';

    const escapeHtml = (str) =>
      String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c]));

    function getTagLabel(id){
      if (!rulesData) return id;
      if (id === 'all') return 'Vše';
      const tag = rulesData.tags.find(t => t.id === id);
      return tag ? tag.label : id;
    }

    function ruleMatches(rule){
      const q = searchQuery.trim().toLowerCase();
      const tagOk = activeTag === 'all' || rule.tags.includes(activeTag);
      if (!tagOk) return false;
      if (!q) return true;
      const haystack = `${rule.title} ${rule.content}`.toLowerCase();
      return haystack.includes(q);
    }

    function renderTags(){
      if (!rulesData) return;
      const tags = [{ id: 'all', label: 'Vše' }, ...rulesData.tags];
      rulesTags.innerHTML = tags.map(tag => `
        <button type="button" class="rules-tag${activeTag === tag.id ? ' is-active' : ''}" data-tag="${tag.id}">
          ${escapeHtml(tag.label)}
        </button>
      `).join('');

      rulesTags.querySelectorAll('.rules-tag').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTag = btn.dataset.tag;
          renderTags();
          renderRules();
        });
      });
    }

    function renderRuleCard(rule){
      return `
        <article class="glass-card rule-card" data-rule-id="${escapeHtml(rule.id)}">
          <button type="button" class="rule-card-toggle" aria-expanded="false">
            <div class="rule-card-main">
              <h3 class="rule-card-title">${escapeHtml(rule.title)}</h3>
              <div class="rule-card-tags">
                ${rule.tags.map(tagId => `<span class="rule-card-tag">${escapeHtml(getTagLabel(tagId))}</span>`).join('')}
              </div>
            </div>
            <i class="fa-solid fa-chevron-down rule-card-icon"></i>
          </button>
          <div class="rule-card-body">
            <div class="rule-card-content">
              <div class="rule-card-content-inner">${rule.content}</div>
            </div>
          </div>
        </article>
      `;
    }

    function bindRuleCards(){
      rulesResults.querySelectorAll('.rule-card-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const card = btn.closest('.rule-card');
          const isOpen = card.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', isOpen);
        });
      });
    }

    function renderRules(){
      if (!rulesData) return;

      const visible = rulesData.rules.filter(ruleMatches);
      rulesCount.textContent = `Zobrazeno ${visible.length} z ${rulesData.rules.length}`;

      if (visible.length === 0){
        rulesResults.innerHTML = '<p class="rules-empty">Žádné pravidlo neodpovídá hledání. Zkus jiný výraz nebo tag.</p>';
        return;
      }

      const grouped = rulesData.categories.map(cat => ({
        ...cat,
        rules: visible.filter(r => r.category === cat.id),
      })).filter(cat => cat.rules.length > 0);

      rulesResults.innerHTML = grouped.map(cat => `
        <section class="rules-category">
          <div class="rules-category-head">
            <i class="fa-solid ${escapeHtml(cat.icon)}"></i>
            <h2 class="rules-category-title">${escapeHtml(cat.label)}</h2>
          </div>
          <div class="rules-list">
            ${cat.rules.map(renderRuleCard).join('')}
          </div>
        </section>
      `).join('');

      bindRuleCards();
    }

    fetch('pravidla.json', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('pravidla.json nenalezen');
        return res.json();
      })
      .then(data => {
        rulesData = data;
        rulesStatus.remove();
        renderTags();
        renderRules();
      })
      .catch(() => {
        rulesStatus.textContent = 'Pravidla se nepodařilo načíst. Zkus to prosím později.';
        rulesCount.textContent = '';
      });

    if (rulesSearch){
      rulesSearch.addEventListener('input', () => {
        searchQuery = rulesSearch.value;
        renderRules();
      });
    }
  }

})();

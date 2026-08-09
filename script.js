(function(){
  "use strict";

  // --- Čisté URL bez index.html a koncové lomítko u /tym ---
  if (location.pathname.endsWith('/index.html')) {
    history.replaceState(null, '', location.pathname.replace(/\/index\.html$/, '/') + location.search + location.hash);
  } else if (location.pathname === '/tym/') {
    history.replaceState(null, '', '/tym' + location.search + location.hash);
  }

  // Aktuální rok v patičce
  document.getElementById('year').textContent = new Date().getFullYear();

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
    cfxCode: "TVUJ_JOIN_KOD",  // <-- ZDE ZMEŇ na svůj join kód z cfx.re
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

  // --- Hero YouTube: skrýt flash play tlačítka při startu ---
  const heroVideoWrap = document.querySelector('.hero-video-wrap');
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideoWrap && heroVideo) {
    const revealHeroVideo = () => heroVideoWrap.classList.add('is-ready');
    heroVideo.addEventListener('load', () => setTimeout(revealHeroVideo, 900));
    setTimeout(revealHeroVideo, 3500);
  }

  // --- Navigace: pozadí při scrollu ---
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });

  // --- Mobilní menu ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
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
      const icon = btn.querySelector('i');

      // Zavřít všechny ostatní otevřené položky a vrátit jim plus
      item.closest('.faq-list').querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          const otherIcon = openItem.querySelector('.faq-question i');
          if (otherIcon) otherIcon.className = 'fa-solid fa-plus';
        }
      });

      // Otevřít/zavřít aktuální položku a prohodit ikonu
      item.classList.toggle('open', !wasOpen);
      if (icon) {
        icon.className = !wasOpen ? 'fa-solid fa-minus' : 'fa-solid fa-plus';
      }
    });
  });

  // --- Tým z Discordu (team.json, generuje GitHub Action) ---
  const teamGrid = document.getElementById('teamGrid');
  if (teamGrid) {
    const teamStatus = document.getElementById('teamStatus');
    const teamUpdated = document.getElementById('teamUpdated');

    const escapeHtml = (str) =>
      String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c]));

    const CATEGORY_LABELS = { management: 'Management', 'high-staff': 'High Staff', staff: 'Staff' };
    const CATEGORY_ORDER = ['management', 'high-staff', 'staff'];

    fetch('/team.json', { cache: 'no-store' })
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
        teamGrid.classList.remove('team-grid'); // teď je to obal na skupiny, ne samotný grid

        const groups = { management: [], 'high-staff': [], staff: [] };
        data.members.forEach((m) => {
          const cat = groups[m.category] ? m.category : 'staff';
          groups[cat].push(m);
        });

        teamGrid.innerHTML = CATEGORY_ORDER
          .filter((cat) => groups[cat].length > 0)
          .map((cat) => `
            <div class="team-group" data-category="${cat}">
              <h3 class="team-group-title">${CATEGORY_LABELS[cat]}</h3>
              <div class="team-grid">
                ${groups[cat].map((m) => `
                  <div class="glass-card team-card reveal is-visible" data-category="${cat}">
                    <div class="avatar"><img src="${escapeHtml(m.avatar)}" alt="${escapeHtml(m.name)}" loading="lazy"></div>
                    <div class="team-name">${escapeHtml(m.name)}</div>
                    <div class="team-role">${escapeHtml(m.role)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('');

        if (data.updatedAt) {
          const d = new Date(data.updatedAt);
          teamUpdated.textContent = 'Naposledy aktualizováno: ' + d.toLocaleString('cs-CZ');
        }
      })
      .catch(() => {
        teamStatus.textContent = 'Tým se nepodařilo načíst. Zkus to prosím později nebo nás najdi na Discordu.';
      });
  }

})();
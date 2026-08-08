(function(){
  "use strict";

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
    maxPlayersFallback: 200,    // záložní maximum hráčů, pokud se live data nenačtou
    refreshInterval: 60000      // jak často (ms) obnovovat data — 60000 = 1 minuta
  };

  async function fetchFiveMStatus(){
    const dots = document.querySelectorAll('.js-status-dot');
    const texts = document.querySelectorAll('.js-status-text');
    const playerCounter = document.getElementById('playerCounter');

    try{
      const res = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${FIVEM_CONFIG.cfxCode}`);
      if (!res.ok) throw new Error('Server neodpovídá');
      const json = await res.json();
      const data = json.Data;

      const online = data.clients ?? 0;
      const max = data.sv_maxclients || FIVEM_CONFIG.maxPlayersFallback;

      if (playerCounter){
        playerCounter.dataset.target = online;
        playerCounter.dataset.suffix = ' / ' + max;
        // pokud karta se statistikou už byla na obrazovce spočítaná, přepočítej ji hned znovu
        if (playerCounter.dataset.counted === 'true') animateCounter(playerCounter);
      }

      dots.forEach(d => d.classList.remove('is-offline'));
      texts.forEach(t => t.textContent = 'Server online');

    }catch(err){
      dots.forEach(d => d.classList.add('is-offline'));
      texts.forEach(t => t.textContent = 'Server offline');
      if (playerCounter){
        playerCounter.dataset.target = 0;
        playerCounter.dataset.suffix = ' / ' + FIVEM_CONFIG.maxPlayersFallback;
        if (playerCounter.dataset.counted === 'true') animateCounter(playerCounter);
      }
    }
  }

  fetchFiveMStatus();
  setInterval(fetchFiveMStatus, FIVEM_CONFIG.refreshInterval);

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
    navToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
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
  function animateCounter(el){
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1700;
    const startTime = performance.now();

    function tick(now){
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

  // --- "Reflektorový" highlight na skleněných kartách (sleduje kurzor) ---
  const glassCards = document.querySelectorAll('.glass-card');
  glassCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });

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
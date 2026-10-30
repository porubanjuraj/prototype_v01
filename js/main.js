/* ==========================================================================
   Kaštieľ Mojmírovce – prototype interactions
   GSAP + ScrollTrigger + Lenis (same stack as the reference sites)
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollToEl = (el, offset = 0) => {
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'auto' });
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); return; }
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    const inMenu = !!a.closest('[data-menu]');
    if (inMenu) closeMenu();
    // let the menu start closing, then travel
    setTimeout(() => scrollToEl(target), inMenu ? 350 : 0);
  });

  /* ---------- Open menu ---------- */
  const menu = $('[data-menu]');
  const menuItems = $$('.menu-item', menu);
  const menuSide = $('[data-menu-side]', menu);
  const subPanels = $$('[data-sub-panel]', menu);
  let menuTimer = null;

  function setSub(key) {
    menuItems.forEach((i) => i.classList.toggle('is-active', !!key && i.dataset.sub === key));
    subPanels.forEach((p) => {
      const k = p.dataset.subPanel;
      p.classList.toggle('is-active', key ? k === key : k === 'none');
    });
    menuSide.classList.toggle('has-sub', !!key);
  }
  const scheduleClear = () => { clearTimeout(menuTimer); menuTimer = setTimeout(() => setSub(null), 220); };
  const cancelClear = () => clearTimeout(menuTimer);

  menuItems.forEach((it) => {
    it.addEventListener('mouseenter', () => { cancelClear(); setSub(it.dataset.sub); });
    it.addEventListener('focus', () => { cancelClear(); setSub(it.dataset.sub); });
  });
  $('[data-menu-nav]', menu).addEventListener('mouseleave', scheduleClear);
  menuSide.addEventListener('mouseenter', cancelClear);
  menuSide.addEventListener('mouseleave', scheduleClear);
  setSub(null);

  // keep the whole menu inside the viewport on any screen: scale it down when the window is too short
  const menuInner = $('.menu__inner', menu);
  function fitMenu() {
    const u = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
    const need = Math.max(155 + 48 + 472 + 48, 800) * u; // header + padding + 8 items; same proportion as the design
    const k = Math.min(1, window.innerHeight / need);
    menuInner.style.height = window.innerHeight / k + "px";
    menuInner.style.width = k < 1 ? 100 / k + "%" : "";
    menuInner.style.margin = k < 1 ? "0" : "";
    menuInner.style.transformOrigin = "0 0";
    menuInner.style.transform = k < 1 ? `scale(${k})` : "";
  }
  addEventListener('resize', fitMenu);
  fitMenu();

  let lastFocus = null;
  function openMenu() {
    lastFocus = document.activeElement;
    fitMenu();
    menu.classList.add('is-open');
    $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    if (lenis) lenis.stop(); else document.documentElement.style.overflow = 'hidden';
    setTimeout(() => $('.menu__close', menu).focus({ preventScroll: true }), 400);
  }
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (lenis) lenis.start(); else document.documentElement.style.overflow = '';
    setSub(null);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $$('[data-menu-open]').forEach((b) => b.addEventListener('click', openMenu));
  $$('[data-menu-close]').forEach((b) => b.addEventListener('click', closeMenu));

  /* ---------- Booking (hero bar + floating panel share one state) ---------- */
  const state = { arrival: '2026-10-24', departure: '2026-10-25', guests: 2 };
  const fmt = (v) => { const [y, m, d] = v.split('-'); return `${d}.${m}.${y}`; };
  const addDay = (v) => { const d = new Date(v + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

  function renderBooking() {
    $$('[data-booking]').forEach((f) => {
      $$('[data-date]', f).forEach((inp) => {
        const key = inp.dataset.date;
        inp.value = state[key];
        inp.closest('.datefield').querySelector('[data-date-text]').textContent = fmt(state[key]);
        if (key === 'departure') inp.min = state.arrival;
      });
      $$('[data-guests-value]', f).forEach((n) => (n.textContent = state.guests));
    });
  }
  $$('[data-booking]').forEach((f) => {
    $$('[data-date]', f).forEach((inp) => {
      inp.addEventListener('click', () => { try { inp.showPicker && inp.showPicker(); } catch (_) {} });
      inp.addEventListener('change', () => {
        if (!inp.value) return;
        state[inp.dataset.date] = inp.value;
        if (state.departure <= state.arrival) state.departure = addDay(state.arrival);
        renderBooking();
      });
    });
    $$('[data-guests]', f).forEach((b) => b.addEventListener('click', () => {
      state.guests = Math.min(10, Math.max(1, state.guests + Number(b.dataset.guests)));
      renderBooking();
    }));
  });
  renderBooking();

  /* ---------- Floating reservation ---------- */
  const float = $('[data-float]');
  const floatPill = $('[data-float-toggle]', float);
  function setFloat(open) {
    float.classList.toggle('is-open', open);
    floatPill.setAttribute('aria-expanded', open);
    if (open) setTimeout(() => $('[data-float-close]', float).focus({ preventScroll: true }), 350);
  }
  floatPill.addEventListener('click', () => setFloat(true));
  $('[data-float-close]', float).addEventListener('click', () => { setFloat(false); floatPill.focus({ preventScroll: true }); });
  const onHero = () => window.scrollY < window.innerHeight * 0.6;
  // "Rezervovať" on the hero → the full booking bar is right there, so just point to it
  $$('[data-float-open]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const fromMenu = menu.classList.contains('is-open');
    setTimeout(() => {
      if (onHero()) {
        const bar = $('.hero .booking');
        bar.classList.remove('is-pulse'); void bar.offsetWidth; bar.classList.add('is-pulse');
        const first = $('.hero .datefield input'); first && first.focus({ preventScroll: true });
      } else setFloat(true);
    }, fromMenu ? 500 : 0);
  }));
  // the floating pill lives only below the hero (the hero has the full booking bar)
  const syncFloat = () => { const away = onHero() && !float.classList.contains('is-open'); float.classList.toggle('is-away', away); };
  addEventListener('scroll', syncFloat, { passive: true });
  syncFloat();
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (menu.classList.contains('is-open')) closeMenu();
    else if (float.classList.contains('is-open')) setFloat(false);
  });

  /* ---------- Map: six stops ---------- */
  // PLACEHOLDER content – the design only has one Place Card ("Bazén")
  const places = {
    kastiel: { title: 'Kaštieľ', text: 'Divadelné schodisko, tereziánsky luster a portréty najznámejších Slovákov.', img: 'assets/img/hall-01.jpg' },
    park: { title: 'Park', text: 'Staré stromy, fontána a promenády, kde sa deň začína v prvom svetle.', img: 'assets/img/park-small.jpg' },
    restauracia: { title: 'Reštaurácia', text: 'Šlachtický obed v bývalom letnom sídle grófa Huňadyho.', img: 'assets/img/lunch.jpg' },
    bazen: { title: 'Bazén', text: 'Bazén 25 m, sauny, bowling a strelnica pod jednou strechou.', img: 'assets/img/place-photo.jpg' },
    sport: { title: 'Šport v areáli', text: 'Tenis, plážový volejbal a minigolf priamo v areáli kaštieľa.', img: 'assets/img/teaser-1.jpg' },
    pivnica: { title: 'Vínna pivnica', text: 'Klenbová tehlová pivnica s 120 obrazmi o víne a degustáciami.', img: 'assets/img/wine.jpg' },
  };
  const spots = $$('.hotspot');
  const card = $('[data-place-card]');
  let swapTimer = null;
  function showPlace(key) {
    const p = places[key];
    const fill = () => {
      $('[data-place-title]', card).textContent = p.title;
      $('[data-place-text]', card).textContent = p.text;
      $('[data-place-img]', card).src = p.img;
      card.classList.add('is-open');
    };
    clearTimeout(swapTimer);
    if (card.classList.contains('is-open')) { card.classList.remove('is-open'); swapTimer = setTimeout(fill, 260); }
    else fill();
  }
  spots.forEach((s) => s.addEventListener('click', () => {
    const wasActive = s.classList.contains('is-active');
    spots.forEach((o) => o.classList.remove('is-active'));
    if (wasActive) { card.classList.remove('is-open'); return; }
    s.classList.add('is-active');
    showPlace(s.dataset.place);
  }));

  /* ---------- Afternoon: teaser slider (active card is always the centre one) ---------- */
  const tRoot = $('[data-teasers]');
  const cards = $$('[data-card]', tRoot);
  const tCount = $('[data-teaser-count]', tRoot);
  const N = cards.length;
  let tActive = 1, tBusy = false;
  const U = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16; // px per design px
  const SLOT_X = { '-2': -411, '-1': 0, '0': 411, '1': 821, '2': 1232 };
  const rel = (i, a = tActive) => ((i - a + N + 1) % N + N) % N - 1; // -1 | 0 | 1 | 2
  const slotProps = (r) => ({ x: SLOT_X[r] * U(), width: (r === 0 ? 362 : 363) * U(), height: (r === 0 ? 592 : 480) * U(), opacity: Math.abs(r) <= 1 ? 1 : 0 });
  const layoutTeasers = () => cards.forEach((c, i) => gsap.set(c, slotProps(rel(i))));
  const paintCount = () => { tCount.innerHTML = `0${tActive + 1} – <span>0${N}</span>`; };
  function stepTeasers(dir) {
    if (tBusy) return;
    tBusy = true;
    const next = (tActive + dir + N) % N;
    const tl = gsap.timeline({ defaults: { duration: 1, ease: 'power3.inOut' }, onComplete: () => { tBusy = false; layoutTeasers(); } });
    cards.forEach((c, i) => {
      const from = rel(i), to = rel(i, next);
      if (dir === 1 && from === -1) tl.to(c, slotProps(-2), 0);                          // leaves left, re-enters on the right
      else if (dir === -1 && from === 2) { gsap.set(c, slotProps(-2)); tl.to(c, slotProps(-1), 0); } // enters from the left
      else tl.to(c, slotProps(to), 0);
    });
    tl.add(() => { tActive = next; paintCount(); }, 0.35);
  }
  $('[data-teaser-prev]', tRoot).addEventListener('click', () => stepTeasers(-1));
  $('[data-teaser-next]', tRoot).addEventListener('click', () => stepTeasers(1));
  cards.forEach((c, i) => c.addEventListener('click', (e) => { e.preventDefault(); const r = rel(i); if (r === -1) stepTeasers(-1); else if (r === 1) stepTeasers(1); }));
  let swipeX = null;
  tRoot.addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
  addEventListener('pointerup', (e) => { if (swipeX === null) return; const d = e.clientX - swipeX; swipeX = null; if (Math.abs(d) > 60) stepTeasers(d < 0 ? 1 : -1); });
  layoutTeasers();
  paintCount();
  addEventListener('resize', () => { if (!tBusy) layoutTeasers(); });

  /* ---------- Offers: hover expands a card ---------- */
  const offers = $$('[data-offer]');
  const applyStyle = (el, str) => str.split(';').forEach((p) => { const [k, v] = p.split(':'); if (k) el.style[k.trim()] = v.trim(); });
  function activateOffer(o) {
    offers.forEach((x) => {
      const on = x === o;
      x.classList.toggle('is-active', on);
      const img = $('.offer__bg img', x), sh = $('.offer__shade', x);
      applyStyle(img, on ? img.dataset.cropActive : img.dataset.cropIdle);
      sh.style.backgroundImage = on ? sh.dataset.shadeActive : sh.dataset.shadeIdle;
    });
  }
  offers.forEach((o) => {
    o.addEventListener('mouseenter', () => activateOffer(o));
    o.addEventListener('focusin', () => activateOffer(o));
  });

  /* ---------- Scroll-driven parts ---------- */
  if (!reduce) {
    /* Intro */
    gsap.from(".hero .header", { opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.1 });
    gsap.from('.hero__text > *', { opacity: 0, y: 36, duration: 1.2, ease: 'power3.out', stagger: 0.14, delay: 0.2 });
    gsap.from('.hero .booking', { opacity: 0, y: 36, duration: 1.2, ease: 'power3.out', delay: 0.55 });
    gsap.from('.hero__content > .icon-btn', { opacity: 0, y: 20, duration: 1, ease: 'power3.out', delay: 0.8 });

    /* Hero & façade: slow zoom, resting state = design */
    gsap.to('.hero__bg img', { scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.fromTo('.facade img', { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.facade', start: 'top bottom', end: 'top top', scrub: true } });

    /* Reveal: text, rows, images */
    $$('[data-reveal]').forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-reveal-rows]').forEach((wrap) => {
      gsap.from($$('.row', wrap), { opacity: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.12, clearProps: 'opacity,transform', scrollTrigger: { trigger: wrap, start: 'top 90%', once: true } });
    });
    $$('[data-reveal-img]').forEach((img) => {
      gsap.timeline({ scrollTrigger: { trigger: img.parentElement, start: 'top 88%', once: true } })
        .to(img, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'power3.inOut' }, 0)
        .fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0);
    });

    /* Map: hotspots pop in */
    gsap.from('.hotspot', { scale: 0, opacity: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.09, clearProps: 'opacity,transform', scrollTrigger: { trigger: '.map', start: 'top 70%', once: true } });
    gsap.from('.map__img', { scale: 1.12, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: '.map', start: 'top 90%', once: true } });

    /* Afternoon cards stagger in */
    gsap.from(cards.filter((_, i) => Math.abs(rel(i)) <= 1), { opacity: 0, y: 60, duration: 1.1, ease: "power3.out", stagger: 0.14, scrollTrigger: { trigger: tRoot, start: 'top 85%', once: true } });
    gsap.from('.offer', { opacity: 0, y: 60, duration: 1.1, ease: 'power3.out', stagger: 0.14, clearProps: 'opacity,transform', scrollTrigger: { trigger: '.offers', start: 'top 88%', once: true } });

    /* ----- Hall slider: pinned, scrubbed clip reveal (cf. elementis.co "innovation") ----- */
    (() => {
      const hall = $('.hall');
      const bgs = $$('[data-hall-bg]', hall);
      const slidesEl = $$('[data-slide]', hall);
      const hint = $('[data-hall-hint]', hall);
      const n = bgs.length;
      gsap.set(bgs, { scale: 1.1 });
      gsap.set(bgs[0], { scale: 1 });
      gsap.set(bgs.slice(1), { clipPath: 'inset(100% 0 0 0)', zIndex: (i) => i + 2 });
      gsap.set(slidesEl.slice(1), { opacity: 0, y: 28 });

      const STEP = 1.7, HOLD = 0.6, TRANS = 1.1;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hall, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * 0.95 * (n - 1) + window.innerHeight * 0.4),
          pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
        },
      });
      tl.to(hint, { opacity: 0, duration: 0.3 }, 0.15);
      for (let i = 1; i < n; i++) {
        const t = HOLD + (i - 1) * STEP;
        tl.to(bgs[i], { clipPath: 'inset(0% 0 0 0)', duration: TRANS, ease: 'power2.inOut' }, t)
          .to(bgs[i], { scale: 1, duration: TRANS + 0.4, ease: 'power2.out' }, t)
          .to(slidesEl[i - 1], { opacity: 0, y: -28, duration: 0.45, ease: 'power1.in' }, t)
          .to(slidesEl[i], { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, t + 0.5);
      }
      tl.to({}, { duration: 0.4 }, HOLD + (n - 2) * STEP + TRANS + 0.4); // final hold
    })();

    /* ----- Room slider: pinned, photos scroll up, text swaps (cf. hillbrookestate.co.nz) ----- */
    (() => {
      const root = $('[data-rooms]');
      const rooms = $$('[data-room]', root);
      const strip = $('[data-rooms-strip]', root);
      const imgs = $$('.rs__frame img', root);
      const n = rooms.length, H = () => root.querySelector(".rs__frame").offsetHeight;
      gsap.set(rooms.slice(1), { opacity: 0, y: 28 });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'center center', end: () => "+=" + (n - 1) * H(), pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
      });
      tl.to(strip, { y: () => -(n - 1) * H(), duration: n - 1 }, 0);
      for (let i = 1; i < n; i++) {
        tl.fromTo(imgs[i], { scale: 1.18 }, { scale: 1, duration: 1 }, i - 1)
          .to(rooms[i - 1], { opacity: 0, y: -28, duration: 0.32, ease: 'power1.in' }, i - 0.62)
          .to(rooms[i], { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, i - 0.34);
      }
    })();
  } else {
    // reduced motion: show first hall slide + first room, no pin
    $$('[data-hall-bg]').slice(1).forEach((b) => (b.style.display = 'none'));
    $$('[data-slide]').slice(1).forEach((s) => (s.style.display = 'none'));
    $$('[data-room]').slice(1).forEach((s) => (s.style.display = 'none'));
  }

  /* ---------- Marquee: movement is bound to scroll ---------- */
  (() => {
    const track = $('[data-marquee]');
    if (!track) return;
    const kids = Array.from(track.children);
    const section = $('.sec-evening');
    let unit = 1004, cur = 0, target = 0, visible = true;
    const measure = () => { unit = kids[2].offsetLeft - kids[0].offsetLeft; };
    measure();
    addEventListener('resize', measure);
    document.fonts && document.fonts.ready.then(measure);
    ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (s) => (visible = s.isActive) });
    const U = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
    const draw = () => {
      // design start: first word begins 795 design-px left of the screen; scroll pushes the line left
      const off = unit + ((((795 * U() + cur) % unit) + unit) % unit);
      track.style.transform = `translate3d(${-off}px,0,0)`;
    };
    draw();
    if (reduce) return;
    gsap.ticker.add(() => {
      if (!visible) return;
      target = (window.scrollY - section.offsetTop) * 0.7;
      cur += (target - cur) * 0.1;
      draw();
    });
  })();

  /* ---------- Sticky header: slides in only while scrolling UP (below the hero) ---------- */
  (() => {
    const bar = $('[data-stickynav]');
    if (!bar) return;
    let last = window.scrollY, shown = false;
    const set = (v) => { if (v === shown) return; shown = v; bar.classList.toggle('is-visible', v); bar.toggleAttribute('inert', !v); };
    set(false);
    addEventListener('scroll', () => {
      const y = window.scrollY, d = y - last;
      if (y < window.innerHeight * 0.5) set(false);
      else if (d < -6) set(true);
      else if (d > 6) set(false);
      if (Math.abs(d) > 6) last = y;
    }, { passive: true });
  })();

  /* ---------- Proportions: keep the design's "air" on big screens ----------
     --hz scales hero, header and hall card so they take the same share of the window height
     as in the 1280×832 design (the page itself scales with width, see html font-size). */
  (() => {
    const root = document.documentElement;
    const fit = () => {
      const u = parseFloat(getComputedStyle(root).fontSize) / 16;
      root.style.setProperty('--hz', Math.min(1, window.innerHeight / (832 * u)).toFixed(4));
    };
    addEventListener('resize', fit);
    fit();
  })();

  /* ---------- Refresh once all media is in ---------- */
  addEventListener('load', () => ScrollTrigger.refresh());
})();

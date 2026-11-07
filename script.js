/* =====================================================================
   SEGURIDAD BALÍSTICA · Landing premium
   JavaScript propio (sin librerías): no depende de ninguna CDN.
   Si algo falla, la página sigue viéndose completa (mejora progresiva).
   ===================================================================== */
(() => {
  'use strict';

  /* ---------------------------------------------------------------
     CONFIGURACIÓN: el número de WhatsApp vive SOLO aquí.
     Formato: código de país 52 + 10 dígitos. Vacío = se ocultan los
     botones de WhatsApp y el envío del formulario.
     --------------------------------------------------------------- */
  const WHATSAPP_NUMBER = '525560110930';
  const DEFAULT_MESSAGE = 'Hola, quiero información de Seguridad Balística.';

  /* ---------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;

  root.classList.add('js-on');

  /** Ejecuta un módulo sin que un error tumbe al resto de la página. */
  const safe = (name, fn, critical = false) => {
    try {
      fn();
    } catch (err) {
      console.error('[Seguridad Balística] módulo "' + name + '" falló:', err);
      if (critical) root.classList.add('js-fail');
    }
  };

  /* Motor de scroll: una sola lectura por fotograma para todas las escenas */
  const tasks = [];
  const resizers = [];
  let ticking = false;
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const vh = window.innerHeight;
      for (const t of tasks) {
        try { t(vh); } catch (e) { /* una escena nunca detiene a las demás */ }
      }
    });
  };

  /* ---------------------------------------------------------------
     WhatsApp
     --------------------------------------------------------------- */
  const waNumber = String(WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const hasWa = waNumber.length >= 10;
  const waUrl = (msg) => 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(msg);
  const formatPhone = (n) => {
    const m = n.match(/^52(\d{2})(\d{4})(\d{4})$/);
    return m ? '+52 ' + m[1] + ' ' + m[2] + ' ' + m[3] : '+' + n;
  };

  function initWhatsApp() {
    if (!hasWa) {
      $$('[data-wa-hide]').forEach((el) => { el.hidden = true; });
      return;
    }
    $$('[data-wa]').forEach((a) => {
      a.href = waUrl(a.dataset.waMsg || DEFAULT_MESSAGE);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    $$('[data-wa-number]').forEach((a) => { a.textContent = formatPhone(waNumber); });
  }

  function initForm() {
    const form = $('#contactForm');
    const msg = $('#formMsg');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const nombre = String(data.get('nombre') || '').trim();
      const empresa = String(data.get('empresa') || '').trim();
      const interes = String(data.get('interes') || '').trim();
      const detalle = String(data.get('detalle') || '').trim();

      if (!nombre) {
        msg.textContent = 'Cuéntanos tu nombre para poder atenderte.';
        $('#f-nombre').focus();
        return;
      }
      if (!interes) {
        msg.textContent = 'Elige qué te interesa para dirigirte con la persona correcta.';
        $('#f-interes').focus();
        return;
      }
      if (!hasWa) {
        msg.textContent = 'Por ahora no podemos abrir WhatsApp desde esta página. Inténtalo más tarde.';
        return;
      }
      msg.textContent = '';
      const lines = [
        'Hola, soy ' + nombre + (empresa ? ' de ' + empresa : '') + '.',
        'Me interesa: ' + interes + '.',
        detalle ? 'Detalles: ' + detalle : '',
        'Los encontré en su página web. ¿Me pueden asesorar?'
      ].filter(Boolean);
      window.open(waUrl(lines.join('\n')), '_blank', 'noopener');
    });
  }

  /* ---------------------------------------------------------------
     Cargador (termina en ~1.8 s; el CSS lo oculta a los 2.5 s aunque falle el JS)
     --------------------------------------------------------------- */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;
    const pct = $('#loaderPct');
    const dur = reduce ? 300 : 1600;
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 2.4);

    const finish = () => {
      setTimeout(() => {
        loader.classList.add('is-done');
        root.classList.add('is-ready');
        setTimeout(() => { loader.hidden = true; }, 800);
      }, 150);
    };
    const tick = (now) => {
      const t = clamp((now - t0) / dur);
      if (pct) pct.textContent = String(Math.round(ease(t) * 100));
      if (t < 1) requestAnimationFrame(tick);
      else finish();
    };
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------
     Menú móvil
     --------------------------------------------------------------- */
  function initMenu() {
    const burger = $('#burger');
    const menu = $('#menu');
    if (!burger || !menu) return;
    const set = (open) => {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      root.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', () => set(!menu.classList.contains('is-open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    const mq = window.matchMedia('(min-width: 960px)');
    const onChange = (ev) => { if (ev.matches) set(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }

  /* ---------------------------------------------------------------
     Revelado al hacer scroll + contadores
     --------------------------------------------------------------- */
  function initReveal() {
    $$('[data-stagger]').forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        if (child.classList.contains('reveal')) child.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
      });
    });
    const items = $$('.reveal');
    if (reduce || !hasIO) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length || reduce || !hasIO) return;
    const run = (el) => {
      const to = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const dur = 1600;
      const t0 = performance.now();
      const f = (now) => {
        const t = clamp((now - t0) / dur);
        el.textContent = (to * (1 - Math.pow(1 - t, 4))).toFixed(dec);
        if (t < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          run(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    els.forEach((el) => {
      el.textContent = '0';
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------
     Encabezado, progreso y enlace activo
     --------------------------------------------------------------- */
  function initChrome() {
    const hdr = $('.hdr');
    const progress = $('#progress');
    const links = $$('.nav a');
    const sections = links.map((a) => $(a.getAttribute('href')));
    tasks.push((vh) => {
      const y = window.scrollY;
      const max = root.scrollHeight - vh;
      if (progress) progress.style.setProperty('--sp', max > 0 ? clamp(y / max).toFixed(4) : '0');
      if (hdr) hdr.classList.toggle('is-scrolled', y > 24);
      let idx = -1;
      sections.forEach((s, i) => {
        if (s && s.getBoundingClientRect().top <= vh * 0.35) idx = i;
      });
      links.forEach((a, i) => a.classList.toggle('is-active', i === idx));
    });
  }

  /* ---------------------------------------------------------------
     HERO: parallax con el mouse, trayectoria de la bala y partículas
     --------------------------------------------------------------- */
  function createTrajectory() {
    const path = $('#trajPath');
    const trail = $('#trajTrail');
    const bullet = $('#bullet');
    const impact = $('#impact');
    if (!path || !trail || !bullet || !impact || !path.getTotalLength) return null;
    const ring = impact.firstElementChild;
    const L = path.getTotalLength();
    const CYCLE = 5600;
    const FLY = 1700;
    const RIP = 1000;
    trail.setAttribute('stroke-dasharray', '0 ' + L);
    trail.setAttribute('opacity', '0');

    return (t) => {
      const c = t % CYCLE;
      if (c < FLY) {
        const u = Math.pow(c / FLY, 1.7);
        const head = u * L;
        const tail = Math.min(head, L * 0.55);
        const p = path.getPointAtLength(head);
        const p2 = path.getPointAtLength(Math.min(L, head + 1));
        const ang = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;
        bullet.setAttribute('transform', 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') rotate(' + ang.toFixed(1) + ')');
        bullet.setAttribute('opacity', '1');
        trail.setAttribute('stroke-dasharray', tail.toFixed(1) + ' ' + L.toFixed(1));
        trail.setAttribute('stroke-dashoffset', (-(head - tail)).toFixed(1));
        trail.setAttribute('opacity', '0.9');
        impact.setAttribute('opacity', '0');
      } else if (c < FLY + RIP) {
        const k = (c - FLY) / RIP;
        bullet.setAttribute('opacity', '0');
        trail.setAttribute('opacity', String(0.9 * (1 - k)));
        if (ring) ring.setAttribute('r', (6 + k * 30).toFixed(1));
        impact.setAttribute('opacity', String(1 - k));
      } else {
        bullet.setAttribute('opacity', '0');
        trail.setAttribute('opacity', '0');
        impact.setAttribute('opacity', '0');
      }
    };
  }

  function createParticles(canvas, hero) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const small = window.innerWidth < 760;
    let w = 0;
    let h = 0;
    let parts = [];

    const spawn = (init) => ({
      x: Math.random() * w,
      y: init ? Math.random() * h : h + 12,
      r: Math.random() * 1.7 + 0.5,
      vy: -(Math.random() * 0.32 + 0.08),
      vx: (Math.random() - 0.5) * 0.16,
      ph: Math.random() * 6.283,
      red: Math.random() < 0.16,
      a: Math.random() * 0.45 + 0.25
    });

    const resize = () => {
      const nw = hero.clientWidth;
      const nh = hero.clientHeight;
      if (parts.length && Math.abs(nw - w) < 2 && Math.abs(nh - h) < 120) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp((w * h) / (small ? 9000 : 15000), 28, 90));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    resize();
    resizers.push(resize);

    const frame = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        p.x += p.vx + Math.sin(t * 0.0007 + p.ph) * 0.1;
        p.y += p.vy;
        if (p.y < -12 || p.x < -12 || p.x > w + 12) Object.assign(p, spawn(false));
        const a = p.a * (0.65 + 0.35 * Math.sin(t * 0.002 + p.ph));
        const col = p.red ? '255,74,82' : '246,200,110';
        ctx.fillStyle = 'rgba(' + col + ',' + (a * 0.16).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      if (!small) {
        ctx.lineWidth = 0.6;
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            const dx = parts[i].x - parts[j].x;
            const dy = parts[i].y - parts[j].y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 9000) {
              ctx.strokeStyle = 'rgba(217,164,65,' + ((1 - d2 / 9000) * 0.16).toFixed(3) + ')';
              ctx.beginPath();
              ctx.moveTo(parts[i].x, parts[i].y);
              ctx.lineTo(parts[j].x, parts[j].y);
              ctx.stroke();
            }
          }
        }
      }
    };
    return { frame };
  }

  function initHero() {
    const hero = $('#inicio');
    const stage = $('#stage');
    const copy = $('.hero__copy');
    if (!hero || !stage || reduce) return;

    // Al hacer scroll, el hero se aleja suavemente (propiedades "translate"/"scale" para no chocar con las animaciones CSS)
    tasks.push(() => {
      const r = hero.getBoundingClientRect();
      const p = clamp(-r.top / (r.height * 0.9));
      stage.style.translate = '0 ' + (p * -40).toFixed(1) + 'px';
      stage.style.scale = String((1 - p * 0.1).toFixed(3));
      if (copy) {
        copy.style.translate = '0 ' + (p * -50).toFixed(1) + 'px';
        copy.style.opacity = String((1 - p * 0.95).toFixed(3));
      }
    });

    const layers = $$('[data-depth]', stage);
    const traj = createTrajectory();
    const canvas = $('#fx');
    const particles = canvas ? createParticles(canvas, hero) : null;
    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    let visible = true;
    let raf = 0;

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

    const loop = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      mx = lerp(mx, tx, 0.07);
      my = lerp(my, ty, 0.07);
      layers.forEach((el) => {
        const d = parseFloat(el.dataset.depth) || 10;
        el.style.translate = (mx * d).toFixed(2) + 'px ' + (my * d).toFixed(2) + 'px';
      });
      if (traj) traj(now);
      if (particles) particles.frame(now);
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };

    if (hasIO) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        start();
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', start);
    start();
  }

  /* ---------------------------------------------------------------
     Propósito: palabras que se encienden con el scroll
     --------------------------------------------------------------- */
  function initScrub() {
    const sec = $('[data-scrub]');
    const txt = sec ? $('[data-scrub-text]', sec) : null;
    if (!sec || !txt) return;
    const words = txt.textContent.trim().split(/\s+/);
    const KEYS = /^(armas|manipulación|suerte|atrapado|proyectil|accidentes)[.,:;]?$/i;
    txt.textContent = '';
    const spans = words.map((word) => {
      const s = document.createElement('span');
      s.className = 'w' + (KEYS.test(word) ? ' key' : '');
      s.textContent = word;
      txt.appendChild(s);
      txt.appendChild(document.createTextNode(' '));
      return s;
    });
    if (reduce) {
      spans.forEach((s) => s.classList.add('on'));
      return;
    }
    let last = -1;
    tasks.push((vh) => {
      const r = sec.getBoundingClientRect();
      const total = r.height - vh;
      if (total <= 0) return;
      const p = clamp(-r.top / (total * 0.82));
      const n = Math.round(p * spans.length);
      if (n === last) return;
      last = n;
      spans.forEach((s, i) => s.classList.toggle('on', i < n));
    });
  }

  /* ---------------------------------------------------------------
     Anatomía del tubo: escena fijada con zoom por pasos
     --------------------------------------------------------------- */
  function initAnat() {
    const sec = $('[data-anat]');
    if (!sec || reduce) return;
    const stage = $('[data-anat-stage]', sec);
    const steps = $$('.step', sec);
    const cos = $$('.co', sec);
    const dots = $$('.anat__dots span', sec);
    const cfg = [
      { ox: 50, oy: 55, sc: 1 },
      { ox: 22, oy: 20, sc: 1.8 },
      { ox: 50, oy: 80, sc: 1.65 },
      { ox: 36, oy: 42, sc: 1.55 }
    ];
    let cur = -1;
    const set = (i) => {
      if (i === cur) return;
      cur = i;
      steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
      cos.forEach((c) => c.classList.toggle('is-on', parseInt(c.dataset.i, 10) === i));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
      const c = cfg[i] || cfg[0];
      stage.style.setProperty('--ox', c.ox);
      stage.style.setProperty('--oy', c.oy);
      stage.style.setProperty('--sc', c.sc);
    };
    set(0);
    tasks.push((vh) => {
      const r = sec.getBoundingClientRect();
      const total = r.height - vh;
      if (total <= 0) return;
      const p = clamp(-r.top / total);
      set(Math.min(steps.length - 1, Math.floor(p * steps.length)));
    });
  }

  /* ---------------------------------------------------------------
     Díptico que se abre en grande con el scroll
     --------------------------------------------------------------- */
  function initExpand() {
    const sec = $('[data-xp]');
    const frame = sec ? $('[data-xp-frame]', sec) : null;
    if (!sec || !frame || reduce) return;
    frame.style.setProperty('--p', '0');
    tasks.push((vh) => {
      const r = sec.getBoundingClientRect();
      const total = r.height - vh;
      if (total <= 0) return;
      const p = clamp(-r.top / (total * 0.8));
      frame.style.setProperty('--p', p.toFixed(4));
    });
  }

  /* ---------------------------------------------------------------
     Galería con desplazamiento horizontal fijado
     --------------------------------------------------------------- */
  function initHScroll() {
    const sec = $('[data-hs]');
    const view = sec ? $('.hs__view', sec) : null;
    const track = sec ? $('[data-hs-track]', sec) : null;
    if (!sec || !view || !track || reduce) return;
    let dist = 0;
    const measure = () => {
      const cs = window.getComputedStyle(view);
      const content = view.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      dist = Math.max(0, track.scrollWidth - content);
      sec.style.height = Math.round(dist + window.innerHeight * 1.1) + 'px';
    };
    measure();
    resizers.push(measure);
    tasks.push((vh) => {
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - vh;
      if (total <= 0) return;
      const p = clamp(-r.top / total);
      track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
    });
  }

  /* ---------------------------------------------------------------
     Proyecto tipo 3D: módulos que se ensamblan con el scroll
     --------------------------------------------------------------- */
  function initAssembly() {
    const asm = $('[data-asm]');
    const tilt = asm ? $('[data-asm-tilt]', asm) : null;
    if (!asm || !tilt) return;
    if (!reduce) {
      const base = parseFloat(window.getComputedStyle(asm).getPropertyValue('--gap')) || 34;
      tasks.push((vh) => {
        const r = asm.getBoundingClientRect();
        const p = clamp((vh - r.top) / (vh * 0.9 + r.height * 0.2));
        const e = clamp((p - 0.15) / 0.6);
        const eased = 1 - Math.pow(1 - e, 3);
        asm.style.setProperty('--gap', (base * (1 - eased)).toFixed(1) + 'px');
      });
    } else {
      asm.style.setProperty('--gap', '0px');
    }
    if (fine && !reduce) {
      asm.addEventListener('pointermove', (e) => {
        const r = asm.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty('--ry', (x * 26).toFixed(1) + 'deg');
        tilt.style.setProperty('--rx', (-7 + y * -12).toFixed(1) + 'deg');
      });
      asm.addEventListener('pointerleave', () => {
        tilt.style.setProperty('--ry', '0deg');
        tilt.style.setProperty('--rx', '-7deg');
      });
    }
  }

  /* ---------------------------------------------------------------
     Proceso: la bala recorre la línea
     --------------------------------------------------------------- */
  function initProcess() {
    const body = $('#proc');
    if (!body) return;
    const steps = $$('.pstep', body);
    tasks.push((vh) => {
      const r = body.getBoundingClientRect();
      const p = clamp((vh * 0.62 - r.top) / r.height);
      body.style.setProperty('--pp', p.toFixed(4));
      steps.forEach((s) => s.classList.toggle('is-on', s.getBoundingClientRect().top < vh * 0.62));
    });
  }

  /* ---------------------------------------------------------------
     Interacciones de puntero: tilt 3D, botones magnéticos y cursor
     --------------------------------------------------------------- */
  function initPointerFx() {
    if (!fine || reduce) return;

    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        el.classList.add('is-tilting');
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.translate = (x * 0.16).toFixed(1) + 'px ' + (y * 0.26).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });

    const cursor = $('#cursor');
    if (cursor) {
      root.classList.add('has-cursor');
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      let cx = x;
      let cy = y;
      window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
      const loop = () => {
        cx = lerp(cx, x, 0.18);
        cy = lerp(cy, y, 0.18);
        cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
        requestAnimationFrame(loop);
      };
      loop();
      document.addEventListener('pointerover', (e) => {
        const hot = e.target.closest && e.target.closest('a, button, summary, input, select, textarea, [data-zoom]');
        cursor.classList.toggle('is-hover', Boolean(hot));
      });
    }
  }

  /* ---------------------------------------------------------------
     Visor de fotos (se abren en grande)
     --------------------------------------------------------------- */
  function initLightbox() {
    const lb = $('#lightbox');
    const img = $('#lbImg');
    const cap = $('#lbCap');
    if (!lb || !img) return;
    let trigger = null;

    const open = (src, caption, alt, from) => {
      trigger = from;
      img.src = src;
      img.alt = alt || caption || '';
      cap.textContent = caption || '';
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add('is-open'));
      root.classList.add('lb-open');
      const closeBtn = $('[data-lb-close]', lb);
      if (closeBtn) closeBtn.focus();
    };
    const close = () => {
      lb.classList.remove('is-open');
      root.classList.remove('lb-open');
      setTimeout(() => {
        lb.hidden = true;
        img.removeAttribute('src');
      }, 350);
      if (trigger && trigger.focus) trigger.focus();
    };

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-zoom]');
      if (btn) {
        e.preventDefault();
        const im = $('img', btn);
        open(btn.dataset.src || (im && im.src) || '', btn.dataset.cap, im ? im.alt : '', btn);
        return;
      }
      if (!lb.hidden && (e.target.closest('[data-lb-close]') || e.target === lb)) close();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !lb.hidden) close();
    });
  }

  /* ---------------------------------------------------------------
     Arranque
     --------------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  safe('whatsapp', initWhatsApp);
  safe('formulario', initForm);
  safe('cargador', initLoader, true);
  safe('menu', initMenu);
  safe('revelado', initReveal, true);
  safe('contadores', initCounters);
  safe('chrome', initChrome);
  safe('hero', initHero, true);
  safe('proposito', initScrub);
  safe('anatomia', initAnat);
  safe('expansion', initExpand);
  safe('galeria', initHScroll);
  safe('ensamble', initAssembly);
  safe('proceso', initProcess);
  safe('puntero', initPointerFx);
  safe('visor', initLightbox);

  window.addEventListener('scroll', schedule, { passive: true });
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizers.forEach((fn) => { try { fn(); } catch (e) { /* ignorar */ } });
      schedule();
    }, 120);
  });
  window.addEventListener('load', () => {
    resizers.forEach((fn) => { try { fn(); } catch (e) { /* ignorar */ } });
    schedule();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      resizers.forEach((fn) => { try { fn(); } catch (e) { /* ignorar */ } });
      schedule();
    });
  }
  schedule();
})();

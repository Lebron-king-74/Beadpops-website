/*
  BeadPops, apparitions au scroll.

  Pattern retenu : celui de more-nutrition, mesuré au navigateur. Aucune section
  epinglee, aucun scroll detourne. Uniquement des apparitions declenchees a
  l'entree dans le viewport, plus une revelation ligne par ligne des titres.

  REGLE DURE (systeme/BRAIN.md) : une animation d'entree ne doit jamais
  conditionner la visibilite du contenu. En snapshot SEO, pour un crawler, en
  onglet d'arriere-plan ou en headless, un `opacity: 0` par defaut rend la page
  blanche. Trois garde-fous ici :

    1. Rien n'est masque en CSS. C'est le JS qui pose l'etat de depart.
    2. On ne masque QUE ce qui est hors de l'ecran au demarrage. Ce qui est
       deja visible n'est jamais touche, donc zero flash et zero risque sur le
       contenu au-dessus de la ligne de flottaison.
    3. Un filet de securite revele tout au bout de 6 secondes si un trigger
       ne s'est jamais declenche.

  Le script est idempotent : il peut etre relance a chaque `shopify:section:load`
  du Theme Editor sans retraiter deux fois le meme element.
*/
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  /* Conventions de classes des sections BeadPops (voir sections/bp-*.liquid). */
  var HEADS = '.os-hero-head,.uv-head,.hw-head,.md-head,.offer-head,.cr-head,.rv-head,.fw-head,.cx-head,.reasons-head';
  var TITLES = '.uv-title,.hw-title,.md-title,.offer-title,.cr-title,.rv-title-main,.fw-title,.cx-title';
  var GROUPS = [
    '.vl-card',
    '.uv-card',
    '.md-card',
    '.rv-card',
    '.fw-card',
    '.hw-step',
    '.os-tf-card'
  ];
  var MEDIA = '.uv-media,.md-media,.rv-media,.fw-media,.kit-detail-media';

  var DONE = 'bpRevealDone';
  var pending = [];
  var safetyTimer = null;

  /* Un element deja visible ne doit surtout pas etre masque. */
  function isBelowFold(el) {
    var box = el.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) return false;
    return box.top > window.innerHeight * 0.9;
  }

  function candidates(selector, scope) {
    return Array.prototype.slice
      .call((scope || document).querySelectorAll(selector))
      .filter(function (el) {
        if (el.dataset[DONE]) return false;
        if (!isBelowFold(el)) {
          el.dataset[DONE] = 'skipped'; /* visible au chargement, on n'y touche pas */
          return false;
        }
        el.dataset[DONE] = 'pending';
        return true;
      });
  }

  function revealEverything() {
    pending.forEach(function (el) {
      gsap.set(el, { clearProps: 'opacity,transform,visibility' });
      el.dataset[DONE] = 'revealed';
    });
    pending = [];
  }

  function armSafety() {
    if (safetyTimer) clearTimeout(safetyTimer);
    safetyTimer = setTimeout(revealEverything, 6000);
  }

  function track(el) {
    pending.push(el);
    return el;
  }

  function settled(el) {
    el.dataset[DONE] = 'revealed';
    var at = pending.indexOf(el);
    if (at > -1) pending.splice(at, 1);
  }

  /* --------- Apparition simple, montee discrete --------- */
  function revealOne(el, options) {
    var config = options || {};
    track(el);
    gsap.set(el, { opacity: 0, y: config.y === undefined ? 22 : config.y });
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: config.duration || 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onComplete: function () { settled(el); gsap.set(el, { clearProps: 'transform' }); }
    });
  }

  /* --------- Groupes : une seule salve pour tout ce qui entre ensemble --------- */
  function revealGroup(selector, scope) {
    var items = candidates(selector, scope);
    if (!items.length) return;
    items.forEach(track);
    gsap.set(items, { opacity: 0, y: 26 });
    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.62,
          ease: 'power2.out',
          stagger: 0.09,
          overwrite: true,
          onComplete: function () {
            batch.forEach(settled);
            gsap.set(batch, { clearProps: 'transform' });
          }
        });
      }
    });
  }

  /* --------- Titres : revelation ligne par ligne --------- */
  function revealTitle(el) {
    if (!window.SplitText) { revealOne(el, { y: 18 }); return; }
    var split;
    try {
      /* mask: 'lines' fait porter le debordement cache par SplitText lui-meme,
         donc la ligne monte depuis un masque sans que les jambages soient rognes. */
      split = new SplitText(el, { type: 'lines', linesClass: 'bp-line', mask: 'lines' });
    } catch (error) {
      revealOne(el, { y: 18 }); /* si SplitText echoue, on retombe sur un fondu simple */
      return;
    }
    if (!split.lines || !split.lines.length) { revealOne(el, { y: 18 }); return; }

    track(el);
    gsap.set(split.lines, { opacity: 0, yPercent: 108 });
    gsap.to(split.lines, {
      opacity: 1,
      yPercent: 0,
      duration: 0.82,
      ease: 'power3.out',
      stagger: 0.085,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onComplete: function () {
        settled(el);
        /* On rend le DOM d'origine : plus rien ne depend de l'animation. */
        if (split.revert) split.revert();
      }
    });
  }

  function scan(scope) {
    candidates(HEADS, scope).forEach(function (head) {
      var title = head.querySelector(TITLES);
      var others = Array.prototype.slice.call(head.children).filter(function (child) {
        return child !== title;
      });
      others.forEach(function (child) { revealOne(child, { y: 16, duration: 0.6 }); });
      if (title) revealTitle(title);
    });

    GROUPS.forEach(function (selector) { revealGroup(selector, scope); });

    candidates(MEDIA, scope).forEach(function (el) { revealOne(el, { y: 30, duration: 0.8 }); });

    armSafety();
    ScrollTrigger.refresh();
  }

  function boot() {
    var media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', function () {
      scan(document);
      /* Le Theme Editor reinjecte du HTML : on scanne le nouveau, on recalcule. */
      var onSectionLoad = function (event) {
        var target = event.detail && event.detail.sectionId
          ? document.querySelector('[data-section-id="' + event.detail.sectionId + '"]') || document
          : document;
        scan(target);
      };
      document.addEventListener('shopify:section:load', onSectionLoad);
      return function () {
        document.removeEventListener('shopify:section:load', onSectionLoad);
        revealEverything();
      };
    });
  }

  /*
    Les polices doivent etre chargees AVANT de decouper les titres en lignes,
    sinon les retours a la ligne sont calcules sur la police de secours et le
    decoupage est faux. On attend donc document.fonts.ready.
  */
  function start() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(boot).catch(boot);
    } else {
      boot();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();


(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* double ruban UGC : chaque piste porte le jeu de photos deux fois pour boucler */
  (function(){
    var tracks = [].slice.call(document.querySelectorAll('[data-ugc-track]'));
    if (!tracks.length) return;
    /* ⛔⛔ REGLEMENTAIRE — LES ALT NE NOMMENT PLUS AUCUNE LICENCE.
       `reglementaire.md` interdit nommement de « creer, nommer, vendre ni illustrer un
       produit avec un personnage protege », et cite explicitement Sanrio (Kuromi), Naruto
       et Sailor Moon. Sa regle de substitution : « decrire l'objet, jamais la licence.
       Chat gourmand, pas Kuromi. » Trois alt la violaient mot pour mot.

       ⚠️ CORRIGER L'ALT NE SUFFIT PAS, ET CE N'EST PAS MOI QUI PEUX LE FAIRE : les
       FICHIERS `sailor-moon.webp`, `naruto.webp` et `kuromi-workspace.webp` reproduisent
       toujours les personnages a l'image. `reglementaire.md` demande leur remplacement
       (tag Shopify `demo-licence-a-remplacer`). Tant qu'ils sont la, cette galerie ne peut
       pas partir en production — c'est de la contrefacon, et Shopify ferme la boutique sur
       simple notification. A ARBITRER PAR L'OPERATEUR. */
    var SHOTS = [
      ['sailor-moon.webp', 'Création en pixel art aux tons pastel'], ['naruto.webp', 'Création en pixel art aux tons orange'],
      ['neon-panther.webp', 'Panthère néon en pixel art'], ['pink-leopard.webp', 'Léopard rose en pixel art'],
      ['kuromi-workspace.webp', 'Création en pixel art posée sur un bureau'], ['shiba.webp', 'Shiba en pixel art'],
      ['blue-flower-cat.webp', 'Chat et fleur bleue en pixel art'], ['floral-animals.webp', 'Animaux fleuris en pixel art'],
      ['fantasy-character.webp', 'Personnage fantasy en pixel art'], ['green-character.webp', 'Personnage vert en pixel art'],
      ['sailor-orange.webp', 'Création orange en pixel art']
    ];
    tracks.forEach(function(track, row){
      var order = row === 0 ? SHOTS : SHOTS.slice().reverse();
      // deux passes : la seconde est la copie qui rend la boucle continue
      for (var pass = 0; pass < 2; pass++){
        order.forEach(function(s){
          var fig = document.createElement('figure');
          fig.className = 'ugc__ph' + (pass ? ' is-dup' : '');
          // la premiere passe ne peut pas etre lazy : ces photos vivent hors du viewport
          // en largeur, le navigateur ne les charge donc qu'au moment ou le ruban les
          // amene a l'ecran, et elles apparaissent par a-coups pendant l'animation.
          fig.innerHTML = '<img src="' + window.__osAssetBase + 'os-reviews-' + s[0] + '" alt="' + (pass ? '' : s[1]) + '"' +
            (pass ? ' loading="lazy"' : '') + ' decoding="async">';
          if (pass) fig.setAttribute('aria-hidden', 'true');
          track.appendChild(fig);
        });
      }
    });
  })();

  /* CTA collant : visible entre la buy box et le pied de page */
  (function(){
    var bar = document.querySelector('[data-sticky]');
    var anchor = document.querySelector('.buy .cta');
    /* `[data-closing]` designe le PIED DE PAGE depuis le 2026-08-12 : le CTA final a
       ete remplace par le pied, donc `.close` n'existe plus. La barre collante se
       retracte a son arrivee, non plus pour eviter deux boutons identiques a l'ecran
       mais pour ne pas couvrir les liens legaux. */
    var closing = document.querySelector('[data-closing]');
    if (!bar || !anchor || !('IntersectionObserver' in window)) return;
    var passed = false, atEnd = false;
    function sync(){ bar.classList.toggle('is-on', passed && !atEnd); }
    new IntersectionObserver(function(e){
      passed = !e[0].isIntersecting && e[0].boundingClientRect.top < 0;
      sync();
    }, { threshold:0 }).observe(anchor);
    if (closing) new IntersectionObserver(function(e){
      atEnd = e[0].isIntersecting; sync();
    }, { threshold:.12 }).observe(closing);
  })();


  /* ⛔ LES DESIGNS VIENNENT DE SHOPIFY, PLUS D'UN TABLEAU FIGE.
     Ils sont injectes par la section dans un <script type="application/json">. On lit
     ce noeud plutot que de fabriquer du JS en Liquid : les titres des produits peuvent
     contenir apostrophes, guillemets et accents, et «json« de Liquid les echappe
     correctement une fois pour toutes. */
  var DESIGNS = (function(){
    var n = document.getElementById('os-sk-designs');
    if (!n) return [];
    try { return JSON.parse(n.textContent) || []; } catch (e) { return []; }
  })();
  var packs = [].slice.call(document.querySelectorAll('.pack'));
  var chosen = document.querySelector('[data-chosen]'), total = document.querySelector('[data-total]');
  var meter = document.querySelector('[data-meter]'), priceOut = document.querySelector('[data-total-price]');
  function selectPack(el){
    packs.forEach(function(p){ p.setAttribute('aria-checked', String(p === el)); });
    var n = parseInt(el.dataset.pack, 10);
    total.textContent = n;
    /* le quota vient de changer : la grille recalcule ce qui est inclus et ce qui passe
       en option, et republie le prix total. Aucune selection n'est perdue. */
    if (window.__syncDesigns) window.__syncDesigns();
    else { chosen.textContent = 0; meter.style.transform = 'scaleX(0)'; }
  }
  packs.forEach(function(p){
    p.addEventListener('click', function(){ selectPack(p); });
    p.addEventListener('keydown', function(e){ if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); selectPack(p); } });
  });
  selectPack(document.querySelector('.pack[aria-checked="true"]') || packs[1]);

  /* ---- OBJECTIONS EN MOBILE : un onglet a la fois ------------------------------
     ⛔ MOBILE UNIQUEMENT. En desktop le damier reste intact — consigne de l'operateur.
     Le DOM n'est pas modifie : on ajoute une nav et on bascule un attribut. Sans JS, les
     huit tuiles restent visibles, donc aucun contenu ne depend du script.
     ⚠️ L'APPARIEMENT CARTE / PHOTO N'EST PAS L'ORDRE DU DOM. Le damier est pose
     ph, c, c, ph, ph, c, c, ph pour que l'alternance tombe juste sur DEUX colonnes. La
     carte n°2 voisine donc la photo n°2 a l'ecran, pas celle qui la suit dans le code.
     On apparie par INDEX (n-ieme carte avec n-ieme photo), ce qui redonne exactement les
     couples que le damier mobile formait. Le deduire de l'ordre du DOM donnerait des
     paires fausses. */
  (function objetsMobiles(){
    var damier = document.querySelector('[data-ways]');
    if (!damier) return;
    var mq = window.matchMedia('(max-width:899px)');
    var cartes = [].slice.call(damier.querySelectorAll('.ways__c'));
    var photos = [].slice.call(damier.querySelectorAll('.ways__ph'));
    if (cartes.length !== photos.length || !cartes.length) return;

    var nav = document.createElement('div');
    nav.className = 'ways__nav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Les objections');
    var onglets = cartes.map(function(c, i){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ways__t';
      b.setAttribute('role', 'tab');
      b.innerHTML = '<i>' + ('0' + (i + 1)) + '</i><span>' + (c.getAttribute('data-onglet') || ('Objection ' + (i + 1))) + '</span>';
      b.addEventListener('click', function(){ montre(i); });
      nav.appendChild(b);
      return b;
    });

    function montre(k){
      cartes.forEach(function(c, i){ if (i === k) c.setAttribute('data-actif', ''); else c.removeAttribute('data-actif'); });
      photos.forEach(function(f, i){ if (i === k) f.setAttribute('data-actif', ''); else f.removeAttribute('data-actif'); });
      onglets.forEach(function(b, i){ b.setAttribute('aria-selected', String(i === k)); b.tabIndex = i === k ? 0 : -1; });
      /* ⚠️ `opacity` ET PAS `autoAlpha` : `autoAlpha` pose un `visibility:hidden` tant
         que l'opacite est nulle, et un tween interrompu laisse la tuile invisible pour
         de bon. Ici la tuile est deja montree par le CSS, l'animation ne fait que la
         fondre — elle ne doit jamais pouvoir la cacher. */
      if (window.gsap && !reduce){
        gsap.killTweensOf([cartes[k], photos[k]]);
        gsap.set([cartes[k], photos[k]], { clearProps:'visibility' });
        gsap.fromTo([cartes[k], photos[k]], { opacity:0, y:10 },
          { opacity:1, y:0, duration:.4, ease:'expo.out', stagger:.06, overwrite:true, clearProps:'transform' });
      }
    }

    function pose(actif){
      if (actif){
        if (!nav.parentNode) damier.insertBefore(nav, damier.firstChild);
        damier.setAttribute('data-onglets', '');
        montre(0);
      } else {
        if (nav.parentNode) nav.parentNode.removeChild(nav);
        damier.removeAttribute('data-onglets');
        /* on rend TOUTES les tuiles au damier : un attribut oublie masquerait sept
           tuiles sur huit en desktop, et rien ne le signalerait. */
        cartes.concat(photos).forEach(function(n){ n.removeAttribute('data-actif'); n.style.removeProperty('opacity'); n.style.removeProperty('visibility'); });
      }
    }
    pose(mq.matches);
    mq.addEventListener('change', function(e){ pose(e.matches); });
  })();

  /* ---- FAQ : trois categories, un panneau a la fois ---- */
  [].slice.call(document.querySelectorAll('[data-faq]')).forEach(function(root){
    var tabs = [].slice.call(root.querySelectorAll('.faq__t'));
    var pans = [].slice.call(root.querySelectorAll('.faq__p'));
    function montre(k, focus){
      tabs.forEach(function(t, j){ t.setAttribute('aria-selected', String(j === k)); t.tabIndex = j === k ? 0 : -1; });
      pans.forEach(function(pn, j){ pn.hidden = j !== k; });
      if (focus) tabs[k].focus();
      if (window.gsap && !reduce)
        gsap.fromTo(pans[k].children, { autoAlpha:0, y:10 },
          { autoAlpha:1, y:0, duration:.42, ease:'expo.out', stagger:.035, overwrite:true, clearProps:'transform' });
    }
    tabs.forEach(function(t, k){ t.addEventListener('click', function(){ montre(k); }); });
    root.addEventListener('keydown', function(e){
      var i = tabs.indexOf(document.activeElement); if (i < 0) return;
      var pas = { ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1 }[e.key];
      if (!pas) return;
      e.preventDefault();
      montre((i + pas + tabs.length) % tabs.length, true);
    });
  });

  /* ---- selecteur de designs ---------------------------------------------------------
     Trois mecaniques, pensees pour un catalogue qui grossit :
       - la selection est ORDONNEE : les N premiers cliques sont compris dans le pack,
         le reste passe en option a 6,90 €. On n'interdit donc jamais un clic, et changer
         de pack ne detruit rien (les options deviennent des inclus, et inversement) ;
       - filtres ET recherche se cumulent, avec un compteur qui dit ce qu'ils ont fait ;
       - selectionner et agrandir sont deux gestes distincts : la vignette choisit, la
         loupe ouvre la visionneuse.
     Filtres et recherche ne font que MASQUER : un design choisi puis filtre reste choisi,
     sinon on perdrait le panier du client en changeant d'univers. */
  (function(){
    var grille = document.querySelector('[data-dgrid]');
    if (!grille || typeof DESIGNS === 'undefined') return;
    var PRIX_OPTION = 6.90;
    var UNIVERS = { kawaii:'Kawaii', fantasy:'Fantasy', anime:'Anime', cartoons:'Cartoons' };
    var NIVEAUX = { facile:'Facile', medium:'Medium', boss:'Boss' };
    var ORDRE_UNIVERS = ['kawaii', 'fantasy', 'anime', 'cartoons'];
    var vide = document.querySelector('[data-dnone]');
    var compteur = document.querySelector('[data-dcount]');
    var ordre = [], filtre = { u:'', n:'' };
    /* pont vers l'ajout au panier : les index choisis et le quota du pack courant */
    window.__osSelection = function(){ return { ordre: ordre.slice(), quota: quota() }; };

    /* ⚠️ CHIFFRES DE DEMONSTRATION — A REMPLACER AVANT LA MISE EN VENTE.
       Le nombre de beads par design n'existe pas encore (il depend du sourcing, cf.
       « ce qui reste ouvert cote produit »). Ces valeurs sont derivees du niveau pour
       que la maquette soit credible et STABLES d'un rendu a l'autre. Elles ne doivent
       jamais partir en ligne telles quelles : `reglementaire.md` interdit le chiffre
       invente. Le jour ou les vrais comptages arrivent, ajouter un champ `b` a DESIGNS
       et supprimer ce bloc. */
    var BEADS_DEMO = { facile:[900,1600], medium:[1900,3100], boss:[3600,4800] };
    function beadsDe(d, i){
      var r = BEADS_DEMO[d.n] || BEADS_DEMO.medium;
      return Math.round((r[0] + (r[1] - r[0]) * (((i * 37) % 100) / 100)) / 50) * 50;
    }
    /* ⚠️ MEME STATUT QUE `BEADS_DEMO` : CHIFFRES DE DEMONSTRATION, a remplacer avant la
       mise en vente. Le temps de pose n'a jamais ete mesure. Il est derive du nombre de
       beads a une cadence plausible, et rendu en FOURCHETTE pour ne pas afficher une
       precision qu'on n'a pas. `reglementaire.md` interdit le chiffre invente : ces deux
       blocs sont les deux seuls endroits a purger le jour ou les vraies donnees arrivent. */
    function tempsDe(d, i){
      var bas = Math.max(1, Math.floor(beadsDe(d, i) / 560));
      return bas + ' à ' + (bas + 1) + ' h';
    }
    /* la vignette n'a pas la place de « 3 à 4 h » : la ligne technique y est bornee par
       la largeur de la carte, et c'est la carte qui commande */
    function tempsCourt(d, i){
      var bas = Math.max(1, Math.floor(beadsDe(d, i) / 560));
      return bas + '-' + (bas + 1) + ' h';
    }
    var nombre = function(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };

    var dpick   = document.querySelector('[data-dpick]');
    var trigger = document.querySelector('[data-dopen]');
    var slots   = document.querySelector('[data-dtray-s]');
    var more    = document.querySelector('[data-dmore]');
    var xt      = document.querySelector('[data-dtray-xt]');
    var xs      = document.querySelector('[data-dtray-xs]');
    var xp      = document.querySelector('[data-dtray-xp]');
    var trayC   = document.querySelector('[data-dtray-c]');
    var trayP   = document.querySelector('[data-dtray-p]');
    var animOk  = !!window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var flipOk  = animOk && !!window.Flip;
    if (flipOk) gsap.registerPlugin(Flip);
    var euro = function(v){ return v.toFixed(2).replace('.', ',') + ' €'; };
    var esc = function(x){ return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };

    /* la grille est GROUPEE PAR UNIVERS, avec un en-tete collant. A vingt univers, on
       fait defiler et on sait toujours ou on est ; une grille a plat de deux cents
       vignettes ne se navigue pas. Les puces de filtre restent le raccourci. */
    var groupes = {};
    ORDRE_UNIVERS.concat(Object.keys(UNIVERS)).forEach(function(u){
      if (groupes[u] || !DESIGNS.some(function(d){ return d.u === u; })) return;
      var g = document.createElement('section');
      g.className = 'dgroup'; g.dataset.g = u;
      g.innerHTML = '<h4 class="dgroup__h">' + esc(UNIVERS[u] || u) + ' <span data-gn></span>' +
                    '<span class="dgroup__dots" data-dots hidden></span></h4><div class="dgroup__g"></div>';
      grille.appendChild(g);
      groupes[u] = g.querySelector('.dgroup__g');
    });

    DESIGNS.forEach(function(d, i){
      var cell = document.createElement('div');
      cell.className = 'dcell'; cell.dataset.i = i;
      cell.dataset.u = d.u; cell.dataset.n = d.n;
      cell.innerHTML =
        '<button type="button" class="dcard" aria-pressed="false" data-pick="' + i + '">' +
          '<img src="' + d.f + '" alt="" loading="lazy" decoding="async">' +
          '<span class="dcard__i">' +
            '<b class="dcard__t">' + esc(d.t) + '</b>' +
            '<span class="dcard__m">' +
              '<u>Contient :</u>' +
              '<b class="dcard__b">' + nombre(beadsDe(d, i)) + '<i>beads</i>' +
                '<span class="bead" aria-hidden="true"><img src="' + window.__osAssetBase + 'os-beads-bead.webp' + '" alt="" loading="lazy" decoding="async"></span>' +
              '</b>' +
            '</span>' +
            '<span class="dcard__s">' +
              '<span class="dcard__d" data-lv="' + d.n + '" aria-hidden="true"><i></i><i></i><i></i></span>' +
              '<u>Difficulté</u>' + esc(NIVEAUX[d.n] || d.n) +
            '</span>' +
          '</span>' +
          '<span class="dcard__on" aria-hidden="true"><i class="ico ico--check"></i></span>' +
          '<span class="dcard__x" aria-hidden="true">+ 6,90 €</span>' +
        '</button>' +
        '<button type="button" class="dzoom" data-zoom="' + i + '" aria-label="Voir ' + esc(d.t) + ' en grand">' +
          '<i class="ico ico--loupe" aria-hidden="true"></i>' +
        '</button>';
      (groupes[d.u] || grille).appendChild(cell);
    });
    var cells = [].slice.call(grille.querySelectorAll('.dcell'));

    /* Trois apercus dans le declencheur, pris dans TROIS univers differents : montrer
       trois kawaii ferait croire que le catalogue n'a qu'un registre. */
    var peek = document.querySelector('[data-dpeek]');
    if (peek){
      var deja = {}, choix = [];
      DESIGNS.forEach(function(d){ if (!deja[d.u] && choix.length < 3){ deja[d.u] = 1; choix.push(d); } });
      peek.innerHTML = choix.map(function(d){
        return '<img src="' + d.f + '" alt="" loading="lazy" decoding="async">';
      }).join('');
    }

    /* ---- les noms tiennent tous sur UNE ligne ----
       Consigne operateur, non negociable. On ne tronque pas non plus : « Fraise gou... »
       ne dit plus de quel design il s'agit. C'est la TAILLE DE POLICE qui cede, nom par
       nom, jusqu'a un plancher de 9 px.
       La mesure passe par un canvas et pas par le DOM : lire `scrollWidth` sur deux cents
       titres declencherait deux cents recalculs de mise en page. `measureText` n'en
       declenche aucun, et une seule lecture de largeur sert pour toute la grille — toutes
       les vignettes ont la meme. */
    var toise = document.createElement('canvas').getContext('2d');
    function ajusterNoms(){
      var titres = grille.querySelectorAll('.dcard__t');
      if (!titres.length) return;
      /* remettre a zero AVANT de lire la taille de reference, sinon un second passage
         mesurerait la police deja retrecie par le premier et ne remonterait jamais */
      for (var z = 0; z < titres.length; z++) titres[z].style.fontSize = '';
      var cs = getComputedStyle(titres[0]);
      var base = parseFloat(cs.fontSize), dispo = titres[0].clientWidth;
      /* le catalogue est un <dialog> ferme au depart : tout y mesure 0. Sans ce garde-fou
         on calerait chaque nom sur une largeur nulle, donc tous au plancher. */
      if (!dispo || !base) return;
      var av = cs.fontStyle + ' ' + cs.fontWeight + ' ', ap = ' ' + cs.fontFamily;
      for (var t = 0; t < titres.length; t++){
        var el = titres[t], txt = el.textContent, taille = base;
        toise.font = av + taille + 'px' + ap;
        while (taille > 9 && toise.measureText(txt).width > dispo){
          taille -= .5;
          toise.font = av + taille + 'px' + ap;
        }
        /* ⚠️ La hauteur de ligne est figee EN PIXELS sur la taille de reference, pas
           laissee en multiple de la police du titre. Sinon un nom retreci a 11,5 px
           fabrique une ligne plus basse qu'un nom reste a 12,5 px, et les vignettes
           reprennent 4 px d'ecart — le defaut meme qu'on corrige ici. */
        el.style.lineHeight = (base * 1.25).toFixed(2) + 'px';
        if (taille < base) el.style.fontSize = taille + 'px';
      }
    }
    /* ---- les points de position des etageres ----
       Recalcules a chaque changement de filtre : un univers filtre a deux designs n'a
       plus qu'une page, et laisser trois points promettrait un contenu qui n'existe pas. */
    function majDots(){
      [].slice.call(grille.querySelectorAll('.dgroup')).forEach(function(g){
        var piste = g.querySelector('.dgroup__g'), pts = g.querySelector('[data-dots]');
        if (!piste || !pts) return;
        var large = piste.clientWidth || 1;
        var pages = Math.max(1, Math.round(piste.scrollWidth / large));
        pts.hidden = pages < 2;
        if (pts.hidden){ pts.innerHTML = ''; return; }
        if (pts.children.length !== pages){
          var h = '';
          for (var k = 0; k < pages; k++) h += '<button type="button" data-page="' + k +
            '" aria-label="Page ' + (k + 1) + ' sur ' + pages + '"></button>';
          pts.innerHTML = h;
        }
        var actif = Math.min(pages - 1, Math.round(piste.scrollLeft / large));
        [].slice.call(pts.children).forEach(function(b, k){
          b.setAttribute('aria-current', String(k === actif));
        });
        piste.classList.toggle('has-suite',
          piste.scrollLeft + piste.clientWidth < piste.scrollWidth - 4);
      });
    }
    /* ---- l'amorce : prouver que ca glisse ----
       Le fondu dit qu'il y a une suite ; il faut encore que quelqu'un le croie. A
       l'ouverture, chaque etagere qui deborde avance de 30 px et revient. C'est le geste
       qu'on demande, joue une fois, en decale d'une etagere a l'autre pour que l'oeil
       suive le mouvement au lieu de voir la page entiere trembler.
       ⚠️ `scrollLeft` est anime via un objet intermediaire : ScrollToPlugin n'est pas
       charge sur cette page, et `gsap.to(element, {scrollTo:...})` serait sans effet
       silencieux. */
    function amorcerEtageres(){
      if (!animOk) return;
      [].slice.call(grille.querySelectorAll('.dgroup__g')).forEach(function(piste, k){
        if (piste.scrollWidth <= piste.clientWidth + 4) return;
        var o = { x: 0 };
        gsap.to(o, {
          x: 30, duration:.44, ease:'power2.out', yoyo:true, repeat:1,
          delay:.4 + k * .12,
          onUpdate: function(){ piste.scrollLeft = o.x; },
          onComplete: function(){ piste.scrollLeft = 0; majDots(); },
        });
      });
    }

    grille.addEventListener('scroll', function(e){
      if (e.target.classList && e.target.classList.contains('dgroup__g')) majDots();
    }, true);
    grille.addEventListener('click', function(e){
      var b = e.target.closest('[data-page]'); if (!b) return;
      var piste = b.closest('.dgroup').querySelector('.dgroup__g');
      piste.scrollTo({ left: +b.dataset.page * piste.clientWidth, behavior: animOk ? 'smooth' : 'auto' });
    });
    window.addEventListener('resize', majDots);
    window.addEventListener('resize', ajusterNoms);
    /* les polices de la marque arrivent apres le premier rendu : mesurer avant leur
       chargement, c'est mesurer du Times */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajusterNoms);

    function quota(){ var t = document.querySelector('[data-total]'); return parseInt(t && t.textContent, 10) || 0; }
    function prixPack(){ var p = document.querySelector('.pack[aria-checked="true"]'); return p ? parseFloat(p.dataset.price.replace(',', '.')) : 0; }
    function estChoisi(i){ return ordre.indexOf(i) > -1; }

    /* ---- le message du plateau : quatre etats ----
       Le quatrieme est celui qui manquait. Une fois le pack plein on dit qu'il est
       complet ET qu'on peut continuer : sans cette phrase le quota se lit comme une porte
       fermee, alors que c'est un palier de prix.
       ⚠️ Les chaines a apostrophe sont en guillemets DOUBLES. Une reecriture precedente a
       insere « c'est » dans une chaine a apostrophes simples et a casse tout le script,
       sans que rien ne se voie a la capture. */
    function messageDe(n, qt, extras){
      if (!qt) return '';
      if (n === 0) return 'Ton pack : <b>' + qt + '</b> pixel arts à toi';
      if (n < qt)  return 'Encore <b>' + (qt - n) + '</b> et ton pack est à toi';
      /* Meme phrase avec ou sans extras, VOULU. Le compte et le montant des designs en
         plus sont portes par la zone « En plus », juste dessous, en plus gros : les
         redire ici ferait lire deux fois la meme donnee a trois centimetres d'ecart.
         Le message garde son seul role, dire ou en est le PACK, et l'invitation reste
         valable tant qu'on peut ajouter. */
      return "<i>Ton pack est complet.</i> Envie d'un de plus ? " + euro(PRIX_OPTION) + ' le design.';
    }

    /* ---- le plateau : deux zones, des rangs, et jamais plus de deux rangees ----
       Au-dela de VISIBLE emplacements la premiere rangee se coupe et un bouton ouvre le
       reste sur DEUX rangees. Jamais trois : passe ce point ce sont les deux rangees qui
       defilent lateralement. Trois rangees d'emplacements sur un telephone, c'est le
       catalogue qu'on est venu regarder qui disparait. */
    var VISIBLE = 5;

    function slotHTML(i, rang, opt, pfx){
      /* `data-flip-id` : la surface est reconstruite EN ENTIER a chaque changement, les
         noeuds d'avant n'existent donc plus apres. C'est cet identifiant qui permet a Flip
         de reconnaitre un emplacement d'un rendu a l'autre et de le faire GLISSER vers sa
         nouvelle place. Sans lui, les vignettes restantes sautent d'un cran.
         ⚠️ Il est PREFIXE par la surface : le meme design vit dans le plateau et dans le
         recapitulatif, et deux elements partageant un flipId font apparier n'importe quoi
         avec n'importe quoi — une vignette de la buy box volerait vers le catalogue. */
      if (i === undefined) return '<span class="dslot" data-flip-id="' + pfx + 'v' + rang + '" aria-hidden="true"></span>';
      var d = DESIGNS[i];
      return '<span class="dslot ' + (opt ? 'dslot--x' : 'dslot--on') + '" data-slot="' + rang +
               '" data-flip-id="' + pfx + 'd' + i + '">' +
             '<img src="' + d.f + '" alt="' + esc(d.t) + '">' +
             '<b class="dslot__n">' + (rang + 1) + '</b>' +
             '<button type="button" class="dslot__x" data-drop="' + i +
               '" aria-label="Retirer ' + esc(d.t) + ' de ma sélection">&times;</button>' +
             '</span>';
    }

    /* ---- les DEUX surfaces qui montrent la selection ----
       Le plateau du catalogue et le recapitulatif de la buy box. Une seule fonction de
       rendu pour les deux : c'est la garantie qu'elles ne diront jamais deux choses
       differentes. Avant, la buy box comptait la selection dans son coin, et c'est
       exactement la que les quatre repetitions de chiffres etaient nees.
       Chaque surface garde en revanche SON propre etat « deplie » : on n'ouvre pas la
       liste du catalogue parce qu'on a ouvert celle de la buy box. */
    var SURFACES = [
      { h: document.querySelector('.dtray'), p: 't', s: slots, more: more, xt: xt, xs: xs, xp: xp, deplie: false },
      { h: document.querySelector('.recap'), p: 'r',
        s: document.querySelector('[data-rslots]'), more: document.querySelector('[data-rmore]'),
        xt: document.querySelector('[data-rxt]'), xs: document.querySelector('[data-rxs]'),
        xp: document.querySelector('[data-rxp]'), deplie: false },
    ].filter(function(f){ return f.s; });

    /* ---- « Tout afficher » n'apparait que si ca DEBORDE vraiment ----
       `VISIBLE = 5` est une constante taillee pour un telephone. Sur un plateau desktop
       de 1 150 px elle coupait a cinq et proposait d'afficher le reste devant 700 px de
       vide : un bouton qui promet du contenu cache alors qu'il reste de la place se lit
       comme un bug.
       Le calcul theorique (largeur disponible / pas) ne marche pas : le bouton est un
       frere du conteneur, donc l'afficher retrecit la place, qui decide de l'afficher.
       On MESURE en deux temps a la place — tout poser, regarder si ca deborde, et ne
       retomber sur la version coupee que dans ce cas.
       ⚠️ Desktop uniquement. Sous 720 px le mobile est FIGE : il garde ses cinq. */
    function ajusterDebordement(f, compris){
      if (!f.s || !f.more || f.deplie) return;
      if (!window.matchMedia('(min-width:720px)').matches) return;
      var rangee = f.s.querySelector('.dtray__row');
      if (!rangee) return;
      /* premier temps : tout est pose, le bouton est masque */
      f.more.hidden = true;
      if (rangee.scrollWidth <= f.s.clientWidth + 2) return;   /* ca tient : rien a faire */
      /* second temps : le bouton reprend sa place, on remesure ce qui reste */
      f.more.hidden = false;
      var pas = rangee.children.length ? (rangee.scrollWidth + 9) / rangee.children.length : 61;
      var tiennent = Math.max(1, Math.floor((f.s.clientWidth + 9) / pas));
      f.s.innerHTML = '<div class="dtray__row">' + compris.slice(0, tiennent).join('') + '</div>';
    }

    function rendreSurface(f, qt, extras){
      /* les emplacements compris : les choisis dans l'ordre, puis les vides jusqu'au quota */
      var compris = [];
      for (var k = 0; k < qt; k++) compris.push(slotHTML(ordre[k], k, false, f.p));
      /* Sous 720 px le mobile est fige : coupe a VISIBLE, comme avant. Au-dessus, on pose
         TOUT et c'est `ajusterDebordement` qui tranche a la mesure. */
      var large = window.matchMedia('(min-width:720px)').matches;
      var trop = !large && compris.length > VISIBLE, lignes;
      if (f.deplie && compris.length > VISIBLE){
        var m = Math.ceil(compris.length / 2); lignes = [compris.slice(0, m), compris.slice(m)];
      }
      else if (trop) lignes = [compris.slice(0, VISIBLE)];
      else lignes = [compris];
      f.s.innerHTML = lignes.map(function(l){ return '<div class="dtray__row">' + l.join('') + '</div>'; }).join('');

      if (f.more){
        f.more.hidden = !trop && !f.deplie;
        f.more.textContent = f.deplie ? 'Afficher moins' : 'Tout afficher';
        f.more.setAttribute('aria-expanded', String(f.deplie));
      }
      ajusterDebordement(f, compris);
      if (f.xt){
        f.xt.hidden = extras === 0;
        if (extras){
          f.xs.innerHTML = ordre.slice(qt).map(function(i, j){ return slotHTML(i, qt + j, true, f.p); }).join('');
          f.xp.textContent = extras + ' design' + (extras > 1 ? 's' : '') + ' · ' + euro(extras * PRIX_OPTION);
        }
      }
    }
    function rendrePlateau(qt, extras){
      SURFACES.forEach(function(f){ rendreSurface(f, qt, extras); });
    }

    var dernierMsg = '', etaitComplet = null;
    function poserMessage(html, complet){
      if (!trayC) return;
      var vientDeCompleter = complet && etaitComplet === false;
      etaitComplet = complet;
      if (html !== dernierMsg){
        var premier = dernierMsg === '';
        dernierMsg = html;
        /* le texte se remplace en fondu vertical : un message qui change d'un coup sous
           le pouce se lit comme un rate d'affichage, pas comme une reponse au clic */
        if (!animOk || premier) trayC.innerHTML = html;
        else gsap.timeline()
          .to(trayC, { yPercent:-45, autoAlpha:0, duration:.14, ease:'power2.in' })
          .add(function(){ trayC.innerHTML = html; })
          .fromTo(trayC, { yPercent:45, autoAlpha:0 },
                         { yPercent:0, autoAlpha:1, duration:.34, ease:'power3.out' });
      }
      /* LE moment du catalogue : le franchissement du « pack complet ». Un seul balayage
         orange, une seule fois. Rien d'autre ne bouge : un effet par EVENEMENT, pas un
         effet par element. Le fond revient a rien, `clearProps` rend la main aux tokens. */
      if (animOk && vientDeCompleter){
        gsap.fromTo(trayC,
          { backgroundColor:'#FF5C1A', color:'#0C0B0B' },
          { backgroundColor:'rgba(255,92,26,0)', color:'rgba(19,17,16,.76)',
            duration:.95, ease:'power2.out', clearProps:'backgroundColor,color' });
      }
    }

    function sync(){
      var qt = quota(), n = ordre.length, extras = Math.max(0, n - qt), inclus = Math.min(n, qt), vus = 0;

      cells.forEach(function(cell){
        var i = +cell.dataset.i, rang = ordre.indexOf(i), carte = cell.querySelector('.dcard');
        carte.setAttribute('aria-pressed', String(rang > -1));
        if (rang > -1 && rang >= qt) carte.dataset.x = '1'; else delete carte.dataset.x;
        var ok = (!filtre.u || cell.dataset.u === filtre.u) &&
                 (!filtre.n || cell.dataset.n === filtre.n);
        cell.hidden = !ok;
        if (ok) vus++;
      });
      /* un univers dont tout est filtre disparait, en-tete compris : laisser un titre
         seul au-dessus du vide donnerait l'impression d'un groupe casse */
      [].slice.call(grille.querySelectorAll('.dgroup')).forEach(function(g){
        var n = g.querySelectorAll('.dcell:not([hidden])').length;
        g.hidden = n === 0;
        var b = g.querySelector('[data-gn]'); if (b) b.textContent = n;
      });
      /* les comptes d'univers tiennent compte du filtre de niveau : afficher « 5 designs »
         sur Kawaii alors que le filtre Boss n'en laisse qu'un serait un mensonge d'interface */
      [].slice.call(document.querySelectorAll('[data-cu]')).forEach(function(el){
        var u = el.dataset.cu;
        var k = DESIGNS.filter(function(d){
          return (!u || d.u === u) && (!filtre.n || d.n === filtre.n);
        }).length;
        el.textContent = k + ' dispo';
      });
      if (vide) vide.hidden = vus > 0;
      if (compteur) compteur.textContent = vus;
      grille.classList.toggle('is-full', n >= qt);
      /* un filtre change le nombre de vignettes par etagere, donc le nombre de pages */
      majDots();

      var out = document.querySelector('[data-chosen]'); if (out) out.textContent = inclus;
      var m = document.querySelector('[data-meter]'); if (m) m.style.transform = 'scaleX(' + (qt ? inclus / qt : 0) + ')';

      /* Le recapitulatif n'apparait qu'une fois un design pris. Avant le premier clic il
         ne montrerait que des cases vides sous un declencheur qui pulse deja : deux
         appels a l'action pour un seul geste. */
      var rc = document.querySelector('[data-recap]'); if (rc) rc.hidden = n === 0;

      var total = prixPack() + extras * PRIX_OPTION;
      var pOut = document.querySelector('[data-total-price]'); if (pOut) pOut.textContent = euro(total);
      var sOut = document.querySelector('[data-sticky-price]'); if (sOut) sOut.textContent = euro(total);

      majSelecteur(qt, inclus, extras, total);
      majVisionneuse();
    }
    window.__syncDesigns = sync;

    /* Le plateau montre la selection EN ORDRE, avec des emplacements vides pour ce qui
       reste a prendre : on voit d'un coup d'oeil ce qu'on a et ce qui manque, sans
       compter. Les emplacements au-dela du quota sont marques en option. */
    function majSelecteur(qt, inclus, extras, total){
      var n = ordre.length;

      if (trigger){
        var tn = trigger.querySelector('[data-dopen-n]');
        var tt = trigger.querySelector('[data-dopen-t]');
        var ts = trigger.querySelector('[data-dopen-s]');
        if (tn) tn.textContent = n;
        if (tt) tt.textContent = n === 0 ? 'Ouvre le catalogue'
              : inclus < qt ? 'Encore ' + (qt - inclus) + ' à choisir'
              : 'Ta sélection est prête';
        /* La ligne du dessous ne raconte plus l'etat de la selection : elle le disait
           deja, en meme temps que la jauge et que l'encadre d'etape 3, et elle passait
           sur deux lignes des qu'il y avait des options, ce qui ecrasait « CHOISIR ».
           L'etat est porte une seule fois, par le recapitulatif juste dessous. Ici on
           dit ce qu'il y a derriere le bouton, ce qui ne change jamais de longueur. */
        if (ts) ts.textContent = DESIGNS.length + ' designs, 4 univers.';
      }

      rendrePlateau(qt, extras);
      poserMessage(messageDe(n, qt, extras), qt > 0 && n >= qt);
      if (trayP) trayP.textContent = euro(total);
      /* Le detail : le prix du pack et celui des options, separement. Le total seul
         obligeait a soustraire de tete pour savoir ce que les designs en plus coutent —
         et c'est precisement la ligne qu'on veut assumee, pas devinee. */
      var det = document.querySelector('[data-dtray-d]');
      if (det){
        var l = '<div><dt>Ton pack · ' + qt + ' designs</dt><dd>' + euro(prixPack()) + '</dd></div>';
        if (extras) l += '<div><dt>' + extras + ' design' + (extras > 1 ? 's' : '') +
                         ' en plus</dt><dd>' + euro(extras * PRIX_OPTION) + '</dd></div>';
        det.innerHTML = l;
      }
      [].slice.call(document.querySelectorAll('[data-dp]')).forEach(function(b){
        b.setAttribute('aria-pressed', String(+b.dataset.dp === qt));
      });

      /* Rien dans le panier tant qu'aucun design n'est choisi. Un bouton actif qui
         n'aboutit a rien est pire qu'un bouton eteint : la personne clique, il ne se
         passe rien, elle part. Ici le bouton dit pourquoi il attend, et le declencheur
         du catalogue pulse pour montrer OU aller. */
      /* ⚠️ Le verrou ne porte plus sur « aucun design » mais sur « le pack n'est pas
         complet ». Un pack de 5 paye pour 5 : partir avec 4 designs, c'est payer un
         design qu'on ne recevra pas, et s'en apercevoir apres la commande. Les designs
         EN PLUS, eux, n'entrent pas dans la condition — ils sont facultatifs par
         definition. */
      var vide = inclus < qt;
      [].slice.call(document.querySelectorAll('[data-buy]')).forEach(function(btn){
        /* `aria-disabled` et PAS `disabled` : un bouton reellement desactive ne recoit
           aucun evenement, donc il ne peut rien expliquer. Ici il reste cliquable, refuse
           l'ajout, et renvoie vers le seul endroit ou l'action existe. Les technologies
           d'assistance lisent bien l'etat, c'est le role d'`aria-disabled`. */
        btn.disabled = false;
        btn.classList.toggle('is-locked', vide);
        btn.setAttribute('aria-disabled', String(vide));
      });
      var hint = document.querySelector('[data-cta-hint]');
      if (hint){
        hint.hidden = !vide;
        /* La consigne nomme ce qui manque, pas la regle : « encore 2 designs » se comprend
           sans compter, « ton pack n'est pas complet » oblige a aller verifier. */
        if (vide) hint.textContent = n === 0
          ? 'Choisis tes ' + qt + ' designs pour continuer.'
          : 'Encore ' + (qt - inclus) + ' design' + (qt - inclus > 1 ? 's' : '') + ' à choisir.';
      }
      if (trigger) trigger.classList.toggle('is-wait', vide);
      if (window.__majLabels) window.__majLabels(qt);
      var tray = document.querySelector('.dtray');
      if (tray){
        tray.classList.toggle('is-empty', vide);
        tray.style.setProperty('--avance', qt ? Math.min(1, inclus / qt) : 0);
      }
    }

    /* Le vol de la vignette vers le plateau, porte par Flip.
       Sans lui, cliquer une vignette ne produit qu'un changement de bordure quelque part
       en haut de l'ecran, et le plateau se remplit sans qu'on voie le lien entre les deux.
       Flip mesure la position de depart, on deplace le clone dans l'emplacement, et il
       interpole le trajet. `absolute:true` le sort du flux pendant le vol pour que la
       grille ne bouge pas sous lui. */
    function volVersPlateau(carte){
      if (!flipOk || !slots) return;
      var img = carte.querySelector('img'); if (!img) return;
      /* cherche dans TOUT le plateau : au-dela du quota l'emplacement d'arrivee est dans
         la zone « en plus », pas dans la grille des compris */
      var cible = document.querySelector('.dtray [data-slot="' + (ordre.length - 1) + '"]');
      if (!cible) return;
      var r = img.getBoundingClientRect();
      var clone = img.cloneNode();
      clone.className = 'dfly';
      document.body.appendChild(clone);
      gsap.set(clone, { position:'fixed', left:r.left, top:r.top, width:r.width, height:r.height });
      var etat = Flip.getState(clone);
      cible.appendChild(clone);
      gsap.set(clone, { position:'absolute', left:0, top:0, width:'100%', height:'100%' });
      Flip.from(etat, {
        duration:.52, ease:'power2.inOut', absolute:true,
        onComplete:function(){
          clone.remove();
          gsap.fromTo(cible, { scale:.86 }, { scale:1, duration:.32, ease:'back.out(2.2)' });
        }
      });
    }

    function bascule(i, carte){
      var k = ordre.indexOf(i), ajout = k < 0;
      if (k > -1) ordre.splice(k, 1); else ordre.push(i);
      sync();
      if (ajout && carte) volVersPlateau(carte);
    }

    /* ---- retirer un design depuis le plateau ----
       Se tromper ne doit pas obliger a retrouver la vignette dans la grille pour la
       recliquer : au-dela du quota elle est peut-etre filtree hors de vue, et la
       selection doit pouvoir se defaire LA OU ELLE SE VOIT. */
    /* Les quatre zones a la fois (compris et « en plus », sur les deux surfaces) : un
       design retire de la zone « en plus » fait remonter les suivants dans la zone
       comprise, et le meme retrait rejoue dans la buy box. Les flipId etant prefixes par
       surface, Flip apparie chacun avec le bon. */
    function tousSlots(){ return document.querySelectorAll('.dtray .dslot, .recap .dslot'); }

    function retirer(i, emplacement){
      var faire = function(){
        /* etat pris AVANT le rendu, donc sur les anciennes positions. Les noeuds sont
           remplaces mais `data-flip-id` fait le lien : les survivants glissent vers leur
           nouvelle place au lieu de sauter d'un cran. */
        var etat = flipOk ? Flip.getState(tousSlots()) : null;
        bascule(i);
        if (etat) Flip.from(etat, {
          targets: tousSlots(), duration:.44, ease:'power2.out', absolute:true,
        });
      };
      if (!animOk || !emplacement) return faire();
      gsap.to(emplacement, { scale:.5, autoAlpha:0, duration:.19, ease:'power2.in', onComplete:faire });
    }

    /* Un seul branchement, applique aux deux surfaces : retirer un design et deplier la
       liste marchent a l'identique dans le catalogue et dans la buy box. */
    SURFACES.forEach(function(f){
      if (!f.h) return;
      f.h.addEventListener('click', function(e){
        var x = e.target.closest('[data-drop]');
        if (x){ retirer(+x.dataset.drop, x.closest('.dslot')); return; }
        if (!e.target.closest('[data-dmore],[data-rmore]')) return;
        f.deplie = !f.deplie;
        var etat = flipOk ? Flip.getState(tousSlots()) : null;
        sync();
        /* les emplacements deja la glissent vers la nouvelle disposition, ceux qui
           apparaissent entrent en fondu : sans `onEnter` ils surgiraient d'un bloc */
        if (etat) Flip.from(etat, {
          targets: tousSlots(), duration:.46, ease:'power2.out', absolute:true,
          onEnter: function(els){ return gsap.fromTo(els, { autoAlpha:0, scale:.7 },
            { autoAlpha:1, scale:1, duration:.34, ease:'power2.out' }); },
        });
      });
    });

    grille.addEventListener('click', function(e){
      var z = e.target.closest('[data-zoom]');
      if (z){ ouvrir(+z.dataset.zoom); return; }
      var c = e.target.closest('[data-pick]');
      if (c) bascule(+c.dataset.pick, c);
    });

    /* ---- visionneuse : <dialog> natif, donc piege de focus et Echap gratuits ---- */
    var dlg = document.querySelector('[data-dview]'), courant = -1;
    function majVisionneuse(){
      if (!dlg || courant < 0) return;
      var b = dlg.querySelector('[data-dpick]');
      if (b) b.textContent = estChoisi(courant) ? 'Retirer de ma sélection' : 'Choisir ce design';
    }
    function ouvrir(i){
      if (!dlg) return;
      var d = DESIGNS[i]; courant = i;
      var im = dlg.querySelector('[data-dimg]');
      im.src = d.f;
      im.alt = 'Le design ' + d.t + ', grille de pixels colorés';
      dlg.querySelector('[data-dtitle]').textContent = d.t;
      /* la meta ne porte plus que l'univers : le niveau a sa colonne dans la fiche
         technique juste dessous, et le redire a trois centimetres n'ajoute rien */
      dlg.querySelector('[data-dmeta]').textContent = UNIVERS[d.u] || d.u;
      /* memes `beadsDe` / `tempsDe` que la vignette, donc memes valeurs des deux cotes :
         les deux fonctions sont deterministes sur (niveau, index), rien n'est tire au
         hasard d'un rendu a l'autre. */
      var bds = dlg.querySelector('[data-dbeads]');
      if (bds) bds.textContent = nombre(beadsDe(d, i));
      var lvg = dlg.querySelector('[data-dlv]');
      if (lvg) lvg.dataset.lv = d.n;
      var lvn = dlg.querySelector('[data-dlvn]');
      if (lvn) lvn.textContent = NIVEAUX[d.n] || d.n;
      var tps = dlg.querySelector('[data-dtime]');
      if (tps) tps.textContent = tempsDe(d, i);
      majVisionneuse();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }
    if (dlg){
      dlg.addEventListener('click', function(e){
        if (e.target.closest('[data-dclose]') || e.target === dlg){ if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); return; }
        if (e.target.closest('[data-dpick]')) bascule(courant);
      });
      dlg.addEventListener('close', function(){ courant = -1; });
    }

    /* ---- les filtres se construisent depuis DESIGNS ----
       Ecrits en dur, ils se desynchronisaient du catalogue au premier design ajoute.
       Ici l'univers n'apparait que s'il a du contenu, et son compte est toujours juste. */
    /* Le selecteur de pack du catalogue ne duplique pas l'etat : il clique le vrai pack
       de la buy box, qui reste la source unique. Deux etats paralleles finiraient par
       diverger, et c'est le prix affiche qui en paierait le prix. */
    (function batirPack(){
      var hote = document.querySelector('[data-dpack]');
      if (!hote) return;
      var vrais = [].slice.call(document.querySelectorAll('.pack'));
      hote.innerHTML = '<span class="dpack__l">Ton pack</span>' + vrais.map(function(pk){
        var bad = pk.querySelector('.badge');
        var img = pk.querySelector('.pack__shot img');
        var uni = pk.querySelector('.pack__u');
        return '<button type="button" data-dp="' + pk.dataset.pack + '" aria-pressed="' +
               pk.getAttribute('aria-checked') + '">' +
               '<u>' + (bad ? esc(bad.textContent) : '') + '</u>' +
               (img ? '<span class="dpack__v"><img src="' + img.getAttribute('src') + '" alt="" loading="lazy" decoding="async"></span>' : '') +
               '<b>' + pk.dataset.pack + ' <em>designs</em></b>' +
               '<i>' + pk.dataset.price + ' €</i>' +
               (uni ? '<s>' + esc(uni.textContent) + '</s>' : '') +
               '</button>';
      }).join('');
      hote.addEventListener('click', function(e){
        var b = e.target.closest('[data-dp]'); if (!b) return;
        var cible = vrais.filter(function(pk){ return pk.dataset.pack === b.dataset.dp; })[0];
        if (cible) cible.click();
      });
    })();

    (function batirFiltres(){
      var fu = document.querySelector('[data-fu]'), fn = document.querySelector('[data-fn]');
      var vignette = function(u){
        var d = DESIGNS.filter(function(x){ return x.u === u; })[0];
        return d ? '<img src="' + d.f + '" alt="" loading="lazy" decoding="async">' : '';
      };
      if (fu){
        var dispo = ORDRE_UNIVERS.filter(function(u){ return DESIGNS.some(function(d){ return d.u === u; }); });
        var html = '<button class="filter ufil" type="button" data-f="u" data-v="" aria-pressed="true">' +
          '<span class="ufil__m ufil__m--all" aria-hidden="true">' + dispo.slice(0, 4).map(vignette).join('') + '</span>' +
          '<span class="ufil__n">Tous</span><span class="ufil__c" data-cu="">' + DESIGNS.length + ' dispo</span></button>';
        dispo.forEach(function(u){
          var n = DESIGNS.filter(function(d){ return d.u === u; }).length;
          html += '<button class="filter ufil" type="button" data-f="u" data-v="' + u + '" aria-pressed="false">' +
            '<span class="ufil__m" aria-hidden="true">' + vignette(u) + '</span>' +
            '<span class="ufil__n">' + esc(UNIVERS[u] || u) + '</span>' +
            '<span class="ufil__c" data-cu="' + u + '">' + n + ' dispo</span></button>';
        });
        fu.innerHTML = html;
      }
      if (fn){
        /* la jauge dit la difficulte sans mot : 1 bloc, 2 blocs, 3 blocs */
        var jauge = function(k){
          var t = '';
          for (var j = 0; j < 3; j++) t += '<i' + (j < k ? ' class="on"' : '') + '></i>';
          return '<span class="nfil__g" aria-hidden="true">' + t + '</span>';
        };
        var h = '<button class="filter nfil" type="button" data-f="n" data-v="" aria-pressed="true">Toutes</button>';
        ['facile', 'medium', 'boss'].forEach(function(k, idx){
          if (!DESIGNS.some(function(d){ return d.n === k; })) return;
          h += '<button class="filter nfil" type="button" data-f="n" data-v="' + k + '" aria-pressed="false">' +
               jauge(idx + 1) + esc(NIVEAUX[k] || k) + '</button>';
        });
        fn.innerHTML = h;
      }
    })();

    /* ---- trois boutons, un panneau a la fois (mobile) ----
       Chaque bouton porte SA valeur courante, donc l'etat des trois filtres se lit sans
       rien ouvrir. Le panneau s'ouvre en hauteur (GSAP interpole `height:auto`), se
       referme au second clic, a la selection, et quand on ouvre un autre. */
    (function panneaux(){
      var barre = document.querySelector('[data-dbar]');
      var zoneF = document.querySelector('.dpick__f');
      if (!barre || !zoneF) return;
      var groupes = {};
      [].slice.call(zoneF.querySelectorAll('[data-grp]')).forEach(function(g){ groupes[g.dataset.grp] = g; });
      var ouvert = null;

      function anime(el, vers){
        if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches){
          el.classList.toggle('is-open', vers); return;
        }
        if (vers){
          el.classList.add('is-open');
          gsap.fromTo(el, { height:0, autoAlpha:0 }, { height:'auto', autoAlpha:1, duration:.3, ease:'power2.out', clearProps:'height' });
        } else {
          gsap.to(el, { height:0, autoAlpha:0, duration:.22, ease:'power2.in',
            onComplete:function(){ el.classList.remove('is-open'); gsap.set(el, { clearProps:'height,opacity,visibility' }); } });
        }
      }
      /* L'amorce de defilement. Un masque de fondu dit qu'il y a une suite ; ce petit
         aller-retour le PROUVE, parce qu'on voit les vignettes bouger. Sans lui, une
         rangee qui deborde a droite se lit comme une rangee coupee, pas comme une rangee
         qui glisse. On anime `scrollLeft` via un objet intermediaire : pas de plugin a
         charger, et ca reste un defilement natif que le doigt reprend au vol. */
      function amorcer(el){
        if (!el || !window.gsap) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (el.scrollWidth <= el.clientWidth + 8) return;
        var o = { v: 0 };
        el.scrollLeft = 0;
        gsap.to(o, {
          v: 30, duration: .42, ease: 'power2.inOut', yoyo: true, repeat: 1, delay: .18,
          onUpdate: function(){ el.scrollLeft = o.v; }
        });
      }

      function poserPanneau(cle){
        var cible = cle === ouvert ? null : cle;
        Object.keys(groupes).forEach(function(k){
          var doitEtre = k === cible;
          if (groupes[k].classList.contains('is-open') !== doitEtre) anime(groupes[k], doitEtre);
        });
        [].slice.call(barre.querySelectorAll('[data-sheet]')).forEach(function(b){
          b.setAttribute('aria-expanded', String(b.dataset.sheet === cible));
        });
        ouvert = cible;
        if (cible && groupes[cible]) amorcer(groupes[cible]);
      }
      barre.addEventListener('click', function(e){
        var b = e.target.closest('[data-sheet]'); if (!b) return;
        poserPanneau(b.dataset.sheet);
      });
      /* choisir referme : on a eu la reponse, on revient aux designs */
      zoneF.addEventListener('click', function(e){
        if (e.target.closest('.filter, [data-dp]')) setTimeout(function(){ poserPanneau(ouvert); }, 160);
      });
      var RANG = { facile:1, medium:2, boss:3 };
      window.__majLabels = function(qt){
        var pn = document.querySelector('[data-lab-pack-n]'); if (pn) pn.textContent = qt;

        var bu = document.querySelector('.ufil[aria-pressed="true"]');
        var lu = document.querySelector('[data-lab-univ]');
        var vu = document.querySelector('[data-lab-univ-v]');
        var tousU = !bu || !bu.dataset.v;
        if (lu) lu.textContent = tousU ? 'Tous' : bu.querySelector('.ufil__n').textContent;
        if (vu){
          vu.classList.toggle('is-all', tousU);
          vu.innerHTML = bu ? bu.querySelector('.ufil__m').innerHTML : '';
        }

        var bn = document.querySelector('.nfil[aria-pressed="true"]');
        var ln = document.querySelector('[data-lab-niv]');
        var gn = document.querySelector('[data-lab-niv-g]');
        var tousN = !bn || !bn.dataset.v;
        if (ln) ln.textContent = tousN ? 'Toutes' : (NIVEAUX[bn.dataset.v] || bn.dataset.v);
        if (gn){
          var k = tousN ? 3 : (RANG[bn.dataset.v] || 0), t = '';
          for (var j = 0; j < 3; j++) t += '<s' + ((tousN || j < k) ? ' class="on"' : '') + '></s>';
          gn.innerHTML = t;
        }
      };
    })();

    /* ---- le catalogue se resserre pendant qu'on defile ----
       `gsap.matchMedia()` le cantonne au mobile et coupe tout en mode sobre : GSAP
       nettoie de lui-meme quand la requete cesse de correspondre.
       Le declenchement est au defilement, le retour au SILENCE (240 ms sans evenement) :
       c'est ce qui donne la sensation « ca s'ecarte quand j'avance, ca revient quand je
       m'arrete » plutot qu'un panneau qui clignote a chaque geste. */
    (function resserre(){
      var zone = document.querySelector('.dpick__g');
      var boite = document.querySelector('.dpick__in');
      if (!zone || !boite || !window.gsap) return;
      gsap.matchMedia().add({
        petit: '(max-width: 719px)',
        sobre: '(prefers-reduced-motion: reduce)'
      }, function(ctx){
        if (!ctx.conditions.petit) return;
        var sobre = ctx.conditions.sobre, serre = false, minuteur;
        /* Tout ce qui n'est pas un design s'efface pendant le defilement : l'en-tete
           et la barre de filtres en haut, le compteur et les emplacements en bas.
           Le prix et le bouton ne partent JAMAIS — ce sont les deux seules choses dont
           on peut avoir besoin a n'importe quel instant, et les faire disparaitre
           donnerait l'impression d'avoir perdu son panier. */
        var haut = boite.querySelector('.dpick__top');
        var bas  = function(){ return [boite.querySelector('.dtray__c'), boite.querySelector('.dtray__s')].filter(Boolean); };

        /* La grille reserve la hauteur du bandeau une fois pour toutes. Mesuree, pas
           devinee : elle change avec le panneau de filtres ouvert ou ferme. */
        /* Les deux habillages sont MESURES, jamais devines. Le bandeau du haut est en
           surcouche, donc la grille reserve sa hauteur en `padding-top`. Le plateau du bas
           ne recouvre rien, mais il faut quand meme pouvoir faire remonter la derniere
           rangee au-dessus de lui : sans reserve, un filtre qui ne laisse qu'une etagere
           donne un contenu qui tient presque dans la hauteur visible, et la rangee du bas
           reste coincee contre le plateau sans course pour la degager.
           La reserve vaut EXACTEMENT la hauteur du plateau, pas une fraction d'ecran : a
           42 vh elle laissait un demi-ecran vide en fin de liste. Et elle suit ses
           changements — le plateau grandit quand on deplie « Tout afficher ». */
        /* ⚠️ PAS `bas` : ce nom est deja pris, quelques lignes plus haut, par la FONCTION
           `bas()` qui rend les elements du plateau a estomper en mode resserre. Les deux
           vivent dans la meme portee, donc une variable homonyme ecrase la fonction et
           `poser()` levait « bas is not a function » a chaque defilement. */
        var plateau = boite.querySelector('.dtray');
        function reserver(){
          if (haut)    zone.style.setProperty('--haut', Math.ceil(haut.getBoundingClientRect().height) + 'px');
          if (plateau) zone.style.setProperty('--bas',  Math.ceil(plateau.getBoundingClientRect().height) + 'px');
        }
        reserver();
        window.addEventListener('resize', reserver);
        if (window.ResizeObserver){
          var ro = new ResizeObserver(reserver);
          if (haut) ro.observe(haut);
          if (plateau) ro.observe(plateau);
        }

        function poser(v){
          if (v === serre) return;
          serre = v;
          boite.classList.toggle('is-lean', v);
          if (sobre){
            gsap.set(haut, { yPercent: v ? -100 : 0 });
            gsap.set(bas(), { autoAlpha: v ? 0 : 1 });
            return;
          }
          /* `yPercent` + `force3D` : la couche part sur le GPU, rien n'est recalcule.
             `power3.out` au retour demarre franc et finit long — ca se pose au lieu de
             claquer. Le bas garde un fondu simple, il ne bouge pas de place. */
          gsap.timeline({ defaults: { overwrite: true, force3D: true } })
            .to(haut, {
              yPercent: v ? -100 : 0,
              duration: v ? .34 : .62,
              ease: v ? 'power2.in' : 'power3.out',
            }, 0)
            .to(bas(), {
              autoAlpha: v ? 0 : 1,
              duration: v ? .22 : .45,
              ease: 'sine.out',
            }, 0);
        }
        /* Le retour n'a lieu QUE quand trois choses sont vraies : le doigt a quitte
           l'ecran, l'inertie s'est arretee, et 620 ms se sont ecoulees. Les evenements
           `scroll` cessent aussi quand le doigt reste POSE sans bouger : sans ce
           garde-fou, l'habillage revenait en plein geste, sous le pouce. */
        var doigt = false;
        function planifier(){
          clearTimeout(minuteur);
          if (doigt) return;
          minuteur = setTimeout(function(){ if (!doigt) poser(false); }, 620);
        }
        function auDefilement(){
          if (zone.scrollTop > 32) poser(true);
          planifier();
        }
        function prise(){ doigt = true; clearTimeout(minuteur); }
        function lache(){ doigt = false; planifier(); }
        zone.addEventListener('scroll', auDefilement, { passive: true });
        zone.addEventListener('touchstart', prise, { passive: true });
        zone.addEventListener('pointerdown', prise, { passive: true });
        zone.addEventListener('touchend', lache, { passive: true });
        zone.addEventListener('touchcancel', lache, { passive: true });
        window.addEventListener('pointerup', lache, { passive: true });
        return function(){
          zone.removeEventListener('scroll', auDefilement);
          zone.removeEventListener('touchstart', prise);
          zone.removeEventListener('pointerdown', prise);
          zone.removeEventListener('touchend', lache);
          zone.removeEventListener('touchcancel', lache);
          window.removeEventListener('pointerup', lache);
          clearTimeout(minuteur); poser(false);
        };
      });
    })();

    /* ---- ouverture et fermeture du catalogue ----
       `<dialog.showModal()` donne le piege de focus, Echap et le fond inerte sans JS.
       A l'ouverture on rejoue une entree courte sur la grille : sans elle le catalogue
       apparait d'un bloc et on ne sait pas ou poser les yeux. */
    function ouvrirPick(){
      if (!dpick) return;
      if (dpick.showModal) dpick.showModal(); else dpick.setAttribute('open', '');
      /* ⚠️ ICI et pas au build : tant que le <dialog> est ferme, tout y mesure 0 et
         l'ajustement des noms calerait chaque titre sur une largeur nulle. */
      ajusterNoms();
      majDots();
      amorcerEtageres();
      if (flipOk){
        gsap.fromTo(dpick.querySelectorAll('.dcell'),
          { autoAlpha:0, y:14 },
          { autoAlpha:1, y:0, duration:.42, ease:'power2.out', stagger:{ amount:.35, from:'start' }, overwrite:true });
      }
    }
    function fermerPick(){
      if (!dpick) return;
      if (dpick.close) dpick.close(); else dpick.removeAttribute('open');
    }
    if (trigger) trigger.addEventListener('click', ouvrirPick);

    /* ---- le bouton qui attend renvoie vers le catalogue ----
       Cliquer un bouton qui ne fait rien, meme joliment contoure, c'est une impasse. On
       amene le declencheur a l'ecran et on le fait clignoter : la personne n'a pas a
       deviner ou se trouve l'etape qui manque, on la lui montre. */
    function montrerCatalogue(){
      if (!trigger) return;
      var r = trigger.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) {
        trigger.scrollIntoView({ block:'center', behavior: animOk ? 'smooth' : 'auto' });
      }
      if (!animOk) return;
      /* Trois battements en ease-out, sans rebond : `DESIGN.md` interdit le bounce, et
         un clignotement doit attirer l'oeil sans faire sursauter. `clearProps` rend la
         bordure a la regle CSS, sinon l'animation de veille `is-wait` resterait figee. */
      gsap.timeline()
        .fromTo(trigger, { borderColor:'#FF5C1A' },
                { borderColor:'#FF8C69', duration:.19, repeat:5, yoyo:true, ease:'power2.out',
                  clearProps:'borderColor' })
        .fromTo(trigger, { scale:1 }, { scale:1.012, duration:.14, ease:'power2.out' }, 0)
        .to(trigger, { scale:1, duration:.45, ease:'power2.out' }, .14);
    }
    [].slice.call(document.querySelectorAll('[data-buy]')).forEach(function(btn){
      btn.addEventListener('click', function(e){
        if (btn.getAttribute('aria-disabled') !== 'true') return;
        e.preventDefault();
        e.stopPropagation();
        montrerCatalogue();
      }, true);
    });
    if (dpick){
      dpick.addEventListener('click', function(e){
        if (e.target.closest('[data-dpick-close]') || e.target.closest('[data-dpick-ok]')) fermerPick();
      });
    }

    [].slice.call(document.querySelectorAll('.picker')).forEach(function(g){
      g.addEventListener('click', function(e){
        var b = e.target.closest('.filter'); if (!b) return;
        /* Recliquer un filtre actif le RETIRE et revient a « Tous ». Sans ca il fallait
           viser le bouton « Tous » pour annuler, alors que le geste naturel est de
           recliquer ce qu'on vient de choisir — c'est deja comme ca que se comportent
           les vignettes de design juste en dessous. Meme geste, meme resultat. */
        var deja = b.getAttribute('aria-pressed') === 'true' && b.dataset.v;
        var cible = deja ? '' : (b.dataset.v || '');
        [].slice.call(g.children).forEach(function(x){
          x.setAttribute('aria-pressed', String((x.dataset.v || '') === cible));
        });
        if (b.dataset.f) filtre[b.dataset.f] = cible;
        sync();
      });
    });

    /* ---- ⛔ PAS D'ANIMATION SUR LE CHANGEMENT DE FILTRE ----
       Une recomposition GSAP (Flip : les survivants glissent, les entrants apparaissent)
       a ete ajoutee puis RETIREE le 2026-08-13, apres deux signalements de l'operateur
       disant que le filtre « ne trie pas, ou parfois seulement ».
       Deux mecaniques la rendaient dangereuse, et la seconde est intermittente donc
       invisible en test :
         1. `autoAlpha` pose un `visibility:hidden` EN LIGNE sur les vignettes sorties.
            Elles repassaient en `hidden=false` au filtre suivant mais restaient
            invisibles. (Corrige, puis rendu caduc par le retrait.)
         2. `absolute:true` sort les vignettes du flux pendant la transition. Deux clics
            rapproches — le geste normal quand on compare des niveaux — se marchent dessus,
            et l'etat capture contient des elements deja positionnes en absolu.
       Un filtre doit TRIER. Quand la decoration met la fonction en danger, c'est la
       decoration qui saute : `animate.md` demande qu'une animation explique quelque
       chose, pas qu'elle coute la fiabilite de ce qu'elle illustre.
       Le tri est donc instantane, et `test-catalogue.mjs` le verifie au pointeur reel,
       y compris en clics rapides. Ne pas rouvrir sans ce test. */
    sync();
  })();

  /* f : la photo produit de la scene panoramique, cadree avec la moitie gauche vide
     pour que le texte s'y pose sans voile lourd. a : son texte alternatif. */
  var TOOLS = [
    /* ⛔⛔ CE COPY EST CELUI DE L'OPERATEUR, ISSU DE LA DOCUMENTATION REELLE DU PRODUIT.
       NE PAS LE REECRIRE. Il l'a sourcé (methode de l'Apercu IA, cf. HANDOFF) puis me l'a
       donne avec la consigne explicite : « utilise vraiment le copy que je t'ai donne, ne
       reecris pas ». Toute reformulation « pour ameliorer le style » est une regression :
       c'est precisement en inventant les tournures que la version precedente decrivait le
       Ruban a l'envers et un Stylo poseur qui n'existe pas.

       CINQ SEULES RETOUCHES, chacune imposee par une regle de la marque :
         · « perles » -> « beads » (x5)      `feedback.md`, refuse par `check-copy.mjs`
         · « vos plaques » -> « ton Bead Board »  tutoiement + on nomme le PRODUIT
         · « Leur role » -> « Son role »     un seul outil
         · « en le secouant » -> « en la »   accord (une coupelle)
         · « qu'elles se soudent » -> « ils » la page dit « les beads fondent entre eux »

       ⚠️ LE KIT CONTIENT 8 OUTILS, PAS 6. Le Perforator et la Sorting Tray sont nouveaux,
       le BeadPen remplace le « Stylo poseur », la Sort Box remplace la « Boite de tri ».
       Le compte « 8 outils » est ecrit au titre de la §4, dans la modale des packs et dans
       la FAQ : les quatre doivent bouger ensemble.

       ⚠️ LE FER N'EST PAS DANS LE KIT. Son role est explique dans le bloc « ce qui n'est
       pas dans le Starter Kit », pas ici. Ne pas le remonter dans cette liste.

       ⚠️ `f:null` = AUCUNE PHOTO REELLE DE CET OUTIL. Le selecteur affiche alors un
       emplacement marque au lieu d'une image. NE PAS generer un visuel « en attendant » :
       ce projet l'a deja fait une fois et a produit un Stylo poseur qui n'existe pas.
       Une photo du vrai produit, ou rien. */
    { i:'board',   n:'Bead Board',           r:'Support à picots',
      p:"Support à picots, clipsable, pour insérer les beads et les maintenir alignés.",
      f:'pop-board.webp', a:'Deux Bead Boards clipsés sur un bureau sombre, quelques beads orange posés dans un coin' },

    { i:'tweezer', n:'Pince de précision',   r:'Pour placer et corriger',
      p:"Attraper les beads pour les placer sur le Bead Board, ou corriger une erreur au milieu d'un motif serré sans tout faire tomber.",
      f:'pince.webp', a:'Une pince de précision en acier tenant un bead orange, le Bead Board derrière' },

    { i:'pen',     n:'BeadPen',              r:'Pour aller vite',
      p:"Charger plusieurs beads et les libérer un par un d'une simple pression, pour remplir les grandes zones plus rapidement.",
      f:'stylo.webp', a:'Le BeadPen, un bead orange retenu à sa pointe, le Bead Board derrière' },

    { i:'tray',    n:'Sort Box',             r:'Pour trier tes couleurs',
      p:"Une boîte à compartiments. Trier les beads par couleur est indispensable pour ne pas perdre de temps.",
      f:'boite-tri.webp', a:'La Sort Box ouverte, un compartiment par couleur de beads' },

    { i:'sorter',  n:'Sorting Tray',         r:'Pour attraper d\'un geste',
      p:"Une coupelle à lignes texturées. Tu la secoues, les beads s'alignent debout dans les rainures. Le BeadPen les attrape sans les retourner une par une.",
      f:null, a:'' },

    { i:'tape',    n:'Ruban de masquage',    r:'Pour décoller ton dessin',
      p:"Il protège le Bead Board. Applique-le sur le dessin fini, décolle tout d'un bloc, repasse hors du Bead Board. Les picots ne gondolent pas sous la chaleur.",
      f:'ruban.webp', a:'Un rouleau de ruban de masquage et une bande déroulée sur un motif de beads' },

    { i:'pierce',  n:'Perforator',           r:'Pour une fonte sans bulles',
      p:"Il perce chaque bead à travers le ruban pour laisser l'air s'échapper. La fonte est uniforme, sans bulles.",
      f:null, a:'' },

    { i:'sheets',  n:'Ironing Paper',        r:'Pour protéger le fer',
      p:"Barrière entre le fer et les beads. Rien ne fond sur la semelle.",
      f:'papier.webp', a:'Une feuille d Ironing Paper posée sur un motif de beads, le fer en arrière-plan' }
  ];

  var pick = document.querySelector('[data-selpick]'), stage = document.querySelector('[data-selstage]');
  if (pick && stage){
    var esc = function(x){ return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); };
    var showTool = function(k, animate){
      [].slice.call(pick.children).forEach(function(b, j){
        b.setAttribute('aria-selected', String(j === k));
        b.tabIndex = j === k ? 0 : -1;
      });
      var t = TOOLS[k];
      /* ⚠️ Deux outils du kit n'ont AUCUNE photo reelle (Sorting Tray, Perforator). On
         affiche un emplacement marque plutot qu'une image cassee ou, pire, un visuel
         genere qui inventerait l'objet. Le marqueur est volontairement visible : il tombe
         le jour ou la vraie photo arrive, comme les autres `.todo` de la page. */
      stage.innerHTML =
        (t.f
          ? '<img class="sel__img" src="' + window.__osAssetBase + 'os-outils-' + t.f+'" alt="'+esc(t.a)+'" loading="lazy" decoding="async">'
          : '<div class="sel__vide"><span class="todo">photo produit à fournir</span></div>') +
        '<div class="sel__scrim"></div>' +
        '<div class="sel__copy"><span class="sel__role">'+esc(t.r)+'</span><h3>'+esc(t.n)+'</h3><p>'+esc(t.p)+'</p></div>';
      if (animate && window.gsap && !reduce)
        gsap.fromTo(stage.querySelectorAll('.sel__copy > *'), { autoAlpha:0, y:14 },
          { autoAlpha:1, y:0, duration:.5, ease:'expo.out', stagger:.06, overwrite:true });
    };
    TOOLS.forEach(function(t, k){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sel__b'; b.setAttribute('role', 'tab');
      b.innerHTML = '<span class="sel__thumb">' +
        (t.f ? '<img src="' + window.__osAssetBase + 'os-outils-' + t.f+'" alt="" loading="lazy" decoding="async">'
             : '<span class="sel__thumb--vide" aria-hidden="true"></span>') +
        '</span><span>'+esc(t.n)+'</span>';
      b.addEventListener('click', function(){ showTool(k, true); });
      pick.appendChild(b);
    });
    pick.addEventListener('keydown', function(e){
      var bs = [].slice.call(pick.children), i = bs.indexOf(document.activeElement);
      if (i < 0) return;
      var step = { ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1 }[e.key];
      if (!step) return;
      e.preventDefault();
      var n = (i + step + bs.length) % bs.length;
      showTool(n, true); bs[n].focus();
    });
    showTool(0, false);
  }

  if (!window.gsap) { document.body.classList.remove('js'); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---- quinconce des trois endroits : la seule choregraphie scrollee de la page ----
     `gsap.matchMedia()` porte a la fois la condition de largeur et le respect de
     `prefers-reduced-motion` : GSAP nettoie tout seul ce qu'il a pose quand la requete
     cesse de correspondre, il n'y a rien a defaire a la main.
     Deux temps par ligne : le medaillon entre en echelle, puis le texte glisse DEPUIS
     le cote ou il se trouve — a gauche il vient de la gauche, a droite de la droite,
     donc le mouvement pousse toujours vers l'exterieur, jamais contre la lecture.
     Puis un parallaxe scrube, tres court, qui fait respirer l'image dans son cercle. */
  /* ⛔ REECRIT AVEC LA NOUVELLE FORME. L'ancienne version faisait glisser le texte depuis
     le cote ou il se trouvait — a gauche depuis la gauche, a droite depuis la droite. Ca
     n'a plus aucun sens depuis que les trois moments sont en colonnes : il n'y a plus de
     cote. Un mouvement qui decrit une mise en page disparue est pire qu'aucun mouvement.

     Ce qu'on anime maintenant, c'est l'ENCHAINEMENT, parce que c'est ce que la section
     raconte : le filet se trace du premier rond au troisieme, et les trois moments se
     posent dans son sillage. Un seul moment anime, pas trois effets disperses.
     Le filet est un `::before` : GSAP ne peut pas le cibler, c'est donc une classe posee
     par le ScrollTrigger et une transition CSS qui le deroulent. */
  gsap.matchMedia().add({
    colonnes: '(min-width: 900px)',
    sobre: '(prefers-reduced-motion: reduce)'
  }, function(ctx){
    if (ctx.conditions.sobre) return;
    var liste = document.querySelector('.wway');
    if (!liste) return;
    var moments = [].slice.call(liste.querySelectorAll('.wway__i'));
    if (!moments.length) return;

    /* ⛔ LA PHOTO EST DANS UNE CARTE EN `overflow:hidden` : on la fait DESSERRER son
       cadrage au lieu de la faire entrer. Elle demarre a 1,08 et revient a 1, donc le
       mouvement se lit a l'interieur de la carte sans jamais decouvrir un bord.
       Une entree en `scale:.8` comme sur l'ancienne version en ronds ferait apparaitre le
       fond de la carte sur les quatre cotes. */
    if (ctx.conditions.colonnes){
      gsap.timeline({ scrollTrigger:{ trigger:liste, start:'top 78%', once:true } })
        .from(moments, { autoAlpha:0, y:26, duration:.7, ease:'expo.out', stagger:.13 })
        .from(moments.map(function(m){ return m.querySelector('.wway__ph img'); }),
              { scale:1.08, duration:1.1, ease:'expo.out', stagger:.13 }, 0)
        .from(moments.map(function(m){ return m.querySelector('.wway__t').children; }),
              { autoAlpha:0, y:14, duration:.5, ease:'expo.out', stagger:.06 }, '-=.55');
      return;
    }

    /* en rail, chaque carte entre pour elle-meme : les suivantes sont hors ecran a droite
       au moment ou la premiere arrive, une sequence groupee se jouerait dans le vide. */
    moments.forEach(function(m){
      gsap.timeline({ scrollTrigger:{ trigger:m, start:'top 88%', once:true } })
        .from(m, { autoAlpha:0, y:20, duration:.6, ease:'expo.out' })
        .from(m.querySelector('.wway__ph img'), { scale:1.08, duration:1, ease:'expo.out' }, 0)
        .from(m.querySelector('.wway__t').children,
              { autoAlpha:0, y:12, duration:.45, ease:'expo.out', stagger:.06 }, '-=.42');
    });
  });
  if (reduce){ document.body.classList.remove('js'); gsap.set('.rv', { clearProps:'opacity,transform' }); return; }

  /* decoupe en mots sans casser les <span> internes */
  function splitWords(el){
    var out = [];
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(n){
        if (n.nodeType === 3){
          if (!n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if (!part) return;
            if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'w'; s.textContent = part;
            frag.appendChild(s); out.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR'){ walk(n); }
      });
    })(el);
    return out;
  }

  /* ---- 1 · l'ouverture du hero : UNE sequence, pas quatre tweens voisins ----
     Le titre montait tout seul et le reste du haut de la buy box apparaissait sans
     ordre. Une seule timeline enchaine maintenant titre -> promesse -> jetons ->
     etiquette d'etape : la page s'ouvre d'un geste au lieu de scintiller par morceaux.

     Elle s'arrete NET avant les packs. Ils sont la premiere commande de la fiche et
     `autoAlpha` pose `visibility:hidden` tant que l'opacite est nulle, donc animer les
     packs, c'est retarder le premier clic possible sur le selecteur. L'ouverture
     habille le discours, jamais l'interface d'achat.
     L'image n'est pas touchee non plus : c'est le LCP. */
  var h1 = document.querySelector('[data-split]');
  if (h1){
    var hw = splitWords(h1);
    gsap.set(hw, { yPercent:110, opacity:0 });
    gsap.timeline({ defaults:{ ease:'expo.out' }, delay:.1 })
      .to(hw, { yPercent:0, opacity:1, duration:.9, stagger:.07 })
      .from('.buy__sub', { autoAlpha:0, y:12, duration:.55 }, '-=.58')
      .from('.chips li', { autoAlpha:0, y:10, duration:.45, stagger:.035 }, '-=.34')
      /* `document.querySelector` et pas `.step-hd:first-of-type` : `:first-of-type`
         compte parmi les <p> freres, et le premier <p> de la buy box est `.buy__sub`.
         Le selecteur CSS ne matcherait donc rien du tout. */
      .from(document.querySelector('.buy .step-hd'), { autoAlpha:0, x:-10, duration:.45 }, '-=.2');
  }

  /* tous les titres de section : meme langue typographique, declenchee au scroll */
  [].slice.call(document.querySelectorAll('.sec .h-lg, .sec .h-xl')).forEach(function(h){
    var ws = splitWords(h);
    if (!ws.length) return;
    gsap.set(ws, { yPercent:55, opacity:0 });
    gsap.to(ws, {
      yPercent:0, opacity:1, duration:.85, ease:'expo.out', stagger:.045,
      scrollTrigger:{ trigger:h, start:'top 88%', once:true }
    });
  });

  /* surtitres et chapeaux : glissee courte, decalee du titre */
  [].slice.call(document.querySelectorAll('.hd .sur, .hd .lede')).forEach(function(el){
    gsap.from(el, { opacity:0, y:14, duration:.6, ease:'expo.out', delay:.12,
      scrollTrigger:{ trigger:el, start:'top 92%', once:true } });
  });

  /* chaque famille de layout a sa propre entree.
     `.grid4` et `.reasons` sont sortis de cette liste le 2026-08-12. `.grid4` n'a plus
     aucun balisage, il ne reste que son CSS. `.reasons`, lui, n'a que DEUX enfants — la
     piste et la barre de progression — donc ce stagger animait le conteneur des cartes
     au lieu des cartes : les quatre `.reason` n'ont jamais rien recu ici. Elles ont
     maintenant leur chorégraphie propre, plus bas. */
  [].slice.call(document.querySelectorAll('.bento')).forEach(function(g){
    gsap.from(g.children, { opacity:0, y:26, duration:.7, ease:'expo.out', stagger:.08,
      scrollTrigger:{ trigger:g, start:'top 85%', once:true } });
  });
  /* ⛔ NE PAS RAJOUTER D'ANIMATION DU DAMIER ICI. Elle existe deja, plus bas, au bloc
     « 9 · le damier : une vague en diagonale ». Elle etait ORPHELINE comme le CSS
     `.ways`, ecrite dans la meme passe et en attente de son balisage.
     Le 2026-08-15 j'en ai ajoute une deuxieme sans avoir cherche la premiere. Les deux
     etaient des `from` sur les memes tuiles : GSAP en a ecrase une en vol et a laisse
     UNE tuile a `visibility:hidden` avec `opacity:1` a cote — la photo `clic-macro` ne
     se peignait plus, uniquement en desktop, uniquement une tuile sur huit.
     C'est le piege que le skill GSAP nomme : deux `from` sur la meme propriete de la
     meme cible se marchent dessus a `immediateRender`. Le correctif n'est pas de jouer
     avec `immediateRender`, c'est de n'avoir qu'UNE animation par element. */
  [].slice.call(document.querySelectorAll('.gal')).forEach(function(g){
    gsap.from(g.children, { opacity:0, scale:.94, duration:.6, ease:'expo.out', stagger:.06, transformOrigin:'50% 100%',
      scrollTrigger:{ trigger:g, start:'top 88%', once:true } });
  });
  [].slice.call(document.querySelectorAll('.how__row > div')).forEach(function(d, i){
    gsap.from(d.querySelector('.how__d'), { opacity:0, y:30, rotateX:8, duration:.8, ease:'expo.out', delay:i*.1,
      scrollTrigger:{ trigger:d, start:'top 86%', once:true } });
  });
  [].slice.call(document.querySelectorAll('.checks li, .sel__b, .incl li')).forEach(function(el, i){
    gsap.from(el, { opacity:0, x:-14, duration:.55, ease:'expo.out',
      scrollTrigger:{ trigger:el, start:'top 94%', once:true } });
  });


  /* ---- 9 · le damier : une vague en diagonale -------------------------------
     `stagger:{grid:'auto'}` fait deduire la grille par GSAP a partir des boites reelles.
     La vague suit donc le damier a deux colonnes comme a quatre SANS que le palier de
     900 px soit reecrit ici : c'est le layout qui parle, pas une constante dupliquee
     qui se desynchroniserait a la premiere refonte de la section.
     `from:'start'` part du coin haut-gauche, dans le sens de lecture. */
  var damier = document.querySelector('.ways');
  /* ⛔ PAS D'ENTREE DU DAMIER EN MODE ONGLETS (mobile). Elle anime les HUIT tuiles avec
     `autoAlpha`, or en onglets six d'entre elles sont en `display:none` et deux seulement
     sont a l'ecran. Resultat mesure : les deux tuiles actives restaient a `opacity:0` et
     `visibility:hidden`, panneau vide sous une nav parfaitement fonctionnelle.
     Deux tweens sur les memes cibles, le meme piege que la duplication d'animation deja
     payee sur ce composant. En onglets, c'est `montre()` qui fait la revelation. */
  if (damier && !window.matchMedia('(max-width:899px)').matches){
    var tuiles = [].slice.call(damier.children);
    gsap.timeline({ defaults:{ ease:'expo.out' },
      scrollTrigger:{ trigger:damier, start:'top 84%', once:true } })
      .from(tuiles, { autoAlpha:0, scale:.94, y:20, duration:.7,
        stagger:{ grid:'auto', from:'start', amount:.5 } })
      .from(damier.querySelectorAll('.ways__c .ico'),
        { autoAlpha:0, scale:.4, duration:.45, stagger:.07 }, '-=.34');
  }

  /* Le compteur de designs n'est plus anime. Il l'etait a une epoque ou le chiffre etait
     decoratif ; il reflete maintenant les choix reels du visiteur, et l'animation le
     remettait a zero en ecrasant la valeur publiee par la grille. */

  /* La timeline des lignes de rappel `[data-leaders]` a ete retiree le 2026-08-12 : son
     SVG avait disparu du hero avec le passage a la photo studio, elle ne pilotait plus
     rien depuis. Le tween `.hero .rv` est parti pour la meme raison — le hero ne porte
     aucun element `.rv`, ni sur la photo ni dans la buy box. */

  ScrollTrigger.batch('.rv', { start:'top 90%', once:true,
    onEnter:function(b){ gsap.to(b,{opacity:1,y:0,duration:.65,ease:'expo.out',stagger:.06,overwrite:true}); } });

  /* `[data-progress]` et non `[data-rail]` : les deux existaient sous le meme nom, la
     barre fixe en haut de page ET le rail des raisons. Ce tween les prenait donc tous
     les deux et scalait aussi le conteneur des cartes. Sans effet visible, parce qu'il
     l'animait de 1 vers 1 — mais le jour ou on aurait voulu une vraie valeur de depart,
     la section 7 se serait ecrasee au scroll. Deux roles, deux noms. */
  gsap.to('[data-progress]', { scaleX:1, ease:'none',
    scrollTrigger:{ trigger:document.body, start:'top top', end:'bottom bottom', scrub:.3 } });

  var mq = document.querySelector('[data-mq]');
  if (mq) gsap.to(mq, { xPercent:-33.333, duration:26, ease:'none', repeat:-1 });

  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();


;

/* ==================================================================================
   REFONTE v5 — LES MODULES NEUFS (2026-08-14)
   ==================================================================================
   ⛔ RIEN ICI NE TOUCHE AU CONFIGURATEUR. Aucun `[data-d*]`, aucun `.buy`, aucun `.pack`,
   aucun `.recap`, aucun `.sticky`. Si un selecteur d'ici commence par l'un d'eux, c'est
   un bug, pas un raccourci.

   GSAP, ScrollTrigger et Flip sont deja charges et enregistres par le script principal.
   `registerPlugin` est idempotent : on le redit pour que ce bloc reste deplacable seul.
   ================================================================================== */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GOK = !!window.gsap;
  var STOK = GOK && !!window.ScrollTrigger;
  if (STOK) gsap.registerPlugin(ScrollTrigger);

  /* ================================================================================
     1 · §3 — LE MODULE DE POSE DE BEADS
     ================================================================================
     Le visiteur passe la souris, les beads se posent. Les cases vides montrent DEJA leur
     couleur en pale : c'est le modele imprime, donc poser une mauvaise couleur est
     impossible. L'argument « tout est deja indique » est VECU, pas lu.

     ⛔ IL NE REVENDIQUE AUCUN COMPTE PRODUIT. Sa grille de demo fait 794 beads ; la §5
     vend le modele reel de 1 808. Le bandeau `.bd__tag` le nomme comme une demonstration,
     et son compteur mesure la progression du VISITEUR, pas un produit. Ne jamais reformuler
     son libelle en « ce design demande N beads » : c'est le piege de chiffre du HANDOFF.

     Rendu : deux surfaces. `buf` garde tout ce qui est POSE et n'est redessine qu'a
     l'ajout ; `ctx` recopie ce tampon puis peint les seuls beads en vol. Le cout par image
     est donc constant, qu'il y ait 10 beads a l'ecran ou 800. 235 fps mesures.
     QA : node liquid-builder/lib/test-proto-beads.mjs 8971 */
  (function moduleBeads(){
    var root = document.querySelector('[data-bd]');
    if (!root) return;
    var cv = root.querySelector('[data-bd-cv]');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var elN = root.querySelector('[data-bd-n]'), elBar = root.querySelector('[data-bd-bar]');
    var elHint = root.querySelector('[data-bd-hint]'), elFin = root.querySelector('[data-bd-fin]');
    var elRaz = root.querySelector('[data-bd-raz]'), elPal = root.querySelector('[data-bd-pal]');
    var elSay = root.querySelector('[data-bd-say]');
    var elSayT = root.querySelector('[data-bd-say-t]'), elSayP = root.querySelector('[data-bd-say-p]');
    var elDone = root.querySelector('[data-bd-done]');

    /* ---- le geste depend de l'appareil ------------------------------------------
       Un pointeur grossier (doigt) n'a pas de souris : « passe la souris » y est
       simplement faux. On lit le POINTEUR, pas la largeur d'ecran — une tablette large se
       manipule au doigt, un petit portable a une souris. */
    var doigt = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (doigt){
      /* Seule l'invite du plateau nomme le geste, donc elle seule s'echange. Le titre
         est identique sur les deux appareils : c'est ce qui lui evite de mentir a l'un
         des deux. */
      var elInvite = root.querySelector('[data-bd-invite]');
      if (elInvite) elInvite.textContent = 'Glisse ton doigt ici.';
    }

    var G = null, cell = 12, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pose = null, vol = [], nPose = 0, fini = false;
    var buf = document.createElement('canvas'), bctx = buf.getContext('2d');

    /* Le module ne commente pas ce qu'il fait, il dit ce que la visiteuse est en train de
       COMPRENDRE. C'est la difference entre une legende et un argument. */
    var PALIERS = [
      /* ⛔ CHAQUE PALIER FAIT UN SEUL TRAVAIL, ET ILS S'ENCHAINENT COMME UN ARGUMENT :
         rien a decider -> impossible de se tromper -> le dessin arrive -> tu veux continuer.
         Reecrits le 2026-08-15 : l'operateur trouvait les premiers faibles, et ils
         l'etaient pour deux raisons precises.
           · « Tout est deja indique » DECRIVAIT L'INTERFACE. Un palier ne commente pas
             l'ecran, il dit ce que la visiteuse vient de COMPRENDRE en agissant.
           · « Tu n'as rien choisi » sonnait comme un reproche, alors que c'est la bonne
             nouvelle de la section. Retourne au positif : la couleur est venue toute seule.
         ⚠️ Ne pas les rallonger. Ils se lisent d'un coup d'œil pendant que la main
         travaille : au-dela de deux lignes, personne ne les lit. */
      /* ⛔⛔ REECRITS LE 2026-08-15 SUR LE PRINCIPE 1 DU CERVEAU (07-Cerveau/principes.md) :
         « parler au Systeme 1, jamais au Systeme 2 ». Ce que ce principe impose ici :
         DU CONCRET PLUTOT QUE DE L'ABSTRAIT, et « facile a comprendre = percu comme vrai ;
         ce qui est confus est percu comme risque ».
         L'operateur a rejete « c'est la couleur de la case qui se pose » : une couleur ne
         se pose pas, il faut se representer une abstraction pour suivre la phrase. Six
         mots qui demandent un effort, sur le seul module ou la visiteuse AGIT.
         > LE TEST A PASSER AVANT D'ECRIRE UN PALIER : est-ce qu'un enfant suivrait ?
         > Si la phrase demande de se representer autre chose qu'un objet ou un geste,
         > elle est a refaire. Un sujet qui agit, un verbe qu'on peut mimer, rien d'autre.
         ⚠️ « trame » est parti pour la meme raison : c'est du vocabulaire de metier. */
      /* ⛔⛔ CES CINQ PALIERS NE DECRIVENT PLUS LE LOGICIEL, ILS DECRIVENT LE GESTE REEL.
         C'est la correction la plus lourde de la journee sur ce module, et elle vient d'un
         reproche de l'operateur : mes paliers racontaient ce que fait le PROGRAMME (« va
         ou tu veux, a chaque fois c'est le bon bead qui arrive »). C'est vrai a l'ecran
         parce qu'un script choisit la couleur ; en vrai, on prend une perle dans un bac,
         on la choisit, on la pose sur un picot. Le geste n'a rien a voir.
         > LA REGLE QUI EN SORT : ce module est une demonstration du PRODUIT, pas de
         > l'interface. Une phrase qui ne serait vraie que grace au code est a jeter.

         ⛔ « IMPOSSIBLE DE SE TROMPER » A ETE RETIRE, et ce n'est pas un choix de style.
         C'etait peut-etre FAUX : a l'ecran le script empeche l'erreur, mais devant un vrai
         Bead Board rien n'empeche de prendre la mauvaise perle. Le principe 5 du cerveau
         dit « on ne pousse jamais ce qui est faux ». On ne vend donc plus l'impossibilite
         de l'erreur, on vend sa REVERSIBILITE — ce qui est vrai, verifiable, et deja
         affirme a deux endroits de la page (carte objection et FAQ).

         ⚠️ « les cases pales » est parti : c'etait un mot invente pour decrire un rendu
         d'ecran. Le vocabulaire installe par la §3 est « case », « picot », « modele ».
         Quatre de ces cinq lignes viennent du copy deja arbitre par l'operateur ailleurs
         sur la page. Aucune n'a besoin d'etre sourcee, parce qu'aucune n'invente. */
      { a:0,   t:'Chaque case a sa couleur', p:'Elle est déjà sur ton modèle, du premier bead au dernier.' },
      { a:1,   t:'Tu n’as rien à inventer',  p:'Tu suis les couleurs et tu poses tes beads un par un.' },
      { a:60,  t:'Rien n’est définitif',     p:'Tant que tu n’as pas passé le fer, tu retires un bead et tu le remets ailleurs.' },
      { a:220, t:'Le dessin apparaît',       p:'Tu le reconnais bien avant de l’avoir fini.' },
      { a:520, t:'Encore une rangée',        p:'Tu te le diras souvent. C’est comme ça que la soirée passe.' }
    ];
    var palier = -1;
    function dire(cle, t, p){
      if (cle === palier) return;
      palier = cle;
      if (!GOK || reduce){ elSayT.textContent = t; elSayP.textContent = p; return; }
      gsap.timeline()
        .to(elSay, { autoAlpha:0, x:-6, duration:.14, ease:'power2.in' })
        /* ⛔ CE GARDE EST LA RAISON POUR LAQUELLE LA FIN NE SE FAIT PLUS RECOUVRIR.
           `killTweensOf(elSay)` dans `fin()` ne suffisait PAS, et le test l'a montre : il
           tue les tweens de l'element, mais un `.add()` n'est pas un tween — c'est un
           callback de la timeline, et il se declenche quand meme, 140 ms plus tard, avec
           l'ancien texte. La grille etait a 794/794, le CTA du pic ouvert, et le module
           disait encore « Il ne t'en reste plus beaucoup ».
           On garde donc la SOURCE de l'ecriture, pas seulement l'animation. */
        .add(function(){
          if (fini && cle !== 'fin') return;
          elSayT.textContent = t; elSayP.textContent = p;
        })
        .to(elSay, { autoAlpha:1, x:0, duration:.26, ease:'power2.out' });
    }
    function majCopy(){
      /* ⚠️ `fin()` a deja pose le dernier message. Sans ce garde, le palier « Encore une
         rangee » (le plus haut de la liste) le recouvrait aussitot, et le parcours se
         terminait sur une relance au lieu de la fierte. Bug trouve par la sonde, pas a l'œil. */
      if (fini) return;
      if (aide){
        return dire('aide', 'Il ne t’en reste plus beaucoup',
          'Les cases entourées d’orange sont celles qui te manquent. Passe dessus, on te les montre.');
      }
      var k = 0;
      for (var i = 0; i < PALIERS.length; i++) if (nPose >= PALIERS[i].a) k = i;
      dire(k, PALIERS[k].t, PALIERS[k].p);
    }

    function fin(){
      if (fini) return;
      fini = true; aide = false;
      if (elFin) elFin.hidden = true;
      palier = 'fin';
      /* ⛔ LE BUG QUE CE `killTweensOf` CORRIGE, ET POURQUOI IL EST DIFFICILE A VOIR.
         `dire()` ne remplace pas le texte tout de suite : il le fait DANS un `.add()`, au
         milieu d'une timeline de 400 ms. Quand la derniere case tombait pendant que le
         palier « Il ne t'en reste plus beaucoup » etait encore en vol, ce callback
         s'executait APRES `fin()` et recouvrait la fierte par le message de guidage : la
         creation etait finie a 794/794, le CTA du pic etait la, et le module disait encore
         « il ne t'en reste plus beaucoup ».
         Le garde `if (fini) return` de `majCopy()` ne suffit pas : il bloque les appels
         SUIVANTS, pas la timeline DEJA lancee. On la tue, et on remet le bloc a l'endroit —
         elle pouvait l'avoir laisse a `autoAlpha:0`. */
      if (GOK){ gsap.killTweensOf(elSay); gsap.set(elSay, { autoAlpha:1, x:0 }); }
      elSayT.textContent = 'Et c’est toi qui les as posés';
      /* ⚠️ PAS DE « doigts » ICI : cette phrase decrit ce que la visiteuse vient de faire
         A L'ECRAN, et a l'ecran c'est une souris une fois sur deux. Meme defaut que
         « Ca, c'etait avec une souris », deja corrige une fois. Le `.bd__done`, lui, a le
         droit de parler de doigts : il decrit le VRAI kit, pas le geste sur la page. */
      elSayP.textContent = G.total + ' beads, ' + G.palette.length + ' couleurs. Le modèle t’a guidé, mais c’est toi qui les as posés un par un.';
      /* ---- LE PIC D'EXPERIENCE ----------------------------------------------------
         C'est ICI, et nulle part ailleurs, que le CTA a le plus de valeur : la visiteuse
         vient de vivre le produit, elle n'a plus rien a comprendre, et l'ecart entre ce
         qu'elle vient de faire a la souris et ce qu'elle ferait avec ses mains est a son
         maximum. Le proposer avant, c'est vendre a quelqu'un qui n'a pas encore ressenti. */
      if (!elDone) return;
      elDone.hidden = false;
      if (!GOK || reduce) return;
      gsap.timeline()
        .fromTo(root.querySelector('.bd__board'), { scale:1 }, { scale:1.012, duration:.16, yoyo:true, repeat:1, ease:'power2.inOut' })
        .fromTo(elDone, { autoAlpha:0, y:14 }, { autoAlpha:1, y:0, duration:.45, ease:'power3.out' }, '-=.1');
    }

    function bead(c, x, y, r, alpha){
      /* ⚠️ La courbe back.out vaut EXACTEMENT 0 a p=0, et l'arrondi flottant la fait
         passer a -6,5e-16 : `arc()` leve alors un IndexSizeError et le rendu s'ARRETE.
         Un rayon se borne toujours, meme quand la formule « ne peut pas » etre negative. */
      if (!(r > 0)) return;
      var cx = x * cell + cell / 2, cy = y * cell + cell / 2;
      var a = alpha === undefined ? 1 : alpha;
      c.globalAlpha = a;
      c.fillStyle = G.palette[G.cells[y * G.l + x]];
      c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
      /* ---- MAT, PAS BRILLANT -----------------------------------------------------
         Verifie sur `video-references/` : les beads reels sont en plastique MAT, souvent
         un peu translucides sur les tons clairs, et n'ont AUCUN point speculaire. La
         premiere version posait un disque blanc a 50 % en haut a gauche : ca donnait une
         bille de verre, pas un bead. Le relief vient de deux arcs tres discrets. */
      c.lineWidth = r * 0.22;
      c.globalAlpha = a * 0.16; c.strokeStyle = '#fff';
      c.beginPath(); c.arc(cx, cy, r * 0.88, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.globalAlpha = a * 0.20; c.strokeStyle = '#000';
      c.beginPath(); c.arc(cx, cy, r * 0.88, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
      // le trou central : c'est ce qui fait lire « bead » et pas « pastille »
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'destination-out';
      c.beginPath(); c.arc(cx, cy, r * 0.3, 0, 6.2832); c.fill();
      c.globalCompositeOperation = 'source-over';
    }

    function fondModele(){
      // chaque case pleine montre sa couleur en TRES pale, comme le modele imprime.
      // C'est LA preuve visuelle de « tout est deja indique ».
      bctx.clearRect(0, 0, buf.width, buf.height);
      bctx.save(); bctx.scale(dpr, dpr);
      for (var y = 0; y < G.h; y++) for (var x = 0; x < G.l; x++){
        var v = G.cells[y * G.l + x]; if (v < 0) continue;
        bctx.globalAlpha = .17;
        bctx.fillStyle = G.palette[v];
        bctx.beginPath();
        bctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.29, 0, 6.2832);
        bctx.fill();
      }
      bctx.globalAlpha = 1; bctx.restore();
    }
    function poserDansBuf(x, y){
      bctx.save(); bctx.scale(dpr, dpr); bead(bctx, x, y, cell * 0.42); bctx.restore();
    }

    /* ---- le guidage de fin -------------------------------------------------------
       Passe un certain remplissage, les cases qui manquent sont dispersees et deviennent
       penibles a trouver : on abandonne a 95 %, donc juste avant le seul moment qui nous
       interesse. On les entoure d'un halo qui bat. */
    var aide = false, restants = [];
    function majRestants(){
      restants.length = 0;
      for (var y = 0; y < G.h; y++) for (var x = 0; x < G.l; x++){
        var i = y * G.l + x;
        if (G.cells[i] >= 0 && !pose[i]) restants.push({ x:x, y:y });
      }
    }

    var raf = null;
    function peindre(t){
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(buf, 0, 0);
      ctx.save(); ctx.scale(dpr, dpr);
      for (var i = vol.length - 1; i >= 0; i--){
        var b = vol[i], p = (t - b.t0) / 240;
        if (p >= 1){ poserDansBuf(b.x, b.y); vol.splice(i, 1); continue; }
        // back.out : le bead depasse sa taille puis se pose. C'est le « clic ».
        var e = 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
        bead(ctx, b.x, b.y, cell * 0.42 * e, Math.min(1, p * 3));
      }
      if (aide && !fini && restants.length){
        // en mode sobre le halo ne bat pas, il reste pose : le guidage est une
        // INFORMATION, pas une decoration, il doit survivre a prefers-reduced-motion.
        var puls = reduce ? .5 : .5 + .5 * Math.sin(t / 260);
        ctx.strokeStyle = '#FF5C1A';
        ctx.lineWidth = Math.max(1.1, cell * 0.10);
        ctx.globalAlpha = .3 + .55 * puls;
        for (var k = 0; k < restants.length; k++){
          var c = restants[k];
          ctx.beginPath();
          ctx.arc(c.x * cell + cell / 2, c.y * cell + cell / 2, cell * (0.32 + 0.13 * puls), 0, 6.2832);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
    function boucle(){
      peindre(performance.now());
      if (vol.length || (aide && !fini && !reduce)) raf = requestAnimationFrame(boucle);
      else { raf = null; peindre(performance.now()); }
    }

    function poser(x, y){
      if (x < 0 || y < 0 || x >= G.l || y >= G.h) return;
      var i = y * G.l + x;
      if (G.cells[i] < 0 || pose[i]) return;
      pose[i] = 1; nPose++;
      if (reduce || !GOK) poserDansBuf(x, y);
      else { vol.push({ x:x, y:y, t0:performance.now() }); if (!raf) raf = requestAnimationFrame(boucle); }
      maj();
      if (reduce || !GOK) peindre(0);
    }

    var cible = { v:0 };
    function maj(){
      if (elHint && elHint.style.display !== 'none' && nPose > 0) elHint.style.display = 'none';
      var part = nPose / G.total;
      if (!GOK || reduce){
        elN.textContent = nPose;
        elBar.style.transform = 'scaleX(' + part + ')';
      } else {
        gsap.to(cible, { v:nPose, duration:.4, ease:'power2.out', overwrite:true,
          onUpdate:function(){ elN.textContent = Math.round(cible.v); } });
        gsap.to(elBar, { scaleX:part, duration:.4, ease:'power2.out', overwrite:true });
      }
      if (elFin && nPose >= 100 && !fini) elFin.hidden = false;
      // le guidage s'arme dans le dernier sixieme, ou plus tot si tres peu de cases restent
      var reste = G.total - nPose;
      var seuil = Math.max(40, Math.round(G.total * 0.16));
      var doit = !fini && reste > 0 && reste <= seuil;
      if (doit){
        majRestants(); aide = true;
        if (!raf && !reduce && GOK) raf = requestAnimationFrame(boucle);
        if (reduce || !GOK) peindre(0);
      } else if (aide && !doit){
        aide = false;
        if (reduce || !GOK) peindre(0);
      }
      if (nPose >= G.total) fin();
      majCopy();
    }

    /* ---- le pointeur --------------------------------------------------------------
       On INTERPOLE entre deux echantillons : un mouvement rapide saute plusieurs cases,
       et sans ca la trainee sort en pointilles. */
    var dernier = null;
    function cellDe(ev){
      var r = cv.getBoundingClientRect();
      var s = G.l * cell / r.width;   // px CSS -> px de grille
      return { x: Math.floor((ev.clientX - r.left) * s / cell),
               y: Math.floor((ev.clientY - r.top) * s / cell) };
    }
    function trace(ev){
      if (fini || !G) return;
      var c = cellDe(ev);
      if (dernier){
        var dx = c.x - dernier.x, dy = c.y - dernier.y;
        var n = Math.max(Math.abs(dx), Math.abs(dy));
        for (var k = 1; k <= n; k++) poser(Math.round(dernier.x + dx * k / n), Math.round(dernier.y + dy * k / n));
      }
      poser(c.x, c.y);
      dernier = c;
    }
    cv.addEventListener('pointermove', trace);
    cv.addEventListener('pointerdown', function(e){
      // `setPointerCapture` : sans lui, un glissement au doigt qui sort du canvas perd
      // les evenements et la trainee se coupe net.
      try { cv.setPointerCapture(e.pointerId); } catch(_){}
      dernier = null; trace(e);
    });
    cv.addEventListener('pointerleave', function(){ dernier = null; });

    if (elFin) elFin.addEventListener('click', function(){
      // vague diagonale : le reste se remplit dans l'ordre ou une main le ferait
      var reste = [];
      for (var y = 0; y < G.h; y++) for (var x = 0; x < G.l; x++){
        var i = y * G.l + x; if (G.cells[i] >= 0 && !pose[i]) reste.push({ x:x, y:y, d:x + y });
      }
      reste.sort(function(a, b){ return a.d - b.d; });
      if (reduce || !GOK){ reste.forEach(function(c){ poser(c.x, c.y); }); return; }
      var pas = Math.max(1, Math.round(reste.length / 60)), k = 0;
      (function vague(){
        for (var j = 0; j < pas && k < reste.length; j++, k++) poser(reste[k].x, reste[k].y);
        if (k < reste.length) requestAnimationFrame(vague);
      })();
    });

    if (elRaz) elRaz.addEventListener('click', function(){
      pose = new Uint8Array(G.l * G.h); nPose = 0; fini = false; vol.length = 0;
      palier = -1; cible.v = 0;
      if (elFin) elFin.hidden = true;
      aide = false; restants.length = 0;
      if (elDone){ elDone.hidden = true; if (GOK) gsap.set(elDone, { clearProps:'all' }); }
      if (elHint) elHint.style.display = '';
      fondModele(); peindre(0); maj();
    });

    function dimensionne(){
      if (!G) return;
      /* ⚠️ Se caler sur la seule LARGEUR faisait deborder la grille sous la ligne de
         flottaison : on ne voyait jamais la creation entiere, donc le module perdait son
         unique argument. La case est bornee par la largeur ET par la hauteur d'ecran. */
      var dispoL = cv.parentElement.clientWidth - 26;
      /* En desktop la colonne est large et c'est la HAUTEUR qui borne : on lui laisse plus
         d'air, sinon la grille reste petite au milieu d'une colonne vide. En mobile la
         largeur borne, et 0,56 garde la grille entiere au-dessus de la ligne de flottaison.
         Se caler sur la seule largeur faisait deborder la grille sous le pli : on ne voyait
         jamais la creation entiere, donc le module perdait son unique argument. */
      var large = window.innerWidth >= 960;
      var dispoH = Math.max(240, window.innerHeight * (large ? 0.68 : 0.56));
      /* ⚠️ PAS de `Math.floor` sur la case. A 375 px, `floor(251/42)` donne 5 et la grille
         sort a 210 px : 41 px de largeur disponible jetes, soit 16 % de bead en moins sur
         l'ecran ou il est deja le plus petit. Le canvas est mis a l'echelle du dpr, une
         case fractionnaire ne coute donc aucune nettete. */
      cell = Math.max(4, Math.min(dispoL / G.l, dispoH / G.h));
      var w = G.l * cell, h = G.h * cell;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      cv.width = buf.width = Math.round(w * dpr);
      cv.height = buf.height = Math.round(h * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0); bctx.setTransform(1, 0, 0, 1, 0, 0);
      fondModele();
      // on rejoue les beads deja poses dans le nouveau tampon
      bctx.save(); bctx.scale(dpr, dpr);
      for (var y = 0; y < G.h; y++) for (var x = 0; x < G.l; x++) if (pose[y * G.l + x]) bead(bctx, x, y, cell * 0.42);
      bctx.restore();
      peindre(performance.now());
    }

    fetch(window.__osAssetBase + 'os-proto-grille-renard.json').then(function(r){ return r.json(); }).then(function(g){
      G = g;
      pose = new Uint8Array(G.l * G.h);
      var tot = root.querySelector('[data-bd-tot]');
      if (tot) tot.textContent = G.total;
      if (elPal) elPal.innerHTML = G.palette.map(function(c, i){
        return '<b><i style="background:' + c + '"></i>' + G.compte[i] + '</b>';
      }).join('');
      dimensionne();
      window.addEventListener('resize', dimensionne);
      // ScrollTrigger doit recalculer : le canvas vient de prendre sa hauteur reelle
      if (STOK) ScrollTrigger.refresh();
      window.__bdPret = true;
    }).catch(function(){
      // le module ne peut pas se charger : on le retire plutot que de laisser un cadre vide
      root.hidden = true;
    });
  })();

  /* ================================================================================
     2 · §5 — LA REPARTITION DES BEADS
     ================================================================================
     Les barres partent de zero et les nombres montent, une seule fois, a l'entree dans
     l'ecran. L'ordre compte : les segments d'abord, les pistes ensuite, et les nombres
     en meme temps que leur piste — c'est ce qui fait que l'œil arrive sur « rose vif : 1 »
     apres avoir vu sa barre ne pas exister.
     ⚠️ Le HTML porte DEJA les vrais nombres. Le JS ne les remet a zero que s'il va
     reellement les animer : sans script, la section affiche des donnees justes. */
  (function repartition(){
    var cnt = document.querySelector('[data-cnt]');
    if (!cnt) return;
    var tot = cnt.querySelector('[data-cnt-tot]');
    var vals = [].slice.call(cnt.querySelectorAll('.cnt__ext .cnt__v'));
    var lignes = [].slice.call(cnt.querySelectorAll('.cnt__ext li'));
    if (!GOK || reduce || !STOK) return;   // l'etat final est deja a l'ecran, on ne fait rien

    /* ⛔ L'ORDRE PORTE L'ARGUMENT, ce n'est pas une chorégraphie décorative.
       Le total monte d'abord : c'est la reponse a la question du surtitre. Puis les deux
       extremes se posent, le plus GRAND avant le plus PETIT — l'œil arrive sur « 10 »
       apres avoir vu « 577 », donc il mesure l'ecart au lieu de lire deux nombres.
       C'est le meme principe que l'ancienne version, qui faisait arriver « rose vif : 1 »
       apres avoir vu sa barre ne pas exister. La forme a change, le sens tenu est le meme.
       ⚠️ Le HTML porte DEJA les vrais nombres. On ne les remet a zero que si on va
       reellement les animer : sans script, la section affiche des donnees justes. */
    var chiffre = function(el, cible, retard){
      var o = { v:0 };
      el.textContent = '0';
      gsap.to(o, { v:cible, duration:.9, ease:'power2.out', delay:retard,
        onUpdate:function(){ el.textContent = Math.round(o.v).toLocaleString('fr-FR'); },
        onComplete:function(){ el.textContent = cible.toLocaleString('fr-FR'); } });
    };

    ScrollTrigger.create({
      trigger: cnt, start: 'top 78%', once: true,
      onEnter: function(){
        if (tot) chiffre(tot, +tot.getAttribute('data-cnt-tot'), 0);
        gsap.from(lignes, { opacity:0, x:-14, duration:.6, ease:'expo.out',
          stagger:.12, delay:.45 });
        vals.forEach(function(el, i){ chiffre(el, +el.getAttribute('data-cnt-v'), .5 + i * .12); });
      }
    });
  })();

  /* ================================================================================
     3 · « COMMENT CHOISIR ? » — L'AIDE AU CHOIX DU PACK
     ================================================================================
     ⛔ ELLE NE SELECTIONNE RIEN ELLE-MEME. Cliquer une colonne rejoue un clic sur la vraie
     vignette `.pack` de la buy box : c'est le configurateur GELE qui fait le travail, avec
     sa logique de quota et son recalcul de prix. Dupliquer cette logique ici, c'est se
     garantir deux verites qui divergent au premier changement de tarif.
     `showModal()` donne le piege de focus, Echap et le fond inerte sans une ligne de JS. */
  (function aideAuChoix(){
    var dlg = document.querySelector('[data-pk]');
    var ouvre = document.querySelector('[data-pk-open]');
    if (!dlg || !ouvre) return;

    var montrer = function(){
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      if (GOK && !reduce)
        gsap.fromTo(dlg.querySelector('.pk__in'), { autoAlpha:0, y:12 },
          { autoAlpha:1, y:0, duration:.28, ease:'power3.out' });
    };
    var fermer = function(){ if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); };

    ouvre.addEventListener('click', montrer);
    dlg.addEventListener('click', function(e){
      // le fond : `<dialog>` fait du backdrop une partie du dialogue lui-meme, donc un
      // clic dessus a `e.target === dlg`. C'est le seul moyen de distinguer les deux.
      if (e.target === dlg || e.target.closest('[data-pk-close]')) fermer();
    });

    [].slice.call(dlg.querySelectorAll('[data-pk-pick]')).forEach(function(b){
      b.addEventListener('click', function(){
        var cible = document.querySelector('.pack[data-pack="' + b.dataset.pkPick + '"]');
        if (cible) cible.click();
        fermer();
        /* on ramene la buy box a l'ecran : la modale se ferme sur un choix fait, et la
           cliente doit VOIR que sa vignette est bien passee en selectionnee, sinon elle ne
           sait pas si son clic a servi. */
        var buy = document.querySelector('.buy');
        if (buy) buy.scrollIntoView({ block:'nearest', behavior: reduce ? 'auto' : 'smooth' });
      });
    });

    /* l'etat courant se lit sur le configurateur, il n'est pas stocke ici : la modale
       reflete la buy box, elle ne tient pas sa propre verite. */
    dlg.addEventListener('toggle', function(){
      if (!dlg.open) return;
      var actif = document.querySelector('.pack[aria-checked="true"]');
      var n = actif ? actif.dataset.pack : null;
      [].slice.call(dlg.querySelectorAll('[data-pk-pick]')).forEach(function(b){
        b.setAttribute('aria-current', String(b.dataset.pkPick === n));
      });
    });
  })();

  /* ================================================================================
     4 · §11 — LES OBJECTIONS
     ================================================================================
     `<details>` natif ne s'anime pas : a l'ouverture le panneau apparait d'un bloc et le
     reste de la page saute. On intercepte le clic, on interpole la hauteur, PUIS on
     bascule l'etat. En mode sobre ou sans GSAP, on ne fait rien du tout : le comportement
     natif est deja correct et accessible.
     ⚠️ `paddingBottom` est anime AVEC la hauteur. Sans ca, a `height:0` le padding du bas
     reste peint et le panneau ferme garde une bande de 19 px. */
  (function objections(){
    var root = document.querySelector('[data-obj]');
    if (!root || !GOK || reduce) return;
    [].slice.call(root.querySelectorAll('.obj__d')).forEach(function(d){
      var corps = d.querySelector('.obj__a'), som = d.querySelector('summary');
      if (!corps || !som) return;
      som.addEventListener('click', function(e){
        e.preventDefault();
        if (gsap.isTweening(corps)) return;
        if (d.open){
          gsap.to(corps, { height:0, paddingBottom:0, autoAlpha:0, duration:.24, ease:'power2.in',
            onComplete:function(){
              d.open = false;
              gsap.set(corps, { clearProps:'height,paddingBottom,opacity,visibility' });
            } });
        } else {
          d.open = true;
          gsap.fromTo(corps, { height:0, paddingBottom:0, autoAlpha:0 },
            { height:'auto', paddingBottom:'', autoAlpha:1, duration:.32, ease:'power2.out',
              clearProps:'height,paddingBottom' });
        }
      });
    });
  })();
})();


/* ================================================================================
   AJOUT AU PANIER — le seul morceau qui n'existait pas dans la maquette.
   ================================================================================
   ⚠️ CONTRAT REPRIS DU COMPOSEUR «bp-kit-composer« DEJA EN PRODUCTION :
     · une seule requete, le pack en variante avec ses designs en propriete de ligne ;
     · les designs EN PLUS partent en lignes distinctes, factures a l'unite ;
     · redirection vers le panier a la reussite.
   Ne pas inventer un second contrat : deux facons d'ecrire la meme commande, c'est deux
   verites qui divergent au premier remboursement. */
(function panier(){
  var btns = [].slice.call(document.querySelectorAll('[data-buy]'));
  if (!btns.length) return;
  var base = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  /* ⛔ CE BLOC EST CONCATENE EN FIN DE FICHIER, HORS DES IIFE DE LA PAGE. Le «DESIGNS«
     du configurateur y est invisible (ReferenceError paye a l'ecran le 2026-08-16 :
     l'ajout panier mourait en silence). On relit donc le MEME noeud JSON — une seule
     source de verite, deux lecteurs. */
  var DESIGNS = (function(){
    var n = document.getElementById('os-sk-designs');
    if (!n) return [];
    try { return JSON.parse(n.textContent) || []; } catch (e) { return []; }
  })();

  btns.forEach(function(btn){
    btn.addEventListener('click', function(){
      /* la selection incomplete est deja geree ailleurs : ce gestionnaire-la ouvre le
         catalogue et ne doit pas declencher d'ajout. */
      if (btn.getAttribute('aria-disabled') === 'true') return;

      var pack = document.querySelector('.pack[aria-checked="true"]');
      if (!pack || !pack.dataset.variant) return;

      /* ⛔ ON LIT L'ETAT DU CONFIGURATEUR, PAS LE DOM. Les vignettes du recapitulatif ne
         portent ni titre ni variante — verifie. Ce qui fait foi, c'est «ordre« : les
         index choisis, dans l'ordre, et le quota du pack. Au-dela du quota, ce sont les
         designs EN PLUS, factures a l'unite. */
      var sel = (window.__osSelection && window.__osSelection()) || { ordre: [], quota: 0 };
      var inclus = sel.ordre.slice(0, sel.quota)
        .map(function(i){ return DESIGNS[i] && DESIGNS[i].t; }).filter(Boolean);
      var extras = sel.ordre.slice(sel.quota)
        .map(function(i){ return DESIGNS[i] && DESIGNS[i].v; }).filter(Boolean);

      var items = [{ id: Number(pack.dataset.variant), quantity: 1,
                     properties: { 'Dessins inclus': inclus.join(', ') } }];
      extras.forEach(function(v){ items.push({ id: Number(v), quantity: 1 }); });

      var libelle = btn.innerHTML;
      btn.setAttribute('aria-busy', 'true');
      fetch(base + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items: items })
      }).then(function(r){
        if (r.ok) { window.location.href = base + 'cart'; return; }
        return r.json().catch(function(){ return null; }).then(function(p){
          throw new Error((p && p.description) || ('HTTP ' + r.status));
        });
      }).catch(function(e){
        btn.removeAttribute('aria-busy');
        btn.innerHTML = libelle;
        var h = document.querySelector('[data-cta-hint]');
        if (h){ h.hidden = false; h.textContent = 'Ajout impossible : ' + e.message; }
      });
    });
  });
})();
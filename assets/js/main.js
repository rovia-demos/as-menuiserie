(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Hauteur d'écran : recalculée seulement si la largeur change (rotation), jamais au défilement
  var lastW = innerWidth;
  addEventListener('resize', function () {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    document.documentElement.style.setProperty('--vh', innerHeight / 100 + 'px');
  });

  // Ouverture de la baie vitrée du haut de page
  var hero = $('.hero');
  var heroImg = $('.hero__media img');
  var openHero = function () { hero.classList.add('is-ready'); };
  if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', openHero); heroImg.addEventListener('error', openHero); }
  setTimeout(openHero, heroImg && heroImg.complete ? 60 : 2500); // la baie s'ouvre même si la photo tarde

  // En-tête transparent tant qu'on est en haut de la photo
  var header = $('.header');
  var topWatch = document.createElement('div');
  topWatch.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:90px;pointer-events:none';
  hero.appendChild(topWatch);
  new IntersectionObserver(function (en) { header.classList.toggle('is-top', en[0].isIntersecting); }).observe(topWatch);

  // Menu mobile
  var burger = $('.burger'), nav = $('#menu');
  var setMenu = function (open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Compteurs
  var countUp = function (el) {
    var to = +el.dataset.to, t0 = null;
    if (!document.documentElement.classList.contains('motion')) return;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1100, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  };

  // Apparitions au défilement
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('.count', en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal').forEach(function (el, i) {
    // léger décalage entre cartes voisines
    var sib = el.parentElement ? $$(':scope > .reveal', el.parentElement).indexOf(el) : 0;
    el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
    io.observe(el);
  });

  // Choix rapide du projet depuis le haut de page
  var select = $('#f-projet');
  $$('[data-projet]').forEach(function (a) {
    a.addEventListener('click', function () { select.value = a.dataset.projet; });
  });

  // Avant / après
  var stage = $('.ba__stage'), range = $('.ba__range');
  var after = $('.ba__after'), before = $('.ba__before img');
  var pairs = {
    fenetre: ['Avant : vieille fenêtre en bois abîmée avec persiennes écaillées', 'Après : fenêtre PVC blanche neuve avec volet roulant intégré'],
    volet: ['Avant : volet roulant arraché par la tempête, lames tordues', 'Après : volet roulant alu anthracite neuf'],
    pergola: ['Avant : terrasse vide en plein soleil', 'Après : pergola bioclimatique alu anthracite motorisée'],
    garage: ['Avant : vieille porte de garage basculante rouillée', 'Après : porte de garage sectionnelle anthracite']
  };
  range.addEventListener('input', function () { stage.style.setProperty('--pos', range.value + '%'); });
  var tabs = $$('.ba__tabs [role="tab"]');
  var setPair = function (btn) {
    var k = btn.dataset.ba, src = function (v, w) { return 'assets/img/ap-' + k + '-' + v + '-' + w + '.webp'; };
    tabs.forEach(function (t) { var on = t === btn; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    before.srcset = src('avant', 800) + ' 800w, ' + src('avant', 1600) + ' 1600w';
    before.src = src('avant', 1600);
    before.alt = pairs[k][0];
    after.srcset = src('apres', 800) + ' 800w, ' + src('apres', 1600) + ' 1600w';
    after.src = src('apres', 1600);
    after.alt = pairs[k][1];
    range.value = 50; stage.style.setProperty('--pos', '50%');
    stage.classList.remove('is-swap'); void stage.offsetWidth; stage.classList.add('is-swap');
  };
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { setPair(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus(); setPair(n);
    });
  });
  // petit glissement d'invitation la première fois que le curseur apparaît
  if (document.documentElement.classList.contains('motion')) {
    var hint = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      hint.disconnect();
      var t0 = null;
      var anim = function (t) {
        if (!t0) t0 = t;
        var p = (t - t0) / 1600;
        if (p >= 1 || range.matches(':active')) return stage.style.setProperty('--pos', range.value + '%');
        stage.style.setProperty('--pos', (50 + Math.sin(p * Math.PI * 2) * 14) + '%');
        requestAnimationFrame(anim);
      };
      setTimeout(function () { requestAnimationFrame(anim); }, 500);
    }, { threshold: 0.6 });
    hint.observe(stage);
  }

  // Galerie filtrable (12 photos au départ, le reste sur demande)
  var items = $$('#galerie li'), more = $('#voir-plus'), expanded = false, filter = 'tout';
  var applyFilter = function (pop) {
    items.forEach(function (li, i) {
      var show = (filter === 'tout' && (expanded || i < 12)) || li.dataset.c === filter;
      if (show && li.hidden && pop) { li.classList.remove('is-pop'); void li.offsetWidth; li.classList.add('is-pop'); }
      li.hidden = !show;
    });
    more.parentElement.hidden = filter !== 'tout' || expanded;
  };
  applyFilter(false);
  more.addEventListener('click', function () { expanded = true; applyFilter(true); $('button', items[12]).focus(); });
  $$('.filters button').forEach(function (b, _, all) {
    b.addEventListener('click', function () {
      all.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      filter = b.dataset.f;
      items.forEach(function (li) { li.hidden = true; });
      applyFilter(true);
    });
  });

  // Visionneuse
  var lb = $('#lightbox'), lbImg = $('img', lb), cur = 0;
  var visible = function () { return items.filter(function (li) { return !li.hidden; }); };
  var show = function (i) {
    var v = visible(); cur = (i + v.length) % v.length;
    var b = $('button', v[cur]), im = $('img', b);
    lbImg.src = b.dataset.big; lbImg.alt = im.alt;
  };
  items.forEach(function (li) {
    $('button', li).addEventListener('click', function () {
      show(visible().indexOf(li));
      lb.showModal();
    });
  });
  $('.lightbox__close', lb).addEventListener('click', function () { lb.close(); });
  $('.lightbox__prev', lb).addEventListener('click', function () { show(cur - 1); });
  $('.lightbox__next', lb).addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });

  // Carrousel d'avis
  var track = $('#avis-liste');
  $$('.reviews__nav [data-dir]').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = $('.review', track);
      track.scrollBy({ left: +b.dataset.dir * (card.offsetWidth + 16), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  });

  // Ouvert maintenant ? (heure de Perpignan)
  try {
    var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var day = get('weekday').replace('.', ''), h = +get('hour') + get('minute') / 60;
    var close = { lun: 18, mar: 18, mer: 18, jeu: 18, ven: 17 }[day];
    var now = $('#ouvert');
    var open = close && h >= 8 && h < close;
    now.textContent = open ? 'Ouvert en ce moment · jusqu\'à ' + close + 'h' : 'Fermé en ce moment · laissez-nous un message';
    now.classList.toggle('is-closed', !open);
    now.hidden = false;
  } catch (e) { /* horaires statiques suffisent */ }

  // Photo jointe : afficher le nom du fichier
  var file = $('#f-photo'), fileTxt = $('.file__txt');
  file.addEventListener('change', function () {
    fileTxt.textContent = file.files.length ? file.files[0].name : 'Ajouter une photo de l\'existant';
  });

  // Formulaire de démonstration : confirmation sans envoi
  var form = $('#form-devis'), err = $('#form-err'), ok = $('#form-ok');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = $$('[required]', form).filter(function (f) { return !f.checkValidity(); });
    $$('.is-bad', form).forEach(function (f) { f.classList.remove('is-bad'); f.removeAttribute('aria-invalid'); });
    if (bad.length) {
      bad.forEach(function (f) { f.classList.add('is-bad'); f.setAttribute('aria-invalid', 'true'); });
      err.hidden = false;
      bad[0].focus();
      return;
    }
    err.hidden = true;
    form.hidden = true;
    ok.hidden = false;
    ok.focus();
  });
  $$('input, select, textarea', form).forEach(function (f) {
    f.addEventListener('input', function () { if (f.checkValidity()) { f.classList.remove('is-bad'); f.removeAttribute('aria-invalid'); } });
  });

  var y = $('#annee'); if (y) y.textContent = new Date().getFullYear();
  window.ASM_READY = true;
})();

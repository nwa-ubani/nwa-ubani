/* Styles by Ceeee — site interactions */

(function () {

  // ── Nav scroll ──────────────────────────────
  var nav = document.getElementById('nav');
  function tickScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', tickScroll, { passive: true });
  tickScroll();


  // ── Hamburger / mobile menu ─────────────────
  var hamburger  = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  var menuClose  = document.getElementById('menuClose');

  function openMenu() {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
    menuClose.focus();
  }
  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);
  document.querySelectorAll('.mobile-link').forEach(function (l) {
    l.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });


  // ── Smooth-scroll internal anchors ──────────
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });


  // ── Gallery filter ──────────────────────────
  var filterBtns = document.querySelectorAll('.filter-btn');
  var galleryCards = document.querySelectorAll('.gcard');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = this.dataset.filter;

      // Update active button
      filterBtns.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      // Show/hide cards with a fade
      galleryCards.forEach(function (card) {
        var cat = card.dataset.cat;
        if (filter === 'all' || cat === filter) {
          card.classList.remove('hidden');
          card.style.animation = 'filterFadeIn 0.4s ease forwards';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });


  // ── Scroll reveal ───────────────────────────
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }


  // ── Marquee: duplicate content for seamless loop ──
  var track = document.querySelector('.marquee__track');
  if (track) track.innerHTML += track.innerHTML;

})();

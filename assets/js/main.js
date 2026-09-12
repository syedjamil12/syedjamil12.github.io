// EssentialTechGB Ltd — shared site behaviour

document.addEventListener('DOMContentLoaded', function () {

  /* Dynamic copyright year (footer) */
  var copyYearEls = document.querySelectorAll('.copy-year');
  if (copyYearEls.length) {
    var thisYear = new Date().getFullYear();
    var yearLabel = thisYear + ' / ' + String(thisYear + 1).slice(-2);
    copyYearEls.forEach(function (el) { el.textContent = yearLabel; });
  }

  /* Resilient image loading — some local dev servers (e.g. IIS Express without a
     .webp MIME map) serve image files with the wrong Content-Type, which makes
     the browser refuse to paint them even though the file itself is fine. On
     error, re-fetch the raw bytes and hand them to the <img> as a blob URL so
     rendering no longer depends on the server's declared content type. */
  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function onImgError() {
      img.removeEventListener('error', onImgError);
      var url = img.getAttribute('src');
      if (!url) return;
      fetch(url, { cache: 'reload' })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.blob(); })
        .then(function (blob) { img.src = URL.createObjectURL(blob); })
        .catch(function (err) { console.warn('Image failed to load even after retry:', url, err); });
    }, { once: true });
  });

  /* Hex teaser video play buttons (no native controls — they get clipped by the hex shape) */
  document.querySelectorAll('.hex-video').forEach(function (video) {
    var play = video.closest('.corner-frame') ? video.closest('.corner-frame').querySelector('.play') : null;
    if (!play) return;
    play.addEventListener('click', function () {
      video.play();
      play.classList.add('hidden');
    });
    video.addEventListener('click', function () {
      if (video.paused) { video.play(); play.classList.add('hidden'); }
      else { video.pause(); play.classList.remove('hidden'); }
    });
  });

  /* Sticky header solidify */
  var header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('solid', window.scrollY > 10);
    });
  }

  /* Mobile nav toggle */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () { nav.classList.toggle('open'); });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') nav.classList.remove('open');
    });
  }

  /* Reveal on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: .14 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* Skill bar animation (why-choose-us cards) */
  var skillcard = document.getElementById('skillcard');
  if (skillcard) {
    var so = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { skillcard.classList.add('in'); obs.disconnect(); }
      });
    }, { threshold: .4 });
    so.observe(skillcard);
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (o) { o.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* Product filter tabs (products.html) */
  var ftBtns = document.querySelectorAll('.ft-btn');
  var pcards = document.querySelectorAll('.pcard');
  if (ftBtns.length && pcards.length) {
    ftBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        ftBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.getAttribute('data-filter');
        pcards.forEach(function (card) {
          var show = cat === 'all' || card.getAttribute('data-cat') === cat;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* Review filter buttons (reviews.html) */
  var rfBtns = document.querySelectorAll('.rf-btn');
  var revCards = document.querySelectorAll('.review');
  if (rfBtns.length && revCards.length) {
    rfBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        rfBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.getAttribute('data-filter');
        revCards.forEach(function (card) {
          var show = cat === 'all' || card.getAttribute('data-cat') === cat;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* Contact page: enquiry type toggle (General vs Bulk Order / Quotation) */
  var enqTabs = document.querySelectorAll('.enq-tab');
  var panels = document.querySelectorAll('.form-panel');
  function activatePanel(type) {
    enqTabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-panel') === type); });
    panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === type); });
  }
  if (enqTabs.length) {
    enqTabs.forEach(function (tab) {
      tab.addEventListener('click', function () { activatePanel(tab.getAttribute('data-panel')); });
    });
    // auto-select "quote" tab if linked via ?type=quote
    var params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'quote') activatePanel('quote');
  }

  /* Contact / quotation forms — submit via FormSubmit.co AJAX endpoint (no custom backend needed).
     NOTE: the first submission to a new email address triggers a one-time confirmation
     email from FormSubmit — that link must be clicked once before mail delivery works. */
  document.querySelectorAll('.js-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var card = form.closest('.form-card');
      var success = card ? card.querySelector('.form-success') : null;
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending…'; }

      fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Network response was not ok');
          form.style.display = 'none';
          var toggle = card ? card.querySelector('.enq-toggle') : null;
          if (toggle) toggle.style.display = 'none';
          if (success) success.classList.add('show');
        })
        .catch(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
          alert('Sorry, something went wrong sending your message. Please email sales@essentialtechgb.co.uk directly.');
        });
    });
  });

});

/* ============================================================
   INSOMNIA — Bar & Night Club · interactions & motion
   GSAP 3 + ScrollTrigger + Lenis
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof gsap !== "undefined";

  /* ---------- Lenis smooth scrolling ---------- */
  var lenis = null;
  if (!reduceMotion && typeof Lenis !== "undefined") {
    // native CSS smooth-scroll must be off while Lenis drives the scroll,
    // otherwise every Lenis frame gets re-smoothed by the browser (lag)
    document.documentElement.style.scrollBehavior = "auto";
    lenis = new Lenis({ duration: 0.8, wheelMultiplier: 1.5, smoothWheel: true });
    if (hasGSAP) {
      lenis.on("scroll", function () {
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.update();
      });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }

  /* ---------- anchor navigation (works with/without Lenis) ---------- */
  function scrollToTarget(hash) {
    var el = document.querySelector(hash);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: hash === "#home" ? -200 : -60 });
    else el.scrollIntoView({ behavior: "smooth" });
  }

  document.querySelectorAll("[data-nav]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var hash = link.getAttribute("href");
      if (hash && hash.charAt(0) === "#") {
        e.preventDefault();
        closeMenu();
        scrollToTarget(hash);
      }
    });
  });

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector(".nav__burger");
  var mmenu = document.querySelector(".mmenu");

  function closeMenu() {
    burger.classList.remove("is-open");
    mmenu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    mmenu.setAttribute("aria-hidden", "true");
  }

  burger.addEventListener("click", function () {
    var open = burger.classList.toggle("is-open");
    mmenu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    mmenu.setAttribute("aria-hidden", String(!open));
  });

  /* ---------- active nav link on scroll ---------- */
  var sections = [
    { id: "#home", el: document.querySelector(".hero") },
    { id: "#events", el: document.querySelector(".parties") },
    { id: "#about", el: document.querySelector(".about") },
    { id: "#gallery", el: document.querySelector(".gallery") },
    { id: "#contact", el: document.querySelector(".footer") }
  ];
  var navLinks = document.querySelectorAll(".nav__link");

  function setActive(hash) {
    navLinks.forEach(function (l) {
      l.classList.toggle("is-active", l.getAttribute("href") === hash);
    });
  }

  window.addEventListener("scroll", throttle(function () {
    var y = window.scrollY + window.innerHeight * 0.4;
    var current = "#home";
    sections.forEach(function (s) {
      if (s.el && s.el.offsetTop <= y) current = s.id;
    });
    setActive(current);
  }, 150), { passive: true });

  function throttle(fn, wait) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= wait) { last = now; fn(); }
    };
  }

  /* ============================================================
     MARQUEES — seamless infinite loops (rAF based)
     ============================================================ */
  function makeMarquee(track, speed, pauseOnHover) {
    if (!track) return null;
    var x = 0;
    var paused = false;
    var half = 0;
    var state = { setSpeed: function (v) { speed = v; }, nudge: function (dx) { x += dx; } };

    // duplicate content once so the loop is seamless
    var originalCount = track.children.length;
    track.innerHTML += track.innerHTML;

    function measure() {
      // exact distance between the two copies (accounts for flex gaps/margins)
      var first = track.children[0];
      var twin = track.children[originalCount];
      half = twin && first ? twin.offsetLeft - first.offsetLeft : track.scrollWidth / 2;
    }

    // wait for images to load before measuring
    window.addEventListener("load", measure);
    measure();

    // layout is viewport-relative — stale loop distance causes visible jumps
    var resizeTid;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTid);
      resizeTid = setTimeout(measure, 150);
    });

    if (pauseOnHover) {
      track.parentElement.addEventListener("mouseenter", function () { paused = true; });
      track.parentElement.addEventListener("mouseleave", function () { paused = false; });
    }

    // don't burn frames while the strip is out of the viewport
    var offscreen = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        offscreen = !entries[0].isIntersecting;
      }).observe(track.parentElement);
    }

    var lastT = performance.now();
    function tick(t) {
      var dt = (t - lastT) / 1000;
      lastT = t;
      if (offscreen) { requestAnimationFrame(tick); return; }
      if (!paused && !reduceMotion) x -= speed * dt;
      if (half > 0) {
        // wrap into [-half, 0)
        x = ((x % half) + half) % half - half;
      }
      track.style.transform = "translate3d(" + x + "px,0,0)";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    state.pause = function (v) { paused = v; };
    return state;
  }

  // glitch-text strip
  makeMarquee(document.querySelector("[data-marquee]"), 150, false);

  // services carousel — slower, draggable, pause on hover
  var servTrack = document.querySelector("[data-serv-track]");
  // fast drift; still pauses on hover & supports drag
  var serv = makeMarquee(servTrack, 100, true);

  // drag support for the services strip
  (function enableDrag() {
    var wrap = document.querySelector("[data-serv]");
    if (!wrap || !serv) return;
    var dragging = false, lastX = 0;

    wrap.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX;
      serv.pause(true);
      wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      serv.nudge(e.clientX - lastX);
      lastX = e.clientX;
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
      wrap.addEventListener(ev, function () {
        if (!dragging) return;
        dragging = false;
        serv.pause(false);
      });
    });
  })();

  /* ============================================================
     GSAP MOTION
     ============================================================ */
  if (!hasGSAP || reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- intro: nav + hero ---------- */
  var intro = gsap.timeline({ defaults: { ease: "power3.out" } });

  intro.from(".nav", { yPercent: -100, opacity: 0, duration: .9 });

  intro.from(".hero__img", {
    clipPath: "inset(0 0 100% 0)",
    duration: 1.15,
    stagger: .14,
    ease: "power4.inOut"
  }, "-=.35");

  intro.from(".hero__glass", { opacity: 0, y: 60, duration: .9 }, "-=.4");

  // glitch-style flicker on the title
  intro.fromTo(".hero__title img",
    { opacity: 0 },
    {
      opacity: 1,
      duration: .7,
      ease: "steps(9)",
      onComplete: startGlitchLoop
    }, "-=.3");

  intro.from(".hero__line", { scaleX: 0, transformOrigin: "center", duration: .8, ease: "power2.inOut" }, "-=.2");
  intro.from(".hero__sub", { opacity: 0, letterSpacing: "1.2em", duration: 1.1 }, "-=.55");

  // slow Ken Burns drift on hero photos — paused whenever the hero is
  // scrolled out of view so three large layers aren't composited for nothing
  var kenBurns = gsap.to(".hero__img img", {
    scale: 1.08,
    duration: 14,
    ease: "none",
    yoyo: true,
    repeat: -1,
    stagger: 2
  });
  ScrollTrigger.create({
    trigger: ".hero",
    start: "top bottom",
    end: "bottom top",
    onLeave: function () { kenBurns.pause(); },
    onEnterBack: function () { kenBurns.resume(); }
  });

  // subtle occasional glitch jitter on the hero title
  function startGlitchLoop() {
    var title = document.querySelector(".hero__title img");
    if (!title) return;
    (function glitch() {
      var delay = 2.5 + Math.random() * 4;
      gsap.delayedCall(delay, function () {
        var tl = gsap.timeline({ onComplete: glitch });
        tl.to(title, { x: -4, skewX: 8, opacity: .65, duration: .05 })
          .to(title, { x: 4, skewX: -6, opacity: 1, duration: .05 })
          .to(title, { x: 0, skewX: 0, duration: .06 });
      });
    })();
  }

  /* ---------- scroll reveals ---------- */
  gsap.utils.toArray("[data-reveal]").forEach(function (el, i) {
    gsap.from(el, {
      opacity: 0,
      y: 46,
      duration: .9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none"
      }
    });
  });

  // party cards stagger in
  // whole card (image + yellow bar together) fades/rises in — one tween per
  // card so the bar can never desync from its card the way a separate
  // per-bar tween did
  gsap.from("[data-card]", {
    opacity: 0,
    y: 70,
    duration: .85,
    stagger: .12,
    ease: "power3.out",
    clearProps: "transform,opacity",
    scrollTrigger: { trigger: ".parties__cards", start: "top 85%" }
  });

  // gallery tiles pop in
  gsap.from("[data-gal]", {
    opacity: 0,
    scale: .88,
    duration: .7,
    stagger: { each: .08, grid: "auto", from: "start" },
    ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".gal", start: "top 85%" }
  });

  // CTA background parallax — gentle zoom so the exact crop never
  // reveals an edge
  gsap.fromTo(".cta__bg img",
    { scale: 1.18, transformOrigin: "center center" },
    {
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".cta",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onEnter: function () { gsap.set(".cta__bg img", { willChange: "transform" }); },
        onLeave: function () { gsap.set(".cta__bg img", { willChange: "auto" }); },
        onEnterBack: function () { gsap.set(".cta__bg img", { willChange: "transform" }); },
        onLeaveBack: function () { gsap.set(".cta__bg img", { willChange: "auto" }); }
      }
    });

  // CTA title tracking-in
  gsap.from(".cta__title", {
    letterSpacing: ".45em",
    opacity: 0,
    duration: 1.1,
    ease: "power2.out",
    scrollTrigger: { trigger: ".cta", start: "top 75%" }
  });

  // footer wordmark rises as you reach the end
  gsap.from("[data-wordmark]", {
    yPercent: 60,
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".footer__wordmark",
      start: "top bottom",
      end: "top 55%",
      scrub: .6,
      onEnter: function () { gsap.set("[data-wordmark]", { willChange: "transform" }); },
      onLeave: function () { gsap.set("[data-wordmark]", { willChange: "auto" }); },
      onEnterBack: function () { gsap.set("[data-wordmark]", { willChange: "transform" }); },
      onLeaveBack: function () { gsap.set("[data-wordmark]", { willChange: "auto" }); }
    }
  });

  ScrollTrigger.refresh();
})();
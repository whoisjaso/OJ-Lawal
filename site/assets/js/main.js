/* Law Firm of O. J. Lawal & Associates. Behaviour layer.
   No dependencies; Lenis smooth scroll is used when its CDN script loads. */
(() => {
  "use strict";

  const doc = document.documentElement;
  const body = document.body;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
  };
  const systemReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reduce = () => systemReduce || doc.classList.contains("reduce-motion");
  if (store.get("ojl-reduce") === "on") doc.classList.add("reduce-motion");
  doc.classList.add("js");

  const FIRM = {
    name: "Law Firm of O. J. Lawal & Associates",
    phone: "+17137730600",
    phoneText: "(713) 773-0600",
    address: "11711 Bedford Street, Unit 1, Houston, TX 77031",
    maps: "https://maps.google.com/?q=11711+Bedford+St+Unit+1+Houston+TX+77031",
    email: "", // set the firm's intake address here to enable email from the contact form
  };

  /* ---------------------------------------------------------------- Smooth scroll */
  let lenis = null;
  const subs = [];
  const onScroll = (fn) => subs.push(fn);
  const emit = () => { const y = scrollY; subs.forEach((fn) => fn(y)); };
  let rafId = 0;
  function startLenis() {
    if (lenis || reduce() || !window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, syncTouch: true, syncTouchLerp: 0.085, touchInertiaMultiplier: 28 });
    lenis.on("scroll", emit);
    const raf = (t) => { lenis.raf(t); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
  }
  function stopLenis() { if (!lenis) return; cancelAnimationFrame(rafId); lenis.destroy(); lenis = null; }
  addEventListener("scroll", () => { if (!lenis) emit(); }, { passive: true });
  const lock = (on) => { body.classList.toggle("is-locked", on); lenis && (on ? lenis.stop() : lenis.start()); };
  const scrollToEl = (el, offset = 0) => {
    const y = el.getBoundingClientRect().top + scrollY + offset;
    lenis ? lenis.scrollTo(y, { duration: 1.3 }) : scrollTo({ top: y, behavior: reduce() ? "auto" : "smooth" });
  };

  /* ---------------------------------------------------------------- Toasts */
  function toast(msg, icon = "check-circle") {
    let host = $(".toasts");
    if (!host) { host = document.createElement("div"); host.className = "toasts"; host.setAttribute("role", "status"); host.setAttribute("aria-live", "polite"); body.append(host); }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<i class="ph ph-${icon}" aria-hidden="true"></i><span></span>`;
    $("span", t).textContent = msg;
    host.append(t);
    while (host.children.length > 3) host.firstElementChild.remove();
    setTimeout(() => { t.classList.add("is-leaving"); t.addEventListener("animationend", () => t.remove(), { once: true }); }, 3400);
  }

  /* ---------------------------------------------------------------- Loader */
  function initLoader() {
    const loader = $(".loader");
    const done = () => body.classList.add("is-loaded");
    if (!loader) return done();
    const first = !store.sget("ojl-visited");
    store.sset("ojl-visited", "1");
    if (!first || reduce()) loader.classList.add("loader--quick");
    const min = reduce() ? 0 : first ? 1400 : 450;
    const t0 = performance.now();
    const finish = () => setTimeout(done, Math.max(0, min - (performance.now() - t0)));
    document.readyState === "complete" ? finish() : addEventListener("load", finish, { once: true });
    setTimeout(done, 4000);
  }

  /* ---------------------------------------------------------------- Header and menu */
  function initHeader() {
    const header = $(".header");
    if (!header) return;
    const hero = $(".stack, .phero");
    let last = 0;
    onScroll((y) => {
      const past = hero ? y > hero.offsetTop + hero.offsetHeight - 90 : y > 24;
      header.classList.toggle("is-solid", past || !hero);
      if (!body.classList.contains("is-menu-open")) header.classList.toggle("is-hidden", past && y > last + 2 && y > 600);
      if (y < last - 2) header.classList.remove("is-hidden");
      last = y;
      body.classList.toggle("is-scrolled", y > (hero ? hero.offsetHeight * 0.55 : 320));
    });
    const consult = $("#consult");
    if (consult && "IntersectionObserver" in window) {
      new IntersectionObserver((es) => es.forEach((e) => body.classList.toggle("is-at-consult", e.isIntersecting)), { rootMargin: "-20% 0px -20% 0px" }).observe(consult);
    }
    $$("[data-reduce]").forEach((b) => {
      const sync = () => b.setAttribute("aria-pressed", String(doc.classList.contains("reduce-motion")));
      sync();
      b.addEventListener("click", () => {
        const on = !doc.classList.contains("reduce-motion");
        doc.classList.toggle("reduce-motion", on); store.set("ojl-reduce", on ? "on" : "off");
        on ? stopLenis() : startLenis(); sync();
      });
    });
  }

  function initPanel() {
    const panel = $(".panel"), scrim = $(".scrim");
    if (!panel) return;
    panel.inert = true;
    let opener = null;
    const set = (open) => {
      body.classList.toggle("is-menu-open", open);
      panel.inert = !open; panel.setAttribute("aria-hidden", String(!open));
      $$("[data-menu-open]").forEach((b) => b.setAttribute("aria-expanded", String(open)));
      lock(open);
      if (open) setTimeout(() => { const f = $("[data-menu-close]", panel); f && f.focus({ preventScroll: true }); }, 80);
      else opener && opener.focus({ preventScroll: true });
    };
    $$("[data-menu-open]").forEach((b) => b.addEventListener("click", () => { opener = b; set(true); }));
    $$("[data-menu-close]").forEach((b) => b.addEventListener("click", () => set(false)));
    scrim && scrim.addEventListener("click", () => set(false));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("is-menu-open")) set(false); });
  }

  /* ---------------------------------------------------------------- Stacked hero */
  function initStack() {
    const stack = $(".stack");
    if (!stack) return;
    const slides = $$(".slide", stack);
    const dots = $$(".dot-hit", stack);
    dots.forEach((d, i) => d.addEventListener("click", () => scrollToEl(slides[i])));
    const update = () => {
      const vh = innerHeight;
      let active = 0;
      slides.forEach((s, i) => {
        const next = slides[i + 1];
        const media = $(".slide__media", s), shade = $(".slide__shade", s);
        let p = 0;
        if (next) p = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / vh));
        if (!reduce()) {
          media.style.transform = `scale(${(1 - p * 0.06).toFixed(4)}) translate3d(0, ${(-p * 4).toFixed(2)}%, 0)`;
          shade.style.opacity = (p * 0.55).toFixed(3);
        }
        if (s.getBoundingClientRect().top <= vh * 0.5) active = i;
      });
      dots.forEach((d, i) => { d.classList.toggle("is-active", i === active); d.setAttribute("aria-current", i === active ? "true" : "false"); });
    };
    onScroll(update); addEventListener("resize", update); update();
  }

  function initReveals() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduce()) { els.forEach((e) => e.classList.add("is-in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
    els.forEach((e) => io.observe(e));
  }
  function initParallax() {
    const els = $$("[data-parallax]");
    if (!els.length) return;
    const update = () => {
      if (reduce()) return;
      const vh = innerHeight;
      els.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.style.transform = `translate3d(0, ${(((r.top + r.height / 2 - vh / 2) / vh) * -6).toFixed(2)}%, 0)`;
      });
    };
    onScroll(update); update();
  }

  /* ---------------------------------------------------------------- Office hours, Houston time */
  const TZ = "America/Chicago";
  const houstonNow = () => {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23" })
      .formatToParts(new Date()).reduce((o, x) => ((o[x.type] = x.value), o), {});
    return new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute));
  };
  const OPEN_H = 9, CLOSE_H = 17;
  const isWeekday = (d) => d.getUTCDay() >= 1 && d.getUTCDay() <= 5;
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function officeState(now) {
    const h = now.getUTCHours() + now.getUTCMinutes() / 60;
    if (isWeekday(now) && h >= OPEN_H && h < CLOSE_H) return { open: true, label: "Open now", when: "until 5 PM today", short: "Until 5 PM" };
    let d = new Date(now.getTime());
    if (!(isWeekday(now) && h < OPEN_H)) { do { d = new Date(d.getTime() + 864e5); } while (!isWeekday(d)); }
    const sameDay = d.getUTCDate() === now.getUTCDate() && d.getUTCMonth() === now.getUTCMonth();
    const tomorrow = new Date(now.getTime() + 864e5).getUTCDate() === d.getUTCDate() && new Date(now.getTime() + 864e5).getUTCMonth() === d.getUTCMonth();
    const day = sameDay ? "today" : tomorrow ? "tomorrow" : DAYS[d.getUTCDay()];
    return { open: false, label: "Office closed", when: `opens ${day} at 9 AM`, short: `Opens ${day}, 9 AM` };
  }
  function initClock() {
    $$("[data-year]").forEach((n) => (n.textContent = new Date().getFullYear()));
    const tick = () => {
      const st = officeState(houstonNow());
      $$("[data-open]").forEach((el) => {
        const lab = $("[data-open-label]", el), when = $("[data-open-when]", el);
        const short = el.hasAttribute("data-short");
        if (lab) lab.textContent = short ? (st.open ? "Open now" : "Closed") : st.label;
        if (when) when.textContent = short ? st.short : st.when;
      });
      body.classList.toggle("is-open-now", st.open);
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------------------------------------------------------------- Book a consultation: two steps */
  const MATTERS = {
    immigration: { name: "Immigration", tip: "Bring any letter or notice you received, with the envelope, and your passport or prior USCIS papers." },
    family: { name: "Divorce or custody", tip: "Bring your marriage certificate and any court papers already issued." },
    criminal: { name: "A criminal charge", tip: "Bring the charge paperwork and your next court date. Do not discuss the facts with anyone else." },
    business: { name: "My business", tip: "Bring the full contract, lease or formation papers, not a photo of one page." },
    estate: { name: "A will or probate", tip: "Bring the will if there is one, and a list of property and accounts." },
    injury: { name: "An injury", tip: "Bring the report number, photos and any letter from an insurer. Sign nothing from them first." },
    tax: { name: "A tax letter", tip: "Bring every page of the IRS or state notice. The date on page one matters." },
    other: { name: "Not sure", tip: "Bring whatever paper started this. We will know which kind of matter it is." },
  };
  function initBooking() {
    const form = $("[data-book]");
    if (!form) return;
    const want = new URLSearchParams(location.search).get("m");
    if (want && MATTERS[want]) { const r = $(`input[name="matter"][value="${want}"]`, form); if (r) r.checked = true; }
    const tip = $("[data-tip] span", form);
    const sync = () => { const m = MATTERS[new FormData(form).get("matter")] || MATTERS.other; if (tip) tip.textContent = m.tip; };
    form.addEventListener("change", sync); sync();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const m = MATTERS[d.get("matter")] || MATTERS.other;
      const text = ["Consultation request", `Name: ${d.get("name")}`, `Phone: ${d.get("phone")}`, `About: ${m.name}`].join("\n");
      if (FIRM.email) {
        location.href = `mailto:${FIRM.email}?subject=${encodeURIComponent(`Consultation request: ${m.name}`)}&body=${encodeURIComponent(text)}`;
        toast("Opening your email app with the request ready", "envelope-simple");
        return;
      }
      const done = $("[data-book-done]");
      navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {});
      if (done) { done.hidden = false; form.hidden = true; scrollToEl(done, -96); }
    });
  }

  function initAnchors() {
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const el = a.getAttribute("href").length > 1 && $(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault(); scrollToEl(el, -72);
    }));
  }

  function boot() {
    startLenis();
    initLoader();
    initHeader();
    initPanel();
    initStack();
    initReveals();
    initParallax();
    initClock();
    initBooking();
    initAnchors();
    emit();
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();

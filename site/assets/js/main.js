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
    address: "8700 Commerce Park Drive, Suite 202, Houston, TX 77036",
    maps: "https://maps.google.com/?q=8700+Commerce+Park+Drive+Suite+202+Houston+TX+77036",
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
    });
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
    if (isWeekday(now) && h >= OPEN_H && h < CLOSE_H) return { open: true, label: "Open now", when: "until 5 pm today", short: "Until 5 pm today" };
    let d = new Date(now.getTime());
    if (!(isWeekday(now) && h < OPEN_H)) { do { d = new Date(d.getTime() + 864e5); } while (!isWeekday(d)); }
    const sameDay = d.getUTCDate() === now.getUTCDate() && d.getUTCMonth() === now.getUTCMonth();
    const tomorrow = new Date(now.getTime() + 864e5).getUTCDate() === d.getUTCDate() && new Date(now.getTime() + 864e5).getUTCMonth() === d.getUTCMonth();
    const day = sameDay ? "today" : tomorrow ? "tomorrow" : DAYS[d.getUTCDay()];
    return { open: false, label: "Office closed", when: `opens ${day} at 9 am`, short: `Opens ${day}, 9 am` };
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

  /* ---------------------------------------------------------------- Prepare your call */
  function initPlanner() {
    const form = $("[data-planner]"), card = $("[data-plancard]");
    if (!form || !card) return;
    const MATTERS = {
      immigration: { name: "Immigration", bring: ["Any letter or notice you received, with its envelope", "Passport, visa, I-94 and any prior USCIS receipts or approvals", "Dates you entered and left the United States", "Marriage, birth or divorce records that connect you to a petitioner"], note: "If you have a hearing or response date, say it first. Deadlines shape everything else." },
      family: { name: "Family law", bring: ["Marriage certificate and the date you separated", "Children's names and birth dates", "Any court papers or orders already issued", "A list of property, debts and accounts as best you know them"], note: "If anyone's safety is at risk, say so at the start of the call." },
      criminal: { name: "Criminal defense", bring: ["The charge, the court and the next court date", "Bond papers and any paperwork from the arrest", "Names of any witnesses", "Your immigration status, because a plea can affect it"], note: "Do not discuss the facts with anyone but your lawyer. Not police, not friends, not online." },
      business: { name: "Business law", bring: ["The contract, lease or formation papers in question", "Who the other parties are", "What you want the outcome to be", "Any deadlines in the documents"], note: "Bring the full document, not a screenshot of one page." },
      estate: { name: "Probate and estate planning", bring: ["The will, if there is one, and the date of death if someone has passed", "A list of assets, accounts and property", "Names of heirs, children and anyone who may contest", "Any existing power of attorney or trust papers"], note: "Probate has filing windows. Earlier is easier." },
      injury: { name: "Personal injury", bring: ["Date, place and how the injury happened", "Police or incident report number", "Photos, medical records and bills so far", "Any letter from an insurance company"], note: "Do not sign anything from an insurer before you have spoken with a lawyer." },
      tax: { name: "Tax matters", bring: ["The IRS or state notice, every page", "The tax years involved", "Returns filed for those years", "Any payment plan or prior correspondence"], note: "IRS letters carry response dates. Note the date on the first page." },
    };
    const render = () => {
      const fd = new FormData(form);
      const m = MATTERS[fd.get("matter")] || MATTERS.immigration;
      const urgency = fd.get("urgency"), lang = fd.get("lang");
      const notes = [["folder-simple", `Bring: ${m.bring.join("; ")}.`], ["info", m.note]];
      if (urgency === "deadline") notes.unshift(["warning-circle", "You have a date on paper. Call rather than write, and say the date in your first sentence."]);
      if (urgency === "soon") notes.push(["clock", "Call during office hours and ask for the earliest available consultation."]);
      if (urgency === "planning") notes.push(["calendar-blank", "Planning ahead is the strongest position to be in. A consultation now sets the timeline."]);
      if (lang === "other") notes.push(["translate", "You are welcome to bring a family member or interpreter. We take the time to make sure you understand every step."]);
      notes.push(["map-pin", `${FIRM.address}. Office hours Monday to Friday, 9 am to 5 pm.`]);
      const summary = `Matter: ${m.name}\nTiming: ${{ deadline: "I have a deadline or court date", soon: "I need to act soon", planning: "I am planning ahead" }[urgency] || ""}\n${lang === "other" ? "I may bring an interpreter.\n" : ""}Name:\nPhone:\nBest time to call:`;
      card.classList.add("is-updating");
      setTimeout(() => {
        $("[data-p-date]", card).textContent = m.name;
        $("[data-p-time]", card).textContent = "What to have ready for your first conversation";
        $("[data-p-notes]", card).innerHTML = notes.map(([k, t]) => `<li><i class="ph ph-${k}" aria-hidden="true"></i><span>${t}</span></li>`).join("");
        card._summary = summary;
        const mail = $("[data-p-mail]", card);
        if (mail) {
          if (FIRM.email) { mail.href = `mailto:${FIRM.email}?subject=${encodeURIComponent(`Consultation request: ${m.name}`)}&body=${encodeURIComponent(summary)}`; mail.textContent = "Email this summary"; }
          else { mail.href = "#"; mail.textContent = "Copy this summary"; mail.onclick = (e) => { e.preventDefault(); navigator.clipboard && navigator.clipboard.writeText(summary).then(() => toast("Summary copied. Paste it into a text or have it ready when you call.", "clipboard-text")); }; }
        }
        card.classList.remove("is-updating");
      }, reduce() ? 0 : 180);
    };
    form.addEventListener("change", render);
    render();
  }

  /* ---------------------------------------------------------------- Forms */
  function initForms() {
    $$("form[data-intake]").forEach((f) => f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      const d = new FormData(f);
      const text = [`Name: ${d.get("name")}`, `Phone: ${d.get("phone")}`, `Matter: ${d.get("matter")}`, `Best time to call: ${d.get("time") || "any"}`, "", d.get("message") || ""].join("\n");
      if (FIRM.email) {
        location.href = `mailto:${FIRM.email}?subject=${encodeURIComponent(`Consultation request: ${d.get("matter")}`)}&body=${encodeURIComponent(text)}`;
        toast("Opening your email app with the request ready", "envelope-simple");
      } else {
        const done = $("[data-intake-done]");
        if (done) { done.hidden = false; $("[data-intake-text]", done).textContent = text; f.hidden = true; scrollToEl(done, -96); }
        navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {});
      }
    }));
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
    initPlanner();
    initForms();
    emit();
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();

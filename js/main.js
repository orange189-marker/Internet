(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  // Render every "ARPANET" as a glowing CRT-terminal word, one span per letter for the hover wave
  const crtWord = () => `<span class="arpanet">${[..."ARPANET"].map((c, i) => `<i style="--i:${i}">${c}</i>`).join("")}</span>`;
  const arpanet = (text) => text.replace(/ARPANET/gi, crtWord);
  document.querySelectorAll(".arpanet").forEach((el) => { el.outerHTML = crtWord(); });

  // Mobile nav
  const toggle = $(".nav-toggle");
  const links = $("#nav-links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Typed terminal in the hero: each line is a list of [text, class] parts
  const term = $(".terminal");
  const typed = $("#typed");
  const statusText = $(".status-text");
  const SCRIPT = [
    { parts: [["CONNECTING TO SRI VIA IMP 1 ... ", "sys"], ["OK", "ok"]], speed: 14, pause: 500 },
    { parts: [["> ", "prompt"], ["LOGIN", "cmd"]], speed: 150, pause: 700 },
    { parts: [["  L ", "cmd"], ["\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7 ", "dots"], ["ACK", "ok"]], speed: 35 },
    { parts: [["  O ", "cmd"], ["\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7 ", "dots"], ["ACK", "ok"]], speed: 35 },
    { parts: [["  G ", "cmd"], ["\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7 ", "dots"], ["*** SYSTEM CRASH ***", "crash"]], speed: 35, crash: true, pause: 900 },
    { parts: [["-- link lost --", "sys"]], speed: 20, pause: 500 },
    { parts: [["> ", "prompt"], ["SRI received: ", "sys"], ["\"LO\"", "result"]], speed: 45, pause: 400 },
    { parts: [["  ...as in \"lo and behold\"", "note"]], speed: 25 }
  ];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const setLink = (up) => {
    term.classList.toggle("crashed", !up);
    statusText.textContent = up ? "LINK UP \u00b7 50 kbit/s" : "LINK DOWN \u00b7 HOST CRASHED";
  };
  let run = 0;
  const play = async () => {
    const id = ++run;
    typed.innerHTML = "";
    setLink(true);
    await wait(400);
    for (const line of SCRIPT) {
      const row = document.createElement("div");
      row.className = "row";
      typed.appendChild(row);
      for (const [text, cls] of line.parts) {
        const span = document.createElement("span");
        span.className = cls;
        row.appendChild(span);
        if (reduceMotion) { span.textContent = text; continue; }
        for (const ch of text) {
          if (id !== run) return;
          span.textContent += ch;
          await wait(line.speed);
        }
      }
      if (line.crash) {
        setLink(false);
        if (!reduceMotion) {
          term.classList.add("crashing");
          setTimeout(() => term.classList.remove("crashing"), 500);
        }
      }
      if (!reduceMotion) await wait(line.pause ?? 250);
    }
  };
  $(".replay").addEventListener("click", play);
  play();

  // Timeline
  const list = $("#timeline-list");
  const dialog = $("#detail");
  const ERAS = { foundations: "Foundations", arpanet: "ARPANET", protocols: "Protocols", web: "The Web" };
  let lastEra = null;
  MILESTONES.forEach((m, idx) => {
    if (m.era !== lastEra) {
      lastEra = m.era;
      const years = MILESTONES.filter((x) => x.era === m.era).map((x) => x.year);
      const divider = document.createElement("li");
      divider.className = "era-divider reveal";
      divider.dataset.era = m.era;
      divider.innerHTML = `<span>${arpanet(ERAS[m.era])} <small>${years[0]}&ndash;${years[years.length - 1]}</small></span>`;
      list.appendChild(divider);
    }
    const li = document.createElement("li");
    li.className = "milestone reveal";
    li.dataset.era = m.era;
    li.innerHTML = `
      <button class="milestone-card" data-idx="${idx}" data-year="${m.year}">
        ${m.image ? `<img class="milestone-img" src="${m.image}" alt="" width="86" height="86">` : ""}
        <span class="year">${m.year}</span>
        <span class="tag">${arpanet(m.era)}</span>
        <strong>${arpanet(m.title)}</strong>
        <span class="short">${arpanet(m.short)}</span>
        <span class="more">Read more &rarr;</span>
      </button>`;
    list.appendChild(li);
  });

  // Alternate sides among visible milestones only, so filtering keeps the zigzag
  const alternate = () => {
    [...list.querySelectorAll(".milestone:not([hidden])")].forEach((li, i) => li.classList.toggle("alt", i % 2 === 1));
  };
  alternate();

  // Scroll-linked progress line that lights up each node as it passes
  const wrap = $(".timeline-wrap");
  const progress = $(".timeline-progress");
  const updateProgress = () => {
    const box = wrap.getBoundingClientRect();
    const mark = window.innerHeight * 0.6;
    progress.style.height = `${Math.max(0, Math.min(box.height, mark - box.top))}px`;
    progress.style.backgroundSize = `100% ${box.height}px`;
    list.querySelectorAll(".milestone:not([hidden])").forEach((li) => {
      li.classList.toggle("lit", li.getBoundingClientRect().top + 42 < mark);
    });
  };
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; updateProgress(); });
  }, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".milestone-card");
    if (!btn) return;
    const m = MILESTONES[btn.dataset.idx];
    $(".detail-year", dialog).textContent = m.year;
    $(".detail-title", dialog).innerHTML = arpanet(m.title);
    $(".detail-body", dialog).innerHTML = arpanet(m.body);
    dialog.showModal();
  });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  document.querySelectorAll(".filter").forEach((btn) => {
    const era = btn.dataset.era;
    $(".count", btn).textContent = era === "all" ? MILESTONES.length : MILESTONES.filter((m) => m.era === era).length;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      const era = btn.dataset.era;
      list.querySelectorAll("[data-era]").forEach((li) => {
        li.hidden = era !== "all" && li.dataset.era !== era;
      });
      alternate();
      updateProgress();
    });
  });

  // Pioneers
  const cards = $("#pioneer-cards");
  PIONEERS.forEach((p) => {
    const initials = p.name.split(/[\s.]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("");
    const el = document.createElement("article");
    el.className = "card reveal";
    el.innerHTML = `
      <div class="avatar" aria-hidden="true">${initials}</div>
      <h3>${p.name}</h3>
      <p class="role">${p.role}</p>
      <p>${arpanet(p.text)}</p>`;
    cards.appendChild(el);
  });

  // Quiz
  const box = $("#quiz-box");
  let current = 0, score = 0;
  const renderQuestion = () => {
    if (current >= QUIZ.length) {
      box.innerHTML = `
        <p class="quiz-progress">Finished</p>
        <h3>You scored ${score} / ${QUIZ.length}</h3>
        <button class="cta restart">Try again <span class="cta-arrow" aria-hidden="true">&#8635;</span></button>`;
      $(".restart", box).addEventListener("click", () => { current = 0; score = 0; renderQuestion(); });
      return;
    }
    const item = QUIZ[current];
    box.innerHTML = `
      <p class="quiz-progress">Question ${current + 1} of ${QUIZ.length}</p>
      <h3>${arpanet(item.q)}</h3>
      <div class="options">${item.options.map((o, i) => `<button class="option" data-i="${i}"><span class="letter">${"ABCD"[i]}</span><span>${o}</span></button>`).join("")}</div>
      <p class="feedback" aria-live="polite"></p>`;
    box.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const chosen = Number(btn.dataset.i);
        const correct = chosen === item.answer;
        if (correct) score++;
        box.querySelectorAll(".option").forEach((b, i) => {
          b.disabled = true;
          if (i === item.answer) b.classList.add("correct");
          else if (i === chosen) b.classList.add("wrong");
        });
        $(".feedback", box).textContent = correct ? "Correct!" : `Not quite — it was ${item.options[item.answer]}.`;
        setTimeout(() => { current++; renderQuestion(); }, 1400);
      });
    });
  };
  renderQuestion();

  // Reveal on scroll
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
  }
})();

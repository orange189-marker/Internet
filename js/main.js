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
  const ERA_COLORS = ["var(--foundations)", "var(--arpanet)", "var(--protocols)", "var(--web)"];
  PIONEERS.forEach((p, i) => {
    const initials = p.name.split(/[\s.]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("");
    const el = document.createElement("article");
    el.className = "card spot reveal";
    el.style.setProperty("--c1", ERA_COLORS[i % 4]);
    el.style.setProperty("--c2", ERA_COLORS[(i + 1) % 4]);
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
      const circumference = 2 * Math.PI * 50;
      const verdict = score === QUIZ.length ? "Perfect score \u2014 you could have built ARPANET yourself."
        : score >= 3 ? "Nicely done. You know your packets from your protocols."
        : "Scroll back through the timeline and try again!";
      box.innerHTML = `
        <div class="quiz-result">
          <svg class="score-ring" viewBox="0 0 120 120" aria-hidden="true">
            <defs><linearGradient id="score-grad"><stop offset="0" style="stop-color: var(--accent)"/><stop offset="1" style="stop-color: var(--protocols)"/></linearGradient></defs>
            <circle class="track" cx="60" cy="60" r="50"/>
            <circle class="value" cx="60" cy="60" r="50" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"/>
            <text x="60" y="60">${score}/${QUIZ.length}</text>
          </svg>
          <div>
            <h3>You scored ${score} out of ${QUIZ.length}</h3>
            <p>${arpanet(verdict)}</p>
            <button class="cta restart">Try again <span class="cta-arrow" aria-hidden="true">&#8635;</span></button>
          </div>
        </div>`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        $(".score-ring .value", box).style.strokeDashoffset = circumference * (1 - score / QUIZ.length);
      }));
      $(".restart", box).addEventListener("click", () => { current = 0; score = 0; renderQuestion(); });
      return;
    }
    const item = QUIZ[current];
    box.innerHTML = `
      <p class="quiz-progress"><span>Question ${current + 1} of ${QUIZ.length}</span><span>Score ${score}</span></p>
      <div class="quiz-bar"><i style="width: ${(current / QUIZ.length) * 100}%"></i></div>
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

  // Spotlight that follows the cursor across cards
  document.addEventListener("pointermove", (e) => {
    const el = e.target.closest?.(".spot");
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });

  // Reading progress bar and current-section highlight in the nav
  const readBar = $(".read-progress");
  const updateReadBar = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    readBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  window.addEventListener("scroll", updateReadBar, { passive: true });
  updateReadBar();
  if ("IntersectionObserver" in window) {
    const navLinks = [...links.querySelectorAll("a")];
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${en.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach((sec) => sectionObserver.observe(sec));
  }

  // Hero stats count up once
  const formatCount = (n) => (n >= 1e6 ? `${Math.round(n / 1e6)}M` : Math.round(n).toLocaleString("en-US"));
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = formatCount(target) + suffix; return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1600);
      const eased = 1 - Math.pow(1 - t, 3);
      // Grow exponentially so the jump from 4 to a million reads well
      const value = t === 1 ? target : Math.pow(target, eased);
      el.textContent = formatCount(value) + (t === 1 ? suffix : "");
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  document.querySelectorAll("[data-count]").forEach((el) => setTimeout(() => countUp(el), 300));

  // Hero background: drifting network of nodes with packets hopping along links
  const canvas = $(".hero-net");
  const ctx = canvas.getContext("2d");
  const hero = $(".hero");
  let nodes = [], packets = [], w = 0, h = 0, heroVisible = true, color = "79, 209, 197";
  const hexToRgb = (hex) => {
    const m = hex.trim().match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    return m ? m.slice(1).map((x) => parseInt(x, 16)).join(", ") : color;
  };
  const setupNet = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    color = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue("--accent"));
    const count = Math.round(Math.min(70, (w * h) / 16000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25
    }));
    packets = [];
  };
  const LINK = 140;
  const drawNet = () => {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${color}, ${0.22 * (1 - d / LINK)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (packets.length < 8 && Math.random() < 0.0008) packets.push({ a, b, t: 0 });
        }
      }
    }
    ctx.fillStyle = `rgba(${color}, 0.55)`;
    for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2); ctx.fill(); }
    packets = packets.filter((p) => (p.t += 0.012) < 1 && Math.hypot(p.a.x - p.b.x, p.a.y - p.b.y) < LINK);
    for (const p of packets) {
      const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
      ctx.fillStyle = "rgba(246, 173, 85, 0.95)";
      ctx.shadowColor = "rgba(246, 173, 85, 0.9)"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  };
  const loop = () => {
    if (heroVisible) drawNet();
    requestAnimationFrame(loop);
  };
  setupNet();
  if (reduceMotion) drawNet();
  else {
    new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; }).observe(hero);
    requestAnimationFrame(loop);
  }
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { setupNet(); if (reduceMotion) drawNet(); }, 150);
  });

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

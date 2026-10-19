(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

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

  // Typed terminal in the hero
  const typed = $("#typed");
  const lines = [
    "> LOGIN",
    "  L ... ok",
    "  O ... ok",
    "  G ... *** SYSTEM CRASH ***",
    "",
    "> first message delivered: \"LO\""
  ];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    typed.textContent = lines.join("\n");
  } else {
    const full = lines.join("\n");
    let i = 0;
    const tick = () => {
      typed.textContent = full.slice(0, ++i);
      if (i < full.length) setTimeout(tick, full[i - 1] === "\n" ? 380 : 55);
      else typed.classList.add("done");
    };
    setTimeout(tick, 500);
  }

  // Timeline
  const list = $("#timeline-list");
  const dialog = $("#detail");
  MILESTONES.forEach((m, idx) => {
    const li = document.createElement("li");
    li.className = "milestone reveal";
    li.dataset.era = m.era;
    li.innerHTML = `
      <button class="milestone-card" data-idx="${idx}">
        ${m.image ? `<img class="milestone-img" src="${m.image}" alt="" width="72" height="72">` : ""}
        <span class="year">${m.year}</span>
        <span class="tag tag-${m.era}">${m.era}</span>
        <strong>${m.title}</strong>
        <span class="short">${m.short}</span>
      </button>`;
    list.appendChild(li);
  });

  // Alternate sides among visible milestones only, so filtering keeps the zigzag
  const alternate = () => {
    [...list.querySelectorAll(".milestone:not([hidden])")].forEach((li, i) => li.classList.toggle("alt", i % 2 === 1));
  };
  alternate();

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".milestone-card");
    if (!btn) return;
    const m = MILESTONES[btn.dataset.idx];
    $(".detail-year", dialog).textContent = m.year;
    $(".detail-title", dialog).textContent = m.title;
    $(".detail-body", dialog).textContent = m.body;
    dialog.showModal();
  });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  document.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const era = btn.dataset.era;
      list.querySelectorAll(".milestone").forEach((li) => {
        li.hidden = era !== "all" && li.dataset.era !== era;
      });
      alternate();
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
      <p>${p.text}</p>`;
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
        <button class="cta restart">Try again</button>`;
      $(".restart", box).addEventListener("click", () => { current = 0; score = 0; renderQuestion(); });
      return;
    }
    const item = QUIZ[current];
    box.innerHTML = `
      <p class="quiz-progress">Question ${current + 1} of ${QUIZ.length}</p>
      <h3>${item.q}</h3>
      <div class="options">${item.options.map((o, i) => `<button class="option" data-i="${i}">${o}</button>`).join("")}</div>
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

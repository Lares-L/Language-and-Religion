/* =========================================================================
   LARES conference — speaker/talk search with autocomplete.
   Loaded as a separate <script src="search.js"> after the main inline
   script in index.html, so it can use the globals already defined there:
   SPEAKERS, TR(sp), currentLang, openSpeaker(id).
   ========================================================================= */
(function () {
  const input = document.getElementById("search-input");
  const dropdown = document.getElementById("search-dropdown");
  const wrap = document.getElementById("search-tab-wrap");
  if (!input || !dropdown || !wrap) return;

  // Move the dropdown to the very end of <body>. Several ancestors of the search
  // box use CSS transforms (the .reveal scroll-in animation), and any element with
  // a transform creates its own stacking context — that was silently pinning the
  // dropdown behind later same-level sections regardless of z-index. Re-parenting
  // it to <body> and positioning it with `position: fixed` sidesteps the problem.
  document.body.appendChild(dropdown);
  dropdown.style.position = "absolute";
  dropdown.style.zIndex = "99999";

  function positionDropdown() {
    const rect = wrap.getBoundingClientRect();
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY + 10}px`;
    dropdown.style.width = `${rect.width}px`;
  }

  const NO_RESULTS_TEXT = { en: "No matches found.", it: "Nessun risultato." };
  const MIN_CHARS = 2;
  const MAX_RESULTS = 8;

  let results = [];
  let activeIndex = -1;

  function norm(s) {
    return (s || "").toLowerCase();
  }

  function getLang() {
    return (typeof currentLang !== "undefined" && currentLang) || "en";
  }

  // Pulls the speaker's own view of talk/abstract/bio in the language currently shown.
  function speakerData(sp) {
    if (typeof TR === "function") return TR(sp);
    return sp.en || sp;
  }

  function search(query) {
    const q = norm(query);
    if (q.length < MIN_CHARS || typeof SPEAKERS === "undefined") return [];

    const matches = [];
    for (const sp of SPEAKERS) {
      const data = speakerData(sp);
      const haystack = norm(sp.name) + " " + norm(sp.affil) + " " + norm(data.talk) + " " + norm(data.abstract) + " " + norm(data.bio);
      if (haystack.indexOf(q) !== -1) {
        matches.push({ id: sp.id, name: sp.name, talk: data.talk });
        if (matches.length >= MAX_RESULTS) break;
      }
    }
    return matches;
  }

  function renderDropdown() {
    if (results.length === 0) {
      const q = input.value.trim();
      if (q.length >= MIN_CHARS) {
        dropdown.innerHTML = `<div class="search-empty">${NO_RESULTS_TEXT[getLang()] || NO_RESULTS_TEXT.en}</div>`;
        positionDropdown();
        dropdown.classList.add("open");
      } else {
        dropdown.classList.remove("open");
        dropdown.innerHTML = "";
      }
      return;
    }

    dropdown.innerHTML = results.map((r, i) => `
      <button type="button" class="search-result${i === activeIndex ? " active" : ""}" data-id="${r.id}" data-index="${i}">
        <span class="sr-name">${r.name}</span>
        <span class="sr-title">${r.talk}</span>
      </button>
    `).join("");
    positionDropdown();
    dropdown.classList.add("open");
  }

  function closeDropdown() {
    dropdown.classList.remove("open");
    activeIndex = -1;
  }

  // Finds the rendered talk-row for this speaker, switches to the right day,
  // expands its session if needed, and scrolls to it with a brief highlight —
  // so the person sees exactly when/where the talk happens, not just its abstract.
  function locateInSchedule(id) {
    const scheduleContainer = document.getElementById("schedule-container");
    if (!scheduleContainer) return false;

    const dayEls = scheduleContainer.querySelectorAll(".schedule");
    for (const dayEl of dayEls) {
      const rows = dayEl.querySelectorAll(".talk-row[data-speakers]");
      for (const row of rows) {
        const ids = row.dataset.speakers.split(",");
        if (ids.indexOf(id) === -1) continue;

        if (typeof showDay === "function") showDay(dayEl.id);

        const block = row.closest(".session-block");
        if (block) block.classList.remove("collapsed");

        // Let the day switch / expand settle before measuring scroll position.
        setTimeout(() => {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          row.classList.add("search-highlight");
          setTimeout(() => row.classList.remove("search-highlight"), 2200);
        }, 60);

        return true;
      }
    }
    return false;
  }

  function selectResult(id) {
    if (!id) return;
    const found = locateInSchedule(id);
    // Fall back to opening the speaker card directly if, for whatever reason,
    // this speaker has no talk row in the rendered schedule.
    if (!found && typeof openSpeaker === "function") openSpeaker(id);
    input.value = "";
    results = [];
    closeDropdown();
    input.blur();
  }

  input.addEventListener("input", () => {
    results = search(input.value);
    activeIndex = -1;
    renderDropdown();
  });

  input.addEventListener("focus", () => {
    if (input.value.trim().length >= MIN_CHARS) renderDropdown();
  });

  input.addEventListener("keydown", (e) => {
    if (!dropdown.classList.contains("open") || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, results.length - 1);
      renderDropdown();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      renderDropdown();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIndex] || results[0];
      if (pick) selectResult(pick.id);
    } else if (e.key === "Escape") {
      closeDropdown();
      input.blur();
    }
  });

  dropdown.addEventListener("click", (e) => {
    const btn = e.target.closest(".search-result");
    if (btn) selectResult(btn.dataset.id);
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target) && !dropdown.contains(e.target)) closeDropdown();
  });

  window.addEventListener("resize", () => {
    if (dropdown.classList.contains("open")) positionDropdown();
  });
  window.addEventListener("scroll", () => {
    if (dropdown.classList.contains("open")) positionDropdown();
  }, true);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      if (dropdown.classList.contains("open")) positionDropdown();
    });
  }
})();

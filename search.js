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
    dropdown.classList.add("open");
  }

  function closeDropdown() {
    dropdown.classList.remove("open");
    activeIndex = -1;
  }

  function selectResult(id) {
    if (!id || typeof openSpeaker !== "function") return;
    openSpeaker(id);
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
    if (!wrap.contains(e.target)) closeDropdown();
  });
})();

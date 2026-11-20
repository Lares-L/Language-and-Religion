/* =========================================================================
   LARES conference — downloadable materials (handouts, slides) per speaker.

   The files themselves are NOT in this repository: they are attached to the
   GitHub Release tagged MATERIALS_TAG (Releases → "materials" → Edit →
   drag the files in). Release assets do not enter the git history or the
   GitHub Pages build, so the site stays light and each file is downloaded
   only when someone clicks it. Limit: 2 GB per file.

   To add a file:
     1. upload it to the release (keep the file name simple: no spaces/accents,
        e.g. calame-handout.pdf);
     2. add a line below under the speaker's id (the same id used in SPEAKERS
        in index.html).

   Fields: file  = the asset's file name in the release
           title = { en, it } shown on the button (a plain string also works)
           type  = PDF, PPTX, DOCX… (label only)
           size  = e.g. "2.4 MB" (label only)
           url   = optional: a full link, used instead of the release
   Loaded after the inline script in index.html: it extends openSpeaker /
   openTalk, which are defined there.
   ========================================================================= */
const MATERIALS_TAG = "materials";
const MATERIALS_BASE = "https://github.com/Lares-L/Language-and-Religion/releases/download/" + MATERIALS_TAG + "/";

const MATERIALS = {
  licciardello: [
    { file: "licciardello-dozza-handout.pdf", title: { en: "Handout", it: "Handout" }, type: "PDF", size: "381 KB" },
    { file: "licciardello-dozza-slides.pdf", title: { en: "Slides", it: "Slide" }, type: "PDF", size: "3.6 MB" }
  ],
  dozza: [
    { file: "licciardello-dozza-handout.pdf", title: { en: "Handout", it: "Handout" }, type: "PDF", size: "381 KB" },
    { file: "licciardello-dozza-slides.pdf", title: { en: "Slides", it: "Slide" }, type: "PDF", size: "3.6 MB" }
  ],
  ciarini: [
    { file: "ciarini-slides.pdf", title: { en: "Slides", it: "Slide" }, type: "PDF", size: "690 KB" }
  ],
  bernabe: [
    { file: "handout-bernabe.pdf", title: { en: "Handout", it: "Handout" }, type: "PDF", size: "6.2 MB" }
  ],
  tripaldi: [
    { file: "tripaldi-slides.pdf", title: { en: "Slides", it: "Slide" }, type: "PDF", size: "675 KB" }
  ],
  // calame: [
  //   { file: "calame-handout.pdf", title: { en: "Handout", it: "Handout" }, type: "PDF", size: "1.2 MB" },
  //   { file: "calame-slides.pptx", title: { en: "Slides", it: "Slide" }, type: "PPTX", size: "18 MB" }
  // ],
};

(function () {
  const LABEL = { en: "Materials", it: "Materiali" };
  const DOWNLOAD = { en: "Download", it: "Scarica" };

  function lang(cardLang) {
    return cardLang || (typeof currentLang !== "undefined" && currentLang) || "en";
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function titleOf(m, l) {
    if (!m.title) return m.file;
    return typeof m.title === "string" ? m.title : (m.title[l] || m.title.en || m.file);
  }
  function urlOf(m) {
    return m.url || MATERIALS_BASE + encodeURIComponent(m.file);
  }

  function blockHtml(ids, l) {
    const items = [];
    const seen = new Set();
    ids.forEach(id => (MATERIALS[id] || []).forEach(m => {
      const key = m.url || m.file;
      if (!seen.has(key)) { seen.add(key); items.push(m); }
    }));
    if (items.length === 0) return "";
    const rows = items.map(m => {
      const meta = [m.type, m.size].filter(Boolean).map(esc).join(" · ");
      return `<a class="material-item" href="${esc(urlOf(m))}" target="_blank" rel="noopener" download>
          <span class="mi-title">${esc(titleOf(m, l))}</span>
          ${meta ? `<span class="mi-meta">${meta}</span>` : ""}
          <span class="mi-action">${DOWNLOAD[l] || DOWNLOAD.en} &#8595;</span>
        </a>`;
    }).join("");
    return `<div class="info-block materials-block">
        <div class="block-label">${LABEL[l] || LABEL.en}</div>
        <div class="material-list">${rows}</div>
      </div>`;
  }

  const style = document.createElement("style");
  style.textContent = `
    .modal .materials-block{margin-top:1rem}
    .material-list{display:flex;flex-direction:column;gap:0.5rem}
    .material-item{display:flex;align-items:baseline;gap:0.7rem;flex-wrap:wrap;padding:0.55rem 0.8rem;border:1px solid var(--border);border-radius:10px;background:var(--paper);color:var(--ink);text-decoration:none;transition:border-color .15s ease}
    .material-item:hover{border-color:var(--green-deep)}
    .material-item .mi-title{font-size:16px;flex:1 1 auto}
    .material-item .mi-meta{font-family:'Cinzel',serif;font-size:9.5px;letter-spacing:0.08em;color:var(--muted);text-transform:uppercase}
    .material-item .mi-action{font-family:'Cinzel',serif;font-size:10px;letter-spacing:0.1em;color:var(--green-deep);text-transform:uppercase}
    .materials-jump{position:absolute;top:1.25rem;right:3.2rem;background:none;border:1px solid var(--border);border-radius:999px;padding:0.25rem 0.7rem;font-family:'Cinzel',serif;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--green-deep);cursor:pointer;transition:border-color .15s ease, color .15s ease}
    .materials-jump:hover{border-color:var(--green-deep);color:var(--ink)}
    @media (max-width:600px){.materials-jump{top:0.95rem;right:3.6rem}}
  `;
  document.head.appendChild(style);

  const content = document.getElementById("modal-content");
  if (!content) return;

  function append() {
    const ids = (content.dataset.ids || "").split(",").filter(Boolean);
    const l = lang(content.dataset.cardLang);
    const html = blockHtml(ids, l);
    if (!html) return;
    content.insertAdjacentHTML("beforeend", html);
    // Small "Materials ↓" link at the top right of the card, so the downloads
    // at the bottom are not missed; it scrolls the card down to them.
    content.insertAdjacentHTML("afterbegin",
      `<button type="button" class="materials-jump">${LABEL[l] || LABEL.en} &#8595;</button>`);
  }

  content.addEventListener("click", (e) => {
    if (!e.target.closest(".materials-jump")) return;
    e.stopPropagation();
    const block = content.querySelector(".materials-block");
    if (block) block.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Global function declarations from index.html: reassigning them here also
  // changes the calls made from inside index.html (click handlers, back link,
  // reading-language switch).
  if (typeof openSpeaker === "function") {
    const baseSpeaker = openSpeaker;
    openSpeaker = function () { baseSpeaker.apply(this, arguments); append(); };
  }
  if (typeof openTalk === "function") {
    const baseTalk = openTalk;
    // A one-speaker talk delegates to openSpeaker, which has already appended.
    openTalk = function () {
      baseTalk.apply(this, arguments);
      if (content.dataset.view === "talk") append();
    };
  }
})();

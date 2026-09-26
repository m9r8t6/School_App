import "./styles.css";

const STORAGE_KEY = "luma-study-v1";
const seed = {
  theme: "light",
  aiEndpoint: "",
  activeFolder: "All notes",
  documents: [
    { id: "doc-1", title: "Biology · Cell membranes", type: "note", folder: "Biology", updated: "Today", preview: "A quick study guide on phospholipids, proteins, and transport.", color: "mint", body: "Cell membranes are selectively permeable barriers made mostly of a phospholipid bilayer.", pinned: true, markers: [] },
    { id: "doc-2", title: "Week 4 · Lecture slides", type: "pdf", folder: "Biology", updated: "Yesterday", preview: "Imported PDF · 24 pages", color: "blue", body: "", pinned: false, markers: [] },
    { id: "doc-3", title: "Exam prep checklist", type: "note", folder: "Planning", updated: "Sep 24", preview: "Priorities for the next study session.", color: "peach", body: "Review active transport\nSketch a membrane diagram\nExplain osmosis in one sentence", pinned: false, markers: [] }
  ],
  folders: ["Biology", "Planning", "Unsorted"]
};

let state = load();
let selectedTool = "pen";
let currentFileUrl = "";
let activeDocId = null;
let searchTerm = "";

function load() {
  try { return { ...seed, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; } catch { return structuredClone(seed); }
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid(prefix = "id") { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function escapeHtml(value = "") { return value.replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char])); }
function icon(name) {
  const paths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    spark: '<path d="m12 3-1.4 5.6L5 10l5.6 1.4L12 17l1.4-5.6L19 10l-5.6-1.4z"/><path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L22 19l-2.3-.7z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>',
    moon: '<path d="M20.5 14.7A8.5 8.5 0 0 1 9.3 3.5 8.5 8.5 0 1 0 20.5 14.7z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.5v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.5h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.5v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.file}</svg>`;
}
function typeIcon(type) { return type === "note" ? "✦" : type === "pdf" ? "PDF" : type === "image" ? "IMG" : type === "text" ? "TXT" : "PPT"; }

function render() {
  const folders = ["All notes", ...state.folders];
  const visible = state.documents.filter((doc) => {
    const folderMatch = state.activeFolder === "All notes" || doc.folder === state.activeFolder;
    const searchMatch = !searchTerm || `${doc.title} ${doc.preview} ${doc.body}`.toLowerCase().includes(searchTerm.toLowerCase());
    return folderMatch && searchMatch;
  });
  document.body.dataset.theme = state.theme;
  document.querySelector("#app").innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">✦</div><div><strong>Luma</strong><span>study workspace</span></div></div>
        <button class="new-note" data-action="new-note"><span>${icon("plus")}</span> New note <kbd>N</kbd></button>
        <nav class="nav"><button class="nav-item active"><span>${icon("grid")}</span> Workspace</button><button class="nav-item" data-action="show-all"><span>${icon("file")}</span> Recent</button></nav>
        <div class="section-label">Folders <button class="mini-button" data-action="add-folder" aria-label="Add folder">${icon("plus")}</button></div>
        <div class="folders">${folders.map((folder) => `<button class="folder ${state.activeFolder === folder ? "selected" : ""}" data-folder="${escapeHtml(folder)}"><i></i>${escapeHtml(folder)}<span>${folder === "All notes" ? state.documents.length : state.documents.filter((d) => d.folder === folder).length}</span></button>`).join("")}</div>
        <div class="sidebar-bottom"><button class="nav-item" data-action="settings"><span>${icon("settings")}</span> Preferences</button><button class="profile"><div class="avatar">MB</div><span><b>My workspace</b><small>Local only · synced</small></span><span class="more">•••</span></button></div>
      </aside>
      <main class="main">
        <header class="topbar"><div class="mobile-brand"><div class="brand-mark">✦</div><strong>Luma</strong></div><label class="search">${icon("search")}<input id="search" placeholder="Search notes and documents" value="${escapeHtml(searchTerm)}"><kbd>⌘ K</kbd></label><div class="top-actions"><button class="icon-button" data-action="toggle-theme" title="Toggle dark mode">${icon(state.theme === "dark" ? "sun" : "moon")}</button><button class="avatar small">MB</button></div></header>
        <div class="content"><div class="page-heading"><div><p class="eyebrow">Good afternoon, Maya <span>✦</span></p><h1>Your workspace</h1><p class="subheading">A calm place for everything you’re learning.</p></div><div class="heading-actions"><button class="secondary" data-action="backup">${icon("upload")} Backup</button><button class="primary" data-action="import">${icon("upload")} Import</button><input type="file" id="file-input" hidden accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.md,.csv"></div></div>
          <section class="hero-card"><div class="hero-copy"><span class="pill">✦ AI study companion</span><h2>Turn questions into<br><em>understanding.</em></h2><p>Select any text in a note to get a clear explanation, a quick summary, or a new way to look at it.</p><button class="dark-button" data-action="ask-ai">Ask about your notes <span>→</span></button></div><div class="hero-art"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="sparkle">✦</div><div class="book"><div></div><div></div><div></div></div></div></section>
          <div class="section-header"><div><h2>Recent work</h2><span>${visible.length} ${visible.length === 1 ? "item" : "items"}</span></div><button class="view-link" data-action="show-all">View all ${icon("plus")}</button></div>
          <section class="document-grid">${visible.length ? visible.map(documentCard).join("") : `<div class="empty-state"><div>⌕</div><h3>No notes found</h3><p>Try another search or create a new note.</p></div>`}</section>
          <section class="quick-start"><div><span class="eyebrow">Start something new</span><h2>What are you working on?</h2></div><div class="quick-actions"><button data-action="new-note"><span class="quick-icon note-icon">✦</span><b>Write a note</b><small>Capture a thought</small><i>→</i></button><button data-action="import"><span class="quick-icon import-icon">${icon("upload")}</span><b>Import a document</b><small>PDF, slides, image or text</small><i>→</i></button><button data-action="draw"><span class="quick-icon draw-icon">⌁</span><b>Sketch by hand</b><small>Use your stylus</small><i>→</i></button></div></section>
        </div>
      </main>
    </div>
    <div id="modal-root"></div>`;
  bind();
}

function documentCard(doc) {
  return `<article class="doc-card ${doc.color}" data-doc="${doc.id}"><div class="card-top"><span class="doc-type">${typeIcon(doc.type)}</span><button class="card-menu" data-menu="${doc.id}">•••</button></div><button class="doc-open" data-open="${doc.id}"><h3>${escapeHtml(doc.title)}</h3><p>${escapeHtml(doc.preview || "No preview yet")}</p></button><div class="card-footer"><span>${escapeHtml(doc.updated)}</span><span class="folder-tag">${escapeHtml(doc.folder)}</span></div></article>`;
}

function bind() {
  document.querySelectorAll("[data-action]").forEach((el) => el.addEventListener("click", () => actions(el.dataset.action)));
  document.querySelectorAll("[data-folder]").forEach((el) => el.addEventListener("click", () => { state.activeFolder = el.dataset.folder; persist(); render(); }));
  document.querySelectorAll("[data-open]").forEach((el) => el.addEventListener("click", () => openDocument(el.dataset.open)));
  document.querySelectorAll("[data-menu]").forEach((el) => el.addEventListener("click", (event) => { event.stopPropagation(); showDocumentMenu(el.dataset.menu); }));
  document.querySelector("#search").addEventListener("input", (e) => { searchTerm = e.target.value; render(); document.querySelector("#search").focus(); });
  document.querySelector("#file-input").addEventListener("change", handleFiles);
  document.addEventListener("keydown", keyHandler, { once: true });
}
function keyHandler(e) { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); document.querySelector("#search").focus(); } else if (e.key.toLowerCase() === "n" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) actions("new-note"); }
function actions(action) {
  if (action === "new-note") openEditor();
  if (action === "import") document.querySelector("#file-input").click();
  if (action === "draw") openEditor(true);
  if (action === "toggle-theme") { state.theme = state.theme === "dark" ? "light" : "dark"; persist(); render(); }
  if (action === "show-all") { state.activeFolder = "All notes"; searchTerm = ""; persist(); render(); }
  if (action === "backup") downloadBackup();
  if (action === "settings") openSettings();
  if (action === "add-folder") addFolder();
  if (action === "ask-ai") openAi();
}
function handleFiles(event) {
  [...event.target.files].forEach((file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const type = ["png", "jpg", "jpeg", "webp"].includes(ext) ? "image" : ["txt", "md", "csv"].includes(ext) ? "text" : ext === "pdf" ? "pdf" : "slides";
    const doc = { id: uid("doc"), title: file.name.replace(/\.[^.]+$/, ""), type, folder: state.activeFolder === "All notes" ? "Unsorted" : state.activeFolder, updated: "Just now", preview: `${file.type || ext.toUpperCase()} · ${(file.size / 1024 / 1024).toFixed(1)} MB`, color: ["blue", "lavender", "peach"][state.documents.length % 3], body: "", pinned: false, markers: [] };
    if (type === "image" || type === "pdf") doc.objectUrl = URL.createObjectURL(file);
    if (type === "text") { const reader = new FileReader(); reader.onload = () => { doc.body = reader.result; doc.preview = `${doc.body.slice(0, 80)}${doc.body.length > 80 ? "…" : ""}`; persist(); render(); }; reader.readAsText(file); }
    state.documents.unshift(doc); persist();
  });
  render();
}
function openDocument(id) {
  const doc = state.documents.find((item) => item.id === id); if (!doc) return;
  activeDocId = id;
  const preview = doc.type === "pdf" && doc.objectUrl ? `<iframe src="${doc.objectUrl}" title="PDF preview"></iframe>` : doc.type === "image" && doc.objectUrl ? `<img class="image-preview" src="${doc.objectUrl}" alt="${escapeHtml(doc.title)}">` : doc.type === "slides" ? `<div class="unsupported-preview"><div class="large-file-icon">PPT</div><h3>Slides imported</h3><p>PowerPoint preview is ready to attach. Open it in your preferred presentation app, or add study notes beside it.</p></div>` : `<textarea class="document-text" data-edit-body>${escapeHtml(doc.body || "")}</textarea>`;
  document.querySelector("#modal-root").innerHTML = `<div class="overlay"><section class="document-modal"><header><div><span class="doc-type">${typeIcon(doc.type)}</span><h2>${escapeHtml(doc.title)}</h2><small>${escapeHtml(doc.folder)} · saved locally</small></div><div class="modal-actions"><button class="secondary" data-action="ask-ai">${icon("spark")} Explain</button><button class="icon-button" data-action="close">${icon("close")}</button></div></header><div class="preview-area">${preview}</div><footer><button class="text-button" data-action="save-doc">Save changes</button><button class="text-button" data-action="attach-marker">Attach explanation link</button><span class="save-note">Your workspace stays on this device.</span></footer></section></div>`;
  document.querySelectorAll("#modal-root [data-action]").forEach((el) => el.addEventListener("click", () => modalAction(el.dataset.action)));
}
function modalAction(action) {
  if (action === "close") { document.querySelector("#modal-root").innerHTML = ""; return; }
  const doc = state.documents.find((item) => item.id === activeDocId);
  if (action === "save-doc") { const body = document.querySelector("[data-edit-body]"); if (body) { doc.body = body.value; doc.preview = body.value.slice(0, 88); } persist(); openDocument(activeDocId); render(); }
  if (action === "attach-marker") openAi(true);
  if (action === "ask-ai") openAi();
}
function openEditor(handwriting = false) {
  document.querySelector("#modal-root").innerHTML = `<div class="overlay"><section class="editor-modal"><header><div><span class="eyebrow">${handwriting ? "Canvas" : "New note"}</span><h2>${handwriting ? "Sketch a thought" : "Untitled note"}</h2></div><button class="icon-button" data-action="close">${icon("close")}</button></header>${handwriting ? `<div class="canvas-tools"><button class="tool selected" data-tool="pen">✎ Pen</button><button class="tool" data-tool="highlighter">▰ Highlighter</button><button class="tool" data-tool="eraser">⌫ Eraser</button><button class="tool" data-action="undo">↶ Undo</button></div><canvas id="drawing-canvas"></canvas>` : `<input class="title-input" id="new-title" placeholder="Give your note a title…"><textarea class="note-editor" id="new-body" placeholder="Start writing…"></textarea>`}<footer><button class="secondary" data-action="close">Cancel</button><button class="primary" data-action="save-new">${handwriting ? "Save sketch" : "Save note"}</button></footer></section></div>`;
  document.querySelectorAll("#modal-root [data-action]").forEach((el) => el.addEventListener("click", () => editorAction(el.dataset.action)));
  if (handwriting) setupCanvas();
}
function editorAction(action) { if (action === "close") document.querySelector("#modal-root").innerHTML = ""; if (action === "save-new") { const title = document.querySelector("#new-title")?.value || "Untitled note"; const body = document.querySelector("#new-body")?.value || "Handwritten sketch"; state.documents.unshift({ id: uid("doc"), title, type: "note", folder: "Unsorted", updated: "Just now", preview: body.slice(0, 90), color: "mint", body, pinned: false, markers: [] }); persist(); document.querySelector("#modal-root").innerHTML = ""; render(); } }
function setupCanvas() {
  const canvas = document.querySelector("#drawing-canvas"), ctx = canvas.getContext("2d"), history = [];
  const resize = () => { const rect = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1; canvas.width = rect.width * ratio; canvas.height = rect.height * ratio; ctx.scale(ratio, ratio); ctx.fillStyle = "#fffdf9"; ctx.fillRect(0, 0, rect.width, rect.height); }; resize();
  let drawing = false;
  const point = (e) => { const rect = canvas.getBoundingClientRect(); return { x: (e.clientX || e.touches?.[0].clientX) - rect.left, y: (e.clientY || e.touches?.[0].clientY) - rect.top }; };
  canvas.addEventListener("pointerdown", (e) => { drawing = true; history.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); ctx.beginPath(); const p = point(e); ctx.moveTo(p.x, p.y); });
  canvas.addEventListener("pointermove", (e) => { if (!drawing) return; const p = point(e); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = selectedTool === "highlighter" ? 18 : selectedTool === "eraser" ? 30 : 3; ctx.globalCompositeOperation = selectedTool === "eraser" ? "destination-out" : "source-over"; ctx.strokeStyle = selectedTool === "highlighter" ? "rgba(255, 207, 72, .42)" : "#18211f"; ctx.lineTo(p.x, p.y); ctx.stroke(); });
  canvas.addEventListener("pointerup", () => { drawing = false; });
  document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => { selectedTool = button.dataset.tool; document.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("selected", b === button)); }));
  document.querySelector('[data-action="undo"]').addEventListener("click", () => { const image = history.pop(); if (image) ctx.putImageData(image, 0, 0); });
}
function showDocumentMenu(id) { const doc = state.documents.find((item) => item.id === id); if (!doc) return; if (confirm(`Delete “${doc.title}” from this device?`)) { state.documents = state.documents.filter((item) => item.id !== id); persist(); render(); } }
function addFolder() { const name = prompt("Name your new folder"); if (name?.trim() && !state.folders.includes(name.trim())) { state.folders.push(name.trim()); persist(); render(); } }
function openSettings() { document.querySelector("#modal-root").innerHTML = `<div class="overlay"><section class="settings-modal"><header><div><span class="eyebrow">Workspace</span><h2>Preferences</h2></div><button class="icon-button" data-action="close">${icon("close")}</button></header><label class="setting-label">AI endpoint <span>Optional</span><input id="ai-endpoint" value="${escapeHtml(state.aiEndpoint)}" placeholder="https://your-endpoint.example/v1/ask"></label><p class="setting-help">Without an endpoint, Luma uses a local demo response and never sends your notes anywhere.</p><label class="setting-label toggle-line"><input type="checkbox" ${state.theme === "dark" ? "checked" : ""} data-settings-theme> Dark mode</label><footer><button class="primary" data-action="save-settings">Save preferences</button></footer></section></div>`; document.querySelectorAll("#modal-root [data-action]").forEach((el) => el.addEventListener("click", () => { if (el.dataset.action === "close") document.querySelector("#modal-root").innerHTML = ""; if (el.dataset.action === "save-settings") { state.aiEndpoint = document.querySelector("#ai-endpoint").value.trim(); state.theme = document.querySelector("[data-settings-theme]").checked ? "dark" : "light"; persist(); document.querySelector("#modal-root").innerHTML = ""; render(); } })); }
function openAi(marker = false) { document.querySelector("#modal-root").innerHTML = `<div class="overlay"><section class="ai-modal"><header><div><span class="pill">✦ AI companion</span><h2>${marker ? "Save an explanation" : "What should we explore?"}</h2></div><button class="icon-button" data-action="close">${icon("close")}</button></header><textarea id="ai-question" placeholder="e.g. Explain active transport like I’m new to biology…"></textarea><div class="ai-suggestions"><button data-suggest="Summarize this topic in three key points">Summarize</button><button data-suggest="Give me a simple analogy">Give an analogy</button><button data-suggest="Quiz me on this">Quiz me</button></div><div id="ai-answer"></div><footer>${marker ? '<input id="marker-title" class="marker-input" placeholder="Title for this explanation…">' : ""}<button class="primary" data-action="run-ai">${marker ? "Save explanation" : "Ask Luma"} <span>→</span></button></footer></section></div>`; document.querySelectorAll("[data-suggest]").forEach((el) => el.addEventListener("click", () => { document.querySelector("#ai-question").value = el.dataset.suggest; })); document.querySelectorAll("#modal-root [data-action]").forEach((el) => el.addEventListener("click", () => { if (el.dataset.action === "close") document.querySelector("#modal-root").innerHTML = ""; if (el.dataset.action === "run-ai") runAi(marker); })); }
async function runAi(marker) { const question = document.querySelector("#ai-question").value.trim() || "Explain this topic"; const answerBox = document.querySelector("#ai-answer"); answerBox.innerHTML = `<div class="ai-loading">Thinking locally <span>•••</span></div>`; let answer = `Here’s a useful starting point: <strong>${escapeHtml(question.replace(/^(Explain|Summarize|Give|Quiz me on)\\s*/i, ""))}</strong> is best understood by connecting the idea to what you already know. Break it into a definition, one concrete example, and a quick “why does this matter?” check. <br><br><em>Demo response — add an AI endpoint in Preferences for your own model.</em>`; if (state.aiEndpoint) { try { const response = await fetch(state.aiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, document: state.documents.find((d) => d.id === activeDocId)?.body || "" }) }); if (!response.ok) throw new Error("Endpoint returned an error"); const data = await response.json(); answer = escapeHtml(data.answer || data.response || JSON.stringify(data)); } catch { answer = "The configured endpoint could not be reached. Here is the local demo instead:<br><br>" + answer; } } answerBox.innerHTML = `<div class="ai-answer"><span class="answer-label">Luma’s take</span><p>${answer}</p></div>`; if (marker) { document.querySelector('[data-action="run-ai"]').textContent = "Save explanation"; document.querySelector('[data-action="run-ai"]').onclick = () => { const doc = state.documents.find((item) => item.id === activeDocId); if (doc) { doc.markers.push({ title: document.querySelector("#marker-title")?.value || "Saved explanation", answer }); persist(); } document.querySelector("#modal-root").innerHTML = ""; }; } }
function downloadBackup() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `luma-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }

render();

# Luma · local-first study workspace

Luma is a small responsive PWA for tablet study sessions. It is intentionally dependency-light and stores notes, folders, saved explanations, theme preferences, and imported document metadata in `localStorage` on the current device.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production check, use `npm run build` and `npm run preview`.

## MVP capabilities

- Create typed notes and organize them into local folders.
- Import PDFs, PowerPoint files, images, and text/Markdown/CSV files. PDFs and images preview in-browser; slide files are retained with a clear attachment state.
- Draw with a finger or stylus using pen, highlighter, eraser, and undo controls.
- Search recent work, toggle dark mode, and export a JSON backup.
- Ask for an explanation through a local demo fallback. An optional JSON `POST` endpoint can be configured in Preferences; the app sends only the current question and selected note body.
- Save an explanation title/link marker to the active document.

No API keys or secrets are included. For a full offline install, serve the built `dist` directory from a static HTTPS host; the manifest is included and the app works without a backend.

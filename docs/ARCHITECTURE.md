# 🏗️ ARCHITECTURE.md – Weekify

## Overview

**Weekify** is a browser-based weekly execution planner that helps users align their intentions with actionable weekly strategies. It uses principles of **behavioral psychology** and the **Eisenhower Matrix** to structure tasks.

This architecture document outlines the tech stack, key files, and future development trajectory of Weekify.

---

## ⚙️ Tech Stack

| Layer       | Technology         | Notes                                          |
|-------------|--------------------|------------------------------------------------|
| Frontend    | HTML5              | Semantic structure and layout                  |
| Styling     | CSS3               | Custom design with transitions and themes      |
| Logic       | JavaScript (ES6)   | Core logic for task analysis and UI dynamics   |
| Security    | GitHub native tools| CodeQL, Dependabot, Secret Scanning            |

> **No build tools or frameworks are used** in v1 to ensure accessibility and simplicity.

---

## 🧩 Core File Structure

| File/Folder         | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `index.html`        | Main layout with UI elements and hooks for interaction                     |
| `styles.css`        | Custom styles for themes, layout, color-coded matrix areas                 |
| `script.js`         | Logic for task categorization, matrix logic, behavioral prompts, exports   |
| `utils.js`          | (Optional) Reusable utility functions like formatting or calculations       |
| `.github/`          | Repo configuration (CODEOWNERS, workflows, issue templates, security)      |
| `docs/`             | Documentation for architecture, roadmap, and user guide                    |

---

## 🔄 Component Interactions

- User fills tasks → JS handles evaluation → Eisenhower logic runs → Categorization displayed.
- Optional prompts (urgency, consequence) enhance categorization accuracy.
- Users can export the result or view priority-based insights.

---

## 🧭 Planned Enhancements (v2+)

| Feature                          | Description                                     |
|----------------------------------|-------------------------------------------------|
| `localStorage` / `IndexedDB`     | Save user sessions or weekly plans locally     |
| Framework integration            | Refactor into React or Svelte for scalability  |
| Tailwind CSS                     | Replace manual styles with utility-first design|
| TypeScript                       | Stronger typing, safety, and maintainability   |
| Web Components                   | Encapsulate matrix blocks and task inputs      |

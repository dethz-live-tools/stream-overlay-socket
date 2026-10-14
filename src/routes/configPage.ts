import { getConfig, resolveConfigPath } from "../modules/config";
import { listDiscoveredModuleFolders } from "../modules/expansion";

const color = `/* Catppuccin Macchiato Palette */
:root {
  --ctp-text: rgb(202, 211, 245);
  --ctp-subtext-1: rgb(184, 192, 224);
  --ctp-subtext-0: rgb(165, 173, 203);
  --ctp-overlay-2: rgb(147, 154, 183);
  --ctp-overlay-1: rgb(128, 135, 162);
  --ctp-overlay-0: rgb(110, 115, 141);
  --ctp-surface-2: rgb(91, 96, 120);
  --ctp-surface-1: rgb(73, 77, 100);
  --ctp-surface-0: rgb(54, 58, 79);
  --ctp-base: rgb(36, 39, 58);
  --ctp-mantle: rgb(30, 32, 48);
  --ctp-crust: rgb(24, 25, 38);
  --ctp-rosewater: rgb(244, 219, 214);
  --ctp-flamingo: rgb(240, 198, 198);
  --ctp-pink: rgb(245, 189, 230);
  --ctp-mauve: rgb(198, 160, 246);
  --ctp-red: rgb(237, 135, 150);
  --ctp-maroon: rgb(238, 153, 160);
  --ctp-peach: rgb(245, 169, 127);
  --ctp-yellow: rgb(238, 212, 159);
  --ctp-green: rgb(166, 218, 149);
  --ctp-teal: rgb(139, 213, 202);
  --ctp-sky: rgb(145, 215, 227);
  --ctp-sapphire: rgb(125, 196, 228);
  --ctp-blue: rgb(138, 173, 244);
  --ctp-lavender: rgb(183, 189, 248);
}`;

const css = `@import url(https://fonts.googleapis.com/css?family=IBM+Plex+Sans+Thai:100,200,300,regular,500,600,700);

${color}

* {
  font-family: 'IBM Plex Sans Thai', sans-serif;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--ctp-base);
  color: var(--ctp-text);
  min-height: 100vh;
  padding: 2rem 1rem;
}

.container {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ctp-surface-1);
}

.title-group h1 {
  font-size: 1.8rem;
  color: var(--ctp-mauve);
}

.title-group p {
  font-size: 0.9rem;
  color: var(--ctp-subtext-0);
  margin-top: 0.25rem;
}

.nav-links {
  display: flex;
  gap: 0.75rem;
}

.nav-link {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  background: var(--ctp-surface-0);
  color: var(--ctp-sapphire);
  text-decoration: none;
  font-size: 0.9rem;
  border: 1px solid var(--ctp-surface-2);
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--ctp-surface-1);
  color: var(--ctp-sky);
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-family: monospace;
  background: var(--ctp-mantle);
  color: var(--ctp-subtext-1);
  border: 1px solid var(--ctp-surface-1);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  background: var(--ctp-mantle);
  padding: 0.4rem;
  border-radius: 0.75rem;
  border: 1px solid var(--ctp-surface-0);
}

.tab-btn {
  flex: 1;
  padding: 0.6rem 1rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: var(--ctp-subtext-0);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--ctp-surface-0);
  color: var(--ctp-peach);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.card {
  background: var(--ctp-mantle);
  border: 1px solid var(--ctp-surface-0);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ctp-blue);
  display: flex;
  justify-content: space-between;
}

.form-group label .desc {
  font-weight: normal;
  font-size: 0.8rem;
  color: var(--ctp-overlay-2);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

input[type="text"], input[type="password"], textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--ctp-surface-2);
  background: var(--ctp-surface-0);
  color: var(--ctp-text);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

input[type="text"]:focus, input[type="password"]:focus, textarea:focus {
  border-color: var(--ctp-mauve);
}

.toggle-pwd {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: var(--ctp-overlay-2);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem;
}

.toggle-pwd:hover {
  color: var(--ctp-text);
}

.custom-keys-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

.custom-keys-table th {
  text-align: left;
  padding: 0.5rem;
  font-size: 0.85rem;
  color: var(--ctp-subtext-0);
  border-bottom: 1px solid var(--ctp-surface-1);
}

.custom-keys-table td {
  padding: 0.5rem;
  vertical-align: middle;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--ctp-green);
  color: var(--ctp-crust);
}

.btn-primary:hover {
  filter: brightness(1.1);
  box-shadow: 0 4px 10px rgba(166, 218, 149, 0.3);
}

.btn-secondary {
  background: var(--ctp-surface-1);
  color: var(--ctp-text);
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-secondary:hover {
  background: var(--ctp-surface-2);
}

.btn-danger {
  background: var(--ctp-red);
  color: var(--ctp-crust);
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
}

.btn-danger:hover {
  filter: brightness(1.1);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
}

.toast {
  display: none;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  background: var(--ctp-green);
  color: var(--ctp-crust);
  font-weight: 500;
  animation: fadeIn 0.3s;
}

.toast.show {
  display: block;
}

.toast.error {
  background: var(--ctp-red);
  color: var(--ctp-crust);
}

textarea#rawJson {
  font-family: monospace;
  font-size: 0.9rem;
  min-height: 320px;
  line-height: 1.4;
  resize: vertical;
}

.expansion-card {
  background: var(--ctp-surface-0);
  border: 1px solid var(--ctp-surface-1);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  margin-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.expansion-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.expansion-card-title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.expansion-folder-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--ctp-mantle);
  color: var(--ctp-mauve);
  font-family: monospace;
  font-size: 0.9rem;
  padding: 0.25rem 0.6rem;
  border-radius: 0.4rem;
  border: 1px solid var(--ctp-surface-2);
  width: fit-content;
}

.expansion-desc {
  font-size: 0.82rem;
  color: var(--ctp-overlay-2);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export function renderConfigPage(saved = false): string {
  const current = getConfig();
  const configPath = resolveConfigPath();

  // Separate standard keys from extra keys
  const standardKeys = [
    "TEST_VALUE",
    "SPOTIFY_CLIENT_ID",
    "SPOTIFY_CLIENT_SECRET",
    "SPOTIFY_REDIRECT_URI",
  ];

  const extraKeys: Record<string, any> = {};
  for (const [k, v] of Object.entries(current)) {
    if (!standardKeys.includes(k) && k !== "expansion") {
      extraKeys[k] = v;
    }
  }

  const currentExpansions: Record<string, Record<string, any>> = current.expansion || {};

  // Discover module folders from modules/ directory
  const discovered = listDiscoveredModuleFolders("modules");
  const discoveredMap = new Map(discovered.map((d) => [d.folderName, d]));

  // Union of discovered folders and configured folders in config.json expansion
  const allFolderNames = Array.from(
    new Set([...discovered.map((d) => d.folderName), ...Object.keys(currentExpansions)]),
  );

  const jsonString = JSON.stringify(current, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuration Changer | Stream Overlay Socket</title>
  <style>${css}</style>
</head>
<body>
  <div class="container">
    <header>
      <div class="title-group">
        <h1>Configuration Changer</h1>
        <p>Edit global application settings and Spotify credentials</p>
      </div>
      <nav class="nav-links">
        <a href="/static" class="nav-link">Overlays</a>
        <a href="/controller" class="nav-link">Controller</a>
        <a href="/api/config" class="nav-link" target="_blank">API JSON</a>
      </nav>
    </header>

    <div>
      <span class="badge">File: ${configPath}</span>
    </div>

    <div class="tabs">
      <button type="button" class="tab-btn active" id="tabFormBtn" onclick="switchTab('form')">Form View</button>
      <button type="button" class="tab-btn" id="tabJsonBtn" onclick="switchTab('json')">Raw JSON</button>
    </div>

    <div id="toast" class="toast ${saved ? "show" : ""}">
      ${saved ? "✓ Configuration saved successfully!" : ""}
    </div>

    <!-- FORM VIEW -->
    <form id="configForm" method="POST" action="/config" class="card">
      <input type="hidden" name="expansion_json" id="expansion_json">

      <div class="form-group">
        <label for="TEST_VALUE">
          TEST_VALUE
          <span class="desc">General test/build verification string</span>
        </label>
        <input type="text" id="TEST_VALUE" name="TEST_VALUE" value="${escapeHtml(current.TEST_VALUE ?? "")}" required>
      </div>

      <div class="form-group">
        <label for="SPOTIFY_CLIENT_ID">
          SPOTIFY_CLIENT_ID
          <span class="desc">Spotify Developer Dashboard Client ID</span>
        </label>
        <input type="text" id="SPOTIFY_CLIENT_ID" name="SPOTIFY_CLIENT_ID" value="${escapeHtml(current.SPOTIFY_CLIENT_ID ?? "")}" placeholder="e.g. 8f9c02c9...">
      </div>

      <div class="form-group">
        <label for="SPOTIFY_CLIENT_SECRET">
          SPOTIFY_CLIENT_SECRET
          <span class="desc">Spotify App Secret key</span>
        </label>
        <div class="input-wrapper">
          <input type="password" id="SPOTIFY_CLIENT_SECRET" name="SPOTIFY_CLIENT_SECRET" value="${escapeHtml(current.SPOTIFY_CLIENT_SECRET ?? "")}" placeholder="e.g. 2ec510f6...">
          <button type="button" class="toggle-pwd" onclick="toggleSecretVisibility()">Show</button>
        </div>
      </div>

      <div class="form-group">
        <label for="SPOTIFY_REDIRECT_URI">
          SPOTIFY_REDIRECT_URI
          <span class="desc">OAuth callback URI</span>
        </label>
        <input type="text" id="SPOTIFY_REDIRECT_URI" name="SPOTIFY_REDIRECT_URI" value="${escapeHtml(current.SPOTIFY_REDIRECT_URI ?? "")}" placeholder="http://127.0.0.1:3000/spotify/callback/">
      </div>

      <!-- MODULE EXPANSIONS SECTION -->
      <div class="form-group" style="margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <label style="font-size: 1.05rem; color: var(--ctp-peach); margin-bottom: 0;">
            Module Expansions Configuration
            <span class="desc">Custom variables stored under "expansion" key for folders in modules/</span>
          </label>
          <button type="button" class="btn btn-secondary" onclick="addCustomExpansionCard()">+ Add Expansion</button>
        </div>

        <div id="expansionCardsContainer">
          ${allFolderNames
            .map((folder) => {
              const meta = discoveredMap.get(folder);
              const vars = currentExpansions[folder] || {};
              const varEntries = Object.entries(vars);
              const isDiscovered = !!meta;
              return `
            <div class="expansion-card" data-folder="${escapeHtml(folder)}">
              <div class="expansion-card-header">
                <div class="expansion-card-title">
                  <div class="expansion-folder-badge">
                    📁 <span>${escapeHtml(folder)}</span>
                    <input type="hidden" class="expansion-folder-name" value="${escapeHtml(folder)}">
                  </div>
                  ${meta?.name && meta.name !== folder ? `<div style="font-size: 0.9rem; color: var(--ctp-subtext-1); font-weight: 500;">${escapeHtml(meta.name)}${meta.version ? ` v${escapeHtml(meta.version)}` : ""}</div>` : ""}
                  ${meta?.description ? `<div class="expansion-desc">${escapeHtml(meta.description)}</div>` : ""}
                </div>
                <div>
                  <button type="button" class="btn btn-danger" onclick="removeExpansionCard(this)" title="Delete module configuration">✕ Remove</button>
                </div>
              </div>

              <table class="custom-keys-table">
                <thead>
                  <tr>
                    <th style="width: 40%;">Variable</th>
                    <th style="width: 50%;">Value</th>
                    <th style="width: 10%;"></th>
                  </tr>
                </thead>
                <tbody class="expansion-vars-body">
                  ${varEntries
                    .map(
                      ([k, v]) => `
                    <tr class="expansion-var-row">
                      <td><input type="text" class="exp-var-key" value="${escapeHtml(k)}" placeholder="VARIABLE_NAME"></td>
                      <td><input type="text" class="exp-var-val" value="${escapeHtml(typeof v === "object" ? JSON.stringify(v) : String(v))}" placeholder="value"></td>
                      <td><button type="button" class="btn btn-danger" onclick="removeRow(this)">✕</button></td>
                    </tr>`,
                    )
                    .join("")}
                </tbody>
              </table>

              <div style="margin-top: 0.25rem;">
                <button type="button" class="btn btn-secondary" onclick="addExpansionVarRow(this)">+ Add Variable</button>
              </div>
            </div>`;
            })
            .join("")}
        </div>
      </div>

      <div class="form-group" style="margin-top: 1rem;">
        <label>
          Custom Settings
          <span class="desc">Additional root keys stored in config.json</span>
        </label>
        <table class="custom-keys-table" id="customKeysTable">
          <thead>
            <tr>
              <th style="width: 40%;">Key</th>
              <th style="width: 50%;">Value</th>
              <th style="width: 10%;"></th>
            </tr>
          </thead>
          <tbody id="customKeysBody">
            ${Object.entries(extraKeys)
              .map(
                ([k, v]) => `
              <tr class="custom-key-row">
                <td><input type="text" class="custom-key" value="${escapeHtml(k)}"></td>
                <td><input type="text" class="custom-val" value="${escapeHtml(typeof v === "object" ? JSON.stringify(v) : String(v))}"></td>
                <td><button type="button" class="btn btn-danger" onclick="removeRow(this)">✕</button></td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <div style="margin-top: 0.5rem;">
          <button type="button" class="btn btn-secondary" onclick="addCustomKeyRow()">+ Add Setting</button>
        </div>
      </div>

      <div class="actions">
        <button type="submit" class="btn btn-primary" id="saveBtn">Save Configuration</button>
      </div>
    </form>

    <!-- RAW JSON VIEW -->
    <div id="jsonView" class="card" style="display: none;">
      <div class="form-group">
        <label for="rawJson">
          config.json
          <span class="desc">Direct JSON editing</span>
        </label>
        <textarea id="rawJson" spellcheck="false">${escapeHtml(jsonString)}</textarea>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-primary" onclick="saveRawJson()">Save JSON</button>
      </div>
    </div>
  </div>

  <script>
    function toggleSecretVisibility() {
      const input = document.getElementById("SPOTIFY_CLIENT_SECRET");
      const btn = event.currentTarget;
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "Hide";
      } else {
        input.type = "password";
        btn.textContent = "Show";
      }
    }

    function switchTab(tab) {
      const formCard = document.getElementById("configForm");
      const jsonCard = document.getElementById("jsonView");
      const formBtn = document.getElementById("tabFormBtn");
      const jsonBtn = document.getElementById("tabJsonBtn");

      if (tab === "form") {
        formCard.style.display = "flex";
        jsonCard.style.display = "none";
        formBtn.classList.add("active");
        jsonBtn.classList.remove("active");
      } else {
        syncFormToJson();
        formCard.style.display = "none";
        jsonCard.style.display = "flex";
        jsonBtn.classList.add("active");
        formBtn.classList.remove("active");
      }
    }

    function addCustomKeyRow(key = "", val = "") {
      const tbody = document.getElementById("customKeysBody");
      const tr = document.createElement("tr");
      tr.className = "custom-key-row";
      tr.innerHTML = \`
        <td><input type="text" class="custom-key" placeholder="KEY_NAME" value="\${key}"></td>
        <td><input type="text" class="custom-val" placeholder="value" value="\${val}"></td>
        <td><button type="button" class="btn btn-danger" onclick="removeRow(this)">✕</button></td>
      \`;
      tbody.appendChild(tr);
    }

    function removeRow(btn) {
      btn.closest("tr").remove();
    }

    function addExpansionVarRow(btn, key = "", val = "") {
      const card = btn.closest(".expansion-card");
      const tbody = card.querySelector(".expansion-vars-body");
      const tr = document.createElement("tr");
      tr.className = "expansion-var-row";
      tr.innerHTML = \`
        <td><input type="text" class="exp-var-key" placeholder="VARIABLE_NAME" value="\${key}"></td>
        <td><input type="text" class="exp-var-val" placeholder="value" value="\${val}"></td>
        <td><button type="button" class="btn btn-danger" onclick="removeRow(this)">✕</button></td>
      \`;
      tbody.appendChild(tr);
    }

    function removeExpansionCard(btn) {
      const card = btn.closest(".expansion-card");
      if (card) {
        card.remove();
      }
    }

    function addCustomExpansionCard(folderName = "") {
      const container = document.getElementById("expansionCardsContainer");
      const card = document.createElement("div");
      card.className = "expansion-card";
      card.innerHTML = \`
        <div class="expansion-card-header">
          <div class="expansion-card-title">
            <div class="expansion-folder-badge" style="gap: 0.5rem;">
              📁 <input type="text" class="expansion-folder-name" placeholder="module-folder-name" value="\${folderName}" style="padding: 0.2rem 0.5rem; font-size: 0.9rem; min-width: 200px;">
            </div>
            <div class="expansion-desc">Custom expansion module configuration</div>
          </div>
          <div>
            <button type="button" class="btn btn-danger" onclick="removeExpansionCard(this)">✕ Remove</button>
          </div>
        </div>
        <table class="custom-keys-table">
          <thead>
            <tr>
              <th style="width: 40%;">Variable</th>
              <th style="width: 50%;">Value</th>
              <th style="width: 10%;"></th>
            </tr>
          </thead>
          <tbody class="expansion-vars-body">
            <tr class="expansion-var-row">
              <td><input type="text" class="exp-var-key" placeholder="VARIABLE_NAME" value=""></td>
              <td><input type="text" class="exp-var-val" placeholder="value" value=""></td>
              <td><button type="button" class="btn btn-danger" onclick="removeRow(this)">✕</button></td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 0.25rem;">
          <button type="button" class="btn btn-secondary" onclick="addExpansionVarRow(this)">+ Add Variable</button>
        </div>
      \`;
      container.appendChild(card);
    }

    function collectFormData() {
      const config = {
        TEST_VALUE: document.getElementById("TEST_VALUE").value,
        SPOTIFY_CLIENT_ID: document.getElementById("SPOTIFY_CLIENT_ID").value,
        SPOTIFY_CLIENT_SECRET: document.getElementById("SPOTIFY_CLIENT_SECRET").value,
        SPOTIFY_REDIRECT_URI: document.getElementById("SPOTIFY_REDIRECT_URI").value,
      };

      const rows = document.querySelectorAll("#customKeysBody tr");
      rows.forEach(row => {
        const keyInput = row.querySelector(".custom-key");
        const valInput = row.querySelector(".custom-val");
        if (keyInput && valInput && keyInput.value.trim()) {
          let val = valInput.value;
          try {
            val = JSON.parse(val);
          } catch {}
          config[keyInput.value.trim()] = val;
        }
      });

      const expansion = {};
      const cards = document.querySelectorAll(".expansion-card");
      cards.forEach(card => {
        const folderInput = card.querySelector(".expansion-folder-name");
        const folderName = folderInput ? folderInput.value.trim() : "";
        if (!folderName) return;

        const modVars = {};
        const varRows = card.querySelectorAll(".expansion-var-row");
        varRows.forEach(vRow => {
          const kInput = vRow.querySelector(".exp-var-key");
          const vInput = vRow.querySelector(".exp-var-val");
          if (kInput && vInput && kInput.value.trim()) {
            let val = vInput.value;
            try {
              val = JSON.parse(val);
            } catch {}
            modVars[kInput.value.trim()] = val;
          }
        });

        expansion[folderName] = modVars;
      });

      config.expansion = expansion;

      const hiddenJson = document.getElementById("expansion_json");
      if (hiddenJson) {
        hiddenJson.value = JSON.stringify(expansion);
      }

      return config;
    }

    function syncFormToJson() {
      const data = collectFormData();
      document.getElementById("rawJson").value = JSON.stringify(data, null, 2);
    }

    function showToast(msg, isError = false) {
      const toast = document.getElementById("toast");
      toast.textContent = (isError ? "✗ " : "✓ ") + msg;
      toast.className = "toast show" + (isError ? " error" : "");
      setTimeout(() => {
        toast.className = "toast";
      }, 4000);
    }

    // Intercept form submit for smooth AJAX experience
    document.getElementById("configForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = collectFormData();

      try {
        const res = await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.status === 1) {
          showToast("Configuration saved successfully!");
          syncFormToJson();
        } else {
          showToast(data.message || "Failed to save configuration", true);
        }
      } catch (err) {
        showToast("Error saving: " + err.message, true);
      }
    });

    async function saveRawJson() {
      const rawText = document.getElementById("rawJson").value;
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        showToast("Invalid JSON: " + err.message, true);
        return;
      }

      try {
        const res = await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed)
        });

        const data = await res.json();
        if (data.status === 1) {
          showToast("JSON configuration saved successfully!");
          // Reload page to re-render form view with new keys
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast(data.message || "Failed to save configuration", true);
        }
      } catch (err) {
        showToast("Error saving: " + err.message, true);
      }
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

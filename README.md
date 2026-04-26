# 🤖 AI Form Filler — Chrome Extension

> Intelligently detect form fields and auto-fill them with realistic fake data. Works on any website, any framework.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

- **🧠 AI-Powered Field Detection** — Analyzes labels, names, placeholders, IDs, and autocomplete attributes using a 3-tier classification engine
- **📋 20+ Field Types** — Names, emails, passwords, phones, dates, addresses, companies, and more
- **🎯 Smart Select/Dropdown Support** — Works with Vuetify, Material UI, Ant Design, Element UI, and other custom select components
- **📅 Date Picker Support** — Detects and fills Vuetify date pickers and native date inputs
- **🔒 Modal-Aware Scoping** — When a modal/dialog is open, only fills fields inside the modal
- **⚡ Framework Compatible** — Uses native value setters and event dispatching to work with React, Vue, Angular, and vanilla JS forms
- **🎨 Visual Feedback** — Fields flash with an indigo highlight when filled
- **🔄 One-Click Fill & Clear** — Fill all fields instantly or clear them with a single click

---

## 📦 Installation

### Option 1 — Clone with Git

```bash
git clone https://github.com/RABBI31/AI-form-filer.git
```

### Option 2 — Download ZIP (no Git required)

1. Go to [github.com/RABBI31/AI-form-filer](https://github.com/RABBI31/AI-form-filer)
2. Click the green **Code** button → **Download ZIP**
3. Extract the ZIP to any folder

### Load into Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the extracted/cloned folder
5. The 🤖 icon will appear in your toolbar — **pin it** for easy access
6. Navigate to any page with a form → click the icon → **Fill Fields**

> **Note:** This method works without publishing to the Chrome Web Store. Anyone can install it by following these steps. The extension will stay installed across browser restarts.

---

## 🚀 Usage

1. Navigate to any webpage with a form
2. Click the **AI Form Filler** extension icon
3. Click **⚡ Fill Fields** to auto-fill all detected fields
4. Click **🔍 Detect Fields** to preview what the extension found
5. Click **✕ Clear** to reset all fields

---

## 🧠 How the AI Detection Works

The classifier uses a **3-tier priority system** to identify each field's type:

```
Tier 1 → Autocomplete attribute     (most reliable)
Tier 2 → Label/Name/ID pattern matching
Tier 3 → HTML input type fallback   (least specific)
```

### Tier 1 — Autocomplete Attribute
Maps standard HTML `autocomplete` values (`given-name`, `email`, `tel`, `street-address`) directly to field types.

### Tier 2 — Context Pattern Matching
Combines the field's **label + name + id + placeholder** into a context string and matches against ordered regex patterns. More specific patterns (e.g. `first_name`) are checked before generic ones (e.g. `name`).

### Tier 3 — Input Type Fallback
Uses the HTML `type` attribute (`email`, `password`, `tel`, `number`, `date`) as a last resort.

---

## 📊 Supported Field Types

| Type | Example Generated Value |
|------|------------------------|
| `name` | Emma Robinson |
| `first_name` | Liam |
| `last_name` | Thompson |
| `email` | emma.robinson42@gmail.com |
| `password` | K7#mPxR2!bNw (strong, 12-char) |
| `phone` | +1 (555) 832-0147 |
| `username` | liam_4821 |
| `age` | 34 |
| `salary` | 87,500 |
| `date` | 2023-06-14 |
| `address` | 4521 Oak Avenue |
| `city` | San Francisco |
| `country` | United States |
| `company_name` | Nexus Technologies |
| `employee_id` | EMP-34521 |
| `number` | Context-aware (zip, quantity, year) |
| `select` | Picks realistic option, skips placeholders |
| `radio` | Random valid option |
| `checkbox` | Checked |
| `textarea` | Realistic paragraph text |

---

## 🔧 Supported Frameworks

| Framework | Components Supported |
|-----------|---------------------|
| **Vanilla HTML** | All native form elements |
| **Vuetify** (v2 & v3) | `v-select`, `v-autocomplete`, `v-combobox`, `v-text-field`, date pickers |
| **Material UI** | `Select`, `Autocomplete`, `TextField` |
| **Ant Design** | `Select`, `Input`, `DatePicker` |
| **Element UI** | `el-select`, `el-input`, `el-date-picker` |
| **Others** | Select2, Tom Select, Slim Select, Headless UI |

---

## 📂 Project Structure

```
ai-form-filler-extension/
├── manifest.json        # Chrome Extension manifest (v3)
├── popup.html           # Extension popup UI (dark mode)
├── popup.js             # Popup ↔ content script messaging
├── content.js           # DOM field discovery, filling & clearing
├── ai-client.js         # AI field type classifier (3-tier engine)
├── fake-generator.js    # Realistic fake data generator (20+ types)
├── icons/
│   ├── icon16.png       # Toolbar icon
│   ├── icon48.png       # Extensions page icon
│   └── icon128.png      # Chrome Web Store icon
└── README.md
```

---

## 🏗️ Architecture

```
┌──────────────┐     chrome.tabs.sendMessage     ┌──────────────┐
│  popup.html  │ ──────────────────────────────► │  content.js  │
│  popup.js    │ ◄────────── sendResponse ────── │              │
└──────────────┘                                 │  Discovers   │
                                                 │  fields in   │
                                                 │  active scope│
                                                 └──────┬───────┘
                                                        │
                                          ┌─────────────┼─────────────┐
                                          ▼                           ▼
                                  ┌──────────────┐          ┌─────────────────┐
                                  │ ai-client.js │          │ fake-generator.js│
                                  │              │          │                  │
                                  │ Classifies   │          │ Generates fake   │
                                  │ field type   │──────►   │ data by type     │
                                  └──────────────┘          └─────────────────┘
```

---

## 🛡️ Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Access the current tab's page to detect and fill form fields |
| `scripting` | Inject content scripts into web pages |
| `storage` | Save user preferences (future feature) |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs via [Issues](https://github.com/RABBI31/AI-form-filer/issues)
- Submit feature requests
- Open pull requests

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for developers who are tired of filling forms manually.
</p>

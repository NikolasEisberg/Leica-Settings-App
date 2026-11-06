# Leica Dial & Dot

A cross-platform Electron desktop application for viewing, comparing, and adjusting **Leica camera settings (`.lcs` files)** without navigating on-camera menus.

Export your `settings.lcs` file from your Leica camera onto an SD card, open it in **Leica Dial & Dot** to manage user profiles and camera parameters via structured dropdowns, and export the adjusted `settings.lcs` file back to your SD card.

---

## Key Features

* **Lossless `.lcs` Import & Export:**
  * Reads and writes Leica `.lcs` files while preserving 100% of the camera's internal settings structure, key ordering, and byte-level formatting.
  * Import via file picker or drag-and-drop anywhere in the window.
* **Persistent Multi-Configuration Library:**
  * Maintain multiple camera setups (e.g., *Street*, *Studio*, *Travel*, *Factory Default Baseline*) across sessions.
  * Duplicate, rename, and switch between configurations at any time.
* **macOS Settings Panel (`⌘,`) & Appearance Modes:**
  * Open Settings via the native macOS application menu (**Leica Dial & Dot** $\rightarrow$ **Settings…**, `⌘,`) or the **Settings** button in the titlebar.
  * **Appearance:** Switch between **System (Auto)**, **Light Mode**, and **Dark Mode** with automatic macOS system appearance synchronization.
  * **Default Storage & `.lcs` Folder Path:** Configure the default directory where the persistent configuration library is stored and where Import/Export `.lcs` dialogs open by default.
* **7-Slot Camera Profile Manager:**
  * Manage the camera's **Active State** (`Slot 0`) alongside all 6 named **User Profiles** (`Profile 1` – `Profile 6`).
  * Rename profiles (`3–10` characters) using an open input field or quick-select name presets.
  * Copy settings from any profile slot to another—or across all 7 slots—in a single click.
  * Optional toggle to automatically mirror `Profile 1` edits to the camera's `Active State`.
* **Dropdown-First Settings Editor:**
  * Adjust settings safely using curated dropdown menus across 6 categories:
    * **Exposure & ISO:** ISO sensitivity, Max Auto ISO ceiling, Auto ISO minimum shutter speed limit, exposure metering, exposure compensation, EV steps, shutter mode & speed.
    * **Focus & Drive:** Drive/capture modes, AF field modes, subject detection, AF tracking sensitivity, and default AF frame coordinates.
    * **Image, Crop & Looks:** Sensor resolution (`60 MP` / `36 MP` / `18 MP`), digital zoom crop (`28 mm` – `90 mm`), file format (`DNG` / `JPG`), color space, White Balance & Kelvin temperature, and Film Style offsets.
    * **Video & Cine:** Primary and secondary frame rates, slow-motion speed, Cine shutter angle, video codec profiles, and Video Auto ISO limits.
    * **Function Buttons (FN):** Custom button and dial assignments for both Photo and Video modes (with one-click copy from Photo $\rightarrow$ Video).
    * **Metadata & System:** EXIF Artist and Copyright tags (open input + presets), standby timers, EVF refresh rate, display timeouts, and self-timer delays.
* **Diff & All Settings Inspector:**
  * Inspect all 346 camera settings across all 7 profile slots or compare two saved configurations side-by-side.
  * Filter toggles to **Hide Default Settings**, **Hide Identical Settings**, or both.
* **Smart Export Dialog:**
  * Export with an open filename input or one-click presets:
    1. **Camera-Ready (SD Card Standard):** `settings.lcs`
    2. **Camera + Configuration Name:** `{camera}_{configName}.lcs`

---

## Camera Workflow (Leica Q3)

1. **Export from Camera to SD Card:**
   On your Leica Q3, navigate to **Menu** $\rightarrow$ **User Profile** $\rightarrow$ **Manage Profiles** $\rightarrow$ **Export Profiles**. This writes `settings.lcs` to your SD card.
2. **Adjust in Leica Dial & Dot:**
   Import `settings.lcs` into the app, customize your profiles and settings, and export the updated file.
3. **Import Back to Camera:**
   Save the exported file as `settings.lcs` on your SD card, insert the card into your camera, and select **Menu** $\rightarrow$ **User Profile** $\rightarrow$ **Manage Profiles** $\rightarrow$ **Import Profiles**.

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended) and `npm`

### Installation

```bash
git clone <your-repo-url>
cd "Leica Settings App"
npm install
```

### Running the App

```bash
# Standard launch
npm start

# Direct macOS Electron binary launch
npm run start:mac
```

### Running Tests

The repository includes an automated verification suite (`test/verify-lcs.js`) that tests 100% byte-for-byte round-trip serialization against `settings.lcs`, profile slot read/write operations, diff filtering, and dropdown option coverage:

```bash
npm test
```

---

## Project Structure

```text
├── LICENSE                   # GNU General Public License v3.0 (GPL-3.0)
├── settings.lcs              # Reference Leica Q3 settings file
├── package.json              # Project metadata and scripts
├── src/
│   ├── main.js               # Electron main process, macOS menu, preferences & session persistence
│   ├── preload.js            # Context-isolated IPC bridge
│   ├── lcs-codec.js          # Lossless .lcs parser and byte-accurate serializer
│   ├── settings-schema.js    # Categorized camera settings dictionary & dropdown options
│   ├── assets/
│   │   ├── logo.svg          # Knurled Dial & Sliders Badge vector logo
│   │   └── icon.png          # High-resolution macOS application & Dock icon
│   └── renderer/
│       ├── index.html        # Application layout, Settings modal (⌘,) & export modal
│       ├── styles.css        # Light & Dark Leica-inspired UI themes
│       └── app.js            # Renderer state, appearance sync, profile manager & diff inspector
└── test/
    └── verify-lcs.js         # Automated .lcs round-trip & schema test suite
```

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)** — see the [LICENSE](LICENSE) file for details.

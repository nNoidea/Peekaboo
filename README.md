# Peekaboo

<p align="center">
  <img src="./src/assets/icon.png" alt="Peekaboo Logo">
</p>

A lightweight, elegant screen recorder for Linux built with Electron.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux-lightgrey.svg)
![Electron](https://img.shields.io/badge/electron-39.x-47848F.svg)

## 🎬 Demo

https://github.com/user-attachments/assets/f7071cd9-8f07-4c10-b7ac-9580e8cbbd1e

_Yes, this showcase was recorded using Peekaboo itself! 🐣_

## 💡 Background

This project was inspired by [Peek](https://github.com/phw/peek), the now-discontinued screen recorder for Linux. The inspiration is purely in terms of the idea and UX approach — not the codebase.

**Full transparency:** Peekaboo was developed almost entirely using AI coding agents. This started as an experiment in agentic coding, and I've primarily spent my time on prompting and manual testing while AI wrote the code based on how I wanted the app to function.

I built this out of personal need — a quick tool to record my frontend development work for showcasing features. I'm not trying to pass off AI-generated code as my own; this is simply a practical solution born from curiosity about AI-assisted development.

## ✨ Features

-   **Region Selection** — Record any portion of your screen by resizing the window
-   **Multiple Formats** — Export as MP4, WebM, or GIF
-   **Configurable FPS** — Choose your preferred frame rate
-   **Mouse Cursor** — Option to show or hide the cursor in recordings
-   **Audio Recording** — Capture system audio and/or microphone (PulseAudio) for MP4 and WebM
-   **Persistent Settings** — Your preferences are saved between sessions

## 📦 Installation

### AppImage (Recommended)

Download the latest `Peekaboo-x.x.x.AppImage` from the [Releases](https://github.com/nNoidea/Peekaboo/releases) page, make it executable, and run:

```bash
chmod +x Peekaboo-*.AppImage
./Peekaboo-*.AppImage
```

### Build from Source

```bash
# Clone the repository
git clone https://github.com/nNoidea/Peekaboo.git
cd peekaboo

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## 🛠️ Requirements

-   **Linux** with X11 (Wayland not currently supported)
-   **FFmpeg** — must be installed on your system (`sudo apt install ffmpeg` on Debian/Ubuntu)
-   **PulseAudio** (for audio recording features)

## 🚀 Usage

1. Launch Peekaboo
2. Resize and position the transparent window over the area you want to record
3. Configure your settings (format, FPS, mouse visibility, audio)
4. Click **Start Recording**
5. A floating control bar appears — click **Stop Recording** when done
6. Recording is automatically saved to `~/Videos/Peekaboo/`

## 🏗️ Tech Stack

-   **Electron** — Cross-platform desktop framework
-   **React 19** — UI components
-   **TypeScript** — Type-safe codebase
-   **Vite** — Fast development & bundling
-   **Bootstrap 5** — Styling
-   **FFmpeg** — Video encoding & processing

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔄 Versioning & Releases

Releases are automated via GitHub Actions when pushing to `main`. The version is read from `package.json`.

**Automatic version bumping (via git hook):**

| Command                             | Behavior                                 |
| ----------------------------------- | ---------------------------------------- |
| `git commit -m "msg"`               | Auto-increment patch (`1.0.0` → `1.0.1`) |
| `VERSION=SAME git commit -m "msg"`  | Keep current version                     |
| `VERSION=2.0.0 git commit -m "msg"` | Set version to `2.0.0`                   |

**Examples:**

```bash
# Auto-bump patch version
git commit -m "Add new feature"

# Keep same version (e.g., adding build artifacts)
VERSION=SAME git commit -m "Add .deb build"

# Jump to specific version
VERSION=2.0.0 git commit -m "Major release"
```

**Manual version bumping (alternative):**

```bash
npm run version:patch   # 1.0.0 → 1.0.1
npm run version:minor   # 1.0.0 → 1.1.0
npm run version:major   # 1.0.0 → 2.0.0
```

**Setup (first time only):**

```bash
npm run prepare   # Installs the git hook
```

**How it works:**

1. Commit your changes → version is handled based on `VERSION` env var
2. Push to `main`
3. GitHub Actions builds and creates/replaces release for that version

> **Note:** If you push the same version again, the existing release will be replaced.

> **Note:** Builds only trigger on pushes to `main`. Changes to `.md` files, `.gitignore`, and `LICENSE` are ignored.

## 📄 License

This project is licensed under the ISC License.

---

<p align="center">Made with ❤️ for the Linux community</p>

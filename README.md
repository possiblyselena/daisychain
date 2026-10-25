# Daisy Chain!

Daisy Chain is a beginner-friendly web IDE for coding your own hardware hairclip! Write Python, snap blocks together, or draw pixel art, and it runs on a tiny OLED screen straight from your browser, with nothing to install. It's inspired by the viral "hardware hairclips" and made for girls in tech, or anyone who wants to get into it!

## How we use Convex
- **Live doodle inbox:** friends' doodles appear in the IDE instantly through a realtime `useQuery`, no refresh needed.
- **Share links and sending:** mutations create hairclip share links and save doodles, using indexed lookups.
- **AI tutor:** a Convex action calls Gemini, so the API key stays on the server.
- Full details and our build log: [hackathon.md](hackathon.md)

## Tech Stack

**Frontend**
- SvelteKit + Svelte 5 (TypeScript)
- Vite
- Tailwind CSS
- Hosted on Vercel

**Backend**
- Convex (live doodles from friends + AI tutor)
- Google Gemini API

**Board Connection**
- Web Serial API
- MicroPython raw REPL

**Libraries**
- CodeMirror 6
- Blockly
- xterm.js
- three.js
- uqr

**Hardware used (whatever I could find)**
- ESP32-C3 Mini running MicroPython
- 0.96" SSD1306 OLED
- Tiny Bredboard

**Design**
- Figma for the website and block designs
- KiCad for the hairclip's PCB. The 3D model on the website comes straight from it :]
# Hackathon log

- **Project:** Daisy Chain
- **Event:** Cal Hacks 13.0
- **What it does:** A no-install browser IDE that programs an ESP32-C3 hairclip's OLED screen over USB with Python, blocks or pixel doodles, and lets friends send doodles to it live.
- **Live app:** https://daisychain-five.vercel.app
- **Repo:** https://github.com/possiblyselena/daisychain
- **Frontend:** Vercel
- **Convex deployment:** https://tacit-mockingbird-615.convex.cloud
- **Components:** none
- **Convex features:** schema, indexes, queries, mutations, actions, realtime useQuery
- **Auth:** none
- **AI models:** gemini-3.8-flash
- **Started:** 2026-10-24T06:16:12Z
- **Last updated:** 2026-10-25T06:20:13Z

## How we use Convex

- **Share links:** "Get my share link" in the IDE calls the `clips.create` mutation, which picks a unique name like `sparkly-bunny-42` using the `by_slug` index. Proof: `src/convex/clips.ts`, `src/convex/schema.ts`.
- **Sending doodles from a phone:** the friend page `/to/[slug]` checks the link with `useQuery(api.clips.get)` and sends through the `doodles.send` mutation, which validates the 128×64 pixel data. Proof: `src/routes/to/[slug]/+page.svelte`, `src/convex/doodles.ts`.
- **Live doodle inbox:** the IDE subscribes with `useQuery(api.doodles.latest)` (read through the `by_clipId` index), so new doodles appear and can show on the hairclip without a refresh. Proof: `src/lib/components/ide/DaisyChainPanel.svelte`.
- **Owner-only delete:** the `doodles.remove` mutation deletes a doodle only when the browser's secret owner key matches its hairclip. Proof: `src/convex/doodles.ts`.
- **AI tutor:** the `tutor.ask` action sends the student's code and last error to Gemini, so the API key stays on the server; the IDE calls it with `useAction`. Proof: `src/convex/tutor.ts`, `src/lib/components/ide/TutorPanel.svelte`.

**Updates live without a refresh:** the daisy chain panel in the IDE (`/ide`) and the link check on the friend page (`/to/[slug]`).

## Log

- **2026-10-24** `e08c88e`: SvelteKit scaffold (`src/routes/+page.svelte`, `package.json`)
- **2026-10-24** `136b34e`: install libraries (`package.json`)
- **2026-10-24** `a2aaedd`: landing page assets from Figma, Convex project config (`src/routes/+page.svelte`, `convex.json`)
- **2026-10-24** `ae65d0c`: 3D PCB hero with three.js (`src/lib/components/PcbViewer.svelte`, `daisychain.glb`)
- **2026-10-24** `46b94a8`: creator inspiration carousel (`src/lib/components/ReelCarousel.svelte`)
- **2026-10-24** `f2833dd`: hero layout fixes (`PcbViewer.svelte`, `src/routes/+page.svelte`)
- **2026-10-24** `3c02ae9`: IDE with Web Serial board connection, editor, console and doodle pad; Get Started page (`src/lib/board/board.ts`, `src/routes/ide/+page.svelte`)
- **2026-10-24** `8a59a1c`: IDE link in the navbar (`SiteNav.svelte`)
- **2026-10-24** `3576e72`: Convex daisy chain: schema, share links, sending and receiving doodles (`src/convex/schema.ts`, `clips.ts`, `doodles.ts`, `DaisyChainPanel.svelte`, `src/routes/to/[slug]/+page.svelte`)
- **2026-10-24** `f6ac315`: allow tunnel hosts for phone testing (`vite.config.ts`)
- **2026-10-24** `157295c`: Blockly block coding and wiring diagram (`src/lib/blocks/daisy-blocks.ts`, `BlockEditor.svelte`, `WiringDiagram.svelte`)
- **2026-10-24** `a9a3b81`: bubble pop sound on clicks (`src/lib/sound/pop.ts`)
- **2026-10-24** `b04835a`: AI tutor as a Convex action calling Gemini (`src/convex/tutor.ts`, `TutorPanel.svelte`)
- **2026-10-25** `1da626b`: owner-only doodle delete and flip-through viewer, README (`src/convex/doodles.ts`, `clips.ts`, `schema.ts`, `DaisyChainPanel.svelte`, `README.md`)

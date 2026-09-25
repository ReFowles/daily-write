# Daily Write

A Next.js application for tracking daily writing habits and progress. Log writing sessions, view history, track statistics, and work on your writing goals with Google Docs integration.

## Features

- **Daily Writing Goals**: Set and track word count targets
- **Writing Sessions**: Log your daily writing progress
- **Calendar Views**: Monthly and weekly calendar views to visualize your writing streak
- **Statistics Dashboard**: Track total words, current streak, and goal progress
- **Google Docs Integration**: Write directly in Google Docs with word count tracking
- **Theme Support**: Six beautiful themes (Light, Dark, Strawberry, Cherry, Seafoam, Ocean)
- **Firebase Integration**: Secure authentication and data persistence

## Tech Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **Runtime**: React 19.2.0
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Firebase Firestore
- **Package Manager**: pnpm (v11.8.0)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Firebase project with Firestore enabled
- Google Cloud project with OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ReFowles/daily-write.git
cd daily-write
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

See [AGENTS.md](./AGENTS.md) for detailed project structure and development guidelines.

## Deployment
`pnpm build`'s type-check phase needs real CPU/RAM — running it on your own machine sidesteps the droplet's memory ceiling entirely. This works cleanly because `.next/` build output is plain JS/manifests with no native binaries baked in; the only architecture-specific piece is `node_modules` (SWC, `sharp`), which you still install **on the droplet** so it gets the correct Linux/x64 binaries via the lockfile.

This is all handled using the [deploy-dailywrite](scripts/deploy-dailywrite.sh) script locally **after syncing `main`** and with **no pending changes**. (Note: Script relies on specific local directory locations and may need to be updated. It may also potentially only run for allowed SSHs on the droplet.)

**Important Notes:**

- The code on the droplet (via `git pull`) must exactly match what you built locally, or you'll ship a mismatched `.next/` against a different `src/`. Commit and push before building, and `git pull` on the droplet before rsyncing `.next/` over.
- Running the `rsync` command in the script can take around 12 minutes to complete.
- Check logs in the Droplet with `journalctl -u dailywrite --since '1 hour ago'`

## Development

### Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Code Style

- Use TypeScript for all new files
- Follow React 19 patterns with hooks
- Use Tailwind CSS for styling
- Maintain consistent component organization
- Fix all linting errors (do not suppress)

## TODO:
- Code Audit
- Update Fonts? Change font by theme?
- Date exclusion on goals
- Opt-in feature, "cheat days" ; number designated when making goal and/or "earned" when certain conditions have been met (i.e. excess word counts, streaks, etc.)
- Opt-in feature, "Feed plusses" (excess words from previous days) to "fill up" non-met day
- Optional setting, "gentle" tracking: tone down the harsh red for unmet goals
- Optional setting, "shimmer theme" gives every theme border animations like Energy and Ambition
- Optional setting OR Opt-in feature: locked word count & tracked deletions
- Expand Dashboard DND: Collapse cards; Hide cards? Grid?
- Mobile: the rich text options get kinda hidden when typing
- Mobile: long docs are hard to scroll down/navigate
- Add outline pane/flyout toggle
- When making a new doc, make it so the user can pick which folder it goes in
- Preserve Google-Docs-only features on paragraphs edited in the app
  - Comments, custom text colors, images, footnotes, and other paragraph attributes that `DocumentContent` does not model are still lost when the user edits *that* paragraph. Diff-based autosave protects unchanged paragraphs; expanding `DocumentContent` to carry opaque style attributes is a follow-up.
- Reflect preserved Google Docs presets visually in the editor
  - Preset `paragraphStyle` and `textStyle` fields (font family, font size, line spacing, paragraph spacing, first-line indent, text/background color, paragraph alignment) already round-trip via `attrs.docStyle` and the `docStyle` mark. They are not rendered in the editor today, so the writing view still uses Tailwind `prose` defaults. Follow-up: swap the passthrough extensions' `renderHTML` for translations to inline `style` (e.g. `lineSpacing: 150` → `line-height: 1.5`, `weightedFontFamily` → `font-family`, `foregroundColor` → `color`) and add toolbar controls that mutate the passthrough attrs/marks so users can see and edit the presets.
- ~~First-class table structural edits~~ Superseded: tables are now read-only, locked placeholder chips (like images and page breaks). The editor no longer models table structure; the diff preserves a table in place via its Google Docs index span, and a rare full-replace drops it (can't be recreated). Re-adding first-class table editing would be a larger, separate effort.
- About Page: 
  - Explain why word counts and having a daily word count is a valuable tool when building a habit or writing a full manuscript
  - Explain why word counts specifically, and not pages or chapters
  - Offer DailyWrite as a tool for writing without goals, because the themes are great
  - Make a more blatant explanation that DailyWrite is good for writing but not editing—leave that to Google Docs
  - No images, sorry!
  - The app can't count what you write in Google Docs directly, only what you write through the app itself.
  - More emphasis on being a supplement, not a replacement. Use DailyWrite to track habits and _write_, use Google Docs to edit.
- ~~Can't delete tables.~~ Tables are now locked chips — intentionally not deletable/editable in the app; manage them in Google Docs.
- `i` icons probably need more contrast. An entire a11y pass for the themes would probably be good.
- Editor settings menu needs an info bar explaining everything in there doesn't affect the actual doc, just the DailyWrite app.
- Editor walkthrough/tutorial?
- ~~Possible to add "untouchable box" in editor that represents images, preventing accidental image deletion?~~ Done: images and page breaks now render as read-only placeholder chips that delete as a single unit; they occupy one index unit so diff-based saves stay aligned and don't clobber them.
- ~~Fix page break bug weirdness?~~ Addressed alongside the image placeholders above.
- Days Left says 2, but I'd include today as one of the days left. Should read 3.
- "Logged Days" seems to show the current day. We don't really want that, we only want fully completed days.
- Goal Card needs updating when Cheat Days are used.
- Too many tooltips on New Goals?

## License

This project is private and not licensed for public use.

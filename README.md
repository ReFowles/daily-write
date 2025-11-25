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
- **Package Manager**: pnpm (v10.20.0)

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

- Automatically use curly quotes/apostrophies
- How to handle multiple doc tabs
- Check for word count updates/changes from Docs on return to app
- Figure out highlight > delete doesn't affect word count
- Add images to About page
- "Full screen" text editor
- Any final markdown/formatting bugs
  - Spaces at end of line
- Create new document

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

This project is private and not licensed for public use.

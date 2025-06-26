# Development Setup Guide

## Quick Start

To start the entire development environment with both frontend and backend:

```bash
npm run dev
```

This single command will:
- Start Firebase emulators (Functions, Firestore, Auth, Storage, Hosting)
- Start the React development server
- Open the Firebase Emulator UI at http://localhost:4000
- Open the React app at http://localhost:3000

## What's Running

When you run `npm run dev`, the following services start:

| Service | URL | Description |
|---------|-----|-------------|
| React Frontend | http://localhost:3000 | Main application |
| Firebase Functions | http://localhost:5001 | Backend API endpoints |
| Firestore Emulator | http://localhost:8080 | Database |
| Auth Emulator | http://localhost:9099 | Authentication |
| Storage Emulator | http://localhost:9199 | File storage |
| Firebase UI | http://localhost:4000 | Emulator dashboard |

## Individual Commands

If you need to run services separately:

```bash
# Frontend only
npm run dev:frontend-only

# Emulators only
npm run dev:emulators

# Functions only (uses emulators)
npm run dev:functions
```

## Development Data

The emulators will:
- Import existing data from `./emulator-data/` on startup (if it exists)
- Export data to `./emulator-data/` on shutdown
- This preserves your development data between sessions

## Stopping Development

Press `Ctrl+C` to stop all services. The emulator data will be automatically saved.

## Troubleshooting

1. **Port conflicts**: If ports are in use, check `firebase.json` emulators section
2. **Functions not updating**: Functions hot-reload automatically when you save files
3. **Frontend not connecting to emulators**: Check `src/firebase.js` configuration
4. **Missing dependencies**: Run `npm run install:all` to install all workspace dependencies 
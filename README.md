# Emergency Health Card

A QR-based medical ID. A family creates a health profile for a person, prints a card with a QR code, and anyone who scans it in an emergency sees the key medical details instantly, with no login. The family is alerted when the card is scanned.

> **Disclaimer:** This is a demonstration project, not a medical device. It uses fake data only and must not be used for real medical decisions.

## The problem
In an emergency (an accident, a collapse, or a confused elderly person found outside), responders often don't know the person's allergies, conditions, medicines, or who to call. Wallet cards get lost or go out of date, and a locked phone can't be read.

## Features
- Sign up and log in
- Dashboard listing all profiles, with edit, view QR, and download card actions
- Profile form with validation: name, age, blood group, allergies, conditions, medicines, doctor, and up to 3 emergency contacts
- Per-field privacy: the owner chooses which details appear on the public page (name, blood group, and contacts are always shown)
- Public emergency page with large text, blood group and allergies highlighted, and one-tap call buttons
- Printable card with a QR code
- Loading, error, and not-found screens, and a mobile-friendly layout

## Screenshots
| Login | Dashboard |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Profile form | Public emergency page |
|---|---|
| ![Profile form](docs/screenshots/profile-form.png) | ![Emergency page](docs/screenshots/emergency-page.png) |

| Printable card | QR page |
|---|---|
| ![Card](docs/screenshots/card.png) | ![QR](docs/screenshots/qr.png) |

## Tech stack
Next.js (App Router), TypeScript, Tailwind CSS. Backend: Supabase (auth and database), deployed on Vercel.

## Frontend structure
```
app/
  login, signup        sign-in pages
  dashboard            list of profiles
  profile/new          create a profile
  profile/[id]/edit    edit a profile
  qr/[id]              QR view
  card/[id]            printable card
  e/[token]            public emergency page (no login)
components/            ProfileForm, PrintButton, Logo
lib/api.ts             the single data layer (mock now, real APIs later)
docs/api.md            API contract between frontend and backend
```

All data access goes through `lib/api.ts`, so connecting the real backend means changing that one file.

## Running locally
```bash
git clone https://github.com/Hassancoding010/Placement_Project
cd Placement_Project
npm install
npm run dev
```
Open http://localhost:3000.

<!-- Second half (API docs, security notes, deployment) is written by the backend developer. -->
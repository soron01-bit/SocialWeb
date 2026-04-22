# SocialWeb (Node.js + Express)

Simple social/auth app with:
- Signup/signin with JWT
- Friend requests and friends list
- Friends-only text messaging
- Friends feed (posts, likes, comments)
- JSON file storage (`data/*.json`)

## Tech Stack
- Node.js
- Express
- bcryptjs
- jsonwebtoken
- dotenv

## Local Setup
1. Install dependencies:
```bash
npm install
```

2. Create environment file from template:
```bash
cp .env.example .env
```

3. Update `.env` values:
```env
PORT=5000
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRE=7d
NODE_ENV=development
```

4. Run:
```bash
npm run dev
```

Open:
- App: `http://localhost:5000`
- API info: `http://localhost:5000/api`

## Deploy to Render
This repo is prepared for Render using `render.yaml`.

### Option A (Recommended): Blueprint Deploy
1. Push this repo to GitHub.
2. In Render, click **New +** -> **Blueprint**.
3. Select this repository.
4. Render reads `render.yaml` and creates the web service.
5. Set `JWT_SECRET` in Render environment variables (required because `sync: false` means Render will not auto-fill it).
6. Deploy.

### Option B: Manual Web Service
Use these values:
- Environment: `Node`
- Build command: `npm ci`
- Start command: `npm start`
- Env vars:
  - `NODE_ENV=production`
  - `JWT_SECRET=<your_secret>`
  - `JWT_EXPIRE=7d`

## Important for JSON Data on Render
This app stores users/posts/messages in local JSON files under `data/`.
Without a persistent disk, data resets on redeploy/restart.

`render.yaml` already mounts a disk:
- mount path: `/opt/render/project/src/data`
- size: `1GB`

Do not change this mount path unless you also change the app file paths.

## Scripts
- `npm start` -> run production server
- `npm run dev` -> run with nodemon

## Notes
- CORS is currently open (`*`) for simplicity.
- Change `JWT_SECRET` before production usage.

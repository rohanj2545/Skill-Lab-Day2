# My To-Do App — Vue + Node.js backend

## Requirements
- Node.js (LTS recommended)
- Internet connection for the Vue CDN on first page load

## Run it
1. Extract this folder.
2. Open a terminal in the `todo-backend-app` folder.
3. Install packages:
   ```bash
   npm install
   ```
4. Start the backend:
   ```bash
   npm start
   ```
5. Open **http://localhost:3000** in your browser. Do not open `public/index.html` directly.

## Demo login
- Email: `student@example.com`
- Password: `password123`

The backend creates the demo user on first startup and stores a bcrypt password hash in `data.json`.

## API routes
- `POST /api/login` — validates credentials and returns a signed token
- `GET /api/tasks` — lists tasks for the logged-in user
- `POST /api/tasks` — creates a task
- `PUT /api/tasks/:id` — updates task title, priority, or done status
- `DELETE /api/tasks/:id` — deletes one task
- `DELETE /api/tasks` — clears completed tasks
- `GET /api/health` — backend health check

## Notes
- Task data is persisted in `data.json`; this is a simple learning project, not a production database.
- The demo signing secret is for local development only. Set a strong `JWT_SECRET` environment variable before deployment.
- For production, use a proper database, HTTPS, rate limiting, secure token/session storage, and stronger operational safeguards.

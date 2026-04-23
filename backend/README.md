# RentAVehicle Backend

Express + MySQL backend that powers authentication, vehicles, bookings, user verification, and admin overview.

## Run

From repository root:

```bash
npm install
npm start
```

Or from the `backend/` folder:

```bash
cd backend
npm install
npm start
```

Server runs on `http://localhost:3000` and serves frontend static files from repo root.

## MySQL Configuration

Set these environment variables before running:

- `MYSQL_HOST` (default: `127.0.0.1`)
- `MYSQL_PORT` (default: `3306`)
- `MYSQL_USER` (default: `root`)
- `MYSQL_PASSWORD` (default: empty)
- `MYSQL_DATABASE` (default: `rentavehicle`)

The backend will auto-create the configured database if it does not exist.

If you see `Error: Cannot find module 'express'`, dependencies are not installed in your current working directory. Run `npm install` in root (or `backend/`) before starting the server.

## API Overview

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/vehicles?q=&sort=`
- `GET /api/vehicles/:id`
- `POST /api/vehicles`
- `PUT /api/vehicles/:id`
- `DELETE /api/vehicles/:id`
- `GET /api/users`
- `PUT /api/users/:id`
- `POST /api/users/:id/verify`
- `GET /api/bookings?userId=`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/status`
- `GET /api/admin/overview`


## Password Security

- Passwords are stored as salted PBKDF2 hashes (`sha512`, 100,000 iterations).
- Existing legacy plaintext demo passwords are auto-upgraded to hashed format on startup/login.


## Dependency note

- Backend uses `mysql2` to connect to a MySQL server.


## Vehicle images

- Default vehicle images are local SVG files under `assets/images/`, so they render even without internet access when running locally.

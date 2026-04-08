# RentAVehicle Backend

Express + SQLite backend that powers authentication, vehicles, bookings, user verification, and admin overview.

## Run

```bash
npm install
npm start
```

Server runs on `http://localhost:3000` and serves frontend static files from repo root.

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

- Backend uses `sql.js` (WASM SQLite) to avoid native compilation issues on Windows (node-gyp/Visual Studio) and deprecated native prebuild chains.

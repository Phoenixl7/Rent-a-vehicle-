const path = require("path");
const Database = require("better-sqlite3");
const { hashPassword, isHashedPassword } = require("./security");

const dbPath = path.join(__dirname, "rental.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  const info = stmt.run(params);
  return Promise.resolve({ id: Number(info.lastInsertRowid || 0), changes: info.changes });
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  const row = stmt.get(params);
  return Promise.resolve(row);
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = stmt.all(params);
  return Promise.resolve(rows);
}

async function ensureHashedUserPassword(email, plainPassword) {
  const row = await get("SELECT id, password FROM users WHERE email = ?", [email]);
  if (!row) return;
  if (isHashedPassword(row.password)) return;
  if (row.password === plainPassword) {
    await run("UPDATE users SET password = ? WHERE id = ?", [hashPassword(plainPassword), row.id]);
  }
}

async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    verified INTEGER NOT NULL DEFAULT 0,
    license_photo TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price INTEGER NOT NULL,
    image TEXT,
    seats INTEGER,
    fuel TEXT,
    transmission TEXT,
    description TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    vehicle_id INTEGER NOT NULL,
    vehicle_name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment TEXT NOT NULL DEFAULT 'unpaid',
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  )`);

  const admin = await get("SELECT id FROM users WHERE email = ?", ["admin@vehicle.com"]);
  if (!admin) {
    await run(
      "INSERT INTO users(name, email, password, phone, role, verified) VALUES (?, ?, ?, ?, ?, ?)",
      ["Admin", "admin@vehicle.com", hashPassword("admin123"), "+91 10022 23344", "admin", 1]
    );
  }

  const demoUser = await get("SELECT id FROM users WHERE email = ?", ["user@vehicle.com"]);
  if (!demoUser) {
    await run(
      "INSERT INTO users(name, email, password, phone, role, verified) VALUES (?, ?, ?, ?, ?, ?)",
      ["John Rider", "user@vehicle.com", hashPassword("user123"), "+91 33344 45555", "user", 0]
    );
  }

  await ensureHashedUserPassword("admin@vehicle.com", "admin123");
  await ensureHashedUserPassword("user@vehicle.com", "user123");

  const vehicleCount = await get("SELECT COUNT(*) as count FROM vehicles");
  if (!vehicleCount || vehicleCount.count === 0) {
    const seedVehicles = [
      ["Tesla Model Y", "SUV", 8999, "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80", 5, "Electric", "Automatic", "Futuristic electric SUV with long range and autopilot-ready comfort."],
      ["BMW 5 Series", "Sedan", 10999, "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=80", 5, "Hybrid", "Automatic", "Executive sedan blending luxury with dynamic performance."],
      ["Toyota Fortuner", "SUV", 6499, "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80", 7, "Diesel", "Automatic", "Rugged family SUV ideal for city and off-road journeys."],
      ["Mercedes C-Class", "Luxury", 12999, "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80", 5, "Petrol", "Automatic", "Elegant luxury ride with premium cabin and smooth handling."]
    ];

    for (const v of seedVehicles) {
      await run(
        "INSERT INTO vehicles(name, type, price, image, seats, fuel, transmission, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        v
      );
    }
  }
}

module.exports = { db, run, get, all, initDb };

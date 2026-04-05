const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { hashPassword, isHashedPassword } = require("./security");

const dbPath = path.join(__dirname, "rental.db");
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
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
      ["Tesla Model Y", "SUV", 8999, "⚡", 5, "Electric", "Automatic", "Futuristic electric SUV with long range and autopilot-ready comfort."],
      ["BMW 5 Series", "Sedan", 10999, "🚘", 5, "Hybrid", "Automatic", "Executive sedan blending luxury with dynamic performance."],
      ["Toyota Fortuner", "SUV", 6499, "🚙", 7, "Diesel", "Automatic", "Rugged family SUV ideal for city and off-road journeys."],
      ["Mercedes C-Class", "Luxury", 12999, "✨", 5, "Petrol", "Automatic", "Elegant luxury ride with premium cabin and smooth handling."]
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

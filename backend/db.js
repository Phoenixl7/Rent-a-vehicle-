const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const { hashPassword, isHashedPassword } = require("./security");

const dbPath = path.join(__dirname, "rental.db");
let SQL;
let db;

async function ensureDb() {
  if (db) return db;

  SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, "..", "node_modules", "sql.js", "dist", file),
  });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

function persistDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

async function run(sql, params = []) {
  const database = await ensureDb();
  database.run(sql, params);
  const idRow = database.exec("SELECT last_insert_rowid() as id");
  const id = idRow?.[0]?.values?.[0]?.[0] || 0;
  const chRow = database.exec("SELECT changes() as changes");
  const changes = chRow?.[0]?.values?.[0]?.[0] || 0;
  persistDb();
  return { id, changes };
}

async function get(sql, params = []) {
  const database = await ensureDb();
  const stmt = database.prepare(sql, params);
  const hasRow = stmt.step();
  let row;
  if (hasRow) row = stmt.getAsObject();
  stmt.free();
  return row;
}

async function all(sql, params = []) {
  const database = await ensureDb();
  const stmt = database.prepare(sql, params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
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
  await ensureDb();

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
    delivery_state TEXT,
    delivery_district TEXT,
    delivery_pincode TEXT,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment TEXT NOT NULL DEFAULT 'unpaid',
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  )`);

  try { await run("ALTER TABLE bookings ADD COLUMN delivery_state TEXT"); } catch (error) {}
  try { await run("ALTER TABLE bookings ADD COLUMN delivery_district TEXT"); } catch (error) {}
  try { await run("ALTER TABLE bookings ADD COLUMN delivery_pincode TEXT"); } catch (error) {}

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
  if (!vehicleCount || Number(vehicleCount.count) === 0) {
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

module.exports = { run, get, all, initDb };

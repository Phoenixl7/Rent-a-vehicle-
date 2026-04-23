const mysql = require("mysql2/promise");
const { hashPassword, isHashedPassword } = require("./security");

const dbConfig = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "rentavehicle",
};

let pool;

async function ensurePool() {
  if (pool) return pool;

  const bootstrap = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });

  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  await bootstrap.end();

  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

async function run(sql, params = []) {
  const connectionPool = await ensurePool();
  const [result] = await connectionPool.execute(sql, params);
  return {
    id: result.insertId || 0,
    changes: typeof result.affectedRows === "number" ? result.affectedRows : 0,
  };
}

async function get(sql, params = []) {
  const connectionPool = await ensurePool();
  const [rows] = await connectionPool.execute(sql, params);
  return rows[0];
}

async function all(sql, params = []) {
  const connectionPool = await ensurePool();
  const [rows] = await connectionPool.execute(sql, params);
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

async function hasColumn(tableName, columnName) {
  const row = await get(
    `SELECT 1 AS found
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [dbConfig.database, tableName, columnName]
  );
  return Boolean(row);
}

async function ensureColumn(tableName, columnName, alterSql) {
  if (await hasColumn(tableName, columnName)) return;
  await run(alterSql);
}

async function initDb() {
  await ensurePool();

  await run(`CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone VARCHAR(40),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    verified TINYINT(1) NOT NULL DEFAULT 0,
    license_photo LONGTEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await run(`CREATE TABLE IF NOT EXISTS vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(80) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    price INT NOT NULL,
    image TEXT,
    seats INT,
    fuel VARCHAR(40),
    transmission VARCHAR(40),
    description TEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await run(`CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_name VARCHAR(120) NOT NULL,
    vehicle_id INT NOT NULL,
    vehicle_name VARCHAR(120) NOT NULL,
    start_date VARCHAR(40) NOT NULL,
    end_date VARCHAR(40) NOT NULL,
    delivery_time VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    delivery_city VARCHAR(120),
    delivery_state VARCHAR(120),
    delivery_pincode VARCHAR(20),
    total INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await ensureColumn("vehicles", "stock", "ALTER TABLE vehicles ADD COLUMN stock INT NOT NULL DEFAULT 0");
  await ensureColumn("bookings", "delivery_time", "ALTER TABLE bookings ADD COLUMN delivery_time VARCHAR(20)");
  await ensureColumn("bookings", "address_line1", "ALTER TABLE bookings ADD COLUMN address_line1 VARCHAR(255)");
  await ensureColumn("bookings", "address_line2", "ALTER TABLE bookings ADD COLUMN address_line2 VARCHAR(255)");
  await ensureColumn("bookings", "delivery_city", "ALTER TABLE bookings ADD COLUMN delivery_city VARCHAR(120)");
  await ensureColumn("bookings", "delivery_state", "ALTER TABLE bookings ADD COLUMN delivery_state VARCHAR(120)");
  await ensureColumn("bookings", "delivery_pincode", "ALTER TABLE bookings ADD COLUMN delivery_pincode VARCHAR(20)");

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

  const vehicleCount = await get("SELECT COUNT(*) AS count FROM vehicles");
  if (!vehicleCount || Number(vehicleCount.count) === 0) {
    const seedVehicles = [
      ["Tesla Model Y", "SUV", 4, 8999, "assets/images/car-suv.svg", 5, "Electric", "Automatic", "Futuristic electric SUV with long range and autopilot-ready comfort."],
      ["BMW 5 Series", "Sedan", 5, 10999, "assets/images/car-sedan.svg", 5, "Hybrid", "Automatic", "Executive sedan blending luxury with dynamic performance."],
      ["Toyota Fortuner", "SUV", 3, 6499, "assets/images/car-suv.svg", 7, "Diesel", "Automatic", "Rugged family SUV ideal for city and off-road journeys."],
      ["Mercedes C-Class", "Luxury", 2, 12999, "assets/images/car-luxury.svg", 5, "Petrol", "Automatic", "Elegant luxury ride with premium cabin and smooth handling."],
      ["KTM Duke 390", "Bike", 6, 1999, "assets/images/bike-sport.svg", 2, "Petrol", "Manual", "Lightweight sport bike with sharp styling and thrilling performance."],
      ["Honda Activa 6G", "Scooter", 8, 999, "assets/images/bike-scooter.svg", 2, "Petrol", "CVT", "Reliable city scooter with smooth ride quality and excellent mileage."],
      ["Royal Enfield Classic 350", "Bike", 5, 1699, "assets/images/bike-sport.svg", 2, "Petrol", "Manual", "Classic cruiser bike with comfortable ergonomics and iconic road presence."],
      ["TVS Ntorq 125", "Scooter", 7, 1099, "assets/images/bike-scooter.svg", 2, "Petrol", "CVT", "Sporty scooter with agile handling, ideal for city commutes."],
    ];

    for (const v of seedVehicles) {
      await run(
        "INSERT INTO vehicles(name, type, stock, price, image, seats, fuel, transmission, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        v
      );
    }
  }
}

module.exports = { run, get, all, initDb };

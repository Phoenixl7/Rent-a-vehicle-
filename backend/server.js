const path = require("path");
const express = require("express");
const cors = require("cors");
const { run, get, all, initDb } = require("./db");
const { hashPassword, verifyPassword, isHashedPassword } = require("./security");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "..")));

const toUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  verified: Boolean(u.verified),
  licensePhoto: u.license_photo || null,
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user || !verifyPassword(password, user.password)) return res.status(401).json({ message: "Invalid credentials" });

  if (!isHashedPassword(user.password)) {
    const upgraded = hashPassword(password);
    await run("UPDATE users SET password = ? WHERE id = ?", [upgraded, user.id]);
    user.password = upgraded;
  }

  return res.json(toUser(user));
});

app.post("/api/auth/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

  const exists = await get("SELECT id FROM users WHERE email = ?", [email]);
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const result = await run(
    "INSERT INTO users(name, email, phone, password, role, verified) VALUES (?, ?, ?, ?, 'user', 0)",
    [name, email, phone || "", hashPassword(password)]
  );

  const user = await get("SELECT * FROM users WHERE id = ?", [result.id]);
  return res.status(201).json(toUser(user));
});

app.get("/api/vehicles", async (req, res) => {
  const { q = "", sort = "featured" } = req.query;
  let rows = await all("SELECT * FROM vehicles", []);

  const ql = String(q).toLowerCase();
  if (ql) rows = rows.filter((v) => `${v.name} ${v.type} ${v.fuel} ${v.transmission}`.toLowerCase().includes(ql));

  if (sort === "price-asc") rows.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") rows.sort((a, b) => b.price - a.price);
  if (sort === "name-asc") rows.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "name-desc") rows.sort((a, b) => b.name.localeCompare(a.name));

  res.json(rows);
});

app.get("/api/vehicles/:id", async (req, res) => {
  const vehicle = await get("SELECT * FROM vehicles WHERE id = ?", [req.params.id]);
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
  res.json(vehicle);
});

app.post("/api/vehicles", async (req, res) => {
  const { name, type, price, image, seats, fuel, transmission, description } = req.body;
  const result = await run(
    "INSERT INTO vehicles(name, type, price, image, seats, fuel, transmission, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [name, type, price, image || "assets/images/car-default.svg", seats || 5, fuel || "Petrol", transmission || "Automatic", description || ""]
  );
  const row = await get("SELECT * FROM vehicles WHERE id = ?", [result.id]);
  res.status(201).json(row);
});

app.put("/api/vehicles/:id", async (req, res) => {
  const { name, type, price, image, seats, fuel, transmission, description } = req.body;
  await run(
    "UPDATE vehicles SET name=?, type=?, price=?, image=?, seats=?, fuel=?, transmission=?, description=? WHERE id=?",
    [name, type, price, image, seats, fuel, transmission, description, req.params.id]
  );
  const row = await get("SELECT * FROM vehicles WHERE id = ?", [req.params.id]);
  res.json(row);
});

app.delete("/api/vehicles/:id", async (req, res) => {
  await run("DELETE FROM vehicles WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

app.get("/api/users", async (_, res) => {
  const rows = await all("SELECT * FROM users", []);
  res.json(rows.map(toUser));
});

app.put("/api/users/:id", async (req, res) => {
  const { name, phone } = req.body;
  await run("UPDATE users SET name = ?, phone = ? WHERE id = ?", [name, phone || "", req.params.id]);
  const user = await get("SELECT * FROM users WHERE id = ?", [req.params.id]);
  res.json(toUser(user));
});

app.post("/api/users/:id/verify", async (req, res) => {
  const { licensePhoto } = req.body;
  await run("UPDATE users SET verified = 1, license_photo = ? WHERE id = ?", [licensePhoto, req.params.id]);
  const user = await get("SELECT * FROM users WHERE id = ?", [req.params.id]);
  res.json(toUser(user));
});

app.get("/api/bookings", async (req, res) => {
  const { userId } = req.query;
  const rows = userId
    ? await all("SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC", [userId])
    : await all("SELECT * FROM bookings ORDER BY id DESC", []);
  res.json(rows);
});

app.post("/api/bookings", async (req, res) => {
  const { userId, vehicleId, startDate, endDate, addressLine1, addressLine2, deliveryCity, deliveryState, deliveryPincode } = req.body;
  const user = await get("SELECT * FROM users WHERE id = ?", [userId]);
  const vehicle = await get("SELECT * FROM vehicles WHERE id = ?", [vehicleId]);
  if (!user || !vehicle) return res.status(404).json({ message: "User or vehicle not found" });
  if (!user.verified) return res.status(403).json({ message: "User must be verified before booking" });

  if (!/^\d{6}$/.test(String(deliveryPincode || ""))) {
    return res.status(400).json({ message: "Pin code must be exactly 6 digits" });
  }

  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / dayMs));
  const total = days * vehicle.price;

  const result = await run(
    "INSERT INTO bookings(user_id, user_name, vehicle_id, vehicle_name, start_date, end_date, address_line1, address_line2, delivery_city, delivery_state, delivery_pincode, total, status, payment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'paid')",
    [user.id, user.name, vehicle.id, vehicle.name, startDate, endDate, addressLine1 || "", addressLine2 || "", deliveryCity || "", deliveryState || "", deliveryPincode || "", total]
  );

  const booking = await get("SELECT * FROM bookings WHERE id = ?", [result.id]);
  res.status(201).json(booking);
});

app.patch("/api/bookings/:id/status", async (req, res) => {
  const { status } = req.body;
  await run("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id]);
  const booking = await get("SELECT * FROM bookings WHERE id = ?", [req.params.id]);
  res.json(booking);
});

app.get("/api/admin/overview", async (_, res) => {
  const users = await get("SELECT COUNT(*) as count FROM users", []);
  const bookings = await get("SELECT COUNT(*) as count FROM bookings", []);
  const revenue = await get("SELECT COALESCE(SUM(total),0) as total FROM bookings WHERE payment = 'paid'", []);
  res.json({ users: users.count, bookings: bookings.count, revenue: revenue.total });
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`RentAVehicle backend running on http://localhost:${PORT}`);
  });
});

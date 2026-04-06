const storageKeys = {
  users: "vr_users",
  session: "vr_session",
  vehicles: "vr_vehicles",
  bookings: "vr_bookings",
};

const defaultVehicles = [
  { id: "v1", name: "Tesla Model Y", type: "SUV", price: 8999, image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80", seats: 5, fuel: "Electric", transmission: "Automatic", description: "Futuristic electric SUV with long range and autopilot-ready comfort." },
  { id: "v2", name: "BMW 5 Series", type: "Sedan", price: 10999, image: "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=80", seats: 5, fuel: "Hybrid", transmission: "Automatic", description: "Executive sedan blending luxury with dynamic performance." },
  { id: "v3", name: "Toyota Fortuner", type: "SUV", price: 6499, image: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80", seats: 7, fuel: "Diesel", transmission: "Automatic", description: "Rugged family SUV ideal for city and off-road journeys." },
  { id: "v4", name: "Mercedes C-Class", type: "Luxury", price: 12999, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80", seats: 5, fuel: "Petrol", transmission: "Automatic", description: "Elegant luxury ride with premium cabin and smooth handling." },
];

function getData(key, fallback = []) {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function updateUserRecord(userId, patch) {
  const users = getData(storageKeys.users);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return null;
  users[idx] = { ...users[idx], ...patch };
  setData(storageKeys.users, users);

  const session = getSessionUser();
  if (session && session.id === userId) {
    setData(storageKeys.session, users[idx]);
  }
  return users[idx];
}

function initData() {
  const users = getData(storageKeys.users, []);
  if (!users.length) {
    setData(storageKeys.users, [
      { id: "u1", name: "Admin", email: "admin@vehicle.com", password: "admin123", role: "admin", phone: "+91 10022 23344", verified: true, licensePhoto: null },
      { id: "u2", name: "John Rider", email: "user@vehicle.com", password: "user123", role: "user", phone: "+91 33344 45555", verified: false, licensePhoto: null },
    ]);
  }

  if (!localStorage.getItem(storageKeys.vehicles)) {
    setData(storageKeys.vehicles, defaultVehicles);
  }

  if (!localStorage.getItem(storageKeys.bookings)) {
    setData(storageKeys.bookings, []);
  }
}

function getSessionUser() {
  return JSON.parse(localStorage.getItem(storageKeys.session) || "null");
}

function requireAuth(adminOnly = false) {
  const user = getSessionUser();
  if (!user) {
    location.href = "login.html";
    return null;
  }
  if (adminOnly && user.role !== "admin") {
    alert("Admin access only");
    location.href = "index.html";
    return null;
  }
  return user;
}

function bindAuthForms() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const users = getData(storageKeys.users);
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) return alert("Invalid credentials");
      setData(storageKeys.session, user);
      location.href = user.role === "admin" ? "admin.html" : "index.html";
    });
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const phone = document.getElementById("signupPhone").value.trim();
      const password = document.getElementById("signupPassword").value;
      const users = getData(storageKeys.users);
      if (users.some((u) => u.email === email)) return alert("Email already exists");
      const newUser = { id: `u${Date.now()}`, name, email, phone, password, role: "user", verified: false, licensePhoto: null };
      users.push(newUser);
      setData(storageKeys.users, users);
      setData(storageKeys.session, newUser);
      location.href = "my-bookings.html";
    });
  }
}

function logout() {
  localStorage.removeItem(storageKeys.session);
  location.href = "index.html";
}

function bindSessionUi() {
  const user = getSessionUser();
  const slot = document.getElementById("sessionArea");
  if (!slot) return;

  if (!user) {
    slot.innerHTML = `<a href="login.html" class="btn">Login</a>`;
    return;
  }

  if (user.role === "admin") {
    document.querySelectorAll('a[href="my-bookings.html"]').forEach((el) => el.remove());
  }

  slot.innerHTML = `
    <span class="small">Hi, ${user.name}</span>
    <a href="${user.role === "admin" ? "admin.html" : "my-bookings.html"}" class="btn">${user.role === "admin" ? "Admin Panel" : "Dashboard"}</a>
    <button class="btn" id="logoutBtn">Logout</button>
  `;
  document.getElementById("logoutBtn").addEventListener("click", logout);
}

function applyVehicleFilters(vehicles) {
  const searchValue = (document.getElementById("vehicleSearch")?.value || "").trim().toLowerCase();
  const sortValue = document.getElementById("vehicleSort")?.value || "featured";

  let filtered = vehicles.filter((v) => {
    if (!searchValue) return true;
    return [v.name, v.type, v.fuel, v.transmission].join(" ").toLowerCase().includes(searchValue);
  });

  if (sortValue === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sortValue === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sortValue === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sortValue === "name-desc") filtered.sort((a, b) => b.name.localeCompare(a.name));

  return filtered;
}

function renderVehicles() {
  const wrap = document.getElementById("vehicleGrid");
  if (!wrap) return;

  const draw = () => {
    const vehicles = applyVehicleFilters(getData(storageKeys.vehicles));
    wrap.innerHTML = vehicles.length
      ? vehicles.map((v) => `
          <div class="card">
            <img class="vehicle-thumb" src="${v.image}" alt="${v.name}"><h3>${v.name}</h3>
            <p class="small">${v.type} • ${v.seats} seats • ${v.fuel}</p>
            <p>${formatCurrency(v.price)}/day</p>
            <a class="btn btn-primary" href="vehicle-details.html?id=${v.id}">View Details</a>
          </div>
        `).join("")
      : `<div class="card"><p>No vehicles found for your search/filter.</p></div>`;
  };

  document.getElementById("vehicleSearch")?.addEventListener("input", draw);
  document.getElementById("vehicleSort")?.addEventListener("change", draw);
  draw();
}

function getVehicleById(id) {
  return getData(storageKeys.vehicles).find((v) => v.id === id);
}

function renderVehicleDetails() {
  const target = document.getElementById("vehicleDetails");
  if (!target) return;
  const id = new URLSearchParams(location.search).get("id");
  const v = getVehicleById(id);
  if (!v) return (target.innerHTML = "<p>Vehicle not found.</p>");
  localStorage.setItem("vr_selected_vehicle", id);

  target.innerHTML = `
    <div class="card">
      <img class="vehicle-hero" src="${v.image}" alt="${v.name}"><h2>${v.name}</h2>
      <p>${v.description}</p>
      <p><strong>Type:</strong> ${v.type}</p>
      <p><strong>Transmission:</strong> ${v.transmission}</p>
      <p><strong>Seats:</strong> ${v.seats}</p>
      <p><strong>Fuel:</strong> ${v.fuel}</p>
      <h3>${formatCurrency(v.price)}/day</h3>
      <a href="booking.html" class="btn btn-primary">Book Now</a>
    </div>
  `;
}

function bookingPage() {
  const form = document.getElementById("bookingForm");
  if (!form) return;
  const user = requireAuth();
  if (!user) return;

  if (!user.verified) {
    alert("Please verify your account by uploading your driving license in My Bookings dashboard before renting a vehicle.");
    location.href = "my-bookings.html";
    return;
  }

  const selectedId = localStorage.getItem("vr_selected_vehicle") || getData(storageKeys.vehicles)[0].id;
  const vehicle = getVehicleById(selectedId);
  document.getElementById("bookingVehicle").textContent = `${vehicle.name} (${formatCurrency(vehicle.price)}/day)`;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const deliveryState = document.getElementById("deliveryState").value.trim();
    const deliveryDistrict = document.getElementById("deliveryDistrict").value.trim();
    const deliveryPincode = document.getElementById("deliveryPincode").value.trim();
    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));
    const total = days * vehicle.price;

    const draft = {
      id: `b${Date.now()}`,
      userId: user.id,
      userName: user.name,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      startDate,
      endDate,
      deliveryState,
      deliveryDistrict,
      deliveryPincode,
      total,
      status: "pending",
      payment: "unpaid",
    };

    localStorage.setItem("vr_draft_booking", JSON.stringify(draft));
    location.href = "payment.html";
  });
}

function paymentPage() {
  const form = document.getElementById("paymentForm");
  if (!form) return;
  const user = requireAuth();
  if (!user) return;

  const draft = JSON.parse(localStorage.getItem("vr_draft_booking") || "null");
  if (!draft) return (location.href = "vehicles.html");
  document.getElementById("paymentSummary").innerHTML = `${draft.vehicleName}: ${formatCurrency(draft.total)}<br><span class="small">Delivery: ${draft.deliveryDistrict || "N/A"}, ${draft.deliveryState || "N/A"} - ${draft.deliveryPincode || "N/A"}</span>`;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bookings = getData(storageKeys.bookings);
    draft.payment = "paid";
    bookings.push(draft);
    setData(storageKeys.bookings, bookings);
    localStorage.removeItem("vr_draft_booking");
    document.getElementById("paymentBanner").style.display = "block";
    setTimeout(() => (location.href = "my-bookings.html"), 900);
  });
}

function renderVerification(user) {
  const status = document.getElementById("verificationStatus");
  const preview = document.getElementById("licensePreview");
  const uploadWrap = document.getElementById("verificationUploadBlock");
  const uploadForm = document.getElementById("verificationForm");
  if (!status || !preview || !uploadForm || !uploadWrap) return;

  if (user.verified) {
    status.innerHTML = `<span class="status approved">Verified</span> Your account is already verified.`;
    uploadWrap.style.display = "none";
  } else {
    status.innerHTML = `<span class="status cancelled">Not Verified</span> Upload your driving license to verify.`;
    uploadWrap.style.display = "block";
  }

  preview.innerHTML = user.licensePhoto
    ? `<img src="${user.licensePhoto}" alt="Driving License" style="max-width:300px;border-radius:12px;border:1px solid var(--border);"/>`
    : `<p class="small">No license photo uploaded yet.</p>`;

  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const file = document.getElementById("licenseFile").files[0];
    if (!file) return alert("Please choose a driving license photo.");

    const reader = new FileReader();
    reader.onload = () => {
      const updated = updateUserRecord(user.id, {
        licensePhoto: reader.result,
        verified: true,
      });

      if (updated) {
        document.getElementById("verificationBanner").style.display = "block";
        status.innerHTML = `<span class="status approved">Verified</span> Your account is already verified.`;
        uploadWrap.style.display = "none";
        preview.innerHTML = `<img src="${updated.licensePhoto}" alt="Driving License" style="max-width:300px;border-radius:12px;border:1px solid var(--border);"/>`;
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderMyBookings() {
  const table = document.getElementById("myBookingsBody");
  if (!table) return;
  const user = requireAuth();
  if (!user) return;

  renderVerification(user);

  const rows = getData(storageKeys.bookings).filter((b) => b.userId === user.id);
  table.innerHTML = rows.map((b) => `
    <tr>
      <td>${b.vehicleName}</td>
      <td>${b.startDate} → ${b.endDate}</td>
      <td>${(b.deliveryDistrict && b.deliveryState && b.deliveryPincode) ? `${b.deliveryDistrict}, ${b.deliveryState} - ${b.deliveryPincode}` : "N/A"}</td>
      <td>${formatCurrency(b.total)}</td>
      <td><span class="status ${b.status}">${b.status}</span></td>
      <td>${b.payment}</td>
    </tr>
  `).join("") || "<tr><td colspan='6'>No bookings yet.</td></tr>";
}

function profilePage() {
  const form = document.getElementById("profileForm");
  if (!form) return;
  const user = requireAuth();
  if (!user) return;

  document.getElementById("profileName").value = user.name;
  document.getElementById("profileEmail").value = user.email;
  document.getElementById("profilePhone").value = user.phone || "";

  const tag = document.getElementById("profileVerification");
  if (tag) {
    tag.innerHTML = user.verified
      ? `<span class="status approved">Verified</span>`
      : `<span class="status cancelled">Not Verified</span>`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const updated = updateUserRecord(user.id, {
      name: document.getElementById("profileName").value,
      phone: document.getElementById("profilePhone").value,
    });
    if (updated) document.getElementById("profileBanner").style.display = "block";
  });
}

function adminPage() {
  if (!document.getElementById("adminGuard")) return;
  const admin = requireAuth(true);
  if (!admin) return;

  const users = getData(storageKeys.users);
  const vehicles = getData(storageKeys.vehicles);
  const bookings = getData(storageKeys.bookings);
  const revenue = bookings.filter((b) => b.payment === "paid").reduce((s, b) => s + b.total, 0);

  document.getElementById("kpiUsers").textContent = users.length;
  document.getElementById("kpiBookings").textContent = bookings.length;
  document.getElementById("kpiRevenue").textContent = formatCurrency(revenue);

  document.getElementById("vehicleAdminRows").innerHTML = vehicles.map((v) => `
    <tr>
      <td>${v.name}</td>
      <td>${v.type}</td>
      <td>${formatCurrency(v.price)}</td>
      <td>
        <button class="btn" onclick="editVehicle('${v.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteVehicle('${v.id}')">Delete</button>
      </td>
    </tr>
  `).join("");

  document.getElementById("bookingAdminRows").innerHTML = bookings.map((b) => `
    <tr>
      <td>${b.userName}</td>
      <td>${b.vehicleName}</td>
      <td>${(b.deliveryDistrict && b.deliveryState && b.deliveryPincode) ? `${b.deliveryDistrict}, ${b.deliveryState} - ${b.deliveryPincode}` : "N/A"}</td>
      <td>${formatCurrency(b.total)}</td>
      <td><span class="status ${b.status}">${b.status}</span></td>
      <td>
        <button class="btn btn-primary" onclick="updateBooking('${b.id}', 'approved')">Approve</button>
        <button class="btn btn-danger" onclick="updateBooking('${b.id}', 'cancelled')">Cancel</button>
      </td>
    </tr>
  `).join("");

  document.getElementById("userAdminRows").innerHTML = users.map((u) => `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.verified ? '<span class="status approved">Verified</span>' : '<span class="status pending">Unverified</span>'}</td>
    </tr>
  `).join("");

  const vehicleForm = document.getElementById("vehicleForm");
  vehicleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("vehicleId").value || `v${Date.now()}`;
    const payload = {
      id,
      image: document.getElementById("vehicleImage").value || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
      name: document.getElementById("vehicleName").value,
      type: document.getElementById("vehicleType").value,
      price: Number(document.getElementById("vehiclePrice").value),
      seats: Number(document.getElementById("vehicleSeats").value),
      fuel: document.getElementById("vehicleFuel").value,
      transmission: document.getElementById("vehicleTransmission").value,
      description: document.getElementById("vehicleDescription").value,
    };

    const list = getData(storageKeys.vehicles);
    const idx = list.findIndex((v) => v.id === id);
    if (idx >= 0) list[idx] = payload; else list.push(payload);
    setData(storageKeys.vehicles, list);
    location.reload();
  });
}

function editVehicle(id) {
  const v = getVehicleById(id);
  if (!v) return;
  document.getElementById("vehicleId").value = v.id;
  document.getElementById("vehicleImage").value = v.image;
  document.getElementById("vehicleName").value = v.name;
  document.getElementById("vehicleType").value = v.type;
  document.getElementById("vehiclePrice").value = v.price;
  document.getElementById("vehicleSeats").value = v.seats;
  document.getElementById("vehicleFuel").value = v.fuel;
  document.getElementById("vehicleTransmission").value = v.transmission;
  document.getElementById("vehicleDescription").value = v.description;
}

function deleteVehicle(id) {
  const list = getData(storageKeys.vehicles).filter((v) => v.id !== id);
  setData(storageKeys.vehicles, list);
  location.reload();
}

function updateBooking(id, status) {
  const bookings = getData(storageKeys.bookings);
  const i = bookings.findIndex((b) => b.id === id);
  bookings[i].status = status;
  setData(storageKeys.bookings, bookings);
  location.reload();
}

initData();
bindAuthForms();
bindSessionUi();
renderVehicles();
renderVehicleDetails();
bookingPage();
paymentPage();
renderMyBookings();
profilePage();
adminPage();

window.logout = logout;
window.editVehicle = editVehicle;
window.deleteVehicle = deleteVehicle;
window.updateBooking = updateBooking;

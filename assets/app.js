const storageKeys = {
  users: "vr_users",
  session: "vr_session",
  vehicles: "vr_vehicles",
  bookings: "vr_bookings",
};

const defaultVehicles = [
  { id: "v1", name: "Tesla Model Y", type: "SUV", price: 8999, image: "assets/images/car-suv.svg", seats: 5, fuel: "Electric", transmission: "Automatic", description: "Futuristic electric SUV with long range and autopilot-ready comfort.", stock: 4 },
  { id: "v2", name: "BMW 5 Series", type: "Sedan", price: 10999, image: "assets/images/car-sedan.svg", seats: 5, fuel: "Hybrid", transmission: "Automatic", description: "Executive sedan blending luxury with dynamic performance.", stock: 5 },
  { id: "v3", name: "Toyota Fortuner", type: "SUV", price: 6499, image: "assets/images/car-suv.svg", seats: 7, fuel: "Diesel", transmission: "Automatic", description: "Rugged family SUV ideal for city and off-road journeys.", stock: 3 },
  { id: "v4", name: "Mercedes C-Class", type: "Luxury", price: 12999, image: "assets/images/car-luxury.svg", seats: 5, fuel: "Petrol", transmission: "Automatic", description: "Elegant luxury ride with premium cabin and smooth handling.", stock: 2 },

  { id: "v5", name: "KTM Duke 390", type: "Bike", price: 1999, image: "assets/images/bike-sport.svg", seats: 2, fuel: "Petrol", transmission: "Manual", description: "Lightweight sport bike with sharp styling and thrilling performance.", stock: 6 },
  { id: "v6", name: "Honda Activa 6G", type: "Scooter", price: 999, image: "assets/images/bike-scooter.svg", seats: 2, fuel: "Petrol", transmission: "CVT", description: "Reliable city scooter with smooth ride quality and excellent mileage.", stock: 8 },
  { id: "v7", name: "Royal Enfield Classic 350", type: "Bike", price: 1699, image: "assets/images/bike-sport.svg", seats: 2, fuel: "Petrol", transmission: "Manual", description: "Classic cruiser bike with comfortable ergonomics and iconic road presence.", stock: 5 },
  { id: "v8", name: "TVS Ntorq 125", type: "Scooter", price: 1099, image: "assets/images/bike-scooter.svg", seats: 2, fuel: "Petrol", transmission: "CVT", description: "Sporty scooter with agile handling, ideal for city commutes.", stock: 7 },
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


function getVehicleImages(vehicle) {
  if (Array.isArray(vehicle.images) && vehicle.images.length) return vehicle.images;
  if (vehicle.image) return [vehicle.image];
  return ["assets/images/car-default.svg"];
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
      { id: "u1", name: "Admin", email: "admin@vehicle.com", password: "admin123", role: "admin", phone: "+91 10022 23344", verified: true, verificationStatus: "verified", licensePhoto: null, idProof: null, userPhoto: null },
      { id: "u2", name: "John Rider", email: "user@vehicle.com", password: "user123", role: "user", phone: "+91 33344 45555", verified: false, verificationStatus: "unverified", licensePhoto: null, idProof: null, userPhoto: null },
    ]);
  }

  if (!localStorage.getItem(storageKeys.vehicles)) {
    setData(storageKeys.vehicles, defaultVehicles);
  } else {
    const existingVehicles = getData(storageKeys.vehicles, []);
    const existingIds = new Set(existingVehicles.map((v) => v.id));
    const missingDefaults = defaultVehicles.filter((v) => !existingIds.has(v.id));
    if (missingDefaults.length) {
      setData(storageKeys.vehicles, [...existingVehicles, ...missingDefaults]);
    }
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
      const newUser = { id: `u${Date.now()}`, name, email, phone, password, role: "user", verified: false, verificationStatus: "unverified", licensePhoto: null, idProof: null, userPhoto: null };
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

  slot.innerHTML = user.role === "admin"
    ? `
      <span class="small">Hi, ${user.name}</span>
      <a href="profile.html" class="btn">Profile</a>
      <a href="admin.html" class="btn">Admin Panel</a>
      <button class="btn" id="logoutBtn">Logout</button>
    `
    : `
      <span class="small">Hi, ${user.name}</span>
      <a href="profile.html" class="btn">Profile</a>
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
  const twoWheelerTypes = new Set(["bike", "scooter", "motorcycle"]);
  const vehicleCard = (v) => {
    const isOutOfStock = (v.stock ?? 0) <= 0;
    return `
      <div class="card">
        <img class="vehicle-thumb" src="${getVehicleImages(v)[0]}" alt="${v.name}" onerror="this.src='assets/images/car-default.svg'"><h3>${v.name}</h3>
        <p class="small">${v.type} • ${v.seats} seats • ${v.fuel}</p><p class="small">Stock: ${v.stock ?? 0} ${isOutOfStock ? '<span class="status cancelled">Unavailable</span>' : ""}</p>
        <p>${formatCurrency(v.price)}/day</p>
        <a class="btn ${isOutOfStock ? "" : "btn-primary"}" href="vehicle-details.html?id=${v.id}">View Details</a>
      </div>
    `;
  };

  const draw = () => {
    const vehicles = applyVehicleFilters(getData(storageKeys.vehicles));
    const twoWheelers = vehicles.filter((v) => twoWheelerTypes.has((v.type || "").toLowerCase()));
    const fourWheelers = vehicles.filter((v) => !twoWheelerTypes.has((v.type || "").toLowerCase()));

    if (!vehicles.length) {
      wrap.innerHTML = `<div class="card"><p>No vehicles found for your search/filter.</p></div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="vehicle-category">
        <h3>Four Wheelers</h3>
        <div class="grid grid-3">
          ${fourWheelers.length ? fourWheelers.map(vehicleCard).join("") : `<div class="card"><p>No four wheelers available.</p></div>`}
        </div>
      </div>
      <div class="vehicle-category">
        <h3>Two Wheelers</h3>
        <div class="grid grid-3">
          ${twoWheelers.length ? twoWheelers.map(vehicleCard).join("") : `<div class="card"><p>No two wheelers available.</p></div>`}
        </div>
      </div>
    `;
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
  const sessionUser = getSessionUser();
  const isAdminUser = sessionUser?.role === "admin";

  target.innerHTML = `
    <div class="card">
      ${getVehicleImages(v).map((img)=>`<img class="vehicle-hero vehicle-zoomable" src="${img}" alt="${v.name}" onclick="openImagePreview('${img}')" onerror="this.src='assets/images/car-default.svg'">`).join("")}<h2>${v.name}</h2>
      <p>${v.description}</p>
      <p><strong>Type:</strong> ${v.type}</p>
      <p><strong>Transmission:</strong> ${v.transmission}</p>
      <p><strong>Seats:</strong> ${v.seats}</p>
      <p><strong>Fuel:</strong> ${v.fuel}</p><p><strong>Stock:</strong> ${v.stock ?? 0} ${((v.stock ?? 0) <= 0) ? '<span class="status cancelled">Unavailable</span>' : ""}</p>
      <h3>${formatCurrency(v.price)}/day</h3>
      ${isAdminUser
        ? `<button class="btn" disabled>Admin accounts cannot book vehicles</button>`
        : ((v.stock ?? 0) <= 0)
        ? `<button class="btn btn-danger" disabled>Currently Unavailable</button>`
        : `<a href="booking.html" class="btn btn-primary">Book Now</a>`
      }
    </div>
  `;

  ensureImagePreviewModal();
}

function ensureImagePreviewModal() {
  if (document.getElementById("imagePreviewModal")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <div id="imagePreviewModal" class="image-preview-overlay" style="display:none;" onclick="closeImagePreview(event)">
      <button class="image-preview-close" onclick="closeImagePreview(event)" aria-label="Close image preview">✕</button>
      <img id="imagePreviewTarget" class="image-preview-image" src="" alt="Vehicle preview">
    </div>
  `);
}

function openImagePreview(src) {
  ensureImagePreviewModal();
  const modal = document.getElementById("imagePreviewModal");
  const target = document.getElementById("imagePreviewTarget");
  if (!modal || !target) return;
  target.src = src;
  modal.style.display = "flex";
}

function closeImagePreview(event) {
  if (event) event.preventDefault();
  const modal = document.getElementById("imagePreviewModal");
  if (!modal) return;
  if (event && event.target && event.target.id !== "imagePreviewModal" && !event.target.classList.contains("image-preview-close")) return;
  modal.style.display = "none";
}

function bookingPage() {
  const form = document.getElementById("bookingForm");
  if (!form) return;
  const user = requireAuth();
  if (!user) return;
  if (user.role === "admin") {
    alert("Admin accounts cannot book vehicles.");
    location.href = "vehicles.html";
    return;
  }

  if (!user.verified) {
    alert("Please verify your account by uploading your driving license in My Bookings dashboard before renting a vehicle.");
    location.href = "my-bookings.html";
    return;
  }

  const selectedId = localStorage.getItem("vr_selected_vehicle") || getData(storageKeys.vehicles)[0].id;
  const vehicle = getVehicleById(selectedId);
  if ((vehicle.stock ?? 0) <= 0) {
    alert("This vehicle is out of stock right now.");
    location.href = "vehicles.html";
    return;
  }
  document.getElementById("bookingVehicle").textContent = `${vehicle.name} (${formatCurrency(vehicle.price)}/day) - Stock: ${vehicle.stock ?? 0}`;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const deliveryTime = document.getElementById("deliveryTime").value;
    const addressLine1 = document.getElementById("addressLine1").value.trim();
    const addressLine2 = document.getElementById("addressLine2").value.trim();
    const deliveryCity = document.getElementById("deliveryCity").value.trim();
    const deliveryState = document.getElementById("deliveryState").value.trim();
    const deliveryPincode = document.getElementById("deliveryPincode").value.trim();

    if (!/^\d{6}$/.test(deliveryPincode)) {
      return alert("Pin code must be exactly 6 digits.");
    }
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
      deliveryTime,
      addressLine1,
      addressLine2,
      deliveryCity,
      deliveryState,
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
  if (user.role === "admin") {
    alert("Admin accounts cannot complete payments for bookings.");
    location.href = "vehicles.html";
    return;
  }

  const draft = JSON.parse(localStorage.getItem("vr_draft_booking") || "null");
  if (!draft) return (location.href = "vehicles.html");
  document.getElementById("paymentSummary").innerHTML = `${draft.vehicleName}: ${formatCurrency(draft.total)}<br><span class="small">Delivery: ${draft.addressLine1 || ""}, ${draft.addressLine2 || ""}, ${draft.deliveryCity || ""}, ${draft.deliveryState || ""} - ${draft.deliveryPincode || "N/A"}<br><span class="small">Delivery Time: ${draft.deliveryTime || "N/A"}</span></span>`;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bookings = getData(storageKeys.bookings);
    draft.payment = "paid";
    bookings.push(draft);
    setData(storageKeys.bookings, bookings);

    const vehicles = getData(storageKeys.vehicles);
    const vIdx = vehicles.findIndex((v) => v.id === draft.vehicleId);
    if (vIdx >= 0) {
      vehicles[vIdx].stock = Math.max(0, (vehicles[vIdx].stock ?? 0) - 1);
      setData(storageKeys.vehicles, vehicles);
    }
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

  if (user.verificationStatus === "verified") {
    status.innerHTML = `<span class="status approved">Verified</span> Your account is approved by admin.`;
    uploadWrap.style.display = "none";
  } else if (user.verificationStatus === "pending") {
    status.innerHTML = `<span class="status pending">Pending</span> Waiting for admin approval.`;
    uploadWrap.style.display = "none";
  } else {
    status.innerHTML = `<span class="status cancelled">Not Verified</span> Upload your driving license for admin approval.`;
    uploadWrap.style.display = "block";
  }

  preview.innerHTML = user.verificationStatus === "verified"
    ? `<p class="small">Driving license is approved and hidden for privacy.</p>`
    : user.verificationStatus === "pending"
      ? `<p class="small">Verification documents uploaded. Waiting for admin approval.</p>`
      : `<p class="small">No license photo uploaded yet.</p>`;

  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const licenseFile = document.getElementById("licenseFile").files[0];
    const idProofFile = document.getElementById("idProofFile").files[0];
    const userPhotoFile = document.getElementById("userPhotoFile").files[0];

    if (!licenseFile || !idProofFile || !userPhotoFile) {
      return alert("Please upload driving license, passport/aadhaar, and your photo.");
    }

    const readFile = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    Promise.all([readFile(licenseFile), readFile(idProofFile), readFile(userPhotoFile)]).then(([licenseData, idProofData, userPhotoData]) => {
      const updated = updateUserRecord(user.id, {
        licensePhoto: licenseData,
        idProof: idProofData,
        userPhoto: userPhotoData,
        verified: false,
        verificationStatus: "pending",
      });

      if (updated) {
        document.getElementById("verificationBanner").style.display = "block";
        status.innerHTML = `<span class="status pending">Pending</span> Waiting for admin approval.`;
        uploadWrap.style.display = "none";
        preview.innerHTML = `<p class="small">Verification documents uploaded. Waiting for admin approval.</p>`;
      }
    });
  });
}


function getPickupDateTime(startDate, deliveryTime) {
  const time = deliveryTime || "00:00";
  return new Date(`${startDate}T${time}:00`);
}

function getCancellationPolicy(booking) {
  const pickup = getPickupDateTime(booking.startDate, booking.deliveryTime);
  const now = new Date();
  const hoursBeforePickup = (pickup - now) / (1000 * 60 * 60);

  if (hoursBeforePickup <= 0) {
    return { allowed: false, refund: 0, message: "After pickup time → cancellation not allowed" };
  }
  if (hoursBeforePickup > 48) {
    return { allowed: true, refund: booking.total, message: "Full refund" };
  }
  if (hoursBeforePickup >= 24) {
    return { allowed: true, refund: Math.round(booking.total * 0.5), message: "50% refund" };
  }
  return { allowed: true, refund: 0, message: "No refund" };
}

function cancelBooking(bookingId) {
  const bookings = getData(storageKeys.bookings);
  const i = bookings.findIndex((b) => b.id === bookingId);
  if (i < 0) return;

  const booking = bookings[i];
  const policy = getCancellationPolicy(booking);
  if (!policy.allowed) {
    return alert("Cancellation is not allowed after pickup time.");
  }

  bookings[i].status = "cancelled";
  bookings[i].refundAmount = policy.refund;
  bookings[i].refundPolicy = policy.message;

  const vehicles = getData(storageKeys.vehicles);
  const vIdx = vehicles.findIndex((v) => v.id === booking.vehicleId);
  if (vIdx >= 0) {
    vehicles[vIdx].stock = (vehicles[vIdx].stock ?? 0) + 1;
    setData(storageKeys.vehicles, vehicles);
  }

  setData(storageKeys.bookings, bookings);
  alert(`Booking cancelled. Refund: ${formatCurrency(policy.refund)} (${policy.message})`);
  renderMyBookings();
}

function renderMyBookings() {
  const table = document.getElementById("myBookingsBody");
  if (!table) return;
  const user = requireAuth();
  if (!user) return;

  renderVerification(user);

  const rows = getData(storageKeys.bookings).filter((b) => b.userId === user.id);
  table.innerHTML = rows.map((b) => {
    const policy = getCancellationPolicy(b);
    const canCancel = b.status !== "cancelled" && policy.allowed;
    const canReportDamage = b.status === "delivered";
    const reports = Array.isArray(b.damageReports) ? b.damageReports : [];
    const refundText = b.status === "cancelled"
      ? `${formatCurrency(b.refundAmount || 0)} (${b.refundPolicy || ""})`
      : policy.allowed
        ? `${formatCurrency(policy.refund)} (${policy.message})`
        : "N/A";
    const reportSummary = reports.length
      ? `${reports.length} report${reports.length > 1 ? "s" : ""}`
      : "No reports";
    const reportItems = reports.length
      ? `<div class="damage-report-list">${reports.map((r) => `
          <div class="damage-report-item">
            <p><strong>${r.createdAt || "Reported"}</strong></p>
            <p>${r.description}</p>
            <div class="damage-report-images">
              ${(r.images || []).map((img, idx) => `<a href="${img}" target="_blank" rel="noopener noreferrer">Image ${idx + 1}</a>`).join("")}
            </div>
          </div>
        `).join("")}</div>`
      : "";

    return `
      <tr>
        <td>${b.vehicleName}</td>
        <td>${b.startDate} ${b.deliveryTime ? `(${b.deliveryTime})` : ""} → ${b.endDate}</td>
        <td>${(b.addressLine1 && b.addressLine2 && b.deliveryCity && b.deliveryState && b.deliveryPincode) ? `${b.addressLine1}, ${b.addressLine2}, ${b.deliveryCity}, ${b.deliveryState} - ${b.deliveryPincode}` : "N/A"}</td>
        <td>${formatCurrency(b.total)}</td>
        <td><span class="status ${b.status}">${b.status}</span></td>
        <td>${b.payment}</td>
        <td>${refundText}</td>
        <td>${reportSummary}</td>
        <td>
          ${(canCancel || canReportDamage) ? `
            <div class="booking-actions">
              ${canCancel ? `<button class="btn btn-danger" onclick="cancelBooking('${b.id}')">Cancel</button>` : ""}
              ${canReportDamage ? `<button class="btn" onclick="toggleDamageReportForm('${b.id}')">Report Damage/Accident</button>` : ""}
            </div>
          ` : "-"}
          ${canReportDamage ? `
            <form id="damageForm-${b.id}" class="damage-form" style="display:none;" onsubmit="submitDamageReport(event, '${b.id}')">
              <label>Describe damage/accident</label>
              <textarea required name="description" placeholder="Explain what happened and list visible damage"></textarea>
              <label>Upload photos (multiple)</label>
              <input required name="images" type="file" accept="image/*" multiple>
              <button class="btn btn-primary" type="submit">Submit Report</button>
            </form>
            ${reportItems}
          ` : ""}
        </td>
      </tr>
    `;
  }).join("") || "<tr><td colspan='9'>No bookings yet.</td></tr>";
}

function toggleDamageReportForm(bookingId) {
  const form = document.getElementById(`damageForm-${bookingId}`);
  if (!form) return;
  form.style.display = form.style.display === "none" ? "block" : "none";
}

function submitDamageReport(event, bookingId) {
  event.preventDefault();
  const form = event.target;
  const description = form.description.value.trim();
  const files = Array.from(form.images.files || []);
  if (!description) return alert("Please add a damage description.");
  if (!files.length) return alert("Please upload at least one image.");

  const readers = files.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  }));

  Promise.all(readers).then((images) => {
    const bookings = getData(storageKeys.bookings);
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx < 0) return;
    const report = {
      id: `dr_${Date.now()}`,
      description,
      images,
      createdAt: new Date().toLocaleString(),
    };
    const current = Array.isArray(bookings[idx].damageReports) ? bookings[idx].damageReports : [];
    bookings[idx].damageReports = [report, ...current];
    setData(storageKeys.bookings, bookings);
    alert("Damage/accident report submitted successfully.");
    renderMyBookings();
  });
}

function profilePage() {
  const nameText = document.getElementById("profileNameText");
  const emailText = document.getElementById("profileEmailText");
  const phoneText = document.getElementById("profilePhoneText");
  if (!nameText || !emailText || !phoneText) return;
  const user = requireAuth();
  if (!user) return;

  nameText.textContent = user.name;
  emailText.textContent = user.email;
  phoneText.textContent = user.phone || "-";
}

function updateProfilePage() {
  const form = document.getElementById("updateProfileForm");
  if (!form) return;
  const user = requireAuth();
  if (!user) return;

  document.getElementById("updateProfileName").value = user.name;
  document.getElementById("updateProfileEmail").value = user.email;
  document.getElementById("updateProfilePhone").value = user.phone || "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const confirmPassword = document.getElementById("updateProfileConfirmPassword").value;
    if (confirmPassword !== user.password) {
      return alert("Current password is required to confirm profile update.");
    }
    const updated = updateUserRecord(user.id, {
      name: document.getElementById("updateProfileName").value,
      phone: document.getElementById("updateProfilePhone").value,
    });
    if (updated) {
      document.getElementById("updateProfileBanner").style.display = "block";
      document.getElementById("updateProfileConfirmPassword").value = "";
    }
  });
}

function changePasswordPage() {
  const form = document.getElementById("changePasswordForm");
  if (!form) return;
  const user = requireAuth();
  if (!user) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("changeCurrentPassword").value;
    const newPassword = document.getElementById("changeNewPassword").value;
    const confirmPassword = document.getElementById("changeConfirmPassword").value;

    if (currentPassword !== user.password) {
      return alert("Current password is incorrect.");
    }
    if (newPassword.length < 6) {
      return alert("New password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return alert("New password and confirm password do not match.");
    }
    if (newPassword === currentPassword) {
      return alert("New password must be different from current password.");
    }

    const updated = updateUserRecord(user.id, { password: newPassword });
    if (updated) {
      form.reset();
      const banner = document.getElementById("changePasswordBanner");
      if (banner) banner.style.display = "block";
    }
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
      <td>${v.stock ?? 0}</td>
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
      <td>${(b.addressLine1 && b.addressLine2 && b.deliveryCity && b.deliveryState && b.deliveryPincode) ? `${b.addressLine1}, ${b.addressLine2}, ${b.deliveryCity}, ${b.deliveryState} - ${b.deliveryPincode}` : "N/A"}</td>
      <td>${formatCurrency(b.total)}</td>
      <td><span class="status ${b.status}">${b.status}</span></td>
      <td>
        ${(Array.isArray(b.damageReports) && b.damageReports.length)
          ? `<a class="btn" href="damage-reports.html?bookingId=${b.id}">View (${b.damageReports.length})</a>`
          : "No reports"}
      </td>
      <td>
        <button class="btn btn-primary" onclick="updateBooking('${b.id}', 'approved')">Approve</button>
        <button class="btn" onclick="updateBooking('${b.id}', 'delivered')">Mark Delivered</button>
        <button class="btn btn-danger" onclick="updateBooking('${b.id}', 'cancelled')">Cancel</button>
      </td>
    </tr>
  `).join("");

  document.getElementById("userAdminRows").innerHTML = users.map((u) => {
    const statusBadge = u.verificationStatus === "verified"
      ? '<span class="status approved">Verified</span>'
      : u.verificationStatus === "pending"
        ? '<span class="status pending">Pending</span>'
        : '<span class="status cancelled">Unverified</span>';

    const licenseCell = u.licensePhoto && u.idProof && u.userPhoto
      ? `<button class="btn" onclick="viewLicense('${u.id}')">License</button> <button class="btn" onclick="viewIdProof('${u.id}')">Passport/Aadhaar</button> <button class="btn" onclick="viewUserPhoto('${u.id}')">User Photo</button>`
      : 'Not Uploaded';

    const action = u.verificationStatus === "pending"
      ? `<button class="btn btn-primary" onclick="setUserVerification('${u.id}', 'verified')">Approve</button> <button class="btn btn-danger" onclick="setUserVerification('${u.id}', 'unverified')">Reject</button>`
      : "-";

    return `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${statusBadge}</td>
        <td>${licenseCell}</td>
        <td>${action}</td>
      </tr>
    `;
  }).join("");

  const vehicleForm = document.getElementById("vehicleForm");
  resetVehicleImageEditor();
  vehicleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("vehicleId").value || `v${Date.now()}`;
    const existingImage = document.getElementById("vehicleImageExisting").value;
    const imageFile = document.getElementById("vehicleImageFile").files.length > 0;

    const saveVehicle = (imageDataList) => {
      const existingImages = existingImage ? JSON.parse(existingImage) : [];
      const finalImages = (imageDataList && imageDataList.length ? imageDataList : existingImages);

      const payload = {
        id,
        image: finalImages[0] || "assets/images/car-default.svg",
        images: finalImages,
        name: document.getElementById("vehicleName").value,
        type: document.getElementById("vehicleType").value,
        stock: Number(document.getElementById("vehicleStock").value),
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
      resetVehicleImageEditor();
      location.reload();
    };

    if (imageFile) {
      const files = Array.from(document.getElementById("vehicleImageFile").files || []);
      const images = [];
      let processed = 0;
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          images.push(reader.result);
          processed += 1;
          if (processed === files.length) saveVehicle(images);
        };
        reader.readAsDataURL(file);
      });
    } else {
      saveVehicle([]);
    }
  });
}

function resetVehicleImageEditor() {
  const hidden = document.getElementById("vehicleImageExisting");
  const preview = document.getElementById("vehicleImagePreview");
  const fileInput = document.getElementById("vehicleImageFile");
  if (hidden) hidden.value = "[]";
  if (preview) preview.innerHTML = "";
  if (fileInput) fileInput.value = "";
}

function renderVehicleImageEditor(images = [], vehicleName = "Vehicle") {
  const hidden = document.getElementById("vehicleImageExisting");
  const preview = document.getElementById("vehicleImagePreview");
  if (!hidden || !preview) return;
  hidden.value = JSON.stringify(images);
  if (!images.length) {
    preview.innerHTML = `<span class="small">No images selected.</span>`;
    return;
  }
  preview.innerHTML = images.map((img, idx) => `
    <div class="vehicle-image-edit-item">
      <img src="${img}" alt="${vehicleName}" class="vehicle-thumb" style="max-width:220px;height:120px;margin-right:8px;" onerror="this.src='assets/images/car-default.svg'"/>
      <button type="button" class="btn btn-danger" onclick="removeVehicleImage(${idx})">Remove</button>
    </div>
  `).join("") + `<div><button type="button" class="btn" onclick="clearVehicleImages()">Remove All Images</button></div>`;
}

function removeVehicleImage(index) {
  const hidden = document.getElementById("vehicleImageExisting");
  if (!hidden) return;
  const current = hidden.value ? JSON.parse(hidden.value) : [];
  const next = current.filter((_, idx) => idx !== index);
  renderVehicleImageEditor(next);
}

function clearVehicleImages() {
  renderVehicleImageEditor([]);
}



function viewLicense(userId) {
  const users = getData(storageKeys.users);
  const user = users.find((u) => u.id === userId);
  if (!user || !user.licensePhoto) return alert("No license uploaded for this user.");

  const win = window.open("", "_blank");
  if (!win) return alert("Popup blocked. Please allow popups to view license.");
  win.document.write(`<title>Driving License - ${user.name}</title><div style="font-family:sans-serif;padding:16px;"><h3>${user.name} - Driving License</h3><img src="${user.licensePhoto}" alt="Driving License" style="max-width:100%;height:auto;border:1px solid #ddd;border-radius:8px;"/></div>`);
  win.document.close();
}


function viewIdProof(userId) {
  const users = getData(storageKeys.users);
  const user = users.find((u) => u.id === userId);
  if (!user || !user.idProof) return alert("No passport/aadhaar uploaded for this user.");

  const win = window.open("", "_blank");
  if (!win) return alert("Popup blocked. Please allow popups to view document.");
  win.document.write(`<title>ID Proof - ${user.name}</title><div style="font-family:sans-serif;padding:16px;"><h3>${user.name} - Passport/Aadhaar</h3><iframe src="${user.idProof}" style="width:100%;height:90vh;border:1px solid #ddd;"></iframe></div>`);
  win.document.close();
}

function viewUserPhoto(userId) {
  const users = getData(storageKeys.users);
  const user = users.find((u) => u.id === userId);
  if (!user || !user.userPhoto) return alert("No user photo uploaded for this user.");

  const win = window.open("", "_blank");
  if (!win) return alert("Popup blocked. Please allow popups to view user photo.");
  win.document.write(`<title>User Photo - ${user.name}</title><div style="font-family:sans-serif;padding:16px;"><h3>${user.name} - User Photo</h3><img src="${user.userPhoto}" alt="User Photo" style="max-width:100%;height:auto;border:1px solid #ddd;border-radius:8px;"/></div>`);
  win.document.close();
}

function setUserVerification(userId, status) {
  const users = getData(storageKeys.users);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return;

  users[idx].verificationStatus = status;
  users[idx].verified = status === "verified";
  setData(storageKeys.users, users);

  const session = getSessionUser();
  if (session && session.id === userId) {
    setData(storageKeys.session, users[idx]);
  }
  location.reload();
}

function editVehicle(id) {
  const v = getVehicleById(id);
  if (!v) return;
  document.getElementById("vehicleId").value = v.id;
  const existingImages = getVehicleImages(v);
  renderVehicleImageEditor(existingImages, v.name);
  document.getElementById("vehicleName").value = v.name;
  document.getElementById("vehicleType").value = v.type;
  document.getElementById("vehicleStock").value = v.stock ?? 0;
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

function viewDamageReports(bookingId) {
  const bookings = getData(storageKeys.bookings);
  const booking = bookings.find((b) => b.id === bookingId);
  const reports = booking && Array.isArray(booking.damageReports) ? booking.damageReports : [];
  if (!reports.length) return alert("No damage reports available for this booking.");

  const win = window.open("", "_blank");
  if (!win) return alert("Popup blocked. Please allow popups to view damage reports.");

  const reportMarkup = reports.map((r, index) => `
    <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin-bottom:12px;">
      <h4 style="margin:0 0 8px;">Report ${reports.length - index} - ${r.createdAt || "N/A"}</h4>
      <p style="margin:0 0 10px;">${r.description}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${(r.images || []).map((img, idx) => `<a href="${img}" target="_blank" rel="noopener noreferrer" style="padding:6px 10px;border:1px solid #ddd;border-radius:8px;text-decoration:none;">Image ${idx + 1}</a>`).join("")}
      </div>
    </div>
  `).join("");

  win.document.write(`<title>Damage Reports - ${booking.vehicleName}</title><div style="font-family:sans-serif;padding:16px;"><h2 style="margin-top:0;">Damage Reports</h2><p><strong>Booking:</strong> ${booking.vehicleName} (${booking.userName})</p>${reportMarkup}</div>`);
  win.document.close();
}

function damageReportsPage() {
  const container = document.getElementById("damageReportsContent");
  if (!container) return;
  const admin = requireAuth(true);
  if (!admin) return;

  const bookingId = new URLSearchParams(location.search).get("bookingId");
  const bookings = getData(storageKeys.bookings);
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    container.innerHTML = `<div class="card"><p>Booking not found.</p></div>`;
    return;
  }

  const reports = Array.isArray(booking.damageReports) ? booking.damageReports : [];
  container.innerHTML = `
    <div class="card">
      <h3>Damage Reports</h3>
      <p class="small"><strong>Booking:</strong> ${booking.vehicleName} · ${booking.userName}</p>
      ${reports.length
        ? reports.map((r, idx) => `
          <div class="damage-report-item">
            <p><strong>Report ${reports.length - idx}</strong> · ${r.createdAt || "N/A"}</p>
            <p>${r.description}</p>
            <div class="damage-report-images">
              ${(r.images || []).map((img, i) => `<a class="btn" href="${img}" target="_blank" rel="noopener noreferrer">Image ${i + 1}</a>`).join("")}
            </div>
          </div>
        `).join("")
        : "<p>No damage reports available for this booking.</p>"}
    </div>
  `;
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
updateProfilePage();
changePasswordPage();
damageReportsPage();
adminPage();

window.logout = logout;
window.editVehicle = editVehicle;
window.deleteVehicle = deleteVehicle;
window.updateBooking = updateBooking;
window.cancelBooking = cancelBooking;
window.removeVehicleImage = removeVehicleImage;
window.clearVehicleImages = clearVehicleImages;
window.openImagePreview = openImagePreview;
window.closeImagePreview = closeImagePreview;
window.viewDamageReports = viewDamageReports;
window.toggleDamageReportForm = toggleDamageReportForm;
window.submitDamageReport = submitDamageReport;
window.setUserVerification = setUserVerification;
window.viewLicense = viewLicense;
window.viewIdProof = viewIdProof;
window.viewUserPhoto = viewUserPhoto;

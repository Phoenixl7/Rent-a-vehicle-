const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function isHashedPassword(value) {
  return typeof value === "string" && value.includes(":") && value.split(":").length === 2;
}

function verifyPassword(password, stored) {
  if (!stored) return false;

  if (!isHashedPassword(stored)) {
    return password === stored;
  }

  const [salt, originalHash] = stored.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

module.exports = { hashPassword, verifyPassword, isHashedPassword };

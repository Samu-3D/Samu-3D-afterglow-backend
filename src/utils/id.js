import crypto from "crypto";

export function makeDelegateId() {
  return "DEL" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

export function makeQrToken() {
  return "QR-" + crypto.randomBytes(16).toString("hex");
}

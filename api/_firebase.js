const admin = require("firebase-admin");

function getAdmin() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON ortam değişkeni eksik.");
    let serviceAccount;
    try { serviceAccount = JSON.parse(raw); }
    catch (_) { throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON geçerli JSON değil."); }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  return admin;
}

async function verifyRequest(req) {
  const firebase = getAdmin();
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const error = new Error("Oturum açmanız gerekiyor.");
    error.status = 401;
    throw error;
  }
  try {
    const decoded = await firebase.auth().verifyIdToken(match[1]);
    return { firebase, decoded, isManager: Boolean(process.env.MANAGER_UID && decoded.uid === process.env.MANAGER_UID) };
  } catch (_) {
    const error = new Error("Oturum doğrulanamadı. Lütfen yeniden giriş yapın.");
    error.status = 401;
    throw error;
  }
}

function sendError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("API error:", error);
  res.status(status).json({ error: status >= 500 ? "Sunucu ayarlarında hata var. Vercel ortam değişkenlerini kontrol edin." : error.message });
}

function usernameToEmail(username) {
  const normalized = String(username || "").trim().toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, "").replace(/[^a-z0-9._-]/g, "");
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(normalized)) {
    const error = new Error("Kullanıcı adı 3–30 karakter olmalı; harf, rakam, nokta, alt çizgi veya tire kullanın.");
    error.status = 400;
    throw error;
  }
  return { username: normalized, email: normalized + "@buyakapuma.com" };
}

module.exports = { getAdmin, verifyRequest, sendError, usernameToEmail };

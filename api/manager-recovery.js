const crypto = require("crypto");
const { getAdmin } = require("../lib/firebase-admin");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const expectedToken = process.env.MANAGER_RECOVERY_TOKEN || "";
  const managerUid = process.env.MANAGER_UID || "";
  if (expectedToken.length < 24 || !managerUid) {
    return res.status(503).json({ error: "Kurtarma ayarları eksik. Vercel ortam değişkenlerini kontrol edin." });
  }

  const body = req.body || {};
  const token = String(body.token || "");
  const password = String(body.password || "");
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedToken);
  const tokenMatches = tokenBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(tokenBuffer, expectedBuffer);

  if (!tokenMatches) return res.status(401).json({ error: "Kurtarma anahtarı hatalı." });
  if (password.length < 12) return res.status(400).json({ error: "Yeni şifre en az 12 karakter olmalı." });

  try {
    const firebase = getAdmin();
    const db = firebase.firestore();
    const lockRef = db.collection("system").doc("managerRecovery");
    const lock = await lockRef.get();
    if (lock.exists && lock.data().used === true) {
      return res.status(410).json({ error: "Yönetici kurtarma bağlantısı daha önce kullanılmış." });
    }

    await firebase.auth().updateUser(managerUid, { password, disabled: false });
    await lockRef.set({
      used: true,
      usedAt: firebase.firestore.FieldValue.serverTimestamp(),
      managerUid
    });

    return res.status(200).json({ message: "Yönetici şifresi güncellendi. Artık kurtarma sayfasını kapatıp manager kullanıcı adıyla giriş yapabilirsiniz." });
  } catch (error) {
    console.error("Manager recovery failed:", error);
    return res.status(500).json({ error: "Şifre güncellenemedi. Vercel deployment loglarını kontrol edin." });
  }
};

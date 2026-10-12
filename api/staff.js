const { getAdmin, verifyRequest, sendError, usernameToEmail } = require("./_firebase");

module.exports = async function handler(req, res) {
  try {
    const { firebase, decoded, isManager } = await verifyRequest(req);
    if (!isManager) {
      if (req.method !== "GET") return res.status(403).json({ error: "Bu işlem yalnızca mağaza yöneticisine açıktır." });
      const own = await firebase.firestore().collection("staff").doc(decoded.uid).get();
      return res.status(200).json({ staff: own.exists ? [{ id: own.id, ...own.data() }] : [] });
    }

    const db = firebase.firestore();
    if (req.method === "GET") {
      const snapshot = await db.collection("staff").orderBy("createdAt", "desc").get();
      const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ staff });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = req.body || {};
    const fullName = String(body.fullName || "").trim().replace(/\s+/g, " ");
    const password = String(body.password || "");
    const { username, email } = usernameToEmail(body.username);
    if (fullName.length < 3) return res.status(400).json({ error: "Personelin adını ve soyadını girin." });
    if (password.length < 8) return res.status(400).json({ error: "Geçici şifre en az 8 karakter olmalı." });

    const user = await firebase.auth().createUser({ email, password, displayName: fullName, disabled: false });
    await db.collection("staff").doc(user.uid).set({
      username, email, fullName, active: true, role: "staff",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: decoded.uid
    });
    return res.status(201).json({ message: "Personel hesabı oluşturuldu.", staff: { id: user.uid, username, fullName, active: true, role: "staff" } });
  } catch (error) { return sendError(res, error); }
};

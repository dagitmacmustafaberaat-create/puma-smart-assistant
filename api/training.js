const { verifyRequest, sendError } = require("../lib/firebase-admin");

module.exports = async function handler(req, res) {
  try {
    const { firebase, decoded, isManager } = await verifyRequest(req);
    const db = firebase.firestore();
    if (req.method === "GET") {
      if (req.query && req.query.all === "1") {
        if (!isManager) return res.status(403).json({ error: "Eğitim raporunu yalnızca yönetici görüntüleyebilir." });
        const snap = await db.collection("trainingCompletions").orderBy("completedAt", "desc").get();
        return res.status(200).json({ completions: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
      }
      const snap = await db.collection("trainingCompletions").where("uid", "==", decoded.uid).get();
      return res.status(200).json({ completions: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const body = req.body || {};
    const title = String(body.title || "").trim().slice(0, 250);
    const date = String(body.date || "");
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "Eğitim başlığı veya tarihi geçersiz." });
    const profile = await db.collection("staff").doc(decoded.uid).get();
    const fullName = profile.exists ? String(profile.data().fullName || decoded.name || "") : String(decoded.name || "");
    const id = decoded.uid + "_" + date + "_" + Buffer.from(title).toString("base64url").slice(0, 60);
    const ref = db.collection("trainingCompletions").doc(id);
    const previous = await ref.get();
    if (!previous.exists) {
      await ref.set({
        uid: decoded.uid, fullName, title, trainingDate: date,
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    return res.status(200).json({ message: "Eğitim tamamlandı olarak kaydedildi." });
  } catch (error) { return sendError(res, error); }
};

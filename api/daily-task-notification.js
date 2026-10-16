// Vercel serverless endpoint: emails submitted daily store checklist to the manager.
const MANAGER_EMAIL = "mustafaberat.dagitmac@fastperakende.com";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Yalnızca POST isteği kabul edilir." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.DAILY_TASK_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return res.status(503).json({
      error: "E-posta gönderimi henüz yapılandırılmadı. Vercel ortam değişkenlerinde RESEND_API_KEY ve DAILY_TASK_FROM_EMAIL tanımlanmalı."
    });
  }

  const body = req.body || {};
  const firstName = String(body.firstName || "").trim().slice(0, 80);
  const lastName = String(body.lastName || "").trim().slice(0, 80);
  const tasks = Array.isArray(body.tasks) ? body.tasks : [];
  if (!firstName || !lastName || tasks.length < 1 || tasks.length > 40) {
    return res.status(400).json({ error: "Ad, soyad ve görev listesi zorunludur." });
  }
  const normalized = tasks.map(item => ({
    task: String(item.task || "").trim().slice(0, 180),
    result: String(item.result || "").trim().slice(0, 80),
    note: String(item.note || "").trim().slice(0, 1500)
  }));
  if (normalized.some(item => !item.task || !item.result || !item.note)) {
    return res.status(400).json({ error: "Tüm görevler için sonuç ve açıklama gereklidir." });
  }

  const submittedAt = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const rows = normalized.map(item =>
    "<tr><td style=\"padding:10px;border:1px solid #ddd;vertical-align:top\"><b>" + escapeHtml(item.task) +
    "</b></td><td style=\"padding:10px;border:1px solid #ddd;vertical-align:top\">" + escapeHtml(item.result) +
    "</td><td style=\"padding:10px;border:1px solid #ddd;vertical-align:top;white-space:pre-wrap\">" + escapeHtml(item.note) + "</td></tr>"
  ).join("");
  const html = "<div style=\"font-family:Arial,sans-serif;color:#222\"><h2>BUYAKA PUMA — Günlük Görev Kontrol Listesi</h2>" +
    "<p><b>Personel:</b> " + escapeHtml(firstName + " " + lastName) + "</p>" +
    "<p><b>Gönderim zamanı:</b> " + escapeHtml(submittedAt) + " (Türkiye saati)</p>" +
    "<table style=\"border-collapse:collapse;width:100%;max-width:900px\"><thead><tr>" +
    "<th style=\"text-align:left;padding:10px;border:1px solid #ddd\">Görev</th>" +
    "<th style=\"text-align:left;padding:10px;border:1px solid #ddd\">Sonuç</th>" +
    "<th style=\"text-align:left;padding:10px;border:1px solid #ddd\">Açıklama / Tespit</th>" +
    "</tr></thead><tbody>" + rows + "</tbody></table></div>";

  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [MANAGER_EMAIL],
        subject: "Günlük Görevler — " + firstName + " " + lastName + " — " + submittedAt,
        html
      })
    });
    const result = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok) {
      console.error("Resend email API error", emailResponse.status, result);
      return res.status(502).json({ error: "E-posta servisi gönderimi kabul etmedi. Gönderen adresinin doğrulandığını ve e-posta ayarlarını kontrol edin." });
    }
    return res.status(200).json({ ok: true, id: result.id || null });
  } catch (error) {
    console.error("Daily task email failed", error);
    return res.status(502).json({ error: "E-posta servisine bağlanılamadı. Lütfen tekrar deneyin." });
  }
};

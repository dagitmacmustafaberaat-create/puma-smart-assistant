// Vercel serverless endpoint: saves daily store checklist submissions as dated GitHub JSON files.
const OWNER = "dagitmacmustafaberaat-create";
const REPO = "puma-smart-assistant";
const BRANCH = "main";
const DIRECTORY = "gorev-kayitlari";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Yalnızca POST isteği kabul edilir." });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: "GitHub kayıt bağlantısı henüz yapılandırılmadı. Vercel ortam değişkenlerine GITHUB_TOKEN eklenmeli."
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

  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now).reduce((out, part) => {
    if (part.type !== "literal") out[part.type] = part.value;
    return out;
  }, {});
  const date = parts.year + "-" + parts.month + "-" + parts.day;
  const submittedAt = now.toISOString();
  const path = DIRECTORY + "/" + date + ".json";
  const apiBase = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + path;
  const headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };

  try {
    let existing = [];
    let sha;
    const readResponse = await fetch(apiBase + "?ref=" + BRANCH, { headers });
    if (readResponse.ok) {
      const file = await readResponse.json();
      sha = file.sha;
      existing = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
      if (!Array.isArray(existing)) existing = [];
    } else if (readResponse.status !== 404) {
      const detail = await readResponse.text();
      console.error("GitHub read error", readResponse.status, detail);
      return res.status(502).json({ error: "GitHub kayıt dosyası okunamadı. Token yetkilerini kontrol edin." });
    }

    existing.push({
      submittedAt,
      date,
      employee: { firstName, lastName },
      tasks: normalized
    });

    const writeResponse = await fetch(apiBase, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Günlük görev kaydı: " + date,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
        content: Buffer.from(JSON.stringify(existing, null, 2), "utf8").toString("base64")
      })
    });
    const result = await writeResponse.json().catch(() => ({}));
    if (!writeResponse.ok) {
      console.error("GitHub write error", writeResponse.status, result);
      return res.status(502).json({ error: "GitHub dosyasına kayıt yazılamadı. Token'ın bu depoda içerik yazma yetkisi olmalı." });
    }

    return res.status(200).json({ ok: true, date, path, entries: existing.length });
  } catch (error) {
    console.error("Daily task GitHub save failed", error);
    return res.status(502).json({ error: "GitHub kaydı sırasında bağlantı veya dosya biçimi hatası oluştu." });
  }
};

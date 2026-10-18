// Vercel serverless endpoint: stores quiz results in the repository.
const OWNER = "dagitmacmustafaberaat-create";
const REPO = "puma-smart-assistant";
const FILE_PATH = "training-results/results.json";
const API_BASE = "https://api.github.com";

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

async function githubRequest(method, url, token, body) {
  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) {}
  if (!response.ok) throw new Error(data.message || ("GitHub API " + response.status));
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method not allowed" });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) return send(res, 503, { error: "GITHUB_TOKEN is not configured in Vercel." });

  try {
    const fileUrl = API_BASE + "/repos/" + OWNER + "/" + REPO + "/contents/" + FILE_PATH;
    const current = await githubRequest("GET", fileUrl, token);
    const decoded = Buffer.from(current.content || "", "base64").toString("utf8");
    let store;
    try { store = JSON.parse(decoded); } catch (_) { store = { version: 1, results: [] }; }
    if (!store || !Array.isArray(store.results)) store = { version: 1, results: [] };

    if (req.method === "GET") {
      const suppliedKey = String(req.headers["x-training-admin-key"] || req.query?.key || "");
      const adminKey = process.env.TRAINING_ADMIN_KEY;
      if (!adminKey || suppliedKey !== adminKey) return send(res, 403, { error: "Manager access required." });
      return send(res, 200, store);
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const staff = String(body.staff || "").trim();
    const topic = String(body.topic || "").trim();
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const allowedStaff = [
      "MUSTAFA BERAT DAĞITMAÇ", "SİNEM PALAZ", "SERKAN CANİK",
      "CEM AKTAŞ", "MERVE ÇETİN", "ECE NUR TEMÜR"
    ];
    if (!allowedStaff.includes(staff) || !topic || answers.length !== 5) {
      return send(res, 400, { error: "Invalid quiz result." });
    }
    const result = {
      id: String(body.id || (Date.now() + "-" + Math.random().toString(36).slice(2, 8))),
      staff,
      topic,
      date: String(body.date || new Date().toISOString()),
      score: Math.max(0, Math.min(5, Number(body.score) || 0)),
      percentage: Math.max(0, Math.min(100, Number(body.percentage) || 0)),
      answers: answers.slice(0, 5).map((a) => ({
        question: String(a.question || "").slice(0, 500),
        selected: String(a.selected || "").slice(0, 300),
        correct: String(a.correct || "").slice(0, 300),
        isCorrect: Boolean(a.isCorrect)
      }))
    };
    store.results.push(result);
    const encoded = Buffer.from(JSON.stringify(store, null, 2) + "\n", "utf8").toString("base64");
    await githubRequest("PUT", fileUrl, token, {
      message: "Save product knowledge quiz result",
      content: encoded,
      sha: current.sha,
      branch: "main"
    });
    return send(res, 201, { ok: true, result: { id: result.id, score: result.score, percentage: result.percentage } });
  } catch (error) {
    console.error("training-results endpoint:", error);
    return send(res, 500, { error: "Could not save quiz result." });
  }
};

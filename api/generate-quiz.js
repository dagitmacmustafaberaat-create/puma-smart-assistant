module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({error:"Method not allowed"}); }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({error:"Günlük yapay zekâ testi için OPENAI_API_KEY Vercel ayarı eksik."});
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const topic = String(body.topic || "").trim().slice(0, 240);
    if (!topic) return res.status(400).json({error:"Eğitim konusu bulunamadı."});
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:process.env.OPENAI_QUIZ_MODEL || "gpt-4o-mini",
        temperature:0.6,
        response_format:{type:"json_object"},
        messages:[
          {role:"system",content:"Türkçe perakende mağaza eğitim uzmanısın. JSON olarak yalnızca {questions:[{question:string,options:[string,string,string,string],answerIndex:integer,explanation:string}]} döndür. Tam 5 soru. Her biri 4 seçenekli ve tek doğru cevaplı olsun. Verilen eğitim konusuna odaklan. answerIndex 0-3 arasında olmalı."},
          {role:"user",content:"BUYAKA PUMA mağaza çalışanları için şu günün eğitim konusuna göre 5 soruluk test hazırla: "+topic}
        ]
      })
    });
    const result = await upstream.json();
    if (!upstream.ok) throw new Error(result.error && result.error.message || "AI service error");
    const parsed = JSON.parse(result.choices[0].message.content);
    if (!Array.isArray(parsed.questions) || parsed.questions.length !== 5 || parsed.questions.some(q => !q.question || !Array.isArray(q.options) || q.options.length !== 4 || !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3)) throw new Error("Invalid question set");
    return res.status(200).json({topic,questions:parsed.questions});
  } catch (error) {
    console.error("generate-quiz:", error);
    return res.status(500).json({error:"5 soru üretilemedi. Vercel yapay zekâ ayarını kontrol edin."});
  }
};
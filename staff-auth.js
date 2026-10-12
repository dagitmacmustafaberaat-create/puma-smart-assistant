/* BUYAKA PUMA SMART ASSISTANT — staff login + training history.
   Requires the SQL setup and create-staff Supabase Edge Function in supabase/README. */
(function () {
  const SUPABASE_URL = "https://zjxphwqcmmmbikgrbhyn.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OF_6Dt6vWB3Z0XlyvOxIog_evFp_M57";
  let client = null;
  let currentProfile = null;
  let decorated = new WeakSet();
  const completedTrainingKeys = new Set();

  function slugifyName(value) {
    return String(value || "").trim().toLocaleLowerCase("tr-TR")
      .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u")
      .replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g,".").replace(/^\.+|\.+$/g,"");
  }
  function el(id) { return document.getElementById(id); }
  function message(id, text, bad) {
    const node = el(id); if (!node) return;
    node.textContent = text || "";
    node.classList.toggle("is-error", !!bad);
    node.classList.toggle("is-success", !bad && !!text);
  }
  function showLogin() {
    el("loginScreen").hidden = false;
    el("appShell").hidden = true;
    el("loginName").focus();
  }
  async function showApp(profile) {
    currentProfile = profile;
    el("loginScreen").hidden = true;
    el("appShell").hidden = false;
    el("welcomeName").textContent = profile.full_name;
    el("userBadge").textContent = profile.role === "manager" ? "YÖNETİCİ" : "PERSONEL";
    el("managerNavButton").hidden = profile.role !== "manager";
    el("managerPanel").hidden = true;
    await loadTrainingHistory();
    if (profile.role === "manager") await loadManagerReport();
  }
  async function signIn(name, password) {
    const email = slugifyName(name) + "@staff.buyakapuma.com";
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error("Ad soyad veya şifre hatalı. Personel adınızın yönetici tarafından eklenmiş olduğunu kontrol edin.");
    const { data: profile, error: profileError } = await client.from("staff_profiles")
      .select("user_id,full_name,role,active").eq("user_id", data.user.id).single();
    if (profileError || !profile || !profile.active) {
      await client.auth.signOut();
      throw new Error("Hesabınız etkin değil. Mağaza yöneticisiyle görüşün.");
    }
    await showApp(profile);
  }
  async function signOut() {
    await client.auth.signOut();
    currentProfile = null;
    showLogin();
    message("loginMessage", "", false);
  }
  async function loadTrainingHistory() {
    if (!currentProfile) return;
    const { data, error } = await client.from("training_completions")
      .select("training_title,training_date,completed_at")
      .eq("user_id", currentProfile.user_id).order("completed_at", { ascending: false }).limit(100);
    const box = el("trainingHistory");
    if (!box) return;
    completedTrainingKeys.clear();
    if (error) { box.innerHTML = "<p>Eğitim geçmişi yüklenemedi.</p>"; return; }
    if (!data || !data.length) { box.innerHTML = "<p>Henüz tamamlanmış eğitim kaydınız yok.</p>"; return; }
    data.forEach(item => completedTrainingKeys.add(item.training_title + "|" + item.training_date));
    box.innerHTML = "<h3>Eğitim Geçmişim</h3>" + data.map(item =>
      "<div class=\"history-row\"><strong>" + escapeText(item.training_title) +
      "</strong><span>Eğitim günü: " + escapeText(item.training_date) +
      " · Tamamlandı: " + escapeText(new Date(item.completed_at).toLocaleDateString("tr-TR")) +
      "</span></div>").join("");
  }
  async function markTraining(title, date) {
    if (!currentProfile || !title || !date) return;
    const { error } = await client.from("training_completions").upsert({
      user_id: currentProfile.user_id, training_title: title, training_date: date
    }, { onConflict: "user_id,training_title,training_date" });
    if (error) { alert("Eğitim kaydı yapılamadı: " + error.message); return; }
    await loadTrainingHistory();
    const b = document.querySelector('[data-complete-title="' + CSS.escape(title) + '"][data-complete-date="' + CSS.escape(date) + '"]');
    if (b) { b.textContent = "✓ Tamamlandı"; b.disabled = true; }
  }
  function escapeText(value) {
    return String(value || "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  async function loadManagerReport() {
    if (!currentProfile || currentProfile.role !== "manager") return;
    const [staffResult, completionResult] = await Promise.all([
      client.from("staff_profiles").select("user_id,full_name,active,role,created_at").order("full_name"),
      client.from("training_completions").select("training_title,training_date,completed_at,staff_profiles(full_name)").order("completed_at", { ascending: false }).limit(300)
    ]);
    const staffBox = el("managerStaffList");
    const reportBox = el("managerTrainingReport");
    if (staffBox) {
      staffBox.innerHTML = staffResult.error ? "<p>Personel listesi alınamadı.</p>" :
        (staffResult.data || []).map(s => "<div class=\"history-row\"><strong>" + escapeText(s.full_name) +
          "</strong><span>" + (s.role === "manager" ? "Yönetici" : "Personel") + " · " +
          (s.active ? "Aktif" : "Pasif") + "</span>" +
          (s.role === "manager" ? "" : "<button type=\"button\" class=\"staff-toggle-button\" data-user-id=\"" + escapeText(s.user_id) + "\" data-active=\"" + String(!!s.active) + "\">" + (s.active ? "Hesabı pasifleştir" : "Hesabı aktifleştir") + "</button>") +
          "</div>").join("") || "<p>Personel bulunamadı.</p>";
    }
    if (reportBox) {
      reportBox.innerHTML = completionResult.error ? "<p>Eğitim raporu alınamadı.</p>" :
        (completionResult.data || []).map(r => "<div class=\"history-row\"><strong>" +
          escapeText(r.staff_profiles && r.staff_profiles.full_name || "Personel") + " — " +
          escapeText(r.training_title) + "</strong><span>Eğitim günü: " + escapeText(r.training_date) +
          " · Tamamlandı: " + escapeText(new Date(r.completed_at).toLocaleDateString("tr-TR")) +
          "</span></div>").join("") || "<p>Henüz tamamlanma kaydı yok.</p>";
    }
  }
  async function setStaffActive(userId, active) {
    const { data: sessionData } = await client.auth.getSession();
    const response = await fetch(SUPABASE_URL + "/functions/v1/create-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + (sessionData.session && sessionData.session.access_token || "") },
      body: JSON.stringify({ action: "set-active", user_id: userId, active })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { alert(result.error || "Personel durumu güncellenemedi."); return; }
    await loadManagerReport();
  }
  async function createStaff(event) {
    event.preventDefault();
    message("createStaffMessage", "Personel oluşturuluyor…", false);
    const full_name = el("newStaffName").value.trim();
    const password = el("newStaffPassword").value;
    const { data: sessionData } = await client.auth.getSession();
    const response = await fetch(SUPABASE_URL + "/functions/v1/create-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + (sessionData.session && sessionData.session.access_token || "") },
      body: JSON.stringify({ full_name, password })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { message("createStaffMessage", result.error || "Personel oluşturulamadı.", true); return; }
    el("newStaffName").value = "";
    el("newStaffPassword").value = "";
    message("createStaffMessage", "Personel hesabı oluşturuldu.", false);
    await loadManagerReport();
  }
  function decorateTrainingCards() {
    if (!currentProfile) return;
    document.querySelectorAll("#todayTraining .topic-card, #educationCalendar .calendar-topic").forEach(card => {
      if (decorated.has(card)) return;
      const titleNode = card.querySelector("strong");
      if (!titleNode) return;
      const title = titleNode.textContent.trim();
      let date = "";
      const day = card.closest(".calendar-day");
      if (day && day.dataset.trainingDate) date = day.dataset.trainingDate;
      else {
        const now = new Date();
        date = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0");
      }
      const wrap = document.createElement("div");
      wrap.className = "training-topic-wrap";
      card.parentNode.insertBefore(wrap, card);
      wrap.appendChild(card);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "training-complete-button";
      const alreadyComplete = completedTrainingKeys.has(title + "|" + date);
      button.textContent = alreadyComplete ? "✓ Tamamlandı" : "Eğitimi tamamladım";
      button.disabled = alreadyComplete;
      button.dataset.completeTitle = title;
      button.dataset.completeDate = date;
      button.addEventListener("click", () => markTraining(title, date));
      wrap.appendChild(button);
      decorated.add(card);
    });
  }
  function init() {
    if (!window.supabase || !window.supabase.createClient) {
      message("loginMessage", "Giriş sistemi yüklenemedi. Sayfayı yenileyin.", true); return;
    }
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    el("loginForm").addEventListener("submit", async event => {
      event.preventDefault();
      const button = el("loginSubmit"); button.disabled = true; button.textContent = "Giriş yapılıyor…";
      try { await signIn(el("loginName").value, el("loginPassword").value); }
      catch (error) { message("loginMessage", error.message || "Giriş yapılamadı.", true); }
      finally { button.disabled = false; button.textContent = "Giriş Yap"; }
    });
    el("logoutButton").addEventListener("click", signOut);
    el("managerNavButton").addEventListener("click", async () => {
      el("managerPanel").hidden = !el("managerPanel").hidden;
      if (!el("managerPanel").hidden) await loadManagerReport();
    });
    el("createStaffForm").addEventListener("submit", createStaff);
    el("managerStaffList").addEventListener("click", event => { const button = event.target.closest(".staff-toggle-button"); if (button) setStaffActive(button.dataset.userId, button.dataset.active !== "true"); });
    client.auth.getSession().then(async ({ data }) => {
      if (!data.session) { showLogin(); return; }
      const { data: profile } = await client.from("staff_profiles").select("user_id,full_name,role,active")
        .eq("user_id", data.session.user.id).single();
      if (!profile || !profile.active) { await client.auth.signOut(); showLogin(); return; }
      await showApp(profile);
    });
    const observer = new MutationObserver(decorateTrainingCards);
    observer.observe(el("educationArea"), { childList: true, subtree: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) decorateTrainingCards(); });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
/* BUYAKA PUMA SMART ASSISTANT — Firebase Authentication + Vercel API */
(function () {
  "use strict";
  let auth;
  let currentUser = null;
  let currentName = "";
  let isManager = false;
  const decorated = new WeakSet();

  function el(id) { return document.getElementById(id); }
  function escapeText(value) {
    return String(value == null ? "" : value).replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function usernameToEmail(value) {
    return String(value || "").trim().toLocaleLowerCase("tr-TR")
      .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u")
      .replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c")
      .replace(/\s+/g,"").replace(/[^a-z0-9._-]/g,"") + "@buyakapuma.com";
  }
  async function api(path, options) {
    if (!currentUser) throw new Error("Lütfen yeniden giriş yapın.");
    const token = await currentUser.getIdToken();
    const response = await fetch(path, Object.assign({
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" }
    }, options || {}));
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data.error || "İşlem tamamlanamadı.");
    return data;
  }
  function showStoreSelect() {
    el("storeSelectScreen").hidden = false;
    el("loginScreen").hidden = true;
    el("appShell").hidden = true;
  }
  function showLogin() {
    el("storeSelectScreen").hidden = true;
    el("loginScreen").hidden = false;
    el("appShell").hidden = true;
    el("loginName").focus();
  }
  async function loadSession(user) {
    currentUser = user;
    try {
      const result = await api("/api/staff");
      isManager = Boolean(result.isManager);
      const own = (result.staff || []).find(item => item.id === user.uid);
      currentName = (own && own.fullName) || user.displayName || user.email || "Personel";
      el("storeSelectScreen").hidden = true;
      el("loginScreen").hidden = true;
      el("appShell").hidden = false;
      el("welcomeName").textContent = currentName;
      el("userBadge").textContent = isManager ? "MAĞAZA YÖNETİCİSİ" : "BUYAKA PUMA STORE";
      el("managerNavButton").hidden = !isManager;
      el("managerPanel").hidden = true;
      await renderHistory();
      decorateTrainingCards();
    } catch (error) {
      console.error(error);
      await auth.signOut();
      el("loginMessage").textContent = error.message;
      showLogin();
    }
  }
  function timestampLabel(value) {
    if (!value) return "Kaydedildi";
    let date;
    if (value._seconds) date = new Date(value._seconds * 1000);
    else if (value.seconds) date = new Date(value.seconds * 1000);
    else date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Kaydedildi" : date.toLocaleString("tr-TR");
  }
  async function renderHistory() {
    const box = el("trainingHistory");
    if (!box || !currentUser) return;
    try {
      const result = await api("/api/training");
      const records = (result.completions || []).sort((a,b) => String(b.trainingDate).localeCompare(String(a.trainingDate)));
      if (!records.length) {
        box.innerHTML = "<h3>Eğitim Geçmişim</h3><p>Henüz tamamlanmış eğitim kaydınız bulunmuyor.</p>";
        return;
      }
      box.innerHTML = "<h3>Eğitim Geçmişim</h3>" + records.map(item =>
        "<div class=\"history-row\"><strong>" + escapeText(item.title) +
        "</strong><span>Eğitim günü: " + escapeText(item.trainingDate) +
        " · Tamamlandı: " + escapeText(timestampLabel(item.completedAt)) + "</span></div>").join("");
      decorateTrainingCards();
    } catch (error) {
      box.innerHTML = "<h3>Eğitim Geçmişim</h3><p>" + escapeText(error.message) + "</p>";
    }
  }
  function cardDate(card) {
    const day = card.closest(".calendar-day");
    if (day && day.dataset.trainingDate) return day.dataset.trainingDate;
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0");
  }
  async function markTraining(title, date, button) {
    if (!currentUser || !title || !date) return;
    button.disabled = true;
    button.textContent = "Kaydediliyor…";
    try {
      await api("/api/training", { method: "POST", body: JSON.stringify({ title, date }) });
      button.textContent = "✓ Tamamlandı";
      await renderHistory();
    } catch (error) {
      button.disabled = false;
      button.textContent = "Eğitimi tamamladım";
      alert(error.message);
    }
  }
  async function decorateTrainingCards() {
    if (!currentUser || el("appShell").hidden) return;
    let records = [];
    try { records = (await api("/api/training")).completions || []; } catch (_) { return; }
    document.querySelectorAll("#todayTraining .topic-card, #educationCalendar .calendar-topic").forEach(card => {
      if (decorated.has(card)) return;
      const titleNode = card.querySelector("strong");
      if (!titleNode) return;
      const title = titleNode.textContent.trim();
      const date = cardDate(card);
      const already = records.some(item => item.title === title && item.trainingDate === date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "training-complete-button";
      button.textContent = already ? "✓ Tamamlandı" : "Eğitimi tamamladım";
      button.disabled = already;
      button.addEventListener("click", () => markTraining(title, date, button));
      const wrap = document.createElement("div");
      wrap.className = "training-topic-wrap";
      card.parentNode.insertBefore(wrap, card);
      wrap.appendChild(card);
      wrap.appendChild(button);
      decorated.add(card);
    });
  }
  async function loadManagerPanel() {
    const staffBox = el("staffList");
    const reportBox = el("managerTrainingReport");
    staffBox.textContent = "Yükleniyor…";
    reportBox.textContent = "Yükleniyor…";
    try {
      const [staffData, trainingData] = await Promise.all([
        api("/api/staff"),
        api("/api/training?all=1")
      ]);
      staffBox.innerHTML = (staffData.staff || []).length ? staffData.staff.map(item =>
        "<div class=\"history-row\"><strong>" + escapeText(item.fullName || item.username) +
        " · @" + escapeText(item.username || "") + "</strong><span>Durum: " +
        (item.active === false ? "Pasif" : "Aktif") + "</span><button type=\"button\" class=\"staff-toggle-button\" data-user-id=\"" +
        escapeText(item.id) + "\" data-active=\"" + (item.active === false ? "true" : "false") + "\">" +
        (item.active === false ? "Hesabı Aktifleştir" : "Hesabı Pasifleştir") + "</button></div>").join("")
        : "<p>Henüz personel hesabı oluşturulmadı.</p>";
      staffBox.querySelectorAll(".staff-toggle-button").forEach(button => button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          await api("/api/staff", { method: "PATCH", body: JSON.stringify({ userId: button.dataset.userId, active: button.dataset.active === "true" }) });
          await loadManagerPanel();
        } catch (error) { alert(error.message); button.disabled = false; }
      }));
      const records = trainingData.completions || [];
      reportBox.innerHTML = records.length ? records.map(item =>
        "<div class=\"history-row\"><strong>" + escapeText(item.fullName || "Personel") +
        " · " + escapeText(item.title) + "</strong><span>Eğitim günü: " +
        escapeText(item.trainingDate) + " · Tamamlandı: " + escapeText(timestampLabel(item.completedAt)) +
        "</span></div>").join("") : "<p>Henüz eğitim tamamlama kaydı bulunmuyor.</p>";
    } catch (error) {
      staffBox.textContent = error.message;
      reportBox.textContent = error.message;
    }
  }
  function init() {
    if (!window.firebase || !window.firebaseConfig) {
      el("loginMessage").textContent = "Firebase yapılandırması yüklenemedi.";
      showStoreSelect();
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
    auth = firebase.auth();
    el("storeSelectButton").addEventListener("click", showLogin);
    el("changeStoreButton").addEventListener("click", async () => {
      if (auth.currentUser) await auth.signOut();
      showStoreSelect();
    });
    el("loginForm").addEventListener("submit", async event => {
      event.preventDefault();
      const username = el("loginName").value.trim();
      const password = el("loginPassword").value;
      const message = el("loginMessage");
      const submit = el("loginSubmit");
      message.textContent = "";
      message.className = "form-message";
      submit.disabled = true;
      try {
        await auth.signInWithEmailAndPassword(usernameToEmail(username), password);
      } catch (error) {
        message.textContent = error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found"
          ? "Kullanıcı adı veya şifre hatalı." : error.code === "auth/too-many-requests"
          ? "Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin." : error.message;
        message.classList.add("is-error");
      } finally { submit.disabled = false; }
    });
    el("logoutButton").addEventListener("click", () => auth.signOut());
    el("managerNavButton").addEventListener("click", async () => {
      const panel = el("managerPanel");
      panel.hidden = !panel.hidden;
      if (!panel.hidden) await loadManagerPanel();
    });
    el("createStaffForm").addEventListener("submit", async event => {
      event.preventDefault();
      const submit = el("createStaffSubmit");
      const message = el("managerMessage");
      submit.disabled = true;
      message.textContent = "";
      try {
        const result = await api("/api/staff", { method: "POST", body: JSON.stringify({
          fullName: el("newStaffName").value.trim(),
          username: el("newStaffUsername").value.trim(),
          password: el("newStaffPassword").value
        })});
        message.textContent = result.message + " Kullanıcı adı: " + result.staff.username;
        message.classList.add("is-success");
        el("createStaffForm").reset();
        await loadManagerPanel();
      } catch (error) {
        message.textContent = error.message;
        message.classList.add("is-error");
      } finally { submit.disabled = false; }
    });
    const observer = new MutationObserver(() => { if (currentUser) decorateTrainingCards(); });
    observer.observe(el("educationArea"), { childList: true, subtree: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && currentUser) decorateTrainingCards();
    });
    auth.onAuthStateChanged(user => {
      if (user) loadSession(user);
      else { currentUser = null; isManager = false; showStoreSelect(); }
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();

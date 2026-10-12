/* BUYAKA PUMA SMART ASSISTANT — mağaza seçimi ve şifresiz ad-soyad girişi.
   Bu basit mod giriş yapan kişinin kimliğini doğrulamaz. Eğitim kayıtları aynı tarayıcıda saklanır. */
(function () {
  const STORAGE_KEY = "buyakaPumaTrainingCompletions";
  let currentName = "";
  const decorated = new WeakSet();

  function el(id) { return document.getElementById(id); }
  function escapeText(value) {
    return String(value || "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function readRecords() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }
  function writeRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
  function showStoreSelect() {
    el("storeSelectScreen").hidden = false;
    el("loginScreen").hidden = true;
    el("appShell").hidden = true;
    const force = el("forcePasswordScreen");
    if (force) force.hidden = true;
  }
  function showNameEntry() {
    el("storeSelectScreen").hidden = true;
    el("loginScreen").hidden = false;
    el("appShell").hidden = true;
    el("loginName").focus();
  }
  function showApp(name) {
    currentName = name;
    el("storeSelectScreen").hidden = true;
    el("loginScreen").hidden = true;
    const force = el("forcePasswordScreen");
    if (force) force.hidden = true;
    el("appShell").hidden = false;
    el("welcomeName").textContent = name;
    el("userBadge").textContent = "BUYAKA PUMA STORE";
    const managerButton = el("managerNavButton");
    const managerPanel = el("managerPanel");
    if (managerButton) managerButton.hidden = true;
    if (managerPanel) managerPanel.hidden = true;
    renderHistory();
    decorateTrainingCards();
  }
  function renderHistory() {
    const box = el("trainingHistory");
    if (!box || !currentName) return;
    const records = readRecords().filter(item => item.name === currentName)
      .sort((a,b) => String(b.completedAt).localeCompare(String(a.completedAt)));
    if (!records.length) {
      box.innerHTML = "<h3>Eğitim Geçmişim</h3><p>Bu tarayıcıda henüz tamamlanmış eğitim kaydınız yok.</p>";
      return;
    }
    box.innerHTML = "<h3>Eğitim Geçmişim</h3>" + records.map(item =>
      "<div class=\"history-row\"><strong>" + escapeText(item.title) +
      "</strong><span>Eğitim günü: " + escapeText(item.date) +
      " · Tamamlandı: " + escapeText(item.completedAt) + "</span></div>").join("");
  }
  function markTraining(title, date, button) {
    if (!currentName || !title || !date) return;
    const records = readRecords();
    const exists = records.some(item => item.name === currentName && item.title === title && item.date === date);
    if (!exists) {
      records.push({
        name: currentName,
        title,
        date,
        completedAt: new Date().toLocaleString("tr-TR")
      });
      writeRecords(records);
    }
    if (button) {
      button.textContent = "✓ Tamamlandı";
      button.disabled = true;
    }
    renderHistory();
  }
  function decorateTrainingCards() {
    if (!currentName || el("appShell").hidden) return;
    document.querySelectorAll("#todayTraining .topic-card, #educationCalendar .calendar-topic").forEach(card => {
      if (decorated.has(card)) return;
      const titleNode = card.querySelector("strong");
      if (!titleNode) return;
      const title = titleNode.textContent.trim();
      const day = card.closest(".calendar-day");
      let date = day && day.dataset.trainingDate || "";
      if (!date) {
        const now = new Date();
        date = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0");
      }
      const alreadyComplete = readRecords().some(item =>
        item.name === currentName && item.title === title && item.date === date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "training-complete-button";
      button.textContent = alreadyComplete ? "✓ Tamamlandı" : "Eğitimi tamamladım";
      button.disabled = alreadyComplete;
      button.addEventListener("click", () => markTraining(title, date, button));
      const wrap = document.createElement("div");
      wrap.className = "training-topic-wrap";
      card.parentNode.insertBefore(wrap, card);
      wrap.appendChild(card);
      wrap.appendChild(button);
      decorated.add(card);
    });
  }
  function init() {
    el("storeSelectButton").addEventListener("click", showNameEntry);
    el("changeStoreButton").addEventListener("click", showStoreSelect);
    el("loginForm").addEventListener("submit", event => {
      event.preventDefault();
      const name = el("loginName").value.trim().replace(/\s+/g, " ");
      if (name.length < 3) {
        el("loginMessage").textContent = "Lütfen adınızı ve soyadınızı girin.";
        return;
      }
      el("loginMessage").textContent = "";
      showApp(name);
    });
    el("logoutButton").addEventListener("click", () => {
      currentName = "";
      el("loginName").value = "";
      showNameEntry();
    });
    const observer = new MutationObserver(decorateTrainingCards);
    observer.observe(el("educationArea"), { childList: true, subtree: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) decorateTrainingCards();
    });
    showStoreSelect();
  }
  document.addEventListener("DOMContentLoaded", init);
})();

"use strict";

/** =========================
 *  Настройки и данные
 *  ========================= */
const STORAGE_KEY = "finance_natalia_v2"; // новая версия хранилища

const CATEGORIES = {
  business: [
    "Аренда",
    "CRM",
    "GPT",
    "Связь/Интернет",
    "Реклама",
    "Канцтовары",
    "Хозяйственные",
    "Прочее (бизнес)"
  ],
  personal: [
    "Одежда",
    "Обувь",
    "Супермаркеты",
    "Аптека",
    "Врач/УЗИ",
    "Косметолог",
    "Маникюр/педикюр",
    "Стрижка",
    "Ozon/WB",
    "Прочее (личное)"
  ],
  investment: [
    "Курсы/обучение",
    "Программы/сервисы",
    "Книги",
    "Оборудование",
    "Прочее (инвестиции)"
  ]
};

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function monthKeyFromISO(dateISO) {
  // "2026-02-23" -> "2026-02"
  if (!dateISO || dateISO.length < 7) return "";
  return dateISO.slice(0, 7);
}

function formatRUB(n) {
  const val = Number(n || 0);
  return `${val.toLocaleString("ru-RU")} ₽`;
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveData(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** item:
 * { id, dateISO, kind, category, amount, note, createdAt }
 */

let items = loadData();

/** =========================
 *  DOM
 *  ========================= */
const addBtn = document.getElementById("addBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

const formBlock = document.getElementById("formBlock");
const closeFormBtn = document.getElementById("closeFormBtn");
const saveBtn = document.getElementById("saveBtn");

const dateInput = document.getElementById("date");
const kindSelect = document.getElementById("kind");
const categorySelect = document.getElementById("category");
const amountInput = document.getElementById("amount");
const noteInput = document.getElementById("note");

const monthSelect = document.getElementById("monthSelect");
const typeFilter = document.getElementById("typeFilter");
const searchInput = document.getElementById("searchInput");

const sumAll = document.getElementById("sumAll");
const sumBusiness = document.getElementById("sumBusiness");
const sumPersonal = document.getElementById("sumPersonal");
const sumInvestment = document.getElementById("sumInvestment");

const listEl = document.getElementById("list");
const emptyState = document.getElementById("emptyState");
const clearMonthBtn = document.getElementById("clearMonthBtn");

/** =========================
 *  Инициализация
 *  ========================= */
dateInput.value = todayISO();
fillCategories(kindSelect.value);
buildMonthDropdown();
render();

/** =========================
 *  UI helpers
 *  ========================= */
function fillCategories(kind) {
  const arr = CATEGORIES[kind] || [];
  categorySelect.innerHTML = "";
  for (const c of arr) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
  }
}

function getAllMonthsFromItems(allItems) {
  // Вернём уникальные месяцы в порядке убывания
  const set = new Set();
  for (const it of allItems) set.add(monthKeyFromISO(it.dateISO));
  const months = Array.from(set).filter(Boolean).sort().reverse();
  return months;
}

function monthTitle(monthKey) {
  // "2026-02" -> "Февраль 2026"
  const [y, m] = monthKey.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

function buildMonthDropdown() {
  const months = getAllMonthsFromItems(items);

  // если нет записей — добавим текущий месяц как “по умолчанию”
  const current = monthKeyFromISO(todayISO());
  const list = months.includes(current) ? months : [current, ...months];

  monthSelect.innerHTML = "";
  for (const mk of list) {
    const opt = document.createElement("option");
    opt.value = mk;
    opt.textContent = monthTitle(mk);
    monthSelect.appendChild(opt);
  }

  // Если уже был выбран месяц — стараемся сохранить выбор
  const saved = sessionStorage.getItem("finance_selected_month");
  if (saved && list.includes(saved)) monthSelect.value = saved;

  sessionStorage.setItem("finance_selected_month", monthSelect.value);
}

function showForm() {
  formBlock.classList.remove("hidden");
  // прокрутка к форме (удобно)
  formBlock.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideForm() {
  formBlock.classList.add("hidden");
}

/** =========================
 *  Фильтрация / отрисовка
 *  ========================= */
function getFilteredItems() {
  const selectedMonth = monthSelect.value;
  const type = typeFilter.value; // all | business | personal | investment
  const q = (searchInput.value || "").trim().toLowerCase();

  return items
    .filter(it => monthKeyFromISO(it.dateISO) === selectedMonth)
    .filter(it => (type === "all" ? true : it.kind === type))
    .filter(it => {
      if (!q) return true;
      const hay = `${it.category} ${it.note || ""}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""));
}

function renderSummary(filteredForMonth) {
  let total = 0, bus = 0, per = 0, inv = 0;

  for (const it of filteredForMonth) {
    const a = Number(it.amount || 0);
    total += a;
    if (it.kind === "business") bus += a;
    if (it.kind === "personal") per += a;
    if (it.kind === "investment") inv += a;
  }

  sumAll.textContent = formatRUB(total);
  sumBusiness.textContent = formatRUB(bus);
  sumPersonal.textContent = formatRUB(per);
  sumInvestment.textContent = formatRUB(inv);
}

function renderList(filtered) {
  listEl.innerHTML = "";

  emptyState.style.display = filtered.length ? "none" : "block";

  for (const it of filtered) {
    const li = document.createElement("li");
    li.className = "item";

    const left = document.createElement("div");
    left.className = "item__left";

    const dateHuman = new Date(it.dateISO).toLocaleDateString("ru-RU");
    const title = document.createElement("div");
    title.innerHTML = `<strong>${dateHuman}</strong> — ${escapeHtml(it.category)}${it.note ? ` <span class="muted">(${escapeHtml(it.note)})</span>` : ""}`;

    const badges = document.createElement("div");
    badges.className = "badges";

    const b = document.createElement("span");
    b.className = `badge ${it.kind}`;
    b.textContent = it.kind === "business" ? "Бизнес" : it.kind === "personal" ? "Личное" : "Инвестиции";
    badges.appendChild(b);

    left.appendChild(title);
    left.appendChild(badges);

    const right = document.createElement("div");
    right.className = "item__right";

    const amount = document.createElement("div");
    amount.className = "amount";
    amount.textContent = formatRUB(it.amount);

    const del = document.createElement("button");
    del.className = "iconBtn";
    del.textContent = "Удалить";
    del.addEventListener("click", () => removeItem(it.id));

    right.appendChild(amount);
    right.appendChild(del);

    li.appendChild(left);
    li.appendChild(right);
    listEl.appendChild(li);
  }
}

function render() {
  // при любом рендере обновим список месяцев (вдруг добавили новый)
  buildMonthDropdown();

  const filtered = getFilteredItems();
  renderSummary(filtered);
  renderList(filtered);
}

/** =========================
 *  CRUD
 *  ========================= */
function addItem() {
  const dateISO = (dateInput.value || "").trim() || todayISO();
  const kind = kindSelect.value;
  const category = categorySelect.value;
  const amount = Number(amountInput.value || 0);
  const note = (noteInput.value || "").trim();

  if (!category) {
    alert("Выбери категорию.");
    return;
  }
  if (!amount || amount <= 0) {
    alert("Введи сумму больше 0.");
    return;
  }

  const it = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    dateISO,
    kind,
    category,
    amount,
    note,
    createdAt: Date.now()
  };

  items.push(it);
  saveData(items);

  // если добавили в новый месяц — переключим фильтр на этот месяц
  const mk = monthKeyFromISO(dateISO);
  if (mk) {
    sessionStorage.setItem("finance_selected_month", mk);
    monthSelect.value = mk;
  }

  // очистка формы
  amountInput.value = "";
  noteInput.value = "";

  hideForm();
  render();
}

function removeItem(id) {
  if (!confirm("Удалить эту запись?")) return;
  items = items.filter(x => x.id !== id);
  saveData(items);
  render();
}

function clearSelectedMonth() {
  const mk = monthSelect.value;
  if (!mk) return;
  if (!confirm(`Очистить ВСЕ записи за ${monthTitle(mk)}?`)) return;

  items = items.filter(it => monthKeyFromISO(it.dateISO) !== mk);
  saveData(items);

  // после очистки вернёмся на текущий месяц
  const current = monthKeyFromISO(todayISO());
  sessionStorage.setItem("finance_selected_month", current);

  render();
}

/** =========================
 *  Экспорт / Импорт JSON
 *  ========================= */
function exportJSON() {
  const payload = {
    app: "FINANCE-NATALIA",
    version: 2,
    exportedAt: new Date().toISOString(),
    items
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `finance-natalia-${monthKeyFromISO(todayISO())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function importJSONFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(String(reader.result || ""));
      const incoming = Array.isArray(obj) ? obj : obj.items;

      if (!Array.isArray(incoming)) {
        alert("Файл не похож на экспорт трекера.");
        return;
      }

      // режим: объединение (merge) + защита от дублей по id
      const map = new Map(items.map(it => [it.id, it]));
      for (const it of incoming) {
        if (!it || !it.id) continue;
        map.set(it.id, it);
      }
      items = Array.from(map.values());

      saveData(items);
      render();

      alert("Импорт выполнен ✅");
    } catch {
      alert("Не получилось прочитать файл. Проверь, что это .json из экспорта.");
    }
  };
  reader.readAsText(file);
}

/** =========================
 *  Безопасный текст
 *  ========================= */
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** =========================
 *  События
 *  ========================= */
addBtn.addEventListener("click", showForm);
closeFormBtn.addEventListener("click", hideForm);
saveBtn.addEventListener("click", addItem);

kindSelect.addEventListener("change", () => {
  fillCategories(kindSelect.value);
});

monthSelect.addEventListener("change", () => {
  sessionStorage.setItem("finance_selected_month", monthSelect.value);
  render();
});

typeFilter.addEventListener("change", render);
searchInput.addEventListener("input", render);

clearMonthBtn.addEventListener("click", clearSelectedMonth);

exportBtn.addEventListener("click", exportJSON);

importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  importJSONFile(file);
  importFile.value = ""; // чтобы можно было импортировать тот же файл повторно
});


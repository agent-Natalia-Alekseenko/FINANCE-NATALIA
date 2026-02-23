const categories = {
  business: [
    "Аренда",
    "GPT",
    "CRM",
    "Прочие бизнес-расходы"
  ],
  personal: [
    "Супермаркеты",
    "Аптека",
    "Платная медицина",
    "Одежда",
    "Обувь",
    "Косметолог",
    "Маникюр/педикюр",
    "Стрижка",
    "Ozon / WB",
    "Прочие личные"
  ]
};

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

const addBtn = document.getElementById("addBtn");
const formBlock = document.getElementById("formBlock");
const saveBtn = document.getElementById("saveBtn");
const kindSelect = document.getElementById("kind");
const categorySelect = document.getElementById("category");
const amountInput = document.getElementById("amount");
const noteInput = document.getElementById("note");
const list = document.getElementById("list");

const totalEl = document.getElementById("total");
const businessTotalEl = document.getElementById("businessTotal");
const personalTotalEl = document.getElementById("personalTotal");

function populateCategories(kind) {
  categorySelect.innerHTML = "";
  categories[kind].forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

kindSelect.addEventListener("change", () => {
  populateCategories(kindSelect.value);
});

addBtn.addEventListener("click", () => {
  formBlock.classList.toggle("hidden");
});

saveBtn.addEventListener("click", () => {
  const kind = kindSelect.value;
  const category = categorySelect.value;
  const amount = parseFloat(amountInput.value);
  const note = noteInput.value;

  if (!amount) {
    alert("Введите сумму");
    return;
  }

  const expense = {
    kind,
    category,
    amount,
    note,
    date: new Date().toLocaleDateString()
  };

  expenses.push(expense);
  localStorage.setItem("expenses", JSON.stringify(expenses));

  amountInput.value = "";
  noteInput.value = "";
  formBlock.classList.add("hidden");

  render();
});

function render() {
  list.innerHTML = "";

  let total = 0;
  let businessTotal = 0;
  let personalTotal = 0;

  expenses.forEach(exp => {
    total += exp.amount;
    if (exp.kind === "business") {
      businessTotal += exp.amount;
    } else {
      personalTotal += exp.amount;
    }

    const li = document.createElement("li");
    li.textContent = `${exp.date} — ${exp.category} — ${exp.amount} ₽ ${exp.note ? "(" + exp.note + ")" : ""}`;
    list.appendChild(li);
  });

  totalEl.textContent = total + " ₽";
  businessTotalEl.textContent = businessTotal + " ₽";
  personalTotalEl.textContent = personalTotal + " ₽";
}

populateCategories("business");
render();
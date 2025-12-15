const STORAGE_KEY = "freshlunch-order";
const API_BASE = "https://edu.std-900.ist.mospolytech.ru/labs/api";
const API_KEY = "13e357d1-1f58-4491-91a5-427d5c6c0f59";  // Замените на ваш реальный ключ, например, "123e4567-e89b-12d3-a456-426655440000"
const categories = ["soup", "main", "salad", "drink", "dessert"];
const categoryLabels = {
  soup: "Суп",
  main: "Главное блюдо",
  salad: "Салат",
  drink: "Напиток",
  dessert: "Десерт"
};
let dishesData = [];
let selected = createEmptySelection();
document.addEventListener("DOMContentLoaded", async () => {
  selected = restoreSelection();
  await loadDishes();
  renderCart();
  renderSummary();
  const form = document.querySelector("#checkout-form");
  form?.addEventListener("submit", handleSubmit);
  form?.addEventListener("reset", () => {
    setTimeout(() => renderSummary(), 0);
  });
});
function createEmptySelection() {
  return { soup: null, main: null, salad: null, drink: null, dessert: null };
}
async function loadDishes() {
  const emptyEl = document.querySelector("#empty-cart");
  try {
    const url = `${API_BASE}/dishes?api_key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Ошибка загрузки блюд: ${res.status}`);
    }
    const data = await res.json();
    const categoryMap = { "main-course": "main" };
    dishesData = data.map(dish => ({
      ...dish,
      category: categoryMap[dish.category] || dish.category
    }));
    const byId = new Map();
    dishesData.forEach(d => byId.set(String(d.id), d));
    categories.forEach(cat => {
      const storedId = selected[cat]?.id;
      if (storedId && byId.has(String(storedId))) {
        selected[cat] = byId.get(String(storedId));
      } else if (storedId) {
        selected[cat] = null;
      }
    });
  } catch (err) {
    console.error(err);
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent = "Не удалось загрузить блюда. Попробуйте позже.";
    }
  }
}
function renderCart() {
  const grid = document.querySelector("#cart-grid");
  const emptyEl = document.querySelector("#empty-cart");
  const form = document.querySelector("#checkout-form");
  if (!grid) return;
  grid.innerHTML = "";
  let hasAny = false;
  categories.forEach(cat => {
    const dish = selected[cat];
    if (!dish) return;
    hasAny = true;
    const card = document.createElement("div");
    card.className = "dish";
    card.dataset.category = cat;
    card.innerHTML = `
      <img src="${dish.image}" alt="${dish.name}">
      <p class="price">${dish.price} ₽</p>
      <p class="name">${dish.name}</p>
      <p class="weight">${dish.count || ""}</p>
      <button type="button" class="remove-btn">Удалить</button>
    `;
    card.querySelector(".remove-btn")?.addEventListener("click", () => {
      selected[cat] = null;
      persistSelection();
      renderCart();
      renderSummary();
    });
    grid.appendChild(card);
  });
  if (!hasAny) {
    if (emptyEl) emptyEl.hidden = false;
    if (form) form.classList.add("disabled-form");
  } else {
    if (emptyEl) emptyEl.hidden = true;
    if (form) form.classList.remove("disabled-form");
  }
}
function renderSummary() {
  let total = 0;
  const summaryRoot = document.querySelector("#summary-list");
  const totalEl = document.querySelector("#form-total");
  const submitBtn = document.querySelector("#submit-btn");
  categories.forEach(cat => {
    const span = summaryRoot?.querySelector(`[data-summary="${cat}"]`);
    if (!span) return;
    const dish = selected[cat];
    if (dish) {
      span.textContent = `${dish.name} — ${dish.price} ₽`;
      total += Number(dish.price) || 0;
    } else {
      span.textContent = cat === "main" ? "Не выбрано" : "Не выбран";
    }
  });
  if (totalEl) totalEl.textContent = `${total} ₽`;
  const valid = isValidCombo(selected);
  if (submitBtn) {
    submitBtn.disabled = !valid || !Object.values(selected).some(Boolean);
    submitBtn.textContent = valid ? "Отправить" : "Выберите комбо";
  }
}
function persistSelection() {
  const ids = {};
  categories.forEach(cat => {
    ids[cat] = selected[cat]?.id || null;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
function restoreSelection() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptySelection();
  try {
    const parsed = JSON.parse(raw);
    const result = createEmptySelection();
    categories.forEach(cat => {
      if (parsed[cat]) {
        result[cat] = { id: parsed[cat] };
      }
    });
    return result;
  } catch {
    return createEmptySelection();
  }
}
function isValidCombo(current) {
  const hasSoup = !!current.soup;
  const hasMain = !!current.main;
  const hasSalad = !!current.salad;
  const hasDrink = !!current.drink;
  const combos = [
    { soup: true, main: true, salad: true, drink: true },
    { soup: true, main: true, salad: false, drink: true },
    { soup: false, main: true, salad: true, drink: true },
    { soup: true, main: false, salad: true, drink: true },
    { soup: false, main: true, salad: false, drink: true }
  ];
  const selectedCombo = { soup: hasSoup, main: hasMain, salad: hasSalad, drink: hasDrink };
  return combos.some(combo => Object.keys(combo).every(cat => combo[cat] === selectedCombo[cat]));
}
async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = document.querySelector("#submit-btn");
  if (!Object.values(selected).some(Boolean)) {
    alert("Ничего не выбрано. Добавьте блюда на странице «Собрать ланч».");
    return;
  }
  if (!isValidCombo(selected)) {
    alert("Состав заказа не соответствует доступным комбо. Дополните заказ.");
    return;
  }
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.subscribe = formData.has("subscribe") ? 1 : 0;
  if (!payload.delivery_type) {
    payload.delivery_type = "now";
  }
  if (payload.delivery_type === "by_time") {
    if (!payload.delivery_time) {
      alert("Укажите время доставки.");
      return;
    }
    if (!isTimeValid(payload.delivery_time)) {
      alert("Время доставки должно быть между 07:00 и 23:00 и не раньше текущего момента.");
      return;
    }
  } else {
    delete payload.delivery_time;
  }
  const categoryMap = {
    soup: "soup_id",
    main: "main_course_id",
    salad: "salad_id",
    drink: "drink_id",
    dessert: "dessert_id"
  };
  categories.forEach(cat => {
    if (selected[cat]?.id) {
      payload[categoryMap[cat]] = selected[cat].id;
    }
  });
  const url = `${API_BASE}/orders?api_key=${API_KEY}`;
  submitBtn.disabled = true;
  submitBtn.textContent = "Отправляем...";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Ошибка ${res.status}`);
    }
    alert("✅ Заказ успешно оформлен!");
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "order.html";
  } catch (err) {
    console.error(err);
    alert("❌ Не удалось оформить заказ. Проверьте данные и попробуйте снова.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Отправить";
  }
}
function isTimeValid(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;
  const minutesTotal = hours * 60 + minutes;
  const min = 7 * 60;
  const max = 23 * 60;
  if (minutesTotal < min || minutesTotal > max) return false;
  const now = new Date();
  const [currentHours, currentMinutes] = [now.getHours(), now.getMinutes()];
  const nowMinutesTotal = currentHours * 60 + currentMinutes;
  return minutesTotal >= nowMinutesTotal;
}
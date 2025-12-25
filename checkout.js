const API_KEY = "13e357d1-1f58-4491-91a5-427d5c6c0f59";
const STORAGE_KEY = "selectedDishes";
let selected = {};
let dishesData = [];

document.addEventListener("DOMContentLoaded", async () => {
  selected = loadSelectedFromStorage();
  const orderItemsEl = document.querySelector("#order-items");
  const emptyCartEl = document.querySelector("#empty-cart");
  const formEl = document.querySelector("#order-form");

  if (Object.keys(selected).length === 0) {
    if (emptyCartEl) emptyCartEl.hidden = false;
    if (orderItemsEl) orderItemsEl.innerHTML = "";
    if (formEl) formEl.classList.add("disabled-form");
    return;
  }

  const res = await fetch(`https://edu.std-900.ist.mospolytech.ru/labs/api/dishes?api_key=${API_KEY}`);
  dishesData = await res.json();

  renderCart();
  renderSummary();
});

function renderCart() {
  const orderList = document.querySelector("#order-items");
  const emptyCartEl = document.querySelector("#empty-cart");
  if (!orderList) return;
  
  orderList.innerHTML = "";
  let total = 0;
  let hasAny = false;

  const categoryMap = {
    soup: "soup",
    starter: "salad",
    salad: "salad",
    main: "main",
    "main-course": "main",
    drink: "drink",
    dessert: "dessert"
  };

  Object.entries(selected).forEach(([key, sel]) => {
    const dish = dishesData.find(d => d.id === sel.id);
    if (!dish) return;
    hasAny = true;
    total += Number(dish.price) || 0;
    const card = document.createElement("div");
    card.className = "dish";
    card.dataset.cat = key;
    card.innerHTML = `
      <img src="${dish.image}" alt="${dish.name}">
      <p class="price">${dish.price} ₽</p>
      <p class="name">${dish.name}</p>
      <p class="weight">${dish.count || ""}</p>
      <button class="remove-btn" type="button">Удалить</button>
    `;
    card.querySelector(".remove-btn").addEventListener("click", () => {
      delete selected[key];
      saveSelectedToStorage(selected);
      renderCart();
      renderSummary();
    });
    orderList.appendChild(card);
  });

  if (emptyCartEl) emptyCartEl.hidden = hasAny;
  const form = document.querySelector("#order-form");
  if (form) {
    form.classList.toggle("disabled-form", !hasAny);
  }
}

function renderSummary() {
  const summaryList = document.querySelector("#summary-list");
  const formTotal = document.querySelector("#form-total");
  const submitBtn = document.querySelector("#submit-btn");
  if (!summaryList) return;

  let total = 0;
  const categoryLabels = {
    soup: "Суп",
    main: "Главное блюдо",
    starter: "Салат",
    salad: "Салат",
    drink: "Напиток",
    dessert: "Десерт"
  };

  const categoryMap = {
    soup: "soup",
    starter: "salad",
    salad: "salad",
    main: "main",
    "main-course": "main",
    drink: "drink",
    dessert: "dessert"
  };

  ["soup", "main", "salad", "drink", "dessert"].forEach(cat => {
    const span = summaryList.querySelector(`[data-summary="${cat}"]`);
    if (!span) return;
    
    let found = null;
    for (let key in selected) {
      const normalized = categoryMap[key] || key;
      if (normalized === cat && selected[key]) {
        found = selected[key];
        break;
      }
    }
    
    if (found) {
      const dish = dishesData.find(d => d.id === found.id);
      if (dish) {
        span.textContent = `${dish.name} — ${dish.price} ₽`;
        total += Number(dish.price) || 0;
      }
    } else {
      span.textContent = cat === "main" ? "Не выбрано" : "Не выбран";
    }
  });

  if (formTotal) formTotal.textContent = `${total} ₽`;
  
  if (submitBtn) {
    const hasAny = Object.keys(selected).length > 0;
    submitBtn.disabled = !hasAny;
  }
}

function saveSelectedToStorage(obj) {
  const ids = {};
  for (let key in obj) ids[key] = obj[key]?.id || null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function loadSelectedFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const ids = JSON.parse(raw);
    const result = {};
    for (let key in ids) if (ids[key]) result[key] = { id: ids[key] };
    return result;
  } catch {
    return {};
  }
}

const formEl = document.querySelector("#order-form");
if (formEl) {
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const order = Object.fromEntries(formData.entries());

    order.delivery_type = order.delivery_type || "now";
    order.subscribe = formData.has("subscribe") ? 1 : 0;

    const categoryMap = {
      soup: "soup_id",
      starter: "salad_id",
      salad: "salad_id",
      main: "main_course_id",
      "main-course": "main_course_id",
      drink: "drink_id",
      dessert: "dessert_id"
    };

    // 📦 Добавляем выбранные блюда
    for (let cat in selected) {
      const apiField = categoryMap[cat];
      if (apiField) order[apiField] = selected[cat].id;
    }

    if (order.delivery_type === "by_time" && !order.delivery_time) {
      alert("Укажите время доставки.");
      return;
    } else if (order.delivery_type !== "by_time") {
      delete order.delivery_time;
    }

    console.log("📤 Отправляем заказ на сервер:");
    console.log(JSON.stringify(order, null, 2));

    const submitBtn = document.querySelector("#submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Отправляем...";
    }

    try {
      const response = await fetch(
        `https://edu.std-900.ist.mospolytech.ru/labs/api/orders?api_key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ошибка ${response.status}: ${err}`);
      }

      alert("✅ Заказ успешно оформлен!");
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = "order.html";
    } catch (error) {
      console.error("❌ Ошибка при оформлении заказа:", error);
      alert("❌ Не удалось оформить заказ. Проверьте данные и попробуйте снова.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Отправить";
      }
    }
  });

  formEl.addEventListener("reset", () => {
    setTimeout(() => renderSummary(), 0);
  });
}
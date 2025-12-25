// orders.js
const API_KEY = "13e357d1-1f58-4491-91a5-427d5c6c0f59"; // тот же ключ, что в других файлах
const ORDERS_API = "https://edu.std-900.ist.mospolytech.ru/labs/api/orders";

let orders = [];
let dishesMap = {}; // id -> {name, price}
document.addEventListener("DOMContentLoaded", init);

async function init() {
  // если dishes ещё не загружены, подождём событие
  if (typeof dishes === "undefined" || !dishes || dishes.length === 0) {
    document.addEventListener("dishesLoaded", () => {
      buildDishesMap();
      loadAndRenderOrders();
    });
  } else {
    buildDishesMap();
    loadAndRenderOrders();
  }
}

function buildDishesMap() {
  if (typeof dishes === "undefined") return;
  dishesMap = {};
  dishes.forEach(d => {
    dishesMap[d.id] = { name: d.name, price: d.price };
  });
}

async function loadAndRenderOrders() {
  const container = document.querySelector("#orders-container");
  container.innerHTML = "<p>Загрузка заказов…</p>";
  try {
    const res = await fetch(`${ORDERS_API}?api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`Ошибка ${res.status}`);
    const data = await res.json();
    // ожидаем массив заказов
    orders = Array.isArray(data) ? data : (data.orders || []);
    // сортировка по дате по убыванию (новые первые)
    orders.sort((a, b) => {
      const da = new Date(a.created_at || a.created || a.date || a.date_created);
      const db = new Date(b.created_at || b.created || b.date || b.date_created);
      return db - da;
    });
    renderOrdersTable();
  } catch (err) {
    container.innerHTML = `<p style="color:red">Не удалось загрузить заказы: ${err.message}</p>`;
    console.error(err);
  }
}

function renderOrdersTable() {
  const container = document.querySelector("#orders-container");
  if (!orders || orders.length === 0) {
    container.innerHTML = `<p>У вас ещё нет оформленных заказов.</p>`;
    return;
  }

  const table = document.createElement("table");
  table.style.width = "100%";
  table.innerHTML = `
    <thead>
      <tr>
        <th>№</th>
        <th>Дата оформления</th>
        <th>Состав заказа</th>
        <th>Стоимость</th>
        <th>Время доставки</th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");
  orders.forEach((ord, idx) => {
    const tr = document.createElement("tr");
    // дата оформления: пытаемся взять возможные поля, иначе raw
    const dateRaw = ord.created_at || ord.created || ord.date || ord.date_created || ord.createdAt || "";
    const dateFormatted = formatDate(dateRaw);
    const composition = formatComposition(ord);
    const cost = ord.cost || ord.total || calculateCostFromOrder(ord) || "—";
    const deliveryLabel = formatDeliveryTime(ord);

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${dateFormatted}</td>
      <td style="max-width:360px; white-space:normal; text-align:left">${escapeHtml(composition)}</td>
      <td style="text-align:center">${cost}₽</td>
      <td style="text-align:center">${escapeHtml(deliveryLabel)}</td>
      <td style="text-align:center">
        <button class="btn-view" data-id="${ord.id}" title="Подробнее">👁️</button>
        <button class="btn-edit" data-id="${ord.id}" title="Редактировать">✏️</button>
        <button class="btn-delete" data-id="${ord.id}" title="Удалить">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  container.innerHTML = "";
  container.appendChild(table);

  // навесим обработчики
  container.querySelectorAll(".btn-view").forEach(btn => btn.addEventListener("click", e => {
    const id = e.currentTarget.dataset.id;
    openViewModal(findOrder(id));
  }));
  container.querySelectorAll(".btn-edit").forEach(btn => btn.addEventListener("click", e => {
    const id = e.currentTarget.dataset.id;
    openEditModal(findOrder(id));
  }));
  container.querySelectorAll(".btn-delete").forEach(btn => btn.addEventListener("click", e => {
    const id = e.currentTarget.dataset.id;
    openDeleteModal(findOrder(id));
  }));
}

/* ---------- форматы / утилиты ---------- */

function findOrder(id) {
  return orders.find(o => String(o.id) === String(id));
}

function formatDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${mon}.${yr} ${hh}:${mm}`;
}

function formatComposition(order) {
  // постараемся собрать список блюд: если сервер вернул names -- используем,
  // иначе попробуем взять поля *_id (main_id, soup_id и т.д.) и смотрим dishesMap
  if (!order) return "";
  if (order.items && Array.isArray(order.items)) {
    return order.items.map(it => it.name || (dishesMap[it.dish_id] && dishesMap[it.dish_id].name) || it.dish_id).join(", ");
  }
  const list = [];
  const keys = Object.keys(order);
  keys.forEach(k => {
    if (/_id$/.test(k) && order[k]) {
      const id = order[k];
      const name = (dishesMap[id] && dishesMap[id].name) || id;
      list.push(name);
    }
  });
  // иногда сервер хранит просто названия в полях main, drink, dessert...
  ["main", "soup", "starter", "drink", "dessert", "main_dish", "drink_name"].forEach(k=>{
    if (order[k]) {
      if (Array.isArray(order[k])) list.push(...order[k]);
      else if (!String(order[k]).endsWith("_id")) list.push(order[k]);
    }
  });
  if (list.length) return list.join(", ");
  // fallback: если есть raw composition field
  if (order.composition) return order.composition;
  return "";
}

function calculateCostFromOrder(order) {
  // если в order есть поля с ценами у блюд (например items with price), суммируем
  if (!order) return 0;
  if (Array.isArray(order.items)) {
    return order.items.reduce((s, it) => s + (Number(it.price) || 0), 0);
  }
  // else try by *_id map prices
  let sum = 0;
  Object.keys(order).forEach(k => {
    if (/_id$/.test(k) && order[k]) {
      const id = order[k];
      const price = (dishesMap[id] && Number(dishesMap[id].price)) || 0;
      sum += price;
    }
  });
  return sum || 0;
}

function formatDeliveryTime(order) {
  // если delivery_type === 'by_time' и delivery_time задано
  if (!order) return "";
  const dt = order.delivery_type || order.type || "";
  const time = order.delivery_time || order.time || order.deliveryTime || "";
  if (dt === "by_time" || dt === "time" || dt === "to_time" || String(dt).toLowerCase().includes("time")) {
    return time || "—";
  }
  // по умолчанию "Как можно скорее (с 07:00 до 23:00)"
  return "Как можно скорее (с 07:00 до 23:00)";
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------- Модальные окна ---------- */

function makeModal(title, innerHtml) {
  // создаёт общий фон + окно и возвращает объект {el, close()}
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.4)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9998";

  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.borderRadius = "8px";
  box.style.width = "640px";
  box.style.maxWidth = "95%";
  box.style.maxHeight = "90%";
  box.style.overflow = "auto";
  box.style.padding = "18px";
  box.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)";
  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h3 style="margin:0">${escapeHtml(title)}</h3>
      <button class="modal-close" aria-label="Закрыть" style="background:none;border:0;font-size:20px;cursor:pointer">✖</button>
    </div>
    <div class="modal-body">${innerHtml}</div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  box.querySelector(".modal-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  return { el: overlay, box, close };
}

function openViewModal(order) {
  if (!order) return alert("Заказ не найден");
  const composition = formatComposition(order);
  let itemsHtml = "";
  if (order.items && Array.isArray(order.items) && order.items.length) {
    itemsHtml = order.items.map(it => `<div>${escapeHtml(it.name || it.dish_id)} ${it.price ? `(${it.price}₽)` : ""}</div>`).join("");
  } else {
    // соберём по полям *_id
    const parts = [];
    Object.keys(order).forEach(k => {
      if (/_id$/.test(k) && order[k]) {
        const id = order[k];
        parts.push(dishesMap[id] ? `${dishesMap[id].name} (${dishesMap[id].price}₽)` : id);
      }
    });
    itemsHtml = parts.length ? parts.map(p => `<div>${escapeHtml(p)}</div>`).join("") : `<div>${escapeHtml(composition || "—")}</div>`;
  }

  const html = `
    <div style="border-bottom:1px solid #ddd;padding-bottom:10px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between">
        <div><strong>Дата оформления</strong></div>
        <div>${escapeHtml(formatDate(order.created_at || order.created || order.date || order.date_created))}</div>
      </div>
      <h4 style="margin-top:12px">Доставка</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div><strong>Имя получателя</strong></div><div>${escapeHtml(order.full_name || order.name || "")}</div>
        <div><strong>Адрес доставки</strong></div><div>${escapeHtml(order.delivery_address || order.address || "")}</div>
        <div><strong>Время доставки</strong></div><div>${escapeHtml(formatDeliveryTime(order))}</div>
        <div><strong>Телефон</strong></div><div>${escapeHtml(order.phone || "")}</div>
        <div><strong>Email</strong></div><div>${escapeHtml(order.email || "")}</div>
      </div>

      <h4 style="margin-top:12px">Комментарий</h4>
      <div>${escapeHtml(order.comment || "")}</div>
      <h4 style="margin-top:12px">Состав заказа</h4>
      <div>${itemsHtml}</div>
      <p style="font-weight:700;margin-top:12px">Стоимость: ${escapeHtml(String(order.cost || order.total || calculateCostFromOrder(order)))}₽</p>
    </div>
    <div style="text-align:right">
      <button class="modal-ok" style="padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#f7f7f7;cursor:pointer">Ок</button>
    </div>
  `;

  const modal = makeModal("Просмотр заказа", html);
  modal.box.querySelector(".modal-ok").addEventListener("click", () => modal.close());
}

function openEditModal(order) {
  if (!order) return alert("Заказ не найден");
  // поля доступные для редактирования: full_name, email, phone, delivery_address, delivery_type, delivery_time, comment
  const deliveryType = order.delivery_type || order.type || "now";
  const deliveryTimeValue = order.delivery_time || order.time || "";

  const html = `
    <form id="edit-order-form" style="display:flex;flex-direction:column;gap:8px">
      <label>Имя получателя
        <input name="full_name" value="${escapeHtml(order.full_name || order.name || "")}" required />
      </label>
      <label>Email
        <input name="email" type="email" value="${escapeHtml(order.email || "")}" required />
      </label>
      <label>Телефон
        <input name="phone" value="${escapeHtml(order.phone || "")}" required />
      </label>
      <label>Адрес доставки
        <input name="delivery_address" value="${escapeHtml(order.delivery_address || order.address || "")}" required />
      </label>
      <div>
        <label><input type="radio" name="delivery_type" value="now" ${deliveryType === "now" ? "checked":""}/> Как можно скорее</label>
        <label style="margin-left:12px"><input type="radio" name="delivery_type" value="by_time" ${deliveryType === "by_time" ? "checked":""}/> К указанному времени</label>
      </div>
      <label>Время доставки
        <input name="delivery_time" type="time" value="${formatTimeForInput(deliveryTimeValue)}" />
      </label>
      <label>Комментарий
        <textarea name="comment" rows="3">${escapeHtml(order.comment || "")}</textarea>
      </label>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
        <button type="button" id="edit-cancel" style="padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#f7f7f7;cursor:pointer">Отмена</button>
        <button type="submit" id="edit-save" style="padding:8px 14px;border-radius:8px;border:0;background:#2ca02c;color:#fff;cursor:pointer">Сохранить</button>
      </div>
    </form>
  `;

  const modal = makeModal("Редактирование заказа", html);
  const form = modal.box.querySelector("#edit-order-form");
  modal.box.querySelector("#edit-cancel").addEventListener("click", () => modal.close());
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {};
    for (const [k, v] of fd.entries()) payload[k] = v;
    // если delivery_type == now, удалим delivery_time
    if (payload.delivery_type !== "by_time") payload.delivery_time = "";
    // отправляем PUT
    try {
      const resp = await fetch(`${ORDERS_API}/${order.id}?api_key=${API_KEY}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const text = await resp.text().catch(()=>"");
        throw new Error(`Ошибка сервера ${resp.status} ${text}`);
      }
      const updated = await resp.json().catch(()=>null);
      // обновим локальный массив orders (получим либо серверный ответ, либо применим изменения на клиенте)
      if (updated && (updated.id || updated.id === 0)) {
        const i = orders.findIndex(o => String(o.id) === String(updated.id));
        if (i !== -1) orders[i] = updated;
      } else {
        // применяем вручную
        const i = orders.findIndex(o => String(o.id) === String(order.id));
        if (i !== -1) orders[i] = { ...orders[i], ...payload };
      }
      renderOrdersTable();
      modal.close();
      notify("Заказ успешно изменён", true);
    } catch (err) {
      console.error(err);
      notify("Ошибка изменения заказа: " + (err.message || err), false);
    }
  });
}

function openDeleteModal(order) {
  if (!order) return alert("Заказ не найден");
  const html = `
    <p>Вы уверены, что хотите удалить заказ?</p>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
      <button id="del-cancel" style="padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#f7f7f7;cursor:pointer">Отмена</button>
      <button id="del-yes" style="padding:8px 14px;border-radius:8px;border:0;background:#c62828;color:#fff;cursor:pointer">Да</button>
    </div>
  `;
  const modal = makeModal("Удаление заказа", html);
  modal.box.querySelector("#del-cancel").addEventListener("click", () => modal.close());
  modal.box.querySelector("#del-yes").addEventListener("click", async () => {
    try {
      const resp = await fetch(`${ORDERS_API}/${order.id}?api_key=${API_KEY}`, { method: "DELETE" });
      if (!resp.ok) {
        const txt = await resp.text().catch(()=>"");
        throw new Error(`Ошибка сервера ${resp.status} ${txt}`);
      }
      orders = orders.filter(o => String(o.id) !== String(order.id));
      renderOrdersTable();
      modal.close();
      notify("Заказ успешно удалён", true);
    } catch (err) {
      console.error(err);
      notify("Ошибка удаления заказа: " + (err.message || err), false);
    }
  });
}

function notify(message, success = true) {
  const n = document.createElement("div");
  n.className = "notification";
  n.style.position = "fixed";
  n.style.inset = "0";
  n.style.display = "flex";
  n.style.justifyContent = "center";
  n.style.alignItems = "center";
  n.style.zIndex = "10000";
  n.innerHTML = `
    <div class="notification-content" style="max-width:520px; border:1px solid ${success ? "#2ca02c" : "#c62828"}">
      <p>${escapeHtml(message)}</p>
      <div style="text-align:center">
        <button id="notif-ok" style="padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#f7f7f7;cursor:pointer">Ок</button>
      </div>
    </div>
  `;
  document.body.appendChild(n);
  n.querySelector("#notif-ok").addEventListener("click", () => n.remove());
  setTimeout(() => n.remove(), 4000);
}

function formatTimeForInput(timeStr) {
  if (!timeStr) return "";
  if (/^\d\d:\d\d$/.test(timeStr)) return timeStr;
  const m = timeStr.match(/(\d{2}:\d{2})/);
  if (m) return m[1];
  const dt = new Date(timeStr);
  if (!isNaN(dt)) {
    return String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0");
  }
  return "";
}
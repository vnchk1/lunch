document.addEventListener("DOMContentLoaded", () => {
  const categories = ["soup", "main", "drink"];
  const mainContainer = document.querySelector("main");
  const orderBox = document.querySelector("#order-box");
  const soupInput = document.querySelector("#soupInput");
  const mainInput = document.querySelector("#mainInput");
  const drinkInput = document.querySelector("#drinkInput");

  const selected = { soup: null, main: null, drink: null };

  // Сортировка блюд по категориям
  const sortedDishes = {};
  categories.forEach(cat => {
    sortedDishes[cat] = dishes
      .filter(d => d.category === cat)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // Рендер каждой категории
  categories.forEach(cat => {
    const section = document.createElement("section");
    const title =
      cat === "soup" ? "Выберите суп" :
      cat === "main" ? "Выберите главное блюдо" :
      "Выберите напиток";
    section.innerHTML = `<h2>${title}</h2>`;

    const grid = document.createElement("div");
    grid.classList.add("menu-grid");

    sortedDishes[cat].forEach(dish => {
      const card = document.createElement("div");
      card.classList.add("dish");
      card.dataset.dish = dish.keyword;

      card.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}">
        <p class="price">${dish.price} ₽</p>
        <p class="name">${dish.name}</p>
        <p class="weight">${dish.count}</p>
        <button type="button">Добавить</button>
      `;

      // Обработка выбора
      card.querySelector("button").addEventListener("click", () => {
        selected[cat] = dish;
        updateOrder();
        highlightSelected(cat, dish.keyword);
      });

      grid.appendChild(card);
    });

    // Добавляем секцию перед формой
    const form = document.querySelector("#order-form");
    mainContainer.insertBefore(section, form);
    section.appendChild(grid);
  });

  function updateOrder() {
    let total = 0;
    let html = "";

    categories.forEach(cat => {
      if (selected[cat]) {
        total += selected[cat].price;
        html += `<p><strong>${
          cat === "soup" ? "Суп" : cat === "main" ? "Главное блюдо" : "Напиток"
        }:</strong> ${selected[cat].name} — ${selected[cat].price} ₽</p>`;
      } else {
        html += `<p><strong>${
          cat === "soup" ? "Суп" : cat === "main" ? "Главное блюдо" : "Напиток"
        }:</strong> не выбрано</p>`;
      }
    });

    if (total > 0) html += `<p><strong>Итого: ${total} ₽</strong></p>`;
    else html = "<p>Ничего не выбрано</p>";

    orderBox.innerHTML = html;

    // Передача значений в скрытые поля формы
    soupInput.value = selected.soup ? selected.soup.keyword : "";
    mainInput.value = selected.main ? selected.main.keyword : "";
    drinkInput.value = selected.drink ? selected.drink.keyword : "";
  }

  function highlightSelected(cat, keyword) {
    const sections = mainContainer.querySelectorAll("section");
    const section = sections[categories.indexOf(cat)];
    const cards = section.querySelectorAll(".dish");
    cards.forEach(c => {
      c.style.border = c.dataset.dish === keyword ? "2px solid tomato" : "none";
    });
  }
});

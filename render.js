document.addEventListener("DOMContentLoaded", () => {
  const categories = ["soup", "main", "drink"];
  const mainContainer = document.querySelector("main");

  // Контейнер для заказа
  const orderBox = document.createElement("div");
  orderBox.id = "order-box";
  orderBox.style.marginTop = "30px";
  orderBox.style.padding = "20px";
  orderBox.style.background = "white";
  orderBox.style.borderRadius = "10px";
  orderBox.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
  orderBox.innerHTML = "<p>Ничего не выбрано</p>";

  const selected = { soup: null, main: null, drink: null };

  const sortedDishes = {};
  categories.forEach(cat => {
    sortedDishes[cat] = dishes
      .filter(d => d.category === cat)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // Рендерим каждую категорию
  categories.forEach(cat => {
    const section = document.createElement("section");
    const title =
      cat === "soup" ? "Супы" :
      cat === "main" ? "Главные блюда" : "Напитки";
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

      card.querySelector("button").addEventListener("click", () => {
        selected[cat] = dish;
        updateOrder();
        highlightSelected(cat, dish.keyword);
      });

      grid.appendChild(card);
    });

    section.appendChild(grid);
    mainContainer.appendChild(section);
  });

  // Добавляем контейнер заказа после всех секций
  mainContainer.appendChild(orderBox);

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

    if (total > 0) {
      html += `<p><strong>Итого: ${total} ₽</strong></p>`;
    }

    orderBox.innerHTML = html;
  }

  function highlightSelected(cat, keyword) {
    const sections = mainContainer.querySelectorAll("section");
    const section = sections[categories.indexOf(cat)];
    const cards = section.querySelectorAll(".dish");
    cards.forEach(c => {
      if (c.dataset.dish === keyword) {
        c.style.border = "2px solid tomato";
      } else {
        c.style.border = "none";
      }
    });
  }
});
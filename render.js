document.addEventListener("DOMContentLoaded", () => {
  // порядок категорий — можно менять
  const categories = ["soup", "main", "salad", "dessert", "drink"];
  const mainContainer = document.querySelector("main");
  const orderBox = document.querySelector("#order-box");
  const soupInput = document.querySelector("#soupInput");
  const mainInput = document.querySelector("#mainInput");
  const drinkInput = document.querySelector("#drinkInput");
  const saladInput = document.querySelector("#saladInput");
  const dessertInput = document.querySelector("#dessertInput");

  const selected = { soup: null, main: null, drink: null, salad: null, dessert: null };

  // Конфигурация фильтров для каждой категории (id фильтров должны совпадать со значениями kind)
  const filtersConfig = {
    soup: [
      { id: "all", label: "Все" },
      { id: "meat", label: "Мясной" },
      { id: "fish", label: "Рыбный" },
      { id: "veg", label: "Вегетарианский" }
    ],
    main: [
      { id: "all", label: "Все" },
      { id: "meat", label: "Мясное" },
      { id: "fish", label: "Рыбное" },
      { id: "veg", label: "Вегетарианское" }
    ],
    salad: [
      { id: "all", label: "Все" },
      { id: "meat", label: "С мясом" },
      { id: "fish", label: "С рыбой" },
      { id: "veg", label: "Вегетарианские" }
    ],
    dessert: [
      { id: "all", label: "Все" },
      { id: "chocolate", label: "Шоколадные" },
      { id: "fruit", label: "Фруктовые" },
      { id: "cold", label: "Холодные" }
    ],
    drink: [
      { id: "all", label: "Все" },
      { id: "cold", label: "Холодные" },
      { id: "hot", label: "Горячие" }
    ]
  };

  // текущие активные фильтры (по умолчанию all)
  const activeFilter = {};
  categories.forEach(cat => activeFilter[cat] = "all");

  // Сортировка блюд по категориям
  const sortedDishes = {};
  categories.forEach(cat => {
    sortedDishes[cat] = dishes
      .filter(d => d.category === cat)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // Рендер каждой категории с фильтрами и гридом
  categories.forEach(cat => {
    const section = document.createElement("section");
    const title =
      cat === "soup" ? "Выберите суп" :
      cat === "main" ? "Выберите главное блюдо" :
      cat === "drink" ? "Выберите напиток" :
      cat === "salad" ? "Выберите салат" :
      "Выберите десерт";
    section.innerHTML = `<h2>${title}</h2>`;

    // Блок фильтров (если есть конфигурация)
    const filters = document.createElement("div");
    filters.classList.add("filters");

    const cfg = filtersConfig[cat] || [{ id: "all", label: "Все" }];
    cfg.forEach(f => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.classList.add("filter-btn");
      btn.dataset.filter = f.id;   // data-filter у кнопки
      btn.textContent = f.label;
      if (f.id === "all") btn.classList.add("active");
      btn.addEventListener("click", () => {
        // переключаем активный фильтр
        activeFilter[cat] = f.id;
        // обновляем визуал кнопок
        const allBtns = filters.querySelectorAll(".filter-btn");
        allBtns.forEach(b => b.classList.toggle("active", b.dataset.filter === f.id));
        // обновляем список карточек (в том же разделе)
        applyFilterToSection(section, cat);
      });
      filters.appendChild(btn);
    });

    section.appendChild(filters);

    // Грид карточек
    const grid = document.createElement("div");
    grid.classList.add("menu-grid");
    section.appendChild(grid);

    // Если для категории нет блюд — выводим подсказку
    if (!sortedDishes[cat] || sortedDishes[cat].length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Пока нет доступных позиций в этой категории.";
      section.appendChild(empty);
    } else {
      // наполняем начально (с учетом фильтра all)
      sortedDishes[cat].forEach(dish => {
        const card = createDishCard(dish, cat);
        grid.appendChild(card);
      });
    }

    // Добавляем секцию перед формой
    const form = document.querySelector("#order-form");
    mainContainer.insertBefore(section, form);
  });

  // Создание карточки блюда
  function createDishCard(dish, cat) {
    const card = document.createElement("div");
    card.classList.add("dish");
    card.dataset.dish = dish.keyword;
    // store kind as data-kind
    card.dataset.kind = dish.kind || "";

    // Создаём img вручную чтобы повесить обработчик onerror
    const img = document.createElement("img");
    img.alt = dish.name;

    // placeholder (SVG data-uri)
    const placeholder =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
           <rect width='100%' height='100%' fill='#efefef'/>
           <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#777' font-family='Arial' font-size='20'>Изображение недоступно</text>
         </svg>`
      );

    img.src = dish.image;
    img.onerror = () => {
      console.warn('Ошибка загрузки изображения:', dish.image, 'для блюда', dish.keyword);
      img.src = placeholder;
    };

    const priceP = document.createElement("p");
    priceP.className = "price";
    priceP.textContent = `${dish.price} ₽`;

    const nameP = document.createElement("p");
    nameP.className = "name";
    nameP.textContent = dish.name;

    const weightP = document.createElement("p");
    weightP.className = "weight";
    weightP.textContent = dish.count;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Добавить";
    btn.addEventListener("click", () => {
      selected[cat] = dish;
      updateOrder();
      highlightSelected(cat, dish.keyword);
    });

    // собираем карточку
    card.appendChild(img);
    card.appendChild(priceP);
    card.appendChild(nameP);
    card.appendChild(weightP);
    card.appendChild(btn);

    return card;
  }

  // Применить фильтр к секции — показывает/скрывает карточки (по data-kind)
  function applyFilterToSection(section, cat) {
    const filterId = activeFilter[cat];
    const grid = section.querySelector(".menu-grid");
    if (!grid) return;
    const cards = grid.querySelectorAll(".dish");
    let anyVisible = false;
    cards.forEach(card => {
      const kind = card.dataset.kind || "";
      const show = filterId === "all" || kind === filterId;
      card.style.display = show ? "" : "none";
      if (show) anyVisible = true;
    });

    // сообщение если пусто
    let emptyNote = section.querySelector(".empty-note");
    if (!anyVisible) {
      if (!emptyNote) {
        emptyNote = document.createElement("p");
        emptyNote.classList.add("empty-note");
        emptyNote.textContent = "По выбранному фильтру нет позиций.";
        section.appendChild(emptyNote);
      }
    } else {
      if (emptyNote) emptyNote.remove();
    }
  }

  function updateOrder() {
    let total = 0;
    let html = "";

    categories.forEach(cat => {
      const label =
        cat === "soup" ? "Суп" :
        cat === "main" ? "Главное блюдо" :
        cat === "drink" ? "Напиток" :
        cat === "salad" ? "Салат" :
        "Десерт";

      if (selected[cat]) {
        total += selected[cat].price;
        html += `<p><strong>${label}:</strong> ${selected[cat].name} — ${selected[cat].price} ₽</p>`;
      } else {
        html += `<p><strong>${label}:</strong> не выбрано</p>`;
      }
    });

    if (total > 0) html += `<p><strong>Итого: ${total} ₽</strong></p>`;
    else html = "<p>Ничего не выбрано</p>";

    orderBox.innerHTML = html;

    // Передача значений в скрытые поля формы
    soupInput.value = selected.soup ? selected.soup.keyword : "";
    mainInput.value = selected.main ? selected.main.keyword : "";
    drinkInput.value = selected.drink ? selected.drink.keyword : "";
    saladInput.value = selected.salad ? selected.salad.keyword : "";
    dessertInput.value = selected.dessert ? selected.dessert.keyword : "";
  }

  function highlightSelected(cat, keyword) {
    const sections = mainContainer.querySelectorAll("section");
    const section = sections[categories.indexOf(cat)];
    if (!section) return;
    const cards = section.querySelectorAll(".dish");
    cards.forEach(c => {
      c.style.border = c.dataset.dish === keyword ? "2px solid tomato" : "none";
    });
  }

  // Инициализация — применяем фильтры (all) ко всем секциям, чтобы поставить сообщения корректно
  const allSections = mainContainer.querySelectorAll("section");
  allSections.forEach((section, idx) => {
    const cat = categories[idx];
    applyFilterToSection(section, cat);
  });

});

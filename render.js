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
    section.dataset.category = cat; // Добавляем data-атрибут для идентификации категории
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
      // Сразу применяем фильтр "all" для отображения всех карточек
      applyFilterToSection(section, cat);
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
    // Убеждаемся, что карточка видима по умолчанию
    card.style.display = "";

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
      // Проверяем, не заблокирована ли секция
      const section = card.closest("section[data-category]");
      if (section && section.classList.contains("locked-section")) {
        return; // Не позволяем выбирать блюда из заблокированных секций
      }
      
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
    
    // Обновляем состояния секций после изменения заказа
    if (typeof updateSectionStates === 'function') {
      setTimeout(() => updateSectionStates(), 0);
    }
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
  // Примечание: applyFilterToSection уже вызывается при создании каждой секции выше,
  // но вызываем еще раз для гарантии, что все карточки отображаются правильно
  const allSections = mainContainer.querySelectorAll("section[data-category]");
  allSections.forEach((section) => {
    const cat = section.dataset.category;
    if (cat) {
      applyFilterToSection(section, cat);
    }
  });

  // Логика работы с комбо
  const combos = document.querySelectorAll(".combo");
  const comboStatus = document.querySelector(".combo-status");
  const cancelComboBtn = document.querySelector(".cancel-combo-btn");
  let activeCombo = null;
  let dessertAdded = false;
  let allowedCategories = [];

  // Маппинг названий категорий
  const categoryMap = {
    "Суп": "soup",
    "Главное блюдо": "main",
    "Салат": "salad",
    "Напиток": "drink",
    "Десерт": "dessert"
  };

  // Обработка кликов на комбо
  combos.forEach(combo => {
    combo.addEventListener("click", () => {
      const comboData = JSON.parse(combo.dataset.combo || "{}");
      
      // Если это десерт
      if (comboData.dessert) {
        dessertAdded = !dessertAdded;
        combo.classList.toggle("active-combo", dessertAdded);
        updateComboStatus();
        updateSectionStates();
        return;
      }

      // Если кликнули на то же комбо - отменяем выбор
      if (activeCombo === combo) {
        activeCombo = null;
        combo.classList.remove("active-combo");
        cancelComboBtn.style.display = "none";
        allowedCategories = dessertAdded ? ["dessert"] : [];
      } else {
        // Убираем подсветку с других комбо (кроме десерта)
        combos.forEach(c => {
          if (!c.classList.contains("dessert-combo")) {
            c.classList.remove("active-combo");
          }
        });
        
        activeCombo = combo;
        combo.classList.add("active-combo");
        cancelComboBtn.style.display = "inline-block";
        
        // Определяем разрешенные категории
        allowedCategories = [];
        if (comboData.soup) allowedCategories.push("soup");
        if (comboData.main) allowedCategories.push("main");
        if (comboData.salad) allowedCategories.push("salad");
        if (comboData.drink) allowedCategories.push("drink");
        if (dessertAdded) allowedCategories.push("dessert");
      }

      updateComboStatus();
      updateSectionStates();
    });
  });

  // Кнопка отмены комбо
  cancelComboBtn.addEventListener("click", () => {
    if (activeCombo) {
      activeCombo.classList.remove("active-combo");
      activeCombo = null;
    }
    cancelComboBtn.style.display = "none";
    allowedCategories = dessertAdded ? ["dessert"] : [];
    updateComboStatus();
    updateSectionStates();
  });

  // Обработчик сброса формы
  const resetBtn = orderForm?.querySelector('button[type="reset"]');
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Сбрасываем состояние комбо
      if (activeCombo) {
        activeCombo.classList.remove("active-combo");
        activeCombo = null;
      }
      dessertAdded = false;
      const dessertCombo = document.querySelector(".dessert-combo");
      if (dessertCombo) {
        dessertCombo.classList.remove("active-combo");
      }
      cancelComboBtn.style.display = "none";
      allowedCategories = [];
      
      // Сбрасываем выбранные блюда
      categories.forEach(cat => {
        selected[cat] = null;
      });
      
      // Обновляем интерфейс
      setTimeout(() => {
        updateComboStatus();
        updateSectionStates();
        updateOrder();
        // Сбрасываем подсветку карточек
        const allCards = mainContainer.querySelectorAll(".dish");
        allCards.forEach(c => {
          c.style.border = "none";
        });
      }, 0);
    });
  }

  // Инициализация состояний секций при загрузке
  setTimeout(() => {
    if (typeof updateSectionStates === 'function') {
      updateSectionStates();
    }
  }, 100);

  // Обновление статуса комбо
  function updateComboStatus() {
    if (!activeCombo && !dessertAdded) {
      comboStatus.innerHTML = "<p>Комбо не выбрано</p>";
      return;
    }

    const baseCats = activeCombo 
      ? Object.keys(JSON.parse(activeCombo.dataset.combo || "{}"))
          .filter(cat => cat !== "dessert" && JSON.parse(activeCombo.dataset.combo)[cat])
      : [];
    
    const totalCats = dessertAdded ? [...baseCats, "dessert"] : baseCats;
    
    const categoryNames = {
      soup: "Суп",
      main: "Главное блюдо",
      salad: "Салат",
      drink: "Напиток",
      dessert: "Десерт"
    };
    
    const names = totalCats.map(cat => categoryNames[cat] || cat);
    comboStatus.innerHTML = `<p>Собираем комбо: ${names.join(" + ")}</p>`;
  }

  // Обновление состояний секций (подсветка и блокировка)
  function updateSectionStates() {
    const sections = mainContainer.querySelectorAll("section[data-category]");
    
    sections.forEach(section => {
      const sectionCategory = section.dataset.category;
      const isDessert = sectionCategory === "dessert";
      
      // Убираем все классы подсветки
      section.classList.remove("highlight-section", "locked-section");
      
      if (activeCombo) {
        // Если есть активное комбо
        if (allowedCategories.includes(sectionCategory)) {
          // Подсвечиваем разрешенные категории
          section.classList.add("highlight-section");
        } else if (!isDessert || !dessertAdded) {
          // Блокируем неразрешенные (кроме десерта, если он добавлен)
          section.classList.add("locked-section");
        }
      } else {
        // Если комбо не выбрано
        if (isDessert && !dessertAdded) {
          // Блокируем десерт, если он не добавлен отдельно
          section.classList.add("locked-section");
        }
      }
    });
  }

});

// Отдельный блок для обработки submit формы (как у товарища)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#order-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Получаем значения из скрытых полей
    const soupInput = document.querySelector("#soupInput");
    const mainInput = document.querySelector("#mainInput");
    const saladInput = document.querySelector("#saladInput");
    const drinkInput = document.querySelector("#drinkInput");
    const dessertInput = document.querySelector("#dessertInput");

    const soupVal = soupInput?.value || "";
    const mainVal = mainInput?.value || "";
    const saladVal = saladInput?.value || "";
    const drinkVal = drinkInput?.value || "";
    const dessertVal = dessertInput?.value || "";

    const hasSoup = !!soupVal;
    const hasMain = !!mainVal;
    const hasSalad = !!saladVal;
    const hasDrink = !!drinkVal;
    const hasDessert = !!dessertVal;

    // Подсчитываем количество выбранных основных блюд (без десерта)
    const selectedCount = [hasSoup, hasMain, hasSalad, hasDrink].filter(Boolean).length;

    // 1. Ничего не выбрано - когда не добавлено ни одного блюда
    if (selectedCount === 0 && !hasDessert) {
      showNotification("Ничего не выбрано. Выберите блюда для заказа");
      return;
    }

    // 5. Выберите главное блюдо - когда выбран напиток или десерт (но нет других блюд)
    if ((hasDrink || hasDessert) && !hasSoup && !hasMain && !hasSalad) {
      showNotification("Выберите главное блюдо");
      return;
    }

    // 3. Выберите главное блюдо/салат/стартер - когда выбран суп, но не выбраны главное блюдо, салат или стартер
    if (hasSoup && !hasMain && !hasSalad) {
      showNotification("Выберите главное блюдо/салат/стартер");
      return;
    }

    // 4. Выберите суп или главное блюдо - когда выбран салат или стартер, но не выбран суп или главное блюдо
    if (hasSalad && !hasSoup && !hasMain) {
      showNotification("Выберите суп или главное блюдо");
      return;
    }

    // 2. Выберите напиток - когда выбраны все необходимые блюда, но не выбран напиток
    // Проверяем валидные комбинации без напитка
    if (!hasDrink) {
      // Суп + Главное + Салат (нужен напиток)
      if (hasSoup && hasMain && hasSalad) {
        showNotification("Выберите напиток");
        return;
      }
      // Суп + Главное (нужен напиток)
      if (hasSoup && hasMain && !hasSalad) {
        showNotification("Выберите напиток");
        return;
      }
      // Главное + Салат (нужен напиток)
      if (!hasSoup && hasMain && hasSalad) {
        showNotification("Выберите напиток");
        return;
      }
      // Суп + Салат (нужен напиток)
      if (hasSoup && !hasMain && hasSalad) {
        showNotification("Выберите напиток");
        return;
      }
      // Только Главное (нужен напиток)
      if (!hasSoup && hasMain && !hasSalad) {
        showNotification("Выберите напиток");
        return;
      }
    }

    // Если все проверки пройдены, проверяем финальное соответствие комбо
    const combos = [
      { soup: true, main: true, salad: true, drink: true },
      { soup: true, main: true, salad: false, drink: true },
      { soup: false, main: true, salad: true, drink: true },
      { soup: true, main: false, salad: true, drink: true },
      { soup: false, main: true, salad: false, drink: true }
    ];

    const selectedCombo = {
      soup: hasSoup,
      main: hasMain,
      salad: hasSalad,
      drink: hasDrink
    };

    let matchedCombo = false;
    for (const combo of combos) {
      let matches = true;
      for (const cat in combo) {
        if (combo[cat] !== selectedCombo[cat]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        matchedCombo = true;
        break;
      }
    }

    // Если комбо не соответствует ни одному варианту, показываем общее сообщение
    if (!matchedCombo) {
      showNotification("Ничего не выбрано. Выберите блюда для заказа");
      return;
    }

    // Если всё в порядке, отправляем форму
    showNotification("Заказ успешно оформлен! ✅");
    setTimeout(() => {
      form.submit();
    }, 1000);
  });

  function showNotification(message) {
    const existing = document.querySelector(".notification");
    if (existing) {
      existing.remove();
    }

    const wrapper = document.createElement("div");
    wrapper.className = "notification";
    wrapper.innerHTML = `
      <div class="notification-content">
        <p>${message}</p>
        <button id="notif-ok">Окей 👌</button>
      </div>
    `;
    document.body.appendChild(wrapper);

    const okBtn = wrapper.querySelector("#notif-ok");
    okBtn.addEventListener("click", () => {
      wrapper.remove();
    });
  }
});

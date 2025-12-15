const STORAGE_KEY = "freshlunch-order";
const categories = ["soup", "main", "salad", "dessert", "drink"];
const categoryLabels = {
  soup: "Суп",
  main: "Главное блюдо",
  salad: "Салат",
  drink: "Напиток",
  dessert: "Десерт"
};

let menuRendered = false;
let selected = createEmptySelection();
let storedSelection = loadSelectionFromStorage();

function renderMenu() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMenu, { once: true });
    return;
  }

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return;
  }

  if (menuRendered) return;
  menuRendered = true;

  const mainContainer = document.querySelector("#menu-root") || document.querySelector("main");
  const orderBox = document.querySelector("#order-box");
  const checkoutPanel = document.querySelector("#checkout-panel");
  const checkoutLink = document.querySelector("#checkout-link");
  const orderTotalEl = document.querySelector("#order-total");

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

  const activeFilter = {};
  categories.forEach(cat => (activeFilter[cat] = "all"));

  const sortedDishes = {};
  categories.forEach(cat => {
    sortedDishes[cat] = (dishes || [])
      .filter(d => d.category === cat)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  const dishesById = new Map();
  dishes.forEach(d => dishesById.set(String(d.id), d));

  categories.forEach(cat => {
    const storedId = storedSelection[cat];
    if (storedId && dishesById.has(String(storedId))) {
      selected[cat] = dishesById.get(String(storedId));
    }
  });

  categories.forEach(cat => {
    const section = document.createElement("section");
    section.dataset.category = cat;
    const title =
      cat === "soup" ? "Выберите суп" :
      cat === "main" ? "Выберите главное блюдо" :
      cat === "drink" ? "Выберите напиток" :
      cat === "salad" ? "Выберите салат" :
      "Выберите десерт";
    section.innerHTML = `<h2>${title}</h2>`;

    const filters = document.createElement("div");
    filters.classList.add("filters");

    const cfg = filtersConfig[cat] || [{ id: "all", label: "Все" }];
    cfg.forEach(f => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.classList.add("filter-btn");
      btn.dataset.filter = f.id;
      btn.textContent = f.label;
      if (f.id === "all") btn.classList.add("active");
      btn.addEventListener("click", () => {
        activeFilter[cat] = f.id;
        const allBtns = filters.querySelectorAll(".filter-btn");
        allBtns.forEach(b => b.classList.toggle("active", b.dataset.filter === f.id));
        applyFilterToSection(section, cat);
      });
      filters.appendChild(btn);
    });

    section.appendChild(filters);

    const grid = document.createElement("div");
    grid.classList.add("menu-grid");
    section.appendChild(grid);

    if (!sortedDishes[cat] || sortedDishes[cat].length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Пока нет доступных позиций в этой категории.";
      section.appendChild(empty);
    } else {
      sortedDishes[cat].forEach(dish => {
        const card = createDishCard(dish, cat);
        grid.appendChild(card);
      });
      applyFilterToSection(section, cat);
    }

    mainContainer.appendChild(section);
  });

  const allSections = mainContainer.querySelectorAll("section[data-category]");
  allSections.forEach(section => {
    const cat = section.dataset.category;
    if (cat) {
      applyFilterToSection(section, cat);
    }
  });

  const combos = document.querySelectorAll(".combo");
  const comboStatus = document.querySelector(".combo-status");
  const cancelComboBtn = document.querySelector(".cancel-combo-btn");
  let activeCombo = null;
  let dessertAdded = !!selected.dessert;
  let allowedCategories = dessertAdded ? ["dessert"] : [];

  combos.forEach(combo => {
    const comboData = JSON.parse(combo.dataset.combo || "{}");
    if (comboData.dessert && dessertAdded) {
      combo.classList.add("active-combo");
    }
  });

  combos.forEach(combo => {
    combo.addEventListener("click", () => {
      const comboData = JSON.parse(combo.dataset.combo || "{}");

      if (comboData.dessert) {
        dessertAdded = !dessertAdded;
        combo.classList.toggle("active-combo", dessertAdded);
        if (!dessertAdded) {
          selected.dessert = null;
          saveSelectionToStorage(selected);
        }
        updateComboStatus();
        updateSectionStates();
        updateOrder();
        return;
      }

      if (activeCombo === combo) {
        activeCombo = null;
        combo.classList.remove("active-combo");
        cancelComboBtn.style.display = "none";
        allowedCategories = dessertAdded ? ["dessert"] : [];
      } else {
        combos.forEach(c => {
          if (!c.classList.contains("dessert-combo")) {
            c.classList.remove("active-combo");
          }
        });

        activeCombo = combo;
        combo.classList.add("active-combo");
        cancelComboBtn.style.display = "inline-block";

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

  setTimeout(() => {
    if (typeof updateSectionStates === "function") {
      updateSectionStates();
    }
    updateOrder(true);
  }, 100);

  function createDishCard(dish, cat) {
    const card = document.createElement("div");
    card.classList.add("dish");
    card.dataset.dish = dish.keyword || String(dish.id);
    card.dataset.kind = dish.kind || "";
    card.style.display = "";

    const img = document.createElement("img");
    img.alt = dish.name;

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
      console.warn("Ошибка загрузки изображения:", dish.image, "для блюда", dish.keyword);
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
    btn.textContent = selected[cat]?.id === dish.id ? "В заказе" : "Добавить";
    btn.classList.toggle("selected-btn", selected[cat]?.id === dish.id);
    btn.addEventListener("click", () => {
      const section = card.closest("section[data-category]");
      if (section && section.classList.contains("locked-section")) {
        return;
      }

      const same = selected[cat]?.id === dish.id;
      selected[cat] = same ? null : dish;

      saveSelectionToStorage(selected);
      updateOrder();
      highlightSelected(cat, same ? "" : (dish.keyword || String(dish.id)));
    });

    card.appendChild(img);
    card.appendChild(priceP);
    card.appendChild(nameP);
    card.appendChild(weightP);
    card.appendChild(btn);

    if (selected[cat]?.id === dish.id) {
      card.classList.add("selected-card");
    }

    return card;
  }

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

    let emptyNote = section.querySelector(".empty-note");
    if (!anyVisible) {
      if (!emptyNote) {
        emptyNote = document.createElement("p");
        emptyNote.classList.add("empty-note");
        emptyNote.textContent = "По выбранному фильтру нет позиций.";
        section.appendChild(emptyNote);
      }
    } else if (emptyNote) {
      emptyNote.remove();
    }
  }

  function updateOrder(skipHighlight) {
    let total = 0;
    let html = "";

    categories.forEach(cat => {
      const current = selected[cat];
      if (current) {
        total += Number(current.price) || 0;
        html += `<p><strong>${categoryLabels[cat]}:</strong> ${current.name} — ${current.price} ₽</p>`;
      } else {
        html += `<p><strong>${categoryLabels[cat]}:</strong> не выбрано</p>`;
      }
    });

    if (total > 0) {
      html += `<p><strong>Итого: ${total} ₽</strong></p>`;
    } else {
      html = "<p>Ничего не выбрано</p>";
    }

    if (orderBox) orderBox.innerHTML = html;
    if (orderTotalEl) orderTotalEl.textContent = `${total} ₽`;

    const hasAny = Object.values(selected).some(Boolean);
    if (checkoutPanel) {
      checkoutPanel.hidden = !hasAny;
    }

    const comboValid = isValidCombo(selected);
    if (checkoutLink) {
      checkoutLink.classList.toggle("disabled", !comboValid);
      checkoutLink.setAttribute("aria-disabled", String(!comboValid));
    }

    if (!skipHighlight) {
      categories.forEach(cat => {
        if (selected[cat]) {
          const keyword = selected[cat].keyword || String(selected[cat].id);
          highlightSelected(cat, keyword);
        } else {
          highlightSelected(cat, "");
        }
      });
    }

    if (typeof updateSectionStates === "function") {
      setTimeout(() => updateSectionStates(), 0);
    }
  }

  function highlightSelected(cat, keyword) {
    const sections = mainContainer.querySelectorAll("section[data-category]");
    const section = Array.from(sections).find(sec => sec.dataset.category === cat);
    if (!section) return;
    const cards = section.querySelectorAll(".dish");
    cards.forEach(c => {
      const isSelected = keyword && c.dataset.dish === keyword;
      c.classList.toggle("selected-card", isSelected);
      const btn = c.querySelector("button");
      if (btn) {
        btn.textContent = isSelected ? "В заказе" : "Добавить";
        btn.classList.toggle("selected-btn", isSelected);
      }
    });
  }

  function updateComboStatus() {
    if (!comboStatus) return;
    if (!activeCombo && !dessertAdded) {
      comboStatus.innerHTML = "<p>Комбо не выбрано</p>";
      return;
    }

    const baseCats = activeCombo
      ? Object.keys(JSON.parse(activeCombo.dataset.combo || "{}"))
          .filter(cat => cat !== "dessert" && JSON.parse(activeCombo.dataset.combo)[cat])
      : [];

    const totalCats = dessertAdded ? [...baseCats, "dessert"] : baseCats;
    const names = totalCats.map(cat => categoryLabels[cat] || cat);
    comboStatus.innerHTML = `<p>Собираем комбо: ${names.join(" + ")}</p>`;
  }

  function updateSectionStates() {
    const sections = mainContainer.querySelectorAll("section[data-category]");

    sections.forEach(section => {
      const sectionCategory = section.dataset.category;

      section.classList.remove("highlight-section", "locked-section");

      if (activeCombo) {
        if (allowedCategories.includes(sectionCategory)) {
          section.classList.add("highlight-section");
        } else if (!(sectionCategory === "dessert" && dessertAdded)) {
          section.classList.add("locked-section");
        }
      }
    });
  }
}

function createEmptySelection() {
  return { soup: null, main: null, salad: null, dessert: null, drink: null };
}

function loadSelectionFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveSelectionToStorage(current) {
  const ids = {};
  categories.forEach(cat => {
    ids[cat] = current[cat]?.id || null;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
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
  return combos.some(combo =>
    Object.keys(combo).every(cat => combo[cat] === selectedCombo[cat])
  );
}

document.addEventListener("dishesLoaded", renderMenu);

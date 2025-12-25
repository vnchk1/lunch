const STORAGE_KEY = "selectedDishes";

document.addEventListener("dishesLoaded", renderAll);
if (typeof dishes !== "undefined" && dishes.length > 0) renderAll();

function renderAll() {
  const categories = [...new Set(dishes.map(d => d.category))];
  const container = document.querySelector("#menu-root") || document.querySelector("main");
  const orderBox = document.querySelector("#order-box");
  const checkoutPanel = document.querySelector("#checkout-panel");
  const orderTotalEl = document.querySelector("#order-total");
  const checkoutLink = document.querySelector("#checkout-link");
  const selected = loadSelectedFromStorage();
  const inputs = {};
  const activeFilters = {};
  const sortedDishes = {};

  function normalizeCategory(cat) {
    const map = {
      "main-course": "main",
      "main": "main",
      "salad": "starter",
      "starter": "starter",
      "soup": "soup",
      "drink": "drink",
      "dessert": "dessert"
    };
    return map[cat] || cat;
  }

  const categoryMap = {
    "Суп": "soup",
    "Главное блюдо": "main",
    "Салат": "starter",
    "Напиток": "drink",
    "Десерт": "dessert",
    "soup": "soup",
    "main-course": "main",
    "main": "main",
    "salad": "starter",
    "starter": "starter",
    "drink": "drink",
    "dessert": "dessert"
  };

  let activeCombo = null;
  let dessertAdded = !!selected.dessert;
  let allowedCategories = dessertAdded ? ["dessert"] : [];

  categories.forEach(cat => {
    activeFilters[cat] = null;
    inputs[cat] = document.querySelector(`#${cat}Input`);
    sortedDishes[cat] = dishes
      .filter(d => d.category === cat)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  categories.forEach(cat => {
    const section = document.createElement("section");
    section.dataset.category = cat;
    section.dataset.categoryNormalized = normalizeCategory(cat);
    const titles = {
      starter: "Выберите закуску",
      soup: "Выберите суп",
      main: "Выберите главное блюдо",
      dessert: "Выберите десерт",
      drink: "Выберите напиток"
    };
    section.innerHTML = `<h2>${titles[cat] || cat}</h2>`;

    const kindsInCategory = [...new Set(sortedDishes[cat].map(d => d.kind))];
    if (kindsInCategory.length > 0) {
      const filters = document.createElement("div");
      filters.classList.add("filters");
      kindsInCategory.forEach(kind => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.classList.add("filter-btn");
        btn.dataset.filter = kind;
        btn.textContent = kind;
        if (kind === kindsInCategory[0]) btn.classList.add("active");
        btn.addEventListener("click", () => toggleFilter(cat, kind, btn));
        filters.appendChild(btn);
      });
      section.appendChild(filters);
    }

    const grid = document.createElement("div");
    grid.classList.add("menu-grid");
    section.appendChild(grid);

    container.appendChild(section);

    renderCards(cat);
  });

  const combos = document.querySelectorAll(".combo");
  const comboStatus = document.querySelector(".combo-status");
  const cancelBtn = document.querySelector(".cancel-combo-btn");
  
  // Инициализация состояния десерта при загрузке
  if (dessertAdded) {
    const dessertCombo = document.querySelector(".dessert-combo");
    if (dessertCombo) dessertCombo.classList.add("active-combo");
  }

  function renderCards(category) {
    const section = document.querySelector(`section[data-category="${category}"]`);
    if (!section) return;
    const grid = section.querySelector(".menu-grid");
    if (!grid) return;
    grid.innerHTML = "";
    let filtered = sortedDishes[category];
    const filter = activeFilters[category];
    if (filter) filtered = filtered.filter(d => d.kind === filter);
    if (filtered.length === 0) {
      const emptyNote = document.createElement("p");
      emptyNote.classList.add("empty-note");
      emptyNote.textContent = "По выбранному фильтру нет позиций.";
      grid.appendChild(emptyNote);
      updateOrder();
      return;
    }
    filtered.forEach(dish => {
      const card = document.createElement("div");
      card.classList.add("dish");
      card.dataset.dish = dish.keyword || String(dish.id);
      card.dataset.kind = dish.kind || "";
      const isSelected = selected[category]?.id === dish.id;
      
      const img = document.createElement("img");
      img.src = dish.image;
      img.alt = dish.name;
      
      const priceP = document.createElement("p");
      priceP.className = "price";
      priceP.textContent = `${dish.price} ₽`;
      
      const nameP = document.createElement("p");
      nameP.className = "name";
      nameP.textContent = dish.name;
      
      const weightP = document.createElement("p");
      weightP.className = "weight";
      weightP.textContent = dish.count || "";
      
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = isSelected ? "В заказе" : "Добавить";
      if (isSelected) {
        btn.classList.add("selected-btn");
        card.classList.add("selected-card");
      }
      
      btn.addEventListener("click", () => {
        if (isSelected) delete selected[category];
        else selected[category] = dish;
        saveSelectedToStorage(selected);
        renderCards(category);
        updateOrder();
      });
      
      card.appendChild(img);
      card.appendChild(priceP);
      card.appendChild(nameP);
      card.appendChild(weightP);
      card.appendChild(btn);
      grid.appendChild(card);
    });
    updateOrder();
  }

  function toggleFilter(category, kind, btn) {
    const current = activeFilters[category];
    const filters = btn.closest(".filters") || btn.parentElement;
    const buttons = filters.querySelectorAll(".filter-btn");
    buttons.forEach(b => b.classList.remove("active"));
    activeFilters[category] = current === kind ? null : kind;
    if (activeFilters[category]) btn.classList.add("active");
    renderCards(category);
  }

  function updateOrder() {
    let total = 0;
    let html = "";
    let empty = true;
    const categoryLabels = {
      starter: "Салат",
      soup: "Суп",
      main: "Главное блюдо",
      dessert: "Десерт",
      drink: "Напиток"
    };
    
    // Используем все категории из selected, а не только из categories
    const allCategories = [...new Set([...categories, ...Object.keys(selected)])];
    
    for (let cat of allCategories) {
      const normalized = normalizeCategory(cat);
      const label = categoryLabels[normalized] || categoryLabels[cat] || cat;
      
      if (selected[cat]) {
        empty = false;
        html += `<p><strong>${label}:</strong> ${selected[cat].name} — ${selected[cat].price} ₽</p>`;
        total += selected[cat].price;
      } else if (categories.includes(cat)) {
        html += `<p><strong>${label}:</strong> не выбрано</p>`;
      }
    }
    
    if (total > 0) {
      html += `<p><strong>Итого: ${total} ₽</strong></p>`;
    } else {
      html = "<p>Ничего не выбрано</p>";
    }
    
    if (orderBox) orderBox.innerHTML = html;
    if (orderTotalEl) orderTotalEl.textContent = `${total} ₽`;
    
    Object.entries(inputs).forEach(([key, input]) => {
      if (input) input.value = selected[key] ? selected[key].keyword : "";
    });
    updateCheckoutPanel(total, empty);
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
      for (let key in ids) {
        if (ids[key]) {
          const dish = dishes.find(d => d.id === ids[key]);
          if (dish) result[key] = dish;
        }
      }
      return result;
    } catch {
      return {};
    }
  }

  function updateCheckoutPanel(total, empty) {
    if (!checkoutPanel) return;
    
    const hasAny = Object.keys(selected).length > 0;
    checkoutPanel.hidden = !hasAny;
    
    if (orderTotalEl) orderTotalEl.textContent = `${total} ₽`;
    
    const valid = activeComboValid();
    if (checkoutLink) {
      checkoutLink.classList.toggle("disabled", !valid);
      checkoutLink.setAttribute("aria-disabled", String(!valid));
    }
  }

  combos.forEach(combo => {
    combo.addEventListener("click", () => {
      const comboData = JSON.parse(combo.dataset.combo || "{}");
      
      if (comboData.dessert) {
        dessertAdded = !dessertAdded;
        combo.classList.toggle("active-combo", dessertAdded);
        if (!dessertAdded) {
          delete selected.dessert;
          saveSelectedToStorage(selected);
        }
        updateStatusText();
        updateSectionStates();
        updateOrder();
        return;
      }

      if (activeCombo === combo) {
        activeCombo = null;
        combo.classList.remove("active-combo");
        if (cancelBtn) cancelBtn.style.display = "none";
        allowedCategories = dessertAdded ? ["dessert"] : [];
      } else {
        combos.forEach(c => {
          if (!c.classList.contains("dessert-combo")) {
            c.classList.remove("active-combo");
          }
        });
        activeCombo = combo;
        combo.classList.add("active-combo");
        if (cancelBtn) cancelBtn.style.display = "inline-block";
        allowedCategories = [];
        if (comboData.soup) allowedCategories.push("soup");
        if (comboData.main) allowedCategories.push("main");
        if (comboData.salad) allowedCategories.push("starter"); // salad в комбо = starter в API
        if (comboData.drink) allowedCategories.push("drink");
        if (dessertAdded) allowedCategories.push("dessert");
      }

      updateStatusText();
      updateSectionStates();
      updateOrder();
    });
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (activeCombo) {
        activeCombo.classList.remove("active-combo");
        activeCombo = null;
      }
      cancelBtn.style.display = "none";
      allowedCategories = dessertAdded ? ["dessert"] : [];
      updateStatusText();
      updateSectionStates();
      updateOrder();
    });
  }

  function updateStatusText() {
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
    const names = {
      soup: "Суп",
      main: "Главное блюдо",
      salad: "Салат",
      drink: "Напиток",
      dessert: "Десерт"
    };
    const labels = totalCats.map(cat => names[cat] || cat);
    comboStatus.innerHTML = `<p>Собираем комбо: ${labels.join(" + ")}</p>`;
  }

  function activeComboValid() {
    if (!activeCombo) return false;
    const comboData = JSON.parse(activeCombo.dataset.combo || "{}");
    const requiredCats = [];
    if (comboData.soup) requiredCats.push("soup");
    if (comboData.main) requiredCats.push("main");
    if (comboData.salad) requiredCats.push("starter"); // salad в комбо = starter в API
    if (comboData.drink) requiredCats.push("drink");
    if (dessertAdded) requiredCats.push("dessert");
    
    const normalizedSelected = Object.keys(selected).map(k => normalizeCategory(k));
    return requiredCats.every(cat => normalizedSelected.includes(cat));
  }

  function updateSectionStates() {
    const sections = container.querySelectorAll("section[data-category]");
    sections.forEach(section => {
      const sectionCategory = section.dataset.category;
      section.classList.remove("highlight-section", "locked-section");
      
      if (activeCombo) {
        // Проверяем как напрямую, так и через normalizeCategory
        const normalizedCategory = normalizeCategory(sectionCategory);
        const isAllowed = allowedCategories.includes(sectionCategory) || 
                         allowedCategories.includes(normalizedCategory);
        
        if (isAllowed) {
          section.classList.add("highlight-section");
        } else if (!(sectionCategory === "dessert" && dessertAdded)) {
          section.classList.add("locked-section");
        }
      }
    });
  }

  updateOrder();
  updateStatusText();
  updateSectionStates();
}
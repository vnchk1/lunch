let dishes = [];

async function loadDishes() {
  const API_URL = "https://edu.std-900.ist.mospolytech.ru/labs/api/dishes";
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Ошибка при загрузке блюд: ${response.status}`);
    }

    const data = await response.json();

    // Приводим категории из API к используемым на странице
    const categoryMap = { "main-course": "main" };
    const dessertKindFallback = ["chocolate", "fruit", "cold"];

    dishes = data.map(dish => {
      const normalizedCategory = categoryMap[dish.category] || dish.category;
      // Подгоняем тип десертов под текущие фильтры, если из API пришли иные значения
      const normalizedKind =
        normalizedCategory === "dessert" && !dessertKindFallback.includes(dish.kind)
          ? "cold"
          : dish.kind;

      return {
        ...dish,
        category: normalizedCategory,
        kind: normalizedKind
      };
    });

    console.log("✅ Блюда успешно загружены:", dishes);

    // Сообщаем интерфейсу, что данные готовы
    if (typeof renderMenu === "function") {
      renderMenu();
    } else {
      document.dispatchEvent(new CustomEvent("dishesLoaded"));
    }
  } catch (error) {
    console.error("❌ Не удалось загрузить блюда:", error);
    // Даже при ошибке оповещаем, чтобы интерфейс показал пустое состояние
    document.dispatchEvent(new CustomEvent("dishesLoaded"));
  }
}

document.addEventListener("DOMContentLoaded", loadDishes);

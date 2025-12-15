let dishes = [];
const API_BASE = "https://edu.std-900.ist.mospolytech.ru/labs/api";
const API_KEY = "13e357d1-1f58-4491-91a5-427d5c6c0f59";  // Замените на ваш реальный ключ, например, "123e4567-e89b-12d3-a456-426655440000"

async function loadDishes() {
  const apiUrl = `${API_BASE}/dishes?api_key=${API_KEY}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Ошибка при загрузке блюд: ${response.status}`);
    }
    const data = await response.json();
    const categoryMap = { "main-course": "main" };
    const dessertKindFallback = ["chocolate", "fruit", "cold"];
    dishes = data.map(dish => {
      const normalizedCategory = categoryMap[dish.category] || dish.category;
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
    if (typeof renderMenu === "function") {
      renderMenu();
    } else {
      document.dispatchEvent(new CustomEvent("dishesLoaded"));
    }
  } catch (error) {
    console.error("❌ Не удалось загрузить блюда:", error);
    document.dispatchEvent(new CustomEvent("dishesLoaded"));
  }
}
document.addEventListener("DOMContentLoaded", loadDishes);